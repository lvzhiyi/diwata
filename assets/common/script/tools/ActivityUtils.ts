import { assetManager, Camera, director, ImageAsset, SpriteFrame, Vec3, Node, view, sys } from "cc";

export class ActivityUtils {
    public static formatNumber(num: number): string {
        const dividedNum = num;

        // 将数字转为字符串并分割整数和小数部分
        const numStr = dividedNum.toString();
        const parts = numStr.split(".");
        const integerPart = parts[0];
        let decimalPart = parts[1] ? parts[1].slice(0, 3) : "";

        // 去掉小数部分末尾的0
        while (decimalPart && decimalPart.endsWith("0")) {
            decimalPart = decimalPart.slice(0, -1);
        }

        // 处理整数部分的千分位分隔
        const reversedIntegerPart = integerPart.split("").reverse().join("");
        let formattedIntegerPart = "";
        for (let i = 0; i < reversedIntegerPart.length; i++) {
            formattedIntegerPart += reversedIntegerPart[i];
            if ((i + 1) % 3 === 0 && i !== reversedIntegerPart.length - 1) {
                formattedIntegerPart += ",";
            }
        }
        const finalIntegerPart = formattedIntegerPart.split("").reverse().join("");

        // 如果小数部分为空，只返回整数部分
        return decimalPart ? `${finalIntegerPart}.${decimalPart}` : finalIntegerPart;
    }
    /**
     * 创建富文本BBCode
     * @param text 文本内容
     * @param fontSize 字体大小
     * @param isBold 是否加粗
     * @param color 颜色
     * @returns BBCode格式的富文本字符串
     */
    public static createRichTextHTML(
        text: string,
        fontSize: number,
        isBold: boolean,
        color: string
    ): string {
        let result = "";

        // 处理字体大小
        result += `<size=${fontSize}>`;

        // 处理颜色 (确保颜色值是不带#的十六进制)
        color = color.replace("#", "");
        result += `<color=${color}>`;

        // 处理加粗
        if (isBold) {
            text = `<b>${text}</b>`;
        }

        // 添加文本内容
        result += text;

        // 关闭标签 (注意关闭顺序与打开顺序相反)
        result += "</color>";
        result += "</size>";

        return result;
    }
    /**
     * 将日期字符串转换为指定格式
     * @param dateString 日期字符串
     * @returns 格式化后的日期时间字符串
     */
    public static convertDateTimeFormat(dateString: string): string {
        // 将输入的日期字符串转换为 Date 对象
        const date = new Date(dateString);

        // 格式化日期和时间
        const year = date.getFullYear();
        const month = ActivityUtils.addZero(date.getMonth() + 1);
        const day = ActivityUtils.addZero(date.getDate());
        const hours = ActivityUtils.addZero(date.getHours());
        const minutes = ActivityUtils.addZero(date.getMinutes());
        // 组合成最终的日期时间字符串
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    /**
     * 给个位数添加前导零
     * @param num 需要格式化的数字
     * @returns 格式化后的字符串
     */
    private static addZero(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }
    /**
     * 加载服务器图片
     * @param url 图片URL
     * @param success 成功回调函数
     * @param fail 失败回调函数
     */
    public static loadServerImage(
        url: string,
        success?: (spriteFrame: SpriteFrame) => void,
        fail?: (error: Error) => void
    ) {
        // Check if asset is already loaded
        if (!url) return;
        const asset = assetManager.assets.get(url);
        if (asset instanceof ImageAsset) {
            const spriteFrame = SpriteFrame.createWithImage(asset);
            if (spriteFrame) {
                success?.(spriteFrame);
            } else {
                fail?.(new Error("Failed to create sprite frame from cached asset"));
            }
            return;
        }

        assetManager.loadRemote<ImageAsset>(
            url,
            {
                ext: ".png", // 指定文件扩展名，提高加载效率
            },
            (err, imageAsset) => {
                if (err) {
                    console.error(`Failed to load image from ${url}:`, err);
                    fail?.(err);
                    return;
                }
                const spriteFrame = SpriteFrame.createWithImage(imageAsset);
                if (spriteFrame) {
                    success?.(spriteFrame);
                } else {
                    const error = new Error("Failed to create sprite frame from loaded asset");
                    console.error(error);
                    fail?.(error);
                }
            }
        );
    }

    /**
     * 秒转换指定格式 dd hh:mm:ss
     * @param seconds 秒
     * @param format 格式
     * @returns 格式化后的字符串
     */
    public static secondFormatDay(seconds: number, format: string = "dd hh:mm:ss", dayFormat: string = "Day"): string {
        if (seconds < 0) {
            return "00:00:00";
        }
        let day = Math.floor(seconds / 86400);
        let H = Math.floor((seconds % 86400) / 3600);
        let M = Math.floor((seconds % 3600) / 60);
        let S = seconds % 60;
        var map: { [key: string]: number } = {
            "d+": day, //天
            "h+": H, //小时
            "m+": M, //分
            "s+": S, //秒
        };
        
        // 处理小时格式
        if (new RegExp("h+").test(format)) {
            format = format.replace(new RegExp("h+"), H < 10 ? "0"+ H : H.toString());
        }
        
        // 处理其他时间单位
        for (var k in map) {
            
            const regExp = new RegExp("(" + k + ")");
            if (regExp.test(format)) {
                if (k === "d+" && day > 0) {
                    // 如果有天数，添加 dayFormat
                    format = format.replace(regExp, `${map[k]}${dayFormat}`);
                } else {
                    const value = map[k];
                    format = format.replace(regExp, value < 10 ? "0"+ value : value.toString());
                }
            }
        }
        return format;
    }

    /**
     * 获取节点在Canvas中的屏幕位置
     * @param node 需要获取位置的节点
     * @returns 节点在Canvas中的屏幕位置
     */
    public static getNodeScreenPosition(node: Node): Vec3 {
        // 获取 Canvas 节点
        const canvasNode = director.getScene().getChildByName("Canvas");

        if (!canvasNode) {
            console.error("Canvas not found in the scene.");
            return null;
        }

        // 获取子节点的世界坐标
        const worldPosition = node.getWorldPosition();

        // 将世界坐标转换为 Canvas 的本地坐标
        const localPosition = new Vec3();
        canvasNode.inverseTransformPoint(localPosition, worldPosition);

        console.log(`Node screen position: x=${localPosition.x}, y=${localPosition.y}`);
        return new Vec3(localPosition.x + 60, localPosition.y + 100, 0);
    }

   

    /**
 * 获取视口的宽高
 * @returns 视口的宽高
 */
    public static currentViewportSize = () => {
        const { width, height } = view.getDesignResolutionSize();
        let w = width;
        let h = height;

        if (w / h < window.innerWidth / window.innerHeight) {
            // 实际效果比canvas宽
            w = (h * window.innerWidth) / window.innerHeight;
        } else {
            // 实际效果比canvas高
            h = (w * window.innerHeight) / window.innerWidth;
        }
        return {
            width: w,
            height: h,
        };
    };
}
