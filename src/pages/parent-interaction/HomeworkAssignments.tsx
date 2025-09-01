import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface HomeworkAssignment {
  id: number;
  title: string;
  content: string;
  due_date: string;
  status: 'active' | 'expired';
  arrangement: {
    id: number;
    schedule: {
      id: number;
      schedule_date: string;
      class: {
        id: number;
        name: string;
      };
      teacher: {
        id: number;
        name: string;
      };
    };
    lesson: {
      id: number;
      title: string;
      unit: {
        id: number;
        name: string;
      };
    };
  };
  creator: {
    id: number;
    name: string;
  };
  created_at: string;
}

interface LessonArrangement {
  id: number;
  schedule: {
    id: number;
    schedule_date: string;
    class: {
      name: string;
    };
  };
  lesson: {
    title: string;
    unit: {
      name: string;
    };
  };
}

const HomeworkAssignments: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<HomeworkAssignment | null>(null);
  const [formData, setFormData] = useState({
    arrangement_id: '',
    title: '',
    content: '',
    due_date: '',
  });

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取作业列表
  const { data: homeworkData, isLoading } = useQuery({
    queryKey: ['homework-assignments', { status: selectedStatus, keyword: searchKeyword }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchKeyword) params.append('keyword', searchKeyword);

      const response = await api.get(`/admin/homework-assignments?${params}`);
      return response.data;
    },
  });

  // 获取可用的课程安排
  const { data: arrangementsData } = useQuery({
    queryKey: ['lesson-arrangements-for-homework'],
    queryFn: async () => {
      const response = await api.get('/admin/lesson-arrangements');
      return response.data;
    },
    enabled: dialogOpen && !editingHomework,
  });

  // 创建/更新作业
  const homeworkMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingHomework) {
        const response = await api.put(`/admin/homework-assignments/${editingHomework.id}`, data);
        return response.data;
      } else {
        const response = await api.post('/admin/homework-assignments', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework-assignments'] });
      setDialogOpen(false);
      resetForm();
      addToast({
        type: 'success',
        title: editingHomework ? '更新成功' : '创建成功',
        description: '作业已保存',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '操作失败',
        description: error.response?.data?.message || '请稍后重试',
      });
    },
  });

  // 删除作业
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/homework-assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework-assignments'] });
      addToast({
        type: 'success',
        title: '删除成功',
        description: '作业已删除',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '删除失败',
        description: error.response?.data?.message || '请稍后重试',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      arrangement_id: '',
      title: '',
      content: '',
      due_date: '',
    });
    setEditingHomework(null);
  };

  const handleEdit = (homework: HomeworkAssignment) => {
    setEditingHomework(homework);
    setFormData({
      arrangement_id: homework.arrangement.id.toString(),
      title: homework.title,
      content: homework.content,
      due_date: homework.due_date,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('确定要删除这个作业吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    homeworkMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">进行中</Badge>;
      case 'expired':
        return <Badge variant="secondary">已过期</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const homework = homeworkData?.data?.data || [];
  const arrangements = arrangementsData?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">课后作业</h1>
          <p className="text-muted-foreground">管理课后作业的布置和跟踪</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              布置作业
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingHomework ? '编辑作业' : '布置作业'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingHomework && (
                <div>
                  <Label htmlFor="arrangement_id">关联课程安排</Label>
                  <Select
                    value={formData.arrangement_id}
                    onValueChange={(value) => setFormData({ ...formData, arrangement_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择课程安排" />
                    </SelectTrigger>
                    <SelectContent>
                      {arrangements.map((arrangement: LessonArrangement) => (
                        <SelectItem key={arrangement.id} value={arrangement.id.toString()}>
                          {arrangement.schedule.schedule_date} - {arrangement.schedule.class.name} - {arrangement.lesson.unit.name} {arrangement.lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="title">作业标题</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="如：故事复述练习"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">作业要求</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="请详细描述作业要求和说明"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="due_date">截止时间</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={homeworkMutation.isPending}>
                  {homeworkMutation.isPending ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索作业..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 作业列表 */}
      <Card>
        <CardHeader>
          <CardTitle>作业列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : homework.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无作业记录
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>作业标题</TableHead>
                  <TableHead>班级名称</TableHead>
                  <TableHead>课程内容</TableHead>
                  <TableHead>布置教师</TableHead>
                  <TableHead>截止时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {homework.map((item: HomeworkAssignment) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate" title={item.content}>
                        {item.content}
                      </div>
                    </TableCell>
                    <TableCell>{item.arrangement.schedule.class.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{item.arrangement.lesson.unit.name}</div>
                        <div className="text-gray-500">{item.arrangement.lesson.title}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.creator.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{item.due_date}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HomeworkAssignments;
