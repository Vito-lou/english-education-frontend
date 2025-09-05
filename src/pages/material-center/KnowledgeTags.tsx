import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Tags } from 'lucide-react';
import KnowledgeTagEditor from '@/components/material-center/KnowledgeTagEditor';

interface KnowledgeTag {
  id: number;
  tag_name: string;
  tag_system: string;
  description?: string;
  meta?: any;
  knowledge_points?: KnowledgePoint[];
  created_at: string;
  updated_at: string;
}

interface KnowledgePoint {
  id: number;
  name: string;
  type: string;
}

const KnowledgeTags: React.FC = () => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<KnowledgeTag | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<KnowledgeTag | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取标签列表
  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['knowledge-tags', currentPage, searchQuery, systemFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '15',
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (systemFilter) params.append('tag_system', systemFilter);
      
      const response = await api.get(`/admin/material-center/knowledge-tags?${params}`);
      return response.data;
    },
  });

  // 获取标签体系列表
  const { data: systemsData } = useQuery({
    queryKey: ['knowledge-tag-systems'],
    queryFn: async () => {
      const response = await api.get('/admin/material-center/knowledge-tags/systems');
      return response.data;
    },
  });

  // 删除标签
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/admin/material-center/knowledge-tags/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-tags'] });
      toast({
        title: '删除成功',
        description: '标签已删除',
      });
    },
    onError: (error: any) => {
      toast({
        title: '删除失败',
        description: error.response?.data?.message || '删除标签时发生错误',
        variant: 'destructive',
      });
    },
  });

  const tags = tagsData?.data || [];
  const pagination = tagsData?.pagination;
  const systems = systemsData?.data || [];

  const handleDelete = (tag: KnowledgeTag) => {
    setTagToDelete(tag);
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (tagToDelete) {
      deleteMutation.mutate(tagToDelete.id);
      setTagToDelete(null);
      setShowConfirmDialog(false);
    }
  };

  const handleCreate = () => {
    setEditingTag(null);
    setEditorOpen(true);
  };

  const handleEdit = (tag: KnowledgeTag) => {
    setEditingTag(tag);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingTag(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSystemFilter('');
    setCurrentPage(1);
  };

  const getSystemLabel = (system: string) => {
    const systemMap: Record<string, string> = {
      k12: 'K12教育',
      cambridge: '剑桥英语',
      ielts: '雅思',
      toefl: '托福',
    };
    return systemMap[system] || system;
  };

  const getSystemColor = (system: string) => {
    const colorMap: Record<string, string> = {
      k12: 'bg-blue-100 text-blue-800',
      cambridge: 'bg-green-100 text-green-800',
      ielts: 'bg-yellow-100 text-yellow-800',
      toefl: 'bg-purple-100 text-purple-800',
    };
    return colorMap[system] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">标签管理</h1>
          <p className="text-gray-600 mt-1">管理知识点标签体系</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          新建标签
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="搜索标签名称、描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value)}
              >
                <option value="">全部体系</option>
                {systems.map((system: any) => (
                  <option key={system.value} value={system.value}>{system.label}</option>
                ))}
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

      {/* 标签列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.length > 0 ? (
          tags.map((tag: KnowledgeTag) => (
            <Card key={tag.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <Tags className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">{tag.tag_name}</h3>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(tag)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(tag)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <Badge className={getSystemColor(tag.tag_system)}>
                    {getSystemLabel(tag.tag_system)}
                  </Badge>
                </div>

                {tag.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {tag.description}
                  </p>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    {tag.knowledge_points?.length || 0} 个知识点
                  </span>
                  <span>
                    {new Date(tag.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <Tags className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无标签</h3>
              <p className="text-gray-500 mb-4">还没有创建任何标签</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                创建第一个标签
              </Button>
            </Card>
          </div>
        )}
      </div>

      {/* 分页 */}
      {pagination && pagination.last_page > 1 && (
        <Card className="p-4">
          <div className="flex justify-between items-center">
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
        </Card>
      )}

      {/* 标签编辑弹窗 */}
      <KnowledgeTagEditor
        open={editorOpen}
        onClose={handleCloseEditor}
        tag={editingTag}
      />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="删除标签"
        description={`确定要删除标签"${tagToDelete?.tag_name}"吗？此操作不可撤销。`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default KnowledgeTags;
