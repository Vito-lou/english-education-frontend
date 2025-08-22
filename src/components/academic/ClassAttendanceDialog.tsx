import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

// Data structures based on the API design
interface ScheduleInfo {
  id: number;
  class_name: string;
  lesson_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  teacher_name: string;
  subject: string;
}

interface StudentAttendance {
  student_id: number;
  student_name: string;
  enrollment_id: number | null;
  course_name: string;
  remaining_lessons: number;
  attendance_status: string;
  deducted_lessons: number;
  remarks: string;
}

interface AttendanceData {
  schedule_info: ScheduleInfo;
  lesson_content: string;
  students: StudentAttendance[];
}

interface ClassAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  schedule: { id: number; name?: string } | null;
  onAttendanceSaved: () => void;
}

// 出勤状态按钮组组件
const AttendanceStatusButtons: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const statusOptions = [
    { value: 'present', label: '到课', color: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' },
    { value: 'late', label: '迟到', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200' },
    { value: 'personal_leave', label: '请假', color: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200' },
    { value: 'absent', label: '未到', color: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200' },
  ];

  return (
    <div className="flex space-x-1">
      {statusOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1 text-xs font-medium border rounded transition-colors',
            value === option.value
              ? option.color
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

const ClassAttendanceDialog: React.FC<ClassAttendanceDialogProps> = ({ open, onClose, schedule, onAttendanceSaved }) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [lessonContent, setLessonContent] = useState('');
  const [studentRecords, setStudentRecords] = useState<StudentAttendance[]>([]);

  // Fetch attendance data when the dialog opens for a specific schedule
  const { data: attendanceData, isLoading, error } = useQuery<AttendanceData>({
    queryKey: ['attendance', schedule?.id],
    queryFn: async () => {
      if (!schedule) throw new Error('No schedule selected');
      const response = await api.get(`/admin/class-schedules/${schedule.id}/attendance`);
      return response.data.data;
    },
    enabled: open && !!schedule,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (attendanceData) {
      setLessonContent(attendanceData.lesson_content || '');
      setStudentRecords(attendanceData.students || []);
    }
  }, [attendanceData]);

  // Mutation for saving attendance data
  const mutation = useMutation({
    mutationFn: (payload: { lesson_content: string; students: StudentAttendance[] }) => {
      if (!schedule) throw new Error('No schedule selected');
      return api.post(`/admin/class-schedules/${schedule.id}/attendance`, payload);
    },
    onSuccess: () => {
      addToast({
        type: 'success',
        title: '点名成功',
        description: '考勤记录已保存。',
      });
      queryClient.invalidateQueries({ queryKey: ['schedules', schedule?.id] });
      onAttendanceSaved();
    },
    onError: (err: any) => {
      addToast({
        type: 'error',
        title: '操作失败',
        description: err.response?.data?.message || '保存考勤记录失败，请稍后重试。',
      });
    },
  });

  const handleStudentRecordChange = (studentId: number, field: keyof StudentAttendance, value: string | number) => {
    setStudentRecords(prev =>
      prev.map(rec => {
        if (rec.student_id === studentId) {
          const updatedRec = { ...rec, [field]: value };
          // Apply business logic: if status is 'personal_leave' or 'absent', default deducted lessons to 0
          if (field === 'attendance_status') {
            if (value === 'personal_leave' || value === 'absent' || value === 'late') {
              updatedRec.deducted_lessons = 0;
            } else {
              updatedRec.deducted_lessons = 1;
            }
          }
          return updatedRec;
        }
        return rec;
      })
    );
  };

  const handleSubmit = () => {
    mutation.mutate({ lesson_content: lessonContent, students: studentRecords });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>课程点名</DialogTitle>
          {attendanceData?.schedule_info && (
            <DialogDescription>
              {`${attendanceData.schedule_info.class_name} - ${attendanceData.schedule_info.lesson_date} - ${attendanceData.schedule_info.teacher_name}`}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="text-center p-8">加载中...</div>
        ) : error ? (
          <div className="text-center p-8 text-red-600">加载点名数据失败。</div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="lesson-content">上课内容</Label>
              <Textarea
                id="lesson-content"
                value={lessonContent}
                onChange={(e) => setLessonContent(e.target.value)}
                placeholder="请输入本次课程的教学内容..."
              />
            </div>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学员姓名</TableHead>
                    <TableHead>剩余课时</TableHead>
                    <TableHead>到课状态</TableHead>
                    <TableHead>扣除课时</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentRecords.map(rec => (
                    <TableRow key={rec.student_id}>
                      <TableCell>{rec.student_name}</TableCell>
                      <TableCell>{rec.remaining_lessons}</TableCell>
                      <TableCell>
                        <AttendanceStatusButtons
                          value={rec.attendance_status}
                          onChange={(value) => handleStudentRecordChange(rec.student_id, 'attendance_status', value)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              const newValue = Math.max(0, rec.deducted_lessons - 0.5);
                              handleStudentRecordChange(rec.student_id, 'deducted_lessons', newValue);
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={rec.deducted_lessons}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              handleStudentRecordChange(rec.student_id, 'deducted_lessons', Math.max(0, value));
                            }}
                            className="w-16 text-center"
                            step="0.5"
                            min="0"
                            max="10"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              const newValue = Math.min(10, rec.deducted_lessons + 0.5);
                              handleStudentRecordChange(rec.student_id, 'deducted_lessons', newValue);
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={rec.remarks}
                          onChange={(e) => handleStudentRecordChange(rec.student_id, 'remarks', e.target.value)}
                          placeholder="填写备注..."
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || mutation.isPending}>
            {mutation.isPending ? '保存中...' : '确认点名'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassAttendanceDialog;

