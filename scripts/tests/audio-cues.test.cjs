const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const expansion = 'assets/app-bundle/app-view/paper/home/roll/native/expansion/';
test('转盘完成回调同步更新选中项并播放发光音效', () => {
  const sounds = [], updates = [], exports = {};
  class Component {}
  class Vec3 {}
  const cc = { Component, Vec3, sp: {}, _decorator: { ccclass: () => x => x, property: () => () => {} } };
  const audio = { GAME: { MULTIPLE_GLOW: 'glow' } };
  const source = ts.transpileModule(read(expansion + 'RouletteWheel.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true } }).outputText;
  vm.runInNewContext(source, { exports, console, require: id => id === 'cc' ? cc : id.endsWith('/AudioConfig') ? { AudioPath: audio } : { EffectManager: { inst: { playEffect: sound => sounds.push(sound) } } } });
  const wheel = new exports.RouletteWheel();
  wheel.updateSelectedItem = () => updates.push(wheel.bgCurrentRotation);
  wheel.finishBgAnimation(72);
  assert.deepEqual(updates, [72]);
  assert.deepEqual(sounds, ['glow']);
});
test('金额弹出和下落分别绑定到动画开始及下落回调', () => {
  const source = read(expansion + 'CurrentRoundAmount.ts');
  const appear = source.indexOf('playEffect(AudioPath.GAME.AMOUNT_APPEAR)');
  assert.ok(appear >= 0 && appear < source.indexOf("spine.setAnimation(0, 'start'"));
  const fall = source.indexOf('playEffect(AudioPath.GAME.DOUBLE_NUMBER)');
  assert.ok(fall > source.indexOf('// 金额保持字号'));
  assert.ok(fall < source.indexOf('.to(0.26'));
  assert.equal((source.match(/playEffect\(AudioPath.GAME.DOUBLE_NUMBER\)/g) || []).length, 1);
});
