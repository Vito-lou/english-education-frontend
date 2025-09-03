import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, X, Calendar, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

interface Student {
  id: number;
  user_id: number;
  name: string;
  student_type: string;
  student_type_name?: string;
  user?: {
    id: number;
    name: string;
    avatar?: string;
  } | null;
}

interface Lesson {
  id: number;
  name: string;
  content: string;
  sort_order: number;
  unit_id: number;
  unit: {
    id: number;
    course_id: number;
    name: string;
    course: {
      id: number;
      name: string;
      code: string;
    };
  };
}

interface StudentAttendanceData {
  student_id: number;
  attendance_status: string;
  deducted_lessons: number;
  teacher_notes: string;
}

interface ManualAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number;
  className: string;
}

const ManualAttendanceDialog: React.FC<ManualAttendanceDialogProps> = ({
  open,
  onOpenChange,
  classId,
  className,
}) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [step, setStep] = useState<'select-students' | 'attendance-form'>('select-students');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    lesson_time: '', // 改为统一的lesson_time字段
    lesson_id: '',
    lesson_content: '',
  });
  const [attendanceData, setAttendanceData] = useState<Record<number, StudentAttendanceData>>({});

  // 获取班级学员
  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['manual-attendance-students', classId],
    queryFn: async () => {
      const response = await api.get(`/admin/manual-attendance/classes/${classId}/students`);
      return response.data.data;
    },
    enabled: open,
  });

  // 获取课程内容
  const { data: lessonsData, error: lessonsError } = useQuery({
    queryKey: ['manual-attendance-lessons'],
    queryFn: async () => {
      const response = await api.get('/admin/manual-attendance/lessons');
      return response.data.data;
    },
    enabled: open,
  });

  const students: Student[] = studentsData?.students || [];
  const lessons: Lesson[] = lessonsData || [];

  // 创建手动点名记录
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const response = await api.post('/admin/manual-attendance', data);
        return response.data;
      } catch (error) {
        console.error('创建手动点名记录失败:', error);
        throw error;
      }
    },
    onSuccess: () => {
      addToast({
        title: '成功',
        description: '手动点名记录创建成功',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['class-attendance-records'] });
      handleClose();
    },
    onError: (error: any) => {
      addToast({
        title: '错误',
        description: error.response?.data?.message || '创建失败',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setStep('select-students');
    setSelectedStudents([]);
    setFormData({
      lesson_time: '',
      lesson_id: '',
      lesson_content: '',
    });
    setAttendanceData({});
    onOpenChange(false);
  };

  const handleStudentSelect = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleNextStep = () => {
    if (selectedStudents.length === 0) {
      addToast({
        title: '提示',
        description: '请至少选择一个学员',
        variant: 'destructive',
      });
      return;
    }

    // 初始化考勤数据
    const initialAttendanceData: Record<number, StudentAttendanceData> = {};
    selectedStudents.forEach(studentId => {
      initialAttendanceData[studentId] = {
        student_id: studentId,
        attendance_status: 'present',
        deducted_lessons: 1,
        teacher_notes: '',
      };
    });
    setAttendanceData(initialAttendanceData);
    setStep('attendance-form');
  };

  const handleAttendanceChange = (studentId: number, field: keyof StudentAttendanceData, value: any) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = () => {
    if (!formData.lesson_time) {
      addToast({
        title: '提示',
        description: '请选择上课时间',
        variant: 'destructive',
      });
      return;
    }

    const submitData = {
      class_id: classId,
      lesson_time: formData.lesson_time, // 使用统一的lesson_time字段
      lesson_id: formData.lesson_id || null,
      lesson_content: formData.lesson_content || null,
      students: Object.values(attendanceData),
    };

    createMutation.mutate(submitData);
  };

  const attendanceStatusOptions = [
    { value: 'present', label: '出勤', color: 'bg-green-100 text-green-800' },
    { value: 'absent', label: '缺勤', color: 'bg-red-100 text-red-800' },
    { value: 'late', label: '迟到', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'leave_early', label: '早退', color: 'bg-orange-100 text-orange-800' },
    { value: 'sick_leave', label: '病假', color: 'bg-blue-100 text-blue-800' },
    { value: 'personal_leave', label: '事假', color: 'bg-purple-100 text-purple-800' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>未排课直接点名 - {className}</span>
          </DialogTitle>
        </DialogHeader>

        {step === 'select-students' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              请选择需要点名的学员（可多选）
            </div>

            {studentsLoading ? (
              <div className="text-center py-8">加载中...</div>
            ) : studentsError ? (
              <div className="text-center py-8 text-red-500">
                加载学员列表失败: {(studentsError as any)?.response?.data?.message || '未知错误'}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                该班级暂无学员
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <Card key={student.id} className="p-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) =>
                          handleStudentSelect(student.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <div className="font-medium">{student.user?.name || student.name}</div>
                        <div className="text-sm text-gray-500">
                          类型: {student.student_type_name || student.student_type}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="text-sm text-gray-600">
              已选择 {selectedStudents.length} 个学员
            </div>
          </div>
        )}

        {step === 'attendance-form' && (
          <div className="space-y-6">
            {/* 课程信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>课程信息</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>上课时间 *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.lesson_time}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        lesson_time: e.target.value
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>课程内容</Label>
                    <Select
                      value={formData.lesson_id}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        lesson_id: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择课程内容（可选）" />
                      </SelectTrigger>
                      <SelectContent>
                        {lessons.map((lesson) => (
                          <SelectItem key={lesson.id} value={lesson.id.toString()}>
                            {lesson.unit.course.name} - {lesson.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>上课内容描述</Label>
                  <Textarea
                    value={formData.lesson_content}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      lesson_content: e.target.value
                    }))}
                    placeholder="描述本次课的具体内容（可选）"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 学员点名 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>学员点名</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedStudents.map((studentId) => {
                    const student = students.find(s => s.id === studentId);
                    const attendance = attendanceData[studentId];

                    if (!student || !attendance) return null;

                    return (
                      <Card key={studentId} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{student.user?.name || student.name}</div>
                              <div className="text-sm text-gray-500">
                                类型: {student.student_type_name || student.student_type}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>出勤状态</Label>
                              <Select
                                value={attendance.attendance_status}
                                onValueChange={(value) =>
                                  handleAttendanceChange(studentId, 'attendance_status', value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {attendanceStatusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <Badge className={option.color}>
                                        {option.label}
                                      </Badge>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>扣除课时</Label>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={attendance.deducted_lessons}
                                onChange={(e) =>
                                  handleAttendanceChange(studentId, 'deducted_lessons', parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>备注</Label>
                              <Input
                                value={attendance.teacher_notes}
                                onChange={(e) =>
                                  handleAttendanceChange(studentId, 'teacher_notes', e.target.value)
                                }
                                placeholder="课堂表现备注"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === 'select-students' ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button onClick={handleNextStep}>
                下一步
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('select-students')}>
                上一步
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? '保存中...' : '保存点名记录'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualAttendanceDialog;
