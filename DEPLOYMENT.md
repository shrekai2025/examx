# ExamX 部署指南

本指南将帮助您将 ExamX 应用部署到远程服务器，使用 PM2 进行进程管理。

## 📋 前置要求

### 服务器要求
- 操作系统: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- Node.js: 18.x 或更高版本
- RAM: 最低 1GB (推荐 2GB+)
- 磁盘空间: 最低 2GB

### 本地要求
- Git
- GitHub 账号
- SSH 访问远程服务器的权限

## 🚀 部署步骤

### 第一步: 上传代码到 GitHub

1. **在 GitHub 创建新仓库**
   - 访问 https://github.com/new
   - 输入仓库名称 (例如: examx)
   - 选择 Private (私有) 或 Public (公开)
   - **不要**勾选 "Initialize with README"
   - 点击 "Create repository"

2. **添加远程仓库并推送代码**
   ```bash
   # 在本地项目目录执行
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/examx.git
   git push -u origin main
   ```

### 第二步: 在服务器上安装 Node.js

1. **SSH 连接到服务器**
   ```bash
   ssh 用户名@服务器IP
   ```

2. **安装 Node.js (使用 NodeSource)**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # CentOS/RHEL
   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
   sudo yum install -y nodejs
   ```

3. **验证安装**
   ```bash
   node -v  # 应该显示 v20.x.x
   npm -v   # 应该显示 10.x.x
   ```

### 第三步: 克隆项目到服务器

1. **克隆仓库**
   ```bash
   # 创建应用目录
   cd ~
   mkdir -p apps
   cd apps

   # 克隆项目 (私有仓库需要提供认证)
   git clone https://github.com/你的用户名/examx.git
   cd examx
   ```

   > **提示**: 如果是私有仓库，GitHub 现在要求使用 Personal Access Token (PAT) 而不是密码
   > - 生成 PAT: Settings → Developer settings → Personal access tokens → Generate new token
   > - 克隆时输入用户名和 PAT (而非密码)

2. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp .env.example .env

   # 编辑环境变量
   nano .env
   ```

   **必须修改的配置项:**
   ```env
   # 修改管理员密码 (重要!)
   ADMIN_PASSWORD=你的安全密码
   USER_PASSWORD=你的安全密码

   # 修改 Session Secret (必须至少 32 个字符)
   SESSION_SECRET=生成一个随机的长字符串至少32个字符
   ```

   **生成安全的 SESSION_SECRET:**
   ```bash
   # 方法1: 使用 openssl
   openssl rand -base64 32

   # 方法2: 使用 node
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

### 第四步: 运行部署脚本

```bash
# 确保脚本有执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

部署脚本会自动执行以下操作:
1. 检查 Node.js 和 PM2 环境
2. 安装项目依赖
3. 初始化/同步数据库
4. 构建 Next.js 应用
5. 使用 PM2 启动应用

### 第五步: 配置开机自启

部署完成后，按照脚本提示执行 PM2 自启命令:

```bash
# 脚本会输出类似这样的命令，需要用 sudo 执行
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u 用户名 --hp /home/用户名
```

### 第六步: 配置防火墙

```bash
# Ubuntu (使用 ufw)
sudo ufw allow 3000/tcp
sudo ufw reload

# CentOS (使用 firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 第七步: 配置 API Keys

1. 访问应用: `http://服务器IP:3000`
2. 使用管理员账号登录
3. 进入系统管理页面
4. 配置以下 API Keys:
   - **智谱 API Key**: 用于图像生成
   - **ElevenLabs API Key**: 用于语音生成

## 🔧 常用管理命令

### PM2 管理命令

```bash
# 查看应用状态
pm2 status

# 查看实时日志
pm2 logs examx

# 查看最近 100 行日志
pm2 logs examx --lines 100

# 重启应用
pm2 restart examx

# 停止应用
pm2 stop examx

# 删除应用
pm2 delete examx

# 查看详细信息
pm2 show examx

# 监控面板
pm2 monit
```

### 应用更新流程

```bash
# 1. 拉取最新代码
cd ~/apps/examx
git pull origin main

# 2. 重新部署
./deploy.sh

# 或者手动执行
npm install
npm run build
pm2 restart examx
```

### 数据库备份

