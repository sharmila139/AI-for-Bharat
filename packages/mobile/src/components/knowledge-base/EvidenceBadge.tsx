/**
 * Evidence Badge Component
 * Visual badge for displaying evidence levels
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../../contexts/LanguageContext';

interface EvidenceBadgeProps {
  level: 'traditional' | 'moderate' | 'strong';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function EvidenceBadge({ 
  level, 
  size = 'medium', 
  showLabel = true 
}: EvidenceBadgeProps) {
  const { t } = useLanguage();

  const getEvidenceConfig = () => {
    switch (level) {
      case 'traditional':
        return {
          color: '#FF9800',
          icon: 'history-edu',
          label: t('knowledge_base.evidence.traditional'),
          description: t('knowledge_base.evidence.traditional_desc'),
        };
      case 'moderate':
        return {
          color: '#2196F3',
          icon: 'science',
          label: t('knowledge_base.evidence.moderate'),
          description: t('knowledge_base.evidence.moderate_desc'),
        };
      case 'strong':
        return {
          color: '#4CAF50',
          icon: 'verified',
          label: t('knowledge_base.evidence.strong'),
          description: t('knowledge_base.evidence.strong_desc'),
        };
    }
  };

  const config = getEvidenceConfig();
  const iconSize = size === 'small' ? 14 : size === 'medium' ? 18 : 24;
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;

  return (
    <View style={[styles.container, { backgroundColor: `${config.color}15` }]}>
      <Icon name={config.icon} size={iconSize} color={config.color} />
      {showLabel && (
        <Text style={[styles.label, { color: config.color, fontSize }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  label: {
    fontWeight: '600',
    marginLeft: 4,
  },
});
