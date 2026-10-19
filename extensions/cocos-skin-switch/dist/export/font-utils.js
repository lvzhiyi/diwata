"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRUETYPE_FONT_IMPORTERS = exports.BITMAP_FONT_IMPORTER = exports.FONT_ATLAS_EXTENSIONS = exports.FONT_DATA_EXTENSIONS = void 0;
exports.isBitmapFontAsset = isBitmapFontAsset;
exports.isTruetypeFontAsset = isTruetypeFontAsset;
exports.isFontAsset = isFontAsset;
exports.collectFontDirectories = collectFontDirectories;
exports.isFontDirectoryFile = isFontDirectoryFile;
exports.parseAtlasNamesFromFnt = parseAtlasNamesFromFnt;
exports.getAtlasNamesFromMeta = getAtlasNamesFromMeta;
exports.collectFontAtlasFiles = collectFontAtlasFiles;
exports.isFontAtlasImage = isFontAtlasImage;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
exports.FONT_DATA_EXTENSIONS = ['.fnt', '.ttf', '.otf'];
exports.FONT_ATLAS_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
exports.BITMAP_FONT_IMPORTER = 'bitmap-font';
exports.TRUETYPE_FONT_IMPORTERS = ['ttf-font', 'otf-font'];
function isBitmapFontAsset(asset) {
    const ext = path.extname(asset.name).toLowerCase();
    if (ext === '.fnt') {
        return true;
    }
    return asset.importer === exports.BITMAP_FONT_IMPORTER;
}
function isTruetypeFontAsset(asset) {
    const ext = path.extname(asset.name).toLowerCase();
    if (ext === '.ttf' || ext === '.otf') {
        return true;
    }
    return exports.TRUETYPE_FONT_IMPORTERS.indexOf(asset.importer) !== -1;
}
function isFontAsset(asset) {
    return isBitmapFontAsset(asset) || isTruetypeFontAsset(asset);
}
function collectFontDirectories(fileAssets) {
    const fontDirs = new Set();
    for (const asset of fileAssets) {
        if (isFontAsset(asset)) {
            fontDirs.add(path.dirname(asset.file));
        }
    }
    return fontDirs;
}
function isFontDirectoryFile(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    if (exports.FONT_DATA_EXTENSIONS.indexOf(ext) !== -1) {
        return true;
    }
    return exports.FONT_ATLAS_EXTENSIONS.indexOf(ext) !== -1;
}
function parseAtlasNamesFromFnt(fntPath) {
    if (!fs.existsSync(fntPath)) {
        return [];
    }
    const content = fs.readFileSync(fntPath, 'utf-8');
    const names = [];
    const pageRegex = /file="([^"]+)"/g;
    let match = pageRegex.exec(content);
    while (match) {
        names.push(match[1]);
        match = pageRegex.exec(content);
    }
    return names;
}
function getAtlasNamesFromMeta(metaPath) {
    if (!fs.existsSync(metaPath)) {
        return [];
    }
    try {
        const meta = fs.readJsonSync(metaPath);
        const atlasName = meta.userData && meta.userData._fntConfig
            ? meta.userData._fntConfig.atlasName
            : '';
        if (atlasName) {
            return [atlasName];
        }
    }
    catch (_err) {
        return [];
    }
    return [];
}
function collectFontAtlasFiles(fontDirs, fileAssets) {
    const atlasFiles = new Set();
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
function isFontAtlasImage(filePath, fontDirs, fontAtlasFiles) {
    if (fontAtlasFiles.has(filePath)) {
        return true;
    }
    const dir = path.dirname(filePath);
    if (fontDirs.has(dir)) {
        const ext = path.extname(filePath).toLowerCase();
        return exports.FONT_ATLAS_EXTENSIONS.indexOf(ext) !== -1;
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9udC11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NvdXJjZS9leHBvcnQvZm9udC11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjQSw4Q0FNQztBQUVELGtEQU1DO0FBRUQsa0NBRUM7QUFFRCx3REFRQztBQUVELGtEQU1DO0FBRUQsd0RBYUM7QUFFRCxzREFvQkM7QUFFRCxzREFnQkM7QUFFRCw0Q0FVQztBQXJIRCw2Q0FBK0I7QUFDL0IsMkNBQTZCO0FBRWhCLFFBQUEsb0JBQW9CLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2hELFFBQUEscUJBQXFCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMzRCxRQUFBLG9CQUFvQixHQUFHLGFBQWEsQ0FBQztBQUNyQyxRQUFBLHVCQUF1QixHQUFHLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBUWhFLFNBQWdCLGlCQUFpQixDQUFDLEtBQWdCO0lBQzlDLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ25ELElBQUksR0FBRyxLQUFLLE1BQU0sRUFBRSxDQUFDO1FBQ2pCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQyxRQUFRLEtBQUssNEJBQW9CLENBQUM7QUFDbkQsQ0FBQztBQUVELFNBQWdCLG1CQUFtQixDQUFDLEtBQWdCO0lBQ2hELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ25ELElBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxFQUFF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VyxFQUFFLENBQUM7UUFDakQsT0FBTyw2QkFBcUIsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgY29uc3QgRk9OVF9EQVRBX0VYVEVOU0lPTlMgPSBbJy5mbnQnLCAnLnR0ZicsICcub3RmJ107XG5leHBvcnQgY29uc3QgRk9OVF9BVExBU19FWFRFTlNJT05TID0gWycucG5nJywgJy5qcGcnLCAnLmpwZWcnLCAnLndlYnAnXTtcbmV4cG9ydCBjb25zdCBCSVRNQVBfRk9OVF9JTVBPUlRFUiA9ICdiaXRtYXAtZm9udCc7XG5leHBvcnQgY29uc3QgVFJVRVRZUEVfRk9OVF9JTVBPUlRFUlMgPSBbJ3R0Zi1mb250JywgJ290Zi1mb250J107XG5cbmludGVyZmFjZSBBc3NldExpa2Uge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBmaWxlOiBzdHJpbmc7XG4gICAgaW1wb3J0ZXI6IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQml0bWFwRm9udEFzc2V0KGFzc2V0OiBBc3NldExpa2UpOiBib29sZWFuIHtcbiAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoYXNzZXQubmFtZSkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoZXh0ID09PSAnLmZudCcpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBhc3NldC5pbXBvcnRlciA9PT0gQklUTUFQX0ZPTlRfSU1QT1JURVI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1RydWV0eXBlRm9udEFzc2V0KGFzc2V0OiBBc3NldExpa2UpOiBib29sZWFuIHtcbiAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoYXNzZXQubmFtZSkudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoZXh0ID09PSAnLnR0ZicgfHwgZXh0ID09PSAnLm90ZicpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBUUlVFVFlQRV9GT05UX0lNUE9SVEVSUy5pbmRleE9mKGFzc2V0LmltcG9ydGVyKSAhPT0gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZvbnRBc3NldChhc3NldDogQXNzZXRMaWtlKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGlzQml0bWFwRm9udEFzc2V0KGFzc2V0KSB8fCBpc1RydWV0eXBlRm9udEFzc2V0KGFzc2V0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RGb250RGlyZWN0b3JpZXMoZmlsZUFzc2V0czogQXNzZXRMaWtlW10pOiBTZXQ8c3RyaW5nPiB7XG4gICAgY29uc3QgZm9udERpcnMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IGFzc2V0IG9mIGZpbGVBc3NldHMpIHtcbiAgICAgICAgaWYgKGlzRm9udEFzc2V0KGFzc2V0KSkge1xuICAgICAgICAgICAgZm9udERpcnMuYWRkKHBhdGguZGlybmFtZShhc3NldC5maWxlKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvbnREaXJzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNGb250RGlyZWN0b3J5RmlsZShmaWxlTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZXh0ID0gcGF0aC5leHRuYW1lKGZpbGVOYW1lKS50b0xvd2VyQ2FzZSgpO1xuICAgIGlmIChGT05UX0RBVEFfRVhURU5TSU9OUy5pbmRleE9mKGV4dCkgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gRk9OVF9BVExBU19FWFRFTlNJT05TLmluZGV4T2YoZXh0KSAhPT0gLTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUF0bGFzTmFtZXNGcm9tRm50KGZudFBhdGg6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZm50UGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZudFBhdGgsICd1dGYtOCcpO1xuICAgIGNvbnN0IG5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICAgIGNvbnN0IHBhZ2VSZWdleCA9IC9maWxlPVwiKFteXCJdKylcIi9nO1xuICAgIGxldCBtYXRjaCA9IHBhZ2VSZWdleC5leGVjKGNvbnRlbnQpO1xuICAgIHdoaWxlIChtYXRjaCkge1xuICAgICAgICBuYW1lcy5wdXNoKG1hdGNoWzFdKTtcbiAgICAgICAgbWF0Y2ggPSBwYWdlUmVnZXguZXhlYyhjb250ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QXRsYXNOYW1lc0Zyb21NZXRhKG1ldGFQYXRoOiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKG1ldGFQYXRoKSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSBmcy5yZWFkSnNvblN5bmMobWV0YVBhdGgpIGFzIHtcbiAgICAgICAgICAgIHVzZXJEYXRhPzoge1xuICAgICAgICAgICAgICAgIF9mbnRDb25maWc/OiB7IGF0bGFzTmFtZT86IHN0cmluZyB9O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYXRsYXNOYW1lID0gbWV0YS51c2VyRGF0YSAmJiBtZXRhLnVzZXJEYXRhLl9mbnRDb25maWdcbiAgICAgICAgICAgID8gbWV0YS51c2VyRGF0YS5fZm50Q29uZmlnLmF0bGFzTmFtZVxuICAgICAgICAgICAgOiAnJztcbiAgICAgICAgaWYgKGF0bGFzTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIFthdGxhc05hbWVdO1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoX2Vycikge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHJldHVybiBbXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RGb250QXRsYXNGaWxlcyhmb250RGlyczogU2V0PHN0cmluZz4sIGZpbGVBc3NldHM6IEFzc2V0TGlrZVtdKTogU2V0PHN0cmluZz4ge1xuICAgIGNvbnN0IGF0bGFzRmlsZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICBmb3IgKGNvbnN0IGZvbnREaXIgb2YgZm9udERpcnMpIHtcbiAgICAgICAgY29uc3QgZGlyQXNzZXRzID0gZmlsZUFzc2V0cy5maWx0ZXIoKGl0ZW0pID0+IHBhdGguZGlybmFtZShpdGVtLmZpbGUpID09PSBmb250RGlyKTtcbiAgICAgICAgZm9yIChjb25zdCBhc3NldCBvZiBkaXJBc3NldHMpIHtcbiAgICAgICAgICAgIGlmICghaXNCaXRtYXBGb250QXNzZXQoYXNzZXQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBhdGxhc05hbWVzID0gZ2V0QXRsYXNOYW1lc0Zyb21NZXRhKGAke2Fzc2V0LmZpbGV9Lm1ldGFgKVxuICAgICAgICAgICAgICAgIC5jb25jYXQocGFyc2VBdGxhc05hbWVzRnJvbUZudChhc3NldC5maWxlKSk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGF0bGFzTmFtZSBvZiBhdGxhc05hbWVzKSB7XG4gICAgICAgICAgICAgICAgYXRsYXNGaWxlcy5hZGQocGF0aC5qb2luKGZvbnREaXIsIGF0bGFzTmFtZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhdGxhc0ZpbGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNGb250QXRsYXNJbWFnZShmaWxlUGF0aDogc3RyaW5nLCBmb250RGlyczogU2V0PHN0cmluZz4sIGZvbnRBdGxhc0ZpbGVzOiBTZXQ8c3RyaW5nPik6IGJvb2xlYW4ge1xuICAgIGlmIChmb250QXRsYXNGaWxlcy5oYXMoZmlsZVBhdGgpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjb25zdCBkaXIgPSBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpO1xuICAgIGlmIChmb250RGlycy5oYXMoZGlyKSkge1xuICAgICAgICBjb25zdCBleHQgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHJldHVybiBGT05UX0FUTEFTX0VYVEVOU0lPTlMuaW5kZXhPZihleHQpICE9PSAtMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuIl19