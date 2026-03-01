/**
 * Irrigation Schedule Screen
 * Calendar view for irrigation schedules with water usage tracking
 * 
 * Features:
 * - Calendar view for irrigation schedules
 * - Daily/weekly irrigation times
 * - Water usage tracking
 * - Schedule adjustments
 * - Weather-based recommendations
 * - Reminder notifications integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AgricultureStackParamList } from '../../navigation/types';
import irrigationService, {
  IrrigationSchedule,
  IrrigationEvent,
  WaterUsageStats,
} from '../../services/irrigationService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

type IrrigationScheduleRouteProp = RouteProp<AgricultureStackParamList, 'IrrigationSchedule'>;

const IrrigationScheduleScreen: React.FC = () => {
  const route = useRoute<IrrigationScheduleRouteProp>();
  const { farmId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<IrrigationSchedule | null>(null);
  const [stats, setStats] = useState<WaterUsageStats | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (farmId) {
      loadData();
    }
  }, [farmId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [scheduleData, statsData] = await Promise.all([
        irrigationService.getIrrigationSchedule(farmId!),
        irrigationService.getWaterUsageStats(farmId!, 'week'),
      ]);
      setSchedule(scheduleData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading irrigation data:', err);
      setError(err.message || 'Failed to load irrigation schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleEventAction = async (event: IrrigationEvent, action: 'complete' | 'skip') => {
    try {
      const status = action === 'complete' ? 'completed' : 'skipped';
      await irrigationService.updateEventStatus(event.id, status);
      
      Alert.alert(
        'Success',
        `Irrigation event ${action === 'complete' ? 'completed' : 'skipped'} successfully`
      );
      
      await loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update event');
    }
  };

  const handleWeatherAdjustment = async () => {
    try {
      Alert.alert(
        'Adjust for Weather',
        'This will automatically adjust your irrigation schedule based on the weather forecast. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Adjust',
            onPress: async () => {
              const adjustedSchedule = await irrigationService.adjustScheduleForWeather(farmId!);
              setSchedule(adjustedSchedule);
              Alert.alert('Success', 'Schedule adjusted based on weather forecast');
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to adjust schedule');
    }
  };

  const getEventsForDate = (date: string): IrrigationEvent[] => {
    if (!schedule) return [];
    return schedule.events.filter(event => event.date === date);
  };

  const getWeekDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>💧 Water Usage (This Week)</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalUsage.toLocaleString()}L</Text>
            <Text style={styles.statLabel}>Total Usage</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.averageDaily.toFixed(0)}L</Text>
            <Text style={styles.statLabel}>Daily Average</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.efficiency}%</Text>
            <Text style={styles.statLabel}>Efficiency</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{stats.costEstimate}</Text>
            <Text style={styles.statLabel}>Est. Cost</Text>
          </View>
        </View>
        {stats.comparison && (
          <View style={styles.comparisonContainer}>
            <Text style={styles.comparisonText}>
              {stats.comparison.change > 0 ? '📈' : '📉'}{' '}
              {Math.abs(stats.comparison.change)}% vs last week
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderScheduleInfo = () => {
    if (!schedule) return null;

    return (
      <View style={styles.scheduleInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Crop:</Text>
          <Text style={styles.infoValue}>{schedule.cropType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Frequency:</Text>
          <Text style={styles.infoValue}>{schedule.frequency}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Weather Adjustments:</Text>
          <Text style={styles.infoValue}>
            {schedule.weatherBasedAdjustments ? 'Enabled ✓' : 'Disabled'}
          </Text>
        </View>
      </View>
    );
  };

  const renderWeekCalendar = () => {
    const weekDates = getWeekDates();

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarTitle}>📅 This Week</Text>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={handleWeatherAdjustment}
          >
            <Text style={styles.adjustButtonText}>⛅ Adjust for Weather</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weekDates.map((date, index) => {
            const dateObj = new Date(date);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dateObj.getDate();
            const isToday = date === new Date().toISOString().split('T')[0];
            const events = getEventsForDate(date);

            return (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dayCard,
                  isToday && styles.dayCardToday,
                  selectedDate === date && styles.dayCardSelected,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                  {dayName}
                </Text>
                <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                  {dayNum}
                </Text>
                {events.length > 0 && (
                  <View style={styles.eventIndicator}>
                    <Text style={styles.eventCount}>{events.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderEventCard = (event: IrrigationEvent) => {
    const statusColors = {
      scheduled: '#2196F3',
      completed: '#4CAF50',
      skipped: '#FF9800',
      missed: '#F44336',
    };

    const statusLabels = {
      scheduled: 'Scheduled',
      completed: 'Completed',
      skipped: 'Skipped',
      missed: 'Missed',
    };

    const methodIcons = {
      drip: '💧',
      sprinkler: '🚿',
      flood: '🌊',
      manual: '🪣',
    };

    return (
      <View key={event.id} style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTime}>
            <Text style={styles.eventTimeText}>{event.time}</Text>
            <Text style={styles.eventDuration}>{event.duration} min</Text>
          </View>
          <View style={[styles.eventStatus, { backgroundColor: statusColors[event.status] }]}>
            <Text style={styles.eventStatusText}>{statusLabels[event.status]}</Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>{methodIcons[event.method]}</Text>
            <Text style={styles.eventDetailText}>{event.method}</Text>
          </View>
          <View style={styles.eventDetailRow}>
            <Text style={styles.eventDetailIcon}>💦</Text>
            <Text style={styles.eventDetailText}>{event.waterAmount}L</Text>
          </View>
          {event.weatherAdjusted && (
            <View style={styles.weatherBadge}>
              <Text style={styles.weatherBadgeText}>⛅ Weather Adjusted</Text>
            </View>
          )}
        </View>

        {event.notes && (
          <Text style={styles.eventNotes}>📝 {event.notes}</Text>
        )}

        {event.status === 'scheduled' && (
          <View style={styles.eventActions}>
            <TouchableOpacity
              style={[styles.eventActionButton, styles.completeButton]}
              onPress={() => handleEventAction(event, 'complete')}
            >
              <Text style={styles.eventActionText}>✓ Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.eventActionButton, styles.skipButton]}
              onPress={() => handleEventAction(event, 'skip')}
            >
              <Text style={styles.eventActionText}>⊘ Skip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderEvents = () => {
    const events = getEventsForDate(selectedDate);

    if (events.length === 0) {
      return (
        <View style={styles.noEventsContainer}>
          <Text style={styles.noEventsIcon}>📅</Text>
          <Text style={styles.noEventsText}>No irrigation scheduled for this day</Text>
        </View>
      );
    }

    return (
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>
          Irrigation Events - {new Date(selectedDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        {events.map(renderEventCard)}
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Loading irrigation schedule..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  if (!schedule) {
    return (
      <ErrorState
        message="No irrigation schedule found for this farm"
        onRetry={loadData}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {renderStats()}
        {renderScheduleInfo()}
        {renderWeekCalendar()}
        {renderEvents()}
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
  statsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  comparisonContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  comparisonText: {
    fontSize: 13,
    color: '#666',
  },
  scheduleInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  adjustButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adjustButtonText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  dayCard: {
    width: 70,
    padding: 12,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardToday: {
    backgroundColor: '#E8F5E9',
  },
  dayCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#fff',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dayNameToday: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dayNumberToday: {
    color: '#2E7D32',
  },
  eventIndicator: {
    marginTop: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventsContainer: {
    marginBottom: 16,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventTime: {
    flex: 1,
  },
  eventTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  eventDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  eventStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
  },
  weatherBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weatherBadgeText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '600',
  },
  eventNotes: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  eventActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  eventActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    backgroundColor: '#FF9800',
  },
  eventActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noEventsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noEventsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noEventsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default IrrigationScheduleScreen;
