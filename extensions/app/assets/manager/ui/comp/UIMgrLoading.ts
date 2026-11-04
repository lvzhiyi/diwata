import { Component, sp, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIMgrLoading')
export default class UIMgrLoading extends Component {
    @property(sp.Skeleton)
    private animation: sp.Skeleton = null;

    @property({ tooltip: '等待几秒后开始动画' })
    private delay = 0;

    private inited = false;

    init() {
        if (this.inited) return;
        this.inited = true;

        if (this.delay > 0) {
            this.scheduleOnce(this.play, this.delay);
        } else {
            this.play();
        }
    }

    clear() {
        this.inited = false;
        this.unschedule(this.play);
        this.animation.clearAnimation();
        this.animation.node.active = false;
    }

    private play() {
        this.animation.node.active = true;
        this.animation.setAnimation(0, 'loading', true);
    }
}
