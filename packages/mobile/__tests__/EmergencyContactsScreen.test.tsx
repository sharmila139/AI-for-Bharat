import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Linking } from 'react-native';
import EmergencyContactsScreen from '../src/screens/health/EmergencyContactsScreen';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  openURL: jest.fn(() => Promise.resolve()),
}));

describe('EmergencyContactsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('Initial Render', () => {
    it('should render the screen with header', () => {
      const { getByText } = render(<EmergencyContactsScreen />);
      
      expect(getByText('Emergency Contacts')).toBeTruthy();
      expect(getByText('Manage your emergency contact list')).toBeTruthy();
    });

    it('should show empty state when no contacts exist', async () => {
      const { getByText } = render(<EmergencyContactsScreen />);
      
      await waitFor(() => {
        expect(getByText('No emergency contacts yet')).toBeTruthy();
        expect(getByText('Add contacts to quickly reach help in emergencies')).toBeTruthy();
      });
    });

    it('should render add button', () => {
      const { getByText } = render(<EmergencyContactsScreen />);
      
      expect(getByText('+ Add Emergency Contact')).toBeTruthy();
    });
  });

  describe('Loading Contacts', () => {
    it('should load contacts from AsyncStorage on mount', async () => {
      const mockContacts = [
        {
          id: '1',
          name: 'John Doe',
          relationship: 'Father',
          phoneNumber: '9876543210',
          contactType: 'family',
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockContacts));

      const { getByText } = render(<EmergencyContactsScreen />);

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('Father')).toBeTruthy();
        expect(getByText('9876543210')).toBeTruthy();
      });
    });

    it('should display primary badge for primary contact', async () => {
      const mockContacts = [
        {
          id: '1',
          name: 'John Doe',
          relationship: 'Father',
          phoneNumber: '9876543210',
          contactType: 'family',
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockContacts));

      const { getByText } = render(<EmergencyContactsScreen />);

      await waitFor(() => {
        expect(getByText('PRIMARY')).toBeTruthy();
      });
    });
  });

  describe('Contact Filtering', () => {
    const mockContacts = [
      {
        id: '1',
        name: 'John Doe',
        relationship: 'Father',
        phoneNumber: '9876543210',
        contactType: 'family',
        isPrimary: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        name: 'Dr. Smith',
        relationship: 'Family Doctor',
        phoneNumber: '9876543211',
        contactType: 'doctor',
        isPrimary: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    it('should filter contacts by search query', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockContacts));

      const { getByPlaceholderText, getByText, queryByText } = render(<EmergencyContactsScreen />);

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('Dr. Smith')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search contacts...');
      fireEvent.changeText(searchInput, 'John');

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(queryByText('Dr. Smith')).toBeNull();
      });
    });

    it('should filter contacts by type', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockContacts));

      const { getByText, queryByText } = render(<EmergencyContactsScreen />);

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
        expect(getByText('Dr. Smith')).toBeTruthy();
      });

      // Find and press the Doctor filter chip
      const doctorFilter = getByText(/Doctor \(1\)/);
      fireEvent.press(doctorFilter);

      await waitFor(() => {
        expect(queryByText('John Doe')).toBeNull();
        expect(getByText('Dr. Smith')).toBeTruthy();
      });
    });
  });

  describe('Adding Contacts', () => {
    it('should open modal when add button is pressed', () => {
      const { getByText } = render(<EmergencyContactsScreen />);
      
      const addButton = getByText('+ Add Emergency Contact');
      fireEvent.press(addButton);

      expect(getByText('Add Emergency Contact')).toBeTruthy();
    });

    it('should validate required fields', async () => {
      const { getByText } = render(<EmergencyContactsScreen />);
      
      const addButton = getByText('+ Add Emergency Contact');
      fireEvent.press(addButton);

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Validation Error', 'Please enter a name');
      });
    });

    it('should validate phone number format', async () => {
      const { getByText, getByPlaceholderText } = render(<EmergencyContactsScreen />);
      
      const addButton = getByText('+ Add Emergency Contact');
      fireEvent.press(addButton);

      const nameInput = getByPlaceholderText('Enter name');
      fireEvent.changeText(nameInput, 'John Doe');

      const phoneInput = getByPlaceholderText('10-digit phone number');
      fireEvent.changeText(phoneInput, '123'); // Invalid phone

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          'Please enter a valid 10-digit phone number'
        );
      });
    });

    it('should save valid contact', async () => {
      const { getByText, getByPlaceholderText } = render(<EmergencyContactsScreen />);
      
      const addButton = getByText('+ Add Emergency Contact');
      fireEvent.press(addButton);

      const nameInput = getByPlaceholderText('Enter name');
      fireEvent.changeText(nameInput, 'John Doe');

      const relationshipInput = getByPlaceholderText('e.g., Father, Mother, Doctor');
      fireEvent.changeText(relationshipInput, 'Father');

      const phoneInput = getByPlaceholderText('10-digit phone number');
      fireEvent.changeText(phoneInput, '9876543210');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should set first contact as primary by default', async () => {
      const { getByText, getByPlaceholderText } = render(<EmergencyContactsScreen />);
      
      const addButton = getByText('+ Add Emergency Contact');
      fireEvent.press(addButton);

      const nameInput = getByPlaceholderText('Enter name');
      fireEvent.changeText(nameInput, 'John Doe');

      const phoneInput = getByPlaceholderText('10-digit phone number');
      fireEvent.changeText(phoneInput, '9876543210');

      const saveButton = getByText('Save');
      fireEvent.press(saveButton);

      await waitFor(() => {
        const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
        const contacts = JSON.parse(savedData);
        expect(contacts[0].isPrimary).toBe(true);
      });
    });
  });

  describe('Editing Contacts', () => {
    it('should open edit modal with pre-filled data', async () => {
      const mockContacts = [
        {
          id: '1',
          name: 'John Doe',
          relationship: 'Father',
          phoneNumber: '9876543210',
          contactType: 'family',
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockContacts));

      const { getByText } = render(<EmergencyContactsScreen />);

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const editButton = getByText('Edit');
      fireEvent.press(editButton);

      expect(getByText('Edit Contact')).toBeTruthy();
      expect(getByText('Update')).toBeTruthy();
    });
  });

  describe('Deleting Contacts', () => {
    it('should show confirmation dialog before deleting', async () => {
      const mockContacts = [
        {
          id: '1',
          name: 'John Doe',
          relationship: 'Father',
          phoneNumber: '9876543210',
          contactType: 'family',
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockContacts));

      const { getByText } = render(<EmergencyContactsScreen />);

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const deleteButton = getByText('Delete');
      fireEvent.press(deleteButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Contact',
        'Are you sure you want to delete this contact?',
        expect.any(Array)
      );
    });
  });

  describe('Quick Dial', () => {
    it('should show confirmation before calling', async () => {
      const mockContacts = [
        {
          id: '1',
          name: 'John Doe',
          relationship: 'Father',
          phoneNumber: '9876543210',
          contactType: 'family',
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockContacts));

      const { getByText } = render(<EmergencyContactsScreen />);

      await waitFor(() => {
        expect(getByText('John Doe')).toBeTruthy();
      });

      const callButton = getByText('Call');
      fireEvent.press(callButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Call Contact',
        'Call John Doe at 9876543210?',
        expect.any(Array)
      );
    });
  });

  describe('Setting Primary Contact', () => {
    it('should update primary contact', async () => {
      const mockContacts = [
        {
          id: '1',
          name: 'John Doe',
          relationship: 'Father',
          phoneNumber: '9876543210',
          contactType: 'family',
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Jane Doe',
          relationship: 'Mother',
          phoneNumber: '9876543211',
          contactType: 'family',
          isPrimary: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockContacts));

      const { getAllByText } = render(<EmergencyContactsScreen />);

      await waitFor(() => {
        const setPrimaryButtons = getAllByText('Set as Primary');
        expect(setPrimaryButtons.length).toBeGreaterThan(0);
      });

      const setPrimaryButtons = getAllByText('Set as Primary');
      fireEvent.press(setPrimaryButtons[0]);

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
        const savedData = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
        const contacts = JSON.parse(savedData);
        // Verify only one contact is primary
        const primaryContacts = contacts.filter((c: any) => c.isPrimary);
        expect(primaryContacts.length).toBe(1);
      });
    });
  });

  describe('Contact Grouping', () => {
    it('should group contacts by type', async () => {
      const mockContacts = [
        {
          id: '1',
          name: 'John Doe',
          relationship: 'Father',
          phoneNumber: '9876543210',
          contactType: 'family',
          isPrimary: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'Dr. Smith',
          relationship: 'Family Doctor',
          phoneNumber: '9876543211',
          contactType: 'doctor',
          isPrimary: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockContacts));

      const { getByText } = render(<EmergencyContactsScreen />);

      await waitFor(() => {
        expect(getByText(/Family Member/)).toBeTruthy();
        expect(getByText(/Doctor/)).toBeTruthy();
      });
    });
  });
});
