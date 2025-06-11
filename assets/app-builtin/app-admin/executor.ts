/* eslint-disable */
import { Component } from 'cc';
import { app } from '../../app/app';
import { EDITOR,EDITOR_NOT_IN_PREVIEW } from 'cc/env';

import {GlobalManager} from '../app-manager/global/GlobalManager'
import EventManager from '../../../extensions/app/assets/manager/event/EventManager'
import LoaderManager from '../../../extensions/app/assets/manager/loader/LoaderManager'
import SoundManager from '../../../extensions/app/assets/manager/sound/SoundManager'
import TimerManager from '../../../extensions/app/assets/manager/timer/TimerManager'
import UIManager from '../../../extensions/app/assets/manager/ui/UIManager'
/**界面名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举) @deprecated 请使用UIManager.ViewName*/
export const ViewName = UIManager.ViewName
/**子界面名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举) @deprecated 请使用UIManager.MiniViewName*/
export const MiniViewName = UIManager.MiniViewName
/**音乐名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举) @deprecated 请使用SoundManager.MusicName*/
export const MusicName = SoundManager.MusicName
/**音效名字枚举(在main、resources、app-model与app-controller所在的Asset Bundle中无法使用此枚举) @deprecated 请使用SoundManager.EffectName*/
export const EffectName = SoundManager.EffectName

export type IViewName = "PageHome"|"PopAutosetting"|"PopBetamout"|"PopBetrecord"|"PopBetrecorddetail"|"PopBuybonus"|"PopErrorPop"|"PopFreeSpinResult"|"PopGrandPrize"|"PopJackpotRecord"|"PopRule"|"PopSettings"|"PopWheel"
export type IViewNames = IViewName[]
export type IMiniViewName = "PaperHomeActivity"|"PaperHomeBody"|"PaperHomeRoll"
export type IMiniViewNames = IMiniViewName[]
export type IMusicName = "never"
export type IMusicNames = IMusicName[]
export type IEffectName = "never"
export type IEffectNames = IEffectName[]

import config_app from '../app-model/config.app'
import config_env from '../app-model/config.env'
import config_wsenv from '../app-model/config.wsenv'
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.config, {app:new config_app(),env:new config_env(),wsenv:new config_wsenv()})
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.data, {})
import store_bet from '../app-model/store.bet'
import store_gameresult from '../app-model/store.gameresult'
import store_user from '../app-model/store.user'
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.store, {bet:new store_bet(),gameresult:new store_gameresult(),user:new store_user()})

import {HomeController} from '../app-controller/HomeController'
import {SlotsController} from '../app-controller/SlotsController'
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.Controller, {Home:HomeController,Slots:SlotsController})
if(!EDITOR||!EDITOR_NOT_IN_PREVIEW) Object.assign(app.controller, {home:HomeController.inst,slots:SlotsController.inst})

export type IReadOnly<T> = { readonly [P in keyof T]: T[P] extends Function ? T[P] : (T[P] extends Object ? IReadOnly<T[P]> : T[P]); };
export type IApp = {
    Controller: {Home:typeof HomeController,Slots:typeof SlotsController},
    controller: {home:IReadOnly<HomeController>,slots:IReadOnly<SlotsController>},
    Manager: {Global:Omit<typeof GlobalManager,keyof Component>,Event:Omit<typeof EventManager,keyof Component>,Loader:Omit<typeof LoaderManager,keyof Component>,Sound:Omit<typeof SoundManager,keyof Component>,Timer:Omit<typeof TimerManager,keyof Component>,UI:Omit<typeof UIManager,keyof Component>},
    manager: {global:Omit<GlobalManager,keyof Component>,event:Omit<EventManager,keyof Component>,loader:Omit<LoaderManager,keyof Component>,sound:Omit<SoundManager<IEffectName,IMusicName>,keyof Component>,timer:Omit<TimerManager,keyof Component>,ui:Omit<UIManager<IViewName,IMiniViewName>,keyof Component>},
    data: {},
    config: {app:IReadOnly<config_app>,env:IReadOnly<config_env>,wsenv:IReadOnly<config_wsenv>}
    store: {bet:IReadOnly<store_bet>,gameresult:IReadOnly<store_gameresult>,user:IReadOnly<store_user>}
}
