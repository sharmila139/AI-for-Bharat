# RuralConnect AI - Design Specification

**Version:** 1.0  
**Last Updated:** February 7, 2026  
**Status:** Design Phase

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [System Architecture](#system-architecture)
3. [Module 1: Smart Agriculture](#module-1-smart-agriculture)
4. [Module 2: Primary Health Care](#module-2-primary-health-care)
5. [Module 3: Education & Skill Development](#module-3-education--skill-development)
6. [Module 4: Infrastructure & Civic Engagement](#module-4-infrastructure--civic-engagement)
7. [Cross-Module Integration](#cross-module-integration)
8. [Technical Specifications](#technical-specifications)
9. [Data Models](#data-models)
10. [API Design](#api-design)
11. [Security & Privacy](#security--privacy)
12. [Performance Requirements](#performance-requirements)

---

## Executive Overview

### Vision
RuralConnect AI is a comprehensive mobile-first application designed to empower rural communities through AI-driven insights in agriculture, healthcare, education, and infrastructure management.

### Core Design Principles

1. **Offline-First Architecture**: All core features must function without internet connectivity
2. **Low Bandwidth Optimization**: Compressed assets, progressive loading, adaptive quality
3. **Multi-Language Support**: 15+ Indian languages with voice interface
4. **Accessibility**: Voice commands, audio responses for low-literacy users
5. **Privacy by Design**: End-to-end encryption, minimal data collection, user consent
6. **Mobile-First**: Optimized for low-end Android devices (1GB RAM minimum)

### Target Platform Requirements

- **Primary Platform**: Android 8.0+ (API Level 26)
- **Device Compatibility**: Low-end devices (1GB RAM, 8GB storage)
- **Network**: Functional on 2G/3G with offline support
- **App Size**: <50MB initial download, modular content downloads
- **Secondary Platform**: Progressive Web App (PWA) for web access

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
│  ┌──────────┬──────────┬──────────┬──────────────────────┐ │
│  │Agriculture│  Health  │Education │  Infrastructure      │ │
│  │  Module   │  Module  │  Module  │     Module           │ │
│  └──────────┴──────────┴──────────┴──────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Cross-Module Services Layer                   │  │
│  │  • AI Assistant  • Notifications  • User Profile     │  │
│  │  • Document Vault  • Gamification  • Analytics       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Offline-First Data Layer                 │  │
│  │  • SQLite/Realm  • Sync Queue  • Cache Manager       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                        │
│  ┌──────────┬──────────┬──────────┬──────────────────────┐ │
│  │  REST    │   AI/ML  │  Weather │  Government APIs     │ │
│  │   API    │  Engine  │   APIs   │  Integration         │ │
│  └──────────┴──────────┴──────────┴──────────────────────┘ │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Database Layer (PostgreSQL + MongoDB)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```


### Technology Stack

**Frontend (Mobile)**
- Framework: React Native 0.72+
- State Management: Redux Toolkit with Redux Persist
- Offline Storage: Realm Database
- UI Components: React Native Paper (Material Design)
- Navigation: React Navigation 6.x
- Media: React Native Video, React Native Image Picker
- Maps: React Native Maps (Google Maps)
- Voice: React Native Voice, React Native TTS

**Backend**
- Runtime: Node.js 18+ with Express.js
- API: RESTful with GraphQL for complex queries
- Authentication: JWT with refresh tokens
- Real-time: Socket.io for live updates
- Task Queue: Bull (Redis-based) for async jobs
- Cron Jobs: node-cron for scheduled tasks

**AI/ML Services**
- Framework: Python 3.10+ with FastAPI
- ML Libraries: TensorFlow 2.x, scikit-learn, PyTorch
- NLP: Hugging Face Transformers
- Computer Vision: OpenCV, TensorFlow Object Detection
- Deployment: TensorFlow Serving, ONNX Runtime

**Databases**
- Primary: PostgreSQL 14+ (relational data)
- Document Store: MongoDB 6+ (logs, unstructured data)
- Cache: Redis 7+ (sessions, real-time data)
- Search: Elasticsearch 8+ (full-text search)

**Cloud Infrastructure**
- Provider: AWS (primary) / Google Cloud (backup)
- Storage: S3 for media files
- CDN: CloudFront for content delivery
- Compute: EC2 with Auto Scaling Groups
- Container Orchestration: ECS/EKS for microservices

**External Integrations**
- Weather: IMD API, OpenWeatherMap
- Market Data: AGMARKNET API
- Maps: Google Maps API
- SMS: Twilio, AWS SNS
- Payment: UPI, Razorpay (future)
- Government: UMANG API, DigiLocker

---

## Module 1: Smart Agriculture

### 1.1 Crop Selection & Market Demand AI

#### Feature Overview
Intelligent recommendation engine analyzing real-time market data, historical trends, and local conditions to suggest optimal crops for maximum profitability.

#### Component Architecture

```
User Input → Data Collection → AI Processing → Recommendation Engine → Output
    ↓              ↓                ↓                  ↓                ↓
Location      Soil Type      Market Analysis    Ranking Algorithm   Top 5 Crops
Season        Farm Size      Weather Data       Risk Assessment     Profit Projections
Budget        Irrigation     Historical Trends  Suitability Score   Timeline
History       Resources      Demand Forecast    Effort-Reward       Investment
```

#### Data Models

**CropRecommendationRequest**
```typescript
interface CropRecommendationRequest {
  userId: string;
  location: {
    latitude: number;
    longitude: number;
    district: string;
    state: string;
  };
  season: 'kharif' | 'rabi' | 'zaid' | 'summer' | 'winter';
  farmDetails: {
    sizeInHectares: number;
    soilType: 'clay' | 'sandy' | 'loamy' | 'silt' | 'peat' | 'chalk';
    irrigationType: 'rainfed' | 'drip' | 'sprinkler' | 'flood';
    previousCrops: string[]; // last 3 seasons
  };
  budget: {
    min: number;
    max: number;
    currency: 'INR';
  };
}
```

**CropRecommendation**
```typescript
interface CropRecommendation {
  cropId: string;
  cropName: {
    english: string;
    local: string;
  };
  ranking: number; // 1-5
  scores: {
    profitability: number; // 0-100
    marketStability: number; // 0-100
    suitability: number; // 0-100
    sustainability: number; // 0-100
    overall: number; // weighted average
  };
  financials: {
    expectedYieldPerHectare: number;
    totalInvestment: InvestmentBreakdown;
    expectedRevenue: RevenueProjection;
    profitMargin: {
      best: number;
      average: number;
      worst: number;
    };
  };
  timeline: {
    sowingWindow: DateRange;
    growingDuration: number; // days
    harvestWindow: DateRange;
    monthlyActivities: Activity[];
  };
  requirements: {
    water: WaterRequirement;
    fertilizer: FertilizerRequirement;
    labor: LaborRequirement;
  };
  riskFactors: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
    mitigation: string[];
  };
  companionCrops: string[]; // for intercropping
  difficultyLevel: 'beginner' | 'intermediate' | 'expert';
  governmentSchemes: Scheme[];
}
```


#### AI/ML Algorithm Design

**Recommendation Engine Pipeline**

1. **Data Collection Phase**
   - Fetch real-time market prices from AGMARKNET API
   - Retrieve 3-year historical price trends
   - Get weather forecast and historical climate data
   - Load regional crop success rates from database

2. **Feature Engineering**
   - Soil compatibility score (soil type × crop requirements)
   - Climate suitability index (temperature, rainfall match)
   - Market demand indicator (price trends, procurement data)
   - Resource availability score (water, labor, capital)
   - Risk factor calculation (pest vulnerability, price volatility)

3. **ML Model: Ensemble Approach**
   - **Random Forest Classifier**: Crop suitability prediction
   - **Gradient Boosting Regressor**: Yield prediction
   - **Time Series Model (Prophet)**: Price forecasting
   - **Collaborative Filtering**: Success patterns from similar farmers

4. **Ranking Algorithm**
   ```python
   overall_score = (
       0.35 * profitability_score +
       0.25 * market_stability_score +
       0.20 * suitability_score +
       0.15 * sustainability_score +
       0.05 * ease_of_cultivation_score
   )
   ```

5. **Output Generation**
   - Top 5 crops ranked by overall score
   - Detailed financial projections
   - Risk assessment and mitigation strategies
   - Timeline with critical activities

#### API Endpoints

```typescript
// Get crop recommendations
POST /api/v1/agriculture/crops/recommend
Request: CropRecommendationRequest
Response: {
  recommendations: CropRecommendation[];
  metadata: {
    generatedAt: Date;
    dataSourcesUsed: string[];
    confidenceLevel: number;
  };
}

// Compare crops side-by-side
POST /api/v1/agriculture/crops/compare
Request: {
  cropIds: string[]; // max 3
  farmDetails: FarmDetails;
}
Response: {
  comparison: ComparisonMatrix;
  visualizations: {
    radarChart: ChartData;
    timeline: TimelineData;
  };
}

// Get market prices
GET /api/v1/agriculture/market/prices
Query: {
  cropId: string;
  location: string;
  dateRange?: DateRange;
}
Response: {
  currentPrice: number;
  priceHistory: PricePoint[];
  forecast: PriceForecast[];
}
```

#### Offline Capability

**Cached Data (Updated Daily)**
- Last 30 days market prices for top 50 crops
- Regional crop suitability matrix
- Basic recommendation algorithm (rule-based fallback)
- Crop requirement tables

**Sync Strategy**
- Download market data when connected (background sync)
- Queue user feedback for upload
- Sync actual yield data after harvest
- Update ML model monthly (delta updates)

---

### 1.2 Soil & Water Analysis

#### Feature Overview
Digital soil health assessment with AI-powered photo analysis, fertilizer recommendations, and intelligent irrigation scheduling.

#### Component Architecture

```
Input Methods → Analysis Engine → Recommendation System → Output
     ↓               ↓                    ↓                  ↓
Photo Upload    Image OCR          Nutrient Calculator   Soil Health Score
Manual Entry    AI Detection       Fertilizer Planner    Application Schedule
Govt Card       Data Validation    Irrigation Scheduler  Cost Analysis
Test Kit        Health Scoring     pH Correction         Dealer Locator
```

#### Data Models

**SoilHealthCard**
```typescript
interface SoilHealthCard {
  id: string;
  userId: string;
  fieldId: string;
  testDate: Date;
  source: 'photo' | 'manual' | 'government' | 'testkit';
  
  nutrients: {
    nitrogen: { value: number; unit: 'kg/ha'; status: NutrientStatus };
    phosphorus: { value: number; unit: 'kg/ha'; status: NutrientStatus };
    potassium: { value: number; unit: 'kg/ha'; status: NutrientStatus };
    organicCarbon: { value: number; unit: '%'; status: NutrientStatus };
    micronutrients: {
      zinc: number;
      boron: number;
      iron: number;
      manganese: number;
    };
  };
  
  properties: {
    pH: { value: number; status: 'acidic' | 'neutral' | 'alkaline' };
    electricalConductivity: number; // dS/m
    texture: {
      sand: number; // %
      silt: number; // %
      clay: number; // %
      classification: SoilTexture;
    };
  };
  
  healthScore: {
    overall: number; // 0-100
    breakdown: {
      phBalance: number;
      organicMatter: number;
      npkStatus: number;
      micronutrients: number;
      texture: number;
    };
  };
  
  photos?: string[]; // S3 URLs
  governmentCardId?: string;
}

type NutrientStatus = 'deficient' | 'low' | 'medium' | 'high' | 'excessive';
type SoilTexture = 'clay' | 'sandy' | 'loamy' | 'silt' | 'peat' | 'chalk';
```


**FertilizerRecommendation**
```typescript
interface FertilizerRecommendation {
  id: string;
  soilHealthCardId: string;
  cropId: string;
  targetYield: number;
  
  nutrientRequirements: {
    nitrogen: number; // kg/ha
    phosphorus: number;
    potassium: number;
    micronutrients: Record<string, number>;
  };
  
  applicationSchedule: ApplicationStage[];
  
  products: {
    chemical: FertilizerProduct[];
    organic: OrganicAlternative[];
    mixed: MixedApproach[];
  };
  
  costAnalysis: {
    chemical: CostBreakdown;
    organic: CostBreakdown;
    mixed: CostBreakdown;
    roi: {
      chemical: number;
      organic: number;
      mixed: number;
    };
  };
  
  nearestDealers: Dealer[];
  reminders: ReminderSchedule[];
}

interface ApplicationStage {
  stage: 'basal' | 'tillering' | 'flowering' | 'grain-filling';
  daysAfterSowing: number;
  products: {
    name: string;
    quantity: number;
    unit: string;
    applicationMethod: string;
    weatherConditions: string[];
  }[];
  cost: number;
}
```

**IrrigationSchedule**
```typescript
interface IrrigationSchedule {
  id: string;
  fieldId: string;
  cropId: string;
  plantingDate: Date;
  
  cropWaterRequirement: {
    total: number; // mm for entire season
    byStage: Record<GrowthStage, number>;
  };
  
  waterSources: {
    type: 'canal' | 'borewell' | 'river' | 'pond' | 'rainwater';
    capacity: number; // liters/hour
    availability: AvailabilitySchedule;
  }[];
  
  irrigationEvents: IrrigationEvent[];
  
  efficiency: {
    currentMethod: string;
    efficiency: number; // %
    waterSaved: number; // liters
    costSaved: number; // INR
    recommendations: string[];
  };
  
  weatherIntegration: {
    rainfallForecast: RainfallData[];
    adjustedSchedule: boolean;
    nextIrrigation: Date | null;
  };
}

interface IrrigationEvent {
  eventNumber: number;
  scheduledDate: Date;
  growthStage: GrowthStage;
  waterRequired: number; // mm
  duration: number; // hours
  bestTime: 'early-morning' | 'evening';
  critical: boolean;
  status: 'pending' | 'completed' | 'skipped';
  actualDate?: Date;
  notes?: string;
}

type GrowthStage = 'germination' | 'vegetative' | 'flowering' | 'fruiting' | 'maturity';
```

#### AI/ML Components

**1. Photo-Based Soil Analysis**

**Model Architecture**
- Base Model: MobileNetV3 (optimized for mobile)
- Custom Classification Head: Soil type, color, texture
- OCR Module: Tesseract + Custom trained model for Govt cards
- Confidence Threshold: 85% for auto-acceptance

**Training Data**
- 50,000+ labeled soil images
- 10,000+ government soil health cards
- Augmentation: rotation, brightness, contrast variations

**Inference Pipeline**
```python
def analyze_soil_photo(image_path):
    # Preprocess image
    image = preprocess(image_path)
    
    # Detect if it's a government card
    is_govt_card = detect_card_type(image)
    
    if is_govt_card:
        # OCR extraction
        text_data = ocr_extract(image)
        nutrients = parse_nutrient_values(text_data)
        confidence = calculate_ocr_confidence(text_data)
    else:
        # Visual analysis
        soil_features = extract_features(image)
        nutrients = predict_nutrients(soil_features)
        confidence = model_confidence(soil_features)
    
    return {
        'nutrients': nutrients,
        'confidence': confidence,
        'requires_verification': confidence < 0.85
    }
```

**2. Fertilizer Recommendation Algorithm**

```python
def calculate_fertilizer_requirement(soil_data, crop, target_yield):
    # Nutrient removal by crop
    crop_removal = get_crop_nutrient_removal(crop, target_yield)
    
    # Current soil nutrient status
    available_nutrients = soil_data.nutrients
    
    # Calculate deficit
    deficit = {
        'N': max(0, crop_removal['N'] - available_nutrients['N']),
        'P': max(0, crop_removal['P'] - available_nutrients['P']),
        'K': max(0, crop_removal['K'] - available_nutrients['K'])
    }
    
    # Adjust for soil type and organic matter
    efficiency_factor = get_efficiency_factor(soil_data.texture, 
                                               soil_data.organic_carbon)
    
    # Final requirement
    requirement = {
        nutrient: deficit[nutrient] / efficiency_factor
        for nutrient in deficit
    }
    
    # Generate application schedule
    schedule = split_into_stages(requirement, crop.growth_stages)
    
    return schedule
```


**3. Irrigation Scheduling Algorithm**

```python
def calculate_irrigation_schedule(crop, soil, weather, planting_date):
    # Base crop water requirement (FAO Penman-Monteith)
    etc = calculate_crop_evapotranspiration(crop, weather)
    
    # Adjust for soil water holding capacity
    available_water = get_soil_water_capacity(soil.texture)
    
    # Factor in rainfall
    effective_rainfall = calculate_effective_rainfall(weather.forecast)
    
    # Calculate irrigation need
    irrigation_need = etc - effective_rainfall
    
    # Generate schedule based on critical growth stages
    schedule = []
    for stage in crop.growth_stages:
        if stage.water_critical:
            # More frequent irrigation during critical stages
            interval = calculate_interval(irrigation_need, available_water, 
                                          critical=True)
        else:
            interval = calculate_interval(irrigation_need, available_water, 
                                          critical=False)
        
        schedule.append({
            'date': planting_date + stage.start_day,
            'amount': irrigation_need * interval,
            'critical': stage.water_critical
        })
    
    return schedule

def adjust_for_weather(schedule, weather_forecast):
    """Real-time adjustment based on weather"""
    adjusted = []
    for event in schedule:
        # Check if rain expected within 2 days
        rain_expected = check_rainfall(event.date, weather_forecast, days=2)
        
        if rain_expected > 10:  # mm
            # Skip or delay irrigation
            event.status = 'skip'
            event.reason = f'Rain expected: {rain_expected}mm'
        elif rain_expected > 5:
            # Reduce irrigation amount
            event.amount *= 0.5
            event.reason = f'Light rain expected: {rain_expected}mm'
        
        adjusted.append(event)
    
    return adjusted
```

#### API Endpoints

```typescript
// Upload soil photo for analysis
POST /api/v1/agriculture/soil/analyze-photo
Content-Type: multipart/form-data
Request: {
  photo: File;
  fieldId: string;
  referenceObject?: string; // for scale
}
Response: {
  soilHealthCard: SoilHealthCard;
  confidence: number;
  requiresVerification: boolean;
}

// Manual soil data entry
POST /api/v1/agriculture/soil/manual-entry
Request: {
  fieldId: string;
  nutrients: NutrientData;
  properties: SoilProperties;
  testDate: Date;
}
Response: {
  soilHealthCard: SoilHealthCard;
}

// Get fertilizer recommendations
POST /api/v1/agriculture/fertilizer/recommend
Request: {
  soilHealthCardId: string;
  cropId: string;
  targetYield: number;
  preferences: {
    type: 'chemical' | 'organic' | 'mixed';
    budget?: number;
  };
}
Response: {
  recommendation: FertilizerRecommendation;
}

// Get irrigation schedule
POST /api/v1/agriculture/irrigation/schedule
Request: {
  fieldId: string;
  cropId: string;
  plantingDate: Date;
  irrigationType: string;
  waterSource: WaterSource;
}
Response: {
  schedule: IrrigationSchedule;
  nextIrrigation: IrrigationEvent;
}

// Update irrigation event
PATCH /api/v1/agriculture/irrigation/events/:eventId
Request: {
  status: 'completed' | 'skipped';
  actualDate?: Date;
  notes?: string;
}
Response: {
  event: IrrigationEvent;
  updatedSchedule: IrrigationSchedule;
}
```

---

### 1.3 Climate & Weather Integration

#### Feature Overview
Hyper-local weather intelligence with proactive alerts and crop-specific advisories powered by multiple data sources.

#### Component Architecture

```
Data Sources → Aggregation → Processing → Alert Engine → Delivery
     ↓             ↓            ↓             ↓            ↓
IMD API      Data Fusion   Crop Impact   Priority Rules  Push Notif
OpenWeather  Validation    Risk Assess   User Prefs      SMS
Crowd Data   Interpolation Advisory Gen  Timing Logic    In-App
```

#### Data Models

**WeatherData**
```typescript
interface WeatherData {
  location: {
    latitude: number;
    longitude: number;
    district: string;
    state: string;
  };
  timestamp: Date;
  
  current: {
    temperature: number; // °C
    feelsLike: number;
    humidity: number; // %
    pressure: number; // hPa
    windSpeed: number; // km/h
    windDirection: number; // degrees
    precipitation: number; // mm
    cloudCover: number; // %
    uvIndex: number;
    visibility: number; // km
    dewPoint: number; // °C
  };
  
  forecast: {
    hourly: HourlyForecast[]; // next 48 hours
    daily: DailyForecast[]; // next 7 days
    extended: ExtendedForecast[]; // next 14 days
  };
  
  seasonal: {
    remainingDays: number;
    expectedRainfall: number;
    historicalAverage: number;
    anomaly: number; // % deviation
    elNinoStatus: 'neutral' | 'el-nino' | 'la-nina';
  };
  
  sources: {
    primary: 'IMD' | 'OpenWeather';
    crowdSourced: boolean;
    lastUpdated: Date;
  };
}

interface HourlyForecast {
  time: Date;
  temperature: number;
  precipitation: number;
  precipitationProbability: number; // %
  windSpeed: number;
  humidity: number;
}

interface DailyForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  precipitation: {
    total: number;
    probability: number;
  };
  wind: {
    speed: number;
    gusts: number;
  };
  humidity: {
    min: number;
    max: number;
  };
  sunrise: Date;
  sunset: Date;
}
```


**WeatherAlert**
```typescript
interface WeatherAlert {
  id: string;
  userId: string;
  type: AlertType;
  severity: 'critical' | 'important' | 'advisory';
  
  trigger: {
    condition: string;
    threshold: number;
    actualValue: number;
  };
  
  impact: {
    affectedCrops: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    estimatedDamage?: string;
  };
  
  advisory: {
    immediateActions: string[];
    preventiveMeasures: string[];
    doNots: string[];
    timeframe: string;
  };
  
  timing: {
    issuedAt: Date;
    validFrom: Date;
    validUntil: Date;
    leadTime: number; // hours
  };
  
  delivery: {
    channels: ('push' | 'sms' | 'voice')[];
    delivered: boolean;
    readAt?: Date;
    actionTaken?: string;
  };
}

type AlertType = 
  | 'frost'
  | 'heavy-rain'
  | 'drought'
  | 'heatwave'
  | 'cold-wave'
  | 'hail'
  | 'cyclone'
  | 'flood'
  | 'high-wind'
  | 'pest-risk'
  | 'disease-risk';
```

#### Alert Generation Logic

**Alert Rules Engine**

```typescript
class WeatherAlertEngine {
  private rules: AlertRule[] = [
    {
      type: 'frost',
      severity: 'critical',
      condition: (weather, crops) => {
        return weather.forecast.daily[0].temperature.min < -2 &&
               crops.some(c => c.frostSensitive);
      },
      leadTime: 24, // hours
      advisory: {
        immediateActions: [
          'Reduce irrigation 24 hours before frost',
          'Apply smoke/smudge fire in field',
          'Cover seedlings with mulch or cloth'
        ],
        preventiveMeasures: [
          'Irrigate lightly if soil is dry',
          'Avoid pruning before frost'
        ],
        doNots: [
          'Do not irrigate during frost',
          'Do not apply fertilizer'
        ]
      }
    },
    {
      type: 'heavy-rain',
      severity: 'important',
      condition: (weather) => {
        return weather.forecast.daily[0].precipitation.total > 50 ||
               weather.forecast.daily.slice(0, 3)
                 .reduce((sum, d) => sum + d.precipitation.total, 0) > 100;
      },
      leadTime: 12,
      advisory: {
        immediateActions: [
          'Clear drainage channels',
          'Harvest mature crops if possible',
          'Secure farm equipment'
        ],
        preventiveMeasures: [
          'Avoid fertilizer application',
          'Check for waterlogging after rain'
        ],
        doNots: [
          'Do not spray pesticides',
          'Avoid field operations'
        ]
      }
    },
    {
      type: 'drought',
      severity: 'important',
      condition: (weather, history) => {
        const last15Days = history.slice(-15);
        const totalRain = last15Days.reduce((sum, d) => sum + d.precipitation, 0);
        return totalRain < 10 && weather.current.temperature > 35;
      },
      leadTime: 0, // ongoing condition
      advisory: {
        immediateActions: [
          'Advance irrigation schedule',
          'Check groundwater levels',
          'Apply mulch to conserve moisture'
        ],
        preventiveMeasures: [
          'Reduce water-intensive operations',
          'Consider drought-resistant varieties for next season'
        ],
        doNots: [
          'Avoid deep plowing',
          'Do not plant water-intensive crops'
        ]
      }
    },
    {
      type: 'pest-risk',
      severity: 'advisory',
      condition: (weather, crops) => {
        // High humidity + warm temperature = pest outbreak risk
        return weather.current.humidity > 80 &&
               weather.current.temperature > 25 &&
               weather.current.temperature < 35;
      },
      leadTime: 24,
      advisory: {
        immediateActions: [
          'Scout fields for early pest signs',
          'Prepare organic pest control solutions',
          'Check pheromone traps'
        ],
        preventiveMeasures: [
          'Maintain field hygiene',
          'Remove crop residues',
          'Encourage beneficial insects'
        ],
        doNots: [
          'Avoid prophylactic chemical spraying',
          'Do not ignore early symptoms'
        ]
      }
    }
  ];

  async generateAlerts(userId: string): Promise<WeatherAlert[]> {
    const user = await this.getUserProfile(userId);
    const weather = await this.getWeatherData(user.location);
    const crops = await this.getUserCrops(userId);
    const history = await this.getWeatherHistory(user.location, 30);
    
    const alerts: WeatherAlert[] = [];
    
    for (const rule of this.rules) {
      if (rule.condition(weather, crops, history)) {
        const alert = this.createAlert(rule, user, weather, crops);
        alerts.push(alert);
      }
    }
    
    return this.prioritizeAlerts(alerts);
  }
  
  private prioritizeAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
    // Sort by severity and lead time
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, important: 1, advisory: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.timing.leadTime - b.timing.leadTime;
    });
  }
}
```


#### API Endpoints

```typescript
// Get current weather
GET /api/v1/weather/current
Query: { latitude: number; longitude: number; }
Response: { weather: WeatherData; }

// Get weather forecast
GET /api/v1/weather/forecast
Query: { 
  latitude: number; 
  longitude: number;
  days?: number; // default 7
}
Response: { forecast: DailyForecast[]; }

// Get weather alerts
GET /api/v1/weather/alerts
Query: { userId: string; }
Response: { alerts: WeatherAlert[]; }

// Submit crowd-sourced weather data
POST /api/v1/weather/crowd-source
Request: {
  location: Location;
  observation: {
    temperature?: number;
    rainfall?: number;
    windSpeed?: number;
    notes?: string;
  };
  timestamp: Date;
}
Response: { accepted: boolean; contribution: CrowdData; }

// Get historical weather patterns
GET /api/v1/weather/historical
Query: {
  location: Location;
  years?: number; // default 5
}
Response: {
  patterns: HistoricalPattern[];
  insights: string[];
}
```

---

### 1.4 Sustainable Techniques Knowledge Bank

#### Feature Overview
Comprehensive multimedia library of organic farming, permaculture, and sustainable practices with AI-powered search and community contributions.

#### Data Models

**KnowledgeArticle**
```typescript
interface KnowledgeArticle {
  id: string;
  category: KnowledgeCategory;
  subcategory: string;
  
  title: {
    english: string;
    translations: Record<string, string>;
  };
  
  content: {
    text: string; // Markdown format
    summary: string;
    keyTakeaways: string[];
  };
  
  media: {
    videos: Video[];
    images: Image[];
    infographics: string[];
    audioGuides: Audio[];
  };
  
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    timeToImplement: string;
    costRange: CostRange;
    seasonality: Season[];
    applicableRegions: string[];
  };
  
  scientificBasis: {
    evidenceLevel: 'traditional' | 'moderate' | 'strong';
    references: Reference[];
    studies: Study[];
  };
  
  implementation: {
    steps: Step[];
    materials: Material[];
    tools: Tool[];
    timeline: Timeline;
  };
  
  benefits: {
    environmental: string[];
    economic: string[];
    social: string[];
    quantified: QuantifiedBenefit[];
  };
  
  relatedArticles: string[];
  tags: string[];
  
  community: {
    rating: number; // 1-5
    reviews: Review[];
    successStories: SuccessStory[];
    qna: QnA[];
  };
  
  verification: {
    verifiedBy: string; // Agricultural extension officer
    verificationDate: Date;
    status: 'verified' | 'pending' | 'flagged';
  };
}

type KnowledgeCategory = 
  | 'organic-farming'
  | 'pest-management'
  | 'soil-conservation'
  | 'water-management'
  | 'crop-rotation'
  | 'intercropping'
  | 'composting'
  | 'agroforestry'
  | 'biodiversity';

interface Step {
  number: number;
  title: string;
  description: string;
  duration: string;
  images: string[];
  video?: string;
  tips: string[];
  commonMistakes: string[];
}
```

**CropRotationPlan**
```typescript
interface CropRotationPlan {
  id: string;
  userId: string;
  fieldId: string;
  
  currentCrop: string;
  rotationSequence: RotationCrop[];
  duration: number; // years
  
  benefits: {
    soilHealth: {
      organicMatterIncrease: number; // %
      nitrogenFixation: number; // kg/ha
      pestReduction: number; // %
    };
    financial: {
      yearlyIncome: number[];
      totalIncome: number;
      comparisonWithMonoculture: {
        monoculture: number;
        rotation: number;
        additionalIncome: number;
        percentageIncrease: number;
      };
    };
    environmental: {
      fertilizerReduction: number; // %
      pesticideReduction: number; // %
      carbonSequestration: number; // tons
    };
  };
  
  implementation: {
    startSeason: Season;
    yearlyPlan: YearPlan[];
  };
}

interface RotationCrop {
  year: number;
  season: Season;
  crop: string;
  family: string; // botanical family
  reason: string;
  expectedYield: number;
  expectedIncome: number;
}
```

#### Search & Discovery System

**AI-Powered Search**

```typescript
class KnowledgeSearchEngine {
  async search(query: string, filters: SearchFilters): Promise<SearchResult[]> {
    // Natural language understanding
    const intent = await this.nlp.analyzeIntent(query);
    
    // Extract entities (crop names, problems, techniques)
    const entities = await this.nlp.extractEntities(query);
    
    // Semantic search using embeddings
    const semanticResults = await this.vectorSearch(query);
    
    // Keyword search for exact matches
    const keywordResults = await this.elasticSearch(query);
    
    // Combine and rank results
    const combined = this.combineResults(semanticResults, keywordResults);
    
    // Apply filters
    const filtered = this.applyFilters(combined, filters);
    
    // Personalize based on user profile
    const personalized = await this.personalizeResults(filtered, filters.userId);
    
    return personalized;
  }
  
  private async vectorSearch(query: string): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.embeddingModel.encode(query);
    
    // Search in vector database
    const results = await this.vectorDB.similaritySearch(queryEmbedding, {
      limit: 20,
      threshold: 0.7
    });
    
    return results;
  }
}
```


---

## Module 2: Primary Health Care

### 2.1 AI First Aid Assistant

#### Feature Overview
Interactive, voice-enabled emergency response system providing step-by-step first aid guidance with visual aids and AR features.

#### Component Architecture

```
Input → Triage → Decision Tree → Guidance → Emergency Services
  ↓        ↓          ↓             ↓              ↓
Voice   Symptom   Risk Level    Step-by-Step   Hospital Locator
Text    Analysis  Classification Instructions   Ambulance Call
Body Map Severity  Emergency?    Video Demos    Location Share
```

#### Data Models

**SymptomCheck**
```typescript
interface SymptomCheck {
  id: string;
  userId: string;
  timestamp: Date;
  
  input: {
    method: 'voice' | 'text' | 'bodymap';
    chiefComplaint: string;
    symptoms: Symptom[];
    duration: string;
    severity: number; // 1-10
    patientAge: number;
    patientGender: 'male' | 'female' | 'other';
  };
  
  assessment: {
    category: EmergencyCategory;
    riskLevel: RiskLevel;
    confidence: number; // 0-1
    differentialDiagnosis: string[];
  };
  
  recommendation: {
    action: 'emergency' | 'urgent' | 'first-aid' | 'monitor';
    guidance: FirstAidGuidance;
    whenToSeekHelp: string[];
    redFlags: string[];
  };
  
  outcome: {
    actionTaken: string;
    doctorVisited: boolean;
    resolved: boolean;
    feedback: string;
    rating: number;
  };
}

interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  onset: string;
  progression: 'improving' | 'stable' | 'worsening';
  associatedSymptoms: string[];
}

type EmergencyCategory = 
  | 'life-threatening'
  | 'urgent'
  | 'non-urgent'
  | 'minor';

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface FirstAidGuidance {
  title: string;
  overview: string;
  steps: FirstAidStep[];
  doNots: string[];
  materials: string[];
  estimatedTime: string;
  video: string; // URL
  images: string[];
}

interface FirstAidStep {
  number: number;
  instruction: string;
  details: string;
  duration?: string;
  timer?: number; // seconds
  image?: string;
  video?: string;
  checkpoints: string[];
  warnings: string[];
}
```

**EmergencyContact**
```typescript
interface EmergencyContact {
  userId: string;
  contacts: {
    primary: Contact;
    secondary: Contact[];
    doctor: Contact;
    hospital: Hospital;
  };
  
  medicalInfo: {
    bloodGroup: string;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: Medication[];
    emergencyNotes: string;
  };
  
  location: {
    current: Location;
    home: Location;
    autoShare: boolean;
  };
}

interface Hospital {
  name: string;
  type: 'PHC' | 'CHC' | 'district' | 'private';
  distance: number; // km
  phone: string;
  ambulanceAvailable: boolean;
  facilities: string[];
  emergencyServices: boolean;
}
```

#### Decision Tree Algorithm

```typescript
class TriageSystem {
  async assessSymptoms(input: SymptomInput): Promise<Assessment> {
    // Critical symptoms check
    const criticalSymptoms = this.checkCriticalSymptoms(input.symptoms);
    if (criticalSymptoms.length > 0) {
      return {
        category: 'life-threatening',
        riskLevel: 'critical',
        action: 'emergency',
        guidance: this.getEmergencyGuidance(criticalSymptoms)
      };
    }
    
    // Vital signs assessment
    const vitalSigns = await this.assessVitalSigns(input);
    if (vitalSigns.abnormal) {
      return this.handleAbnormalVitals(vitalSigns);
    }
    
    // Symptom severity scoring
    const severityScore = this.calculateSeverityScore(input.symptoms);
    
    // Duration and progression
    const urgency = this.assessUrgency(input.duration, input.progression);
    
    // Age and risk factors
    const riskFactors = this.assessRiskFactors(input.patientAge, 
                                                input.medicalHistory);
    
    // Combined assessment
    return this.generateAssessment(severityScore, urgency, riskFactors);
  }
  
  private checkCriticalSymptoms(symptoms: Symptom[]): string[] {
    const critical = [
      'unconsciousness',
      'not-breathing',
      'severe-chest-pain',
      'severe-bleeding',
      'seizure',
      'severe-allergic-reaction',
      'stroke-symptoms',
      'severe-head-injury'
    ];
    
    return symptoms
      .filter(s => critical.includes(s.name) || s.severity === 'severe')
      .map(s => s.name);
  }
  
  private calculateSeverityScore(symptoms: Symptom[]): number {
    let score = 0;
    
    for (const symptom of symptoms) {
      const baseScore = this.symptomWeights[symptom.name] || 1;
      const severityMultiplier = {
        'mild': 1,
        'moderate': 2,
        'severe': 3
      }[symptom.severity];
      
      score += baseScore * severityMultiplier;
    }
    
    return score;
  }
}
```


### 2.2 Natural Medicine & Home Remedies

#### Feature Overview
Verified database of traditional remedies with safety information, efficacy ratings, and preparation instructions.

#### Data Models

**Remedy**
```typescript
interface Remedy {
  id: string;
  name: {
    english: string;
    scientific: string;
    local: Record<string, string>;
  };
  
  category: RemedyCategory;
  ailments: string[];
  
  ingredients: Ingredient[];
  
  preparation: {
    methods: PreparationMethod[];
    difficulty: 'easy' | 'moderate' | 'complex';
    timeRequired: string;
  };
  
  dosage: {
    adults: DosageInfo;
    children: AgeBasedDosage[];
    elderly: DosageInfo;
    pregnancy: PregnancyInfo;
    lactation: LactationInfo;
  };
  
  efficacy: {
    rating: number; // 1-5
    evidenceLevel: 'traditional' | 'moderate' | 'strong';
    scientificBasis: string;
    studies: Reference[];
    userSuccessRate: number; // %
  };
  
  safety: {
    sideEffects: SideEffect[];
    contraindications: string[];
    drugInteractions: DrugInteraction[];
    allergies: string[];
    maxDuration: string;
  };
  
  availability: {
    seasonal: boolean;
    seasons?: Season[];
    whereToFind: string[];
    cost: CostRange;
    growingGuide?: string;
  };
  
  media: {
    preparationVideo: string;
    images: string[];
    audioInstructions: Record<string, string>; // language -> URL
  };
  
  verification: {
    verifiedBy: string; // Ayurvedic doctor, pharmacologist
    verificationDate: Date;
    lastReviewed: Date;
  };
  
  community: {
    timesUsed: number;
    successReports: number;
    reviews: Review[];
    tips: CommunityTip[];
  };
}

type RemedyCategory = 
  | 'digestive'
  | 'respiratory'
  | 'skin'
  | 'pain'
  | 'fever'
  | 'immunity'
  | 'womens-health'
  | 'childrens-health';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
  optional: boolean;
  substitutes: string[];
  purpose: string;
}

interface PreparationMethod {
  name: string;
  steps: string[];
  duration: string;
  yield: string;
  storage: string;
  shelfLife: string;
}

interface DosageInfo {
  amount: string;
  frequency: string;
  timing: string; // before/after meals, time of day
  duration: string;
  expectedRelief: string;
}
```

### 2.3 Lifestyle & Diet Tracker

#### Data Models

**NutritionPlan**
```typescript
interface NutritionPlan {
  id: string;
  userId: string;
  
  profile: {
    age: number;
    gender: string;
    weight: number; // kg
    height: number; // cm
    bmi: number;
    activityLevel: ActivityLevel;
    occupation: string;
    healthConditions: string[];
    dietaryRestrictions: string[];
  };
  
  requirements: {
    calories: number; // kcal/day
    macros: {
      protein: number; // grams
      carbohydrates: number;
      fats: number;
    };
    micronutrients: Record<string, number>;
    water: number; // liters
  };
  
  mealPlan: {
    daily: DailyMealPlan;
    weekly: WeeklyRotation;
    seasonal: SeasonalVariations;
  };
  
  localFoods: {
    available: LocalFood[];
    seasonal: Record<Season, LocalFood[]>;
    costOptimized: boolean;
  };
  
  tracking: {
    compliance: number; // %
    nutrientGaps: string[];
    improvements: string[];
  };
}

type ActivityLevel = 
  | 'sedentary'      // 1600-2000 kcal
  | 'light'          // 2000-2500 kcal
  | 'moderate'       // 2500-3000 kcal
  | 'heavy-labor';   // 3000-3500 kcal

interface DailyMealPlan {
  breakfast: Meal;
  midMorningSnack: Meal;
  lunch: Meal;
  afternoonSnack: Meal;
  dinner: Meal;
}

interface Meal {
  name: string;
  time: string;
  foods: FoodItem[];
  nutrition: NutritionInfo;
  cost: number;
  preparationTime: string;
  recipe?: string;
}

interface LocalFood {
  name: string;
  category: string;
  nutrition: NutritionInfo;
  cost: number; // per kg
  availability: {
    seasonal: boolean;
    months: number[];
    regions: string[];
  };
}
```

---

## Module 3: Education & Skill Development

### 3.1 AI Video Tutor (Adaptive Learning)

#### Feature Overview
Personalized learning platform with AI-driven content adaptation, progress tracking, and multi-modal instruction.

#### Component Architecture

```
Student Profile → Assessment → Content Selection → Delivery → Evaluation → Adaptation
       ↓              ↓              ↓                ↓           ↓            ↓
   Knowledge      Diagnostic     Video Library    Interactive   Quiz       Difficulty
   Level          Test           Curated          Exercises     Results    Adjustment
   Goals          Baseline       AI-Selected      Practice      Performance Path Update
   Preferences    Gaps           Personalized     Engagement    Analytics   Intervention
```

#### Data Models

**StudentProfile**
```typescript
interface StudentProfile {
  id: string;
  userId: string;
  
  demographics: {
    age: number;
    grade: number;
    educationLevel: string;
    schoolType: 'government' | 'private' | 'none';
  };
  
  learningProfile: {
    goals: LearningGoal[];
    preferredLanguage: string;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    pace: 'slow' | 'medium' | 'fast';
    studyTime: {
      dailyMinutes: number;
      preferredTimes: string[];
    };
  };
  
  knowledgeState: {
    subjects: SubjectKnowledge[];
    strengths: string[];
    weaknesses: string[];
    masteredConcepts: string[];
    strugglingConcepts: string[];
  };
  
  progress: {
    totalLearningTime: number; // minutes
    videosWatched: number;
    quizzesCompleted: number;
    averageScore: number;
    streak: number; // days
    level: number;
    xp: number;
  };
  
  engagement: {
    lastActive: Date;
    sessionDuration: number[];
    completionRate: number; // %
    dropoffPoints: string[];
  };
}

interface SubjectKnowledge {
  subject: string;
  currentLevel: number; // grade equivalent
  targetLevel: number;
  proficiency: number; // 0-100
  topics: TopicKnowledge[];
}

interface TopicKnowledge {
  topicId: string;
  name: string;
  status: 'not-started' | 'learning' | 'practicing' | 'mastered';
  proficiency: number; // 0-100
  attempts: number;
  lastAttempt: Date;
  timeSpent: number; // minutes
}
```


**LearningContent**
```typescript
interface LearningContent {
  id: string;
  type: 'video' | 'interactive' | 'quiz' | 'practice';
  
  metadata: {
    subject: string;
    topic: string;
    subtopic: string;
    curriculum: 'NCERT' | 'CBSE' | 'ICSE' | 'State';
    grade: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  
  content: {
    title: string;
    description: string;
    duration: number; // seconds
    language: string;
    subtitles: Record<string, string>; // language -> URL
    transcript: string;
  };
  
  video?: {
    url: string;
    qualities: VideoQuality[];
    thumbnail: string;
    chapters: Chapter[];
  };
  
  interactive?: {
    type: 'simulation' | 'game' | 'quiz';
    config: any;
  };
  
  prerequisites: string[]; // content IDs
  nextContent: string[];
  
  analytics: {
    views: number;
    completions: number;
    averageEngagement: number; // %
    averageScore: number;
    dropoffRate: number; // %
  };
}

interface VideoQuality {
  resolution: '360p' | '480p' | '720p' | '1080p';
  bitrate: number;
  size: number; // MB
  url: string;
}

interface Chapter {
  title: string;
  startTime: number; // seconds
  endTime: number;
  keyPoints: string[];
}
```

#### Adaptive Learning Algorithm

```typescript
class AdaptiveLearningEngine {
  async selectNextContent(studentId: string): Promise<LearningContent> {
    const student = await this.getStudentProfile(studentId);
    const knowledgeState = student.knowledgeState;
    
    // Identify knowledge gaps
    const gaps = this.identifyGaps(knowledgeState);
    
    // Check prerequisites
    const readyTopics = this.filterByPrerequisites(gaps, knowledgeState);
    
    // Difficulty matching
    const appropriateDifficulty = this.matchDifficulty(
      readyTopics,
      student.learningProfile.pace,
      student.progress.averageScore
    );
    
    // Personalization
    const personalized = this.personalizeContent(
      appropriateDifficulty,
      student.learningProfile.learningStyle,
      student.engagement.dropoffPoints
    );
    
    // Select optimal content
    return this.selectOptimal(personalized);
  }
  
  async adaptAfterQuiz(studentId: string, quizResult: QuizResult): Promise<void> {
    const student = await this.getStudentProfile(studentId);
    
    // Update knowledge state using Bayesian Knowledge Tracing
    const updatedKnowledge = this.updateKnowledgeState(
      student.knowledgeState,
      quizResult
    );
    
    // Determine intervention if needed
    if (quizResult.score < 60) {
      // Student struggling - provide intervention
      await this.triggerIntervention(studentId, quizResult.topic);
    } else if (quizResult.score > 90) {
      // Student excelling - accelerate
      await this.acceleratePath(studentId, quizResult.topic);
    }
    
    // Update student profile
    await this.updateProfile(studentId, {
      knowledgeState: updatedKnowledge,
      progress: this.calculateProgress(updatedKnowledge)
    });
  }
  
  private async triggerIntervention(
    studentId: string,
    topic: string
  ): Promise<void> {
    const interventions = [
      // Try different teaching style
      { type: 'alternate-video', reason: 'Different explanation approach' },
      
      // Review prerequisites
      { type: 'prerequisite-review', reason: 'Foundation concepts unclear' },
      
      // Break into smaller chunks
      { type: 'micro-learning', reason: 'Concept too complex' },
      
      // Peer learning
      { type: 'discussion-forum', reason: 'Learn from peers' },
      
      // Practice problems
      { type: 'extra-practice', reason: 'Need more repetition' }
    ];
    
    // Select appropriate intervention
    const intervention = this.selectIntervention(interventions, studentId, topic);
    
    // Apply intervention
    await this.applyIntervention(studentId, intervention);
  }
  
  private updateKnowledgeState(
    currentState: KnowledgeState,
    quizResult: QuizResult
  ): KnowledgeState {
    // Bayesian Knowledge Tracing (BKT) implementation
    const topic = currentState.topics.find(t => t.topicId === quizResult.topicId);
    
    if (!topic) return currentState;
    
    // BKT parameters
    const pLearn = 0.3;  // Probability of learning
    const pSlip = 0.1;   // Probability of slip (know but answer wrong)
    const pGuess = 0.25; // Probability of guess (don't know but answer right)
    
    // Current knowledge probability
    let pKnow = topic.proficiency / 100;
    
    // Update based on quiz performance
    for (const question of quizResult.questions) {
      if (question.correct) {
        // Answered correctly
        pKnow = (pKnow * (1 - pSlip)) / 
                (pKnow * (1 - pSlip) + (1 - pKnow) * pGuess);
      } else {
        // Answered incorrectly
        pKnow = (pKnow * pSlip) / 
                (pKnow * pSlip + (1 - pKnow) * (1 - pGuess));
      }
      
      // Learning opportunity
      pKnow = pKnow + (1 - pKnow) * pLearn;
    }
    
    // Update topic proficiency
    topic.proficiency = Math.round(pKnow * 100);
    topic.status = this.determineStatus(topic.proficiency);
    
    return currentState;
  }
}
```

---

## Module 4: Infrastructure & Civic Engagement

### 4.1 Visual Grievance Redressal

#### Feature Overview
Citizen-powered infrastructure monitoring with AI-based issue detection, automatic routing, and transparent tracking.

#### Component Architecture

```
Report → Detection → Classification → Routing → Tracking → Resolution
   ↓         ↓            ↓              ↓          ↓           ↓
Photo    AI Vision   Category      Authority   Status      Verification
GPS      OCR         Priority      Assignment  Updates     Community
Voice    Duplicate   Severity      Workflow    Timeline    Feedback
```

#### Data Models

**Grievance**
```typescript
interface Grievance {
  id: string;
  ticketNumber: string; // e.g., INF2026-0234
  
  reporter: {
    userId: string;
    name: string;
    contact: string;
    anonymous: boolean;
  };
  
  issue: {
    category: IssueCategory;
    subcategory: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    affectedCount: number; // estimated people impacted
  };
  
  location: {
    latitude: number;
    longitude: number;
    address: string;
    landmark: string;
    ward: string;
    district: string;
  };
  
  media: {
    photos: Photo[];
    videos: string[];
    audioNote: string;
  };
  
  classification: {
    aiCategory: string;
    aiConfidence: number;
    userConfirmed: boolean;
    tags: string[];
  };
  
  routing: {
    responsibleAuthority: Authority;
    department: string;
    assignedOfficer: Officer;
    escalationLevel: number;
    sla: number; // days
  };
  
  status: {
    current: GrievanceStatus;
    timeline: StatusUpdate[];
    lastUpdated: Date;
    daysOpen: number;
    overdue: boolean;
  };
  
  resolution: {
    resolved: boolean;
    resolvedDate?: Date;
    resolutionTime: number; // days
    resolutionPhotos: string[];
    resolutionNotes: string;
    cost: number;
    contractor?: string;
  };
  
  verification: {
    communityVerified: boolean;
    verificationVotes: {
      fixed: number;
      notFixed: number;
      partiallyFixed: number;
    };
  };
  
  feedback: {
    rating: number; // 1-5
    comment: string;
    responseTime: number; // 1-5
    quality: number; // 1-5
  };
}

type IssueCategory = 
  | 'roads'
  | 'water'
  | 'electricity'
  | 'drainage'
  | 'waste'
  | 'streetlights'
  | 'public-property'
  | 'health-facility'
  | 'education-facility'
  | 'other';

type GrievanceStatus = 
  | 'pending'
  | 'acknowledged'
  | 'in-progress'
  | 'on-hold'
  | 'resolved'
  | 'rejected'
  | 'escalated';

interface StatusUpdate {
  status: GrievanceStatus;
  timestamp: Date;
  updatedBy: string;
  notes: string;
  photos: string[];
  notifyReporter: boolean;
}
```


#### AI Image Classification

```typescript
class GrievanceClassifier {
  private model: TensorFlowModel;
  
  async classifyIssue(photo: Image, location: Location): Promise<Classification> {
    // Preprocess image
    const preprocessed = await this.preprocessImage(photo);
    
    // Run inference
    const predictions = await this.model.predict(preprocessed);
    
    // Get top predictions
    const topPredictions = this.getTopK(predictions, 3);
    
    // Context-aware refinement
    const refined = await this.refineWithContext(
      topPredictions,
      location,
      await this.getHistoricalData(location)
    );
    
    return {
      category: refined[0].category,
      subcategory: refined[0].subcategory,
      confidence: refined[0].confidence,
      alternatives: refined.slice(1)
    };
  }
  
  async detectDuplicates(
    newGrievance: Grievance
  ): Promise<Grievance[]> {
    // Spatial clustering (within 50m radius)
    const nearby = await this.findNearbyGrievances(
      newGrievance.location,
      50 // meters
    );
    
    // Filter by category
    const sameCategory = nearby.filter(
      g => g.issue.category === newGrievance.issue.category
    );
    
    // Image similarity check
    const duplicates = [];
    for (const grievance of sameCategory) {
      const similarity = await this.calculateImageSimilarity(
        newGrievance.media.photos[0],
        grievance.media.photos[0]
      );
      
      if (similarity > 0.85) {
        duplicates.push(grievance);
      }
    }
    
    return duplicates;
  }
  
  private async calculateImageSimilarity(
    img1: Image,
    img2: Image
  ): Promise<number> {
    // Perceptual hashing
    const hash1 = await this.perceptualHash(img1);
    const hash2 = await this.perceptualHash(img2);
    
    // Hamming distance
    const distance = this.hammingDistance(hash1, hash2);
    
    // Convert to similarity score
    return 1 - (distance / hash1.length);
  }
}
```

### 4.2 Community Opinion Polls

#### Data Models

**Poll**
```typescript
interface Poll {
  id: string;
  
  creator: {
    userId: string;
    role: 'official' | 'community-leader' | 'citizen';
    verified: boolean;
  };
  
  metadata: {
    title: string;
    description: string;
    context: string;
    supportingDocuments: string[];
    createdAt: Date;
  };
  
  configuration: {
    type: 'single-choice' | 'multiple-choice' | 'ranked' | 'budget-allocation';
    options: PollOption[];
    maxSelections?: number; // for multiple-choice
    totalBudget?: number; // for budget-allocation
  };
  
  eligibility: {
    ageMin: number;
    ageMax?: number;
    wards: string[]; // empty = all wards
    requireVerification: boolean;
  };
  
  timing: {
    startDate: Date;
    endDate: Date;
    duration: number; // days
    status: 'draft' | 'active' | 'closed' | 'cancelled';
  };
  
  privacy: {
    anonymous: boolean;
    showRealTimeResults: boolean;
    allowComments: boolean;
    moderateComments: boolean;
  };
  
  results: {
    totalVotes: number;
    eligibleVoters: number;
    turnout: number; // %
    optionResults: OptionResult[];
    demographics: DemographicBreakdown;
  };
  
  binding: {
    official: boolean;
    commitment: string;
    implementationTimeline: string;
  };
}

interface PollOption {
  id: string;
  title: string;
  description: string;
  details: string;
  estimatedCost?: number;
  impactAssessment?: string;
  beneficiaries?: number;
  image?: string;
}

interface OptionResult {
  optionId: string;
  votes: number;
  percentage: number;
  rank?: number; // for ranked polls
  budgetAllocated?: number; // for budget polls
}

interface Vote {
  id: string;
  pollId: string;
  voterId: string;
  
  selection: {
    optionIds: string[]; // single or multiple
    ranking?: Record<string, number>; // for ranked
    budgetAllocation?: Record<string, number>; // for budget
  };
  
  timestamp: Date;
  verified: boolean;
  
  // Anonymous voting - no link to voter identity in results
  anonymousId: string; // one-way hash
}
```

### 4.3 Progress Dashboard

#### Data Models

**Project**
```typescript
interface InfrastructureProject {
  id: string;
  
  basic: {
    name: string;
    description: string;
    category: ProjectCategory;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  
  origin: {
    source: 'grievance' | 'poll' | 'government-plan' | 'budget-allocation';
    referenceId?: string; // grievance ID or poll ID
    requestedBy: string[];
  };
  
  financial: {
    totalBudget: number;
    fundingSource: FundingSource[];
    spent: number;
    remaining: number;
    breakdown: CostBreakdown[];
  };
  
  timeline: {
    sanctionedDate: Date;
    startDate: Date;
    expectedCompletion: Date;
    actualCompletion?: Date;
    duration: number; // days
    daysElapsed: number;
    daysRemaining: number;
    delayed: boolean;
    delayReason?: string;
  };
  
  execution: {
    contractor: Contractor;
    supervisor: Officer;
    workOrder: string;
    specifications: string;
  };
  
  progress: {
    percentage: number; // 0-100
    milestones: Milestone[];
    currentPhase: string;
    updates: ProjectUpdate[];
  };
  
  quality: {
    inspections: Inspection[];
    issues: QualityIssue[];
    rating: number; // 1-5
  };
  
  community: {
    beneficiaries: number;
    satisfaction: number; // 1-5
    feedback: Feedback[];
    concerns: Concern[];
  };
  
  transparency: {
    documents: Document[];
    photos: Photo[];
    publicMeetings: Meeting[];
  };
}

type ProjectCategory = 
  | 'roads'
  | 'water-supply'
  | 'sanitation'
  | 'electricity'
  | 'education'
  | 'health'
  | 'community-facilities'
  | 'drainage'
  | 'waste-management';

interface Milestone {
  id: string;
  name: string;
  description: string;
  targetDate: Date;
  completionDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  percentage: number; // contribution to overall progress
  dependencies: string[]; // other milestone IDs
}

interface ProjectUpdate {
  id: string;
  date: Date;
  type: 'progress' | 'delay' | 'issue' | 'completion';
  title: string;
  description: string;
  photos: string[];
  updatedBy: string;
  public: boolean;
}
```

---

## Cross-Module Integration

### Unified User Profile

```typescript
interface UserProfile {
  id: string;
  
  identity: {
    name: string;
    phone: string;
    email?: string;
    aadhaar?: string; // encrypted
    dateOfBirth: Date;
    gender: string;
  };
  
  location: {
    village: string;
    ward: string;
    district: string;
    state: string;
    pincode: string;
    coordinates: Location;
  };
  
  occupation: {
    primary: string;
    secondary?: string;
    farmer: boolean;
    farmDetails?: FarmProfile;
  };
  
  family: {
    size: number;
    members: FamilyMember[];
    income: IncomeRange;
  };
  
  preferences: {
    language: string;
    secondaryLanguages: string[];
    notifications: NotificationPreferences;
    privacy: PrivacySettings;
  };
  
  modules: {
    agriculture: AgricultureProfile;
    health: HealthProfile;
    education: EducationProfile;
    civic: CivicProfile;
  };
  
  documents: {
    aadhaar: Document;
    landRecords: Document[];
    incomeProof: Document;
    rationCard: Document;
    bankAccount: Document;
    other: Document[];
  };
  
  activity: {
    lastActive: Date;
    totalSessions: number;
    totalTime: number; // minutes
    modulesUsed: string[];
    features: Record<string, number>; // feature -> usage count
  };
  
  gamification: {
    level: number;
    xp: number;
    badges: Badge[];
    achievements: Achievement[];
    streak: number;
    points: number;
  };
}
```


### AI Assistant "RuralConnect Buddy"

```typescript
interface AIAssistant {
  async processQuery(query: string, context: UserContext): Promise<Response> {
    // Natural Language Understanding
    const intent = await this.nlu.detectIntent(query);
    const entities = await this.nlu.extractEntities(query);
    
    // Route to appropriate module
    const module = this.routeToModule(intent);
    
    // Generate response
    const response = await this.generateResponse(
      module,
      intent,
      entities,
      context
    );
    
    // Multi-modal output
    return {
      text: response.text,
      voice: await this.tts.synthesize(response.text, context.language),
      actions: response.suggestedActions,
      followUp: response.followUpQuestions
    };
  }
  
  private routeToModule(intent: Intent): Module {
    const routing = {
      'crop-recommendation': 'agriculture',
      'soil-analysis': 'agriculture',
      'weather-query': 'agriculture',
      'health-symptom': 'health',
      'first-aid': 'health',
      'remedy-search': 'health',
      'learning-content': 'education',
      'scheme-search': 'education',
      'report-issue': 'infrastructure',
      'check-status': 'infrastructure'
    };
    
    return routing[intent.name] || 'general';
  }
}
```

### Notification System

```typescript
interface NotificationService {
  async sendNotification(notification: Notification): Promise<void> {
    const user = await this.getUserProfile(notification.userId);
    
    // Check user preferences
    if (!this.shouldSend(notification, user.preferences)) {
      return;
    }
    
    // Determine channels
    const channels = this.selectChannels(notification, user.preferences);
    
    // Localize content
    const localized = await this.localize(
      notification.content,
      user.preferences.language
    );
    
    // Send via selected channels
    await Promise.all(
      channels.map(channel => this.sendViaChannel(channel, localized))
    );
    
    // Track delivery
    await this.trackDelivery(notification.id, channels);
  }
  
  private selectChannels(
    notification: Notification,
    preferences: NotificationPreferences
  ): Channel[] {
    const channels: Channel[] = [];
    
    // Critical notifications always use all channels
    if (notification.priority === 'critical') {
      return ['push', 'sms', 'voice'];
    }
    
    // Respect user preferences
    if (preferences.push && notification.priority !== 'low') {
      channels.push('push');
    }
    
    if (preferences.sms && notification.priority === 'high') {
      channels.push('sms');
    }
    
    // In-app always enabled
    channels.push('in-app');
    
    return channels;
  }
  
  private shouldSend(
    notification: Notification,
    preferences: NotificationPreferences
  ): boolean {
    // Check quiet hours
    if (this.isQuietHours(preferences.quietHours)) {
      if (notification.priority !== 'critical') {
        return false;
      }
    }
    
    // Check category preferences
    if (!preferences.categories[notification.category]) {
      return false;
    }
    
    // Check frequency limits
    if (this.exceedsFrequencyLimit(notification.userId, notification.category)) {
      return false;
    }
    
    return true;
  }
}

interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  content: {
    title: string;
    body: string;
    image?: string;
    action?: NotificationAction;
  };
  
  scheduling: {
    sendAt: Date;
    expiresAt?: Date;
    recurring?: RecurrenceRule;
  };
  
  tracking: {
    sent: boolean;
    delivered: boolean;
    read: boolean;
    clicked: boolean;
    timestamps: Record<string, Date>;
  };
}

type NotificationCategory = 
  | 'weather-alert'
  | 'irrigation-reminder'
  | 'fertilizer-reminder'
  | 'health-reminder'
  | 'learning-reminder'
  | 'scheme-deadline'
  | 'grievance-update'
  | 'poll-notification'
  | 'system-update';
```

---

## Technical Specifications

### Database Schema Design

**PostgreSQL Tables**

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    aadhaar_hash VARCHAR(64), -- encrypted
    date_of_birth DATE,
    gender VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- User locations
CREATE TABLE user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    village VARCHAR(255),
    ward VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Farms
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    size_hectares DECIMAL(10, 2),
    soil_type VARCHAR(50),
    irrigation_type VARCHAR(50),
    location_id UUID REFERENCES user_locations(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crops
CREATE TABLE crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_english VARCHAR(255) NOT NULL,
    name_local JSONB, -- {language: name}
    scientific_name VARCHAR(255),
    family VARCHAR(100),
    category VARCHAR(50),
    growing_duration_days INTEGER,
    water_requirement VARCHAR(50),
    soil_preferences JSONB,
    climate_zones JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crop cycles (user's actual plantings)
CREATE TABLE crop_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES crops(id),
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_hectares DECIMAL(10, 2),
    expected_yield DECIMAL(10, 2),
    actual_yield DECIMAL(10, 2),
    investment DECIMAL(12, 2),
    revenue DECIMAL(12, 2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Soil health cards
CREATE TABLE soil_health_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    source VARCHAR(50), -- photo, manual, government, testkit
    nitrogen DECIMAL(10, 2),
    phosphorus DECIMAL(10, 2),
    potassium DECIMAL(10, 2),
    organic_carbon DECIMAL(5, 2),
    ph_value DECIMAL(4, 2),
    ec_value DECIMAL(6, 2),
    micronutrients JSONB,
    texture JSONB,
    health_score INTEGER,
    photos JSONB,
    government_card_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Weather data
CREATE TABLE weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES user_locations(id),
    timestamp TIMESTAMP NOT NULL,
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    precipitation DECIMAL(6, 2),
    wind_speed DECIMAL(6, 2),
    pressure DECIMAL(7, 2),
    source VARCHAR(50),
    forecast_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_weather_location_time ON weather_data(location_id, timestamp DESC);

-- Weather alerts
CREATE TABLE weather_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    trigger_condition JSONB,
    impact JSONB,
    advisory JSONB,
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    issued_at TIMESTAMP DEFAULT NOW(),
    delivered BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    action_taken VARCHAR(255)
);

CREATE INDEX idx_alerts_user_valid ON weather_alerts(user_id, valid_until DESC);

-- Health records
CREATE TABLE health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    record_type VARCHAR(50), -- symptom-check, remedy-use, vital-signs
    record_date TIMESTAMP NOT NULL,
    data JSONB NOT NULL,
    outcome JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Symptom checks
CREATE TABLE symptom_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    input_method VARCHAR(20),
    chief_complaint TEXT,
    symptoms JSONB,
    assessment JSONB,
    recommendation JSONB,
    outcome JSONB,
    rating INTEGER
);

-- Remedies
CREATE TABLE remedies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_english VARCHAR(255) NOT NULL,
    name_scientific VARCHAR(255),
    name_local JSONB,
    category VARCHAR(50),
    ailments JSONB,
    ingredients JSONB,
    preparation JSONB,
    dosage JSONB,
    efficacy JSONB,
    safety JSONB,
    availability JSONB,
    media JSONB,
    verification JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Learning content
CREATE TABLE learning_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50), -- video, interactive, quiz, practice
    subject VARCHAR(100),
    topic VARCHAR(255),
    subtopic VARCHAR(255),
    curriculum VARCHAR(50),
    grade INTEGER,
    difficulty VARCHAR(50),
    title VARCHAR(500),
    description TEXT,
    duration INTEGER, -- seconds
    language VARCHAR(10),
    content_data JSONB,
    prerequisites JSONB,
    analytics JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_subject_grade ON learning_content(subject, grade, difficulty);

-- Student profiles
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    grade INTEGER,
    education_level VARCHAR(100),
    learning_profile JSONB,
    knowledge_state JSONB,
    progress JSONB,
    engagement JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Learning progress
CREATE TABLE learning_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    content_id UUID REFERENCES learning_content(id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    time_spent INTEGER, -- seconds
    engagement_score DECIMAL(5, 2),
    quiz_score INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Grievances
CREATE TABLE grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reporter_name VARCHAR(255),
    reporter_contact VARCHAR(20),
    anonymous BOOLEAN DEFAULT false,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(100),
    title VARCHAR(500),
    description TEXT,
    severity VARCHAR(20),
    affected_count INTEGER,
    location JSONB NOT NULL,
    media JSONB,
    classification JSONB,
    routing JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    status_timeline JSONB,
    resolution JSONB,
    verification JSONB,
    feedback JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grievances_status ON grievances(status, created_at DESC);
CREATE INDEX idx_grievances_location ON grievances USING GIST (
    ((location->>'latitude')::decimal),
    ((location->>'longitude')::decimal)
);

-- Polls
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    creator_role VARCHAR(50),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    configuration JSONB NOT NULL,
    eligibility JSONB,
    timing JSONB NOT NULL,
    privacy JSONB,
    results JSONB,
    binding JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Poll votes
CREATE TABLE poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    anonymous_id VARCHAR(64) NOT NULL, -- one-way hash
    selection JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    verified BOOLEAN DEFAULT false,
    UNIQUE(poll_id, voter_id)
);

CREATE INDEX idx_votes_poll ON poll_votes(poll_id);

-- Infrastructure projects
CREATE TABLE infrastructure_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    priority VARCHAR(20),
    origin JSONB,
    financial JSONB NOT NULL,
    timeline JSONB NOT NULL,
    execution JSONB,
    progress JSONB,
    quality JSONB,
    community JSONB,
    transparency JSONB,
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    content JSONB NOT NULL,
    scheduling JSONB,
    tracking JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_priority ON notifications(user_id, priority, created_at DESC);
```


### API Design Principles

**RESTful API Structure**

```
Base URL: https://api.ruralconnect.ai/v1

Authentication: Bearer token (JWT)
Content-Type: application/json
Accept-Language: en, hi, ta, te, etc.
```

**Standard Response Format**

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}
```

**Error Codes**

```typescript
enum ErrorCode {
  // Authentication
  AUTH_INVALID_TOKEN = 'AUTH_001',
  AUTH_EXPIRED_TOKEN = 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_003',
  
  // Validation
  VALIDATION_FAILED = 'VAL_001',
  VALIDATION_MISSING_FIELD = 'VAL_002',
  VALIDATION_INVALID_FORMAT = 'VAL_003',
  
  // Business Logic
  RESOURCE_NOT_FOUND = 'RES_001',
  RESOURCE_ALREADY_EXISTS = 'RES_002',
  OPERATION_NOT_ALLOWED = 'RES_003',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXT_001',
  EXTERNAL_SERVICE_TIMEOUT = 'EXT_002',
  
  // System
  INTERNAL_SERVER_ERROR = 'SYS_001',
  SERVICE_UNAVAILABLE = 'SYS_002',
  RATE_LIMIT_EXCEEDED = 'SYS_003'
}
```

**Rate Limiting**

```typescript
interface RateLimitConfig {
  // Per user limits
  user: {
    requests: 1000;
    window: '1h';
  };
  
  // Per endpoint limits
  endpoints: {
    '/api/v1/agriculture/crops/recommend': {
      requests: 100;
      window: '1h';
    };
    '/api/v1/weather/current': {
      requests: 500;
      window: '1h';
    };
    '/api/v1/health/symptom-check': {
      requests: 50;
      window: '1h';
    };
  };
  
  // Anonymous limits (before login)
  anonymous: {
    requests: 100;
    window: '1h';
  };
}
```

---

## Security & Privacy

### Authentication & Authorization

**JWT Token Structure**

```typescript
interface JWTPayload {
  userId: string;
  phone: string;
  role: 'user' | 'official' | 'admin';
  permissions: string[];
  iat: number; // issued at
  exp: number; // expiration
  jti: string; // JWT ID for revocation
}

// Token lifecycle
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';
```

**Authentication Flow**

```typescript
class AuthService {
  async login(phone: string, otp: string): Promise<AuthResponse> {
    // Verify OTP
    const verified = await this.verifyOTP(phone, otp);
    if (!verified) {
      throw new Error('Invalid OTP');
    }
    
    // Get or create user
    const user = await this.getOrCreateUser(phone);
    
    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);
    
    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user)
    };
  }
  
  async refreshAccessToken(refreshToken: string): Promise<string> {
    // Verify refresh token
    const payload = await this.verifyToken(refreshToken);
    
    // Check if revoked
    const isValid = await this.isRefreshTokenValid(payload.userId, refreshToken);
    if (!isValid) {
      throw new Error('Invalid refresh token');
    }
    
    // Generate new access token
    const user = await this.getUser(payload.userId);
    return this.generateAccessToken(user);
  }
  
  async logout(userId: string, refreshToken: string): Promise<void> {
    // Revoke refresh token
    await this.revokeRefreshToken(userId, refreshToken);
    
    // Add access token to blacklist (until expiry)
    await this.blacklistAccessToken(userId);
  }
}
```

### Data Encryption

**Encryption Strategy**

```typescript
class EncryptionService {
  // Sensitive data encryption (AES-256-GCM)
  async encryptSensitiveData(data: string): Promise<EncryptedData> {
    const key = await this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  async decryptSensitiveData(encryptedData: EncryptedData): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  // One-way hashing for Aadhaar, etc.
  async hashPII(data: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(data, salt);
  }
}
```

**Data Classification & Protection**

```typescript
enum DataSensitivity {
  PUBLIC = 'public',           // No encryption needed
  INTERNAL = 'internal',       // Encrypted at rest
  CONFIDENTIAL = 'confidential', // Encrypted at rest + in transit
  RESTRICTED = 'restricted'    // Encrypted + access logging + audit
}

interface DataProtectionPolicy {
  aadhaar: DataSensitivity.RESTRICTED;
  phone: DataSensitivity.CONFIDENTIAL;
  location: DataSensitivity.INTERNAL;
  healthRecords: DataSensitivity.RESTRICTED;
  soilData: DataSensitivity.INTERNAL;
  grievancePhotos: DataSensitivity.PUBLIC;
  learningProgress: DataSensitivity.INTERNAL;
}
```

### Privacy Controls

```typescript
interface PrivacySettings {
  dataSharing: {
    withGovernment: boolean;
    withResearchers: boolean; // anonymized only
    withCommunity: boolean;
  };
  
