/**
 * Project Progress Dashboard Screen
 * 
 * Features:
 * - Project listing with filters (type, status, location, delayed)
 * - Project details with comprehensive information
 * - Budget tracking with funding sources breakdown
 * - Timeline with milestones
 * - Progress visualization
 * - Delay indicators and reasons
 * - Project updates with photos
 * - Contractor and supervisor information
 * - Quality inspection reports
 * - Transparency documents
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// ============================================================================
// TYPES
// ============================================================================

type ProjectType = 'road' | 'bridge' | 'water_supply' | 'sanitation' | 'electricity' | 'school' | 'hospital' | 'community_center' | 'other';
type ProjectStatus = 'planned' | 'approved' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
type UpdateType = 'progress' | 'milestone' | 'delay' | 'budget' | 'quality' | 'completion';

interface FundingSource {
  source_name: string;
  amount: number;
  percentage: number;
}

interface Milestone {
  milestone_id: string;
  name: string;
  description?: string;
  target_date: string;
  completion_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  weight: number;
}

interface QualityInspection {
  inspection_id: string;
  inspection_date: string;
  inspector_name: string;
  inspector_designation: string;
  quality_score: number;
  findings: string;
  recommendations: string;
  photos?: string[];
  status: 'passed' | 'failed' | 'conditional';
}

interface TransparencyDocument {
  document_id: string;
  document_type: 'tender' | 'contract' | 'approval' | 'budget' | 'report' | 'other';
  document_name: string;
  document_url: string;
  uploaded_date: string;
  file_size?: number;
  description?: string;
}

interface ProjectUpdate {
  update_id: string;
  update_type: UpdateType;
  title: string;
  description: string;
  progress_percentage?: number;
  photos?: string[];
  videos?: string[];
  documents?: string[];
  updated_by: string;
  updated_by_role: string;
  update_date: string;
}

interface Project {
  project_id: string;
  project_name: string;
  project_code?: string;
  project_type: ProjectType;
  description?: string;
  district: string;
  state: string;
  total_budget: number;
  budget_currency: string;
  funding_sources?: FundingSource[];
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  estimated_completion_date?: string;
  progress_percentage: number;
  current_phase?: string;
  milestones?: Milestone[];
  is_delayed: boolean;
  delay_days: number;
  delay_reasons?: string[];
  contractor_name?: string;
  contractor_contact?: string;
  supervisor_name?: string;
  supervisor_contact?: string;
  implementing_agency?: string;
  quality_rating?: number;
  status: ProjectStatus;
  beneficiaries_count?: number;
  average_community_rating?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ProjectProgressScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'timeline' | 'updates' | 'quality' | 'documents'>('overview');
  
  // Filters
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');
  const [filterDelayed, setFilterDelayed] = useState<boolean | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProjects();
  }, [filterType, filterStatus, filterDelayed]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('project_type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterDelayed !== 'all') params.append('is_delayed', filterDelayed.toString());
      
      const response = await fetch(`/api/projects?${params.toString()}`);
      const data = await response.json() as { success: boolean; data: Project[] };
      
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const openProjectDetails = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json() as { success: boolean; data: Project };
      
      if (data.success) {
        setSelectedProject(data.data);
        setShowDetails(true);
        setActiveTab('overview');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load project details');
    }
  };

  const filteredProjects = projects.filter((project: Project) =>
    searchQuery === '' ||
    project.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.project_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==========================================================================
  // RENDER FUNCTIONS
  // ==========================================================================

  const renderProjectCard = (project: Project) => {
    const statusColor = getStatusColor(project.status);
    const progressColor = getProgressColor(project.progress_percentage);
    
    return (
      <TouchableOpacity
        key={project.project_id}
        style={styles.projectCard}
        onPress={() => openProjectDetails(project.project_id)}
      >
        <View style={styles.projectHeader}>
          <View style={styles.projectTitleRow}>
            <Icon name={getProjectIcon(project.project_type)} size={24} color="#2196F3" />
            <View style={styles.projectTitleContainer}>
              <Text style={styles.projectName}>{project.project_name}</Text>
              {project.project_code && (
                <Text style={styles.projectCode}>{project.project_code}</Text>
              )}
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{project.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.projectInfo}>
          <View style={styles.infoRow}>
            <Icon name="map-marker" size={16} color="#666" />
            <Text style={styles.infoText}>{project.district}, {project.state}</Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="currency-inr" size={16} color="#666" />
            <Text style={styles.infoText}>
              {formatCurrency(project.total_budget)} {project.budget_currency}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={[styles.progressPercentage, { color: progressColor }]}>
              {project.progress_percentage.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${project.progress_percentage}%`, backgroundColor: progressColor }]} />
          </View>
        </View>

        {project.is_delayed && (
          <View style={styles.delayBanner}>
            <Icon name="alert-circle" size={16} color="#F44336" />
            <Text style={styles.delayText}>
              Delayed by {project.delay_days} days
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderOverviewTab = () => {
    if (!selectedProject) return null;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Project Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{selectedProject.project_type.replace('_', ' ')}</Text>
          </View>
          {selectedProject.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{selectedProject.description}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{selectedProject.district}, {selectedProject.state}</Text>
          </View>
          {selectedProject.implementing_agency && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Implementing Agency:</Text>
              <Text style={styles.detailValue}>{selectedProject.implementing_agency}</Text>
            </View>
          )}
          {selectedProject.beneficiaries_count && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Beneficiaries:</Text>
              <Text style={styles.detailValue}>{selectedProject.beneficiaries_count.toLocaleString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Planned Start:</Text>
            <Text style={styles.detailValue}>{formatDate(selectedProject.planned_start_date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Planned End:</Text>
            <Text style={styles.detailValue}>{formatDate(selectedProject.planned_end_date)}</Text>
          </View>
          {selectedProject.actual_start_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Actual Start:</Text>
              <Text style={styles.detailValue}>{formatDate(selectedProject.actual_start_date)}</Text>
            </View>
          )}
          {selectedProject.estimated_completion_date && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Est. Completion:</Text>
              <Text style={styles.detailValue}>{formatDate(selectedProject.estimated_completion_date)}</Text>
            </View>
          )}
        </View>

        {selectedProject.contractor_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contractor</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{selectedProject.contractor_name}</Text>
            </View>
            {selectedProject.contractor_contact && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact:</Text>
                <Text style={styles.detailValue}>{selectedProject.contractor_contact}</Text>
              </View>
            )}
          </View>
        )}

        {selectedProject.supervisor_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supervisor</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{selectedProject.supervisor_name}</Text>
            </View>
            {selectedProject.supervisor_contact && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact:</Text>
                <Text style={styles.detailValue}>{selectedProject.supervisor_contact}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderBudgetTab = () => {
    if (!selectedProject) return null;

    const amountSpent = (selectedProject.total_budget * selectedProject.progress_percentage) / 100;
    const remainingBalance = selectedProject.total_budget - amountSpent;

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Summary</Text>
          <View style={styles.budgetCard}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Total Budget:</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(selectedProject.total_budget)} {selectedProject.budget_currency}
              </Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Amount Spent:</Text>
              <Text style={[styles.budgetAmount, { color: '#F44336' }]}>
                {formatCurrency(amountSpent)} {selectedProject.budget_currency}
              </Text>
            </View>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Remaining:</Text>
              <Text style={[styles.budgetAmount, { color: '#4CAF50' }]}>
                {formatCurrency(remainingBalance)} {selectedProject.budget_currency}
              </Text>
            </View>
          </View>
        </View>

        {selectedProject.funding_sources && selectedProject.funding_sources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Funding Sources</Text>
            {selectedProject.funding_sources.map((source: FundingSource, index: number) => (
              <View key={index} style={styles.fundingSourceCard}>
                <View style={styles.fundingHeader}>
                  <Text style={styles.fundingName}>{source.source_name}</Text>
                  <Text style={styles.fundingPercentage}>{source.percentage.toFixed(1)}%</Text>
                </View>
                <Text style={styles.fundingAmount}>
                  {formatCurrency(source.amount)} {selectedProject.budget_currency}
                </Text>
                <View style={styles.fundingBar}>
                  <View style={[styles.fundingBarFill, { width: `${source.percentage}%` }]} />
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderTimelineTab = () => {
    if (!selectedProject) return null;

    const milestones = selectedProject.milestones || [];

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          {milestones.length === 0 ? (
            <Text style={styles.emptyText}>No milestones defined</Text>
          ) : (
            milestones.map((milestone: Milestone) => (
              <View key={milestone.milestone_id} style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                  <Icon 
                    name={getMilestoneIcon(milestone.status)} 
                    size={24} 
                    color={getMilestoneColor(milestone.status)} 
                  />
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneName}>{milestone.name}</Text>
                    {milestone.description && (
                      <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                    )}
                  </View>
                  <View style={[styles.milestoneStatusBadge, { backgroundColor: getMilestoneColor(milestone.status) }]}>
                    <Text style={styles.milestoneStatusText}>{milestone.status}</Text>
                  </View>
                </View>
                <View style={styles.milestoneDates}>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Target:</Text>
                    <Text style={styles.dateValue}>{formatDate(milestone.target_date)}</Text>
                  </View>
                  {milestone.completion_date && (
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>Completed:</Text>
                      <Text style={styles.dateValue}>{formatDate(milestone.completion_date)}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {selectedProject.is_delayed && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delay Information</Text>
            <View style={styles.delayCard}>
              <View style={styles.delayHeader}>
                <Icon name="alert-circle" size={24} color="#F44336" />
                <Text style={styles.delayDays}>Delayed by {selectedProject.delay_days} days</Text>
              </View>
              {selectedProject.delay_reasons && selectedProject.delay_reasons.length > 0 && (
                <View style={styles.delayReasons}>
                  <Text style={styles.delayReasonsTitle}>Reasons:</Text>
                  {selectedProject.delay_reasons.map((reason: string, index: number) => (
                    <Text key={index} style={styles.delayReason}>• {reason}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Infrastructure Projects</Text>
        <TouchableOpacity onPress={loadProjects}>
          <Icon name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
              All Types
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'in_progress' && styles.filterChipActive]}
            onPress={() => setFilterStatus(filterStatus === 'in_progress' ? 'all' : 'in_progress')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'in_progress' && styles.filterChipTextActive]}>
              In Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterDelayed === true && styles.filterChipActive]}
            onPress={() => setFilterDelayed(filterDelayed === true ? 'all' : true)}
          >
            <Text style={[styles.filterChipText, filterDelayed === true && styles.filterChipTextActive]}>
              Delayed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Project List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <ScrollView
          style={styles.projectList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredProjects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="folder-open" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No projects found</Text>
            </View>
          ) : (
            filteredProjects.map(renderProjectCard)
          )}
        </ScrollView>
      )}

      {/* Project Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetails(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedProject?.project_name}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedProject && (
            <>
              <View style={styles.tabBar}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                  onPress={() => setActiveTab('overview')}
                >
                  <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
                    Overview
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'budget' && styles.tabActive]}
                  onPress={() => setActiveTab('budget')}
                >
                  <Text style={[styles.tabText, activeTab === 'budget' && styles.tabTextActive]}>
                    Budget
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
                  onPress={() => setActiveTab('timeline')}
                >
                  <Text style={[styles.tabText, activeTab === 'timeline' && styles.tabTextActive]}>
                    Timeline
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'budget' && renderBudgetTab()}
              {activeTab === 'timeline' && renderTimelineTab()}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getProjectIcon = (type: ProjectType): string => {
  const icons: Record<ProjectType, string> = {
    road: 'road-variant',
    bridge: 'bridge',
    water_supply: 'water',
    sanitation: 'toilet',
    electricity: 'lightning-bolt',
    school: 'school',
    hospital: 'hospital-building',
    community_center: 'home-group',
    other: 'hammer-wrench',
  };
  return icons[type] || 'hammer-wrench';
};

const getStatusColor = (status: ProjectStatus): string => {
  const colors: Record<ProjectStatus, string> = {
    planned: '#9E9E9E',
    approved: '#2196F3',
    in_progress: '#FF9800',
    on_hold: '#F44336',
    completed: '#4CAF50',
    cancelled: '#757575',
  };
  return colors[status] || '#9E9E9E';
};

const getProgressColor = (percentage: number): string => {
  if (percentage < 25) return '#F44336';
  if (percentage < 50) return '#FF9800';
  if (percentage < 75) return '#FFC107';
  return '#4CAF50';
};

const getMilestoneIcon = (status: string): string => {
  const icons: Record<string, string> = {
    pending: 'clock-outline',
    in_progress: 'progress-clock',
    completed: 'check-circle',
    delayed: 'alert-circle',
  };
  return icons[status] || 'circle-outline';
};

const getMilestoneColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: '#9E9E9E',
    in_progress: '#2196F3',
    completed: '#4CAF50',
    delayed: '#F44336',
  };
  return colors[status] || '#9E9E9E';
};

const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)} K`;
  }
  return `₹${amount.toFixed(2)}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectList: {
    flex: 1,
  },
  projectCard: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  projectCode: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  projectInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  delayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  delayText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2196F3',
    padding: 16,
    paddingTop: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
  },
  budgetCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#666',
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  fundingSourceCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  fundingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fundingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fundingPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  fundingAmount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  fundingBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fundingBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  milestoneCard: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  milestoneInfo: {
    flex: 1,
    marginLeft: 12,
  },
  milestoneName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  milestoneDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  milestoneStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  milestoneStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  milestoneDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#666',
  },
  dateValue: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
  },
  delayCard: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 8,
  },
  delayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  delayDays: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
    marginLeft: 12,
  },
  delayReasons: {
    marginTop: 8,
  },
  delayReasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  delayReason: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
});

export default ProjectProgressScreen;
