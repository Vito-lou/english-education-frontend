import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MessageSquare, Users, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface ScheduleWithComments {
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
  lessonArrangement?: {
    lesson: {
      title: string;
      unit: {
        name: string;
      };
    };
  };
  total_students: number;
  commented_students: number;
}

interface StudentComment {
  student_id: number;
  student_name: string;
  comment: {
    id: number;
    teacher_comment: string;
    performance_rating: number;
    homework_completion: 'completed' | 'partial' | 'not_completed';
    homework_completion_name: string;
    homework_quality_rating: number;
  } | null;
}

interface CommentFormData {
  student_id: number;
  teacher_comment: string;
  performance_rating: number;
  homework_completion: 'completed' | 'partial' | 'not_completed' | '';
  homework_quality_rating: number;
}

const LessonComments: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithComments | null>(null);
  const [studentsWithComments, setStudentsWithComments] = useState<StudentComment[]>([]);
  const [commentForms, setCommentForms] = useState<Record<number, CommentFormData>>({});

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取课后点评列表
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['lesson-comments', { status: selectedStatus, class_id: selectedClassId, keyword: searchKeyword }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedClassId && selectedClassId !== 'all') params.append('class_id', selectedClassId);
      if (searchKeyword) params.append('keyword', searchKeyword);

      const response = await api.get(`/admin/lesson-comments?${params}`);
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

  // 获取指定排课的学员点评
  const { data: scheduleCommentsData, refetch: refetchScheduleComments } = useQuery({
    queryKey: ['schedule-comments', selectedSchedule?.id],
    queryFn: async () => {
      if (!selectedSchedule) return null;
      const response = await api.get(`/admin/lesson-comments/schedule/${selectedSchedule.id}`);
      return response.data;
    },
    enabled: !!selectedSchedule,
  });

  // 批量保存点评
  const commentMutation = useMutation({
    mutationFn: async (data: { schedule_id: number; comments: CommentFormData[] }) => {
      const response = await api.post('/admin/lesson-comments/batch', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments'] });
      refetchScheduleComments();
      setCommentDialogOpen(false);
      addToast({
        type: 'success',
        title: '保存成功',
        description: '课后点评已保存',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '保存失败',
        description: error.response?.data?.message || '请稍后重试',
      });
    },
  });

  // 处理点评对话框
  const handleComment = async (schedule: ScheduleWithComments) => {
    setSelectedSchedule(schedule);
    setCommentDialogOpen(true);
  };

  // 当获取到学员点评数据时，初始化表单
  React.useEffect(() => {
    if (scheduleCommentsData?.data?.students) {
      const students = scheduleCommentsData.data.students;
      setStudentsWithComments(students);

      // 初始化表单数据
      const forms: Record<number, CommentFormData> = {};
      students.forEach((student: StudentComment) => {
        forms[student.student_id] = {
          student_id: student.student_id,
          teacher_comment: student.comment?.teacher_comment || '',
          performance_rating: student.comment?.performance_rating || 5,
          homework_completion: student.comment?.homework_completion || '',
          homework_quality_rating: student.comment?.homework_quality_rating || 5,
        };
      });
      setCommentForms(forms);
    }
  }, [scheduleCommentsData]);

  const updateCommentForm = (studentId: number, field: keyof CommentFormData, value: any) => {
    setCommentForms(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSubmitComments = () => {
    if (!selectedSchedule) return;

    const comments = Object.values(commentForms).filter(form =>
      form.teacher_comment.trim() || form.performance_rating || form.homework_completion
    );

    commentMutation.mutate({
      schedule_id: selectedSchedule.id,
      comments,
    });
  };

  const getStatusBadge = (schedule: ScheduleWithComments) => {
    const { total_students, commented_students } = schedule;
    if (commented_students === 0) {
      return <Badge variant="secondary">待点评</Badge>;
    } else if (commented_students < total_students) {
      return <Badge variant="outline">部分完成</Badge>;
    } else {
      return <Badge variant="default">已完成</Badge>;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const schedules = schedulesData?.data?.data || [];
  const classes = classesData?.data || [];

  // 确保 classes 是数组
  const safeClasses = Array.isArray(classes) ? classes : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">课后点评</h1>
          <p className="text-muted-foreground">管理学员的课后点评和反馈</p>
        </div>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索课程..."
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
                {safeClasses.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.name}
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
                <SelectItem value="pending">待点评</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 课程列表 */}
      <Card>
        <CardHeader>
          <CardTitle>课程点评列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无课程记录
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>上课日期</TableHead>
                  <TableHead>班级名称</TableHead>
                  <TableHead>课时内容</TableHead>
                  <TableHead>点评进度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule: ScheduleWithComments) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div>{schedule.schedule_date}</div>
                          <div className="text-sm text-gray-500">
                            {schedule.start_time}-{schedule.end_time}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{schedule.class.name}</TableCell>
                    <TableCell>
                      {schedule.lessonArrangement ? (
                        <div className="text-sm">
                          <div>{schedule.lessonArrangement.lesson.unit.name}</div>
                          <div className="text-gray-500">{schedule.lessonArrangement.lesson.title}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">未安排课程内容</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{schedule.commented_students}/{schedule.total_students}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComment(schedule)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {schedule.commented_students > 0 ? '查看/编辑点评' : '批量点评'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 点评对话框 */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              课后点评 - {selectedSchedule?.class.name} ({selectedSchedule?.schedule_date})
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {studentsWithComments.map((student) => (
              <Card key={student.student_id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{student.student_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>课堂表现评分</Label>
                      <Select
                        value={commentForms[student.student_id]?.performance_rating?.toString() || '5'}
                        onValueChange={(value) => updateCommentForm(student.student_id, 'performance_rating', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">优秀 (5分)</SelectItem>
                          <SelectItem value="4">良好 (4分)</SelectItem>
                          <SelectItem value="3">一般 (3分)</SelectItem>
                          <SelectItem value="2">较差 (2分)</SelectItem>
                          <SelectItem value="1">很差 (1分)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>作业完成情况</Label>
                      <Select
                        value={commentForms[student.student_id]?.homework_completion || 'none'}
                        onValueChange={(value) => updateCommentForm(student.student_id, 'homework_completion', value === 'none' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">请选择</SelectItem>
                          <SelectItem value="completed">已完成</SelectItem>
                          <SelectItem value="partial">部分完成</SelectItem>
                          <SelectItem value="not_completed">未完成</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {commentForms[student.student_id]?.homework_completion && (
                    <div>
                      <Label>作业质量评分</Label>
                      <Select
                        value={commentForms[student.student_id]?.homework_quality_rating?.toString() || '5'}
                        onValueChange={(value) => updateCommentForm(student.student_id, 'homework_quality_rating', parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">优秀 (5分)</SelectItem>
                          <SelectItem value="4">良好 (4分)</SelectItem>
                          <SelectItem value="3">一般 (3分)</SelectItem>
                          <SelectItem value="2">较差 (2分)</SelectItem>
                          <SelectItem value="1">很差 (1分)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label>教师点评</Label>
                    <Textarea
                      value={commentForms[student.student_id]?.teacher_comment || ''}
                      onChange={(e) => updateCommentForm(student.student_id, 'teacher_comment', e.target.value)}
                      placeholder="请输入对该学员本次课的具体点评"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitComments} disabled={commentMutation.isPending}>
              {commentMutation.isPending ? '保存中...' : '保存点评'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonComments;
