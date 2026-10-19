import * as fs from 'fs-extra';
import * as path from 'path';
import { buildExportUiFromDefault } from './export-ui-layout';
import {
    collectFontAtlasFiles,
    collectFontDirectories,
    isFontAtlasImage,
    isFontDirectoryFile,
} from './font-utils';
import { DEFAULT_DIR, EXPORT_UI_DIR, MANIFEST_FILE } from './path-constants';
import { ExportAssetEntry, ExportManifest, ExportOptions, ExportResult } from '../types';

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const SPINE_FILE_EXTENSIONS = ['.atlas', '.skel'];
const MANIFEST_VERSION = '1.2.0';

interface AssetRecord {
    name: string;
    url: string;
    uuid: string;
    file: string;
    importer: string;
    isDirectory: boolean;
}

export class SkinExporter {
    public async export(options: ExportOptions = {}): Promise<ExportResult> {
        const settings = options;
        const outputDir = settings.outputDir || path.join(Editor.Project.path, 'skin-export');
        const excludePatterns = settings.excludePatterns || [
            'db://assets/activity/**',
            'db://assets/common/**',
        ];

        await fs.ensureDir(outputDir);
        const defaultRoot = path.join(outputDir, DEFAULT_DIR);
        const imagesDir = path.join(defaultRoot, 'images');
        const spineDir = path.join(defaultRoot, 'spine');
        const fontsDir = path.join(defaultRoot, 'fonts');
        await fs.emptyDir(defaultRoot);
        await fs.ensureDir(imagesDir);
        await fs.ensureDir(spineDir);
        await fs.ensureDir(fontsDir);

        const ready = await Editor.Message.request('asset-db', 'query-ready');
        if (!ready) {
            return { success: false, message: '资源数据库未就绪，请稍后重试' };
        }

        const allAssets = await Editor.Message.request('asset-db', 'query-assets', {
            pattern: 'db://assets/**/*',
        }) as AssetRecord[];

        const fileAssets = allAssets.filter((asset) => {
            if (asset.isDirectory) {
                return false;
            }
            if (this.shouldExclude(asset.url, excludePatterns)) {
                return false;
            }
            return fs.existsSync(asset.file);
        });

        const spineSourceDirs = this.collectSpineDirectories(fileAssets);
        const fontSourceDirs = collectFontDirectories(fileAssets);
        const fontAtlasFiles = collectFontAtlasFiles(fontSourceDirs, fileAssets);
        const imageEntries: ExportAssetEntry[] = [];
        const spineEntries: ExportAssetEntry[] = [];
        const fontEntries: ExportAssetEntry[] = [];
        const spineGroupDirs = new Set<string>();
        const fontGroupDirs = new Set<string>();

        for (const sourceDir of spineSourceDirs) {
            const relDir = this.toAssetsRelativeDir(sourceDir);
            const targetDir = path.join(spineDir, relDir);
            await fs.ensureDir(targetDir);
            spineGroupDirs.add(relDir);

            const dirFiles = fs.readdirSync(sourceDir);
            for (const fileName of dirFiles) {
                if (fileName.endsWith('.meta')) {
                    continue;
                }
                if (!this.isSpineRelatedFile(fileName, sourceDir, fileAssets)) {
                    continue;
                }

                const sourceFile = path.join(sourceDir, fileName);
                const targetFile = path.join(targetDir, fileName);
                await fs.copy(sourceFile, targetFile, { overwrite: true });

                const matchedAsset = fileAssets.find((item) => item.file === sourceFile);
                spineEntries.push({
                    uuid: matchedAsset ? matchedAsset.uuid : '',
                    url: matchedAsset ? matchedAsset.url : `db://assets/${relDir}/${fileName}`,
                    name: fileName,
                    sourceFile,
                    exportPath: path.join(DEFAULT_DIR, 'spine', relDir, fileName).replace(/\\/g, '/'),
                    type: 'spine',
                });
            }
        }

        for (const sourceDir of fontSourceDirs) {
            const relDir = this.toAssetsRelativeDir(sourceDir);
            const targetDir = path.join(fontsDir, relDir);
            await fs.ensureDir(targetDir);
            fontGroupDirs.add(relDir);

            const dirFiles = fs.readdirSync(sourceDir);
            for (const fileName of dirFiles) {
                if (fileName.endsWith('.meta')) {
                    continue;
                }
                if (!isFontDirectoryFile(fileName)) {
                    continue;
                }

                const sourceFile = path.join(sourceDir, fileName);
                const targetFile = path.join(targetDir, fileName);
                await fs.copy(sourceFile, targetFile, { overwrite: true });

                const matchedAsset = fileAssets.find((item) => item.file === sourceFile);
                fontEntries.push({
                    uuid: matchedAsset ? matchedAsset.uuid : '',
                    url: matchedAsset ? matchedAsset.url : `db://assets/${relDir}/${fileName}`,
                    name: fileName,
                    sourceFile,
                    exportPath: path.join(DEFAULT_DIR, 'fonts', relDir, fileName).replace(/\\/g, '/'),
                    type: 'font',
                });
            }
        }

        for (const asset of fileAssets) {
            const ext = path.extname(asset.name).toLowerCase();
            if (IMAGE_EXTENSIONS.indexOf(ext) === -1) {
                continue;
            }
            if (asset.importer !== 'image') {
                continue;
            }

            const assetDir = path.dirname(asset.file);
            if (spineSourceDirs.has(assetDir)) {
                continue;
            }
            if (isFontAtlasImage(asset.file, fontSourceDirs, fontAtlasFiles)) {
                continue;
            }

            const relPath = this.toAssetsRelativePath(asset.file);
            const targetFile = path.join(imagesDir, relPath);
            await fs.ensureDir(path.dirname(targetFile));
            await fs.copy(asset.file, targetFile, { overwrite: true });

            imageEntries.push({
                uuid: asset.uuid,
                url: asset.url,
                name: asset.name,
                sourceFile: asset.file,
                exportPath: path.join(DEFAULT_DIR, 'images', relPath).replace(/\\/g, '/'),
                type: 'image',
            });
        }

        const manifest: ExportManifest = {
            version: MANIFEST_VERSION,
            exportedAt: new Date().toISOString(),
            project: Editor.Project.name,
            outputDir,
            stats: {
                imageCount: imageEntries.length,
                spineGroupCount: spineGroupDirs.size,
                spineFileCount: spineEntries.length,
                fontGroupCount: fontGroupDirs.size,
                fontFileCount: fontEntries.length,
            },
            images: imageEntries,
            spine: spineEntries,
            fonts: fontEntries,
        };

        await buildExportUiFromDefault(outputDir, manifest);

        const manifestPath = path.join(outputDir, MANIFEST_FILE);
        await fs.writeJson(manifestPath, manifest, { spaces: 2 });

        const readmePath = path.join(outputDir, 'README.md');
        await fs.writeFile(readmePath, this.buildReadme(manifest), 'utf-8');

        return {
            success: true,
            message: `导出完成：图片 ${manifest.stats.imageCount} 张，Spine ${manifest.stats.spineGroupCount} 组（${manifest.stats.spineFileCount} 个文件），字体 ${manifest.stats.fontGroupCount} 组（${manifest.stats.fontFileCount} 个文件）。UI 换图请使用 ${EXPORT_UI_DIR}/ 目录`,
            outputDir,
            manifest,
        };
    }

