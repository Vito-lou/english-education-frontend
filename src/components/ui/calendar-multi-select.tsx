import React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { zhCN } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface CalendarMultiSelectProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

const CalendarMultiSelect: React.FC<CalendarMultiSelectProps> = ({
  selectedDates,
  onDatesChange,
  disabled,
  className,
  minDate,
  maxDate,
}) => {

  const isDateDisabled = (date: Date) => {
    // 禁用过去的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // 自定义禁用逻辑
    if (disabled && disabled(date)) return true;

    // 日期范围限制
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    return false;
  };

  return (
    <div className={cn('p-3', className)}>
      <DayPicker
        mode="multiple"
        selected={selectedDates}
        onSelect={(dates) => onDatesChange(dates || [])}
        disabled={isDateDisabled}
        showOutsideDays={true}
        locale={zhCN}
      />

      {/* 选择的日期统计 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">
          已选择 {selectedDates.length} 个日期
        </div>
        {selectedDates.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedDates
              .sort((a, b) => a.getTime() - b.getTime())
              .slice(0, 10) // 最多显示10个日期
              .map((date, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {date.toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </span>
              ))}
            {selectedDates.length > 10 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{selectedDates.length - 10} 更多
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarMultiSelect;
