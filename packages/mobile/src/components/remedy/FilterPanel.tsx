/**
 * Filter Panel Component
 * Comprehensive filtering for remedy search
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import {
  RemedySearchFilters,
  RemedyCategory,
  DifficultyLevel,
  EvidenceLevel,
} from '../../services/api/remedy-api';

interface FilterPanelProps {
  visible: boolean;
  filters: RemedySearchFilters;
  onFiltersChange: (filters: RemedySearchFilters) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}

const CATEGORIES: Array<{ id: RemedyCategory; name: string; icon: string }> = [
  { id: 'ayurvedic', name: 'Ayurvedic', icon: '🌿' },
  { id: 'herbal', name: 'Herbal', icon: '🌱' },
  { id: 'home_remedy', name: 'Home Remedy', icon: '🏠' },
  { id: 'dietary', name: 'Dietary', icon: '🥗' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🧘' },
];

const DIFFICULTY_LEVELS: Array<{ id: DifficultyLevel; name: string; icon: string }> = [
  { id: 'easy', name: 'Easy', icon: '✅' },
  { id: 'moderate', name: 'Moderate', icon: '⚠️' },
  { id: 'difficult', name: 'Difficult', icon: '🔴' },
];

const EVIDENCE_LEVELS: Array<{ id: EvidenceLevel; name: string; icon: string }> = [
  { id: 'traditional', name: 'Traditional', icon: '📚' },
  { id: 'moderate', name: 'Moderate', icon: '🔬' },
  { id: 'strong', name: 'Strong', icon: '✅' },
];

const PREP_TIME_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
];

const EFFICACY_OPTIONS = [
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  visible,
  filters,
  onFiltersChange,
  onClose,
  onApply,
  onReset,
}) => {
  const updateFilter = <K extends keyof RemedySearchFilters>(
    key: K,
    value: RemedySearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleCategory = (category: RemedyCategory) => {
    updateFilter('category', filters.category === category ? undefined : category);
  };

  const toggleDifficulty = (difficulty: DifficultyLevel) => {
    updateFilter('difficulty_level', filters.difficulty_level === difficulty ? undefined : difficulty);
  };

  const toggleEvidence = (evidence: EvidenceLevel) => {
    updateFilter('evidence_level', filters.evidence_level === evidence ? undefined : evidence);
  };

  const togglePrepTime = (time: number) => {
    updateFilter('max_preparation_time', filters.max_preparation_time === time ? undefined : time);
  };

  const toggleEfficacy = (rating: number) => {
    updateFilter('min_efficacy_rating', filters.min_efficacy_rating === rating ? undefined : rating);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Category Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.optionsGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.optionChip,
                      filters.category === cat.id && styles.optionChipSelected,
                    ]}
                    onPress={() => toggleCategory(cat.id)}
                  >
                    <Text style={styles.optionIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        filters.category === cat.id && styles.optionTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Difficulty Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Difficulty Level</Text>
              <View style={styles.optionsRow}>
                {DIFFICULTY_LEVELS.map((diff) => (
                  <TouchableOpacity
                    key={diff.id}
                    style={[
                      styles.optionChip,
                      filters.difficulty_level === diff.id && styles.optionChipSelected,
                    ]}
                    onPress={() => toggleDifficulty(diff.id)}
                  >
                    <Text style={styles.optionIcon}>{diff.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        filters.difficulty_level === diff.id && styles.optionTextSelected,
                      ]}
                    >
                      {diff.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Evidence Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Evidence Level</Text>
              <View style={styles.optionsRow}>
                {EVIDENCE_LEVELS.map((ev) => (
                  <TouchableOpacity
                    key={ev.id}
                    style={[
                      styles.optionChip,
                      filters.evidence_level === ev.id && styles.optionChipSelected,
                    ]}
                    onPress={() => toggleEvidence(ev.id)}
                  >
                    <Text style={styles.optionIcon}>{ev.icon}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        filters.evidence_level === ev.id && styles.optionTextSelected,
                      ]}
                    >
                      {ev.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preparation Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Max Preparation Time</Text>
              <View style={styles.optionsRow}>
                {PREP_TIME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionChip,
                      filters.max_preparation_time === opt.value && styles.optionChipSelected,
                    ]}
                    onPress={() => togglePrepTime(opt.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.max_preparation_time === opt.value && styles.optionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Minimum Efficacy Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Efficacy Rating</Text>
              <View style={styles.optionsRow}>
                {EFFICACY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionChip,
                      filters.min_efficacy_rating === opt.value && styles.optionChipSelected,
                    ]}
                    onPress={() => toggleEfficacy(opt.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        filters.min_efficacy_rating === opt.value && styles.optionTextSelected,
                      ]}
                    >
                      ⭐ {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Safety Flags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Safety Requirements</Text>
              
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Safe for Pregnancy</Text>
                <Switch
                  value={filters.safe_for_pregnancy || false}
                  onValueChange={(value) => updateFilter('safe_for_pregnancy', value)}
                  trackColor={{ false: '#ddd', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Safe for Children</Text>
                <Switch
                  value={filters.safe_for_children || false}
                  onValueChange={(value) => updateFilter('safe_for_children', value)}
                  trackColor={{ false: '#ddd', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Seasonal Ingredients Only</Text>
                <Switch
                  value={filters.seasonal_only || false}
                  onValueChange={(value) => updateFilter('seasonal_only', value)}
                  trackColor={{ false: '#ddd', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Verified Remedies Only</Text>
                <Switch
                  value={filters.verified_only || false}
                  onValueChange={(value) => updateFilter('verified_only', value)}
                  trackColor={{ false: '#ddd', true: '#4CAF50' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={onReset}>
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={onApply}>
              <Text style={styles.applyButtonText}>
                Apply {activeFilterCount > 0 && `(${activeFilterCount})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  optionChipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLabel: {
    fontSize: 15,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 10,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FilterPanel;
