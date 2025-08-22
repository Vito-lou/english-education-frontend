import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar, Search, UserCheck } from 'lucide-react';
import { api } from '@/lib/api';

interface AttendanceRecord {
  id: number;
  schedule_date: string;
  time_range: string;
  course_name: string;
  teacher_name: string;
  student_name: string;
  attendance_status: string;
  status_name: string;
  deducted_lessons: number;
  teacher_notes: string;
  recorded_at: string;
}

interface ClassAttendanceRecordsProps {
  classId: number;
}

const ClassAttendanceRecords: React.FC<ClassAttendanceRecordsProps> = ({ classId }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [studentName, setStudentName] = useState('');

  // 获取点名记录
  const { data: recordsData, isLoading, refetch } = useQuery({
    queryKey: ['class-attendance-records', classId, dateFrom, dateTo, studentName],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (studentName) params.append('student_name', studentName);

      const response = await api.get(`/admin/classes/${classId}/attendance-records?${params.toString()}`);
      return response.data.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 0, // 数据立即过期，确保每次都获取最新数据
  });

  const records: AttendanceRecord[] = recordsData || [];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'late': return 'secondary';
      case 'personal_leave': return 'outline';
      case 'absent': return 'destructive';
      default: return 'default';
    }
  };

  const handleSearch = () => {
    refetch();
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setStudentName('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">点名记录</h3>
          <p className="text-sm text-muted-foreground">查看班级的历史点名记录</p>
        </div>
      </div>

      {/* 筛选条件 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-2">
          <Label>开始日期</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>结束日期</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>学员姓名</Label>
          <Input
            type="text"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="输入学员姓名"
          />
        </div>
        <div className="space-y-2 flex items-end">
          <div className="flex space-x-2">
            <Button onClick={handleSearch} size="sm">
              <Search className="mr-2 h-4 w-4" />
              查询
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              重置
            </Button>
          </div>
        </div>
      </div>

      {/* 点名记录列表 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>上课日期</TableHead>
              <TableHead>时间段</TableHead>
              <TableHead>课程</TableHead>
              <TableHead>教师</TableHead>
              <TableHead>学员</TableHead>
              <TableHead>到课状态</TableHead>
              <TableHead>扣除课时</TableHead>
              <TableHead>备注</TableHead>
              <TableHead>记录时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="text-center">
                    <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">暂无点名记录</h3>
                    <p className="text-muted-foreground">还没有点名记录，请先进行课程点名</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.schedule_date}</TableCell>
                  <TableCell>{record.time_range}</TableCell>
                  <TableCell>{record.course_name}</TableCell>
                  <TableCell>{record.teacher_name}</TableCell>
                  <TableCell>{record.student_name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(record.attendance_status)}>
                      {record.status_name}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.deducted_lessons}</TableCell>
                  <TableCell>{record.teacher_notes || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(record.recorded_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClassAttendanceRecords;
