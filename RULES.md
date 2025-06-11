# Cocos Creator 项目代码规范

## 目录
1. [代码检查说明](#代码检查说明)
2. [ESLint 规范说明](#eslint-规范说明)
3. [Cocos Creator 规范说明](#cocos-creator-规范说明)
   - [属性装饰器规范](#1-属性装饰器规范)
   - [API 使用规范](#2-api-使用规范)
   - [性能优化规范](#3-性能优化规范)
4. [常见问题处理](#常见问题处理)
5. [未来计划](#未来计划)

## 代码检查说明

### 检查范围
项目的代码检查分为两个部分：
1. ESLint 检查
   - 检查 TypeScript 代码规范
   - 包括缩进、分号、引号等基础规范
   - 配置文件：`eslint.config.js`

2. Cocos 规范检查
   - 检查 Cocos Creator 特有的规范
   - 包括属性装饰器、API 使用等
   - 配置文件：`scripts/rules/*.js`

### 检查命令

#### 手动检查
```bash
# 检查全部文件
pnpm run lint:check        # ESLint 检查
pnpm run check:cocos       # Cocos 规范检查

# 只检查暂存区文件
pnpm run lint:staged       # ESLint 检查
pnpm run check:cocos:staged # Cocos 规范检查
```

#### Git 提交自动检查
当执行 `git commit` 时，会自动触发以下检查：
```bash
pnpm run lint:staged        # 只检查暂存区文件的 ESLint 规范
pnpm run check:cocos:staged # 只检查暂存区文件的 Cocos 规范
```

这些检查配置在 `.husky/pre-commit` 钩子中，只会检查当前提交的文件，不会检查整个项目，可以提高检查效率。

### 排除规则
以下目录默认不进行代码规范检查：
- `assets/activity/**`
- `assets/common/**`
- 但会检查这些目录下的 `.js` 和 `.ts` 文件

如需添加其他排除目录，请在 `package.json` 的 `cocosConfig.exclude` 中配置：
```json
{
  "cocosConfig": {
    "exclude": [
      "assets/test/**",
      "assets/temp/*",
      "assets/other-folder/**/*.ts"
    ]
  }
}
```

## ESLint 规范说明

### 1. 基础格式规范

#### 缩进和空格
- 使用两个空格进行缩进
- 特殊节点的缩进规则：
  - `SwitchCase` 语句缩进 1 个层级
  - 忽略装饰器相关节点的缩进
- 操作符前后必须有空格
- 逗号后面必须有空格
- 对象字面量的大括号内必须有空格
- 箭头函数的箭头前后必须有空格
- 函数括号前的空格规则：
  - 匿名函数必须有空格
  - 命名函数不能有空格
  - 异步箭头函数必须有空格

```typescript
// ❌ 错误示例
const obj={a:1,b:2};
const add=(a,b)=>a+b;
function calculate (value) {}
switch(type){
case 1:
  break;
}

// ✅ 正确示例
const obj = { a: 1, b: 2 };
const add = (a, b) => a + b;
function calculate(value) {}
switch (type) {
  case 1:
    break;
}
```

#### 代码格式
- 每行最大长度为 180 个字符
- 语句必须以分号结束
- 字符串使用单引号
- 文件末尾不允许有空行
```typescript
// ❌ 错误示例
let name = "test"
let value = 123;

// ✅ 正确示例
let name = 'test';
let value = 123;
```

### 2. 空行规范

#### 空行控制
- 最多允许连续一个空行
- 文件开头不允许空行
- 文件末尾不允许空行
- 控制块语句（包括普通块、函数体、switch）开头和结尾不允许空行
- 类成员（属性、构造器、方法）之间必须有空行
- 变量声明后如果有 return 语句，必须空一行

```typescript
// ❌ 错误示例
class Example {
  name: string;
  age: number;
  constructor() {

    this.name = '';

  }
}

function test() {
  const value = 1;
  return value;
}


// ✅ 正确示例
class Example {
  name: string;

  age: number;

  constructor() {
    this.name = '';
  }
}

function test() {
  const value = 1;

  return value;
}
```

### 3. 对象和数组格式化

#### 对象格式化规则
- 当对象属性超过 3 个时，必须换行
- 解构赋值超过 3 个属性时，必须换行
- 导出声明超过 3 个属性时，必须换行
- 导入声明超过 3 个属性时，必须换行

```typescript
// ❌ 错误示例
const longObject = { name: 'test', age: 20, address: 'street', city: 'beijing' };
const { name, age, address, city } = person;

// ✅ 正确示例
const longObject = {
  name: 'test',
  age: 20,
  address: 'street',
  city: 'beijing'
};

const { 
  name,
  age,
  address,
  city 
} = person;

// 3个及以下属性可以放在同一行
const shortObject = { name: 'test', age: 20, city: 'beijing' };
```

### 4. 注释规范

#### 注释格式和位置
- 行注释必须独占一行，不允许在代码行尾添加注释
- 注释符号后必须跟随空格
- 块注释（/* ... */）前后不需要空行
- 行注释（// ...）前后不需要空行
- 允许在以下位置直接添加注释：
  - 代码块开始和结束处
  - 对象开始和结束处
  - 数组开始和结束处

```typescript
// ❌ 错误示例
const value = 1; // 这是一个值
//错误的注释格式
/*错误的块注释*/

// ✅ 正确示例
// 这是一个值
const value = 1;

/* 块注释示例 */
function example() {
  // 行注释示例
  const value = 1;
  
  /* 对象注释 */
  const obj = {
    // 属性注释
    name: 'test'
  };
}
```

### 5. TypeScript 特定规范

#### 类型使用
- 允许使用 `any` 类型（但不推荐）
- 允许使用 `Object`、`String` 等类型
- 允许在参数和属性上显式声明类型
- 允许不显式声明函数返回类型
- 允许使用命名空间
- 允许空接口
- 允许使用 `@ts-ignore` 等注释（但不推荐）

```typescript
// 允许的示例
let value: any;
let obj: Object;
let count: number = 0;

function calculate(value: number) {
  return value * 2;
}

// @ts-ignore
const module = require('./module');

namespace Test {
  export interface Empty {}
}
```

#### 命名规范
- 类名必须使用大驼峰命名（PascalCase）
- 不允许类名以下划线开头

```typescript
// ❌ 错误示例
class userInfo {}
class _UserManager {}

// ✅ 正确示例
class UserInfo {}
class UserManager {}
```

### 6. 变量使用规范

#### 变量声明和使用
- 未使用的变量会产生警告
- 以下划线开头的变量名会被忽略未使用检查
- 函数参数在使用前未使用会被警告

```typescript
// ❌ 会产生警告的示例
function calculate(a: number, b: number): number {
  const temp = 1; // 未使用的变量
  return a;  // b 参数未使用
}

// ✅ 正确示例
function calculate(a: number): number {
  const _temp = 1; // 以下划线开头会被忽略
  return a;
}
```

### 7. 其他规则
- 允许在条件语句中使用常量表达式
- 允许在嵌套块中声明函数和变量
- 允许使用 `require` 语句
- 允许空函数

## Cocos Creator 规范说明

### 1. 属性装饰器规范

#### Boolean 类型
- 带默认值的 boolean 类型属性**不需要**在装饰器中指定 `CCBoolean` 类型
```typescript
// ❌ 错误示例
@property({
  type: CCBoolean,  // 多余的类型声明
})
private isVisible: boolean = false;

// ✅ 正确示例
@property
private isVisible: boolean = false;
```

#### String 类型
- 带默认值的 string 类型属性**不需要**在装饰器中指定 `CCString` 类型
```typescript
// ❌ 错误示例
@property({
  type: CCString,  // 多余的类型声明
})
private name: string = 'default';

// ✅ 正确示例
@property
private name: string = 'default';
```

- 未带默认值的 string 类型属性**必须**使用 `CCString` 类型
```typescript
// ❌ 错误示例
@property
private name: string;

// ✅ 正确示例
@property({
  type: CCString,
})
private name: string;
```

#### Number 类型
- 整数类型的属性**必须**使用 `CCInteger` 类型
```typescript
// ❌ 错误示例
@property
private count: number = 0;

// ✅ 正确示例
@property({
  type: CCInteger,
})
private count: number = 0;
```

- 小数类型的属性**必须**使用 `CCFloat` 类型
```typescript
// ❌ 错误示例
@property
private speed: number = 1.5;

// ✅ 正确示例
@property({
  type: CCFloat,
})
private speed: number = 1.5;
```

### 2. API 使用规范

#### 废弃的 API
- 不允许使用 `SystemEvent` API，应使用 `Input` 模块的 API 代替
```typescript
// ❌ 错误示例
import { SystemEvent } from 'cc';

// ✅ 正确示例
import { Input } from 'cc';
```

### 3. 性能优化规范

#### update 方法优化
- 不允许在 update 方法中使用变量声明（let、const、var），这会导致频繁的内存分配和垃圾回收
```typescript
// ❌ 错误示例
update(deltaTime: number): void {
  const currentPos = 100;  // 每帧都会创建新变量
  let speed = 10;         // 每帧都会创建新变量
  this.node.x += speed;
}

// ✅ 正确示例
// 将需要的变量声明为类成员
private speed = 10;

update(deltaTime: number): void {
  this.node.x += this.speed;
}
```

- 原因说明：
  - update 方法在每一帧都会执行
  - 在方法内声明变量会导致每帧都创建新的内存空间
  - 频繁的内存分配和释放会增加垃圾回收的压力
  - 这可能导致游戏出现卡顿或性能下降

- 建议做法：
  - 将需要在 update 中使用的变量声明为类的成员变量
  - 在 update 方法中直接使用这些成员变量
  - 如果确实需要临时变量，考虑在类中预先声明并重复使用

## 常见问题处理

### 跳过提交前检查
在特殊情况下，如果需要跳过提交前的检查（不推荐），可以使用：
```bash
git commit -n
```

### 手动修复 ESLint 问题
可以使用以下命令自动修复一些常见的 ESLint 问题：
```bash
pnpm run lint
```

## 未来计划

### 资源引用
- [ ] 检查页面之间资源互相引用
- [ ] 检查页面间的脚本互相引用
- [ ] 检查Appinit初始化页面是否引入了子页面资源

### 代码检查工具优化
- [ ] 支持更多的 TypeScript 语法检查规则
- [ ] 添加自动修复建议功能
- [x] 添加 update 方法性能检查规则

### 规范扩展
- [ ] 补充更多的性能优化建议
- [ ] 添加组件生命周期方法的最佳实践
- [ ] 补充内存优化相关规范

### 文档完善
- [ ] 添加更多的代码示例
- [ ] 补充常见问题解决方案
- [ ] 添加性能优化指南

> 注：以上计划会根据项目发展和团队需求持续调整和更新。