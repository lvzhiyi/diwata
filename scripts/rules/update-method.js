const ts = require('typescript');

/**
 * 检查update方法中的变量声明
 * @param {string[]} lines 文件内容行数组
 * @returns {Array<{line: number, column: number, message: string, rule: string}>} 错误信息数组
 */
function checkUpdateMethod(lines) {
  const errors = [];
  const sourceCode = lines.join('\n');
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  function visit(node) {
    if (ts.isMethodDeclaration(node)) {
      const methodName = node.name.getText(sourceFile);
      
      if (methodName === 'update') {
        // 遍历update方法的主体
        ts.forEachChild(node.body, child => {
          
          if (ts.isVariableStatement(child)) {
            const { line, character } = sourceFile.getLineAndCharacterOfPosition(child.getStart());
            
            errors.push({
              line: line + 1,
              column: character + 1,
              message: 'update方法中不允许使用变量声明，这可能会导致性能问题',
              rule: 'cocos/no-var-in-update'
            });
          }
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return errors;
}

module.exports = checkUpdateMethod; 