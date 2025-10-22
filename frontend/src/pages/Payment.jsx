import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MoonPayWidget from '../components/MoonPayWidget';

import {
  CreditCardIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClockIcon,
  GlobeAltIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const Payment = () => {
  const { user } = useAuth();
  const [showMoonPay, setShowMoonPay] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serviceStatus, setServiceStatus] = useState(null);

  useEffect(() => {
    if (user) {
      fetchPurchaseHistory();
    }
    fetchServiceStatus();
  }, [user]);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      const response = await api.request('/moonpay/history?limit=5');
      if (response.success) {
        setPurchaseHistory(response.data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch purchase history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceStatus = async () => {
    try {
      const response = await api.request('/moonpay/status');
      if (response.success) {
        setServiceStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch service status:', error);
    }
  };

  const handlePurchaseSuccess = (order) => {
    // Refresh purchase history
    fetchPurchaseHistory();
    
    // Show success message
    console.log('Purchase successful:', order);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'expired':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCardIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fiat Purchase</h1>
              <p className="text-gray-600">Buy FLOW tokens quickly with fiat currency</p>
            </div>
          </div>

          {/* Service Status */}
          {serviceStatus && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-sm font-medium">
                    Production Mode
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Active Transactions: {serviceStatus.activeTransactions}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Purchase Entry */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Buy FLOW Tokens</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <CurrencyDollarIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">Multiple Fiat Currencies</h3>
                  <p className="text-sm text-gray-600">USD, EUR, GBP, CNY, JPY</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <ClockIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">Fast Settlement</h3>
                  <p className="text-sm text-gray-600">Usually completed in 2-5 minutes</p>
                </div>
              </div>

              {!user ? (
                <div className="text-center py-8">
                  <CreditCardIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
                  <p className="text-gray-600 mb-6">
                    Please connect your wallet to use fiat purchase feature
                  </p>
                  <button
                    onClick={() => window.location.href = '/auth'}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Login Now
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => setShowMoonPay(true)}
                    className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
                  >
                    Start Purchase
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Secure, fast, and convenient fiat purchase experience
                  </p>
                </div>
              )}
            </div>

            {/* Purchase History */}
            {user && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Purchase History</h2>
                  <button
                    onClick={fetchPurchaseHistory}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {purchaseHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCardIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No purchase records</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchaseHistory.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm text-gray-600">
                            {order.id}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Purchase Amount:</span>
                            <span className="ml-2 font-medium">
                              {order.baseCurrencyAmount} {order.baseCurrency}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Received:</span>
                            <span className="ml-2 font-medium">
                              {order.quoteCurrencyAmount} {order.quoteCurrency}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Time:</span>
                            <span className="ml-2">{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Security Assurance */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Assurance</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <ShieldCheckIcon className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Bank-level Security</h4>
                    <p className="text-sm text-gray-600">Adopts the highest level of security standards</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Compliance Certification</h4>
                    <p className="text-sm text-gray-600">Complies with global financial regulatory requirements</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <GlobeAltIcon className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Global Support</h4>
                    <p className="text-sm text-gray-600">Supports multiple countries and regions worldwide</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CreditCardIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Credit / Debit Card</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">Bank Transfer</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">Digital Wallet</span>
                </div>
              </div>
            </div>

            {/* Fee Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Information</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction Fee:</span>
                  <span className="text-gray-900">2.5%</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Network Fee:</span>
                  <span className="text-gray-900">Included</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Minimum Amount:</span>
                  <span className="text-gray-900">$10</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Maximum Amount:</span>
                  <span className="text-gray-900">$10,000</span>
                </div>
                
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    * Specific fees vary by payment method and region
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MoonPay Widget */}
        <MoonPayWidget
          isOpen={showMoonPay}
          onClose={() => setShowMoonPay(false)}
          onSuccess={handlePurchaseSuccess}
        />
      </div>
    </div>
  );
};

export default Payment;