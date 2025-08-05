import React from 'react';
import { useUserMenus } from '@/hooks/useUserMenus';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

const Debug: React.FC = () => {
  const { userMenus, isLoading, userPermissions, hasPermission } = useUserMenus();
  const queryClient = useQueryClient();

  const handleRefreshPermissions = () => {
    queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
    queryClient.invalidateQueries({ queryKey: ['system-menus-tree'] });
    window.location.reload();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">权限调试页面</h1>
        <Button onClick={handleRefreshPermissions}>
          刷新权限数据
        </Button>
      </div>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">用户权限</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(userPermissions, null, 2)}
        </pre>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">用户菜单</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(userMenus, null, 2)}
        </pre>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">权限检查</h2>
        <div className="space-y-2">
          <p>dashboard: {hasPermission('dashboard') ? '✅' : '❌'}</p>
          <p>account: {hasPermission('account') ? '✅' : '❌'}</p>
          <p>organization: {hasPermission('organization') ? '✅' : '❌'}</p>
          <p>system: {hasPermission('system') ? '✅' : '❌'}</p>
        </div>
      </Card>
    </div>
  );
};

export default Debug;
