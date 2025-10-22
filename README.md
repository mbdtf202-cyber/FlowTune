# FlowTune 🎵

FlowTune 是一个基于 Flow 区块链的去中心化音乐 NFT 平台，让音乐创作者能够铸造、交易和管理他们的音乐作品 NFT。

## 🚀 快速部署到公网

### 选项1: Railway 一键部署（推荐）
```bash
./deploy-railway.sh
```

### 选项2: Vercel 部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/FlowTune)

### 选项3: Render 部署
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### 选项4: Docker 本地部署
```bash
# 需要先安装Docker Desktop
./deploy-production.sh
```

## 📖 详细文档

### 部署指南
查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 获取完整的部署说明，包括：
- 本地Docker部署
- 云平台部署（Railway, Render, DigitalOcean, VPS）
- 环境变量配置
- 故障排除

### 完整文档
- 📚 [用户指南](./docs/USER_GUIDE.md) - 平台使用说明和功能介绍
- 🔧 [开发者指南](./docs/DEVELOPER_GUIDE.md) - 技术架构和开发指南
- 🔒 [安全实施报告](./docs/API_SECURITY_IMPLEMENTATION.md) - 安全措施和防护策略
- 📋 [API文档](./docs/API_DOCUMENTATION.md) - 完整的API接口文档
- 🎬 [演示视频脚本](./docs/DEMO_VIDEO_SCRIPT.md) - 产品演示脚本
- 🛡️ [安全审计报告](./docs/SECURITY_AUDIT_REPORT.md) - 安全评估报告

## 🔧 环境变量配置

部署前需要准备以下API密钥：
- **OpenAI API Key**: 用于AI音乐生成
- **Replicate API Token**: 用于音乐模型推理
- **Pinata API Keys**: 用于IPFS存储
- **Flow区块链配置**: 用于NFT铸造（可选）

## 🎭 演示数据

项目包含完整的演示数据，包括：
- **4个演示用户**: AI Composer, Melody Master, Beat Creator, Synth Wave
- **5个演示NFT**: 涵盖不同音乐风格和价格范围
- **完整的市场数据**: 包括销售历史、统计数据等

### 运行演示数据种子脚本
```bash
cd backend
node scripts/seedDemoData.js
```

### 演示用户登录信息
- **用户名**: ai_composer | **邮箱**: composer@flowtune.demo | **密码**: DemoPass123
- **用户名**: melody_master | **邮箱**: melody@flowtune.demo | **密码**: DemoPass123
- **用户名**: beat_creator | **邮箱**: beats@flowtune.demo | **密码**: DemoPass123
- **用户名**: synth_wave | **邮箱**: synth@flowtune.demo | **密码**: DemoPass123

## 🌐 访问地址

部署完成后，您的应用将在以下地址可用：
- **Railway**: `https://your-app.railway.app`
- **Vercel**: `https://your-app.vercel.app`
- **Render**: `https://your-app.onrender.com`
- **本地**: `http://localhost`

## ✨ 特性

- 🎵 **音乐 NFT 铸造**: 支持音频文件上传和 NFT 铸造
- 🔐 **Flow 钱包集成**: 支持 Blocto、Dapper 等主流钱包
- 🎨 **现代化 UI**: 响应式设计，支持深色模式
- 🛡️ **安全防护**: 完整的安全策略和权限管理
- 📊 **实时监控**: 集成性能监控和错误追踪
- 🚀 **自动化部署**: 完整的 CI/CD 流程

## 🏗️ 技术栈

### 前端
- **React 18** - 现代化前端框架
- **React Router** - 客户端路由
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Framer Motion** - 动画库
- **React Query** - 数据获取和缓存

### 后端
- **Node.js** - 服务器运行时
- **Express.js** - Web 框架
- **PostgreSQL** - 主数据库
- **Redis** - 缓存和会话存储
- **JWT** - 身份验证

### 区块链
- **Flow Blockchain** - 主要区块链平台
- **FCL (Flow Client Library)** - Flow 客户端库
- **Cadence** - Flow 智能合约语言

### 部署
- **Docker** - 容器化
- **GitHub Actions** - CI/CD
- **Nginx** - 反向代理
- **Prometheus & Grafana** - 监控

## 🚀 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (可选)

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/your-username/flowtune.git
cd flowtune
```

2. **安装依赖**
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

4. **启动数据库**
```bash
# 使用 Docker Compose 启动数据库和 Redis
docker-compose up -d postgres redis
```

5. **运行数据库迁移**
```bash
cd backend
npm run migrate
```

6. **启动开发服务器**
```bash
# 启动后端 (端口 5000)
cd backend
npm run dev

