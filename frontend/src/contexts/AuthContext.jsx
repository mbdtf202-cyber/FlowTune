import React, { createContext, useContext, useEffect, useState } from 'react'
import * as fcl from '@onflow/fcl'
import { getFlowService } from '../services/flowService'
import flowServiceAPI from '../services/flowServiceAPI'
import walletServiceLocal from '../services/walletLocal'
import logger from '../services/logger.jsx'
import config, { flowConfig } from '../config/environment'
import permissionService from '../services/permissions'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [networkError, setNetworkError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [flowService, setFlowService] = useState(null)
  const [userBalance, setUserBalance] = useState('0')
  const [userNFTs, setUserNFTs] = useState([])
  const [isLocalMode] = useState(flowConfig.localMode || config.LOCAL_DEMO_MODE)

  useEffect(() => {
    let unsubscribe = null
    let retryTimeout = null

    const initializeAuth = async () => {
      try {
        logger.info('Initializing authentication', { isLocalMode })
        
        // 在本地模式下使用本地钱包服务
        if (isLocalMode) {
          logger.info('Local mode: using local wallet service')
          
          // 在本地演示模式下自动连接第一个用户
          if (config.LOCAL_DEMO_MODE) {
            logger.info('Auto-connecting demo user in LOCAL_DEMO_MODE')
            try {
              const result = await walletServiceLocal.connect()
              if (result.success) {
                logger.info('Demo user auto-connected successfully', result.user)
              }
            } catch (error) {
              logger.error('Demo user auto-connect failed', error)
            }
          }
          
          // 设置本地钱包服务监听器
          walletServiceLocal.addListener((event, data) => {
            switch (event) {
              case 'connect':
                setUser({
                  loggedIn: true,
                  addr: data.addr,
                  name: data.name,
                  avatar: data.avatar
                })
                setUserBalance(data.balance.toString())
                setUserNFTs(data.nfts || [])
                break
              case 'disconnect':
                setUser(null)
                setUserBalance('0')
                setUserNFTs([])
                break
              case 'userChanged':
                setUser({
                  loggedIn: true,
                  addr: data.addr,
                  name: data.name,
                  avatar: data.avatar
                })
                setUserBalance(data.balance.toString())
                setUserNFTs(data.nfts || [])
                break
              default:
                break
            }
          })
          
          setNetworkError(null)
          setLoading(false)
          return
        }
        
        // 设置FlowServiceAPI并测试连接
        try {
          await flowServiceAPI.initializeFCL()
          setFlowService(flowServiceAPI)
          logger.info('FlowServiceAPI initialized successfully')
          setNetworkError(null) // 清除之前的网络错误
        } catch (flowError) {
          logger.error('FlowServiceAPI initialization failed', flowError)
          
          setNetworkError(flowError)
          setLoading(false)
          
          // 实现重试逻辑
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
            logger.info(`Retrying connection in ${delay}ms (attempt ${retryCount + 1}/3)`)
            retryTimeout = setTimeout(() => {
              setRetryCount(prev => prev + 1)
              setLoading(true)
              initializeAuth()
            }, delay)
          }
          return
        }

        // Subscribe to authentication state changes with error handling
        unsubscribe = fcl.currentUser.subscribe(
          async (currentUser) => {
            const loggedInUser = currentUser.loggedIn ? currentUser : null
            setUser(loggedInUser)
            setLoading(false)
            setNetworkError(null)
            setRetryCount(0)
            
            // 如果用户已登录，获取用户数据
            if (loggedInUser && flowService) {
              try {
                logger.info('User logged in, fetching user data', { address: loggedInUser.addr })
                
                // 获取用户余额
                const balance = await flowService.getBalance(loggedInUser.addr)
                setUserBalance(balance)
                logger.info('User balance fetched', { balance })
                
                // 获取用户NFT
                const nfts = await flowService.getUserNFTs(loggedInUser.addr)
                setUserNFTs(nfts)
                logger.info('User NFTs fetched', { count: nfts.length })
                
                // 初始化用户权限
                permissionService.initializeFromUser({
                  role: loggedInUser.role || 'user',
                  customPermissions: loggedInUser.permissions || []
                })
              } catch (error) {
                logger.error('Failed to fetch user data', error, { address: loggedInUser.addr })
              }
            } else if (!loggedInUser) {
               // 用户登出，清空数据
               setUserBalance('0')
               setUserNFTs([])
               permissionService.reset()
             }
          },
          (error) => {
            console.error('Flow authentication error:', error)
            setNetworkError(error)
            setLoading(false)
            
            // Implement retry logic for network errors
            if (retryCount < 3) {
              const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
              retryTimeout = setTimeout(() => {
                setRetryCount(prev => prev + 1)
                setLoading(true)
                initializeAuth()
              }, delay)
            }
          }
        )
      } catch (error) {
        console.error('Failed to initialize Flow authentication:', error)
        setNetworkError(error)
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (unsubscribe) unsubscribe()
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [retryCount])

  const login = async () => {
    try {
      setLoading(true)
      setNetworkError(null)
      logger.info('User attempting to login', { isLocalMode })
      
      if (isLocalMode) {
        // 使用本地钱包服务
        const result = await walletServiceLocal.connect()
        if (!result.success) {
          throw new Error(result.error)
        }
        
        // 更新用户状态
        setUser({
          loggedIn: true,
          addr: result.user.addr,
          name: result.user.name || 'Local User',
          avatar: result.user.avatar || '👤'
        })
        
        logger.info('Local wallet login successful', { address: result.user.addr })
        return result
      }
      
      // 使用FlowServiceAPI进行钱包连接
      const result = await flowServiceAPI.connectWallet()
      if (!result.success) {
        throw new Error(result.error)
      }
      
      // 更新用户状态
      setUser({
        loggedIn: true,
        addr: result.user.addr,
        name: result.user.name || 'Flow User',
        avatar: result.user.avatar || '👤'
      })
      
      logger.info('Flow wallet login successful', { address: result.user.addr })
      return result
    } catch (error) {
      logger.error('Login failed', error)
      setNetworkError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      setNetworkError(null)
      logger.info('User logging out', { isLocalMode })
      
      if (isLocalMode) {
        // 使用本地钱包服务
        const result = await walletServiceLocal.disconnect()
        if (!result.success) {
          throw new Error(result.error)
        }
        logger.info('Local wallet logout successful')
        return result
      }
      
      // 使用FlowServiceAPI断开钱包连接
      const result = await flowServiceAPI.disconnectWallet()
      if (!result.success) {
        logger.warn('Wallet disconnection failed:', result.error)
      }
      
      setUser(null)
      setUserBalance('0')
      setUserNFTs([])
      permissionService.reset()
      logger.info('User logged out successfully')
    } catch (error) {
      logger.error('Logout failed', error)
      setNetworkError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const retryConnection = () => {
    setRetryCount(0)
    setNetworkError(null)
    setLoading(true)
  }

  const initializeAccount = async () => {
    if (!user) {
      throw new Error('User must be logged in to initialize account')
    }

    try {
      setIsSettingUp(true)
      
      if (isLocalMode) {
        // 在本地模式下，模拟账户初始化
        logger.info('Local mode: simulating account initialization')
        await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟延迟
        logger.info('Local account setup completed successfully')
        return { success: true, txId: 'local-mock-tx-' + Date.now() }
      }
      
      if (!flowService) {
        throw new Error('Flow service not initialized')
      }
      
      const txId = await flowService.setupAccount()
      
      // Wait for transaction to be sealed
      const result = await fcl.tx(txId).onceSealed()
      
      if (result.status === 4) {
        console.log('Account setup completed successfully')
        return { success: true, txId }
      } else {
        throw new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Account setup failed:', error)
      throw error
    } finally {
      setIsSettingUp(false)
    }
  }

  const value = {
    user,
    loading,
    isSettingUp,
    networkError,
    retryCount,
    userBalance,
    userNFTs,
    flowService,
    login,
    logout,
    initializeAccount,
    retryConnection,
    isAuthenticated: !!user,
    address: user?.addr || null,
    hasNetworkError: !!networkError,
    isLocalMode,
    // 本地模式特有功能
    switchUser: isLocalMode ? walletServiceLocal.switchUser.bind(walletServiceLocal) : null,
    getAvailableUsers: isLocalMode ? walletServiceLocal.getAvailableUsers.bind(walletServiceLocal) : null,
    getWalletStatus: isLocalMode ? walletServiceLocal.getStatus.bind(walletServiceLocal) : null,
    // FlowService 方法
    createNFT: flowService?.createNFT.bind(flowService),
    buyNFT: flowService?.buyNFT.bind(flowService),
    listNFT: flowService?.listNFT.bind(flowService),
    getMarketNFTs: flowService?.getMarketNFTs.bind(flowService),
    refreshUserData: async () => {
      if (user && flowService) {
        try {
          const balance = await flowService.getBalance(user.addr)
          setUserBalance(balance)
          const nfts = await flowService.getUserNFTs(user.addr)
          setUserNFTs(nfts)
        } catch (error) {
          logger.error('Failed to refresh user data', error)
        }
      }
    },
    // 权限相关方法
    hasPermission: permissionService.hasPermission.bind(permissionService),
    hasAnyPermission: permissionService.hasAnyPermission.bind(permissionService),
    hasAllPermissions: permissionService.hasAllPermissions.bind(permissionService),
    getUserRole: permissionService.getUserRole.bind(permissionService),
    getUserPermissions: permissionService.getUserPermissions.bind(permissionService),
    isAdmin: permissionService.isAdmin.bind(permissionService),
    isCreator: permissionService.isCreator.bind(permissionService),
    isCollector: permissionService.isCollector.bind(permissionService)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}