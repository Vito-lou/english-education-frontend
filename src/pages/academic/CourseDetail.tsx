import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { ArrowLeft, Plus, Edit, Trash2, BookOpen, GraduationCap, FileText } from 'lucide-react';
import LevelEditor from '@/components/academic/LevelEditor';
import CourseContentManager from '@/components/academic/CourseContentManager';

interface Course {
  id: number;
  subject_id: number;
  name: string;
  code: string;
  description: string;
  has_levels: boolean;
  sort_order: number;
  status: string;
  subject?: {
    id: number;
    name: string;
  };
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
  units?: CourseUnit[];
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
  lessons?: Lesson[];
}

interface Lesson {
  id: number;
  unit_id: number;
  name: string;
  content: string;
  duration: number;
  sort_order: number;
  status: string;
}

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast() as any;
  const queryClient = useQueryClient();

  // 级别编辑器状态
  const [levelEditorOpen, setLevelEditorOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<CourseLevel | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [levelToDelete, setLevelToDelete] = useState<CourseLevel | null>(null);



  // 获取课程详情
  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await api.get(`/admin/courses/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const course = courseData?.data;

  // 保存级别（新建或更新）
  const saveLevelMutation = useMutation({
    mutationFn: async (levelData: Partial<CourseLevel>) => {
      if (editingLevel) {
        const response = await api.put(`/admin/course-levels/${editingLevel.id}`, levelData);
        return response.data;
      } else {
        const response = await api.post('/admin/course-levels', levelData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      setLevelEditorOpen(false);
      setEditingLevel(null);
      toast({
        title: editingLevel ? '更新成功' : '创建成功',
        description: editingLevel ? '级别已更新' : '级别已创建',
      });
    },
    onError: (error: any) => {
      toast({
        title: editingLevel ? '更新失败' : '创建失败',
        description: error.response?.data?.message || '操作失败',
        variant: 'destructive',
      });
    },
  });

  // 删除级别
  const deleteLevelMutation = useMutation({
    mutationFn: async (levelId: number) => {
      await api.delete(`/admin/course-levels/${levelId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      setShowConfirmDialog(false);
      setLevelToDelete(null);
      toast({
        title: '删除成功',
        description: '级别已删除',
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

  const handleBack = () => {
    navigate('/academic/courses');
  };

  const handleCreateLevel = () => {
    setEditingLevel(null);
    setLevelEditorOpen(true);
  };

  const handleEditLevel = (level: CourseLevel) => {
    setEditingLevel(level);
    setLevelEditorOpen(true);
  };

  const handleDeleteLevel = (level: CourseLevel) => {
    setLevelToDelete(level);
    setShowConfirmDialog(true);
  };

  const handleCloseLevelEditor = () => {
    setLevelEditorOpen(false);
    setEditingLevel(null);
  };

  const handleSaveLevel = (levelData: Partial<CourseLevel>) => {
    saveLevelMutation.mutate(levelData);
  };

  const confirmDeleteLevel = () => {
    if (levelToDelete) {
      deleteLevelMutation.mutate(levelToDelete.id);
    }
  };



  if (isLoading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  if (!course) {
    return <div className="text-center text-gray-500">课程不存在</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              <p className="text-gray-600">{course.subject?.name} · {course.code}</p>
            </div>
          </div>
        </div>
        <Badge variant={course.status === 'active' ? 'default' : 'secondary'}>
          {course.status === 'active' ? '启用' : '禁用'}
        </Badge>
      </div>

      {/* 课程基本信息 */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">课程信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">课程代码：</span>
                <span>{course.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">所属科目：</span>
                <span>{course.subject?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">是否有级别：</span>
                <span>{course.has_levels ? '是' : '否'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">统计信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">级别数量：</span>
                <span>{course.levels?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">单元数量：</span>
                <span>{course.units?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">课时数量：</span>
                <span>
                  {course.units?.reduce((total: number, unit: any) => total + (unit.lessons?.length || 0), 0) || 0}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">课程描述</h3>
            <p className="text-sm text-gray-600">
              {course.description || '暂无描述'}
            </p>
          </div>
        </div>
      </Card>

      {/* 课程内容管理 */}
      <Card className="p-6">
        <Tabs defaultValue="levels" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="levels" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              级别管理
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              课程内容
            </TabsTrigger>
          </TabsList>

          <TabsContent value="levels" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">课程级别</h3>
                {course.has_levels && (
                  <Button onClick={handleCreateLevel} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    新增级别
                  </Button>
                )}
              </div>

              {course.has_levels ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {course.levels?.map((level: any) => (
                    <Card key={level.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{level.name}</h4>
                          <p className="text-sm text-gray-500">{level.code}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleEditLevel(level)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteLevel(level)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{level.description}</p>
                      <div className="text-xs text-gray-500">
                        {level.units?.length || 0} 个单元
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>该课程未启用级别体系</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <CourseContentManager
              courseId={parseInt(id!)}
              levels={course?.levels || []}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* 级别编辑器 */}
      <LevelEditor
        open={levelEditorOpen}
        onClose={handleCloseLevelEditor}
        onSave={handleSaveLevel}
        level={editingLevel}
        courseId={parseInt(id!)}
        loading={saveLevelMutation.isPending}
      />

      {/* 删除级别确认对话框 */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={confirmDeleteLevel}
        title="删除级别"
        description={`确定要删除级别"${levelToDelete?.name}"吗？此操作不可撤销。`}
      />
    </div>
  );
};

export default CourseDetail;
