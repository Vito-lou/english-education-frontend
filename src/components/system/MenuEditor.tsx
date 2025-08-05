import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
}

interface MenuEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (menuData: Partial<SystemMenu>) => void;
  menu?: SystemMenu | null;
  menus: SystemMenu[];
  loading?: boolean;
}

const MenuEditor: React.FC<MenuEditorProps> = ({
  open,
  onClose,
  onSave,
  menu,
  menus,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<SystemMenu>>({
    name: '',
    code: '',
    path: '',
    icon: '',
    parent_id: null,
    sort_order: 0,
    status: 'active',
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 图标选项
  const iconOptions = [
    { value: 'LayoutDashboard', label: '📊 仪表盘', emoji: '📊' },
    { value: 'Building2', label: '🏢 机构管理', emoji: '🏢' },
    { value: 'Users', label: '👥 用户管理', emoji: '👥' },
    { value: 'User', label: '👤 个人中心', emoji: '👤' },
    { value: 'Shield', label: '🛡️ 权限管理', emoji: '🛡️' },
    { value: 'GraduationCap', label: '🎓 学员管理', emoji: '🎓' },
    { value: 'BookOpen', label: '📚 课程管理', emoji: '📚' },
    { value: 'DollarSign', label: '💰 财务管理', emoji: '💰' },
    { value: 'Settings', label: '⚙️ 系统设置', emoji: '⚙️' },
    { value: 'FileText', label: '📄 文档管理', emoji: '📄' },
    { value: 'BarChart3', label: '📊 统计报表', emoji: '📊' },
    { value: 'Calendar', label: '📅 日程管理', emoji: '📅' },
  ];

  useEffect(() => {
    if (menu) {
      setFormData({
        name: menu.name,
        code: menu.code,
        path: menu.path,
        icon: menu.icon,
        parent_id: menu.parent_id,
        sort_order: menu.sort_order,
        status: menu.status,
        description: menu.description,
      });
    } else {
      // 新建时设置默认排序
      const maxSort = Math.max(...menus.map(m => m.sort_order), 0);
      setFormData({
        name: '',
        code: '',
        path: '',
        icon: 'FileText',
        parent_id: null,
        sort_order: maxSort + 1,
        status: 'active',
        description: '',
      });
    }
    setErrors({});
  }, [menu, menus, open]);

  const handleInputChange = (field: keyof SystemMenu, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '菜单名称不能为空';
    }

    if (!formData.code?.trim()) {
      newErrors.code = '菜单代码不能为空';
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.code)) {
      newErrors.code = '菜单代码只能包含字母、数字和下划线，且以字母或下划线开头';
    } else {
      // 检查代码是否重复
      const existingMenu = menus.find(m => m.code === formData.code && m.id !== menu?.id);
      if (existingMenu) {
        newErrors.code = '菜单代码已存在';
      }
    }

    if (formData.path && !/^\//.test(formData.path)) {
      newErrors.path = '访问路径必须以 / 开头';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    onSave(formData);
  };

  // 获取可选的父菜单（排除自己和自己的子菜单）
  const getAvailableParentMenus = (): SystemMenu[] => {
    if (!menu) return menus.filter(m => !m.parent_id); // 新建时只能选择顶级菜单作为父菜单

    // 编辑时排除自己和自己的子菜单
    return menus.filter(m =>
      m.id !== menu.id &&
      m.parent_id !== menu.id &&
      !m.parent_id // 只允许选择顶级菜单作为父菜单
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{menu ? '编辑菜单' : '新建菜单'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">菜单名称 *</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入菜单名称"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="code">菜单代码 *</Label>
            <Input
              id="code"
              value={formData.code || ''}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="请输入菜单代码，如：user_management"
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
            <p className="text-xs text-gray-500 mt-1">用于权限控制，只能包含字母、数字和下划线</p>
          </div>

          <div>
            <Label htmlFor="path">访问路径</Label>
            <Input
              id="path"
              value={formData.path || ''}
              onChange={(e) => handleInputChange('path', e.target.value)}
              placeholder="请输入访问路径，如：/user/management"
              className={errors.path ? 'border-red-500' : ''}
            />
            {errors.path && <p className="text-sm text-red-500 mt-1">{errors.path}</p>}
          </div>

          <div>
            <Label htmlFor="icon">菜单图标</Label>
            <Select
              value={formData.icon || ''}
              onValueChange={(value) => handleInputChange('icon', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择菜单图标" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="parent_id">父菜单</Label>
            <Select
              value={formData.parent_id?.toString() || 'none'}
              onValueChange={(value) => handleInputChange('parent_id', value === 'none' ? null : parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择父菜单（可选）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无（顶级菜单）</SelectItem>
                {getAvailableParentMenus().map(parentMenu => (
                  <SelectItem key={parentMenu.id} value={parentMenu.id.toString()}>
                    {parentMenu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sort_order">排序</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order || 0}
              onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
              placeholder="排序号，数字越小越靠前"
            />
          </div>

          <div>
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入菜单描述（可选）"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MenuEditor;
