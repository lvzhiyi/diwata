const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const base='assets/app-bundle/app-view/pop/betrecorddetail/native/expansion/';
const read=name=>JSON.parse(fs.readFileSync(path.join(root,base+name),'utf8'));
const component=(a,n,type)=>a[n._components.find(r=>a[r.__id__].__type__===type).__id__];
test('record detail loads the same clear symbol set as the new home board',()=>{
 let requested;class Component{};class SpriteFrame{};
 const cc={Component,SpriteFrame,_decorator:{ccclass:()=>x=>x,property:()=>()=>{}},resources:{loadDir(dir,type,callback){requested=dir;callback(null,[{name:'1001'}]);}}};
 const exports={};const source=ts.transpileModule(fs.readFileSync(path.join(root,base+'RecordDetailLayout.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(source,{exports,console,require:id=>id==='cc'?cc:{}});
 const view=new exports.RecordDetailLayout();view.emptyCard={name:'empty'};view.id='record-123';let fetched;view.getData=id=>{fetched=id;};view.loadCards();
 assert.equal(requested,'skins/tropical-home/symbols/normal');assert.equal(fetched,'record-123');assert.equal(view.mapIdToSpriteFrame('1001').name,'1001');assert.equal(view.cards.length,2);
});
test('record board keeps the new frame and symbol proportions in the compact card',()=>{
 const a=read('DetailItem.prefab'),bg=a.find(n=>n._name==='bg');const size=component(a,bg,'cc.UITransform')._contentSize;
 assert.deepEqual([size.width,size.height],[796,638]);assert.ok(Math.abs(size.width*bg._lscale.x-310)<.01);
 const frameUuid=JSON.parse(fs.readFileSync(path.join(root,'assets/resources/skins/tropical-home/record_roll_frame.png.meta'),'utf8')).uuid;
 assert.equal(component(a,bg,'cc.Sprite')._spriteFrame.__uuid__,frameUuid+'@f9941');
 const b=read('ItemCard.prefab'),item=b[1],s=component(b,item,'cc.UITransform')._contentSize;
 assert.deepEqual([s.width,s.height],[144,130]);assert.equal(component(b,item,'cc.Sprite')._sizeMode,0);
 const c=read('Col.prefab');assert.equal(component(c,c[1],'cc.UITransform')._contentSize.width,116);assert.equal(component(c,c[1],'cc.Layout')._spacingY,-23);
});

test('Game Details header background fills its actual nested navigation height',()=>{
 const dir=path.join(root,base);
 const nav=JSON.parse(fs.readFileSync(path.join(dir,'RecordDetailNavBar.prefab'),'utf8'));
 const modal=JSON.parse(fs.readFileSync(path.join(dir,'RecordDetailModal.prefab'),'utf8'));
 const rootFileId=nav[component(nav,nav[1],'cc.UITransform').__prefab.__id__].fileId;
 const override=modal.find(o=>o.__type__==='CCPropertyOverrideInfo'&&o.propertyPath[0]==='_contentSize'&&modal[o.targetInfo.__id__].localID[0]===rootFileId);
 const bg=nav.find(o=>o._name==='bgView');
 const widget=component(nav,bg,'cc.Widget');assert.equal(widget._enabled,true);assert.equal(widget._alignFlags,45);
 // Cocos may save the standalone prefab at 114px; stretch uses the nested instance height.
 const effectiveHeight=override.value.height-widget._top-widget._bottom;
 assert.equal(effectiveHeight,142,'background must cover the actual bar without exposing white strips');
 for(const side of ['_top','_bottom','_left','_right'])assert.equal(widget[side],0);
});
