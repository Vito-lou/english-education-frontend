import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface LessonArrangement {
  id: number;
  schedule: {
    id: number;
    schedule_date: string;
    start_time: string;
    end_time: string;
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
    name: string;
    content: string;
    unit: {
      id: number;
      name: string;
      course: {
        id: number;
        name: string;
      };
    };
  };
  teaching_focus: string;
  created_at: string;
}

interface Class {
  id: number;
  name: string;
}

interface CourseUnit {
  id: number;
  name: string;
  lessons: Lesson[];
}

interface Lesson {
  id: number;
  name: string;
  content: string;
  sort_order: number;
}

const LessonArrangements: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArrangement, setEditingArrangement] = useState<LessonArrangement | null>(null);
  const [formData, setFormData] = useState({
    schedule_id: '',
    lesson_id: '',
    teaching_focus: '',
  });
  const [selectedScheduleUnits, setSelectedScheduleUnits] = useState<CourseUnit[]>([]);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取课程安排列表
  const { data: arrangementsData, isLoading } = useQuery({
    queryKey: ['lesson-arrangements', { class_id: selectedClassId, keyword: searchKeyword }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedClassId && selectedClassId !== 'all') params.append('class_id', selectedClassId);
      if (searchKeyword) params.append('keyword', searchKeyword);

      const response = await api.get(`/admin/lesson-arrangements?${params}`);
      return response.data;
    },
  });

  // 获取班级列表
  const { data: classesData } = useQuery({
    queryKey: ['classes-simple'],
    queryFn: async () => {
      const response = await api.get('/admin/classes');
      return response.data;
    },
  });

  // 当选择排课时，获取对应级别的课时内容
  const { data: scheduleLessonsData, refetch: refetchScheduleLessons } = useQuery({
    queryKey: ['schedule-lessons', formData.schedule_id],
    queryFn: async () => {
      if (!formData.schedule_id) return null;
      const response = await api.get(`/admin/lesson-arrangements/schedule/${formData.schedule_id}/lessons`);
      return response.data;
    },
    enabled: !!formData.schedule_id,
  });

  // 当获取到排课对应的课时数据时，更新可选课时列表
  React.useEffect(() => {
    if (scheduleLessonsData?.data?.units) {
      setSelectedScheduleUnits(scheduleLessonsData.data.units);
      // 清空之前选择的课时
      setFormData(prev => ({ ...prev, lesson_id: '' }));
    }
  }, [scheduleLessonsData]);

  // 获取可安排的排课
  const { data: schedulesData } = useQuery({
    queryKey: ['available-schedules'],
    queryFn: async () => {
      const response = await api.get('/admin/class-schedules?status=scheduled&without_arrangement=1');
      return response.data;
    },
    enabled: dialogOpen && !editingArrangement,
  });

  // 创建/更新课程安排
  const arrangementMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingArrangement) {
        const response = await api.put(`/admin/lesson-arrangements/${editingArrangement.id}`, data);
        return response.data;
      } else {
        const response = await api.post('/admin/lesson-arrangements', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-arrangements'] });
      setDialogOpen(false);
      resetForm();
      addToast({
        type: 'success',
        title: editingArrangement ? '更新成功' : '创建成功',
        description: '课程安排已保存',
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

  // 删除课程安排
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/admin/lesson-arrangements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-arrangements'] });
      addToast({
        type: 'success',
        title: '删除成功',
        description: '课程安排已删除',
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
      schedule_id: '',
      lesson_id: '',
      teaching_focus: '',
    });
    setSelectedScheduleUnits([]);
    setEditingArrangement(null);
  };

  const handleEdit = async (arrangement: LessonArrangement) => {
    setEditingArrangement(arrangement);
    setFormData({
      schedule_id: arrangement.schedule.id.toString(),
      lesson_id: arrangement.lesson.id.toString(),
      teaching_focus: arrangement.teaching_focus || '',
    });

    // 加载对应排课的课时列表
    try {
      const response = await api.get(`/admin/lesson-arrangements/schedule/${arrangement.schedule.id}/lessons`);
      if (response.data?.data?.units) {
        setSelectedScheduleUnits(response.data.data.units);
      }
    } catch (error) {
      console.error('加载课时列表失败:', error);
    }

    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('确定要删除这个课程安排吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    arrangementMutation.mutate(formData);
  };

  const arrangements = arrangementsData?.data?.data || [];
  const classes = classesData?.data || [];
  const schedules = schedulesData?.data || [];

  // 确保 classes 是数组
  const safeClasses = Array.isArray(classes) ? classes : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">课程安排</h1>
          <p className="text-muted-foreground">管理每次课的具体教学内容</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              设置课程内容
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingArrangement ? '编辑课程安排' : '设置课程内容'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingArrangement && (
                <div>
                  <Label htmlFor="schedule_id">选择排课</Label>
                  <Select
                    value={formData.schedule_id}
                    onValueChange={(value) => setFormData({ ...formData, schedule_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择排课" />
                    </SelectTrigger>
                    <SelectContent>
                      {schedules.map((schedule: any) => (
                        <SelectItem key={schedule.id} value={schedule.id.toString()}>
                          {schedule.schedule_date} {schedule.start_time}-{schedule.end_time} - {schedule.class.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="lesson_id">选择课时内容</Label>
                <Select
                  value={formData.lesson_id}
                  onValueChange={(value) => setFormData({ ...formData, lesson_id: value })}
                  disabled={!formData.schedule_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.schedule_id ? "请选择课时" : "请先选择排课"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedScheduleUnits.map((unit: CourseUnit) => (
                      <SelectGroup key={unit.id}>
                        <SelectLabel>{unit.name}</SelectLabel>
                        {unit.lessons?.map((lesson: Lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id.toString()}>
                            <div>
                              <div className="font-medium">{lesson.name}</div>
                              {lesson.content && (
                                <div className="text-sm text-gray-500">{lesson.content}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {formData.schedule_id && selectedScheduleUnits.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    该班级级别暂无可用课时内容
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="teaching_focus">教学重点</Label>
                <Textarea
                  id="teaching_focus"
                  value={formData.teaching_focus}
                  onChange={(e) => setFormData({ ...formData, teaching_focus: e.target.value })}
                  placeholder="请输入本次课的教学重点和目标"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={arrangementMutation.isPending}>
                  {arrangementMutation.isPending ? '保存中...' : '保存'}
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
                  placeholder="搜索课程安排..."
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
                {safeClasses.map((cls: Class) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 课程安排列表 */}
      <Card>
        <CardHeader>
          <CardTitle>课程安排列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : arrangements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无课程安排
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>上课日期</TableHead>
                  <TableHead>班级名称</TableHead>
                  <TableHead>教师</TableHead>
                  <TableHead>课程单元</TableHead>
                  <TableHead>课时内容</TableHead>
                  <TableHead>教学重点</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrangements.map((arrangement: LessonArrangement) => (
                  <TableRow key={arrangement.id}>
                    <TableCell>
                      {arrangement.schedule.schedule_date}
                      <div className="text-sm text-gray-500">
                        {arrangement.schedule.start_time}-{arrangement.schedule.end_time}
                      </div>
                    </TableCell>
                    <TableCell>{arrangement.schedule.class.name}</TableCell>
                    <TableCell>{arrangement.schedule.teacher.name}</TableCell>
                    <TableCell>{arrangement.lesson.unit.name}</TableCell>
                    <TableCell>
                      <div className="font-medium">{arrangement.lesson.name}</div>
                      {arrangement.lesson.content && (
                        <div className="text-sm text-gray-500 max-w-xs truncate" title={arrangement.lesson.content}>
                          {arrangement.lesson.content}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={arrangement.teaching_focus}>
                        {arrangement.teaching_focus || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(arrangement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(arrangement.id)}
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

export default LessonArrangements;