  locationSharing: {
    enabled: boolean;
    precision: 'exact' | 'approximate' | 'district-only';
  };
  
  profileVisibility: {
    name: 'public' | 'community' | 'private';
    phone: 'private';
    location: 'community' | 'private';
    farmDetails: 'community' | 'private';
  };
  
  dataRetention: {
    deleteAfterInactivity: boolean;
    inactivityPeriod: number; // days
  };
  
  anonymousMode: {
    grievanceReporting: boolean;
    pollVoting: boolean;
    communityForum: boolean;
  };
}

class PrivacyService {
  async anonymizeData(data: any, level: 'partial' | 'full'): Promise<any> {
    if (level === 'full') {
      return {
        ...data,
        userId: this.hashUserId(data.userId),
        name: null,
        phone: null,
        location: {
          district: data.location.district,
          state: data.location.state
          // Remove exact coordinates
        }
      };
    }
    
    // Partial anonymization
    return {
      ...data,
      name: this.maskName(data.name),
      phone: this.maskPhone(data.phone)
    };
  }
  
  async handleDataDeletionRequest(userId: string): Promise<void> {
    // GDPR-style right to be forgotten
    
    // 1. Delete personal data
    await this.deletePersonalData(userId);
    
    // 2. Anonymize historical records
    await this.anonymizeHistoricalRecords(userId);
    
    // 3. Remove from all caches
    await this.clearUserCaches(userId);
    
    // 4. Notify external services
    await this.notifyExternalServices(userId, 'delete');
    
    // 5. Log deletion (for audit)
    await this.logDataDeletion(userId);
  }
}
```

---

## Performance Requirements

### Response Time Targets

```typescript
interface PerformanceTargets {
  api: {
    p50: 200,  // ms
    p95: 500,  // ms
    p99: 1000  // ms
  };
  
