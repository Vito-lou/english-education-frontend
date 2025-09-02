import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Volume2, Image, BookOpen, MessageSquare, Zap } from 'lucide-react';

interface CourseLevel {
  id: number;
  name: string;
  code: string;
}

interface KnowledgePoint {
  id?: number;
  unit_id?: number;
  type: 'vocabulary' | 'sentence_pattern' | 'grammar';
  content: string;
  image_url?: string;
  explanation?: string;
  example_sentences?: string[];
  sort_order: number;
  status: 'active' | 'inactive';
}

interface CourseUnit {
  id: number;
  course_id: number;
  level_id: number | null;
  name: string;
  description: string;
  learning_objectives: string;
  story_content?: string;
  sort_order: number;
  status: string;
  knowledge_points?: KnowledgePoint[];
}

interface UnitEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (unitData: Partial<CourseUnit>) => void;
  unit?: CourseUnit | null;
  courseId: number;
  levels: CourseLevel[];
  defaultLevelId?: number | null;
  loading?: boolean;
}

const UnitEditor: React.FC<UnitEditorProps> = ({
  open,
  onClose,
  onSave,
  unit,
  courseId,
  levels,
  defaultLevelId,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<CourseUnit>>({
    course_id: courseId,
    level_id: null,
    name: '',
    description: '',
    learning_objectives: '',
    story_content: '',
    sort_order: 0,
    status: 'active',
  });

  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgePoint | null>(null);
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 重置表单
  const resetForm = () => {
    if (unit) {
      setFormData({
        course_id: unit.course_id,
        level_id: unit.level_id,
        name: unit.name,
        description: unit.description,
        learning_objectives: unit.learning_objectives,
        story_content: unit.story_content || '',
        sort_order: unit.sort_order,
        status: unit.status,
      });
      setKnowledgePoints(unit.knowledge_points || []);
    } else {
      setFormData({
        course_id: courseId,
        level_id: defaultLevelId || null,
        name: '',
        description: '',
        learning_objectives: '',
        story_content: '',
        sort_order: 0,
        status: 'active',
      });
      setKnowledgePoints([]);
    }
    setErrors({});
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [unit, courseId, defaultLevelId, open]);

  const handleInputChange = (field: keyof CourseUnit, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '单元名称不能为空';
    }

    if (!formData.description?.trim()) {
      newErrors.description = '单元描述不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    // 处理知识点数据：过滤掉临时ID，只保留真实的数据库ID
    const processedKnowledgePoints = knowledgePoints.map(point => {
      const processedPoint = { ...point };

      // 如果ID是临时生成的（大于当前时间戳-1小时），则移除ID字段
      // 这样后端会将其作为新知识点创建
      if (processedPoint.id && processedPoint.id > Date.now() - 3600000) {
        delete processedPoint.id;
      }

      return processedPoint;
    });

    // 将知识点数据合并到表单数据中
    const dataToSave = {
      ...formData,
      knowledge_points: processedKnowledgePoints,
    };
    onSave(dataToSave);
  };

  // 知识点管理函数
  const addKnowledgePoint = () => {
    setEditingKnowledge({
      type: 'vocabulary',
      content: '',
      explanation: '',
      example_sentences: [],
      sort_order: knowledgePoints.length,
      status: 'active',
    });
    setKnowledgeDialogOpen(true);
  };

  const editKnowledgePoint = (point: KnowledgePoint) => {
    setEditingKnowledge(point);
    setKnowledgeDialogOpen(true);
  };

  const deleteKnowledgePoint = (index: number) => {
    if (confirm('确定要删除这个知识点吗？')) {
      setKnowledgePoints(prev => prev.filter((_, i) => i !== index));
    }
  };

  const saveKnowledgePoint = (point: KnowledgePoint) => {
    if (editingKnowledge?.id) {
      // 编辑现有知识点
      setKnowledgePoints(prev =>
        prev.map(p => p.id === editingKnowledge.id ? point : p)
      );
    } else {
      // 添加新知识点
      setKnowledgePoints(prev => [...prev, { ...point, id: Date.now() }]);
    }
    setKnowledgeDialogOpen(false);
    setEditingKnowledge(null);
  };

  const getKnowledgeTypeIcon = (type: string) => {
    switch (type) {
      case 'vocabulary':
        return <BookOpen className="h-4 w-4" />;
      case 'sentence_pattern':
        return <MessageSquare className="h-4 w-4" />;
      case 'grammar':
        return <Zap className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getKnowledgeTypeName = (type: string) => {
    switch (type) {
      case 'vocabulary':
        return '词汇';
      case 'sentence_pattern':
        return '句型';
      case 'grammar':
        return '语法';
      default:
        return '未知';
    }
  };

  // 文本选择处理
  const handleTextSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selected = textarea.value.substring(start, end).trim();
      setSelectedText(selected);
    } else {
      setSelectedText('');
    }
  };

  // 标记选中的文本为知识点
  const markSelectedText = (type: 'vocabulary' | 'sentence_pattern' | 'grammar') => {
    if (!selectedText) {
      alert('请先选择要标记的文字');
      return;
    }

    // 检查是否已经存在相同内容的知识点
    const existingPoint = knowledgePoints.find(p => p.content === selectedText);
    if (existingPoint) {
      alert('该知识点已存在，请选择其他文字或编辑现有知识点');
      return;
    }

    // 创建新的知识点
    const newPoint: KnowledgePoint = {
      id: Date.now(),
      type,
      content: selectedText,
      explanation: '',
      example_sentences: [],
      sort_order: knowledgePoints.length,
      status: 'active',
    };

    setKnowledgePoints(prev => [...prev, newPoint]);
    setSelectedText(''); // 清空选择

    // 自动打开编辑对话框让用户完善信息
    setEditingKnowledge(newPoint);
    setKnowledgeDialogOpen(true);
  };

  // 渲染高亮文本
  const renderHighlightedText = () => {
    const text = formData.story_content || '';
    if (!text || knowledgePoints.length === 0) {
      return null;
    }

    let highlightedText = text;

    // 按内容长度排序，先处理长的内容，避免短内容覆盖长内容
    const sortedPoints = [...knowledgePoints].sort((a, b) => b.content.length - a.content.length);

    sortedPoints.forEach((point) => {
      const regex = new RegExp(`\\b${point.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const className = getHighlightClassName(point.type);
      highlightedText = highlightedText.replace(
        regex,
        `<span class="${className}" title="${getKnowledgeTypeName(point.type)}: ${point.content}">${point.content}</span>`
      );
    });

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // 获取高亮样式类名
  const getHighlightClassName = (type: string) => {
    switch (type) {
      case 'vocabulary':
        return 'bg-blue-200 text-blue-800 px-1 rounded';
      case 'sentence_pattern':
        return 'bg-green-200 text-green-800 px-1 rounded';
      case 'grammar':
        return 'bg-purple-200 text-purple-800 px-1 rounded';
      default:
        return 'bg-gray-200 text-gray-800 px-1 rounded';
    }
  };

  // 智能提取知识点
  const intelligentExtract = () => {
    const text = formData.story_content || '';
    if (!text.trim()) {
      alert('请先输入故事内容');
      return;
    }

    // 简单的智能提取规则（可以后续接入AI API）
    const extractedPoints: KnowledgePoint[] = [];
    let currentId = Date.now();

    // 1. 提取可能的词汇（英文单词）
    const englishWords = text.match(/\b[A-Za-z]{3,}\b/g) || [];
    const uniqueWords = [...new Set(englishWords.map(w => w.toLowerCase()))];

    // 过滤常见词汇，只保留可能的生词
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how'];

    const potentialVocabulary = uniqueWords.filter(word =>
      word.length >= 4 &&
      !commonWords.includes(word) &&
      !knowledgePoints.some(p => p.content.toLowerCase() === word)
    ).slice(0, 10); // 限制数量

    potentialVocabulary.forEach((word, index) => {
      extractedPoints.push({
        id: currentId++,
        type: 'vocabulary',
        content: word,
        explanation: '',
        example_sentences: [],
        sort_order: knowledgePoints.length + index,
        status: 'active',
      });
    });

    // 2. 提取可能的句型（疑问句、感叹句等）
    const questionPatterns = text.match(/[A-Z][^.!?]*\?/g) || [];
    const exclamationPatterns = text.match(/[A-Z][^.!?]*!/g) || [];

    [...questionPatterns, ...exclamationPatterns].forEach((pattern, index) => {
      if (pattern.length < 50 && !knowledgePoints.some(p => p.content === pattern.trim())) {
        extractedPoints.push({
          id: currentId++,
          type: 'sentence_pattern',
          content: pattern.trim(),
          explanation: '',
          example_sentences: [],
          sort_order: knowledgePoints.length + potentialVocabulary.length + index,
          status: 'active',
        });
      }
    });

    if (extractedPoints.length === 0) {
      alert('未找到可提取的知识点，请手动标记');
      return;
    }

    // 显示提取结果让用户确认
    const confirmMessage = `智能提取到 ${extractedPoints.length} 个知识点：\n\n` +
      extractedPoints.map(p => `• ${getKnowledgeTypeName(p.type)}: ${p.content}`).join('\n') +
      '\n\n是否添加这些知识点？';

    if (confirm(confirmMessage)) {
      setKnowledgePoints(prev => [...prev, ...extractedPoints]);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {unit ? '编辑单元' : '新建单元'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="story">故事内容</TabsTrigger>
              <TabsTrigger value="knowledge">知识点管理</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* 所属级别 */}
              {levels.length > 0 && (
                <div>
                  <Label htmlFor="level_id">所属级别</Label>
                  <Select
                    value={formData.level_id?.toString() || 'none'}
                    onValueChange={(value) => handleInputChange('level_id', value === 'none' ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="请选择级别（可选）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">无级别</SelectItem>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">如果课程有级别体系，可以选择单元所属的级别</p>
                </div>
              )}

              {/* 单元名称 */}
              <div>
                <Label htmlFor="name">单元名称 *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入单元名称，如：Unit 1 - Greetings"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* 排序 */}
              <div>
                <Label htmlFor="sort_order">排序</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 0)}
                  placeholder="排序数字，越小越靠前"
                />
              </div>

              {/* 单元描述 */}
              <div>
                <Label htmlFor="description">单元描述 *</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="请输入单元描述，说明本单元的主要内容"
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
              </div>

              {/* 学习目标 */}
              <div>
                <Label htmlFor="learning_objectives">学习目标</Label>
                <Textarea
                  id="learning_objectives"
                  value={formData.learning_objectives || ''}
                  onChange={(e) => handleInputChange('learning_objectives', e.target.value)}
                  placeholder="请输入学习目标，说明学生完成本单元后应该掌握的知识和技能"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">可以分点列出，如：1. 掌握基本问候语 2. 能够进行简单自我介绍</p>
              </div>
            </TabsContent>

            {/* 故事内容Tab */}
            <TabsContent value="story" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* 左侧：故事文本编辑器 */}
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="story_content">单元故事内容</Label>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => markSelectedText('vocabulary')}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        标记词汇
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => markSelectedText('sentence_pattern')}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        标记句型
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => markSelectedText('grammar')}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        标记语法
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* 编辑模式的textarea */}
                    <Textarea
                      id="story_content"
                      placeholder="请输入完整的单元故事内容，然后选择文字并点击上方按钮来标记知识点..."
                      value={formData.story_content || ''}
                      onChange={(e) => handleInputChange('story_content', e.target.value)}
                      rows={20}
                      className="min-h-[500px] font-mono text-sm resize-none"
                      onSelect={handleTextSelection}
                    />

                    {/* 知识点高亮预览（仅在有知识点时显示） */}
                    {knowledgePoints.length > 0 && formData.story_content && (
                      <div className="border rounded-md p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">📖 知识点预览</span>
                          <span className="text-xs text-muted-foreground">
                            已标记 {knowledgePoints.length} 个知识点
                          </span>
                        </div>
                        <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {renderHighlightedText()}
                        </div>
                      </div>
                    )}

                    {/* 选中文本提示 */}
                    {selectedText && (
                      <div className="absolute top-2 right-2 bg-white border rounded-lg shadow-lg p-2 text-xs z-10">
                        <div className="font-medium mb-1">已选择文本：</div>
                        <div className="text-blue-600 max-w-32 truncate">"{selectedText}"</div>
                        <div className="text-muted-foreground mt-1">点击上方按钮标记为知识点</div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-start">
                    <p className="text-sm text-muted-foreground">
                      💡 操作提示：
                      <br />1. 选择要标记的文字
                      <br />2. 点击对应的标记按钮
                      <br />3. 在右侧面板中完善知识点信息
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={intelligentExtract}
                      className="ml-4"
                    >
                      🤖 智能提取
                    </Button>
                  </div>
                </div>

                {/* 右侧：快速知识点面板 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">快速添加知识点</h4>
                    <Button size="sm" onClick={addKnowledgePoint}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* 知识点类型统计 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">词汇</span>
                      </div>
                      <Badge variant="secondary">
                        {knowledgePoints.filter(p => p.type === 'vocabulary').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">句型</span>
                      </div>
                      <Badge variant="secondary">
                        {knowledgePoints.filter(p => p.type === 'sentence_pattern').length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">语法</span>
                      </div>
                      <Badge variant="secondary">
                        {knowledgePoints.filter(p => p.type === 'grammar').length}
                      </Badge>
                    </div>
                  </div>

                  {/* 最近添加的知识点 */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">最近添加</h5>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {knowledgePoints.slice(-5).reverse().map((point, index) => (
                        <div key={point.id || index} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                          <div className="flex items-center space-x-1">
                            {getKnowledgeTypeIcon(point.type)}
                            <span className="truncate max-w-20">{point.content}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editKnowledgePoint(point)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {knowledgePoints.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">还没有知识点</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 知识点管理Tab */}
            <TabsContent value="knowledge" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">知识点管理</h3>
                <Button onClick={addKnowledgePoint}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加知识点
                </Button>
              </div>

              {/* 知识点统计 */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">词汇</p>
                        <p className="text-2xl font-bold">
                          {knowledgePoints.filter(p => p.type === 'vocabulary').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">句型</p>
                        <p className="text-2xl font-bold">
                          {knowledgePoints.filter(p => p.type === 'sentence_pattern').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium">语法</p>
                        <p className="text-2xl font-bold">
                          {knowledgePoints.filter(p => p.type === 'grammar').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 知识点列表 */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {knowledgePoints.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>还没有添加知识点</p>
                    <p className="text-sm">点击"添加知识点"开始创建</p>
                  </div>
                ) : (
                  knowledgePoints.map((point, index) => (
                    <Card key={point.id || index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getKnowledgeTypeIcon(point.type)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{point.content}</span>
                              <Badge variant="outline">
                                {getKnowledgeTypeName(point.type)}
                              </Badge>
                            </div>
                            {point.explanation && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {point.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {point.audio_url && (
                            <Button variant="ghost" size="sm">
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          )}
                          {point.image_url && (
                            <Button variant="ghost" size="sm">
                              <Image className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => editKnowledgePoint(point)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteKnowledgePoint(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 知识点编辑对话框 */}
      <KnowledgePointDialog
        open={knowledgeDialogOpen}
        onClose={() => {
          setKnowledgeDialogOpen(false);
          setEditingKnowledge(null);
        }}
        knowledgePoint={editingKnowledge}
        onSave={saveKnowledgePoint}
      />
    </>
  );
};

// 知识点编辑对话框组件
interface KnowledgePointDialogProps {
  open: boolean;
  onClose: () => void;
  knowledgePoint: KnowledgePoint | null;
  onSave: (point: KnowledgePoint) => void;
}

const KnowledgePointDialog: React.FC<KnowledgePointDialogProps> = ({
  open,
  onClose,
  knowledgePoint,
  onSave,
}) => {
  const [formData, setFormData] = useState<KnowledgePoint>({
    type: 'vocabulary',
    content: '',
    explanation: '',
    example_sentences: [],
    sort_order: 0,
    status: 'active',
  });

  const [exampleSentence, setExampleSentence] = useState('');

  useEffect(() => {
    if (knowledgePoint) {
      setFormData(knowledgePoint);
    } else {
      setFormData({
        type: 'vocabulary',
        content: '',
        explanation: '',
        example_sentences: [],
        sort_order: 0,
        status: 'active',
      });
    }
    setExampleSentence('');
  }, [knowledgePoint, open]);

  const handleInputChange = (field: keyof KnowledgePoint, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addExampleSentence = () => {
    if (exampleSentence.trim()) {
      setFormData(prev => ({
        ...prev,
        example_sentences: [...(prev.example_sentences || []), exampleSentence.trim()]
      }));
      setExampleSentence('');
    }
  };

  const removeExampleSentence = (index: number) => {
    setFormData(prev => ({
      ...prev,
      example_sentences: prev.example_sentences?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSave = () => {
    if (!formData.content.trim()) {
      alert('请输入知识点内容');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {knowledgePoint ? '编辑知识点' : '添加知识点'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 知识点类型 */}
          <div>
            <Label htmlFor="type">知识点类型</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'vocabulary' | 'sentence_pattern' | 'grammar') =>
                handleInputChange('type', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vocabulary">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>词汇</span>
                  </div>
                </SelectItem>
                <SelectItem value="sentence_pattern">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>句型</span>
                  </div>
                </SelectItem>
                <SelectItem value="grammar">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>语法</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 知识点内容 */}
          <div>
            <Label htmlFor="content">
              {formData.type === 'vocabulary' ? '单词/短语' :
                formData.type === 'sentence_pattern' ? '句型' : '语法点'}
            </Label>
            <Input
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder={
                formData.type === 'vocabulary' ? '如：apple, beautiful' :
                  formData.type === 'sentence_pattern' ? '如：What is your name?' :
                    '如：现在进行时'
              }
            />
          </div>



          {/* 解释说明 */}
          <div>
            <Label htmlFor="explanation">解释说明</Label>
            <Textarea
              id="explanation"
              value={formData.explanation || ''}
              onChange={(e) => handleInputChange('explanation', e.target.value)}
              placeholder="请输入详细的解释说明..."
              rows={3}
            />
          </div>

          {/* 例句 */}
          <div>
            <Label>例句</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={exampleSentence}
                  onChange={(e) => setExampleSentence(e.target.value)}
                  placeholder="输入例句..."
                  onKeyPress={(e) => e.key === 'Enter' && addExampleSentence()}
                />
                <Button type="button" onClick={addExampleSentence}>
                  添加
                </Button>
              </div>
              {formData.example_sentences && formData.example_sentences.length > 0 && (
                <div className="space-y-1">
                  {formData.example_sentences.map((sentence, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{sentence}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExampleSentence(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 配图上传 */}
          <div>
            <Label>配图（可选）</Label>
            <div className="mt-2 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
              <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">点击上传图片</p>
              <p className="text-xs text-muted-foreground">支持 JPG, PNG 格式</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              💡 音标和发音将通过语音API自动提供
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UnitEditor;
