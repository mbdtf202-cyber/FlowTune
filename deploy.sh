#!/bin/bash

# FlowTune 部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
REGISTRY=${REGISTRY:-ghcr.io}
IMAGE_NAME=${IMAGE_NAME:-flowtune/flowtune}
COMPOSE_FILE="docker-compose.yml"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# 检查环境变量
check_environment() {
    log_info "Checking environment configuration..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        required_vars=(
            "DATABASE_URL"
            "REDIS_URL"
            "JWT_SECRET"
            "FLOW_ACCESS_NODE"
            "FLOW_PRIVATE_KEY"
        )
        
        for var in "${required_vars[@]}"; do
            if [ -z "${!var}" ]; then
                log_error "Required environment variable $var is not set"
                exit 1
            fi
        done
    fi
    
    log_success "Environment configuration check passed"
}

# 备份数据库
backup_database() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Creating database backup..."
        
        BACKUP_DIR="./backups"
        mkdir -p "$BACKUP_DIR"
        
        BACKUP_FILE="$BACKUP_DIR/flowtune_$(date +%Y%m%d_%H%M%S).sql"
        
        docker-compose exec -T postgres pg_dump -U flowtune flowtune > "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            log_success "Database backup created: $BACKUP_FILE"
        else
            log_error "Database backup failed"
            exit 1
        fi
    fi
}

# 拉取最新镜像
pull_images() {
    log_info "Pulling latest images..."
    
    if [ "$VERSION" != "latest" ]; then
        export IMAGE_TAG="$VERSION"
    fi
    
    docker-compose -f "$COMPOSE_FILE" pull
    
    log_success "Images pulled successfully"
}

# 停止服务
stop_services() {
    log_info "Stopping existing services..."
    
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    
    log_success "Services stopped"
}

# 启动服务
start_services() {
    log_info "Starting services..."
    
    # 设置环境变量
    export ENVIRONMENT
    export VERSION
    
    # 启动服务
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services started"
}

# 等待服务就绪
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    # 等待应用健康检查通过
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
            log_success "Services are ready"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting... ($attempt/$max_attempts)"
        sleep 10
    done
    
    log_error "Services failed to become ready within timeout"
    return 1
}

# 运行数据库迁移
run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f "$COMPOSE_FILE" exec -T app npm run migrate
    
    if [ $? -eq 0 ]; then
        log_success "Database migrations completed"
    else
        log_error "Database migrations failed"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    log_info "Verifying deployment..."
    
    # 检查服务状态
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_error "Some services are not running"
        return 1
    fi
    
    # 检查应用响应
    if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_error "Application health check failed"
        return 1
    fi
    
    log_success "Deployment verification passed"
}

# 清理旧镜像
cleanup() {
    log_info "Cleaning up old images..."
    
    docker image prune -f
    docker volume prune -f
    
    log_success "Cleanup completed"
}

# 发送通知
send_notification() {
    local status=$1
    local message="FlowTune deployment $status in $ENVIRONMENT environment"
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK"
    fi
    
    if [ -n "$DISCORD_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"content\":\"$message\"}" \
            "$DISCORD_WEBHOOK"
    fi
}

# 回滚函数
rollback() {
    log_warning "Rolling back to previous version..."
    
    # 停止当前服务
    docker-compose -f "$COMPOSE_FILE" down
    
    # 恢复备份（如果存在）
    if [ -f "./backups/latest.sql" ]; then
        log_info "Restoring database backup..."
        docker-compose -f "$COMPOSE_FILE" up -d postgres
        sleep 10
        docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U flowtune -d flowtune < "./backups/latest.sql"
    fi
    
    # 使用之前的镜像版本
    export VERSION="previous"
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Rollback completed"
}

# 主部署流程
main() {
    log_info "Starting FlowTune deployment..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    
    # 检查依赖和环境
    check_dependencies
    check_environment
    
    # 备份数据库（生产环境）
    if [ "$ENVIRONMENT" = "production" ]; then
        backup_database
    fi
    
    # 部署流程
    pull_images
    stop_services
    start_services
    
    # 等待服务就绪
    if wait_for_services; then
        # 运行迁移
        run_migrations
        
        # 验证部署
        if verify_deployment; then
            log_success "Deployment completed successfully!"
            send_notification "succeeded"
        else
            log_error "Deployment verification failed"
            send_notification "failed"
            
            if [ "$ENVIRONMENT" = "production" ]; then
                rollback
            fi
            exit 1
        fi
    else
        log_error "Services failed to start"
        send_notification "failed"
        
        if [ "$ENVIRONMENT" = "production" ]; then
            rollback
        fi
        exit 1
    fi
    
    # 清理
    cleanup
    
    log_success "FlowTune deployment completed!"
}

# 错误处理
trap 'log_error "Deployment failed"; send_notification "failed"; exit 1' ERR

# 显示帮助
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [environment] [version]"
    echo ""
    echo "Arguments:"
    echo "  environment    Deployment environment (default: production)"
    echo "  version        Image version to deploy (default: latest)"
    echo ""
    echo "Examples:"
    echo "  $0 production v1.0.0"
    echo "  $0 staging latest"
    echo ""
    echo "Environment variables:"
    echo "  REGISTRY       Container registry (default: ghcr.io)"
    echo "  IMAGE_NAME     Image name (default: flowtune/flowtune)"
    echo "  SLACK_WEBHOOK  Slack webhook URL for notifications"
    echo "  DISCORD_WEBHOOK Discord webhook URL for notifications"
    exit 0
fi

# 执行主流程
main