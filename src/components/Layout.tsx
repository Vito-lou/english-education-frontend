import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import {
  LogOut,
  Menu,
  X,
  User
} from 'lucide-react';
import DynamicNavigation from '@/components/DynamicNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    // 清除所有 React Query 缓存
    queryClient.clear();

    // 执行登出
    logout();

    // 跳转到登录页
    navigate('/login');
  };

  // 移除硬编码的导航，使用动态导航

  return (
    <div className="h-screen flex bg-gray-50">
      {/* 移动端侧边栏遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* 侧边栏 */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* 侧边栏内容容器 - 使用 flex 布局占满高度 */}
        <div className="h-full flex flex-col">
          {/* 侧边栏头部 */}
          <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
            <h1 className="text-xl font-semibold text-gray-900">
              {import.meta.env.VITE_APP_NAME}
            </h1>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* 导航菜单区域 - 可滚动，占据剩余空间 */}
          <nav className="flex-1 overflow-y-auto px-3 py-6">
            <div onClick={() => setSidebarOpen(false)}>
              <DynamicNavigation />
            </div>
          </nav>

          {/* 用户信息 - 固定在底部 */}
          <div className="flex-shrink-0 p-4 border-t bg-gray-50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ml-2 flex-shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 移动端顶部导航栏 */}
        <header className="lg:hidden bg-white shadow-sm border-b flex-shrink-0">
          <div className="px-4 sm:px-6">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {import.meta.env.VITE_APP_NAME}
              </h1>
              <div className="w-6" />
            </div>
          </div>
        </header>

        {/* 页面内容 - 可滚动 */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