  pageLoad: {
    firstContentfulPaint: 1500,  // ms
    timeToInteractive: 3000,     // ms
    totalLoadTime: 5000          // ms on 3G
  };
  
  offlineSync: {
    maxSyncTime: 30000,  // ms
    batchSize: 100       // records
  };
  
  videoStreaming: {
    startTime: 2000,     // ms
    bufferingRate: 5,    // % of playback time
    adaptiveBitrate: true
  };
}
```

### Caching Strategy

```typescript
class CacheService {
  private redis: Redis;
  
  // Cache layers
  private layers = {
    // L1: In-memory (Node.js process)
    memory: new NodeCache({ stdTTL: 300 }), // 5 minutes
    
    // L2: Redis (shared across instances)
    redis: this.redis,
    
    // L3: CDN (static assets)
    cdn: 'CloudFront'
  };
  
  async get(key: string): Promise<any> {
    // Try L1 cache
    let value = this.layers.memory.get(key);
    if (value) return value;
    
    // Try L2 cache
    value = await this.layers.redis.get(key);
    if (value) {
      // Populate L1
      this.layers.memory.set(key, value);
      return JSON.parse(value);
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number): Promise<void> {
    // Set in both layers
    this.layers.memory.set(key, value, ttl);
    await this.layers.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  // Cache invalidation patterns
  async invalidate(pattern: string): Promise<void> {
    // Invalidate L1
    this.layers.memory.flushAll();
    
    // Invalidate L2
    const keys = await this.layers.redis.keys(pattern);
    if (keys.length > 0) {
      await this.layers.redis.del(...keys);
    }
  }
}

// Cache keys and TTLs
const CACHE_CONFIG = {
  'weather:current:*': 1800,        // 30 minutes
  'weather:forecast:*': 3600,       // 1 hour
  'market:prices:*': 86400,         // 24 hours
  'crops:recommendations:*': 3600,  // 1 hour
  'content:video:*': 604800,        // 7 days
  'user:profile:*': 300,            // 5 minutes
  'schemes:list': 86400             // 24 hours
};
```

### Database Optimization

```typescript
// Query optimization strategies
class DatabaseOptimizer {
  // Connection pooling
  private pool = new Pool({
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });
  
  // Read replicas for scaling
  private readReplicas = [
    'replica1.db.ruralconnect.ai',
    'replica2.db.ruralconnect.ai'
  ];
  
  async executeQuery(query: string, params: any[]): Promise<any> {
    // Route read queries to replicas
    if (this.isReadQuery(query)) {
      const replica = this.selectReplica();
      return this.executeOnReplica(replica, query, params);
    }
    
    // Write queries to primary
    return this.executeOnPrimary(query, params);
  }
  
  // Prepared statements for common queries
  private preparedStatements = {
    getUserById: 'SELECT * FROM users WHERE id = $1',
    getCropRecommendations: `
      SELECT c.*, cr.score 
      FROM crops c
      JOIN crop_recommendations cr ON c.id = cr.crop_id
      WHERE cr.user_id = $1 AND cr.season = $2
      ORDER BY cr.score DESC
      LIMIT 5
    `,
    getGrievancesByStatus: `
      SELECT * FROM grievances
      WHERE status = $1 AND location->>'district' = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `
  };
  
  // Batch operations
  async batchInsert(table: string, records: any[]): Promise<void> {
    const batchSize = 1000;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      await this.insertBatch(table, batch);
    }
  }
}
```

### Offline Sync Optimization

```typescript
class OfflineSyncService {
  private syncQueue: SyncQueue;
  
