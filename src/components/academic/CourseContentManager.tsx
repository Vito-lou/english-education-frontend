import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Clock, BookOpen, GraduationCap } from 'lucide-react';
import UnitEditor from './UnitEditor';
import LessonEditor from './LessonEditor';

interface CourseLevel {
  id: number;
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

interface CourseContentManagerProps {
  courseId: number;
  levels: CourseLevel[];
}

const CourseContentManager: React.FC<CourseContentManagerProps> = ({
  courseId,
  levels,
}) => {
  const { toast } = useToast() as any;
  const queryClient = useQueryClient();

  // 当前选中的级别
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(
    levels.length > 0 ? levels[0].id : null
  );

  // 展开的单元
  const [expandedUnits, setExpandedUnits] = useState<Set<number>>(new Set());

  // 编辑器状态
  const [unitEditorOpen, setUnitEditorOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<CourseUnit | null>(null);
  const [lessonEditorOpen, setLessonEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedUnitForLesson, setSelectedUnitForLesson] = useState<number | null>(null);

  // 确认对话框状态
  const [showUnitConfirmDialog, setShowUnitConfirmDialog] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<CourseUnit | null>(null);
  const [showLessonConfirmDialog, setShowLessonConfirmDialog] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

  // 获取当前级别的单元
  const { data: unitsData, isLoading } = useQuery({
    queryKey: ['course-units', courseId, selectedLevelId],
    queryFn: async () => {
      const params = new URLSearchParams({
        course_id: courseId.toString(),
      });
      if (selectedLevelId) {
        params.append('level_id', selectedLevelId.toString());
      }
      const response = await api.get(`/admin/course-units?${params}`);
      return response.data;
    },
    enabled: !!courseId,
  });

  const units = unitsData?.data || [];

  // 保存单元
  const saveUnitMutation = useMutation({
    mutationFn: async (unitData: Partial<CourseUnit>) => {
      if (editingUnit) {
        const response = await api.put(`/admin/course-units/${editingUnit.id}`, unitData);
        return response.data;
      } else {
        const response = await api.post('/admin/course-units', {
          ...unitData,
          level_id: selectedLevelId,
        });
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-units', courseId, selectedLevelId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setUnitEditorOpen(false);
      setEditingUnit(null);
      toast({
        title: editingUnit ? '更新成功' : '创建成功',
        description: editingUnit ? '单元已更新' : '单元已创建',
      });
    },
    onError: (error: any) => {
      toast({
        title: editingUnit ? '更新失败' : '创建失败',
        description: error.response?.data?.message || '操作失败',
        variant: 'destructive',
      });
    },
  });

  // 删除单元
  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: number) => {
      await api.delete(`/admin/course-units/${unitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-units', courseId, selectedLevelId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setShowUnitConfirmDialog(false);
      setUnitToDelete(null);
      toast({
        title: '删除成功',
        description: '单元已删除',
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

  // 切换单元展开状态
  const toggleUnitExpanded = (unitId: number) => {
    setExpandedUnits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(unitId)) {
        newSet.delete(unitId);
      } else {
        newSet.add(unitId);
      }
      return newSet;
    });
  };

  // 处理级别切换
  const handleLevelChange = (levelId: number) => {
    setSelectedLevelId(levelId);
    setExpandedUnits(new Set()); // 清空展开状态
  };

  // 单元操作
  const handleCreateUnit = () => {
    setEditingUnit(null);
    setUnitEditorOpen(true);
  };

  const handleEditUnit = (unit: CourseUnit) => {
    setEditingUnit(unit);
    setUnitEditorOpen(true);
  };

  const handleDeleteUnit = (unit: CourseUnit) => {
    setUnitToDelete(unit);
    setShowUnitConfirmDialog(true);
  };

  const handleSaveUnit = (unitData: Partial<CourseUnit>) => {
    saveUnitMutation.mutate(unitData);
  };

  // 保存课时（新建或更新）
  const saveLessonMutation = useMutation({
    mutationFn: async (lessonData: Partial<Lesson>) => {
      if (editingLesson) {
        const response = await api.put(`/admin/lessons/${editingLesson.id}`, lessonData);
        return response.data;
      } else {
        const response = await api.post('/admin/lessons', lessonData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-units', courseId, selectedLevelId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setLessonEditorOpen(false);
      setEditingLesson(null);
      setSelectedUnitForLesson(null);
      toast({
        title: editingLesson ? '更新成功' : '创建成功',
        description: editingLesson ? '课时已更新' : '课时已创建',
      });
    },
    onError: (error: any) => {
      toast({
        title: editingLesson ? '更新失败' : '创建失败',
        description: error.response?.data?.message || '操作失败',
        variant: 'destructive',
      });
    },
  });

  // 删除课时
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      await api.delete(`/admin/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-units', courseId, selectedLevelId] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setShowLessonConfirmDialog(false);
      setLessonToDelete(null);
      toast({
        title: '删除成功',
        description: '课时已删除',
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

  // 课时操作
  const handleCreateLesson = (unitId: number) => {
    setSelectedUnitForLesson(unitId);
    setEditingLesson(null);
    setLessonEditorOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedUnitForLesson(lesson.unit_id);
    setLessonEditorOpen(true);
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    setLessonToDelete(lesson);
    setShowLessonConfirmDialog(true);
  };

  const handleSaveLesson = (lessonData: Partial<Lesson>) => {
    saveLessonMutation.mutate(lessonData);
  };

  const confirmDeleteLesson = () => {
    if (lessonToDelete) {
      deleteLessonMutation.mutate(lessonToDelete.id);
    }
  };

  // 获取当前级别信息
  const currentLevel = selectedLevelId
    ? levels.find(l => l.id === selectedLevelId)
    : null;

  const currentLevelName = currentLevel ? currentLevel.name : '请选择级别';

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 级别选择器 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-700">级别:</span>
        {levels.map((level) => (
          <Button
            key={level.id}
            variant={selectedLevelId === level.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleLevelChange(level.id)}
          >
            {level.name}
          </Button>
        ))}
      </div>

      {/* 当前级别信息 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            {currentLevelName}
            <span className="text-sm text-gray-500 ml-2">
              ({units.length} 个单元, {units.reduce((total: number, unit: any) => total + (unit.lessons?.length || 0), 0)} 个课时)
            </span>
          </h3>
          {currentLevel?.description && (
            <p className="text-sm text-gray-600 mt-1">{currentLevel.description}</p>
          )}
        </div>
        <Button
          onClick={handleCreateUnit}
          disabled={!selectedLevelId}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          新增单元
        </Button>
      </div>

      {/* 单元列表 */}
      <div className="space-y-4">
        {units.map((unit: any) => {
          const isExpanded = expandedUnits.has(unit.id);
          const lessonCount = unit.lessons?.length || 0;
          const totalDuration = unit.lessons?.reduce((total: number, lesson: any) => total + (lesson.duration || 0), 0) || 0;

          return (
            <Card key={unit.id} className="overflow-hidden">
              {/* 单元头部 */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleUnitExpanded(unit.id)}
                      className="p-1 h-6 w-6"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-medium">{unit.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span>{lessonCount} 个课时</span>
                        {totalDuration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {totalDuration} 分钟
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateLesson(unit.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      课时
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUnit(unit)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUnit(unit)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {unit.description && (
                  <p className="text-sm text-gray-600 mt-2 ml-9">{unit.description}</p>
                )}
              </div>

              {/* 课时列表 */}
              {isExpanded && (
                <div className="p-4">
                  {unit.lessons && unit.lessons.length > 0 ? (
                    <div className="space-y-2">
                      {unit.lessons.map((lesson: any) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <div>
                              <h5 className="font-medium text-sm">{lesson.name}</h5>
                              {lesson.duration && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lesson.duration} 分钟
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLesson(lesson)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLesson(lesson)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>该单元暂无课时</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateLesson(unit.id)}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        添加第一个课时
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        {units.length === 0 && selectedLevelId && (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">暂无单元</h3>
            <p className="text-sm mb-4">开始为 {currentLevelName} 创建第一个单元吧</p>
            <Button onClick={handleCreateUnit}>
              <Plus className="h-4 w-4 mr-2" />
              创建第一个单元
            </Button>
          </div>
        )}

        {!selectedLevelId && (
          <div className="text-center py-12 text-gray-500">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">请选择级别</h3>
            <p className="text-sm">请先选择一个级别来查看和管理课程内容</p>
          </div>
        )}
      </div>

      {/* 单元编辑器 */}
      <UnitEditor
        open={unitEditorOpen}
        onClose={() => setUnitEditorOpen(false)}
        onSave={handleSaveUnit}
        unit={editingUnit}
        courseId={courseId}
        levels={levels}
        defaultLevelId={selectedLevelId}
        loading={saveUnitMutation.isPending}
      />

      {/* 课时编辑器 */}
      <LessonEditor
        open={lessonEditorOpen}
        onClose={() => setLessonEditorOpen(false)}
        onSave={handleSaveLesson}
        lesson={editingLesson}
        unitId={selectedUnitForLesson || 0}
        loading={saveLessonMutation.isPending}
      />

      {/* 删除单元确认对话框 */}
      <ConfirmDialog
        open={showUnitConfirmDialog}
        onOpenChange={setShowUnitConfirmDialog}
        onConfirm={() => unitToDelete && deleteUnitMutation.mutate(unitToDelete.id)}
        title="删除单元"
        description={`确定要删除单元"${unitToDelete?.name}"吗？此操作不可撤销。`}
      />

      {/* 删除课时确认对话框 */}
      <ConfirmDialog
        open={showLessonConfirmDialog}
        onOpenChange={setShowLessonConfirmDialog}
        onConfirm={confirmDeleteLesson}
        title="删除课时"
        description={`确定要删除课时"${lessonToDelete?.name}"吗？此操作不可撤销。`}
      />
    </div>
  );
};

export default CourseContentManager;
