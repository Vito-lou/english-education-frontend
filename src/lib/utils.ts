import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T = any> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

// 格式化日期
export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

// 格式化时间
export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
