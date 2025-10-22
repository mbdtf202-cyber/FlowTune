-- QuickNode相关数据库表结构

-- 区块链区块表
CREATE TABLE IF NOT EXISTS blockchain_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  block_number BIGINT UNIQUE NOT NULL,
  block_hash VARCHAR(66) NOT NULL,
  timestamp DATETIME NOT NULL,
  transaction_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_block_number (block_number),
  INDEX idx_timestamp (timestamp)
);

-- NFT转移记录表
CREATE TABLE IF NOT EXISTS nft_transfers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_id BIGINT NOT NULL,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  block_number BIGINT NOT NULL,
  timestamp DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token_id (token_id),
  INDEX idx_from_address (from_address),
  INDEX idx_to_address (to_address),
  INDEX idx_timestamp (timestamp),
  INDEX idx_transaction_hash (transaction_hash)
);

-- 版税支付记录表
CREATE TABLE IF NOT EXISTS royalty_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_id BIGINT NOT NULL,
  recipient_address VARCHAR(42) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  transaction_hash VARCHAR(66) NOT NULL,
  block_number BIGINT NOT NULL,
  timestamp DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token_id (token_id),
  INDEX idx_recipient (recipient_address),
  INDEX idx_timestamp (timestamp),
  INDEX idx_transaction_hash (transaction_hash)
);

-- 事件订阅表
CREATE TABLE IF NOT EXISTS event_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_types JSON NOT NULL,
  webhook_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_active (is_active)
);

-- QuickNode连接状态表
CREATE TABLE IF NOT EXISTS quicknode_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  connection_status ENUM('connected', 'disconnected', 'error') NOT NULL,
  last_block_number BIGINT,
  last_event_timestamp DATETIME,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (connection_status),
  INDEX idx_updated (updated_at)
);

-- 区块链分析缓存表
CREATE TABLE IF NOT EXISTS blockchain_analytics_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  timeframe VARCHAR(20) NOT NULL,
  data JSON NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_metric_timeframe (metric_type, timeframe),
  INDEX idx_expires (expires_at)
);

-- 实时事件队列表
CREATE TABLE IF NOT EXISTS event_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  next_retry_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL,
  INDEX idx_processed (processed),
  INDEX idx_event_type (event_type),
  INDEX idx_retry (next_retry_at)
);

-- 添加一些初始数据
INSERT INTO quicknode_status (connection_status, last_block_number) 
VALUES ('disconnected', 0) 
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;