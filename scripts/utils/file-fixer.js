const fs = require('fs');

/**
 * 修复文件内容
 * @param {string} filePath 文件路径
 * @param {Array<{line: number, message: string, fix?: () => string}>} errors 错误信息数组
 * @returns {boolean} 是否进行了修复
 */
function fixFile(filePath, errors) {
  const fixableErrors = errors.filter(error => error.fix);
  if (fixableErrors.length === 0) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 从后往前修复，避免行号变化影响其他修复
  fixableErrors
    .sort((a, b) => b.line - a.line)
    .forEach(error => {
      if (error.fix) {
        lines[error.line - 1] = error.fix();
      }
    });

  fs.writeFileSync(filePath, lines.join('\n'));
  return true;
}

module.exports = {
  fixFile
}; 