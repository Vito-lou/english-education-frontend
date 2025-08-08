import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Eye, BookOpen, GraduationCap } from 'lucide-react';
import CourseEditor from '@/components/academic/CourseEditor';

interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  courses: Course[];
}

interface Course {
  id: number;
  subject_id: number;
  name: string;
  code: string;
  description: string;
  teaching_method: string;
  has_levels: boolean;
  sort_order: number;
  status: string;
  subject?: Subject;
  levels?: CourseLevel[];
  units?: CourseUnit[];
}

interface CourseLevel {
  id: number;
  course_id: number;
  name: string;
  code: string;
  description: string;
  sort_order: number;
  status: string;
}

interface CourseUnit {
  id: number;
  course_id: number;
  level_id: number | null;
  name: string;
  description: string;
  learning_objectives: string;
  sort_order: number;
  status: string;
}

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取科目列表
  const { data: subjectsData, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await api.get('/admin/subjects');
      return response.data;
    },
  });

  // 获取课程列表
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses', selectedSubject],
    queryFn: async () => {
      const params = selectedSubject ? { subject_id: selectedSubject } : {};
      const response = await api.get('/admin/courses', { params });
      return response.data;
    },
  });

  // 保存课程（新建或更新）
  const saveMutation = useMutation({
    mutationFn: async (courseData: Partial<Course>) => {
      if (editingCourse) {
        const response = await api.put(`/admin/courses/${editingCourse.id}`, courseData);
        return response.data;
      } else {
        const response = await api.post('/admin/courses', courseData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setEditorOpen(false);
      setEditingCourse(null);
      toast({
        title: editingCourse ? '更新成功' : '创建成功',
        description: editingCourse ? '课程已更新' : '课程已创建',
      });
    },
    onError: (error: any) => {
      toast({
        title: editingCourse ? '更新失败' : '创建失败',
        description: error.response?.data?.message || '操作失败',
        variant: 'destructive',
      });
    },
  });

  // 删除课程
  const deleteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      await api.delete(`/admin/courses/${courseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setShowConfirmDialog(false);
      setCourseToDelete(null);
      toast({
        title: '删除成功',
        description: '课程已删除',
      });
    },
    onError: (error: any) => {
      toast({
        title: '删除失败',
        description: error.response?.data?.message || '删除失败',
        variant: 'destructive',
      });
    },
  });

  const handleCreate = () => {
    setEditingCourse(null);
    setEditorOpen(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setEditorOpen(true);
  };

  const handleDelete = (course: Course) => {
    setCourseToDelete(course);
    setShowConfirmDialog(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingCourse(null);
  };

  const handleSave = (courseData: Partial<Course>) => {
    saveMutation.mutate(courseData);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete.id);
    }
  };



  const subjects = subjectsData?.data || [];
  const courses = coursesData?.data || [];

  if (subjectsLoading || coursesLoading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
          <p className="text-gray-600 mt-1">管理课程大纲、级别和教学内容</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新建课程
        </Button>
      </div>

      {/* 科目筛选 */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">科目筛选：</span>
          <div className="flex gap-2">
            <Button
              variant={selectedSubject === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubject(null)}
            >
              全部
            </Button>
            {subjects.map((subject: Subject) => (
              <Button
                key={subject.id}
                variant={selectedSubject === subject.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubject(subject.id)}
              >
                {subject.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* 课程列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course: Course) => (
          <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              {/* 课程头部 */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{course.name}</h3>
                    <p className="text-sm text-gray-500">{course.subject?.name}</p>
                  </div>
                </div>
                <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
                  {course.status === 'active' ? '启用' : '禁用'}
                </Badge>
              </div>

              {/* 课程信息 */}
              <div className="space-y-2">
                {course.has_levels && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4" />
                    <span>{course.levels?.length || 0} 个级别</span>
                  </div>
                )}

                {course.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(course)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/academic/courses/${course.id}`)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  详情
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(course)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {courses.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无课程</h3>
          <p className="text-gray-500 mb-4">开始创建您的第一个课程</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新建课程
          </Button>
        </Card>
      )}

      {/* 课程编辑弹窗 */}
      <CourseEditor
        open={editorOpen}
        onClose={handleCloseEditor}
        onSave={handleSave}
        course={editingCourse}
        subjects={subjects}
        loading={saveMutation.isPending}
      />

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={confirmDelete}
        title="删除课程"
        description={`确定要删除课程"${courseToDelete?.name}"吗？此操作不可撤销。`}
      />
    </div>
  );
};

export default Courses;
