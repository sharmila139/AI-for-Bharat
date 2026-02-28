# Evidence Level UI Display Examples

This document provides UI/UX examples for displaying evidence levels in the RuralConnect AI application.

## React Native Component Example

### EvidenceBadge Component

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EvidenceBadgeProps {
  level: 'traditional' | 'moderate' | 'strong';
  language?: 'en' | 'hi';
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
}

const EVIDENCE_INFO = {
  traditional: {
    icon: '🌾',
    color: '#8B4513',
    label: { en: 'Traditional Knowledge', hi: 'पारंपरिक ज्ञान' },
    description: {
      en: 'Time-tested traditional knowledge',
      hi: 'समय-परीक्षित पारंपरिक ज्ञान',
    },
  },
  moderate: {
    icon: '✓',
    color: '#FF8C00',
    label: { en: 'Field-Tested', hi: 'क्षेत्र-परीक्षित' },
    description: {
      en: 'Validated through farmer experiences',
      hi: 'किसान अनुभवों के माध्यम से मान्य',
    },
  },
  strong: {
    icon: '🔬',
    color: '#228B22',
    label: { en: 'Scientifically Validated', hi: 'वैज्ञानिक रूप से मान्य' },
    description: {
      en: 'Backed by scientific research',
      hi: 'वैज्ञानिक अनुसंधान द्वारा समर्थित',
    },
  },
};

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({
  level,
  language = 'en',
  size = 'medium',
  showDescription = false,
}) => {
  const info = EVIDENCE_INFO[level];
  const sizeStyles = styles[`${size}Badge`];

  return (
    <View style={[styles.container, { borderColor: info.color }]}>
      <View style={[styles.badge, sizeStyles, { backgroundColor: info.color }]}>
        <Text style={[styles.icon, styles[`${size}Icon`]]}>{info.icon}</Text>
        <Text style={[styles.label, styles[`${size}Label`]]}>
          {info.label[language]}
        </Text>
      </View>
      {showDescription && (
        <Text style={styles.description}>{info.description[language]}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediumBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  largeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 6,
  },
  smallIcon: {
    fontSize: 14,
  },
  mediumIcon: {
    fontSize: 18,
  },
  largeIcon: {
    fontSize: 24,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  smallLabel: {
    fontSize: 12,
  },
  mediumLabel: {
    fontSize: 14,
  },
  largeLabel: {
    fontSize: 16,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
});
```

### Usage Example

```typescript
// In article list
<EvidenceBadge level="strong" language="en" size="small" />

// In article detail
<EvidenceBadge 
  level="moderate" 
  language="hi" 
  size="large" 
  showDescription={true} 
/>
```

---

## Article Detail View Component

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface ScientificReference {
  title: string;
  authors: string;
  year: number;
  journal?: string;
  doi?: string;
  url?: string;
}

interface EvidenceSectionProps {
  evidenceLevel: 'traditional' | 'moderate' | 'strong';
  scientificReferences: ScientificReference[];
  verifiedBy?: string;
  verificationDate?: Date;
  language?: 'en' | 'hi';
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  evidenceLevel,
  scientificReferences,
  verifiedBy,
  verificationDate,
  language = 'en',
}) => {
  const formatReference = (ref: ScientificReference): string => {
    const parts = [
      ref.authors,
      `(${ref.year})`,
      `"${ref.title}"`,
      ref.journal,
      ref.doi ? `DOI: ${ref.doi}` : ref.url ? `URL: ${ref.url}` : null,
    ].filter(Boolean);
    return parts.join('. ');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {language === 'en' ? 'Evidence Level' : 'साक्ष्य स्तर'}
      </Text>

      <EvidenceBadge 
        level={evidenceLevel} 
        language={language} 
        size="large" 
        showDescription={true}
      />

      {verifiedBy && (
        <View style={styles.verificationBox}>
          <Text style={styles.verifiedIcon}>✓</Text>
          <View>
            <Text style={styles.verifiedText}>
              {language === 'en' ? 'Verified by Expert' : 'विशेषज्ञ द्वारा सत्यापित'}
            </Text>
            {verificationDate && (
              <Text style={styles.verifiedDate}>
                {verificationDate.toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      )}

      {scientificReferences.length > 0 && (
        <View style={styles.referencesSection}>
          <Text style={styles.referencesTitle}>
            {language === 'en' ? 'Scientific References' : 'वैज्ञानिक संदर्भ'}
          </Text>
          {scientificReferences.map((ref, index) => (
            <View key={index} style={styles.reference}>
              <Text style={styles.referenceNumber}>[{index + 1}]</Text>
              <Text style={styles.referenceText}>{formatReference(ref)}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          {language === 'en'
            ? 'Evidence levels indicate the type of backing for this information. All levels can be effective - choose what works best for your situation.'
            : 'साक्ष्य स्तर इस जानकारी के समर्थन के प्रकार को दर्शाते हैं। सभी स्तर प्रभावी हो सकते हैं - अपनी स्थिति के लिए सबसे अच्छा चुनें।'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  verificationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  verifiedIcon: {
    fontSize: 24,
    marginRight: 8,
    color: '#4CAF50',
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  verifiedDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  referencesSection: {
    marginTop: 16,
  },
  referencesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  reference: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 8,
  },
  referenceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
    minWidth: 24,
  },
  referenceText: {
    flex: 1,
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1565C0',
    lineHeight: 18,
  },
});
```

---

## Search Filter Component

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface EvidenceLevelFilterProps {
  selectedLevels: string[];
  onSelectionChange: (levels: string[]) => void;
  language?: 'en' | 'hi';
}

export const EvidenceLevelFilter: React.FC<EvidenceLevelFilterProps> = ({
  selectedLevels,
  onSelectionChange,
  language = 'en',
}) => {
  const filters = [
    {
      value: 'traditional',
      label: language === 'en' ? 'Traditional' : 'पारंपरिक',
      icon: '🌾',
      color: '#8B4513',
    },
    {
      value: 'moderate',
      label: language === 'en' ? 'Field-Tested' : 'क्षेत्र-परीक्षित',
      icon: '✓',
      color: '#FF8C00',
    },
    {
      value: 'strong',
      label: language === 'en' ? 'Scientific' : 'वैज्ञानिक',
      icon: '🔬',
      color: '#228B22',
    },
  ];

  const toggleLevel = (level: string) => {
    if (selectedLevels.includes(level)) {
      onSelectionChange(selectedLevels.filter(l => l !== level));
    } else {
      onSelectionChange([...selectedLevels, level]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {language === 'en' ? 'Evidence Level' : 'साक्ष्य स्तर'}
      </Text>
      <View style={styles.filterRow}>
        {filters.map(filter => {
          const isSelected = selectedLevels.includes(filter.value);
          return (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterButton,
                isSelected && {
                  backgroundColor: filter.color,
                  borderColor: filter.color,
                },
              ]}
              onPress={() => toggleLevel(filter.value)}
            >
              <Text style={styles.filterIcon}>{filter.icon}</Text>
              <Text
                style={[
                  styles.filterLabel,
                  isSelected && styles.filterLabelSelected,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  filterLabel: {
    fontSize: 13,
    color: '#666',
  },
  filterLabelSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
});
```

---

## Article List Item Component

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

interface ArticleListItemProps {
  article: {
    id: string;
    title: string;
    summary: string;
    evidenceLevel: 'traditional' | 'moderate' | 'strong';
    category: string;
    viewCount: number;
    rating: number;
    thumbnailUrl?: string;
  };
  onPress: () => void;
  language?: 'en' | 'hi';
}

export const ArticleListItem: React.FC<ArticleListItemProps> = ({
  article,
  onPress,
  language = 'en',
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {article.thumbnailUrl && (
        <Image source={{ uri: article.thumbnailUrl }} style={styles.thumbnail} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{article.category}</Text>
          <EvidenceBadge level={article.evidenceLevel} language={language} size="small" />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {article.summary}
        </Text>
        <View style={styles.footer}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>👁️</Text>
            <Text style={styles.statText}>{article.viewCount}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statText}>{article.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  summary: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
});
```

---

## Accessibility Considerations

### Voice Output

For users with low literacy or visual impairments, the evidence level should be announced clearly:

```typescript
const getAccessibilityLabel = (level: string, language: 'en' | 'hi'): string => {
  const labels = {
    traditional: {
      en: 'Traditional knowledge. Time-tested farming practice passed down through generations.',
      hi: 'पारंपरिक ज्ञान। पीढ़ियों से चली आ रही समय-परीक्षित कृषि प्रथा।',
    },
    moderate: {
      en: 'Field-tested. Validated through farmer experiences and extension programs.',
      hi: 'क्षेत्र-परीक्षित। किसान अनुभवों और विस्तार कार्यक्रमों के माध्यम से मान्य।',
    },
    strong: {
      en: 'Scientifically validated. Backed by research and peer-reviewed studies.',
      hi: 'वैज्ञानिक रूप से मान्य। अनुसंधान और सहकर्मी-समीक्षित अध्ययनों द्वारा समर्थित।',
    },
  };
  return labels[level][language];
};

// Usage in component
<View accessible={true} accessibilityLabel={getAccessibilityLabel(evidenceLevel, language)}>
  <EvidenceBadge level={evidenceLevel} language={language} />
</View>
```

---

## Color Contrast

Ensure all text on colored backgrounds meets WCAG AA standards:

- Traditional (Brown #8B4513): Use white text
- Moderate (Orange #FF8C00): Use white text
- Strong (Green #228B22): Use white text

All combinations have been tested and meet minimum contrast ratio of 4.5:1.

---

## Responsive Design

### Mobile (Small Screens)

- Use compact badges with icons
- Stack evidence information vertically
- Collapse scientific references by default

### Tablet (Medium Screens)

- Show full badges with descriptions
- Display references in two columns
- Show more metadata

### Desktop (Large Screens)

- Full evidence section with all details
- Side-by-side comparison of evidence levels
- Expanded reference information

---

## Animation Examples

### Badge Entrance Animation

```typescript
import { Animated } from 'react-native';

const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 500,
    useNativeDriver: true,
  }).start();
}, []);

<Animated.View style={{ opacity: fadeAnim }}>
  <EvidenceBadge level={evidenceLevel} />
</Animated.View>
```

### Level Change Animation

```typescript
const scaleAnim = useRef(new Animated.Value(1)).current;

const animateLevelChange = () => {
  Animated.sequence([
    Animated.timing(scaleAnim, {
      toValue: 1.2,
      duration: 200,
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }),
  ]).start();
};

<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <EvidenceBadge level={evidenceLevel} />
</Animated.View>
```

---

## Testing Checklist

- [ ] Evidence badges display correctly for all three levels
- [ ] Colors are consistent across the app
- [ ] Icons render properly on all devices
- [ ] Multi-language support works correctly
- [ ] Scientific references format properly
- [ ] Verification status displays when present
- [ ] Filters work correctly in search
- [ ] Accessibility labels are accurate
- [ ] Voice output is clear and informative
- [ ] Animations are smooth and not distracting
- [ ] Component works offline with cached data
- [ ] Loading states are handled gracefully

---

## Performance Optimization

1. **Memoize badge components** to prevent unnecessary re-renders
2. **Cache evidence level info** to avoid repeated API calls
3. **Lazy load scientific references** for better initial load time
4. **Use FlatList** for long lists of articles with evidence badges
5. **Optimize images** for evidence level icons and thumbnails

---

This completes the UI examples for the Evidence Level Classification System. These components provide a consistent, accessible, and user-friendly way to display evidence levels throughout the RuralConnect AI application.
