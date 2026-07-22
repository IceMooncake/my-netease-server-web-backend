The project has been refactored into a single repository.
Please check [Minecraft QQ Territory Platform](https://github.com/IceMooncake/minecraft-qq-territory-platform)

# Minecraft to QQ Manager Backend

## 本地开发

- npm i
- 修改配置
- 导入数据库
- npm run start

## Docker 部署

### 构建和运行

1. 确保已安装 Docker 和 Docker Compose

2. 修改 `docker-compose.yml` 中的环境变量：
   - 数据库配置 (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
   - Napcat 配置 (NAPCAT_URL, NAPCAT_TOKEN, NAPCAT_GROUPID)
   - JWT 密钥 (JWT_SECRET)
   - CORS 允许域名 (ALLOW_ORIGIN)

3. 构建并启动服务：
   ```bash
   docker-compose up --build
   ```

4. 服务将在 http://localhost:3000 运行

### 仅使用 Dockerfile

```bash
# 构建镜像
docker build -t minecraft-qq-backend .

# 运行容器（记得设置环境变量）
docker run -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_USER=your-db-user \
  -e DB_PASSWORD=your-db-password \
  -e DB_NAME=your-db-name \
  -e NAPCAT_URL=ws://your-napcat-url \
  -e NAPCAT_TOKEN=your-napcat-token \
  -e NAPCAT_GROUPID=your-group-id \
  -e JWT_SECRET=your-jwt-secret \
  -e ALLOW_ORIGIN=https://your-frontend-domain.com \
  minecraft-qq-backend
```

## 项目设计

数据库由prisma作为导向，表设计从prisma中获取
执行`npx prisma migrate dev --name init`以更新或初始化数据库
