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
exports.openFolderInExplorer = openFolderInExplorer;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
/**
 * 在系统文件管理器中打开目录。
 * 面板进程无法可靠使用 electron.shell，因此在扩展主进程调用。
 */
async function openFolderInExplorer(folderPath) {
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
    }
    catch (err) {
        return {
            success: false,
            message: `打开目录失败: ${err.message || shellError}`,
            path: resolvedPath,
        };
    }
}
async function tryElectronShell(resolvedPath) {
    try {
        const electron = require('electron');
        if (!electron.shell || !electron.shell.openPath) {
            return 'electron.shell 不可用';
        }
        const errorText = await electron.shell.openPath(resolvedPath);
        if (errorText) {
            return errorText;
        }
        return null;
    }
    catch (err) {
        return err.message || 'electron 模块不可用';
    }
}
function openWithSystemCommand(resolvedPath) {
    return new Promise((resolve, reject) => {
        let command = '';
        if (process.platform === 'darwin') {
            command = `open "${resolvedPath}"`;
        }
        else if (process.platform === 'win32') {
            command = `explorer "${resolvedPath.replace(/\//g, '\\')}"`;
        }
        else {
            command = `xdg-open "${resolvedPath}"`;
        }
        (0, child_process_1.exec)(command, (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3Blbi1mb2xkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvdXRpbHMvb3Blbi1mb2xkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjQSxvREFzQkM7QUFwQ0QsaURBQXFDO0FBQ3JDLDZDQUErQjtBQUMvQiwyQ0FBNkI7QUFRN0I7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLG9CQUFvQixDQUFDLFVBQWtCO0lBQ3pELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFOUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztRQUMvQixNQUFNLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDeEQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2QsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUM7SUFDeEUsQ0FBQztJQUVELElBQUksQ0FBQztRQUNELE1BQU0scUJBQXFCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDMUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLENBQUM7SUFDeEUsQ0FBQztJQUFDLE9BQU8sR0FBUSxFQUFFLENBQUM7UUFDaEIsT0FBTztZQUNILE9BQU8sRUFBRSxLQUFLO1lBQ2QsT0FBTyxFQUFFLFdBQVcsR0FBRyxDQUFDLE9BQU8sSUFBSSxVQUFVLEVBQUU7WUFDL0MsSUFBSSxFQUFFLFlBQVk7U0FDckIsQ0FBQztJQUNOLENBQUM7QUFDTCxDQUFDO0FBRUQsS0FBSyxVQUFVLGdCQUFnQixDQUFDLFlBQW9CO0lBQ2hELElBQUksQ0FBQztRQUNELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQTZELENBQUM7UUFDakcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQzlDLE9BQU8sb0JBQW9CLENBQUM7UUFDaEMsQ0FBQztRQUNELE1BQU0sU0FBUyxHQUFHLE1BQU0sUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDOUQsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNaLE9BQU8sU0FBUyxDQUFDO1FBQ3JCLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQUMsT0FBTyxHQUFRLEVBQUUsQ0FBQztRQUNoQixPQUFPLEdBQUcsQ0FBQyxPQUFPLElBQUksZ0JBQWdCLENBQUM7SUFDM0MsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLFlBQW9CO0lBQy9DLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDbkMsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUNoQyxPQUFPLEdBQUcsU0FBUyxZQUFZLEdBQUcsQ0FBQztRQUN2QyxDQUFDO2FBQU0sSUFBSSxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQ3RDLE9BQU8sR0FBRyxhQUFhLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDaEUsQ0FBQzthQUFNLENBQUM7WUFDSixPQUFPLEdBQUcsYUFBYSxZQUFZLEdBQUcsQ0FBQztRQUMzQyxDQUFDO1FBRUQsSUFBQSxvQkFBSSxFQUFDLE9BQU8sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3BCLElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNkLE9BQU87WUFDWCxDQUFDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGV4ZWMgfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3BlbkZvbGRlclJlc3VsdCB7XG4gICAgc3VjY2VzczogYm9vbGVhbjtcbiAgICBtZXNzYWdlOiBzdHJpbmc7XG4gICAgcGF0aDogc3RyaW5nO1xufVxuXG4vKipcbiAqIOWcqOezu+e7n+aWh+S7tueuoeeQhuWZqOS4reaJk+W8gOebruW9leOAglxuICog6Z2i5p2/6L+b56iL5peg5rOV5Y+v6Z2g5L2/55SoIGVsZWN0cm9uLnNoZWxs77yM5Zug5q2k5Zyo5omp5bGV5Li76L+b56iL6LCD55So44CCXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBvcGVuRm9sZGVySW5FeHBsb3Jlcihmb2xkZXJQYXRoOiBzdHJpbmcpOiBQcm9taXNlPE9wZW5Gb2xkZXJSZXN1bHQ+IHtcbiAgICBjb25zdCByZXNvbHZlZFBhdGggPSBwYXRoLnJlc29sdmUoZm9sZGVyUGF0aCk7XG5cbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMocmVzb2x2ZWRQYXRoKSkge1xuICAgICAgICBhd2FpdCBmcy5lbnN1cmVEaXIocmVzb2x2ZWRQYXRoKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaGVsbEVycm9yID0gYXdhaXQgdHJ5RWxlY3Ryb25TaGVsbChyZXNvbHZlZFBhdGgpO1xuICAgIGlmICghc2hlbGxFcnJvcikge1xuICAgICAgICByZXR1cm4geyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAn5bey5Zyo5paH5Lu2566h55CG5Zmo5Lit5omT5byAJywgcGF0aDogcmVzb2x2ZWRQYXRoIH07XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgb3BlbldpdGhTeXN0ZW1Db21tYW5kKHJlc29sdmVkUGF0aCk7XG4gICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICflt7LlnKjmlofku7bnrqHnkIblmajkuK3miZPlvIAnLCBwYXRoOiByZXNvbHZlZFBhdGggfTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiBg5omT5byA55uu5b2V5aSx6LSlOiAke2Vyci5tZXNzYWdlIHx8IHNoZWxsRXJyb3J9YCxcbiAgICAgICAgICAgIHBhdGg6IHJlc29sdmVkUGF0aCxcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRyeUVsZWN0cm9uU2hlbGwocmVzb2x2ZWRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBlbGVjdHJvbiA9IHJlcXVpcmUoJ2VsZWN0cm9uJykgYXMgeyBzaGVsbD86IHsgb3BlblBhdGg6IChwOiBzdHJpbmcpID0+IFByb21pc2U8c3RyaW5nPiB9IH07XG4gICAgICAgIGlmICghZWxlY3Ryb24uc2hlbGwgfHwgIWVsZWN0cm9uLnNoZWxsLm9wZW5QYXRoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ2VsZWN0cm9uLnNoZWxsIOS4jeWPr+eUqCc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXJyb3JUZXh0ID0gYXdhaXQgZWxlY3Ryb24uc2hlbGwub3BlblBhdGgocmVzb2x2ZWRQYXRoKTtcbiAgICAgICAgaWYgKGVycm9yVGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yVGV4dDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICByZXR1cm4gZXJyLm1lc3NhZ2UgfHwgJ2VsZWN0cm9uIOaooeWdl+S4jeWPr+eUqCc7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBvcGVuV2l0aFN5c3RlbUNvbW1hbmQocmVzb2x2ZWRQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBsZXQgY29tbWFuZCA9ICcnO1xuICAgICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgICAgICAgIGNvbW1hbmQgPSBgb3BlbiBcIiR7cmVzb2x2ZWRQYXRofVwiYDtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgICAgICBjb21tYW5kID0gYGV4cGxvcmVyIFwiJHtyZXNvbHZlZFBhdGgucmVwbGFjZSgvXFwvL2csICdcXFxcJyl9XCJgO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29tbWFuZCA9IGB4ZGctb3BlbiBcIiR7cmVzb2x2ZWRQYXRofVwiYDtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4ZWMoY29tbWFuZCwgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG4iXX0=