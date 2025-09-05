import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface KnowledgePoint {
  id: number;
  name: string;
  type: string;
  definition_en?: string;
  definition_cn?: string;
  explanation?: string;
  example_sentence?: string;
  audio_url?: string;
  tags?: KnowledgeTag[];
}

interface KnowledgeTag {
  id: number;
  tag_name: string;
  tag_system: string;
}

interface KnowledgePointEditorProps {
  open: boolean;
  onClose: () => void;
  knowledgePoint?: KnowledgePoint | null;
}

const KnowledgePointEditor: React.FC<KnowledgePointEditorProps> = ({
  open,
  onClose,
  knowledgePoint,
}) => {
  const [formData, setFormData] = useState<Partial<KnowledgePoint>>({
    name: '',
    type: 'vocabulary',
    definition_en: '',
    definition_cn: '',
    explanation: '',
    example_sentence: '',
    audio_url: '',
  });

  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取知识点类型列表
  const { data: typesData } = useQuery({
    queryKey: ['knowledge-point-types'],
    queryFn: async () => {
      const response = await api.get('/admin/material-center/knowledge-points/types');
      return response.data;
    },
    enabled: open,
  });

  // 获取标签列表
  const { data: tagsData } = useQuery({
    queryKey: ['knowledge-tags-all'],
    queryFn: async () => {
      const response = await api.get('/admin/material-center/knowledge-tags/by-system');
      return response.data;
    },
    enabled: open,
  });

  // 保存知识点
  const saveMutation = useMutation({
    mutationFn: async (pointData: any) => {
      if (knowledgePoint) {
        const response = await api.put(`/admin/material-center/knowledge-points/${knowledgePoint.id}`, pointData);
        return response.data;
      } else {
        const response = await api.post('/admin/material-center/knowledge-points', pointData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-points'] });
      toast({
        title: knowledgePoint ? '更新成功' : '创建成功',
        description: knowledgePoint ? '知识点已更新' : '知识点已创建',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: knowledgePoint ? '更新失败' : '创建失败',
        description: error.response?.data?.message || '操作失败',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (knowledgePoint) {
      setFormData({
        name: knowledgePoint.name,
        type: knowledgePoint.type,
        definition_en: knowledgePoint.definition_en || '',
        definition_cn: knowledgePoint.definition_cn || '',
        explanation: knowledgePoint.explanation || '',
        example_sentence: knowledgePoint.example_sentence || '',
        audio_url: knowledgePoint.audio_url || '',
      });
      setSelectedTags(knowledgePoint.tags?.map(tag => tag.id) || []);
    } else {
      setFormData({
        name: '',
        type: 'vocabulary',
        definition_en: '',
        definition_cn: '',
        explanation: '',
        example_sentence: '',
        audio_url: '',
      });
      setSelectedTags([]);
    }
    setErrors({});
  }, [knowledgePoint, open]);

  const handleInputChange = (field: keyof KnowledgePoint, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '知识点名称不能为空';
    }

    if (!formData.type) {
      newErrors.type = '请选择知识点类型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const pointData = {
      ...formData,
      tag_ids: selectedTags,
    };

    saveMutation.mutate(pointData);
  };

  const types = typesData?.data || [];
  const tags = tagsData?.data || [];

  // 按标签体系分组
  const tagsBySystem = tags.reduce((acc: Record<string, KnowledgeTag[]>, tag: KnowledgeTag) => {
    if (!acc[tag.tag_system]) {
      acc[tag.tag_system] = [];
    }
    acc[tag.tag_system].push(tag);
    return acc;
  }, {});

  const getSystemLabel = (system: string) => {
    const systemMap: Record<string, string> = {
      k12: 'K12教育',
      cambridge: '剑桥英语',
      ielts: '雅思',
      toefl: '托福',
    };
    return systemMap[system] || system;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{knowledgePoint ? '编辑知识点' : '新建知识点'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">知识点名称 *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="请输入知识点名称"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <Label htmlFor="type">类型 *</Label>
              <select
                id="type"
                value={formData.type || ''}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.type ? 'border-red-500' : ''
                }`}
              >
                {types.map((type: any) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
            </div>
          </div>

          {/* 释义 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="definition_en">英文释义</Label>
              <Textarea
                id="definition_en"
                value={formData.definition_en || ''}
                onChange={(e) => handleInputChange('definition_en', e.target.value)}
                placeholder="请输入英文释义"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="definition_cn">中文释义</Label>
              <Textarea
                id="definition_cn"
                value={formData.definition_cn || ''}
                onChange={(e) => handleInputChange('definition_cn', e.target.value)}
                placeholder="请输入中文释义"
                rows={3}
              />
            </div>
          </div>

          {/* 详细解释 */}
          <div>
            <Label htmlFor="explanation">详细用法解释</Label>
            <Textarea
              id="explanation"
              value={formData.explanation || ''}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              placeholder="请输入详细的用法解释"
              rows={4}
            />
          </div>

          {/* 示例句 */}
          <div>
            <Label htmlFor="example_sentence">示例句</Label>
            <Textarea
              id="example_sentence"
              value={formData.example_sentence || ''}
              onChange={(e) => handleInputChange('example_sentence', e.target.value)}
              placeholder="请输入示例句"
              rows={2}
            />
          </div>

          {/* 音频链接 */}
          <div>
            <Label htmlFor="audio_url">发音音频链接</Label>
            <Input
              id="audio_url"
              value={formData.audio_url || ''}
              onChange={(e) => handleInputChange('audio_url', e.target.value)}
              placeholder="请输入音频文件URL"
            />
          </div>

          {/* 关联标签 */}
          <div>
            <Label>关联标签</Label>
            <div className="mt-2 space-y-4">
              {Object.entries(tagsBySystem).map(([system, systemTags]) => (
                <div key={system}>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {getSystemLabel(system)}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {systemTags.map((tag: KnowledgeTag) => (
                      <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTags(prev => [...prev, tag.id]);
                            } else {
                              setSelectedTags(prev => prev.filter(id => id !== tag.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{tag.tag_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(tagsBySystem).length === 0 && (
                <p className="text-sm text-gray-500">暂无标签</p>
              )}
            </div>
          </div>
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

export default KnowledgePointEditor;
