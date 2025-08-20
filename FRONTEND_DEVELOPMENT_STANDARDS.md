# 英语教育管理系统 - 前端开发规范

> 基于 React 18 + TypeScript + Vite + shadcn/ui 技术栈的开发标准
>
> 本文档整合了项目配置、开发规范和最佳实践

## 🏗️ 项目架构标准

### 技术栈要求

- **Node.js**: >= 18.0.0
- **包管理器**: pnpm (强制使用)
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 库**: shadcn/ui + Tailwind CSS v3.4.x
- **状态管理**: Zustand + React Query
- **表单验证**: React Hook Form + Zod (强制使用)

### 目录结构标准

```
src/
├── components/
│   ├── ui/                  # shadcn/ui 基础组件
│   ├── academic/            # 业务组件
│   └── layout/              # 布局组件
├── pages/                   # 页面组件
├── schemas/                 # Zod 验证规则 (必需)
├── stores/                  # Zustand 状态管理
├── lib/                     # 工具库
└── types/                   # TypeScript 类型定义
```

## 📋 表单验证标准

### 🎯 统一使用 React Hook Form + Zod 方案

**原因：**

- 声明式验证规则，代码更清晰
- TypeScript 类型安全
- 性能优秀（最小重渲染）
- 与 shadcn/ui 完美集成
- 业界最佳实践

### 📦 必需依赖

```bash
pnpm add react-hook-form @hookform/resolvers zod
```

### 🔧 标准实现模式

#### 1. 定义验证 Schema

```typescript
import * as z from "zod";

const batchScheduleSchema = z.object({
  course_id: z.string().min(1, "请选择授课课程"),
  teacher_id: z.string().min(1, "请选择授课教师"),
  time_slot_id: z.string().min(1, "请选择上课时间"),
  classroom: z.string().optional(),
  lesson_content: z.string().optional(),
  dates: z.array(z.date()).min(1, "请至少选择一个上课日期"),
});

type BatchScheduleForm = z.infer<typeof batchScheduleSchema>;
```

#### 2. 使用 useForm Hook

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<BatchScheduleForm>({
  resolver: zodResolver(batchScheduleSchema),
  defaultValues: {
    course_id: "",
    teacher_id: "",
    time_slot_id: "",
    classroom: "",
    lesson_content: "",
    dates: [],
  },
});
```

#### 3. 使用 shadcn/ui Form 组件

```typescript
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="course_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>授课课程</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="选择课程" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>;
```

### 🎨 自动化特性

使用标准方案后，以下功能自动实现：

- ✅ **必填标识** - FormLabel 自动显示红色星号
- ✅ **错误提示** - FormMessage 自动显示验证错误
- ✅ **类型安全** - TypeScript 完整类型推导
- ✅ **性能优化** - 只重渲染有变化的字段

### 📁 推荐文件结构

```
src/
├── schemas/
│   ├── schedule.ts          # 排课相关验证规则
│   ├── student.ts           # 学员相关验证规则
│   └── course.ts            # 课程相关验证规则
├── components/
│   └── forms/
│       ├── ScheduleForm.tsx # 排课表单组件
│       └── StudentForm.tsx  # 学员表单组件
└── utils/
    └── validation.ts        # 通用验证工具
