const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const pop = 'assets/app-bundle/app-view/paper/home/';
const component = (a,n,t) => a[n._components.find(r => a[r.__id__].__type__ === t).__id__];
const node = (a,name) => a.find(n => n.__type__ === 'cc.Node' && n._name === name);
const near = (a,b) => assert.ok(Math.abs(a-b)<0.01, `${a} should equal ${b}`);
const scale = 750/920;
test('home board uses the Figma frame and retains six staggered reels', () => {
 const a=read(pop+'roll/native/PaperHomeRoll.prefab');
 const board=node(a,'RollContainer');
 assert.ok(board._lscale.x*796>750, 'the gold frame should extend past both viewport edges');
 assert.ok(board._lscale.x*710<750, 'all playable columns should remain visible');

 const frame=node(a,'TropicalBoardFrame');
 assert.ok(frame, 'new board chrome is a separate foreground layer');
 const size=component(a,frame,'cc.UITransform')._contentSize;
 assert.deepEqual([size.width,size.height],[796,638]);
 const masks=node(a,'MaskBox')._children.map(r=>a[r.__id__]);
 assert.equal(masks.length,6);
 assert.deepEqual(masks.map(n=>component(a,n,'cc.UITransform')._contentSize.height),[321,428,535,535,428,321]);
});
test('symbols preserve the new 144 by 130 aspect ratio during sprite changes', () => {
 const a=read(pop+'roll/native/expansion/Symbol.prefab');
 const icon=node(a,'Icon');const s=component(a,icon,'cc.UITransform')._contentSize;
 assert.deepEqual([s.width,s.height],[144,130]);
 assert.equal(component(a,icon,'cc.Sprite')._sizeMode,0,'automatic trim sizing must not distort symbols');
});
test('loading logo and play button match the 920 design at 750 viewport width', () => {
 const a=read('assets/app-appinit/view/AppInit.prefab');
 for(const [name,w,h,y] of [['Logo',366,204,431.5],['BtnPlay',389,134,-458.5]]) {
  const n=node(a,name),s=component(a,n,'cc.UITransform')._contentSize;
  near(s.width*n._lscale.x,w*scale);near(s.height*n._lscale.y,h*scale);near(n._lpos.y,y*scale);
 }
});

