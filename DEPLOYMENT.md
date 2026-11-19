# XHerbert 本地部署测试与 Cloudflare Pages 上线完整指南

本文档详细介绍如何在本地环境中运行、调试、全面测试 **XHerbert**，以及如何将其部署到 **Cloudflare Pages** 并绑定自定义域名 `xherbert.maxithome.com`。

---

## 第一部分：本地部署与测试指南（Local Setup & Verification）

### 1. 环境前置要求

在开始之前，请确保本地已安装以下基础工具：
- **Node.js**：推荐 `v20.x` 或 `v22.x+`（可通过 `node -v` 检查）
- **npm**：随 Node.js 附带（可通过 `npm -v` 检查）
- **uv**：Python 环境与 CLI 执行管理工具（可通过 `uv --version` 检查）
- **Google Chrome**：用于本地浏览与 Playwright E2E 浏览器自动化测试

---

### 2. 初始化与依赖安装

在项目根目录（`/Users/victorxu/projects/herbert`）下执行：

```bash
# 1. 创建 Python 虚拟环境（供 uv CLI 桥接器使用）
uv venv

# 2. 安装前端应用与测试依赖包
npm install
```

---

### 3. 本地启动与手工交互测试

你有两种方式在本地启动并体验 Web 应用：

#### 方式 A：开发热更新模式（日常开发调试推荐）

```bash
npm run dev
```
- 启动后在浏览器打开：`http://127.0.0.1:5173`
- 支持代码修改实时热更新（HMR）。

#### 方式 B：生产构建与本地静态预览（模拟线上真实环境）

```bash
# 1. 执行 TypeScript 类型编译检查并打包生成 dist/ 静态目录
npm run build

# 2. 启动本地生产预览服务器
npm run preview -- --port 4173 --host 127.0.0.1
```
- 启动后在浏览器打开：`http://127.0.0.1:4173`
- 该模式直接托管打包后的 `dist/` 目录，与部署到 Cloudflare Pages 后的运行表现 100% 一致。

#### 方式 C：前端独立组件测试面板（Isolated UI Harness）

如果希望单独测试画布或代码编辑器组件，可在启动服务后访问带 `?harness=` 参数的地址：
- **独立测试 $W \times H$ 网格画布**：`http://127.0.0.1:5173/?harness=grid`
- **独立测试 H 代码编辑器与字节计费面板**：`http://127.0.0.1:5173/?harness=editor`

---

### 4. 核心引擎模块的命令行（CLI）独立测试

本项目的四大核心引擎模块（`lexer`、`parser`、`interpreter`、`simulate`）均支持不启动浏览器、直接通过 `uv run` 在终端进行独立验证：

```bash
# 查看 CLI 参数说明
uv run --no-sync python scripts/cli_runner.py --help

# 1. 测试词法分析与官方字节计费（验证 a(X):sa(X-1) \n a(15) 计为 8 Bytes）
uv run --no-sync python scripts/cli_runner.py lexer --code "a(X):sa(X-1)\na(15)"

# 2. 测试语法分析与静态语义校验（输出 AST 或语法错误位置）
uv run --no-sync python scripts/cli_runner.py parser --code "a(X):Xra(Xs)\na(s)"

# 3. 测试解释器展开动作序列（输出前 20 步展开的 s/l/r 指令串）
uv run --no-sync python scripts/cli_runner.py interpreter --code "a(X):Xra(Xs)\na(s)" --max-steps 20

# 4. 测试完整关卡物理模拟与计分输出
uv run --no-sync python scripts/cli_runner.py simulate --code "a:sa\na" --max-steps 100
```

---

### 5. 运行自动化测试套件（全量质量门禁）

在提交代码或发布上线前，可按顺序执行以下自动化验证命令：

```bash
# 1. 静态代码检查与复杂度校验（要求 0 Warning, 0 Error，单函数 <= 30 行，圈复杂度 < 10）
npm run lint

# 2. TypeScript 严格类型检查
npm run typecheck

# 3. 单元测试与 React 组件集成测试（Vitest + React Testing Library）
npm test

# 4. 测试覆盖率报告（要求覆盖率 >= 90%）
npm run test:coverage

# 5. 变异测试（StrykerJS，检验测试断言强度，要求 >= 85%）
npm run test:mutate

# 6. 多尺寸视口 E2E 浏览器自动化测试（Playwright，自动先执行 npm run build 再运行）
npm run build && npm run test:e2e
```

> **提示**：`npm run test:e2e` 会自动在后台启动 `http://127.0.0.1:4173` 预览服务，并依次在 **Desktop ($1440 \times 900$)**、**Tablet ($768 \times 1024$)** 和 **Mobile ($390 \times 844$)** 三种视口下调用 Chrome 模拟真实用户点击、切换主题、输入 H 代码、单步调试、完成教程、修改奇数长宽地图（如 $29 \times 25$）及批量上传 `.txt` 关卡文件。

---

## 第二部分：部署到 Cloudflare Pages 并绑定 `xherbert.maxithome.com`

**XHerbert** 是纯静态单页应用（无后端依赖，打包产物全部位于 `dist/` 目录），非常适合托管在 **Cloudflare Pages** 上。你可以选择 **方式一（GitHub 自动持续部署，最推荐）** 或 **方式二（Wrangler CLI 本地直接上传部署）**。

---

### 方式一：通过 GitHub 关联 Cloudflare Pages 自动部署（推荐）

