/**
 * Crop Rotation Plan Screen
 * Visual timeline of crop rotation with benefits and recommendations
 * 
 * Features:
 * - Visual timeline of crop rotation
 * - Season-wise crop planning
 * - Companion crop suggestions
 * - Soil health benefits display
 * - Multi-year planning view
 * - Export/share rotation plan
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AgricultureStackParamList, AgricultureStackNavigationProp } from '../../navigation/types';
import cropRotationService, {
  CropRotationPlan,
  CropRotationCycle,
} from '../../services/cropRotationService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

type CropRotationPlanRouteProp = RouteProp<AgricultureStackParamList, 'CropRotationPlan'>;

const CropRotationPlanScreen: React.FC = () => {
  const route = useRoute<CropRotationPlanRouteProp>();
  const navigation = useNavigation<AgricultureStackNavigationProp>();
  const { farmId } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<CropRotationPlan | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    if (farmId) {
      loadPlan();
    }
  }, [farmId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const planData = await cropRotationService.getCropRotationPlan(farmId!);
      setPlan(planData);
      setSelectedYear(planData.startYear);
    } catch (err: any) {
      console.error('Error loading crop rotation plan:', err);
      setError(err.message || 'Failed to load crop rotation plan');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!plan) return;

    Alert.alert(
      'Export Plan',
      'Choose export format',
      [
        {
          text: 'PDF',
          onPress: async () => {
            try {
              const url = await cropRotationService.exportRotationPlan(plan.planId, 'pdf');
              Alert.alert('Success', `Plan exported: ${url}`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to export plan');
            }
          },
        },
        {
          text: 'Image',
          onPress: async () => {
            try {
              const url = await cropRotationService.exportRotationPlan(plan.planId, 'image');
              Alert.alert('Success', `Plan exported: ${url}`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to export plan');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleShare = async () => {
    if (!plan) return;

    try {
      await Share.share({
        message: `Crop Rotation Plan for ${plan.farmName}\n\n` +
          `Duration: ${plan.duration} years\n` +
          `Soil Health Improvement: ${plan.benefits.soilHealthImprovement}%\n` +
          `Expected Yield Increase: ${plan.benefits.yieldIncrease}%`,
        title: 'Crop Rotation Plan',
      });
    } catch (err: any) {
      console.error('Error sharing plan:', err);
    }
  };

  const getCyclesForYear = (year: number): CropRotationCycle[] => {
    if (!plan) return [];
    return plan.cycles.filter(cycle => cycle.year === year);
  };

  const getYears = (): number[] => {
    if (!plan) return [];
    const years: number[] = [];
    for (let i = 0; i < plan.duration; i++) {
      years.push(plan.startYear + i);
    }
    return years;
  };

  const renderBenefits = () => {
    if (!plan) return null;

    const benefits = [
      {
        icon: '🌱',
        label: 'Soil Health',
        value: `+${plan.benefits.soilHealthImprovement}%`,
        color: '#4CAF50',
      },
      {
        icon: '🐛',
        label: 'Pest Reduction',
        value: `${plan.benefits.pestReduction}%`,
        color: '#FF9800',
      },
      {
        icon: '📈',
        label: 'Yield Increase',
        value: `+${plan.benefits.yieldIncrease}%`,
        color: '#2196F3',
      },
      {
        icon: '💰',
        label: 'Economic Benefit',
        value: `₹${plan.benefits.economicBenefit.toLocaleString()}`,
        color: '#9C27B0',
      },
    ];

    return (
      <View style={styles.benefitsContainer}>
        <Text style={styles.sectionTitle}>📊 Expected Benefits</Text>
        <View style={styles.benefitsGrid}>
          {benefits.map((benefit, index) => (
            <View key={index} style={[styles.benefitCard, { borderColor: benefit.color }]}>
              <Text style={styles.benefitIcon}>{benefit.icon}</Text>
              <Text style={[styles.benefitValue, { color: benefit.color }]}>
                {benefit.value}
              </Text>
              <Text style={styles.benefitLabel}>{benefit.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderYearSelector = () => {
    const years = getYears();

    return (
      <View style={styles.yearSelector}>
        <Text style={styles.sectionTitle}>📅 Select Year</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {years.map(year => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.yearButtonActive,
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text
                style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.yearButtonTextActive,
                ]}
              >
                Year {year - (plan?.startYear || 0) + 1}
              </Text>
              <Text
                style={[
                  styles.yearButtonSubtext,
                  selectedYear === year && styles.yearButtonSubtextActive,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCycleCard = (cycle: CropRotationCycle) => {
    const seasonColor = cropRotationService.getSeasonColor(cycle.season);
    const seasonName = cropRotationService.getSeasonName(cycle.season);

    return (
      <View key={`${cycle.year}-${cycle.season}`} style={styles.cycleCard}>
        <View style={[styles.cycleHeader, { backgroundColor: seasonColor }]}>
          <Text style={styles.cycleSeasonText}>{seasonName}</Text>
          <Text style={styles.cycleDuration}>{cycle.duration} days</Text>
        </View>

        <View style={styles.cycleBody}>
          <Text style={styles.cycleCropName}>{cycle.cropName}</Text>
          <Text style={styles.cycleCropType}>{cycle.cropType}</Text>

          <View style={styles.cycleTimeline}>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Sowing:</Text>
              <Text style={styles.timelineValue}>{cycle.sowingMonth}</Text>
            </View>
            <Text style={styles.timelineArrow}>→</Text>
            <View style={styles.timelineItem}>
              <Text style={styles.timelineLabel}>Harvest:</Text>
              <Text style={styles.timelineValue}>{cycle.harvestMonth}</Text>
            </View>
          </View>

          <View style={styles.yieldContainer}>
            <Text style={styles.yieldLabel}>Expected Yield:</Text>
            <Text style={styles.yieldValue}>{cycle.expectedYield} kg/acre</Text>
          </View>

          {/* Soil Health Impact */}
          <View style={styles.soilImpactContainer}>
            <Text style={styles.soilImpactTitle}>Soil Health Impact:</Text>
            <View style={styles.soilImpactGrid}>
              {Object.entries(cycle.soilHealthImpact).map(([key, value]) => {
                const isPositive = value > 0;
                return (
                  <View key={key} style={styles.soilImpactItem}>
                    <Text style={styles.soilImpactLabel}>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Text>
                    <Text
                      style={[
                        styles.soilImpactValue,
                        { color: isPositive ? '#4CAF50' : '#F44336' },
                      ]}
                    >
                      {isPositive ? '+' : ''}{value}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Companion Crops */}
          {cycle.companionCrops && cycle.companionCrops.length > 0 && (
            <View style={styles.companionContainer}>
              <Text style={styles.companionTitle}>🌾 Companion Crops:</Text>
              <View style={styles.companionTags}>
                {cycle.companionCrops.map((crop, index) => (
                  <View key={index} style={styles.companionTag}>
                    <Text style={styles.companionTagText}>{crop}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderTimeline = () => {
    if (!selectedYear) return null;

    const cycles = getCyclesForYear(selectedYear);

    if (cycles.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No crops planned for this year</Text>
        </View>
      );
    }

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>🌾 Crop Timeline - {selectedYear}</Text>
        {cycles.map(renderCycleCard)}
      </View>
    );
  };

  const renderRecommendations = () => {
    if (!plan || !plan.recommendations.length) return null;

    return (
      <View style={styles.recommendationsContainer}>
        <Text style={styles.sectionTitle}>💡 Recommendations</Text>
        {plan.recommendations.map((recommendation, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Text style={styles.recommendationBullet}>•</Text>
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderActions = () => {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Text style={styles.actionButtonIcon}>📄</Text>
          <Text style={styles.actionButtonText}>Export Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={handleShare}
        >
          <Text style={styles.actionButtonIcon}>📤</Text>
          <Text style={styles.actionButtonText}>Share Plan</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Loading crop rotation plan..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadPlan} />;
  }

  if (!plan) {
    return (
      <ErrorState
        message="No crop rotation plan found for this farm"
        onRetry={loadPlan}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.farmName}>{plan.farmName}</Text>
          <Text style={styles.planDuration}>{plan.duration}-Year Rotation Plan</Text>
        </View>

        {renderBenefits()}
        {renderYearSelector()}
        {renderTimeline()}
        {renderRecommendations()}
        {renderActions()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  farmName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  benefitsContainer: {
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  benefitIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  benefitValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  benefitLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  yearSelector: {
    marginBottom: 16,
  },
  yearButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  yearButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  yearButtonTextActive: {
    color: '#2E7D32',
  },
  yearButtonSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  yearButtonSubtextActive: {
    color: '#4CAF50',
  },
  timelineContainer: {
    marginBottom: 16,
  },
  cycleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cycleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  cycleSeasonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  cycleDuration: {
    fontSize: 12,
    color: '#fff',
  },
  cycleBody: {
    padding: 16,
  },
  cycleCropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cycleCropType: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  cycleTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  timelineItem: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  timelineArrow: {
    fontSize: 20,
    color: '#4CAF50',
    marginHorizontal: 8,
  },
  yieldContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  yieldLabel: {
    fontSize: 13,
    color: '#666',
  },
  yieldValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  soilImpactContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  soilImpactTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  soilImpactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  soilImpactItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soilImpactLabel: {
    fontSize: 11,
    color: '#666',
  },
  soilImpactValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  companionContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
  },
  companionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  companionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  companionTag: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  companionTagText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recommendationsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  recommendationBullet: {
    fontSize: 16,
    color: '#4CAF50',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default CropRotationPlanScreen;
