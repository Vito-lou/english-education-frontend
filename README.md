# 英语教育管理系统 - 前端

基于 React + TypeScript + Vite 构建的现代化教育管理系统前端。

## 🛠️ 环境要求

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **nvm**: 推荐使用 nvm 管理 Node.js 版本

## 🚀 快速开始

### 1. 环境设置

```bash
# 方法一：使用自动脚本（推荐）
chmod +x scripts/setup-node.sh
./scripts/setup-node.sh

# 方法二：手动切换 Node.js 版本
nvm use 20
npm install -g pnpm@9.0.0
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 启动开发服务器

```bash
pnpm dev
```

### 4. 构建生产版本

```bash
pnpm build
```

## 📋 可用脚本

- `pnpm dev` - 启动开发服务器（端口 3000）
- `pnpm build` - 构建生产版本
- `pnpm lint` - 运行 ESLint 检查
- `pnpm preview` - 预览生产构建

## 🔧 开发工具配置

项目已配置：

- ✅ `.nvmrc` - 自动指定 Node.js 版本
- ✅ `engines` 字段 - 强制版本要求
- ✅ `preinstall` 脚本 - 确保使用 pnpm
- ✅ VS Code 工作区设置
- ✅ ESLint + TypeScript 配置

## 📖 开发规范

### 🔌 API 调用规范

**❌ 错误做法：直接使用 fetch**

```typescript
// 不要这样做！
const response = await fetch("/api/admin/users", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    Accept: "application/json",
  },
});
```

**✅ 正确做法：使用统一的 API 客户端**

```typescript
// 正确的做法
import { api } from "@/lib/api";

// GET 请求
const response = await api.get("/admin/users");
const users = response.data.data;

// POST 请求
await api.post("/admin/users", userData);

// PUT 请求
await api.put(`/admin/users/${id}`, userData);

// DELETE 请求
await api.delete(`/admin/users/${id}`);
```

**API 客户端的优势：**

- ✅ 自动处理认证 token（从 `localStorage.getItem("auth_token")` 获取）
- ✅ 统一的错误处理（401 自动跳转登录页）
- ✅ 统一的基础 URL 配置
- ✅ 自动添加必要的请求头

### 🔔 Toast 通知规范

**❌ 错误做法：使用 shadcn/ui 的 toast**

```typescript
// 不要这样做！
import { useToast } from "@/hooks/use-toast";
const { toast } = useToast();
toast({
  title: "成功",
  description: "操作完成",
  variant: "destructive",
});
```

**✅ 正确做法：使用项目自定义的 toast**

```typescript
// 正确的做法
import { useToast } from "@/components/ui/toast";
const { addToast } = useToast();

// 成功提示
addToast({
  type: "success",
  title: "操作成功",
  description: "数据保存成功",
});

// 错误提示
addToast({
  type: "error",
  title: "操作失败",
  description: "网络错误，请稍后重试",
});

// 信息提示
addToast({
  type: "info",
  title: "提示",
  description: "请注意相关事项",
});
```

**Toast 类型说明：**

- `success` - 成功操作提示（绿色）
- `error` - 错误提示（红色）
- `info` - 信息提示（蓝色）

### 🎨 组件开发规范

1. **组件文件命名**：使用 PascalCase，如 `UserManagement.tsx`
2. **页面文件位置**：放在 `src/pages/` 目录下
3. **组件文件位置**：放在 `src/components/` 目录下
4. **类型定义**：在组件文件顶部定义接口类型
5. **错误处理**：使用 try-catch 包装 API 调用，并显示友好的错误提示

### 🔄 状态管理规范

1. **本地状态**：使用 `useState` 管理组件内部状态
2. **表单状态**：使用受控组件模式
3. **加载状态**：为异步操作添加 loading 状态
4. **错误状态**：妥善处理和显示错误信息

## 🚨 常见问题

### Node.js 版本错误

如果遇到 "This version of pnpm requires at least Node.js v18.12" 错误：

```bash
# 使用 nvm 切换到正确版本
nvm use 20

# 或运行自动设置脚本
./scripts/setup-node.sh
```

### API 调用 401 错误

如果遇到 401 认证错误：

1. **检查 token 存储**：确保使用正确的键名 `auth_token`
2. **使用统一 API 客户端**：不要直接使用 fetch
3. **检查登录状态**：确保用户已正确登录

### Toast 不显示

如果 toast 通知不显示：

1. **检查导入路径**：使用 `@/components/ui/toast` 而不是 `@/hooks/use-toast`
2. **检查方法名**：使用 `addToast` 而不是 `toast`
3. **检查参数格式**：使用 `type` 而不是 `variant`

## 🏗️ 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **包管理器**: pnpm
- **UI 组件**: 自定义组件库 + shadcn/ui
- **HTTP 客户端**: Axios
- **路由**: React Router
- **代码规范**: ESLint + TypeScript

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── ui/             # 基础 UI 组件
│   └── academic/       # 业务组件
├── pages/              # 页面组件
├── lib/                # 工具库
│   ├── api.ts          # API 客户端配置
│   └── utils.ts        # 工具函数
├── hooks/              # 自定义 Hooks
└── types/              # TypeScript 类型定义
```

## 🤝 贡献指南

1. 遵循项目的开发规范
2. 提交前运行 `pnpm lint` 检查代码
3. 使用统一的 API 客户端和 Toast 系统
4. 为新功能添加适当的类型定义
5. 保持代码简洁和可读性
