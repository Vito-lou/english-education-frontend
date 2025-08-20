import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface TimeSlot {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  time_range: string;
  display_name: string;
  duration_minutes: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface TimeSlotForm {
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  sort_order: number;
}

interface TimeSlotSettingsProps {
  open: boolean;
  onClose: () => void;
  onTimeSlotUpdated?: () => void;
}

const TimeSlotSettings: React.FC<TimeSlotSettingsProps> = ({
  open,
  onClose,
  onTimeSlotUpdated,
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState<TimeSlotForm>({
    name: '',
    start_time: '',
    end_time: '',
    is_active: true,
    sort_order: 1,
  });

  const { addToast } = useToast();

  // 获取时间段列表
  const fetchTimeSlots = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/time-slots');
      setTimeSlots(response.data.data || []);
    } catch (error) {
      console.error('获取时间段失败:', error);
      addToast({
        type: 'error',
        title: '获取失败',
        description: '获取时间段列表失败',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchTimeSlots();
    }
  }, [open]);

  // 创建或更新时间段
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTimeSlot) {
        await api.put(`/admin/time-slots/${editingTimeSlot.id}`, formData);
        addToast({
          type: 'success',
          title: '更新成功',
          description: '时间段已更新',
        });
      } else {
        await api.post('/admin/time-slots', formData);
        addToast({
          type: 'success',
          title: '创建成功',
          description: '时间段已创建',
        });
      }
      
      setEditDialogOpen(false);
      setEditingTimeSlot(null);
      setFormData({
        name: '',
        start_time: '',
        end_time: '',
        is_active: true,
        sort_order: 1,
      });
      fetchTimeSlots();
      onTimeSlotUpdated?.();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: '操作失败',
        description: error.response?.data?.message || '操作失败',
      });
    }
  };

  // 删除时间段
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个时间段吗？')) return;
    
    try {
      await api.delete(`/admin/time-slots/${id}`);
      addToast({
        type: 'success',
        title: '删除成功',
        description: '时间段已删除',
      });
      fetchTimeSlots();
      onTimeSlotUpdated?.();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: '删除失败',
        description: error.response?.data?.message || '删除失败',
      });
    }
  };

  // 编辑时间段
  const handleEdit = (timeSlot: TimeSlot) => {
    setEditingTimeSlot(timeSlot);
    setFormData({
      name: timeSlot.name,
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time,
      is_active: timeSlot.is_active,
      sort_order: timeSlot.sort_order,
    });
    setEditDialogOpen(true);
  };

  // 新建时间段
  const handleCreate = () => {
    setEditingTimeSlot(null);
    setFormData({
      name: '',
      start_time: '',
      end_time: '',
      is_active: true,
      sort_order: timeSlots.length + 1,
    });
    setEditDialogOpen(true);
  };

  return (
    <>
      {/* 时间段设置主对话框 */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>时间段设置</span>
            </DialogTitle>
            <DialogDescription>
              管理上课时间段，用于排课时选择具体的上课时间
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 操作按钮 */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                共 {timeSlots.length} 个时间段
              </div>
              <Button onClick={handleCreate} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                新建时间段
              </Button>
            </div>

            {/* 时间段列表 */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间段名称</TableHead>
                    <TableHead>时间范围</TableHead>
                    <TableHead>时长</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : timeSlots.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-gray-500">
                          <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>暂无时间段</p>
                          <p className="text-sm">点击上方按钮创建第一个时间段</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    timeSlots.map((slot) => (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium">{slot.name}</TableCell>
                        <TableCell>{slot.time_range}</TableCell>
                        <TableCell>{slot.duration_minutes} 分钟</TableCell>
                        <TableCell>
                          <Badge variant={slot.is_active ? 'default' : 'secondary'}>
                            {slot.is_active ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell>{slot.sort_order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(slot)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(slot.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑/新建时间段对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTimeSlot ? '编辑时间段' : '新建时间段'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">时间段名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：上午第一节"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">开始时间</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">结束时间</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">排序</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="1"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">启用状态</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                {editingTimeSlot ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TimeSlotSettings;
