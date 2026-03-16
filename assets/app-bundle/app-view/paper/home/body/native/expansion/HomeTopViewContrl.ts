import { _decorator, Component, Label, Node } from 'cc';
import { app } from 'db://assets/app/app';
import { Marquee } from './Marquee';
import { getReward } from 'db://assets/basePlate/middleWare/services/user';
import { serverHookManager } from 'db://assets/basePlate/middleWare/serverManager/ServerHookManager';
import { getIsGap, getP } from 'db://assets/common/script/extra/Utils/common';

const { ccclass, property } = _decorator;

@ccclass('HomeTopViewContrl')
export class HomeTopViewContrl extends Component {
  // 声明设置
  @property({ type: Node, tooltip: '设置' })
  public setupbtn: Node;

  @property({ type: Node, tooltip: '跑马灯' })
  public Marquee: Node;

  // 初始化的相关逻辑写在这
  onLoad() {
   
  }

  start() {
    
  }
}
