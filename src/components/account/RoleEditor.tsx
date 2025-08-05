import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MenuPermissionSelector from './MenuPermissionSelector';
import DataPermissionGroup from './DataPermissionGroup';
import { Save } from 'lucide-react';

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
  dataPermissions: DataPermission[];
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
  onChange: () => void;
  isCreating: boolean;
  isSaving: boolean;
}

const RoleEditor: React.FC<RoleEditorProps> = ({
  role,
  permissions,
  menus,
  dataPermissions,
  onSave,
  onChange,
  isCreating,
  isSaving,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [selectedDataPermissionIds, setSelectedDataPermissionIds] = useState<number[]>([]);

  // 当角色变化时更新表单数据
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || '',
      });
      setSelectedMenuIds(role.menus?.map(m => m.id) || []);
      setSelectedDataPermissionIds(role.dataPermissions?.map(dp => dp.id) || []);
    } else if (isCreating) {
      setFormData({
        name: '',
        description: '',
      });
      setSelectedMenuIds([]);
      setSelectedDataPermissionIds([]);
    }
  }, [role, isCreating]);

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
    setSelectedDataPermissionIds(dataPermissionIds);
    onChange();
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入角色名称');
      return;
    }

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
    <div className="space-y-6">
      {/* 基础信息 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
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

        <div>
          <Label htmlFor="role-description">角色描述</Label>
          <Textarea
            id="role-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="请输入角色描述"
            rows={3}
            disabled={isReadonly}
          />
        </div>
      </div>

      {/* 功能权限 */}
      <div className="space-y-4">
        <div className="border-t pt-6">
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
      </div>

      {/* 数据权限 */}
      <div className="space-y-4">
        <div className="border-t pt-6">
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
      </div>

      {/* 保存按钮 */}
      {!isReadonly && (
        <div className="border-t pt-6">
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.name.trim()}
              className="min-w-[120px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? '保存中...' : isCreating ? '创建角色' : '保存更改'}
            </Button>
          </div>
        </div>
      )}

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
  );
};

export default RoleEditor;
