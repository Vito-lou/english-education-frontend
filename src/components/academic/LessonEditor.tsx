import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Lesson {
  id: number;
  unit_id: number;
  name: string;
  content: string;
  duration: number;
  sort_order: number;
  status: string;
}

interface LessonEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (lessonData: Partial<Lesson>) => void;
  lesson?: Lesson | null;
  unitId: number;
  loading?: boolean;
}

const LessonEditor: React.FC<LessonEditorProps> = ({
  open,
  onClose,
  onSave,
  lesson,
  unitId,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Lesson>>({
    unit_id: unitId,
    name: '',
    content: '',
    duration: 0,
    sort_order: 0,
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 重置表单
  const resetForm = () => {
    if (lesson) {
      setFormData({
        unit_id: lesson.unit_id,
        name: lesson.name,
        content: lesson.content,
        duration: lesson.duration,
        sort_order: lesson.sort_order,
        status: lesson.status,
      });
    } else {
      setFormData({
        unit_id: unitId,
        name: '',
        content: '',
        duration: 0,
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
  }, [lesson, unitId, open]);

  const handleInputChange = (field: keyof Lesson, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '课时名称不能为空';
    }

    if (!formData.content?.trim()) {
      newErrors.content = '课时内容不能为空';
    }

    if (formData.duration !== undefined && formData.duration < 0) {
      newErrors.duration = '课时时长不能为负数';
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lesson ? '编辑课时' : '新建课时'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 课时名称 */}
          <div>
            <Label htmlFor="name">课时名称 *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入课时名称，如：Lesson 1 - Hello World"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* 课时时长 */}
          <div>
            <Label htmlFor="duration">课时时长（分钟）</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration || 0}
              onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
              placeholder="课时时长，单位：分钟"
              min="0"
              className={errors.duration ? 'border-red-500' : ''}
            />
            {errors.duration && <p className="text-sm text-red-500 mt-1">{errors.duration}</p>}
            <p className="text-xs text-gray-500 mt-1">建议设置课时时长，便于统计和安排</p>
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

          {/* 课时内容 */}
          <div>
            <Label htmlFor="content">课时内容 *</Label>
            <Textarea
              id="content"
              value={formData.content || ''}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="请输入课时的详细内容，包括教学要点、练习内容等"
              rows={8}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content}</p>}
            <p className="text-xs text-gray-500 mt-1">
              可以包括：教学目标、重点词汇、语法要点、练习活动、作业安排等
            </p>
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

export default LessonEditor;
