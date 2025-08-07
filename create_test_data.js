// 创建测试数据的脚本
const API_BASE_URL = 'http://english-education-api.test/api';

// 模拟登录获取token
async function login() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password'
      })
    });

    const data = await response.json();
    if (data.success) {
      return data.data.token;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// 创建机构
async function createInstitution(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/institutions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: '英语教育培训中心',
        code: 'EETC001',
        description: '专业的英语教育培训机构，致力于提供高质量的英语教学服务',
        contact_person: '张校长',
        contact_phone: '13800138000',
        contact_email: 'admin@eetc.com',
        address: '北京市朝阳区教育大厦1-3层',
        business_license: 'BL123456789',
        business_hours: {
          monday: ['09:00', '21:00'],
          tuesday: ['09:00', '21:00'],
          wednesday: ['09:00', '21:00'],
          thursday: ['09:00', '21:00'],
          friday: ['09:00', '21:00'],
          saturday: ['09:00', '18:00'],
          sunday: ['09:00', '18:00'],
        },
        settings: {
          max_class_size: 12,
          booking_advance_days: 7,
          cancellation_hours: 24,
        },
        status: 'active',
        established_at: '2020-01-01'
      })
    });

    const data = await response.json();
    if (data.success) {
      console.log('Institution created:', data.data);
      return data.data;
    } else {
      throw new Error('Institution creation failed');
    }
  } catch (error) {
    console.error('Institution creation error:', error);
    return null;
  }
}

// 创建部门
async function createDepartment(token, institutionId, departmentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/departments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        institution_id: institutionId,
        ...departmentData
      })
    });

    const data = await response.json();
    if (data.success) {
      console.log('Department created:', data.data);
      return data.data;
    } else {
      throw new Error('Department creation failed');
    }
  } catch (error) {
    console.error('Department creation error:', error);
    return null;
  }
}

// 主函数
async function main() {
  console.log('Starting test data creation...');

  // 1. 登录
  const token = await login();
  if (!token) {
    console.error('Failed to login');
    return;
  }
  console.log('Login successful');

  // 2. 创建机构
  const institution = await createInstitution(token);
  if (!institution) {
    console.error('Failed to create institution');
    return;
  }

  // 3. 创建朝阳校区
  const chaoyangCampus = await createDepartment(token, institution.id, {
    name: '朝阳校区',
    code: 'CAMPUS_CY',
    type: 'campus',
    description: '主校区，位于朝阳区教育大厦',
    manager_name: '李主任',
    manager_phone: '13800138001',
    address: '北京市朝阳区教育大厦1-3层',
    sort_order: 1,
    status: 'active'
  });

  if (chaoyangCampus) {
    // 4. 创建教学部
    const teachingDept = await createDepartment(token, institution.id, {
      parent_id: chaoyangCampus.id,
      name: '教学部',
      code: 'DEPT_TEACH',
      type: 'department',
      description: '负责教学管理和课程安排',
      manager_name: '王老师',
      manager_phone: '13800138002',
      sort_order: 1,
      status: 'active'
    });



    // 7. 创建销售部
    await createDepartment(token, institution.id, {
      parent_id: chaoyangCampus.id,
      name: '销售部',
      code: 'DEPT_SALES',
      type: 'department',
      description: '负责招生和客户服务',
      manager_name: '赵经理',
      manager_phone: '13800138003',
      sort_order: 2,
      status: 'active'
    });
  }

  // 8. 创建海淀校区
  const haidianCampus = await createDepartment(token, institution.id, {
    name: '海淀校区',
    code: 'CAMPUS_HD',
    type: 'campus',
    description: '分校区，位于海淀区',
    manager_name: '陈主任',
    manager_phone: '13800138004',
    address: '北京市海淀区学院路',
    sort_order: 2,
    status: 'active'
  });

  if (haidianCampus) {
    // 9. 创建海淀教学部
    await createDepartment(token, institution.id, {
      parent_id: haidianCampus.id,
      name: '教学部',
      code: 'DEPT_TEACH_HD',
      type: 'department',
      description: '海淀校区教学部',
      manager_name: '刘老师',
      manager_phone: '13800138005',
      sort_order: 1,
      status: 'active'
    });
  }

  console.log('Test data creation completed!');
}

// 运行脚本
main().catch(console.error);
