# AI 开发常见错误记录

本文档记录了在 AI 辅助开发过程中经常出现的错误和正确的解决方案，避免重复犯错。

## 📋 目录

1. [Select 组件相关错误](#select-组件相关错误)
2. [API 调用相关错误](#api-调用相关错误)
3. [状态管理相关错误](#状态管理相关错误)
4. [TypeScript 类型相关错误](#typescript-类型相关错误)
5. [路由相关错误](#路由相关错误)
6. [数据库查询相关错误](#数据库查询相关错误)

---

## Select 组件相关错误

### ❌ 错误：SelectItem 使用空字符串作为 value

**错误代码：**

```tsx
<Select value={selectedValue} onValueChange={setSelectedValue}>
  <SelectTrigger>
    <SelectValue placeholder="请选择" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">全部</SelectItem> {/* ❌ 错误：空字符串 */}
    <SelectItem value="option1">选项1</SelectItem>
  </SelectContent>
</Select>
```

**错误信息：**

```
Uncaught Error: A <Select.Item /> must have a value prop that is not an empty string.
```

**✅ 正确做法：**

```tsx
<Select value={selectedValue} onValueChange={setSelectedValue}>
  <SelectTrigger>
    <SelectValue placeholder="请选择" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">全部</SelectItem> {/* ✅ 正确：使用非空字符串 */}
    <SelectItem value="option1">选项1</SelectItem>
  </SelectContent>
</Select>;

// 在查询逻辑中处理特殊值
const queryFn = async () => {
  const params = new URLSearchParams();
  if (selectedValue && selectedValue !== "all") {
    params.append("filter", selectedValue);
  }
  // ...
};
```

**关键点：**

- 永远不要使用空字符串 `""` 作为 SelectItem 的 value
- 使用有意义的字符串如 `"all"`, `"none"`, `"default"` 等
- 在业务逻辑中过滤掉这些特殊值

### ❌ 错误：在 Select 组件中使用 HTML optgroup 标签

**错误代码：**

```tsx
<Select>
  <SelectContent>
    {units.map((unit) => (
      <optgroup key={unit.id} label={unit.name}>
        {" "}
        {/* ❌ 错误：使用 HTML optgroup */}
        {unit.lessons?.map((lesson) => (
          <SelectItem key={lesson.id} value={lesson.id.toString()}>
            {lesson.title}
          </SelectItem>
        ))}
      </optgroup>
    ))}
  </SelectContent>
</Select>
```

**错误信息：**

```
In HTML, <div> cannot be a child of <optgroup>.
This will cause a hydration error.
```

**✅ 正确做法：**

```tsx
import { SelectGroup, SelectLabel } from "@/components/ui/select";

<Select>
  <SelectContent>
    {units.map((unit) => (
      <SelectGroup key={unit.id}>
        {" "}
        {/* ✅ 正确：使用 SelectGroup */}
        <SelectLabel>{unit.name}</SelectLabel> {/* ✅ 正确：使用 SelectLabel */}
        {unit.lessons?.map((lesson) => (
          <SelectItem key={lesson.id} value={lesson.id.toString()}>
            {lesson.title}
          </SelectItem>
        ))}
      </SelectGroup>
    ))}
  </SelectContent>
</Select>;
```

**关键点：**

- 在 Radix UI Select 组件中使用 `SelectGroup` 和 `SelectLabel` 而不是 HTML 的 `optgroup`
- 确保导入正确的组件
- 避免混用 HTML 标签和组件库的组件
- SelectItem 内容如果需要复杂结构，确保不违反 HTML 嵌套规则

---

## API 调用相关错误

### ❌ 错误：直接使用 fetch 而不是统一的 API 客户端

**错误代码：**

```tsx
// ❌ 错误做法
const response = await fetch("/api/admin/users", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    Accept: "application/json",
  },
});
```

**✅ 正确做法：**

```tsx
// ✅ 正确做法
import { api } from "@/lib/api";

const response = await api.get("/admin/users");
const users = response.data.data;
```

**关键点：**

- 始终使用项目的统一 API 客户端
- 自动处理认证、错误处理、基础 URL 等

### ❌ 错误：使用错误的 Toast 组件

**错误代码：**

```tsx
// ❌ 错误做法
import { useToast } from "@/hooks/use-toast";
const { toast } = useToast();
toast({
  title: "成功",
  variant: "destructive",
});
```

**✅ 正确做法：**

```tsx
// ✅ 正确做法
import { useToast } from "@/components/ui/toast";
const { addToast } = useToast();

addToast({
  type: "success",
  title: "操作成功",
  description: "数据保存成功",
});
```

---

## 状态管理相关错误

### ❌ 错误：忘记初始化状态的默认值

**错误代码：**

```tsx
// ❌ 可能导致运行时错误
const [selectedItems, setSelectedItems] = useState();
const [formData, setFormData] = useState();
```

**✅ 正确做法：**

```tsx
// ✅ 始终提供合适的默认值
const [selectedItems, setSelectedItems] = useState<string[]>([]);
const [formData, setFormData] = useState({
  name: "",
  email: "",
  status: "active",
});
```

### ❌ 错误：在 useEffect 中忘记依赖项

**错误代码：**

```tsx
// ❌ 缺少依赖项
useEffect(() => {
  fetchData(userId);
}, []); // 缺少 userId 依赖
```

**✅ 正确做法：**

```tsx
// ✅ 包含所有依赖项
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### ❌ 错误：useEffect 在 useQuery 之前使用变量

**错误代码：**

```tsx
// ❌ 错误：useEffect 在 useQuery 之前使用了 queryData
const Component = () => {
  const [state, setState] = useState();

  // ❌ 这里使用了还未定义的 queryData
  useEffect(() => {
    if (queryData?.data) {
      setState(queryData.data);
    }
  }, [queryData]);

  // useQuery 定义在 useEffect 之后
  const { data: queryData } = useQuery({...});
};
```

**错误信息：**

```
Uncaught ReferenceError: Cannot access 'queryData' before initialization
```

**✅ 正确做法：**

```tsx
// ✅ 正确：先定义 useQuery，再使用 useEffect
const Component = () => {
  const [state, setState] = useState();

  // 先定义 useQuery
  const { data: queryData } = useQuery({...});

  // 再使用 useEffect
  useEffect(() => {
    if (queryData?.data) {
      setState(queryData.data);
    }
  }, [queryData]);
};
```

**关键点：**

- React Hooks 必须按正确的顺序调用
- 确保变量在使用前已经定义
- useQuery 应该在使用其返回值的 useEffect 之前定义

---

## TypeScript 类型相关错误

### ❌ 错误：使用 any 类型逃避类型检查

**错误代码：**

```tsx
// ❌ 使用 any 逃避类型检查
const handleSubmit = (data: any) => {
  // ...
};
```

**✅ 正确做法：**

```tsx
// ✅ 定义具体的接口类型
interface FormData {
  name: string;
  email: string;
  status: "active" | "inactive";
}

const handleSubmit = (data: FormData) => {
  // ...
};
```

### ❌ 错误：忘记处理可选属性

**错误代码：**

```tsx
// ❌ 可能导致运行时错误
const UserCard = ({ user }: { user: User }) => {
  return <div>{user.profile.avatar}</div>; // profile 可能为 undefined
};
```

**✅ 正确做法：**

```tsx
// ✅ 使用可选链操作符
const UserCard = ({ user }: { user: User }) => {
  return <div>{user.profile?.avatar || "默认头像"}</div>;
};
```

---

## 路由相关错误

### ❌ 错误：忘记添加路由导入

**错误代码：**

```tsx
// App.tsx 中添加了路由但忘记导入组件
<Route path="/new-page" element={<NewPage />} /> // ❌ NewPage 未导入
```

**✅ 正确做法：**

```tsx
// ✅ 先导入组件
import NewPage from "@/pages/NewPage";

// 然后使用
<Route path="/new-page" element={<NewPage />} />;
```

### ❌ 错误：路由路径不一致

**错误代码：**

```tsx
// 菜单配置
{ path: '/user-management', name: '用户管理' }

// 路由配置
<Route path="/users" element={<Users />} /> // ❌ 路径不匹配
```

**✅ 正确做法：**

```tsx
// ✅ 确保路径一致
{ path: '/user-management', name: '用户管理' }
<Route path="/user-management" element={<Users />} />
```

---

## 数据库查询相关错误

### ❌ 错误：在关联查询中使用不存在的字段

**错误代码：**

```php
// ❌ 错误：class_schedules 表没有 institution_id 字段
$query->whereHas('schedule', function ($q) use ($user) {
    $q->where('institution_id', $user->institution_id);
});
```

**错误信息：**

```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'institution_id' in 'where clause'
```

**✅ 正确做法：**

```php
// ✅ 正确：通过关联表查询
$query->whereHas('schedule.class', function ($q) use ($user) {
    $q->where('institution_id', $user->institution_id);
});
```

**关键点：**

- 仔细检查数据库表结构，确认字段是否存在
- 通过正确的关联关系进行查询
- 使用 `whereHas` 进行嵌套关联查询

### ❌ 错误：前端未检查数组类型导致 map 错误

**错误代码：**

```tsx
// ❌ 错误：classes 可能不是数组
const classes = classesData?.data || [];
{
  classes.map(
    (
      cls // 如果 classes 不是数组会报错
    ) => (
      <SelectItem key={cls.id} value={cls.id.toString()}>
        {cls.name}
      </SelectItem>
    )
  );
}
```

**错误信息：**

```
Uncaught TypeError: classes.map is not a function
```

**✅ 正确做法：**

```tsx
// ✅ 正确：确保是数组类型
const classes = classesData?.data || [];
const safeClasses = Array.isArray(classes) ? classes : [];

{
  safeClasses.map((cls) => (
    <SelectItem key={cls.id} value={cls.id.toString()}>
      {cls.name}
    </SelectItem>
  ));
}
```

**关键点：**

- 始终检查数据类型，特别是从 API 返回的数据
- 使用 `Array.isArray()` 确保数据是数组
- 提供安全的默认值

---

## 🔧 开发检查清单

在提交代码前，请检查以下项目：

### Select 组件检查

- [ ] 所有 SelectItem 的 value 都不是空字符串
- [ ] 使用有意义的默认值如 "all", "none"
- [ ] 在查询逻辑中正确处理特殊值
- [ ] 使用 SelectGroup 和 SelectLabel 而不是 HTML optgroup
- [ ] 正确导入所需的 Select 相关组件

### API 调用检查

- [ ] 使用统一的 API 客户端 `api.get/post/put/delete`
- [ ] 使用正确的 Toast 组件 `useToast` from `@/components/ui/toast`
- [ ] 正确处理错误响应

### 状态管理检查

- [ ] 所有 useState 都有合适的默认值
- [ ] useEffect 包含所有必要的依赖项
- [ ] 异步操作有 loading 状态

### TypeScript 检查

- [ ] 避免使用 any 类型
- [ ] 定义清晰的接口类型
- [ ] 处理可选属性和 undefined 情况

### 路由检查

- [ ] 路由组件已正确导入
- [ ] 菜单路径与路由路径一致
- [ ] 嵌套路由结构正确

### 数据库查询检查

- [ ] 确认查询中使用的字段在对应表中存在
- [ ] 正确使用关联关系进行跨表查询
- [ ] 前端数据类型检查，确保数组操作安全

---

## 📝 更新记录

- **2025-09-01**: 创建文档，添加 Select 组件错误记录
- **2025-09-01**: 添加数据库查询相关错误（字段不存在、数组类型检查）
- **2025-09-01**: 添加 Select 组件 optgroup 错误记录
- **待更新**: 根据后续开发中遇到的问题持续更新

---

## 💡 贡献指南

如果在开发过程中遇到新的常见错误，请按以下格式添加到相应章节：

````markdown
### ❌ 错误：简短描述

**错误代码：**

```tsx
// 错误的代码示例
```
````

**错误信息：**（如果有的话）

```
错误信息内容
```

**✅ 正确做法：**

```tsx
// 正确的代码示例
```

**关键点：**

- 关键要点 1
- 关键要点 2

```

这样可以帮助团队避免重复犯错，提高开发效率！
```
