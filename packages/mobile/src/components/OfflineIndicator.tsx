/**
 * Offline Mode Indicator Component
 * Shows connectivity status and sync information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal
} from 'react-native';
import BackgroundSyncService from '../services/sync/background-sync';
import SyncQueue from '../services/sync/sync-queue';

interface OfflineIndicatorProps {
  showDetails?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  showDetails = false 
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Get initial status
    updateStatus();

    // Setup listeners
    const connectivityListener = (online: boolean) => {
      setIsOnline(online);
      updateStatus();
      
      // Animate indicator
      Animated.timing(fadeAnim, {
        toValue: online ? 0 : 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    };

    const syncListener = () => {
      updateStatus();
    };

    BackgroundSyncService.addConnectivityListener(connectivityListener);
    BackgroundSyncService.addSyncListener(syncListener);

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);

    return () => {
      BackgroundSyncService.removeConnectivityListener(connectivityListener);
      BackgroundSyncService.removeSyncListener(syncListener);
      clearInterval(interval);
    };
  }, []);

  const updateStatus = () => {
    const connectivity = BackgroundSyncService.getConnectivityStatus();
    const syncStatus = BackgroundSyncService.getSyncStatus();
    
    setIsOnline(connectivity.isOnline);
    setIsSyncing(syncStatus.isSyncing);
    setPendingCount(syncStatus.pendingCount);
  };

  const handleSync = async () => {
    if (isOnline && !isSyncing) {
      await BackgroundSyncService.triggerSync();
    }
  };

  const renderBanner = () => {
    if (isOnline && pendingCount === 0) {
      return null; // Don't show anything when online and synced
    }

    return (
      <Animated.View 
        style={[
          styles.banner,
          isOnline ? styles.bannerSyncing : styles.bannerOffline,
          { opacity: fadeAnim }
        ]}
      >
        <View style={styles.bannerContent}>
          <View style={[
            styles.statusDot,
            isOnline ? styles.statusDotOnline : styles.statusDotOffline
          ]} />
          
          <Text style={styles.bannerText}>
            {isOnline 
              ? isSyncing 
                ? 'Syncing...' 
                : `${pendingCount} items pending sync`
              : 'Offline Mode'
            }
          </Text>

          {showDetails && (
            <TouchableOpacity 
              onPress={() => setShowModal(true)}
              style={styles.detailsButton}
            >
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>
          )}

          {isOnline && !isSyncing && pendingCount > 0 && (
            <TouchableOpacity 
              onPress={handleSync}
              style={styles.syncButton}
            >
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderModal = () => {
    const stats = SyncQueue.getQueueStats();

    return (
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sync Status</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Status:</Text>
                <Text style={[
                  styles.statValue,
                  isOnline ? styles.textOnline : styles.textOffline
                ]}>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Pending:</Text>
                <Text style={styles.statValue}>{stats.pending}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Syncing:</Text>
                <Text style={styles.statValue}>{stats.syncing}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Synced:</Text>
                <Text style={styles.statValue}>{stats.synced}</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Failed:</Text>
                <Text style={[styles.statValue, styles.textError]}>
                  {stats.failed}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              {isOnline && !isSyncing && stats.pending > 0 && (
                <TouchableOpacity 
                  onPress={() => {
                    handleSync();
                    setShowModal(false);
                  }}
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                >
                  <Text style={styles.modalButtonTextPrimary}>Sync Now</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                onPress={() => setShowModal(false)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      {renderBanner()}
      {showDetails && renderModal()}
    </>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 15
  },
  bannerOffline: {
    backgroundColor: '#FF9800'
  },
  bannerSyncing: {
    backgroundColor: '#2196F3'
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10
  },
  statusDotOffline: {
    backgroundColor: '#fff'
  },
  statusDotOnline: {
    backgroundColor: '#4CAF50'
  },
  bannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
    marginLeft: 10
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginLeft: 10
  },
  syncButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333'
  },
  statsContainer: {
    marginBottom: 20
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  statLabel: {
    fontSize: 16,
    color: '#666'
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  textOnline: {
    color: '#4CAF50'
  },
  textOffline: {
    color: '#FF9800'
  },
  textError: {
    color: '#F44336'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  modalButtonPrimary: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3'
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  modalButtonTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  }
});

export default OfflineIndicator;
