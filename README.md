# FlowTune 🎵

<div align="center">

**Language / 语言**

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](./README.md)
[![中文](https://img.shields.io/badge/Language-中文-red?style=for-the-badge)](./README_CN.md)

</div>

---

**FlowTune** is a decentralized music NFT platform built on the Flow blockchain, empowering music creators to mint, trade, and manage their music NFTs.

## 🚀 Quick Deploy to Production

### Option 1: Railway One-Click Deploy (Recommended)
```bash
./deploy-railway.sh
```

### Option 2: Vercel Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mbdtf202-cyber/FlowTune)

### Option 3: Render Deploy
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Option 4: Docker Local Deploy
```bash
# Docker Desktop required
./deploy-production.sh
```

## 📖 Documentation

### Deployment Guide
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions, including:
- Local Docker deployment
- Cloud platform deployment (Railway, Render, DigitalOcean, VPS)
- Environment variable configuration
- Troubleshooting

### Complete Documentation
- 📚 [User Guide](./docs/USER_GUIDE.md) - Platform usage and feature introduction
- 🔧 [Developer Guide](./docs/DEVELOPER_GUIDE.md) - Technical architecture and development guide
- 🔒 [Security Implementation Report](./docs/API_SECURITY_IMPLEMENTATION.md) - Security measures and protection strategies
- 📋 [API Documentation](./docs/API_DOCUMENTATION.md) - Complete API interface documentation
- 🎬 [Demo Video Script](./docs/DEMO_VIDEO_SCRIPT.md) - Product demonstration script
- 🛡️ [Security Audit Report](./docs/SECURITY_AUDIT_REPORT.md) - Security assessment report

## 🔧 Environment Configuration

Prepare the following API keys before deployment:
- **OpenAI API Key**: For AI music generation
- **Replicate API Token**: For music model inference
- **Pinata API Keys**: For IPFS storage
- **Flow Blockchain Config**: For NFT minting (optional)

## 🎭 Demo Data

The project includes complete demo data:
- **4 Demo Users**: AI Composer, Melody Master, Beat Creator, Synth Wave
- **5 Demo NFTs**: Covering different music styles and price ranges
- **Complete Market Data**: Including sales history, statistics, etc.

### Run Demo Data Seed Script
```bash
cd backend
node scripts/seedDemoData.js
```

### Demo User Login Information
- **Username**: ai_composer | **Email**: composer@flowtune.demo | **Password**: DemoPass123
- **Username**: melody_master | **Email**: melody@flowtune.demo | **Password**: DemoPass123
- **Username**: beat_creator | **Email**: beats@flowtune.demo | **Password**: DemoPass123
- **Username**: synth_wave | **Email**: synth@flowtune.demo | **Password**: DemoPass123

## 🌐 Access URLs

After deployment, your application will be available at:
- **Railway**: `https://your-app.railway.app`
- **Vercel**: `https://your-app.vercel.app`
- **Render**: `https://your-app.onrender.com`
- **Local**: `http://localhost`

## ✨ Features

- 🎵 **Music NFT Minting**: Support audio file upload and NFT minting
- 🔐 **Flow Wallet Integration**: Support mainstream wallets like Blocto, Dapper
- 🎨 **Modern UI**: Responsive design with dark mode support
- 🛡️ **Security Protection**: Complete security policies and permission management
- 📊 **Real-time Monitoring**: Integrated performance monitoring and error tracking
- 🚀 **Automated Deployment**: Complete CI/CD pipeline

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern frontend framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Query** - Data fetching and caching

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Redis** - Cache and session storage
- **JWT** - Authentication

### Blockchain
- **Flow Blockchain** - Primary blockchain platform
- **FCL (Flow Client Library)** - Flow client library
- **Cadence** - Flow smart contract language

### Deployment
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Nginx** - Reverse proxy
- **Prometheus & Grafana** - Monitoring

## 🚀 Quick Start

### Requirements

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose (optional)

### Local Development

1. **Clone the project**
```bash
git clone https://github.com/mbdtf202-cyber/FlowTune.git
cd FlowTune
```

2. **Install dependencies**
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. **Configure environment variables**
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

4. **Start databases**
```bash
# Start database and Redis using Docker Compose
docker-compose up -d postgres redis
```

5. **Run database migrations**
```bash
cd backend
npm run migrate
```

6. **Start development servers**
```bash
# Start backend (port 5000)
cd backend
npm run dev

# Start frontend (port 3000)
cd frontend
npm run dev
```

Visit http://localhost:3000 to view the application.

### Docker Deployment

1. **Build and start all services**
```bash
docker-compose up -d
```

2. **Check service status**
```bash
docker-compose ps
```

3. **View logs**
```bash
docker-compose logs -f app
```

## 📁 Project Structure

```
FlowTune/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React Context
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # Style files
│   ├── public/             # Static assets
│   └── tests/              # Frontend tests
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── scripts/            # Database scripts
│   └── tests/              # Backend tests
├── cadence/                # Flow blockchain contracts
│   ├── contracts/          # Smart contracts
│   ├── scripts/            # Blockchain scripts
│   └── transactions/       # Transaction templates
├── docs/                   # Project documentation
├── config/                 # Configuration files
└── deployment/             # Deployment scripts
```

## 🔒 Security

FlowTune implements comprehensive security measures:

- **Authentication**: JWT-based authentication with secure token management
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Input validation, SQL injection prevention, XSS protection
- **Rate Limiting**: API rate limiting to prevent abuse
- **HTTPS**: Enforced HTTPS in production
- **Security Headers**: Comprehensive security headers implementation

## 🧪 Testing

### Run Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# E2E tests
npm run test:e2e
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage
```

## 📊 Monitoring

The platform includes comprehensive monitoring:

- **Performance Monitoring**: Real-time performance metrics
- **Error Tracking**: Automatic error detection and reporting
- **User Analytics**: User behavior and engagement tracking
- **System Health**: Infrastructure monitoring and alerting

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🌟 Acknowledgments

- Flow Blockchain team for the excellent blockchain platform
- React and Node.js communities for the amazing frameworks
- All contributors who helped make this project possible

## 📞 Contact

- **Project Repository**: https://github.com/mbdtf202-cyber/FlowTune
- **Live Demo**: https://flowtune-8jri4nnz0-mbdtf202-cybers-projects.vercel.app
- **Issues**: https://github.com/mbdtf202-cyber/FlowTune/issues

---

**Project Status**: 🚧 In Development
**Expected Completion**: [Hackathon Deadline]

---

<div align="center">

**Language / 语言**

[![English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](./README.md)
[![中文](https://img.shields.io/badge/Language-中文-red?style=for-the-badge)](./README_CN.md)

Made with ❤️ for the Flow blockchain community

</div>