import * as fs from 'fs-extra';
import * as path from 'path';
import {
    normalizeManifestExportPaths,
    syncExportUiToDefault,
} from './export-ui-layout';
import { DEFAULT_DIR, EXPORT_UI_DIR, MANIFEST_FILE } from './path-constants';
import { ExportAssetEntry, ExportManifest, ImportFileDetail, ImportOptions, ImportResult } from '../types';

export class SkinImporter {
    public async import(options: ImportOptions = {}): Promise<ImportResult> {
        const outputDir = path.resolve(
            options.outputDir || path.join(Editor.Project.path, 'skin-export'),
        );
        const skipMissing = options.skipMissing !== false;
        const reimportAssets = options.reimportAssets !== false;
        const details: ImportFileDetail[] = [];
        const reimportUrls = new Set<string>();

        const manifestPath = path.join(outputDir, MANIFEST_FILE);
        if (!fs.existsSync(manifestPath)) {
            return {
                success: false,
                message: `未找到 manifest.json，请先导出资源或确认目录：${outputDir}`,
                outputDir,
                stats: { replaced: 0, skipped: 0, failed: 0, reimported: 0 },
                details,
            };
        }

        const ready = await Editor.Message.request('asset-db', 'query-ready');
        if (!ready) {
            return {
                success: false,
                message: '资源数据库未就绪，请稍后重试',
                outputDir,
                stats: { replaced: 0, skipped: 0, failed: 0, reimported: 0 },
                details,
            };
        }

        const manifest = await fs.readJson(manifestPath) as ExportManifest;
        normalizeManifestExportPaths(manifest);

        let uiSynced = 0;
        const exportUiRoot = path.join(outputDir, EXPORT_UI_DIR);
        if (fs.existsSync(exportUiRoot)) {
            const syncResult = await syncExportUiToDefault(outputDir);
            uiSynced = syncResult.synced;
        }

        const fontEntries = manifest.fonts || [];
        const entries = manifest.images.concat(manifest.spine).concat(fontEntries);

        for (const entry of entries) {
            const detail = await this.replaceEntry(outputDir, entry, skipMissing);
            details.push(detail);
            if (detail.status === 'replaced' && entry.url) {
                reimportUrls.add(entry.url);
            }
        }

        const scannedDetails = await this.replaceScannedFiles(outputDir, entries, skipMissing);
        for (const detail of scannedDetails) {
            details.push(detail);
            if (detail.status === 'replaced' && detail.url) {
                reimportUrls.add(detail.url);
            }
        }

        let reimported = 0;
        if (reimportAssets) {
            reimported = await this.reimportAssets(Array.from(reimportUrls));
        }

        const stats = this.collectStats(details, reimported, uiSynced);
        const success = stats.failed === 0;
        const uiPart = uiSynced > 0 ? `，已从 ${EXPORT_UI_DIR} 同步 ${uiSynced} 个文件到 ${DEFAULT_DIR}` : '';

        return {
            success,
            message: success
                ? `替换完成：${stats.replaced} 个文件已写回，${stats.reimported} 个资源已重新导入${uiPart}`
                : `替换完成，但有 ${stats.failed} 个文件失败（成功 ${stats.replaced}，跳过 ${stats.skipped}）${uiPart}`,
            outputDir,
            stats,
            details,
        };
    }

    private async replaceEntry(
        outputDir: string,
        entry: ExportAssetEntry,
        skipMissing: boolean,
    ): Promise<ImportFileDetail> {
        const exportFile = path.join(outputDir, entry.exportPath);
        const targetFile = this.resolveTargetFile(entry);

        if (!targetFile) {
            return {
                exportPath: entry.exportPath,
                targetFile: entry.sourceFile || '',
                url: entry.url,
                status: 'failed',
                reason: '无法解析目标路径',
            };
        }

        if (!fs.existsSync(exportFile)) {
            if (skipMissing) {
                return {
                    exportPath: entry.exportPath,
                    targetFile,
                    url: entry.url,
                    status: 'skipped',
                    reason: '导出包中缺少该文件',
                };
            }
            return {
                exportPath: entry.exportPath,
                targetFile,
                url: entry.url,
                status: 'failed',
                reason: '导出包中缺少该文件',
            };
        }

        try {
            await fs.ensureDir(path.dirname(targetFile));
            await fs.copy(exportFile, targetFile, { overwrite: true });
            return {
                exportPath: entry.exportPath,
                targetFile,
                url: entry.url,
                status: 'replaced',
            };
        } catch (err: any) {
            return {
                exportPath: entry.exportPath,
                targetFile,
                url: entry.url,
                status: 'failed',
                reason: err.message || '复制失败',
            };
        }
    }

