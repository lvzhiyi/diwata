const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
class Color {
  constructor(r = 255, g = 255, b = 255, a = 255) { Object.assign(this, { r, g, b, a }); }
  fromHEX(hex) {
    const value = hex.replace('#', '');
    ['r', 'g', 'b'].forEach((key, i) => { this[key] = parseInt(value.slice(i * 2, i * 2 + 2), 16); });
    return this;
  }
}
class Component {}
class Label {}
class Sprite {}
class Button {}
const cc = {
  Color, Component, Label, Sprite, Button,
  EventTarget: class { on() {} },
  _decorator: { ccclass: () => value => value, property: () => () => {} },
};
const decorator = () => (_target, _key, descriptor) => descriptor;
function load(relative, app, extra = {}) {
  const filename = path.join(root, 'assets/app-bundle/app-view/pop', relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
  }).outputText;
  const module = { exports: {} };
  const request = id => {
    if (id === 'cc') return { ...cc, ...extra };
    if (id === 'dayjs') return { default: require('dayjs') };
    if (id.endsWith('/app')) return { app };
    if (id.includes('BaseView')) return { default: Component };
    return { preventRapidClickDecorator: decorator, default: Component };
  };
  vm.runInNewContext(compiled, { exports: module.exports, require: request, console }, { filename });
  return module.exports;
}
function labelNode(name) {
  const label = { color: new Color(5, 30, 88), string: '', enableShadow: false };
  return { name, children: [], label, getComponent: () => label };
}
function contrast(foreground, background) {
  const luminance = c => [c.r, c.g, c.b].map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Catch runtime state updates restoring white text over a pale Figma surface.
test('enabled Auto Set remains readable on its pale menu row', () => {
  const app = { manager: { global: {} } };
  const { PopSettings } = load('settings/native/PopSettings.ts', app);
  const view = new PopSettings();
  const label = labelNode('Label').label;
  const button = { interactable: false };
  view.AutoSettingBtn = { getChildByName: () => ({
    getComponent: () => button, getChildByName: () => ({ getComponent: () => label }),
  }) };
  view.changeAutoSettingBtnColor();
  assert.equal(button.interactable, true);
  assert.ok(contrast(label.color, new Color(215, 239, 255)) >= 4.5, 'enabled menu text must contrast with the new pale background');
  app.manager.global.isGoing = true;
  view.changeAutoSettingBtnColor();
  assert.equal(button.interactable, false, 'skin must preserve the existing disabled state');
});

test('selected date remains readable and retains the date filter', () => {
  const { PopBetrecord } = load('betrecord/native/PopBetrecord.ts', {});
  const view = new PopBetrecord();
  const node = labelNode('date');
  view.ClickToSelectADateLabel = node;
  view._pageParams = {};
  view.selectTabTime = () => {};
  view.selectDate(new Date(2026, 9, 17));
  assert.equal(node.label.string, '2026-10-17');
  assert.ok(view._pageParams.startCreateTime < view._pageParams.endCreateTime);
  assert.ok(contrast(node.label.color, new Color(240, 248, 255)) >= 4.5, 'date text must contrast with its pale input');
});

test('bet amount selection updates both button and text without changing preset values', () => {
  const app = { manager: { global: { betCount: 0.5 } } };
  const nodes = [];
  const instantiate = () => {
    const label = labelNode('Label');
    const sprite = {};
    return { label, getChildByName: () => label, getComponent: () => sprite, on() {}, sprite };
  };
  const file = 'betamout/native/expansion/BetAmountGrid.ts';
  const filename = path.join(root, 'assets/app-bundle/app-view/pop', file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, console, require: id => {
    if (id === 'cc') return { ...cc, instantiate, Node: { EventType: { TOUCH_END: 'touch-end' } } };
    if (id.endsWith('/app')) return { app };
    return { getP: () => '₱', numberToMoney: v => v.toString() };
  } });
  const grid = new exports.BetAmountGrid();
  grid.node = { removeAllChildren() {}, addChild: node => nodes.push(node) };
  grid.activeSpriteFrame = 'selected'; grid.unactiveSpriteFrame = 'idle';
  grid.onActive();
  assert.equal(nodes.length, 18);
  assert.equal(nodes[1].label.label.string, '₱ 0.5');
  assert.equal(nodes[1].sprite.spriteFrame, 'selected');
  assert.notDeepEqual(nodes[1].label.label.color, nodes[0].label.label.color, 'selected amount must change its text state along with its background');
  assert.ok(contrast(nodes[0].label.label.color, new Color(215, 239, 255)) >= 4.5);
});

test('autoplay preset changes update the visible selected text state', () => {
  const app = { manager: { global: { autoSetting: { totalSpins: { value: 50, selected: true } }, setAutoSetting(value) { this.autoSetting = value; } } } };
  const { PopAutosetting } = load('autosetting/native/PopAutosetting.ts', app);
  const view = new PopAutosetting();
  const makeSpin = name => {
    const label = labelNode(name), sprite = {};
    return { children: [label], getComponent: () => sprite, sprite };
  };
  const spins = [makeSpin('50'), makeSpin('100')];
  view.BottomNode = { children: spins };
  view.AmountButtonOn = 'on'; view.AmountButtonOff = 'off';
  view.changeSelectNodeUI = () => {};
  view.addOrSubValue('totalSpins', 100);
  assert.equal(spins[0].sprite.spriteFrame, 'off');
  assert.equal(spins[1].sprite.spriteFrame, 'on');
  assert.notDeepEqual(spins[0].children[0].label.color, spins[1].children[0].label.color, 'preset label must follow selected background');
  assert.equal(app.manager.global.autoSetting.totalSpins.value, 100);
});

test('Tips rich text created at runtime remains readable on the white panel', () => {
  class RichText {
    static HorizontalAlign = { CENTER: 1 };
    static VerticalAlign = { CENTER: 1 };
    constructor() { this.color = new Color(); }
  }
  const { PopErrorPop } = load('error-pop/native/PopErrorPop.ts', {}, { RichText });
  const view = new PopErrorPop();
  view.enableRichText = true;
  view.toastText = { getComponent: () => null, addComponent: Type => new Type() };
  view.textContainer = { getComponent: () => ({ width: 570 }) };
  view.updateTextLayout();
  assert.ok(contrast(view.richText.color, new Color()) >= 4.5, 'new rich text must inherit the dark popup text style');
});

test('maintenance Tips keeps inline emphasis readable', () => {
  const { PopErrorPop } = load('error-pop/native/PopErrorPop.ts', {});
  const view = new PopErrorPop();
  view.enableRichText = true;
  view.richText = {};
  view.updateTextLabel('Maintenance <color=#00ffff>October 17</color><br/>Please return later.');
  assert.match(view.richText.string, /<color=#051E58>October 17<\/color>/);
  assert.match(view.richText.string, /<br\/>Please return later\./);
});

test('Tips panel reflows its buttons when message height grows', () => {
  const prefab = JSON.parse(fs.readFileSync(path.join(root, 'assets/app-bundle/app-view/pop/error-pop/native/PopErrorPop.prefab'), 'utf8'));
  const bgIndex = prefab.findIndex(o => o.__type__ === 'cc.Node' && o._name === 'Bg');
  const layout = prefab.find(o => o.__type__ === 'cc.Layout' && o.node.__id__ === bgIndex);
  assert.equal(layout._enabled, true, 'long messages must resize the enclosing panel');
  assert.equal(layout._resizeMode, 1, 'panel must fit its content');
  assert.equal(layout._layoutType, 2, 'buttons must reflow below the message');
  assert.ok(layout._spacingY >= 20);
});
