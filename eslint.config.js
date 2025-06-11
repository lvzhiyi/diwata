// ESLint v9 Flat Config (eslint.config.js)
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');
const { defineConfig } = require('eslint/config');
// const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  // 忽略列表
  {
    ignores: [
      'assets/activity/**/*',   // 忽略 activity 目录
      'assets/common/**/*',     // 忽略 common 目录
      '!assets/**/*.js',        // 不忽略 assets 目录下的 js 文件
      '!assets/**/*.ts'         // 不忽略 assets 目录下的 ts 文件
    ]
  },

  // JavaScript 文件配置
  {
    files: ['assets/**/*.js'],
    ...js.configs.recommended.rules
  },

  // TypeScript 文件配置
  {
    files: ['assets/**/*.ts', 'assets/**/*.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      // prettier: eslintPluginPrettierRecommended,
    },
    rules: {
      // 两空格缩进，并配置特殊节点的缩进规则
      'indent': ['error', 2, {
        'SwitchCase': 1,
        'flatTernaryExpressions': false,
        'ignoredNodes': [
          'PropertyDefinition[decorators]',
          'TSPropertySignature[decorators]',
          'ClassBody.body > PropertyDefinition[decorators] > .decorators'
        ]
      }],

      // 每行最大长度
      'max-len': ['error', { code: 180 }],

      // 未使用的变量警告
      'no-unused-vars': 'off',

      // 允许不必要的转义字符
      'no-useless-escape': 'off',

      // 允许使用 apply 而不是展开运算符
      'prefer-spread': 'off',

      // 允许使用 let 声明不会被修改的变量
      'prefer-const': 'off',

      // 逗号前后的空格使用规则
      'comma-spacing': 'error',

      // 操作符前后要有空格
      'space-infix-ops': 'error',

      // 允许在条件语句中使用常量表达式
      'no-constant-condition': 'off',

      // 允许在嵌套块中声明函数和变量
      'no-inner-declarations': 'off',

      // 允许使用命名空间
      '@typescript-eslint/no-namespace': 'off',

      // 允许空接口
      '@typescript-eslint/no-empty-interface': 'off',

      // 箭头函数的箭头前后要有空格
      'arrow-spacing': ['error', { before: true, after: true }],

      // 最多允许连续一个空行
      'no-multiple-empty-lines': ['error', {
        max: 1,
        maxEOF: 1,
        maxBOF: 0
      }],

      // 控制块语句（包括普通 {} 块、函数体、switch）开头和结尾是否允许空行。
      'padded-blocks': ['error', {
        // 控制普通 {} 块的开头和结尾是否允许空行。
        blocks: 'never',
        // 控制函数体的开头和结尾是否允许空行。
        classes: 'never',
        // 控制 switch 语句的开头和结尾是否允许空行。
        switches: 'never'
      }, {
          allowSingleLineBlocks: true
        }],
      // 全部交给padding-line-between-statements规则控制
      // 'padded-blocks': 'off',

      // 在指定的语句对之间 强制 或 禁止 空行，例如常见 '变量声明后需空行再 return'。
      'padding-line-between-statements': [
        'error',
        {
          // 变量和return语句之间必须有一个空行
          blankLine: 'always',
          prev: '*',
          next: 'return'
        },
        {
          // import 和 其他语句之间必须有一个空行
          blankLine: 'always',
          prev: 'import',
          next: '*'
        },
        {
          // import 语句之间不能有空行
          blankLine: 'never',
          prev: 'import',
          next: 'import'
        },
        {
          // 不对export语句的空行进行限制
          blankLine: 'any',
          prev: 'export',
          next: 'export'
        },
        // 其他语句和块语句之间必须有空行
        {
          blankLine: 'always',
          prev: '*',
          next: 'block-like'
        },
        // 任何跨多行的块语句（if/for/switch/…）之后，跟任意语句之间 强制空行
        {
          blankLine: 'always',
          prev: 'block-like',
          next: '*'
        },
        // 块与块之间允许有空行，但不强制性
        {
          blankLine: 'any',
          prev: 'block-like',
          next: 'block-like'
        },
        // 变量声明之间可有可无空行
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var']
        },
        // break 语句后必须有空行
        {
          blankLine: 'always',
          prev: 'break',
          next: '*'
        },
      ],

      // 要求在同一类中，相邻成员（属性、构造器、方法）之间强制空行（或禁止空行）。
      'lines-between-class-members': ['error', 'always', {
        exceptAfterSingleLine: false,
      }],

      // 控制 块注释（/* … */）与 行注释（// …）前后空行。
      'lines-around-comment': ['error', {
        // 控制块注释（/* … */）前后的空行。
        beforeBlockComment: true,
        // 控制块注释（/* … */）后的空行。
        afterBlockComment: true,
        // 控制行注释（// …）前的空行。
        beforeLineComment: true,
        // 控制行注释（// …）后的空行。
        afterLineComment: true,
        // 控制对象注释（@ …）前后的空行。
        beforeObjectComment: true,
        // 控制对象注释（@ …）后的空行。
        afterObjectComment: true,
        // 控制数组注释（[ … ]）前后的空行。
        beforeArrayComment: true,
        // 控制数组注释（[ … ]）后的空行。
        afterArrayComment: true,
      }],

      // 指定行注释（// …）的位置：必须独占一行（'above'）或允许行尾（'beside'）。
      'line-comment-position': ['error', 'above'],

      // 控制对象字面量中属性是否允许同行或必须分行。
      'object-property-newline': ['error', {
        // 控制对象字面量中属性是否允许同行。
        allowAllPropertiesOnSameLine: true
      }],

      // 根据 多行表达式 或 属性数量，控制花括号内是否换行。
      'object-curly-newline': ['error', {
        // 控制对象表达式是否允许跨多行。
        ObjectExpression: {
          multiline: true,
          minProperties: 3
        },
        // 控制对象解构赋值是否允许同行。
        ObjectPattern: {
          multiline: true,
          minProperties: 3
        },
        // 控制导入声明是否允许同行。
        // ImportDeclaration: {
        //   multiline: true,
        //   minProperties: 6
        // },
        // 控制导出声明是否允许同行。
        ExportDeclaration: {
          multiline: true,
          minProperties: 3
        }
      }],

      // 函数括号前的空格规则
      'space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }],

      // 注释后必须跟随空格
      'spaced-comment': ['error', 'always', {
        line: {
          markers: ['/'],
          exceptions: ['-', '+']
        },
        block: {
          markers: ['!'],
          exceptions: ['*'],
          balanced: true
        }
      }],

      // 允许使用 Object、String 等类型
      '@typescript-eslint/ban-types': 'off',

      // 允许使用 @ts-ignore 等注释
      '@typescript-eslint/ban-ts-comment': 'off',

      // 允许使用 any 类型
      '@typescript-eslint/no-explicit-any': 'off',

      // 允许使用 require 语句
      '@typescript-eslint/no-var-requires': 'off',

      // 允许空函数
      '@typescript-eslint/no-empty-function': 'off',

      // 语句必须以分号结束
      'semi': ['error', 'always'],

      // 使用单引号
      'quotes': ['error', 'single', { 'avoidEscape': true }],

      // 允许不显式声明函数返回类型
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // 对象字面量的大括号内必须有空格
      'object-curly-spacing': ['error', 'always'],

      // 允许在参数和属性上显式声明类型
      '@typescript-eslint/no-inferrable-types': ['error', {
        ignoreParameters: true,
        ignoreProperties: true
      }],

      // 允许在枚举类型中使用未使用的变量
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',
        args: 'after-used'
      }],

      // 类名必须使用大驼峰命名
      '@typescript-eslint/naming-convention': ['error', {
        selector: 'class',
        format: ['PascalCase'],
        leadingUnderscore: 'forbid'
      }],

      // 注释规则
      'lines-around-comment': ['error', {
        beforeBlockComment: false,
        afterBlockComment: false,
        beforeLineComment: false,
        afterLineComment: false,
        allowBlockStart: true,
        allowBlockEnd: true,
        allowObjectStart: true,
        allowObjectEnd: true,
        allowArrayStart: true,
        allowArrayEnd: true
      }],

      // 禁止连续的空行
      'no-multiple-empty-lines': ['error', {
        max: 1,
        maxEOF: 0,
        maxBOF: 0
      }],

      // 强制使用单引号
      'quotes': ['error', 'single', { 'avoidEscape': true }],
      
      // 对象属性名称使用单引号
      'quote-props': ['error', 'as-needed', { 'numbers': true }],
      
      // JSX 中使用单引号
      'jsx-quotes': ['error', 'prefer-single'],
    }
  }
]);
