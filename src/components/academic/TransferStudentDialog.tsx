import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { api, classApi } from '@/lib/api';

interface TransferStudentDialogProps {
  open: boolean;
  onClose: () => void;
  studentClass: any;
  currentClassInfo: any;
}

const TransferStudentDialog: React.FC<TransferStudentDialogProps> = ({
  open,
  onClose,
  studentClass,
  currentClassInfo,
}) => {
  const [targetClassId, setTargetClassId] = useState<string>('');

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取可转入的班级列表（排除当前班级）
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['available-classes', currentClassInfo?.id],
    queryFn: async () => {
      const response = await classApi.list({
        status: 'active', // 只显示进行中的班级
      });
      return response.data;
    },
    enabled: open,
  });

  // 转班操作
  const transferMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/admin/student-classes/${studentClass.id}/transfer`, {
        to_class_id: parseInt(targetClassId),
        transfer_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students'] });
      queryClient.invalidateQueries({ queryKey: ['class-detail'] });
      onClose();
      addToast({
        type: 'success',
        title: '转班成功',
        description: `学员"${studentClass.student.name}"已成功转班`,
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '转班失败',
        description: error.response?.data?.message || '转班操作失败',
      });
    },
  });

  const classes = Array.isArray(classesData?.data?.data) 
    ? classesData.data.data 
    : Array.isArray(classesData?.data) 
      ? classesData.data 
      : [];

  // 过滤掉当前班级
  const availableClasses = classes.filter((cls: any) => cls.id !== currentClassInfo?.id);

  const handleSubmit = () => {
    if (!targetClassId) {
      addToast({
        type: 'warning',
        title: '请选择目标班级',
        description: '请选择要转入的班级',
      });
      return;
    }

    transferMutation.mutate();
  };

  const handleClose = () => {
    setTargetClassId('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ArrowRightLeft className="h-5 w-5" />
            <span>学员转班</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 学员信息 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">转班学员</div>
            <div className="font-medium">{studentClass?.student?.name}</div>
            <div className="text-sm text-gray-500">
              当前班级：{currentClassInfo?.name}
            </div>
          </div>

          {/* 目标班级选择 */}
          <div className="space-y-2">
            <Label htmlFor="target-class">选择目标班级</Label>
            {isLoading ? (
              <div className="text-sm text-gray-500">加载班级列表中...</div>
            ) : (
              <Select value={targetClassId} onValueChange={setTargetClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择要转入的班级" />
                </SelectTrigger>
                <SelectContent>
                  {availableClasses.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">暂无可转入的班级</div>
                  ) : (
                    availableClasses.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        <div>
                          <div className="font-medium">{cls.name}</div>
                          <div className="text-xs text-gray-500">
                            {cls.course?.name} - {cls.campus?.name} - {cls.capacity_info}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!targetClassId || transferMutation.isPending || availableClasses.length === 0}
              className="flex items-center space-x-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>确认转班</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferStudentDialog;
