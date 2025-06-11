/**
 * 检查属性装饰器相关规则
 * @param {string[]} lines 文件内容按行分割的数组
 * @returns {Array<{line: number, message: string}>} 错误信息数组
 */
function checkPropertyDecorator(lines) {
  const errors = [];

  // 检查 @property 装饰器格式
  for (let i = 0; i < lines.length; i++) {
    // 检查当前行是否包含 @property 装饰器
    if (lines[i].indexOf('@property') > -1) {
      let j = i;
      let decoratorContent = lines[j];
      
      // 收集装饰器的完整内容直到找到结束括号
      while (j < lines.length && !decoratorContent.match(/\)$/)) {
        j++;
        if (j < lines.length) {
          decoratorContent += lines[j];
        }
      }
      
      // 检查装饰器内容是否包含 default 属性
      if (decoratorContent.match(/{\s*default:/)) {
        errors.push({
          line: i + 1,
          message: '属性默认值应该通过变量默认值方式定义，而不是在装饰器参数中'
        });
      }
    }
  }

  // 检查下划线开头的属性是否使用了 @property 装饰器
  lines.forEach((line, index) => {
    const propertyMatch = line.match(/@property[^]*_\w+\s*:/);
    if (propertyMatch) {
      errors.push({
        line: index + 1,
        message: '以下划线开头的属性使用了@property装饰器，在Cocos编辑器中将不可见。建议修改属性名称或移除@property装饰器'
      });
    }
  });

  return errors;
}

module.exports = checkPropertyDecorator; 