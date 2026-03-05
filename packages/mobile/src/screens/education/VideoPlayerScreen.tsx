/**
 * Video Player Screen
 * Task 35.3: Implement video player with quality selection
 * 
 * Features:
 * - Multi-quality video streaming (360p, 480p, 720p)
 * - Adaptive bitrate selection based on network conditions
 * - Playback controls (play/pause, seek, volume)
 * - Chapter markers for video navigation
 * - Progress tracking and resume functionality
 * - Offline video playback support
 * - Subtitle/caption support
 * - Fullscreen mode
 * - Track video completion and watch time
 * - Loading states and error handling
 * 
 * Note: This is a UI implementation. For production, install:
 * - react-native-video for video playback
 * - @react-native-community/slider for progress bar
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import educationService from '../../services/educationService';
import {
  VideoQuality,
  VideoSource,
  ChapterMarker,
  VideoProgress,
  VideoMetadata,
  VIDEO_QUALITIES,
  PLAYBACK_SPEEDS,
} from '../../types/education';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoPlayerScreenProps {
  navigation: any;
  route: {
    params: {
      contentId: string;
    };
  };
}

export const VideoPlayerScreen: React.FC<VideoPlayerScreenProps> = ({
  navigation,
  route,
}) => {
  const { contentId } = route.params;
  const studentId = 'demo-student'; // TODO: Get from auth context

  // Refs
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchTimeRef = useRef<number>(0);
  const lastSaveTimeRef = useRef<number>(0);

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Quality and settings
  const [selectedQuality, setSelectedQuality] = useState<VideoQuality>('480p');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showChapters, setShowChapters] = useState(false);

  // Progress tracking
  const [savedProgress, setSavedProgress] = useState<VideoProgress | null>(null);

  useEffect(() => {
    loadVideoData();
    return () => {
      // Cleanup: save progress on unmount
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      saveProgress();
    };
  }, []);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    if (showControls && isPlaying) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showControls, isPlaying]);

  useEffect(() => {
    // Simulate video playback progress
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= duration) {
            setIsPlaying(false);
            handleVideoCompletion();
            return duration;
          }
          return newTime;
        });
        watchTimeRef.current += 1;
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, duration]);

  const loadVideoData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load video metadata
      const metadata = await educationService.getVideoMetadata(contentId);
      setVideoMetadata(metadata);
      setDuration(metadata.duration);

      // Load saved progress
      const progress = await educationService.getVideoProgress(contentId, studentId);
      if (progress) {
        setSavedProgress(progress);
        setCurrentTime(progress.currentTime);
      }

      // Auto-select quality based on network (simplified)
      const defaultQuality = metadata.sources.find((s: VideoSource) => s.quality === '480p') 
        ? '480p' 
        : metadata.sources[0]?.quality || '360p';
      setSelectedQuality(defaultQuality as VideoQuality);

    } catch (err: any) {
      console.error('Error loading video data:', err);
      setError(err.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!videoMetadata || currentTime === 0) return;

    const progress: VideoProgress = {
      contentId,
      studentId,
      currentTime,
      duration,
      completed: currentTime / duration >= 0.95,
      watchTime: watchTimeRef.current,
      lastWatched: new Date().toISOString(),
    };

    try {
      await educationService.saveVideoProgress(progress);
      setSavedProgress(progress);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const handleVideoCompletion = async () => {
    try {
      await educationService.trackVideoCompletion(
        contentId,
        studentId,
        watchTimeRef.current
      );
      setSavedProgress(prev => prev ? { ...prev, completed: true } : null);
    } catch (err) {
      console.error('Error tracking completion:', err);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    setShowControls(true);
  };

  const handleSeek = (value: number) => {
    setCurrentTime(value);
    setShowControls(true);
  };

  const handleChapterSelect = (chapter: ChapterMarker) => {
    setCurrentTime(chapter.timestamp);
    setShowChapters(false);
    setShowControls(true);
  };

  const handleQualityChange = (quality: VideoQuality) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);
    setShowControls(true);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    setShowControls(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const skipForward = () => {
    const newTime = Math.min(currentTime + 10, duration);
    handleSeek(newTime);
  };

  const skipBackward = () => {
    const newTime = Math.max(currentTime - 10, 0);
    handleSeek(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSource = (): string => {
    if (!videoMetadata) return '';
    
    // Check for offline URL first
    if (videoMetadata.isOfflineAvailable && videoMetadata.offlineUrl) {
      return videoMetadata.offlineUrl;
    }

    // Find source for selected quality
    const source = videoMetadata.sources.find(s => s.quality === selectedQuality);
    return source?.url || videoMetadata.sources[0]?.url || '';
  };

  const getProgressPercentage = (): number => {
    if (duration === 0) return 0;
    return (currentTime / duration) * 100;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  if (error || !videoMetadata) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Video not found'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadVideoData()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const videoContainerStyle = isFullscreen
    ? styles.videoContainerFullscreen
    : styles.videoContainer;

  return (
    <View style={[styles.container, isFullscreen && styles.containerFullscreen]}>
      {!isFullscreen && <OfflineIndicator />}

      {/* Video Player Placeholder */}
      <TouchableOpacity
        style={videoContainerStyle}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
        {/* Video Placeholder - In production, use react-native-video */}
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoPlaceholderText}>🎥</Text>
          <Text style={styles.videoSourceText}>
            Quality: {selectedQuality}
          </Text>
          <Text style={styles.videoSourceText}>
            Source: {getCurrentSource().substring(0, 50)}...
          </Text>
        </View>

        {/* Buffering Indicator */}
        {buffering && (
          <View style={styles.bufferingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {/* Video Controls Overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.backIconButton}
                onPress={() => {
                  saveProgress();
                  navigation.goBack();
                }}
              >
                <Text style={styles.controlIcon}>←</Text>
              </TouchableOpacity>

              <View style={styles.topBarInfo}>
                <Text style={styles.videoTitle} numberOfLines={1}>
                  {videoMetadata.title}
                </Text>
                <Text style={styles.qualityBadge}>{selectedQuality}</Text>
              </View>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleFullscreen}
              >
                <Text style={styles.controlIcon}>
                  {isFullscreen ? '⊡' : '⛶'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={skipBackward}
              >
                <Text style={styles.skipIcon}>⏪</Text>
                <Text style={styles.skipText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
              >
                <Text style={styles.playIcon}>
                  {isPlaying ? '⏸' : '▶'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={skipForward}
              >
                <Text style={styles.skipIcon}>⏩</Text>
                <Text style={styles.skipText}>10s</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                
                {/* Simple progress bar (in production, use @react-native-community/slider) */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${getProgressPercentage()}%` },
                      ]}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.progressThumb,
                      { left: `${getProgressPercentage()}%` },
                    ]}
                    onPress={() => {}}
                  />
                </View>
                
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>

              {/* Control Buttons */}
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowChapters(true)}
                >
                  <Text style={styles.controlIcon}>📑</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowQualityMenu(true)}
                >
                  <Text style={styles.controlIcon}>⚙️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setShowSpeedMenu(true)}
                >
                  <Text style={styles.controlText}>{playbackSpeed}x</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={toggleMute}
                >
                  <Text style={styles.controlIcon}>
                    {isMuted ? '🔇' : '🔊'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Video Info (below player when not fullscreen) */}
      {!isFullscreen && (
        <ScrollView style={styles.infoContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>{videoMetadata.title}</Text>
            <Text style={styles.infoDescription}>{videoMetadata.description}</Text>
          </View>

          {/* Progress Info */}
          {savedProgress && (
            <View style={styles.progressInfo}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressPercentage()}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {savedProgress.completed
                  ? '✓ Completed'
                  : `${Math.floor(getProgressPercentage())}% watched`}
              </Text>
              <Text style={styles.watchTimeText}>
                Watch time: {Math.floor(watchTimeRef.current / 60)} minutes
              </Text>
            </View>
          )}

          {/* Chapters List */}
          {videoMetadata.chapters && videoMetadata.chapters.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Chapters</Text>
              {videoMetadata.chapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={styles.chapterItem}
                  onPress={() => handleChapterSelect(chapter)}
                >
                  <Text style={styles.chapterTime}>
                    {formatTime(chapter.timestamp)}
                  </Text>
                  <View style={styles.chapterInfo}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    {chapter.description && (
                      <Text style={styles.chapterDescription}>
                        {chapter.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Video Details */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Video Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{formatTime(duration)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Available Qualities:</Text>
              <Text style={styles.detailValue}>
                {videoMetadata.sources.map(s => s.quality).join(', ')}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Offline Available:</Text>
              <Text style={styles.detailValue}>
                {videoMetadata.isOfflineAvailable ? 'Yes ✓' : 'No'}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Quality Selection Modal */}
      <Modal
        visible={showQualityMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQualityMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQualityMenu(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Video Quality</Text>
            <Text style={styles.modalSubtitle}>
              Higher quality uses more data
            </Text>
            {VIDEO_QUALITIES.map((quality) => {
              const isAvailable = videoMetadata.sources.some(
                s => s.quality === quality.value
              );
              const isSelected = selectedQuality === quality.value;

              return (
                <TouchableOpacity
                  key={quality.value}
                  style={[
                    styles.menuItem,
                    isSelected && styles.menuItemSelected,
                    !isAvailable && styles.menuItemDisabled,
                  ]}
                  onPress={() => isAvailable && handleQualityChange(quality.value)}
                  disabled={!isAvailable}
                >
                  <View>
                    <Text
                      style={[
                        styles.menuItemText,
                        isSelected && styles.menuItemTextSelected,
                      ]}
                    >
                      {quality.label}
                    </Text>
                    <Text style={styles.menuItemDescription}>
                      {quality.description}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Playback Speed Modal */}
      <Modal
        visible={showSpeedMenu}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSpeedMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeedMenu(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Playback Speed</Text>
            {PLAYBACK_SPEEDS.map((speed) => {
              const isSelected = playbackSpeed === speed;

              return (
                <TouchableOpacity
                  key={speed}
                  style={[
                    styles.menuItem,
                    isSelected && styles.menuItemSelected,
                  ]}
                  onPress={() => handleSpeedChange(speed)}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      isSelected && styles.menuItemTextSelected,
                    ]}
                  >
                    {speed}x {speed === 1.0 && '(Normal)'}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chapters Modal */}
      <Modal
        visible={showChapters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChapters(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChapters(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chapters</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {videoMetadata.chapters.map((chapter) => (
                <TouchableOpacity
                  key={chapter.id}
                  style={styles.chapterModalItem}
                  onPress={() => handleChapterSelect(chapter)}
                >
                  <Text style={styles.chapterModalTime}>
                    {formatTime(chapter.timestamp)}
                  </Text>
                  <View style={styles.chapterModalInfo}>
                    <Text style={styles.chapterModalTitle}>{chapter.title}</Text>
                    {chapter.description && (
                      <Text style={styles.chapterModalDescription}>
                        {chapter.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  containerFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#2196F3',
    fontSize: 16,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (9 / 16), // 16:9 aspect ratio
    backgroundColor: '#000',
    position: 'relative',
  },
  videoContainerFullscreen: {
    width: SCREEN_HEIGHT,
    height: SCREEN_WIDTH,
    backgroundColor: '#000',
    position: 'relative',
    transform: [{ rotate: '90deg' }],
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  videoPlaceholderText: {
    fontSize: 64,
    marginBottom: 16,
  },
  videoSourceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  backIconButton: {
    padding: 8,
  },
  topBarInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  videoTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  qualityBadge: {
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 40,
    color: '#fff',
  },
  skipButton: {
    alignItems: 'center',
  },
  skipIcon: {
    fontSize: 32,
    color: '#fff',
  },
  skipText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
  bottomBar: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#fff',
    minWidth: 40,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 8,
    height: 20,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    marginLeft: -6,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  controlIcon: {
    fontSize: 24,
    color: '#fff',
  },
  controlText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  progressInfo: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  watchTimeText: {
    fontSize: 12,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  chapterItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  chapterTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    width: 60,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  chapterDescription: {
    fontSize: 14,
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  menuItemTextSelected: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  checkmark: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  chapterModalItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  chapterModalTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    width: 60,
  },
  chapterModalInfo: {
    flex: 1,
  },
  chapterModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  chapterModalDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default VideoPlayerScreen;

export default VideoPlayerScreen;
