import * as fs from 'fs-extra';
import * as path from 'path';

export const FONT_DATA_EXTENSIONS = ['.fnt', '.ttf', '.otf'];
export const FONT_ATLAS_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
export const BITMAP_FONT_IMPORTER = 'bitmap-font';
export const TRUETYPE_FONT_IMPORTERS = ['ttf-font', 'otf-font'];

interface AssetLike {
    name: string;
    file: string;
    importer: string;
}

export function isBitmapFontAsset(asset: AssetLike): boolean {
    const ext = path.extname(asset.name).toLowerCase();
    if (ext === '.fnt') {
        return true;
    }
    return asset.importer === BITMAP_FONT_IMPORTER;
}

export function isTruetypeFontAsset(asset: AssetLike): boolean {
    const ext = path.extname(asset.name).toLowerCase();
    if (ext === '.ttf' || ext === '.otf') {
        return true;
    }
    return TRUETYPE_FONT_IMPORTERS.indexOf(asset.importer) !== -1;
}

export function isFontAsset(asset: AssetLike): boolean {
    return isBitmapFontAsset(asset) || isTruetypeFontAsset(asset);
}

export function collectFontDirectories(fileAssets: AssetLike[]): Set<string> {
    const fontDirs = new Set<string>();
    for (const asset of fileAssets) {
        if (isFontAsset(asset)) {
            fontDirs.add(path.dirname(asset.file));
        }
    }
    return fontDirs;
}

export function isFontDirectoryFile(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase();
    if (FONT_DATA_EXTENSIONS.indexOf(ext) !== -1) {
        return true;
    }
    return FONT_ATLAS_EXTENSIONS.indexOf(ext) !== -1;
}

export function parseAtlasNamesFromFnt(fntPath: string): string[] {
    if (!fs.existsSync(fntPath)) {
        return [];
    }
    const content = fs.readFileSync(fntPath, 'utf-8');
    const names: string[] = [];
    const pageRegex = /file="([^"]+)"/g;
    let match = pageRegex.exec(content);
    while (match) {
        names.push(match[1]);
        match = pageRegex.exec(content);
    }
    return names;
}

export function getAtlasNamesFromMeta(metaPath: string): string[] {
    if (!fs.existsSync(metaPath)) {
        return [];
    }
    try {
        const meta = fs.readJsonSync(metaPath) as {
            userData?: {
                _fntConfig?: { atlasName?: string };
            };
        };
        const atlasName = meta.userData && meta.userData._fntConfig
            ? meta.userData._fntConfig.atlasName
            : '';
        if (atlasName) {
            return [atlasName];
        }
    } catch (_err) {
        return [];
    }
    return [];
}

export function collectFontAtlasFiles(fontDirs: Set<string>, fileAssets: AssetLike[]): Set<string> {
    const atlasFiles = new Set<string>();
    for (const fontDir of fontDirs) {
        const dirAssets = fileAssets.filter((item) => path.dirname(item.file) === fontDir);
        for (const asset of dirAssets) {
            if (!isBitmapFontAsset(asset)) {
                continue;
            }
            const atlasNames = getAtlasNamesFromMeta(`${asset.file}.meta`)
                .concat(parseAtlasNamesFromFnt(asset.file));
            for (const atlasName of atlasNames) {
                atlasFiles.add(path.join(fontDir, atlasName));
            }
        }
    }
    return atlasFiles;
}

export function isFontAtlasImage(filePath: string, fontDirs: Set<string>, fontAtlasFiles: Set<string>): boolean {
    if (fontAtlasFiles.has(filePath)) {
        return true;
    }
    const dir = path.dirname(filePath);
    if (fontDirs.has(dir)) {
        const ext = path.extname(filePath).toLowerCase();
        return FONT_ATLAS_EXTENSIONS.indexOf(ext) !== -1;
    }
    return false;
}
