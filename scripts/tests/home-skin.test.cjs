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

test('the board waits for every win animation before clearing any symbol', async () => {
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
  if(id.includes('/Utils/common')) return {delay:async()=>{}};
  return {};
 }});
 const view=new exports.PaperHomeRoll();
 view.dimNonWinningSymbols=(_,dim)=>events.push(dim?'dim':'restore');
 let completeWin;
 const rolls=[
  {playWinningSymbols:async()=>events.push('first win'),clearWinningSymbols:async()=>events.push('first clear')},
  {playWinningSymbols:()=>new Promise(resolve=>{completeWin=resolve;}),clearWinningSymbols:async()=>events.push('second clear')},
 ];
 for(const roll of rolls) roll.getRollRemoveData=()=>[{}];
 const playing=view.playWinAndClear(rolls);
 assert.deepEqual(events,['dim','win sound','first win']);
 completeWin();
 await playing;
 assert.deepEqual(events,['dim','win sound','first win','clear sound','first clear','second clear','restore']);
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