# 启动前端 (端口 3000)
cd frontend
npm run dev
```

访问 http://localhost:3000 查看应用。

### Docker 部署

1. **构建和启动所有服务**
```bash
docker-compose up -d
```

2. **查看服务状态**
```bash
docker-compose ps
```

3. **查看日志**
```bash
docker-compose logs -f app
```

## 📁 项目结构

```
flowtune/
├── frontend/                 # React 前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── contexts/       # React Context
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── services/       # API 服务
│   │   ├── utils/          # 工具函数
│   │   └── styles/         # 样式文件
│   └── public/             # 静态资源
├── backend/                 # Node.js 后端应用
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── middleware/     # 中间件
│   │   ├── services/       # 业务逻辑
│   │   └── utils/          # 工具函数
│   └── migrations/         # 数据库迁移
├── contracts/              # Flow 智能合约
├── .github/workflows/      # GitHub Actions
├── docker-compose.yml      # Docker Compose 配置
├── Dockerfile             # Docker 镜像配置
└── deploy.sh              # 部署脚本
```

## 🔧 配置说明

### 环境变量

主要环境变量说明：

- `DATABASE_URL`: PostgreSQL 数据库连接字符串
- `REDIS_URL`: Redis 连接字符串
- `JWT_SECRET`: JWT 签名密钥
- `FLOW_ACCESS_NODE`: Flow 区块链节点地址
- `FLOW_PRIVATE_KEY`: Flow 账户私钥

详细配置请参考 `.env.example` 文件。

### Flow 钱包配置

在 `frontend/src/config/flow.js` 中配置支持的钱包：

```javascript
export const walletConfig = {
  "app.detail.title": "FlowTune",
  "app.detail.icon": "https://your-domain.com/icon.png",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "accessNode.api": process.env.REACT_APP_FLOW_ACCESS_NODE
};
```

## 🛡️ 安全特性

- **CSP (内容安全策略)**: 防止 XSS 攻击
- **CORS 配置**: 跨域请求控制
- **速率限制**: API 请求频率限制
- **输入验证**: 严格的输入数据验证
- **权限管理**: 基于角色的访问控制
- **安全监控**: 实时安全事件监控

## 📊 监控和日志

### 应用监控

- **健康检查**: `/health` 端点
- **性能指标**: Prometheus 集成
- **错误追踪**: Sentry 集成 (可选)

### 日志管理

```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f postgres

# 查看 Nginx 日志
docker-compose logs -f nginx
```

## 🚀 部署

### 生产环境部署

1. **配置生产环境变量**
```bash
export DATABASE_URL="your-production-db-url"
export REDIS_URL="your-production-redis-url"
export JWT_SECRET="your-production-jwt-secret"
# ... 其他环境变量
```

2. **运行部署脚本**
```bash
./deploy.sh production v1.0.0
```

### CI/CD 流程

项目使用 GitHub Actions 进行自动化部署：

1. **代码推送** → 触发 CI 流程
2. **代码质量检查** → ESLint、测试
3. **安全扫描** → npm audit、Snyk
4. **构建镜像** → Docker 镜像构建
5. **部署** → 自动部署到目标环境

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范

- 使用 ESLint 进行代码检查
- 遵循 Conventional Commits 规范
- 编写单元测试
- 更新相关文档

## 📝 API 文档

### 认证端点

```
POST /api/auth/login     # 用户登录
POST /api/auth/logout    # 用户登出
GET  /api/auth/profile   # 获取用户信息
```

### NFT 端点

```
GET    /api/nfts         # 获取 NFT 列表
POST   /api/nfts         # 铸造新 NFT
GET    /api/nfts/:id     # 获取 NFT 详情
PUT    /api/nfts/:id     # 更新 NFT 信息
DELETE /api/nfts/:id     # 删除 NFT
```

### 用户端点

```
GET  /api/users/:id      # 获取用户信息
PUT  /api/users/:id      # 更新用户信息
GET  /api/users/:id/nfts # 获取用户的 NFT
```

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 配置
   - 确保 PostgreSQL 服务运行正常

2. **Flow 钱包连接问题**
   - 检查 `FLOW_ACCESS_NODE` 配置
   - 确保网络连接正常

3. **文件上传失败**
   - 检查 `UPLOAD_DIR` 权限
   - 确认文件大小和类型限制

### 日志查看

```bash
# 查看应用日志
npm run logs

# 查看错误日志
npm run logs:error

