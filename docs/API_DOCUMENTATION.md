# FlowTune API 文档

## 📋 目录

1. [API概述](#api概述)
2. [认证](#认证)
3. [用户管理](#用户管理)
4. [AI音乐生成](#ai音乐生成)
5. [NFT管理](#nft管理)
6. [市场交易](#市场交易)
7. [播放列表](#播放列表)
8. [版税管理](#版税管理)
9. [错误处理](#错误处理)
10. [限流策略](#限流策略)

## API概述

### 基础信息

- **Base URL**: `http://localhost:3001/api`
- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **认证方式**: JWT Token

### 通用响应格式

**成功响应**:
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误类型",
  "message": "错误描述",
  "code": 400
}
```

## 认证

### POST /auth/login
用户登录

**请求头**:
```
Content-Type: application/json
```

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
  "data": {
    "user": {
      "id": "user_id",
      "address": "0x1234567890abcdef",
      "profile": {
        "name": "用户名",
        "avatar": "头像URL",
        "bio": "个人简介"
      },
      "stats": {
        "nftsOwned": 5,
        "nftsCreated": 3,
        "totalEarnings": "12.5"
      }
    },
    "token": "jwt_token_string"
  },
  "message": "登录成功"
}
```

### POST /auth/logout
用户登出

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "message": "登出成功"
}
```

### GET /auth/profile
获取用户资料

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "address": "0x1234567890abcdef",
    "profile": {
      "name": "用户名",
      "avatar": "头像URL",
      "bio": "个人简介",
      "website": "个人网站",
      "twitter": "Twitter用户名"
    },
    "stats": {
      "nftsOwned": 5,
      "nftsCreated": 3,
      "totalEarnings": "12.5",
      "totalPlays": 1234
    },
    "preferences": {
      "theme": "dark",
      "language": "zh-CN",
      "notifications": true
    }
  }
}
```

## 用户管理

### PUT /users/profile
更新用户资料

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "profile": {
    "name": "新用户名",
    "bio": "新的个人简介",
    "avatar": "新头像URL",
    "website": "https://example.com",
    "twitter": "username"
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "profile": { ... }
  },
  "message": "资料更新成功"
}
```

### GET /users/:address/nfts
获取用户的NFT列表

**路径参数**:
- `address`: 用户地址

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `status`: NFT状态 (all, for_sale, not_for_sale)

**响应**:
```json
{
  "success": true,
  "data": {
    "nfts": [
      {
        "id": "nft_id",
        "tokenId": "1",
        "title": "音乐标题",
        "artist": "艺术家",
        "description": "描述",
        "genre": "电子音乐",
        "duration": 180,
        "coverImage": "封面图片URL",
        "audioUrl": "音频URL",
        "price": "5.0",
        "currency": "FLOW",
        "isForSale": true,
        "playCount": 123,
        "likes": 45,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

## AI音乐生成

### POST /ai/generate
生成AI音乐

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "prompt": "一首平静的钢琴旋律",
  "title": "AI生成音乐",
  "artist": "AI作曲家",
  "genre": "古典",
  "mood": "平静",
  "duration": 30
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "generation": {
      "id": "generation_id",
      "audioUrl": "https://ipfs.io/ipfs/audio_hash",
      "coverImageUrl": "https://ipfs.io/ipfs/cover_hash",
      "metadata": {
        "title": "AI生成古典音乐",
        "artist": "AI作曲家",
        "description": "基于提示词生成的平静钢琴旋律",
        "genre": "古典",
        "mood": "平静",
        "duration": 30,
        "prompt": "一首平静的钢琴旋律",
        "aiModel": "musicgen-stereo-large",
        "generatedAt": "2024-01-15T10:00:00Z"
      }
    }
  },
  "message": "音乐生成成功"
}
```

### POST /ai/upload-to-ipfs
上传生成的音乐到IPFS

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "audioUrl": "生成的音频URL",
  "coverImageUrl": "封面图片URL",
  "metadata": {
    "title": "音乐标题",
    "artist": "艺术家",
    "description": "描述",
    "genre": "类型",
    "duration": 30,
    "prompt": "生成提示词"
  },
  "royalties": [
    {
      "recipient": "0x1234...",
      "percentage": 0.8,
      "description": "艺术家版税"
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "ipfs": {
      "audio": {
        "hash": "QmAudioHash",
        "url": "https://ipfs.io/ipfs/QmAudioHash",
        "size": 1024000
      },
      "cover": {
        "hash": "QmCoverHash",
        "url": "https://ipfs.io/ipfs/QmCoverHash",
        "size": 512000
      },
      "metadata": {
        "hash": "QmMetadataHash",
        "url": "https://ipfs.io/ipfs/QmMetadataHash"
      }
    },
    "nftMetadata": {
      "title": "音乐标题",
      "artist": "艺术家",
      "audioURL": "ipfs://QmAudioHash",
      "coverImageURL": "ipfs://QmCoverHash"
    }
  },
  "message": "IPFS上传成功"
}
```

### GET /ai/models
获取可用的AI模型

**响应**:
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "musicgen-stereo-large",
        "name": "MusicGen Stereo Large",
        "description": "高质量立体声音乐生成",
        "maxDuration": 60,
        "provider": "Meta/Replicate"
      },
      {
        "id": "musicgen-large",
        "name": "MusicGen Large",
        "description": "大型模型，支持多样化音乐生成",
        "maxDuration": 30,
        "provider": "Meta/Replicate"
      }
    ]
  }
}
```

### GET /ai/genres
获取支持的音乐类型

**响应**:
```json
{
  "success": true,
  "data": {
    "genres": [
      "电子音乐",
      "环境音乐",
      "古典音乐",
      "爵士乐",
      "摇滚乐",
      "流行音乐",
      "嘻哈音乐",
      "电子舞曲",
      "实验音乐",
      "电影配乐"
    ]
  }
}
```

## NFT管理

### POST /nft/mint
铸造音乐NFT

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "metadata": {
    "title": "我的音乐",
    "artist": "艺术家名称",
    "description": "音乐描述",
    "audioURL": "ipfs://QmAudioHash",
    "coverImageURL": "ipfs://QmCoverHash",
    "genre": "电子音乐",
    "duration": 180
  },
  "royalties": [
    {
      "recipient": "0x1234567890abcdef",
      "percentage": 0.8,
      "description": "艺术家版税"
    },
    {
      "recipient": "0xabcdef1234567890",
      "percentage": 0.2,
      "description": "平台版税"
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "nft": {
      "id": "nft_id",
      "tokenId": "123",
      "transactionHash": "0xtransaction_hash",
      "metadata": { ... },
      "royalties": [ ... ],
      "status": "minted",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  },
  "message": "NFT铸造成功"
}
```

### GET /nft/:id
获取NFT详情

**路径参数**:
- `id`: NFT ID

**响应**:
```json
{
  "success": true,
  "data": {
    "nft": {
      "id": "nft_id",
      "tokenId": "123",
      "title": "音乐标题",
      "artist": "艺术家",
      "description": "描述",
      "genre": "电子音乐",
      "duration": 180,
      "coverImage": "封面图片URL",
      "audioUrl": "音频URL",
      "owner": "0x1234567890abcdef",
      "creator": "0x1234567890abcdef",
      "price": "5.0",
      "currency": "FLOW",
      "isForSale": true,
      "playCount": 123,
      "likes": 45,
      "royalties": [
        {
          "recipient": "0x1234...",
          "percentage": 0.8,
          "description": "艺术家版税"
        }
      ],
      "analytics": {
        "views": 500,
        "plays": 123,
        "likes": 45,
        "shares": 12
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

### PUT /nft/:id
更新NFT信息

**路径参数**:
- `id`: NFT ID

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "新标题",
  "description": "新描述",
  "price": "6.0",
  "isForSale": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "nft": { ... }
  },
  "message": "NFT更新成功"
}
```

## 市场交易

### GET /marketplace/nfts
获取市场NFT列表

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `genre`: 音乐类型过滤
- `sort`: 排序方式 (newest, oldest, price_low, price_high, popular)
- `search`: 搜索关键词
- `minPrice`: 最低价格
- `maxPrice`: 最高价格

**响应**:
```json
{
  "success": true,
  "data": {
    "nfts": [
      {
        "id": "nft_id",
        "tokenId": "1",
        "title": "宇宙梦境",
        "artist": "AI作曲家",
        "price": "5.0",
        "currency": "FLOW",
        "genre": "电子音乐",
        "duration": 180,
        "plays": 1234,
        "likes": 89,
        "coverImage": "封面图片URL",
        "audioUrl": "音频URL",
        "seller": "0x1234567890abcdef",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    },
    "filters": {
      "genres": ["电子音乐", "古典音乐", "爵士乐"],
      "priceRange": {
        "min": "0.1",
        "max": "100.0"
      }
    }
  }
}
```

### POST /marketplace/list
上架NFT到市场

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "nftId": "nft_id",
  "price": "5.0",
  "currency": "FLOW"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "listing": {
      "id": "listing_id",
      "nftId": "nft_id",
      "price": "5.0",
      "currency": "FLOW",
      "seller": "0x1234567890abcdef",
      "status": "active",
      "listedAt": "2024-01-15T10:00:00Z"
    }
  },
  "message": "NFT上架成功"
}
```

### POST /marketplace/buy
购买NFT

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "nftId": "nft_id",
  "price": "5.0"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "transaction": {
      "hash": "0xtransaction_hash",
      "nftId": "nft_id",
      "price": "5.0",
      "buyer": "0xbuyer_address",
      "seller": "0xseller_address",
      "royaltiesDistributed": [
        {
          "recipient": "0x1234...",
          "amount": "4.0"
        },
        {
          "recipient": "0x5678...",
          "amount": "1.0"
        }
      ],
      "completedAt": "2024-01-15T10:00:00Z"
    }
  },
  "message": "购买成功"
}
```

### DELETE /marketplace/list/:listingId
取消NFT上架

**路径参数**:
- `listingId`: 上架ID

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "message": "取消上架成功"
}
```

## 播放列表

### GET /playlists
获取用户播放列表

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)

**响应**:
```json
{
  "success": true,
  "data": {
    "playlists": [
      {
        "id": "playlist_id",
        "name": "我的收藏",
        "description": "收藏的音乐",
        "coverImage": "封面图片URL",
        "trackCount": 15,
        "totalDuration": 2700,
        "isPublic": true,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-16T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### POST /playlists
创建播放列表

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "新播放列表",
  "description": "播放列表描述",
  "isPublic": true,
  "coverImage": "封面图片URL"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "playlist": {
      "id": "playlist_id",
      "name": "新播放列表",
      "description": "播放列表描述",
      "coverImage": "封面图片URL",
      "trackCount": 0,
      "totalDuration": 0,
      "isPublic": true,
      "owner": "0x1234567890abcdef",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  },
  "message": "播放列表创建成功"
}
```

### GET /playlists/:id
获取播放列表详情

**路径参数**:
- `id`: 播放列表ID

**响应**:
```json
{
  "success": true,
  "data": {
    "playlist": {
      "id": "playlist_id",
      "name": "我的收藏",
      "description": "收藏的音乐",
      "coverImage": "封面图片URL",
      "trackCount": 15,
      "totalDuration": 2700,
      "isPublic": true,
      "owner": "0x1234567890abcdef",
      "tracks": [
        {
          "id": "track_id",
          "nftId": "nft_id",
          "title": "音乐标题",
          "artist": "艺术家",
          "duration": 180,
          "coverImage": "封面图片URL",
          "audioUrl": "音频URL",
          "addedAt": "2024-01-15T10:00:00Z"
        }
      ],
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-16T10:00:00Z"
    }
  }
}
```

### POST /playlists/:id/tracks
添加音乐到播放列表

**路径参数**:
- `id`: 播放列表ID

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "nftId": "nft_id"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "track": {
      "id": "track_id",
      "nftId": "nft_id",
      "playlistId": "playlist_id",
      "addedAt": "2024-01-15T10:00:00Z"
    }
  },
  "message": "音乐添加成功"
}
```

### DELETE /playlists/:id/tracks/:trackId
从播放列表移除音乐

**路径参数**:
- `id`: 播放列表ID
- `trackId`: 音乐ID

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "message": "音乐移除成功"
}
```

## 版税管理

### GET /royalties/earnings
获取用户收益

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
- `period`: 时间周期 (day, week, month, year, all)
- `nftId`: 特定NFT ID (可选)

**响应**:
```json
{
  "success": true,
  "data": {
    "earnings": {
      "total": "125.50",
      "currency": "FLOW",
      "period": "month",
      "breakdown": [
        {
          "nftId": "nft_id",
          "title": "音乐标题",
          "amount": "45.20",
          "source": "sales",
          "date": "2024-01-15"
        },
        {
          "nftId": "nft_id",
          "title": "音乐标题",
          "amount": "12.30",
          "source": "streaming",
          "date": "2024-01-14"
        }
      ],
      "summary": {
        "sales": "80.20",
        "streaming": "45.30"
      }
    }
  }
}
```

### GET /royalties/distributions/:nftId
获取NFT版税分配记录

**路径参数**:
- `nftId`: NFT ID

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)

**响应**:
```json
{
  "success": true,
  "data": {
    "distributions": [
      {
        "id": "distribution_id",
        "nftId": "nft_id",
        "amount": "5.0",
        "source": "sale",
        "recipients": [
          {
            "address": "0x1234...",
            "amount": "4.0",
            "percentage": 0.8
          },
          {
            "address": "0x5678...",
            "amount": "1.0",
            "percentage": 0.2
          }
        ],
        "transactionHash": "0xtx_hash",
        "distributedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### POST /royalties/withdraw
提取收益

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "amount": "50.0",
  "currency": "FLOW"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "withdrawal": {
      "id": "withdrawal_id",
      "amount": "50.0",
      "currency": "FLOW",
      "recipient": "0x1234567890abcdef",
      "transactionHash": "0xtx_hash",
      "status": "completed",
      "processedAt": "2024-01-15T10:00:00Z"
    }
  },
  "message": "提取成功"
}
```

## 错误处理

### 错误代码

| 代码 | 描述 |
|------|------|
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 错误响应示例

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "请求参数验证失败",
  "code": 400,
  "details": {
    "field": "prompt",
    "reason": "提示词不能为空"
  }
}
```

### 常见错误类型

- `VALIDATION_ERROR`: 参数验证错误
- `AUTHENTICATION_ERROR`: 认证失败
- `AUTHORIZATION_ERROR`: 权限不足
- `NOT_FOUND_ERROR`: 资源不存在
- `RATE_LIMIT_ERROR`: 请求频率超限
- `BLOCKCHAIN_ERROR`: 区块链交易错误
- `AI_GENERATION_ERROR`: AI生成失败
- `IPFS_ERROR`: IPFS上传失败

## 限流策略

### 限流规则

| 端点类型 | 限制 | 时间窗口 |
|----------|------|----------|
| 通用API | 100次 | 15分钟 |
| AI生成 | 10次 | 1小时 |
| 播放列表 | 50次 | 5分钟 |
| 认证 | 5次 | 15分钟 |

### 限流响应头

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

### 限流错误响应

```json
{
  "success": false,
  "error": "RATE_LIMIT_ERROR",
  "message": "请求过于频繁，请稍后重试",
  "code": 429,
  "retryAfter": 3600
}
```

---

**文档版本**: v1.0
**最后更新**: 2024年1月
**维护者**: FlowTune开发团队