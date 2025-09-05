import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface Story {
  id: number;
  title: string;
  description?: string;
  author?: string;
  difficulty_level?: string;
  cover_image_url?: string;
  has_chapters: boolean;
  content?: string;
  chapters?: StoryChapter[];
  knowledge_points?: KnowledgePoint[];
}

interface StoryChapter {
  id?: number;
  chapter_number: number;
  chapter_title: string;
  content: string;
}

interface KnowledgePoint {
  id: number;
  name: string;
  type: string;
}

interface StoryEditorProps {
  open: boolean;
  onClose: () => void;
  story?: Story | null;
}

const StoryEditor: React.FC<StoryEditorProps> = ({
  open,
  onClose,
  story,
}) => {
  const [formData, setFormData] = useState<Partial<Story>>({
    title: '',
    description: '',
    author: '',
    difficulty_level: '',
    cover_image_url: '',
    has_chapters: false,
    content: '',
    chapters: [],
  });

  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取知识点列表
  const { data: knowledgePointsData } = useQuery({
    queryKey: ['knowledge-points-all'],
    queryFn: async () => {
      const response = await api.get('/admin/material-center/knowledge-points?per_page=1000');
      return response.data;
    },
    enabled: open,
  });

  // 保存故事
  const saveMutation = useMutation({
    mutationFn: async (storyData: any) => {
      if (story) {
        const response = await api.put(`/admin/material-center/stories/${story.id}`, storyData);
        return response.data;
      } else {
        const response = await api.post('/admin/material-center/stories', storyData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({
        title: story ? '更新成功' : '创建成功',
        description: story ? '故事已更新' : '故事已创建',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: story ? '更新失败' : '创建失败',
        description: error.response?.data?.message || '操作失败',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title,
        description: story.description || '',
        author: story.author || '',
        difficulty_level: story.difficulty_level || '',
        cover_image_url: story.cover_image_url || '',
        has_chapters: story.has_chapters,
        content: story.content || '',
        chapters: story.chapters || [],
      });
      setSelectedKnowledgePoints(story.knowledge_points?.map(kp => kp.id) || []);
    } else {
      setFormData({
        title: '',
        description: '',
        author: '',
        difficulty_level: '',
        cover_image_url: '',
        has_chapters: false,
        content: '',
        chapters: [],
      });
      setSelectedKnowledgePoints([]);
    }
    setErrors({});
  }, [story, open]);

  const handleInputChange = (field: keyof Story, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleChapterChange = (index: number, field: keyof StoryChapter, value: any) => {
    const chapters = [...(formData.chapters || [])];
    chapters[index] = { ...chapters[index], [field]: value };
    setFormData(prev => ({ ...prev, chapters }));
  };

  const addChapter = () => {
    const chapters = [...(formData.chapters || [])];
    chapters.push({
      chapter_number: chapters.length + 1,
      chapter_title: '',
      content: '',
    });
    setFormData(prev => ({ ...prev, chapters }));
  };

  const removeChapter = (index: number) => {
    const chapters = [...(formData.chapters || [])];
    chapters.splice(index, 1);
    // 重新编号
    chapters.forEach((chapter, i) => {
      chapter.chapter_number = i + 1;
    });
    setFormData(prev => ({ ...prev, chapters }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = '故事标题不能为空';
    }

    if (formData.has_chapters) {
      if (!formData.chapters || formData.chapters.length === 0) {
        newErrors.chapters = '分章节故事至少需要一个章节';
      } else {
        formData.chapters.forEach((chapter, index) => {
          if (!chapter.chapter_title?.trim()) {
            newErrors[`chapter_${index}_title`] = '章节标题不能为空';
          }
          if (!chapter.content?.trim()) {
            newErrors[`chapter_${index}_content`] = '章节内容不能为空';
          }
        });
      }
    } else {
      if (!formData.content?.trim()) {
        newErrors.content = '故事内容不能为空';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const storyData = {
      ...formData,
      knowledge_point_ids: selectedKnowledgePoints,
    };

    saveMutation.mutate(storyData);
  };

  const knowledgePoints = knowledgePointsData?.data || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{story ? '编辑故事' : '新建故事'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">故事标题 *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="请输入故事标题"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Label htmlFor="author">作者</Label>
              <Input
                id="author"
                value={formData.author || ''}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="请输入作者"
              />
            </div>

            <div>
              <Label htmlFor="difficulty_level">难度等级</Label>
              <Input
                id="difficulty_level"
                value={formData.difficulty_level || ''}
                onChange={(e) => handleInputChange('difficulty_level', e.target.value)}
                placeholder="如：A1, B2, Grade 5"
              />
            </div>

            <div>
              <Label htmlFor="cover_image_url">封面图链接</Label>
              <Input
                id="cover_image_url"
                value={formData.cover_image_url || ''}
                onChange={(e) => handleInputChange('cover_image_url', e.target.value)}
                placeholder="请输入封面图URL"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">故事简介</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入故事简介"
              rows={3}
            />
          </div>

          {/* 是否分章节 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="has_chapters"
              checked={formData.has_chapters || false}
              onCheckedChange={(checked) => handleInputChange('has_chapters', checked)}
            />
            <Label htmlFor="has_chapters">分章节故事</Label>
          </div>

          {/* 故事内容 */}
          {!formData.has_chapters ? (
            <div>
              <Label htmlFor="content">故事内容 *</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="请输入故事内容"
                rows={10}
                className={errors.content ? 'border-red-500' : ''}
              />
              {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content}</p>}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>章节管理</Label>
                <Button type="button" variant="outline" size="sm" onClick={addChapter}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加章节
                </Button>
              </div>

              {errors.chapters && <p className="text-sm text-red-500 mb-4">{errors.chapters}</p>}

              <div className="space-y-4">
                {formData.chapters?.map((chapter, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">第 {chapter.chapter_number} 章</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChapter(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>章节标题 *</Label>
                        <Input
                          value={chapter.chapter_title}
                          onChange={(e) => handleChapterChange(index, 'chapter_title', e.target.value)}
                          placeholder="请输入章节标题"
                          className={errors[`chapter_${index}_title`] ? 'border-red-500' : ''}
                        />
                        {errors[`chapter_${index}_title`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`chapter_${index}_title`]}</p>
                        )}
                      </div>

                      <div>
                        <Label>章节内容 *</Label>
                        <Textarea
                          value={chapter.content}
                          onChange={(e) => handleChapterChange(index, 'content', e.target.value)}
                          placeholder="请输入章节内容"
                          rows={6}
                          className={errors[`chapter_${index}_content`] ? 'border-red-500' : ''}
                        />
                        {errors[`chapter_${index}_content`] && (
                          <p className="text-sm text-red-500 mt-1">{errors[`chapter_${index}_content`]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 关联知识点 */}
          <div>
            <Label>关联知识点</Label>
            <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {knowledgePoints.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {knowledgePoints.map((point: KnowledgePoint) => (
                    <label key={point.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedKnowledgePoints.includes(point.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedKnowledgePoints(prev => [...prev, point.id]);
                          } else {
                            setSelectedKnowledgePoints(prev => prev.filter(id => id !== point.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{point.name}</span>
                      <span className="text-xs text-gray-500">({point.type})</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">暂无知识点</p>
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

export default StoryEditor;
