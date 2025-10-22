// 首先导入 fetch polyfill 来解决 'Illegal invocation' 错误
import './utils/fetchPolyfill.js'

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './i18n'
import { initializeServices } from './services/index.js'

// 初始化服务
initializeServices().then(() => {
  console.log('🎵 FlowTune services initialized');
}).catch(error => {
  console.error('❌ Failed to initialize services:', error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)