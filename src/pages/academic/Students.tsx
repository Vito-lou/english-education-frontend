import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import StudentEditor from '@/components/academic/StudentEditor';
import ConfirmDialog from '@/components/ui/confirm-dialog';

interface Student {
  id: number;
  name: string;
  phone?: string;
  gender?: 'male' | 'female';
  birth_date?: string;
  parent_name: string;
  parent_phone: string;
  parent_relationship: string;
  student_type: 'potential' | 'trial' | 'enrolled' | 'graduated' | 'suspended';
  follow_up_status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'follow_up';
  intention_level: 'high' | 'medium' | 'low';
  source?: string;
  remarks?: string;
  status: 'active' | 'inactive';
  age?: number;
  student_type_name: string;
  follow_up_status_name: string;
  intention_level_name: string;
  user?: {
    id: number;
    name: string;
    phone: string;
  };
  created_at: string;
}

interface StudentStats {
  total: number;
  by_type: {
    potential: number;
    trial: number;
    enrolled: number;
    graduated: number;
    suspended: number;
  };
  by_follow_up: {
    new: number;
    contacted: number;
    interested: number;
    not_interested: number;
    follow_up: number;
  };
  by_intention: {
    high: number;
    medium: number;
    low: number;
  };
}

const Students: React.FC = () => {
  const [search, setSearch] = useState('');
  const [studentType, setStudentType] = useState<string>('all');
  const [followUpStatus, setFollowUpStatus] = useState<string>('all');
  const [intentionLevel, setIntentionLevel] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取学员列表
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['students', search, studentType, followUpStatus, intentionLevel, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '2', // 临时改为2条每页，方便测试分页
      });

      if (search) params.append('search', search);
      if (studentType && studentType !== 'all') params.append('student_type', studentType);
      if (followUpStatus && followUpStatus !== 'all') params.append('follow_up_status', followUpStatus);
      if (intentionLevel && intentionLevel !== 'all') params.append('intention_level', intentionLevel);

      const response = await api.get(`/admin/students?${params}`);
      return response.data;
    },
  });

  // 获取统计信息
  const { data: statsData } = useQuery({
    queryKey: ['students-statistics'],
    queryFn: async () => {
      const response = await api.get('/admin/students/statistics');
      return response.data;
    },
  });

  // 删除学员
  const deleteMutation = useMutation({
    mutationFn: async (studentId: number) => {
      await api.delete(`/admin/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students-statistics'] });
      setShowConfirmDialog(false);
      setStudentToDelete(null);
      addToast({
        type: 'success',
        title: '删除成功',
        description: '学员已删除',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '删除失败',
        description: error.response?.data?.message || '删除失败',
      });
    },
  });

  const students = Array.isArray(studentsData?.data?.data)
    ? studentsData.data.data
    : Array.isArray(studentsData?.data)
      ? studentsData.data
      : [];

  const pagination = studentsData?.data || {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  };

  // 调试分页数据
  console.log('pagination:', pagination);
  console.log('students length:', students.length);

  const stats: StudentStats = statsData?.data || {
    total: 0,
    by_type: { potential: 0, trial: 0, enrolled: 0, graduated: 0, suspended: 0 },
    by_follow_up: { new: 0, contacted: 0, interested: 0, not_interested: 0, follow_up: 0 },
    by_intention: { high: 0, medium: 0, low: 0 },
  };

  const handleCreateStudent = () => {
    setEditingStudent(null);
    setEditorOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditorOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setStudentToDelete(student);
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete.id);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 当筛选条件改变时重置页码
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStudentTypeChange = (value: string) => {
    setStudentType(value);
    setCurrentPage(1);
  };

  const handleFollowUpStatusChange = (value: string) => {
    setFollowUpStatus(value);
    setCurrentPage(1);
  };

  const handleIntentionLevelChange = (value: string) => {
    setIntentionLevel(value);
    setCurrentPage(1);
  };

  const getStudentTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      potential: 'outline',
      trial: 'secondary',
      enrolled: 'default',
      graduated: 'secondary',
      suspended: 'destructive',
    };
    return variants[type] || 'outline';
  };

  const getIntentionBadge = (level: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      high: 'default',
      medium: 'secondary',
      low: 'destructive',
    };
    return variants[level] || 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">学员管理</h1>
        <p className="text-muted-foreground">管理学员信息、跟进状态和学习进度</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总学员数</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">正式学员</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.by_type.enrolled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">试听学员</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.by_type.trial}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">潜在学员</CardTitle>
            <UserPlus className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.by_type.potential}</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索学员姓名、电话、家长信息..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={studentType} onValueChange={handleStudentTypeChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="学员类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="potential">潜在学员</SelectItem>
                <SelectItem value="trial">试听学员</SelectItem>
                <SelectItem value="enrolled">正式学员</SelectItem>
                <SelectItem value="graduated">已毕业</SelectItem>
                <SelectItem value="suspended">暂停学习</SelectItem>
              </SelectContent>
            </Select>

            <Select value={followUpStatus} onValueChange={handleFollowUpStatusChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="跟进状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="new">新学员</SelectItem>
                <SelectItem value="contacted">已联系</SelectItem>
                <SelectItem value="interested">有意向</SelectItem>
                <SelectItem value="not_interested">无意向</SelectItem>
                <SelectItem value="follow_up">跟进中</SelectItem>
              </SelectContent>
            </Select>

            <Select value={intentionLevel} onValueChange={handleIntentionLevelChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="意向等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部等级</SelectItem>
                <SelectItem value="high">高意向</SelectItem>
                <SelectItem value="medium">中意向</SelectItem>
                <SelectItem value="low">低意向</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 学员列表 */}
      <Card className="min-h-[600px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>学员列表</CardTitle>
            <Button onClick={handleCreateStudent} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              新增学员
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">暂无学员</h3>
              <p className="text-sm mb-4">开始添加第一个学员吧</p>
              <Button onClick={handleCreateStudent}>
                <Plus className="h-4 w-4 mr-2" />
                新增学员
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学员姓名</TableHead>
                      <TableHead>联系方式</TableHead>
                      <TableHead>家长信息</TableHead>
                      <TableHead>学员类型</TableHead>
                      <TableHead>跟进状态</TableHead>
                      <TableHead>意向等级</TableHead>
                      <TableHead>来源</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: Student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{student.name}</div>
                            {student.age && (
                              <div className="text-sm text-gray-500">{student.age}岁</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {student.phone && <div>{student.phone}</div>}
                            {student.gender && (
                              <div className="text-gray-500">
                                {student.gender === 'male' ? '男' : '女'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{student.parent_name}</div>
                            <div className="text-gray-500">{student.parent_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStudentTypeBadge(student.student_type)}>
                            {student.student_type_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{student.follow_up_status_name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getIntentionBadge(student.intention_level)}>
                            {student.intention_level_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{student.source || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(student.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                                <Edit className="h-4 w-4 mr-2" />
                                编辑
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteStudent(student)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页 */}
              {students.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    共 {pagination.total} 条记录，第 {pagination.current_page} / {pagination.last_page} 页
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page <= 1}
                    >
                      上一页
                    </Button>

                    {/* 页码按钮 */}
                    {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                      const page = Math.max(1, pagination.current_page - 2) + i;
                      if (page > pagination.last_page) return null;

                      return (
                        <Button
                          key={page}
                          variant={page === pagination.current_page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page >= pagination.last_page}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 学员编辑器 */}
      <StudentEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        student={editingStudent}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={confirmDelete}
        title="删除学员"
        description={`确定要删除学员"${studentToDelete?.name}"吗？此操作不可撤销。`}
      />
    </div>
  );
};

export default Students;
