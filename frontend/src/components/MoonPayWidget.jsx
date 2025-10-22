import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCardIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const MoonPayWidget = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState('form'); // form, processing, success, error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [rates, setRates] = useState(null);
  const [currencies, setCurrencies] = useState(null);

  // 表单数据
  const [formData, setFormData] = useState({
    baseCurrency: 'USD',
    baseCurrencyAmount: '100',
    quoteCurrency: 'FLOW',
    walletAddress: ''
  });

  // 获取支持的货币和汇率
  useEffect(() => {
    if (isOpen) {
      fetchCurrencies();
      fetchRates();
    }
  }, [isOpen, formData.baseCurrency, formData.quoteCurrency]);

  const fetchCurrencies = async () => {
    try {
      const response = await api.request('/moonpay/currencies');
      if (response.success) {
        setCurrencies(response.data);
      }
    } catch (error) {
      console.error('获取货币列表失败:', error);
    }
  };

  const fetchRates = async () => {
    try {
      const response = await api.request(`/moonpay/rates?baseCurrency=${formData.baseCurrency}&quoteCurrency=${formData.quoteCurrency}`);
      if (response.success) {
        setRates(response.data);
      }
    } catch (error) {
      console.error('获取汇率失败:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const calculateQuoteAmount = () => {
    if (!rates || !formData.baseCurrencyAmount) return '0';
    const amount = parseFloat(formData.baseCurrencyAmount);
    const quoteAmount = amount * rates.rate;
    return quoteAmount.toFixed(6);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.walletAddress) {
      setError('Please enter wallet address');
      return;
    }

    const amount = parseFloat(formData.baseCurrencyAmount);
    if (isNaN(amount) || amount < 10 || amount > 10000) {
      setError('Purchase amount must be between $10 - $10,000');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.request('/moonpay/orders', {
        method: 'POST',
        body: formData
      });

      if (response.success) {
        setOrder(response.data);
        setStep('processing');
        
        // 开始轮询订单状态
        pollOrderStatus(response.data.id);
      } else {
        setError(response.error || 'Failed to create order');
      }
    } catch (error) {
      setError(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const pollOrderStatus = async (orderId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await api.request(`/moonpay/orders/${orderId}`);
        if (response.success) {
          const updatedOrder = response.data;
          setOrder(updatedOrder);

          if (updatedOrder.status === 'completed') {
            clearInterval(pollInterval);
            setStep('success');
            if (onSuccess) {
              onSuccess(updatedOrder);
            }
          } else if (updatedOrder.status === 'failed' || updatedOrder.status === 'expired') {
            clearInterval(pollInterval);
            setStep('error');
            setError(`Order ${updatedOrder.status === 'failed' ? 'failed' : 'expired'}`);
          }
        }
      } catch (error) {
        console.error('Failed to poll order status:', error);
      }
    }, 5000); // Check every 5 seconds

    // Stop polling after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 30 * 60 * 1000);
  };

  const handleClose = () => {
    setStep('form');
    setOrder(null);
    setError('');
    setFormData({
      baseCurrency: 'USD',
      baseCurrencyAmount: '100',
      quoteCurrency: 'FLOW',
      walletAddress: ''
    });
    onClose();
  };

  const renderForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <CreditCardIcon className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Buy FLOW Tokens</h3>
        <p className="text-sm text-gray-600">Quickly purchase FLOW tokens with fiat currency</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Purchase Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purchase Amount
          </label>
          <div className="relative">
            <select
              value={formData.baseCurrency}
              onChange={(e) => handleInputChange('baseCurrency', e.target.value)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none"
            >
              {currencies?.fiat?.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
            <input
              type="number"
              value={formData.baseCurrencyAmount}
              onChange={(e) => handleInputChange('baseCurrencyAmount', e.target.value)}
              className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="100"
              min="10"
              max="10000"
              step="0.01"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Minimum amount: $10, Maximum amount: $10,000</p>
        </div>

        {/* Exchange Rate Display */}
        {rates && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Rate</span>
              <span className="text-sm font-medium">
                1 {formData.baseCurrency} = {rates.rate} {formData.quoteCurrency}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">You will receive</span>
              <span className="text-lg font-semibold text-blue-600">
                {calculateQuoteAmount()} {formData.quoteCurrency}
              </span>
            </div>
            {rates.demo && (
              <p className="text-xs text-orange-600 mt-2">* Demo mode - using simulated exchange rate</p>
            )}
          </div>
        )}

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            FLOW Wallet Address
          </label>
          <input
            type="text"
            value={formData.walletAddress}
            onChange={(e) => handleInputChange('walletAddress', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0x..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">Please ensure the address is correct, tokens will be sent to this address</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Create Order</span>
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </form>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
        <ClockIcon className="w-8 h-8 text-yellow-600 animate-pulse" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing...</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your order is being processed, please wait
        </p>
        
        {order && (
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-xs">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span>{order.baseCurrencyAmount} {order.baseCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Will receive:</span>
                <span>{order.quoteCurrencyAmount} {order.quoteCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="capitalize">{order.status}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Usually takes 2-5 minutes to complete processing
      </p>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircleIcon className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Successful!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your FLOW tokens have been successfully purchased and sent to your wallet
        </p>
        
        {order && (
          <div className="bg-green-50 rounded-lg p-4 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Hash:</span>
                <span className="font-mono text-xs break-all">{order.transactionHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Received:</span>
                <span className="font-semibold text-green-600">
                  {order.quoteCurrencyAmount} {order.quoteCurrency}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleClose}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
      >
        Complete
      </button>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Failed</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setStep('form')}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
        <button
          onClick={handleClose}
          className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block align-bottom bg-white rounded-lg px-6 py-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              {/* Close Button */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="mt-2">
                {step === 'form' && renderForm()}
                {step === 'processing' && renderProcessing()}
                {step === 'success' && renderSuccess()}
                {step === 'error' && renderError()}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MoonPayWidget;