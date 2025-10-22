/**
 * Forte Actions 工作流服务
 * 实现上传 → AI生成 → 自动铸造的自动化流程
 */

import aiService from './aiService.js';
import ipfsService from './ipfsService.js';
import MusicNFT from '../models/MusicNFT.js';
import User from '../models/User.js';
import { v4 as uuidv4 } from 'uuid';
import Database from '../config/database.js';

class ForteActionsService {
  /**
   * 执行完整的Forte Actions工作流
   * @param {Object} params - 工作流参数
   * @param {string} params.userId - 用户ID
   * @param {string} params.prompt - AI生成提示词
   * @param {Object} params.metadata - 音乐元数据
   * @param {Array} params.royalties - 版税配置
   * @param {boolean} params.autoMint - 是否自动铸造
   * @returns {Object} 工作流执行结果
   */
  async executeWorkflow(params) {
    const {
      userId,
      prompt,
      metadata,
      royalties = [],
      autoMint = true
    } = params;

    try {
      console.log('🚀 Starting Forte Actions workflow for user:', userId);
      
      // 步骤1: 验证用户
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 步骤2: AI音乐生成
      console.log('🎵 Step 1: Generating AI music...');
      const aiResult = await this.generateMusic({
        prompt,
        title: metadata.title,
        artist: metadata.artist,
        genre: metadata.genre,
        mood: metadata.mood,
        duration: metadata.duration || 30
      });

      // 步骤3: 上传到IPFS
      console.log('📁 Step 2: Uploading to IPFS...');
      const ipfsResult = await this.uploadToIPFS({
        audioUrl: aiResult.audioUrl,
        coverImageUrl: aiResult.coverImageUrl,
        metadata: {
          ...metadata,
          prompt,
          aiModel: aiResult.aiModel,
          generatedAt: new Date().toISOString()
        },
        royalties
      });

      // 步骤4: 自动铸造NFT (如果启用)
      let mintResult = null;
      if (autoMint) {
        console.log('⛏️ Step 3: Auto-minting NFT...');
        mintResult = await this.autoMintNFT({
          userId,
          ipfsMetadata: ipfsResult.nftMetadata,
          royalties
        });
      }

      // 步骤5: 保存工作流记录
      const workflowRecord = await this.saveWorkflowRecord({
        userId,
        prompt,
        aiResult,
        ipfsResult,
        mintResult,
        status: autoMint ? 'completed' : 'pending_mint',
        completedAt: new Date()
      });

      console.log('✅ Forte Actions workflow completed successfully');

      return {
        success: true,
        workflowId: workflowRecord.id,
        steps: {
          aiGeneration: aiResult,
          ipfsUpload: ipfsResult,
          nftMinting: mintResult
        },
        status: autoMint ? 'completed' : 'pending_mint',
        message: autoMint 
          ? 'Workflow completed successfully with auto-minting'
          : 'Workflow completed, ready for manual minting'
      };

    } catch (error) {
      console.error('❌ Forte Actions workflow failed:', error);
      
      // 保存失败记录
      await this.saveWorkflowRecord({
        userId,
        prompt,
        status: 'failed',
        error: error.message,
        failedAt: new Date()
      });

      throw error;
    }
  }

  /**
   * AI音乐生成步骤
   */
  async generateMusic(params) {
    const {
      prompt,
      title,
      artist,
      genre,
      mood,
      duration
    } = params;

    try {
      // 使用AI服务生成音乐
      const musicResult = await aiService.generateMusic({
        prompt,
        duration,
        model: 'musicgen-stereo-large'
      });

      // 生成封面图
      const coverResult = await aiService.generateCoverImage({
        prompt: `Album cover for "${title}" by ${artist}, ${genre} music, ${mood} mood`,
        style: 'digital art'
      });

      return {
        audioUrl: musicResult.audioUrl,
        coverImageUrl: coverResult.imageUrl,
        aiModel: musicResult.model,
        generationTime: musicResult.generationTime,
        metadata: {
          title,
          artist,
          genre,
          mood,
          duration,
          prompt
        }
      };

    } catch (error) {
      console.error('AI generation failed:', error);
      throw new Error(`AI music generation failed: ${error.message}`);
    }
  }

  /**
   * IPFS上传步骤
   */
  async uploadToIPFS(params) {
    const {
      audioUrl,
      coverImageUrl,
      metadata,
      royalties
    } = params;

    try {
      // 上传音频文件
      const audioUpload = await ipfsService.uploadFromUrl(audioUrl, {
        filename: `${metadata.title.replace(/\s+/g, '_')}.mp3`,
        type: 'audio'
      });

      // 上传封面图片
      const coverUpload = await ipfsService.uploadFromUrl(coverImageUrl, {
        filename: `${metadata.title.replace(/\s+/g, '_')}_cover.jpg`,
        type: 'image'
      });

      // 创建NFT元数据
      const nftMetadata = {
        title: metadata.title,
        artist: metadata.artist,
        description: metadata.description || `AI-generated ${metadata.genre} music`,
        audioURL: `ipfs://${audioUpload.hash}`,
        coverImageURL: `ipfs://${coverUpload.hash}`,
        genre: metadata.genre,
        mood: metadata.mood,
        duration: metadata.duration,
        prompt: metadata.prompt,
        aiModel: metadata.aiModel,
        generatedAt: metadata.generatedAt,
        royalties: royalties.map(r => ({
          recipient: r.recipient,
          percentage: r.percentage,
          description: r.description
        })),
        attributes: [
          { trait_type: "Genre", value: metadata.genre },
          { trait_type: "Mood", value: metadata.mood },
          { trait_type: "Duration", value: `${metadata.duration}s` },
          { trait_type: "AI Model", value: metadata.aiModel },
          { trait_type: "Generation Type", value: "AI Generated" }
        ]
      };

      // 上传元数据
      const metadataUpload = await ipfsService.uploadJSON(nftMetadata, {
        filename: `${metadata.title.replace(/\s+/g, '_')}_metadata.json`
      });

      return {
        audio: audioUpload,
        cover: coverUpload,
        metadata: metadataUpload,
        nftMetadata
      };

    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error(`IPFS upload failed: ${error.message}`);
    }
  }

