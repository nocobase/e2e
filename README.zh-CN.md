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
APP_ROOT=/app/my-nocobase               # NocoBase 应用的根目录
APP_BASE_URL=http://localhost:${port}/  # 应用 URL 模板，一般不用修改
```

运行测试

```bash
yarn install

# 默认为开发模式 yarn dev 运行的 NocoBase
yarn e2e test my-project1

# 生产环境 yarn start 运行的 NocoBase
yarn e2e test my-project1 --production

# UI 模式
yarn e2e test my-project1 --ui

# 同一个项目可以同时运行多次，互相隔离，不干预
# 实例 1
yarn e2e test my-project1
# 实例 2
yarn e2e test my-project1
# 实例 3
yarn e2e test my-project1
```

## Projects

项目目录结构

```bash
|- projects
  |- my-project1
    |- playwright                           # 测试数据及报告
    |- tests                                # 测试用例
    |- backup_20241103_201447_2067.nbdata   # 备份文件 .nbdata 后缀即可
    |- playwright.config.ts                 # 非必须，特殊情况，可以自定义 playwright.config.ts 
```

## 答疑

### 为什么是独立的，不是和源码一起维护？

1. NocoBase 有三种安装方式，生产和开发两种运行模式，独立的框架更便于测试不同环境和不同运行模式组合的情况
2. e2e 是系统测试，黑盒测试，与源码无关

## 为什么以项目划分？

和我们任务管理的方式一致，e2e 也是以项目为单位进行划分，每个项目都有自己的备份文件，用于还原测试场景。

## 测试是隔离的吗？

每个 e2e test 的环境都是隔离的，即使同一个项目同时运行多次也都是隔离的。
