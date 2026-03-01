import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  EmergencyContactInfo,
  EmergencyContactType,
  CONTACT_TYPE_OPTIONS,
} from '../../types/health';

const STORAGE_KEY = '@emergency_contacts';

const EmergencyContactsScreen: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContactInfo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContactInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EmergencyContactType | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    phoneNumber: '',
    contactType: 'family' as EmergencyContactType,
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const saveContacts = async (updatedContacts: EmergencyContactInfo[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedContacts));
      setContacts(updatedContacts);
    } catch (error) {
      console.error('Error saving contacts:', error);
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Indian phone number validation: 10 digits
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleSaveContact = () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter a name');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter a phone number');
      return;
    }
    if (!validatePhoneNumber(formData.phoneNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    const now = new Date().toISOString();

    if (editingContact) {
      // Update existing contact
      const updatedContacts = contacts.map((c) =>
        c.id === editingContact.id
          ? {
              ...c,
              ...formData,
              updatedAt: now,
            }
          : c
      );
      saveContacts(updatedContacts);
    } else {
      // Add new contact
      const newContact: EmergencyContactInfo = {
        id: Date.now().toString(),
        ...formData,
        isPrimary: contacts.length === 0, // First contact is primary by default
        createdAt: now,
        updatedAt: now,
      };
      saveContacts([...contacts, newContact]);
    }

    closeModal();
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedContacts = contacts.filter((c) => c.id !== contactId);
            saveContacts(updatedContacts);
          },
        },
      ]
    );
  };

  const handleSetPrimary = (contactId: string) => {
    const updatedContacts = contacts.map((c) => ({
      ...c,
      isPrimary: c.id === contactId,
    }));
    saveContacts(updatedContacts);
  };

  const handleQuickDial = (phoneNumber: string, name: string) => {
    Alert.alert(
      'Call Contact',
      `Call ${name} at ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            const url = `tel:${phoneNumber}`;
            Linking.canOpenURL(url)
              .then((supported) => {
                if (supported) {
                  Linking.openURL(url);
                } else {
                  Alert.alert('Error', 'Unable to make phone calls on this device');
                }
              })
              .catch((err) => console.error('Error opening dialer:', err));
          },
        },
      ]
    );
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      relationship: '',
      phoneNumber: '',
      contactType: 'family',
    });
    setModalVisible(true);
  };

  const openEditModal = (contact: EmergencyContactInfo) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      relationship: contact.relationship,
      phoneNumber: contact.phoneNumber,
      contactType: contact.contactType,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingContact(null);
  };

  const getFilteredContacts = () => {
    let filtered = contacts;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((c) => c.contactType === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.relationship.toLowerCase().includes(query) ||
          c.phoneNumber.includes(query)
      );
    }

    // Sort: primary first, then by type, then by name
    return filtered.sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      if (a.contactType !== b.contactType) {
        return a.contactType.localeCompare(b.contactType);
      }
      return a.name.localeCompare(b.name);
    });
  };

  const groupContactsByType = (contactsList: EmergencyContactInfo[]) => {
    const grouped: { [key: string]: EmergencyContactInfo[] } = {};
    contactsList.forEach((contact) => {
      if (!grouped[contact.contactType]) {
        grouped[contact.contactType] = [];
      }
      grouped[contact.contactType].push(contact);
    });
    return grouped;
  };

  const getContactTypeLabel = (type: EmergencyContactType): string => {
    return CONTACT_TYPE_OPTIONS.find((opt) => opt.value === type)?.label || type;
  };

  const getContactTypeIcon = (type: EmergencyContactType): string => {
    return CONTACT_TYPE_OPTIONS.find((opt) => opt.value === type)?.icon || '📞';
  };

  const filteredContacts = getFilteredContacts();
  const groupedContacts = groupContactsByType(filteredContacts);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>Manage your emergency contact list</Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
            All ({contacts.length})
          </Text>
        </TouchableOpacity>
        {CONTACT_TYPE_OPTIONS.map((option) => {
          const count = contacts.filter((c) => c.contactType === option.value).length;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.filterChip, filterType === option.value && styles.filterChipActive]}
              onPress={() => setFilterType(option.value)}
            >
              <Text style={[styles.filterChipText, filterType === option.value && styles.filterChipTextActive]}>
                {option.icon} {option.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contacts List */}
      <ScrollView style={styles.contactsList}>
        {filteredContacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📞</Text>
            <Text style={styles.emptyStateText}>No emergency contacts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add contacts to quickly reach help in emergencies
            </Text>
          </View>
        ) : (
          Object.entries(groupedContacts).map(([type, contactsInType]) => (
            <View key={type} style={styles.contactGroup}>
              <Text style={styles.groupHeader}>
                {getContactTypeIcon(type as EmergencyContactType)} {getContactTypeLabel(type as EmergencyContactType)}
              </Text>
              {contactsInType.map((contact) => (
                <View key={contact.id} style={styles.contactCard}>
                  {contact.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                    </View>
                  )}
                  <View style={styles.contactHeader}>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.relationship && (
                        <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                      )}
                      <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.quickDialButton}
                      onPress={() => handleQuickDial(contact.phoneNumber, contact.name)}
                    >
                      <Text style={styles.quickDialIcon}>📞</Text>
                      <Text style={styles.quickDialText}>Call</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.contactActions}>
                    {!contact.isPrimary && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleSetPrimary(contact.id)}
                      >
                        <Text style={styles.actionButtonText}>Set as Primary</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEditModal(contact)}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteContact(contact.id)}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>+ Add Emergency Contact</Text>
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
            </Text>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>Relationship</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Father, Mother, Doctor"
                value={formData.relationship}
                onChangeText={(text) => setFormData({ ...formData, relationship: text })}
              />

              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit phone number"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.label}>Contact Type *</Text>
              <View style={styles.typeSelector}>
                {CONTACT_TYPE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.typeOption,
                      formData.contactType === option.value && styles.typeOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, contactType: option.value })}
                  >
                    <Text style={styles.typeOptionIcon}>{option.icon}</Text>
                    <Text
                      style={[
                        styles.typeOptionText,
                        formData.contactType === option.value && styles.typeOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={closeModal}>
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveContact}>
                <Text style={styles.modalSaveButtonText}>
                  {editingContact ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#D32F2F',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#D32F2F',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  contactsList: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  contactGroup: {
    marginBottom: 24,
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  quickDialButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickDialIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  quickDialText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#D32F2F',
  },
  addButton: {
    backgroundColor: '#D32F2F',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modalForm: {
    maxHeight: 400,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  typeOptionActive: {
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
  },
  typeOptionIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  typeOptionText: {
    fontSize: 14,
    color: '#666',
  },
  typeOptionTextActive: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default EmergencyContactsScreen;
