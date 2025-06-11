/**
 * 检查模块之间的循环引用
 * @param {string[]} lines 文件内容按行分割的数组
 * @param {string} filePath 当前检查的文件路径
 * @returns {Array<{line: number, message: string}>} 错误信息数组
 */
function checkCircularDependencies(lines, filePath) {
  const errors = [];
  let currentImports = [];

  // 收集当前文件的导入语句
  lines.forEach((line, index) => {
    const importMatch = line.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
    if (importMatch) {
      const [, imports, path] = importMatch;
      
      // 跳过引擎模块和内置模块的检查
      if (path.startsWith('cc') || path.startsWith('db:') || !path.startsWith('.')) {
        return;
      }
      
      const importPath = require('path').resolve(require('path').dirname(filePath), path);
      
      currentImports.push({
        line: index + 1,
        path: importPath,
        symbols: imports.split(',').map(s => s.trim())
      });
    }
  });

  // 检查每个导入是否存在循环引用
  currentImports.forEach(importInfo => {
    try {
      const importedFilePath = importInfo.path + '.ts';
      if (!require('fs').existsSync(importedFilePath)) {
        return;
      }
      
      const importedContent = require('fs').readFileSync(importedFilePath, 'utf-8');
      const importedLines = importedContent.split('\n');

      // 检查被导入文件是否反向导入了当前文件
      importedLines.forEach((line, index) => {
        const reverseImportMatch = line.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
        if (reverseImportMatch) {
          const [, imports, path] = reverseImportMatch;
          if (!path.startsWith('.')) {
            return;
          }
          
          const reversePath = require('path').resolve(require('path').dirname(importedFilePath), path);

          // 如果被导入文件导入了当前文件，则存在循环引用
          if (reversePath === filePath) {
            errors.push({
              line: importInfo.line,
              message: `检测到循环引用: ${filePath} 和 ${importedFilePath} 之间存在相互导入`
            });
          }
        }
      });
    } catch (error) {
      // 如果文件不存在或无法读取，则跳过检查
      console.warn(`无法检查文件 ${importInfo.path}: ${error.message}`);
    }
  });

  return errors;
}

module.exports = checkCircularDependencies; 