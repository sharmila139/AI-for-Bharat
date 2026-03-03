# Translation System - Quick Reference Guide

## API Endpoints

### Base URL
```
https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com
```

### 1. Get All Languages
```bash
GET /api/translations/languages

# Example
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/languages
```

### 2. Get All Translations for a Language
```bash
GET /api/translations/{lang}

# Examples
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/hi
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/ta
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/bn
```

### 3. Get Module-Specific Translations
```bash
GET /api/translations/{lang}/{module}

# Examples
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/hi/common
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/ta/agriculture
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/hi/health
```

### 4. AI-Powered Translation
```bash
POST /api/translations/translate
Content-Type: application/json

{
  "text": "Text to translate",
  "sourceLang": "en",
  "targetLang": "hi"
}

# Example
curl -X POST https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Welcome to RuralConnect AI", "sourceLang": "en", "targetLang": "hi"}'
```

## Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| en   | English  | English     |
| hi   | Hindi    | हिंदी       |
| ta   | Tamil    | தமிழ்        |
| te   | Telugu   | తెలుగు      |
| bn   | Bengali  | বাংলা       |
| mr   | Marathi  | मराठी       |
| gu   | Gujarati | ગુજરાતી     |
| kn   | Kannada  | ಕನ್ನಡ       |
| ml   | Malayalam| മലയാളം      |
| pa   | Punjabi  | ਪੰਜਾਬੀ      |
| or   | Odia     | ଓଡ଼ିଆ       |
| as   | Assamese | অসমীয়া     |
| ur   | Urdu     | اردو (RTL)  |
| sa   | Sanskrit | संस्कृतम्   |
| ks   | Kashmiri | कॉशुर       |

## Translation Modules

### Common (18 keys)
- welcome, home, agriculture, health, education, infrastructure
- loading, error, success
- submit, cancel, save, delete, edit
- search, filter, back, next, previous, close

### Agriculture (11 keys)
- cropRecommendations, soilAnalysis, weatherForecast, marketPrices
- getSuggestions, soilType, season, location
- suitability, expectedYield, waterRequirement

### Health (10 keys)
- symptomChecker, naturalRemedies, firstAid
- enterSymptoms, checkSymptoms, severity
- remedyName, preparation, benefits, contraindications

## Frontend Usage

### Import Language Selector
```typescript
import { LanguageSelector } from './components/LanguageSelector';
```

### Use in Component
```typescript
function MyComponent() {
  const [language, setLanguage] = useState('en');
  
  return (
    <LanguageSelector 
      currentLanguage={language}
      onLanguageChange={setLanguage}
    />
  );
}
```

### Fetch Translations
```typescript
useEffect(() => {
  fetch(`/api/translations/${language}`)
    .then(res => res.json())
    .then(data => {
      const translations = data.data.translations;
      // Use translations
    });
}, [language]);
```

## Deployment Commands

### Upload Translations to S3
```bash
./deploy-translations.sh
```

### Deploy Lambda with Translation Endpoints
```bash
./deploy-lambda-with-translations.sh
```

### Test All Endpoints
```bash
./test-translation-endpoints.sh
```

## Data Files

### S3 Location
```
s3://ruralconnect-data-032761628276/translations.json
```

### Local File
```
data/translations.json
```

## Common Tasks

### Add New Translation Key
1. Edit `data/translations.json`
2. Add key to all language objects
3. Upload to S3: `./deploy-translations.sh`

### Add New Language
1. Edit `data/translations.json`
2. Add language to `languages` array
3. Add translations object for language code
4. Upload to S3: `./deploy-translations.sh`

### Test Specific Language
```bash
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/{lang} | jq '.'
```

### Check Translation Coverage
```bash
curl https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com/api/translations/{lang} | jq '.data.translations | keys'
```

## Troubleshooting

### Translations Not Loading
1. Check S3 file exists: `aws s3 ls s3://ruralconnect-data-032761628276/translations.json`
2. Check Lambda has S3 permissions
3. Check Lambda logs: `aws logs tail /aws/lambda/ruralconnect-api`

### Language Not Found
1. Verify language code in `languages` array
2. Verify translations object exists for language code
3. Check API response for error message

### AI Translation Not Working
1. Verify AWS Bedrock is enabled in account
2. Check Lambda has Bedrock permissions
3. System will fallback to original text if Bedrock unavailable

## Performance Tips

### Frontend Caching
```typescript
// Cache translations in localStorage
localStorage.setItem(`translations_${lang}`, JSON.stringify(translations));

// Load from cache first
const cached = localStorage.getItem(`translations_${lang}`);
if (cached) {
  setTranslations(JSON.parse(cached));
}
```

### Backend Caching
- Lambda keeps translations in memory between invocations
- S3 reads are cached for 5 minutes
- Use CloudFront CDN for global distribution (optional)

## Cost Optimization

### Current Costs
- S3 Storage: $0.01/month
- S3 Requests: $0.05/month
- Lambda: $0.20/month
- Total: ~$0.36/month

### With AI Translation
- Bedrock Claude: $0.003 per 1K tokens
- 10K translations/month: ~$1.50
- Total with AI: ~$2/month

## Support

### Documentation
- Full docs: `TRANSLATION_SYSTEM_COMPLETE.md`
- Summary: `SECTION_26_COMPLETION_SUMMARY.md`
- This guide: `TRANSLATION_QUICK_REFERENCE.md`

### Testing
- Run all tests: `./test-translation-endpoints.sh`
- Test specific endpoint: `curl {endpoint} | jq '.'`

---

**Last Updated**: March 3, 2026
**Status**: Production Ready
