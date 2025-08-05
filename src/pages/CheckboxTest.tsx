import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

const CheckboxTest: React.FC = () => {
  const [checked1, setChecked1] = useState(false);
  const [checked2, setChecked2] = useState(false);
  const [checked3, setChecked3] = useState(false);

  // 计算父级状态
  const checkedCount = [checked1, checked2, checked3].filter(Boolean).length;
  const parentChecked = checkedCount === 3;
  const parentIndeterminate = checkedCount > 0 && checkedCount < 3;

  const handleParentChange = (checked: boolean) => {
    setChecked1(checked);
    setChecked2(checked);
    setChecked3(checked);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Checkbox 半选状态测试</h1>
      
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">测试半选状态</h2>
        
        <div className="space-y-4">
          {/* 父级 Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={parentChecked}
              indeterminate={parentIndeterminate}
              onCheckedChange={handleParentChange}
            />
            <span className="font-medium">
              父菜单 ({checkedCount}/3 选中)
              {parentIndeterminate && " - 半选状态"}
              {parentChecked && " - 全选状态"}
              {checkedCount === 0 && " - 未选状态"}
            </span>
          </div>

          {/* 子级 Checkboxes */}
          <div className="ml-6 space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={checked1}
                onCheckedChange={setChecked1}
              />
              <span>子菜单 1</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={checked2}
                onCheckedChange={setChecked2}
              />
              <span>子菜单 2</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={checked3}
                onCheckedChange={setChecked3}
              />
              <span>子菜单 3</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">状态说明：</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>未选状态</strong> ⬜：没有子菜单选中</li>
            <li>• <strong>半选状态</strong> ◐：部分子菜单选中（显示减号）</li>
            <li>• <strong>全选状态</strong> ✅：所有子菜单选中（显示勾号）</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default CheckboxTest;
