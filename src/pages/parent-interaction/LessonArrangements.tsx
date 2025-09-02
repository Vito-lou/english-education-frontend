import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface ClassScheduleWithLesson {
  id: number;
  schedule_date: string;
  formatted_schedule_date: string;
  formatted_created_at: string;
  teaching_focus: string;
  class: {
    id: number;
    name: string;
  };
  teacher: {
    id: number;
    name: string;
  };
  time_slot: {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
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
  } | null;
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

interface UnassignedSchedule {
  id: number;
  schedule_date: string;
  formatted_schedule_date: string;
  class: {
    id: number;
    name: string;
  };
  teacher: {
    id: number;
    name: string;
  };
  time_slot: {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
  };
}

const LessonArrangements: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ClassScheduleWithLesson | null>(null);
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

      const response = await api.get(`/admin/class-schedules/lesson-arrangements?${params}`);
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
  const { data: scheduleLessonsData } = useQuery({
    queryKey: ['schedule-lessons', formData.schedule_id],
    queryFn: async () => {
      if (!formData.schedule_id) return null;
      const response = await api.get(`/admin/class-schedules/${formData.schedule_id}/available-lessons`);
      return response.data;
    },
    enabled: !!formData.schedule_id,
  });

  // 当获取到排课对应的课时数据时，更新可选课时列表
  React.useEffect(() => {
    if (scheduleLessonsData?.data?.units) {
      setSelectedScheduleUnits(scheduleLessonsData.data.units);
      // 只有在新建模式下才清空课时选择，编辑模式下保持原有选择
      if (!editingSchedule) {
        setFormData(prev => ({ ...prev, lesson_id: '' }));
      }
    }
  }, [scheduleLessonsData, editingSchedule]);

  // 获取可安排的排课（未设置课程内容的排课）
  const { data: schedulesData } = useQuery({
    queryKey: ['unassigned-schedules'],
    queryFn: async () => {
      const response = await api.get('/admin/class-schedules/unassigned');
      return response.data;
    },
    enabled: dialogOpen && !editingSchedule,
  });

  // 设置课程内容
  const setLessonMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.put(`/admin/class-schedules/${data.schedule_id}/lesson-content`, {
        lesson_id: data.lesson_id,
        teaching_focus: data.teaching_focus,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-arrangements'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-schedules'] });
      setDialogOpen(false);
      resetForm();
      addToast({
        type: 'success',
        title: editingSchedule ? '更新成功' : '设置成功',
        description: editingSchedule ? '课程内容已更新' : '课程内容已设置',
      });
    },
    onError: (error: ApiError) => {
      addToast({
        type: 'error',
        title: '设置失败',
        description: error.response?.data?.message || '请稍后重试',
      });
    },
  });

  // 清除课程内容
  const clearLessonMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      const response = await api.put(`/admin/class-schedules/${scheduleId}/lesson-content`, {
        lesson_id: null,
        teaching_focus: null,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-arrangements'] });
      queryClient.invalidateQueries({ queryKey: ['unassigned-schedules'] });
      addToast({
        type: 'success',
        title: '清除成功',
        description: '课程内容已清除',
      });
    },
    onError: (error: ApiError) => {
      addToast({
        type: 'error',
        title: '清除失败',
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
    setEditingSchedule(null);
  };

  const handleEdit = async (schedule: ClassScheduleWithLesson) => {
    setEditingSchedule(schedule);

    // 设置表单数据
    setFormData({
      schedule_id: schedule.id.toString(),
      lesson_id: schedule.lesson?.id.toString() || '',
      teaching_focus: schedule.teaching_focus || '',
    });

    // 加载对应排课的课时列表
    try {
      const response = await api.get(`/admin/class-schedules/${schedule.id}/available-lessons`);
      if (response.data?.data?.units) {
        setSelectedScheduleUnits(response.data.data.units);
      }
    } catch (error) {
      console.error('加载课时列表失败:', error);
    }

    setDialogOpen(true);
  };

  const handleClear = (scheduleId: number) => {
    if (confirm('确定要清除这个排课的课程内容吗？')) {
      clearLessonMutation.mutate(scheduleId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLessonMutation.mutate(formData);
  };

  const arrangements = arrangementsData?.data?.data || [];
  const classes = classesData?.data || [];
  const schedules = schedulesData?.data || [];

  // 确保数据是数组
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeArrangements = Array.isArray(arrangements) ? arrangements : [];
  const safeSchedules = Array.isArray(schedules) ? schedules : [];

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
                {editingSchedule ? `编辑课程内容 - ${editingSchedule.class.name}` : '设置课程内容'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingSchedule ? (
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
                      {safeSchedules.map((schedule: UnassignedSchedule) => (
                        <SelectItem key={schedule.id} value={schedule.id.toString()}>
                          {schedule.formatted_schedule_date} {schedule.time_slot.start_time}-{schedule.time_slot.end_time} - {schedule.class.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>排课信息</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="font-medium">
                      {editingSchedule.formatted_schedule_date} {editingSchedule.time_slot.start_time}-{editingSchedule.time_slot.end_time}
                    </div>
                    <div className="text-sm text-gray-600">
                      班级：{editingSchedule.class.name} | 教师：{editingSchedule.teacher.name}
                    </div>
                  </div>
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
                <Button type="submit" disabled={setLessonMutation.isPending}>
                  {setLessonMutation.isPending ? '保存中...' : (editingSchedule ? '更新' : '保存')}
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
          ) : safeArrangements.length === 0 ? (
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
                {safeArrangements.map((schedule: ClassScheduleWithLesson) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      {schedule.formatted_schedule_date}
                      <div className="text-sm text-gray-500">
                        {schedule.time_slot.start_time}-{schedule.time_slot.end_time}
                      </div>
                    </TableCell>
                    <TableCell>{schedule.class.name}</TableCell>
                    <TableCell>{schedule.teacher.name}</TableCell>
                    <TableCell>{schedule.lesson?.unit.name || '-'}</TableCell>
                    <TableCell>
                      {schedule.lesson ? (
                        <div>
                          <div className="font-medium">{schedule.lesson.name}</div>
                          {schedule.lesson.content && (
                            <div className="text-sm text-gray-500 max-w-xs truncate" title={schedule.lesson.content}>
                              {schedule.lesson.content}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">未设置</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={schedule.teaching_focus}>
                        {schedule.teaching_focus || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {schedule.lesson && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleClear(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
