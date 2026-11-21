const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const expansion = 'assets/app-bundle/app-view/paper/home/roll/native/expansion/';
function createWheel() {
  const sounds = [], updates = [], completions = [], exports = {};
  class Component {}
  class Vec3 {}
  const cc = {
    Component, Vec3, sp: {}, _decorator: { ccclass: () => x => x, property: () => () => {} },
    tween: () => {
      const steps = {
        timeScale: () => steps,
        to: () => steps,
        call: complete => { completions.push(complete); return steps; },
        start: () => steps,
      };
      return steps;
    },
  };
  const audio = { GAME: { SPINE_ROTATE: 'rotate', MULTIPLE_GLOW: 'glow' } };
  const app = { manager: { global: { gameSpeed: 1 } } };
  const source = ts.transpileModule(read(expansion + 'RouletteWheel.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true } }).outputText;
  const modules = { cc, app: { app }, AudioConfig: { AudioPath: audio }, EffectManager: { EffectManager: { inst: { playEffect: sound => sounds.push(sound) } } } };
  vm.runInNewContext(source, { exports, console, require: id => modules[id.split('/').pop()] });
  const wheel = new exports.RouletteWheel();
  wheel.initData();
  const spineNode = { getComponent: () => ({ setAnimation() {} }) };
  wheel.bgSpineNode = spineNode;
  wheel.bg2SpineNode = spineNode;
  wheel.updateSelectedItem = () => updates.push(wheel.bgCurrentRotation);
  return { wheel, sounds, updates, completions };
}

for (const [mode, index, rotation] of [['普通轮', 0, 0], ['免费轮', 3, 72]]) {
  test(`${mode}复位时更新选中项，但全程不播放倍率音效`, () => {
    const { wheel, sounds, updates, completions } = createWheel();
    wheel.currentIndex = 5;
    wheel.bgCurrentRotation = 120;
    wheel.multipleIndexChange(index, true);
    const soundsAtStart = [...sounds];
    assert.equal(completions.length, 1);
    completions.shift()();
    assert.deepEqual(updates, [rotation]);
    assert.deepEqual(soundsAtStart, []);
    assert.deepEqual(sounds, []);
  });
}

test('普通轮升到 8x 时依次播放转动和发光音效，相同档位不重播', () => {
  const { wheel, sounds, updates, completions } = createWheel();
  wheel.currentIndex = 2;
  wheel.bgCurrentRotation = 48;
  wheel.multipleIndexChange(3, false);
  assert.deepEqual(sounds, ['rotate']);
  assert.equal(completions.length, 1);
  completions.shift()();
  assert.deepEqual(updates, [72]);
  assert.deepEqual(sounds, ['rotate', 'glow']);
  wheel.multipleIndexChange(3, false);
  assert.equal(completions.length, 0);
  assert.deepEqual(sounds, ['rotate', 'glow']);
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
