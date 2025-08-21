import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import RoleList from './RoleList';
import RoleEditor from './RoleEditor';
import { roleApi, permissionApi, menuApi } from '@/lib/api';
import { Plus, Save, RotateCcw } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  institution_id: number | null;
  is_system: boolean;
  status: string;
  permissions: Permission[];
  data_permissions: DataPermission[];
  menus: SystemMenu[];
}

interface Permission {
  id: number;
  name: string;
  code: string;
  type: string;
  children?: Permission[];
}

interface DataPermission {
  id: number;
  name: string;
  code: string;
  resource_type: string;
  scope_type: 'all' | 'partial';
}

interface SystemMenu {
  id: number;
  name: string;
  code: string;
  icon?: string;
  parent_id: number | null;
  children_items?: SystemMenu[];
}

const RoleManagement: React.FC = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取当前用户信息
  const { data: currentUserData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    },
  });

  // 获取角色列表
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await roleApi.getList();
      return response.data;
    },
  });

  // 获取所有权限
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: async () => {
      const response = await permissionApi.getAllPermissions();
      return response.data;
    },
  });

  // 获取菜单数据
  const { data: menusData } = useQuery({
    queryKey: ['system-menus-tree'],
    queryFn: async () => {
      const response = await menuApi.getTree();
      return response.data;
    },
  });

  const roles = rolesData?.data?.data || [];
  const permissions = permissionsData?.data?.permissions || [];
  const dataPermissions = permissionsData?.data?.data_permissions || {};
  const menus = menusData?.data || [];

  // 保存角色权限
  const saveRoleMutation = useMutation({
    mutationFn: async (data: {
      roleId: number;
      name: string;
      description: string;
      permission_ids: number[];
      menu_ids: number[];
      data_permission_ids: number[];
    }) => {
      const response = await roleApi.update(data.roleId, {
        name: data.name,
        description: data.description,
        permission_ids: data.permission_ids,
        menu_ids: data.menu_ids,
        data_permission_ids: data.data_permission_ids,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setHasUnsavedChanges(false);
      addToast({
        type: 'success',
        title: '保存成功',
        description: '角色权限已更新',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '保存失败',
        description: error.response?.data?.message || '保存角色权限时发生错误',
      });
    },
  });

  // 创建新角色
  const createRoleMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      description: string;
      institution_id: number;
      permission_ids: number[];
      menu_ids: number[];
      data_permission_ids: number[];
    }) => {
      const response = await roleApi.create(data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRoleId(data.data.id);
      setIsCreating(false);
      setHasUnsavedChanges(false);
      addToast({
        type: 'success',
        title: '创建成功',
        description: '新角色已创建',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '创建失败',
        description: error.response?.data?.message || '创建角色时发生错误',
      });
    },
  });

  // 选择角色时更新选中状态
  useEffect(() => {
    if (selectedRoleId && roles.length > 0) {
      const role = roles.find((r: Role) => r.id === selectedRoleId);
      setSelectedRole(role || null);
    } else if (roles.length > 0 && !selectedRoleId && !isCreating) {
      // 默认选中第一个角色
      const firstRole = roles[0];
      setSelectedRoleId(firstRole.id);
      setSelectedRole(firstRole);
    }
  }, [selectedRoleId, roles, isCreating]);

  const handleRoleSelect = (roleId: number) => {
    if (hasUnsavedChanges) {
      if (!confirm('有未保存的更改，确定要切换角色吗？')) {
        return;
      }
    }
    setSelectedRoleId(roleId);
    setHasUnsavedChanges(false);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    if (hasUnsavedChanges) {
      if (!confirm('有未保存的更改，确定要创建新角色吗？')) {
        return;
      }
    }
    setIsCreating(true);
    setSelectedRoleId(null);
    setSelectedRole(null);
    setHasUnsavedChanges(false);
  };

  const handleSave = (data: {
    name: string;
    description: string;
    permission_ids: number[];
    menu_ids: number[];
    data_permission_ids: number[];
  }) => {
    console.log('RoleManagement handleSave 接收到的数据:', data);

    if (isCreating) {
      // 创建新角色 - 从当前用户信息获取机构ID
      const currentUser = currentUserData?.data;
      const institutionId = currentUser?.institution_id;

      if (!institutionId) {
        addToast({
          type: 'error',
          title: '创建失败',
          description: '无法获取当前用户的机构信息',
        });
        return;
      }

      const createData = {
        ...data,
        code: data.name.toLowerCase().replace(/\s+/g, '_'),
        institution_id: institutionId,
      };
      console.log('创建角色数据:', createData);
      createRoleMutation.mutate(createData);
    } else if (selectedRoleId) {
      // 更新现有角色
      const updateData = {
        roleId: selectedRoleId,
        ...data,
      };
      console.log('更新角色数据:', updateData);
      saveRoleMutation.mutate(updateData);
    }
  };

  const handleCancel = () => {
    setHasUnsavedChanges(false);
    // 重新获取角色数据（方案1：简单可靠）
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  };

  // 删除角色
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      const response = await roleApi.delete(roleId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      // 如果删除的是当前选中的角色，清空选择
      if (selectedRoleId && selectedRoleId === selectedRoleId) {
        setSelectedRoleId(null);
        setSelectedRole(null);
      }
      setHasUnsavedChanges(false);
      addToast({
        type: 'success',
        title: '删除成功',
        description: '角色已删除',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '删除失败',
        description: error.response?.data?.message || '删除角色时发生错误',
      });
    },
  });

  const handleRoleDelete = (roleId: number) => {
    deleteRoleMutation.mutate(roleId);
  };

  if (rolesLoading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] overflow-hidden">
      {/* 左侧角色列表 */}
      <div className="w-60 flex-shrink-0">
        <Card className="h-full">
          <div className="p-4 border-b">
            <Button
              onClick={handleCreateNew}
              className="w-full"
              disabled={createRoleMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              新建角色
            </Button>
          </div>
          <div className="p-4 h-[calc(100%-80px)] overflow-y-auto">
            <RoleList
              roles={roles}
              selectedRoleId={selectedRoleId}
              onRoleSelect={handleRoleSelect}
              onRoleDelete={handleRoleDelete}
              isCreating={isCreating}
            />
          </div>
        </Card>
      </div>

      {/* 右侧角色编辑区 */}
      <div className="flex-1">
        <Card className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {(selectedRole || isCreating) ? (
              <div className="h-full">
                <RoleEditor
                  role={selectedRole}
                  permissions={permissions}
                  menus={menus}
                  dataPermissions={dataPermissions}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onChange={() => setHasUnsavedChanges(true)}
                  hasUnsavedChanges={hasUnsavedChanges}
                  isCreating={isCreating}
                  isSaving={saveRoleMutation.isPending || createRoleMutation.isPending}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                请选择一个角色进行编辑
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RoleManagement;
