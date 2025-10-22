import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Music, Home, Plus, ShoppingBag, BarChart3, Menu, X, Library, CreditCard, BookOpen, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import NotificationCenter from './NotificationCenter'

const Navbar = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t } = useTranslation()

  // Group navigation items for visual separation
  const primaryNavigation = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.create'), href: '/create', icon: Plus },
  ]

  const libraryNavigation = [
    { name: t('nav.audioLibrary'), href: '/audio-library', icon: Music },
    { name: t('nav.musicLibrary'), href: '/music-library', icon: Library },
    { name: t('nav.marketplace'), href: '/marketplace', icon: ShoppingBag },
  ]

  const analyticsNavigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: BarChart3 },
    { name: t('nav.analytics'), href: '/analytics', icon: BarChart3 },
  ]

  const userNavigation = [
    { name: 'Payment', href: '/payment', icon: CreditCard },
    { name: t('nav.profile'), href: '/profile', icon: User },
  ]

  const allNavigation = [...primaryNavigation, ...libraryNavigation, ...analyticsNavigation, ...userNavigation]

  const isActive = (path) => location.pathname === path

  const renderNavGroup = (items, showSeparator = false) => (
    <>
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ease-in-out hover:scale-105 ${
              isActive(item.href)
                ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 border border-primary-200 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-sm'
            }`}
          >
            <Icon className={`h-4 w-4 transition-transform duration-200 ${isActive(item.href) ? 'scale-110' : 'group-hover:scale-110'}`} />
            <span className="whitespace-nowrap">{item.name}</span>
          </Link>
        )
      })}
      {showSeparator && (
        <div className="h-5 w-px bg-gray-200 mx-1.5"></div>
      )}
    </>
  )

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group mr-6">
            <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              FlowTune
            </span>
          </Link>

          {/* Desktop Navigation - Grouped display */}
          <div className="hidden lg:flex items-center flex-1">
            <div className="flex items-center space-x-2">
              {renderNavGroup(primaryNavigation, false)}
            </div>
            <div className="h-5 w-px bg-gray-200 mx-3"></div>
            <div className="flex items-center space-x-2">
              {renderNavGroup(libraryNavigation, false)}
            </div>
            <div className="h-5 w-px bg-gray-200 mx-3"></div>
            <div className="flex items-center space-x-2">
              {renderNavGroup(analyticsNavigation, false)}
            </div>
            <div className="h-5 w-px bg-gray-200 mx-3"></div>
            <div className="flex items-center space-x-2">
              {renderNavGroup(userNavigation, false)}
            </div>
          </div>

          {/* Desktop Actions - Enhanced spacing and visual effects */}
          <div className="hidden lg:flex items-center space-x-4 ml-auto">
            <div className="flex items-center space-x-3">
              <NotificationCenter />
            </div>
          </div>

          {/* Tablet Navigation (md to lg) */}
          <div className="hidden md:flex lg:hidden items-center space-x-2">
            {allNavigation.slice(0, 5).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  title={item.name}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              )
            })}
            <div className="h-5 w-px bg-gray-200 mx-2"></div>
            <NotificationCenter />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Improved layout and spacing */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-6 bg-white/95 backdrop-blur-sm">
            {/* Main Navigation */}
            <div className="space-y-1 mb-6">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Main Features
              </h3>
              {primaryNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl mx-2 text-base font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Library */}
            <div className="space-y-1 mb-6">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Library
              </h3>
              {libraryNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl mx-2 text-base font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Analytics Tools */}
            <div className="space-y-1 mb-6">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Analytics Tools
              </h3>
              {analyticsNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl mx-2 text-base font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* User Features */}
            <div className="space-y-1 mb-6">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                User Features
              </h3>
              {userNavigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-4 px-4 py-3.5 rounded-xl mx-2 text-base font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 border border-primary-200'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar