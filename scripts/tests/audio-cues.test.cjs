const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const expansion = 'assets/app-bundle/app-view/paper/home/roll/native/expansion/';
test('ScatterShow plays without waiting for the next frame, including turbo mode', async () => {
  const exports = {};
  const cc = { Component: class {}, _decorator: { ccclass: () => x => x } };
  const options = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true } };
  const audio = {};
  vm.runInNewContext(ts.transpileModule(read('assets/res-native/script/AudioConfig.ts'), options).outputText, { exports: audio });
  const file = 'assets/basePlate/middleWare/serverManager/EffectManager.ts';
  vm.runInNewContext(ts.transpileModule(read(file), options).outputText, {
    exports, console, require: id => id === 'cc' ? cc : id.endsWith('/AudioConfig') ? audio : {},
  });
  const { SCATTER_SHOW, SCATTER_EXPECT } = audio.AudioPath.GAME;
  const fx = new exports.EffectManager();
  const queued = [], played = [];
  fx.isInitialized = true;
  fx.loadAudioClip = async name => name;
  fx.getAvailableAudioSource = () => ({ play() { played.push(this.clip); } });
  fx.scheduleOnce = (callback, delay) => queued.push({ callback, delay });
  fx._isTurboMode = true;
  assert.ok(await fx.playEffect(SCATTER_SHOW, false, null, true) >= 0);
  assert.equal(await fx.playEffect(SCATTER_EXPECT, false, null, true), -1);
  assert.deepEqual(played, [SCATTER_SHOW]);
  fx._isTurboMode = false;
  await fx.playEffect(SCATTER_EXPECT, false, null, true);
  assert.deepEqual(played, [SCATTER_SHOW]);
  queued.find(x => x.delay === 0).callback();
  assert.deepEqual(played, [SCATTER_SHOW, SCATTER_EXPECT]);
});

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

test('大奖逐档播放对应音乐，仅最终档使用带收尾的版本', async () => {
  const compile = file => ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true } }).outputText;
  const audioExports = {};
  vm.runInNewContext(compile('assets/res-native/script/AudioConfig.ts'), { exports: audioExports });
  const exports = {};
  const RewardSubTypeEnum = { NICE: 1, MEGA: 2, SUPER: 3 };
  const modules = {
    cc: { _decorator: { ccclass: () => x => x, property: () => () => {} } },
    BaseView: { default: class {} },
    bet: { RewardSubTypeEnum },
    AudioConfig: audioExports,
    GameResourceManager: { SPINE_RESOURCE_NAMES: {} },
  };
  vm.runInNewContext(compile('assets/app-bundle/app-view/pop/grand-prize/native/PopGrandPrize.ts'), { exports, require: id => modules[id.split('/').pop()] });

  const stages = ['01nice_', '02mega_', '03super_'];
  const tracks = ['Nice', 'Mega', 'Super'];
  for (const type of Object.values(RewardSubTypeEnum)) {
    const popup = new exports.PopGrandPrize();
    const events = [];
    popup.pauseBGM = () => {};
    popup.playAmountAnimation = () => {};
    popup.initializeUI = async () => { popup.animationQueue = stages.slice(0, type); };
    popup.playGrandPrizeBGSound = (track, loop) => {
      assert.equal(loop, false);
      assert.ok(fs.existsSync(path.join(root, `assets/resources/Audio/${track}.mp3`)));
      events.push(track);
    };
    popup.playGrandPrizeAnimation = async stage => { events.push(stage); };
    await popup.onShow({ rewardSubType: type });
    assert.deepEqual(events, stages.slice(0, type).flatMap((stage, i) => [
      `BGM/${tracks[i]}_Bg${i === type - 1 ? '_AndEnd' : ''}`, stage,
    ]));
  }
});
