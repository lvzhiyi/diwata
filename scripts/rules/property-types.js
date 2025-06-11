/**
 * 检查属性类型相关规则
 * @param {string[]} lines 文件内容按行分割的数组
 * @returns {Array<{line: number, message: string}>} 错误信息数组
 */
function checkPropertyTypes(lines) {
  const errors = [];
  let inPropertyDecorator = false;
  let decoratorContent = '';
  let lineStart = 0;

  // 检查是否导入了SystemEvent
  lines.forEach((line, index) => {
    const systemEventImport = line.match(/import\s*{[^}]*SystemEvent[^}]*}\s*from\s*['"]cc['"]/);
    if (systemEventImport) {
      errors.push({
        line: index + 1,
        message: 'SystemEvent API已过时，请使用Input模块的API代替'
      });
    }
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查装饰器开始
    if (line.includes('@property')) {
      inPropertyDecorator = true;
      decoratorContent = line;
      lineStart = i;
      
      // 如果装饰器没有在当前行结束，继续收集
      if (!line.includes(')')) {
        continue;
      }
    }
    
    // 继续收集多行装饰器内容
    if (inPropertyDecorator && !line.includes(')')) {
      decoratorContent += line;
      continue;
    }
    
    // 装饰器结束，开始处理属性定义
    if (inPropertyDecorator && (line.includes(')') || line.includes('private') || line.includes('public'))) {
      if (line.includes(')')) {
        decoratorContent += line;
      }
      
      // 获取下一行的属性定义
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      const propertyLine = line.includes(')') ? nextLine : line;
      
      // 检查number类型属性
      if (propertyLine.includes(': number')) {
        const hasDefaultValue = propertyLine.includes('=');
        let defaultValue = '';
        
        if (hasDefaultValue) {
          const match = propertyLine.match(/=\s*([\d.]+)/);
          if (match) {
            defaultValue = match[1];
          }
        }
        
        const hasDecimal = defaultValue.includes('.');
        
        if (hasDecimal && !decoratorContent.includes('CCFloat')) {
          errors.push({
            line: lineStart + 1,
            message: '小数类型的属性必须使用CCFloat类型'
          });
        } else if (!hasDecimal && !hasDefaultValue && !decoratorContent.includes('CCInteger')) {
          errors.push({
            line: lineStart + 1,
            message: '整数类型的属性必须使用CCInteger类型'
          });
        }
      }
      
      // 检查string类型属性
      if (propertyLine.includes(': string')) {
        const hasDefaultValue = propertyLine.includes('=');
        if (!hasDefaultValue && !decoratorContent.includes('CCString')) {
          errors.push({
            line: lineStart + 1,
            message: '未带默认值的string类型属性应使用CCString类型'
          });
        }
      }
      
      // 检查boolean类型属性
      if (propertyLine.includes(': boolean')) {
        const hasDefaultValue = propertyLine.includes('=');
        if (!hasDefaultValue && !decoratorContent.includes('CCBoolean')) {
          errors.push({
            line: lineStart + 1,
            message: '未带默认值的boolean类型属性应使用CCBoolean类型'
          });
        }
      }
      
      inPropertyDecorator = false;
      decoratorContent = '';
    }
  }

  return errors;
}

module.exports = checkPropertyTypes; 