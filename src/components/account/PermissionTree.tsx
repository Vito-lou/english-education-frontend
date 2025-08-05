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

interface PermissionTreeProps {
  permissions: Permission[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  disabled?: boolean;
}

const PermissionTree: React.FC<PermissionTreeProps> = ({
  permissions,
  selectedIds,
  onChange,
  disabled = false,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // 初始化时展开所有节点
  useEffect(() => {
    const allParentIds = new Set<number>();
    const collectParentIds = (perms: Permission[]) => {
      perms.forEach(perm => {
        if (perm.children && perm.children.length > 0) {
          allParentIds.add(perm.id);
          collectParentIds(perm.children);
        }
      });
    };
    collectParentIds(permissions);
    setExpandedNodes(allParentIds);
  }, [permissions]);

  const toggleExpanded = (id: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getAllChildIds = (permission: Permission): number[] => {
    const ids = [permission.id];
    if (permission.children) {
      permission.children.forEach(child => {
        ids.push(...getAllChildIds(child));
      });
    }
    return ids;
  };

  const getParentIds = (permissionId: number, allPermissions: Permission[]): number[] => {
    const parentIds: number[] = [];

    const findParent = (perms: Permission[], targetId: number, currentParentId?: number): boolean => {
      for (const perm of perms) {
        if (perm.id === targetId) {
          if (currentParentId) {
            parentIds.push(currentParentId);
          }
          return true;
        }
        if (perm.children && findParent(perm.children, targetId, perm.id)) {
          if (currentParentId) {
            parentIds.push(currentParentId);
          }
          return true;
        }
      }
      return false;
    };

    findParent(allPermissions, permissionId);
    return parentIds;
  };

  const isIndeterminate = (permission: Permission): boolean => {
    if (!permission.children || permission.children.length === 0) {
      return false;
    }

    const childIds = getAllChildIds(permission).filter(id => id !== permission.id);
    const selectedChildIds = childIds.filter(id => selectedIds.includes(id));

    return selectedChildIds.length > 0 && selectedChildIds.length < childIds.length;
  };

  const isChecked = (permission: Permission): boolean => {
    if (permission.children && permission.children.length > 0) {
      const childIds = getAllChildIds(permission).filter(id => id !== permission.id);
      return childIds.length > 0 && childIds.every(id => selectedIds.includes(id));
    }
    return selectedIds.includes(permission.id);
  };

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    if (disabled) return;

    const allChildIds = getAllChildIds(permission);
    let newSelectedIds = [...selectedIds];

    if (checked) {
      // 选中：添加当前节点和所有子节点
      allChildIds.forEach(id => {
        if (!newSelectedIds.includes(id)) {
          newSelectedIds.push(id);
        }
      });

      // 检查是否需要选中父节点
      const parentIds = getParentIds(permission.id, permissions);
      parentIds.forEach(parentId => {
        const parentPerm = findPermissionById(permissions, parentId);
        if (parentPerm && parentPerm.children) {
          const siblingIds = getAllChildIds(parentPerm).filter(id => id !== parentId);
          if (siblingIds.every(id => newSelectedIds.includes(id))) {
            if (!newSelectedIds.includes(parentId)) {
              newSelectedIds.push(parentId);
            }
          }
        }
      });
    } else {
      // 取消选中：移除当前节点和所有子节点
      allChildIds.forEach(id => {
        newSelectedIds = newSelectedIds.filter(selectedId => selectedId !== id);
      });

      // 取消选中父节点
      const parentIds = getParentIds(permission.id, permissions);
      parentIds.forEach(parentId => {
        newSelectedIds = newSelectedIds.filter(selectedId => selectedId !== parentId);
      });
    }

    onChange(newSelectedIds);
  };

  const findPermissionById = (perms: Permission[], id: number): Permission | null => {
    for (const perm of perms) {
      if (perm.id === id) {
        return perm;
      }
      if (perm.children) {
        const found = findPermissionById(perm.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const PermissionNode: React.FC<{ permission: Permission; level: number }> = ({
    permission,
    level
  }) => {
    const hasChildren = permission.children && permission.children.length > 0;
    const isExpanded = expandedNodes.has(permission.id);
    const checked = isChecked(permission);
    const indeterminate = isIndeterminate(permission);

    return (
      <div className="space-y-1">
        <div
          className={`flex items-center gap-2 py-2 px-2 rounded hover:bg-gray-50 ${level > 0 ? 'ml-' + (level * 4) : ''
            }`}
          style={{ marginLeft: level * 16 }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(permission.id)}
              className="flex items-center justify-center w-4 h-4 text-gray-500 hover:text-gray-700"
              disabled={disabled}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4" />
          )}

          <Checkbox
            checked={checked}
            indeterminate={indeterminate}
            onCheckedChange={(checked) =>
              handlePermissionChange(permission, checked as boolean)
            }
            disabled={disabled}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />

          <label
            className={`text-sm cursor-pointer select-none ${disabled ? 'text-gray-400' : 'text-gray-700'
              } ${checked ? 'font-medium' : ''}`}
            onClick={() => !disabled && handlePermissionChange(permission, !checked)}
          >
            {permission.name}
          </label>

          {permission.type && (
            <span className="text-xs text-gray-400 ml-auto">
              {permission.type}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {permission.children!.map(child => (
              <PermissionNode
                key={child.id}
                permission={child}
                level={level + 1}
              />
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
    <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
      {permissions.map(permission => (
        <PermissionNode
          key={permission.id}
          permission={permission}
          level={0}
        />
      ))}
    </div>
  );
};

export default PermissionTree;
