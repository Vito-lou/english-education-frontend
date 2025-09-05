import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, BookOpen, FileText } from 'lucide-react';
import StoryEditor from '@/components/material-center/StoryEditor';

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
  created_at: string;
  updated_at: string;
}

interface StoryChapter {
  id: number;
  story_id: number;
  chapter_number: number;
  chapter_title: string;
  content: string;
  word_count?: number;
}

interface KnowledgePoint {
  id: number;
  name: string;
  type: string;
  definition_cn?: string;
}

const Stories: React.FC = () => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [hasChaptersFilter, setHasChaptersFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取故事列表
  const { data: storiesData, isLoading } = useQuery({
    queryKey: ['stories', currentPage, searchQuery, difficultyFilter, hasChaptersFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '15',
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (difficultyFilter) params.append('difficulty_level', difficultyFilter);
      if (hasChaptersFilter) params.append('has_chapters', hasChaptersFilter);
      
      const response = await api.get(`/admin/material-center/stories?${params}`);
      return response.data;
    },
  });

  // 获取难度等级列表
  const { data: difficultyLevels } = useQuery({
    queryKey: ['story-difficulty-levels'],
    queryFn: async () => {
      const response = await api.get('/admin/material-center/stories/difficulty-levels');
      return response.data;
    },
  });

  // 删除故事
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/admin/material-center/stories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({
        title: '删除成功',
        description: '故事已删除',
      });
    },
    onError: (error: any) => {
      toast({
        title: '删除失败',
        description: error.response?.data?.message || '删除故事时发生错误',
        variant: 'destructive',
      });
    },
  });

  const stories = storiesData?.data || [];
  const pagination = storiesData?.pagination;

  const handleDelete = (story: Story) => {
    setStoryToDelete(story);
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (storyToDelete) {
      deleteMutation.mutate(storyToDelete.id);
      setStoryToDelete(null);
      setShowConfirmDialog(false);
    }
  };

  const handleCreate = () => {
    setEditingStory(null);
    setEditorOpen(true);
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingStory(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDifficultyFilter('');
    setHasChaptersFilter('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">故事管理</h1>
          <p className="text-gray-600 mt-1">管理故事内容和章节</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          新建故事
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="搜索故事标题、作者..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="">全部难度</option>
                {difficultyLevels?.data?.map((level: string) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={hasChaptersFilter}
                onChange={(e) => setHasChaptersFilter(e.target.value)}
              >
                <option value="">全部类型</option>
                <option value="false">单篇故事</option>
                <option value="true">分章节故事</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <Button type="submit" variant="outline">
                <Search className="w-4 h-4 mr-2" />
                搜索
              </Button>
              <Button type="button" variant="ghost" onClick={resetFilters}>
                重置
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* 故事列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">故事信息</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">类型</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">难度</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">知识点</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">创建时间</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody>
              {stories.length > 0 ? (
                stories.map((story: Story) => (
                  <tr key={story.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{story.title}</div>
                        {story.author && (
                          <div className="text-sm text-gray-500">作者: {story.author}</div>
                        )}
                        {story.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {story.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {story.has_chapters ? (
                          <>
                            <BookOpen className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">分章节</span>
                            {story.chapters && (
                              <Badge variant="secondary">
                                {story.chapters.length}章
                              </Badge>
                            )}
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 text-green-500" />
                            <span className="text-sm">单篇</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {story.difficulty_level && (
                        <Badge variant="outline">{story.difficulty_level}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {story.knowledge_points && story.knowledge_points.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {story.knowledge_points.slice(0, 3).map((point) => (
                            <Badge key={point.id} variant="secondary" className="text-xs">
                              {point.name}
                            </Badge>
                          ))}
                          {story.knowledge_points.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{story.knowledge_points.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(story.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(story)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(story)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    暂无故事数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t">
            <div className="text-sm text-gray-700">
              共 {pagination.total} 条记录，第 {pagination.current_page} / {pagination.last_page} 页
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.current_page === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                disabled={pagination.current_page === pagination.last_page}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 故事编辑弹窗 */}
      <StoryEditor
        open={editorOpen}
        onClose={handleCloseEditor}
        story={editingStory}
      />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="删除故事"
        description={`确定要删除故事"${storyToDelete?.title}"吗？此操作不可撤销。`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default Stories;
