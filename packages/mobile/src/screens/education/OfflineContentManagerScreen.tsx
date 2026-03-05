/**
 * Offline Content Manager Screen
 * Task 35.8: Build offline content download manager
 * 
 * Features:
 * - Display list of available content for download
 * - Show download status (not downloaded, downloading, downloaded)
 * - Display download progress with percentage and size
 * - Allow users to download content for offline use
 * - Support pausing and resuming downloads
 * - Allow deleting downloaded content to free up space
 * - Show storage usage and available space
 * - Support quality selection for video downloads (360p, 480p, 720p)
 * - Display estimated download size before downloading
 * - Group content by subject or type
 * - Show downloaded content with offline indicator
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import educationService from '../../services/educationService';
import {
  ContentItem,
  Subject,
  VideoQuality,
  SUBJECTS,
  VIDEO_QUALITIES,
} from '../../types/education';

type DownloadStatus = 'not_downloaded' | 'downloading' | 'paused' | 'downloaded' | 'failed';

interface DownloadItem extends ContentItem {
  downloadStatus: DownloadStatus;
  downloadProgress: number; // 0-100
  downloadedSize: number; // in MB
  totalSize: number; // in MB
  selectedQuality?: VideoQuality;
  downloadSpeed?: number; // in MB/s
  estimatedTimeRemaining?: number; // in seconds
}

interface StorageInfo {
  totalSpace: number; // in MB
  usedSpace: number; // in MB
  availableSpace: number; // in MB
  downloadedContentSize: number; // in MB
}

interface OfflineContentManagerScreenProps {
  navigation: any;
  route: {
    params?: {
      studentId: string;
    };
  };
}

export const OfflineContentManagerScreen: React.FC<OfflineContentManagerScreenProps> = ({
  navigation,
  route,
}) => {
  const studentId = route.params?.studentId || 'demo-student';

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadItems, setDownloadItems] = useState<DownloadItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    totalSpace: 8000, // 8GB
    usedSpace: 3200,
    availableSpace: 4800,
    downloadedContentSize: 450,
  });
  
  // Filters
  const [selectedTab, setSelectedTab] = useState<'available' | 'downloaded'>('available');
  const [selectedSubject, setSelectedSubject] = useState<Subject | 'all'>('all');
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [selectedItemForQuality, setSelectedItemForQuality] = useState<DownloadItem | null>(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available content
      const result = await educationService.searchContent({
        limit: 50,
      });

      // Transform to download items with mock download status
      const items: DownloadItem[] = result.items.map((item, index) => ({
        ...item,
        downloadStatus: item.isOfflineAvailable 
          ? 'downloaded' 
          : index % 5 === 0 
            ? 'downloading' 
            : 'not_downloaded',
        downloadProgress: item.isOfflineAvailable ? 100 : index % 5 === 0 ? 45 : 0,
        downloadedSize: item.isOfflineAvailable ? getEstimatedSize(item, '480p') : 0,
        totalSize: getEstimatedSize(item, '480p'),
        selectedQuality: '480p',
      }));

      setDownloadItems(items);
    } catch (err: any) {
      console.error('Error loading content:', err);
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const getEstimatedSize = (item: ContentItem, quality: VideoQuality): number => {
    // Estimate video size based on duration and quality
    const durationInMinutes = item.duration;
    const bitrateMap: { [key in VideoQuality]: number } = {
      '360p': 0.5, // MB per minute
      '480p': 1.0,
      '720p': 2.5,
    };
    return Math.round(durationInMinutes * bitrateMap[quality]);
  };

  const handleDownload = (item: DownloadItem) => {
    if (item.downloadStatus === 'not_downloaded' || item.downloadStatus === 'failed') {
      // Show quality selection modal
      setSelectedItemForQuality(item);
      setShowQualityModal(true);
    } else if (item.downloadStatus === 'downloading') {
      // Pause download
      handlePauseDownload(item);
    } else if (item.downloadStatus === 'paused') {
      // Resume download
      handleResumeDownload(item);
    }
  };

  const startDownload = (item: DownloadItem, quality: VideoQuality) => {
    const estimatedSize = getEstimatedSize(item, quality);
    
    // Check available space
    if (estimatedSize > storageInfo.availableSpace) {
      Alert.alert(
        'Insufficient Storage',
        `This download requires ${estimatedSize}MB but you only have ${storageInfo.availableSpace}MB available. Please free up some space.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Update item status
    setDownloadItems(prev =>
      prev.map(i =>
        i.id === item.id
          ? {
              ...i,
              downloadStatus: 'downloading',
              downloadProgress: 0,
              selectedQuality: quality,
              totalSize: estimatedSize,
              downloadSpeed: 0.5, // Mock speed
            }
          : i
      )
    );

    // Simulate download progress
    simulateDownload(item.id);
  };

  const simulateDownload = (itemId: string) => {
    const interval = setInterval(() => {
      setDownloadItems(prev => {
        const item = prev.find(i => i.id === itemId);
        if (!item || item.downloadStatus !== 'downloading') {
          clearInterval(interval);
          return prev;
        }

        const newProgress = Math.min(item.downloadProgress + 5, 100);
        const newDownloadedSize = (newProgress / 100) * item.totalSize;

        if (newProgress >= 100) {
          clearInterval(interval);
          // Update storage info
          setStorageInfo(prevStorage => ({
            ...prevStorage,
            usedSpace: prevStorage.usedSpace + item.totalSize,
            availableSpace: prevStorage.availableSpace - item.totalSize,
            downloadedContentSize: prevStorage.downloadedContentSize + item.totalSize,
          }));
        }

        return prev.map(i =>
          i.id === itemId
            ? {
                ...i,
                downloadProgress: newProgress,
                downloadedSize: newDownloadedSize,
                downloadStatus: newProgress >= 100 ? 'downloaded' : 'downloading',
                isOfflineAvailable: newProgress >= 100,
              }
            : i
        );
      });
    }, 1000);
  };

  const handlePauseDownload = (item: DownloadItem) => {
    setDownloadItems(prev =>
      prev.map(i =>
        i.id === item.id
          ? { ...i, downloadStatus: 'paused' }
          : i
      )
    );
  };

  const handleResumeDownload = (item: DownloadItem) => {
    setDownloadItems(prev =>
      prev.map(i =>
        i.id === item.id
          ? { ...i, downloadStatus: 'downloading' }
          : i
      )
    );
    simulateDownload(item.id);
  };

  const handleDelete = (item: DownloadItem) => {
    Alert.alert(
      'Delete Downloaded Content',
      `Are you sure you want to delete "${item.title}"? This will free up ${item.downloadedSize.toFixed(1)}MB of storage.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDownloadItems(prev =>
              prev.map(i =>
                i.id === item.id
                  ? {
                      ...i,
                      downloadStatus: 'not_downloaded',
                      downloadProgress: 0,
                      downloadedSize: 0,
                      isOfflineAvailable: false,
                    }
                  : i
              )
            );

            // Update storage info
            setStorageInfo(prevStorage => ({
              ...prevStorage,
              usedSpace: prevStorage.usedSpace - item.downloadedSize,
              availableSpace: prevStorage.availableSpace + item.downloadedSize,
              downloadedContentSize: prevStorage.downloadedContentSize - item.downloadedSize,
            }));
          },
        },
      ]
    );
  };

  const getFilteredItems = (): DownloadItem[] => {
    let filtered = downloadItems;

    // Filter by tab
    if (selectedTab === 'downloaded') {
      filtered = filtered.filter(item => item.downloadStatus === 'downloaded');
    } else {
      filtered = filtered.filter(item => item.downloadStatus !== 'downloaded');
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(item => item.subject === selectedSubject);
    }

    return filtered;
  };

  const getDownloadButtonText = (status: DownloadStatus): string => {
    switch (status) {
      case 'not_downloaded':
        return 'Download';
      case 'downloading':
        return 'Pause';
      case 'paused':
        return 'Resume';
      case 'downloaded':
        return 'Downloaded';
      case 'failed':
        return 'Retry';
      default:
        return 'Download';
    }
  };

  const getDownloadButtonColor = (status: DownloadStatus): string => {
    switch (status) {
      case 'not_downloaded':
        return '#2196F3';
      case 'downloading':
        return '#FF9800';
      case 'paused':
        return '#2196F3';
      case 'downloaded':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  const formatSize = (mb: number): string => {
    if (mb < 1) {
      return `${(mb * 1024).toFixed(0)}KB`;
    }
    return `${mb.toFixed(1)}MB`;
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const getStoragePercentage = (): number => {
    return (storageInfo.usedSpace / storageInfo.totalSpace) * 100;
  };

  const renderDownloadItem = ({ item }: { item: DownloadItem }) => {
    const isDownloading = item.downloadStatus === 'downloading';
    const isPaused = item.downloadStatus === 'paused';
    const isDownloaded = item.downloadStatus === 'downloaded';

    return (
      <View style={styles.downloadCard}>
        {/* Content Info */}
        <View style={styles.contentHeader}>
          <View style={styles.contentIcon}>
            <Text style={styles.contentIconText}>🎥</Text>
          </View>
          
          <View style={styles.contentInfo}>
            <Text style={styles.contentTitle} numberOfLines={2}>
              {item.title}
            </Text>
            
            <View style={styles.contentMeta}>
              <Text style={styles.metaText}>
                {SUBJECTS.find(s => s.value === item.subject)?.label}
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>
                {item.duration}m
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaText}>
                {formatSize(item.totalSize)}
              </Text>
            </View>

            {item.selectedQuality && (
              <View style={styles.qualityBadge}>
                <Text style={styles.qualityText}>{item.selectedQuality}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Download Progress */}
        {(isDownloading || isPaused) && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${item.downloadProgress}%` },
                ]}
              />
            </View>
            
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {item.downloadProgress}% • {formatSize(item.downloadedSize)} / {formatSize(item.totalSize)}
              </Text>
              {isDownloading && item.downloadSpeed && (
                <Text style={styles.speedText}>
                  {formatSize(item.downloadSpeed)}/s
                </Text>
              )}
              {isPaused && (
                <Text style={styles.pausedText}>Paused</Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.downloadButton,
              { backgroundColor: getDownloadButtonColor(item.downloadStatus) },
              isDownloaded && styles.downloadedButton,
            ]}
            onPress={() => handleDownload(item)}
            disabled={isDownloaded}
          >
            <Text style={styles.downloadButtonText}>
              {getDownloadButtonText(item.downloadStatus)}
            </Text>
          </TouchableOpacity>

          {isDownloaded && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderQualityModal = () => (
    <Modal
      visible={showQualityModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowQualityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Video Quality</Text>
          <Text style={styles.modalSubtitle}>
            Higher quality uses more storage space
          </Text>

          {selectedItemForQuality && (
            <View style={styles.qualityOptions}>
              {VIDEO_QUALITIES.map((quality) => {
                const size = getEstimatedSize(selectedItemForQuality, quality.value);
                
                return (
                  <TouchableOpacity
                    key={quality.value}
                    style={styles.qualityOption}
                    onPress={() => {
                      startDownload(selectedItemForQuality, quality.value);
                      setShowQualityModal(false);
                      setSelectedItemForQuality(null);
                    }}
                  >
                    <View style={styles.qualityOptionHeader}>
                      <Text style={styles.qualityOptionLabel}>{quality.label}</Text>
                      <Text style={styles.qualityOptionSize}>{formatSize(size)}</Text>
                    </View>
                    <Text style={styles.qualityOptionDescription}>
                      {quality.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowQualityModal(false);
              setSelectedItemForQuality(null);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offline Downloads</Text>
        <Text style={styles.headerSubtitle}>
          Manage your offline content
        </Text>
      </View>

      {/* Storage Info */}
      <View style={styles.storageCard}>
        <View style={styles.storageHeader}>
          <Text style={styles.storageTitle}>Storage Usage</Text>
          <Text style={styles.storageValue}>
            {formatSize(storageInfo.usedSpace)} / {formatSize(storageInfo.totalSpace)}
          </Text>
        </View>

        <View style={styles.storageBar}>
          <View
            style={[
              styles.storageBarFill,
              { width: `${getStoragePercentage()}%` },
            ]}
          />
        </View>

        <View style={styles.storageDetails}>
          <View style={styles.storageDetailItem}>
            <Text style={styles.storageDetailLabel}>Available</Text>
            <Text style={styles.storageDetailValue}>
              {formatSize(storageInfo.availableSpace)}
            </Text>
          </View>
          <View style={styles.storageDetailItem}>
            <Text style={styles.storageDetailLabel}>Downloaded Content</Text>
            <Text style={styles.storageDetailValue}>
              {formatSize(storageInfo.downloadedContentSize)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'available' && styles.tabActive]}
          onPress={() => setSelectedTab('available')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'available' && styles.tabTextActive,
            ]}
          >
            Available
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'downloaded' && styles.tabActive]}
          onPress={() => setSelectedTab('downloaded')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'downloaded' && styles.tabTextActive,
            ]}
          >
            Downloaded
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subject Filter */}
      <ScrollView
        horizontal
        style={styles.subjectFilter}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.subjectChip,
            selectedSubject === 'all' && styles.subjectChipActive,
          ]}
          onPress={() => setSelectedSubject('all')}
        >
          <Text
            style={[
              styles.subjectChipText,
              selectedSubject === 'all' && styles.subjectChipTextActive,
            ]}
          >
            All Subjects
          </Text>
        </TouchableOpacity>

        {SUBJECTS.map((subject) => (
          <TouchableOpacity
            key={subject.value}
            style={[
              styles.subjectChip,
              selectedSubject === subject.value && styles.subjectChipActive,
            ]}
            onPress={() => setSelectedSubject(subject.value)}
          >
            <Text style={styles.subjectChipIcon}>{subject.icon}</Text>
            <Text
              style={[
                styles.subjectChipText,
                selectedSubject === subject.value && styles.subjectChipTextActive,
              ]}
            >
              {subject.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadContent()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content List */}
      {!error && (
        <FlatList
          data={filteredItems}
          renderItem={renderDownloadItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.contentList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>
                {selectedTab === 'downloaded' ? '📥' : '📚'}
              </Text>
              <Text style={styles.emptyText}>
                {selectedTab === 'downloaded'
                  ? 'No downloaded content'
                  : 'No content available'}
              </Text>
              <Text style={styles.emptySubtext}>
                {selectedTab === 'downloaded'
                  ? 'Download content to access it offline'
                  : 'Try adjusting your filters'}
              </Text>
            </View>
          }
        />
      )}

      {/* Quality Selection Modal */}
      {renderQualityModal()}
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
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E3F2FD',
  },
  storageCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  storageBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  storageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storageDetailItem: {
    flex: 1,
  },
  storageDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  storageDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  subjectFilter: {
    marginTop: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  subjectChipActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  subjectChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  subjectChipText: {
    fontSize: 14,
    color: '#666',
  },
  subjectChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: {
    fontSize: 14,
    color: '#C62828',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contentList: {
    padding: 16,
  },
  downloadCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  contentIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentIconText: {
    fontSize: 32,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  metaDot: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 6,
  },
  qualityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  speedText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  pausedText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  downloadButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadedButton: {
    opacity: 0.7,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  qualityOptions: {
    marginBottom: 16,
  },
  qualityOption: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
  },
  qualityOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  qualityOptionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  qualityOptionSize: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  qualityOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default OfflineContentManagerScreen;

export default OfflineContentManagerScreen;
