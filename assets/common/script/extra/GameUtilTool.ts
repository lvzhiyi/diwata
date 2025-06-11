import { _decorator, Component, director, Node, UITransform, Vec3, view } from 'cc';
import { ActivityUtils } from '../tools/ActivityUtils';
import { getViewportSize, isLargeScreenPhone, isSmallScreenPhone } from './Utils/common';
import { GlobalMgr } from './GlobalMgr';
const { ccclass, property } = _decorator;

@ccclass('GameUtilTool')
export class GameUtilTool {
    //获取移动结束的位置
    public static getMoveToPos(node?: Node): Vec3 {
        let moveToPos: Vec3 = new Vec3();
        let scale = 1;
        if (isSmallScreenPhone()) {
            scale = 0.8;
        } else if (isLargeScreenPhone()) {
            scale = 1.05;
        }
        moveToPos.x = -158 * scale;
        moveToPos.y = - 589 * scale;
        console.log("getMoveToPos", moveToPos);
        return moveToPos;
    }
    //获取卡牌位置
    public static getCardPos(node?: Node): Vec3 {
        let cardPos: Vec3 = new Vec3();
        let scale = 1;
        if (isSmallScreenPhone()) {
            scale = 0.8;
        } else if (isLargeScreenPhone()) {
            scale = 1.05;
        }
        cardPos.x = 320 * scale;
        cardPos.y = -420 * scale;
        console.log("getCardPos", cardPos);
        return cardPos;
    }

    //创建活动根节点
    public static createActivityRootNode(targetNode: Node): Node {
        const activityRootNode = new Node("ActivityRoot");
        const { width, height } = getViewportSize();
        console.log("portSize", width, height);
        const screenWidth = window.innerWidth;
        const scene = director.getScene();
        const canvas = scene.getChildByName('Canvas');
        const uiTransform = activityRootNode.addComponent(UITransform);
        if (canvas) {
            if (isLargeScreenPhone() == true) {
                if (screenWidth > 480) {
                    //获取page节点
                    const pageNode = canvas.getChildByName('Page');
                    if (pageNode) {
                        uiTransform.setContentSize(pageNode.getComponent(UITransform).width, pageNode.getComponent(UITransform).height);
                    }
                    console.log('####ipad');
                } else {
                    //获取当前项目设计尺寸
                    const designWidth = view.getDesignResolutionSize().width;
                    const designHeight = view.getDesignResolutionSize().height;
                    uiTransform.setContentSize(designWidth,designHeight);
                    console.log('####大iphone');
                }
                console.log('####1111');
            } else {
                const canvasTransform = canvas.getComponent(UITransform);
                uiTransform.setContentSize(canvasTransform.width, canvasTransform.height);
                console.log('####2222');
            }
            uiTransform.setAnchorPoint(0.5, 0.5);
        }else{
            console.log('####3333');
            uiTransform.setContentSize(width, height);
            uiTransform.setAnchorPoint(0.5, 0.5);
        }
        GlobalMgr.instance.rootNode = activityRootNode;
        activityRootNode.parent = targetNode.parent;
        return activityRootNode;
    }

    //在Xforge框架下用这个方法创建活动根节点
    public static createXforgeActivityRootNode(targetNode: Node): Node {
        const activityRootNode = new Node("ActivityRoot");
        const { width, height } = getViewportSize();
        console.log("portSize", width, height);
        const uiTransform = activityRootNode.addComponent(UITransform);
        uiTransform.setContentSize(width,height);
        GlobalMgr.instance.rootNode = activityRootNode;
        activityRootNode.parent = targetNode.parent;
        return activityRootNode;
    }
}

