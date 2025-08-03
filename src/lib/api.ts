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

// 创建节点的数据类型
export interface CreateNodeData {
  type: "institution" | "campus" | "department" | "classroom";
  parent_id?: number;
  name: string;
  code: string;
  description?: string;
  manager_name?: string;
  manager_phone?: string;
  address?: string;
  capacity?: number;
  facilities?: string[];
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

export default api;
