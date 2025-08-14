import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { classApi, departmentApi, courseApi, userApi, ClassModel } from '@/lib/api';

interface ClassEditorProps {
  open: boolean;
  onClose: () => void;
  classData?: ClassModel | null;
}

interface ClassFormData {
  name: string;
  campus_id: string;
  course_id: string;
  level_id: string;
  max_students: string;
  teacher_id: string;
  total_lessons: string;
  remarks: string;
}

const ClassEditor: React.FC<ClassEditorProps> = ({ open, onClose, classData }) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!classData;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormData>({
    defaultValues: {
      name: '',
      campus_id: '',
      course_id: '',
      level_id: '0',
      max_students: '20',
      teacher_id: '',
      total_lessons: '48',
      remarks: '',
    },
  });

  const selectedCourseId = watch('course_id');

  // 获取校区列表
  const { data: campusesData } = useQuery({
    queryKey: ['departments', 'campus'],
    queryFn: async () => {
      const response = await departmentApi.options({ type: 'campus' });
      return response.data;
    },
  });

  // 获取课程列表
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await courseApi.options();
      return response.data;
    },
  });

  // 获取课程级别
  const { data: levelsData } = useQuery({
    queryKey: ['course-levels', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return { data: [] };
      const response = await courseApi.getLevels(parseInt(selectedCourseId));
      return response.data;
    },
    enabled: !!selectedCourseId,
  });

  // 获取教师列表
  const { data: teachersData } = useQuery({
    queryKey: ['users', 'teachers'],
    queryFn: async () => {
      const response = await userApi.options({ role: 'teacher' });
      return response.data;
    },
  });

  // 创建/更新班级
  const mutation = useMutation({
    mutationFn: async (data: ClassFormData) => {
      const payload = {
        name: data.name,
        campus_id: parseInt(data.campus_id),
        course_id: parseInt(data.course_id),
        level_id: data.level_id && data.level_id !== '0' ? parseInt(data.level_id) : undefined,
        max_students: parseInt(data.max_students),
        teacher_id: parseInt(data.teacher_id),
        total_lessons: parseInt(data.total_lessons),
        remarks: data.remarks || undefined,
      };

      if (isEditing && classData) {
        return await classApi.update(classData.id, payload);
      } else {
        return await classApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-statistics'] });
      addToast({
        type: 'success',
        title: isEditing ? '更新成功' : '创建成功',
        description: `班级已${isEditing ? '更新' : '创建'}`,
      });
      onClose();
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: isEditing ? '更新失败' : '创建失败',
        description: error.response?.data?.message || `班级${isEditing ? '更新' : '创建'}失败`,
      });
    },
  });

  // 重置表单
  useEffect(() => {
    if (open) {
      if (classData) {
        reset({
          name: classData.name,
          campus_id: classData.campus_id.toString(),
          course_id: classData.course_id.toString(),
          level_id: classData.level_id?.toString() || '',
          max_students: classData.max_students.toString(),
          teacher_id: classData.teacher_id.toString(),
          total_lessons: classData.total_lessons.toString(),
          remarks: classData.remarks || '',
        });
      } else {
        reset({
          name: '',
          campus_id: '',
          course_id: '',
          level_id: '',
          max_students: '20',
          teacher_id: '',
          total_lessons: '48',
          remarks: '',
        });
      }
    }
  }, [open, classData, reset]);

  // 课程变化时清空级别选择
  useEffect(() => {
    if (selectedCourseId && !isEditing) {
      setValue('level_id', '');
    }
  }, [selectedCourseId, setValue, isEditing]);

  const onSubmit = (data: ClassFormData) => {
    mutation.mutate(data);
  };

  const campuses = Array.isArray(campusesData?.data) ? campusesData.data : [];
  const courses = Array.isArray(coursesData?.data) ? coursesData.data : [];
  const levels = Array.isArray(levelsData?.data) ? levelsData.data : [];
  const teachers = Array.isArray(teachersData?.data) ? teachersData.data : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '编辑班级' : '添加班级'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* 班级名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">班级名称 *</Label>
            <Input
              id="name"
              {...register('name', { required: '请输入班级名称' })}
              placeholder="请输入班级名称"
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* 所属校区 */}
          <div className="space-y-2">
            <Label htmlFor="campus_id">所属校区 *</Label>
            <Select
              value={watch('campus_id')}
              onValueChange={(value) => setValue('campus_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择校区" />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id.toString()}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.campus_id && (
              <p className="text-sm text-red-600">请选择校区</p>
            )}
          </div>

          {/* 关联课程 */}
          <div className="space-y-2">
            <Label htmlFor="course_id">关联课程 *</Label>
            <Select
              value={watch('course_id')}
              onValueChange={(value) => setValue('course_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择课程" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.course_id && (
              <p className="text-sm text-red-600">请选择课程</p>
            )}
          </div>

          {/* 课程级别 */}
          {levels.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="level_id">课程级别</Label>
              <Select
                value={watch('level_id')}
                onValueChange={(value) => setValue('level_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择级别（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">无级别</SelectItem>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 班级容量和授课课时 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_students">班级容量 *</Label>
              <Input
                id="max_students"
                type="number"
                min="1"
                max="100"
                {...register('max_students', {
                  required: '请输入班级容量',
                  min: { value: 1, message: '容量至少为1人' },
                  max: { value: 100, message: '容量不能超过100人' }
                })}
                placeholder="20"
              />
              {errors.max_students && (
                <p className="text-sm text-red-600">{errors.max_students.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_lessons">授课课时 *</Label>
              <Input
                id="total_lessons"
                type="number"
                min="0"
                {...register('total_lessons', {
                  required: '请输入授课课时',
                  min: { value: 0, message: '课时不能为负数' }
                })}
                placeholder="48"
              />
              {errors.total_lessons && (
                <p className="text-sm text-red-600">{errors.total_lessons.message}</p>
              )}
            </div>
          </div>

          {/* 班级老师 */}
          <div className="space-y-2">
            <Label htmlFor="teacher_id">班级老师 *</Label>
            <Select
              value={watch('teacher_id')}
              onValueChange={(value) => setValue('teacher_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择老师" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.teacher_id && (
              <p className="text-sm text-red-600">请选择老师</p>
            )}
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="remarks">备注</Label>
            <Textarea
              id="remarks"
              {...register('remarks')}
              placeholder="请输入备注信息（可选）"
              rows={3}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : isEditing ? '更新' : '创建'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClassEditor;
