/**
 * QuickNode 服务
 * 提供优化的RPC连接和实时事件监听功能
 */

import { WebSocket } from 'ws';
import axios from 'axios';
import logger from '../utils/logger.js';
import database from '../config/database.js';

class QuickNodeService {
  constructor() {
    this.rpcEndpoint = process.env.QUICKNODE_RPC_URL || 'https://flow-mainnet.quicknode.pro/your-endpoint';
    this.wsEndpoint = process.env.QUICKNODE_WS_URL || 'wss://flow-mainnet.quicknode.pro/your-endpoint';
    this.apiKey = process.env.QUICKNODE_API_KEY || 'your-api-key';
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventListeners = new Map();
    this.db = database;
  }

  /**
   * 初始化QuickNode连接
   */
  async initialize() {
    try {
      // 测试RPC连接
      await this.testRPCConnection();
      
      // 建立WebSocket连接用于实时事件
      await this.connectWebSocket();
      
      logger.info('QuickNode service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize QuickNode service:', error);
      return false;
    }
  }

  /**
   * 测试RPC连接
   */
  async testRPCConnection() {
    try {
      const response = await axios.post(this.rpcEndpoint, {
        jsonrpc: '2.0',
        method: 'flow_getLatestBlock',
        params: [true],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 10000
      });

      if (response.data && response.data.result) {
        logger.info('QuickNode RPC connection successful');
        return response.data.result;
      } else {
        throw new Error('Invalid RPC response');
      }
    } catch (error) {
      logger.error('QuickNode RPC connection failed:', error.message);
      throw error;
    }
  }

