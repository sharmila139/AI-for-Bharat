/**
 * Weather Dashboard Screen
 * Displays current weather, forecasts, and alerts for farmers
 * Features: current conditions, hourly/daily forecasts, weather alerts, crowd-sourced observations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

// Types
interface WeatherLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

interface HourlyForecast {
  time: Date;
  temperature: { min: number; max: number };
  rainfall: number;
  windSpeed?: number;
  description: string;
}

interface DailyForecast {
  date: Date;
  temperature: { min: number; max: number };
  rainfall: number;
  description: string;
}

interface WeatherAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  advisories: string[];
  validUntil: Date;
}

interface WeatherDashboardProps {
  location?: WeatherLocation;
  onLocationChange?: (location: WeatherLocation) => void;
}

/**
 * Weather Dashboard Screen Component
 * Validates: Requirements 5.2, 5.3, 5.4 - Weather forecasts and alerts
 */
export const WeatherDashboardScreen: React.FC<WeatherDashboardProps> = ({
  location = { latitude: 0, longitude: 0, name: 'Current Location' },
  onLocationChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [selectedTab, setSelectedTab] = useState<'hourly' | 'daily' | 'alerts'>('hourly');

  useEffect(() => {
    loadWeatherData();
  }, [location]);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      // TODO: Integrate with actual weather service
      // For now, using mock data
      await loadMockData();
    } catch (error) {
      Alert.alert('Error', 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = async () => {
    // Mock current weather
    setCurrentWeather({
      temperature: 32,
      feelsLike: 35,
      humidity: 65,
      windSpeed: 12,
      description: 'Partly Cloudy',
      icon: '02d',
    });

    // Mock hourly forecast
    const hourly: HourlyForecast[] = [];
    for (let i = 0; i < 24; i++) {
      hourly.push({
        time: new Date(Date.now() + i * 60 * 60 * 1000),
        temperature: { min: 28 + i % 5, max: 32 + i % 5 },
        rainfall: i % 6 === 0 ? 2 : 0,
        windSpeed: 10 + i % 3,
        description: i % 3 === 0 ? 'Cloudy' : 'Clear',
      });
    }
    setHourlyForecast(hourly);

    // Mock daily forecast
    const daily: DailyForecast[] = [];
    for (let i = 0; i < 7; i++) {
      daily.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        temperature: { min: 25 + i % 3, max: 35 + i % 3 },
        rainfall: i % 3 === 0 ? 5 : 0,
        description: i % 2 === 0 ? 'Partly Cloudy' : 'Clear',
      });
    }
    setDailyForecast(daily);

    // Mock alerts
    setAlerts([
      {
        id: '1',
        type: 'high_temperature',
        severity: 'warning',
        title: 'High Temperature Warning',
        description: 'Temperature expected to reach 38°C in the next 3 days.',
        advisories: [
          'Increase irrigation frequency',
          'Apply mulch to retain soil moisture',
          'Monitor crops for signs of wilting',
        ],
        validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeatherData();
    setRefreshing(false);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#DC2626';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Location Header */}
      <View style={styles.header}>
        <Text style={styles.locationName}>{location?.name || 'Current Location'}</Text>
        <TouchableOpacity onPress={() => onLocationChange?.(location!)}>
          <Text style={styles.changeLocation}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Current Weather */}
      {currentWeather && (
        <View style={styles.currentWeatherCard}>
          <View style={styles.currentWeatherMain}>
            <Text style={styles.temperature}>{Math.round(currentWeather.temperature)}°C</Text>
            <Text style={styles.description}>{currentWeather.description}</Text>
          </View>
          <View style={styles.currentWeatherDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Feels Like</Text>
              <Text style={styles.detailValue}>{Math.round(currentWeather.feelsLike)}°C</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Humidity</Text>
              <Text style={styles.detailValue}>{currentWeather.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Wind</Text>
              <Text style={styles.detailValue}>{currentWeather.windSpeed} m/s</Text>
            </View>
          </View>
        </View>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          {alerts.map((alert: WeatherAlert) => (
            <TouchableOpacity
              key={alert.id}
              style={[styles.alertCard, { borderLeftColor: getSeverityColor(alert.severity) }]}
              onPress={() => {
                Alert.alert(
                  alert.title,
                  `${alert.description}\n\nAdvisories:\n${alert.advisories.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}`
                );
              }}
            >
              <View style={styles.alertHeader}>
                <Text style={[styles.alertTitle, { color: getSeverityColor(alert.severity) }]}>
                  {alert.title}
                </Text>
                <Text style={styles.alertSeverity}>{alert.severity.toUpperCase()}</Text>
              </View>
              <Text style={styles.alertDescription} numberOfLines={2}>
                {alert.description}
              </Text>
              <Text style={styles.alertValidity}>
                Valid until: {formatDate(alert.validUntil)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Forecast Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'hourly' && styles.activeTab]}
          onPress={() => setSelectedTab('hourly')}
        >
          <Text style={[styles.tabText, selectedTab === 'hourly' && styles.activeTabText]}>
            Hourly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'daily' && styles.activeTab]}
          onPress={() => setSelectedTab('daily')}
        >
          <Text style={[styles.tabText, selectedTab === 'daily' && styles.activeTabText]}>
            7-Day
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hourly Forecast */}
      {selectedTab === 'hourly' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
          {hourlyForecast.slice(0, 24).map((forecast: HourlyForecast, index: number) => (
            <View key={index} style={styles.hourlyCard}>
              <Text style={styles.hourlyTime}>{formatTime(forecast.time)}</Text>
              <Text style={styles.hourlyTemp}>{Math.round(forecast.temperature.max)}°</Text>
              <Text style={styles.hourlyDescription}>{forecast.description}</Text>
              {forecast.rainfall > 0 && (
                <Text style={styles.hourlyRain}>💧 {forecast.rainfall}mm</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Daily Forecast */}
      {selectedTab === 'daily' && (
        <View style={styles.dailyForecastContainer}>
          {dailyForecast.map((forecast: DailyForecast, index: number) => (
            <View key={index} style={styles.dailyCard}>
              <Text style={styles.dailyDate}>{formatDate(forecast.date)}</Text>
              <View style={styles.dailyTempContainer}>
                <Text style={styles.dailyTempMax}>{Math.round(forecast.temperature.max)}°</Text>
                <Text style={styles.dailyTempMin}>{Math.round(forecast.temperature.min)}°</Text>
              </View>
              <Text style={styles.dailyDescription}>{forecast.description}</Text>
              {forecast.rainfall > 0 && (
                <Text style={styles.dailyRain}>💧 {forecast.rainfall}mm</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Last Updated */}
      <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleString()}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  locationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  changeLocation: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  currentWeatherCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentWeatherMain: {
    alignItems: 'center',
    marginBottom: 20,
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#111827',
  },
  description: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 8,
  },
  currentWeatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  alertsSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  alertSeverity: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  alertDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  alertValidity: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#10B981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  forecastScroll: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  hourlyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  hourlyTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  hourlyTemp: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  hourlyDescription: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  hourlyRain: {
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 4,
  },
  dailyForecastContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  dailyCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dailyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  dailyTempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  dailyTempMax: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginRight: 8,
  },
  dailyTempMin: {
    fontSize: 16,
    color: '#6B7280',
  },
  dailyDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'right',
  },
  dailyRain: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginVertical: 16,
  },
});

export default WeatherDashboardScreen;
