import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface DataPermission {
  id: number;
  name: string;
  code: string;
  resource_type: string;
  scope_type: 'all' | 'partial';
}

interface DataPermissionGroupProps {
  dataPermissions: Record<string, DataPermission[]>;
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  disabled?: boolean;
}

const DataPermissionGroup: React.FC<DataPermissionGroupProps> = ({
  dataPermissions,
  selectedIds,
  onChange,
  disabled = false,
}) => {
  const resourceTypeNames: Record<string, string> = {
    student: '学员数据',
    class: '班级数据',
    schedule: '课表数据',
    lesson: '上课记录',
    makeup: '缺课补课',
  };

  const getSelectedPermissionForResource = (resourceType: string): DataPermission | null => {
    const permissions = dataPermissions[resourceType] || [];
    return permissions.find(p => selectedIds.includes(p.id)) || null;
  };

  const handlePermissionChange = (resourceType: string, permissionId: number) => {
    if (disabled) return;

    const permissions = dataPermissions[resourceType] || [];
    const currentSelected = getSelectedPermissionForResource(resourceType);

    let newSelectedIds = [...selectedIds];

    // 移除该资源类型的其他权限
    permissions.forEach(p => {
      newSelectedIds = newSelectedIds.filter(id => id !== p.id);
    });

    // 如果不是取消选中当前项，则添加新选中的权限
    if (!currentSelected || currentSelected.id !== permissionId) {
      newSelectedIds.push(permissionId);
    }

    console.log('数据权限变化:', {
      resourceType,
      permissionId,
      newSelectedIds,
      oldSelectedIds: selectedIds
    });

    onChange(newSelectedIds);
  };

  const ResourcePermissionGroup: React.FC<{
    resourceType: string;
    permissions: DataPermission[]
  }> = ({ resourceType, permissions }) => {
    const selectedPermission = getSelectedPermissionForResource(resourceType);
    const allPermission = permissions.find(p => p.scope_type === 'all');
    const partialPermission = permissions.find(p => p.scope_type === 'partial');

    if (!allPermission || !partialPermission) {
      return null;
    }

    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <h5 className="font-medium text-gray-900">
            {resourceTypeNames[resourceType] || resourceType}
          </h5>
          {selectedPermission && (
            <Badge variant={selectedPermission.scope_type === 'all' ? 'default' : 'secondary'}>
              {selectedPermission.scope_type === 'all' ? '全部' : '部分'}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {/* 全部数据选项 */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handlePermissionChange(resourceType, allPermission.id)}
          >
            <input
              type="radio"
              name={`data-permission-${resourceType}`}
              checked={selectedPermission?.id === allPermission.id}
              onChange={() => { }} // 空函数，点击由父div处理
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50 pointer-events-none"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">全部数据</span>
              <p className="text-xs text-gray-500 mt-1">
                {allPermission.name.replace(/.*-/, '')}
              </p>
            </div>
          </div>

          {/* 部分数据选项 */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handlePermissionChange(resourceType, partialPermission.id)}
          >
            <input
              type="radio"
              name={`data-permission-${resourceType}`}
              checked={selectedPermission?.id === partialPermission.id}
              onChange={() => { }} // 空函数，点击由父div处理
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50 pointer-events-none"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">部分数据</span>
              <p className="text-xs text-gray-500 mt-1">
                {partialPermission.name.replace(/.*-/, '')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!dataPermissions || Object.keys(dataPermissions).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无数据权限配置</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 左右分布的网格布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(dataPermissions).map(([resourceType, permissions]) => (
          <ResourcePermissionGroup
            key={resourceType}
            resourceType={resourceType}
            permissions={permissions}
          />
        ))}
      </div>
    </div>
  );
};

export default DataPermissionGroup;
