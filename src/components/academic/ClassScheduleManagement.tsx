import React, { useState, useEffect } from 'react';
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
import { Calendar, Plus, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface ClassScheduleManagementProps {
  classId: number;
  classInfo: any;
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
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // 批量排课表单数据
  const [batchForm, setBatchForm] = useState({
    course_id: '',
    teacher_id: '',
    time_slot_id: '',
    lesson_content: '',
    classroom: '',
  });

  // 获取班级排课列表
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/class-schedules?class_id=${classId}`);
      setSchedules(response.data.data || []);
    } catch (error) {
      console.error('获取排课失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取基础数据
  const fetchBasicData = async () => {
    try {
      const [coursesRes, teachersRes, timeSlotsRes] = await Promise.all([
        api.get('/admin/courses-options'),
        api.get('/admin/users-options?role=teacher'),
        api.get('/admin/time-slots'),
      ]);

      console.log('Courses data:', coursesRes.data);
      setCourses(coursesRes.data.data || []);

      console.log('Teachers data:', teachersRes.data);
      setTeachers(teachersRes.data.data || []);

      console.log('Time slots data:', timeSlotsRes.data);
      setTimeSlots(timeSlotsRes.data.data || []);
    } catch (error) {
      console.error('获取基础数据失败:', error);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchBasicData();
  }, [classId]);

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

  // 生成未来30天的日期选项
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // 处理日期选择
  const handleDateToggle = (date: string) => {
    setSelectedDates(prev =>
      prev.includes(date)
        ? prev.filter(d => d !== date)
        : [...prev, date]
    );
  };

  // 提交批量排课
  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDates.length === 0) {
      addToast({
        type: 'error',
        title: '请选择日期',
        description: '至少选择一个上课日期',
      });
      return;
    }

    try {
      await api.post('/admin/schedules/batch-create', {
        class_id: classId,
        ...batchForm,
        dates: selectedDates,
      });

      addToast({
        type: 'success',
        title: '排课成功',
        description: `成功创建 ${selectedDates.length} 个课程安排`,
      });
      setBatchDialogOpen(false);
      fetchSchedules();
    } catch (error) {
      console.error('批量排课失败:', error);
      addToast({
        type: 'error',
        title: '排课失败',
        description: error.response?.data?.message || '网络错误，请稍后重试',
      });
    }
  };

  // 删除排课
  const handleDelete = async (schedule: ClassSchedule) => {
    if (!confirm(`确定要删除 ${schedule.schedule_date} 的课程安排吗？`)) {
      return;
    }

    try {
      await api.delete(`/admin/class-schedules/${schedule.id}`);

      addToast({
        type: 'success',
        title: '删除成功',
        description: '课程安排已删除',
      });
      fetchSchedules();
    } catch (error: any) {
      console.error('删除失败:', error);
      addToast({
        type: 'error',
        title: '删除失败',
        description: error.response?.data?.message || '网络错误，请稍后重试',
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'rescheduled': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">班级排课</h3>
          <p className="text-sm text-muted-foreground">管理 {classInfo.name} 的课程安排</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/academic/schedules')}>
            <Settings className="mr-2 h-4 w-4" />
            时间段设置
          </Button>
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
            {loading ? (
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
                    <Badge variant={getStatusBadgeVariant(schedule.status)}>
                      {schedule.status_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                  <Label>授课课程</Label>
                  <Select value={batchForm.course_id} onValueChange={(value) => setBatchForm({ ...batchForm, course_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择课程" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>授课教师</Label>
                  <Select value={batchForm.teacher_id} onValueChange={(value) => setBatchForm({ ...batchForm, teacher_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择教师" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>上课时间</Label>
                  <Select value={batchForm.time_slot_id} onValueChange={(value) => setBatchForm({ ...batchForm, time_slot_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择时间段" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {slot.display_name}
                        </SelectItem>
                      ))}
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
                <Label>选择日期（可多选）</Label>
                <div className="grid grid-cols-7 gap-2 max-h-40 overflow-y-auto border rounded p-2">
                  {generateDateOptions().map((date) => (
                    <Button
                      key={date}
                      type="button"
                      variant={selectedDates.includes(date) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleDateToggle(date)}
                      className="text-xs h-8"
                    >
                      {new Date(date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  已选择 {selectedDates.length} 个日期
                </p>
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
    </div>
  );
};

export default ClassScheduleManagement;
