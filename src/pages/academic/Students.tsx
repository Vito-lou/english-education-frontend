import React from 'react';
import { Card } from '@/components/ui/card';

const Students: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">学员管理</h1>
        <p className="text-gray-600 mt-1">管理学员信息、报名状态和学习进度</p>
      </div>

      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">学员管理功能</h3>
          <p className="text-gray-500">
            这里将包含学员列表、学员档案、报名管理、学习进度跟踪等功能
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Students;
