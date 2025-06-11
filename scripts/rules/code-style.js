const ts = require('typescript');

/**
 * 解析源代码获取语法树和注释信息
 * @param {string} sourceText 源代码文本
 * @returns {{ast: ts.SourceFile, comments: {pos: number, end: number, kind: string, text: string}[]}} 语法树和注释信息
 */
function parseSourceCode(sourceText) {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  const comments = [];
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    ts.LanguageVariant.Standard,
    sourceText
  );

  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    const tokenStart = scanner.getStartPos();

    if (token === ts.SyntaxKind.SingleLineCommentTrivia ||
        token === ts.SyntaxKind.MultiLineCommentTrivia) {
      comments.push({
        pos: tokenStart,
        end: scanner.getTextPos(),
        kind: token === ts.SyntaxKind.SingleLineCommentTrivia ? 'single' : 'multi',
        text: sourceText.substring(tokenStart, scanner.getTextPos())
      });
    }

    token = scanner.scan();
  }

  return { ast: sourceFile, comments };
}

/**
 * 判断节点是否需要文档注释
 * @param {ts.Node} node TypeScript AST 节点
 * @returns {boolean} 是否需要文档注释
 */
function needsDocumentation(node) {
  switch (node.kind) {
    case ts.SyntaxKind.PropertyDeclaration:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.EnumMember:
    case ts.SyntaxKind.InterfaceDeclaration:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.EnumDeclaration:
    case ts.SyntaxKind.TypeAliasDeclaration:
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.MethodSignature:
    case ts.SyntaxKind.PropertySignature:
    case ts.SyntaxKind.Parameter:
      return true;
    case ts.SyntaxKind.VariableDeclaration:
      return node.parent && (
        node.parent.flags & ts.NodeFlags.Export ||
        node.parent.kind === ts.SyntaxKind.PropertyDeclaration
      );
    default:
      return false;
  }
}

/**
 * 判断注释是否是代码块内的注释
 * @param {number} commentPos 注释位置
 * @param {ts.Node} node AST 节点
 * @returns {boolean} 是否是代码块内的注释
 */
function isCommentInsideBlock(commentPos, node) {
  if (ts.isBlock(node)) {
    return commentPos > node.pos && commentPos < node.end;
  }
  
  let isInside = false;
  node.forEachChild(child => {
    if (isCommentInsideBlock(commentPos, child)) {
      isInside = true;
    }
  });
  return isInside;
}

/**
 * 检查代码风格相关规则
 * @param {string[]} lines 文件内容按行分割的数组
 * @returns {Array<{line: number, message: string, fix?: () => string}>} 错误信息数组
 */
function checkCodeStyle(lines) {
  const errors = [];
  const sourceText = lines.join('\n');
  const { ast, comments } = parseSourceCode(sourceText);

  comments.forEach(comment => {
    const lineNumber = sourceText.substring(0, comment.pos).split('\n').length;
    
    let nextNode = null;
    ts.forEachChild(ast, node => {
      if (node.pos > comment.end && !nextNode) {
        nextNode = node;
      }
    });

    if (comment.text.match(/\/\/\s*@property/)) {
      errors.push({
        line: lineNumber,
        message: '属性注释应使用 /** */ 格式',
        fix: () => comment.text.replace(/\/\/\s*(@property.*)/, '/** $1 */')
      });
      return;
    }

    // 检查是否是代码块内的注释
    const isInBlock = isCommentInsideBlock(comment.pos, ast);
    
    // 如果是代码块内的注释，应该使用单行注释格式
    if (comment.kind === 'multi' && isInBlock) {
      errors.push({
        line: lineNumber,
        message: '代码块内的注释应使用 // 格式',
        fix: () => comment.text.replace(/\/\*\s*(.*?)\s*\*\//, '// $1')
      });
      return;
    }

    // 检查是否需要文档注释格式
    if (comment.kind === 'single' && nextNode && needsDocumentation(nextNode) && !isInBlock) {
      errors.push({
        line: lineNumber,
        message: '属性、方法、类型等定义的注释应使用 /** */ 格式',
        fix: () => comment.text.replace(/\/\/\s*(.*)/, '/** $1 */')
      });
    }
  });

  // 检查 ES6+ 方法使用
  lines.forEach((line, index) => {
    if (line.match(/\.includes\(/)) {
      errors.push({
        line: index + 1,
        message: '避免使用 .includes() 方法，建议使用 indexOf'
      });
    }
  });

  return errors;
}

module.exports = checkCodeStyle; 