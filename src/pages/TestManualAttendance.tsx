import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ManualAttendanceDialog from '@/components/academic/ManualAttendanceDialog';

const TestManualAttendance: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>手动点名功能测试</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              点击下面的按钮测试手动点名弹窗功能
            </p>
            
            <Button 
              onClick={() => setDialogOpen(true)}
              className="flex items-center space-x-2"
            >
              <span>测试手动点名弹窗</span>
            </Button>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">测试说明：</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>1. 点击按钮打开手动点名弹窗</li>
                <li>2. 弹窗会显示模拟的学员数据</li>
                <li>3. 可以选择学员并进入点名表单</li>
                <li>4. 填写课程信息和学员考勤状态</li>
                <li>5. 提交时会调用API（如果API不可用会显示错误）</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <ManualAttendanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        classId={1}
        className="测试班级"
      />
    </div>
  );
};

export default TestManualAttendance;
