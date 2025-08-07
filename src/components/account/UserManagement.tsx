import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { userApi, institutionApi } from '@/lib/api';
import { Plus, Search, Edit, Trash2, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import UserForm from '@/components/forms/UserForm';
import { useToast } from '@/components/ui/toast';

interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  institution_id: number | null;
  department_id: number | null;
  status: string;
  roles: Role[];
  institution?: {
    id: number;
    name: string;
  } | null;
  department?: {
    id: number;
    name: string;
  } | null;
}

interface Role {
  id: number;
  name: string;
  is_system: boolean;
}

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms 延迟

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 获取用户列表
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', { search: debouncedSearchTerm, institution: selectedInstitution, status: selectedStatus }],
    queryFn: async () => {
      const params: {
        search?: string;
        institution_id?: number;
        status?: string;
      } = {};
      if (debouncedSearchTerm) params.search = debouncedSearchTerm;
      if (selectedInstitution) params.institution_id = parseInt(selectedInstitution);
      if (selectedStatus) params.status = selectedStatus;

      const response = await userApi.getList(params);
      return response.data;
    },
  });

  // 获取机构列表用于筛选
  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const response = await institutionApi.getList();
      return response.data;
    },
  });

  const users = usersData?.data?.data || [];
  const institutions = institutionsData?.data?.data || [];

  // 创建用户
  const createUserMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      addToast({
        type: 'success',
        title: '创建成功',
        description: '用户已成功创建',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '创建失败',
        description: error.response?.data?.message || '创建用户时发生错误',
      });
    },
  });

  // 更新用户
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      addToast({
        type: 'success',
        title: '更新成功',
        description: '用户信息已成功更新',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '更新失败',
        description: error.response?.data?.message || '更新用户时发生错误',
      });
    },
  });

  // 删除用户
  const deleteUserMutation = useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addToast({
        type: 'success',
        title: '删除成功',
        description: '用户已成功删除',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '删除失败',
        description: error.response?.data?.message || '删除用户时发生错误',
      });
    },
  });

  // 处理函数
  const handleCreateUser = (data: any) => {
    createUserMutation.mutate(data);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = (data: any) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    }
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`确定要删除用户 "${user.name}" 吗？此操作不可恢复！`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const handleToggleUserStatus = (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? '启用' : '禁用';

    if (confirm(`确定要${action}用户 "${user.name}" 吗？`)) {
      updateUserMutation.mutate({
        id: user.id,
        data: {
          name: user.name,
          phone: user.phone,
          email: user.email,
          institution_id: user.institution_id,
          department_id: user.department_id,
          status: newStatus,
        }
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '正常', variant: 'default' as const },
      inactive: { label: '禁用', variant: 'secondary' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };



  // 只在初始加载且没有任何搜索条件时显示全屏loading
  if (usersLoading && !debouncedSearchTerm && !selectedInstitution && !selectedStatus && !usersData) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        {/* 操作栏 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-1 gap-4">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索用户姓名、手机号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 筛选器 */}
            <div className="flex gap-2">
              <select
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部机构</option>
                {institutions.map((institution: { id: number; name: string }) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部状态</option>
                <option value="active">正常</option>
                <option value="inactive">禁用</option>

              </select>
            </div>
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建用户
          </Button>
        </div>

        {/* 用户列表 */}
        <Card>
          {usersLoading && (
            <div className="flex items-center justify-center py-4 border-b">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                搜索中...
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>机构</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length > 0 ? (
                users.map((user: User) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{user.institution?.name || '-'}</TableCell>
                    <TableCell>{user.department?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <Badge
                              key={role.id}
                              variant={role.is_system ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {role.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">无角色</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user)}
                          disabled={updateUserMutation.isPending}
                          className={user.status === 'active' ? 'text-orange-600 hover:text-orange-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {user.status === 'active' ? (
                            <>
                              <UserX className="w-4 h-4 mr-1" />
                              禁用
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              启用
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deleteUserMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                    <div className="space-y-2">
                      <p>暂无用户数据</p>
                      {debouncedSearchTerm && (
                        <p className="text-sm">尝试使用不同的关键词搜索</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* 分页 */}
        {users.length > 0 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                上一页
              </Button>
              <span className="text-sm text-gray-600">第 1 页，共 1 页</span>
              <Button variant="outline" size="sm" disabled>
                下一页
              </Button>
            </div>
          </div>
        )}

        {/* 创建用户对话框 */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建新用户</DialogTitle>
            </DialogHeader>
            <UserForm
              onSubmit={handleCreateUser}
              onCancel={() => setIsCreateDialogOpen(false)}
              loading={createUserMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* 编辑用户对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑用户</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <UserForm
                user={selectedUser}
                onSubmit={handleUpdateUser}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedUser(null);
                }}
                loading={updateUserMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserManagement;
