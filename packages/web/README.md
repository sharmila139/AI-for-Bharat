# RuralConnect AI - Web Application

Complete web version of RuralConnect AI built with React and TypeScript.

## Features

### 🌾 Smart Agriculture
- AI-powered crop recommendations
- Soil analysis and health scoring
- Weather intelligence and alerts
- Market price tracking
- Sustainable farming knowledge base

### 🏥 Primary Healthcare
- AI first aid assistant
- Symptom checker
- Natural remedies database (300+ remedies)
- Nutrition tracking and meal planning
- Emergency contacts

### 📚 Education & Skill Development
- Adaptive learning platform
- Multi-language content (15+ languages)
- Video lessons and interactive games
- Progress tracking and gamification
- Offline content download

### 🏗️ Infrastructure & Civic Engagement
- Visual grievance reporting
- Community opinion polls
- Project progress tracking
- Transparency dashboard
- Real-time status updates

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS Modules
- **Deployment**: AWS S3 + CloudFront

## Development

### Prerequisites
- Node.js 18+ and npm

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

Output will be in the `build/` directory.

## Deployment

### Deploy to AWS S3

1. Make sure AWS credentials are configured:
```bash
source ../../.aws/env.sh
```

2. Run the deployment script:
```bash
chmod +x build-and-deploy.sh
./build-and-deploy.sh
```

### Manual Deployment

```bash
# Build the app
npm run build

# Deploy to S3
aws s3 sync build/ s3://ruralconnect-web-032761628276 --delete
```

## Configuration

Edit `src/config.ts` to change the API endpoint:

```typescript
export const API_BASE_URL = 'https://your-api-gateway-url.amazonaws.com';
```

## Project Structure

```
packages/web/
├── src/
│   ├── components/      # Reusable components
│   │   └── Layout.tsx   # Main layout with navigation
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   ├── Agriculture.tsx
│   │   ├── Health.tsx
│   │   ├── Education.tsx
│   │   └── Infrastructure.tsx
│   ├── App.tsx          # Main app component with routing
│   ├── config.ts        # Configuration
│   └── main.tsx         # Entry point
├── build/               # Production build output
├── index.html           # HTML template
├── package.json
└── vite.config.ts       # Vite configuration
```

## API Integration

The web app connects to the backend API at:
```
https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com
```

### Available Endpoints

- `GET /` - Health check
- `GET /api/agriculture/crop-recommendations` - Get crop recommendations
- `POST /api/agriculture/soil-analysis` - Analyze soil
- `POST /api/auth/login` - User authentication

## Features by Module

### Agriculture Module
- Crop recommendation engine
- Soil health analysis
- Weather forecasts and alerts
- Market price intelligence
- Sustainable farming practices

### Health Module
- Symptom checker with AI
- First aid guidance
- Natural remedies database
- Nutrition planning
- Emergency contacts

### Education Module
- Adaptive learning paths
- Video lessons library
- Interactive quizzes
- Progress tracking
- Multi-language support

### Infrastructure Module
- Grievance reporting system
- Community polls
- Project tracking dashboard
- Transparency features
- Status updates

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Initial load: < 3s
- Time to Interactive: < 5s
- Bundle size: < 500KB (gzipped)

## License

Copyright © 2024 RuralConnect AI
