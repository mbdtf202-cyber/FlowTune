# FlowTune 部署指南

## 目录
1. [本地Docker部署](#本地docker部署)
2. [云平台部署](#云平台部署)
3. [环境变量配置](#环境变量配置)
4. [故障排除](#故障排除)

## 本地Docker部署

### 前置要求
1. **安装Docker Desktop**
   - 访问 [Docker官网](https://www.docker.com/products/docker-desktop/) 下载Docker Desktop
   - 安装完成后启动Docker Desktop
   - 验证安装：`docker --version`

### 快速部署
```bash
# 1. 克隆项目（如果还没有）
git clone <your-repo-url>
cd FlowTune

# 2. 运行部署脚本
./deploy-production.sh
```

### 手动部署步骤
```bash
# 1. 构建前端
cd frontend
npm run build
cd ..

# 2. 启动服务
docker compose -f docker-compose.yml up --build -d

# 3. 检查服务状态
docker compose ps

# 4. 查看日志
docker compose logs -f
```

### 访问应用
- 前端: http://localhost
- 后端API: http://localhost:3001
- 数据库: localhost:5432
- Redis: localhost:6379

## 云平台部署

### 1. Railway 部署（推荐）

Railway是最简单的部署选项：

1. **准备工作**
   ```bash
   # 安装Railway CLI
   npm install -g @railway/cli
   
   # 登录Railway
   railway login
   ```

2. **部署步骤**
   ```bash
   # 初始化项目
   railway init
   
   # 部署
   railway up
   ```

3. **配置环境变量**
   在Railway仪表板中设置以下环境变量：
   ```
   NODE_ENV=production
   OPENAI_API_KEY=your_openai_api_key
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_API_KEY=your_pinata_secret_key
   ```

### 2. Render 部署

1. **连接GitHub仓库**
   - 访问 [Render](https://render.com)
   - 连接您的GitHub仓库

2. **创建Web服务**
   - 选择"Web Service"
   - 构建命令: `cd frontend && npm run build`
   - 启动命令: `npm start`

3. **配置环境变量**
   在Render仪表板中添加环境变量

### 3. DigitalOcean App Platform

1. **创建应用**
   - 访问 [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - 选择GitHub仓库

2. **配置构建设置**
   ```yaml
   name: flowtune
   services:
   - name: frontend
     source_dir: /frontend
     build_command: npm run build
     run_command: npm start
   - name: backend
     source_dir: /backend
     build_command: npm install
     run_command: npm start
   ```

### 4. VPS部署（高级）

如果您有自己的VPS服务器：

1. **服务器准备**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 安装Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # 安装Docker Compose
   sudo apt install docker-compose-plugin
   ```

2. **部署应用**
   ```bash
   # 克隆代码
   git clone <your-repo-url>
   cd FlowTune
   
   # 配置环境变量
   cp .env.example .env.production
   # 编辑 .env.production 文件
   
   # 启动服务
   docker compose -f docker-compose.prod.yml up -d
   ```

3. **配置域名和SSL**
   ```bash
   # 安装Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # 获取SSL证书
   sudo certbot --nginx -d your-domain.com
   ```

## 环境变量配置

### 必需的环境变量

```bash
# AI服务
OPENAI_API_KEY=your_openai_api_key_here
REPLICATE_API_TOKEN=your_replicate_token_here

# IPFS存储
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_API_KEY=your_pinata_secret_key

# Flow区块链
FLOW_PRIVATE_KEY=your_flow_private_key
FLOW_ADDRESS=your_flow_address

# 数据库（云平台会自动提供）
DATABASE_URL=postgresql://user:password@host:port/database

# 安全
JWT_SECRET=your_jwt_secret_key
```

### 获取API密钥

1. **OpenAI API Key**
   - 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
   - 创建新的API密钥

2. **Replicate API Token**
   - 访问 [Replicate](https://replicate.com/account/api-tokens)
   - 创建新的API令牌

3. **Pinata API Keys**
   - 访问 [Pinata](https://app.pinata.cloud/keys)
   - 创建新的API密钥

4. **Flow区块链**
   - 使用Flow CLI创建账户
   - 或使用现有的Flow钱包

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3000
   lsof -i :3001
   
   # 停止冲突的服务
   docker compose down
   ```

2. **内存不足**
   ```bash
   # 增加Docker内存限制
   # 在Docker Desktop设置中调整内存分配
   ```

3. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker compose logs postgres
   
   # 重启数据库
   docker compose restart postgres
   ```

4. **前端构建失败**
   ```bash
   # 清理缓存
   cd frontend
   rm -rf node_modules dist
   npm install
   npm run build
   ```

### 日志查看

```bash
# 查看所有服务日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f postgres
```

### 性能优化

1. **启用Gzip压缩**
   - 已在Nginx配置中启用

2. **CDN配置**
   - 使用Cloudflare或AWS CloudFront

3. **数据库优化**
   - 配置连接池
   - 启用查询缓存

## 监控和维护

### 健康检查
```bash
# 检查服务状态
curl http://your-domain.com/health

# 检查API状态
curl http://your-domain.com/api/health
```

### 备份
```bash
# 数据库备份
docker compose exec postgres pg_dump -U flowtune flowtune > backup.sql

# 恢复数据库
docker compose exec -T postgres psql -U flowtune flowtune < backup.sql
```

### 更新部署
```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
docker compose up --build -d
```

## 支持

如果遇到问题，请：
1. 检查日志文件
2. 查看GitHub Issues
3. 联系技术支持

---

**注意**: 请确保在生产环境中使用强密码和安全的API密钥。定期更新依赖项和安全补丁。