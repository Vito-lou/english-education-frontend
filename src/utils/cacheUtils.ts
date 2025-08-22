import { QueryClient } from '@tanstack/react-query';

/**
 * 缓存刷新工具函数
 */
export class CacheUtils {
  /**
   * 刷新学员相关的所有缓存
   */
  static refreshStudentRelatedCache(queryClient: QueryClient, studentId?: number) {
    queryClient.invalidateQueries({ queryKey: ['students'] }); // 学员列表
    queryClient.invalidateQueries({ queryKey: ['class-students'] }); // 班级学员列表
    queryClient.invalidateQueries({ queryKey: ['student-classes'] }); // 学员班级关联
    queryClient.invalidateQueries({ queryKey: ['student-orders'] }); // 学员订单
    queryClient.invalidateQueries({ queryKey: ['enrollments'] }); // 订单列表
    
    if (studentId) {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] }); // 特定学员详情
    }
  }

  /**
   * 刷新班级相关的所有缓存
   */
  static refreshClassRelatedCache(queryClient: QueryClient, classId?: number) {
    queryClient.invalidateQueries({ queryKey: ['classes'] }); // 班级列表
    queryClient.invalidateQueries({ queryKey: ['class-students'] }); // 班级学员列表
    queryClient.invalidateQueries({ queryKey: ['class-schedules'] }); // 班级排课
    queryClient.invalidateQueries({ queryKey: ['class-attendance-records'] }); // 点名记录
    
    if (classId) {
      queryClient.invalidateQueries({ queryKey: ['class', classId] }); // 特定班级详情
      queryClient.invalidateQueries({ queryKey: ['class-students', classId] }); // 特定班级学员
      queryClient.invalidateQueries({ queryKey: ['class-schedules', classId] }); // 特定班级排课
      queryClient.invalidateQueries({ queryKey: ['class-attendance-records', classId] }); // 特定班级点名记录
    }
  }

  /**
   * 刷新订单相关的所有缓存
   */
  static refreshOrderRelatedCache(queryClient: QueryClient) {
    queryClient.invalidateQueries({ queryKey: ['enrollments'] }); // 订单列表
    queryClient.invalidateQueries({ queryKey: ['student-orders'] }); // 学员订单
  }

  /**
   * 退费后刷新所有相关缓存
   */
  static refreshAfterRefund(queryClient: QueryClient, studentId?: number, classId?: number) {
    // 刷新学员相关缓存
    this.refreshStudentRelatedCache(queryClient, studentId);
    
    // 刷新班级相关缓存
    this.refreshClassRelatedCache(queryClient, classId);
    
    // 刷新订单相关缓存
    this.refreshOrderRelatedCache(queryClient);
  }

  /**
   * 点名后刷新相关缓存
   */
  static refreshAfterAttendance(queryClient: QueryClient, classId: number) {
    queryClient.invalidateQueries({ queryKey: ['class-schedules', classId] }); // 班级排课状态
    queryClient.invalidateQueries({ queryKey: ['class-attendance-records', classId] }); // 点名记录
  }

  /**
   * 清除所有缓存（谨慎使用）
   */
  static clearAllCache(queryClient: QueryClient) {
    queryClient.clear();
  }
}
