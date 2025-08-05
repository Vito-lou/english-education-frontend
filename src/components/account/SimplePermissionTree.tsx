import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';

interface Permission {
  id: number;
  name: string;
  code: string;
  type: string;
  menu?: {
    id: number;
    name: string;
    code: string;
    icon?: string;
  };
}

interface SimplePermissionTreeProps {
  permissions: Permission[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  disabled?: boolean;
}

const SimplePermissionTree: React.FC<SimplePermissionTreeProps> = ({
  permissions,
  selectedIds,
  onChange,
  disabled = false,
}) => {
  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    if (disabled) return;

    let newSelectedIds = [...selectedIds];

    if (checked) {
      if (!newSelectedIds.includes(permissionId)) {
        newSelectedIds.push(permissionId);
      }
    } else {
      newSelectedIds = newSelectedIds.filter(id => id !== permissionId);
    }

    onChange(newSelectedIds);
  };

  // 按菜单分组权限
  const groupedPermissions = permissions.reduce((groups, permission) => {
    const menuName = permission.menu?.name || '其他';
    if (!groups[menuName]) {
      groups[menuName] = [];
    }
    groups[menuName].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  const PermissionGroup: React.FC<{ 
    title: string; 
    permissions: Permission[];
  }> = ({ title, permissions: groupPermissions }) => (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
        {groupPermissions[0]?.menu?.icon && (
          <span className="text-gray-500">{groupPermissions[0].menu.icon}</span>
        )}
        {title}
      </h4>
      <div className="space-y-2">
        {groupPermissions.map(permission => (
          <label 
            key={permission.id}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <Checkbox
              checked={selectedIds.includes(permission.id)}
              onCheckedChange={(checked) => 
                handlePermissionChange(permission.id, checked as boolean)
              }
              disabled={disabled}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <span className={`text-sm ${
              disabled ? 'text-gray-400' : 'text-gray-700'
            } ${selectedIds.includes(permission.id) ? 'font-medium' : ''}`}>
              {permission.name}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  if (!permissions || permissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无功能权限数据</p>
      </div>
    );
  }

  const groupEntries = Object.entries(groupedPermissions);
  
  return (
    <div className="space-y-4">
      {/* 左右分布的网格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupEntries.map(([groupName, groupPermissions]) => (
          <PermissionGroup
            key={groupName}
            title={groupName}
            permissions={groupPermissions}
          />
        ))}
      </div>
      
      {/* 权限说明 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h6 className="text-sm font-medium text-blue-900 mb-2">功能权限说明</h6>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>功能权限</strong>：决定角色可以看到哪些菜单页面</li>
          <li>• 勾选权限后，该角色就能看到对应的菜单并进入页面</li>
          <li>• 未勾选的菜单将不会在导航中显示</li>
        </ul>
      </div>
    </div>
  );
};

export default SimplePermissionTree;
