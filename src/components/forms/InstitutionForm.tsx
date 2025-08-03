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
import { Institution } from '@/lib/api';

const institutionSchema = z.object({
  name: z.string().min(1, '机构名称不能为空').max(100, '机构名称不能超过100个字符'),
  code: z.string().min(1, '机构代码不能为空').max(50, '机构代码不能超过50个字符'),
  description: z.string().optional(),
  contact_person: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('请输入有效的邮箱地址').optional().or(z.literal('')),
  address: z.string().optional(),
  business_license: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
  established_at: z.string().optional(),
});

type InstitutionFormData = z.infer<typeof institutionSchema>;

interface InstitutionFormProps {
  institution?: Institution;
  onSubmit: (data: InstitutionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const InstitutionForm: React.FC<InstitutionFormProps> = ({
  institution,
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
  } = useForm<InstitutionFormData>({
    resolver: zodResolver(institutionSchema),
    defaultValues: {
      name: institution?.name || '',
      code: institution?.code || '',
      description: institution?.description || '',
      contact_person: institution?.contact_person || '',
      contact_phone: institution?.contact_phone || '',
      contact_email: institution?.contact_email || '',
      address: institution?.address || '',
      business_license: institution?.business_license || '',
      status: institution?.status || 'active',
      established_at: institution?.established_at ? institution.established_at.split('T')[0] : '',
    },
  });

  const statusValue = watch('status');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {institution ? '编辑机构信息' : '创建新机构'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">机构名称 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="请输入机构名称"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">机构代码 *</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="请输入机构代码"
              />
              {errors.code && (
                <p className="text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">机构介绍</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="请输入机构介绍"
              rows={3}
            />
          </div>

          {/* 联系信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">联系人</Label>
              <Input
                id="contact_person"
                {...register('contact_person')}
                placeholder="请输入联系人姓名"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">联系电话</Label>
              <Input
                id="contact_phone"
                {...register('contact_phone')}
                placeholder="请输入联系电话"
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="address">机构地址</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="请输入机构地址"
            />
          </div>

          {/* 其他信息 */}
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

          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Select
              value={statusValue}
              onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'suspended')}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
                <SelectItem value="suspended">暂停</SelectItem>
              </SelectContent>
            </Select>
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
              {loading ? '保存中...' : (institution ? '更新' : '创建')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InstitutionForm;