  async syncWhenOnline(): Promise<void> {
    if (!navigator.onLine) return;
    
    // Get pending operations
    const pending = await this.syncQueue.getPending();
    
    // Prioritize by importance
    const prioritized = this.prioritizeOperations(pending);
    
    // Batch similar operations
    const batched = this.batchOperations(prioritized);
    
    // Sync in order
    for (const batch of batched) {
      try {
        await this.syncBatch(batch);
        await this.syncQueue.markComplete(batch.ids);
      } catch (error) {
        await this.handleSyncError(batch, error);
      }
    }
  }
  
  private prioritizeOperations(operations: SyncOperation[]): SyncOperation[] {
    const priority = {
      'emergency-contact': 1,
      'grievance-report': 2,
      'health-record': 3,
      'learning-progress': 4,
      'analytics': 5
    };
    
    return operations.sort((a, b) => 
      priority[a.type] - priority[b.type]
    );
  }
  
  private batchOperations(operations: SyncOperation[]): Batch[] {
    const batches: Map<string, SyncOperation[]> = new Map();
    
    for (const op of operations) {
      const key = `${op.type}:${op.endpoint}`;
      if (!batches.has(key)) {
        batches.set(key, []);
      }
      batches.get(key)!.push(op);
    }
    
    return Array.from(batches.values()).map(ops => ({
      type: ops[0].type,
      endpoint: ops[0].endpoint,
      operations: ops,
      ids: ops.map(o => o.id)
    }));
  }
}
```

---

## Monitoring & Observability

### Metrics Collection

```typescript
interface SystemMetrics {
  // Application metrics
  api: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  
  // Business metrics
  users: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    newRegistrations: number;
    retentionRate: number;
  };
  
