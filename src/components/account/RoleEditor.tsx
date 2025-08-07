import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import MenuPermissionSelector from './MenuPermissionSelector';
import DataPermissionGroup from './DataPermissionGroup';
import { Save, X } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  institution_id: number | null;
  is_system: boolean;
  status: string;
  permissions: Permission[];
  menus: SystemMenu[];
  data_permissions: DataPermission[];
}

interface SystemMenu {
  id: number;
  name: string;
  code: string;
  icon?: string;
  parent_id: number | null;
  children_items?: SystemMenu[];
}

interface Permission {
  id: number;
  name: string;
  code: string;
  type: string;
  menu_id: number;
  children?: Permission[];
  menu?: {
    id: number;
    name: string;
    code: string;
    icon?: string;
    parent_id: number | null;
  };
}

interface DataPermission {
  id: number;
  name: string;
  code: string;
  resource_type: string;
  scope_type: 'all' | 'partial';
}

interface RoleEditorProps {
  role: Role | null;
  permissions: Permission[];
  menus: SystemMenu[];
  dataPermissions: Record<string, DataPermission[]>;
  onSave: (data: {
    name: string;
    description: string;
    permission_ids: number[];
    menu_ids: number[];
    data_permission_ids: number[];
  }) => void;
  onCancel: () => void;
  onChange: () => void;
  hasUnsavedChanges: boolean;
  isCreating: boolean;
  isSaving: boolean;
}

const RoleEditor: React.FC<RoleEditorProps> = ({
  role,
  permissions,
  menus,
  dataPermissions,
  onSave,
  onCancel,
  onChange,
  hasUnsavedChanges,
  isCreating,
  isSaving,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [selectedDataPermissionIds, setSelectedDataPermissionIds] = useState<number[]>([]);

  // 重置表单数据到原始状态
  const resetFormData = useCallback(() => {
    if (role) {
      console.log('重置表单数据，角色信息:', role);
      console.log('角色的数据权限:', role.data_permissions);

      setFormData({
        name: role.name,
        description: role.description || '',
      });
      setSelectedMenuIds(role.menus?.map(m => m.id) || []);
      const dataPermissionIds = role.data_permissions?.map(dp => dp.id) || [];
      console.log('设置数据权限IDs:', dataPermissionIds);
      setSelectedDataPermissionIds(dataPermissionIds);
    } else if (isCreating) {
      setFormData({
        name: '',
        description: '',
      });
      setSelectedMenuIds([]);
      setSelectedDataPermissionIds([]);
    }
  }, [role, isCreating]);

  // 当角色变化时更新表单数据
  useEffect(() => {
    resetFormData();
  }, [resetFormData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    onChange();
  };

  const handleMenuChange = (menuIds: number[]) => {
    setSelectedMenuIds(menuIds);
    onChange();
  };

  const handleDataPermissionChange = (dataPermissionIds: number[]) => {
    console.log('数据权限变化:', dataPermissionIds);
    setSelectedDataPermissionIds(dataPermissionIds);
    onChange();
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入角色名称');
      return;
    }

    console.log('保存角色数据:', {
      name: formData.name.trim(),
      description: formData.description.trim(),
      permission_ids: [],
      menu_ids: selectedMenuIds,
      data_permission_ids: selectedDataPermissionIds,
    });

    onSave({
      name: formData.name.trim(),
      description: formData.description.trim(),
      permission_ids: [], // 暂时保留兼容性
      menu_ids: selectedMenuIds,
      data_permission_ids: selectedDataPermissionIds,
    });
  };

  const isSystemRole = role?.is_system || false;
  const isReadonly = isSystemRole && !isCreating;

  return (
    <div className="h-full flex flex-col">
      {/* 顶部固定区域 - 基础信息 */}
      <div className="flex-shrink-0 p-4 border-b bg-white">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 h-6">
              <Label htmlFor="role-name">角色名称</Label>
              {isSystemRole && (
                <Badge variant="secondary" className="text-xs">
                  系统角色
                </Badge>
              )}
            </div>
            <Input
              id="role-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入角色名称"
              disabled={isReadonly}
            />
          </div>
          <div className="space-y-2">
            <div className="h-6 flex items-center">
              <Label htmlFor="role-description">角色描述</Label>
            </div>
            <Input
              id="role-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入角色描述"
              disabled={isReadonly}
            />
          </div>
        </div>
      </div>

      {/* 中间滚动区域 - 权限配置 */}
      <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: '620px' }}>
        <div className="space-y-6">
          {/* 功能权限 */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-medium text-gray-900">功能权限</h4>
                <p className="text-sm text-gray-600">
                  决定角色可以看到哪些页面或使用哪些操作
                </p>
              </div>
              <div className="mt-4">
                <MenuPermissionSelector
                  menus={menus}
                  selectedIds={selectedMenuIds}
                  onChange={handleMenuChange}
                  disabled={isSystemRole}
                />
              </div>
            </div>
          </Card>

          {/* 数据权限 */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-medium text-gray-900">数据权限</h4>
                <p className="text-sm text-gray-600">
                  决定员工可查看多少数据或内容
                </p>
              </div>
              <div className="mt-4">
                <DataPermissionGroup
                  dataPermissions={dataPermissions}
                  selectedIds={selectedDataPermissionIds}
                  onChange={handleDataPermissionChange}
                  disabled={isReadonly}
                />
              </div>
            </div>
          </Card>

          {/* 系统角色只读提示 */}
          {isReadonly && (
            <div className="border-t pt-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">只读</Badge>
                  <span className="text-sm text-gray-600">
                    系统角色不允许修改，如需自定义权限请创建新角色
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部固定区域 - 操作按钮 */}
      <div className="flex-shrink-0 border-t bg-white p-4">
        <div className="flex justify-end gap-3">
          {!isReadonly && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  resetFormData();
                  onCancel();
                }}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.name.trim() || !hasUnsavedChanges}
                className="min-w-[120px]"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? '保存中...' : isCreating ? '创建角色' : '保存更改'}
              </Button>
            </>
          )}
          {isReadonly && (
            <div className="text-sm text-gray-500">
              系统角色不允许修改
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleEditor;
