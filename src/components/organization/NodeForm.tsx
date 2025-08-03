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
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrganizationNode, CreateNodeData } from '@/lib/api';
import { getNodeTypeName } from '@/hooks/useOrganization';

const nodeSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称不能超过100个字符'),
  code: z.string().min(1, '代码不能为空').max(50, '代码不能超过50个字符'),
  type: z.enum(['institution', 'campus', 'department', 'classroom']),
  description: z.string().optional(),
  manager_name: z.string().optional(),
  manager_phone: z.string().optional(),
  address: z.string().optional(),
  capacity: z.number().min(1, '容量必须大于0').optional(),
  facilities: z.array(z.string()).optional(),
  sort_order: z.number().min(0, '排序不能为负数').optional(),
  status: z.enum(['active', 'inactive']),

  // 机构特有字段
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  business_license: z.string().optional(),
  established_at: z.string().optional(),
});

type NodeFormData = z.infer<typeof nodeSchema>;

interface NodeFormProps {
  node?: OrganizationNode;
  parentNode?: OrganizationNode;
  onSubmit: (data: CreateNodeData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const NodeForm: React.FC<NodeFormProps> = ({
  node,
  parentNode,
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
  } = useForm<NodeFormData>({
    resolver: zodResolver(nodeSchema),
    defaultValues: {
      name: node?.name || '',
      code: node?.code || '',
      type: node?.type || (parentNode ? 'department' : 'institution'),
      description: node?.description || '',
      manager_name: node?.manager_name || '',
      manager_phone: node?.manager_phone || '',
      address: node?.address || '',
      capacity: node?.capacity || undefined,
      facilities: node?.facilities || [],
      sort_order: node?.sort_order || 0,
      status: node?.status || 'active',
      contact_person: node?.contact_person || '',
      contact_phone: node?.contact_phone || '',
      contact_email: node?.contact_email || '',
      business_license: node?.business_license || '',
      established_at: node?.established_at ? node.established_at.split('T')[0] : '',
    },
  });

  const typeValue = watch('type');
  const statusValue = watch('status');
  const facilitiesValue = watch('facilities') || [];

  const handleFormSubmit = (data: NodeFormData) => {
    const submitData: CreateNodeData = {
      ...data,
      parent_id: parentNode?.id,
      // 确保所有字段都有默认值
      description: data.description || '',
      manager_name: data.manager_name || '',
      manager_phone: data.manager_phone || '',
      address: data.address || '',
      capacity: data.capacity || undefined,
      facilities: data.facilities || [],
      sort_order: data.sort_order || 0,
      status: data.status || 'active',
      // 机构特有字段
      contact_person: data.type === 'institution' ? (data.contact_person || '') : undefined,
      contact_phone: data.type === 'institution' ? (data.contact_phone || '') : undefined,
      contact_email: data.type === 'institution' ? (data.contact_email || '') : undefined,
      business_license: data.type === 'institution' ? (data.business_license || '') : undefined,
      business_hours: data.type === 'institution' ? {} : undefined,
      settings: data.type === 'institution' ? {} : undefined,
      established_at: data.type === 'institution' ? (data.established_at || '') : undefined,
    };
    onSubmit(submitData);
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

  const getAvailableTypes = () => {
    if (!parentNode) {
      return [{ value: 'institution', label: '机构' }];
    }

    switch (parentNode.type) {
      case 'institution':
        return [{ value: 'campus', label: '校区' }];
      case 'campus':
        return [{ value: 'department', label: '部门' }];
      case 'department':
        return [
          { value: 'department', label: '部门' },
          { value: 'classroom', label: '教室' }
        ];
      default:
        return [{ value: 'department', label: '部门' }];
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {node ? '编辑节点' : '创建新节点'}
          {parentNode && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              上级: {parentNode.name} ({getNodeTypeName(parentNode.type)})
            </span>
          )}
        </DialogTitle>
      </DialogHeader>

      <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="请输入名称"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">代码 *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="请输入代码"
              />
              {errors.code && (
                <p className="text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">类型 *</Label>
              <Select
                value={typeValue}
                onValueChange={(value) => setValue('type', value as any)}
                disabled={!!node} // 编辑时不允许修改类型
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTypes().map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
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
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="请输入描述"
              rows={3}
            />
          </div>

          {/* 联系信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager_name">
                {typeValue === 'institution' ? '联系人' : '负责人'}
              </Label>
              <Input
                id="manager_name"
                {...register(typeValue === 'institution' ? 'contact_person' : 'manager_name')}
                placeholder={`请输入${typeValue === 'institution' ? '联系人' : '负责人'}姓名`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager_phone">
                {typeValue === 'institution' ? '联系电话' : '负责人电话'}
              </Label>
              <Input
                id="manager_phone"
                {...register(typeValue === 'institution' ? 'contact_phone' : 'manager_phone')}
                placeholder={`请输入${typeValue === 'institution' ? '联系' : '负责人'}电话`}
              />
            </div>
          </div>

          {typeValue === 'institution' && (
            <div className="space-y-2">
              <Label htmlFor="contact_email">联系邮箱</Label>
              <Input
                id="contact_email"
                type="email"
                {...register('contact_email')}
                placeholder="请输入联系邮箱"
              />
              {errors.contact_email && (
                <p className="text-sm text-red-600">{errors.contact_email.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="address">地址</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="请输入地址"
            />
          </div>

          {/* 机构特有字段 */}
          {typeValue === 'institution' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_license">营业执照号</Label>
                <Input
                  id="business_license"
                  {...register('business_license')}
                  placeholder="请输入营业执照号"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="established_at">成立时间</Label>
                <Input
                  id="established_at"
                  type="date"
                  {...register('established_at')}
                />
              </div>
            </div>
          )}

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
              {loading ? '保存中...' : (node ? '更新' : '创建')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default NodeForm;
