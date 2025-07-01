# 按钮呼吸动画组件使用指南

## 概述

本项目提供了两个呼吸动画组件，可以为按钮添加生动的呼吸效果：

1. **ButtonBreath** - 简单易用的基础呼吸动画组件
2. **AdvancedButtonBreath** - 功能丰富的高级呼吸动画组件

## 组件特性

### ButtonBreath（基础版）
- ✅ 简单的缩放呼吸效果
- ✅ 自动开始/停止控制
- ✅ 触摸时暂停动画
- ✅ 可自定义缩放范围和持续时间
- ✅ 轻量级，性能优秀

### AdvancedButtonBreath（高级版）
- ✅ 多种呼吸类型：缩放、透明度、旋转、组合
- ✅ 丰富的参数配置
- ✅ 多种缓动函数支持
- ✅ 循环播放控制
- ✅ 触摸交互控制
- ✅ 动态参数调整

## 快速开始

### 方法一：通过属性面板添加

1. 选择需要添加呼吸动画的按钮节点
2. 在属性面板中点击"添加组件"
3. 搜索并选择 `ButtonBreath` 或 `AdvancedButtonBreath`
4. 调整相关参数

### 方法二：通过代码添加

```typescript
import { ButtonBreath } from './ButtonBreath';
import { AdvancedButtonBreath } from './AdvancedButtonBreath';

// 添加简单呼吸动画
const breath = buttonNode.addComponent(ButtonBreath);
breath.setBreathParams(0.9, 1.1, 1.0); // 最小缩放、最大缩放、持续时间

// 添加高级呼吸动画
const advancedBreath = buttonNode.addComponent(AdvancedButtonBreath);
advancedBreath.setBreathParams({
  minScale: 0.8,
  maxScale: 1.2,
  duration: 1.5,
  easing: 'sineInOut'
});
```

## 详细配置

### ButtonBreath 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| minScale | number | 0.9 | 呼吸动画的最小缩放值 |
| maxScale | number | 1.1 | 呼吸动画的最大缩放值 |
| duration | number | 1.0 | 呼吸动画的持续时间（秒） |
| pauseOnTouch | boolean | true | 是否在触摸时暂停呼吸动画 |
| autoStart | boolean | true | 是否自动开始呼吸动画 |

### AdvancedButtonBreath 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| breathType | BreathType | SCALE | 呼吸动画类型 |
| minScale | number | 0.9 | 缩放呼吸的最小值 |
| maxScale | number | 1.1 | 缩放呼吸的最大值 |
| minOpacity | number | 150 | 透明度呼吸的最小值 |
| maxOpacity | number | 255 | 透明度呼吸的最大值 |
| rotationRange | number | 5 | 旋转呼吸的角度范围 |
| duration | number | 1.0 | 动画持续时间 |
| pauseOnTouch | boolean | true | 触摸时是否暂停 |
| autoStart | boolean | true | 是否自动开始 |
| loop | boolean | true | 是否循环播放 |
| easing | string | 'sineInOut' | 缓动函数类型 |

### 呼吸动画类型

1. **SCALE** - 缩放呼吸：按钮有节奏地放大缩小
2. **OPACITY** - 透明度呼吸：按钮透明度在指定范围内变化
3. **ROTATION** - 旋转呼吸：按钮在指定角度范围内轻微旋转
4. **COMBINED** - 组合呼吸：同时执行缩放、透明度和旋转动画

### 缓动函数类型

- `linear` - 线性变化
- `sineInOut` - 正弦缓入缓出（推荐）
- `quadInOut` - 二次方缓入缓出
- `cubicInOut` - 三次方缓入缓出
- `elasticInOut` - 弹性缓入缓出
- `backInOut` - 回弹缓入缓出

## 使用示例

### 基础缩放呼吸

```typescript
// 创建基础呼吸动画
const breath = button.addComponent(ButtonBreath);
breath.setBreathParams(0.85, 1.15, 1.2); // 更明显的缩放效果
```

### 透明度呼吸

```typescript
// 创建透明度呼吸动画
const breath = button.addComponent(AdvancedButtonBreath);
breath['breathType'] = 'opacity';
breath.setBreathParams({
  minOpacity: 100,
  maxOpacity: 255,
  duration: 0.8,
  easing: 'sineInOut'
});
```

### 组合呼吸效果

```typescript
// 创建组合呼吸动画
const breath = button.addComponent(AdvancedButtonBreath);
breath['breathType'] = 'combined';
breath.setBreathParams({
  minScale: 0.9,
  maxScale: 1.1,
  minOpacity: 180,
  maxOpacity: 255,
  rotationRange: 3,
  duration: 2.0,
  easing: 'elasticInOut'
});
```

## API 参考

### ButtonBreath 方法

```typescript
// 开始呼吸动画
breath.startBreath();

// 停止呼吸动画
breath.stopBreath();

// 暂停呼吸动画
breath.pauseBreath();

// 恢复呼吸动画
breath.resumeBreath();

// 设置呼吸参数
breath.setBreathParams(minScale: number, maxScale: number, duration: number);
```

### AdvancedButtonBreath 方法

```typescript
// 开始呼吸动画
breath.startBreath();

// 停止呼吸动画
breath.stopBreath();

// 暂停呼吸动画
breath.pauseBreath();

// 恢复呼吸动画
breath.resumeBreath();

// 设置呼吸参数
breath.setBreathParams({
  minScale?: number;
  maxScale?: number;
  minOpacity?: number;
  maxOpacity?: number;
  rotationRange?: number;
  duration?: number;
  easing?: string;
});
```

## 最佳实践

### 1. 选择合适的呼吸类型
- **重要按钮**：使用缩放呼吸，吸引用户注意
- **次要按钮**：使用透明度呼吸，保持界面和谐
- **特殊按钮**：使用组合呼吸，增强视觉效果

### 2. 参数调优建议
- **缩放范围**：建议在 0.8-1.2 之间，避免过于夸张
- **动画时长**：建议在 0.8-2.0 秒之间，保持自然节奏
- **缓动函数**：推荐使用 `sineInOut`，效果最自然

### 3. 性能优化
- 避免同时使用过多呼吸动画
- 在不需要时及时停止动画
- 考虑使用 `pauseOnTouch` 减少不必要的动画

### 4. 用户体验
- 呼吸动画应该增强而不是干扰用户体验
- 在用户交互时暂停动画，避免干扰操作
- 保持动画的一致性，避免界面过于混乱

## 常见问题

### Q: 为什么动画没有效果？
A: 检查以下几点：
1. 确保按钮节点有 Button 组件
2. 检查 `autoStart` 是否设置为 true
3. 确认参数设置是否合理

### Q: 如何让动画更明显？
A: 可以调整以下参数：
1. 增大缩放范围（如 0.7-1.3）
2. 延长动画时间（如 1.5-2.0秒）
3. 使用更明显的缓动函数（如 `elasticInOut`）

### Q: 如何批量控制多个按钮的呼吸动画？
A: 可以使用以下方法：
```typescript
// 获取所有呼吸动画组件
const breathComponents = node.getComponentsInChildren(AdvancedButtonBreath);

// 批量控制
breathComponents.forEach(breath => {
  breath.startBreath(); // 或 stopBreath(), pauseBreath() 等
});
```

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基础缩放呼吸动画
- 支持高级多类型呼吸动画
- 完整的参数配置和API支持 