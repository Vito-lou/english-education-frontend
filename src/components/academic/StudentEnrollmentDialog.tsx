import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { api, departmentApi, courseApi } from '@/lib/api';

interface Student {
  id: number;
  name: string;
}

interface Campus {
  id: number;
  name: string;
}

interface Course {
  id: number;
  name: string;
}

interface EnrollmentFormData {
  campus_id: string;
  course_id: string;
  price_per_lesson: number;
  lesson_count: number;
  discount_type: 'percentage' | 'amount' | 'none';
  discount_value: number;
  total_amount: number;
}

interface StudentEnrollmentDialogProps {
  open: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess?: () => void;
}

const StudentEnrollmentDialog: React.FC<StudentEnrollmentDialogProps> = ({
  open,
  onClose,
  student,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<EnrollmentFormData>({
    campus_id: '',
    course_id: '',
    price_per_lesson: 100,
    lesson_count: 10,
    discount_type: 'none',
    discount_value: 0,
    total_amount: 1000,
  });

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取校区列表
  const { data: campusData } = useQuery({
    queryKey: ['departments', 'campus'],
    queryFn: async () => {
      const response = await departmentApi.options({ type: 'campus' });
      return response.data;
    },
  });

  // 获取课程列表
  const { data: courseData } = useQuery({
    queryKey: ['courses-options'],
    queryFn: async () => {
      const response = await courseApi.options();
      return response.data;
    },
  });

  const campuses: Campus[] = campusData?.data || [];
  const courses: Course[] = courseData?.data || [];

  // 计算实际收费金额
  const calculateTotalAmount = () => {
    const baseAmount = formData.price_per_lesson * formData.lesson_count;
    let finalAmount = baseAmount;

    if (formData.discount_type === 'percentage') {
      // 百分比折扣
      finalAmount = baseAmount * (1 - formData.discount_value / 100);
    } else if (formData.discount_type === 'amount') {
      // 金额优惠
      finalAmount = baseAmount - formData.discount_value;
    }

    return Math.max(0, finalAmount); // 确保金额不为负数
  };

  // 当价格、数量或折扣变化时重新计算总金额
  useEffect(() => {
    const totalAmount = calculateTotalAmount();
    setFormData(prev => ({ ...prev, total_amount: totalAmount }));
  }, [formData.price_per_lesson, formData.lesson_count, formData.discount_type, formData.discount_value]);

  // 报名提交
  const enrollmentMutation = useMutation({
    mutationFn: async (data: EnrollmentFormData) => {
      if (!student) throw new Error('学员信息不存在');

      const enrollmentData = {
        student_id: student.id,
        campus_id: parseInt(data.campus_id),
        course_id: parseInt(data.course_id),
        price_per_lesson: data.price_per_lesson,
        lesson_count: data.lesson_count,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        total_amount: data.total_amount,
        remaining_lessons: data.lesson_count, // 初始剩余课时等于购买课时
      };

      const response = await api.post('/admin/enrollments', enrollmentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-detail', student?.id] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      onClose();
      addToast({
        type: 'success',
        title: '报名成功',
        description: `${student?.name} 已成功报名`,
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '报名失败',
        description: error.response?.data?.message || '报名失败，请稍后重试',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 前端验证
    if (!formData.campus_id) {
      addToast({
        type: 'error',
        title: '请选择校区',
        description: '校区为必选项',
      });
      return;
    }

    if (!formData.course_id) {
      addToast({
        type: 'error',
        title: '请选择课程',
        description: '课程为必选项',
      });
      return;
    }

    if (formData.price_per_lesson <= 0) {
      addToast({
        type: 'error',
        title: '课时单价无效',
        description: '课时单价必须大于0',
      });
      return;
    }

    if (formData.lesson_count <= 0) {
      addToast({
        type: 'error',
        title: '课时数量无效',
        description: '课时数量必须大于0',
      });
      return;
    }

    enrollmentMutation.mutate(formData);
  };

  const handleClose = () => {
    // 重置表单
    setFormData({
      campus_id: '',
      course_id: '',
      price_per_lesson: 100,
      lesson_count: 10,
      discount_type: 'none',
      discount_value: 0,
      total_amount: 1000,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            学员报名 - {student?.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* 选择校区 */}
            <div className="space-y-2">
              <Label>
                选择校区
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.campus_id}
                onValueChange={(value) => setFormData({ ...formData, campus_id: value })}
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
            </div>

            {/* 选择课程 */}
            <div className="space-y-2">
              <Label>
                选择课程
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={formData.course_id}
                onValueChange={(value) => setFormData({ ...formData, course_id: value })}
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
            </div>

            {/* 课时单价和数量 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  课时单价（元）
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.price_per_lesson}
                  onChange={(e) => setFormData({ ...formData, price_per_lesson: parseFloat(e.target.value) || 0 })}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  课时数量
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.lesson_count}
                  onChange={(e) => setFormData({ ...formData, lesson_count: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                />
              </div>
            </div>

            {/* 折扣设置 */}
            <div className="space-y-2">
              <Label>折扣类型</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value: 'percentage' | 'amount' | 'none') => {
                  setFormData({ ...formData, discount_type: value, discount_value: 0 });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无折扣</SelectItem>
                  <SelectItem value="percentage">百分比折扣</SelectItem>
                  <SelectItem value="amount">金额优惠</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 折扣值 */}
            {formData.discount_type !== 'none' && (
              <div className="space-y-2">
                <Label>
                  {formData.discount_type === 'percentage' ? '折扣百分比（%）' : '优惠金额（元）'}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={formData.discount_type === 'percentage' ? "100" : undefined}
                  step={formData.discount_type === 'percentage' ? "1" : "0.01"}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                />
              </div>
            )}

            {/* 费用汇总 */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>课时单价：</span>
                <span>¥{formData.price_per_lesson}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>课时数量：</span>
                <span>{formData.lesson_count} 节</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>小计：</span>
                <span>¥{(formData.price_per_lesson * formData.lesson_count).toFixed(2)}</span>
              </div>
              {formData.discount_type !== 'none' && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>优惠：</span>
                  <span>
                    {formData.discount_type === 'percentage'
                      ? `-${formData.discount_value}%`
                      : `-¥${formData.discount_value}`
                    }
                  </span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg border-t pt-2">
                <span>实收金额：</span>
                <span className="text-blue-600">¥{formData.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" disabled={enrollmentMutation.isPending}>
              {enrollmentMutation.isPending ? '报名中...' : '确认报名'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentEnrollmentDialog;