```bash
# 备份数据库
cp prisma/db.sqlite prisma/db.sqlite.backup.$(date +%Y%m%d_%H%M%S)

# 定期备份 (添加到 crontab)
crontab -e
# 添加: 每天凌晨 2 点备份
0 2 * * * cp ~/apps/examx/prisma/db.sqlite ~/apps/examx/prisma/db.sqlite.backup.$(date +\%Y\%m\%d)
```

## 🌐 配置 Nginx 反向代理 (推荐)

### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS
sudo yum install nginx
```

### 配置反向代理

创建 Nginx 配置文件:

```bash
sudo nano /etc/nginx/sites-available/examx
```

添加以下配置:

```nginx
server {
    listen 80;
    server_name 你的域名.com;  # 或者使用服务器IP

    # 限制上传文件大小
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }
}
```

启用站点:

```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/examx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# CentOS
sudo nginx -t
sudo systemctl restart nginx
```

### 配置 SSL (HTTPS) - 可选但推荐

使用 Let's Encrypt 免费证书:

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx  # Ubuntu/Debian
sudo yum install certbot python3-certbot-nginx  # CentOS

# 获取并配置证书
sudo certbot --nginx -d 你的域名.com

# 设置自动续期
sudo certbot renew --dry-run
```

## 📊 监控和日志

### PM2 监控

```bash
# Web 监控面板 (需要注册账号)
pm2 plus

# 本地监控
pm2 monit
```

### 日志位置

- PM2 日志: `~/apps/examx/logs/`
  - `pm2-error.log` - 错误日志
  - `pm2-out.log` - 输出日志
- Nginx 日志: `/var/log/nginx/`
  - `access.log` - 访问日志
  - `error.log` - 错误日志

## 🔒 安全建议

1. **修改默认密码**: 务必在 `.env` 中修改 `ADMIN_PASSWORD` 和 `USER_PASSWORD`
2. **使用强密码**: 密码应包含大小写字母、数字和特殊字符
3. **SESSION_SECRET**: 使用随机生成的长字符串 (至少 32 字符)
4. **配置 HTTPS**: 使用 SSL 证书加密传输
5. **配置防火墙**: 只开放必要的端口 (80, 443)
6. **定期更新**: 及时更新系统和依赖包
7. **备份数据**: 定期备份数据库文件
8. **API Keys 安全**: 不要在代码中硬编码 API Keys

## ❓ 常见问题

### 1. 端口 3000 已被占用

```bash
# 查看占用端口的进程
sudo lsof -i :3000

# 停止并删除旧的 PM2 进程
pm2 delete examx

# 或者修改端口
# 编辑 ecosystem.config.js 中的 PORT 配置
```

### 2. 数据库初始化失败

```bash
# 删除数据库重新初始化
rm prisma/db.sqlite
npx prisma db push
```

### 3. PM2 启动失败

```bash
# 查看详细错误
pm2 logs examx --err

# 检查环境变量
cat .env

# 手动测试启动
npm run start
```

### 4. 外网无法访问

1. 检查防火墙是否开放端口
2. 检查云服务器安全组规则
3. 确认 Nginx 配置正确
4. 查看 Nginx 错误日志

### 5. 数据库数据丢失

- 确保 `prisma/db.sqlite` 文件已上传到服务器
- 在 GitHub 上传前确认数据库文件没有被 `.gitignore` 忽略
- 查看 [.gitignore](.gitignore) 文件，确认**已移除** `prisma/db.sqlite`

## 📚 相关资源

- [Next.js 文档](https://nextjs.org/docs)
- [PM2 文档](https://pm2.keymetrics.io/docs)
- [Nginx 文档](https://nginx.org/en/docs/)
- [Prisma 文档](https://www.prisma.io/docs)
- [Let's Encrypt](https://letsencrypt.org/)

## 💡 性能优化建议

1. **使用 CDN**: 将静态资源托管到 CDN
2. **开启 Gzip**: Nginx 配置中启用 gzip 压缩
3. **配置缓存**: 合理配置浏览器缓存和服务端缓存
4. **升级数据库**: 生产环境建议使用 PostgreSQL 代替 SQLite
5. **负载均衡**: 流量大时使用 PM2 集群模式

## 📞 获取帮助

如遇到问题，请检查:
1. PM2 日志: `pm2 logs examx`
2. Nginx 日志: `/var/log/nginx/error.log`
3. 系统日志: `journalctl -xe`

祝部署顺利！
