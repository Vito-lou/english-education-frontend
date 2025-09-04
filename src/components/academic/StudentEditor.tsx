import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { Search, Link, Unlink } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  phone?: string;
  gender?: 'male' | 'female';
  birth_date?: string;
  parent_name: string;
  parent_phone: string;
  parent_relationship: string;
  student_type: 'potential' | 'trial' | 'enrolled' | 'graduated' | 'suspended';
  follow_up_status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'follow_up';
  intention_level: 'high' | 'medium' | 'low';
  source?: string;
  remarks?: string;
  status: 'active' | 'inactive';
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface StudentEditorProps {
  open: boolean;
  onClose: () => void;
  student?: Student | null;
  onSuccess?: () => void;
}

const StudentEditor: React.FC<StudentEditorProps> = ({
  open,
  onClose,
  student,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    birth_date: '',
    parent_name: '',
    parent_phone: '',
    parent_relationship: 'mother',
    student_type: 'potential',
    follow_up_status: 'new',
    intention_level: 'medium',
    source: '',
    remarks: '',
    status: 'active',
    create_parent_account: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: number, name: string, email: string } | null | undefined>(undefined);

  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // 获取可创建的学员类型
  const { data: creatableTypesData } = useQuery({
    queryKey: ['student-creatable-types'],
    queryFn: async () => {
      const response = await api.get('/admin/students/creatable-types');
      return response.data.data;
    },
  });

  // 搜索用户
  const { data: usersData, isLoading: isSearchingUsers } = useQuery({
    queryKey: ['users-search', userSearchQuery],
    queryFn: async () => {
      if (!userSearchQuery.trim()) return { data: [] };
      const response = await api.get(`/admin/users?search=${encodeURIComponent(userSearchQuery)}&per_page=10`);
      return response.data;
    },
    enabled: showUserSearch && userSearchQuery.length > 0,
  });

  // 获取所有用户（用于初始显示）
  const { data: allUsersData } = useQuery({
    queryKey: ['users-all'],
    queryFn: async () => {
      const response = await api.get('/admin/users?per_page=20');
      console.log('获取所有用户响应:', response.data); // 调试信息
      return response.data;
    },
    enabled: showUserSearch && !userSearchQuery.trim(),
  });

  // 保存学员
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (student) {
        const response = await api.put(`/admin/students/${student.id}`, data);
        return response.data;
      } else {
        const response = await api.post('/admin/students', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['students-statistics'] });
      onClose();
      addToast({
        type: 'success',
        title: student ? '更新成功' : '创建成功',
        description: student ? '学员信息已更新' : '学员已创建',
      });
      // 调用外部传入的成功回调
      onSuccess?.();
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: student ? '更新失败' : '创建失败',
        description: error.response?.data?.message || '操作失败',
      });
    },
  });

  // 关联用户
  const linkUserMutation = useMutation({
    mutationFn: async ({ studentId, userId }: { studentId: number, userId: number }) => {
      const response = await api.post(`/admin/students/${studentId}/link-user`, { user_id: userId });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      addToast({
        type: 'success',
        title: '关联成功',
        description: '学员已成功关联用户账号',
      });

      // UI状态已经在 handleUserSelect 中设置了，这里不需要再次设置
      // 只需要确保搜索状态被清理
      setShowUserSearch(false);
      setUserSearchQuery('');

      console.log('关联成功，当前selectedUser:', selectedUser); // 调试信息
    },
    onError: (error: any, variables) => {
      // 关联失败时，回滚UI状态
      setSelectedUser(undefined); // 回滚到初始状态
      setShowUserSearch(true); // 重新显示搜索界面

      addToast({
        type: 'error',
        title: '关联失败',
        description: error.response?.data?.message || '关联用户失败',
      });

      console.log('关联失败，已回滚UI状态'); // 调试信息
    },
  });

  // 取消关联用户
  const unlinkUserMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const response = await api.delete(`/admin/students/${studentId}/unlink-user`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });

      // 立即更新UI状态
      setSelectedUser(null);

      addToast({
        type: 'success',
        title: '取消关联成功',
        description: '已取消学员与用户账号的关联',
      });

      console.log('取消关联成功，已清空selectedUser'); // 调试信息
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: '取消关联失败',
        description: error.response?.data?.message || '取消关联失败',
      });

      console.log('取消关联失败'); // 调试信息
    },
  });

  // 重置表单
  const resetForm = () => {
    if (student) {
      setFormData({
        name: student.name || '',
        phone: student.phone || '',
        gender: student.gender || 'none',
        birth_date: student.birth_date || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
        parent_relationship: student.parent_relationship || 'mother',
        student_type: student.student_type || 'potential',
        follow_up_status: student.follow_up_status || 'new',
        intention_level: student.intention_level || 'medium',
        source: student.source || '',
        remarks: student.remarks || '',
        status: student.status || 'active',
        create_parent_account: false,
      });
      // 设置已关联的用户信息
      if (student.user) {
        setSelectedUser(student.user);
      } else {
        setSelectedUser(undefined); // 使用 undefined 表示初始状态（未关联）
      }
    } else {
      setFormData({
        name: '',
        phone: '',
        gender: 'none',
        birth_date: '',
        parent_name: '',
        parent_phone: '',
        parent_relationship: 'mother',
        student_type: 'potential',
        follow_up_status: 'new',
        intention_level: 'medium',
        source: '',
        remarks: '',
        status: 'active',
        create_parent_account: false,
      });
      setSelectedUser(undefined);
    }
    setErrors({});
    setShowUserSearch(false);
    setUserSearchQuery('');
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [student, open]);

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '学员姓名不能为空';
    }

    if (!formData.parent_name.trim()) {
      newErrors.parent_name = '家长姓名不能为空';
    }

    if (!formData.parent_phone.trim()) {
      newErrors.parent_phone = '家长手机号不能为空';
    } else if (!/^1[3-9]\d{9}$/.test(formData.parent_phone)) {
      newErrors.parent_phone = '请输入正确的手机号';
    }

    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入正确的手机号';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const submitData = { ...formData };

    // 清理空值
    Object.keys(submitData).forEach(key => {
      if (submitData[key as keyof typeof submitData] === '') {
        delete submitData[key as keyof typeof submitData];
      }
    });

    saveMutation.mutate(submitData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 处理用户选择
  const handleUserSelect = (user: { id: number, name: string, email: string }) => {
    console.log('选择用户:', user); // 调试信息

    if (student) {
      // 先设置选中的用户，这样UI会立即显示关联状态
      setSelectedUser(user);
      setUserSearchQuery('');
      setShowUserSearch(false);

      // 然后调用API进行关联
      linkUserMutation.mutate({ studentId: student.id, userId: user.id });
    } else {
      // 如果是新建学员，只设置状态
      setSelectedUser(user);
      setUserSearchQuery('');
      setShowUserSearch(false);
    }
  };

  // 处理取消关联
  const handleUnlinkUser = () => {
    if (student) {
      console.log('开始取消关联，当前selectedUser:', selectedUser); // 调试信息

      // 先调用API，成功后再在onSuccess中更新UI状态
      // 这样如果API失败，UI状态不会被错误地清空
      unlinkUserMutation.mutate(student.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{student ? '编辑学员' : '新增学员'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 学员基本信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">学员信息</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">学员姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="phone">学员手机号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="可选"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gender">性别</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value === 'none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不选择</SelectItem>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="birth_date">出生日期</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => handleInputChange('birth_date', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 家长信息 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">家长信息</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parent_name">家长姓名 *</Label>
                <Input
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange('parent_name', e.target.value)}
                  className={errors.parent_name ? 'border-red-500' : ''}
                />
                {errors.parent_name && <p className="text-sm text-red-500 mt-1">{errors.parent_name}</p>}
              </div>

              <div>
                <Label htmlFor="parent_phone">家长手机号 *</Label>
                <Input
                  id="parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                  className={errors.parent_phone ? 'border-red-500' : ''}
                />
                {errors.parent_phone && <p className="text-sm text-red-500 mt-1">{errors.parent_phone}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="parent_relationship">家长关系</Label>
              <Select value={formData.parent_relationship} onValueChange={(value) => handleInputChange('parent_relationship', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">父亲</SelectItem>
                  <SelectItem value="mother">母亲</SelectItem>
                  <SelectItem value="guardian">监护人</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 账号关联 - 只在编辑学员时显示 */}
          {student && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">账号关联</h3>

              {(() => {
                // 优先使用 selectedUser 状态，如果为 null 则表示已取消关联
                if (selectedUser === null) return false;
                // 如果 selectedUser 有值，则显示关联状态
                if (selectedUser) return true;
                // 如果 selectedUser 未设置（undefined），则使用 student.user
                return student?.user ? true : false;
              })() ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Link className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        已关联用户：{selectedUser?.name || student?.user?.name}
                      </p>
                      <p className="text-sm text-green-700">
                        邮箱：{selectedUser?.email || student?.user?.email}
                      </p>
                      {/* 调试信息 */}
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Debug: selectedUser={selectedUser === null ? 'null(取消关联)' : selectedUser === undefined ? 'undefined(初始)' : 'set'},
                          student.user={student?.user ? 'set' : 'null'}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUnlinkUser}
                    disabled={unlinkUserMutation.isPending}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Unlink className="h-4 w-4 mr-1" />
                    取消关联
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    该学员尚未关联用户账号，关联后家长可通过H5端查看学习进度
                  </p>
                  {/* 调试信息 */}
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-gray-400">
                      Debug: selectedUser={selectedUser === null ? 'null(取消关联)' : selectedUser === undefined ? 'undefined(初始)' : `${selectedUser.name}(${selectedUser.id})`},
                      student.user={student?.user ? `${student.user.name}(${student.user.id})` : 'null'}
                    </p>
                  )}

                  {!showUserSearch ? (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUserSearch(true)}
                        className="w-full"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        搜索并关联用户账号
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        点击后可搜索现有用户或浏览所有用户
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="输入用户姓名或邮箱搜索..."
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowUserSearch(false);
                            setUserSearchQuery('');
                          }}
                        >
                          取消
                        </Button>
                      </div>

                      {/* 快捷操作按钮 */}
                      {!userSearchQuery.trim() && (
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setUserSearchQuery('')}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            显示所有用户
                          </Button>
                        </div>
                      )}

                      {/* 搜索加载状态 */}
                      {isSearchingUsers && (
                        <div className="text-center py-3">
                          <div className="text-sm text-gray-500">搜索中...</div>
                        </div>
                      )}

                      {/* 用户列表 */}
                      {(() => {
                        const displayUsers = userSearchQuery.trim()
                          ? usersData?.data?.data
                          : allUsersData?.data?.data;

                        if (displayUsers && displayUsers.length > 0) {
                          return (
                            <div className="border rounded-lg max-h-48 overflow-y-auto">
                              <div className="p-2 bg-gray-50 border-b text-sm text-gray-600">
                                {userSearchQuery.trim()
                                  ? `搜索结果 (${displayUsers.length}个)`
                                  : `所有用户 (显示前${displayUsers.length}个)`
                                }
                              </div>
                              {displayUsers.map((user: any) => (
                                <div
                                  key={user.id}
                                  className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                  onClick={() => handleUserSelect(user)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-gray-900">{user.name}</div>
                                      <div className="text-sm text-gray-500">{user.email || user.phone}</div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      点击关联
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        }

                        if (userSearchQuery.trim() && !isSearchingUsers) {
                          return (
                            <div className="text-center py-6 text-gray-500">
                              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">未找到匹配的用户</p>
                              <p className="text-xs text-gray-400 mt-1">
                                请尝试其他关键词
                              </p>
                            </div>
                          );
                        }

                        if (!userSearchQuery.trim() && !allUsersData?.data?.data) {
                          return (
                            <div className="text-center py-6 text-gray-500">
                              <p className="text-sm">加载用户列表中...</p>
                              <p className="text-xs text-gray-400 mt-1">
                                或输入关键词搜索特定用户
                              </p>
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 学员状态 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">学员状态</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="student_type">学员类型</Label>
                {!student && (
                  <p className="text-xs text-gray-500 mt-1 mb-2">
                    注：正式学员状态需通过报名获得
                  </p>
                )}
                <Select value={formData.student_type} onValueChange={(value) => handleInputChange('student_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {!student ? (
                      // 新增学员时只显示可创建的类型
                      creatableTypesData ? Object.entries(creatableTypesData).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value as string}</SelectItem>
                      )) : (
                        <>
                          <SelectItem value="potential">潜在学员</SelectItem>
                          <SelectItem value="trial">试听学员</SelectItem>
                        </>
                      )
                    ) : (
                      // 编辑学员时显示所有类型，但有特殊处理
                      <>
                        <SelectItem value="potential">潜在学员</SelectItem>
                        <SelectItem value="trial">试听学员</SelectItem>
                        <SelectItem value="enrolled">正式学员</SelectItem>
                        <SelectItem value="refunded">已退费学员</SelectItem>
                        <SelectItem value="graduated">已毕业</SelectItem>
                        <SelectItem value="suspended">暂停学习</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {student && formData.student_type === 'enrolled' && (
                  <p className="text-xs text-gray-500 mt-1">
                    正式学员状态由报名流程自动设置，请勿手动修改
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="follow_up_status">跟进状态</Label>
                <Select value={formData.follow_up_status} onValueChange={(value) => handleInputChange('follow_up_status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">新学员</SelectItem>
                    <SelectItem value="contacted">已联系</SelectItem>
                    <SelectItem value="interested">有意向</SelectItem>
                    <SelectItem value="not_interested">无意向</SelectItem>
                    <SelectItem value="follow_up">跟进中</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="intention_level">意向等级</Label>
                <Select value={formData.intention_level} onValueChange={(value) => handleInputChange('intention_level', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高意向</SelectItem>
                    <SelectItem value="medium">中意向</SelectItem>
                    <SelectItem value="low">低意向</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 其他信息 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="source">来源渠道</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="如：朋友推荐、网络广告等"
              />
            </div>

            <div>
              <Label htmlFor="remarks">备注信息</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="记录学员的特殊情况、学习需求等"
                rows={3}
              />
            </div>

            {!student && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="create_parent_account"
                  checked={formData.create_parent_account}
                  onCheckedChange={(checked) => handleInputChange('create_parent_account', checked)}
                />
                <Label htmlFor="create_parent_account">同时创建家长账号（默认密码：123456）</Label>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StudentEditor;
