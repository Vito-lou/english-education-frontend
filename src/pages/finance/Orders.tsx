import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, MoreHorizontal, Eye, RefreshCw, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';

interface Enrollment {
  id: number;
  student: {
    id: number;
    name: string;
  };
  campus: {
    id: number;
    name: string;
  };
  course: {
    id: number;
    name: string;
  };
  enrollment_date: string;
  total_lessons: number;
  used_lessons: number;
  remaining_lessons: number;
  price_per_lesson: number;
  discount_type: 'none' | 'percentage' | 'amount';
  discount_value: number;
  actual_amount: number;
  paid_amount: number;
  status: 'pending' | 'active' | 'suspended' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded';
  status_name: string;
  payment_status_name: string;
  discount_type_name: string;
  lesson_progress: number;
  sales_person?: {
    id: number;
    name: string;
  };
  created_at: string;
}

const Orders: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Enrollment | null>(null);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取订单列表
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['enrollments', search, status, paymentStatus, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'all') params.append('status', status);
      if (paymentStatus !== 'all') params.append('payment_status', paymentStatus);
      params.append('page', currentPage.toString());
      params.append('per_page', '15');

      const response = await api.get(`/admin/enrollments?${params}`);
      return response.data;
    },
  });

  const orders: Enrollment[] = ordersData?.data?.data || [];
  const pagination = ordersData?.data || {};

  // 退费处理
  const refundMutation = useMutation({
    mutationFn: async ({ id, refund_amount, refund_reason }: { 
      id: number; 
      refund_amount: number; 
      refund_reason: string; 
    }) => {
      const response = await api.post(`/admin/enrollments/${id}/refund`, {
        refund_amount,
        refund_reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      setRefundDialogOpen(false);
      setSelectedOrder(null);
      addToast({
        type: 'success',
        title: '退费成功',
        description: '订单已退费',
      });
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '退费失败',
        description: error.response?.data?.message || '退费失败，请稍后重试',
      });
    },
  });

  const handleRefund = (order: Enrollment) => {
    setSelectedOrder(order);
    setRefundDialogOpen(true);
  };

  // 获取状态对应的颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取付款状态对应的颜色
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">订单管理</h1>
          <p className="text-gray-600">管理学员报名订单和退费</p>
        </div>
      </div>

      {/* 筛选区域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索学员姓名、课程名称..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="订单状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待确认</SelectItem>
                <SelectItem value="active">进行中</SelectItem>
                <SelectItem value="suspended">暂停</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="付款状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="unpaid">未付款</SelectItem>
                <SelectItem value="partial">部分付款</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="refunded">已退款</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 订单列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>订单列表</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单信息</TableHead>
                    <TableHead>学员</TableHead>
                    <TableHead>课程</TableHead>
                    <TableHead>课时信息</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>报名日期</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="text-gray-500">
                          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>暂无订单数据</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">#{order.id}</div>
                            <div className="text-sm text-gray-500">{order.campus.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.student.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{order.course.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>总课时：{order.total_lessons}节</div>
                            <div>已用：{order.used_lessons}节</div>
                            <div>剩余：{order.remaining_lessons}节</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>单价：¥{order.price_per_lesson}</div>
                            <div className="font-medium">实收：¥{order.actual_amount}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status_name}
                            </Badge>
                            <Badge className={getPaymentStatusColor(order.payment_status)}>
                              {order.payment_status_name}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(order.enrollment_date).toLocaleDateString('zh-CN')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                查看详情
                              </DropdownMenuItem>
                              {order.payment_status === 'paid' && order.status !== 'cancelled' && (
                                <DropdownMenuItem 
                                  onClick={() => handleRefund(order)}
                                  className="text-red-600"
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  申请退费
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* 分页 */}
              {pagination.last_page > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    显示 {pagination.from || 0} 到 {pagination.to || 0} 条，共 {pagination.total || 0} 条
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* TODO: 添加退费对话框组件 */}
    </div>
  );
};

export default Orders;
