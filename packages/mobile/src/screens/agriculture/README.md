# Agriculture Screens

This directory contains React Native screens for the Smart Agriculture module of RuralConnect AI.

## Screens

### 1. SoilAnalysisScreen

Comprehensive UI for displaying soil health analysis, fertilizer recommendations, irrigation schedules, and water usage metrics.

**Features:**
- **Health Tab**: Visual soil health score (0-100) with color-coded circular indicator, soil composition breakdown (pH, NPK, organic matter, micronutrients, texture), and actionable recommendations
- **Fertilizer Tab**: Three types of recommendations (organic, chemical, mixed), cost-benefit analysis, product details, application schedules, warnings, and tips
- **Irrigation Tab**: Next irrigation event card, upcoming events calendar, irrigation schedule with weather adjustments, and quick actions
- **Water Tab**: Water use efficiency dashboard, usage summary metrics, events tracking, insights, and recommendations

**Data Structures:**
- Integrates with backend services: `soil-health-calculator.ts`, `fertilizer-recommendation.ts`, `irrigation-schedule.ts`, `water-usage-tracker.ts`
- Supports offline functionality with cached data
- Real-time updates when connectivity is available

**Visual Indicators:**
- Color-coded health scores (Green: Excellent, Light Green: Good, Orange: Fair, Deep Orange: Poor, Red: Very Poor)
- Progress bars for each soil factor
- Circular efficiency indicators
- Status badges for irrigation events

**Usage:**
```typescript
import { SoilAnalysisScreen } from './screens/agriculture';

// In navigation
<Stack.Screen name="SoilAnalysis" component={SoilAnalysisScreen} />
```

### 2. CropRecommendationScreen

Displays AI-powered crop recommendations with ranking, financial projections, and detailed information.

**Features:**
- Top 5 crop recommendations ranked by profitability
- Financial projections (investment, revenue, profit, ROI)
- Timeline information (sowing, harvest, duration)
- Risk factors and benefits
- Expandable detail cards

### 3. SoilHealthCardOCRScreen

Mobile screen for capturing soil health card images and processing with OCR.

**Features:**
- Photo capture from camera or gallery
- OCR processing with confidence scoring
- Manual correction interface for low-confidence results
- Field-by-field data entry
- Validation and error handling

## Integration Points

### Backend APIs
- `POST /api/agriculture/soil-analysis` - Upload soil photo for analysis
- `GET /api/agriculture/soil-health/:id` - Fetch soil health score
- `GET /api/agriculture/fertilizer-recommendations/:id` - Get fertilizer recommendations
- `GET /api/agriculture/irrigation-schedule/:id` - Fetch irrigation schedule
- `GET /api/agriculture/water-usage/:id` - Get water usage metrics

### Offline Support
All screens support offline functionality:
- Data cached in Realm database
- Sync queue for pending operations
- Staleness indicators for cached data
- Automatic sync when connectivity restored

### State Management
- Local state with React hooks
- Redux integration for global state (optional)
- Realm database for persistence

## Styling

All screens follow the RuralConnect AI design system:
- Primary color: #4CAF50 (Green)
- Secondary colors: #8BC34A (Light Green), #FF9800 (Orange)
- Background: #f5f5f5
- Card elevation: 2-4
- Border radius: 8-12px
- Font sizes: 12-36px

## Accessibility

- High contrast mode support
- Adjustable font sizes
- Screen reader compatibility
- Voice command support (planned)
- Icon-based navigation for low literacy

## Testing

Unit tests and property-based tests are located in:
- `packages/backend/src/services/agriculture/__tests__/`
- `packages/mobile/src/screens/agriculture/__tests__/` (to be created)

## Future Enhancements

1. **Photo Analysis**: Direct soil photo upload and AI analysis
2. **Voice Input**: Voice commands for data entry
3. **Multi-language**: Support for 15+ Indian languages
4. **Animations**: Smooth transitions and loading states
5. **Charts**: Interactive charts for historical data
6. **Notifications**: Push notifications for irrigation reminders
7. **Sharing**: Share recommendations with other farmers
8. **Export**: PDF export of soil analysis reports

## Dependencies

```json
{
  "react": "^18.2.0",
  "react-native": "^0.72.0",
  "realm": "^11.0.0"
}
```

## Performance Considerations

- Lazy loading for large datasets
- Image compression before upload
- Efficient list rendering with FlatList
- Memoization for expensive calculations
- Debounced search and filters

## Maintenance

- Regular updates to soil health algorithms
- Fertilizer product database updates
- Weather API integration maintenance
- User feedback incorporation
- Performance monitoring and optimization
