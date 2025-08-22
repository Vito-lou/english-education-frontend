import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Trash2, Settings, UserCheck, Edit } from 'lucide-react';
import { CacheUtils } from '@/utils/cacheUtils';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import TimeSlotSettings from './TimeSlotSettings';
import CalendarMultiSelect from '@/components/ui/calendar-multi-select';
import ClassAttendanceDialog from './ClassAttendanceDialog';

// 状态徽章组件
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { text: '未点名', variant: 'destructive' as const };
      case 'completed':
        return { text: '已点名', variant: 'default' as const };
      case 'cancelled':
        return { text: '已取消', variant: 'secondary' as const };
      default:
        return { text: status, variant: 'outline' as const };
    }
  };

  const config = getStatusConfig(status);
  return <Badge variant={config.variant}>{config.text}</Badge>;
};

interface ClassInfo {
  id: number;
  name: string;
  course_id?: number;
  teacher_id?: number;
}

interface ClassScheduleManagementProps {
  classId: number;
  classInfo: ClassInfo;
}

interface ClassSchedule {
  id: number;
  schedule_date: string;
  lesson_content: string;
  classroom: string;
  status: string;
  status_name: string;
  course: {
    name: string;
  };
  teacher: {
    name: string;
  };
  time_slot: {
    name: string;
    time_range: string;
  };
}

interface Course {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface TimeSlot {
  id: number;
  name: string;
  display_name: string;
}

const ClassScheduleManagement: React.FC<ClassScheduleManagementProps> = ({ classId, classInfo }) => {
  const queryClient = useQueryClient();
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [timeSlotSettingsOpen, setTimeSlotSettingsOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ClassSchedule | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const { addToast } = useToast();

  // 获取班级排课列表
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['class-schedules', classId],
    queryFn: async () => {
      const response = await api.get(`/admin/class-schedules?class_id=${classId}`);
      return response.data.data || [];
    },
  });

