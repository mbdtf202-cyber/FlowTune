#!/bin/bash

# FlowTune 生产环境部署脚本
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    cd frontend
    npm run build
    cd ..
    log_success "前端构建完成"
}

# 停止现有服务
stop_services() {
    log_info "停止现有服务..."
    docker-compose -f docker-compose.prod.yml down || true
    log_success "服务已停止"
}

# 构建镜像
build_images() {
    log_info "构建Docker镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动生产服务..."
    docker-compose -f docker-compose.prod.yml up -d
    log_success "服务启动完成"
}

# 检查服务状态
check_services() {
    log_info "检查服务状态..."
    sleep 10
    
    # 检查容器状态
    docker-compose -f docker-compose.prod.yml ps
    
    # 检查健康状态
    log_info "等待服务启动..."
    sleep 30
    
    # 测试前端
    if curl -f http://localhost:80 > /dev/null 2>&1; then
        log_success "前端服务正常"
    else
        log_warning "前端服务可能未就绪"
    fi
    
    # 测试后端
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "后端服务正常"
    else
        log_warning "后端服务可能未就绪"
    fi
}

# 显示访问信息
show_access_info() {
    echo ""
    log_success "=== FlowTune 部署完成 ==="
    echo ""
    echo "🌐 前端访问地址: http://localhost"
    echo "🔧 后端API地址: http://localhost:3001"
    echo ""
    echo "📊 服务状态检查:"
    echo "   docker-compose -f docker-compose.prod.yml ps"
    echo ""
    echo "📋 查看日志:"
    echo "   docker-compose -f docker-compose.prod.yml logs -f"
    echo ""
    echo "🛑 停止服务:"
    echo "   docker-compose -f docker-compose.prod.yml down"
    echo ""
}

# 主函数
main() {
    log_info "开始 FlowTune 生产环境部署..."
    
    check_dependencies
    build_frontend
    stop_services
    build_images
    start_services
    check_services
    show_access_info
    
    log_success "部署完成！"
}

# 执行主函数
main "$@"