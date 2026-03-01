/**
 * Transparency Document Viewer Screen
 * Task 36.9: Implement transparency document viewer
 * 
 * Features:
 * - Display transparency documents related to infrastructure projects
 * - Document listing with filters (by project, document type, date)
 * - Document viewer supporting PDF, images, and text documents
 * - Download functionality for offline viewing
 * - Search functionality
 * - Show document metadata (upload date, size, type, related project)
 * - Follow patterns from ProjectDetailScreen and GrievanceDetailScreen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  Image,
  Dimensions,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import { API_BASE_URL } from '../../config/api-config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TransparencyDocumentViewerProps {
  navigation: any;
  route?: {
    params?: {
      projectId?: string;
      projectName?: string;
    };
  };
}

type DocumentType = 
  | 'budget' 
  | 'contract' 
  | 'report' 
  | 'meeting_minutes' 
  | 'inspection_report' 
  | 'tender' 
  | 'approval' 
  | 'other';

type FileFormat = 'pdf' | 'image' | 'text' | 'doc' | 'xls';

interface TransparencyDocument {
  document_id: string;
  document_name: string;
  document_type: DocumentType;
  file_format: FileFormat;
  file_url: string;
  file_size: number;
  upload_date: string;
  uploaded_by?: string;
  project_id?: string;
  project_name?: string;
  description?: string;
  is_public: boolean;
  download_count: number;
  view_count: number;
  tags?: string[];
  thumbnail_url?: string;
}

interface FilterOptions {
  projectId?: string;
  documentType?: DocumentType;
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
}

export const TransparencyDocumentViewer: React.FC<TransparencyDocumentViewerProps> = ({
  navigation,
  route,
}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TransparencyDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<TransparencyDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<TransparencyDocument | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    projectId: route?.params?.projectId,
  });
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [documents, filters, searchQuery]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.projectId) {
        queryParams.append('project_id', filters.projectId);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/infrastructure/transparency-documents?${queryParams.toString()}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load documents');
      }

      setDocuments(data.data || []);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.document_name.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query) ||
          doc.project_name?.toLowerCase().includes(query) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply document type filter
    if (filters.documentType) {
      filtered = filtered.filter((doc) => doc.document_type === filters.documentType);
    }

    // Apply date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (doc) => new Date(doc.upload_date) >= new Date(filters.dateFrom!)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (doc) => new Date(doc.upload_date) <= new Date(filters.dateTo!)
      );
    }

    // Sort by upload date (newest first)
    filtered.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime());

    setFilteredDocuments(filtered);
  };

  const handleDocumentPress = async (document: TransparencyDocument) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);

    // Track view count
    try {
      await fetch(
        `${API_BASE_URL}/api/infrastructure/transparency-documents/${document.document_id}/view`,
        { method: 'POST' }
      );
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  const handleDownload = async (document: TransparencyDocument) => {
    try {
      setDownloading(document.document_id);

      // Track download count
      await fetch(
        `${API_BASE_URL}/api/infrastructure/transparency-documents/${document.document_id}/download`,
        { method: 'POST' }
      );

      // Open document URL for download
      const supported = await Linking.canOpenURL(document.file_url);
      if (supported) {
        await Linking.openURL(document.file_url);
        Alert.alert('Success', 'Document download started');
      } else {
        Alert.alert('Error', 'Cannot open document URL');
      }
    } catch (err: any) {
      console.error('Error downloading document:', err);
      Alert.alert('Error', err.message || 'Failed to download document');
    } finally {
      setDownloading(null);
    }
  };

  const handleShare = async (document: TransparencyDocument) => {
    try {
      await Share.share({
        message: `${document.document_name}\n\nType: ${document.document_type}\nProject: ${document.project_name || 'N/A'}\n\nView at: ${document.file_url}`,
        title: document.document_name,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const clearFilters = () => {
    setFilters({ projectId: route?.params?.projectId });
    setSearchQuery('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${bytes} B`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDocumentTypeIcon = (type: DocumentType): string => {
    const icons: Record<DocumentType, string> = {
      budget: '💰',
      contract: '📝',
      report: '📊',
      meeting_minutes: '📋',
      inspection_report: '🔍',
      tender: '📢',
      approval: '✅',
      other: '📄',
    };
    return icons[type] || '📄';
  };

  const getFileFormatIcon = (format: FileFormat): string => {
    const icons: Record<FileFormat, string> = {
      pdf: '📕',
      image: '🖼️',
      text: '📃',
      doc: '📘',
      xls: '📗',
    };
    return icons[format] || '📄';
  };

  const getDocumentTypeColor = (type: DocumentType): string => {
    const colors: Record<DocumentType, string> = {
      budget: '#4CAF50',
      contract: '#2196F3',
      report: '#FF9800',
      meeting_minutes: '#9C27B0',
      inspection_report: '#F44336',
      tender: '#00BCD4',
      approval: '#8BC34A',
      other: '#607D8B',
    };
    return colors[type] || '#666';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDocuments}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transparency Documents</Text>
        {route?.params?.projectName && (
          <Text style={styles.headerSubtitle}>{route.params.projectName}</Text>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <Text style={styles.filtersPanelTitle}>Filters</Text>

          {/* Document Type Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Document Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !filters.documentType && styles.filterChipActive,
                ]}
                onPress={() => setFilters({ ...filters, documentType: undefined })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !filters.documentType && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {(['budget', 'contract', 'report', 'meeting_minutes', 'inspection_report', 'tender', 'approval'] as DocumentType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    filters.documentType === type && styles.filterChipActive,
                  ]}
                  onPress={() => setFilters({ ...filters, documentType: type })}
                >
                  <Text style={styles.filterChipIcon}>{getDocumentTypeIcon(type)}</Text>
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.documentType === type && styles.filterChipTextActive,
                    ]}
                  >
                    {type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Clear Filters Button */}
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredDocuments.length} {filteredDocuments.length === 1 ? 'document' : 'documents'}
        </Text>
      </View>

      {/* Document List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📄</Text>
            <Text style={styles.emptyStateTitle}>No Documents Found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || filters.documentType
                ? 'Try adjusting your filters or search query'
                : 'No transparency documents available yet'}
            </Text>
          </View>
        ) : (
          filteredDocuments.map((document) => (
            <TouchableOpacity
              key={document.document_id}
              style={styles.documentCard}
              onPress={() => handleDocumentPress(document)}
            >
              {/* Document Header */}
              <View style={styles.documentHeader}>
                <View style={styles.documentIconContainer}>
                  <Text style={styles.documentIcon}>
                    {getFileFormatIcon(document.file_format)}
                  </Text>
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={2}>
                    {document.document_name}
                  </Text>
                  {document.project_name && (
                    <Text style={styles.documentProject}>
                      📁 {document.project_name}
                    </Text>
                  )}
                </View>
              </View>

              {/* Document Description */}
              {document.description && (
                <Text style={styles.documentDescription} numberOfLines={2}>
                  {document.description}
                </Text>
              )}

              {/* Document Metadata */}
              <View style={styles.documentMetadata}>
                <View
                  style={[
                    styles.documentTypeBadge,
                    { backgroundColor: getDocumentTypeColor(document.document_type) + '20' },
                  ]}
                >
                  <Text style={styles.documentTypeIcon}>
                    {getDocumentTypeIcon(document.document_type)}
                  </Text>
                  <Text
                    style={[
                      styles.documentTypeText,
                      { color: getDocumentTypeColor(document.document_type) },
                    ]}
                  >
                    {document.document_type.replace('_', ' ')}
                  </Text>
                </View>

                <View style={styles.documentStats}>
                  <Text style={styles.documentStat}>
                    📅 {formatDate(document.upload_date)}
                  </Text>
                  <Text style={styles.documentStat}>
                    📦 {formatFileSize(document.file_size)}
                  </Text>
                  <Text style={styles.documentStat}>
                    👁️ {document.view_count}
                  </Text>
                </View>
              </View>

              {/* Tags */}
              {document.tags && document.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {document.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {document.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>+{document.tags.length - 3}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <Modal
          visible={showDocumentModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDocumentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle} numberOfLines={2}>
                  {selectedDocument.document_name}
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDocumentModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Document Preview */}
                {selectedDocument.thumbnail_url && (
                  <Image
                    source={{ uri: selectedDocument.thumbnail_url }}
                    style={styles.documentPreview}
                    resizeMode="contain"
                  />
                )}

                {/* Document Details */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Details</Text>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type:</Text>
                    <View style={styles.detailValue}>
                      <Text style={styles.detailIcon}>
                        {getDocumentTypeIcon(selectedDocument.document_type)}
                      </Text>
                      <Text style={styles.detailText}>
                        {selectedDocument.document_type.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Format:</Text>
                    <View style={styles.detailValue}>
                      <Text style={styles.detailIcon}>
                        {getFileFormatIcon(selectedDocument.file_format)}
                      </Text>
                      <Text style={styles.detailText}>
                        {selectedDocument.file_format.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Size:</Text>
                    <Text style={styles.detailText}>
                      {formatFileSize(selectedDocument.file_size)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Upload Date:</Text>
                    <Text style={styles.detailText}>
                      {formatDate(selectedDocument.upload_date)}
                    </Text>
                  </View>

                  {selectedDocument.uploaded_by && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Uploaded By:</Text>
                      <Text style={styles.detailText}>
                        {selectedDocument.uploaded_by}
                      </Text>
                    </View>
                  )}

                  {selectedDocument.project_name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Project:</Text>
                      <Text style={styles.detailText}>
                        {selectedDocument.project_name}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Views:</Text>
                    <Text style={styles.detailText}>
                      {selectedDocument.view_count}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Downloads:</Text>
                    <Text style={styles.detailText}>
                      {selectedDocument.download_count}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {selectedDocument.description && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                      {selectedDocument.description}
                    </Text>
                  </View>
                )}

                {/* Tags */}
                {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Tags</Text>
                    <View style={styles.modalTagsContainer}>
                      {selectedDocument.tags.map((tag, index) => (
                        <View key={index} style={styles.modalTag}>
                          <Text style={styles.modalTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleShare(selectedDocument)}
                >
                  <Text style={styles.actionButtonIcon}>📤</Text>
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                  onPress={() => handleDownload(selectedDocument)}
                  disabled={downloading === selectedDocument.document_id}
                >
                  {downloading === selectedDocument.document_id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.actionButtonIcon}>⬇️</Text>
                      <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                        Download
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
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
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
  },
  clearIcon: {
    fontSize: 20,
    color: '#999',
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  filterIcon: {
    fontSize: 24,
  },
  filtersPanel: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4CAF50',
  },
  filterChipIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  clearFiltersButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  resultsHeader: {
    padding: 16,
    backgroundColor: '#fff',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  documentCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginRight: 12,
  },
  documentIcon: {
    fontSize: 28,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentProject: {
    fontSize: 13,
    color: '#666',
  },
  documentDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  documentMetadata: {
    marginBottom: 8,
  },
  documentTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  documentTypeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  documentTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  documentStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  documentStat: {
    fontSize: 12,
    color: '#999',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: '#2196F3',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#999',
    paddingVertical: 4,
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
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#666',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  documentPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTag: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  modalTagText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  actionButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  actionButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButtonTextPrimary: {
    color: '#fff',
  },
});

export default TransparencyDocumentViewer;
