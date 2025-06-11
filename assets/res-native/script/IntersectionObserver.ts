import { _decorator, Component, Node, UITransform } from 'cc';

const { ccclass, property } = _decorator;

interface IIntersectionObserverOptions {
    rootMargin: number;
}

@ccclass('IntersectionObserver')
export class IntersectionObserver extends Component {
    private _isIntersecting: boolean = false;

    private _currentIntersecting: boolean;

    private _callback: (value: boolean) => void;

    private _observeNodeArea: { left: number; right: number; top: number; bottom: number; };

    private _targetNodeArea: { left: number; right: number; top: number; bottom: number; };

    private _IIntersectionObserverOptions: IIntersectionObserverOptions;

    protected update(): void {
      this._observeNodeArea = this.getNodeArea(this.node);

      this._currentIntersecting = this.isIntersecting(this._observeNodeArea, this._targetNodeArea);

      if (this._currentIntersecting !== this._isIntersecting) {
        this._isIntersecting = this._currentIntersecting;
        this._callback(this._currentIntersecting);
      }
    }

    // 观察当前节点和目标节点是否交叉
    observe(targetNode: Node, { rootMargin = 0 }: IIntersectionObserverOptions = { rootMargin: 0 }, callback: (isIntersecting: boolean) => void) {
      this._targetNodeArea = this.getNodeArea(targetNode);
      this._IIntersectionObserverOptions = { rootMargin };
      this._callback = callback;
    }

    private getNodeArea(node: Node) {
      const { width, height } = node.getComponent(UITransform).contentSize;
      const { x, y } = node.getWorldPosition();
      const left = x - width / 2;
      const right = x + width / 2;
      const top = y + height / 2;
      const bottom = y - height / 2;

      return {
        left, right, top, bottom 
      };
    }

    isIntersecting(observeNodeArea: any, targetNodeArea: any): boolean {
      const { rootMargin } = this._IIntersectionObserverOptions;

      const {
        left: observeLeft, right: observeRight, top: observeTop, bottom: observeBottom 
      } = observeNodeArea;
      const {
        left: targetLeft, right: targetRight, top: targetTop, bottom: targetBottom 
      } = targetNodeArea;

      return (
        // 观察节点的右边缘在目标节点的左边缘之右
        observeRight >= targetLeft - rootMargin && 
        // 观察节点的左边缘在目标节点的右边缘之左
            observeLeft <= targetRight + rootMargin && 
            // 观察节点的下边缘在目标节点的上边缘之下
            observeBottom <= targetTop + rootMargin && 
            // 观察节点的上边缘在目标节点的下边缘之上
            observeTop >= targetBottom - rootMargin    
      );
    }
}
