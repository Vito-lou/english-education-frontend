import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
}

interface Course {
  id: number;
  subject_id: number;
  name: string;
  code: string;
  description: string;
  teaching_method: string;
  has_levels: boolean;
  sort_order: number;
  status: string;
}

interface CourseEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (courseData: Partial<Course>) => void;
  course?: Course | null;
  subjects: Subject[];
  loading?: boolean;
}

const CourseEditor: React.FC<CourseEditorProps> = ({
  open,
  onClose,
  onSave,
  course,
  subjects,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Course>>({
    subject_id: undefined,
    name: '',
    code: '',
    description: '',
    has_levels: true,
    sort_order: 0,
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 重置表单
  const resetForm = () => {
    if (course) {
      setFormData({
        subject_id: course.subject_id,
        name: course.name,
        code: course.code,
        description: course.description,
        has_levels: course.has_levels,
        sort_order: course.sort_order,
        status: course.status,
      });
    } else {
      setFormData({
        subject_id: subjects.length > 0 ? subjects[0].id : undefined,
        name: '',
        code: '',
        description: '',
        has_levels: true,
        sort_order: 0,
        status: 'active',
      });
    }
    setErrors({});
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [course, subjects, open]);

  const handleInputChange = (field: keyof Course, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject_id) {
      newErrors.subject_id = '请选择科目';
    }

    if (!formData.name?.trim()) {
      newErrors.name = '课程名称不能为空';
    }

    if (!formData.code?.trim()) {
      newErrors.code = '课程代码不能为空';
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.code)) {
      newErrors.code = '课程代码只能包含字母、数字和下划线，且以字母或下划线开头';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    onSave(formData);
  };



  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {course ? '编辑课程' : '新建课程'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 科目选择 */}
          <div>
            <Label htmlFor="subject_id">所属科目 *</Label>
            <Select
              value={formData.subject_id?.toString() || ''}
              onValueChange={(value) => handleInputChange('subject_id', parseInt(value))}
            >
              <SelectTrigger className={errors.subject_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="请选择科目" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject_id && <p className="text-sm text-red-500 mt-1">{errors.subject_id}</p>}
          </div>

          {/* 课程名称 */}
          <div>
            <Label htmlFor="name">课程名称 *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入课程名称"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* 课程代码 */}
          <div>
            <Label htmlFor="code">课程代码 *</Label>
            <Input
              id="code"
              value={formData.code || ''}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="请输入课程代码，如：yuandian_english"
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
            <p className="text-xs text-gray-500 mt-1">用于系统识别，只能包含字母、数字和下划线</p>
          </div>



          {/* 是否有级别体系 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="has_levels"
              checked={formData.has_levels || false}
              onCheckedChange={(checked) => handleInputChange('has_levels', checked)}
            />
            <Label htmlFor="has_levels">启用级别体系</Label>
            <p className="text-xs text-gray-500">如：Pre-A、A、B、C、D、E级别</p>
          </div>

          {/* 排序 */}
          <div>
            <Label htmlFor="sort_order">排序</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order || 0}
              onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
              placeholder="排序数字，越小越靠前"
            />
          </div>

          {/* 课程描述 */}
          <div>
            <Label htmlFor="description">课程描述</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入课程描述（可选）"
              rows={3}
            />
          </div>

          {/* 状态 */}
          <div>
            <Label htmlFor="status">状态</Label>
            <Select
              value={formData.status || 'active'}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">启用</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseEditor;
