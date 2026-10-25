import { _decorator, Component, Node } from 'cc';
import { getIsGap } from './common';
const { ccclass, property } = _decorator;


export const BetString = () => {
   const isGap = getIsGap();
   if(isGap){
    return 'Points';
   }
   return 'Bet';
}

export const WinString = () => {
    const isGap = getIsGap();
    if(isGap){
     return 'Points';
    }
    return 'Win';
 }

 export const BalanceString = () => {
    const isGap = getIsGap();
    if(isGap){
     return 'Points';
    }
    return 'Balance';
 }