    /**
     * 扫描 images/、spine/ 下新增文件（manifest 未记录时按相对路径写回 assets）
     */
    private async replaceScannedFiles(
        outputDir: string,
        manifestEntries: ExportAssetEntry[],
        skipMissing: boolean,
    ): Promise<ImportFileDetail[]> {
        const knownExportPaths = new Set<string>();
        for (const entry of manifestEntries) {
            knownExportPaths.add(entry.exportPath.replace(/\\/g, '/'));
        }

        const details: ImportFileDetail[] = [];
        const scanRoots = [
            { folder: path.join(DEFAULT_DIR, 'images'), prefix: `${DEFAULT_DIR}/images/` },
            { folder: path.join(DEFAULT_DIR, 'spine'), prefix: `${DEFAULT_DIR}/spine/` },
            { folder: path.join(DEFAULT_DIR, 'fonts'), prefix: `${DEFAULT_DIR}/fonts/` },
        ];

        for (const scanRoot of scanRoots) {
            let folder = scanRoot.folder;
            let prefix = scanRoot.prefix;
            let rootPath = path.join(outputDir, folder);
            if (!fs.existsSync(rootPath)) {
                const legacyFolder = folder.replace(`${DEFAULT_DIR}/`, '');
                const legacyPath = path.join(outputDir, legacyFolder);
                if (fs.existsSync(legacyPath)) {
                    folder = legacyFolder;
                    prefix = `${legacyFolder}/`;
                    rootPath = legacyPath;
                }
            }
            if (!fs.existsSync(rootPath)) {
                continue;
            }

            const files = this.walkFiles(rootPath);
            for (const absoluteFile of files) {
                const relFromOutput = path.relative(outputDir, absoluteFile).replace(/\\/g, '/');
                if (knownExportPaths.has(relFromOutput)) {
                    continue;
                }

                const assetsRel = relFromOutput.slice(prefix.length);
                const targetFile = path.join(Editor.Project.path, 'assets', assetsRel);
                const url = `db://assets/${assetsRel}`;

                if (!fs.existsSync(absoluteFile)) {
                    continue;
                }

                if (!fs.existsSync(path.dirname(targetFile))) {
                    if (skipMissing) {
                        details.push({
                            exportPath: relFromOutput,
                            targetFile,
                            url,
                            status: 'skipped',
                            reason: '目标目录不存在',
                        });
                        continue;
                    }
                }

                try {
                    await fs.ensureDir(path.dirname(targetFile));
                    await fs.copy(absoluteFile, targetFile, { overwrite: true });
                    details.push({
                        exportPath: relFromOutput,
                        targetFile,
                        url,
                        status: 'replaced',
                    });
                } catch (err: any) {
                    details.push({
                        exportPath: relFromOutput,
                        targetFile,
                        url,
                        status: 'failed',
                        reason: err.message || '复制失败',
                    });
                }
            }
        }

        return details;
    }

    private walkFiles(dir: string): string[] {
        const result: string[] = [];
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                const subFiles = this.walkFiles(fullPath);
                for (const sub of subFiles) {
                    result.push(sub);
                }
            } else if (!item.endsWith('.meta')) {
                result.push(fullPath);
            }
        }
        return result;
    }

    private resolveTargetFile(entry: ExportAssetEntry): string {
        if (entry.url && entry.url.indexOf('db://assets/') === 0) {
            return this.urlToAssetPath(entry.url);
        }
        return entry.sourceFile || '';
    }

    private urlToAssetPath(url: string): string {
        const prefix = 'db://assets/';
        if (url.indexOf(prefix) !== 0) {
            return '';
        }
        const rel = url.slice(prefix.length);
        return path.join(Editor.Project.path, 'assets', rel);
    }

    private async reimportAssets(urls: string[]): Promise<number> {
        let count = 0;
        for (const url of urls) {
            try {
                await Editor.Message.request('asset-db', 'reimport-asset', url);
                count += 1;
            } catch (err) {
                console.warn(`[skin-switch] 重新导入失败: ${url}`, err);
            }
        }
        return count;
    }

    private collectStats(details: ImportFileDetail[], reimported: number, uiSynced: number) {
        let replaced = 0;
        let skipped = 0;
        let failed = 0;
        for (const detail of details) {
            if (detail.status === 'replaced') {
                replaced += 1;
            } else if (detail.status === 'skipped') {
                skipped += 1;
            } else if (detail.status === 'failed') {
                failed += 1;
            }
        }
        return { replaced, skipped, failed, reimported, uiSynced };
    }
}
