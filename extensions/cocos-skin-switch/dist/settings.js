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
exports.readSettings = readSettings;
exports.saveSettings = saveSettings;
exports.toExportOptions = toExportOptions;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const DEFAULT_SETTINGS = {
    outputDir: '',
    excludePatterns: [
        'db://assets/activity/**',
        'db://assets/common/**',
    ],
};
function getSettingsPath() {
    return path.join(Editor.Project.path, 'settings', 'skin-switch.json');
}
function readSettings() {
    const settingsPath = getSettingsPath();
    if (!fs.existsSync(settingsPath)) {
        const defaults = Object.assign(Object.assign({}, DEFAULT_SETTINGS), { outputDir: path.join(Editor.Project.path, 'skin-export') });
        return defaults;
    }
    const raw = fs.readJsonSync(settingsPath);
    return {
        outputDir: raw.outputDir || path.join(Editor.Project.path, 'skin-export'),
        excludePatterns: raw.excludePatterns || DEFAULT_SETTINGS.excludePatterns,
    };
}
function saveSettings(settings) {
    const settingsPath = getSettingsPath();
    fs.ensureDirSync(path.dirname(settingsPath));
    fs.writeJsonSync(settingsPath, settings, { spaces: 2 });
}
function toExportOptions(settings) {
    const current = settings || readSettings();
    return {
        outputDir: current.outputDir,
        excludePatterns: current.excludePatterns,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zb3VyY2Uvc2V0dGluZ3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkEsb0NBY0M7QUFFRCxvQ0FJQztBQUVELDBDQU1DO0FBakRELDZDQUErQjtBQUMvQiwyQ0FBNkI7QUFRN0IsTUFBTSxnQkFBZ0IsR0FBdUI7SUFDekMsU0FBUyxFQUFFLEVBQUU7SUFDYixlQUFlLEVBQUU7UUFDYix5QkFBeUI7UUFDekIsdUJBQXVCO0tBQzFCO0NBQ0osQ0FBQztBQUVGLFNBQVMsZUFBZTtJQUNwQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixDQUFDLENBQUM7QUFDMUUsQ0FBQztBQUVELFNBQWdCLFlBQVk7SUFDeEIsTUFBTSxZQUFZLEdBQUcsZUFBZSxFQUFFLENBQUM7SUFDdkMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztRQUMvQixNQUFNLFFBQVEsbUNBQ1AsZ0JBQWdCLEtBQ25CLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxHQUMzRCxDQUFDO1FBQ0YsT0FBTyxRQUFRLENBQUM7SUFDcEIsQ0FBQztJQUNELE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFnQyxDQUFDO0lBQ3pFLE9BQU87UUFDSCxTQUFTLEVBQUUsR0FBRyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQztRQUN6RSxlQUFlLEVBQUUsR0FBRyxDQUFDLGVBQWUsSUFBSSxnQkFBZ0IsQ0FBQyxlQUFlO0tBQzNFLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBZ0IsWUFBWSxDQUFDLFFBQTRCO0lBQ3JELE1BQU0sWUFBWSxHQUFHLGVBQWUsRUFBRSxDQUFDO0lBQ3ZDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQzdDLEVBQUUsQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFFRCxTQUFnQixlQUFlLENBQUMsUUFBNkI7SUFDekQsTUFBTSxPQUFPLEdBQUcsUUFBUSxJQUFJLFlBQVksRUFBRSxDQUFDO0lBQzNDLE9BQU87UUFDSCxTQUFTLEVBQUUsT0FBTyxDQUFDLFNBQVM7UUFDNUIsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlO0tBQzNDLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEV4cG9ydE9wdGlvbnMgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGludGVyZmFjZSBTa2luU3dpdGNoU2V0dGluZ3Mge1xuICAgIG91dHB1dERpcjogc3RyaW5nO1xuICAgIGV4Y2x1ZGVQYXR0ZXJuczogc3RyaW5nW107XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNraW5Td2l0Y2hTZXR0aW5ncyA9IHtcbiAgICBvdXRwdXREaXI6ICcnLFxuICAgIGV4Y2x1ZGVQYXR0ZXJuczogW1xuICAgICAgICAnZGI6Ly9hc3NldHMvYWN0aXZpdHkvKionLFxuICAgICAgICAnZGI6Ly9hc3NldHMvY29tbW9uLyoqJyxcbiAgICBdLFxufTtcblxuZnVuY3Rpb24gZ2V0U2V0dGluZ3NQYXRoKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHBhdGguam9pbihFZGl0b3IuUHJvamVjdC5wYXRoLCAnc2V0dGluZ3MnLCAnc2tpbi1zd2l0Y2guanNvbicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVhZFNldHRpbmdzKCk6IFNraW5Td2l0Y2hTZXR0aW5ncyB7XG4gICAgY29uc3Qgc2V0dGluZ3NQYXRoID0gZ2V0U2V0dGluZ3NQYXRoKCk7XG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKHNldHRpbmdzUGF0aCkpIHtcbiAgICAgICAgY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgICAgICAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLFxuICAgICAgICAgICAgb3V0cHV0RGlyOiBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ3NraW4tZXhwb3J0JyksXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG4gICAgY29uc3QgcmF3ID0gZnMucmVhZEpzb25TeW5jKHNldHRpbmdzUGF0aCkgYXMgUGFydGlhbDxTa2luU3dpdGNoU2V0dGluZ3M+O1xuICAgIHJldHVybiB7XG4gICAgICAgIG91dHB1dERpcjogcmF3Lm91dHB1dERpciB8fCBwYXRoLmpvaW4oRWRpdG9yLlByb2plY3QucGF0aCwgJ3NraW4tZXhwb3J0JyksXG4gICAgICAgIGV4Y2x1ZGVQYXR0ZXJuczogcmF3LmV4Y2x1ZGVQYXR0ZXJucyB8fCBERUZBVUxUX1NFVFRJTkdTLmV4Y2x1ZGVQYXR0ZXJucyxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVNldHRpbmdzKHNldHRpbmdzOiBTa2luU3dpdGNoU2V0dGluZ3MpOiB2b2lkIHtcbiAgICBjb25zdCBzZXR0aW5nc1BhdGggPSBnZXRTZXR0aW5nc1BhdGgoKTtcbiAgICBmcy5lbnN1cmVEaXJTeW5jKHBhdGguZGlybmFtZShzZXR0aW5nc1BhdGgpKTtcbiAgICBmcy53cml0ZUpzb25TeW5jKHNldHRpbmdzUGF0aCwgc2V0dGluZ3MsIHsgc3BhY2VzOiAyIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9FeHBvcnRPcHRpb25zKHNldHRpbmdzPzogU2tpblN3aXRjaFNldHRpbmdzKTogRXhwb3J0T3B0aW9ucyB7XG4gICAgY29uc3QgY3VycmVudCA9IHNldHRpbmdzIHx8IHJlYWRTZXR0aW5ncygpO1xuICAgIHJldHVybiB7XG4gICAgICAgIG91dHB1dERpcjogY3VycmVudC5vdXRwdXREaXIsXG4gICAgICAgIGV4Y2x1ZGVQYXR0ZXJuczogY3VycmVudC5leGNsdWRlUGF0dGVybnMsXG4gICAgfTtcbn1cbiJdfQ==