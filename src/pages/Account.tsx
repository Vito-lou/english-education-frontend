import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/account/UserManagement';
import RoleManagement from '@/components/account/RoleManagement';

const Account: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">账户管理</h1>
        <p className="text-gray-600 mt-1">管理用户账户和角色权限</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="users">用户管理</TabsTrigger>
          <TabsTrigger value="roles">角色管理</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RoleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;
