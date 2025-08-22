import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface AddStudentToClassDialogProps {
  open: boolean;
  onClose: () => void;
  classId: number;
  classInfo: any;
}

interface Student {
  id: number;
  name: string;
  phone: string;
  gender: string;
  age: number;
  parent_name: string;
  parent_phone: string;
  student_type: string;
  student_type_name: string;
}

const AddStudentToClassDialog: React.FC<AddStudentToClassDialogProps> = ({
  open,
  onClose,
  classId,
  classInfo,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取可添加的学员列表（排除已在班级中的学员）
  const { data: studentsData, isLoading, refetch } = useQuery({
    queryKey: ['available-students', classId, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        exclude_class_id: classId.toString(),
        student_type: 'enrolled', // 只显示正式学员（已报名）
      });

      if (search) {
        params.append('search', search);
      }

      const response = await api.get(`/admin/students?${params}`);
      return response.data;
    },
    enabled: open, // 只有在弹窗打开时才执行查询
    refetchOnWindowFocus: false,
    staleTime: 0, // 数据立即过期，确保每次打开都获取最新数据
  });

  // 当弹窗打开时，重新获取最新的学员数据
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  // 添加学员到班级
  const addStudentsMutation = useMutation({
    mutationFn: async (studentIds: number[]) => {
      const promises = studentIds.map(studentId =>
        api.post('/admin/student-classes', {
          student_id: studentId,
          class_id: classId,
          enrollment_date: new Date().toISOString().split('T')[0], // 使用当前日期
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId] });
      queryClient.invalidateQueries({ queryKey: ['available-students', classId] });
      setSelectedStudents([]);
      onClose();
      addToast({
        type: 'success',
        title: '添加成功',
        description: `已成功添加 ${selectedStudents.length} 名学员到班级`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '添加失败',
        description: error.response?.data?.message || '添加学员失败',
      });
    },
  });

  const students = Array.isArray(studentsData?.data?.data)
    ? studentsData.data.data
    : Array.isArray(studentsData?.data)
      ? studentsData.data
      : [];

  const handleStudentSelect = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(students.map((s: Student) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSubmit = () => {
    if (selectedStudents.length === 0) {
      addToast({
        type: 'warning',
        title: '请选择学员',
        description: '请至少选择一名学员添加到班级',
      });
      return;
    }

    addStudentsMutation.mutate(selectedStudents);
  };

  const handleClose = () => {
    setSelectedStudents([]);
    setSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加学员到班级：{classInfo.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索学员姓名或手机号..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              已选择 {selectedStudents.length} 名学员
            </div>
          </div>

          {/* 学员列表 */}
          <div className="border rounded-lg max-h-96 overflow-auto">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">加载中...</div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无可添加的学员</h3>
                <p className="text-gray-500">
                  {search
                    ? '没有找到匹配的正式学员'
                    : '所有正式学员都已在班级中，或没有该课程的有效报名记录'
                  }
                </p>
                {!search && (
                  <p className="text-xs text-gray-400 mt-2">
                    提示：只有正式学员且有对应课程报名记录的学员才能加入班级
                  </p>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === students.length && students.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>学员姓名</TableHead>
                    <TableHead>性别</TableHead>
                    <TableHead>手机号</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) =>
                            handleStudentSelect(student.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{student.name}</div>
                          {student.age && (
                            <div className="text-sm text-gray-500">{student.age}岁</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '-'}
                      </TableCell>
                      <TableCell>
                        {student.phone || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedStudents.length === 0 || addStudentsMutation.isPending}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>
                添加 {selectedStudents.length > 0 ? `${selectedStudents.length} 名` : ''}学员
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentToClassDialog;
