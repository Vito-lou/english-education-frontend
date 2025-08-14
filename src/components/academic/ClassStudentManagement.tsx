import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, ArrowRightLeft, UserMinus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import AddStudentToClassDialog from './AddStudentToClassDialog';
import TransferStudentDialog from './TransferStudentDialog';

interface ClassStudentManagementProps {
  classId: number;
  classInfo: any;
}

interface ClassStudent {
  id: number;
  student_id: number;
  enrollment_date: string;
  status: string;
  status_name: string;
  student: {
    id: number;
    name: string;
    phone: string;
    gender: string;
    age: number;
    parent_name: string;
    parent_phone: string;
    student_type: string;
    student_type_name: string;
  };
}

const ClassStudentManagement: React.FC<ClassStudentManagementProps> = ({
  classId,
  classInfo,
}) => {
  const [search, setSearch] = useState('');
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<ClassStudent | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState<ClassStudent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取班级学员列表
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['class-students', classId, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        class_id: classId.toString(),
        status: 'active', // 只获取在读学员
      });

      if (search) {
        params.append('search', search);
      }

      const response = await api.get(`/admin/student-classes?${params}`);
      return response.data;
    },
  });

  // 移出班级
  const removeStudentMutation = useMutation({
    mutationFn: async (studentClassId: number) => {
      await api.delete(`/admin/student-classes/${studentClassId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] });
      queryClient.invalidateQueries({ queryKey: ['class-detail', classId] });
      setShowRemoveDialog(false);
      setStudentToRemove(null);
      addToast({
        type: 'success',
        title: '操作成功',
        description: '学员已移出班级',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '操作失败',
        description: error.response?.data?.message || '移出失败',
      });
    },
  });

  const students = Array.isArray(studentsData?.data) ? studentsData.data : [];

  const handleRemoveStudent = (student: ClassStudent) => {
    setStudentToRemove(student);
    setShowRemoveDialog(true);
  };

  const handleTransferStudent = (student: ClassStudent) => {
    setStudentToTransfer(student);
    setShowTransferDialog(true);
  };

  const handleAddStudent = () => {
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* 操作区域 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索学员姓名或手机号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="text-sm text-gray-600">
            共 {students.length} 名学员
          </div>
        </div>
        <Button onClick={handleAddStudent} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>添加学员</span>
        </Button>
      </div>

      {/* 学员列表 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无学员</h3>
          <p className="text-gray-500 mb-4">
            {search ? '没有找到匹配的学员' : '该班级还没有学员，点击上方按钮添加学员'}
          </p>
          {!search && (
            <Button onClick={handleAddStudent}>
              <Plus className="h-4 w-4 mr-2" />
              添加第一个学员
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>学员姓名</TableHead>
              <TableHead>联系方式</TableHead>
              <TableHead>家长信息</TableHead>
              <TableHead>学员类型</TableHead>
              <TableHead>入班日期</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((item: ClassStudent) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{item.student.name}</div>
                    {item.student.age && (
                      <div className="text-sm text-gray-500">{item.student.age}岁</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {item.student.phone && <div>{item.student.phone}</div>}
                    {item.student.gender && (
                      <div className="text-gray-500">
                        {item.student.gender === 'male' ? '男' : '女'}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{item.student.parent_name}</div>
                    <div className="text-gray-500">{item.student.parent_phone}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.student.student_type_name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>{item.enrollment_date}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                    {item.status_name}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleTransferStudent(item)}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        调至其他班
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveStudent(item)}
                        className="text-red-600"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        移出本班
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* 移出班级确认对话框 */}
      <ConfirmDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        onConfirm={() => studentToRemove && removeStudentMutation.mutate(studentToRemove.id)}
        title="移出班级"
        description={`确定要将学员"${studentToRemove?.student.name}"移出班级"${classInfo.name}"吗？`}
        confirmText="确认移出"
        cancelText="取消"
        variant="destructive"
      />

      {/* 转班对话框 */}
      <TransferStudentDialog
        open={showTransferDialog}
        onClose={() => {
          setShowTransferDialog(false);
          setStudentToTransfer(null);
        }}
        studentClass={studentToTransfer}
        currentClassInfo={classInfo}
      />

      {/* 添加学员对话框 */}
      <AddStudentToClassDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        classId={classId}
        classInfo={classInfo}
      />
    </div>
  );
};

export default ClassStudentManagement;
