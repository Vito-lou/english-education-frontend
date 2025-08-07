import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Plus,
  Search,
  AlertCircle
} from 'lucide-react';
import { OrganizationNode, CreateNodeData } from '@/lib/api';
import {
  useOrganizationTree,
  useCreateOrganizationNode,
  useUpdateOrganizationNode,
  useDeleteOrganizationNode,
  buildTree
} from '@/hooks/useOrganization';
import { useToast } from '@/components/ui/toast';
import TreeNode from '@/components/organization/TreeNode';
import NodeForm from '@/components/organization/NodeForm';
import ConfirmDialog from '@/components/ui/confirm-dialog';

const Organization: React.FC = () => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // 表单状态
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [editingNode, setEditingNode] = useState<OrganizationNode | null>(null);
  const [parentNode, setParentNode] = useState<OrganizationNode | null>(null);

  // 确认对话框状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<OrganizationNode | null>(null);

  const { addToast } = useToast();

  // 使用新的组织架构hooks
  const {
    data: organizationData = [],
    isLoading,
    error
  } = useOrganizationTree();

  const createNodeMutation = useCreateOrganizationNode();
  const updateNodeMutation = useUpdateOrganizationNode();
  const deleteNodeMutation = useDeleteOrganizationNode();

  // 构建树形结构
  const treeData = buildTree(organizationData);

  // 递归搜索函数
  const searchInTree = (nodes: OrganizationNode[], term: string): OrganizationNode[] => {
    const results: OrganizationNode[] = [];

    for (const node of nodes) {
      const matchesSearch =
        node.name.toLowerCase().includes(term.toLowerCase()) ||
        node.code.toLowerCase().includes(term.toLowerCase());

      // 递归搜索子节点
      const matchingChildren = node.children ? searchInTree(node.children, term) : [];

      // 如果当前节点匹配或有匹配的子节点，则包含此节点
      if (matchesSearch || matchingChildren.length > 0) {
        results.push({
          ...node,
          children: matchingChildren.length > 0 ? matchingChildren : node.children
        });
      }
    }

    return results;
  };

  // 过滤搜索结果
  const filteredTreeData = searchTerm
    ? searchInTree(treeData, searchTerm)
    : treeData;

  // 处理节点选择（现在不需要了，但保留接口兼容性）
  const handleNodeSelect = (_node: OrganizationNode) => {
    // 不再需要选中状态
  };

  // 处理节点展开/收起
  const handleToggleExpand = (nodeId: number) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    setExpandedNodes(newExpandedNodes);
  };

  // 处理添加子节点
  const handleAddChild = (parent?: OrganizationNode) => {
    setParentNode(parent || null);
    setEditingNode(null);
    setShowNodeForm(true);
  };

  // 处理编辑节点
  const handleEditNode = (node: OrganizationNode) => {
    setEditingNode(node);
    setParentNode(null);
    setShowNodeForm(true);
  };

  // 处理删除节点
  const handleDeleteNode = (node: OrganizationNode) => {
    setNodeToDelete(node);
    setShowConfirmDialog(true);
  };

  // 确认删除节点
  const confirmDeleteNode = async () => {
    if (!nodeToDelete) return;

    try {
      await deleteNodeMutation.mutateAsync(nodeToDelete.id);
      addToast({
        type: 'success',
        title: '删除成功',
        description: `节点 "${nodeToDelete.name}" 已成功删除`
      });
    } catch (error) {
      console.error('删除节点失败:', error);
      addToast({
        type: 'error',
        title: '删除失败',
        description: '删除节点失败，请稍后重试'
      });
    } finally {
      setNodeToDelete(null);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (data: CreateNodeData) => {
    try {
      if (editingNode) {
        // 更新节点
        await updateNodeMutation.mutateAsync({
          id: editingNode.id,
          data: data
        });
        addToast({
          type: 'success',
          title: '更新成功',
          description: `节点 "${data.name}" 已成功更新`
        });
      } else {
        // 创建节点
        await createNodeMutation.mutateAsync(data);
        addToast({
          type: 'success',
          title: '创建成功',
          description: `节点 "${data.name}" 已成功创建`
        });
      }

      setShowNodeForm(false);
      setEditingNode(null);
      setParentNode(null);
    } catch (error) {
      console.error('节点操作失败:', error);
      addToast({
        type: 'error',
        title: '操作失败',
        description: '节点操作失败，请稍后重试'
      });
    }
  };

  // 处理表单取消
  const handleFormCancel = () => {
    setShowNodeForm(false);
    setEditingNode(null);
    setParentNode(null);
  };

  // 递归渲染树形节点
  const renderTreeNode = (node: OrganizationNode, level: number = 0): React.ReactNode => {
    // 如果有搜索词，自动展开匹配的节点
    const shouldExpand = searchTerm ? true : expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id}>
        <TreeNode
          node={node}
          level={level}
          isSelected={false}
          isExpanded={shouldExpand}
          onSelect={handleNodeSelect}
          onToggleExpand={handleToggleExpand}
          onAddChild={handleAddChild}
          onEdit={handleEditNode}
          onDelete={handleDeleteNode}
        />
        {/* 递归渲染子节点 */}
        {hasChildren && shouldExpand && (
          <div className="ml-6">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">加载失败，请稍后重试</p>
          <Button
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 页面标题 */}
      <div className="flex items-center p-4 border-b">
        <h1 className="text-2xl font-bold">组织架构</h1>
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 p-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">组织结构树</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索组织..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={() => handleAddChild()}>
                  <Plus className="w-4 h-4 mr-2" />
                  添加机构
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {filteredTreeData.length > 0 ? (
              <div className="space-y-1">
                {filteredTreeData.map(node => renderTreeNode(node))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">🏢</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? '没有找到匹配的结果' : '还没有组织架构'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm
                      ? '尝试使用不同的关键词搜索'
                      : '创建第一个机构来开始构建您的组织架构'
                    }
                  </p>
                  {!searchTerm && (
                    <Button
                      size="lg"
                      onClick={() => handleAddChild()}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      创建第一个机构
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 节点表单弹窗 */}
      <Dialog open={showNodeForm} onOpenChange={setShowNodeForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <NodeForm
            node={editingNode || undefined}
            parentNode={parentNode || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={createNodeMutation.isPending || updateNodeMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="确认删除"
        description={
          nodeToDelete
            ? `确定要删除 "${nodeToDelete.name}" 吗？此操作不可撤销，删除后该节点下的所有子节点也将被删除。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        onConfirm={confirmDeleteNode}
        onCancel={() => setNodeToDelete(null)}
      />
    </div>
  );
};

export default Organization;