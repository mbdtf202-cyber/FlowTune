# FlowTune 部署指南

## 📋 目录

1. [环境要求](#环境要求)
2. [本地开发环境](#本地开发环境)
3. [生产环境部署](#生产环境部署)
4. [Docker部署](#docker部署)
5. [Flow区块链配置](#flow区块链配置)
6. [第三方服务配置](#第三方服务配置)
7. [监控与日志](#监控与日志)
8. [故障排除](#故障排除)

## 环境要求

### 系统要求

- **操作系统**: Linux (Ubuntu 20.04+), macOS (10.15+), Windows 10+
- **内存**: 最低 4GB，推荐 8GB+
- **存储**: 最低 20GB 可用空间
- **网络**: 稳定的互联网连接

### 软件依赖

- **Node.js**: v18.0.0+
- **npm**: v8.0.0+
- **Redis**: v6.0.0+
- **Git**: v2.20.0+

### 可选依赖

- **Docker**: v20.10.0+ (用于容器化部署)
- **Docker Compose**: v2.0.0+
- **PM2**: v5.0.0+ (用于进程管理)

## 本地开发环境

### 1. 克隆项目

```bash
git clone https://github.com/your-username/flowtune.git
cd flowtune
```

### 2. 安装依赖

**后端依赖**:
```bash
cd backend
npm install
```

**前端依赖**:
```bash
cd frontend
npm install
```

### 3. 环境配置

**后端环境变量** (`backend/.env`):
```env
# 服务器配置
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Flow区块链配置
FLOW_NETWORK=testnet
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_PRIVATE_KEY=your-flow-private-key
FLOW_ACCOUNT_ADDRESS=0x1234567890abcdef

# AI服务配置
REPLICATE_API_TOKEN=your-replicate-api-token
OPENAI_API_KEY=your-openai-api-key

# IPFS配置
IPFS_GATEWAY=https://ipfs.io/ipfs/
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key

# 文件上传配置
MAX_FILE_SIZE=50MB
ALLOWED_AUDIO_FORMATS=mp3,wav,flac,m4a
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp

# 限流配置
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
AI_RATE_LIMIT_WINDOW=60
AI_RATE_LIMIT_MAX_REQUESTS=10
```

**前端环境变量** (`frontend/.env`):
```env
# API配置
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001

# Flow区块链配置
REACT_APP_FLOW_NETWORK=testnet
REACT_APP_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org

# 合约地址
REACT_APP_MUSIC_NFT_CONTRACT=0x1234567890abcdef
REACT_APP_MARKETPLACE_CONTRACT=0x1234567890abcdef
REACT_APP_ROYALTY_CONTRACT=0x1234567890abcdef

# IPFS配置
REACT_APP_IPFS_GATEWAY=https://ipfs.io/ipfs/

# 功能开关
REACT_APP_ENABLE_AI_GENERATION=true
REACT_APP_ENABLE_MARKETPLACE=true
REACT_APP_ENABLE_ANALYTICS=true
```

### 4. 启动Redis

**macOS (使用Homebrew)**:
```bash
brew services start redis
```

**Linux (Ubuntu)**:
```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Windows**:
```bash
# 下载并安装Redis for Windows
# 或使用Docker
docker run -d -p 6379:6379 redis:alpine
```

### 5. 启动开发服务器

**启动后端**:
```bash
cd backend
npm run dev
```

**启动前端**:
```bash
cd frontend
npm start
```

### 6. 验证安装

访问以下URL验证服务是否正常运行：

- **前端**: http://localhost:3000
- **后端API**: http://localhost:3001/api/health
- **API文档**: http://localhost:3001/api-docs

## 生产环境部署

### 1. 服务器准备

**更新系统**:
```bash
sudo apt update && sudo apt upgrade -y
```

**安装Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**安装Redis**:
```bash
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

**安装PM2**:
```bash
sudo npm install -g pm2
```

### 2. 部署应用

**克隆代码**:
```bash
git clone https://github.com/your-username/flowtune.git
cd flowtune
```

**安装依赖**:
```bash
# 后端
cd backend
npm ci --only=production

# 前端
cd ../frontend
npm ci
npm run build
```

### 3. 配置生产环境变量

**后端生产环境** (`backend/.env.production`):
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com

# 使用强密码和安全配置
JWT_SECRET=your-super-secure-production-jwt-secret
REDIS_PASSWORD=your-redis-password

# 生产Flow网络
FLOW_NETWORK=mainnet
FLOW_ACCESS_NODE=https://rest-mainnet.onflow.org

# 生产合约地址
MUSIC_NFT_CONTRACT=0xprod-music-nft-contract
MARKETPLACE_CONTRACT=0xprod-marketplace-contract
ROYALTY_CONTRACT=0xprod-royalty-contract
```

### 4. 使用PM2启动服务

**创建PM2配置文件** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: 'flowtune-backend',
      script: './backend/src/server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
```

**启动服务**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 5. 配置Nginx反向代理

**安装Nginx**:
```bash
sudo apt install nginx -y
```

**创建Nginx配置** (`/etc/nginx/sites-available/flowtune`):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/flowtune/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket支持
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**启用配置**:
```bash
sudo ln -s /etc/nginx/sites-available/flowtune /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. 配置SSL证书

**使用Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Docker部署

### 1. 创建Dockerfile

**后端Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["npm", "start"]
```

**前端Dockerfile** (`frontend/Dockerfile`):
```dockerfile
# 构建阶段
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建文件
COPY --from=build /app/build /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. 创建Docker Compose配置

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    build: ./backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  redis_data:
```

### 3. 启动Docker服务

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## Flow区块链配置

### 1. 创建Flow账户

**安装Flow CLI**:
```bash
sh -ci "$(curl -fsSL https://storage.googleapis.com/flow-cli/install.sh)"
```

**生成密钥对**:
```bash
flow keys generate
```

**创建账户**:
```bash
# 测试网
flow accounts create --key your-public-key --network testnet

# 主网
flow accounts create --key your-public-key --network mainnet
```

### 2. 部署智能合约

**配置flow.json**:
```json
{
  "networks": {
    "testnet": "access.devnet.nodes.onflow.org:9000",
    "mainnet": "access.mainnet.nodes.onflow.org:9000"
  },
  "accounts": {
    "testnet-account": {
      "address": "0x1234567890abcdef",
      "key": "your-private-key"
    }
  },
  "contracts": {
    "MusicNFT": "./cadence/contracts/MusicNFT.cdc",
    "Marketplace": "./cadence/contracts/Marketplace.cdc",
    "RoyaltyDistributor": "./cadence/contracts/RoyaltyDistributor.cdc"
  },
  "deployments": {
    "testnet": {
      "testnet-account": ["MusicNFT", "Marketplace", "RoyaltyDistributor"]
    }
  }
}
```

**部署合约**:
```bash
# 部署到测试网
flow project deploy --network testnet

# 部署到主网
flow project deploy --network mainnet
```

### 3. 验证合约部署

```bash
# 检查合约状态
flow accounts get 0x1234567890abcdef --network testnet

# 测试合约功能
flow scripts execute ./cadence/scripts/get_nft_metadata.cdc --arg Address:0x1234567890abcdef --arg UInt64:1 --network testnet
```

## 第三方服务配置

### 1. Replicate AI服务

**获取API密钥**:
1. 访问 [Replicate.com](https://replicate.com)
2. 注册账户并获取API Token
3. 配置环境变量 `REPLICATE_API_TOKEN`

**测试连接**:
```bash
curl -X POST \
  -H "Authorization: Token your-replicate-token" \
  -H "Content-Type: application/json" \
  -d '{"version": "stereo-large", "input": {"prompt": "test"}}' \
  https://api.replicate.com/v1/predictions
```

### 2. IPFS/Pinata配置

**获取Pinata密钥**:
1. 访问 [Pinata.cloud](https://pinata.cloud)
2. 创建API密钥
3. 配置环境变量 `PINATA_API_KEY` 和 `PINATA_SECRET_KEY`

**测试上传**:
```bash
curl -X POST \
  -H "pinata_api_key: your-api-key" \
  -H "pinata_secret_api_key: your-secret-key" \
  -F "file=@test.json" \
  https://api.pinata.cloud/pinning/pinFileToIPFS
```

### 3. OpenAI配置

**获取API密钥**:
1. 访问 [OpenAI Platform](https://platform.openai.com)
2. 创建API密钥
3. 配置环境变量 `OPENAI_API_KEY`

## 监控与日志

### 1. 应用监控

**安装监控工具**:
```bash
npm install -g pm2-logrotate
pm2 install pm2-server-monit
```

**配置日志轮转**:
```bash
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 2. 系统监控

**安装htop**:
```bash
sudo apt install htop -y
```

**监控Redis**:
```bash
redis-cli monitor
redis-cli info memory
```

### 3. 日志管理

**查看应用日志**:
```bash
# PM2日志
pm2 logs flowtune-backend

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 系统日志
sudo journalctl -u nginx -f
```

### 4. 性能监控

**创建监控脚本** (`scripts/monitor.sh`):
```bash
#!/bin/bash

# 检查服务状态
check_service() {
    if pm2 list | grep -q "online"; then
        echo "✅ Backend service is running"
    else
        echo "❌ Backend service is down"
        pm2 restart flowtune-backend
    fi
}

# 检查Redis连接
check_redis() {
    if redis-cli ping | grep -q "PONG"; then
        echo "✅ Redis is running"
    else
        echo "❌ Redis is down"
        sudo systemctl restart redis-server
    fi
}

# 检查磁盘空间
check_disk() {
    USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $USAGE -gt 80 ]; then
        echo "⚠️ Disk usage is ${USAGE}%"
    else
        echo "✅ Disk usage is ${USAGE}%"
    fi
}

# 执行检查
check_service
check_redis
check_disk
```

**设置定时任务**:
```bash
crontab -e
# 添加以下行，每5分钟检查一次
*/5 * * * * /path/to/scripts/monitor.sh >> /var/log/flowtune-monitor.log 2>&1
```

## 故障排除

### 常见问题

**1. Redis连接失败**
```bash
# 检查Redis状态
sudo systemctl status redis-server

# 检查端口占用
sudo netstat -tlnp | grep :6379

# 重启Redis
sudo systemctl restart redis-server
```

**2. Flow区块链连接问题**
```bash
# 检查网络连接
curl -X GET https://rest-testnet.onflow.org/v1/blocks/height/sealed

# 验证账户配置
flow accounts get 0x1234567890abcdef --network testnet
```

**3. AI服务调用失败**
```bash
# 检查API密钥
curl -H "Authorization: Token $REPLICATE_API_TOKEN" https://api.replicate.com/v1/models

# 检查网络连接
ping api.replicate.com
```

**4. 前端构建失败**
```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 检查环境变量
echo $REACT_APP_API_URL
```

**5. 内存不足**
```bash
# 检查内存使用
free -h
htop

# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 日志分析

**后端错误日志**:
```bash
# 查看最近的错误
tail -n 100 backend/logs/error.log

# 搜索特定错误
grep "ECONNREFUSED" backend/logs/*.log
```

**前端错误排查**:
```bash
# 检查浏览器控制台
# 查看网络请求
# 检查环境变量配置
```

### 性能优化

**1. 数据库优化**
```bash
# Redis内存优化
redis-cli config set maxmemory 256mb
redis-cli config set maxmemory-policy allkeys-lru
```

**2. 应用优化**
```javascript
// 启用gzip压缩
app.use(compression());

// 设置缓存头
app.use(express.static('public', {
  maxAge: '1d'
}));
```

**3. Nginx优化**
```nginx
# 启用gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 设置缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

**文档版本**: v1.0
**最后更新**: 2024年1月
**维护者**: FlowTune开发团队