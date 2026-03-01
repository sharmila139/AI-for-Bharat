/**
 * Category Selector Component
 * Shows AI-detected category with confidence and allows manual override
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { GrievanceCategory, SeverityLevel } from '../../services/api/grievance-api';

interface CategoryInfo {
  id: GrievanceCategory;
  name: string;
  icon: string;
  description: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    id: 'road',
    name: 'Roads',
    icon: '🛣️',
    description: 'Potholes, cracks, damaged pavement',
  },
  {
    id: 'water',
    name: 'Water Supply',
    icon: '💧',
    description: 'Leaking pipes, water shortage',
  },
  {
    id: 'electricity',
    name: 'Electricity',
    icon: '⚡',
    description: 'Power outage, damaged poles, wires',
  },
  {
    id: 'sanitation',
    name: 'Sanitation',
    icon: '🗑️',
    description: 'Garbage, drainage, waste management',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    description: 'Hospital, clinic infrastructure',
  },
  {
    id: 'education',
    name: 'Education',
    icon: '🏫',
    description: 'School, classroom facilities',
  },
  {
    id: 'public_safety',
    name: 'Public Safety',
    icon: '🚨',
    description: 'Safety hazards, security issues',
  },
  {
    id: 'other',
    name: 'Other',
    icon: '📋',
    description: 'Other infrastructure issues',
  },
];

const SEVERITY_INFO: Record<SeverityLevel, { name: string; color: string; icon: string }> = {
  low: { name: 'Low', color: '#4CAF50', icon: '🟢' },
  medium: { name: 'Medium', color: '#FF9800', icon: '🟡' },
  high: { name: 'High', color: '#FF5722', icon: '🟠' },
  critical: { name: 'Critical', color: '#F44336', icon: '🔴' },
};

interface CategorySelectorProps {
  selectedCategory: GrievanceCategory | null;
  onCategoryChange: (category: GrievanceCategory) => void;
  aiCategory?: GrievanceCategory;
  aiConfidence?: number;
  aiSeverity?: SeverityLevel;
  isClassifying?: boolean;
  disabled?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  aiCategory,
  aiConfidence,
  aiSeverity,
  isClassifying = false,
  disabled = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  const getCategoryInfo = (categoryId: GrievanceCategory): CategoryInfo => {
    return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
  };

  const handleCategorySelect = (category: GrievanceCategory) => {
    onCategoryChange(category);
    setShowModal(false);
  };

  const renderAIBadge = () => {
    if (!aiCategory || !aiConfidence) return null;

    const isHighConfidence = aiConfidence >= 85;
    const categoryInfo = getCategoryInfo(aiCategory);

    return (
      <View style={styles.aiBadgeContainer}>
        <View style={[styles.aiBadge, isHighConfidence ? styles.aiBadgeHigh : styles.aiBadgeLow]}>
          <Text style={styles.aiBadgeIcon}>🤖</Text>
          <View style={styles.aiBadgeContent}>
            <Text style={styles.aiBadgeTitle}>AI Detected</Text>
            <Text style={styles.aiBadgeText}>
              {categoryInfo.name} ({aiConfidence}% confidence)
            </Text>
          </View>
        </View>
        {!isHighConfidence && (
          <Text style={styles.lowConfidenceWarning}>
            Low confidence. Please verify or select manually.
          </Text>
        )}
      </View>
    );
  };

  const renderSeverityBadge = () => {
    if (!aiSeverity) return null;

    const severityInfo = SEVERITY_INFO[aiSeverity];

    return (
      <View style={styles.severityBadge}>
        <Text style={styles.severityIcon}>{severityInfo.icon}</Text>
        <Text style={[styles.severityText, { color: severityInfo.color }]}>
          {severityInfo.name} Severity
        </Text>
      </View>
    );
  };

  const renderSelectedCategory = () => {
    if (!selectedCategory) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>📋</Text>
          <Text style={styles.placeholderText}>Select Category</Text>
        </View>
      );
    }

    const categoryInfo = getCategoryInfo(selectedCategory);

    return (
      <View style={styles.selectedCategory}>
        <Text style={styles.selectedIcon}>{categoryInfo.icon}</Text>
        <View style={styles.selectedContent}>
          <Text style={styles.selectedName}>{categoryInfo.name}</Text>
          <Text style={styles.selectedDescription}>{categoryInfo.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Issue Category</Text>

      {isClassifying && (
        <View style={styles.classifyingContainer}>
          <ActivityIndicator size="small" color="#2196F3" />
          <Text style={styles.classifyingText}>AI is analyzing the photo...</Text>
        </View>
      )}

      {renderAIBadge()}
      {renderSeverityBadge()}

      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => !disabled && setShowModal(true)}
        disabled={disabled}
      >
        {renderSelectedCategory()}
        <Text style={styles.selectorArrow}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.id && styles.categoryItemSelected,
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </View>
                  {selectedCategory === category.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  classifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 10,
  },
  classifyingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2196F3',
  },
  aiBadgeContainer: {
    marginBottom: 10,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
  },
  aiBadgeHigh: {
    backgroundColor: '#E8F5E9',
  },
  aiBadgeLow: {
    backgroundColor: '#FFF3E0',
  },
  aiBadgeIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  aiBadgeContent: {
    flex: 1,
  },
  aiBadgeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  aiBadgeText: {
    fontSize: 14,
    color: '#333',
  },
  lowConfidenceWarning: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  severityIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  severityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectorDisabled: {
    opacity: 0.5,
  },
  placeholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  selectedCategory: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  selectedContent: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  selectedDescription: {
    fontSize: 12,
    color: '#666',
  },
  selectorArrow: {
    fontSize: 24,
    color: '#999',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#999',
  },
  categoryList: {
    padding: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  categoryItemSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});

export default CategorySelector;
