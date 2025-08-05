import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Search, Settings, Shield } from 'lucide-react';

interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  institution_id: number | null;
  is_system: boolean;
  status: string;
}

interface RoleListProps {
  roles: Role[];
  selectedRoleId: number | null;
  onRoleSelect: (roleId: number) => void;
  isCreating: boolean;
}

const RoleList: React.FC<RoleListProps> = ({
  roles,
  selectedRoleId,
  onRoleSelect,
  isCreating,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({
    custom: true,
    system: true,
  });

  // 过滤角色
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 分组角色
  const customRoles = filteredRoles.filter((role) => !role.is_system);
  const systemRoles = filteredRoles.filter((role) => role.is_system);

  const toggleGroup = (group: 'custom' | 'system') => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const RoleItem: React.FC<{ role: Role }> = ({ role }) => {
    const isSelected = selectedRoleId === role.id;
    
    return (
      <div
        className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'hover:bg-gray-50'
        }`}
        onClick={() => onRoleSelect(role.id)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{role.name}</span>
            {role.is_system && (
              <Badge variant="secondary" className="text-xs">
                系统
              </Badge>
            )}
          </div>
          {role.description && (
            <p className="text-sm text-gray-500 truncate mt-1">
              {role.description}
            </p>
          )}
        </div>
        {isSelected && (
          <div className="ml-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>
    );
  };

  const GroupHeader: React.FC<{
    title: string;
    icon: React.ReactNode;
    count: number;
    expanded: boolean;
    onToggle: () => void;
  }> = ({ title, icon, count, expanded, onToggle }) => (
    <div
      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 rounded-lg"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
        {icon}
        <span className="font-medium text-gray-900">{title}</span>
        <Badge variant="outline" className="text-xs">
          {count}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="搜索角色..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 创建状态提示 */}
      {isCreating && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span className="font-medium text-blue-700">创建新角色</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            正在创建新的角色...
          </p>
        </div>
      )}

      {/* 自定义角色组 */}
      <div className="space-y-2">
        <GroupHeader
          title="自定义角色"
          icon={<Settings className="w-4 h-4 text-gray-600" />}
          count={customRoles.length}
          expanded={expandedGroups.custom}
          onToggle={() => toggleGroup('custom')}
        />
        
        {expandedGroups.custom && (
          <div className="space-y-1 ml-6">
            {customRoles.length > 0 ? (
              customRoles.map((role) => (
                <RoleItem key={role.id} role={role} />
              ))
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                {searchTerm ? '没有找到匹配的自定义角色' : '暂无自定义角色'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 系统角色组 */}
      <div className="space-y-2">
        <GroupHeader
          title="系统角色"
          icon={<Shield className="w-4 h-4 text-gray-600" />}
          count={systemRoles.length}
          expanded={expandedGroups.system}
          onToggle={() => toggleGroup('system')}
        />
        
        {expandedGroups.system && (
          <div className="space-y-1 ml-6">
            {systemRoles.length > 0 ? (
              systemRoles.map((role) => (
                <RoleItem key={role.id} role={role} />
              ))
            ) : (
              <div className="p-3 text-center text-gray-500 text-sm">
                {searchTerm ? '没有找到匹配的系统角色' : '暂无系统角色'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 无结果提示 */}
      {searchTerm && filteredRoles.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>没有找到匹配的角色</p>
          <p className="text-sm mt-1">尝试使用不同的关键词搜索</p>
        </div>
      )}
    </div>
  );
};

export default RoleList;
