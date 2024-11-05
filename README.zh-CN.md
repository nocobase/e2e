# 开发指南

## 安装 NocoBase

参考安装指南先下载 NocoBase

https://docs-cn.nocobase.com/welcome/getting-started/installation

修改 .env 文件的环境变量配置（目前仅支持 PostgreSQL 数据库）

```bash
TZ=Asia/Shanghai
APP_KEY=your-secret-key
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=postgres
DB_USER=nocobase
DB_PASSWORD=nocobase
```

添加商业插件自动下载及更新的环境变量

依赖备份还原插件 @nocobase/plugin-backups
https://docs-cn.nocobase.com/handbook/backups

```bash
NOCOBASE_PKG_URL=https://pkg.nocobase.com/
NOCOBASE_PKG_USERNAME=your-username   # service 平台用户名
NOCOBASE_PKG_PASSWORD=your-password   # service 平台用户密码
```

安装 pg 客户端，如 MacOS

```bash
brew install libpq
```

## 运行 E2E

配置 .env

```bash
APP_ROOT=/app/my-nocobase
APP_BASE_URL=http://localhost:${port}/
```

运行测试

```bash
yarn install

# 默认为开发模式 yarn dev 运行的 NocoBase
yarn e2e test my-project1

# 生产环境 yarn start 运行的 NocoBase
yarn e2e test my-project1 --production
```

## Projects

项目目录结构

```bash
|- projects
  |- my-project1
    |- playwright                           # 测试数据及报告
    |- tests                                # 测试用例
    |- backup_20241103_201447_2067.nbdata   # 备份文件
    |- playwright.config.ts                 # 非必须
```
