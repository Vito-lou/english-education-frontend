import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/auth'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'

export default function Dashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  // 获取用户信息的查询
  const { data: userInfo, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await api.get('/auth/user')
      return response.data.data
    },
  })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {import.meta.env.VITE_APP_NAME}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                欢迎，{user?.name}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 用户信息卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>用户信息</CardTitle>
                <CardDescription>当前登录用户的基本信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>姓名：</strong>{user?.name}</p>
                  <p><strong>邮箱：</strong>{user?.email}</p>
                  <p><strong>角色：</strong>{user?.role}</p>
                  <p><strong>系统权限：</strong></p>
                  <ul className="ml-4 space-y-1">
                    <li>• 离线访问：{user?.system_access?.offline ? '是' : '否'}</li>
                    <li>• 在线访问：{user?.system_access?.online ? '是' : '否'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 系统状态卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>系统状态</CardTitle>
                <CardDescription>当前系统运行状态</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>API状态：</strong><span className="text-green-600">正常</span></p>
                  <p><strong>数据库：</strong><span className="text-green-600">连接正常</span></p>
                  <p><strong>缓存：</strong><span className="text-green-600">运行中</span></p>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用功能快速入口</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    用户管理
                  </Button>
                  <Button className="w-full" variant="outline">
                    课程管理
                  </Button>
                  <Button className="w-full" variant="outline">
                    系统设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API测试区域 */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>API测试</CardTitle>
                <CardDescription>测试后端API连接</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">当前用户信息：</h4>
                    <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
                      {JSON.stringify(userInfo || user, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
