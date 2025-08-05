import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useUserMenus, getMenuIcon } from '@/hooks/useUserMenus';

interface SystemMenu {
  id: number;
  name: string;
  code: string;
  path: string;
  icon: string;
  parent_id: number | null;
  sort_order: number;
  status: string;
  description: string;
  children_items?: SystemMenu[];
}

const DynamicNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userMenus, isLoading, userPermissions } = useUserMenus();
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());
  const [manuallyCollapsed, setManuallyCollapsed] = useState<Set<number>>(new Set());

  // 调试信息
  console.log('DynamicNavigation - userMenus:', userMenus);
  console.log('DynamicNavigation - userPermissions:', userPermissions);

  const toggleExpanded = (menuId: number) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
        // 记录用户手动收起了这个菜单
        setManuallyCollapsed(collapsed => new Set(collapsed).add(menuId));
      } else {
        newSet.add(menuId);
        // 移除手动收起的记录
        setManuallyCollapsed(collapsed => {
          const newCollapsed = new Set(collapsed);
          newCollapsed.delete(menuId);
          return newCollapsed;
        });
      }
      return newSet;
    });
  };

  const handleMenuClick = (menu: SystemMenu) => {
    const hasChildren = menu.children_items && menu.children_items.length > 0;

    if (hasChildren) {
      // 如果有子菜单，切换展开状态
      toggleExpanded(menu.id);
    } else if (menu.path) {
      // 如果没有子菜单且有路径，才进行路由跳转
      navigate(menu.path);
    }
  };

  const isMenuActive = (menu: SystemMenu): boolean => {
    // 只有当前路径完全匹配菜单路径时才高亮
    return menu.path && location.pathname === menu.path;
  };

  // 检查菜单是否应该自动展开（子菜单中有激活的）
  const shouldAutoExpand = (menu: SystemMenu): boolean => {
    if (menu.children_items) {
      return menu.children_items.some(child =>
        isMenuActive(child) || shouldAutoExpand(child)
      );
    }
    return false;
  };

  const renderMenuItem = (menu: SystemMenu, level = 0) => {
    const hasChildren = menu.children_items && menu.children_items.length > 0;
    const shouldAutoExpandMenu = shouldAutoExpand(menu);
    const isManuallyExpanded = expandedMenus.has(menu.id);
    const isManuallyCollapsedMenu = manuallyCollapsed.has(menu.id);

    // 展开逻辑：
    // 1. 如果用户手动收起过，则不展开（即使应该自动展开）
    // 2. 如果用户手动展开过，则展开
    // 3. 如果没有手动操作过，且应该自动展开，则展开
    const isExpanded = !isManuallyCollapsedMenu && (isManuallyExpanded || shouldAutoExpandMenu);

    const isActive = isMenuActive(menu);

    return (
      <div key={menu.id} className="space-y-1">
        <button
          onClick={() => handleMenuClick(menu)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${isActive
            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
            : hasChildren
              ? 'text-gray-700 hover:bg-gray-50' // 父菜单样式更轻
              : 'text-gray-700 hover:bg-gray-100' // 叶子菜单正常悬停
            } ${level > 0 ? 'ml-4' : ''}`}
          style={{ paddingLeft: level > 0 ? `${12 + level * 16}px` : '12px' }}
        >
          {/* 展开/折叠图标 */}
          {hasChildren ? (
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </span>
          ) : (
            <span className="w-4 h-4" />
          )}

          {/* 菜单图标 */}
          <span className="flex-shrink-0 text-lg">
            {getMenuIcon(menu.icon)}
          </span>

          {/* 菜单名称 */}
          <span className="flex-1 text-sm font-medium truncate">
            {menu.name}
          </span>
        </button>

        {/* 子菜单 */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {menu.children_items!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!userMenus || userMenus.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">暂无可访问的菜单</p>
      </div>
    );
  }

  return (
    <nav className="space-y-1">
      {userMenus.map(menu => renderMenuItem(menu))}
    </nav>
  );
};

export default DynamicNavigation;
