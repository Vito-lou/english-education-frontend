import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Calendar, Clock, Upload, X, FileText, Image, Video, CalendarIcon } from 'lucide-react';
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
  requirements: string;
  due_date: string;
  status: 'active' | 'expired' | 'draft';
  attachments?: Array<{
    name: string;
    path: string;
    size: number;
    type: string;
  }>;
  class: {
    id: number;
    name: string;
    course?: {
      name: string;
    };
    level?: {
      name: string;
    };
    teacher?: {
      name: string;
    };
  };
  creator: {
    id: number;
    name: string;
  };
  submission_stats?: {
    total_students: number;
    submitted_count: number;
    pending_count: number;
    submission_rate: number;
  };
  created_at: string;
}

interface ClassOption {
  id: number;
  name: string;
  course?: {
    name: string;
  };
  level?: {
    name: string;
  };
}

const HomeworkAssignments: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<HomeworkAssignment | null>(null);
  const [formData, setFormData] = useState({
    class_id: '',
    title: '',
    requirements: '',
    due_date: '',
    due_time: '',
    status: 'active' as 'active' | 'draft',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Array<{
    name: string;
    path: string;
    size: number;
    type: string;
  }>>([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState<number[]>([]);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取作业列表
  const { data: homeworkData, isLoading } = useQuery({
    queryKey: ['homework-assignments', { status: selectedStatus, search: searchKeyword, class_id: selectedClassId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchKeyword) params.append('search', searchKeyword);
      if (selectedClassId && selectedClassId !== 'all') params.append('class_id', selectedClassId);

      const response = await api.get(`/admin/homework-assignments?${params}`);
      return response.data;
    },
  });

  // 获取班级列表
  const { data: classesData } = useQuery({
    queryKey: ['homework-classes'],
    queryFn: async () => {
      const response = await api.get('/admin/homework-assignments/classes');
      return response.data;
    },
    enabled: dialogOpen,
  });

  // 创建/更新作业
  const homeworkMutation = useMutation({
    mutationFn: async (data: typeof formData & { attachments?: File[] }) => {
      const formDataToSend = new FormData();
      formDataToSend.append('title', data.title);
      formDataToSend.append('class_id', data.class_id);
      formDataToSend.append('requirements', data.requirements);

      // 合并日期和时间
      const dueDateTimeStr = `${data.due_date}T${data.due_time}:00`;
      formDataToSend.append('due_date', dueDateTimeStr);
      formDataToSend.append('status', data.status);

      // 添加附件
      if (data.attachments) {
        data.attachments.forEach((file, index) => {
          formDataToSend.append(`attachments[${index}]`, file);
        });
      }

      // 如果是编辑模式，添加要删除的附件索引
      if (editingHomework && attachmentsToRemove.length > 0) {
        attachmentsToRemove.forEach((index, i) => {
          formDataToSend.append(`remove_attachments[${i}]`, index.toString());
        });
      }

      if (editingHomework) {
        // 使用专门的更新路由
        const response = await api.post(`/admin/homework-assignments/${editingHomework.id}/update`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      } else {
        const response = await api.post('/admin/homework-assignments', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
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
      class_id: '',
      title: '',
      requirements: '',
      due_date: '',
      due_time: '',
      status: 'active',
    });
    setAttachments([]);
    setExistingAttachments([]);
    setAttachmentsToRemove([]);
    setEditingHomework(null);
  };

  const handleEdit = (homework: HomeworkAssignment) => {
    setEditingHomework(homework);
    const dueDateObj = new Date(homework.due_date);
    const dateStr = dueDateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = dueDateObj.toTimeString().slice(0, 5); // HH:MM

    setFormData({
      class_id: homework.class.id.toString(),
      title: homework.title,
      requirements: homework.requirements,
      due_date: dateStr,
      due_time: timeStr,
      status: homework.status === 'expired' ? 'active' : homework.status, // 转换expired为active
    });

    // 设置现有附件
    setExistingAttachments(homework.attachments || []);
    setAttachments([]); // 清空新上传的文件
    setAttachmentsToRemove([]); // 清空要删除的附件列表
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('确定要删除这个作业吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 验证日期时间
    if (!formData.due_date || !formData.due_time) {
      addToast({
        type: 'error',
        title: '请设置截止时间',
        description: '请选择截止日期和时间',
      });
      return;
    }

    // 验证截止时间不能是过去时间
    const dueDateTime = new Date(`${formData.due_date}T${formData.due_time}`);
    if (dueDateTime <= new Date()) {
      addToast({
        type: 'error',
        title: '截止时间无效',
        description: '截止时间必须是未来时间',
      });
      return;
    }

    homeworkMutation.mutate({ ...formData, attachments });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    setAttachmentsToRemove(prev => [...prev, index]);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">进行中</Badge>;
      case 'expired':
        return <Badge variant="secondary">已过期</Badge>;
      case 'draft':
        return <Badge variant="outline">草稿</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const homework = homeworkData?.data?.data || [];
  const classes = classesData?.data || [];
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingHomework ? '编辑作业' : '布置作业'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="class_id">选择班级</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择班级" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem: ClassOption) => (
                      <SelectItem key={classItem.id} value={classItem.id.toString()}>
                        {classItem.name}
                        {classItem.course && ` - ${classItem.course.name}`}
                        {classItem.level && ` (${classItem.level.name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <Label htmlFor="requirements">作业要求</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="请详细描述作业要求和说明"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>截止时间 *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="due_date" className="text-sm font-medium text-muted-foreground">日期</Label>
                    <div className="relative">
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        required
                        className="w-full pl-3 pr-10 cursor-pointer"
                        min={new Date().toISOString().split('T')[0]} // 限制不能选择过去的日期
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="due_time" className="text-sm font-medium text-muted-foreground">时间</Label>
                    <div className="relative">
                      <Input
                        id="due_time"
                        type="time"
                        value={formData.due_time}
                        onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                        required
                        className="w-full pl-3 pr-10 cursor-pointer"
                      />
                      <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
                {formData.due_date && formData.due_time && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    <Calendar className="h-4 w-4" />
                    <span>
                      截止时间：{new Date(`${formData.due_date}T${formData.due_time}`).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        weekday: 'long'
                      })}
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  请设置作业的截止日期和时间，学生需要在此时间前完成提交
                </p>
              </div>

              <div>
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'draft') => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">立即发布</SelectItem>
                    <SelectItem value="draft">保存为草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>附件上传</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      选择文件
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      支持图片、视频、PDF、Word文档，单个文件最大20MB
                    </span>
                  </div>

                  {/* 显示现有附件 */}
                  {existingAttachments.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">现有附件</div>
                      {existingAttachments.map((attachment, index) => (
                        !attachmentsToRemove.includes(index) && (
                          <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center space-x-2">
                              {getFileIcon(attachment.type)}
                              <span className="text-sm">{attachment.name}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">已上传</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExistingAttachment(index)}
                              title="删除此附件"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {/* 显示新上传的文件 */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">新上传的文件</div>
                      {attachments.map((file, index) => (
                        <div key={`new-${index}`} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(file.type)}
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">待上传</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            title="移除此文件"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  placeholder="搜索作业标题..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择班级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部班级</SelectItem>
                {classes.map((classItem: ClassOption) => (
                  <SelectItem key={classItem.id} value={classItem.id.toString()}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
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
                  <TableHead>班级信息</TableHead>
                  <TableHead>布置教师</TableHead>
                  <TableHead>截止时间</TableHead>
                  <TableHead>提交情况</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {homework.map((item: HomeworkAssignment) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate" title={item.requirements}>
                        {item.requirements}
                      </div>
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Upload className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{item.attachments.length} 个附件</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{item.class.name}</div>
                        {item.class.course && (
                          <div className="text-gray-500">{item.class.course.name}</div>
                        )}
                        {item.class.level && (
                          <div className="text-gray-500">{item.class.level.name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.creator.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(item.due_date).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.submission_stats && (
                        <div className="text-sm">
                          <div className="font-medium">
                            {item.submission_stats.submitted_count}/{item.submission_stats.total_students}
                          </div>
                          <div className="text-gray-500">
                            {item.submission_stats.submission_rate}% 完成
                          </div>
                        </div>
                      )}
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
