# 多阶段构建 Dockerfile
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 前端构建阶段
FROM base AS frontend-builder

# 复制前端依赖文件
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend

# 安装前端依赖
RUN npm ci --only=production && npm cache clean --force

# 复制前端源代码
COPY frontend/ .

# 构建前端应用
RUN npm run build

# 后端构建阶段
FROM base AS backend-builder

# 复制后端依赖文件
COPY backend/package*.json ./backend/
WORKDIR /app/backend

# 安装后端依赖
RUN npm ci --only=production && npm cache clean --force

# 复制后端源代码
COPY backend/ .

# 构建后端应用
RUN npm run build

# 生产环境镜像
FROM node:18-alpine AS production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S flowtune -u 1001

# 设置工作目录
WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 复制构建产物
COPY --from=frontend-builder --chown=flowtune:nodejs /app/frontend/dist ./frontend/dist
COPY --from=backend-builder --chown=flowtune:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=flowtune:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=flowtune:nodejs /app/backend/package.json ./backend/package.json

# 复制启动脚本
COPY --chown=flowtune:nodejs docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000
ENV FRONTEND_PORT=5173

# 暴露端口
EXPOSE 3000 5173

# 切换到非root用户
USER flowtune

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node backend/dist/healthcheck.js

# 使用dumb-init作为PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["docker-entrypoint.sh"]