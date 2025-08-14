#!/bin/bash

# 自动设置正确的 Node.js 版本
echo "🔧 检查 Node.js 版本..."

# 检查是否安装了 nvm
if ! command -v nvm &> /dev/null; then
    echo "❌ nvm 未安装，请先安装 nvm"
    echo "安装命令：curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    exit 1
fi

# 读取 .nvmrc 文件中的版本
if [ -f ".nvmrc" ]; then
    NODE_VERSION=$(cat .nvmrc)
    echo "📋 项目要求 Node.js 版本: $NODE_VERSION"
    
    # 使用 nvm 切换到指定版本
    echo "🔄 切换到 Node.js $NODE_VERSION..."
    nvm use $NODE_VERSION
    
    # 检查是否成功切换
    CURRENT_VERSION=$(node --version)
    echo "✅ 当前 Node.js 版本: $CURRENT_VERSION"
    
    # 检查 pnpm 是否可用
    if ! command -v pnpm &> /dev/null; then
        echo "📦 安装 pnpm..."
        npm install -g pnpm@9.0.0
    fi
    
    echo "🎉 环境设置完成！"
    echo "现在可以运行: pnpm dev"
else
    echo "❌ 未找到 .nvmrc 文件"
    exit 1
fi
