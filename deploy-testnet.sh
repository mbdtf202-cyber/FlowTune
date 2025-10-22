#!/bin/bash

# FlowTune 测试网部署脚本
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

# 检查Flow CLI是否安装
check_flow_cli() {
    log_info "检查Flow CLI..."
    if ! command -v flow &> /dev/null; then
        log_error "Flow CLI未安装，请先安装Flow CLI"
        log_info "安装命令: sh -ci \"\$(curl -fsSL https://storage.googleapis.com/flow-cli/install.sh)\""
        exit 1
    fi
    log_success "Flow CLI已安装"
}

# 检查网络连接
check_network() {
    log_info "检查测试网连接..."
    if ! flow blocks get latest --network testnet &> /dev/null; then
        log_error "无法连接到Flow测试网"
        exit 1
    fi
    log_success "测试网连接正常"
}

# 创建测试账户（如果不存在）
create_test_account() {
    log_info "创建测试账户..."
    
    # 创建keys目录
    mkdir -p keys
    
    # 生成新的密钥对（如果不存在）
    if [ ! -f "keys/testnet.pkey" ]; then
        log_info "生成新的密钥对..."
        flow keys generate --network testnet --save keys/testnet.pkey
        log_success "密钥对已生成并保存到 keys/testnet.pkey"
    else
        log_info "使用现有密钥对"
    fi
    
    # 获取公钥
    PUBLIC_KEY=$(flow keys decode keys/testnet.pkey --network testnet | grep "Public Key" | awk '{print $3}')
    log_info "公钥: $PUBLIC_KEY"
    
    # 创建测试账户（需要手动在Flow Faucet创建）
    log_warning "请访问 https://testnet-faucet.onflow.org/ 创建测试账户"
    log_warning "使用公钥: $PUBLIC_KEY"
    
    # 提示用户输入账户地址
    read -p "请输入创建的测试账户地址 (0x...): " TESTNET_ADDRESS
    
    # 更新flow.json中的测试网账户地址
    if command -v jq &> /dev/null; then
        jq --arg addr "$TESTNET_ADDRESS" '.accounts."testnet-account".address = $addr' flow.json > flow.json.tmp && mv flow.json.tmp flow.json
        log_success "已更新flow.json中的测试网账户地址"
    else
        log_warning "请手动更新flow.json中的testnet-account地址为: $TESTNET_ADDRESS"
    fi
}

# 部署合约
deploy_contracts() {
    log_info "开始部署智能合约到测试网..."
    
    # 部署MusicNFT合约
    log_info "部署MusicNFT合约..."
    if flow project deploy --network testnet --update; then
        log_success "智能合约部署成功！"
    else
        log_error "智能合约部署失败"
        exit 1
    fi
}

# 验证部署
verify_deployment() {
    log_info "验证合约部署..."
    
    # 获取账户地址
    ACCOUNT_ADDRESS=$(jq -r '.accounts."testnet-account".address' flow.json)
    
    # 检查合约是否部署成功
    log_info "检查MusicNFT合约..."
    if flow accounts get $ACCOUNT_ADDRESS --network testnet | grep -q "MusicNFT"; then
        log_success "MusicNFT合约部署验证成功"
    else
        log_error "MusicNFT合约部署验证失败"
        return 1
    fi
    
    # 运行测试脚本
    log_info "运行测试脚本..."
    if flow scripts execute ./cadence/scripts/get_nft_metadata.cdc --arg Address:$ACCOUNT_ADDRESS --arg UInt64:0 --network testnet; then
        log_success "测试脚本执行成功"
    else
        log_warning "测试脚本执行失败（可能是因为还没有NFT）"
    fi
}

# 创建演示数据
create_demo_data() {
    log_info "创建演示数据..."
    
    # 设置账户集合
    log_info "设置账户集合..."
    flow transactions send ./cadence/transactions/setup_account.cdc --network testnet --signer testnet-account
    
    # 铸造演示NFT
    log_info "铸造演示NFT..."
    flow transactions send ./cadence/transactions/mint_music_nft.cdc \
        --arg Address:$(jq -r '.accounts."testnet-account".address' flow.json) \
        --arg String:"Demo AI Music" \
        --arg String:"AI Composer" \
        --arg String:"A demo AI-generated music NFT for FlowTune platform" \
        --arg String:"https://ipfs.io/ipfs/QmDemo123" \
        --arg String:"https://ipfs.io/ipfs/QmDemoImage123" \
        --arg String:"electronic" \
        --arg UInt32:180 \
        --arg String:"MusicGen-Large" \
        --arg String:"electronic music with synthesizers" \
        --network testnet --signer testnet-account
    
    log_success "演示数据创建完成"
}

# 生成部署报告
generate_report() {
    log_info "生成部署报告..."
    
    ACCOUNT_ADDRESS=$(jq -r '.accounts."testnet-account".address' flow.json)
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > deployment-report.md << EOF
# FlowTune 测试网部署报告

## 部署信息
- **部署时间**: $TIMESTAMP
- **网络**: Flow Testnet
- **账户地址**: $ACCOUNT_ADDRESS
- **合约**: MusicNFT, Marketplace, RoyaltyDistributor

## 合约地址
- **MusicNFT**: $ACCOUNT_ADDRESS
- **Marketplace**: $ACCOUNT_ADDRESS  
- **RoyaltyDistributor**: $ACCOUNT_ADDRESS

## 验证链接
- **Flow Scan**: https://testnet.flowscan.org/account/$ACCOUNT_ADDRESS
- **Flow View Source**: https://flow-view-source.com/testnet/account/$ACCOUNT_ADDRESS

## 测试交易
可以使用以下脚本测试合约功能：

\`\`\`bash
# 查看NFT元数据
flow scripts execute ./cadence/scripts/get_nft_metadata.cdc --arg Address:$ACCOUNT_ADDRESS --arg UInt64:0 --network testnet

# 查看市场列表
flow scripts execute ./cadence/scripts/get_marketplace_listings.cdc --network testnet
\`\`\`

## 下一步
1. 在前端配置中更新合约地址
2. 测试完整的用户流程
3. 准备主网部署
EOF

    log_success "部署报告已生成: deployment-report.md"
}

# 主函数
main() {
    log_info "开始FlowTune测试网部署流程..."
    
    check_flow_cli
    check_network
    create_test_account
    deploy_contracts
    verify_deployment
    create_demo_data
    generate_report
    
    log_success "🎉 FlowTune测试网部署完成！"
    log_info "请查看 deployment-report.md 获取详细信息"
}

# 错误处理
trap 'log_error "部署过程中发生错误"; exit 1' ERR

# 显示帮助
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "FlowTune 测试网部署脚本"
    echo ""
    echo "用法: $0"
    echo ""
    echo "此脚本将："
    echo "1. 检查Flow CLI安装"
    echo "2. 创建测试账户（如需要）"
    echo "3. 部署智能合约到Flow测试网"
    echo "4. 验证部署"
    echo "5. 创建演示数据"
    echo "6. 生成部署报告"
    echo ""
    echo "前置要求："
    echo "- 安装Flow CLI"
    echo "- 网络连接正常"
    exit 0
fi

# 执行主函数
main