  // 获取课程列表
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses-options'],
    queryFn: async () => {
      const response = await api.get('/admin/courses-options');
      return response.data.data || [];
    },
  });

  // 获取教师列表
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers-options'],
    queryFn: async () => {
      const response = await api.get('/admin/users-options?role=teacher');
      return response.data.data || [];
    },
  });

  // 获取时间段列表
  const { data: timeSlots = [], isLoading: timeSlotsLoading } = useQuery({
    queryKey: ['time-slots'],
    queryFn: async () => {
      const response = await api.get('/admin/time-slots');
      return response.data.data || [];
    },
  });

  // 批量排课表单数据
  const [batchForm, setBatchForm] = useState({
    course_id: '',
    teacher_id: '',
    time_slot_id: '',
    lesson_content: '',
    classroom: '',
  });

  // 批量排课 mutation
  const batchScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/admin/schedules/batch-create', data);
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: '排课成功',
        description: `成功创建 ${selectedDates.length} 个课程安排`,
      });
      setBatchDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['class-schedules', classId] });
    },
    onError: (error: any) => {
      console.error('批量排课失败:', error);
      const description = error?.response?.data?.message || '网络错误，请稍后重试';
      addToast({
        type: 'error',
        title: '排课失败',
        description,
      });
    },
  });

  // 删除排课 mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      return api.delete(`/admin/class-schedules/${scheduleId}`);
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: '删除成功',
        description: '课程安排已删除',
      });
      queryClient.invalidateQueries({ queryKey: ['class-schedules', classId] });
    },
    onError: (error: any) => {
      console.error('删除失败:', error);
      const description = error?.response?.data?.message || '网络错误，请稍后重试';
      addToast({
        type: 'error',
        title: '删除失败',
        description,
      });
    },
  });

  // 时间段更新后的回调
  const handleTimeSlotUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['time-slots'] });
  };

  // 打开一键排课对话框
  const handleBatchSchedule = () => {
    setBatchForm({
      course_id: classInfo.course_id?.toString() || '',
      teacher_id: classInfo.teacher_id?.toString() || '',
      time_slot_id: '',
      lesson_content: '',
      classroom: '',
    });
    setSelectedDates([]);
    setBatchDialogOpen(true);
  };

  // 打开点名对话框
  const handleAttendance = (schedule: ClassSchedule) => {
    setSelectedSchedule(schedule);
    setAttendanceDialogOpen(true);
  };

  // 处理日期选择
  const handleDatesChange = (dates: Date[]) => {
    setSelectedDates(dates);
  };

  // 提交批量排课
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 前端表单验证
    const errors = [];

    if (!batchForm.course_id) {
      errors.push('请选择授课课程');
    }

    if (!batchForm.teacher_id) {
      errors.push('请选择授课教师');
    }

    if (!batchForm.time_slot_id) {
      errors.push('请选择上课时间');
    }

    if (selectedDates.length === 0) {
      errors.push('请至少选择一个上课日期');
    }

    if (errors.length > 0) {
      addToast({
        type: 'error',
        title: '表单验证失败',
        description: errors.join('、'),
      });
      return;
    }

    // 将Date对象转换为字符串格式（避免时区问题）
    const dateStrings = selectedDates.map(date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });

    batchScheduleMutation.mutate({
      class_id: classId,
      ...batchForm,
      dates: dateStrings,
    });
  };

  // 删除排课
  const handleDelete = (schedule: ClassSchedule) => {
    deleteScheduleMutation.mutate(schedule.id);
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">班级排课</h3>
          <p className="text-sm text-muted-foreground">管理 {classInfo.name} 的课程安排</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleBatchSchedule} size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            一键排课
          </Button>
        </div>
      </div>

      {/* 排课列表 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>上课日期</TableHead>
              <TableHead>时间段</TableHead>
              <TableHead>课程</TableHead>
              <TableHead>教师</TableHead>
              <TableHead>教室</TableHead>
              <TableHead>上课内容</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">暂无排课</h3>
                    <p className="text-muted-foreground mb-4">还没有为这个班级安排课程</p>
                    <Button onClick={handleBatchSchedule} size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      开始排课
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.schedule_date}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{schedule.time_slot?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.time_slot?.time_range}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{schedule.course?.name}</TableCell>
                  <TableCell>{schedule.teacher?.name}</TableCell>
                  <TableCell>{schedule.classroom || '-'}</TableCell>
                  <TableCell>{schedule.lesson_content || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge status={schedule.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* 点名按钮 - 根据状态和日期显示不同的按钮 */}
                      {schedule.status === 'scheduled' && new Date(schedule.schedule_date) <= new Date() ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAttendance(schedule)}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          点名
                        </Button>
                      ) : schedule.status === 'completed' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAttendance(schedule)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          修改点名
                        </Button>
                      ) : schedule.status === 'scheduled' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          未开始
                        </Button>
                      ) : null}
                      {/* 删除按钮 - 已点名的排课不能删除 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(schedule)}
                        disabled={schedule.status === 'completed'}
                        title={schedule.status === 'completed' ? '已点名的排课不能删除' : '删除排课'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 一键排课对话框 */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>一键排课 - {classInfo.name}</DialogTitle>
            <DialogDescription>
              为班级批量创建课程安排，选择日期和时间段
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBatchSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    授课课程
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={batchForm.course_id} onValueChange={(value) => setBatchForm({ ...batchForm, course_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择课程" />
                    </SelectTrigger>
                    <SelectContent>
                      {coursesLoading ? (
                        <SelectItem value="" disabled>加载中...</SelectItem>
                      ) : Array.isArray(courses) ? (
                        courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>暂无课程</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    授课教师
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select value={batchForm.teacher_id} onValueChange={(value) => setBatchForm({ ...batchForm, teacher_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择教师" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachersLoading ? (
                        <SelectItem value="" disabled>加载中...</SelectItem>
                      ) : Array.isArray(teachers) ? (
                        teachers.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>暂无教师</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>
                      上课时间
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setTimeSlotSettingsOpen(true)}
                      className="text-xs h-7 px-3 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      时间段设置
                    </Button>
                  </div>
                  <Select value={batchForm.time_slot_id} onValueChange={(value) => setBatchForm({ ...batchForm, time_slot_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择时间段" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlotsLoading ? (
                        <SelectItem value="" disabled>加载中...</SelectItem>
                      ) : Array.isArray(timeSlots) ? (
                        timeSlots.map((slot: any) => (
                          <SelectItem key={slot.id} value={slot.id.toString()}>
                            {slot.display_name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>暂无时间段</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>教室</Label>
                  <Input
                    value={batchForm.classroom}
                    onChange={(e) => setBatchForm({ ...batchForm, classroom: e.target.value })}
                    placeholder="教室名称"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>上课内容</Label>
                <Input
                  value={batchForm.lesson_content}
                  onChange={(e) => setBatchForm({ ...batchForm, lesson_content: e.target.value })}
                  placeholder="上课内容说明（最多20字）"
                  maxLength={20}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  选择日期（可多选）
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="border rounded-lg">
                  <CalendarMultiSelect
                    selectedDates={selectedDates}
                    onDatesChange={handleDatesChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBatchDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                创建排课
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 时间段设置对话框 */}
      <TimeSlotSettings
        open={timeSlotSettingsOpen}
        onClose={() => setTimeSlotSettingsOpen(false)}
        onTimeSlotUpdated={handleTimeSlotUpdated}
      />

      {/* 点名对话框 */}
      {selectedSchedule && (
        <ClassAttendanceDialog
          open={attendanceDialogOpen}
          onClose={() => setAttendanceDialogOpen(false)}
          schedule={selectedSchedule}
          onAttendanceSaved={() => {
            setAttendanceDialogOpen(false);
            // 使用缓存工具函数刷新点名相关缓存
            CacheUtils.refreshAfterAttendance(queryClient, classId);
          }}
        />
      )}
    </div>
  );
};

export default ClassScheduleManagement;
