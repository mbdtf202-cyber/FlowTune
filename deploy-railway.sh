#!/bin/bash

# FlowTune Railway 一键部署脚本
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

# 检查Railway CLI
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        log_warning "Railway CLI 未安装，正在安装..."
        npm install -g @railway/cli
        log_success "Railway CLI 安装完成"
    else
        log_info "Railway CLI 已安装"
    fi
}

# 检查登录状态
check_login() {
    if ! railway whoami &> /dev/null; then
        log_info "请登录Railway..."
        railway login
    else
        log_success "已登录Railway"
    fi
}

# 初始化项目
init_project() {
    log_info "初始化Railway项目..."
    
    if [ ! -f "railway.toml" ]; then
        railway init
        log_success "Railway项目初始化完成"
    else
        log_info "Railway项目已存在"
    fi
}

# 设置环境变量
setup_env_vars() {
    log_info "设置环境变量..."
    
    # 提示用户输入必要的环境变量
    echo ""
    log_warning "请提供以下API密钥（如果没有，请先到相应平台申请）："
    echo ""
    
    read -p "OpenAI API Key: " OPENAI_API_KEY
    read -p "Replicate API Token: " REPLICATE_API_TOKEN
    read -p "Pinata API Key: " PINATA_API_KEY
    read -p "Pinata Secret API Key: " PINATA_SECRET_API_KEY
    read -p "Flow Private Key (可选): " FLOW_PRIVATE_KEY
    read -p "Flow Address (可选): " FLOW_ADDRESS
    
    # 设置环境变量
    railway variables set NODE_ENV=production
    railway variables set OPENAI_API_KEY="$OPENAI_API_KEY"
    railway variables set REPLICATE_API_TOKEN="$REPLICATE_API_TOKEN"
    railway variables set PINATA_API_KEY="$PINATA_API_KEY"
    railway variables set PINATA_SECRET_API_KEY="$PINATA_SECRET_API_KEY"
    
    if [ ! -z "$FLOW_PRIVATE_KEY" ]; then
        railway variables set FLOW_PRIVATE_KEY="$FLOW_PRIVATE_KEY"
    fi
    
    if [ ! -z "$FLOW_ADDRESS" ]; then
        railway variables set FLOW_ADDRESS="$FLOW_ADDRESS"
    fi
    
    # 设置其他必要的环境变量
    railway variables set FLOW_NETWORK=testnet
    railway variables set FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
    railway variables set JWT_SECRET="flowtune-railway-jwt-secret-$(date +%s)"
    railway variables set CORS_ORIGIN="*"
    railway variables set MAX_FILE_SIZE=50MB
    
    log_success "环境变量设置完成"
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    cd frontend
    npm install
    npm run build
    cd ..
    log_success "前端构建完成"
}

# 部署应用
deploy_app() {
    log_info "部署应用到Railway..."
    railway up
    log_success "部署完成！"
}

# 获取部署信息
get_deployment_info() {
    echo ""
    log_success "=== FlowTune Railway 部署完成 ==="
    echo ""
    
    # 获取部署URL
    DEPLOYMENT_URL=$(railway domain)
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        echo "🌐 应用访问地址: https://$DEPLOYMENT_URL"
    else
        log_info "正在生成域名..."
        railway domain
        echo "🌐 请稍后查看Railway仪表板获取访问地址"
    fi
    
    echo ""
    echo "📊 管理命令:"
    echo "   railway logs        # 查看日志"
    echo "   railway status      # 查看状态"
    echo "   railway variables   # 查看环境变量"
    echo "   railway open        # 打开仪表板"
    echo ""
}

# 主函数
main() {
    log_info "开始 FlowTune Railway 部署..."
    echo ""
    
    check_railway_cli
    check_login
    init_project
    setup_env_vars
    build_frontend
    deploy_app
    get_deployment_info
    
    log_success "🎉 部署完成！您的FlowTune应用现在可以在公网访问了！"
}

# 执行主函数
main "$@"