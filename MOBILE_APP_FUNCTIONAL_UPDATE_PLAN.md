# Mobile App Functional Update & Deployment Plan

## 🎯 Objective

Update the React Native mobile app with full backend integration, authentication, and functional features matching the web app, then test and deploy a new APK.

---

## 📋 Current Status

### What Exists
✅ Complete app structure with navigation
✅ Auth screens (Phone, OTP, Profile Setup)
✅ All module screens (Agriculture, Health, Education, Infrastructure)
✅ Service layer architecture
✅ Offline support with Realm
✅ Language context (15 languages)
✅ Component library

### What Needs Update
❌ API base URL (currently localhost)
❌ Backend integration in services
❌ Auth flow with real API
❌ Functional buttons and forms
❌ Loading states
❌ Error handling
❌ Real data from backend

---

## 🔧 Implementation Plan

### Phase 1: Configuration & Setup (30 min)

#### 1.1 Update API Configuration
**File**: `packages/mobile/src/config/api-config.ts`

```typescript
export const API_BASE_URL = 'https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com';
export const API_TIMEOUT = 30000;
export const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
export const MAX_PHOTOS_PER_GRIEVANCE = 5;
export const COMPRESSED_PHOTO_MAX_SIZE = 500 * 1024;
```

#### 1.2 Create API Client
**File**: `packages/mobile/src/services/api/client.ts`

```typescript
import { API_BASE_URL, API_TIMEOUT } from '../../config/api-config';

export class APIClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = API_TIMEOUT;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async get<T>(endpoint: string): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    body: any
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

export const apiClient = new APIClient();
```

---

### Phase 2: Authentication Implementation (45 min)

#### 2.1 Update Auth Context
**File**: `packages/mobile/src/contexts/AuthContext.tsx`

Add real authentication logic:
- Phone number validation
- OTP verification (mock for now, can integrate Twilio later)
- Profile creation
- Token management
- Persistent login

#### 2.2 Update Auth Screens

**PhoneInputScreen.tsx**:
- Add phone validation
- Connect to backend (or mock for demo)
- Loading states
- Error handling

**OTPVerificationScreen.tsx**:
- OTP input validation
- Verification logic
- Resend OTP functionality
- Error handling

**ProfileSetupScreen.tsx**:
- Profile form validation
- Submit to backend
- Navigate to dashboard on success

---

### Phase 3: Agriculture Module (30 min)

#### 3.1 Update Crop Recommendation Service
**File**: `packages/mobile/src/services/cropRecommendationService.ts`

```typescript
import { apiClient } from './api/client';

export const getCropRecommendations = async (params: {
  soilType?: string;
  location?: string;
  season?: string;
  farmSize?: string;
}) => {
  return await apiClient.post('/api/agriculture/crop-recommendations', params);
};
```

#### 3.2 Update Crop Recommendation Screen
- Connect to service
- Add loading states
- Display results
- Error handling

#### 3.3 Update Soil Analysis Service
```typescript
export const analyzeSoil = async (params: {
  pH?: number;
  nitrogen?: string;
  phosphorus?: string;
  potassium?: string;
  organicMatter?: string;
}) => {
  return await apiClient.post('/api/agriculture/soil-analysis', params);
};
```

---

### Phase 4: Health Module (30 min)

#### 4.1 Update Health Service
**File**: `packages/mobile/src/services/healthService.ts`

```typescript
import { apiClient } from './api/client';

export const checkSymptoms = async (symptoms: string) => {
  return await apiClient.post('/api/health/symptom-check', { symptoms });
};

export const getRemedies = async (search?: string) => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return await apiClient.get(`/api/health/remedies${query}`);
};
```

#### 4.2 Update Symptom Checker Screen
- Symptom input form
- Connect to API
- Display assessment results
- Show severity, conditions, first aid steps
- Error handling

#### 4.3 Update Remedies Screen
- List remedies from API
- Search functionality
- Display remedy details

---

### Phase 5: Infrastructure Module (30 min)

#### 5.1 Create Grievance Service
**File**: `packages/mobile/src/services/grievanceService.ts`

```typescript
import { apiClient } from './api/client';

export const submitGrievance = async (params: {
  description: string;
  location?: string;
  category?: string;
}) => {
  return await apiClient.post('/api/infrastructure/grievance', params);
};

export const getGrievances = async () => {
  return await apiClient.get('/api/infrastructure/grievance');
};
```

#### 5.2 Update Grievance Screens
- Submission form with photo upload (optional)
- Connect to API
- Show success with ticket ID
- List grievances
- Track status

---

### Phase 6: Education Module (20 min)

#### 6.1 Update Education Service
- Content listing
- Video streaming
- Progress tracking
- Quiz functionality

**Note**: Can use mock data for now if backend endpoints not ready

---

### Phase 7: UI/UX Improvements (30 min)

#### 7.1 Add Loading Components
- Spinner component
- Skeleton loaders
- Button loading states

#### 7.2 Add Error Components
- Error messages
- Retry buttons
- Offline indicators

#### 7.3 Add Success Feedback
- Toast notifications
- Success screens
- Confirmation modals

---

### Phase 8: Testing (45 min)

#### 8.1 Local Testing
- Test on Android emulator
- Test all features
- Test error scenarios
- Test offline mode

#### 8.2 Device Testing
- Install on real Android device
- Test performance
- Test on different screen sizes
- Test network conditions

---

### Phase 9: Build & Deploy (30 min)

#### 9.1 Update App Version
**File**: `packages/mobile/app.json`