```

## 🚫 禁止使用的方案

### ❌ 手动字段验证

```typescript
// 禁止这样写
if (!formData.course_id) {
  errors.push("请选择授课课程");
}
if (!formData.teacher_id) {
  errors.push("请选择授课教师");
}
```

### ❌ 原生 HTML 验证

```typescript
// 禁止依赖原生验证
<input required />
```

## 📋 待重构列表

### 🔄 需要重构的现有表单

1. **ClassScheduleManagement.tsx** - 一键排课表单

   - 当前：手动验证
   - 目标：React Hook Form + Zod
   - 优先级：中

2. **StudentEditor.tsx** - 学员编辑表单

   - 当前：需检查
   - 目标：React Hook Form + Zod
   - 优先级：低

3. **ClassEditor.tsx** - 班级编辑表单

   - 当前：需检查
   - 目标：React Hook Form + Zod
   - 优先级：低

4. **CourseEditor.tsx** - 课程编辑表单

   - 当前：需检查
   - 目标：React Hook Form + Zod
   - 优先级：低

5. **TimeSlotSettings.tsx** - 时间段设置表单
   - 当前：需检查
   - 目标：React Hook Form + Zod
   - 优先级：低

### 📝 新功能开发

**所有新的表单功能必须使用 React Hook Form + Zod 方案**

包括但不限于：

- 考勤管理表单
- 成绩录入表单
- 财务管理表单
- 系统设置表单

## 🎯 实施计划

### 阶段一：基础设施

- [ ] 安装必需依赖
- [ ] 创建通用验证 schemas
- [ ] 建立标准组件模板

### 阶段二：新功能

- [ ] 所有新表单使用标准方案
- [ ] 建立代码审查检查点

### 阶段三：重构（可选）

- [ ] 重构现有关键表单
- [ ] 统一用户体验

## 📚 参考资源

- [React Hook Form 官方文档](https://react-hook-form.com/)
- [Zod 官方文档](https://zod.dev/)
- [shadcn/ui Form 组件](https://ui.shadcn.com/docs/components/form)

## 🔧 项目配置标准

### 环境配置

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=英语教育管理系统
```

### 必需依赖安装

```bash
# 基础依赖
pnpm add react-hook-form @hookform/resolvers zod
pnpm add axios @tanstack/react-query zustand
pnpm add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# 开发依赖
pnpm add -D @types/node tailwindcss@^3.4.0 postcss autoprefixer tailwindcss-animate
```

### TypeScript 配置 (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Vite 配置 (vite.config.ts)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
```

## 🎨 UI/UX 标准

### 组件使用规范

- **基础组件**: 优先使用 shadcn/ui 组件
- **图标**: 统一使用 lucide-react
- **样式**: 使用 Tailwind CSS，避免自定义 CSS
- **响应式**: 移动端优先设计

### 交互规范

- **加载状态**: 所有异步操作必须显示加载状态
- **错误处理**: 使用 toast 组件显示错误信息
- **确认操作**: 危险操作使用确认对话框
- **表单验证**: 实时验证 + 提交验证

## 📊 状态管理标准

### Zustand Store 结构

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // state and actions
    }),
    {
      name: "auth-storage",
    }
  )
);
```

### React Query 配置

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

## 🔒 代码质量标准

### TypeScript 要求

- **严格模式**: 启用 strict 模式
- **类型定义**: 避免使用 any，优先使用具体类型
- **接口定义**: 所有 API 响应必须有类型定义

### 命名规范

- **组件**: PascalCase (UserProfile.tsx)
- **函数**: camelCase (handleSubmit)
- **常量**: UPPER_SNAKE_CASE (API_BASE_URL)
- **文件**: kebab-case (user-profile.ts) 或 PascalCase (UserProfile.tsx)

### 代码组织

- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 提取通用逻辑为 hooks
- **可测试性**: 避免复杂的嵌套逻辑

## 🚀 性能优化标准

### React 优化

- **懒加载**: 页面组件使用 React.lazy
- **memo**: 纯展示组件使用 React.memo
- **useMemo/useCallback**: 合理使用缓存

### 打包优化

- **代码分割**: 按路由分割代码
- **资源优化**: 图片使用 WebP 格式
- **缓存策略**: 合理设置缓存头

## 📚 开发工具配置

### VSCode 配置 (.vscode/settings.json)

```json
{
  "css.validate": false,
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  },
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

### ESLint 规则

- 启用 TypeScript 严格检查
- 禁用 console.log (生产环境)
- 强制使用 const/let 而非 var

---

**⚠️ 重要提醒：**

1. **表单验证**: 从现在开始，任何涉及表单验证的新功能开发，都必须严格按照 React Hook Form + Zod 规范执行
2. **代码审查**: 所有 PR 必须通过代码审查，确保符合本规范
3. **依赖管理**: 新增依赖必须经过团队讨论，避免重复功能的包
