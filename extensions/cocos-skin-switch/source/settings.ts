import * as fs from 'fs-extra';
import * as path from 'path';
import { ExportOptions } from './types';

export interface SkinSwitchSettings {
    outputDir: string;
    excludePatterns: string[];
}

const DEFAULT_SETTINGS: SkinSwitchSettings = {
    outputDir: '',
    excludePatterns: [
        'db://assets/activity/**',
        'db://assets/common/**',
    ],
};

function getSettingsPath(): string {
    return path.join(Editor.Project.path, 'settings', 'skin-switch.json');
}

export function readSettings(): SkinSwitchSettings {
    const settingsPath = getSettingsPath();
    if (!fs.existsSync(settingsPath)) {
        const defaults = {
            ...DEFAULT_SETTINGS,
            outputDir: path.join(Editor.Project.path, 'skin-export'),
        };
        return defaults;
    }
    const raw = fs.readJsonSync(settingsPath) as Partial<SkinSwitchSettings>;
    return {
        outputDir: raw.outputDir || path.join(Editor.Project.path, 'skin-export'),
        excludePatterns: raw.excludePatterns || DEFAULT_SETTINGS.excludePatterns,
    };
}

export function saveSettings(settings: SkinSwitchSettings): void {
    const settingsPath = getSettingsPath();
    fs.ensureDirSync(path.dirname(settingsPath));
    fs.writeJsonSync(settingsPath, settings, { spaces: 2 });
}

export function toExportOptions(settings?: SkinSwitchSettings): ExportOptions {
    const current = settings || readSettings();
    return {
        outputDir: current.outputDir,
        excludePatterns: current.excludePatterns,
    };
}
