import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi, type OrganizationNode, type CreateNodeData } from '@/lib/api';

// 获取完整的组织架构树
export const useOrganizationTree = () => {
  return useQuery({
    queryKey: ['organization-tree'],
    queryFn: () => organizationApi.getTree(),
    select: (data) => data.data.data,
  });
};

// 创建组织节点
export const useCreateOrganizationNode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: organizationApi.createNode,
    onSuccess: () => {
      // 刷新组织架构树
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
    },
  });
};

// 更新组织节点
export const useUpdateOrganizationNode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateNodeData> }) =>
      organizationApi.updateNode(id, data),
    onSuccess: () => {
      // 刷新组织架构树
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
    },
  });
};

// 删除组织节点
export const useDeleteOrganizationNode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: organizationApi.deleteNode,
    onSuccess: () => {
      // 刷新组织架构树
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
    },
  });
};

// 移动组织节点
export const useMoveOrganizationNode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, newParentId, newSortOrder }: { 
      id: number; 
      newParentId?: number; 
      newSortOrder?: number; 
    }) => organizationApi.moveNode(id, newParentId, newSortOrder),
    onSuccess: () => {
      // 刷新组织架构树
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
    },
  });
};

// 工具函数：将扁平数据转换为树形结构
export const buildTree = (nodes: OrganizationNode[]): OrganizationNode[] => {
  const nodeMap = new Map<number, OrganizationNode>();
  const rootNodes: OrganizationNode[] = [];

  // 创建节点映射
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // 构建树形结构
  nodes.forEach(node => {
    const currentNode = nodeMap.get(node.id)!;
    
    if (node.parent_id) {
      const parentNode = nodeMap.get(node.parent_id);
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(currentNode);
      }
    } else {
      rootNodes.push(currentNode);
    }
  });

  // 按sort_order排序
  const sortNodes = (nodes: OrganizationNode[]) => {
    nodes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(rootNodes);
  return rootNodes;
};

// 工具函数：获取节点的图标
export const getNodeIcon = (type: OrganizationNode['type']) => {
  switch (type) {
    case 'institution':
      return '🏢';
    case 'campus':
      return '🏫';
    case 'department':
      return '📁';
    case 'classroom':
      return '🏫';
    default:
      return '📄';
  }
};

// 工具函数：获取节点的类型名称
export const getNodeTypeName = (type: OrganizationNode['type']) => {
  switch (type) {
    case 'institution':
      return '机构';
    case 'campus':
      return '校区';
    case 'department':
      return '部门';
    case 'classroom':
      return '教室';
    default:
      return '未知';
  }
};

// 工具函数：获取状态标签样式
export const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'default';
    case 'inactive':
      return 'secondary';
    default:
      return 'outline';
  }
};

// 工具函数：获取状态名称
export const getStatusName = (status: string) => {
  switch (status) {
    case 'active':
      return '正常';
    case 'inactive':
      return '停用';
    default:
      return '未知';
  }
};
