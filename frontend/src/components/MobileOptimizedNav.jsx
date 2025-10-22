import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { 
  Home, 
  Music, 
  PlusCircle, 
  User, 
  Menu, 
  X,
  Wallet,
  LogOut
} from 'lucide-react'

const MobileOptimizedNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/explore', label: t('nav.explore'), icon: Music },
    { path: '/create', label: t('nav.create'), icon: PlusCircle },
    { path: '/profile', label: t('nav.profile'), icon: User }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Logo - 调整位置更向左 */}
          <Link to="/" className="flex items-center space-x-2 -ml-2">
            <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              FlowTune
            </span>
          </Link>

            {/* Desktop Menu */}
            <div className="flex items-center space-x-8">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(path)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {user?.address?.slice(0, 6)}...{user?.address?.slice(-4)}
                  </span>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              ) : (
                <button className="btn-primary flex items-center space-x-1">
                  <Wallet className="h-4 w-4" />
                  <span>{t('common.connect')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden bg-white shadow-sm border-b border-gray-200">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Music className="h-7 w-7 text-primary-600" />
              <span className="text-lg font-bold text-gray-900">FlowTune</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="pb-4 border-t border-gray-200 mt-2">
              <div className="space-y-1 pt-4">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive(path)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                ))}
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="px-3 py-2">
                        <p className="text-sm text-gray-500">Connected Wallet</p>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.address?.slice(0, 8)}...{user?.address?.slice(-6)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          logout()
                          setIsMenuOpen(false)
                        }}
                        className="flex items-center space-x-3 px-3 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>{t('common.logout')}</span>
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Wallet className="h-5 w-5" />
                      <span>{t('common.connect')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom Navigation for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-4 h-16">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center space-y-1 ${
                isActive(path)
                  ? 'text-primary-600'
                  : 'text-gray-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Spacer for bottom navigation */}
      <div className="lg:hidden h-16"></div>
    </>
  )
}

export default MobileOptimizedNav