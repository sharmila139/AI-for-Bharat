/**
 * Crop Recommendation Screen
 * Displays crop recommendations with ranking, financial projections, and details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';

interface CropRecommendation {
  cropId: string;
  cropName: string;
  suitabilityScore: number;
  rank: number;
  financialProjection: {
    investment: number;
    revenue: number;
    profit: number;
    roi: number;
  };
  timeline: {
    sowingMonth: string;
    harvestMonth: string;
    durationMonths: number;
  };
  risks: string[];
  benefits: string[];
}

export const CropRecommendationScreen: React.FC = () => {
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      // TODO: Replace with actual API call
      const mockData: CropRecommendation[] = [
        {
          cropId: '1',
          cropName: 'Rice',
          suitabilityScore: 92,
          rank: 1,
          financialProjection: {
            investment: 45000,
            revenue: 75000,
            profit: 30000,
            roi: 66.7
          },
          timeline: {
            sowingMonth: 'June',
            harvestMonth: 'October',
            durationMonths: 4
          },
          risks: ['Monsoon dependency', 'Pest infestation'],
          benefits: ['High market demand', 'Government support', 'Stable prices']
        }
      ];
      
      setRecommendations(mockData);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const renderCropCard = (crop: CropRecommendation) => (
    <TouchableOpacity
      key={crop.cropId}
      style={styles.cropCard}
      onPress={() => setSelectedCrop(crop.cropId === selectedCrop ? null : crop.cropId)}
    >
      <View style={styles.cropHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{crop.rank}</Text>
        </View>
        <Text style={styles.cropName}>{crop.cropName}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{crop.suitabilityScore}%</Text>
        </View>
      </View>

      <View style={styles.financialSummary}>
        <View style={styles.financialItem}>
          <Text style={styles.financialLabel}>Investment</Text>
          <Text style={styles.financialValue}>₹{crop.financialProjection.investment.toLocaleString()}</Text>
        </View>
        <View style={styles.financialItem}>
          <Text style={styles.financialLabel}>Profit</Text>
          <Text style={[styles.financialValue, styles.profitText]}>
            ₹{crop.financialProjection.profit.toLocaleString()}
          </Text>
        </View>
        <View style={styles.financialItem}>
          <Text style={styles.financialLabel}>ROI</Text>
          <Text style={styles.financialValue}>{crop.financialProjection.roi}%</Text>
        </View>
      </View>

      {selectedCrop === crop.cropId && (
        <View style={styles.detailsSection}>
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <Text style={styles.detailText}>
              Sowing: {crop.timeline.sowingMonth} | Harvest: {crop.timeline.harvestMonth}
            </Text>
            <Text style={styles.detailText}>Duration: {crop.timeline.durationMonths} months</Text>
          </View>

          <View style={styles.benefitsSection}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            {crop.benefits.map((benefit, index) => (
              <Text key={index} style={styles.bulletPoint}>• {benefit}</Text>
            ))}
          </View>

          <View style={styles.risksSection}>
            <Text style={styles.sectionTitle}>Risks</Text>
            {crop.risks.map((risk, index) => (
              <Text key={index} style={styles.bulletPoint}>• {risk}</Text>
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading recommendations...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crop Recommendations</Text>
        <Text style={styles.subtitle}>Based on your farm profile and market conditions</Text>
      </View>

      {recommendations.map(renderCropCard)}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  cropCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  rankBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  rankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  cropName: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  scoreBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5
  },
  scoreText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 14
  },
  financialSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  financialItem: {
    alignItems: 'center'
  },
  financialLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  profitText: {
    color: '#4CAF50'
  },
  detailsSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee'
  },
  timelineSection: {
    marginBottom: 15
  },
  benefitsSection: {
    marginBottom: 15
  },
  risksSection: {
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    paddingLeft: 10
  }
});
