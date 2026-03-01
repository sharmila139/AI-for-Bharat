/**
 * Tests for TransparencyDocumentViewer Screen
 * Task 36.9: Implement transparency document viewer
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking, Share } from 'react-native';
import TransparencyDocumentViewer from '../TransparencyDocumentViewer';

// Mock dependencies
jest.mock('../../../components/OfflineIndicator', () => ({
  OfflineIndicator: () => null,
}));

jest.mock('../../../config/api-config', () => ({
  API_BASE_URL: 'http://localhost:3000',
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock Linking
jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

// Mock Share
jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

describe('TransparencyDocumentViewer', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  const mockDocuments = [
    {
      document_id: 'doc1',
      document_name: 'Project Budget 2024',
      document_type: 'budget',
      file_format: 'pdf',
      file_url: 'https://example.com/budget.pdf',
      file_size: 2048000,
      upload_date: '2024-01-15T10:00:00Z',
      uploaded_by: 'Admin User',
      project_id: 'proj1',
      project_name: 'Road Construction Project',
      description: 'Annual budget allocation for road construction',
      is_public: true,
      download_count: 45,
      view_count: 120,
      tags: ['budget', '2024', 'roads'],
      thumbnail_url: 'https://example.com/thumb.jpg',
    },
    {
      document_id: 'doc2',
      document_name: 'Contractor Agreement',
      document_type: 'contract',
      file_format: 'pdf',
      file_url: 'https://example.com/contract.pdf',
      file_size: 1024000,
      upload_date: '2024-02-01T14:30:00Z',
      project_id: 'proj1',
      project_name: 'Road Construction Project',
      is_public: true,
      download_count: 30,
      view_count: 85,
      tags: ['contract', 'legal'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({ success: true, data: mockDocuments }),
    });
  });

  describe('Initial Load', () => {
    it('should display loading state initially', () => {
      const { getByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      expect(getByText('Loading documents...')).toBeTruthy();
    });

    it('should load and display documents', async () => {
      const { getByText, queryByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(queryByText('Loading documents...')).toBeNull();
      });

      expect(getByText('Project Budget 2024')).toBeTruthy();
      expect(getByText('Contractor Agreement')).toBeTruthy();
      expect(getByText('2 documents')).toBeTruthy();
    });

    it('should display error state on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getByText, findByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      const errorTitle = await findByText('Failed to Load');
      expect(errorTitle).toBeTruthy();
      expect(getByText('Network error')).toBeTruthy();
    });

    it('should retry loading on retry button press', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockDocuments }),
        });

      const { getByText, findByText, queryByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await findByText('Failed to Load');
      
      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(queryByText('Failed to Load')).toBeNull();
      });

      expect(getByText('Project Budget 2024')).toBeTruthy();
    });

    it('should load documents for specific project when projectId provided', async () => {
      const route = {
        params: {
          projectId: 'proj1',
          projectName: 'Road Construction Project',
        },
      };

      render(
        <TransparencyDocumentViewer navigation={mockNavigation} route={route} />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('project_id=proj1')
        );
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter documents by search query', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search documents...');
      fireEvent.changeText(searchInput, 'budget');

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
        expect(queryByText('Contractor Agreement')).toBeNull();
        expect(getByText('1 document')).toBeTruthy();
      });
    });

    it('should clear search query when clear button pressed', async () => {
      const { getByPlaceholderText, getByText, getAllByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('2 documents')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search documents...');
      fireEvent.changeText(searchInput, 'budget');

      await waitFor(() => {
        expect(getByText('1 document')).toBeTruthy();
      });

      const clearButtons = getAllByText('✕');
      fireEvent.press(clearButtons[0]); // First clear button is for search

      await waitFor(() => {
        expect(getByText('2 documents')).toBeTruthy();
      });
    });

    it('should show empty state when no documents match search', async () => {
      const { getByPlaceholderText, getByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('2 documents')).toBeTruthy();
      });

      const searchInput = getByPlaceholderText('Search documents...');
      fireEvent.changeText(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(getByText('No Documents Found')).toBeTruthy();
        expect(getByText('Try adjusting your filters or search query')).toBeTruthy();
      });
    });
  });

  describe('Filter Functionality', () => {
    it('should toggle filters panel', async () => {
      const { getByText, queryByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('2 documents')).toBeTruthy();
      });

      expect(queryByText('Filters')).toBeNull();

      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      expect(getByText('Filters')).toBeTruthy();
    });

    it('should filter documents by document type', async () => {
      const { getByText, getAllByText, queryByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('2 documents')).toBeTruthy();
      });

      // Open filters
      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      // Select budget filter (get all budget texts and select the filter chip one)
      const budgetFilters = getAllByText('budget');
      // The filter chip is the first one in the filters panel
      fireEvent.press(budgetFilters[0]);

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
        expect(queryByText('Contractor Agreement')).toBeNull();
        expect(getByText('1 document')).toBeTruthy();
      });
    });

    it('should clear all filters', async () => {
      const { getByText, getAllByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('2 documents')).toBeTruthy();
      });

      // Open filters and apply filter
      const filterButton = getByText('⚙️');
      fireEvent.press(filterButton);

      const budgetFilters = getAllByText('budget');
      fireEvent.press(budgetFilters[0]);

      await waitFor(() => {
        expect(getByText('1 document')).toBeTruthy();
      });

      // Clear filters
      const clearButton = getByText('Clear All Filters');
      fireEvent.press(clearButton);

      await waitFor(() => {
        expect(getByText('2 documents')).toBeTruthy();
      });
    });
  });

  describe('Document Interaction', () => {
    it('should open document detail modal on document press', async () => {
      const { getAllByText, findByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getAllByText('Project Budget 2024').length).toBeGreaterThan(0);
      });

      const documentCards = getAllByText('Project Budget 2024');
      fireEvent.press(documentCards[0]);

      // Modal should open with document details
      await findByText('Details');
      expect(getAllByText('Description').length).toBeGreaterThan(0);
    });

    it('should track view count when document is opened', async () => {
      const { getByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
      });

      const documentCard = getByText('Project Budget 2024');
      fireEvent.press(documentCard);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/infrastructure/transparency-documents/doc1/view',
          { method: 'POST' }
        );
      });
    });

    it('should close document modal on close button press', async () => {
      const { getByText, getAllByText, queryByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
      });

      const documentCard = getByText('Project Budget 2024');
      fireEvent.press(documentCard);

      await waitFor(() => {
        expect(getByText('Details')).toBeTruthy();
      });

      const closeButtons = getAllByText('✕');
      const modalCloseButton = closeButtons[closeButtons.length - 1];
      fireEvent.press(modalCloseButton);

      await waitFor(() => {
        expect(queryByText('Details')).toBeNull();
      });
    });
  });

  describe('Download Functionality', () => {
    it('should download document when download button pressed', async () => {
      const { getByText, findByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
      });

      // Open document modal
      const documentCard = getByText('Project Budget 2024');
      fireEvent.press(documentCard);

      await findByText('Details');

      // Press download button
      const downloadButton = getByText('Download');
      fireEvent.press(downloadButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/infrastructure/transparency-documents/doc1/download',
          { method: 'POST' }
        );
        expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/budget.pdf');
      });
    });

    it('should show alert on successful download', async () => {
      const { getByText, findByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
      });

      const documentCard = getByText('Project Budget 2024');
      fireEvent.press(documentCard);

      await findByText('Details');

      const downloadButton = getByText('Download');
      fireEvent.press(downloadButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Document download started');
      });
    });

    it('should handle download error', async () => {
      (Linking.canOpenURL as jest.Mock).mockResolvedValueOnce(false);

      const { getByText, findByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
      });

      const documentCard = getByText('Project Budget 2024');
      fireEvent.press(documentCard);

      await findByText('Details');

      const downloadButton = getByText('Download');
      fireEvent.press(downloadButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Cannot open document URL');
      });
    });
  });

  describe('Share Functionality', () => {
    it('should share document when share button pressed', async () => {
      const { getByText, findByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
      });

      const documentCard = getByText('Project Budget 2024');
      fireEvent.press(documentCard);

      await findByText('Details');

      const shareButton = getByText('Share');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(Share.share).toHaveBeenCalledWith({
          message: expect.stringContaining('Project Budget 2024'),
          title: 'Project Budget 2024',
        });
      });
    });
  });

  describe('Document Metadata Display', () => {
    it('should display document metadata correctly', async () => {
      const { getByText, getAllByText, findByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('Project Budget 2024')).toBeTruthy();
      });

      const documentCards = getAllByText('Project Budget 2024');
      fireEvent.press(documentCards[0]);

      await findByText('Details');

      // Check metadata
      expect(getByText('Type:')).toBeTruthy();
      const budgetTexts = getAllByText('budget');
      expect(budgetTexts.length).toBeGreaterThan(0);
      expect(getByText('Format:')).toBeTruthy();
      expect(getByText('PDF')).toBeTruthy();
      expect(getByText('Size:')).toBeTruthy();
      expect(getByText('1.95 MB')).toBeTruthy();
      expect(getByText('Upload Date:')).toBeTruthy();
      expect(getByText('Uploaded By:')).toBeTruthy();
      expect(getByText('Admin User')).toBeTruthy();
      expect(getByText('Project:')).toBeTruthy();
      expect(getByText('Road Construction Project')).toBeTruthy();
      expect(getByText('Views:')).toBeTruthy();
      expect(getByText('120')).toBeTruthy();
      expect(getByText('Downloads:')).toBeTruthy();
      expect(getByText('45')).toBeTruthy();
    });

    it('should display document tags', async () => {
      const { getAllByText, findByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getAllByText('Project Budget 2024').length).toBeGreaterThan(0);
      });

      const documentCards = getAllByText('Project Budget 2024');
      fireEvent.press(documentCards[0]);

      await findByText('Details');

      const tagsHeaders = getAllByText('Tags');
      expect(tagsHeaders.length).toBeGreaterThan(0);
      const budgetTexts = getAllByText('budget');
      expect(budgetTexts.length).toBeGreaterThan(0);
      const yearTexts = getAllByText('2024');
      expect(yearTexts.length).toBeGreaterThan(0);
      const roadsTexts = getAllByText('roads');
      expect(roadsTexts.length).toBeGreaterThan(0);
    });

    it('should format file sizes correctly', async () => {
      const { getByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('2 documents')).toBeTruthy();
      });

      // Check file size formatting in list (actual formatted values)
      expect(getByText('📦 1.95 MB')).toBeTruthy(); // Budget document (2048000 bytes)
      expect(getByText('📦 1000.00 KB')).toBeTruthy(); // Contract document (1024000 bytes)
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no documents available', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, data: [] }),
      });

      const { getByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} />
      );

      await waitFor(() => {
        expect(getByText('No Documents Found')).toBeTruthy();
        expect(getByText('No transparency documents available yet')).toBeTruthy();
      });
    });
  });

  describe('Project Context', () => {
    it('should display project name in header when provided', async () => {
      const route = {
        params: {
          projectId: 'proj1',
          projectName: 'Road Construction Project',
        },
      };

      const { getByText } = render(
        <TransparencyDocumentViewer navigation={mockNavigation} route={route} />
      );

      await waitFor(() => {
        expect(getByText('Road Construction Project')).toBeTruthy();
      });
    });
  });
});
