import { _decorator, Button, Component, EventHandler, Node, assetManager, resources, url, ImageAsset, AudioClip, AssetManager } from 'cc';
import { ActivityAudioMgr } from '../managers/ActivityAudioMgr';
import { ActivityDataMgr } from '../data/ActivityDataMgr';
const { ccclass, property, type } = _decorator;

@ccclass('ButtonEffect')
export class ButtonEffect extends Component {

    @property({ displayName: '点击间隔时间', tooltip: '按钮点击的冷却时间(秒)' })
    @type(Number)
    interval: number = 0.3;

    private _isLock: boolean = false;
    private _eventHandlers: EventHandler[] = [];
    private _clickEvents: EventHandler[] = [];
    private _buttonAudioClip: AudioClip = null;

    onLoad() {
        this.node.on(Button.EventType.CLICK, this.onClick, this);
        
    }

    start(){
        this._clickEvents = this.node.getComponent(Button).clickEvents;
  
     
    }

    
    onClick(event: Event) {
        if (this._isLock) return;
        this._isLock = true;
      
        if ( this._clickEvents.length > 0) {
            this._eventHandlers = this._clickEvents;
            this.node.getComponent(Button).clickEvents = [];
        }
   
        this.scheduleOnce(()=>{
            this._isLock = false; 
            if (this._eventHandlers.length > 0) {
                this.node.getComponent(Button).clickEvents = this._eventHandlers;
            }
           
        },this.interval)
        if (ActivityDataMgr.instance.getUseEffect()) {
            this.playButtonClickSound()
        }

    }

    private playButtonClickSound(){
             
        if (ActivityDataMgr.instance.getVolumeClip()) {
            ActivityAudioMgr.instance.playEffect(ActivityDataMgr.instance.getVolumeClip()); 
        }else{
            assetManager.loadBundle('commonBundle', (err: Error, bundle: AssetManager.Bundle)=> {
                if (err || !bundle) return;
                bundle.load('skin-high/sounds/buttonClick', (err: Error, clip: AudioClip) => {
                    if (clip) {
                        this._buttonAudioClip = clip
                        ActivityAudioMgr.instance.playEffect(clip)
                        ActivityDataMgr.instance.setVolumeClip(clip)
                    }
                });
            });
        }
    }
    onDestroy() {
        if (this.node && this.node.isValid) {
            this.node.targetOff(this);
        }
    }

}


