import { exec } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface OpenFolderResult {
    success: boolean;
    message: string;
    path: string;
}

/**
 * 在系统文件管理器中打开目录。
 * 面板进程无法可靠使用 electron.shell，因此在扩展主进程调用。
 */
export async function openFolderInExplorer(folderPath: string): Promise<OpenFolderResult> {
    const resolvedPath = path.resolve(folderPath);

    if (!fs.existsSync(resolvedPath)) {
        await fs.ensureDir(resolvedPath);
    }

    const shellError = await tryElectronShell(resolvedPath);
    if (!shellError) {
        return { success: true, message: '已在文件管理器中打开', path: resolvedPath };
    }

    try {
        await openWithSystemCommand(resolvedPath);
        return { success: true, message: '已在文件管理器中打开', path: resolvedPath };
    } catch (err: any) {
        return {
            success: false,
            message: `打开目录失败: ${err.message || shellError}`,
            path: resolvedPath,
        };
    }
}

async function tryElectronShell(resolvedPath: string): Promise<string | null> {
    try {
        const electron = require('electron') as { shell?: { openPath: (p: string) => Promise<string> } };
        if (!electron.shell || !electron.shell.openPath) {
            return 'electron.shell 不可用';
        }
        const errorText = await electron.shell.openPath(resolvedPath);
        if (errorText) {
            return errorText;
        }
        return null;
    } catch (err: any) {
        return err.message || 'electron 模块不可用';
    }
}

function openWithSystemCommand(resolvedPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let command = '';
        if (process.platform === 'darwin') {
            command = `open "${resolvedPath}"`;
        } else if (process.platform === 'win32') {
            command = `explorer "${resolvedPath.replace(/\//g, '\\')}"`;
        } else {
            command = `xdg-open "${resolvedPath}"`;
        }

        exec(command, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
