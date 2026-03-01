/**
 * Remedy Detail Screen
 * Displays complete remedy information with preparation steps, dosage, and safety info
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
} from 'react-native';
import { getRemedyDetails, rateRemedy, CompleteRemedy } from '../../services/api/remedy-api';
import { OfflineIndicator } from '../../components/OfflineIndicator';

interface RemedyDetailScreenProps {
  navigation: any;
  route: {
    params: {
      remedyId: string;
    };
  };
}

export const RemedyDetailScreen: React.FC<RemedyDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { remedyId } = route.params;

  const [remedy, setRemedy] = useState<CompleteRemedy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preparation' | 'dosage' | 'safety'>('preparation');

  useEffect(() => {
    loadRemedyDetails();
  }, [remedyId]);

  const loadRemedyDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getRemedyDetails(remedyId);
      setRemedy(data);
    } catch (err: any) {
      console.error('Error loading remedy:', err);
      setError(err.message || 'Failed to load remedy details');
      Alert.alert('Error', 'Failed to load remedy details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async (rating: number) => {
    try {
      await rateRemedy(remedyId, rating);
      Alert.alert('Success', 'Thank you for rating this remedy!');
      loadRemedyDetails(); // Reload to get updated rating
    } catch (err: any) {
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading remedy details...</Text>
      </View>
    );
  }

  if (error || !remedy) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error || 'Remedy not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRemedyDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />
      
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{remedy.names.en}</Text>
          {remedy.names.hi && (
            <Text style={styles.subtitle}>{remedy.names.hi}</Text>
          )}
          
          {remedy.description && (
            <Text style={styles.description}>{remedy.description}</Text>
          )}

          {/* Ratings */}
          <View style={styles.ratingContainer}>
            {remedy.average_rating ? (
              <>
                <Text style={styles.stars}>
                  {'⭐'.repeat(Math.round(remedy.average_rating))}
                </Text>
                <Text style={styles.ratingText}>
                  {remedy.average_rating.toFixed(1)} ({remedy.total_ratings} ratings)
                </Text>
              </>
            ) : (
              <Text style={styles.noRating}>No ratings yet</Text>
            )}
          </View>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            {remedy.category && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>{remedy.category}</Text>
              </View>
            )}
            {remedy.difficulty_level && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>{remedy.difficulty_level}</Text>
              </View>
            )}
            {remedy.preparation_time_minutes && (
              <View style={styles.metaBadge}>
                <Text style={styles.metaText}>⏱️ {remedy.preparation_time_minutes} min</Text>
              </View>
            )}
          </View>

          {/* Ailments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treats</Text>
            <View style={styles.ailmentsContainer}>
              {remedy.ailments_treated.map((ailment, index) => (
                <View key={index} style={styles.ailmentTag}>
                  <Text style={styles.ailmentText}>{ailment}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {remedy.ingredients.map((ingredient, index) => (
              <View key={ingredient.ingredient_id} style={styles.ingredientRow}>
                <Text style={styles.ingredientNumber}>{index + 1}.</Text>
                <View style={styles.ingredientContent}>
                  <Text style={styles.ingredientName}>{ingredient.ingredient_name.en}</Text>
                  <Text style={styles.ingredientQuantity}>{ingredient.quantity}</Text>
                  {ingredient.seasonal_availability && (
                    <Text style={styles.ingredientSeasonal}>
                      🌿 Available: {ingredient.seasonal_availability.join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'preparation' && styles.tabActive]}
            onPress={() => setActiveTab('preparation')}
          >
            <Text style={[styles.tabText, activeTab === 'preparation' && styles.tabTextActive]}>
              Preparation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'dosage' && styles.tabActive]}
            onPress={() => setActiveTab('dosage')}
          >
            <Text style={[styles.tabText, activeTab === 'dosage' && styles.tabTextActive]}>
              Dosage
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'safety' && styles.tabActive]}
            onPress={() => setActiveTab('safety')}
          >
            <Text style={[styles.tabText, activeTab === 'safety' && styles.tabTextActive]}>
              Safety
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'preparation' && (
            <View>
              {remedy.preparation_steps.map((step) => (
                <View key={step.step_number} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{step.step_number}</Text>
                    </View>
                    {step.duration_minutes && (
                      <Text style={styles.stepDuration}>⏱️ {step.duration_minutes} min</Text>
                    )}
                  </View>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'dosage' && (
            <View>
              {remedy.dosage_guidelines.map((dosage, index) => (
                <View key={index} style={styles.dosageCard}>
                  <Text style={styles.dosageAgeGroup}>{dosage.age_group}</Text>
                  <Text style={styles.dosageAmount}>Amount: {dosage.dosage_amount}</Text>
                  <Text style={styles.dosageFrequency}>Frequency: {dosage.frequency}</Text>
                  {dosage.duration && (
                    <Text style={styles.dosageDuration}>Duration: {dosage.duration}</Text>
                  )}
                  {dosage.special_instructions && (
                    <Text style={styles.dosageInstructions}>
                      ℹ️ {dosage.special_instructions}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {activeTab === 'safety' && remedy.safety_info && (
            <View>
              {/* Safety Flags */}
              <View style={styles.safetyFlags}>
                <View style={[styles.safetyFlag, remedy.safety_info.safe_for_pregnancy && styles.safetyFlagSafe]}>
                  <Text style={styles.safetyFlagText}>
                    {remedy.safety_info.safe_for_pregnancy ? '✅' : '⚠️'} Pregnancy
                  </Text>
                </View>
                <View style={[styles.safetyFlag, remedy.safety_info.safe_for_children && styles.safetyFlagSafe]}>
                  <Text style={styles.safetyFlagText}>
                    {remedy.safety_info.safe_for_children ? '✅' : '⚠️'} Children
                  </Text>
                </View>
              </View>

              {/* Warnings */}
              {remedy.safety_info.warnings && remedy.safety_info.warnings.length > 0 && (
                <View style={styles.safetySection}>
                  <Text style={styles.safetySectionTitle}>⚠️ Warnings</Text>
                  {remedy.safety_info.warnings.map((warning, index) => (
                    <Text key={index} style={styles.safetyItem}>• {warning}</Text>
                  ))}
                </View>
              )}

              {/* Side Effects */}
              {remedy.safety_info.side_effects && remedy.safety_info.side_effects.length > 0 && (
                <View style={styles.safetySection}>
                  <Text style={styles.safetySectionTitle}>Side Effects</Text>
                  {remedy.safety_info.side_effects.map((effect, index) => (
                    <Text key={index} style={styles.safetyItem}>
                      • {effect.effect} ({effect.severity})
                    </Text>
                  ))}
                </View>
              )}

              {/* Contraindications */}
              {remedy.safety_info.contraindications && remedy.safety_info.contraindications.length > 0 && (
                <View style={styles.safetySection}>
                  <Text style={styles.safetySectionTitle}>Contraindications</Text>
                  {remedy.safety_info.contraindications.map((contra, index) => (
                    <View key={index} style={styles.contraItem}>
                      <Text style={styles.contraCondition}>• {contra.condition}</Text>
                      <Text style={styles.contraReason}>{contra.reason}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Rate Remedy */}
        <View style={styles.rateSection}>
          <Text style={styles.rateSectionTitle}>Rate this remedy</Text>
          <View style={styles.rateButtons}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={styles.rateButton}
                onPress={() => handleRate(rating)}
              >
                <Text style={styles.rateButtonText}>{'⭐'.repeat(rating)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stars: {
    fontSize: 18,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  noRating: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  metaBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  ailmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ailmentTag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  ailmentText: {
    fontSize: 13,
    color: '#FF9800',
    fontWeight: '500',
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ingredientNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
    width: 20,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  ingredientSeasonal: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabContent: {
    backgroundColor: '#fff',
    padding: 20,
  },
  stepCard: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepDuration: {
    fontSize: 13,
    color: '#666',
  },
  stepDescription: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  dosageCard: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  dosageAgeGroup: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  dosageAmount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dosageFrequency: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dosageDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dosageInstructions: {
    fontSize: 13,
    color: '#FF9800',
    marginTop: 8,
    fontStyle: 'italic',
  },
  safetyFlags: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  safetyFlag: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  safetyFlagSafe: {
    backgroundColor: '#E8F5E9',
  },
  safetyFlagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  safetySection: {
    marginBottom: 20,
  },
  safetySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  safetyItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  contraItem: {
    marginBottom: 10,
  },
  contraCondition: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  contraReason: {
    fontSize: 13,
    color: '#666',
    marginLeft: 15,
  },
  rateSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  rateSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  rateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rateButton: {
    padding: 10,
  },
  rateButtonText: {
    fontSize: 20,
  },
});

export default RemedyDetailScreen;
