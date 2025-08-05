import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

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

interface UserPermission {
  id: number;
  name: string;
  code: string;
  type: string;
  menu_id: number;
}

// 获取用户的菜单权限
export const useUserMenus = () => {
  const { user } = useAuthStore();

  // 获取用户权限
  const { data: permissionsData } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      const response = await api.get("/user/permissions");
      return response.data;
    },
    enabled: !!user?.id, // 只有在用户ID存在时才执行查询
  });

  // 获取系统菜单树
  const { data: menusData, isLoading: menusLoading } = useQuery({
    queryKey: ["system-menus-tree", user?.id],
    queryFn: async () => {
      const response = await api.get("/admin/system-menus");
      return response.data;
    },
    enabled: !!user?.id, // 只有在用户ID存在时才执行查询
  });

  const userPermissions: UserPermission[] = permissionsData?.data || [];
  const allMenus: SystemMenu[] = menusData?.data || [];

  // 获取用户有权限的菜单代码
  const userPermissionCodes = userPermissions.map((p) => p.code);

  // 过滤用户有权限的菜单
  const filterMenusByPermissions = (menus: SystemMenu[]): SystemMenu[] => {
    return menus
      .map((menu) => ({
        ...menu,
        children_items: menu.children_items
          ? filterMenusByPermissions(menu.children_items)
          : [],
      }))
      .filter((menu) => {
        // 如果是父菜单，只要有子菜单权限就显示
        if (menu.children_items && menu.children_items.length > 0) {
          return menu.children_items.length > 0;
        }
        // 叶子菜单：必须有权限才显示
        return userPermissionCodes.includes(menu.code);
      });
  };

  const userMenus = filterMenusByPermissions(allMenus);

  return {
    userMenus,
    isLoading: menusLoading,
    userPermissions,
    hasPermission: (menuCode: string) => userPermissionCodes.includes(menuCode),
  };
};

// 图标映射
export const getMenuIcon = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    LayoutDashboard: "📊",
    Building2: "🏢",
    Users: "👥",
    User: "👤",
    Shield: "🛡️",
    GraduationCap: "🎓",
    BookOpen: "📚",
    DollarSign: "💰",
    Settings: "⚙️",
    FileText: "📄",
    BarChart3: "📊",
    Calendar: "📅",
  };
  return iconMap[iconName] || "📄";
};
