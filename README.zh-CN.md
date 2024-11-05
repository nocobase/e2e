# 开发指南

## 下载 nocobase/nocobase 和 nocobase/e2e

```bash
cd /home/nocobase/ # 根据实际情况调整
git clone https://github.com/nocobase/nocobase.git -b next --depth=1 nocobase-app
git clone https://github.com/nocobase/e2e.git --depth=1 nocobase-e2e

# 下载依赖
cd /home/nocobase/nocobase-app && yarn install && yarn build
cd /home/nocobase/nocobase-e2e && yarn install
```

## 配置 nocobase-e2e 的 `.env`

切换到 nocobase-e2e 目录

```bash
cd /home/nocobase/nocobase-e2e
```

修改 .env 配置

```bash
APP_ENV=production                        # production 环境，代码需要 yarn build
APP_ROOT=/home/nocobase/nocobase-app      # NocoBase 应用的根目录
APP_BASE_URL=http://localhost:${port}/    # 应用 URL 模板，一般不用修改

## 商业插件下载（非必须）
NOCOBASE_PKG_URL=https://pkg.nocobase.com/
NOCOBASE_PKG_USERNAME=your-username
NOCOBASE_PKG_PASSWORD=your-password

## Postgres 数据库信息
POSTGRES_DB_DIALECT=postgres
POSTGRES_DB_TABLE_PREFIX=
POSTGRES_DB_HOST=localhost
POSTGRES_DB_PORT=10103
POSTGRES_DB_DATABASE=nocobase-e2e
POSTGRES_DB_USER=nocobase
POSTGRES_DB_PASSWORD=nocobase
POSTGRES_DB_UNDERSCORED=true
```

## 安装依赖

如果本地不支持 pg_dump 和 pg_restore 命令，需要安装 pg 客户端

```bash
# MacOS 系统
brew install libpq
```

以下命令会安装 chromium 和 nocobase 的商业插件（如果配置了 NOCOBASE_PKG_ 相关环境变量）

```bash
yarn e2e install
```

如果没有配置 `NOCOBASE_PKG_` 相关环境变量，需要手动下载 `@nocobase/plugin-backups` 插件。如：

```bash
mkdir -p /home/nocobase/nocobase/storage/plugins/@nocobase/plugin-backups && \
  tar -xvzf /home/nocobase/plugin-backups-1.4.0-alpha.20240906133133.tgz \
  -C /home/nocobase/nocobase/storage/plugins/@nocobase/plugin-backups \
  --strip-components=1
```

## 运行 E2E

```bash
# 默认为开发模式 yarn dev 运行的 NocoBase
yarn e2e test my-project1 --production

# 生产环境 yarn start 运行的 NocoBase
yarn e2e test my-project1 --development

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

### 为什么以项目划分？

和我们任务管理的方式一致，e2e 也是以项目为单位进行划分，每个项目都有自己的备份文件，用于还原测试场景。

### 测试是隔离的吗？

每个 e2e test 的环境都是隔离的，即使同一个项目同时运行多次也都是隔离的。

### PR 里怎么运行 e2e

切换到 e2e 对应的 NocoBase 目录（环境变量 `APP_ROOT` 所在路径），并切换到 PR 的分支

```bash
cd /app/my-nocobase  # 必须用是 APP_ROOT 的路径
gh pr checkout 5466  # 切换到 5466 分支
```

然后运行 e2e

```bash
## 开发环境模式运行
yarn e2e test my-project1

## 生产环境模式运行
yarn e2e test my-project1 --production
```

### 完整的流程是什么样的？

1. 创建一个新的 project（可以基于某个已存在的备份）
2. 运行 project
3. 添加相关测试场景（包括问题复现）
4. 生成新备份
5. 整理并书写 e2e 用例
6. 运行 e2e 测试
