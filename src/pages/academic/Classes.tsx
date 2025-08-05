import React from 'react';
import { Card } from '@/components/ui/card';

const Classes: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">班级管理</h1>
        <p className="text-gray-600 mt-1">管理班级信息、班级成员和教学安排</p>
      </div>

      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">班级管理功能</h3>
          <p className="text-gray-500">
            这里将包含班级创建、班级成员管理、班级课程安排等功能
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Classes;
