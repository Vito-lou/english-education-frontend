import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, UserPlus, Phone, Mail, MapPin, User, Calendar, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import StudentEditor from '@/components/academic/StudentEditor';
import StudentEnrollmentDialog from '@/components/academic/StudentEnrollmentDialog';

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
          <Card>
            <CardHeader>
              <CardTitle>订单记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                暂无订单记录数据
              </div>
            </CardContent>
          </Card>
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

export default StudentDetail;
