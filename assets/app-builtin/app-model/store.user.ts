import { IStore } from '../../../extensions/app/assets/base/BaseModel';
import { IGOR_P_ID } from '../../basePlate/middleWare/constants/constants';
import { getIsGap } from '../../common/script/extra/Utils/common';

// store中只允许在根路径下定义方法，任何变量在外部访问都是readonly
// store类型的引入是借鉴了Web前端框架中全局状态管理的思路，意图是让数据更安全，更可控。同时框架中还提供了数据绑定的扩展包，可以通过pkg的方式安装，实现「数据->视图」的单向绑定。
export default class User implements IStore<User> {
  token = '';

  playerId = '';

  playerName = '';

  setToken(v: string) {
    this.token = v;
  }

  setPlayerId(v: string) {
    this.playerId = v;
  }

  setPlayerName(v: string) {
    this.playerName = v;
  }

  userParams: Record<string, any> = {};

  setUserParams(v: Record<string, any>) {
    this.userParams = v;
  }

  get isInitActivityModule() {
    const isGap = getIsGap();

    if(isGap){
      return false;
    }

    return +this.userParams.pId !== IGOR_P_ID;
  }
}