export interface ExportAssetEntry {
    uuid: string;
    url: string;
    name: string;
    sourceFile: string;
    exportPath: string;
    /** export-ui 下的扁平路径，供 UI 团队换图 */
    exportUiPath?: string;
    type: 'image' | 'spine' | 'font';
}

export interface ExportManifest {
    version: string;
    exportedAt: string;
    project: string;
    outputDir: string;
    stats: {
        imageCount: number;
        spineGroupCount: number;
        spineFileCount: number;
        fontGroupCount: number;
        fontFileCount: number;
    };
    images: ExportAssetEntry[];
    spine: ExportAssetEntry[];
    fonts: ExportAssetEntry[];
}

export interface ExportOptions {
    outputDir?: string;
    excludePatterns?: string[];
}

export interface ExportResult {
    success: boolean;
    message: string;
    outputDir?: string;
    manifest?: ExportManifest;
}

export interface ImportOptions {
    outputDir?: string;
    /** 缺少对应导出文件时跳过，默认 true */
    skipMissing?: boolean;
    /** 替换后触发资源库重新导入，默认 true */
    reimportAssets?: boolean;
}

export interface ImportFileDetail {
    exportPath: string;
    targetFile: string;
    url: string;
    status: 'replaced' | 'skipped' | 'failed';
    reason?: string;
}

export interface ImportResult {
    success: boolean;
    message: string;
    outputDir?: string;
    stats: {
        replaced: number;
        skipped: number;
        failed: number;
        reimported: number;
        uiSynced?: number;
    };
    details: ImportFileDetail[];
}
