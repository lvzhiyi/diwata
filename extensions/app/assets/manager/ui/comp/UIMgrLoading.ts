import { Component, Graphics, Size, UIOpacity, UITransform, _decorator, sp, Node } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UIMgrLoading')
@requireComponent(Graphics)
@requireComponent(UITransform)
export default class UIMgrLoading extends Component {
    @property({ tooltip: '动画的尺寸' })
    private size: Size = new Size(60, 60);

    @property({ tooltip: '等待几秒后开始动画' })
    private delay = 0;

		@property(Node)
		private spineNode: Node = null;


    init() {
			this.spineNode.active = true;
			this.playSymbolAnimation('loading', true);
    }

    clear() {
        // this.spineNode.active = false;
    }


    async playSymbolAnimation(animationName: string, loop: boolean = false) {

			return new Promise<void>(async (resolve) => {
				try {
					// 添加动画
					const skeleton = this.spineNode.getComponent(sp.Skeleton) || this.spineNode.addComponent(sp.Skeleton);
					skeleton.setAnimation(0, animationName, loop);
					skeleton.setCompleteListener(() => {
						resolve();
					});
				} catch (error) {
					console.error('loading 动画播放失败', error);
					resolve();
				}
			});
		}
}
