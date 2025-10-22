import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayIcon, 
  StopIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
  MusicalNoteIcon,
  CloudArrowUpIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const ForteActionsWorkflow = ({ onWorkflowComplete }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowId, setWorkflowId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    customPrompt: '',
    autoMint: true
  });

  const workflowSteps = [
    { 
      id: 'generate', 
      name: 'AI音乐生成', 
      icon: SparklesIcon,
      description: '使用AI生成音乐'
    },
    { 
      id: 'upload', 
      name: 'IPFS上传', 
      icon: CloudArrowUpIcon,
      description: '上传到分布式存储'
    },
    { 
      id: 'mint', 
      name: 'NFT铸造', 
      icon: CubeIcon,
      description: '在Flow区块链上铸造NFT'
    },
    { 
      id: 'complete', 
      name: '完成', 
      icon: CheckCircleIcon,
      description: '工作流执行完成'
    }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.getForteActionsTemplates();
      if (response.success) {
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      // 如果加载失败，设置一些默认模板
      setTemplates([
        {
          id: 'ambient-chill',
          name: '环境音乐',
          description: '平静舒缓的环境音乐',
          prompt: 'Create a peaceful ambient track with soft synthesizers',
          metadata: { genre: 'Ambient', mood: 'Calm' }
        }
      ]);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      customPrompt: template.prompt
    }));
  };

  const executeWorkflow = async () => {
    if (!formData.title || !formData.artist) {
      setError('请填写标题和艺术家');
      return;
    }

    setIsExecuting(true);
    setCurrentStep(0);
    setError(null);
    setResult(null);

    try {
      const response = await api.startForteActionsWorkflow({
        templateId: selectedTemplate?.id,
        title: formData.title,
        artist: formData.artist,
        customPrompt: formData.customPrompt,
        autoMint: formData.autoMint
      });

      if (response.success) {
        setWorkflowId(response.data.workflowId);
        pollWorkflowStatus(response.data.workflowId);
      } else {
        throw new Error(response.message || 'Failed to start workflow');
      }
    } catch (error) {
      setError(error.message || 'Failed to start workflow');
      setIsExecuting(false);
    }
  };

  const pollWorkflowStatus = async (id) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.getForteActionsWorkflowStatus(id);
        if (response.success) {
          const status = response.data;
          
          // 更新当前步骤
          if (status.currentStep === 'generating') setCurrentStep(0);
          else if (status.currentStep === 'uploading') setCurrentStep(1);
          else if (status.currentStep === 'minting') setCurrentStep(2);
          else if (status.status === 'completed') setCurrentStep(3);

          if (status.status === 'completed') {
            setResult(status.result);
            setIsExecuting(false);
            clearInterval(pollInterval);
            if (onWorkflowComplete) {
              onWorkflowComplete(status.result);
            }
          } else if (status.status === 'failed') {
            setError(status.error || '工作流执行失败');
            setIsExecuting(false);
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Failed to poll workflow status:', error);
        setError('获取工作流状态失败');
        setIsExecuting(false);
        clearInterval(pollInterval);
      }
    }, 2000);

    // 设置超时
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isExecuting) {
        setError('工作流执行超时');
        setIsExecuting(false);
      }
    }, 300000); // 5分钟超时
  };

  const resetWorkflow = () => {
    setIsExecuting(false);
    setCurrentStep(0);
    setWorkflowId(null);
    setResult(null);
    setError(null);
    setFormData({
      title: '',
      artist: '',
      customPrompt: '',
      autoMint: true
    });
    setSelectedTemplate(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="h-8 w-8 text-purple-600 mr-2" />
            Forte Actions 工作流
          </h2>
          <p className="text-gray-600 mt-1">
            一键完成：AI生成 → IPFS上传 → NFT铸造
          </p>
        </div>
        {result && (
          <button
            onClick={resetWorkflow}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            重新开始
          </button>
        )}
      </div>

      {/* 模板选择 */}
      {!isExecuting && !result && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">选择音乐模板</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <h4 className="font-semibold text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <MusicalNoteIcon className="h-4 w-4 mr-1" />
                  {template.metadata.genre} · {template.metadata.mood}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 表单输入 */}
      {!isExecuting && !result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              音乐标题 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="输入音乐标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              艺术家 *
            </label>
            <input
              type="text"
              value={formData.artist}
              onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="输入艺术家名称"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              自定义提示词（可选）
            </label>
            <textarea
              value={formData.customPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, customPrompt: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="描述您想要的音乐风格..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoMint}
                onChange={(e) => setFormData(prev => ({ ...prev, autoMint: e.target.checked }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">自动铸造NFT</span>
            </label>
          </div>
        </div>
      )}

      {/* 工作流步骤 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep && isExecuting;
            const isCompleted = index < currentStep || (result && index === workflowSteps.length - 1);
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'bg-purple-500 border-purple-500 text-white animate-pulse'
                    : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    isCompleted || isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 错误信息 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
          >
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 结果展示 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-6 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
              <h3 className="text-lg font-semibold text-green-900">工作流执行成功！</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Token ID:</span>
                <span className="ml-2 text-gray-900">{result.tokenId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">交易哈希:</span>
                <span className="ml-2 text-gray-900 font-mono text-xs">
                  {result.transactionHash?.slice(0, 10)}...
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">IPFS哈希:</span>
                <span className="ml-2 text-gray-900 font-mono text-xs">
                  {result.ipfsHash?.slice(0, 10)}...
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">状态:</span>
                <span className="ml-2 text-green-600 font-medium">已铸造</span>
              </div>
            </div>
            {result.audioUrl && (
              <div className="mt-4">
                <audio controls className="w-full">
                  <source src={result.audioUrl} type="audio/mpeg" />
                  您的浏览器不支持音频播放。
                </audio>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作按钮 */}
      {!isExecuting && !result && (
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={executeWorkflow}
            disabled={!formData.title || !formData.artist}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <PlayIcon className="h-5 w-5 mr-2" />
            启动 Forte Actions 工作流
          </motion.button>
        </div>
      )}

      {isExecuting && (
        <div className="flex justify-center">
          <div className="flex items-center text-purple-600">
            <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
            <span className="font-medium">工作流执行中...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForteActionsWorkflow;