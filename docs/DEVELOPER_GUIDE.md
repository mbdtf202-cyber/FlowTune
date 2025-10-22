# FlowTune 开发者指南

本文档为 FlowTune 平台的开发者提供详细的技术指南，包括架构设计、API 文档、部署指南和贡献指南。

## 📋 目录

1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [开发环境设置](#开发环境设置)
4. [API 文档](#api-文档)
5. [数据库设计](#数据库设计)
6. [区块链集成](#区块链集成)
7. [AI 服务集成](#ai-服务集成)
8. [部署指南](#部署指南)
9. [测试指南](#测试指南)
10. [贡献指南](#贡献指南)

## 🎯 项目概述

FlowTune 是一个基于 AI 的音乐 NFT 创作与交易平台，结合了以下核心技术：

- **前端**：React + Vite + Tailwind CSS
- **后端**：Node.js + Express + MongoDB
- **区块链**：Flow 区块链 + Cadence 智能合约
- **AI 服务**：MusicGen + 自定义音乐生成模型
- **存储**：IPFS + Pinata
- **认证**：JWT + Flow 钱包集成

## 🏗️ 技术架构

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Blockchain    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Flow)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Storage   │    │   Database      │    │   IPFS          │
│   (Vercel)      │    │   (MongoDB)     │    │   (Pinata)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   AI Services   │
                       │   (MusicGen)    │
                       └─────────────────┘
```

### 核心模块

1. **用户管理模块**
   - 用户注册/登录
   - 个人资料管理
   - 钱包连接

2. **AI 音乐生成模块**
   - 提示词处理
   - 音乐生成
   - 音频处理

3. **NFT 管理模块**
   - NFT 铸造
   - 元数据管理
   - 所有权追踪

4. **市场交易模块**
   - 商品列表
   - 交易处理
   - 价格发现

5. **区块链集成模块**
   - 智能合约交互
   - 交易签名
   - 事件监听

## 🛠️ 开发环境设置

### 前置要求

- Node.js 18+
- MongoDB 5.0+
- Flow CLI
- Git

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-org/flowtune.git
cd flowtune
```

2. **安装依赖**
```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

3. **环境配置**
```bash
# 后端环境变量
cp backend/.env.example backend/.env
# 编辑 .env 文件，填入必要的配置

# 前端环境变量
cp frontend/.env.example frontend/.env
# 编辑 .env 文件，填入必要的配置
```

4. **启动服务**
```bash
# 启动 MongoDB
mongod

# 启动 Flow 模拟器
flow emulator start

# 启动后端服务
cd backend
npm run dev

# 启动前端服务
cd frontend
npm run dev
```

### 环境变量配置

#### 后端 (.env)
```env
# 数据库
MONGODB_URI=mongodb://localhost:27017/flowtune

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# Flow 区块链
FLOW_NETWORK=testnet
FLOW_PRIVATE_KEY=your-flow-private-key
FLOW_ADDRESS=your-flow-address

# IPFS/Pinata
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_API_KEY=your-pinata-secret-key

# AI 服务
MUSICGEN_API_URL=http://localhost:8000
MUSICGEN_API_KEY=your-musicgen-api-key

# 邮件服务
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# 安全配置
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### 前端 (.env)
```env
# API 配置
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000

# Flow 配置
VITE_FLOW_NETWORK=testnet
VITE_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# 应用配置
VITE_APP_NAME=FlowTune
VITE_APP_VERSION=1.0.0
```

## 📚 API 文档

### 认证 API

#### POST /api/auth/register
注册新用户

**请求体：**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "flowAddress": "string"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "email": "string",
      "flowAddress": "string"
    },
    "token": "string"
  }
}
```

#### POST /api/auth/login
用户登录

**请求体：**
```json
{
  "email": "string",
  "password": "string"
}
```

### AI 音乐生成 API

#### POST /api/ai/generate
生成音乐

**请求体：**
```json
{
  "prompt": "string",
  "duration": "number",
  "genre": "string",
  "bpm": "number",
  "key": "string"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "audioUrl": "string",
    "metadata": {
      "duration": "number",
      "genre": "string",
      "bpm": "number",
      "key": "string"
    }
  }
}
```

### NFT API

#### POST /api/nft/mint
铸造 NFT

**请求体：**
```json
{
  "title": "string",
  "description": "string",
  "audioFile": "File",
  "coverImage": "File",
  "price": "string",
  "royalty": "number"
}
```

#### GET /api/nft/marketplace
获取市场 NFT 列表

**查询参数：**
- `page`: 页码
- `limit`: 每页数量
- `genre`: 音乐风格
- `priceMin`: 最低价格
- `priceMax`: 最高价格
- `sortBy`: 排序方式

### 用户 API

#### GET /api/user/profile
获取用户资料

#### PUT /api/user/profile
更新用户资料

#### GET /api/user/nfts
获取用户 NFT 列表

## 🗄️ 数据库设计

### 用户模型 (User)
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String, // 加密存储
  flowAddress: String,
  profile: {
    displayName: String,
    bio: String,
    avatar: String,
    website: String,
    twitter: String,
    instagram: String
  },
  stats: {
    nftsCreated: Number,
    nftsOwned: Number,
    totalEarnings: String,
    followers: Number,
    following: Number
  },
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 音乐 NFT 模型 (MusicNFT)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  creator: String, // Flow 地址
  owner: String, // Flow 地址
  files: {
    audio: {
      ipfsHash: String,
      url: String,
      duration: Number
    },
    cover: {
      ipfsHash: String,
      url: String
    },
    metadata: {
      ipfsHash: String,
      url: String
    }
  },
  blockchain: {
    tokenId: String,
    contractAddress: String,
    transactionHash: String,
    blockNumber: Number,
    network: String
  },
  metadata: {
    genre: String,
    bpm: Number,
    key: String,
    aiModel: String,
    prompt: String,
    tags: [String],
    mood: String,
    energy: String
  },
  market: {
    isForSale: Boolean,
    price: String,
    currency: String,
    listedAt: Date,
    views: Number,
    likes: Number,
    shares: Number
  },
  royalties: [{
    recipient: String,
    percentage: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## ⛓️ 区块链集成

### Flow 智能合约

#### MusicNFT 合约
```cadence
pub contract MusicNFT: NonFungibleToken {
    pub var totalSupply: UInt64
    
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Minted(id: UInt64, recipient: Address, metadata: {String: String})
    
    pub resource NFT: NonFungibleToken.INFT {
        pub let id: UInt64
        pub let metadata: {String: String}
        
        init(id: UInt64, metadata: {String: String}) {
            self.id = id
            self.metadata = metadata
        }
    }
    
    pub resource Collection: NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}
        
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")
            emit Withdraw(id: token.id, from: self.owner?.address)
            return <-token
        }
        
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @MusicNFT.NFT
            let id: UInt64 = token.id
            let oldToken <- self.ownedNFTs[id] <- token
            emit Deposit(id: id, to: self.owner?.address)
            destroy oldToken
        }
        
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }
        
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)!
        }
        
        destroy() {
            destroy self.ownedNFTs
        }
        
        init () {
            self.ownedNFTs <- {}
        }
    }
    
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }
    
    pub fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}, metadata: {String: String}) {
        let newNFT <- create NFT(id: MusicNFT.totalSupply, metadata: metadata)
        emit Minted(id: newNFT.id, recipient: recipient.owner!.address, metadata: metadata)
        recipient.deposit(token: <-newNFT)
        MusicNFT.totalSupply = MusicNFT.totalSupply + 1
    }
    
    init() {
        self.totalSupply = 0
        emit ContractInitialized()
    }
}
```

### 区块链交互

#### 铸造 NFT
```javascript
import * as fcl from "@onflow/fcl"

