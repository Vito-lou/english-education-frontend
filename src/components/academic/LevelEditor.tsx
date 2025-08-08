import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface CourseLevel {
  id: number;
  course_id: number;
  name: string;
  code: string;
  description: string;
  sort_order: number;
  status: string;
}

interface LevelEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (levelData: Partial<CourseLevel>) => void;
  level?: CourseLevel | null;
  courseId: number;
  loading?: boolean;
}

const LevelEditor: React.FC<LevelEditorProps> = ({
  open,
  onClose,
  onSave,
  level,
  courseId,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<CourseLevel>>({
    course_id: courseId,
    name: '',
    code: '',
    description: '',
    sort_order: 0,
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 重置表单
  const resetForm = () => {
    if (level) {
      setFormData({
        course_id: level.course_id,
        name: level.name,
        code: level.code,
        description: level.description,
        sort_order: level.sort_order,
        status: level.status,
      });
    } else {
      setFormData({
        course_id: courseId,
        name: '',
        code: '',
        description: '',
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
  }, [level, courseId, open]);

  const handleInputChange = (field: keyof CourseLevel, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '级别名称不能为空';
    }

    if (!formData.code?.trim()) {
      newErrors.code = '级别代码不能为空';
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.code)) {
      newErrors.code = '级别代码只能包含字母、数字和下划线，且以字母或下划线开头';
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {level ? '编辑级别' : '新建级别'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 级别名称 */}
          <div>
            <Label htmlFor="name">级别名称 *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入级别名称，如：Pre-A"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* 级别代码 */}
          <div>
            <Label htmlFor="code">级别代码 *</Label>
            <Input
              id="code"
              value={formData.code || ''}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="请输入级别代码，如：pre_a"
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
            <p className="text-xs text-gray-500 mt-1">用于系统识别，只能包含字母、数字和下划线</p>
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

          {/* 级别描述 */}
          <div>
            <Label htmlFor="description">级别描述</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入级别描述（可选）"
              rows={3}
            />
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

export default LevelEditor;
