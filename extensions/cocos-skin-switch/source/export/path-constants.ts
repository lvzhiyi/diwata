export const DEFAULT_DIR = 'default';
export const EXPORT_UI_DIR = 'export-ui';
export const EXPORT_UI_MAP_FILE = 'export-ui-map.json';
export const MANIFEST_FILE = 'manifest.json';

export const DEFAULT_CATEGORY_DIRS = {
    image: 'images',
    spine: 'spine',
    font: 'fonts',
} as const;

export const EXPORT_UI_CATEGORY_DIRS = {
    image: 'image',
    spine: 'spine',
    font: 'font',
} as const;

export type SkinAssetType = 'image' | 'spine' | 'font';