# 查看访问日志
npm run logs:access
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Flow Blockchain](https://flow.com/) - 提供区块链基础设施
- [React](https://reactjs.org/) - 前端框架
- [Node.js](https://nodejs.org/) - 后端运行时
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

## 📞 联系我们

- 项目主页: https://github.com/your-username/flowtune
- 问题反馈: https://github.com/your-username/flowtune/issues
- 邮箱: contact@flowtune.com

---

⭐ 如果这个项目对你有帮助，请给我们一个 Star！

## 🏆 黑客松评分要点

### 🔧 Technology (25%) - 核心技术栈

- **Flow Blockchain**: 使用Cadence智能合约实现NFT铸造和版税分发
- **Forte Actions/Workflows**: 自动化工作流 (上传 → AI生成 → 自动铸造)
- **AI音乐生成**: 集成MusicGen/Beezie API
- **IPFS存储**: 去中心化元数据和音频文件存储
- **FCL钱包集成**: 支持Flow主流钱包连接

**端到端技术流程**: AI生成 → IPFS元数据 → Cadence NFT铸造 → 链上版税分发

### ✅ Completion (20%) - 完整功能演示

**Testnet部署信息**:
- 合约地址: `[待部署]`
- 交易哈希: `[待生成]`
- Demo链接: `[待部署]`

**完整流程演示**:
1. 🎵 AI音乐生成/上传
2. 🔗 NFT铸造上链
3. 🛒 Marketplace交易
4. 💰 版税自动分发

### 💡 Originality (10%) - 创新特色

**核心创新**: 首个将AI生成音乐与Flow Forte Actions结合，实现按播放次数实时分配版税的动态分润系统

### 🎨 UX (10%) - 用户体验

**3步核心流程**:
1. **Generate** - AI生成音乐 (1次点击)
2. **Mint** - 铸造NFT (1次签名)
3. **Trade** - 市场交易 (1次购买)

**状态反馈**: 生成中 → 铸造中 → 交易成功 (实时状态显示)

### 🚀 Adoption/Practicality (10%) - 商业模式

**目标用户**:
- 独立音乐人: 快速将创作变现
- 内容平台: 版权音乐授权
- 音乐授权市场: B2B音乐交易

**收入模式**:
- 交易手续费 (2.5%)
- AI生成订阅服务
- 企业版权授权

### ⚡ Protocol Usage (10%) - Flow特性利用

**Flow优势应用**:
- **Forte Actions**: 自动化铸造工作流
- **Cadence合约**: 安全的版税分发机制
- **高TPS**: 支持大规模音乐NFT交易
- **即时确认**: 近乎实时的交易体验

## 🏗️ 项目架构

```
FlowTune/
├── frontend/          # React + FCL前端应用
├── backend/           # Node.js API服务
├── cadence/          # Flow Cadence智能合约
├── contracts/        # 合约部署脚本
├── docs/            # 技术文档和API说明
└── assets/          # 静态资源和演示材料
```

## 🛠️ 技术实现

### 核心合约 (Cadence)

```cadence
// MusicNFT.cdc - 主要NFT合约
pub contract MusicNFT {
    pub resource NFT {
        pub let id: UInt64
        pub let metadata: {String: AnyStruct}
        pub let royalties: [Royalty]
    }
    
    pub struct Royalty {
        pub let recipient: Address
        pub let percentage: UFix64
    }
}
```

**关键代码位置**:
- NFT铸造: `cadence/contracts/MusicNFT.cdc`
- Marketplace: `cadence/contracts/Marketplace.cdc`
- FCL集成: `frontend/src/services/flow.js`

### AI音乐生成集成

```javascript
// AI音乐生成API调用
const generateMusic = async (prompt) => {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt, duration: 30 })
  });
  return response.json();
};
```

### IPFS元数据上传

```javascript
// IPFS元数据结构
const metadata = {
  title: "AI Generated Track",
  artist: userAddress,
  description: prompt,
  audioURL: ipfsAudioHash,
  coverImageURL: ipfsCoverHash,
  royalties: [
    { recipient: artist, percentage: 0.8 },
    { recipient: platform, percentage: 0.2 }
  ]
};
```

## 🎯 MVP功能清单

- [x] 项目初始化和架构设计
- [x] FCL钱包连接和用户认证
- [x] AI音乐生成集成 (MusicGen + 模拟接口)
- [x] IPFS元数据上传
- [x] Cadence NFT合约开发
- [x] Marketplace交易功能
- [x] 版税分发机制
- [x] 播放列表和音乐管理
- [x] Redis数据库集成
- [ ] Forte Actions工作流
- [ ] 数据Dashboard
- [ ] Testnet部署和测试

## 🔗 扩展功能

- [ ] QuickNode RPC优化
- [ ] MoonPay法币入金
- [ ] Dune数据分析
- [ ] 播放计次分润
- [ ] 社交分享集成

## 🚀 快速开始

```bash
# 克隆项目
git clone [repo-url]
cd FlowTune

# 安装依赖
npm install

# 启动开发环境
npm run dev

# 部署合约
npm run deploy:testnet
```

## 📊 Demo视频

[待录制 - 3分钟完整流程演示]

## 🏅 黑客松提交清单

- [ ] README技术说明 ✅
- [ ] 合约地址和交易哈希
- [ ] Demo视频链接
- [ ] 完整功能演示
- [ ] 创新点说明
- [ ] 商业模式描述

---

**联系方式**: [开发者信息]
**项目状态**: 🚧 开发中
**预计完成**: [黑客松截止日期]