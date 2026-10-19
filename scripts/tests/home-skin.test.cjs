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
 near(board._lscale.x,scale); near(board._lpos.y,-51.5*scale);
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
 const cc={Component,Vec3,_decorator:{ccclass:()=>x=>x,property:()=>()=>{}}};
 const exports={};
 const source=ts.transpileModule(fs.readFileSync(path.join(root,pop+'roll/native/expansion/RouletteWheel.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,console,require:id=>id==='cc'?cc:{}});
 const view=new exports.RouletteWheel();view.initData();
 assert.equal(view.dataList.length,15);
 const item={setPosition(x,y){this.x=x;this.y=y;}};
 view.setItemPosition(item,0);near(item.x,0);near(item.y,322.5);
 view.setItemPosition(item,24);near(item.x,Math.sin(24*Math.PI/180)*322.5);
});

test('new symbol landing, wins and wild changes never load legacy symbol artwork', async () => {
 const ts=require('typescript'),vm=require('node:vm');
 class Component {};
 class Vec3 { constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});} }
 const cc={Component,Vec3,Size:Vec3,Sprite:class {},UIOpacity:class {},_decorator:{ccclass:()=>x=>x,property:()=>()=>{}}};
 const exports={};let legacyLoads=0;
 const source=ts.transpileModule(fs.readFileSync(path.join(root,pop+'roll/native/expansion/Symbol.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,console,setTimeout,clearTimeout,require:id=>id==='cc'?cc:id.endsWith('GameResourceManager')?{GameResourceManager:{instance:{getRollSpineAnimationDataByName(){legacyLoads++;throw Error('old skin');}}},ROLL_RESOURCE_NAMES:{}}:id.endsWith('/app')?{app:{manager:{global:{gameSpeed:1}}}}:{}});
 const symbol=new exports.Symbol();symbol.useSpriteAnimations=true;
 symbol.symbolIcons=[{name:'symbol-1001'}];symbol.symbolBlurIcons=[];symbol.initSprites();assert.ok(symbol.mapSymbols.has('1001'), 'cached frame names must still resolve by server ID');
 let pulses=0;symbol.animateSkinIcon=async()=>{pulses++;};symbol.cleanupAnimationNodes=()=>{};symbol.destoryWildAnimationNode=()=>{};
 const sprite={spriteFrame:'old'},opacity={opacity:255};symbol.iconNode={active:true,getComponent:Type=>Type===cc.Sprite?sprite:opacity};symbol.mapSymbols.set('5001','wild');
 await symbol.startElementFallBackAnimation('1001');
 await symbol.startLightAndRemoveAnimation();assert.equal(symbol.iconNode.active,false);
 await symbol.playWildAnimation({},'gun_in',symbol.iconNode,'5001');assert.equal(sprite.spriteFrame,'wild');
 assert.equal(pulses,3);assert.equal(legacyLoads,0);
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