test('multiplier disks follow the resized arc without changing its 15 values', () => {
 const ts=require('typescript'),vm=require('node:vm');
 class Component {};
 class Vec3 { constructor(x,y,z){Object.assign(this,{x,y,z});} }
 const cc={Component,Vec3,sp:{Skeleton:class {}},_decorator:{ccclass:()=>x=>x,property:()=>()=>{}}};
 const exports={};
 const source=ts.transpileModule(fs.readFileSync(path.join(root,pop+'roll/native/expansion/RouletteWheel.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,console,require:id=>id==='cc'?cc:{}});
 const view=new exports.RouletteWheel();view.initData();
 assert.equal(view.dataList.length,15);
 const item={setPosition(x,y){this.x=x;this.y=y;}};
 const wheel=read(pop+'roll/native/expansion/RouletteWheel.prefab');
 const discY=angle=>{
  view.setItemPosition(item,angle);
  return node(wheel,'bg')._lpos.y+1.2*item.y;
 };
 near(discY(0),node(wheel,'textSpine')._lpos.y);
 near(discY(24),295.65);near(item.x,146.43);
 near(discY(-48),190.06);near(item.x,-267.53);
 view.bgSpineNode={eulerAngles:{z:0}};
 view.items=view.dataList.map((_,i)=>{
  const disc={active:true,setPosition(x,y){this.position={x,y};}};
  view.setItemPosition(disc,i*24);
  return disc;
 });
 const visible=()=>view.items.flatMap((disc,i)=>disc.active?[i]:[]);
 view.update();
 assert.deepEqual(Array.from(visible()),[0,1,2,13,14]);
 view.bgSpineNode.eulerAngles.z=72;
 view.update();
 assert.deepEqual(Array.from(visible()),[1,2,3,4,5]);
});

test('multiplier resets to 1x or 8x without effects, while an upgrade to 8x still plays them', () => {
 const ts=require('typescript'),vm=require('node:vm'),exports={};
 class Vec3 { constructor(x,y,z){Object.assign(this,{x,y,z});} }
 const events=[],pending=[];
 const tween=target=>({
  timeScale(){return this;},
  to(_,props){this.props=props;events.push(Object.keys(props)[0]);return this;},
  call(callback){this.callback=callback;return this;},
  start(){pending.push(()=>{Object.assign(target,this.props);this.callback?.();});},
 });
 const cc={Component:class {},Vec3,tween,sp:{Skeleton:class {}},_decorator:{ccclass:()=>x=>x,property:()=>()=>{}}};
 const pathToWheel=path.join(root,pop+'roll/native/expansion/RouletteWheel.ts');
 const source=ts.transpileModule(fs.readFileSync(pathToWheel,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,console,require:id=>{
  if(id==='cc') return cc;
  if(id.endsWith('/app')) return {app:{manager:{global:{gameSpeed:1}}}};
  if(id.endsWith('/EffectManager')) return {EffectManager:{inst:{playEffect:sound=>events.push(sound)}}};
  if(id.endsWith('/AudioConfig')) return {AudioPath:{GAME:{SPINE_ROTATE:'rotate',MULTIPLE_GLOW:'glow'}}};
  return {};
 }});
 const view=new exports.RouletteWheel();view.initData();
 const skeleton={setAnimation:(_,name)=>events.push(name),addAnimation:()=>{},setCompleteListener:()=>{}};
 const spineNode={getComponent:()=>skeleton};
 view.bgSpineNode={...spineNode};view.bg2SpineNode=spineNode;view.textSpineNode={...spineNode,active:false};
 view.getDiskSkeleton=()=>skeleton;
 view.items=view.dataList.map(value=>{
  const label={string:`${value}x`};
  return {label,getComponent:()=>({}),getChildByName:()=>({getComponent:()=>label}),setScale(x){this.scale=x;}};
 });
 for(const index of [0,3]){
  view.currentIndex=5;
  view.multipleIndexChange(index);
  pending.shift()();
  assert.deepEqual(events.splice(0),['eulerAngles']);
  assert.equal(view.bgSpineNode.eulerAngles.z,24*index);
  assert.equal(view.items[index].label.isBold,true);
  assert.equal(view.items[index].scale,1.2);
  assert.equal(view.textSpineNode.active,false);
 }
 view.currentIndex=2;
 view.multipleIndexChange(3,false);
 pending.shift()();
 assert.deepEqual(events,['zhuanpan','gunzhoudi','rotate','eulerAngles','scale','win','beilvshuzishanguang','glow']);
});

test('winning symbol stays visible until the clear phase and then hides', async () => {
 const ts=require('typescript'),vm=require('node:vm'),exports={};
 class Vec3 { constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});} }
 class Skeleton {
  setAnimation(_,name){this.animation=name;return this.track={animation:{duration:1},trackTime:0};}
  setCompleteListener(listener){this.complete=listener;}
 }
 const cc={Component:class {},Vec3,Size:Vec3,sp:{Skeleton},_decorator:{ccclass:()=>x=>x,property:()=>()=>{}}};
 const source=ts.transpileModule(fs.readFileSync(path.join(root,pop+'roll/native/expansion/Symbol.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 const data={};
 vm.runInNewContext(source,{exports,console,setTimeout,clearTimeout,require:id=>{
  if(id==='cc') return cc;
  if(id.endsWith('GameResourceManager')) return {GameResourceManager:{instance:{getRollSpineAnimationDataByName:async()=>data}}};
  if(id.endsWith('/app')) return {app:{manager:{global:{gameSpeed:1}}}};
  return {};
 }});
 const symbol=new exports.Symbol();
 const win=new Skeleton(),clear=new Skeleton();
 symbol.getSymbolId=()=> '1001';
 symbol.iconNode={active:true,getComponent:()=>({contentSize:{width:144,height:130}})};
 symbol.LightSpine={active:false,getComponent:Type=>Type===Skeleton?win:{setContentSize(){}}};
 symbol.removeUpSpineNode={active:false,getComponent:()=>clear};
 symbol.removeDownSpineNode={active:false};
 const winning=symbol.playWinAnimation();
 await new Promise(setImmediate);
 assert.equal(win.animation,'won');
 assert.equal(symbol.LightSpine.active,true);
 assert.equal(symbol.removeUpSpineNode.active,false);
 win.complete();
 await winning;
 assert.equal(symbol.LightSpine.active,true);
 const clearing=symbol.playClearAnimation();
 assert.equal(clear.animation,'xiaochu');
 assert.equal(clear.track.trackTime,0.15);
 assert.equal(symbol.LightSpine.active,false);
 clear.complete();
 await clearing;
 assert.equal(symbol.removeUpSpineNode.active,false);
 assert.equal(symbol.iconNode.active,false);
 assert.equal(win.skeletonData,null);
});

test('new loading skin hands off without showing the previous theme cinematic', () => {
 const ts=require('typescript'),vm=require('node:vm');const exports={};
 const cc={_decorator:{ccclass:()=>x=>x,property:()=>()=>{}}};
 const source=ts.transpileModule(fs.readFileSync(path.join(root,'assets/app-bundle/app-view/pop/starthome/native/PopStarthome.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,require:id=>id==='cc'?cc:id.includes('BaseView')?{default:class {}}:{}});
 const view=new exports.PopStarthome();view.skipLegacyOpening=true;let completed=false;
 view.playStartHomeSpine=()=>assert.fail('old cinematic must not replace the new loading screen');
 view.playStartAnimationComplete=()=>{completed=true;};view.onLoad();assert.equal(completed,true);
});


test('mobile controls use the available width and the win amount is readable', () => {
 const body=read(pop+'body/native/PaperHomeBody.prefab');
 const roll=read(pop+'roll/native/PaperHomeRoll.prefab');
 const bottom=node(body,'bottomView');
 const buttons=node(body,'buttonBox');
 const spin=node(body,'startBtnView');
 assert.ok(150*bottom._lscale.x*spin._lscale.x>=140,'spin hit area should span at least 140 design units');
 assert.ok(component(roll,node(roll,'Tips'),'cc.Label')._fontSize>=44);
 const reward=node(roll,'RewardBox');
 assert.ok(reward._lpos.y-117*reward._lscale.y/2 > bottom._lpos.y+buttons._lpos.y+75*bottom._lscale.y*spin._lscale.y);
});

test('the board waits for every win, then starts refill and fall during clear', async () => {
 const ts=require('typescript'),vm=require('node:vm'),exports={};
 const cc={Color:class {constructor(...rgba){this.rgba=rgba;}},_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},sp:{Skeleton:class {}}};
 const events=[];
 const source=ts.transpileModule(fs.readFileSync(path.join(root,pop+'roll/native/PaperHomeRoll.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,console,require:id=>{
  if(id==='cc') return cc;
  if(id.includes('BaseView')) return {default:{BindController:()=>class {}}};
  if(id.includes('BaseCommonUtil')) return {preventRapidClickDecorator:()=>()=>{}};
  if(id.includes('EffectManager')) return {EffectManager:{inst:{playEffect:sound=>events.push(sound)}}};
  if(id.includes('AudioConfig')) return {AudioPath:{GAME:{SYMBOL_WIN:'win sound',SYMBOL_CLEAR:'clear sound'}}};
  if(id.includes('/Utils/common')) return {delay:()=>assert.fail('clear to fall should have no fixed delay')};
  return {};
 }});
 const view=new exports.PaperHomeRoll();
 view.dimNonWinningSymbols=(_,dim)=>events.push(dim?'dim':'restore');
 view.roundIndex=0;
 view.resultList=[{}, {wheel:[['new first','new second']]}];
 let completeWin,completeClear,completeFall;
 const rolls=[
  {playWinningSymbols:async()=>events.push('first win'),clearWinningSymbols:()=>{
   events.push('first clear');
   return new Promise(resolve=>{completeClear=resolve;});
  }},
  {playWinningSymbols:()=>new Promise(resolve=>{completeWin=resolve;}),clearWinningSymbols:async()=>events.push('second clear')},
 ];
 for(const [index,roll] of rolls.entries()) {
  roll.getRollRemoveData=()=>[{}];
  roll.getCurrentIndex=()=>index;
  roll.addNewSymbolToTop=async symbols=>events.push(...symbols);
  roll.fallDownSymbol=()=>{
   events.push(`fall ${index}`);
   return index===0?new Promise(resolve=>{completeFall=resolve;}):Promise.resolve();
  };
  roll.removeSymbol=async()=>events.push(`recycle ${index}`);
 }
 const playing=view.startWinAndClear(rolls).then(({finished})=>view.refillAndFall(rolls,finished));
 assert.deepEqual(events,['dim','win sound','first win']);
 completeWin();
 await new Promise(setImmediate);
 assert.deepEqual(events,['dim','win sound','first win','clear sound','first clear','second clear','new first','new second','fall 0','fall 1']);
 completeFall();
 await new Promise(setImmediate);
 assert.equal(events.at(-1),'fall 1','finishing the fall must not recycle symbols that are still clearing');
 completeClear();
 await playing;
 assert.deepEqual(events.slice(-3),['restore','recycle 0','recycle 1']);
});

test('cascade fills gaps without moving or reusing the clearing symbols', async () => {
 const ts=require('typescript'),vm=require('node:vm'),exports={};
 class Vec3 { constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});} }
 const falls=[],recycled=[];
 const cc={Component:class {},Vec3,NodePool:class {put(n){recycled.push(n);}},
  _decorator:{ccclass:()=>x=>x,property:()=>()=>{}},tween:n=>({
   to(duration,props){this.duration=duration;this.target=props.position;return this;},
   call(done){this.done=done;return this;},start(){falls.push([n,this.duration]);n.position=this.target;this.done();}
  })};
 const source=ts.transpileModule(fs.readFileSync(path.join(root,pop+'roll/native/expansion/Roll.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,require:id=>{
  if(id==='cc') return cc;
  if(id.endsWith('/app')) return {app:{manager:{global:{quikeMode:0}}}};
  if(id.endsWith('/GlobalManager')) return {IQuickMode:{nomal:0}};
  return {};
 }});
 const roll=new exports.Roll();
 const makeSymbol=(id,y)=>({id,name:'Symbol',position:new Vec3(0,y,0),getComponent:()=>null,
  setPosition(x,y,z){this.position=new Vec3(x,y,z);}});
 const top=makeSymbol('top',0),bottom=makeSymbol('bottom',-300);
 const clearing=makeSymbol('clear',-100),otherClearing=makeSymbol('other clear',-200);
 roll.itemHeight=100;
 roll.firstSymbolY=100; // 滚轴停下时，移除顶部缓冲符号前记录的位置。
 roll.node={children:[top,clearing,otherClearing,bottom],insertChild(n,i){this.children.splice(i,0,n);},
  removeChild(n){this.children.splice(this.children.indexOf(n),1);}};
 roll.symbolAnimationData=[
  {symbolNode:top,isNeedRemove:false,fallDownCount:2},
  {symbolNode:clearing,isNeedRemove:true,fallDownCount:0},
  {symbolNode:otherClearing,isNeedRemove:true,fallDownCount:0},
  {symbolNode:bottom,isNeedRemove:false,fallDownCount:0},
 ];
 roll.createSymbol=({symbolId})=>makeSymbol(symbolId,0);
 await roll.addNewSymbolToTop([{symbolId:'new'},{symbolId:'new 2'},{symbolId:'top'},{symbolId:'bottom'}]);
 await roll.fallDownSymbol();
 assert.deepEqual(falls.map(([n])=>[n.id,n.position.y]),[['new',0],['new 2',-100],['top',-200]]);
 assert.equal(new Set(falls.map(([,duration])=>duration)).size,1);
 assert.equal(clearing.position.y,-100);
 assert.deepEqual(recycled,[]);
 await roll.removeSymbol();
 assert.deepEqual(recycled,[clearing,otherClearing]);
 assert.deepEqual(roll.node.children.map(n=>n.id),['new','new 2','top','bottom']);
 roll.itemCount=5;
 roll.createSymbol=()=>clearing;
 roll.addTopExcessSymbol();
 assert.deepEqual(roll.node.children.map(n=>n.position.y),[100,0,-100,-200,-300]);
});

test('anticipation shades neighboring columns without leaving bright seams', () => {
 const ts=require('typescript'),vm=require('node:vm'),exports={};
 const cc={Color:class {constructor(...rgba){this.rgba=rgba;}},_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},sp:{Skeleton:class {}}};
 const source=ts.transpileModule(fs.readFileSync(path.join(root,pop+'roll/native/PaperHomeRoll.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,console,require:id=>{
  if(id==='cc') return cc;
  if(id.includes('BaseView')) return {default:{BindController:()=>class {}}};
  if(id.includes('BaseCommonUtil')) return {preventRapidClickDecorator:()=>()=>{}};
  return {};
 }});
 const view=new exports.PaperHomeRoll();
 const rectangles=[];
 view.anticipationShade={clear:()=>{rectangles.length=0;},rect:(...rect)=>rectangles.push(rect),fill(){}};
 view.Rolls=[321,428,535,535,428,321].map((height,index)=>({parent:{
  position:{x:118*index-295,y:0},getComponent:()=>({contentSize:{width:116,height}})
 }}));
 view.shadeOtherReels(view.Rolls[2]);
 assert.deepEqual(rectangles,[
  [-353,-160.5,117,321],[-236,-214,118,428],[0,-267.5,118,535],[118,-214,118,428],[236,-160.5,117,321]
 ]);
 assert.deepEqual(view.anticipationShade.fillColor.rgba,[0,0,0,185]);
});

for (const [betSubType, quikeMode, lastReelHasScatter] of [
 ['NORMAL_BET', 0, true],
 ['BUY_BET', 0, false],
 ['BUY_BET', 1, true],
 ['FREE_SPINS_BUY_BET', 0, true],
]) {
test(`anticipation preserves the zoom and plays ScatterShow only for a settled purchase reel with Scatter (${betSubType}, speed ${quikeMode})`, async () => {
 const ts=require('typescript'),vm=require('node:vm'),exports={};
 const tweens=[];
 const sounds=[];
 const cc={
  Vec3:class {constructor(x,y,z){Object.assign(this,{x,y,z});}},
  _decorator:{ccclass:()=>x=>x,property:()=>()=>{}},
  sp:{Skeleton:class {}},
  tween:target=>{
   const animation={
    target,
    to(duration,{scale},{easing}){Object.assign(this,{duration,scale,easing});return this;},
    call(callback){this.callback=callback;return this;},
    start(){tweens.push(this);return this;},
    stop(){this.stopped=true;},
   };
   return animation;
  },
 };
 const app={manager:{event:{emit(){}},global:{quikeMode,gameSpeed:1}},controller:{slots:{betSubType,isFreeBonusSpin:betSubType==='FREE_SPINS_BUY_BET'}}};
 const source=ts.transpileModule(fs.readFileSync(path.join(root,pop+'roll/native/PaperHomeRoll.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,console,setTimeout(){},require:id=>{
  if(id==='cc') return cc;
  if(id.includes('BaseView')) return {default:{BindController:()=>class {}}};
  if(id.includes('BaseCommonUtil')) return {preventRapidClickDecorator:()=>()=>{}};
  if(id.includes('/Utils/common')) return {delay:async()=>{}};
  if(id.endsWith('/enums/bet')) return {BetSubTypes:{buySpinNormal:'BUY_BET'}};
  if(id.endsWith('/AudioConfig')) return {AudioPath:{GAME:{SCATTER_SHOW:'ScatterShow'}}};
  if(id.endsWith('/EffectManager')) return {EffectManager:{inst:{playEffect:(...args)=>sounds.push(args)}}};
  if(id.endsWith('/GlobalManager')) return {IQuickMode:{nomal:0}};
  if(id.endsWith('/app')) return {app};
  return {};
 }});
 const view=new exports.PaperHomeRoll();
 const {x,y,z}=node(read(pop+'roll/native/PaperHomeRoll.prefab'),'RollContainer')._lscale;
 const baseScale=new cc.Vec3(x,y,z);
 baseScale.clone=()=>new cc.Vec3(x,y,z);
 const board={isValid:true,scale:baseScale};
 view.rollContainerNode=board;
 view.anticipationShade={clear(){}};
 view.shadeOtherReels=()=>{};
 view.scheduleOnce=()=>{};
 const pending=[];
 const reelStops=[];
 view.Rolls=Array.from({length:6},(_,i)=>{
  const reel={
   isRolling:true,
   stopRolling(_,complete){
    this.isRolling=true;
    reelStops[i]=()=>{
     this.isRolling=false;
     complete(i);
    };
   },
   showRollFrameSpine:()=>new Promise(resolve=>pending.push({i,resolve})),
   hideRollFrameSpine(){},
  };
  return {getComponent:()=>reel};
 });
 const stopWith=(...scatters)=>view.stopGame({resultDetail:{resultList:[{
  wheel:[
   Array.from({length:6},(_,i)=>scatters.includes(i)?{symbolId:'3001'}:null),
   [null,null,null,{symbolId:scatters.includes(3)?'3001':'1001'},null,null],
  ],
 }]}});
 const nextTurn=()=>new Promise(setImmediate);
 await stopWith();
 await nextTurn();
 for(const settle of reelStops) settle();
 assert.deepEqual(sounds,[]);
 assert.equal(tweens.length,0);
 const stopping=stopWith(0,2,3,...(lastReelHasScatter?[5]:[]));
 await nextTurn();
 assert.deepEqual(pending.map(({i})=>i),[3]);
 for(const settle of reelStops.slice(0,3)) settle();
 assert.equal(tweens.length,1);
 const [zoom]=tweens;
 assert.equal(zoom.target,board);
 assert.equal(zoom.easing,'linear');
 assert.ok(zoom.duration>6.25,'zoom must run through three 2-second effects and the two reel delays');
 near(zoom.scale.x,x*1.1);near(zoom.scale.y,y*1.1);near(zoom.scale.z,z);
 pending[0].resolve();
 assert.deepEqual(sounds,[],'Scatter can be visible before its reel settles');
 reelStops[3]();
 const cue=['ScatterShow',false,null,true];
 const shouldPlay=betSubType==='BUY_BET';
 assert.deepEqual(sounds,shouldPlay?[cue]:[],'play once on the first anticipation stop, even with multiple Scatter symbols');
 await nextTurn();
 assert.deepEqual(pending.map(({i})=>i),[3,4]);
 assert.equal(tweens.length,1);
 pending[1].resolve();
 reelStops[4]();
 assert.deepEqual(sounds,shouldPlay?[cue]:[],'no cue when the stopped reel has no Scatter');
 await nextTurn();
 assert.deepEqual(pending.map(({i})=>i),[3,4,5]);
 assert.equal(tweens.length,1);
 pending[2].resolve();
 await nextTurn();
 assert.equal(tweens.length,1);
 assert.deepEqual(sounds,shouldPlay?[cue]:[]);
 reelStops[5]();
 assert.deepEqual(sounds,shouldPlay?(lastReelHasScatter?[cue,cue]:[cue]):[]);
 await stopping;
 assert.equal(tweens.length,2);
 assert.equal(zoom.stopped,true);
 assert.deepEqual(tweens[1].scale,new cc.Vec3(x,y,z));
});
}

test('scatter appearance and bounce no longer play ScatterShow', () => {
 const source=fs.readFileSync(path.join(root,pop+'roll/native/expansion/Symbol.ts'),'utf8');
 assert.doesNotMatch(source,/SCATTER_SHOW/);
});