  /**
   * 建立WebSocket连接
   */
  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsEndpoint, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });

        this.ws.on('open', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          logger.info('QuickNode WebSocket connected');
          
          // 订阅事件
          this.subscribeToEvents();
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleWebSocketMessage(data);
        });

        this.ws.on('close', () => {
          this.isConnected = false;
          logger.warn('QuickNode WebSocket disconnected');
          this.handleReconnect();
        });

        this.ws.on('error', (error) => {
          logger.error('QuickNode WebSocket error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 处理重连
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // 指数退避
      
      logger.info(`Attempting to reconnect to QuickNode WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        this.connectWebSocket().catch(error => {
          logger.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      logger.error('Max reconnection attempts reached for QuickNode WebSocket');
    }
  }

  /**
   * 订阅Flow区块链事件
   */
  subscribeToEvents() {
    if (!this.isConnected || !this.ws) return;

    // 订阅新区块
    this.ws.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'flow_subscribe',
      params: ['newHeads'],
      id: 1
    }));

    // 订阅交易事件
    this.ws.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'flow_subscribe',
      params: ['logs', {
        address: process.env.FLOW_CONTRACT_ADDRESS,
        topics: ['MusicNFTMinted', 'MusicNFTTransferred', 'RoyaltyPaid']
      }],
      id: 2
    }));

    logger.info('Subscribed to Flow blockchain events via QuickNode');
  }

  /**
   * 处理WebSocket消息
   */
  async handleWebSocketMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.method === 'flow_subscription') {
        const { subscription, result } = message.params;
        await this.processEvent(subscription, result);
      }
    } catch (error) {
      logger.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * 处理区块链事件
   */
  async processEvent(subscription, eventData) {
    try {
      // 新区块事件
      if (eventData.number) {
        await this.handleNewBlock(eventData);
      }
      
      // 合约事件
      if (eventData.topics && eventData.topics.length > 0) {
        await this.handleContractEvent(eventData);
      }

      // 触发注册的监听器
      const listeners = this.eventListeners.get(subscription) || [];
      listeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (error) {
          logger.error('Error in event listener:', error);
        }
      });

    } catch (error) {
      logger.error('Error processing blockchain event:', error);
    }
  }

  /**
   * 处理新区块
   */
  async handleNewBlock(blockData) {
    try {
      // 记录区块信息
      await this.db.query(`
        INSERT INTO blockchain_blocks (
          block_number, block_hash, timestamp, transaction_count
        ) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          timestamp = VALUES(timestamp),
          transaction_count = VALUES(transaction_count)
      `, [
        blockData.number,
        blockData.hash,
        new Date(parseInt(blockData.timestamp) * 1000),
        blockData.transactions ? blockData.transactions.length : 0
      ]);

      logger.info(`New block processed: ${blockData.number}`);
    } catch (error) {
      logger.error('Error handling new block:', error);
    }
  }

  /**
   * 处理合约事件
   */
  async handleContractEvent(eventData) {
    try {
      const eventType = this.parseEventType(eventData.topics[0]);
      
      switch (eventType) {
        case 'MusicNFTMinted':
          await this.handleNFTMinted(eventData);
          break;
        case 'MusicNFTTransferred':
          await this.handleNFTTransferred(eventData);
          break;
        case 'RoyaltyPaid':
          await this.handleRoyaltyPaid(eventData);
          break;
        default:
          logger.info(`Unknown event type: ${eventType}`);
      }
    } catch (error) {
      logger.error('Error handling contract event:', error);
    }
  }

  /**
   * 处理NFT铸造事件
   */
  async handleNFTMinted(eventData) {
    try {
      // 解析事件数据
      const tokenId = this.parseEventData(eventData.data, 'uint256');
      const owner = this.parseEventData(eventData.topics[1], 'address');
      
      // 更新数据库中的NFT状态
      await this.db.query(`
        UPDATE music_nfts 
        SET 
          minting_status = 'completed',
          token_id = ?,
          minted_at = NOW(),
          owner_address = ?
        WHERE transaction_hash = ?
      `, [tokenId, owner, eventData.transactionHash]);

      logger.info(`NFT minted: Token ID ${tokenId} for ${owner}`);
    } catch (error) {
      logger.error('Error handling NFT minted event:', error);
    }
  }

  /**
   * 处理NFT转移事件
   */
  async handleNFTTransferred(eventData) {
    try {
      const tokenId = this.parseEventData(eventData.topics[3], 'uint256');
      const from = this.parseEventData(eventData.topics[1], 'address');
      const to = this.parseEventData(eventData.topics[2], 'address');

      // 记录转移历史
      await this.db.query(`
        INSERT INTO nft_transfers (
          token_id, from_address, to_address, transaction_hash, block_number, timestamp
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [tokenId, from, to, eventData.transactionHash, eventData.blockNumber]);

      // 更新NFT所有者
      await this.db.query(`
        UPDATE music_nfts 
        SET owner_address = ?
        WHERE token_id = ?
      `, [to, tokenId]);

      logger.info(`NFT transferred: Token ID ${tokenId} from ${from} to ${to}`);
    } catch (error) {
      logger.error('Error handling NFT transferred event:', error);
    }
  }

  /**
   * 处理版税支付事件
   */
  async handleRoyaltyPaid(eventData) {
    try {
      const tokenId = this.parseEventData(eventData.topics[1], 'uint256');
      const amount = this.parseEventData(eventData.data, 'uint256');
      const recipient = this.parseEventData(eventData.topics[2], 'address');

      // 记录版税支付
      await this.db.query(`
        INSERT INTO royalty_payments (
          token_id, recipient_address, amount, transaction_hash, block_number, timestamp
        ) VALUES (?, ?, ?, ?, ?, NOW())
      `, [tokenId, recipient, amount, eventData.transactionHash, eventData.blockNumber]);

      logger.info(`Royalty paid: ${amount} to ${recipient} for Token ID ${tokenId}`);
    } catch (error) {
      logger.error('Error handling royalty paid event:', error);
    }
  }

  /**
   * 解析事件类型
   */
  parseEventType(topic) {
    // 这里应该根据实际的事件签名来解析
    // 简化版本，实际应该使用ABI解码
    const eventSignatures = {
      '0x1234...': 'MusicNFTMinted',
      '0x5678...': 'MusicNFTTransferred',
      '0x9abc...': 'RoyaltyPaid'
    };
    
    return eventSignatures[topic] || 'Unknown';
  }

  /**
   * 解析事件数据
   */
  parseEventData(data, type) {
    // 简化版本，实际应该使用proper ABI解码
    if (type === 'uint256') {
      return parseInt(data, 16);
    } else if (type === 'address') {
      return data.slice(0, 42); // 取前42个字符作为地址
    }
    return data;
  }

  /**
   * 注册事件监听器
   */
  addEventListener(subscription, listener) {
    if (!this.eventListeners.has(subscription)) {
      this.eventListeners.set(subscription, []);
    }
    this.eventListeners.get(subscription).push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(subscription, listener) {
    const listeners = this.eventListeners.get(subscription);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 获取区块链统计信息
   */
  async getBlockchainStats() {
    try {
      const [blockStats, nftStats, royaltyStats] = await Promise.all([
        this.db.query('SELECT COUNT(*) as total_blocks, MAX(block_number) as latest_block FROM blockchain_blocks'),
        this.db.query('SELECT COUNT(*) as total_nfts, COUNT(CASE WHEN minting_status = "completed" THEN 1 END) as minted_nfts FROM music_nfts'),
        this.db.query('SELECT COUNT(*) as total_payments, SUM(amount) as total_amount FROM royalty_payments')
      ]);

      return {
        blocks: blockStats[0],
        nfts: nftStats[0],
        royalties: royaltyStats[0],
        connection_status: this.isConnected ? 'connected' : 'disconnected'
      };
    } catch (error) {
      logger.error('Error getting blockchain stats:', error);
      throw error;
    }
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    logger.info('QuickNode service closed');
  }
}

export default new QuickNodeService();