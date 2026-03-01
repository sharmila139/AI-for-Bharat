/**
 * Weather Alerts Screen
 * Display weather alerts with severity levels and actionable recommendations
 * 
 * Features:
 * - Display weather alerts in-app
 * - Alert types: frost, heavy rain, heatwave, storm
 * - Severity levels with color coding
 * - Actionable recommendations
 * - Alert history
 * - Notification preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AgricultureStackNavigationProp } from '../../navigation/types';
import weatherService, { WeatherAlert, WeatherLocation } from '../../services/weatherService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

const WeatherAlertsScreen: React.FC = () => {
  const navigation = useNavigation<AgricultureStackNavigationProp>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'history'>('active');
  const [location] = useState<WeatherLocation>({
    latitude: 0,
    longitude: 0,
    name: 'Current Location',
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const alertsData = await weatherService.getWeatherAlerts(location);
      setAlerts(alertsData);
    } catch (err: any) {
      console.error('Error loading weather alerts:', err);
      setError(err.message || 'Failed to load weather alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const getFilteredAlerts = (): WeatherAlert[] => {
    switch (filter) {
      case 'active':
        return alerts.filter(alert => alert.isActive);
      case 'history':
        return alerts.filter(alert => !alert.isActive);
      default:
        return alerts;
    }
  };

  const renderAlertCard = (alert: WeatherAlert) => {
    const severityColor = weatherService.getSeverityColor(alert.severity);
    const alertIcon = weatherService.getAlertIcon(alert.type);

    return (
      <TouchableOpacity
        key={alert.id}
        style={[styles.alertCard, { borderLeftColor: severityColor }]}
        onPress={() => showAlertDetails(alert)}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertTitleContainer}>
            <Text style={styles.alertIcon}>{alertIcon}</Text>
            <View style={styles.alertTitleText}>
              <Text style={[styles.alertTitle, { color: severityColor }]}>
                {alert.title}
              </Text>
              <Text style={styles.alertType}>{alert.type.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
          <View style={[styles.severityBadge, { backgroundColor: severityColor }]}>
            <Text style={styles.severityText}>{alert.severity.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.alertDescription} numberOfLines={2}>
          {alert.description}
        </Text>

        <View style={styles.alertMeta}>
          <Text style={styles.alertTime}>
            Valid: {new Date(alert.validFrom).toLocaleDateString()} -{' '}
            {new Date(alert.validUntil).toLocaleDateString()}
          </Text>
          {!alert.isActive && (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>Expired</Text>
            </View>
          )}
        </View>

        {alert.advisories.length > 0 && (
          <View style={styles.advisoriesPreview}>
            <Text style={styles.advisoriesCount}>
              {alert.advisories.length} recommendation{alert.advisories.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.viewDetails}>View Details →</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const showAlertDetails = (alert: WeatherAlert) => {
    const severityColor = weatherService.getSeverityColor(alert.severity);
    const alertIcon = weatherService.getAlertIcon(alert.type);

    Alert.alert(
      `${alertIcon} ${alert.title}`,
      `${alert.description}\n\n` +
        `Severity: ${alert.severity.toUpperCase()}\n` +
        `Valid: ${new Date(alert.validFrom).toLocaleDateString()} - ${new Date(alert.validUntil).toLocaleDateString()}\n\n` +
        `Recommendations:\n${alert.advisories.map((a, i) => `${i + 1}. ${a}`).join('\n')}` +
        (alert.cropSpecific.length > 0
          ? `\n\nCrop-Specific Actions:\n${alert.cropSpecific.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
          : '') +
        (alert.affectedAreas.length > 0
          ? `\n\nAffected Areas: ${alert.affectedAreas.join(', ')}`
          : ''),
      [
        {
          text: 'Dismiss',
          style: 'cancel',
        },
        {
          text: 'View Weather',
          onPress: () => navigation.navigate('WeatherDashboard'),
        },
      ]
    );
  };

  const renderFilterTabs = () => {
    return (
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
            Active
          </Text>
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {alerts.filter(a => a.isActive).length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'history' && styles.filterTabActive]}
          onPress={() => setFilter('history')}
        >
          <Text style={[styles.filterText, filter === 'history' && styles.filterTextActive]}>
            History
          </Text>
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {alerts.filter(a => !a.isActive).length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{alerts.length}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAlertTypes = () => {
    const alertTypes = [
      { type: 'frost', icon: '❄️', label: 'Frost', color: '#3B82F6' },
      { type: 'heavy_rain', icon: '🌧️', label: 'Heavy Rain', color: '#6366F1' },
      { type: 'heatwave', icon: '🌡️', label: 'Heatwave', color: '#EF4444' },
      { type: 'storm', icon: '⛈️', label: 'Storm', color: '#8B5CF6' },
      { type: 'drought', icon: '☀️', label: 'Drought', color: '#F59E0B' },
      { type: 'high_wind', icon: '💨', label: 'High Wind', color: '#10B981' },
      { type: 'pest_risk', icon: '🐛', label: 'Pest Risk', color: '#F97316' },
    ];

    return (
      <View style={styles.alertTypesContainer}>
        <Text style={styles.alertTypesTitle}>Alert Types</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {alertTypes.map(({ type, icon, label, color }) => {
            const count = alerts.filter(a => a.type === type && a.isActive).length;
            return (
              <View key={type} style={[styles.alertTypeCard, { borderColor: color }]}>
                <Text style={styles.alertTypeIcon}>{icon}</Text>
                <Text style={styles.alertTypeLabel}>{label}</Text>
                {count > 0 && (
                  <View style={[styles.alertTypeCount, { backgroundColor: color }]}>
                    <Text style={styles.alertTypeCountText}>{count}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Loading weather alerts..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadAlerts} />;
  }

  const filteredAlerts = getFilteredAlerts();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderAlertTypes()}
        {renderFilterTabs()}

        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              {filter === 'active' ? '✅' : '📋'}
            </Text>
            <Text style={styles.emptyTitle}>
              {filter === 'active' ? 'No Active Alerts' : 'No Alerts in History'}
            </Text>
            <Text style={styles.emptyDescription}>
              {filter === 'active'
                ? 'Great! There are no active weather alerts for your area.'
                : 'No past alerts to display.'}
            </Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {filteredAlerts.map(renderAlertCard)}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ About Weather Alerts</Text>
          <Text style={styles.infoText}>
            Weather alerts are generated based on forecast data and critical thresholds. You'll
            receive notifications for severe weather conditions that may affect your crops.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              Alert.alert(
                'Notification Settings',
                'Configure your weather alert notification preferences in Settings.'
              );
            }}
          >
            <Text style={styles.settingsButtonText}>⚙️ Notification Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  alertTypesContainer: {
    marginBottom: 16,
  },
  alertTypesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  alertTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  alertTypeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  alertTypeLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  alertTypeCount: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTypeCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
  },
  alertsList: {
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertTitleContainer: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 8,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  alertTitleText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  alertType: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
  expiredBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expiredText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  advisoriesPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  advisoriesCount: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  viewDetails: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
    marginBottom: 12,
  },
  settingsButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
});

export default WeatherAlertsScreen;
