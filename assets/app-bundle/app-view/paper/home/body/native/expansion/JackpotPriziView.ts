import { _decorator, Component, Node } from 'cc';
import { PrizeBoxItem } from './PrizeBoxItem';
import { fetchJackpotInfo, JackpotInfoModel } from 'db://assets/basePlate/middleWare/services/user';
import { JackpotType } from 'db://assets/basePlate/middleWare/enums/jackpot';
import { app } from 'db://assets/app/app';
import { GameGlobalEvent, GameGlobalEventType } from 'db://assets/basePlate/middleWare/events/GameGlobalEvent';

const { ccclass, property } = _decorator;

@ccclass('JackpotPriziView')
export class JackpotPriziView extends Component {
  @property({ type: Node, tooltip: '奖池节点' })
  private itemsArray: Node[] = [];

  private itemsMap: Map<string, Node> = new Map();

  private amountMap: Map<string, number> = new Map();

  private  jackpotData: JackpotInfoModel[] = [];

  onLoad() {
    this.itemsArray.forEach((item) => {
      this.itemsMap.set(item.name, item);
    });
    this.updateJackpot(true);
    /// 监听投注金额变化
    app.manager.event.on('betCountChange', this.betCountChange, this);
  }

  start() {
   
  }

  update(deltaTime: number) {
        
  }

  /**
   * 投注金额变化
   * @param betCount 投注金额
   */
  betCountChange(betCount: number) {
    console.log('betCountChange', betCount);
    this.jackpotData.forEach(jackpot => {
      this.initLockStatusWithType(jackpot.type);
    });
  }

  private initLockStatusWithType(jackpotType: JackpotType) {
    let hiddenLock = false;
    const betCount = app.manager.global.betCount;

    switch (jackpotType) {
      case JackpotType.GRAND:
        hiddenLock = betCount > 1;
        break;
      case JackpotType.MAJOR:
        hiddenLock = betCount >= 1;
        break;
      case JackpotType.MINOR:
        hiddenLock = betCount >= 0.5;
        break;
      case JackpotType.MINI:
        hiddenLock = true;
        break;
    }

    var jackNodeName = this.transformJackpotTypeToNodeName(jackpotType);

    // 获取奖池节点
    const jackpotNode = this.itemsMap.get(jackNodeName);
    // 获取奖池节点下的金额节点
    const amountNode = jackpotNode.getComponent(PrizeBoxItem);

    if (amountNode) {
      // 设置金额节点
      amountNode.setLockStatus(!hiddenLock);
    }
  }

  /**
   * 初始化显示金额
   * @param jackpotType 奖池类型
   * @param amount 实际金额
   */
  private initializeDisplayAmount(jackpotType: JackpotType, amount: number) {
    let displayAmount = amount;

    if (!amount) {
      return;
    }

    switch (jackpotType) {
      case JackpotType.GRAND:
        displayAmount *= 0.9;
        break;
      case JackpotType.MAJOR:
        displayAmount *= 0.8;
      
        break;
      case JackpotType.MINOR:
        displayAmount *= 0.7;
     
        break;
      case JackpotType.MINI:
        displayAmount *= 0.5;
    
        break;
    }

    var jackNodeName = this.transformJackpotTypeToNodeName(jackpotType);

    // 获取奖池节点
    const jackpotNode = this.itemsMap.get(jackNodeName);
    // 获取奖池节点下的金额节点
    const amountNode = jackpotNode.getComponent(PrizeBoxItem);

    if (amountNode) {
      // 设置金额节点
      amountNode.initializeUI(displayAmount);
    }

    this.initLockStatusWithType(jackpotType);
  }

  /**
   * 将奖池类型转换为节点名称
   * @param jackpotType 奖池类型
   * @returns 节点名称
   */
  transformJackpotTypeToNodeName(jackpotType: JackpotType): string {
    switch (jackpotType) {
      case JackpotType.GRAND:
        return 'grand';
      case JackpotType.MAJOR:
        return 'major';
      case JackpotType.MINOR:
        return 'minor';
      case JackpotType.MINI:
        return 'mini';
    }
  }

  /**
   * 播放数字动效
   * @param targetAmount 目标金额
   * @param duration 动效持续时间
   */
  private playNumberAnimation(jackpotType: JackpotType, targetAmount: number, duration: number) {
    if (!targetAmount) {
      return;
    }

    var jackNodeName = this.transformJackpotTypeToNodeName(jackpotType);

    // 获取奖池节点
    const jackpotNode = this.itemsMap.get(jackNodeName);
  
    // 获取奖池节点下的金额节点
    const amountNode = jackpotNode.getComponent(PrizeBoxItem);

    if (amountNode) {
      // 设置金额节点
      amountNode.playNumberAnimation(targetAmount, duration);
    }
  }

  /**
   * 更新奖池信息并播放动效
   */
  private async updateJackpot(isFrist: boolean = false) {
    try {
      const response = await fetchJackpotInfo();
      const data: JackpotInfoModel[] = response.data;

      if (!data || data.length === 0) {
        console.warn('Jackpot data is empty.');
        this.initJackpotFailed();
      } else {
        this.jackpotData = data;
        this.processJackpotData(data, isFrist);
      }

      // 发送更新jackpot奖池信息事件
      GameGlobalEvent.instance.dispatchEvent(GameGlobalEventType.UPDATE_JACKPOT_INFO, data);

      // 10秒动效 + 5秒等待
      setTimeout(() => this.updateJackpot(false), isFrist ? 35000 : 15000);
    } catch (error) {
      this.initJackpotFailed();
      setTimeout(() => this.updateJackpot(false), isFrist ? 35000 : 15000);
    }
  }

  private processJackpotData(data: JackpotInfoModel[], isFrist: boolean = false) {
    data.forEach(jackpot => {
      const amount = jackpot.amount / app.manager.global.multiBetAmount;
      const type = jackpot.type ?? JackpotType.GRAND;
      
      const lastAmount = this.amountMap.get(type.toString());

      if (lastAmount !== amount) {
        this.initializeDisplayAmount(type, amount);
        this.amountMap.set(type.toString(), amount);
        this.scheduleAnimation(type, amount, isFrist);
      }
    });
  }

  private scheduleAnimation(type: number, amount: number, isFrist: boolean = false) {
    this.scheduleOnce(() => {
      this.playNumberAnimation(type, amount, isFrist ? 30 : 10);
    }, 1);
  }

  private initJackpotFailed() {
    const jackpots = [JackpotType.GRAND, JackpotType.MAJOR, JackpotType.MINOR, JackpotType.MINI];
    
    for (const jackpot of jackpots) {
      const amount = 0;
      this.initializeDisplayAmount(jackpot, amount);
    }
  }

  protected onDestroy(): void {
    app.manager.event.off('betCountChange', this.betCountChange, this);
  }
}
