// 挂载到需要动态缩放的节点上
import { _decorator, Component, Node, view } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AutoScale')
export class AutoScale extends Component {
    start() {
        const designWidth = 750; // 原设计宽度
        const designHeight = 1334; // 原设计高度
        const scaleFactor = Math.min(
            view.getVisibleSize().width / designWidth,
            view.getVisibleSize().height / designHeight
        );
        this.node.setScale(scaleFactor, scaleFactor);
    }
}