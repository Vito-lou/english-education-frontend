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

## 🚨 常见问题

### Node.js 版本错误

如果遇到 "This version of pnpm requires at least Node.js v18.12" 错误：

```bash
# 使用 nvm 切换到正确版本
nvm use 20

# 或运行自动设置脚本
./scripts/setup-node.sh
```

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
