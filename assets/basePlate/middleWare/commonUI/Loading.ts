import { _decorator, Component, tween } from 'cc';
const { ccclass } = _decorator;

@ccclass('Loading')
export class Loading extends Component {
    public isLoading = false;

    showLoading() {
        this.node.active = true;
        this.isLoading = true;

        const IconNode = this.node.getChildByName('Icon');
        const rotateTween = tween(IconNode);
        const rotate = tween(IconNode).by(3, { angle: -1440 });
        rotateTween.then(rotate).repeatForever(rotateTween).start();
    }

    hideLoading() {
        const IconNode = this.node.getChildByName('Icon');
        tween(IconNode).stop();
        this.node.active = false;
        this.isLoading = false;
    }
}

