#!/bin/sh
set -e

# 等待数据库连接
wait_for_db() {
    echo "Waiting for database connection..."
    until nc -z ${DB_HOST:-localhost} ${DB_PORT:-5432}; do
        echo "Database is unavailable - sleeping"
        sleep 1
    done
    echo "Database is up - executing command"
}

# 等待Redis连接
wait_for_redis() {
    echo "Waiting for Redis connection..."
    until nc -z ${REDIS_HOST:-localhost} ${REDIS_PORT:-6379}; do
        echo "Redis is unavailable - sleeping"
        sleep 1
    done
    echo "Redis is up - executing command"
}

# 运行数据库迁移
run_migrations() {
    echo "Running database migrations..."
    cd /app/backend
    npm run migrate
}

# 启动应用
start_app() {
    echo "Starting FlowTune application..."
    
    # 启动后端服务
    cd /app/backend
    npm start &
    BACKEND_PID=$!
    
    # 等待后端启动
    sleep 5
    
    # 启动前端服务（如果需要）
    if [ "$SERVE_FRONTEND" = "true" ]; then
        cd /app/frontend
        npx serve -s dist -l ${FRONTEND_PORT:-5173} &
        FRONTEND_PID=$!
    fi
    
    # 等待进程
    wait $BACKEND_PID
    if [ ! -z "$FRONTEND_PID" ]; then
        wait $FRONTEND_PID
    fi
}

# 优雅关闭
graceful_shutdown() {
    echo "Received shutdown signal, gracefully shutting down..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill -TERM $BACKEND_PID
        wait $BACKEND_PID
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill -TERM $FRONTEND_PID
        wait $FRONTEND_PID
    fi
    
    echo "Shutdown complete"
    exit 0
}

# 设置信号处理
trap graceful_shutdown TERM INT

# 主流程
main() {
    echo "Starting FlowTune container..."
    
    # 检查环境变量
    if [ -z "$DATABASE_URL" ] && [ -z "$DB_HOST" ]; then
        echo "Warning: No database configuration found"
    fi
    
    # 等待依赖服务
    if [ "$WAIT_FOR_DB" = "true" ]; then
        wait_for_db
    fi
    
    if [ "$WAIT_FOR_REDIS" = "true" ]; then
        wait_for_redis
    fi
    
    # 运行迁移
    if [ "$RUN_MIGRATIONS" = "true" ]; then
        run_migrations
    fi
    
    # 启动应用
    start_app
}

# 执行主流程
main "$@"