    private collectSpineDirectories(fileAssets: AssetRecord[]): Set<string> {
        const spineDirs = new Set<string>();
        for (const asset of fileAssets) {
            const ext = path.extname(asset.name).toLowerCase();
            if (ext === '.atlas' || ext === '.skel' || asset.importer === 'spine-data') {
                spineDirs.add(path.dirname(asset.file));
            }
        }
        return spineDirs;
    }

    private isSpineRelatedFile(fileName: string, sourceDir: string, fileAssets: AssetRecord[]): boolean {
        const ext = path.extname(fileName).toLowerCase();
        if (IMAGE_EXTENSIONS.indexOf(ext) !== -1) {
            return true;
        }
        if (SPINE_FILE_EXTENSIONS.indexOf(ext) !== -1) {
            return true;
        }
        if (ext !== '.json') {
            return false;
        }

        const sourceFile = path.join(sourceDir, fileName);
        const matched = fileAssets.find((item) => item.file === sourceFile);
        return matched ? matched.importer === 'spine-data' : false;
    }

    private shouldExclude(url: string, patterns: string[]): boolean {
        for (const pattern of patterns) {
            if (this.matchPattern(url, pattern)) {
                return true;
            }
        }
        return false;
    }

    private matchPattern(url: string, pattern: string): boolean {
        const normalizedPattern = pattern.replace(/\\/g, '/');
        const prefix = normalizedPattern.replace(/\*\*$/, '').replace(/\*$/, '');
        if (normalizedPattern.indexOf('**') !== -1) {
            return url.indexOf(prefix) === 0;
        }
        return url === normalizedPattern;
    }

    private toAssetsRelativePath(absolutePath: string): string {
        const assetsRoot = path.join(Editor.Project.path, 'assets');
        return path.relative(assetsRoot, absolutePath).replace(/\\/g, '/');
    }

    private toAssetsRelativeDir(absoluteDir: string): string {
        const assetsRoot = path.join(Editor.Project.path, 'assets');
        const rel = path.relative(assetsRoot, absoluteDir).replace(/\\/g, '/');
        return rel === '' ? '.' : rel;
    }

    private buildReadme(manifest: ExportManifest): string {
        return [
            '# 换肤资源导出包',
            '',
            `导出时间：${manifest.exportedAt}`,
            '',
            '## 目录结构',
            '',
            '### 给 UI 团队换图（推荐）',
            '',
            '- `export-ui/image/`：静态 UI 图片（扁平层级：模块/文件名）',
            '- `export-ui/spine/`：Spine 动效',
            '- `export-ui/font/`：字体与艺术字',
            '',
            '### 程序内部映射',
            '',
            '- `default/images/`、`default/spine/`、`default/fonts/`：与 assets 一致的完整路径',
            '- `export-ui-map.json`：export-ui 与 default 路径映射',
            '- `manifest.json`：写回项目用的资源清单',
            '',
            '## 统计',
            '',
            `- 图片：${manifest.stats.imageCount}`,
            `- Spine 组：${manifest.stats.spineGroupCount}`,
            `- Spine 文件：${manifest.stats.spineFileCount}`,
            `- 字体组：${manifest.stats.fontGroupCount}`,
            `- 字体文件：${manifest.stats.fontFileCount}`,
            '',
            '## 使用说明',
            '',
            '1. 将 `export-ui/` 中 image、spine、font 三类资源交给 UI 换图',
            '2. 换图后保持 export-ui 内文件名与模块文件夹不变',
            '3. 使用插件「替换资源」：自动将 export-ui 同步到 default 再写回项目',
            '',
        ].join('\n');
    }
}
