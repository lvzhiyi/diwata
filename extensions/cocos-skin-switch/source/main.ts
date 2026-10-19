import { SkinExporter } from './export/skin-exporter';
import { SkinImporter } from './export/skin-importer';
import { readSettings, saveSettings, toExportOptions } from './settings';
import { ExportOptions, ExportResult, ImportOptions, ImportResult } from './types';
import { openFolderInExplorer } from './utils/open-folder';

const exporter = new SkinExporter();
const importer = new SkinImporter();

export const methods: { [key: string]: (...args: any[]) => any } = {
    openPanel() {
        Editor.Panel.open('skin-switch');
    },

    async exportAssets(options?: ExportOptions): Promise<ExportResult> {
        const exportOptions = options && options.outputDir
            ? options
            : toExportOptions();
        const result = await exporter.export(exportOptions);
        if (result.success) {
            console.log(`[skin-switch] ${result.message}`);
            console.log(`[skin-switch] 输出目录: ${result.outputDir}`);
        } else {
            console.warn(`[skin-switch] ${result.message}`);
        }
        return result;
    },

    getSettings() {
        return readSettings();
    },

    saveSettings(settings: { outputDir: string; excludePatterns: string[] }) {
        saveSettings(settings);
        return { success: true };
    },

    async openOutputDir(options?: { outputDir?: string }) {
        const outputDir = (options && options.outputDir)
            ? options.outputDir
            : readSettings().outputDir;
        if (!outputDir) {
            return { success: false, message: '请先填写导出目录' };
        }
        return openFolderInExplorer(outputDir);
    },

    async importAssets(options?: ImportOptions): Promise<ImportResult> {
        const importOptions: ImportOptions = options && options.outputDir
            ? options
            : { outputDir: readSettings().outputDir };
        const result = await importer.import(importOptions);
        if (result.success) {
            console.log(`[skin-switch] ${result.message}`);
        } else {
            console.warn(`[skin-switch] ${result.message}`);
        }
        return result;
    },
};

export function load() {
    console.log('[skin-switch] 快速换肤扩展已加载');
}

export function unload() {
    console.log('[skin-switch] 快速换肤扩展已卸载');
}
