/**
 * Filter Modal Component
 * Modal for selecting search filters
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLanguage } from '../../contexts/LanguageContext';

interface FilterModalProps {
  visible: boolean;
  filters: {
    category?: string;
    evidence_level?: string[];
    crops?: string[];
    regions?: string[];
    seasons?: string[];
    sort_by?: 'relevance' | 'rating' | 'date';
  };
  onApply: (filters: any) => void;
  onClose: () => void;
}

export default function FilterModal({ visible, filters, onApply, onClose }: FilterModalProps) {
  const { t } = useLanguage();
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const categories = [
    { value: 'organic_farming', label: t('knowledge_base.category.organic_farming') },
    { value: 'pest_management', label: t('knowledge_base.category.pest_management') },
    { value: 'soil_conservation', label: t('knowledge_base.category.soil_conservation') },
    { value: 'water_management', label: t('knowledge_base.category.water_management') },
    { value: 'crop_rotation', label: t('knowledge_base.category.crop_rotation') },
    { value: 'general', label: t('knowledge_base.category.general') },
  ];

  const evidenceLevels = [
    { value: 'traditional', label: t('knowledge_base.evidence.traditional'), color: '#FF9800' },
    { value: 'moderate', label: t('knowledge_base.evidence.moderate'), color: '#2196F3' },
    { value: 'strong', label: t('knowledge_base.evidence.strong'), color: '#4CAF50' },
  ];

  const sortOptions = [
    { value: 'relevance', label: t('knowledge_base.sort.relevance'), icon: 'sort' },
    { value: 'rating', label: t('knowledge_base.sort.rating'), icon: 'star' },
    { value: 'date', label: t('knowledge_base.sort.date'), icon: 'schedule' },
  ];

  const commonCrops = [
    'Rice', 'Wheat', 'Maize', 'Cotton', 'Sugarcane', 'Pulses', 
    'Vegetables', 'Fruits', 'Spices', 'Oilseeds'
  ];

  const seasons = [
    { value: 'kharif', label: t('knowledge_base.season.kharif') },
    { value: 'rabi', label: t('knowledge_base.season.rabi') },
    { value: 'zaid', label: t('knowledge_base.season.zaid') },
    { value: 'year_round', label: t('knowledge_base.season.year_round') },
  ];

  const toggleArrayFilter = (key: string, value: string) => {
    const currentArray = localFilters[key] || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    setLocalFilters({
      ...localFilters,
      [key]: newArray.length > 0 ? newArray : undefined,
    });
  };

  const handleReset = () => {
    setLocalFilters({ sort_by: 'relevance' });
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('knowledge_base.filters')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Filters Content */}
          <ScrollView style={styles.scrollContent}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>{t('knowledge_base.category_label')}</Text>
              <View style={styles.chipContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.chip,
                      localFilters.category === cat.value && styles.chipSelected,
                    ]}
                    onPress={() => setLocalFilters({
                      ...localFilters,
                      category: localFilters.category === cat.value ? undefined : cat.value,
                    })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        localFilters.category === cat.value && styles.chipTextSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Evidence Level Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>{t('knowledge_base.evidence_level')}</Text>
              <View style={styles.chipContainer}>
                {evidenceLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.chip,
                      localFilters.evidence_level?.includes(level.value) && {
                        backgroundColor: `${level.color}20`,
                        borderColor: level.color,
                      },
                    ]}
                    onPress={() => toggleArrayFilter('evidence_level', level.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        localFilters.evidence_level?.includes(level.value) && {
                          color: level.color,
                        },
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Crops Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>{t('knowledge_base.applicable_crops')}</Text>
              <View style={styles.chipContainer}>
                {commonCrops.map((crop) => (
                  <TouchableOpacity
                    key={crop}
                    style={[
                      styles.chip,
                      localFilters.crops?.includes(crop) && styles.chipSelected,
                    ]}
                    onPress={() => toggleArrayFilter('crops', crop)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        localFilters.crops?.includes(crop) && styles.chipTextSelected,
                      ]}
                    >
                      {crop}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Season Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>{t('knowledge_base.season_label')}</Text>
              <View style={styles.chipContainer}>
                {seasons.map((season) => (
                  <TouchableOpacity
                    key={season.value}
                    style={[
                      styles.chip,
                      localFilters.seasons?.includes(season.value) && styles.chipSelected,
                    ]}
                    onPress={() => toggleArrayFilter('seasons', season.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        localFilters.seasons?.includes(season.value) && styles.chipTextSelected,
                      ]}
                    >
                      {season.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>{t('knowledge_base.sort_by')}</Text>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    localFilters.sort_by === option.value && styles.sortOptionSelected,
                  ]}
                  onPress={() => setLocalFilters({ ...localFilters, sort_by: option.value as any })}
                >
                  <Icon 
                    name={option.icon} 
                    size={20} 
                    color={localFilters.sort_by === option.value ? '#007AFF' : '#666'} 
                  />
                  <Text
                    style={[
                      styles.sortOptionText,
                      localFilters.sort_by === option.value && styles.sortOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {localFilters.sort_by === option.value && (
                    <Icon name="check" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>{t('knowledge_base.reset_filters')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>{t('knowledge_base.apply_filters')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    flex: 1,
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    margin: 4,
  },
  chipSelected: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
  },
  chipTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    marginBottom: 8,
  },
  sortOptionSelected: {
    backgroundColor: '#007AFF10',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  sortOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
