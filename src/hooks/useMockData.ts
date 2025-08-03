import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";

// 模拟机构数据
const mockInstitution = {
  id: 1,
  name: "英语教育培训中心",
  code: "EETC001",
  logo: undefined,
  description: "专业的英语教育培训机构，致力于提供高质量的英语教学服务",
  contact_person: "张校长",
  contact_phone: "13800138000",
  contact_email: "admin@eetc.com",
  address: "北京市朝阳区教育大厦1-3层",
  business_license: "BL123456789",
  business_hours: {
    monday: ["09:00", "21:00"],
    tuesday: ["09:00", "21:00"],
    wednesday: ["09:00", "21:00"],
    thursday: ["09:00", "21:00"],
    friday: ["09:00", "21:00"],
    saturday: ["09:00", "18:00"],
    sunday: ["09:00", "18:00"],
  },
  settings: {
    max_class_size: 12,
    booking_advance_days: 7,
    cancellation_hours: 24,
  },
  status: "active" as const,
  established_at: "2020-01-01",
  created_at: "2020-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// 模拟部门数据
const mockDepartments = [
  {
    id: 1,
    institution_id: 1,
    parent_id: undefined,
    name: "朝阳校区",
    code: "CAMPUS_CY",
    type: "campus" as const,
    description: "主校区，位于朝阳区教育大厦",
    manager_name: "李主任",
    manager_phone: "13800138001",
    address: "北京市朝阳区教育大厦1-3层",
    capacity: undefined,
    facilities: undefined,
    sort_order: 1,
    status: "active" as const,
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    children: [
      {
        id: 2,
        institution_id: 1,
        parent_id: 1,
        name: "教学部",
        code: "DEPT_TEACH",
        type: "department" as const,
        description: "负责教学管理和课程安排",
        manager_name: "王老师",
        manager_phone: "13800138002",
        address: undefined,
        capacity: undefined,
        facilities: undefined,
        sort_order: 1,
        status: "active" as const,
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        children: [
          {
            id: 4,
            institution_id: 1,
            parent_id: 2,
            name: "教室A",
            code: "ROOM_A",
            type: "classroom" as const,
            description: "多媒体教室，适合小班教学",
            manager_name: undefined,
            manager_phone: undefined,
            address: undefined,
            capacity: 12,
            facilities: ["投影仪", "白板", "音响", "空调"],
            sort_order: 1,
            status: "active" as const,
            created_at: "2020-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            children: [],
          },
          {
            id: 5,
            institution_id: 1,
            parent_id: 2,
            name: "教室B",
            code: "ROOM_B",
            type: "classroom" as const,
            description: "标准教室，适合中班教学",
            manager_name: undefined,
            manager_phone: undefined,
            address: undefined,
            capacity: 16,
            facilities: ["投影仪", "白板", "音响"],
            sort_order: 2,
            status: "active" as const,
            created_at: "2020-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
            children: [],
          },
        ],
      },
      {
        id: 3,
        institution_id: 1,
        parent_id: 1,
        name: "销售部",
        code: "DEPT_SALES",
        type: "department" as const,
        description: "负责招生和客户服务",
        manager_name: "赵经理",
        manager_phone: "13800138003",
        address: undefined,
        capacity: undefined,
        facilities: undefined,
        sort_order: 2,
        status: "active" as const,
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        children: [],
      },
    ],
  },
  {
    id: 6,
    institution_id: 1,
    parent_id: undefined,
    name: "海淀校区",
    code: "CAMPUS_HD",
    type: "campus" as const,
    description: "分校区，位于海淀区",
    manager_name: "陈主任",
    manager_phone: "13800138004",
    address: "北京市海淀区学院路",
    capacity: undefined,
    facilities: undefined,
    sort_order: 2,
    status: "active" as const,
    created_at: "2020-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    children: [
      {
        id: 7,
        institution_id: 1,
        parent_id: 6,
        name: "教学部",
        code: "DEPT_TEACH_HD",
        type: "department" as const,
        description: "海淀校区教学部",
        manager_name: "刘老师",
        manager_phone: "13800138005",
        address: undefined,
        capacity: undefined,
        facilities: undefined,
        sort_order: 1,
        status: "active" as const,
        created_at: "2020-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        children: [],
      },
    ],
  },
];

// 模拟当前机构hook
export const useMockCurrentInstitution = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["mock-current-institution"],
    queryFn: async () => {
      // 模拟API延迟
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockInstitution;
    },
    enabled: !!user?.institution_id || true, // 为了演示，总是启用
  });
};

// 模拟当前机构部门hook
export const useMockCurrentInstitutionDepartments = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ["mock-current-institution-departments"],
    queryFn: async () => {
      // 模拟API延迟
      await new Promise((resolve) => setTimeout(resolve, 800));
      return mockDepartments;
    },
    enabled: !!user?.institution_id || true, // 为了演示，总是启用
  });
};
