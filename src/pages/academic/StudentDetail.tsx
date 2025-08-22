import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, UserPlus, Phone, Mail, MapPin, User, Calendar, GraduationCap, DollarSign, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

import StudentEditor from '@/components/academic/StudentEditor';
import StudentEnrollmentDialog from '@/components/academic/StudentEnrollmentDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface Student {
  id: number;
  name: string;
  gender: 'male' | 'female';
  birth_date?: string;
  phone?: string;
  email?: string;
  address?: string;
  parent_name: string;
  parent_phone: string;
  parent_relationship: string;
  student_type: 'potential' | 'trial' | 'enrolled' | 'graduated' | 'suspended';
  follow_up_status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'follow_up';
  intention_level: 'high' | 'medium' | 'low';
  source?: string;
  remarks?: string;
  status: 'active' | 'inactive';
  age?: number;
  student_type_name: string;
  follow_up_status_name: string;
  intention_level_name: string;
  created_at: string;
}

const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // 从URL参数获取默认激活的tab
  const defaultTab = searchParams.get('tab') || 'enrollments';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [editorOpen, setEditorOpen] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);

  // 获取学员详情
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('学员ID不存在');
      const response = await api.get(`/admin/students/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const studentInfo = studentData?.data || studentData;

  const handleBack = () => {
    navigate('/academic/students');
  };

  const handleEdit = () => {
    setEditorOpen(true);
  };

  const handleEnrollment = () => {
    setEnrollmentDialogOpen(true);
  };

  // 编辑成功后的回调
  const handleEditSuccess = () => {
    // 刷新学员详情数据
    queryClient.invalidateQueries({ queryKey: ['student-detail', id] });
  };

  // 报名成功后的回调
  const handleEnrollmentSuccess = () => {
    // 刷新学员详情数据
    queryClient.invalidateQueries({ queryKey: ['student-detail', id] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!studentInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">学员信息不存在</div>
      </div>
    );
  }

  // 获取学员类型对应的颜色
  const getStudentTypeColor = (type: string) => {
    switch (type) {
      case 'potential': return 'bg-yellow-100 text-yellow-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'enrolled': return 'bg-green-100 text-green-800';
      case 'graduated': return 'bg-purple-100 text-purple-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取跟进状态对应的颜色
  const getFollowUpStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'interested': return 'bg-green-100 text-green-800';
      case 'not_interested': return 'bg-red-100 text-red-800';
      case 'follow_up': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取意向等级对应的颜色
  const getIntentionLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={handleBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{studentInfo.name}</h1>
            <p className="text-gray-600">学员详情</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            编辑学员资料
          </Button>
          <Button onClick={handleEnrollment}>
            <UserPlus className="mr-2 h-4 w-4" />
            报名
          </Button>
        </div>
      </div>

      {/* 学员基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>基本信息</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">姓名</label>
                <p className="text-sm">{studentInfo.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">性别</label>
                <p className="text-sm">{studentInfo.gender === 'male' ? '男' : '女'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">年龄</label>
                <p className="text-sm">{studentInfo.age || '-'}岁</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">联系电话</label>
                <p className="text-sm">{studentInfo.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">邮箱</label>
                <p className="text-sm">{studentInfo.email || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">地址</label>
                <p className="text-sm">{studentInfo.address || '-'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">家长姓名</label>
                <p className="text-sm">{studentInfo.parent_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">家长电话</label>
                <p className="text-sm">{studentInfo.parent_phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">关系</label>
                <p className="text-sm">{studentInfo.parent_relationship}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge className={getStudentTypeColor(studentInfo.student_type)}>
              {studentInfo.student_type_name}
            </Badge>
            <Badge className={getFollowUpStatusColor(studentInfo.follow_up_status)}>
              {studentInfo.follow_up_status_name}
            </Badge>
            <Badge className={getIntentionLevelColor(studentInfo.intention_level)}>
              {studentInfo.intention_level_name}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tab页组件 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="enrollments">报读课程</TabsTrigger>
          <TabsTrigger value="orders">订单记录</TabsTrigger>
          <TabsTrigger value="attendance">上课记录</TabsTrigger>
          <TabsTrigger value="growth">成长档案</TabsTrigger>
          <TabsTrigger value="grades">成绩单</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>报读课程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                暂无报读课程数据
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <StudentOrdersTab studentId={studentInfo.id} />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>上课记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                暂无上课记录数据
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>成长档案</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                暂无成长档案数据
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>成绩单</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                暂无成绩单数据
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 学员编辑弹窗 */}
      <StudentEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        student={studentInfo}
        onSuccess={handleEditSuccess}
      />

      {/* 报名弹窗 */}
      <StudentEnrollmentDialog
        open={enrollmentDialogOpen}
        onClose={() => setEnrollmentDialogOpen(false)}
        student={studentInfo}
        onSuccess={handleEnrollmentSuccess}
      />
    </div>
  );
};

// 学员订单记录标签页组件
interface StudentOrdersTabProps {
  studentId: number;
}

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
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
}

const StudentOrdersTab: React.FC<StudentOrdersTabProps> = ({ studentId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Enrollment | null>(null);

  // 获取学员的订单列表
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['student-orders', studentId, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('student_id', studentId.toString());
      params.append('page', currentPage.toString());
      params.append('per_page', '10');

      const response = await api.get(`/admin/enrollments?${params}`);
      return response.data;
    },
  });

  const orders: Enrollment[] = ordersData?.data?.data || [];
  const pagination = ordersData?.data || {};



  const handleViewDetails = (order: Enrollment) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>订单记录</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">加载中...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>订单记录</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">查看学员的报名订单历史，如需退费请前往订单管理页面</p>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无订单记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单信息</TableHead>
                    <TableHead>课程</TableHead>
                    <TableHead>课时信息</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>报名日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">#{order.id}</div>
                          <div className="text-sm text-gray-500">{order.campus.name}</div>
                        </div>
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

                    </TableRow>
                  ))}
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



      {/* 订单详情对话框 */}
      <OrderDetailsDialog
        isOpen={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        order={selectedOrder}
      />
    </>
  );
};

// 订单详情对话框组件
interface OrderDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Enrollment | null;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ isOpen, onClose, order }) => {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>订单详情 - #{order.id}</DialogTitle>
          <DialogDescription>
            查看订单的详细信息。
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">基本信息</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold text-gray-600">学员姓名:</div><div>{order.student.name}</div>
              <div className="font-semibold text-gray-600">校区:</div><div>{order.campus.name}</div>
              <div className="font-semibold text-gray-600">课程名称:</div><div>{order.course.name}</div>
              <div className="font-semibold text-gray-600">报名日期:</div><div>{new Date(order.enrollment_date).toLocaleDateString('zh-CN')}</div>
              <div className="font-semibold text-gray-600">销售员:</div><div>{order.sales_person?.name || 'N/A'}</div>
              <div className="font-semibold text-gray-600">创建时间:</div><div>{new Date(order.created_at).toLocaleString('zh-CN')}</div>
            </div>
            <h3 className="text-lg font-semibold border-b pb-2">状态信息</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold text-gray-600">订单状态:</div><div><Badge className={getStatusColor(order.status)}>{order.status_name}</Badge></div>
              <div className="font-semibold text-gray-600">付款状态:</div><div><Badge className={getPaymentStatusColor(order.payment_status)}>{order.payment_status_name}</Badge></div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">财务信息</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="font-semibold text-gray-600">总课时:</div><div>{order.total_lessons} 节</div>
              <div className="font-semibold text-gray-600">已用课时:</div><div>{order.used_lessons} 节</div>
              <div className="font-semibold text-gray-600">剩余课时:</div><div>{order.remaining_lessons} 节</div>
              <div className="font-semibold text-gray-600">课时单价:</div><div>¥{order.price_per_lesson}</div>
              <div className="font-semibold text-gray-600">折扣类型:</div><div>{order.discount_type_name}</div>
              <div className="font-semibold text-gray-600">折扣值:</div><div>{order.discount_value}</div>
              <div className="font-semibold text-gray-600">实收金额:</div><div className="font-bold text-green-600">¥{order.actual_amount}</div>
              <div className="font-semibold text-gray-600">已付金额:</div><div>¥{order.paid_amount}</div>
            </div>
            {order.payment_status === 'refunded' && (
              <>
                <h3 className="text-lg font-semibold border-b pb-2">退款信息</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-semibold text-gray-600">退款金额:</div><div className="font-bold text-red-600">¥{order.refund_amount}</div>
                  <div className="font-semibold text-gray-600">退款日期:</div><div>{order.refunded_at ? new Date(order.refunded_at).toLocaleString('zh-CN') : 'N/A'}</div>
                  <div className="font-semibold text-gray-600 col-span-2">退款原因:</div>
                  <div className="col-span-2 bg-gray-50 p-2 rounded text-sm">{order.refund_reason || 'N/A'}</div>
                </div>
              </>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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

export default StudentDetail;
