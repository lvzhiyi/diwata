const checkPropertyDecorator = require('./property-decorator');
const checkPropertyTypes = require('./property-types');
const checkCodeStyle = require('./code-style');
const checkUpdateMethod = require('./update-method');

/**
 * 执行所有规则检查
 * @param {string[]} lines 文件内容按行分割的数组
 * @returns {Array<{line: number, message: string}>} 错误信息数组
 */
function runAllRules(lines) {
  return [
    ...checkPropertyDecorator(lines),
    ...checkPropertyTypes(lines),
    ...checkCodeStyle(lines),
    ...checkUpdateMethod(lines)
  ];
}

module.exports = {
  runAllRules
}; 