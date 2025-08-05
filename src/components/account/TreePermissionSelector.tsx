import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { getMenuIcon } from '@/hooks/useUserMenus';

interface Permission {
  id: number;
  name: string;
  code: string;
  type: string;
  menu_id: number;
  menu?: {
    id: number;
    name: string;
    code: string;
    icon?: string;
    parent_id: number | null;
  };
}

interface TreePermissionSelectorProps {
  permissions: Permission[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  disabled?: boolean;
}

interface MenuPermissionGroup {
  menu: {
    id: number;
    name: string;
    code: string;
    icon?: string;
    parent_id: number | null;
  };
  permissions: Permission[];
  children: MenuPermissionGroup[];
}

const TreePermissionSelector: React.FC<TreePermissionSelectorProps> = ({
  permissions,
  selectedIds,
  onChange,
  disabled = false,
}) => {
  // 简化的权限分组：按父菜单分组
  const buildMenuPermissionTree = (): MenuPermissionGroup[] => {
    const groups: MenuPermissionGroup[] = [];

    // 按父菜单分组权限
    const groupedByParent = permissions.reduce((acc, permission) => {
      if (permission.menu) {
        const parentId = permission.menu.parent_id || 'root';
        if (!acc[parentId]) {
          acc[parentId] = [];
        }
        acc[parentId].push(permission);
      }
      return acc;
    }, {} as Record<string | number, Permission[]>);

    // 处理顶级权限（没有父菜单的）
    if (groupedByParent['root']) {
      groupedByParent['root'].forEach(permission => {
        groups.push({
          menu: permission.menu!,
          permissions: [permission],
          children: []
        });
      });
    }

    // 处理有父菜单的权限
    Object.entries(groupedByParent).forEach(([parentId, perms]) => {
      if (parentId !== 'root') {
        // 获取父菜单信息（从第一个子权限中获取）
        const firstPerm = perms[0];
        if (firstPerm && firstPerm.menu) {
          groups.push({
            menu: {
              id: Number(parentId),
              name: getParentMenuName(Number(parentId), perms),
              code: `parent_${parentId}`,
              icon: 'Folder',
              parent_id: null
            },
            permissions: [],
            children: perms.map(perm => ({
              menu: perm.menu!,
              permissions: [perm],
              children: []
            }))
          });
        }
      }
    });

    return groups;
  };

  // 获取父菜单名称的辅助函数
  const getParentMenuName = (parentId: number, childPermissions: Permission[]): string => {
    const parentNames: Record<number, string> = {
      73: '教务中心',
      74: '家校互动',
      77: '机构设置',
      78: '应用中心'
    };
    return parentNames[parentId] || '未知菜单';
  };

  const menuPermissionTree = buildMenuPermissionTree();

  // 获取菜单组的选中状态
  const getMenuGroupState = (group: MenuPermissionGroup): { checked: boolean; indeterminate: boolean } => {
    const allPermissionIds = [
      ...group.permissions.map(p => p.id),
      ...group.children.flatMap(child => getAllPermissionIds(child))
    ];

    const selectedCount = allPermissionIds.filter(id => selectedIds.includes(id)).length;

    if (selectedCount === 0) {
      return { checked: false, indeterminate: false };
    } else if (selectedCount === allPermissionIds.length) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  };

  // 获取菜单组的所有权限ID
  const getAllPermissionIds = (group: MenuPermissionGroup): number[] => {
    return [
      ...group.permissions.map(p => p.id),
      ...group.children.flatMap(child => getAllPermissionIds(child))
    ];
  };

  // 处理菜单组选择变化
  const handleMenuGroupChange = (group: MenuPermissionGroup, checked: boolean) => {
    if (disabled) return;

    const allPermissionIds = getAllPermissionIds(group);
    let newSelectedIds = [...selectedIds];

    if (checked) {
      // 选中：添加所有权限
      allPermissionIds.forEach(id => {
        if (!newSelectedIds.includes(id)) {
          newSelectedIds.push(id);
        }
      });
    } else {
      // 取消选中：移除所有权限
      newSelectedIds = newSelectedIds.filter(id => !allPermissionIds.includes(id));
    }

    onChange(newSelectedIds);
  };

  // 处理单个权限变化
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

  // 渲染菜单权限组
  const renderMenuGroup = (group: MenuPermissionGroup, level = 0) => {
    const { checked, indeterminate } = getMenuGroupState(group);

    return (
      <div key={group.menu.id} className="space-y-2">
        {/* 菜单组标题 */}
        <div className="flex items-center space-x-2" style={{ paddingLeft: level * 16 }}>
          <Checkbox
            checked={checked}
            indeterminate={indeterminate}
            onCheckedChange={(checked) => handleMenuGroupChange(group, checked as boolean)}
            disabled={disabled}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <span className="text-lg">{getMenuIcon(group.menu.icon || '')}</span>
          <span className="font-medium text-gray-900">{group.menu.name}</span>
        </div>

        {/* 子菜单权限 */}
        {group.children.length > 0 && (
          <div className="space-y-2">
            {group.children.map(child => renderMenuGroup(child, level + 1))}
          </div>
        )}

        {/* 当前菜单的权限（如果有的话，通常只有叶子菜单才有） */}
        {group.permissions.length > 0 && group.children.length === 0 && (
          <div className="ml-6 space-y-1">
            {group.permissions.map(permission => (
              <label
                key={permission.id}
                className="flex items-center space-x-2 cursor-pointer"
                style={{ paddingLeft: level * 16 }}
              >
                <Checkbox
                  checked={selectedIds.includes(permission.id)}
                  onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                  disabled={disabled}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="text-sm text-gray-700">{permission.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!permissions || permissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无功能权限数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 树形权限选择器 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuPermissionTree.map(group => (
          <div key={group.menu.id} className="border border-gray-200 rounded-lg p-4">
            {renderMenuGroup(group)}
          </div>
        ))}
      </div>

      {/* 权限说明 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h6 className="text-sm font-medium text-blue-900 mb-2">功能权限说明</h6>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>父菜单</strong>：勾选后该角色可以看到整个菜单模块</li>
          <li>• <strong>子菜单</strong>：可以单独勾选，只显示特定的子功能</li>
          <li>• <strong>半选状态</strong>：表示只选择了部分子菜单</li>
          <li>• <strong>全选状态</strong>：表示选择了所有子菜单</li>
        </ul>
      </div>
    </div>
  );
};

export default TreePermissionSelector;
