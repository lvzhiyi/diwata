import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ExportAssetEntry, ExportManifest } from '../types';
import {
    DEFAULT_CATEGORY_DIRS,
    DEFAULT_DIR,
    EXPORT_UI_CATEGORY_DIRS,
    EXPORT_UI_DIR,
    EXPORT_UI_MAP_FILE,
    SkinAssetType,
} from './path-constants';

export interface ExportUiMapEntry {
    exportUiPath: string;
    defaultPath: string;
    url: string;
    type: SkinAssetType;
    name: string;
}

export interface ExportUiMap {
    version: string;
    exportedAt: string;
    entries: ExportUiMapEntry[];
}

export function getDefaultCategoryPrefix(type: SkinAssetType): string {
    return `${DEFAULT_DIR}/${DEFAULT_CATEGORY_DIRS[type]}/`;
}

export function toDefaultExportPath(type: SkinAssetType, assetsRelPath: string): string {
    return `${getDefaultCategoryPrefix(type)}${assetsRelPath}`.replace(/\\/g, '/');
}

/**
 * 将 default 深层路径压缩为 export-ui 最多 2 级目录（大类/模块/文件名）
 */
export function buildExportUiRelativePath(type: SkinAssetType, defaultExportPath: string): string {
    const prefix = getDefaultCategoryPrefix(type);
    const rel = defaultExportPath.indexOf(prefix) === 0
        ? defaultExportPath.slice(prefix.length)
        : defaultExportPath;
    const parts = rel.split('/').filter((p) => p.length > 0);
    if (parts.length === 0) {
        return `${EXPORT_UI_CATEGORY_DIRS[type]}/misc/unknown`;
    }

    const fileName = parts[parts.length - 1];
    const group = resolveExportUiGroup(parts);
    return `${EXPORT_UI_CATEGORY_DIRS[type]}/${group}/${fileName}`;
}

export async function buildExportUiFromDefault(outputDir: string, manifest: ExportManifest): Promise<ExportUiMap> {
    const exportUiRoot = path.join(outputDir, EXPORT_UI_DIR);
    await fs.emptyDir(exportUiRoot);

    const allEntries = manifest.images
        .concat(manifest.spine)
        .concat(manifest.fonts || []);
    const mapEntries: ExportUiMapEntry[] = [];
    const usedUiPaths = new Set<string>();

    for (const entry of allEntries) {
        const type = entry.type as SkinAssetType;
        let exportUiRel = buildExportUiRelativePath(type, entry.exportPath);
        exportUiRel = ensureUniqueUiPath(exportUiRel, usedUiPaths, entry.exportPath);
        usedUiPaths.add(exportUiRel);

        const defaultFile = path.join(outputDir, entry.exportPath);
        const exportUiFile = path.join(exportUiRoot, exportUiRel);
        if (!fs.existsSync(defaultFile)) {
            continue;
        }

        await fs.ensureDir(path.dirname(exportUiFile));
        await fs.copy(defaultFile, exportUiFile, { overwrite: true });

        mapEntries.push({
            exportUiPath: exportUiRel.replace(/\\/g, '/'),
            defaultPath: entry.exportPath.replace(/\\/g, '/'),
            url: entry.url,
            type,
            name: entry.name,
        });

        entry.exportUiPath = exportUiRel.replace(/\\/g, '/');
    }

    const uiMap: ExportUiMap = {
        version: manifest.version,
        exportedAt: manifest.exportedAt,
        entries: mapEntries,
    };
    await fs.writeJson(path.join(outputDir, EXPORT_UI_MAP_FILE), uiMap, { spaces: 2 });
    return uiMap;
}

