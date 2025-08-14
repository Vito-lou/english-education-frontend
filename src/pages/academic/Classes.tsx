import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, MoreHorizontal, Edit, Trash2, GraduationCap, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { classApi, departmentApi, courseApi, ClassModel } from '@/lib/api';
import ClassEditor from '@/components/academic/ClassEditor';
import ConfirmDialog from '@/components/ui/confirm-dialog';

const Classes: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [campusId, setCampusId] = useState<string>('all');
  const [courseId, setCourseId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassModel | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [classToDelete, setClassToDelete] = useState<ClassModel | null>(null);
  const [showGraduateDialog, setShowGraduateDialog] = useState(false);
  const [classToGraduate, setClassToGraduate] = useState<ClassModel | null>(null);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取班级列表
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['classes', search, status, campusId, courseId, currentPage],
    queryFn: async () => {
      const params: any = {
        page: currentPage,
        per_page: 15,
      };

      if (search) params.search = search;
      if (status && status !== 'all') params.status = status;
      if (campusId && campusId !== 'all') params.campus_id = parseInt(campusId);
      if (courseId && courseId !== 'all') params.course_id = parseInt(courseId);

      const response = await classApi.list(params);
      return response.data;
    },
  });



  // 获取校区列表
  const { data: campusesData } = useQuery({
    queryKey: ['departments', 'campus'],
    queryFn: async () => {
      const response = await departmentApi.list({ type: 'campus' });
      return response.data;
    },
  });

  // 获取课程列表
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await courseApi.list();
      return response.data;
    },
  });

  // 删除班级
  const deleteMutation = useMutation({
    mutationFn: async (classId: number) => {
      await classApi.delete(classId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-statistics'] });
      setShowConfirmDialog(false);
      setClassToDelete(null);
      addToast({
        type: 'success',
        title: '删除成功',
        description: '班级已删除',
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

  // 结业班级
  const graduateMutation = useMutation({
    mutationFn: async (classId: number) => {
      await classApi.graduate(classId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-statistics'] });
      setShowGraduateDialog(false);
      setClassToGraduate(null);
      addToast({
        type: 'success',
        title: '结业成功',
        description: '班级已结业',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '结业失败',
        description: error.response?.data?.message || '结业失败',
      });
    },
  });

  const classes = Array.isArray(classesData?.data?.data)
    ? classesData.data.data
    : Array.isArray(classesData?.data)
      ? classesData.data
      : [];

  const pagination = classesData?.data || {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  };



  const campuses = Array.isArray(campusesData?.data) ? campusesData.data : [];
  const courses = Array.isArray(coursesData?.data) ? coursesData.data : [];

  // 处理编辑
  const handleEdit = (classItem: ClassModel) => {
    setEditingClass(classItem);
    setEditorOpen(true);
  };

  // 处理删除
  const handleDelete = (classItem: ClassModel) => {
    setClassToDelete(classItem);
    setShowConfirmDialog(true);
  };

  // 处理结业
  const handleGraduate = (classItem: ClassModel) => {
    setClassToGraduate(classItem);
    setShowGraduateDialog(true);
  };

  // 处理详情页跳转（暂时用编辑代替）
  const handleDetail = (classItem: ClassModel) => {
    // TODO: 跳转到班级详情页
    handleEdit(classItem);
  };



  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">班级管理</h1>
        <p className="text-gray-600 mt-1">管理班级信息、班级成员和教学安排</p>
      </div>



      {/* 筛选和搜索区域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索班级名称..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 状态筛选 */}
            <Select value={status} onValueChange={(value) => {
              setStatus(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="班级状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="graduated">已结业</SelectItem>
              </SelectContent>
            </Select>

            {/* 校区筛选 */}
            <Select value={campusId} onValueChange={(value) => {
              setCampusId(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="所属校区" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部校区</SelectItem>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id.toString()}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 课程筛选 */}
            <Select value={courseId} onValueChange={(value) => {
              setCourseId(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="关联课程" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部课程</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 操作区域和表格 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>班级列表</CardTitle>
            <Button onClick={() => {
              setEditingClass(null);
              setEditorOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              添加班级
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无班级</h3>
              <p className="text-gray-500 mb-4">
                还没有创建任何班级，点击上方按钮开始创建
              </p>
              <Button onClick={() => {
                setEditingClass(null);
                setEditorOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                创建第一个班级
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>班级名称</TableHead>
                    <TableHead>所属校区</TableHead>
                    <TableHead>关联课程</TableHead>
                    <TableHead>班级容量</TableHead>
                    <TableHead>授课老师</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell>
                        <button
                          onClick={() => handleDetail(classItem)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          {classItem.name}
                        </button>
                      </TableCell>
                      <TableCell>{classItem.campus.name}</TableCell>
                      <TableCell>
                        <div>
                          <div>{classItem.course.name}</div>
                          {classItem.level && (
                            <div className="text-sm text-gray-500">{classItem.level.name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={classItem.current_student_count >= classItem.max_students ? 'text-red-600' : 'text-gray-900'}>
                          {classItem.capacity_info}
                        </span>
                      </TableCell>
                      <TableCell>{classItem.teacher.name}</TableCell>
                      <TableCell>
                        <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'}>
                          {classItem.status_name}
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
                            <DropdownMenuItem onClick={() => handleDetail(classItem)}>
                              <Users className="mr-2 h-4 w-4" />
                              学员管理
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDetail(classItem)}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              点名
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(classItem)}>
                              <Edit className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            {classItem.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleGraduate(classItem)}>
                                <GraduationCap className="mr-2 h-4 w-4" />
                                结业
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDelete(classItem)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-gray-500">
                    共 {pagination.total} 条记录，第 {pagination.current_page} / {pagination.last_page} 页
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                      disabled={currentPage >= pagination.last_page}
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

      {/* 班级编辑器 */}
      <ClassEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingClass(null);
        }}
        classData={editingClass}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={() => classToDelete && deleteMutation.mutate(classToDelete.id)}
        title="删除班级"
        description={`确定要删除班级"${classToDelete?.name}"吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />

      {/* 结业确认对话框 */}
      <ConfirmDialog
        open={showGraduateDialog}
        onOpenChange={setShowGraduateDialog}
        onConfirm={() => classToGraduate && graduateMutation.mutate(classToGraduate.id)}
        title="结业班级"
        description={`确定要将班级"${classToGraduate?.name}"设为结业状态吗？结业后班级状态将变为已结业，所有学员也将自动结业。`}
        confirmText="确认结业"
        cancelText="取消"
      />
    </div>
  );
};

export default Classes;
