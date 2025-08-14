import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Users, Calendar, UserCheck, Clock, MapPin, User, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { classApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import ClassEditor from '@/components/academic/ClassEditor';
import ClassStudentManagement from '@/components/academic/ClassStudentManagement';

const ClassDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 从URL参数获取默认激活的tab
  const defaultTab = searchParams.get('tab') || 'schedule';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [editorOpen, setEditorOpen] = useState(false);

  // 获取班级详情
  const { data: classData, isLoading } = useQuery({
    queryKey: ['class-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('班级ID不存在');
      const response = await classApi.show(parseInt(id));
      return response.data;
    },
    enabled: !!id,
  });

  const classInfo = classData?.data || classData;

  const handleBack = () => {
    navigate('/academic/classes');
  };

  const handleEdit = () => {
    setEditorOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">班级不存在</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={handleBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>返回班级列表</span>
        </Button>
      </div>

      {/* 班级信息展示区域 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <CardTitle className="text-2xl">{classInfo.name}</CardTitle>
                <p className="text-gray-600 mt-1">班级详细信息</p>
              </div>
              <Badge variant={classInfo.status === 'active' ? 'default' : 'secondary'}>
                {classInfo.status_name}
              </Badge>
            </div>
            <Button onClick={handleEdit} className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>编辑班级信息</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 基本信息 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">所属校区</span>
              </div>
              <p className="text-lg">{classInfo.campus?.name}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-600">
                <GraduationCap className="h-4 w-4" />
                <span className="font-medium">关联课程</span>
              </div>
              <div>
                <p className="text-lg">{classInfo.course?.name}</p>
                {classInfo.level && (
                  <p className="text-sm text-gray-500">{classInfo.level.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span className="font-medium">班级容量</span>
              </div>
              <p className="text-lg">
                <span className={classInfo.current_student_count >= classInfo.max_students ? 'text-red-600' : 'text-gray-900'}>
                  {classInfo.capacity_info}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="h-4 w-4" />
                <span className="font-medium">授课老师</span>
              </div>
              <p className="text-lg">{classInfo.teacher?.name}</p>
            </div>
          </div>

          {/* 上课时间信息 */}
          {classInfo.schedule && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center space-x-2 text-gray-600 mb-3">
                <Clock className="h-4 w-4" />
                <span className="font-medium">上课时间</span>
              </div>
              <p className="text-gray-700">{classInfo.schedule}</p>
            </div>
          )}

          {/* 备注信息 */}
          {classInfo.remarks && (
            <div className="mt-6 pt-6 border-t">
              <div className="text-gray-600 mb-3">
                <span className="font-medium">备注信息</span>
              </div>
              <p className="text-gray-700">{classInfo.remarks}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab页面区域 */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="schedule" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>排课信息</span>
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>班级学员</span>
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex items-center space-x-2">
                  <UserCheck className="h-4 w-4" />
                  <span>点名情况</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="schedule" className="mt-0">
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">排课信息</h3>
                  <p>排课功能开发中...</p>
                </div>
              </TabsContent>

              <TabsContent value="students" className="mt-0">
                <ClassStudentManagement classId={parseInt(id!)} classInfo={classInfo} />
              </TabsContent>

              <TabsContent value="attendance" className="mt-0">
                <div className="text-center py-12 text-gray-500">
                  <UserCheck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">点名情况</h3>
                  <p>点名功能开发中...</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* 班级编辑器 */}
      <ClassEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        classData={classInfo}
      />
    </div>
  );
};

export default ClassDetail;
