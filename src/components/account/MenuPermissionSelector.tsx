import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { getMenuIcon } from '@/hooks/useUserMenus';

interface SystemMenu {
  id: number;
  name: string;
  code: string;
  icon?: string;
  parent_id: number | null;
  children_items?: SystemMenu[];
}

interface MenuPermissionSelectorProps {
  menus: SystemMenu[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  disabled?: boolean;
}

const MenuPermissionSelector: React.FC<MenuPermissionSelectorProps> = ({
  menus,
  selectedIds,
  onChange,
  disabled = false,
}) => {
  // 获取菜单的选中状态
  const getMenuState = (menu: SystemMenu): { checked: boolean; indeterminate: boolean } => {
    const allChildIds = getAllChildIds(menu);
    const selectedCount = allChildIds.filter(id => selectedIds.includes(id)).length;

    if (selectedCount === 0) {
      return { checked: false, indeterminate: false };
    } else if (selectedCount === allChildIds.length) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  };

  // 获取菜单及其所有子菜单的ID
  const getAllChildIds = (menu: SystemMenu): number[] => {
    const ids = [menu.id];
    if (menu.children_items) {
      menu.children_items.forEach(child => {
        ids.push(...getAllChildIds(child));
      });
    }
    return ids;
  };

  // 处理菜单选择变化
  const handleMenuChange = (menu: SystemMenu, checked: boolean) => {
    if (disabled) return;

    const allChildIds = getAllChildIds(menu);
    let newSelectedIds = [...selectedIds];

    if (checked) {
      // 选中：添加所有子菜单
      allChildIds.forEach(id => {
        if (!newSelectedIds.includes(id)) {
          newSelectedIds.push(id);
        }
      });
    } else {
      // 取消选中：移除所有子菜单
      newSelectedIds = newSelectedIds.filter(id => !allChildIds.includes(id));
    }

    onChange(newSelectedIds);
  };

  // 渲染菜单项
  const renderMenuItem = (menu: SystemMenu, level = 0) => {
    const hasChildren = menu.children_items && menu.children_items.length > 0;
    const { checked, indeterminate } = getMenuState(menu);

    return (
      <div key={menu.id} className="space-y-2">
        {/* 菜单项 */}
        <div className="flex items-center space-x-2" style={{ paddingLeft: level * 16 }}>
          <Checkbox
            checked={checked}
            indeterminate={indeterminate}
            onCheckedChange={(checked) => handleMenuChange(menu, checked as boolean)}
            disabled={disabled}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <span className="text-lg">{getMenuIcon(menu.icon || '')}</span>
          <span className={`${level === 0 ? 'font-medium text-gray-900' : 'text-sm text-gray-700'}`}>
            {menu.name}
          </span>
        </div>

        {/* 子菜单 */}
        {hasChildren && (
          <div className="space-y-2">
            {menu.children_items!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // 按模块分组显示
  const renderMenuGroups = () => {
    const rootMenus = menus.filter(menu => !menu.parent_id);

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {rootMenus.map(menu => (
          <div key={menu.id} className="p-3">
            {renderMenuItem(menu)}
          </div>
        ))}
      </div>
    );
  };

  if (!menus || menus.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无菜单数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 菜单权限选择器 */}
      {renderMenuGroups()}
    </div>
  );
};

export default MenuPermissionSelector;
