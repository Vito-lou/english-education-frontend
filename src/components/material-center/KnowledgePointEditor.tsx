import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface KnowledgePoint {
  id: number;
  name: string;
  type: string;
  definition_en?: string;
  definition_cn?: string;
  explanation?: string;
  examples?: KnowledgePointExample[];
  tags?: KnowledgeTag[];
}

interface KnowledgePointExample {
  id?: number;
  example_en: string;
  example_cn?: string;
  sequence: number;
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
  });

  const [examples, setExamples] = useState<KnowledgePointExample[]>([]);
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
      const dataToSend = {
        ...pointData,
        examples: examples.map((example, index) => ({
          example_en: example.example_en,
          example_cn: example.example_cn || null,
          sequence: example.sequence || index,
        })),
      };

      if (knowledgePoint) {
        const response = await api.put(`/admin/material-center/knowledge-points/${knowledgePoint.id}`, dataToSend);
        return response.data;
      } else {
        const response = await api.post('/admin/material-center/knowledge-points', dataToSend);
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
      });
      setExamples(knowledgePoint.examples || []);
      setSelectedTags(knowledgePoint.tags?.map(tag => tag.id) || []);
    } else {
      setFormData({
        name: '',
        type: 'vocabulary',
        definition_en: '',
        definition_cn: '',
        explanation: '',
      });
      setExamples([]);
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

  // 例句管理函数
  const addExample = () => {
    setExamples(prev => [...prev, {
      example_en: '',
      example_cn: '',
      sequence: prev.length,
    }]);
  };

  const removeExample = (index: number) => {
    setExamples(prev => prev.filter((_, i) => i !== index));
  };

  const updateExample = (index: number, field: keyof KnowledgePointExample, value: string) => {
    setExamples(prev => prev.map((example, i) =>
      i === index ? { ...example, [field]: value } : example
    ));
  };

  const moveExample = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setExamples(prev => {
        const newExamples = [...prev];
        [newExamples[index - 1], newExamples[index]] = [newExamples[index], newExamples[index - 1]];
        return newExamples.map((example, i) => ({ ...example, sequence: i }));
      });
    } else if (direction === 'down' && index < examples.length - 1) {
      setExamples(prev => {
        const newExamples = [...prev];
        [newExamples[index], newExamples[index + 1]] = [newExamples[index + 1], newExamples[index]];
        return newExamples.map((example, i) => ({ ...example, sequence: i }));
      });
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
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.type ? 'border-red-500' : ''
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

          {/* 例句管理 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>例句管理</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExample}>
                <Plus className="w-4 h-4 mr-2" />
                添加例句
              </Button>
            </div>

            <div className="space-y-4">
              {examples.map((example, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-sm">例句 {index + 1}</h4>
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExample(index, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExample(index, 'down')}
                        disabled={index === examples.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExample(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">英文例句 *</Label>
                      <Textarea
                        value={example.example_en}
                        onChange={(e) => updateExample(index, 'example_en', e.target.value)}
                        placeholder="请输入英文例句"
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">中文翻译</Label>
                      <Textarea
                        value={example.example_cn || ''}
                        onChange={(e) => updateExample(index, 'example_cn', e.target.value)}
                        placeholder="请输入中文翻译（可选）"
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {examples.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="mb-2">暂无例句</p>
                  <Button type="button" variant="outline" size="sm" onClick={addExample}>
                    <Plus className="w-4 h-4 mr-2" />
                    添加第一个例句
                  </Button>
                </div>
              )}
            </div>
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