export async function syncExportUiToDefault(outputDir: string): Promise<{ synced: number; skipped: number }> {
    const exportUiRoot = path.join(outputDir, EXPORT_UI_DIR);
    if (!fs.existsSync(exportUiRoot)) {
        return { synced: 0, skipped: 0 };
    }

    const mapPath = path.join(outputDir, EXPORT_UI_MAP_FILE);
    let mapEntries: ExportUiMapEntry[] = [];
    if (fs.existsSync(mapPath)) {
        const uiMap = await fs.readJson(mapPath) as ExportUiMap;
        mapEntries = uiMap.entries || [];
    }

    let synced = 0;
    let skipped = 0;

    for (const item of mapEntries) {
        const exportUiFile = path.join(exportUiRoot, item.exportUiPath);
        const defaultFile = path.join(outputDir, item.defaultPath);
        if (!fs.existsSync(exportUiFile)) {
            skipped += 1;
            continue;
        }
        await fs.ensureDir(path.dirname(defaultFile));
        await fs.copy(exportUiFile, defaultFile, { overwrite: true });
        synced += 1;
    }

    const syncedPaths = new Set(mapEntries.map((e) => e.exportUiPath));
    const orphanSynced = await syncOrphanExportUiFiles(exportUiRoot, outputDir, syncedPaths);
    synced += orphanSynced;

    return { synced, skipped };
}

function resolveExportUiGroup(parts: string[]): string {
    if (parts.length <= 1) {
        return 'misc';
    }

    if (parts[0] === 'app-bundle' && parts.length >= 4) {
        return `${parts[2]}-${parts[3]}`;
    }
    if (parts[0] === 'app-appinit') {
        return 'app-appinit';
    }
    if (parts[0] === 'resources' && parts.length >= 2) {
        return `resources-${parts[1]}`;
    }
    if (parts.length >= 3) {
        return `${parts[0]}-${parts[1]}`;
    }
    return parts[0];
}

function ensureUniqueUiPath(exportUiRel: string, usedPaths: Set<string>, defaultPath: string): string {
    if (!usedPaths.has(exportUiRel)) {
        return exportUiRel;
    }
    const ext = path.extname(exportUiRel);
    const dir = path.dirname(exportUiRel);
    const base = path.basename(exportUiRel, ext);
    const hash = crypto.createHash('md5').update(defaultPath).digest('hex').slice(0, 6);
    const unique = `${dir}/${base}_${hash}${ext}`.replace(/\\/g, '/');
    if (!usedPaths.has(unique)) {
        return unique;
    }
    return `${dir}/${base}_${hash}_${usedPaths.size}${ext}`.replace(/\\/g, '/');
}

async function syncOrphanExportUiFiles(
    exportUiRoot: string,
    outputDir: string,
    knownUiPaths: Set<string>,
): Promise<number> {
    let count = 0;
    const categories = ['image', 'spine', 'font'] as const;
    const defaultPrefixMap = {
        image: 'images',
        spine: 'spine',
        font: 'fonts',
    };

    for (const category of categories) {
        const categoryDir = path.join(exportUiRoot, category);
        if (!fs.existsSync(categoryDir)) {
            continue;
        }
        const files = walkFiles(categoryDir);
        for (const file of files) {
            const exportUiRel = path.relative(exportUiRoot, file).replace(/\\/g, '/');
            if (knownUiPaths.has(exportUiRel)) {
                continue;
            }
            const relUnderCategory = exportUiRel.slice(category.length + 1);
            const defaultRel = `${DEFAULT_DIR}/${defaultPrefixMap[category]}/${relUnderCategory}`;
            const defaultFile = path.join(outputDir, defaultRel);
            await fs.ensureDir(path.dirname(defaultFile));
            await fs.copy(file, defaultFile, { overwrite: true });
            count += 1;
        }
    }
    return count;
}

function walkFiles(dir: string): string[] {
    const result: string[] = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const sub = walkFiles(fullPath);
            for (const s of sub) {
                result.push(s);
            }
        } else if (!item.endsWith('.meta')) {
            result.push(fullPath);
        }
    }
    return result;
}

export function resolveImportRootDir(outputDir: string): string {
    const defaultManifest = path.join(outputDir, DEFAULT_DIR, 'images');
    if (fs.existsSync(path.join(outputDir, DEFAULT_DIR))) {
        return outputDir;
    }
    return outputDir;
}

export function normalizeManifestExportPaths(manifest: ExportManifest): void {
    const lists = [manifest.images, manifest.spine, manifest.fonts || []];
    for (const list of lists) {
        for (const entry of list) {
            if (entry.exportPath.indexOf(`${DEFAULT_DIR}/`) === 0) {
                continue;
            }
            entry.exportPath = `${DEFAULT_DIR}/${entry.exportPath}`;
        }
    }
}
