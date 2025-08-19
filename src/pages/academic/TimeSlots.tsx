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
  DialogTrigger,
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

export default function TimeSlots() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState<TimeSlotForm>({
    name: '',
    start_time: '',
    end_time: '',
    is_active: true,
    sort_order: 0,
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
        description: '网络错误，请稍后重试',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  // 打开新增对话框
  const handleAdd = () => {
    setEditingTimeSlot(null);
    setFormData({
      name: '',
      start_time: '',
      end_time: '',
      is_active: true,
      sort_order: timeSlots.length + 1,
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (timeSlot: TimeSlot) => {
    setEditingTimeSlot(timeSlot);
    setFormData({
      name: timeSlot.name,
      start_time: timeSlot.start_time,
      end_time: timeSlot.end_time,
      is_active: timeSlot.is_active,
      sort_order: timeSlot.sort_order,
    });
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTimeSlot) {
        await api.put(`/admin/time-slots/${editingTimeSlot.id}`, formData);
      } else {
        await api.post('/admin/time-slots', formData);
      }

      addToast({
        type: 'success',
        title: '操作成功',
        description: editingTimeSlot ? '时间段更新成功' : '时间段创建成功',
      });
      setDialogOpen(false);
      fetchTimeSlots();
    } catch (error: any) {
      console.error('提交失败:', error);
      addToast({
        type: 'error',
        title: '操作失败',
        description: error.response?.data?.message || '操作失败，请稍后重试',
      });
    }
  };

  // 删除时间段
  const handleDelete = async (timeSlot: TimeSlot) => {
    if (!confirm(`确定要删除时间段"${timeSlot.name}"吗？`)) {
      return;
    }

    try {
      await api.delete(`/admin/time-slots/${timeSlot.id}`);

      addToast({
        type: 'success',
        title: '删除成功',
        description: '时间段已删除',
      });
      fetchTimeSlots();
    } catch (error: any) {
      console.error('删除失败:', error);
      addToast({
        type: 'error',
        title: '删除失败',
        description: error.response?.data?.message || '删除失败，请稍后重试',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">时间段管理</h1>
          <p className="text-muted-foreground">管理上课时间段配置</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          新增时间段
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>时间段名称</TableHead>
              <TableHead>时间范围</TableHead>
              <TableHead>时长</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : timeSlots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  暂无时间段数据
                </TableCell>
              </TableRow>
            ) : (
              timeSlots.map((timeSlot) => (
                <TableRow key={timeSlot.id}>
                  <TableCell className="font-medium">{timeSlot.name}</TableCell>
                  <TableCell>{timeSlot.time_range}</TableCell>
                  <TableCell>{timeSlot.duration_minutes}分钟</TableCell>
                  <TableCell>
                    <Badge variant={timeSlot.is_active ? 'default' : 'secondary'}>
                      {timeSlot.is_active ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell>{timeSlot.sort_order}</TableCell>
                  <TableCell>{timeSlot.created_at}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(timeSlot)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(timeSlot)}
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

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTimeSlot ? '编辑时间段' : '新增时间段'}
            </DialogTitle>
            <DialogDescription>
              配置上课时间段信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  时间段名称
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="如：上午第一节"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_time" className="text-right">
                  开始时间
                </Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_time" className="text-right">
                  结束时间
                </Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sort_order" className="text-right">
                  排序
                </Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is_active" className="text-right">
                  启用状态
                </Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">
                {editingTimeSlot ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
