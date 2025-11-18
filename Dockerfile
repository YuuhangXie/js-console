FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 安装构建依赖（isolated-vm 需要）
RUN apk add --no-cache python3 make g++

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，用于构建）
RUN npm install && \
    npm cache clean --force

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 删除 devDependencies 节省空间
RUN npm prune --production

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["node", "server/index.js"]