  /**
   * 自动铸造NFT步骤
   */
  async autoMintNFT(params) {
    const {
      userId,
      ipfsMetadata,
      royalties
    } = params;

    try {
      // 获取用户信息
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 使用Flow钱包地址或默认地址
      const recipientAddress = user.flowWallet?.address || user.address || process.env.FLOW_ADDRESS;
      if (!recipientAddress) {
        throw new Error('No Flow address found for user');
      }

      console.log(`🔗 Minting NFT for user ${user.username} at address ${recipientAddress}`);

      // 使用Flow服务进行真正的NFT铸造
      const flowService = (await import('./flowService.js')).default;
      
      const mintParams = {
        recipient: recipientAddress,
        title: ipfsMetadata.title || 'Untitled Music',
        description: ipfsMetadata.description || 'AI Generated Music NFT',
        audioHash: ipfsMetadata.audioHash || '',
        coverImageHash: ipfsMetadata.coverImageHash || '',
        metadataHash: ipfsMetadata.metadataHash || '',
        royalties: royalties.map(r => ({
          recipient: r.recipient || recipientAddress,
          percentage: r.percentage || 0
        }))
      };

      const mintResult = await flowService.mintMusicNFT(mintParams);

      if (!mintResult.success) {
        throw new Error('NFT minting failed on Flow blockchain');
      }

      // 保存NFT记录到数据库
      const nftRecord = new MusicNFT({
        title: ipfsMetadata.title,
        description: ipfsMetadata.description,
        creator: recipientAddress,
        owner: recipientAddress,
        music: {
          duration: ipfsMetadata.duration || 0,
          genre: ipfsMetadata.genre || 'AI Generated'
        },
        files: {
          audio: {
            url: ipfsMetadata.audioURL,
            ipfsHash: ipfsMetadata.audioHash || ''
          },
          cover: {
            url: ipfsMetadata.coverImageURL,
            ipfsHash: ipfsMetadata.coverImageHash || ''
          },
          metadata: {
            url: ipfsMetadata.metadataURL || '',
            ipfsHash: ipfsMetadata.metadataHash || ''
          }
        },
        blockchain: {
          tokenId: mintResult.tokenId,
          contractAddress: process.env.MUSIC_NFT_CONTRACT_ADDRESS || 'MusicNFT',
          transactionHash: mintResult.transactionId,
          blockNumber: mintResult.blockHeight,
          mintedAt: new Date(),
          network: 'flow'
        },
        royalties: royalties,
        status: 'minted'
      });

      // Save the NFT record
      await nftRecord.save();

      console.log(`✅ NFT record saved: ${nftRecord.id}`);

      return {
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionId,
        transactionId: mintResult.transactionId,
        nftId: nftRecord.id,
        contractAddress: process.env.MUSIC_NFT_CONTRACT_ADDRESS || 'MusicNFT',
        gasUsed: mintResult.gasUsed,
        blockHeight: mintResult.blockHeight,
        status: 'success',
        isMock: mintResult.isMock || false
      };

    } catch (error) {
      console.error('Auto-minting failed:', error);
      throw new Error(`Auto-minting failed: ${error.message}`);
    }
  }

  /**
   * 保存工作流记录
   */
  async saveWorkflowRecord(params) {
    const {
      userId,
      prompt,
      aiResult,
      ipfsResult,
      mintResult,
      status,
      error,
      completedAt,
      failedAt
    } = params;

    try {
      // 这里可以保存到数据库或日志系统
      const workflowRecord = {
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        prompt,
        steps: {
          aiGeneration: aiResult || null,
          ipfsUpload: ipfsResult || null,
          nftMinting: mintResult || null
        },
        status,
        error: error || null,
        createdAt: new Date(),
        completedAt: completedAt || null,
        failedAt: failedAt || null
      };

      // 保存到Redis或其他存储
      console.log('💾 Saving workflow record:', workflowRecord.id);
      
      return workflowRecord;

    } catch (error) {
      console.error('Failed to save workflow record:', error);
      throw error;
    }
  }

  /**
   * 获取工作流状态
   */
  async getWorkflowStatus(workflowId) {
    try {
      // 从存储中获取工作流记录
      // 这里可以从Redis或数据库查询
      console.log('📊 Getting workflow status for:', workflowId);
      
      return {
        workflowId,
        status: 'completed', // 示例状态
        steps: {
          aiGeneration: { status: 'completed', completedAt: new Date() },
          ipfsUpload: { status: 'completed', completedAt: new Date() },
          nftMinting: { status: 'completed', completedAt: new Date() }
        }
      };

    } catch (error) {
      console.error('Failed to get workflow status:', error);
      throw error;
    }
  }

  /**
   * 批量执行工作流
   */
  async executeBatchWorkflow(batchParams) {
    const results = [];
    
    for (const params of batchParams) {
      try {
        const result = await this.executeWorkflow(params);
        results.push({
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          params
        });
      }
    }

    return {
      total: batchParams.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
}

export default new ForteActionsService();