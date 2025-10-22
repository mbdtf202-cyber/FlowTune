# FlowTune API 安全实施文档

## 概述

本文档详细描述了 FlowTune 后端 API 实施的安全措施，包括 XSS 防护、输入验证、速率限制、安全监控等多层安全防护机制。

## 安全架构

### 1. 多层安全防护

```
用户请求 → 安全头部 → 速率限制 → XSS防护 → 输入验证 → SQL注入防护 → 业务逻辑 → 安全监控
```

### 2. 核心安全组件

- **安全中间件** (`middleware/security.js`)
- **安全监控** (`middleware/securityMonitor.js`)
- **安全配置** (`config/security.js`)
- **安全测试** (`tests/security.test.js`)

## 实施的安全措施

### 1. XSS (跨站脚本攻击) 防护

#### 实施方式
- 使用 `DOMPurify` 清理用户输入
- 清理请求体、查询参数和URL参数
- 配置允许的HTML标签和属性

#### 代码示例
```javascript
// XSS防护中间件
export const xssProtection = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};
```

#### 防护范围
- 用户注册/登录表单
- NFT 元数据输入
- 搜索查询
- 用户资料更新

### 2. 输入验证

#### 验证规则
- **用户名**: 3-30字符，仅允许字母、数字、下划线、连字符
- **邮箱**: 标准邮箱格式验证
- **密码**: 最少8字符，包含大小写字母和数字
- **Flow地址**: 严格的十六进制格式验证 (`0x[a-fA-F0-9]{16}`)
- **URL**: 有效URL格式验证

#### 实施位置
- 认证路由 (`routes/auth.js`)
- NFT路由 (`routes/nft.js`)
- 上传路由 (`routes/upload.js`)

### 3. 速率限制

#### 限制策略

| 端点类型 | 时间窗口 | 最大请求数 | 说明 |
|---------|---------|-----------|------|
| 通用API | 15分钟 | 100次 | 一般API请求 |
| 认证相关 | 15分钟 | 10次 | 登录/注册 |
| AI生成 | 1小时 | 50次 | AI音乐生成 |
| 文件上传 | 10分钟 | 20次 | 音频/图片上传 |
| 区块链操作 | 5分钟 | 10次 | NFT铸造/交易 |

#### 实施方式
```javascript
// 认证端点速率限制
router.post('/login', 
  securityMiddleware.rateLimiters.auth,
  loginValidation, 
  authController.login
);
```

### 4. 安全头部配置

#### 实施的安全头部
- **Content Security Policy (CSP)**: 防止XSS和数据注入
- **X-Frame-Options**: 防止点击劫持
- **X-Content-Type-Options**: 防止MIME类型嗅探
- **X-XSS-Protection**: 启用浏览器XSS过滤器
- **Strict-Transport-Security**: 强制HTTPS连接
- **Referrer-Policy**: 控制引用信息泄露

#### CSP配置
```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'", "https://api.pinata.cloud", "wss:", "ws:"],
    mediaSrc: ["'self'", "https:", "blob:", "data:"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"]
  }
}
```

### 5. 文件上传安全

#### 安全检查
- **文件大小限制**: 最大50MB
- **文件类型验证**: 仅允许特定的音频和图片格式
- **文件名清理**: 移除危险字符
- **MIME类型检查**: 验证文件的实际类型

#### 允许的文件类型
```javascript
allowedAudioTypes: [
  'audio/mpeg', 'audio/wav', 'audio/mp3', 
  'audio/mp4', 'audio/aac', 'audio/ogg'
],
allowedImageTypes: [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp'
]
```

### 6. SQL注入防护

#### 防护措施
- 参数化查询
- 输入清理
- 危险模式检测

#### 检测模式
```javascript
const sqlPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
  /(--|\/\*|\*\/|;|'|")/,
  /(\bOR\b|\bAND\b).*?[=<>]/i
];
```

### 7. 安全监控和告警

#### 监控事件
- 失败的登录尝试
- 速率限制超出
- 可疑文件上传
- XSS攻击尝试
- SQL注入尝试
- 区块链操作错误

#### 告警机制
- 实时事件记录
- 阈值监控
- 可疑IP标记
- 告警冷却期

#### 告警阈值
```javascript
alertThresholds: {
  failedLoginAttempts: 5,
  rateLimitExceeded: 10,
  suspiciousFileUploads: 3,
  blockchainErrors: 5
}
```

