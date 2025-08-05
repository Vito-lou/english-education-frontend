import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import MenuEditor from '@/components/system/MenuEditor';

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

const SystemMenu: React.FC = () => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<SystemMenu | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<SystemMenu | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 获取菜单列表（平铺）
  const { data: menusData, isLoading } = useQuery({
    queryKey: ['system-menus-list'],
    queryFn: async () => {
      const response = await api.get('/admin/system-menus-list');
      return response.data;
    },
  });

  // 保存菜单（新建或更新）
  const saveMutation = useMutation({
    mutationFn: async (menuData: Partial<SystemMenu>) => {
      if (editingMenu) {
        const response = await api.put(`/admin/system-menus/${editingMenu.id}`, menuData);
        return response.data;
      } else {
        const response = await api.post('/admin/system-menus', menuData);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-menus-list'] });
      setEditorOpen(false);
      setEditingMenu(null);
      toast({
        title: editingMenu ? '更新成功' : '创建成功',
        description: editingMenu ? '菜单已更新' : '菜单已创建，对应权限已自动生成',
      });
    },
    onError: (error: any) => {
      toast({
        title: editingMenu ? '更新失败' : '创建失败',
        description: error.response?.data?.message || '操作失败',
        variant: 'destructive',
      });
    },
  });

  // 删除菜单
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/admin/system-menus/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-menus-list'] });
      toast({
        title: '删除成功',
        description: '菜单已删除',
      });
    },
    onError: (error: any) => {
      toast({
        title: '删除失败',
        description: error.response?.data?.message || '删除菜单时发生错误',
        variant: 'destructive',
      });
    },
  });

  const menus = menusData?.data || [];

  const handleDelete = (menu: SystemMenu) => {
    setMenuToDelete(menu);
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    if (menuToDelete) {
      deleteMutation.mutate(menuToDelete.id);
      setMenuToDelete(null);
      setShowConfirmDialog(false);
    }
  };

  const handleCreate = () => {
    setEditingMenu(null);
    setEditorOpen(true);
  };

  const handleEdit = (menu: SystemMenu) => {
    setEditingMenu(menu);
    setEditorOpen(true);
  };

  const handleSave = (menuData: Partial<SystemMenu>) => {
    saveMutation.mutate(menuData);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingMenu(null);
  };

  // 排序功能
  const handleMoveUp = async (menu: SystemMenu) => {
    const siblings = menus.filter(m => m.parent_id === menu.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = siblings.findIndex(m => m.id === menu.id);

    if (currentIndex > 0) {
      const prevMenu = siblings[currentIndex - 1];
      const tempSort = menu.sort_order;

      try {
        // 先更新当前菜单
        await api.put(`/admin/system-menus/${menu.id}`, {
          ...menu,
          sort_order: prevMenu.sort_order,
        });

        // 再更新前一个菜单
        await api.put(`/admin/system-menus/${prevMenu.id}`, {
          ...prevMenu,
          sort_order: tempSort,
        });

        // 刷新数据
        queryClient.invalidateQueries({ queryKey: ['system-menus-list'] });

        toast({
          title: '排序成功',
          description: '菜单顺序已调整',
        });
      } catch (error) {
        toast({
          title: '排序失败',
          description: '调整菜单顺序失败',
          variant: 'destructive',
        });
      }
    }
  };

  const handleMoveDown = async (menu: SystemMenu) => {
    const siblings = menus.filter(m => m.parent_id === menu.parent_id).sort((a, b) => a.sort_order - b.sort_order);
    const currentIndex = siblings.findIndex(m => m.id === menu.id);

    if (currentIndex < siblings.length - 1) {
      const nextMenu = siblings[currentIndex + 1];
      const tempSort = menu.sort_order;

      try {
        // 先更新当前菜单
        await api.put(`/admin/system-menus/${menu.id}`, {
          ...menu,
          sort_order: nextMenu.sort_order,
        });

        // 再更新下一个菜单
        await api.put(`/admin/system-menus/${nextMenu.id}`, {
          ...nextMenu,
          sort_order: tempSort,
        });

        // 刷新数据
        queryClient.invalidateQueries({ queryKey: ['system-menus-list'] });

        toast({
          title: '排序成功',
          description: '菜单顺序已调整',
        });
      } catch (error) {
        toast({
          title: '排序失败',
          description: '调整菜单顺序失败',
          variant: 'destructive',
        });
      }
    }
  };

  // 获取父菜单名称
  const getParentName = (parentId: number | null): string => {
    if (!parentId) return '-';
    const parent = menus.find((m: SystemMenu) => m.id === parentId);
    return parent ? parent.name : '-';
  };

  // 构建树形结构的菜单列表
  const buildTreeMenus = (menus: SystemMenu[]): SystemMenu[] => {
    const menuMap = new Map<number, SystemMenu>();
    const rootMenus: SystemMenu[] = [];

    // 创建菜单映射
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children_items: [] });
    });

    // 构建树形结构
    menus.forEach(menu => {
      const menuItem = menuMap.get(menu.id)!;
      if (menu.parent_id) {
        const parent = menuMap.get(menu.parent_id);
        if (parent) {
          parent.children_items = parent.children_items || [];
          parent.children_items.push(menuItem);
        }
      } else {
        rootMenus.push(menuItem);
      }
    });

    return rootMenus;
  };

  // 将树形结构展平为带层级信息的列表
  const flattenTreeMenus = (treeMenus: SystemMenu[], level = 0): Array<SystemMenu & { level: number }> => {
    const result: Array<SystemMenu & { level: number }> = [];

    treeMenus.forEach(menu => {
      result.push({ ...menu, level });
      if (menu.children_items && menu.children_items.length > 0) {
        result.push(...flattenTreeMenus(menu.children_items, level + 1));
      }
    });

    return result;
  };

  const treeMenus = buildTreeMenus(menus);
  const flatMenus = flattenTreeMenus(treeMenus);

  // 菜单图标映射
  const getMenuIcon = (icon: string): string => {
    const iconMap: Record<string, string> = {
      'LayoutDashboard': '📊',
      'Building2': '🏢',
      'Users': '👥',
      'User': '👤',
      'Shield': '🛡️',
      'GraduationCap': '🎓',
      'BookOpen': '📚',
      'DollarSign': '💰',
      'Settings': '⚙️',
    };
    return iconMap[icon] || '📄';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">菜单管理</h1>
          <p className="text-gray-600 mt-1">管理系统菜单结构和权限</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          新建菜单
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">菜单名称</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">访问路径</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">排序</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">操作</th>
              </tr>
            </thead>
            <tbody>
              {flatMenus.length > 0 ? (
                flatMenus.map((menu) => (
                  <tr key={menu.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: menu.level * 20 }}
                      >
                        {/* 层级指示器 */}
                        {menu.level > 0 && (
                          <span className="text-gray-400 mr-1">
                            {'└ '}
                          </span>
                        )}
                        <span className="text-lg">{getMenuIcon(menu.icon)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{menu.name}</div>
                          {menu.description && (
                            <div className="text-sm text-gray-500">{menu.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {menu.path || '无'}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{menu.sort_order}</span>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => handleMoveUp(menu)}
                            disabled={saveMutation.isPending}
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => handleMoveDown(menu)}
                            disabled={saveMutation.isPending}
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={menu.status === 'active' ? 'default' : 'secondary'}>
                        {menu.status === 'active' ? '正常' : '禁用'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(menu)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          编辑
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(menu)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    暂无菜单数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 说明信息 */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">菜单管理说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 新增菜单后，角色管理中会自动出现对应的功能权限选项</li>
          <li>• 删除菜单前请确保没有角色正在使用该菜单权限</li>
          <li>• 访问路径对应系统中的页面地址</li>
          <li>• 子菜单会显示在对应父菜单下方</li>
        </ul>
      </Card>

      {/* 菜单编辑弹窗 */}
      <MenuEditor
        open={editorOpen}
        onClose={handleCloseEditor}
        onSave={handleSave}
        menu={editingMenu}
        menus={menus}
        loading={saveMutation.isPending}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="确认删除菜单"
        description={
          menuToDelete
            ? `确定要删除菜单 "${menuToDelete.name}" 吗？删除后对应的功能权限也将被移除，此操作不可撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => {
          setMenuToDelete(null);
          setShowConfirmDialog(false);
        }}
      />
    </div>
  );
};

export default SystemMenu;
