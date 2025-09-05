import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Upload } from 'lucide-react';
import KnowledgePointEditor from '@/components/material-center/KnowledgePointEditor';

interface KnowledgePoint {
  id: number;
  name: string;
  type: string;
  definition_en?: string;
  definition_cn?: string;
  explanation?: string;
  examples?: KnowledgePointExample[];
  tags?: KnowledgeTag[];
  stories?: Story[];
  created_at: string;
  updated_at: string;
}

interface KnowledgePointExample {
  id: number;
  example_en: string;
  example_cn?: string;
  sequence: number;
}

interface KnowledgeTag {
  id: number;
  tag_name: string;
  tag_system: string;
}

interface Story {
  id: number;
  title: string;
}

const KnowledgePoints: React.FC = () => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<KnowledgePoint | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<KnowledgePoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取知识点列表
  const { data: pointsData, isLoading } = useQuery({
    queryKey: ['knowledge-points', currentPage, searchQuery, typeFilter, tagFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '15',
      });

      if (searchQuery) params.append('search', searchQuery);
      if (typeFilter) params.append('type', typeFilter);
      if (tagFilter) params.append('tag_id', tagFilter);

      const response = await api.get(`/admin/material-center/knowledge-points?${params}`);
      return response.data;
    },
  });

  // 获取知识点类型列表
  const { data: typesData } = useQuery({
    queryKey: ['knowledge-point-types'],
    queryFn: async () => {
      const response = await api.get('/admin/material-center/knowledge-points/types');
      return response.data;
    },
  });

  // 获取标签列表
  const { data: tagsData } = useQuery({
    queryKey: ['knowledge-tags-all'],
    queryFn: async () => {
      const response = await api.get('/admin/material-center/knowledge-tags/by-system');
      return response.data;
    },
  });

  // 删除知识点
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/admin/material-center/knowledge-points/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-points'] });
      toast({
        title: '删除成功',
        description: '知识点已删除',
      });
    },
    onError: (error: any) => {
      toast({
        title: '删除失败',
        description: error.response?.data?.message || '删除知识点时发生错误',
        variant: 'destructive',
      });
    },
  });

  const points = pointsData?.data || [];
  const pagination = pointsData?.pagination;
  const types = typesData?.data || [];
  const tags = tagsData?.data || [];

  const handleDelete = (point: KnowledgePoint) => {
    setPointToDelete(point);
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (pointToDelete) {
      deleteMutation.mutate(pointToDelete.id);
      setPointToDelete(null);
      setShowConfirmDialog(false);
    }
  };

  const handleCreate = () => {
    setEditingPoint(null);
    setEditorOpen(true);
  };

  const handleEdit = (point: KnowledgePoint) => {
    setEditingPoint(point);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingPoint(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setTagFilter('');
    setCurrentPage(1);
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      vocabulary: '词汇',
      grammar: '语法',
      phrase: '短语',
      sentence_pattern: '句型',
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      vocabulary: 'bg-blue-100 text-blue-800',
      grammar: 'bg-green-100 text-green-800',
      phrase: 'bg-yellow-100 text-yellow-800',
      sentence_pattern: 'bg-purple-100 text-purple-800',
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知识点管理</h1>
          <p className="text-gray-600 mt-1">管理词汇、语法等知识点</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            批量导入
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            新建知识点
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <Card className="p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="搜索知识点名称、释义..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">全部类型</option>
                {types.map((type: any) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
              >
                <option value="">全部标签</option>
                {tags.map((tag: KnowledgeTag) => (
                  <option key={tag.id} value={tag.id.toString()}>
                    {tag.tag_name} ({tag.tag_system})
                  </option>
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

      {/* 知识点列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">知识点</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">类型</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">释义</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">标签</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">关联故事</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody>
              {points.length > 0 ? (
                points.map((point: KnowledgePoint) => (
                  <tr key={point.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{point.name}</div>
                        {point.examples && point.examples.length > 0 && (
                          <div className="text-sm text-gray-600 mt-1 italic">
                            "{point.examples[0].example_en}"
                            {point.examples.length > 1 && (
                              <span className="text-xs text-gray-500 ml-2">
                                (+{point.examples.length - 1} 个例句)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getTypeColor(point.type)}>
                        {getTypeLabel(point.type)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {point.definition_en && (
                          <div className="text-sm text-gray-700">{point.definition_en}</div>
                        )}
                        {point.definition_cn && (
                          <div className="text-sm text-gray-600">{point.definition_cn}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {point.tags && point.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {point.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.tag_name}
                            </Badge>
                          ))}
                          {point.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{point.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {point.stories && point.stories.length > 0 && (
                        <Badge variant="secondary">
                          {point.stories.length} 个故事
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(point)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(point)}
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
                    暂无知识点数据
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

      {/* 知识点编辑弹窗 */}
      <KnowledgePointEditor
        open={editorOpen}
        onClose={handleCloseEditor}
        knowledgePoint={editingPoint}
      />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="删除知识点"
        description={`确定要删除知识点"${pointToDelete?.name}"吗？此操作不可撤销。`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default KnowledgePoints;
