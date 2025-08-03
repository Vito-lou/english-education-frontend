import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Department } from '@/lib/api';

const departmentSchema = z.object({
  name: z.string().min(1, '部门名称不能为空').max(100, '部门名称不能超过100个字符'),
  code: z.string().min(1, '部门代码不能为空').max(50, '部门代码不能超过50个字符'),
  type: z.enum(['campus', 'department', 'classroom']),
  description: z.string().optional(),
  manager_name: z.string().optional(),
  manager_phone: z.string().optional(),
  address: z.string().optional(),
  capacity: z.number().min(1, '容量必须大于0').optional(),
  facilities: z.array(z.string()).optional(),
  sort_order: z.number().min(0, '排序不能为负数').optional(),
  status: z.enum(['active', 'inactive']),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  department?: Department;
  parentDepartment?: Department;
  institutionId: number;
  onSubmit: (data: DepartmentFormData & { institution_id: number; parent_id?: number }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  department,
  parentDepartment,
  institutionId,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: department?.name || '',
      code: department?.code || '',
      type: department?.type || 'department',
      description: department?.description || '',
      manager_name: department?.manager_name || '',
      manager_phone: department?.manager_phone || '',
      address: department?.address || '',
      capacity: department?.capacity || undefined,
      facilities: department?.facilities || [],
      sort_order: department?.sort_order || 0,
      status: department?.status || 'active',
    },
  });

  const typeValue = watch('type');
  const statusValue = watch('status');
  const facilitiesValue = watch('facilities') || [];

  const handleFormSubmit = (data: DepartmentFormData) => {
    onSubmit({
      ...data,
      institution_id: institutionId,
      parent_id: parentDepartment?.id,
    });
  };

  const addFacility = () => {
    const newFacilities = [...facilitiesValue, ''];
    setValue('facilities', newFacilities);
  };

  const removeFacility = (index: number) => {
    const newFacilities = facilitiesValue.filter((_, i) => i !== index);
    setValue('facilities', newFacilities);
  };

  const updateFacility = (index: number, value: string) => {
    const newFacilities = [...facilitiesValue];
    newFacilities[index] = value;
    setValue('facilities', newFacilities);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {department ? '编辑部门信息' : '创建新部门'}
          {parentDepartment && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              上级部门: {parentDepartment.name}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">部门名称 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="请输入部门名称"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">部门代码 *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="请输入部门代码"
              />
              {errors.code && (
                <p className="text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">部门类型 *</Label>
              <Select
                value={typeValue}
                onValueChange={(value) => setValue('type', value as 'campus' | 'department' | 'classroom')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择部门类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campus">校区</SelectItem>
                  <SelectItem value="department">部门</SelectItem>
                  <SelectItem value="classroom">教室</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select
                value={statusValue}
                onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="inactive">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">部门描述</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="请输入部门描述"
              rows={3}
            />
          </div>

          {/* 负责人信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager_name">负责人</Label>
              <Input
                id="manager_name"
                {...register('manager_name')}
                placeholder="请输入负责人姓名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager_phone">负责人电话</Label>
              <Input
                id="manager_phone"
                {...register('manager_phone')}
                placeholder="请输入负责人电话"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">地址</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="请输入地址"
            />
          </div>

          {/* 教室特有字段 */}
          {typeValue === 'classroom' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="capacity">容量</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...register('capacity', { valueAsNumber: true })}
                  placeholder="请输入教室容量"
                />
                {errors.capacity && (
                  <p className="text-sm text-red-600">{errors.capacity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>设施设备</Label>
                <div className="space-y-2">
                  {facilitiesValue.map((facility, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={facility}
                        onChange={(e) => updateFacility(index, e.target.value)}
                        placeholder="请输入设施名称"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFacility(index)}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFacility}
                  >
                    添加设施
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="sort_order">排序</Label>
            <Input
              id="sort_order"
              type="number"
              {...register('sort_order', { valueAsNumber: true })}
              placeholder="请输入排序号"
            />
            {errors.sort_order && (
              <p className="text-sm text-red-600">{errors.sort_order.message}</p>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : (department ? '更新' : '创建')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DepartmentForm;