### 8. CORS 安全配置

#### 允许的源
- `http://localhost:5173` (开发环境)
- `http://localhost:3002` (测试环境)
- 环境变量配置的源

#### 配置选项
```javascript
cors: {
  origin: [
    'http://localhost:5173',
    'http://localhost:3002',
    process.env.CORS_ORIGIN
  ],
  credentials: true,
  optionsSuccessStatus: 200
}
```

## 安全测试

### 1. 测试覆盖范围

- **速率限制测试**: 验证各种端点的限流机制
- **XSS防护测试**: 测试恶意脚本注入防护
- **输入验证测试**: 验证各种输入格式的验证
- **SQL注入测试**: 测试SQL注入攻击防护
- **文件上传测试**: 验证文件上传安全检查
- **认证安全测试**: 测试JWT令牌验证
- **CORS测试**: 验证跨域请求处理

### 2. 运行安全测试

```bash
# 运行安全测试套件
npm run test:security

# 运行安全审计
npm run security:audit

# 修复安全漏洞
npm run security:fix
```

### 3. 测试示例

```javascript
describe('XSS Protection', () => {
  it('should sanitize malicious script tags', async () => {
    const maliciousPayload = {
      title: '<script>alert("xss")</script>Music Title'
    };

    const response = await request(app)
      .post('/api/nft/mint')
      .send(maliciousPayload);

    expect(response.status).to.not.equal(200);
  });
});
```

## 区块链安全

### 1. Flow地址验证

#### 验证规则
- 必须以 `0x` 开头
- 16位十六进制字符
- 大小写不敏感

#### 实施位置
- NFT相关操作
- 用户钱包连接
- 交易验证

### 2. 智能合约安全

#### 实施的安全措施
- 版税百分比验证 (总计不超过100%)
- 重入攻击保护
- 元数据验证
- 紧急暂停机制
- 多重签名控制

## 性能和安全平衡

### 1. 缓存策略
- 速率限制计数器缓存
- 安全事件缓存
- 可疑IP列表缓存

### 2. 异步处理
- 安全日志异步写入
- 告警异步发送
- 监控数据异步处理

## 部署安全

### 1. 环境变量
```bash
# 安全相关环境变量
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your-super-secret-key
RATE_LIMIT_ENABLED=true
SECURITY_MONITORING_ENABLED=true
```

### 2. 生产环境配置
- 启用HTTPS
- 配置防火墙
- 设置日志轮转
- 配置监控告警

## 维护和更新

### 1. 定期安全检查
- 每周运行安全测试
- 每月进行依赖审计
- 季度安全评估

### 2. 安全更新流程
1. 监控安全漏洞公告
2. 评估影响范围
3. 测试安全补丁
4. 部署更新
5. 验证修复效果

### 3. 日志监控
- 实时监控安全事件
- 定期分析日志模式
- 调整安全策略

## 应急响应

### 1. 安全事件响应流程
1. **检测**: 自动监控和告警
2. **评估**: 确定事件严重程度
3. **响应**: 执行相应的应急措施
4. **恢复**: 修复漏洞并恢复服务
5. **总结**: 分析事件并改进安全措施

### 2. 紧急措施
- 临时IP封禁
- 服务降级
- 紧急暂停功能
- 回滚部署

## 合规性

### 1. 数据保护
- 用户数据加密存储
- 敏感信息脱敏
- 数据访问日志

### 2. 隐私保护
- 最小化数据收集
- 用户同意机制
- 数据删除权利

## 总结

FlowTune API 实施了全面的多层安全防护机制，包括：

✅ **XSS防护** - DOMPurify清理用户输入  
✅ **输入验证** - 严格的数据格式验证  
✅ **速率限制** - 分层限流防止滥用  
✅ **安全头部** - 全面的HTTP安全头部  
✅ **文件上传安全** - 类型和大小验证  
✅ **SQL注入防护** - 参数化查询和模式检测  
✅ **安全监控** - 实时事件监控和告警  
✅ **区块链安全** - Flow地址验证和智能合约保护  
✅ **安全测试** - 全面的安全测试套件  

这些安全措施确保了 FlowTune 平台能够安全地处理用户数据、文件上传、区块链交易等敏感操作，为用户提供可信赖的AI音乐生成和NFT交易服务。