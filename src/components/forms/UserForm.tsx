import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { institutionApi, roleApi, departmentApi } from '@/lib/api';

// 用户表单数据验证模式
const userSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(100, '姓名不能超过100个字符'),
  phone: z.string().min(1, '手机号不能为空').max(20, '手机号不能超过20个字符'),
  email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  password: z.string().min(6, '密码至少6个字符').optional(),
  institution_id: z.number().min(1, '请选择机构'),
  department_id: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  role_ids: z.array(z.number()).optional(), // 改为可选，因为我们用独立状态管理
});

type UserFormData = z.infer<typeof userSchema>;

interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  institution_id: number;
  department_id?: number;
  roles: { id: number; name: string }[];
}

interface UserFormProps {
  user?: User;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const isEditing = !!user;
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(user?.roles?.map(r => r.id) || []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      password: '',
      institution_id: user?.institution_id || 0,
      department_id: user?.department_id || 0,
      status: (user?.status as 'active' | 'inactive') || 'active',
      role_ids: user?.roles?.map(r => r.id) || [],
    },
  });

  const selectedInstitutionId = watch('institution_id');

  // 当用户变化时更新选中的角色
  useEffect(() => {
    if (user) {
      setSelectedRoleIds(user.roles?.map(r => r.id) || []);
    } else {
      setSelectedRoleIds([]);
    }
  }, [user]);

  // 获取机构列表
  const { data: institutionsData } = useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const response = await institutionApi.getList();
      return response.data;
    },
  });

  // 获取部门列表
  const { data: departmentsData } = useQuery({
    queryKey: ['departments', selectedInstitutionId],
    queryFn: async () => {
      if (!selectedInstitutionId) return { data: { data: [] } };
      const response = await departmentApi.getList({ institution_id: selectedInstitutionId });
      return response.data;
    },
    enabled: !!selectedInstitutionId,
  });

  // 获取角色列表
  const { data: rolesData } = useQuery({
    queryKey: ['roles', selectedInstitutionId],
    queryFn: async () => {
      const params = selectedInstitutionId ? { institution_id: selectedInstitutionId } : {};
      const response = await roleApi.getList(params);
      return response.data;
    },
  });

  const institutions = institutionsData?.data?.data || [];
  const departments = departmentsData?.data?.data || [];
  const roles = rolesData?.data?.data || [];

  const handleFormSubmit = (data: UserFormData) => {
    // 验证角色选择
    if (selectedRoleIds.length === 0) {
      return; // 不提交，错误信息已在UI中显示
    }

    // 确保角色ID被正确设置
    const submitData = {
      ...data,
      role_ids: selectedRoleIds,
    };

    // 如果是编辑模式且密码为空，则不传递密码字段
    if (isEditing && !submitData.password) {
      const { password, ...finalData } = submitData;
      onSubmit(finalData as UserFormData);
    } else {
      onSubmit(submitData);
    }
  };

  const handleRoleChange = (roleId: number, checked: boolean) => {
    if (checked) {
      setSelectedRoleIds(prev => [...prev, roleId]);
    } else {
      setSelectedRoleIds(prev => prev.filter(id => id !== roleId));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名 *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="请输入姓名"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">手机号 *</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="请输入手机号"
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="请输入邮箱"
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? '密码（留空则不修改）' : '密码 *'}
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder={isEditing ? '留空则不修改密码' : '请输入密码'}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        {/* 机构和部门 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="institution_id">所属机构 *</Label>
            <select
              id="institution_id"
              {...register('institution_id', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>请选择机构</option>
              {institutions.map((institution: any) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
            {errors.institution_id && (
              <p className="text-sm text-red-600">{errors.institution_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department_id">所属部门</Label>
            <select
              id="department_id"
              {...register('department_id', {
                valueAsNumber: true,
                setValueAs: (value) => value === 0 ? undefined : value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedInstitutionId}
            >
              <option value={0}>请选择部门</option>
              {departments.map((department: any) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            {errors.department_id && (
              <p className="text-sm text-red-600">{errors.department_id.message}</p>
            )}
          </div>
        </div>

        {/* 用户状态 - 只在编辑模式下显示 */}
        {isEditing && (
          <div className="space-y-2">
            <Label htmlFor="status">用户状态</Label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">正常</option>
              <option value="inactive">禁用</option>
            </select>
            {errors.status && (
              <p className="text-sm text-red-600">{errors.status.message}</p>
            )}
            <p className="text-xs text-gray-500">
              • 正常：用户可以正常使用系统<br />
              • 禁用：用户无法登录系统
            </p>
          </div>
        )}

        {/* 角色选择 */}
        <div className="space-y-2">
          <Label>角色权限 *</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-300 rounded-md">
            {roles.map((role: any) => (
              <label key={role.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{role.name}</span>
              </label>
            ))}
          </div>
          {selectedRoleIds.length === 0 && (
            <p className="text-sm text-red-600">请至少选择一个角色</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : (isEditing ? '更新用户' : '创建用户')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
