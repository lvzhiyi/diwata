"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
exports.load = load;
exports.unload = unload;
const skin_exporter_1 = require("./export/skin-exporter");
const skin_importer_1 = require("./export/skin-importer");
const settings_1 = require("./settings");
const open_folder_1 = require("./utils/open-folder");
const exporter = new skin_exporter_1.SkinExporter();
const importer = new skin_importer_1.SkinImporter();
exports.methods = {
    openPanel() {
        Editor.Panel.open('skin-switch');
    },
    async exportAssets(options) {
        const exportOptions = options && options.outputDir
            ? options
            : (0, settings_1.toExportOptions)();
        const result = await exporter.export(exportOptions);
        if (result.success) {
            console.log(`[skin-switch] ${result.message}`);
            console.log(`[skin-switch] 输出目录: ${result.outputDir}`);
        }
        else {
            console.warn(`[skin-switch] ${result.message}`);
        }
        return result;
    },
    getSettings() {
        return (0, settings_1.readSettings)();
    },
    saveSettings(settings) {
        (0, settings_1.saveSettings)(settings);
        return { success: true };
    },
    async openOutputDir(options) {
        const outputDir = (options && options.outputDir)
            ? options.outputDir
            : (0, settings_1.readSettings)().outputDir;
        if (!outputDir) {
            return { success: false, message: '请先填写导出目录' };
        }
        return (0, open_folder_1.openFolderInExplorer)(outputDir);
    },
    async importAssets(options) {
        const importOptions = options && options.outputDir
            ? options
            : { outputDir: (0, settings_1.readSettings)().outputDir };
        const result = await importer.import(importOptions);
        if (result.success) {
            console.log(`[skin-switch] ${result.message}`);
        }
        else {
            console.warn(`[skin-switch] ${result.message}`);
        }
        return result;
    },
};
function load() {
    console.log('[skin-switch] 快速换肤扩展已加载');
}
function unload() {
    console.log('[skin-switch] 快速换肤扩展已卸载');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NvdXJjZS9tYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQTZEQSxvQkFFQztBQUVELHdCQUVDO0FBbkVELDBEQUFzRDtBQUN0RCwwREFBc0Q7QUFDdEQseUNBQXlFO0FBRXpFLHFEQUEyRDtBQUUzRCxNQUFNLFFBQVEsR0FBRyxJQUFJLDRCQUFZLEVBQUUsQ0FBQztBQUNwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLDRCQUFZLEVBQUUsQ0FBQztBQUV2QixRQUFBLE9BQU8sR0FBK0M7SUFDL0QsU0FBUztRQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxLQUFLLENBQUMsWUFBWSxDQUFDLE9BQXVCO1FBQ3RDLE1BQU0sYUFBYSxHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsU0FBUztZQUM5QyxDQUFDLENBQUMsT0FBTztZQUNULENBQUMsQ0FBQyxJQUFBLDBCQUFlLEdBQUUsQ0FBQztRQUN4QixNQUFNLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDcEQsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsTUFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDM0QsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLENBQUMsSUFBSSxDQUFDLGlCQUFpQixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNwRCxDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVELFdBQVc7UUFDUCxPQUFPLElBQUEsdUJBQVksR0FBRSxDQUFDO0lBQzFCLENBQUM7SUFFRCxZQUFZLENBQUMsUUFBMEQ7UUFDbkUsSUFBQSx1QkFBWSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZCLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBZ0M7UUFDaEQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLFNBQVMsQ0FBQztZQUM1QyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVM7WUFDbkIsQ0FBQyxDQUFDLElBQUEsdUJBQVksR0FBRSxDQUFDLFNBQVMsQ0FBQztRQUMvQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDYixPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUM7UUFDbkQsQ0FBQztRQUNELE9BQU8sSUFBQSxrQ0FBb0IsRUFBQyxTQUFTLENBQUMsQ0FBQztJQUMzQyxDQUFDO0lBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUF1QjtRQUN0QyxNQUFNLGFBQWEsR0FBa0IsT0FBTyxJQUFJLE9BQU8sQ0FBQyxTQUFTO1lBQzdELENBQUMsQ0FBQyxPQUFPO1lBQ1QsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUEsdUJBQVksR0FBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQzlDLE1BQU0sTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNwRCxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNuRCxDQUFDO2FBQU0sQ0FBQztZQUNKLE9BQU8sQ0FBQyxJQUFJLENBQUMsaUJBQWlCLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNsQixDQUFDO0NBQ0osQ0FBQztBQUVGLFNBQWdCLElBQUk7SUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFFRCxTQUFnQixNQUFNO0lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUMzQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2tpbkV4cG9ydGVyIH0gZnJvbSAnLi9leHBvcnQvc2tpbi1leHBvcnRlcic7XG5pbXBvcnQgeyBTa2luSW1wb3J0ZXIgfSBmcm9tICcuL2V4cG9ydC9za2luLWltcG9ydGVyJztcbmltcG9ydCB7IHJlYWRTZXR0aW5ncywgc2F2ZVNldHRpbmdzLCB0b0V4cG9ydE9wdGlvbnMgfSBmcm9tICcuL3NldHRpbmdzJztcbmltcG9ydCB7IEV4cG9ydE9wdGlvbnMsIEV4cG9ydFJlc3VsdCwgSW1wb3J0T3B0aW9ucywgSW1wb3J0UmVzdWx0IH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBvcGVuRm9sZGVySW5FeHBsb3JlciB9IGZyb20gJy4vdXRpbHMvb3Blbi1mb2xkZXInO1xuXG5jb25zdCBleHBvcnRlciA9IG5ldyBTa2luRXhwb3J0ZXIoKTtcbmNvbnN0IGltcG9ydGVyID0gbmV3IFNraW5JbXBvcnRlcigpO1xuXG5leHBvcnQgY29uc3QgbWV0aG9kczogeyBba2V5OiBzdHJpbmddOiAoLi4uYXJnczogYW55W10pID0+IGFueSB9ID0ge1xuICAgIG9wZW5QYW5lbCgpIHtcbiAgICAgICAgRWRpdG9yLlBhbmVsLm9wZW4oJ3NraW4tc3dpdGNoJyk7XG4gICAgfSxcblxuICAgIGFzeW5jIGV4cG9ydEFzc2V0cyhvcHRpb25zPzogRXhwb3J0T3B0aW9ucyk6IFByb21pc2U8RXhwb3J0UmVzdWx0PiB7XG4gICAgICAgIGNvbnN0IGV4cG9ydE9wdGlvbnMgPSBvcHRpb25zICYmIG9wdGlvbnMub3V0cHV0RGlyXG4gICAgICAgICAgICA/IG9wdGlvbnNcbiAgICAgICAgICAgIDogdG9FeHBvcnRPcHRpb25zKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGV4cG9ydGVyLmV4cG9ydChleHBvcnRPcHRpb25zKTtcbiAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW3NraW4tc3dpdGNoXSAke3Jlc3VsdC5tZXNzYWdlfWApO1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtza2luLXN3aXRjaF0g6L6T5Ye655uu5b2VOiAke3Jlc3VsdC5vdXRwdXREaXJ9YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtza2luLXN3aXRjaF0gJHtyZXN1bHQubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG5cbiAgICBnZXRTZXR0aW5ncygpIHtcbiAgICAgICAgcmV0dXJuIHJlYWRTZXR0aW5ncygpO1xuICAgIH0sXG5cbiAgICBzYXZlU2V0dGluZ3Moc2V0dGluZ3M6IHsgb3V0cHV0RGlyOiBzdHJpbmc7IGV4Y2x1ZGVQYXR0ZXJuczogc3RyaW5nW10gfSkge1xuICAgICAgICBzYXZlU2V0dGluZ3Moc2V0dGluZ3MpO1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlIH07XG4gICAgfSxcblxuICAgIGFzeW5jIG9wZW5PdXRwdXREaXIob3B0aW9ucz86IHsgb3V0cHV0RGlyPzogc3RyaW5nIH0pIHtcbiAgICAgICAgY29uc3Qgb3V0cHV0RGlyID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5vdXRwdXREaXIpXG4gICAgICAgICAgICA/IG9wdGlvbnMub3V0cHV0RGlyXG4gICAgICAgICAgICA6IHJlYWRTZXR0aW5ncygpLm91dHB1dERpcjtcbiAgICAgICAgaWYgKCFvdXRwdXREaXIpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiAn6K+35YWI5aGr5YaZ5a+85Ye655uu5b2VJyB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcGVuRm9sZGVySW5FeHBsb3JlcihvdXRwdXREaXIpO1xuICAgIH0sXG5cbiAgICBhc3luYyBpbXBvcnRBc3NldHMob3B0aW9ucz86IEltcG9ydE9wdGlvbnMpOiBQcm9taXNlPEltcG9ydFJlc3VsdD4ge1xuICAgICAgICBjb25zdCBpbXBvcnRPcHRpb25zOiBJbXBvcnRPcHRpb25zID0gb3B0aW9ucyAmJiBvcHRpb25zLm91dHB1dERpclxuICAgICAgICAgICAgPyBvcHRpb25zXG4gICAgICAgICAgICA6IHsgb3V0cHV0RGlyOiByZWFkU2V0dGluZ3MoKS5vdXRwdXREaXIgfTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaW1wb3J0ZXIuaW1wb3J0KGltcG9ydE9wdGlvbnMpO1xuICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBbc2tpbi1zd2l0Y2hdICR7cmVzdWx0Lm1lc3NhZ2V9YCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYFtza2luLXN3aXRjaF0gJHtyZXN1bHQubWVzc2FnZX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbG9hZCgpIHtcbiAgICBjb25zb2xlLmxvZygnW3NraW4tc3dpdGNoXSDlv6vpgJ/mjaLogqTmianlsZXlt7LliqDovb0nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHVubG9hZCgpIHtcbiAgICBjb25zb2xlLmxvZygnW3NraW4tc3dpdGNoXSDlv6vpgJ/mjaLogqTmianlsZXlt7Lljbjovb0nKTtcbn1cbiJdfQ==