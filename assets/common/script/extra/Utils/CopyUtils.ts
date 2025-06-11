/**
 * H5复制功能工具类
 */
export class CopyUtils {
    /**
     * 检测浏览器类型
     */
    private static getBrowserType() {
        const ua = navigator.userAgent.toLowerCase();
        return {
            isChrome: /chrome|crios/.test(ua) && !/edge|opr\//.test(ua),
            isIOS: /iphone|ipad|ipod/.test(ua),
            isAndroid: /android/.test(ua),
            isWechat: /micromessenger/.test(ua),
        };
    }

    /**
     * 复制文本到剪贴板
     * @param text 要复制的文本
     * @returns Promise<boolean> 是否复制成功
     */
    public static async copyText(text: string): Promise<boolean> {
        if (typeof window === "undefined" || typeof document === "undefined") {
            return false;
        }

        const browser = this.getBrowserType();

        try {
            // 优先使用 Clipboard API
            if (navigator?.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            // iOS设备特殊处理
            if (browser.isIOS) {
                return await this.copyInIOS(text);
            }

            // Chrome和Android设备的处理
            if (browser.isChrome || browser.isAndroid) {
                return await this.copyInChrome(text);
            }

            // 其他浏览器的通用处理
            return await this.copyFallback(text);
        } catch (err) {
            console.warn("Copy failed:", err);
          	return await this.copyFallback(text);;
        }
    }

    /**
     * Chrome浏览器的复制实现
     */
    private static async copyInChrome(text: string): Promise<boolean> {
        const input = document.createElement("textarea");
        input.value = text;

        // Chrome优化的样式设置
        Object.assign(input.style, {
            position: "fixed",
            top: "-1000px",
            left: "-1000px",
            opacity: "0",
            zIndex: "-9999",
            background: "transparent",
            color: "transparent",
            padding: "0",
            border: "none",
            outline: "none",
            resize: "none",
            // 确保在Chrome下不会出现滚动条
            width: "1px",
            height: "1px",
        });

        document.body.appendChild(input);

        // 选择文本
        input.focus();
        input.select();

        try {
            // 执行复制命令
            const result = document.execCommand("copy");
            document.body.removeChild(input);
            return result;
        } catch (err) {
            document.body.removeChild(input);
            return false;
        }
    }

    /**
     * iOS设备的复制实现
     */
    private static async copyInIOS(text: string): Promise<boolean> {
        const editable = document.createElement("div");
        editable.contentEditable = "true";
        editable.setAttribute("readonly", "false");
        editable.innerHTML = text;

        Object.assign(editable.style, {
            position: "fixed",
            top: "0",
            left: "0",
            opacity: "0",
            contain: "strict",
            zIndex: "-9999",
            background: "transparent",
        });

        document.body.appendChild(editable);

        try {
            const range = document.createRange();
            range.selectNodeContents(editable);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

            // 移除了 setSelectionRange 调用，因为 div 不支持这个方法
            const result = document.execCommand("copy");

            // 清理
            document.body.removeChild(editable);
            selection?.removeAllRanges();

            return result;
        } catch (err) {
            document.body.removeChild(editable);
            return false;
        }
    }

    /**
     * 通用的降级复制实现
     */
    private static async copyFallback(text: string): Promise<boolean> {
        const input = document.createElement("textarea"); // 改用 textarea
        input.value = text;

        Object.assign(input.style, {
            position: "fixed",
            top: "0",
            left: "0",
            opacity: "0",
            padding: "0",
            border: "none",
            width: "2em",
            height: "2em",
        });

        document.body.appendChild(input);

        try {
            input.focus();
            input.select();

            // 这里可以安全使用 setSelectionRange，因为 textarea 支持这个方法
            input.setSelectionRange(0, input.value.length);

            const result = document.execCommand("copy");
            document.body.removeChild(input);
            return result;
        } catch (err) {
            document.body.removeChild(input);
            return false;
        }
    }

    /**
     * 检查是否支持复制功能
     */
    public static isSupported(): boolean {
        const browser = this.getBrowserType();
        return !!(
            typeof window !== "undefined" &&
            typeof document !== "undefined" &&
            ((navigator?.clipboard && browser.isChrome) || document.execCommand)
        );
    }
}
