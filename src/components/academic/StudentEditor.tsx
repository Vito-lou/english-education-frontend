import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface Student {
  id: number;
  name: string;
  phone?: string;
  gender?: 'male' | 'female';
  birth_date?: string;
  parent_name: string;
  parent_phone: string;
  parent_relationship: string;
  student_type: 'potential' | 'trial' | 'enrolled' | 'graduated' | 'suspended';
  follow_up_status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'follow_up';
  intention_level: 'high' | 'medium' | 'low';
  source?: string;
  remarks?: string;
  status: 'active' | 'inactive';
}

interface StudentEditorProps {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
}

const StudentEditor: React.FC<StudentEditorProps> = ({
  open,
  onClose,
  student,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    birth_date: '',
    parent_name: '',
    parent_phone: '',
    parent_relationship: 'mother',
    student_type: 'potential',
    follow_up_status: 'new',
    intention_level: 'medium',
    source: '',
    remarks: '',
    status: 'active',
    create_parent_account: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 保存学员
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (student) {
        const response = await api.put(`/admin/students/${student.id}`, data);
        return response.data;
      } else {
        const response = await api.post('/admin/students', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students-statistics'] });
      onClose();
      addToast({
        type: 'success',
        title: student ? '更新成功' : '创建成功',
        description: student ? '学员信息已更新' : '学员已创建',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: student ? '更新失败' : '创建失败',
        description: error.response?.data?.message || '操作失败',
      });
    },
  });

  // 重置表单
  const resetForm = () => {
    if (student) {
      setFormData({
        name: student.name || '',
        phone: student.phone || '',
        gender: student.gender || 'none',
        birth_date: student.birth_date || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
        parent_relationship: student.parent_relationship || 'mother',
        student_type: student.student_type || 'potential',
        follow_up_status: student.follow_up_status || 'new',
        intention_level: student.intention_level || 'medium',
        source: student.source || '',
        remarks: student.remarks || '',
        status: student.status || 'active',
        create_parent_account: false,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        gender: 'none',
        birth_date: '',
        parent_name: '',
        parent_phone: '',
        parent_relationship: 'mother',
        student_type: 'potential',
        follow_up_status: 'new',
        intention_level: 'medium',
        source: '',
        remarks: '',
        status: 'active',
        create_parent_account: false,
      });
    }
    setErrors({});
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [student, open]);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '学员姓名不能为空';
    }

    if (!formData.parent_name.trim()) {
      newErrors.parent_name = '家长姓名不能为空';
    }

    if (!formData.parent_phone.trim()) {
      newErrors.parent_phone = '家长手机号不能为空';
    } else if (!/^1[3-9]\d{9}$/.test(formData.parent_phone)) {
      newErrors.parent_phone = '请输入正确的手机号';
    }

    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入正确的手机号';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const submitData = { ...formData };

    // 清理空值
    Object.keys(submitData).forEach(key => {
      if (submitData[key as keyof typeof submitData] === '') {
        delete submitData[key as keyof typeof submitData];
      }
    });

    saveMutation.mutate(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? '编辑学员' : '新增学员'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 学员基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">学员信息</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">学员姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="phone">学员手机号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="可选"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">性别</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value === 'none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不选择</SelectItem>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="birth_date">出生日期</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 家长信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">家长信息</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent_name">家长姓名 *</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange('parent_name', e.target.value)}
                  className={errors.parent_name ? 'border-red-500' : ''}
                />
                {errors.parent_name && <p className="text-sm text-red-500 mt-1">{errors.parent_name}</p>}
              </div>

              <div>
                <Label htmlFor="parent_phone">家长手机号 *</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                  className={errors.parent_phone ? 'border-red-500' : ''}
                />
                {errors.parent_phone && <p className="text-sm text-red-500 mt-1">{errors.parent_phone}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="parent_relationship">家长关系</Label>
              <Select value={formData.parent_relationship} onValueChange={(value) => handleInputChange('parent_relationship', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">父亲</SelectItem>
                  <SelectItem value="mother">母亲</SelectItem>
                  <SelectItem value="guardian">监护人</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 学员状态 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">学员状态</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="student_type">学员类型</Label>
                <Select value={formData.student_type} onValueChange={(value) => handleInputChange('student_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="potential">潜在学员</SelectItem>
                    <SelectItem value="trial">试听学员</SelectItem>
                    <SelectItem value="enrolled">正式学员</SelectItem>
                    <SelectItem value="graduated">已毕业</SelectItem>
                    <SelectItem value="suspended">暂停学习</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="follow_up_status">跟进状态</Label>
                <Select value={formData.follow_up_status} onValueChange={(value) => handleInputChange('follow_up_status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">新学员</SelectItem>
                    <SelectItem value="contacted">已联系</SelectItem>
                    <SelectItem value="interested">有意向</SelectItem>
                    <SelectItem value="not_interested">无意向</SelectItem>
                    <SelectItem value="follow_up">跟进中</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="intention_level">意向等级</Label>
                <Select value={formData.intention_level} onValueChange={(value) => handleInputChange('intention_level', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高意向</SelectItem>
                    <SelectItem value="medium">中意向</SelectItem>
                    <SelectItem value="low">低意向</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 其他信息 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="source">来源渠道</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="如：朋友推荐、网络广告等"
              />
            </div>

            <div>
              <Label htmlFor="remarks">备注信息</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="记录学员的特殊情况、学习需求等"
                rows={3}
              />
            </div>

            {!student && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create_parent_account"
                  checked={formData.create_parent_account}
                  onCheckedChange={(checked) => handleInputChange('create_parent_account', checked)}
                />
                <Label htmlFor="create_parent_account">同时创建家长账号（默认密码：123456）</Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentEditor;
