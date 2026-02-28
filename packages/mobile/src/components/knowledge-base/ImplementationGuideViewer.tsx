/**
 * Implementation Guide Viewer Component
 * Display step-by-step implementation guides
 * TODO: Implement full functionality as per UI spec
 */

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ImplementationGuideViewerProps {
  guide: {
    steps: Array<{
      step: number;
      description: { [key: string]: string };
      duration?: string;
      image_url?: string;
      warnings?: Array<{ [key: string]: string }>;
    }>;
    materials: Array<{
      name: { [key: string]: string };
      quantity: string;
      cost?: number;
      where_to_find?: { [key: string]: string };
    }>;
    tools: Array<{
      name: { [key: string]: string };
      optional?: boolean;
    }>;
    timeline: string;
    difficulty_level?: 'easy' | 'medium' | 'hard';
  };
}

export default function ImplementationGuideViewer({ guide }: ImplementationGuideViewerProps) {
  const { currentLanguage, t } = useLanguage();
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (stepNumber: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepNumber)) {
      newCompleted.delete(stepNumber);
    } else {
      newCompleted.add(stepNumber);
    }
    setCompletedSteps(newCompleted);
  };

  const getDifficultyColor = () => {
    switch (guide.difficulty_level) {
      case 'easy': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'hard': return '#FF3B30';
      default: return '#666';
    }
  };

  const getDifficultyDots = () => {
    const level = guide.difficulty_level || 'medium';
    const dots = level === 'easy' ? 1 : level === 'medium' ? 2 : 3;
    return '●'.repeat(dots) + '○'.repeat(3 - dots);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.difficultyRow}>
          <Text style={styles.label}>{t('knowledge_base.difficulty')}:</Text>
          <Text style={[styles.difficultyText, { color: getDifficultyColor() }]}>
            {getDifficultyDots()} {guide.difficulty_level || 'medium'}
          </Text>
        </View>
        <View style={styles.timelineRow}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.timelineText}>{guide.timeline}</Text>
        </View>
      </View>

      {/* Materials */}
      {guide.materials && guide.materials.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('knowledge_base.materials_needed')}</Text>
          {guide.materials.map((material, index) => {
            const name = material.name[currentLanguage] || material.name['en'];
            return (
              <View key={index} style={styles.listItem}>
                <Icon name="fiber-manual-record" size={8} color="#666" />
                <Text style={styles.listItemText}>
                  {name} - {material.quantity}
                  {material.cost && ` - ₹${material.cost}`}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Tools */}
      {guide.tools && guide.tools.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('knowledge_base.tools_required')}</Text>
          {guide.tools.map((tool, index) => {
            const name = tool.name[currentLanguage] || tool.name['en'];
            return (
              <View key={index} style={styles.listItem}>
                <Icon name="fiber-manual-record" size={8} color="#666" />
                <Text style={styles.listItemText}>
                  {name}
                  {tool.optional && ` (${t('knowledge_base.optional')})`}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('knowledge_base.steps')}</Text>
        {guide.steps.map((step) => {
          const description = step.description[currentLanguage] || step.description['en'];
          const isCompleted = completedSteps.has(step.step);
          
          return (
            <View key={step.step} style={styles.stepCard}>
              <TouchableOpacity
                style={styles.stepHeader}
                onPress={() => toggleStep(step.step)}
              >
                <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
                  {isCompleted && <Icon name="check" size={16} color="#fff" />}
                </View>
                <Text style={[styles.stepTitle, isCompleted && styles.stepTitleCompleted]}>
                  {t('knowledge_base.step')} {step.step}
                </Text>
              </TouchableOpacity>

              {step.image_url && (
                <Image source={{ uri: step.image_url }} style={styles.stepImage} />
              )}

              <Text style={styles.stepDescription}>{description}</Text>

              {step.warnings && step.warnings.length > 0 && (
                <View style={styles.warningBox}>
                  <Icon name="warning" size={16} color="#FF9800" />
                  {step.warnings.map((warning, index) => {
                    const warningText = warning[currentLanguage] || warning['en'];
                    return (
                      <Text key={index} style={styles.warningText}>
                        {warningText}
                      </Text>
                    );
                  })}
                </View>
              )}

              {step.duration && (
                <View style={styles.durationRow}>
                  <Icon name="schedule" size={14} color="#666" />
                  <Text style={styles.durationText}>
                    {t('knowledge_base.duration')}: {step.duration}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.progressText}>
          {t('knowledge_base.progress')}: {completedSteps.size} / {guide.steps.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(completedSteps.size / guide.steps.length) * 100}%` },
            ]}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 8,
  },
  listItemText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  stepTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  stepImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f0f0f0',
  },
  stepDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  progressSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
});
