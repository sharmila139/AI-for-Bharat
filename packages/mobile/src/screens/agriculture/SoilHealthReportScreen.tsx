/**
 * Soil Health Report Screen
 * Display soil analysis results with health score and recommendations
 * 
 * Features:
 * - Overall soil health score (0-100) with visual indicators
 * - Nutrient levels (N, P, K, pH, organic carbon)
 * - Fertilizer recommendations (organic, chemical, mixed)
 * - Improvement suggestions
 * - Link to irrigation scheduling
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AgricultureStackParamList, AgricultureStackNavigationProp } from '../../navigation/types';
import soilHealthService, { SoilHealthReport, NutrientLevel } from '../../services/soilHealthService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

type SoilHealthReportRouteProp = RouteProp<AgricultureStackParamList, 'SoilHealthReport'>;

const { width } = Dimensions.get('window');

const SoilHealthReportScreen: React.FC = () => {
  const route = useRoute<SoilHealthReportRouteProp>();
  const navigation = useNavigation<AgricultureStackNavigationProp>();
  const { reportId } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SoilHealthReport | null>(null);

  useEffect(() => {
    loadReport();
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await soilHealthService.getSoilHealthReport(reportId);
      setReport(data);
    } catch (err: any) {
      console.error('Error loading soil health report:', err);
      setError(err.message || 'Failed to load soil health report');
    } finally {
      setLoading(false);
    }
  };

  const renderHealthScore = () => {
    if (!report) return null;

    const score = report.overallScore;
    const color = soilHealthService.getScoreColor(score);
    const label = soilHealthService.getScoreLabel(score);
    const percentage = (score / 100) * 360; // For circular progress

    return (
      <View style={styles.scoreContainer}>
        <View style={styles.scoreCircle}>
          <View style={[styles.scoreCircleInner, { borderColor: color }]}>
            <Text style={[styles.scoreValue, { color }]}>{score}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
        </View>
        <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
        <Text style={styles.scoreDescription}>Overall Soil Health</Text>
      </View>
    );
  };

  const renderNutrientCard = (name: string, nutrient: NutrientLevel) => {
    const statusColors = {
      optimal: '#4CAF50',
      high: '#2196F3',
      medium: '#FFC107',
      low: '#F44336',
    };

    const statusLabels = {
      optimal: 'Optimal',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };

    const color = statusColors[nutrient.status];

    return (
      <View key={name} style={styles.nutrientCard}>
        <View style={styles.nutrientHeader}>
          <Text style={styles.nutrientName}>{name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: color }]}>
            <Text style={styles.statusText}>{statusLabels[nutrient.status]}</Text>
          </View>
        </View>
        <Text style={styles.nutrientValue}>
          {nutrient.value} {nutrient.unit}
        </Text>
        <Text style={styles.nutrientRecommendation}>{nutrient.recommendation}</Text>
      </View>
    );
  };

  const renderNutrients = () => {
    if (!report) return null;

    const nutrients = [
      { key: 'nitrogen', label: 'Nitrogen (N)', data: report.nutrients.nitrogen },
      { key: 'phosphorus', label: 'Phosphorus (P)', data: report.nutrients.phosphorus },
      { key: 'potassium', label: 'Potassium (K)', data: report.nutrients.potassium },
      { key: 'pH', label: 'pH Level', data: report.nutrients.pH },
      { key: 'organicCarbon', label: 'Organic Carbon', data: report.nutrients.organicCarbon },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Nutrient Levels</Text>
        {nutrients.map(({ label, data }) => renderNutrientCard(label, data))}
      </View>
    );
  };

  const renderFertilizerRecommendations = () => {
    if (!report || !report.fertilizerRecommendations.length) return null;

    const typeIcons = {
      organic: '🌱',
      chemical: '⚗️',
      mixed: '🔄',
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💊 Fertilizer Recommendations</Text>
        {report.fertilizerRecommendations.map((rec, index) => (
          <View key={index} style={styles.fertilizerCard}>
            <View style={styles.fertilizerHeader}>
              <Text style={styles.fertilizerIcon}>{typeIcons[rec.type]}</Text>
              <View style={styles.fertilizerInfo}>
                <Text style={styles.fertilizerName}>{rec.name}</Text>
                <Text style={styles.fertilizerType}>{rec.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.fertilizerCost}>₹{rec.costEstimate}</Text>
            </View>
            
            <View style={styles.fertilizerDetails}>
              <View style={styles.fertilizerDetailRow}>
                <Text style={styles.fertilizerDetailLabel}>Quantity:</Text>
                <Text style={styles.fertilizerDetailValue}>{rec.quantity}</Text>
              </View>
              <View style={styles.fertilizerDetailRow}>
                <Text style={styles.fertilizerDetailLabel}>Application:</Text>
                <Text style={styles.fertilizerDetailValue}>{rec.applicationMethod}</Text>
              </View>
              <View style={styles.fertilizerDetailRow}>
                <Text style={styles.fertilizerDetailLabel}>Timing:</Text>
                <Text style={styles.fertilizerDetailValue}>{rec.timing}</Text>
              </View>
            </View>

            {rec.benefits.length > 0 && (
              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>Benefits:</Text>
                {rec.benefits.map((benefit, idx) => (
                  <Text key={idx} style={styles.benefitItem}>• {benefit}</Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderImprovementSuggestions = () => {
    if (!report || !report.improvementSuggestions.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Improvement Suggestions</Text>
        <View style={styles.suggestionsContainer}>
          {report.improvementSuggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.suggestionBullet}>•</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSoilInfo = () => {
    if (!report) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌍 Soil Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Soil Type:</Text>
            <Text style={styles.infoValue}>{report.soilType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Texture:</Text>
            <Text style={styles.infoValue}>{report.texture}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Analysis Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(report.analysisDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActions = () => {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // Navigate to irrigation schedule
            if (report?.irrigationScheduleLink) {
              navigation.navigate('IrrigationSchedule', { farmId: report.farmId });
            }
          }}
        >
          <Text style={styles.actionButtonIcon}>💧</Text>
          <Text style={styles.actionButtonText}>View Irrigation Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonSecondary]}
          onPress={() => {
            // Navigate back to soil analysis for new scan
            navigation.navigate('SoilAnalysis');
          }}
        >
          <Text style={styles.actionButtonIcon}>📸</Text>
          <Text style={styles.actionButtonText}>New Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Loading soil health report..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadReport}
      />
    );
  }

  if (!report) {
    return (
      <ErrorState
        message="Report not found"
        onRetry={loadReport}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {renderHealthScore()}
        {renderSoilInfo()}
        {renderNutrients()}
        {renderFertilizerRecommendations()}
        {renderImprovementSuggestions()}
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
  scoreContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    backgroundColor: '#f9f9f9',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 16,
    color: '#999',
    marginTop: -8,
  },
  scoreLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  nutrientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutrientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nutrientValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  nutrientRecommendation: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  fertilizerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  fertilizerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fertilizerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  fertilizerInfo: {
    flex: 1,
  },
  fertilizerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  fertilizerType: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  fertilizerCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  fertilizerDetails: {
    marginBottom: 12,
  },
  fertilizerDetailRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  fertilizerDetailLabel: {
    fontSize: 13,
    color: '#666',
    width: 100,
  },
  fertilizerDetailValue: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  benefitsContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 6,
  },
  benefitItem: {
    fontSize: 12,
    color: '#1B5E20',
    lineHeight: 18,
    marginBottom: 2,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  suggestionBullet: {
    fontSize: 16,
    color: '#2E7D32',
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
});

export default SoilHealthReportScreen;
