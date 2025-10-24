#!/bin/bash

# ExamX 部署脚本
# 用于在远程服务器上部署和更新应用

set -e  # 遇到错误立即退出

echo "======================================"
echo "ExamX 应用部署脚本"
echo "======================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 应用配置
APP_NAME="examx"
APP_DIR="$(pwd)"
PORT=3000

# 检查 Node.js
echo -e "\n${YELLOW}[1/8] 检查 Node.js 环境...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装 Node.js，请先安装 Node.js 18 或更高版本${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js 版本: $NODE_VERSION${NC}"

# 检查 PM2
echo -e "\n${YELLOW}[2/8] 检查 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}未安装 PM2，正在安装...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 安装完成${NC}"
else
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✓ PM2 版本: $PM2_VERSION${NC}"
fi

# 检查环境变量文件
echo -e "\n${YELLOW}[3/8] 检查环境配置...${NC}"
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${RED}警告: .env 文件不存在${NC}"
    if [ -f "$APP_DIR/.env.example" ]; then
        echo -e "${YELLOW}正在从 .env.example 创建 .env 文件...${NC}"
        cp "$APP_DIR/.env.example" "$APP_DIR/.env"
        echo -e "${RED}请编辑 .env 文件并配置正确的参数！${NC}"
        echo -e "${YELLOW}配置完成后，请重新运行此脚本${NC}"
        exit 1
    else
        echo -e "${RED}错误: 找不到 .env.example 文件${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ .env 文件存在${NC}"
fi

# 安装依赖
echo -e "\n${YELLOW}[4/8] 安装依赖包...${NC}"
npm install --production=false
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 检查数据库
echo -e "\n${YELLOW}[5/8] 检查数据库...${NC}"
if [ ! -f "$APP_DIR/prisma/db.sqlite" ]; then
    echo -e "${YELLOW}数据库文件不存在，正在初始化...${NC}"
    npx prisma db push
    echo -e "${GREEN}✓ 数据库初始化完成${NC}"
else
    echo -e "${GREEN}✓ 数据库文件已存在${NC}"
    # 同步数据库架构（不会丢失数据）
    npx prisma db push
    echo -e "${GREEN}✓ 数据库架构已同步${NC}"
fi

# 生成 Prisma Client
echo -e "\n${YELLOW}[6/8] 生成 Prisma Client...${NC}"
npx prisma generate
echo -e "${GREEN}✓ Prisma Client 生成完成${NC}"

# 构建应用
echo -e "\n${YELLOW}[7/8] 构建 Next.js 应用...${NC}"
npm run build
echo -e "${GREEN}✓ 应用构建完成${NC}"

# 创建日志目录
mkdir -p logs

# 检查端口占用
echo -e "\n${YELLOW}[8/8] 部署应用...${NC}"
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}端口 $PORT 已被占用，尝试停止现有应用...${NC}"
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
fi

# 启动应用
echo -e "${YELLOW}使用 PM2 启动应用...${NC}"
pm2 start ecosystem.config.js

# 保存 PM2 进程列表
pm2 save

# 设置 PM2 开机自启
echo -e "${YELLOW}配置 PM2 开机自启...${NC}"
pm2 startup | tail -n 1 > /tmp/pm2_startup.sh
if [ -s /tmp/pm2_startup.sh ]; then
    echo -e "${YELLOW}请以 root 权限执行以下命令来配置开机自启:${NC}"
    cat /tmp/pm2_startup.sh
fi

echo -e "\n${GREEN}======================================"
echo -e "部署完成！"
echo -e "======================================${NC}"
echo -e "${GREEN}应用名称:${NC} $APP_NAME"
echo -e "${GREEN}运行端口:${NC} $PORT"
echo -e "${GREEN}应用目录:${NC} $APP_DIR"
echo ""
echo -e "${YELLOW}常用命令:${NC}"
echo -e "  查看应用状态: ${GREEN}pm2 status${NC}"
echo -e "  查看应用日志: ${GREEN}pm2 logs $APP_NAME${NC}"
echo -e "  重启应用:     ${GREEN}pm2 restart $APP_NAME${NC}"
echo -e "  停止应用:     ${GREEN}pm2 stop $APP_NAME${NC}"
echo -e "  删除应用:     ${GREEN}pm2 delete $APP_NAME${NC}"
echo ""
echo -e "${YELLOW}访问应用:${NC}"
echo -e "  本地访问: ${GREEN}http://localhost:$PORT${NC}"
echo -e "  如需外网访问，请配置防火墙和 Nginx 反向代理"
echo ""
echo -e "${RED}重要提醒:${NC}"
echo -e "  1. 请在系统管理界面配置 API Keys (智谱图像、ElevenLabs)"
echo -e "  2. 建议修改 .env 中的默认管理员密码"
echo -e "  3. 建议配置 Nginx 反向代理和 SSL 证书"
echo ""
