const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runAllRules } = require('./rules');
const { fixFile } = require('./utils/file-fixer');

// 解析命令行参数
const shouldFix = process.argv[2] === 'fix';
const checkStaged = process.argv[2] === '--staged';

/**
 * 获取暂存区的文件列表
 * @returns {string[]} 暂存区文件路径数组
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR').toString();
    return output.split('\n').filter(file => file && file.endsWith('.ts'));
  } catch (error) {
    console.error('获取暂存区文件失败:', error);
    return [];
  }
}

/**
 * 获取配置信息
 * @returns {{exclude: string[]}} 配置对象
 */
function getConfig() {
  /**
   * 默认排除的目录
   */
  const defaultExclude = ['assets/common/**', 'assets/activity/**'];
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const userExclude = packageJson?.cocosConfig?.exclude || [];
    return {
      exclude: [...defaultExclude, ...userExclude]
    };
  } catch (error) {
    console.warn('读取 package.json 配置失败，将使用默认配置');
    return { exclude: defaultExclude };
  }
}

/**
 * 检查路径是否应该被排除
 * @param {string} filePath 文件路径
 * @param {string[]} excludePatterns 排除模式数组
 * @returns {boolean} 是否应该被排除
 */
function shouldExclude(filePath, excludePatterns) {
  const relativePath = path.relative(process.cwd(), filePath);
  return excludePatterns.some(pattern => {
    // 将 glob 模式转换为正则表达式
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\//g, '\\/');
    return new RegExp(`^${regexPattern}$`).test(relativePath);
  });
}

/**
 * 格式化错误信息
 * @param {string} filePath 文件路径
 * @param {Array<{line: number, column?: number, message: string, rule?: string}>} errors 错误信息数组
 * @returns {void}
 */
function formatErrors(filePath, errors) {
  const relativePath = path.relative(process.cwd(), filePath);
  errors.forEach(err => {
    const location = `${relativePath}:${err.line}${err.column ? ':' + err.column : ''}`;
    const rule = err.rule ? `  ${err.rule}` : '';
    console.error(`${location}  ${err.message}${rule}`);
  });
}

/**
 * 检查单个文件的规则
 * @param {string} filePath 文件路径
 * @returns {Array<{line: number, column?: number, message: string, rule?: string}>} 错误信息数组
 */
function checkCocosRules(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // 使用runAllRules执行所有规则检查
  const errors = runAllRules(lines);

  return errors.map(error => ({
    ...error,
    file: filePath
  }));
}

/**
 * 检查指定的文件列表
 * @param {string[]} files 文件路径数组
 * @returns {boolean} 是否存在错误
 */
function checkFiles(files) {
  let hasErrors = false;
  const config = getConfig();

  files.forEach(file => {
    if (!file.endsWith('.ts') || shouldExclude(file, config.exclude)) {
      return;
    }

    const errors = checkCocosRules(file);
    if (errors.length > 0) {
      hasErrors = true;
      
      if (shouldFix) {
        const fixed = fixFile(file, errors);
        if (fixed) {
          console.log(`已自动修复文件: ${file}`);
          const remainingErrors = checkCocosRules(file);
          if (remainingErrors.length === 0) {
            hasErrors = false;
            return;
          }
          formatErrors(file, remainingErrors);
          return;
        }
      }
      
      formatErrors(file, errors);
    }
  });

  return hasErrors;
}

/**
 * 遍历项目文件
 * @param {string} dir 目录路径
 * @returns {boolean} 是否存在错误
 */
function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  let hasErrors = false;
  const config = getConfig();
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    
    // 检查是否应该排除该路径
    if (shouldExclude(fullPath, config.exclude)) {
      return;
    }
    
    if (fs.statSync(fullPath).isDirectory()) {
      if (traverseDirectory(fullPath)) {
        hasErrors = true;
      }
    } else if (file.endsWith('.ts')) {
      const errors = checkCocosRules(fullPath);
      if (errors.length > 0) {
        hasErrors = true;
        
        // 如果启用了自动修复，尝试修复文件
        if (shouldFix) {
          const fixed = fixFile(fullPath, errors);
          if (fixed) {
            console.log(`已自动修复文件: ${fullPath}`);
            // 重新检查文件，看是否还有其他错误
            const remainingErrors = checkCocosRules(fullPath);
            if (remainingErrors.length === 0) {
              hasErrors = false;
              return;
            }
            // 输出剩余的错误
            formatErrors(fullPath, remainingErrors);
            return;
          }
        }
        
        // 输出错误信息
        formatErrors(fullPath, errors);
      }
    }
  });

  return hasErrors;
}

// 执行检查
let hasErrors;
if (checkStaged) {
  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) {
    console.log('没有需要检查的暂存文件');
    process.exit(0);
  }
  hasErrors = checkFiles(stagedFiles);
} else {
  hasErrors = traverseDirectory('./assets');
}

if (hasErrors) {
  if (shouldFix) {
    console.log('\n部分问题已自动修复，但仍有需要手动修复的问题');
  }
  process.exit(1);
} else if (shouldFix) {
  console.log('\n所有可修复的问题已修复完成');
} 