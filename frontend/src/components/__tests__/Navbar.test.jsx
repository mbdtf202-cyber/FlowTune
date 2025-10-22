import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import Navbar from '../Navbar'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'nav.home': 'Home',
        'nav.create': 'Create',
        'nav.audioLibrary': 'Audio Library',
        'nav.marketplace': 'Marketplace',
        'nav.analytics': 'Analytics',
        'nav.profile': 'Profile',
        'nav.billing': 'Billing',
        'nav.documentation': 'Documentation'
      }
      return translations[key] || key
    },
  }),
}))

// Mock WalletConnect component
vi.mock('../WalletConnect', () => ({
  default: () => <div data-testid="wallet-connect">WalletConnect</div>
}))

// Mock ConnectionStatus component
vi.mock('../ConnectionStatus', () => ({
  default: () => <div data-testid="connection-status">ConnectionStatus</div>
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Music: () => <div data-testid="music-icon">Music</div>,
  Home: () => <div data-testid="home-icon">Home</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  ShoppingBag: () => <div data-testid="shopping-bag-icon">ShoppingBag</div>,
  BarChart3: () => <div data-testid="bar-chart-icon">BarChart3</div>,
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="x-icon">X</div>,
  Library: () => <div data-testid="library-icon">Library</div>,
  CreditCard: () => <div data-testid="credit-card-icon">CreditCard</div>,
  BookOpen: () => <div data-testid="book-open-icon">BookOpen</div>,
  User: () => <div data-testid="user-icon">User</div>,
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Navbar', () => {
  it('renders without crashing', () => {
    renderWithRouter(<Navbar />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    renderWithRouter(<Navbar />)
    
    // 检查是否有导航链接存在
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders wallet connect and connection status components', () => {
    renderWithRouter(<Navbar />)
    // 检查组件是否存在，不限制数量
    expect(screen.getAllByTestId('wallet-connect').length).toBeGreaterThan(0)
    expect(screen.getAllByTestId('connection-status').length).toBeGreaterThan(0)
  })
})