import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    } else if (error.response?.status === 403) {
      // 用户被禁用
      localStorage.removeItem("auth_token");
      alert("账户已被禁用，请联系管理员");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// 类型定义
export interface Institution {
  id: number;
  name: string;
  code: string;
  logo?: string;
  description?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  business_license?: string;
  business_hours?: Record<string, string[]>;
  settings?: Record<string, unknown>;
  status: "active" | "inactive" | "suspended";
  established_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  institution_id: number;
  parent_id?: number;
  name: string;
  code: string;
  type: "campus" | "department" | "classroom";
  description?: string;
  manager_name?: string;
  manager_phone?: string;
  address?: string;
  capacity?: number;
  facilities?: string[];
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  // 关联数据
  institution?: Institution;
  parent?: Department;
  children?: Department[];
  path?: string;
}

// 组织架构统一节点类型
export interface OrganizationNode {
  id: number;
  parent_id?: number;
  name: string;
  code: string;
  type: "institution" | "campus" | "department" | "classroom";
  description?: string;
  manager_name?: string;
  manager_phone?: string;
  address?: string;
  capacity?: number;
  facilities?: string[];
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;

  // 机构特有字段
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  business_license?: string;
  business_hours?: Record<string, any>;
  settings?: Record<string, any>;
  established_at?: string;

  // 树形结构
  children?: OrganizationNode[];
  level?: number;
}

// 课程相关类型
export interface Course {
  id: number;
  subject_id: number;
  name: string;
  code: string;
  description?: string;
  has_levels: boolean;
  institution_id: number;
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  // 关联数据
  subject?: {
    id: number;
    name: string;
  };
  levels?: CourseLevel[];
}

export interface CourseLevel {
  id: number;
  course_id: number;
  name: string;
  code: string;
  description?: string;
  sort_order: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

// 创建节点的数据类型
export interface CreateNodeData {
  type: "institution" | "campus" | "department";
  parent_id?: number;
  name: string;
  code: string;
  description?: string;
  manager_name?: string;
  manager_phone?: string;
  address?: string;
  sort_order?: number;
  status?: "active" | "inactive";

  // 机构特有字段
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  business_license?: string;
  business_hours?: Record<string, any>;
  settings?: Record<string, any>;
  established_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// 机构管理API
export const institutionApi = {
  // 获取机构列表
  getList: (params?: {
    search?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
    per_page?: number;
    page?: number;
  }) =>
    api.get<ApiResponse<PaginatedResponse<Institution>>>(
      "/admin/institutions",
      { params }
    ),

  // 获取机构详情
  getDetail: (id: number) =>
    api.get<ApiResponse<Institution>>(`/admin/institutions/${id}`),

  // 创建机构
  create: (data: Partial<Institution>) =>
    api.post<ApiResponse<Institution>>("/admin/institutions", data),

  // 更新机构
  update: (id: number, data: Partial<Institution>) =>
    api.put<ApiResponse<Institution>>(`/admin/institutions/${id}`, data),

  // 删除机构
  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/admin/institutions/${id}`),

  // 获取机构统计
  getStatistics: (id: number) =>
    api.get<ApiResponse<Record<string, number>>>(
      `/admin/institutions/${id}/statistics`
    ),
};

// 部门管理API
export const departmentApi = {
  // 获取部门列表
  list: (params?: {
    institution_id?: number;
    type?: string;
    parent_id?: number;
    search?: string;
    status?: string;
    per_page?: number;
    page?: number;
  }) =>
    api.get<ApiResponse<PaginatedResponse<Department>>>("/admin/departments", {
      params,
    }),

  // 获取部门选项（用于下拉框）
  options: (params?: { type?: string }) =>
    api.get<ApiResponse<Department[]>>("/admin/departments-options", {
      params,
    }),

  // 获取部门列表（别名，保持兼容性）
  getList: (params?: {
    institution_id?: number;
    type?: string;
    parent_id?: number;
    search?: string;
    status?: string;
    per_page?: number;
    page?: number;
  }) =>
    api.get<ApiResponse<PaginatedResponse<Department>>>("/admin/departments", {
      params,
    }),

  // 获取部门树形结构
  getTree: (institutionId: number) =>
    api.get<ApiResponse<Department[]>>("/admin/departments/tree", {
      params: { institution_id: institutionId },
    }),

  // 获取部门详情
  getDetail: (id: number) =>
    api.get<ApiResponse<Department>>(`/admin/departments/${id}`),

  // 创建部门
  create: (data: Partial<Department>) =>
    api.post<ApiResponse<Department>>("/admin/departments", data),

  // 更新部门
  update: (id: number, data: Partial<Department>) =>
    api.put<ApiResponse<Department>>(`/admin/departments/${id}`, data),

  // 删除部门
  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/admin/departments/${id}`),
};

// 组织架构统一API
export const organizationApi = {
  // 获取完整的组织架构树（包含机构和部门）
  getTree: () =>
    api.get<ApiResponse<OrganizationNode[]>>("/admin/organization/tree"),

  // 创建组织节点（机构或部门）
  createNode: (data: CreateNodeData) =>
    api.post<ApiResponse<OrganizationNode>>("/admin/organization/nodes", data),

  // 更新组织节点
  updateNode: (id: number, data: Partial<CreateNodeData>) =>
    api.put<ApiResponse<OrganizationNode>>(
      `/admin/organization/nodes/${id}`,
      data
    ),

  // 删除组织节点
  deleteNode: (id: number) =>
    api.delete<ApiResponse<null>>(`/admin/organization/nodes/${id}`),

  // 移动节点（调整层级关系）
  moveNode: (id: number, newParentId?: number, newSortOrder?: number) =>
    api.put<ApiResponse<OrganizationNode>>(
      `/admin/organization/nodes/${id}/move`,
      {
        parent_id: newParentId,
        sort_order: newSortOrder,
      }
    ),
};

// 角色管理API
export const roleApi = {
  // 获取角色列表
  getList: (params?: {
    institution_id?: number;
    search?: string;
    status?: string;
    per_page?: number;
    page?: number;
  }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>("/admin/roles", { params }),

  // 获取角色详情
  getDetail: (id: number) => api.get<ApiResponse<any>>(`/admin/roles/${id}`),

  // 创建角色
  create: (data: {
    name: string;
    code: string;
    description: string;
    institution_id: number;
    permission_ids: number[];
    menu_ids: number[];
    data_permission_ids: number[];
  }) => api.post<ApiResponse<any>>("/admin/roles", data),

  // 更新角色
  update: (
    id: number,
    data: {
      name?: string;
      description?: string;
      permission_ids?: number[];
      menu_ids?: number[];
      data_permission_ids?: number[];
    }
  ) => api.put<ApiResponse<any>>(`/admin/roles/${id}`, data),

  // 删除角色
  delete: (id: number) => api.delete<ApiResponse<null>>(`/admin/roles/${id}`),
};

// 权限管理API
export const permissionApi = {
  // 获取功能权限树
  getPermissions: () => api.get<ApiResponse<any>>("/admin/permissions"),

  // 获取数据权限列表
  getDataPermissions: () =>
    api.get<ApiResponse<any>>("/admin/permissions/data"),

  // 获取所有权限（用于角色配置）
  getAllPermissions: () => api.get<ApiResponse<any>>("/admin/permissions/all"),
};

// 菜单管理API
export const menuApi = {
  // 获取菜单树
  getTree: () => api.get<ApiResponse<any>>("/admin/system-menus"),

  // 获取菜单列表
  getList: () => api.get<ApiResponse<any>>("/admin/system-menus-list"),
};

// 用户管理API
export const userApi = {
  // 获取用户列表
  getList: (params?: {
    search?: string;
    institution_id?: number;
    department_id?: number;
    status?: string;
    role?: string;
    per_page?: number;
    page?: number;
  }) =>
    api.get<ApiResponse<PaginatedResponse<any>>>("/admin/users", { params }),

  // 获取用户详情
  getDetail: (id: number) => api.get<ApiResponse<any>>(`/admin/users/${id}`),

  // 创建用户
  create: (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    institution_id: number;
    department_id?: number;
    role_ids: number[];
  }) => api.post<ApiResponse<any>>("/admin/users", data),

  // 更新用户
  update: (
    id: number,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      institution_id?: number;
      department_id?: number;
      status?: string;
    }
  ) => api.put<ApiResponse<any>>(`/admin/users/${id}`, data),

  // 分配用户角色
  assignRoles: (id: number, roleIds: number[]) =>
    api.put<ApiResponse<any>>(`/admin/users/${id}/roles`, {
      role_ids: roleIds,
    }),

  // 删除用户
  delete: (id: number) => api.delete<ApiResponse<null>>(`/admin/users/${id}`),

  // 获取用户选项（用于下拉框）
  options: (params?: { role?: string }) =>
    api.get<ApiResponse<any[]>>("/admin/users-options", {
      params,
    }),
};

// 课程管理 API
export const courseApi = {
  // 获取课程列表
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    subject_id?: number;
  }) =>
    api.get<ApiResponse<PaginatedResponse<Course>>>("/admin/courses", {
      params,
    }),

  // 获取课程详情
  get: (id: number) => api.get<ApiResponse<Course>>(`/admin/courses/${id}`),

  // 获取课程级别
  getLevels: (courseId: number) =>
    api.get<ApiResponse<CourseLevel[]>>(`/admin/courses/${courseId}/levels`),

  // 创建课程
  create: (data: Partial<Course>) =>
    api.post<ApiResponse<Course>>("/admin/courses", data),

  // 更新课程
  update: (id: number, data: Partial<Course>) =>
    api.put<ApiResponse<Course>>(`/admin/courses/${id}`, data),

  // 删除课程
  delete: (id: number) => api.delete<ApiResponse<null>>(`/admin/courses/${id}`),

  // 获取课程选项（用于下拉框）
  options: () => api.get<ApiResponse<Course[]>>("/admin/courses-options"),
};

// 班级管理 API
export const classApi = {
  // 获取班级列表
  list: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    campus_id?: number;
    course_id?: number;
    sort_by?: string;
    sort_order?: string;
  }) =>
    api.get<ApiResponse<PaginatedResponse<ClassModel>>>("/admin/classes", {
      params,
    }),

  // 获取班级详情
  get: (id: number) => api.get<ApiResponse<ClassModel>>(`/admin/classes/${id}`),

  // 创建班级
  create: (data: {
    name: string;
    campus_id: number;
    course_id: number;
    level_id?: number;
    max_students: number;
    teacher_id: number;
    total_lessons: number;
    remarks?: string;
  }) => api.post<ApiResponse<ClassModel>>("/admin/classes", data),

  // 更新班级
  update: (
    id: number,
    data: {
      name: string;
      campus_id: number;
      course_id: number;
      level_id?: number;
      max_students: number;
      teacher_id: number;
      total_lessons: number;
      remarks?: string;
    }
  ) => api.put<ApiResponse<ClassModel>>(`/admin/classes/${id}`, data),

  // 删除班级
  delete: (id: number) => api.delete<ApiResponse<null>>(`/admin/classes/${id}`),

  // 结业班级
  graduate: (id: number) =>
    api.post<ApiResponse<ClassModel>>(`/admin/classes/${id}/graduate`),

  // 获取班级统计
  statistics: () =>
    api.get<ApiResponse<ClassStats>>("/admin/classes-statistics"),
};

// 班级相关类型
export interface ClassModel {
  id: number;
  name: string;
  campus_id: number;
  course_id: number;
  level_id?: number;
  max_students: number;
  teacher_id: number;
  total_lessons: number;
  status: "active" | "graduated";
  start_date: string;
  end_date?: string;
  remarks?: string;
  institution_id: number;
  current_student_count: number;
  capacity_info: string;
  status_name: string;
  campus: {
    id: number;
    name: string;
  };
  course: {
    id: number;
    name: string;
  };
  level?: {
    id: number;
    name: string;
  };
  teacher: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ClassStats {
  total: number;
  active: number;
  graduated: number;
}

export { api };
export default api;
