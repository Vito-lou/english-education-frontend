import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface CourseLevel {
  id: number;
  name: string;
  code: string;
}

interface CourseUnit {
  id: number;
  course_id: number;
  level_id: number | null;
  name: string;
  description: string;
  learning_objectives: string;
  sort_order: number;
  status: string;
}

interface UnitEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (unitData: Partial<CourseUnit>) => void;
  unit?: CourseUnit | null;
  courseId: number;
  levels: CourseLevel[];
  defaultLevelId?: number | null;
  loading?: boolean;
}

const UnitEditor: React.FC<UnitEditorProps> = ({
  open,
  onClose,
  onSave,
  unit,
  courseId,
  levels,
  defaultLevelId,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<CourseUnit>>({
    course_id: courseId,
    level_id: null,
    name: '',
    description: '',
    learning_objectives: '',
    sort_order: 0,
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 重置表单
  const resetForm = () => {
    if (unit) {
      setFormData({
        course_id: unit.course_id,
        level_id: unit.level_id,
        name: unit.name,
        description: unit.description,
        learning_objectives: unit.learning_objectives,
        sort_order: unit.sort_order,
        status: unit.status,
      });
    } else {
      setFormData({
        course_id: courseId,
        level_id: defaultLevelId || null,
        name: '',
        description: '',
        learning_objectives: '',
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
  }, [unit, courseId, defaultLevelId, open]);

  const handleInputChange = (field: keyof CourseUnit, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '单元名称不能为空';
    }

    if (!formData.description?.trim()) {
      newErrors.description = '单元描述不能为空';
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
            {unit ? '编辑单元' : '新建单元'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 所属级别 */}
          {levels.length > 0 && (
            <div>
              <Label htmlFor="level_id">所属级别</Label>
              <Select
                value={formData.level_id?.toString() || 'none'}
                onValueChange={(value) => handleInputChange('level_id', value === 'none' ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择级别（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无级别</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">如果课程有级别体系，可以选择单元所属的级别</p>
            </div>
          )}

          {/* 单元名称 */}
          <div>
            <Label htmlFor="name">单元名称 *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入单元名称，如：Unit 1 - Greetings"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
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

          {/* 单元描述 */}
          <div>
            <Label htmlFor="description">单元描述 *</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入单元描述，说明本单元的主要内容"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
          </div>

          {/* 学习目标 */}
          <div>
            <Label htmlFor="learning_objectives">学习目标</Label>
            <Textarea
              id="learning_objectives"
              value={formData.learning_objectives || ''}
              onChange={(e) => handleInputChange('learning_objectives', e.target.value)}
              placeholder="请输入学习目标，说明学生完成本单元后应该掌握的知识和技能"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">可以分点列出，如：1. 掌握基本问候语 2. 能够进行简单自我介绍</p>
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

export default UnitEditor;
