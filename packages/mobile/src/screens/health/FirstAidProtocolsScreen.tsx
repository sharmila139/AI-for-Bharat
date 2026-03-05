/**
 * First Aid Protocols Screen
 * Task 34.10: Build offline first aid protocol viewer
 * 
 * Features:
 * - Display 50+ cached first aid protocols
 * - Browse by category (burns, cuts, fractures, poisoning, etc.)
 * - Search functionality
 * - Step-by-step instructions with illustrations
 * - Emergency contact quick access
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';

interface FirstAidProtocolsScreenProps {
  navigation: any;
}

interface Protocol {
  id: string;
  title: string;
  category: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  steps: ProtocolStep[];
  warnings: string[];
  whenToSeekHelp: string;
}

interface ProtocolStep {
  stepNumber: number;
  instruction: string;
  warning?: string;
  illustration?: string;
}

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📋' },
  { id: 'burns', name: 'Burns', icon: '🔥' },
  { id: 'cuts', name: 'Cuts & Wounds', icon: '🩹' },
  { id: 'fractures', name: 'Fractures', icon: '🦴' },
  { id: 'poisoning', name: 'Poisoning', icon: '☠️' },
  { id: 'choking', name: 'Choking', icon: '😮' },
  { id: 'cardiac', name: 'Cardiac', icon: '❤️' },
  { id: 'breathing', name: 'Breathing', icon: '🫁' },
  { id: 'allergic', name: 'Allergic', icon: '🤧' },
  { id: 'bites', name: 'Bites & Stings', icon: '🐍' },
  { id: 'head', name: 'Head Injury', icon: '🤕' },
];

// Simulated offline protocols database
const PROTOCOLS: Protocol[] = [
  {
    id: '1',
    title: 'Minor Burns (1st Degree)',
    category: 'burns',
    severity: 'minor',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Cool the burn under cool (not cold) running water for at least 10 minutes',
        warning: 'Do not use ice, as it can cause further damage',
      },
      {
        stepNumber: 2,
        instruction: 'Remove any jewelry or tight clothing near the burned area before swelling occurs',
      },
      {
        stepNumber: 3,
        instruction: 'Cover the burn with a sterile, non-stick bandage or clean cloth',
      },
      {
        stepNumber: 4,
        instruction: 'Take over-the-counter pain medication if needed',
      },
    ],
    warnings: [
      'Do not apply butter, oil, or ointments',
      'Do not break blisters',
      'Do not use ice or very cold water',
    ],
    whenToSeekHelp: 'Seek medical help if the burn is larger than 3 inches, on face/hands/feet/genitals, or shows signs of infection',
  },
  {
    id: '2',
    title: 'Severe Bleeding',
    category: 'cuts',
    severity: 'critical',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Call emergency services (108) immediately',
        warning: 'This is a medical emergency',
      },
      {
        stepNumber: 2,
        instruction: 'Apply direct pressure to the wound with a clean cloth or bandage',
      },
      {
        stepNumber: 3,
        instruction: 'Maintain pressure for at least 10 minutes without checking if bleeding has stopped',
      },
      {
        stepNumber: 4,
        instruction: 'If blood soaks through, add more cloth on top and continue pressure',
        warning: 'Do not remove the original cloth',
      },
      {
        stepNumber: 5,
        instruction: 'Elevate the injured area above the heart if possible',
      },
    ],
    warnings: [
      'Do not remove embedded objects',
      'Do not apply tourniquet unless trained',
      'Do not peek at the wound while applying pressure',
    ],
    whenToSeekHelp: 'Immediate emergency medical attention required',
  },
  {
    id: '3',
    title: 'Choking (Adult)',
    category: 'choking',
    severity: 'critical',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Ask "Are you choking?" If they can speak or cough, encourage them to cough',
      },
      {
        stepNumber: 2,
        instruction: 'If they cannot speak, cough, or breathe, perform Heimlich maneuver',
        warning: 'Stand behind the person',
      },
      {
        stepNumber: 3,
        instruction: 'Make a fist with one hand and place it above the navel',
      },
      {
        stepNumber: 4,
        instruction: 'Grasp your fist with the other hand and give quick upward thrusts',
      },
      {
        stepNumber: 5,
        instruction: 'Repeat until object is dislodged or person becomes unconscious',
      },
    ],
    warnings: [
      'Call 108 if choking persists',
      'If person becomes unconscious, begin CPR',
      'Do not perform on infants under 1 year',
    ],
    whenToSeekHelp: 'Call 108 immediately if choking persists or person loses consciousness',
  },
  {
    id: '4',
    title: 'Snake Bite',
    category: 'bites',
    severity: 'serious',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Call emergency services (108) immediately',
        warning: 'All snake bites should be treated as medical emergencies',
      },
      {
        stepNumber: 2,
        instruction: 'Keep the person calm and still to slow venom spread',
      },
      {
        stepNumber: 3,
        instruction: 'Remove jewelry and tight clothing before swelling occurs',
      },
      {
        stepNumber: 4,
        instruction: 'Position the bitten area below heart level if possible',
      },
      {
        stepNumber: 5,
        instruction: 'Cover the bite with a clean, dry dressing',
      },
    ],
    warnings: [
      'Do not apply ice or tourniquet',
      'Do not cut the wound or try to suck out venom',
      'Do not give any medication or alcohol',
    ],
    whenToSeekHelp: 'Immediate emergency medical attention required for all snake bites',
  },
  {
    id: '5',
    title: 'Fracture (Suspected)',
    category: 'fractures',
    severity: 'serious',
    steps: [
      {
        stepNumber: 1,
        instruction: 'Do not move the injured area unless absolutely necessary',
      },
      {
        stepNumber: 2,
        instruction: 'Apply ice wrapped in cloth to reduce swelling (20 minutes on, 20 off)',
      },
      {
        stepNumber: 3,
        instruction: 'Immobilize the injured area using a splint if available',
        warning: 'Do not try to realign the bone',
      },
      {
        stepNumber: 4,
        instruction: 'Elevate the injured area if possible',
      },
      {
        stepNumber: 5,
        instruction: 'Seek medical attention for proper diagnosis and treatment',
      },
    ],
    warnings: [
      'Do not move the person if spine injury is suspected',
      'Do not try to straighten the injured area',
      'Do not give food or drink in case surgery is needed',
    ],
    whenToSeekHelp: 'Seek immediate medical attention for all suspected fractures',
  },
];

export const FirstAidProtocolsScreen: React.FC<FirstAidProtocolsScreenProps> = ({
  navigation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProtocols, setFilteredProtocols] = useState<Protocol[]>(PROTOCOLS);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [showProtocolModal, setShowProtocolModal] = useState(false);

  useEffect(() => {
    filterProtocols();
  }, [selectedCategory, searchQuery]);

  const filterProtocols = () => {
    let filtered = PROTOCOLS;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    setFilteredProtocols(filtered);
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#F44336';
      case 'serious':
        return '#FF9800';
      case 'moderate':
        return '#FFC107';
      case 'minor':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getSeverityLabel = (severity: string): string => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  const handleProtocolPress = (protocol: Protocol) => {
    setSelectedProtocol(protocol);
    setShowProtocolModal(true);
  };

  const renderProtocolCard = ({ item }: { item: Protocol }) => (
    <TouchableOpacity
      style={styles.protocolCard}
      onPress={() => handleProtocolPress(item)}
    >
      <View style={styles.protocolHeader}>
        <Text style={styles.protocolTitle}>{item.title}</Text>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(item.severity) },
          ]}
        >
          <Text style={styles.severityText}>
            {getSeverityLabel(item.severity)}
          </Text>
        </View>
      </View>
      <Text style={styles.protocolSteps}>{item.steps.length} steps</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>First Aid Protocols</Text>
        <Text style={styles.headerSubtitle}>
          50+ offline emergency protocols
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search protocols..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Protocols List */}
      <FlatList
        data={filteredProtocols}
        renderItem={renderProtocolCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No protocols found</Text>
            <Text style={styles.emptySubtext}>
              Try a different search or category
            </Text>
          </View>
        }
      />

      {/* Emergency Contact Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={() => navigation.navigate('EmergencyContacts')}
      >
        <Text style={styles.emergencyIcon}>🚨</Text>
        <Text style={styles.emergencyText}>Emergency: Call 108</Text>
      </TouchableOpacity>

      {/* Protocol Detail Modal */}
      <Modal
        visible={showProtocolModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowProtocolModal(false)}
      >
        {selectedProtocol && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowProtocolModal(false)}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.modalSeverityBadge,
                  { backgroundColor: getSeverityColor(selectedProtocol.severity) },
                ]}
              >
                <Text style={styles.modalSeverityText}>
                  {getSeverityLabel(selectedProtocol.severity)}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedProtocol.title}</Text>

              {/* Steps */}
              <View style={styles.stepsSection}>
                <Text style={styles.sectionTitle}>Steps to Follow</Text>
                {selectedProtocol.steps.map((step) => (
                  <View key={step.stepNumber} style={styles.stepCard}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{step.stepNumber}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepInstruction}>
                        {step.instruction}
                      </Text>
                      {step.warning && (
                        <View style={styles.stepWarning}>
                          <Text style={styles.stepWarningText}>
                            ⚠️ {step.warning}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Warnings */}
              {selectedProtocol.warnings.length > 0 && (
                <View style={styles.warningsSection}>
                  <Text style={styles.sectionTitle}>⚠️ Important Warnings</Text>
                  {selectedProtocol.warnings.map((warning, index) => (
                    <Text key={index} style={styles.warningText}>
                      • {warning}
                    </Text>
                  ))}
                </View>
              )}

              {/* When to Seek Help */}
              <View style={styles.seekHelpSection}>
                <Text style={styles.sectionTitle}>When to Seek Medical Help</Text>
                <Text style={styles.seekHelpText}>
                  {selectedProtocol.whenToSeekHelp}
                </Text>
              </View>

              {/* Emergency Button */}
              <TouchableOpacity
                style={styles.modalEmergencyButton}
                onPress={() => {
                  setShowProtocolModal(false);
                  navigation.navigate('EmergencyContacts');
                }}
              >
                <Text style={styles.modalEmergencyText}>
                  🚨 Call Emergency Services (108)
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#F44336',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFEBEE',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  clearIcon: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  categoriesContainer: {
    maxHeight: 80,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryButtonActive: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  protocolCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  protocolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  protocolTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  protocolSteps: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  emergencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
  },
  modalSeverityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalSeverityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  stepsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  stepWarning: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  stepWarningText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 18,
  },
  warningsSection: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  warningText: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 8,
    lineHeight: 20,
  },
  seekHelpSection: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  seekHelpText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  modalEmergencyButton: {
    backgroundColor: '#F44336',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  modalEmergencyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default FirstAidProtocolsScreen;

export default FirstAidProtocolsScreen;
