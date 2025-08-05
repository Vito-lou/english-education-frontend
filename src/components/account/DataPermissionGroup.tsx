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
      <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
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
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name={`data-permission-${resourceType}`}
              checked={selectedPermission?.id === allPermission.id}
              onChange={() => handlePermissionChange(resourceType, allPermission.id)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">全部数据</span>
              <p className="text-xs text-gray-500 mt-1">
                {allPermission.name.replace(/.*-/, '')}
              </p>
            </div>
          </label>

          {/* 部分数据选项 */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="radio"
              name={`data-permission-${resourceType}`}
              checked={selectedPermission?.id === partialPermission.id}
              onChange={() => handlePermissionChange(resourceType, partialPermission.id)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">部分数据</span>
              <p className="text-xs text-gray-500 mt-1">
                {partialPermission.name.replace(/.*-/, '')}
              </p>
            </div>
          </label>
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

      {/* 权限说明 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h6 className="text-sm font-medium text-blue-900 mb-2">数据权限说明</h6>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>全部数据</strong>：可以查看该类型的所有数据</li>
          <li>• <strong>部分数据</strong>：只能查看与自己相关的数据（如分配给自己的学员、负责的班级等）</li>
          <li>• 每种数据类型只能选择一种权限级别</li>
          <li>• 未选择的数据类型将无法访问</li>
        </ul>
      </div>
    </div>
  );
};

export default DataPermissionGroup;
