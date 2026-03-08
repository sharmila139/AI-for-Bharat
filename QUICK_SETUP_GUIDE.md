# Quick Setup Guide - Phase 1 & 2

## 🚀 Quick Start (5 minutes)

### 1. Install Required Packages

```bash
cd packages/mobile
npm install i18next react-i18next @aws-sdk/client-bedrock-runtime
```

### 2. Update App.tsx

Add this single line at the top of `packages/mobile/App.tsx`:

```typescript
import './src/i18n';
```

That's it! The i18n system is now active.

### 3. Test Language Switching

1. Build and run the app: `npx expo run:android`
2. Navigate to Settings
3. You should see language options
4. Switch between English, Hindi, Telugu

---

## 🔧 Optional: Add Language Switcher to Settings

If you want a dedicated language switcher in your settings screen:

```typescript
// In your SettingsScreen.tsx or similar
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false);

  return (
    <View>
      {/* Your existing settings */}
      
      <TouchableOpacity onPress={() => setShowLanguageSwitcher(true)}>
        <Text>{t('settings.language')}</Text>
      </TouchableOpacity>

      <LanguageSwitcher 
        visible={showLanguageSwitcher} 
        onClose={() => setShowLanguageSwitcher(false)} 
      />
    </View>
  );
}
```

---

## 🧪 Testing AI Features

### Option A: With Your Backend

1. Ensure your backend at `https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com` has the endpoint:
   ```
   POST /api/v1/ai/invoke
   ```

2. The endpoint should accept:
   ```json
   {
     "modelId": "anthropic.claude-3-sonnet-20240229-v1:0",
     "prompt": "Your prompt here",
     "systemPrompt": "System instructions",
     "context": {},
     "temperature": 0.7,
     "maxTokens": 2048
   }
   ```

3. Test the features:
   - Crop Recommendation
   - Health Symptom Checker
   - Grievance Classification

### Option B: Without Backend (Fallback Mode)

The app will automatically use fallback logic:
- Crop recommendations: Rule-based by season
- Health assessment: Keyword-based severity
- Grievance classification: Keyword matching

This allows you to test the UI and flow without AWS setup.

---

## 📱 Using Translations in Your Screens

### Basic Usage

```typescript
import { useTranslation } from 'react-i18next';

function MyScreen() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('common.welcome')}</Text>
      <Text>{t('agriculture.title')}</Text>
      <Button title={t('common.submit')} />
    </View>
  );
}
```

### With Variables

```typescript
<Text>{t('validation.min_length', { count: 5 })}</Text>
// Output: "Minimum 5 characters required"
```

### Available Translation Keys

Check these files for all available keys:
- `packages/mobile/src/i18n/locales/en.json`
- `packages/mobile/src/i18n/locales/hi.json`
- `packages/mobile/src/i18n/locales/te.json`

---

## 🔑 AWS Configuration (For Production)

Create `.env` file in `packages/mobile/`:

```env
AWS_REGION=us-east-1
AWS_BEDROCK_REGION=us-east-1
API_BASE_URL=https://q5hy2fwp3i.execute-api.us-east-1.amazonaws.com
```

---

## ✅ Verification Checklist

- [ ] Packages installed
- [ ] App.tsx updated with i18n import
- [ ] App builds successfully
- [ ] Can switch languages in settings
- [ ] UI text changes when language changes
- [ ] AI features work (or show fallback)
- [ ] No console errors

---

## 🐛 Troubleshooting

### "Cannot find module 'i18next'"
```bash
cd packages/mobile
npm install i18next react-i18next
```

### "Translation key not found"
- Check if the key exists in `en.json`
- Make sure you imported `useTranslation` correctly
- Verify the key path (e.g., `common.welcome` not `welcome`)

### "AI features not working"
- Check if backend endpoint exists
- Verify AWS credentials
- Check console for error messages
- Fallback mode should still work

### "Language not persisting"
- Check if AsyncStorage is properly configured
- Verify permissions in app.json
- Check console for storage errors

---

## 📞 Need Help?

Check these files for more details:
- `PHASE_1_2_COMPLETION_SUMMARY.md` - Complete overview
- `PRIORITY_ORDER.md` - Full priority list
- `packages/mobile/src/i18n/index.ts` - i18n configuration
- `packages/mobile/src/services/aws/bedrock-service.ts` - AI service

---

## 🎉 You're Done!

Your app now has:
- ✅ AI-powered features with AWS Bedrock
- ✅ Multi-language support (English, Hindi, Telugu)
- ✅ Automatic fallbacks when services are unavailable
- ✅ Professional language switcher

**Time to test and enjoy!** 🚀
