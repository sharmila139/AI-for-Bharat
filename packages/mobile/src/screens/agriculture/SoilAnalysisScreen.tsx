/**
 * Soil Analysis Screen
 * 
 * Comprehensive UI for displaying soil health analysis, fertilizer recommendations,
 * irrigation schedules, and water usage metrics with visual indicators.
 * 
 * Features:
 * - Visual soil health score (0-100 with color coding)
 * - Soil composition breakdown (pH, NPK, organic matter, micronutrients)
 * - Fertilizer recommendation cards (organic, chemical, mixed)
 * - Irrigation schedule calendar view
 * - Water usage tracking dashboard
 * - Photo upload for soil analysis
 * - OCR results display
 * - Offline support
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

// Type definitions based on backend services
interface SoilHealthScore {
  overallScore: number;
  overallStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'very-poor';
  breakdown: {
    pH: FactorScore;
    organicMatter: FactorScore;
    npk: FactorScore;
    micronutrients: FactorScore;
    texture: FactorScore;
  };
  recommendations: string[];
  dataCompleteness: number;
}

interface FactorScore {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'very-poor' | 'unknown';
  details: string;
  recommendation?: string;
}

interface FertilizerRecommendation {
  type: 'organic' | 'chemical' | 'mixed';
  products: FertilizerProduct[];
  applicationSchedule: ApplicationSchedule[];
  costBenefitAnalysis: CostBenefitAnalysis;
  totalNPK: { nitrogen: number; phosphorus: number; potassium: number };
  micronutrients: string[];
  warnings: string[];
  tips: string[];
}

interface FertilizerProduct {
  name: string;
  type: 'organic' | 'chemical';
  composition: string;
  applicationRate: number;
  totalQuantity: number;
  costPerUnit: number;
  totalCost: number;
  benefits: string[];
  applicationMethod: string;
}

interface ApplicationSchedule {
  stage: string;
  growthStage: string;
  timing: Date;
  products: FertilizerProduct[];
  instructions: string[];
  expectedResults: string;
}

interface CostBenefitAnalysis {
  totalCost: number;
  expectedYieldIncrease: number;
  expectedRevenueIncrease: number;
  roi: number;
  paybackPeriod: string;
  environmentalImpact: 'low' | 'medium' | 'high';
  soilHealthImprovement: 'low' | 'medium' | 'high';
  sustainability: number;
}

interface IrrigationEvent {
  id: string;
  scheduledDate: Date;
  amount: number;
  duration: number;
  method: 'flood' | 'drip' | 'sprinkler';
  status: 'scheduled' | 'completed' | 'skipped' | 'adjusted';
  reason?: string;
}

interface WaterUsageMetrics {
  totalScheduled: number;
  totalApplied: number;
  totalSkipped: number;
  efficiency: number;
  complianceRate: number;
  waterSaved: number;
  costSavings: number;
  eventsCompleted: number;
  eventsSkipped: number;
}

export const SoilAnalysisScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'health' | 'fertilizer' | 'irrigation' | 'water'>('health');
  const [loading, setLoading] = useState(true);
  const [soilHealth, setSoilHealth] = useState<SoilHealthScore | null>(null);
  const [fertilizerRecs, setFertilizerRecs] = useState<{
    organic: FertilizerRecommendation;
    chemical: FertilizerRecommendation;
    mixed: FertilizerRecommendation;
    recommended: 'organic' | 'chemical' | 'mixed';
  } | null>(null);
  const [selectedFertilizerType, setSelectedFertilizerType] = useState<'organic' | 'chemical' | 'mixed'>('mixed');
  const [irrigationEvents, setIrrigationEvents] = useState<IrrigationEvent[]>([]);
  const [waterMetrics, setWaterMetrics] = useState<WaterUsageMetrics | null>(null);

  useEffect(() => {
    fetchSoilAnalysisData();
  }, []);

  const fetchSoilAnalysisData = async () => {
    try {
      // TODO: Replace with actual API calls
      // Simulated data for demonstration
      const mockSoilHealth: SoilHealthScore = {
        overallScore: 72.5,
        overallStatus: 'good',
        breakdown: {
          pH: { score: 85, status: 'good', details: 'pH 6.8 is slightly acidic' },
          organicMatter: { score: 60, status: 'fair', details: 'Organic matter 0.8% is adequate', recommendation: 'Add compost to increase organic matter' },
          npk: { score: 70, status: 'good', details: 'N: 245 kg/ha, P: 18 kg/ha, K: 156 kg/ha' },
          micronutrients: { score: 75, status: 'good', details: 'Micronutrient levels good' },
          texture: { score: 85, status: 'good', details: 'Soil texture: loamy' }
        },
        recommendations: [
          'Add compost to increase organic matter',
          'Apply fertilizers to address nitrogen deficiency',
          'Monitor soil moisture before each irrigation'
        ],
        dataCompleteness: 85
      };

      const mockWaterMetrics: WaterUsageMetrics = {
        totalScheduled: 450,
        totalApplied: 420,
        totalSkipped: 80,
        efficiency: 88.5,
        complianceRate: 92.3,
        waterSaved: 80,
        costSavings: 1600,
        eventsCompleted: 12,
        eventsSkipped: 3
      };

      setSoilHealth(mockSoilHealth);
      setWaterMetrics(mockWaterMetrics);
      
      // Mock irrigation events
      const mockEvents: IrrigationEvent[] = [
        {
          id: '1',
          scheduledDate: new Date(Date.now() + 86400000),
          amount: 35,
          duration: 120,
          method: 'drip',
          status: 'scheduled'
        },
        {
          id: '2',
          scheduledDate: new Date(Date.now() + 259200000),
          amount: 35,
          duration: 120,
          method: 'drip',
          status: 'scheduled'
        }
      ];
      setIrrigationEvents(mockEvents);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch soil analysis data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 85) return '#4CAF50'; // Excellent - Green
    if (score >= 70) return '#8BC34A'; // Good - Light Green
    if (score >= 50) return '#FF9800'; // Fair - Orange
    if (score >= 30) return '#FF5722'; // Poor - Deep Orange
    return '#F44336'; // Very Poor - Red
  };

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FF9800';
      case 'poor': return '#FF5722';
      case 'very-poor': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Render circular health score indicator
  const renderHealthScoreCircle = () => {
    if (!soilHealth) return null;

    const score = soilHealth.overallScore;
    const color = getScoreColor(score);
    const circumference = 2 * Math.PI * 70; // radius = 70
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <View style={styles.scoreCircleContainer}>
        <View style={styles.scoreCircle}>
          <View style={[styles.scoreCircleInner, { borderColor: color }]}>
            <Text style={styles.scoreValue}>{score.toFixed(1)}</Text>
            <Text style={styles.scoreLabel}>Health Score</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: color }]}>
          <Text style={styles.statusText}>{soilHealth.overallStatus.toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  // Render soil composition breakdown
  const renderCompositionBreakdown = () => {
    if (!soilHealth) return null;

    const factors = [
      { key: 'pH', label: 'pH Balance', data: soilHealth.breakdown.pH },
      { key: 'organicMatter', label: 'Organic Matter', data: soilHealth.breakdown.organicMatter },
      { key: 'npk', label: 'NPK Levels', data: soilHealth.breakdown.npk },
      { key: 'micronutrients', label: 'Micronutrients', data: soilHealth.breakdown.micronutrients },
      { key: 'texture', label: 'Soil Texture', data: soilHealth.breakdown.texture }
    ];

    return (
      <View style={styles.breakdownContainer}>
        <Text style={styles.sectionTitle}>Soil Composition Breakdown</Text>
        {factors.map((factor) => (
          <View key={factor.key} style={styles.factorCard}>
            <View style={styles.factorHeader}>
              <Text style={styles.factorLabel}>{factor.label}</Text>
              <View style={[styles.factorScoreBadge, { backgroundColor: getStatusColor(factor.data.status) }]}>
                <Text style={styles.factorScoreText}>{factor.data.score.toFixed(0)}</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${factor.data.score}%`,
                    backgroundColor: getScoreColor(factor.data.score)
                  }
                ]} 
              />
            </View>
            <Text style={styles.factorDetails}>{factor.data.details}</Text>
            {factor.data.recommendation && (
              <Text style={styles.factorRecommendation}>💡 {factor.data.recommendation}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  // Render fertilizer recommendation cards
  const renderFertilizerRecommendations = () => {
    if (!fertilizerRecs) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No fertilizer recommendations available</Text>
          <Text style={styles.emptyStateSubtext}>Complete soil analysis to get recommendations</Text>
        </View>
      );
    }

    const selectedRec = fertilizerRecs[selectedFertilizerType];

    return (
      <View style={styles.fertilizerContainer}>
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          {(['organic', 'chemical', 'mixed'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedFertilizerType === type && styles.typeButtonActive,
                type === fertilizerRecs.recommended && styles.typeButtonRecommended
              ]}
              onPress={() => setSelectedFertilizerType(type)}
            >
              <Text style={[
                styles.typeButtonText,
                selectedFertilizerType === type && styles.typeButtonTextActive
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              {type === fertilizerRecs.recommended && (
                <Text style={styles.recommendedBadge}>⭐ Recommended</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Cost-Benefit Summary */}
        <View style={styles.costBenefitCard}>
          <Text style={styles.cardTitle}>Cost-Benefit Analysis</Text>
          <View style={styles.costBenefitGrid}>
            <View style={styles.costBenefitItem}>
              <Text style={styles.costBenefitLabel}>Total Cost</Text>
              <Text style={styles.costBenefitValue}>₹{selectedRec.costBenefitAnalysis.totalCost.toLocaleString()}</Text>
            </View>
            <View style={styles.costBenefitItem}>
              <Text style={styles.costBenefitLabel}>ROI</Text>
              <Text style={[styles.costBenefitValue, styles.roiText]}>
                {selectedRec.costBenefitAnalysis.roi.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.costBenefitItem}>
              <Text style={styles.costBenefitLabel}>Yield Increase</Text>
              <Text style={styles.costBenefitValue}>
                +{selectedRec.costBenefitAnalysis.expectedYieldIncrease.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.costBenefitItem}>
              <Text style={styles.costBenefitLabel}>Sustainability</Text>
              <Text style={styles.costBenefitValue}>
                {selectedRec.costBenefitAnalysis.sustainability}/100
              </Text>
            </View>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Recommended Products</Text>
          {selectedRec.products.map((product, index) => (
            <View key={index} style={styles.productCard}>
              <View style={styles.productHeader}>
                <Text style={styles.productName}>{product.name}</Text>
                <View style={[
                  styles.productTypeBadge,
                  { backgroundColor: product.type === 'organic' ? '#8BC34A' : '#2196F3' }
                ]}>
                  <Text style={styles.productTypeText}>{product.type}</Text>
                </View>
              </View>
              <Text style={styles.productComposition}>{product.composition}</Text>
              <View style={styles.productDetails}>
                <Text style={styles.productDetailText}>
                  📦 {product.totalQuantity.toFixed(0)} kg/ton
                </Text>
                <Text style={styles.productDetailText}>
                  💰 ₹{product.totalCost.toLocaleString()}
                </Text>
              </View>
              <Text style={styles.productMethod}>📋 {product.applicationMethod}</Text>
            </View>
          ))}
        </View>

        {/* Application Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>Application Schedule</Text>
          {selectedRec.applicationSchedule.map((schedule, index) => (
            <View key={index} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleStage}>{schedule.stage}</Text>
                <Text style={styles.scheduleDate}>
                  {new Date(schedule.timing).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.scheduleGrowthStage}>Growth Stage: {schedule.growthStage}</Text>
              <View style={styles.scheduleInstructions}>
                {schedule.instructions.map((instruction, idx) => (
                  <Text key={idx} style={styles.instructionText}>• {instruction}</Text>
                ))}
              </View>
              <Text style={styles.scheduleResults}>✓ {schedule.expectedResults}</Text>
            </View>
          ))}
        </View>

        {/* Warnings and Tips */}
        {selectedRec.warnings.length > 0 && (
          <View style={styles.warningsSection}>
            <Text style={styles.warningsTitle}>⚠️ Important Warnings</Text>
            {selectedRec.warnings.map((warning, index) => (
              <Text key={index} style={styles.warningText}>• {warning}</Text>
            ))}
          </View>
        )}

        {selectedRec.tips.length > 0 && (
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
            {selectedRec.tips.map((tip, index) => (
              <Text key={index} style={styles.tipText}>• {tip}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Render irrigation schedule calendar
  const renderIrrigationSchedule = () => {
    if (irrigationEvents.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No irrigation schedule available</Text>
          <Text style={styles.emptyStateSubtext}>Create a crop plan to generate irrigation schedule</Text>
        </View>
      );
    }

    const upcomingEvents = irrigationEvents.filter(e => e.status === 'scheduled');
    const nextEvent = upcomingEvents[0];

    return (
      <View style={styles.irrigationContainer}>
        {/* Next Irrigation Card */}
        {nextEvent && (
          <View style={styles.nextIrrigationCard}>
            <Text style={styles.nextIrrigationTitle}>Next Irrigation</Text>
            <View style={styles.nextIrrigationContent}>
              <View style={styles.nextIrrigationDate}>
                <Text style={styles.nextIrrigationDay}>
                  {new Date(nextEvent.scheduledDate).getDate()}
                </Text>
                <Text style={styles.nextIrrigationMonth}>
                  {new Date(nextEvent.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.nextIrrigationDetails}>
                <Text style={styles.nextIrrigationAmount}>💧 {nextEvent.amount}mm</Text>
                <Text style={styles.nextIrrigationDuration}>⏱️ {nextEvent.duration} minutes</Text>
                <Text style={styles.nextIrrigationMethod}>
                  🚿 {nextEvent.method.charAt(0).toUpperCase() + nextEvent.method.slice(1)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.setReminderButton}>
              <Text style={styles.setReminderText}>🔔 Set Reminder</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upcoming Events List */}
        <View style={styles.upcomingEventsSection}>
          <Text style={styles.sectionTitle}>Upcoming Irrigation Events</Text>
          {upcomingEvents.map((event) => (
            <View key={event.id} style={styles.irrigationEventCard}>
              <View style={styles.eventDateColumn}>
                <Text style={styles.eventDay}>
                  {new Date(event.scheduledDate).getDate()}
                </Text>
                <Text style={styles.eventMonth}>
                  {new Date(event.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.eventDetailsColumn}>
                <View style={styles.eventDetailsRow}>
                  <Text style={styles.eventAmount}>💧 {event.amount}mm</Text>
                  <Text style={styles.eventDuration}>⏱️ {event.duration}min</Text>
                </View>
                <Text style={styles.eventMethod}>
                  Method: {event.method.charAt(0).toUpperCase() + event.method.slice(1)}
                </Text>
                {event.reason && (
                  <Text style={styles.eventReason}>{event.reason}</Text>
                )}
              </View>
              <View style={[
                styles.eventStatusBadge,
                { backgroundColor: event.status === 'scheduled' ? '#4CAF50' : '#9E9E9E' }
              ]}>
                <Text style={styles.eventStatusText}>{event.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>📅 View Full Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Text style={styles.quickActionText}>✏️ Record Irrigation</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render water usage dashboard
  const renderWaterUsageDashboard = () => {
    if (!waterMetrics) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No water usage data available</Text>
          <Text style={styles.emptyStateSubtext}>Start tracking irrigation to see metrics</Text>
        </View>
      );
    }

    return (
      <View style={styles.waterDashboardContainer}>
        {/* Efficiency Score Card */}
        <View style={styles.efficiencyCard}>
          <Text style={styles.cardTitle}>Water Use Efficiency</Text>
          <View style={styles.efficiencyCircle}>
            <Text style={styles.efficiencyValue}>{waterMetrics.efficiency.toFixed(1)}%</Text>
            <Text style={styles.efficiencyLabel}>Efficiency</Text>
          </View>
          <View style={styles.efficiencyMetrics}>
            <View style={styles.efficiencyMetricItem}>
              <Text style={styles.metricValue}>{waterMetrics.complianceRate.toFixed(0)}%</Text>
              <Text style={styles.metricLabel}>Compliance</Text>
            </View>
            <View style={styles.efficiencyMetricItem}>
              <Text style={[styles.metricValue, styles.savingsText]}>
                ₹{waterMetrics.costSavings.toLocaleString()}
              </Text>
              <Text style={styles.metricLabel}>Saved</Text>
            </View>
          </View>
        </View>

        {/* Water Usage Summary */}
        <View style={styles.usageSummaryCard}>
          <Text style={styles.cardTitle}>Water Usage Summary</Text>
          <View style={styles.usageGrid}>
            <View style={styles.usageItem}>
              <Text style={styles.usageIcon}>📊</Text>
              <Text style={styles.usageValue}>{waterMetrics.totalScheduled.toFixed(0)}mm</Text>
              <Text style={styles.usageLabel}>Scheduled</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageIcon}>💧</Text>
              <Text style={styles.usageValue}>{waterMetrics.totalApplied.toFixed(0)}mm</Text>
              <Text style={styles.usageLabel}>Applied</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageIcon}>💚</Text>
              <Text style={[styles.usageValue, styles.savedValue]}>
                {waterMetrics.waterSaved.toFixed(0)}mm
              </Text>
              <Text style={styles.usageLabel}>Saved</Text>
            </View>
            <View style={styles.usageItem}>
              <Text style={styles.usageIcon}>⏭️</Text>
              <Text style={styles.usageValue}>{waterMetrics.eventsSkipped}</Text>
              <Text style={styles.usageLabel}>Skipped</Text>
            </View>
          </View>
        </View>

        {/* Events Summary */}
        <View style={styles.eventsSummaryCard}>
          <Text style={styles.cardTitle}>Irrigation Events</Text>
          <View style={styles.eventsRow}>
            <View style={styles.eventsSummaryItem}>
              <View style={[styles.eventsSummaryBadge, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.eventsSummaryNumber}>{waterMetrics.eventsCompleted}</Text>
              </View>
              <Text style={styles.eventsSummaryLabel}>Completed</Text>
            </View>
            <View style={styles.eventsSummaryItem}>
              <View style={[styles.eventsSummaryBadge, { backgroundColor: '#FF9800' }]}>
                <Text style={styles.eventsSummaryNumber}>{waterMetrics.eventsSkipped}</Text>
              </View>
              <Text style={styles.eventsSummaryLabel}>Skipped</Text>
            </View>
          </View>
        </View>

        {/* Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.cardTitle}>💡 Insights & Recommendations</Text>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>✅</Text>
            <Text style={styles.insightText}>
              Your water efficiency of {waterMetrics.efficiency.toFixed(0)}% is excellent!
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>💰</Text>
            <Text style={styles.insightText}>
              You saved ₹{waterMetrics.costSavings.toLocaleString()} by adjusting irrigation based on weather
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>🌱</Text>
            <Text style={styles.insightText}>
              {waterMetrics.waterSaved.toFixed(0)}mm of water saved from weather-based optimization
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.waterActionsSection}>
          <TouchableOpacity style={styles.waterActionButton}>
            <Text style={styles.waterActionText}>📈 View Detailed Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.waterActionButton}>
            <Text style={styles.waterActionText}>📊 Compare Methods</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Main render
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading soil analysis...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Soil Analysis</Text>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>📷 Upload Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'health' && styles.tabActive]}
          onPress={() => setActiveTab('health')}
        >
          <Text style={[styles.tabText, activeTab === 'health' && styles.tabTextActive]}>
            Health
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'fertilizer' && styles.tabActive]}
          onPress={() => setActiveTab('fertilizer')}
        >
          <Text style={[styles.tabText, activeTab === 'fertilizer' && styles.tabTextActive]}>
            Fertilizer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'irrigation' && styles.tabActive]}
          onPress={() => setActiveTab('irrigation')}
        >
          <Text style={[styles.tabText, activeTab === 'irrigation' && styles.tabTextActive]}>
            Irrigation
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'water' && styles.tabActive]}
          onPress={() => setActiveTab('water')}
        >
          <Text style={[styles.tabText, activeTab === 'water' && styles.tabTextActive]}>
            Water
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'health' && (
          <View>
            {renderHealthScoreCircle()}
            {renderCompositionBreakdown()}
            {soilHealth && soilHealth.recommendations.length > 0 && (
              <View style={styles.recommendationsSection}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
                {soilHealth.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <Text style={styles.recommendationText}>• {rec}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        {activeTab === 'fertilizer' && renderFertilizerRecommendations()}
        {activeTab === 'irrigation' && renderIrrigationSchedule()}
        {activeTab === 'water' && renderWaterUsageDashboard()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  // Health Score Styles
  scoreCircleContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircleInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Breakdown Styles
  breakdownContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  factorCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  factorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  factorScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  factorScoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  factorDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  factorRecommendation: {
    fontSize: 13,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 4,
  },
  recommendationsSection: {
    padding: 16,
  },
  recommendationCard: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  recommendationText: {
    fontSize: 14,
    color: '#2E7D32',
  },
  // Fertilizer Styles
  fertilizerContainer: {
    padding: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  typeButtonActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  typeButtonRecommended: {
    borderColor: '#FF9800',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#4CAF50',
  },
  recommendedBadge: {
    fontSize: 10,
    color: '#FF9800',
    marginTop: 4,
  },
  costBenefitCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  costBenefitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  costBenefitItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  costBenefitLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  costBenefitValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roiText: {
    color: '#4CAF50',
  },
  productsSection: {
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  productTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  productComposition: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productDetailText: {
    fontSize: 14,
    color: '#666',
  },
  productMethod: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  scheduleSection: {
    marginBottom: 16,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleStage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  scheduleDate: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  scheduleGrowthStage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  scheduleInstructions: {
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  scheduleResults: {
    fontSize: 13,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  warningsSection: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  tipsSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  // Irrigation Styles
  irrigationContainer: {
    padding: 16,
  },
  nextIrrigationCard: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 4,
  },
  nextIrrigationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  nextIrrigationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextIrrigationDate: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 16,
  },
  nextIrrigationDay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  nextIrrigationMonth: {
    fontSize: 14,
    color: '#fff',
  },
  nextIrrigationDetails: {
    flex: 1,
  },
  nextIrrigationAmount: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  nextIrrigationDuration: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  nextIrrigationMethod: {
    fontSize: 16,
    color: '#fff',
  },
  setReminderButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  setReminderText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingEventsSection: {
    marginBottom: 16,
  },
  irrigationEventCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  eventDateColumn: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 12,
    minWidth: 60,
  },
  eventDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  eventMonth: {
    fontSize: 12,
    color: '#4CAF50',
  },
  eventDetailsColumn: {
    flex: 1,
  },
  eventDetailsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  eventAmount: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  eventDuration: {
    fontSize: 14,
    color: '#666',
  },
  eventMethod: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  eventReason: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  eventStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventStatusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  quickActionsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  quickActionText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  // Water Dashboard Styles
  waterDashboardContainer: {
    padding: 16,
  },
  efficiencyCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  efficiencyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  efficiencyValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  efficiencyLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  efficiencyMetrics: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  efficiencyMetricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  savingsText: {
    color: '#4CAF50',
  },
  usageSummaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  usageItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  usageIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  usageValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 12,
    color: '#666',
  },
  savedValue: {
    color: '#4CAF50',
  },
  eventsSummaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  eventsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  eventsSummaryItem: {
    alignItems: 'center',
  },
  eventsSummaryBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventsSummaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  eventsSummaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  insightsCard: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  waterActionsSection: {
    gap: 8,
  },
  waterActionButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 8,
  },
  waterActionText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty State
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