这种方式配置一次后，以后每次你向 GitHub `main` 分支 `git push` 代码，Cloudflare 都会自动拉取代码、执行构建并更新线上站点。

#### 步骤 1：将最新代码推送到 GitHub 仓库

```bash
git add .
git commit -m "feat: implement XHerbert web app and core H language engine"
git push origin main
```

#### 步骤 2：在 Cloudflare Dashboard 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 在左侧导航栏点击 **Compute (Workers & Pages)** -> 进入 **Workers & Pages** 页面。
3. 点击右上角的 **Create** 按钮，切换到 **Pages** 标签页，选择 **Connect to Git**（连接到 Git）。
4. 授权并选择你的 GitHub 账号及 `herbert` 仓库，点击 **Begin setup**。

#### 步骤 3：配置构建参数（Build Settings）

在设置构建页面中，填写以下参数：

| 配置项 (Setting) | 填写值 (Value) | 说明 |
| :--- | :--- | :--- |
| **Project name** | `xherbert` | 将生成默认预览域名 `xherbert.pages.dev` |
| **Production branch** | `main` | 生产分支 |
| **Framework preset** | `Vite` | 选择 Vite 预设（或 None 手动填写下方两项） |
| **Build command** | `npm run build` | 编译 TypeScript 并打包生产静态资源 |
| **Build output directory** | `dist` | Vite 编译产物的输出目录（注意不要带 `/` 前缀） |

点击展开下方的 **Environment variables (optional)**，建议添加一条环境变量以确保使用新版 Node.js 构建：
- Variable name: `NODE_VERSION`
- Value: `22`

5. 点击 **Save and Deploy**。
6. 等待约 30 - 60 秒，Cloudflare 会自动完成 `npm install` 和 `npm run build`，并将 `dist/` 发布上线。构建完成后即可访问 `https://xherbert.pages.dev` 查看效果。

---

### 方式二：使用 Wrangler CLI 从本地直接部署（无需等待 Git CI）

如果你想直接从本地电脑把编译好的 `dist/` 目录一键推送到 Cloudflare Pages：

#### 步骤 1：在本地构建生产静态包

```bash
npm run build
```

#### 步骤 2：登录 Cloudflare 并发布 `dist` 目录

```bash
# 1. 登录 Cloudflare 账号（会弹出浏览器授权窗口）
npx wrangler login

# 2. 创建 Pages 项目（仅首次需要执行）
npx wrangler pages project create xherbert --production-branch main

# 3. 将本地 dist/ 目录直接部署到 Cloudflare Pages 生产环境
npx wrangler pages deploy dist --project-name xherbert --branch main
```

---

### 第三部分：绑定自定义域名 `xherbert.maxithome.com`

无论你采用上述哪种方式创建了 `xherbert` Pages 项目，接下来只需几步即可绑定 `xherbert.maxithome.com`：

#### 情况 A：`maxithome.com` 的 DNS 已经托管在同一个 Cloudflare 账号下

1. 进入 Cloudflare Dashboard -> **Workers & Pages** -> 点击你的 **`xherbert`** 项目。
2. 切换到顶部的 **Custom domains（自定义域）** 标签页。
3. 点击 **Set up a custom domain** 按钮。
4. 输入域名：`xherbert.maxithome.com`，点击 **Continue**。
5. Cloudflare 会自动检测到 `maxithome.com` 位于你的账户下，并自动为你生成一条指向 `xherbert.pages.dev` 的 **CNAME 记录**（开启小黄云 Proxy）。
6. 点击 **Activate domain**。
7. 等待 1 - 2 分钟 SSL/TLS 边缘证书自动签发完毕，状态变为 **Active** 后，即可直接通过 `https://xherbert.maxithome.com` 访问！

#### 情况 B：`maxithome.com` 的 DNS 托管在其他域名服务商（如阿里云、腾讯云、Namecheap 等）

1. 同样在 `xherbert` Pages 项目的 **Custom domains** 页面输入 `xherbert.maxithome.com`。
2. Cloudflare 会提示你手动添加一条 CNAME 解析记录。
3. 前往你的域名 DNS 管理后台，添加如下记录：
   - **记录类型 (Type)**：`CNAME`
   - **主机记录 (Name / Host)**：`xherbert`
   - **记录值 (Target / Value)**：`xherbert.pages.dev`
   - **TTL**：自动或 `600` 秒
4. 保存 DNS 记录后回到 Cloudflare 页面点击验证，待证书签发完成后即可通过 `https://xherbert.maxithome.com` 访问。

---

### 第四部分：上线后验证清单（Post-Deployment Checklist）

部署并绑定域名完成后，建议在浏览器打开 `https://xherbert.maxithome.com` 进行以下快速巡检：

1. **HTTPS 与首屏加载**：确认地址栏锁标正常，页面秒开无报错。
2. **Light / Dark 主题切换**：点击右上角太阳/月亮图标，刷新页面验证主题状态是否持久化在本地浏览器。
3. **Play 模式闯关与调试**：输入 `a:sa` 换行 `a`，点击 `Instant` 或单步 `Step Forward`，验证实时字节数（`4 / 6 Bytes`）、调用栈显示及过关弹窗。
4. **Learn 模式教程**：切换到 `Learn` 标签页，验证 5 步快速教程与右侧 `Reference` 语法速查抽屉。
5. **Create 模式与 `.txt` 批量上传**：切换到 `Create` 标签页，尝试修改长宽（如 `35 cols x 25 rows`）、绘制按钮、导出 `.txt` 文件以及批量拖拽上传 `.txt` 关卡文件。
