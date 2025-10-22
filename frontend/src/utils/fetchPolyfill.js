/**
 * Fetch Polyfill - 解决 'Illegal invocation' 错误
 * 
 * 这个模块确保所有的 fetch 调用都能正确工作，
 * 通过创建一个包装函数来避免 'Illegal invocation' 错误
 */

// 保存原始的 fetch 函数
const originalFetch = window.fetch;

// 创建一个包装函数，确保正确的 this 绑定
const safeFetch = function(...args) {
  return originalFetch.apply(window, args);
};

// 温和地替换全局 fetch
window.fetch = safeFetch;

// 导出安全的 fetch 以供直接使用
export default safeFetch;

// 也导出一个命名导出
export { safeFetch };

console.log('Fetch polyfill applied successfully');