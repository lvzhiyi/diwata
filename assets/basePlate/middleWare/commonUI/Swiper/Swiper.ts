import { _decorator, CCFloat, CCInteger, Component, Node, ScrollView, UITransform, v2, view } from 'cc';
import { Pagination } from './Pagination';
import { IntersectionObserver } from 'db://assets/res-native/script/IntersectionObserver';
import EventTrackManager from '../../serverManager/EventTrackManager';

const { ccclass, property } = _decorator;

@ccclass('Swiper')
export class Swiper extends Component {
    @property({ type: Node, tooltip: 'scrollView' })
    scrollView: Node = null;

    @property({ type: Node, tooltip: 'content' })
    content: Node = null;

    @property({ type: CCFloat, tooltip: '自动滚动时间' })
    duration: number = 1;

    @property({ type: CCInteger, tooltip: '提前加载的item数量' })
    slidesPerView: number = 1;

    @property({ type: Pagination, tooltip: 'pagination script' })
    paginationScript: Pagination = null;

    currentIndex: number = 0;

    itemWidth: number = 0;

    // 是否正在滚动到某个index
    isScrollingToIndex: boolean = false;

    timer: any = null;

    protected onLoad(): void {
      this.itemWidth = this.scrollView.getComponent(UITransform).width;

      this.node.getComponent(UITransform).width = this.itemWidth;

      // 配置 ScrollView 居中显示
      this.configScrollViewCentering();

      // 初始化item的可见性监听
      this.initIntersectionObservers();

      // 初始化事件
      this.initEventListeners();

      // 初始化分页器
      this.initPagination();
    }

    private initEventListeners(): void {
      // 监听滚动结束事件
      this.scrollView.on(ScrollView.EventType.SCROLL_ENDED, this.onScrollEnded, this);

      // 监听触摸开始事件
      this.scrollView.on(Node.EventType.TOUCH_START, this.onTouchStart, this);

      // 监听分辨率变化事件
      view.on('design-resolution-changed', this.onResize, this);
    }

    onResize() {
      if (this.timer) {
        return;
      }

      this.timer = setTimeout(() => {
        // 重新获取 ScrollView 的宽度，而不是视口宽度
        this.itemWidth = this.scrollView.getComponent(UITransform).width;
        
        // 更新当前节点的宽度
        this.node.getComponent(UITransform).width = this.itemWidth;
            
        // 预分配数组避免动态扩容
        const children = this.content.children;
        const length = children.length;
            
        for (let i = 0; i < length; i++) {
          const IntersectionObserverNode = children[i];
          IntersectionObserverNode.getComponent(UITransform).width = this.itemWidth;
        }

        // 重新配置居中
        this.configScrollViewCentering();
   
        this.timer = null;
      }, 100);
    }

    initPagination() {
      this.paginationScript.init(this.content.children.length, this.currentIndex);
    }

    // 配置 ScrollView 居中显示
    private configScrollViewCentering(): void {
      const scrollView = this.scrollView.getComponent(ScrollView);

      if (scrollView) {
        // 获取视口和内容的宽度
        const viewportWidth = this.scrollView.getComponent(UITransform).width;
        const contentWidth = this.content.getComponent(UITransform).width;
        
        if (contentWidth > viewportWidth) {
          // 如果内容宽度大于视口宽度，不需要居中
          // 重置内容位置
          this.content.setPosition(0, 0, 0);
        } else {
          // 计算左右边距使内容居中
          const margin = (viewportWidth - contentWidth) / 2;
          // 设置内容位置来实现居中
          this.content.setPosition(margin, 0, 0);
        }
      }
    }

    // 初始化item的可见性监听，距离可见区域this.itemWidth * this.slidesPerView的距离才渲染，离开这个距离移除
    private initIntersectionObservers() {
      const observerOptions = { rootMargin: this.itemWidth * this.slidesPerView };
    
      // 预分配数组避免动态扩容
      const children = this.content.children;
      const length = children.length;
        
      for (let i = 0; i < length; i++) {
        const IntersectionObserverNode = children[i];
        IntersectionObserverNode.getComponent(UITransform).width = this.itemWidth;
        const child = IntersectionObserverNode.children[0];
            
        // 先移除再添加更高效
        child.removeFromParent();
            
        const observer = IntersectionObserverNode.addComponent(IntersectionObserver);
        observer.observe(this.scrollView, observerOptions, (isIntersecting) => {
          if (isIntersecting && !child.parent) {
            IntersectionObserverNode.addChild(child);
          } else if (!isIntersecting && child.parent === IntersectionObserverNode) {
            IntersectionObserverNode.removeChild(child);
          }
        });
      }
    }

    private onScrollEnded() {
      // 如果正在滚动到某个index，则不进行计算
      if (this.isScrollingToIndex) return;

      const offset = this.scrollView.getComponent(ScrollView).getScrollOffset();
        
      // 计算实际移动的item索引
      const index = Math.abs(offset.x) / this.itemWidth;

      // 计算实际移动的item索引
      let integerIndex = Math.floor(index);

      if (index > this.currentIndex) {
        integerIndex = index % 1 > 0.3 ? integerIndex + 1 : integerIndex;
      } else {
        integerIndex = index % 1 < 0.7 ? integerIndex : integerIndex + 1;
      }

      this.scrollToIndex(integerIndex);
    }

    private onTouchStart() {
      this.isScrollingToIndex = false;
    }

    private scrollToIndex(index: number) {
      this.isScrollingToIndex = true;

      this.scrollView.getComponent(ScrollView).scrollToOffset(v2(index * this.itemWidth, 0), this.duration);

      this.scheduleOnce(() => {
        this.isScrollingToIndex = false;
      }, this.duration);

      this.currentIndex = index;

      this.paginationScript.setActive(index);
    }

    public clickPre() {
      if (this.currentIndex > 0) {
        this.scrollToIndex(this.currentIndex - 1);
      }

      EventTrackManager.inst.trackTutorialSwitch('left');
    }

    public clickNext() {
      if (this.currentIndex < this.content.children.length - 1) {
        this.scrollToIndex(this.currentIndex + 1);
      }

      EventTrackManager.inst.trackTutorialSwitch('right');
    }

    protected onDisable(): void {
      // 修复：移除正确的事件监听器
      this.scrollView.off(ScrollView.EventType.SCROLL_ENDED, this.onScrollEnded, this);
      this.scrollView.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
      view.off('design-resolution-changed', this.onResize, this);

      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
    }
}