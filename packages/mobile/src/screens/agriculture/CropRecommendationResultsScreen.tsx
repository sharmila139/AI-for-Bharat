/**
 * Crop Recommendation Results Screen
 * Displays crop recommendations with scores, suitability levels, and farm conditions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { AgricultureStackParamList, AgricultureStackNavigationProp } from '../../navigation/types';
import { CropRecommendationResponse, CropRecommendation } from '../../types/cropRecommendation';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

type CropRecommendationResultsRouteProp = RouteProp<
  AgricultureStackParamList,
  'CropRecommendationResults'
>;

const CropRecommendationResultsScreen: React.FC = () => {
  const route = useRoute<CropRecommendationResultsRouteProp>();
  const navigation = useNavigation<AgricultureStackNavigationProp>();
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);

  // Get data from route params
  const data = route.params?.data as CropRecommendationResponse | undefined;

  if (!data) {
    return (
      <ErrorState
        type="notFound"
        message="No recommendation data available. Please try again."
        onRetry={() => navigation.goBack()}
        retryLabel="Go Back"
      />
    );
  }

  const { recommendations, farmConditions, source, timestamp } = data;

  const getSuitabilityColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'excellent':
        return '#2E7D32';
      case 'good':
        return '#689F38';
      case 'fair':
        return '#F57C00';
      case 'poor':
        return '#C62828';
      default:
        return '#757575';
    }
  };

  const getSuitabilityIcon = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'excellent':
        return '⭐⭐⭐';
      case 'good':
        return '⭐⭐';
      case 'fair':
        return '⭐';
      case 'poor':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#2E7D32';
    if (score >= 60) return '#689F38';
    if (score >= 40) return '#F57C00';
    return '#C62828';
  };

  const handleSaveRecommendations = () => {
    // TODO: Implement save functionality
    Alert.alert(
      'Save Recommendations',
      'This feature will allow you to save recommendations for future reference.',
      [{ text: 'OK' }]
    );
  };

  const handleShareRecommendations = () => {
    // TODO: Implement share functionality
    Alert.alert(
      'Share Recommendations',
      'This feature will allow you to share recommendations with others.',
      [{ text: 'OK' }]
    );
  };

  const toggleCropDetails = (cropName: string) => {
    setExpandedCrop(expandedCrop === cropName ? null : cropName);
  };

  const renderScoreBar = (score: number, label: string) => (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={[styles.scoreBarValue, { color: getScoreColor(score) }]}>
          {score.toFixed(1)}
        </Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View
          style={[
            styles.scoreBarFill,
            {
              width: `${score}%`,
              backgroundColor: getScoreColor(score),
            },
          ]}
        />
      </View>
    </View>
  );

  const renderCropCard = (crop: CropRecommendation, index: number) => {
    const isExpanded = expandedCrop === crop.crop;
    const suitabilityColor = getSuitabilityColor(crop.suitabilityLevel);

    return (
      <View key={`${crop.crop}-${index}`} style={styles.cropCard}>
        <TouchableOpacity
          style={styles.cropCardHeader}
          onPress={() => toggleCropDetails(crop.crop)}
          activeOpacity={0.7}
        >
          <View style={styles.cropRank}>
            <Text style={styles.cropRankText}>#{index + 1}</Text>
          </View>
          
          <View style={styles.cropInfo}>
            <Text style={styles.cropName}>{crop.crop}</Text>
            <View style={styles.suitabilityBadge}>
              <Text style={styles.suitabilityIcon}>
                {getSuitabilityIcon(crop.suitabilityLevel)}
              </Text>
              <Text style={[styles.suitabilityText, { color: suitabilityColor }]}>
                {crop.suitabilityLevel}
              </Text>
            </View>
          </View>

          <View style={styles.overallScoreContainer}>
            <Text style={[styles.overallScore, { color: getScoreColor(crop.overallScore) }]}>
              {crop.overallScore.toFixed(0)}
            </Text>
            <Text style={styles.overallScoreLabel}>Score</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.cropDetails}>
            <View style={styles.scoresSection}>
              <Text style={styles.detailsSectionTitle}>Detailed Scores</Text>
              {renderScoreBar(crop.soilScore, 'Soil Compatibility')}
              {renderScoreBar(crop.climateScore, 'Climate Match')}
              {renderScoreBar(crop.seasonalScore, 'Seasonal Suitability')}
              {renderScoreBar(crop.marketScore, 'Market Potential')}
            </View>

            {crop.improvementSuggestions && crop.improvementSuggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.detailsSectionTitle}>💡 Improvement Suggestions</Text>
                {crop.improvementSuggestions.map((suggestion, idx) => (
                  <View key={idx} style={styles.suggestionItem}>
                    <Text style={styles.suggestionBullet}>•</Text>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderFarmConditions = () => (
    <View style={styles.farmConditionsCard}>
      <Text style={styles.farmConditionsTitle}>🌾 Farm Conditions Used</Text>
      
      <View style={styles.conditionsGrid}>
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Soil Type</Text>
          <Text style={styles.conditionValue}>{farmConditions.soilType}</Text>
        </View>
        
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Season</Text>
          <Text style={styles.conditionValue}>{farmConditions.season}</Text>
        </View>
        
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Region</Text>
          <Text style={styles.conditionValue}>{farmConditions.region}</Text>
        </View>
        
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Temperature</Text>
          <Text style={styles.conditionValue}>{farmConditions.temperature}°C</Text>
        </View>
        
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Humidity</Text>
          <Text style={styles.conditionValue}>{farmConditions.humidity}%</Text>
        </View>
        
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Rainfall</Text>
          <Text style={styles.conditionValue}>{farmConditions.rainfall}mm</Text>
        </View>
        
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>Soil pH</Text>
          <Text style={styles.conditionValue}>{farmConditions.ph}</Text>
        </View>
        
        <View style={styles.conditionItem}>
          <Text style={styles.conditionLabel}>NPK</Text>
          <Text style={styles.conditionValue}>
            {farmConditions.nitrogen}-{farmConditions.phosphorus}-{farmConditions.potassium}
          </Text>
        </View>
      </View>

      <View style={styles.metadataSection}>
        <Text style={styles.metadataText}>
          Source: {source === 'ml-model' ? '🤖 AI Model' : source === 'rule-based' ? '📋 Rule-Based' : '💾 Cached'}
        </Text>
        <Text style={styles.metadataText}>
          Generated: {new Date(timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Top 5 Crop Recommendations</Text>
          <Text style={styles.headerSubtitle}>
            Based on your farm conditions and market analysis
          </Text>
        </View>

        {/* Recommendations List */}
        <View style={styles.recommendationsSection}>
          {recommendations.map((crop, index) => renderCropCard(crop, index))}
        </View>

        {/* Farm Conditions */}
        {renderFarmConditions()}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Tap on any crop to view detailed scores and improvement suggestions.
            These recommendations are based on soil compatibility, climate conditions,
            seasonal factors, and market potential.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={handleSaveRecommendations}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>💾 Save</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShareRecommendations}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>📤 Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.newButton]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>🔄 New</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#2E7D32',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E9',
  },
  recommendationsSection: {
    marginBottom: 20,
  },
  cropCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cropCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cropRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cropRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  suitabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suitabilityIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  suitabilityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overallScoreContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  overallScore: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  overallScoreLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: -2,
  },
  cropDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    paddingTop: 12,
  },
  scoresSection: {
    marginBottom: 16,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  scoreBarContainer: {
    marginBottom: 12,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scoreBarLabel: {
    fontSize: 13,
    color: '#666',
  },
  scoreBarValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreBarTrack: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  suggestionsSection: {
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  suggestionBullet: {
    fontSize: 14,
    color: '#F57C00',
    marginRight: 8,
    marginTop: 2,
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  farmConditionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  farmConditionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 16,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  conditionItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  conditionValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  metadataSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  newButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default CropRecommendationResultsScreen;