const mintNFT = async (metadata) => {
  const transactionId = await fcl.mutate({
    cadence: `
      import MusicNFT from 0xMusicNFTContract
      import NonFungibleToken from 0xNonFungibleToken
      
      transaction(recipient: Address, metadata: {String: String}) {
        let minter: &MusicNFT.NFTMinter
        
        prepare(signer: AuthAccount) {
          self.minter = signer.borrow<&MusicNFT.NFTMinter>(from: MusicNFT.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")
        }
        
        execute {
          let recipient = getAccount(recipient)
          let receiver = recipient
            .getCapability(MusicNFT.CollectionPublicPath)!
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get receiver reference to the NFT Collection")
          
          self.minter.mintNFT(recipient: receiver, metadata: metadata)
        }
      }
    `,
    args: (arg, t) => [
      arg(metadata.recipient, t.Address),
      arg(metadata, t.Dictionary({ key: t.String, value: t.String }))
    ],
    payer: fcl.authz,
    proposer: fcl.authz,
    authorizations: [fcl.authz],
    limit: 1000
  })
  
  return transactionId
}
```

## 🤖 AI 服务集成

### MusicGen 集成

#### 音乐生成服务
```javascript
import axios from 'axios';

class MusicGenService {
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }
  
  async generateMusic(prompt, options = {}) {
    try {
      const response = await this.client.post('/generate', {
        prompt,
        duration: options.duration || 30,
        temperature: options.temperature || 0.8,
        top_k: options.top_k || 250,
        top_p: options.top_p || 0.0,
        cfg_coef: options.cfg_coef || 3.0
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Music generation failed: ${error.message}`);
    }
  }
  
  async getGenerationStatus(jobId) {
    try {
      const response = await this.client.get(`/status/${jobId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get generation status: ${error.message}`);
    }
  }
}

export default MusicGenService;
```

## 🚀 部署指南

### 生产环境部署

#### 1. 服务器要求
- CPU: 4 核心以上
- 内存: 8GB 以上
- 存储: 100GB SSD
- 网络: 100Mbps 带宽

#### 2. Docker 部署

**Dockerfile (后端)**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/flowtune
    depends_on:
      - mongo
      - redis
    
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    
  mongo:
    image: mongo:5.0
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mongo_data:
```

#### 3. 部署脚本
```bash
#!/bin/bash

# 部署脚本
echo "Starting FlowTune deployment..."

# 拉取最新代码
git pull origin main

# 构建 Docker 镜像
docker-compose build

# 停止旧服务
docker-compose down

# 启动新服务
docker-compose up -d

# 等待服务启动
sleep 30

# 健康检查
curl -f http://localhost:3000/health || exit 1

echo "Deployment completed successfully!"
```

### 监控和日志

#### 1. 应用监控
```javascript
// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

#### 2. 日志配置
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'flowtune-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

## 🧪 测试指南

### 单元测试

#### 后端测试
```javascript
// tests/auth.test.js
import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';

describe('Authentication', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123',
        flowAddress: '0x1234567890123456'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).to.be.true;
      expect(response.body.data.user.username).to.equal(userData.username);
    });
  });
});
```

#### 前端测试
```javascript
// tests/components/MusicPlayer.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import MusicPlayer from '../src/components/MusicPlayer';

test('renders music player with play button', () => {
  const mockTrack = {
    title: 'Test Track',
    audioUrl: 'test-audio.mp3'
  };
  
  render(<MusicPlayer track={mockTrack} />);
  
  const playButton = screen.getByRole('button', { name: /play/i });
  expect(playButton).toBeInTheDocument();
});

test('plays music when play button is clicked', () => {
  const mockTrack = {
    title: 'Test Track',
    audioUrl: 'test-audio.mp3'
  };
  
  render(<MusicPlayer track={mockTrack} />);
  
  const playButton = screen.getByRole('button', { name: /play/i });
  fireEvent.click(playButton);
  
  expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
});
```

### 集成测试

#### API 集成测试
```javascript
// tests/integration/nft.test.js
import { expect } from 'chai';
import request from 'supertest';
import app from '../src/app.js';

describe('NFT Integration', () => {
  let authToken;
  
  before(async () => {
    // 登录获取 token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123'
      });
    
    authToken = loginResponse.body.data.token;
  });
  
  it('should mint NFT successfully', async () => {
    const response = await request(app)
      .post('/api/nft/mint')
      .set('Authorization', `Bearer ${authToken}`)
      .field('title', 'Test NFT')
      .field('description', 'Test Description')
      .field('price', '10.0')
      .attach('audioFile', 'tests/fixtures/test-audio.mp3')
      .attach('coverImage', 'tests/fixtures/test-cover.jpg')
      .expect(201);
    
    expect(response.body.success).to.be.true;
    expect(response.body.data.nft.title).to.equal('Test NFT');
  });
});
```

### 运行测试

```bash
# 后端测试
cd backend
npm test
npm run test:coverage

# 前端测试
cd frontend
npm test
npm run test:coverage

# 安全测试
npm run test:security

# E2E 测试
npm run test:e2e
```

## 🤝 贡献指南

### 开发流程

1. **Fork 项目**
2. **创建功能分支**
   ```bash
   git checkout -b feature/new-feature
   ```
3. **提交更改**
   ```bash
   git commit -m "Add new feature"
   ```
4. **推送分支**
   ```bash
   git push origin feature/new-feature
   ```
5. **创建 Pull Request**

### 代码规范

#### JavaScript/TypeScript
- 使用 ESLint 和 Prettier
- 遵循 Airbnb 代码规范
- 使用 JSDoc 注释

#### Git 提交规范
```
type(scope): description

[optional body]

[optional footer]
```

**类型：**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 代码审查

所有 Pull Request 必须经过代码审查：

1. **功能完整性**：确保功能按预期工作
2. **代码质量**：遵循项目代码规范
3. **测试覆盖**：包含适当的测试
4. **文档更新**：更新相关文档
5. **安全检查**：确保没有安全漏洞

### 发布流程

1. **版本号管理**：遵循语义化版本控制
2. **变更日志**：更新 CHANGELOG.md
3. **标签创建**：创建 Git 标签
4. **部署验证**：在测试环境验证
5. **生产部署**：部署到生产环境

---

**感谢您对 FlowTune 项目的贡献！** 🎵

如果您有任何技术问题或建议，请通过 GitHub Issues 或开发者社区联系我们。