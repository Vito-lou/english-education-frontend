import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { OrganizationNode } from '@/lib/api';
import { getNodeIcon, getNodeTypeName, getStatusName, getStatusBadgeVariant } from '@/hooks/useOrganization';
import { cn } from '@/lib/utils';

interface TreeNodeProps {
  node: OrganizationNode;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (node: OrganizationNode) => void;
  onToggleExpand: (nodeId: number) => void;
  onAddChild: (parentNode: OrganizationNode) => void;
  onEdit: (node: OrganizationNode) => void;
  onDelete: (node: OrganizationNode) => void;
  onMove?: (node: OrganizationNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  onMove,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  };

  const handleSelect = () => {
    onSelect(node);
  };

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddChild(node);
  };

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onEdit(node);
  };

  const handleDelete = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onDelete(node);
  };

  const handleMove = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onMove?.(node);
  };

  return (
    <div className="select-none">
      {/* 节点内容 */}
      <div
        className={cn(
          'flex items-center gap-2 py-2 px-3 rounded-md transition-colors',
          'hover:bg-gray-50',
          level > 0 && 'ml-6'
        )}
        style={{ paddingLeft: `${level * 24 + 12}px` }}

        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 展开/收起按钮 */}
        <div className="w-4 h-4 flex items-center justify-center">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-gray-200"
              onClick={handleToggleExpand}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </Button>
          ) : (
            <div className="w-3 h-3" />
          )}
        </div>

        {/* 节点图标 */}
        <span className="text-lg">{getNodeIcon(node.type)}</span>

        {/* 节点名称 */}
        <span className="font-medium text-gray-900 flex-1">
          {node.name}
        </span>

        {/* 节点类型标签 */}
        <Badge variant="outline" className="text-xs">
          {getNodeTypeName(node.type)}
        </Badge>

        {/* 状态标签 */}
        <Badge variant={getStatusBadgeVariant(node.status)} className="text-xs">
          {getStatusName(node.status)}
        </Badge>

        {/* 操作按钮 */}
        {isHovered && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 hover:bg-blue-100"
              onClick={handleAddChild}
              title="添加子节点"
            >
              <Plus className="w-3 h-3" />
            </Button>



            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 hover:bg-green-100"
              onClick={handleEdit}
              title="编辑"
            >
              <Edit className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 hover:bg-red-100"
              onClick={handleDelete}
              title="删除"
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </Button>
          </div>
        )}
      </div>

      {/* 子节点渲染由父组件处理 */}
    </div>
  );
};

export default TreeNode;
