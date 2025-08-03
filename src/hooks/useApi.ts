import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  institutionApi,
  departmentApi,
  type Institution,
  type Department,
} from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

// 机构相关hooks
export const useInstitutions = (params?: {
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
  per_page?: number;
  page?: number;
}) => {
  return useQuery({
    queryKey: ["institutions", params],
    queryFn: () => institutionApi.getList(params),
    select: (data) => data.data.data,
  });
};

export const useInstitution = (id: number) => {
  return useQuery({
    queryKey: ["institution", id],
    queryFn: () => institutionApi.getDetail(id),
    select: (data) => data.data.data,
    enabled: !!id,
  });
};

export const useInstitutionStatistics = (id: number) => {
  return useQuery({
    queryKey: ["institution-statistics", id],
    queryFn: () => institutionApi.getStatistics(id),
    select: (data) => data.data.data,
    enabled: !!id,
  });
};

// 机构操作mutations
export const useCreateInstitution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: institutionApi.create,
    onSuccess: () => {
      // 刷新所有相关的查询
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({ queryKey: ["current-institution"] });
    },
  });
};

export const useUpdateInstitution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Institution> }) =>
      institutionApi.update(id, data),
    onSuccess: (_, variables) => {
      // 刷新所有相关的查询
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({
        queryKey: ["institution", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["current-institution"] });
    },
  });
};

export const useDeleteInstitution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: institutionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
    },
  });
};

// 部门相关hooks
export const useDepartments = (params?: {
  institution_id?: number;
  type?: string;
  parent_id?: number;
  search?: string;
  status?: string;
  per_page?: number;
  page?: number;
}) => {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: () => departmentApi.getList(params),
    select: (data) => data.data.data,
  });
};

export const useDepartmentTree = (institutionId: number) => {
  return useQuery({
    queryKey: ["department-tree", institutionId],
    queryFn: () => departmentApi.getTree(institutionId),
    select: (data) => data.data.data,
    enabled: !!institutionId,
  });
};

export const useDepartment = (id: number) => {
  return useQuery({
    queryKey: ["department", id],
    queryFn: () => departmentApi.getDetail(id),
    select: (data) => data.data.data,
    enabled: !!id,
  });
};

// 部门操作mutations
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: departmentApi.create,
    onSuccess: (_, variables) => {
      // 刷新所有相关的查询
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({
        queryKey: ["department-tree", variables.institution_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["current-institution-departments"],
      });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Department> }) =>
      departmentApi.update(id, data),
    onSuccess: (data, variables) => {
      // 刷新所有相关的查询
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["current-institution-departments"],
      });
      if (data.data.data.institution_id) {
        queryClient.invalidateQueries({
          queryKey: ["department-tree", data.data.data.institution_id],
        });
      }
    },
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: departmentApi.delete,
    onSuccess: () => {
      // 刷新所有相关的查询
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["department-tree"] });
      queryClient.invalidateQueries({
        queryKey: ["current-institution-departments"],
      });
    },
  });
};

// 获取当前用户的机构信息
export const useCurrentInstitution = () => {
  const user = useAuthStore((state) => state.user);
  const institutionId = user?.institution_id;

  return useQuery({
    queryKey: ["current-institution", institutionId],
    queryFn: async () => {
      if (institutionId) {
        return institutionApi.getDetail(institutionId);
      } else {
        // 如果用户没有机构ID，尝试获取第一个机构
        const response = await institutionApi.getList({ per_page: 1 });
        const institutions = response.data.data.data;
        return institutions.length > 0
          ? { data: { data: institutions[0] } }
          : null;
      }
    },
    select: (data) => data?.data.data,
    enabled: true, // 总是启用
  });
};

// 获取当前用户机构的部门树
export const useCurrentInstitutionDepartments = () => {
  const user = useAuthStore((state) => state.user);
  const institutionId = user?.institution_id;

  return useQuery({
    queryKey: ["current-institution-departments", institutionId],
    queryFn: async () => {
      if (institutionId) {
        return departmentApi.getTree(institutionId);
      } else {
        // 如果用户没有机构ID，尝试获取第一个机构的部门
        const institutionResponse = await institutionApi.getList({
          per_page: 1,
        });
        const institutions = institutionResponse.data.data.data;
        if (institutions.length > 0) {
          return departmentApi.getTree(institutions[0].id);
        }
        return { data: { data: [] } };
      }
    },
    select: (data) => data?.data.data || [],
    enabled: true, // 总是启用
  });
};