  // Feature usage
  modules: {
    agriculture: {
      cropRecommendations: number;
      soilAnalysis: number;
      weatherAlerts: number;
    };
    health: {
      symptomChecks: number;
      remedySearches: number;
      firstAidAccess: number;
    };
    education: {
      videosWatched: number;
      quizzesCompleted: number;
      learningTime: number;
    };
    infrastructure: {
      grievancesReported: number;
      pollsVoted: number;
      projectsTracked: number;
    };
  };
  
  // Infrastructure metrics
  database: {
    connections: number;
    queryTime: number;
    cacheHitRate: number;
  };
  
  // External services
  external: {
    weatherAPI: { uptime: number; latency: number; };
    marketAPI: { uptime: number; latency: number; };
    smsGateway: { uptime: number; deliveryRate: number; };
  };
}
```

### Logging Strategy

```typescript
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  service: string;
  userId?: string;
  requestId: string;
  message: string;
  context: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack: string;
  };
}

class Logger {
  async log(entry: LogEntry): Promise<void> {
    // Structure logs for easy searching
    const structured = {
      ...entry,
      '@timestamp': entry.timestamp.toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION
    };
    
    // Send to logging service (e.g., Elasticsearch)
    await this.sendToLogService(structured);
    
    // Critical errors also go to alerting
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      await this.sendAlert(entry);
    }
  }
}
```

---

## Deployment Architecture

### Infrastructure Setup

```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ruralconnect-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ruralconnect-api
  template:
    metadata:
      labels:
        app: ruralconnect-api
    spec:
      containers:
      - name: api
        image: ruralconnect/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: npm test
      - name: Run integration tests
        run: npm run test:integration
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker image
        run: docker build -t ruralconnect/api:${{ github.sha }} .
      - name: Push to registry
        run: docker push ruralconnect/api:${{ github.sha }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/ruralconnect-api \
            api=ruralconnect/api:${{ github.sha }}
          kubectl rollout status deployment/ruralconnect-api
```

---

## Conclusion

This design specification provides a comprehensive blueprint for building RuralConnect AI. The architecture emphasizes:

1. **Offline-First**: Core functionality without internet dependency
2. **Scalability**: Microservices, caching, and database optimization
3. **Security**: End-to-end encryption, privacy controls, and secure authentication
4. **Performance**: Sub-second response times, efficient data sync
5. **Accessibility**: Multi-language support, voice interface, low-bandwidth optimization
6. **Modularity**: Independent modules with clear interfaces
7. **Observability**: Comprehensive monitoring and logging

The system is designed to scale from 10,000 users in pilot phase to 10 million users nationally, while maintaining performance and reliability standards suitable for rural connectivity conditions.

