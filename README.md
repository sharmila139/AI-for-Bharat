# RuralConnect AI

> Empowering rural communities in India through AI-driven insights in agriculture, healthcare, education, and infrastructure management.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.10-blue)](https://www.python.org/)

## 🌟 Overview

RuralConnect AI is a comprehensive mobile-first application designed to bridge the digital divide for rural communities. Built with offline-first architecture and powered by AWS services including Amazon Bedrock, the platform provides intelligent assistance across four critical domains:

- **🌾 Smart Agriculture**: AI-powered crop recommendations, soil analysis, weather intelligence
- **🏥 Primary Healthcare**: First aid assistant, natural medicine database, nutrition tracking
- **📚 Education**: Adaptive learning platform with curriculum-aligned content
- **🏛️ Infrastructure**: Visual grievance reporting, community polls, project tracking

## 🎯 Key Features

- **Offline-First**: Core features work without internet connectivity
- **Multi-Language**: Support for 15+ Indian languages with voice interface
- **AI-Powered**: Amazon Bedrock integration for conversational AI and intelligent recommendations
- **Accessible**: Voice commands and audio guidance for low-literacy users
- **Privacy-First**: End-to-end encryption and minimal data collection
- **Low-Resource**: Optimized for devices with 1GB RAM and 2G/3G networks

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (React Native)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Agriculture│  │  Health  │  │Education │  │Infrastruc│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                          │                                    │
│                   Realm Database (Offline)                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │  API Gateway │
                    └──────┬──────┘
                           │
        ┏━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━┓
        ┃         Backend Services (Node.js)  ┃
        ┃  ┌────────────┐  ┌────────────┐    ┃
        ┃  │   Auth     │  │   Sync     │    ┃
        ┃  └────────────┘  └────────────┘    ┃
        ┗━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━┛
                           │
        ┏━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━┓
        ┃      ML Services (Python/FastAPI)   ┃
        ┃  ┌────────────┐  ┌────────────┐    ┃
        ┃  │Crop Model  │  │Image Class │    ┃
        ┃  └────────────┘  └────────────┘    ┃
        ┗━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━┛
                           │
        ┏━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━┓
        ┃          AWS Services                ┃
        ┃  ┌────────────┐  ┌────────────┐    ┃
        ┃  │  Bedrock   │  │  Lambda    │    ┃
        ┃  │   (AI)     │  │            │    ┃
        ┃  └────────────┘  └────────────┘    ┃
        ┃  ┌────────────┐  ┌────────────┐    ┃
        ┃  │    RDS     │  │ DynamoDB   │    ┃
        ┃  │(PostgreSQL)│  │            │    ┃
        ┃  └────────────┘  └────────────┘    ┃
        ┃  ┌────────────┐  ┌────────────┐    ┃
        ┃  │     S3     │  │CloudFront  │    ┃
        ┃  └────────────┘  └────────────┘    ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```


## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **Yarn** >= 1.22.0
- **Python** >= 3.10
- **AWS Account** with Bedrock access
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/ruralconnect-ai.git
   cd ruralconnect-ai
   ```

2. **Install JavaScript dependencies**
   ```bash
   yarn install
   ```

3. **Install Python dependencies**
   ```bash
   cd packages/ml-services
   pip install -r requirements.txt
   # or using poetry
   poetry install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials and API keys
   ```

5. **Set up AWS infrastructure**
   ```bash
   # Follow AWS setup guide in docs/aws-setup.md
   ```

### Running the Application

**Start the backend server:**
```bash
yarn backend
```

**Start the ML services:**
```bash
yarn ml
```

**Start the mobile app:**
```bash
yarn mobile
# Then press 'a' for Android or 'i' for iOS
```

## 📦 Project Structure

```
ruralconnect-ai/
├── packages/
│   ├── mobile/              # React Native mobile app
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules
│   │   │   ├── components/  # Shared components
│   │   │   ├── navigation/  # Navigation config
│   │   │   └── utils/       # Utilities
│   │   └── package.json
│   ├── backend/             # Node.js backend
│   │   ├── src/
│   │   │   ├── routes/      # API routes
│   │   │   ├── services/    # Business logic
│   │   │   ├── models/      # Database models
│   │   │   └── middleware/  # Express middleware
│   │   └── package.json
│   ├── ml-services/         # Python ML services
│   │   ├── models/          # ML models
│   │   ├── api/             # FastAPI endpoints
│   │   └── requirements.txt
│   └── shared/              # Shared TypeScript types
├── docs/                    # Documentation
├── .kiro/                   # Kiro spec files
└── package.json             # Root package.json
```

## 🧪 Testing

**Run all tests:**
```bash
yarn test
```

**Run unit tests:**
```bash
yarn workspace @ruralconnect/backend test
```

**Run property-based tests:**
```bash
yarn workspace @ruralconnect/backend test:properties
```

**Run E2E tests:**
```bash
yarn workspace @ruralconnect/mobile test:e2e
```


## 🤖 AI Integration with Amazon Bedrock

### Why AI is Required

RuralConnect AI leverages artificial intelligence to:

1. **Intelligent Crop Recommendations**: Analyze soil, climate, and market data to suggest optimal crops
2. **Conversational Interface**: Natural language understanding for users with varying literacy levels
3. **Image Classification**: Automatically categorize soil types and infrastructure issues from photos
4. **Adaptive Learning**: Personalize educational content based on student performance
5. **Predictive Analytics**: Forecast weather patterns and market prices

### AWS Services Used

| Service | Purpose | Value Added |
|---------|---------|-------------|
| **Amazon Bedrock** | Foundation models for conversational AI | Enables natural language interaction in 15+ languages |
| **AWS Lambda** | Serverless compute for API endpoints | Scales automatically, reduces infrastructure costs |
| **Amazon RDS** | PostgreSQL database | Reliable relational data storage with automated backups |
| **Amazon DynamoDB** | NoSQL database for sessions | Fast, scalable key-value storage for user sessions |
| **Amazon S3** | Object storage for media files | Durable storage for images, videos, and documents |
| **Amazon CloudFront** | CDN for content delivery | Fast content delivery even on slow networks |
| **Amazon API Gateway** | API management | Secure, scalable API endpoints with rate limiting |
| **AWS Amplify** | Mobile app deployment | Simplified deployment and hosting |
| **Amazon ElastiCache** | Redis caching layer | Reduces database load, improves response times |
| **Amazon CloudWatch** | Monitoring and logging | Real-time insights into system health |

### Value AI Adds to User Experience

- **Accessibility**: Voice-based interaction removes literacy barriers
- **Personalization**: Tailored recommendations based on user context
- **Efficiency**: Automated categorization saves time for users and officials
- **Accuracy**: ML models provide data-driven insights for better decisions
- **Scalability**: AI handles thousands of queries without human intervention

## 📊 Correctness Properties

The system implements 49 correctness properties validated through property-based testing:

- Authentication and security (4 properties)
- Offline-first and sync (4 properties)
- Agriculture module (8 properties)
- Healthcare module (7 properties)
- Education module (3 properties)
- Infrastructure module (9 properties)
- Cross-module features (4 properties)
- System-wide properties (10 properties)

See [design.md](.kiro/specs/ruralconnect-ai/design.md) for complete property definitions.

## 🛠️ Technology Stack

**Frontend:**
- React Native 0.72+
- Redux Toolkit (state management)
- Realm Database (offline storage)
- React Navigation (routing)

**Backend:**
- Node.js 18+ with Express.js
- PostgreSQL (relational data)
- MongoDB (document storage)
- Redis (caching)

**ML/AI:**
- Python 3.10+ with FastAPI
- TensorFlow & PyTorch
- Hugging Face Transformers
- Amazon Bedrock (foundation models)

**Cloud:**
- AWS (Bedrock, Lambda, RDS, S3, CloudFront, etc.)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

RuralConnect AI Team

## 🙏 Acknowledgments

- AWS for providing cloud infrastructure and AI services
- Open source community for amazing tools and libraries
- Rural communities for inspiring this project

## 📞 Support

For questions or support, please open an issue on GitHub or contact us at support@ruralconnect.ai

---

**Built with ❤️ for rural India**
