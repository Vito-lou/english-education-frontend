import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Organization from '@/pages/Organization'
import Account from '@/pages/Account'
import SystemMenu from '@/pages/SystemMenu'
import Debug from '@/pages/Debug'
import CheckboxTest from '@/pages/CheckboxTest'
import Courses from '@/pages/academic/Courses'
import CourseDetail from '@/pages/academic/CourseDetail'
import Students from '@/pages/academic/Students'
import StudentDetail from '@/pages/academic/StudentDetail'
import Orders from '@/pages/finance/Orders'
import Classes from '@/pages/academic/Classes'
import ClassDetail from '@/pages/academic/ClassDetail'
import LessonArrangements from '@/pages/parent-interaction/LessonArrangements'
import HomeworkAssignments from '@/pages/parent-interaction/HomeworkAssignments'
import LessonComments from '@/pages/parent-interaction/LessonComments'
import TestManualAttendance from '@/pages/TestManualAttendance'

import PlaceholderPage from '@/components/PlaceholderPage'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { ToastProvider } from '@/components/ui/toast'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/organization"
            element={
              <ProtectedRoute>
                <Layout>
                  <Organization />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/accounts"
            element={
              <ProtectedRoute>
                <Layout>
                  <Account />
                </Layout>
              </ProtectedRoute>
            }
          />
          {/* 教务中心 */}
          <Route
            path="/academic/students"
            element={
              <ProtectedRoute>
                <Layout>
                  <Students />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/students/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <StudentDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/classes"
            element={
              <ProtectedRoute>
                <Layout>
                  <Classes />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/classes/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ClassDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/academic/teachers"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="教师管理"
                    description="管理教师信息和教学安排"
                    icon="👨‍🏫"
                    features={["教师档案", "资质管理", "课程分配", "绩效考核"]}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 财务中心路由 */}
          <Route
            path="/finance/orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <Orders />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/academic/courses"
            element={
              <ProtectedRoute>
                <Layout>
                  <Courses />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/courses/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <CourseDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/records"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="上课记录"
                    description="记录和管理课堂教学情况"
                    icon="📝"
                    features={["考勤记录", "课堂表现", "作业布置", "教学反馈"]}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 家校互动 */}
          <Route
            path="/parent-interaction/lesson-arrangements"
            element={
              <ProtectedRoute>
                <Layout>
                  <LessonArrangements />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent-interaction/homework"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomeworkAssignments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent-interaction/comments"
            element={
              <ProtectedRoute>
                <Layout>
                  <LessonComments />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/family-school/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="成绩单"
                    description="生成和管理学生成绩报告"
                    icon="📊"
                    features={["成绩录入", "报告生成", "趋势分析", "家长查看"]}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/family-school/growth"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="成长档案"
                    description="记录学生成长历程和发展轨迹"
                    icon="🌱"
                    features={["成长记录", "能力评估", "发展建议", "档案分享"]}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 机构设置 */}
          <Route
            path="/institution/organization"
            element={
              <ProtectedRoute>
                <Layout>
                  <Organization />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/accounts"
            element={
              <ProtectedRoute>
                <Layout>
                  <Account />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/display"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="机构展示"
                    description="管理机构对外展示信息"
                    icon="🏢"
                    features={["机构介绍", "师资展示", "课程介绍", "成果展示"]}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 营销中心 */}
          <Route
            path="/marketing"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="营销中心"
                    description="招生推广和营销活动管理"
                    icon="📈"
                    features={["招生活动", "推广渠道", "转化跟踪", "效果分析"]}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 财务中心 */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="财务中心"
                    description="财务收费和账务管理"
                    icon="💰"
                    features={["收费管理", "财务报表", "退费处理", "账务统计"]}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 应用中心 */}
          <Route
            path="/apps"
            element={
              <ProtectedRoute>
                <Layout>
                  <PlaceholderPage
                    title="应用中心"
                    description="扩展应用和系统工具"
                    icon="🔧"
                    features={["系统工具", "数据导入", "报表导出", "系统设置"]}
                  />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/apps/menu"
            element={
              <ProtectedRoute>
                <Layout>
                  <SystemMenu />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* 调试页面 */}
          <Route
            path="/debug"
            element={
              <ProtectedRoute>
                <Layout>
                  <Debug />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Checkbox 测试页面 */}
          <Route
            path="/checkbox-test"
            element={
              <ProtectedRoute>
                <Layout>
                  <CheckboxTest />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
            }
          />
        </Routes>
      </Router>
    </ToastProvider>
  )
}

export default App
