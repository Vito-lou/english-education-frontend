import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface KnowledgeTag {
  id: number;
  tag_name: string;
  tag_system: string;
  description?: string;
  meta?: any;
}

interface KnowledgeTagEditorProps {
  open: boolean;
  onClose: () => void;
  tag?: KnowledgeTag | null;
}

const KnowledgeTagEditor: React.FC<KnowledgeTagEditorProps> = ({
  open,
  onClose,
  tag,
}) => {
  const [formData, setFormData] = useState<Partial<KnowledgeTag>>({
    tag_name: '',
    tag_system: 'k12',
    description: '',
    meta: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取标签体系列表
  const { data: systemsData } = useQuery({
    queryKey: ['knowledge-tag-systems'],
    queryFn: async () => {
      const response = await api.get('/admin/material-center/knowledge-tags/systems');
      return response.data;
    },
    enabled: open,
  });

  // 保存标签
  const saveMutation = useMutation({
    mutationFn: async (tagData: any) => {
      if (tag) {
        const response = await api.put(`/admin/material-center/knowledge-tags/${tag.id}`, tagData);
        return response.data;
      } else {
        const response = await api.post('/admin/material-center/knowledge-tags', tagData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-tags'] });
      toast({
        title: tag ? '更新成功' : '创建成功',
        description: tag ? '标签已更新' : '标签已创建',
      });
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || '操作失败';
      toast({
        title: tag ? '更新失败' : '创建失败',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // 处理验证错误
      if (error.response?.status === 422) {
        setErrors({ tag_name: errorMessage });
      }
    },
  });

  useEffect(() => {
    if (tag) {
      setFormData({
        tag_name: tag.tag_name,
        tag_system: tag.tag_system,
        description: tag.description || '',
        meta: tag.meta || {},
      });
    } else {
      setFormData({
        tag_name: '',
        tag_system: 'k12',
        description: '',
        meta: {},
      });
    }
    setErrors({});
  }, [tag, open]);

  const handleInputChange = (field: keyof KnowledgeTag, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tag_name?.trim()) {
      newErrors.tag_name = '标签名称不能为空';
    }

    if (!formData.tag_system) {
      newErrors.tag_system = '请选择标签体系';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    saveMutation.mutate(formData);
  };

  const systems = systemsData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tag ? '编辑标签' : '新建标签'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 标签名称 */}
          <div>
            <Label htmlFor="tag_name">标签名称 *</Label>
            <Input
              id="tag_name"
              value={formData.tag_name || ''}
              onChange={(e) => handleInputChange('tag_name', e.target.value)}
              placeholder="请输入标签名称"
              className={errors.tag_name ? 'border-red-500' : ''}
            />
            {errors.tag_name && <p className="text-sm text-red-500 mt-1">{errors.tag_name}</p>}
          </div>

          {/* 标签体系 */}
          <div>
            <Label htmlFor="tag_system">标签体系 *</Label>
            <select
              id="tag_system"
              value={formData.tag_system || ''}
              onChange={(e) => handleInputChange('tag_system', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.tag_system ? 'border-red-500' : ''
              }`}
            >
              {systems.map((system: any) => (
                <option key={system.value} value={system.value}>
                  {system.label}
                </option>
              ))}
            </select>
            {errors.tag_system && <p className="text-sm text-red-500 mt-1">{errors.tag_system}</p>}
          </div>

          {/* 标签描述 */}
          <div>
            <Label htmlFor="description">标签描述</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入标签描述"
              rows={3}
            />
          </div>

          {/* 根据不同体系显示不同的元数据字段 */}
          {formData.tag_system === 'k12' && (
            <div className="space-y-3">
              <Label>K12 相关信息</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="grade_level" className="text-sm">年级</Label>
                  <Input
                    id="grade_level"
                    value={formData.meta?.grade_level || ''}
                    onChange={(e) => handleInputChange('meta', { 
                      ...formData.meta, 
                      grade_level: e.target.value 
                    })}
                    placeholder="如：Grade 5"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="subject" className="text-sm">学科</Label>
                  <Input
                    id="subject"
                    value={formData.meta?.subject || ''}
                    onChange={(e) => handleInputChange('meta', { 
                      ...formData.meta, 
                      subject: e.target.value 
                    })}
                    placeholder="如：English"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.tag_system === 'cambridge' && (
            <div className="space-y-3">
              <Label>剑桥英语相关信息</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cefr_level" className="text-sm">CEFR等级</Label>
                  <select
                    id="cefr_level"
                    value={formData.meta?.cefr_level || ''}
                    onChange={(e) => handleInputChange('meta', { 
                      ...formData.meta, 
                      cefr_level: e.target.value 
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">选择等级</option>
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="exam_type" className="text-sm">考试类型</Label>
                  <Input
                    id="exam_type"
                    value={formData.meta?.exam_type || ''}
                    onChange={(e) => handleInputChange('meta', { 
                      ...formData.meta, 
                      exam_type: e.target.value 
                    })}
                    placeholder="如：KET, PET"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {(formData.tag_system === 'ielts' || formData.tag_system === 'toefl') && (
            <div className="space-y-3">
              <Label>{formData.tag_system === 'ielts' ? '雅思' : '托福'}相关信息</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="skill_type" className="text-sm">技能类型</Label>
                  <select
                    id="skill_type"
                    value={formData.meta?.skill_type || ''}
                    onChange={(e) => handleInputChange('meta', { 
                      ...formData.meta, 
                      skill_type: e.target.value 
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">选择技能</option>
                    <option value="listening">听力</option>
                    <option value="reading">阅读</option>
                    <option value="writing">写作</option>
                    <option value="speaking">口语</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="difficulty_level" className="text-sm">难度等级</Label>
                  <Input
                    id="difficulty_level"
                    value={formData.meta?.difficulty_level || ''}
                    onChange={(e) => handleInputChange('meta', { 
                      ...formData.meta, 
                      difficulty_level: e.target.value 
                    })}
                    placeholder="如：Intermediate"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saveMutation.isPending}>
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

export default KnowledgeTagEditor;
