import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { SkinImporter } from '../../export/skin-importer';
import { openFolderInExplorer } from '../../utils/open-folder';

const skinImporter = new SkinImporter();

module.exports = Editor.Panel.define({
    listeners: {
        show() {},
        hide() {},
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        outputDir: '#outputDir',
        excludePatterns: '#excludePatterns',
        exportBtn: '#exportBtn',
        importBtn: '#importBtn',
        openFolderBtn: '#openFolderBtn',
        statusLabel: '#statusLabel',
        logArea: '#logArea',
    },
    ready() {
        this.loadSettings();
        this.bindEvents();
    },
    methods: {
        async loadSettings() {
            const settings = await Editor.Message.request('skin-switch', 'get-settings');
            if (this.$.outputDir) {
                (this.$.outputDir as HTMLInputElement).value = settings.outputDir || '';
            }
            if (this.$.excludePatterns) {
                const patterns = (settings.excludePatterns || []).join('\n');
                (this.$.excludePatterns as HTMLTextAreaElement).value = patterns;
            }
        },
        bindEvents() {
            if (this.$.exportBtn) {
                this.$.exportBtn.addEventListener('confirm', () => {
                    this.onExport();
                });
            }
            if (this.$.importBtn) {
                this.$.importBtn.addEventListener('confirm', () => {
                    this.onImport();
                });
            }
            if (this.$.openFolderBtn) {
                this.$.openFolderBtn.addEventListener('confirm', () => {
                    this.onOpenFolder();
                });
            }
        },
        setStatus(text: string) {
            if (this.$.statusLabel) {
                (this.$.statusLabel as any).value = text;
            }
        },
        appendLog(text: string) {
            if (this.$.logArea) {
                this.$.logArea.textContent = text;
            }
        },
        getFormValues() {
            const outputDir = this.$.outputDir
                ? (this.$.outputDir as HTMLInputElement).value.trim()
                : '';
            const excludeRaw = this.$.excludePatterns
                ? (this.$.excludePatterns as HTMLTextAreaElement).value
                : '';
            const excludePatterns = excludeRaw
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0);
            return { outputDir, excludePatterns };
        },
        async onExport() {
            const form = this.getFormValues();
            this.setStatus('正在导出...');
            this.appendLog('开始扫描并导出资源...\n');

            await Editor.Message.request('skin-switch', 'save-settings', form);

            try {
                const result = await Editor.Message.request('skin-switch', 'export-assets', form);
                if (result.success && result.manifest) {
                    const stats = result.manifest.stats;
                    const logText = [
                        result.message,
                        '',
                        `输出目录: ${result.outputDir}`,
                        `图片: ${stats.imageCount}`,
                        `Spine 组: ${stats.spineGroupCount}`,
                        `Spine 文件: ${stats.spineFileCount}`,
                        `字体组: ${stats.fontGroupCount || 0}`,
                        `字体文件: ${stats.fontFileCount || 0}`,
                    ].join('\n');
                    this.setStatus('导出成功');
                    this.appendLog(logText);
                } else {
                    this.setStatus('导出失败');
                    this.appendLog(result.message || '未知错误');
                }
            } catch (err: any) {
                this.setStatus('导出失败');
                this.appendLog(err.message || String(err));
            }
        },
        async onImport() {
            const form = this.getFormValues();
            if (!form.outputDir) {
                this.setStatus('请先填写导出目录');
                this.appendLog('请先填写导出目录');
                return;
            }

            const confirm = await Editor.Dialog.warn('确认替换资源', {
                detail: `将把「${form.outputDir}」中的换肤资源写回项目 assets，并重新导入资源库。此操作会覆盖原文件，是否继续？`,
                buttons: ['替换', '取消'],
                default: 0,
                cancel: 1,
            });
            if (confirm.response !== 0) {
                this.setStatus('已取消');
                return;
            }

            this.setStatus('正在替换...');
            this.appendLog('开始将 export-ui 同步到 default，并写回项目资源...\n');

            await Editor.Message.request('skin-switch', 'save-settings', form);

            try {
                const result = await skinImporter.import({ outputDir: form.outputDir });
                const stats = result.stats;
                const failedItems = result.details.filter((item) => item.status === 'failed');
                const logLines = [
                    result.message,
                    '',
                    `输出目录: ${result.outputDir}`,
                    `export-ui 同步: ${stats.uiSynced || 0}`,
                    `成功: ${stats.replaced}`,
                    `跳过: ${stats.skipped}`,
                    `失败: ${stats.failed}`,
                    `重新导入: ${stats.reimported}`,
                ];
                if (failedItems.length > 0) {
                    logLines.push('', '失败列表:');
                    for (let i = 0; i < failedItems.length && i < 10; i += 1) {
                        const item = failedItems[i];
                        logLines.push(`- ${item.exportPath}: ${item.reason || '未知错误'}`);
                    }
                    if (failedItems.length > 10) {
                        logLines.push(`... 另有 ${failedItems.length - 10} 项`);
                    }
                }
                this.setStatus(result.success ? '替换成功' : '替换完成（有失败项）');
                this.appendLog(logLines.join('\n'));
            } catch (err: any) {
                this.setStatus('替换失败');
                this.appendLog(err.message || String(err));
            }
        },
        async onOpenFolder() {
            const form = this.getFormValues();
            if (!form.outputDir) {
                this.setStatus('请先填写导出目录');
                this.appendLog('请先填写导出目录');
                return;
            }

            try {
                const result = await openFolderInExplorer(form.outputDir);
                if (result.success) {
                    this.setStatus('已打开导出目录');
                    this.appendLog(`${result.message}\n${result.path}`);
                } else {
                    this.setStatus('打开目录失败');
                    this.appendLog(result.message || '打开目录失败');
                }
            } catch (err: any) {
                this.setStatus('打开目录失败');
                this.appendLog(err.message || String(err));
            }
        },
    },
});