```json
{
  "version": "1.1.0",
  "android": {
    "versionCode": 2
  }
}
```

#### 9.2 Build APK
```bash
cd packages/mobile
eas build --platform android --profile preview
```

#### 9.3 Test APK
- Download and install
- Full feature testing
- Performance check

---

## 🎨 Key Features to Implement

### 1. Landing/Onboarding Screen
- Welcome slides
- Feature highlights
- Language selection
- Get started button

### 2. Authentication Flow
- Phone number input
- OTP verification
- Profile setup
- Skip option for demo

### 3. Dashboard
- Module cards
- Quick actions
- Recent activity
- Notifications

### 4. Agriculture Features
- ✅ Crop recommendations (AI-powered)
- ✅ Soil analysis
- Weather alerts
- Market prices

### 5. Health Features
- ✅ Symptom checker (AI-powered)
- ✅ Natural remedies database
- First aid guides
- Nutrition tracking

### 6. Infrastructure Features
- ✅ Grievance submission
- ✅ Grievance tracking
- Community polls
- Project monitoring

### 7. Education Features
- Content library
- Video player
- Progress tracking
- Quizzes

---

## 📱 Testing Checklist

### Functional Testing
- [ ] App launches successfully
- [ ] Onboarding flow works
- [ ] Authentication flow works
- [ ] All navigation works
- [ ] Crop recommendations fetch data
- [ ] Symptom checker analyzes symptoms
- [ ] Grievance submission works
- [ ] Grievance list loads
- [ ] Language switching works
- [ ] Offline mode works

### UI/UX Testing
- [ ] Loading states display
- [ ] Error messages show
- [ ] Success feedback works
- [ ] Buttons are responsive
- [ ] Forms validate input
- [ ] Scrolling is smooth
- [ ] Images load correctly

### Performance Testing
- [ ] App starts in <3 seconds
- [ ] API calls complete in <5 seconds
- [ ] No memory leaks
- [ ] Smooth animations (60 FPS)
- [ ] Battery usage acceptable

### Device Testing
- [ ] Works on Android 5.0+
- [ ] Works on different screen sizes
- [ ] Works on low-end devices
- [ ] Works with slow network
- [ ] Works offline

---

## 🚀 Deployment Steps

### Step 1: Prepare Code
```bash
# Update API configuration
# Implement all services
# Update all screens
# Add loading/error states
# Test locally
```

### Step 2: Build APK
```bash
cd packages/mobile
git add .
git commit -m "feat: add full backend integration and functional features"
eas build --platform android --profile preview
```

### Step 3: Download & Test
```bash
# Download APK from Expo
# Install on device
# Test all features
# Fix any issues
```

### Step 4: Deploy
```bash
# Upload APK to distribution platform
# Update landing page
# Share download link
```

---

## 🔐 Authentication Strategy

### For Demo/Testing
**Option 1: Mock Authentication**
- Any phone number works
- Any OTP works (e.g., "123456")
- Skip profile setup option
- Immediate access to features

**Option 2: Simple Backend Auth**
- Store users in S3 JSON file
- Generate simple tokens
- Basic validation

### For Production
- Integrate AWS Cognito
- Or use Twilio for SMS OTP
- JWT tokens
- Secure storage

---

## 🎯 AI Model Information

### Symptom Checker
**Primary Model**: Claude 3 Sonnet (AWS Bedrock)
- Model ID: `anthropic.claude-3-sonnet-20240229-v1:0`
- Use case: Medical reasoning, symptom analysis
- Response time: 1-3 seconds
- Cost: ~$0.003 per 1K tokens

**Fallback Model**: Amazon Titan Text Express
- Model ID: `amazon.titan-text-express-v1`
- Use case: Backup when Claude unavailable
- Response time: <1 second
- Cost: ~$0.0008 per 1K tokens

**Emergency Fallback**: Rule-based
- Static first aid guidance
- No AI required
- Instant response
- Free

### Crop Recommendations
**Same AI models as symptom checker**
- Agricultural expertise
- Local crop knowledge
- Market analysis
- Weather considerations

---

## 📊 Estimated Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Configuration & Setup | 30 min | ⏳ Pending |
| 2 | Authentication | 45 min | ⏳ Pending |
| 3 | Agriculture Module | 30 min | ⏳ Pending |
| 4 | Health Module | 30 min | ⏳ Pending |
| 5 | Infrastructure Module | 30 min | ⏳ Pending |
| 6 | Education Module | 20 min | ⏳ Pending |
| 7 | UI/UX Improvements | 30 min | ⏳ Pending |
| 8 | Testing | 45 min | ⏳ Pending |
| 9 | Build & Deploy | 30 min | ⏳ Pending |
| **Total** | | **4.5 hours** | |

---

## 🎉 Success Criteria

✅ App installs successfully
✅ Onboarding flow complete
✅ Authentication works (mock or real)
✅ All module screens functional
✅ Crop recommendations work
✅ Symptom checker works
✅ Grievance submission works
✅ Loading states display
✅ Error handling works
✅ Offline mode functional
✅ Language switching works
✅ Performance acceptable
✅ No crashes
✅ Ready for demo

---

## 📝 Next Steps

1. **Confirm Approach**: Review this plan
2. **Start Implementation**: Begin with Phase 1
3. **Iterative Testing**: Test after each phase
4. **Build APK**: Once all phases complete
5. **Device Testing**: Test on real device/emulator
6. **Deploy**: Share new APK

---

**Ready to start?** Let me know and I'll begin implementing the mobile app updates!
