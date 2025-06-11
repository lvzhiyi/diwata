import { _decorator, Node, Tween, tween } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { JackpotType } from 'db://assets/basePlate/middleWare/enums/jackpot';
import { getJackpotReward } from 'db://assets/basePlate/middleWare/services/bet';
import { app } from 'db://assets/app/app';
import { PopGrandPrize } from '../../grand-prize/native/PopGrandPrize';
import { calculateWithBase } from 'db://assets/common/script/extra/Utils/common';
import { RewardSubTypeEnum } from 'db://assets/basePlate/middleWare/enums/bet';

const { ccclass, property } = _decorator;

@ccclass('PopWheel')
export class PopWheel extends BaseView {
  @property(Node)
  private WheelNode: Node = null;

  private currentTween: Tween<Node> | null = null;

  private betRecordId: string = '';

  private gameRecordId: string = '';

  protected onLoad(): void {
    this.WheelNode.on(Node.EventType.TOUCH_END, () => {
      if (!this.currentTween) {
        this.onStartWheel();
      }
    }, this);
  }

  protected onShow(params: any) {
    const { betRecordId, gameRecordId } = params;
    this.betRecordId = betRecordId;
    this.gameRecordId = gameRecordId;

    // 5秒后自动开始
    setTimeout(() => {
      // 如果5秒后动画已经存在，则不自动开始
      if (this.currentTween) {
        return;
      }

      this.onStartWheel();
    }, 5000);
  }

  async onStartWheel() {
    // 先停止现有的补间动画
    if (this.currentTween) {
      this.currentTween.stop();
    }

    this.currentTween = tween(this.WheelNode)
      .by(1, { angle: -360 * 3 })
      .union()
      .repeatForever()
      .start();

    const jackpotReward = await getJackpotReward(this.betRecordId, this.gameRecordId);
    const { rewardPoolType, rewardAmount } = jackpotReward.data;

    setTimeout(() => {
      this.onStopWheel(rewardPoolType, rewardAmount);
    }, 5000);
  } 

  onStopWheel(type: JackpotType, amount: number) {
    if (!this.currentTween) return;

    this.currentTween.stop();

    const targetAngle = this.getAngleForJackpotType(type);
    const currentAngle = this.WheelNode.angle % 360;

    // 计算最短路径的角度差
    let diff = targetAngle - currentAngle;
    if (diff > 0) diff -= 360;

    tween(this.WheelNode)
      .by(2 + diff / (-360 * 3), { angle: diff + ( -360 * 2) }, { easing: (t: number) => 2 * t - t * t })
      .call(() => {
        // 精确停在目标位置
        this.WheelNode.angle = targetAngle;
        this.currentTween = null;

        // 设置本次获得的jackpot中奖金额
        app.controller.home.setJackpotAmount(amount);

        const rewardSubTypeMap = {
          [JackpotType.MINI]: RewardSubTypeEnum.NICE,
          [JackpotType.MINOR]: RewardSubTypeEnum.MEGA,
          [JackpotType.MAJOR]: RewardSubTypeEnum.SUPER,
          [JackpotType.GRAND]: RewardSubTypeEnum.SENSATIONAL,
          [JackpotType.BET_BONUS]: RewardSubTypeEnum.OTHER,
        };

        app.manager.ui.show<PopGrandPrize>({
          name: 'PopGrandPrize',
          data: {
            rewardSubType: rewardSubTypeMap[type],
            amount: calculateWithBase(amount),
            accumulateReachMaxMultiple: false,
          },
          onHide: () => {
            app.manager.ui.hide<PopGrandPrize>({ name: 'PopGrandPrize' });
            app.manager.ui.hide<PopWheel>({ name: 'PopWheel' });
          },
        });
      })
      .start();
  }

  // 根据奖池类型获取角度
  getAngleForJackpotType(jackpotType: JackpotType): number {
    switch (jackpotType) {
      case JackpotType.MINI:
        return this.calculateAngle(-45, 180);

      case JackpotType.MINOR:
        return this.calculateAngle(-225, 90);

      case JackpotType.MAJOR:
        return this.calculateAngle(-315, 60);

      case JackpotType.GRAND:
        return this.calculateAngle(-15, 30);

      default:
        return 0;
    }
  }

  // 通用角度计算方法（提取重复逻辑）
  private calculateAngle(baseAngle: number, range: number): number {
    // 边界内缩3度
    const RANGE_PADDING = 3;

    const adjustedRange = range - RANGE_PADDING * 2;

    return (baseAngle - RANGE_PADDING) - Math.random() * adjustedRange;
  }
}