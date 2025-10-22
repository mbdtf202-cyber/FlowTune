# FlowTune 技术文档

## 📋 目录

1. [项目概述](#项目概述)
2. [技术架构](#技术架构)
3. [核心功能实现](#核心功能实现)
4. [智能合约详解](#智能合约详解)
5. [API接口文档](#api接口文档)
6. [部署指南](#部署指南)
7. [测试指南](#测试指南)

## 项目概述

FlowTune是一个基于Flow区块链的AI音乐NFT平台，结合了AI音乐生成、NFT铸造、数字资产交易和版税管理等功能。

### 核心特性

- **AI音乐生成**: 集成MusicGen模型，支持文本到音乐的生成
- **NFT铸造**: 使用Cadence智能合约实现音乐NFT的铸造
- **数字资产交易**: 完整的NFT交易市场
- **版税管理**: 自动化的版税分配系统
- **Flow钱包集成**: 支持FCL钱包连接

## 技术架构

### 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │ Flow Blockchain │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Cadence)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FCL Wallet    │    │     Redis       │    │      IPFS       │
│   Integration   │    │   Database      │    │    Storage      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技术栈

**前端**:
- React 18
- Tailwind CSS
- FCL (Flow Client Library)
- Lucide React Icons

**后端**:
- Node.js + Express
- Redis (数据存储)
- IPFS (文件存储)
- AI服务集成

**区块链**:
- Flow Blockchain
- Cadence智能合约
- FCL钱包集成

## 核心功能实现

### 1. 用户认证系统

#### Flow钱包集成

```javascript
// frontend/src/services/flow.js
import * as fcl from "@onflow/fcl"

// FCL配置
fcl.config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "0xProfile": "0xba1132bc08f82fe2"
})

// 用户认证
export const authenticate = () => fcl.authenticate()
export const unauthenticate = () => fcl.unauthenticate()
```

#### 认证状态管理

```javascript
// frontend/src/contexts/AuthContext.jsx
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    fcl.currentUser.subscribe(setUser)
  }, [])

  // 认证逻辑...
}
```

### 2. AI音乐生成

#### MusicGen集成

```javascript
// backend/src/services/aiService.js
class AIService {
  async generateMusicWithMusicGen(prompt, duration = 30) {
    const response = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: "7a76a8258b23fae65c5a22debb8841d1d7e816b75c2f24218cd2bd8573787906",
        input: {
          prompt: prompt,
          model_version: "stereo-large",
          output_format: "mp3",
          duration: duration
        }
      },
      {
        headers: {
          'Authorization': `Token ${this.replicateToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    return await this.pollPrediction(response.data.id)
  }
}
```

#### 音乐生成API

```javascript
// backend/src/routes/ai.js
router.post('/generate', aiRateLimiter, async (req, res) => {
  const { prompt, duration, genre, mood } = req.body
  
  // 生成音乐
  const generationResult = await aiService.generateMusicWithMusicGen(prompt, duration)
  
  // 生成描述
  const description = await aiService.generateMusicDescription(prompt, genre, mood)
  
  // 生成封面
  const coverArt = await aiService.generateCoverArt(prompt, 'abstract')
  
  res.json({
    success: true,
    generation: {
      audioUrl: generationResult.audioUrl,
      coverImageUrl: coverArt.imageUrl,
      metadata: { title, artist, description, genre, mood, duration, prompt }
    }
  })
})
```

### 3. IPFS存储

#### 文件上传服务

```javascript
// backend/src/services/ipfsService.js
class IPFSService {
  async uploadAudioFromUrl(audioUrl, filename) {
    // 下载音频文件
    const response = await axios.get(audioUrl, { responseType: 'stream' })
    
    // 上传到IPFS
    const formData = new FormData()
    formData.append('file', response.data, filename)
    
    const uploadResponse = await axios.post(
      `${this.pinataApiUrl}/pinning/pinFileToIPFS`,
      formData,
      { headers: { ...this.pinataHeaders, ...formData.getHeaders() } }
    )
    
    return {
      hash: uploadResponse.data.IpfsHash,
      url: `${this.ipfsGateway}/${uploadResponse.data.IpfsHash}`,
      size: uploadResponse.data.PinSize
    }
  }
}
```

### 4. NFT铸造

#### Cadence智能合约

```cadence
// cadence/contracts/MusicNFT.cdc
pub contract MusicNFT: NonFungibleToken {
    pub var totalSupply: UInt64
    
    pub struct MusicMetadata {
        pub let title: String
        pub let artist: String
        pub let description: String
        pub let audioURL: String
        pub let coverImageURL: String
        pub let genre: String
        pub let duration: UInt32
        pub let royalties: [Royalty]
    }
    
    pub resource NFT: NonFungibleToken.INFT {
        pub let id: UInt64
        pub let metadata: MusicMetadata
        pub var playCount: UInt64
        pub var totalEarnings: UFix64
        
        pub fun incrementPlayCount() {
            self.playCount = self.playCount + 1
        }
    }
}
```

#### 铸造交易

```cadence
// cadence/transactions/mint_music_nft.cdc
transaction(
    recipient: Address,
    title: String,
    artist: String,
    description: String,
    audioURL: String,
    coverImageURL: String,
    genre: String,
    duration: UInt32,
    royaltyRecipients: [Address],
    royaltyPercentages: [UFix64]
) {
    let minter: &MusicNFT.NFTMinter
    let recipientCollectionRef: &{NonFungibleToken.CollectionPublic}
    
    prepare(signer: AuthAccount) {
        self.minter = signer.borrow<&MusicNFT.NFTMinter>(from: MusicNFT.MinterStoragePath)
            ?? panic("Could not borrow a reference to the NFT minter")
        
        self.recipientCollectionRef = getAccount(recipient)
            .getCapability(MusicNFT.CollectionPublicPath)
            .borrow<&{NonFungibleToken.CollectionPublic}>()
            ?? panic("Could not get receiver reference to the NFT Collection")
    }
    
    execute {
        // 创建版税结构
        let royalties: [MusicNFT.Royalty] = []
        var i = 0
        while i < royaltyRecipients.length {
            royalties.append(MusicNFT.Royalty(
                recipient: royaltyRecipients[i],
                percentage: royaltyPercentages[i],
                description: "Creator royalty"
            ))
            i = i + 1
        }
        
        // 创建元数据
        let metadata = MusicNFT.MusicMetadata(
            title: title,
            artist: artist,
            description: description,
            audioURL: audioURL,
            coverImageURL: coverImageURL,
            genre: genre,
            duration: duration,
            royalties: royalties
        )
        
        // 铸造NFT
        self.minter.mintNFT(
            recipient: self.recipientCollectionRef,
            metadata: metadata
        )
    }
}
```

### 5. 数字资产交易市场

#### 市场合约

```cadence
// cadence/contracts/Marketplace.cdc
pub contract Marketplace {
    pub resource Listing {
        pub let details: ListingDetails
        access(self) let nft: @NonFungibleToken.NFT
        access(self) let saleCut: Capability<&{FungibleToken.Receiver}>
        
        pub fun purchase(
            payment: @FungibleToken.Vault,
            buyerCollection: &{NonFungibleToken.CollectionPublic},
            buyerAddress: Address
        ) {
            // 计算和分配版税
            let nftRef = &self.nft as &NonFungibleToken.NFT
            let musicNFT = nftRef as! &MusicNFT.NFT
            
            var remainingPayment <- payment
            
            // 分配版税
            for royalty in musicNFT.metadata.royalties {
                let royaltyAmount = self.details.price * royalty.percentage
                let royaltyPayment <- remainingPayment.withdraw(amount: royaltyAmount)
                
                let recipient = getAccount(royalty.recipient)
                let receiverRef = recipient.getCapability(/public/flowTokenReceiver)
                    .borrow<&{FungibleToken.Receiver}>()!
                
                receiverRef.deposit(from: <-royaltyPayment)
            }
            
            // 发送剩余款项给卖家
            self.saleCut.borrow()!.deposit(from: <-remainingPayment)
            
            // 转移NFT给买家
            let nft <- self.nft
            buyerCollection.deposit(token: <-nft)
        }
    }
}
```

### 6. 版税管理系统

#### 版税分配器

```cadence
// cadence/contracts/RoyaltyDistributor.cdc
pub contract RoyaltyDistributor {
    pub resource RoyaltyPool {
        pub let nftID: UInt64
        pub var totalRevenue: UFix64
        pub var playCount: UInt64
        access(self) let vault: @FlowToken.Vault
        
        pub fun addRevenue(payment: @FungibleToken.Vault, source: String) {
            let amount = payment.balance
            self.vault.deposit(from: <-payment)
            self.totalRevenue = self.totalRevenue + amount
        }
        
        pub fun distributePlayBasedRoyalties(
            royalties: [MusicNFT.Royalty],
            minPlayThreshold: UInt64
        ) {
            if self.playCount < minPlayThreshold { return }
            
            let availableAmount = self.vault.balance
            let distributionAmount = self.calculatePlayBasedDistribution(availableAmount)
            
            for royalty in royalties {
                let royaltyAmount = distributionAmount * royalty.percentage
                if royaltyAmount > 0.0 {
                    let payment <- self.vault.withdraw(amount: royaltyAmount)
                    
                    let recipient = getAccount(royalty.recipient)
                    let receiverRef = recipient.getCapability(/public/flowTokenReceiver)
                        .borrow<&{FungibleToken.Receiver}>()!
                    
                    receiverRef.deposit(from: <-payment)
                }
            }
        }
    }
}
```

## API接口文档

### 认证接口

#### POST /api/auth/login
用户登录

**请求体**:
```json
{
  "address": "0x1234567890abcdef",
  "signature": "signature_string"
}
```

**响应**:
```json
{
  "success": true,
  "user": {
    "address": "0x1234567890abcdef",
    "profile": { ... }
  },
  "token": "jwt_token"
}
```

### AI音乐生成接口

#### POST /api/ai/generate
生成AI音乐

**请求体**:
```json
{
  "prompt": "A peaceful piano melody",
  "duration": 30,
  "genre": "classical",
  "mood": "calm"
}
```

**响应**:
```json
{
  "success": true,
  "generation": {
    "id": "prediction_id",
    "audioUrl": "https://ipfs.io/ipfs/...",
    "coverImageUrl": "https://ipfs.io/ipfs/...",
    "metadata": {
      "title": "AI Generated Classical",
      "artist": "AI Composer",
      "description": "A peaceful piano melody...",
      "genre": "classical",
      "duration": 30
    }
  }
}
```

### NFT接口

#### POST /api/nft/mint
铸造音乐NFT

**请求体**:
```json
{
  "metadata": {
    "title": "My Music",
    "artist": "Artist Name",
    "description": "Description",
    "audioURL": "ipfs://...",
    "coverImageURL": "ipfs://...",
    "genre": "electronic",
    "duration": 180
  },
  "royalties": [
    {
      "recipient": "0x1234...",
      "percentage": 0.8,
      "description": "Artist royalty"
    }
  ]
}
```

### 市场接口

#### GET /api/marketplace/nfts
获取市场NFT列表

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `genre`: 音乐类型过滤
- `sort`: 排序方式 (newest, price_low, price_high)

**响应**:
```json
{
  "success": true,
  "nfts": [
    {
      "id": "1",
      "title": "Cosmic Dreams",
      "artist": "AI Composer",
      "price": "5.0",
      "currency": "FLOW",
      "genre": "Electronic",
      "coverImage": "ipfs://...",
      "audioUrl": "ipfs://..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## 部署指南

### 环境要求

- Node.js 18+
- Redis 6+
- Flow CLI

### 环境变量配置

创建 `.env` 文件:

```bash
# 后端配置
PORT=3001
NODE_ENV=development
REDIS_URL=redis://localhost:6379

# AI服务配置
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key

# IPFS配置
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs

# Flow配置
FLOW_NETWORK=testnet
FLOW_PRIVATE_KEY=your_flow_private_key
```

### 本地开发部署

1. **安装依赖**:
```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

2. **启动Redis**:
```bash
brew install redis
brew services start redis
```

3. **启动后端服务**:
```bash
cd backend
npm run dev
```

4. **启动前端服务**:
```bash
cd frontend
npm run dev
```

### 智能合约部署

1. **配置Flow CLI**:
```bash
flow config init
```

2. **部署合约到测试网**:
```bash
flow accounts create --network testnet
flow project deploy --network testnet
```

### 生产环境部署

1. **构建前端**:
```bash
cd frontend
npm run build
```

2. **部署到服务器**:
```bash
# 使用PM2管理进程
npm install -g pm2
pm2 start ecosystem.config.js
```

## 测试指南

### 单元测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

### 集成测试

```bash
# 端到端测试
npm run test:e2e
```

### 智能合约测试

```bash
# Cadence测试
flow test
```

### 测试用例

1. **用户认证流程测试**
2. **AI音乐生成测试**
3. **NFT铸造测试**
4. **市场交易测试**
5. **版税分配测试**

## 性能优化

### 前端优化

- 代码分割和懒加载
- 图片优化和CDN
- 缓存策略

### 后端优化

- Redis缓存
- API限流
- 数据库索引优化

### 区块链优化

- 批量交易处理
- Gas费优化
- 事件监听优化

## 安全考虑

### 智能合约安全

- 访问控制
- 重入攻击防护
- 整数溢出防护

### API安全

- JWT认证
- 请求限流
- 输入验证

### 数据安全

- 敏感数据加密
- HTTPS传输
- 定期安全审计

---

**文档版本**: v1.0
**最后更新**: 2024年1月
**维护者**: FlowTune开发团队