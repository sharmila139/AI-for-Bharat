/**
 * Project Detail Screen
 * Task 36.8: Build project detail view with milestones
 * 
 * Features:
 * - Display comprehensive project information
 * - Show detailed progress tracking with milestones
 * - Display milestone timeline with completion status
 * - Include funding source breakdown
 * - Show contractor and implementing agency details
 * - Display project updates with photos and timestamps
 * - Include quality inspection reports
 * - Show delay information and reasons if applicable
 * - Display beneficiary information
 * - Add navigation back to dashboard
 * - Follow patterns from GrievanceDetailScreen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Share,
  Linking,
} from 'react-native';
import { OfflineIndicator } from '../../components/OfflineIndicator';
import { API_BASE_URL } from '../../config/api-config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ProjectDetailScreenProps {
  navigation: any;
  route: {
    params: {
      projectId: string;
      projectName?: string;
    };
  };
}

type ProjectType = 
  | 'road' 
  | 'bridge' 
  | 'water_supply' 
  | 'sanitation' 
  | 'electricity' 
  | 'school' 
  | 'hospital' 
  | 'community_center' 
  | 'other';

type ProjectStatus = 
  | 'planned' 
  | 'approved' 
  | 'in_progress' 
  | 'on_hold' 
  | 'completed' 
  | 'cancelled';

type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

interface FundingSource {
  source_name: string;
  amount: number;
  percentage: number;
}

interface Milestone {
  milestone_id: string;
  milestone_name: string;
  description?: string;
  target_date: string;
  completion_date?: string;
  status: MilestoneStatus;
  weight_percentage: number;
  deliverables?: string[];
  is_delayed: boolean;
}

interface ProjectUpdate {
  update_id: string;
  update_date: string;
  update_type: 'progress' | 'delay' | 'issue' | 'completion';
  description: string;
  photos?: string[];
  updated_by?: string;
}

interface QualityInspection {
  inspection_id: string;
  inspection_date: string;
  inspector_name: string;
  quality_rating: number;
  findings: string;
  recommendations?: string;
  photos?: string[];
}

interface ProjectDetail {
  project_id: string;
  project_name: string;
  project_code?: string;
  project_type: ProjectType;
  description?: string;
  address?: string;
  district: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  total_budget: number;
  budget_currency: string;
  amount_spent?: number;
  amount_remaining?: number;
  funding_sources?: FundingSource[];
  planned_start_date: string;
  actual_start_date?: string;
  planned_end_date: string;
  estimated_completion_date?: string;
  actual_completion_date?: string;
  progress_percentage: number;
  current_phase?: string;
  is_delayed: boolean;
  delay_days: number;
  delay_reasons?: string[];
  contractor_name?: string;
  contractor_contact?: string;
  supervisor_name?: string;
  supervisor_contact?: string;
  implementing_agency?: string;
  work_order_number?: string;
  status: ProjectStatus;
  beneficiaries_count?: number;
  quality_rating?: number;
  community_satisfaction?: number;
  created_at: string;
  updated_at: string;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { projectId, projectName } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedPhotoSource, setSelectedPhotoSource] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'updates' | 'quality'>('overview');

  useEffect(() => {
    loadProjectDetails();
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load project details
      const projectResponse = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);
      const projectData = await projectResponse.json();
      
      if (!projectData.success) {
        throw new Error(projectData.error || 'Failed to load project');
      }

      setProject(projectData.data);

      // Load milestones
      const milestonesResponse = await fetch(`${API_BASE_URL}/api/projects/${projectId}/milestones`);
      const milestonesData = await milestonesResponse.json();
      
      if (milestonesData.success) {
        setMilestones(milestonesData.data || []);
      }

      // Load updates
      const updatesResponse = await fetch(`${API_BASE_URL}/api/projects/${projectId}/updates`);
      const updatesData = await updatesResponse.json();
      
      if (updatesData.success) {
        setUpdates(updatesData.data || []);
      }

      // Load quality inspections
      const inspectionsResponse = await fetch(`${API_BASE_URL}/api/projects/${projectId}/inspections`);
      const inspectionsData = await inspectionsResponse.json();
      
      if (inspectionsData.success) {
        setInspections(inspectionsData.data || []);
      }
    } catch (err: any) {
      console.error('Error loading project details:', err);
      setError(err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!project) return;

    try {
      await Share.share({
        message: `Project: ${project.project_name}\n\nProgress: ${project.progress_percentage}%\nBudget: ${formatCurrency(project.total_budget)}\nStatus: ${project.status}\n\nTrack at: [App Link]`,
        title: project.project_name,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleCallContractor = () => {
    if (!project?.contractor_contact) return;
    Linking.openURL(`tel:${project.contractor_contact}`);
  };

  const handleCallSupervisor = () => {
    if (!project?.supervisor_contact) return;
    Linking.openURL(`tel:${project.supervisor_contact}`);
  };

  const openPhotoModal = (photos: string[], index: number) => {
    setSelectedPhotoSource(photos);
    setSelectedPhotoIndex(index);
  };

  const formatCurrency = (amount: number, currency: string = 'INR'): string => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(2)} K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(dateString);
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return '#4CAF50';
    if (progress >= 50) return '#FF9800';
    if (progress >= 25) return '#FFC107';
    return '#F44336';
  };

  const getStatusColor = (status: ProjectStatus): string => {
    const colors: Record<ProjectStatus, string> = {
      planned: '#9E9E9E',
      approved: '#2196F3',
      in_progress: '#FF9800',
      on_hold: '#FFC107',
      completed: '#4CAF50',
      cancelled: '#F44336',
    };
    return colors[status] || '#666';
  };

  const getMilestoneStatusColor = (status: MilestoneStatus): string => {
    const colors: Record<MilestoneStatus, string> = {
      pending: '#9E9E9E',
      in_progress: '#2196F3',
      completed: '#4CAF50',
      delayed: '#F44336',
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  if (error || !project) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorText}>{error || 'Project not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProjectDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              {project.project_code && (
                <Text style={styles.projectCode}>Code: {project.project_code}</Text>
              )}
              <Text style={styles.projectName}>{project.project_name}</Text>
            </View>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Text style={styles.shareIcon}>📤</Text>
            </TouchableOpacity>
          </View>

          {/* Delay Banner */}
          {project.is_delayed && (
            <View style={styles.delayBanner}>
              <Text style={styles.delayIcon}>⚠️</Text>
              <Text style={styles.delayText}>
                Delayed by {project.delay_days} days
              </Text>
            </View>
          )}

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(project.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(project.status) },
              ]}
            >
              {project.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={[styles.progressPercentage, { color: getProgressColor(project.progress_percentage) }]}>
                {project.progress_percentage}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${project.progress_percentage}%`,
                    backgroundColor: getProgressColor(project.progress_percentage),
                  },
                ]}
              />
            </View>
            {project.current_phase && (
              <Text style={styles.currentPhase}>Current Phase: {project.current_phase}</Text>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'milestones' && styles.tabActive]}
            onPress={() => setActiveTab('milestones')}
          >
            <Text style={[styles.tabText, activeTab === 'milestones' && styles.tabTextActive]}>
              Milestones
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'updates' && styles.tabActive]}
            onPress={() => setActiveTab('updates')}
          >
            <Text style={[styles.tabText, activeTab === 'updates' && styles.tabTextActive]}>
              Updates
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'quality' && styles.tabActive]}
            onPress={() => setActiveTab('quality')}
          >
            <Text style={[styles.tabText, activeTab === 'quality' && styles.tabTextActive]}>
              Quality
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Description */}
            {project.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{project.description}</Text>
              </View>
            )}

            {/* Budget Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Budget</Text>
              <View style={styles.budgetCard}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Total Budget</Text>
                  <Text style={styles.budgetValue}>
                    {formatCurrency(project.total_budget, project.budget_currency)}
                  </Text>
                </View>
                {project.amount_spent !== undefined && (
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>Amount Spent</Text>
                    <Text style={[styles.budgetValue, { color: '#F44336' }]}>
                      {formatCurrency(project.amount_spent, project.budget_currency)}
                    </Text>
                  </View>
                )}
                {project.amount_remaining !== undefined && (
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>Amount Remaining</Text>
                    <Text style={[styles.budgetValue, { color: '#4CAF50' }]}>
                      {formatCurrency(project.amount_remaining, project.budget_currency)}
                    </Text>
                  </View>
                )}

                {/* Funding Sources */}
                {project.funding_sources && project.funding_sources.length > 0 && (
                  <View style={styles.fundingSourcesContainer}>
                    <Text style={styles.fundingSourcesTitle}>Funding Sources</Text>
                    {project.funding_sources.map((source, index) => (
                      <View key={index} style={styles.fundingSourceRow}>
                        <View style={styles.fundingSourceInfo}>
                          <Text style={styles.fundingSourceName}>{source.source_name}</Text>
                          <Text style={styles.fundingSourceAmount}>
                            {formatCurrency(source.amount)} ({source.percentage}%)
                          </Text>
                        </View>
                        <View style={styles.fundingSourceBar}>
                          <View
                            style={[
                              styles.fundingSourceBarFill,
                              { width: `${source.percentage}%` },
                            ]}
                          />
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              <View style={styles.timelineCard}>
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineIcon}>📅</Text>
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineLabel}>Planned Start</Text>
                    <Text style={styles.timelineValue}>{formatDate(project.planned_start_date)}</Text>
                  </View>
                </View>
                {project.actual_start_date && (
                  <View style={styles.timelineRow}>
                    <Text style={styles.timelineIcon}>✅</Text>
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineLabel}>Actual Start</Text>
                      <Text style={styles.timelineValue}>{formatDate(project.actual_start_date)}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineIcon}>🎯</Text>
                  <View style={styles.timelineInfo}>
                    <Text style={styles.timelineLabel}>Planned End</Text>
                    <Text style={styles.timelineValue}>{formatDate(project.planned_end_date)}</Text>
                  </View>
                </View>
                {project.estimated_completion_date && (
                  <View style={styles.timelineRow}>
                    <Text style={styles.timelineIcon}>📊</Text>
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineLabel}>Estimated Completion</Text>
                      <Text style={styles.timelineValue}>{formatDate(project.estimated_completion_date)}</Text>
                    </View>
                  </View>
                )}
                {project.actual_completion_date && (
                  <View style={styles.timelineRow}>
                    <Text style={styles.timelineIcon}>🏁</Text>
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineLabel}>Actual Completion</Text>
                      <Text style={styles.timelineValue}>{formatDate(project.actual_completion_date)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationCard}>
                <Text style={styles.locationIcon}>📍</Text>
                <View style={styles.locationDetails}>
                  {project.address && (
                    <Text style={styles.locationAddress}>{project.address}</Text>
                  )}
                  <Text style={styles.locationArea}>
                    {project.district}, {project.state}
                    {project.pincode && ` - ${project.pincode}`}
                  </Text>
                  {project.latitude && project.longitude && (
                    <Text style={styles.locationCoords}>
                      {project.latitude.toFixed(6)}, {project.longitude.toFixed(6)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Stakeholders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stakeholders</Text>
              
              {/* Implementing Agency */}
              {project.implementing_agency && (
                <View style={styles.stakeholderCard}>
                  <Text style={styles.stakeholderRole}>Implementing Agency</Text>
                  <Text style={styles.stakeholderName}>{project.implementing_agency}</Text>
                </View>
              )}

              {/* Contractor */}
              {project.contractor_name && (
                <View style={styles.stakeholderCard}>
                  <View style={styles.stakeholderHeader}>
                    <View>
                      <Text style={styles.stakeholderRole}>Contractor</Text>
                      <Text style={styles.stakeholderName}>{project.contractor_name}</Text>
                      {project.contractor_contact && (
                        <Text style={styles.stakeholderContact}>📞 {project.contractor_contact}</Text>
                      )}
                    </View>
                    {project.contractor_contact && (
                      <TouchableOpacity style={styles.callButton} onPress={handleCallContractor}>
                        <Text style={styles.callButtonText}>Call</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Supervisor */}
              {project.supervisor_name && (
                <View style={styles.stakeholderCard}>
                  <View style={styles.stakeholderHeader}>
                    <View>
                      <Text style={styles.stakeholderRole}>Supervisor</Text>
                      <Text style={styles.stakeholderName}>{project.supervisor_name}</Text>
                      {project.supervisor_contact && (
                        <Text style={styles.stakeholderContact}>📞 {project.supervisor_contact}</Text>
                      )}
                    </View>
                    {project.supervisor_contact && (
                      <TouchableOpacity style={styles.callButton} onPress={handleCallSupervisor}>
                        <Text style={styles.callButtonText}>Call</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Work Order */}
              {project.work_order_number && (
                <View style={styles.workOrderCard}>
                  <Text style={styles.workOrderLabel}>Work Order Number</Text>
                  <Text style={styles.workOrderNumber}>{project.work_order_number}</Text>
                </View>
              )}
            </View>

            {/* Beneficiaries */}
            {project.beneficiaries_count && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Impact</Text>
                <View style={styles.impactCard}>
                  <Text style={styles.impactIcon}>👥</Text>
                  <View style={styles.impactInfo}>
                    <Text style={styles.impactValue}>{project.beneficiaries_count.toLocaleString()}</Text>
                    <Text style={styles.impactLabel}>Beneficiaries</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Delay Reasons */}
            {project.is_delayed && project.delay_reasons && project.delay_reasons.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Delay Reasons</Text>
                <View style={styles.delayReasonsCard}>
                  {project.delay_reasons.map((reason, index) => (
                    <View key={index} style={styles.delayReasonItem}>
                      <Text style={styles.delayReasonBullet}>•</Text>
                      <Text style={styles.delayReasonText}>{reason}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Milestones Tab */}
        {activeTab === 'milestones' && (
          <View style={styles.tabContent}>
            {milestones.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>🎯</Text>
                <Text style={styles.emptyStateText}>No milestones defined yet</Text>
              </View>
            ) : (
              <View style={styles.milestonesContainer}>
                {milestones.map((milestone, index) => {
                  const statusColor = getMilestoneStatusColor(milestone.status);
                  const isCompleted = milestone.status === 'completed';
                  const isDelayed = milestone.is_delayed;

                  return (
                    <View key={milestone.milestone_id} style={styles.milestoneCard}>
                      {/* Milestone Header */}
                      <View style={styles.milestoneHeader}>
                        <View style={styles.milestoneNumberContainer}>
                          <View
                            style={[
                              styles.milestoneNumber,
                              { backgroundColor: statusColor + '20', borderColor: statusColor },
                            ]}
                          >
                            <Text style={[styles.milestoneNumberText, { color: statusColor }]}>
                              {index + 1}
                            </Text>
                          </View>
                          {index < milestones.length - 1 && (
                            <View style={styles.milestoneConnector} />
                          )}
                        </View>

                        <View style={styles.milestoneContent}>
                          <View style={styles.milestoneTopRow}>
                            <Text style={styles.milestoneName}>{milestone.milestone_name}</Text>
                            <View
                              style={[
                                styles.milestoneStatusBadge,
                                { backgroundColor: statusColor + '20' },
                              ]}
                            >
                              <Text style={[styles.milestoneStatusText, { color: statusColor }]}>
                                {milestone.status.replace('_', ' ').toUpperCase()}
                              </Text>
                            </View>
                          </View>

                          {milestone.description && (
                            <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                          )}

                          {/* Milestone Dates */}
                          <View style={styles.milestoneDates}>
                            <View style={styles.milestoneDateItem}>
                              <Text style={styles.milestoneDateLabel}>Target:</Text>
                              <Text style={styles.milestoneDateValue}>
                                {formatDate(milestone.target_date)}
                              </Text>
                            </View>
                            {milestone.completion_date && (
                              <View style={styles.milestoneDateItem}>
                                <Text style={styles.milestoneDateLabel}>Completed:</Text>
                                <Text style={[styles.milestoneDateValue, { color: '#4CAF50' }]}>
                                  {formatDate(milestone.completion_date)}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Weight Percentage */}
                          <View style={styles.milestoneWeight}>
                            <Text style={styles.milestoneWeightLabel}>Weight:</Text>
                            <View style={styles.milestoneWeightBar}>
                              <View
                                style={[
                                  styles.milestoneWeightBarFill,
                                  {
                                    width: `${milestone.weight_percentage}%`,
                                    backgroundColor: isCompleted ? '#4CAF50' : '#E0E0E0',
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.milestoneWeightValue}>{milestone.weight_percentage}%</Text>
                          </View>

                          {/* Deliverables */}
                          {milestone.deliverables && milestone.deliverables.length > 0 && (
                            <View style={styles.deliverablesContainer}>
                              <Text style={styles.deliverablesTitle}>Deliverables:</Text>
                              {milestone.deliverables.map((deliverable, idx) => (
                                <View key={idx} style={styles.deliverableItem}>
                                  <Text style={styles.deliverableIcon}>
                                    {isCompleted ? '✅' : '⭕'}
                                  </Text>
                                  <Text style={styles.deliverableText}>{deliverable}</Text>
                                </View>
                              ))}
                            </View>
                          )}

                          {/* Delay Warning */}
                          {isDelayed && (
                            <View style={styles.milestoneDelayWarning}>
                              <Text style={styles.milestoneDelayIcon}>⚠️</Text>
                              <Text style={styles.milestoneDelayText}>This milestone is delayed</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Updates Tab */}
        {activeTab === 'updates' && (
          <View style={styles.tabContent}>
            {updates.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📋</Text>
                <Text style={styles.emptyStateText}>No updates yet</Text>
              </View>
            ) : (
              <View style={styles.updatesContainer}>
                {updates.map((update) => {
                  const updateTypeConfig: Record<string, { icon: string; color: string }> = {
                    progress: { icon: '📈', color: '#2196F3' },
                    delay: { icon: '⚠️', color: '#FF9800' },
                    issue: { icon: '❗', color: '#F44336' },
                    completion: { icon: '✅', color: '#4CAF50' },
                  };

                  const config = updateTypeConfig[update.update_type] || { icon: '📋', color: '#666' };

                  return (
                    <View key={update.update_id} style={styles.updateCard}>
                      <View style={styles.updateHeader}>
                        <View style={styles.updateTypeContainer}>
                          <Text style={styles.updateTypeIcon}>{config.icon}</Text>
                          <Text style={[styles.updateType, { color: config.color }]}>
                            {update.update_type.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.updateDate}>{formatTimeAgo(update.update_date)}</Text>
                      </View>

                      <Text style={styles.updateDescription}>{update.description}</Text>

                      {update.updated_by && (
                        <Text style={styles.updateBy}>Updated by: {update.updated_by}</Text>
                      )}

                      {/* Update Photos */}
                      {update.photos && update.photos.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.updatePhotos}
                        >
                          {update.photos.map((photo, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => openPhotoModal(update.photos!, index)}
                              style={styles.updatePhotoThumbnail}
                            >
                              <Image source={{ uri: photo }} style={styles.updatePhotoImage} />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Quality Tab */}
        {activeTab === 'quality' && (
          <View style={styles.tabContent}>
            {/* Quality Rating Summary */}
            {project.quality_rating !== undefined && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quality Rating</Text>
                <View style={styles.qualityRatingCard}>
                  <View style={styles.qualityRatingCircle}>
                    <Text style={styles.qualityRatingValue}>{project.quality_rating.toFixed(1)}</Text>
                    <Text style={styles.qualityRatingMax}>/5.0</Text>
                  </View>
                  <View style={styles.qualityRatingStars}>
                    <Text style={styles.qualityStars}>
                      {'⭐'.repeat(Math.round(project.quality_rating))}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Community Satisfaction */}
            {project.community_satisfaction !== undefined && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Community Satisfaction</Text>
                <View style={styles.satisfactionCard}>
                  <View style={styles.satisfactionBar}>
                    <View
                      style={[
                        styles.satisfactionBarFill,
                        { width: `${project.community_satisfaction}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.satisfactionValue}>{project.community_satisfaction}%</Text>
                </View>
              </View>
            )}

            {/* Inspection Reports */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Inspection Reports</Text>
              {inspections.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>📝</Text>
                  <Text style={styles.emptyStateText}>No inspections yet</Text>
                </View>
              ) : (
                <View style={styles.inspectionsContainer}>
                  {inspections.map((inspection) => (
                    <View key={inspection.inspection_id} style={styles.inspectionCard}>
                      <View style={styles.inspectionHeader}>
                        <View>
                          <Text style={styles.inspectionDate}>
                            {formatDate(inspection.inspection_date)}
                          </Text>
                          <Text style={styles.inspectorName}>{inspection.inspector_name}</Text>
                        </View>
                        <View style={styles.inspectionRating}>
                          <Text style={styles.inspectionRatingValue}>
                            {inspection.quality_rating.toFixed(1)}
                          </Text>
                          <Text style={styles.inspectionRatingStars}>
                            {'⭐'.repeat(Math.round(inspection.quality_rating))}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.inspectionContent}>
                        <Text style={styles.inspectionLabel}>Findings:</Text>
                        <Text style={styles.inspectionText}>{inspection.findings}</Text>
                      </View>

                      {inspection.recommendations && (
                        <View style={styles.inspectionContent}>
                          <Text style={styles.inspectionLabel}>Recommendations:</Text>
                          <Text style={styles.inspectionText}>{inspection.recommendations}</Text>
                        </View>
                      )}

                      {/* Inspection Photos */}
                      {inspection.photos && inspection.photos.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.inspectionPhotos}
                        >
                          {inspection.photos.map((photo, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => openPhotoModal(inspection.photos!, index)}
                              style={styles.inspectionPhotoThumbnail}
                            >
                              <Image source={{ uri: photo }} style={styles.inspectionPhotoImage} />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Photo Zoom Modal */}
      {selectedPhotoIndex !== null && selectedPhotoSource.length > 0 && (
        <Modal
          visible={true}
          transparent={true}
          onRequestClose={() => setSelectedPhotoIndex(null)}
        >
          <View style={styles.photoModal}>
            <TouchableOpacity
              style={styles.photoModalClose}
              onPress={() => setSelectedPhotoIndex(null)}
            >
              <Text style={styles.photoModalCloseText}>✕</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: selectedPhotoSource[selectedPhotoIndex] }}
              style={styles.photoModalImage}
              resizeMode="contain"
            />
            <View style={styles.photoModalCounter}>
              <Text style={styles.photoModalCounterText}>
                {selectedPhotoIndex + 1} / {selectedPhotoSource.length}
              </Text>
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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  projectCode: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  projectName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 30,
  },
  shareButton: {
    padding: 8,
  },
  shareIcon: {
    fontSize: 24,
  },
  delayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  delayIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  delayText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '600',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  currentPhase: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  tabContent: {
    backgroundColor: '#F5F5F5',
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  budgetCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  fundingSourcesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  fundingSourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  fundingSourceRow: {
    marginBottom: 12,
  },
  fundingSourceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fundingSourceName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  fundingSourceAmount: {
    fontSize: 13,
    color: '#666',
  },
  fundingSourceBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fundingSourceBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  timelineCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timelineIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  timelineInfo: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  timelineValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationArea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  stakeholderCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  stakeholderRole: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  stakeholderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stakeholderContact: {
    fontSize: 14,
    color: '#666',
  },
  stakeholderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  workOrderCard: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
  },
  workOrderLabel: {
    fontSize: 12,
    color: '#1976D2',
    marginBottom: 4,
  },
  workOrderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D47A1',
  },
  impactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
  },
  impactIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  impactInfo: {
    flex: 1,
  },
  impactValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 14,
    color: '#66BB6A',
  },
  delayReasonsCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  delayReasonItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  delayReasonBullet: {
    fontSize: 16,
    color: '#F57C00',
    marginRight: 8,
  },
  delayReasonText: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
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
    fontSize: 16,
    color: '#666',
  },
  milestonesContainer: {
    padding: 20,
  },
  milestoneCard: {
    marginBottom: 24,
  },
  milestoneHeader: {
    flexDirection: 'row',
  },
  milestoneNumberContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  milestoneNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  milestoneNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  milestoneConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  milestoneContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  milestoneTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  milestoneName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  milestoneStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  milestoneStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  milestoneDates: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  milestoneDateItem: {
    flex: 1,
  },
  milestoneDateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  milestoneDateValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  milestoneWeight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneWeightLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    width: 50,
  },
  milestoneWeightBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  milestoneWeightBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  milestoneWeightValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  deliverablesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  deliverablesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  deliverableItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  deliverableIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  deliverableText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  milestoneDelayWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  milestoneDelayIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  milestoneDelayText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '600',
  },
  updatesContainer: {
    padding: 20,
  },
  updateCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  updateTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateTypeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  updateType: {
    fontSize: 13,
    fontWeight: '600',
  },
  updateDate: {
    fontSize: 12,
    color: '#999',
  },
  updateDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  updateBy: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  updatePhotos: {
    marginTop: 12,
  },
  updatePhotoThumbnail: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  updatePhotoImage: {
    width: '100%',
    height: '100%',
  },
  qualityRatingCard: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 24,
    borderRadius: 12,
  },
  qualityRatingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qualityRatingValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  qualityRatingMax: {
    fontSize: 16,
    color: '#E8F5E9',
  },
  qualityRatingStars: {
    marginTop: 8,
  },
  qualityStars: {
    fontSize: 24,
  },
  satisfactionCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  satisfactionBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  satisfactionBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  satisfactionValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
  inspectionsContainer: {
    gap: 16,
  },
  inspectionCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
  },
  inspectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  inspectionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  inspectorName: {
    fontSize: 13,
    color: '#666',
  },
  inspectionRating: {
    alignItems: 'flex-end',
  },
  inspectionRatingValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  inspectionRatingStars: {
    fontSize: 16,
  },
  inspectionContent: {
    marginBottom: 12,
  },
  inspectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  inspectionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  inspectionPhotos: {
    marginTop: 8,
  },
  inspectionPhotoThumbnail: {
    width: 80,
    height: 80,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  inspectionPhotoImage: {
    width: '100%',
    height: '100%',
  },
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  photoModalCloseText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
  photoModalImage: {
    width: SCREEN_WIDTH,
    height: '80%',
  },
  photoModalCounter: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  photoModalCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProjectDetailScreen;
