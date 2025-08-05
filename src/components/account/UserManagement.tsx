import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { userApi, institutionApi } from '@/lib/api';
import { Plus, Search, MoreHorizontal } from 'lucide-react';

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
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // 获取用户列表
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', { search: searchTerm, institution: selectedInstitution, status: selectedStatus }],
    queryFn: async () => {
      const params: {
        search?: string;
        institution_id?: number;
        status?: string;
      } = {};
      if (searchTerm) params.search = searchTerm;
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: '正常', variant: 'default' as const },
      inactive: { label: '禁用', variant: 'secondary' as const },
      suspended: { label: '暂停', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-gray-900 truncate">{user.name}</h4>
            {getStatusBadge(user.status)}
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            <p>手机号：{user.phone}</p>
            {user.email && <p>邮箱：{user.email}</p>}
            {user.institution && (
              <p>机构：{user.institution.name}</p>
            )}
            {user.department && (
              <p>部门：{user.department.name}</p>
            )}
          </div>

          {user.roles && user.roles.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {user.roles.map(role => (
                  <Badge
                    key={role.id}
                    variant={role.is_system ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );

  if (usersLoading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
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
              <option value="suspended">暂停</option>
            </select>
          </div>
        </div>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          新建用户
        </Button>
      </div>

      {/* 用户列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.length > 0 ? (
          users.map((user: User) => (
            <UserCard key={user.id} user={user} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">
            <div className="space-y-2">
              <p>暂无用户数据</p>
              {searchTerm && (
                <p className="text-sm">尝试使用不同的关键词搜索</p>
              )}
            </div>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default UserManagement;
