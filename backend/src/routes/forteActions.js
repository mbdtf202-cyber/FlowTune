/**
 * Forte Actions API 路由
 * 提供自动化工作流的API接口
 */

import express from 'express';
import forteActionsService from '../services/forteActionsService.js';
import { authenticateToken } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Forte Actions 限流配置
const forteActionsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 每小时最多5次工作流
  message: {
    success: false,
    error: 'RATE_LIMIT_ERROR',
    message: 'Forte Actions工作流请求过于频繁，请稍后重试'
  }
});

/**
 * POST /api/forte-actions/execute
 * 执行Forte Actions工作流
 */
router.post('/execute', authenticateToken, forteActionsLimiter, async (req, res) => {
  try {
    const {
      prompt,
      metadata,
      royalties,
      autoMint = true
    } = req.body;

    // 验证必需参数
    if (!prompt || !metadata || !metadata.title || !metadata.artist) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '缺少必需参数：prompt, metadata.title, metadata.artist'
      });
    }

    // 设置默认版税（如果未提供）
    const defaultRoyalties = royalties || [
      {
        recipient: req.user.address,
        percentage: 0.8,
        description: '艺术家版税'
      },
      {
        recipient: process.env.PLATFORM_ADDRESS || '0x1234567890abcdef',
        percentage: 0.2,
        description: '平台版税'
      }
    ];

    // 执行工作流
    const result = await forteActionsService.executeWorkflow({
      userId: req.user.id,
      prompt,
      metadata: {
        ...metadata,
        description: metadata.description || `AI生成的${metadata.genre || '音乐'}作品`
      },
      royalties: defaultRoyalties,
      autoMint
    });

    res.json({
      success: true,
      data: result,
      message: 'Forte Actions工作流执行成功'
    });

  } catch (error) {
    console.error('Forte Actions execution error:', error);
    res.status(500).json({
      success: false,
      error: 'WORKFLOW_ERROR',
      message: error.message || 'Forte Actions工作流执行失败'
    });
  }
});

/**
 * GET /api/forte-actions/status/:workflowId
 * 获取工作流状态
 */
router.get('/status/:workflowId', authenticateToken, async (req, res) => {
  try {
    const { workflowId } = req.params;

    const status = await forteActionsService.getWorkflowStatus(workflowId);

    res.json({
      success: true,
      data: status,
      message: '工作流状态获取成功'
    });

  } catch (error) {
    console.error('Get workflow status error:', error);
    res.status(500).json({
      success: false,
      error: 'STATUS_ERROR',
      message: '获取工作流状态失败'
    });
  }
});

/**
 * POST /api/forte-actions/batch
 * 批量执行工作流
 */
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { workflows } = req.body;

    if (!Array.isArray(workflows) || workflows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'workflows必须是非空数组'
      });
    }

    if (workflows.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '批量工作流数量不能超过10个'
      });
    }

    // 为每个工作流添加用户ID
    const batchParams = workflows.map(workflow => ({
      ...workflow,
      userId: req.user.id
    }));

    const result = await forteActionsService.executeBatchWorkflow(batchParams);

    res.json({
      success: true,
      data: result,
      message: '批量工作流执行完成'
    });

  } catch (error) {
    console.error('Batch workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'BATCH_ERROR',
      message: '批量工作流执行失败'
    });
  }
});

/**
 * GET /api/forte-actions/templates
 * 获取工作流模板
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'electronic-ambient',
        name: '电子环境音乐',
        description: '生成平静的电子环境音乐',
        prompt: '一首平静的电子环境音乐，带有深沉的低音和梦幻的合成器',
        metadata: {
          genre: '电子音乐',
          mood: '平静',
          duration: 30
        }
      },
      {
        id: 'classical-piano',
        name: '古典钢琴',
        description: '生成优雅的古典钢琴曲',
        prompt: '一首优雅的古典钢琴曲，旋律优美，节奏舒缓',
        metadata: {
          genre: '古典音乐',
          mood: '优雅',
          duration: 45
        }
      },
      {
        id: 'jazz-smooth',
        name: '流畅爵士',
        description: '生成流畅的爵士乐',
        prompt: '一首流畅的爵士乐，带有萨克斯风独奏和轻柔的鼓点',
        metadata: {
          genre: '爵士乐',
          mood: '流畅',
          duration: 60
        }
      },
      {
        id: 'rock-energetic',
        name: '活力摇滚',
        description: '生成充满活力的摇滚乐',
        prompt: '一首充满活力的摇滚乐，强劲的吉他和鼓点',
        metadata: {
          genre: '摇滚乐',
          mood: '活力',
          duration: 30
        }
      },
      {
        id: 'cinematic-epic',
        name: '史诗电影配乐',
        description: '生成史诗般的电影配乐',
        prompt: '一首史诗般的电影配乐，宏大的管弦乐和戏剧性的旋律',
        metadata: {
          genre: '电影配乐',
          mood: '史诗',
          duration: 90
        }
      }
    ];

    res.json({
      success: true,
      data: { templates },
      message: '工作流模板获取成功'
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      error: 'TEMPLATES_ERROR',
      message: '获取工作流模板失败'
    });
  }
});

/**
 * POST /api/forte-actions/quick-generate
 * 快速生成（使用模板）
 */
router.post('/quick-generate', authenticateToken, forteActionsLimiter, async (req, res) => {
  try {
    const {
      templateId,
      title,
      artist,
      customPrompt,
      autoMint = true
    } = req.body;

    if (!templateId || !title || !artist) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '缺少必需参数：templateId, title, artist'
      });
    }

    // 获取模板
    const templates = {
      'electronic-ambient': {
        prompt: '一首平静的电子环境音乐，带有深沉的低音和梦幻的合成器',
        genre: '电子音乐',
        mood: '平静',
        duration: 30
      },
      'classical-piano': {
        prompt: '一首优雅的古典钢琴曲，旋律优美，节奏舒缓',
        genre: '古典音乐',
        mood: '优雅',
        duration: 45
      },
      'jazz-smooth': {
        prompt: '一首流畅的爵士乐，带有萨克斯风独奏和轻柔的鼓点',
        genre: '爵士乐',
        mood: '流畅',
        duration: 60
      },
      'rock-energetic': {
        prompt: '一首充满活力的摇滚乐，强劲的吉他和鼓点',
        genre: '摇滚乐',
        mood: '活力',
        duration: 30
      },
      'cinematic-epic': {
        prompt: '一首史诗般的电影配乐，宏大的管弦乐和戏剧性的旋律',
        genre: '电影配乐',
        mood: '史诗',
        duration: 90
      }
    };

    const template = templates[templateId];
    if (!template) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: '无效的模板ID'
      });
    }

    // 执行快速生成工作流
    const result = await forteActionsService.executeWorkflow({
      userId: req.user.id,
      prompt: customPrompt || template.prompt,
      metadata: {
        title,
        artist,
        genre: template.genre,
        mood: template.mood,
        duration: template.duration,
        description: `基于${template.genre}模板生成的AI音乐作品`
      },
      royalties: [
        {
          recipient: req.user.address,
          percentage: 0.8,
          description: '艺术家版税'
        },
        {
          recipient: process.env.PLATFORM_ADDRESS || '0x1234567890abcdef',
          percentage: 0.2,
          description: '平台版税'
        }
      ],
      autoMint
    });

    res.json({
      success: true,
      data: result,
      message: '快速生成工作流执行成功'
    });

  } catch (error) {
    console.error('Quick generate error:', error);
    res.status(500).json({
      success: false,
      error: 'QUICK_GENERATE_ERROR',
      message: error.message || '快速生成失败'
    });
  }
});

export default router;