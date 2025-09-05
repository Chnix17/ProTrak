import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  SpeakerWaveIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreatePhaseModal } from './lib/modal_create_phase';
import AnnouncementModal from './components/AnnouncementModal';

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allProjects, setAllProjects] = useState([]);
  const [projectMaster, setProjectMaster] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phases, setPhases] = useState([]);
  const [phasesLoading, setPhasesLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const baseUrl = SecureStorage.getLocalItem("url");
  
  // Get project details from navigation state
  const { projectId, projectTitle, schoolYearStartDate, schoolYearEndDate } = location.state || {};

  const fetchProjectMaster = useCallback(async () => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'fetchProjectMasterById',
          projectId: projectId
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setProjectMaster(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching project master:', error);
      toast.error('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, projectId]);

  const fetchAllProjects = useCallback(async () => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'fetchAllProjects',
          master_id: projectId
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setAllProjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching all projects:', error);
      toast.error('Failed to load all projects');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, projectId]);

  const fetchPhases = useCallback(async () => {
    try {
      setPhasesLoading(true);
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'fetchPhases',
          project_master_id: projectId
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setPhases(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching phases:', error);
      toast.error('Failed to load project phases');
    } finally {
      setPhasesLoading(false);
    }
  }, [baseUrl, projectId]);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setAnnouncementsLoading(true);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchAnnouncements',
          project_master_id: parseInt(projectId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setAnnouncements(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setAnnouncementsLoading(false);
    }
  }, [baseUrl, projectId]);

  useEffect(() => {
    if (!projectId) {
      toast.error('No project selected');
      navigate('/teacher/workspace');
      return;
    }

    fetchProjectMaster();
    fetchPhases();
    fetchAllProjects();
    fetchAnnouncements();
  }, [projectId, fetchProjectMaster, fetchPhases, fetchAllProjects, fetchAnnouncements, navigate]);

  const createAnnouncement = useCallback(async (announcementData) => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'insertAnnouncement',
          project_master_id: projectId,
          announcement_title: announcementData.announcement_title,
          announcement_content: announcementData.announcement_content,
          created_by: userId
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Announcement created successfully');
        fetchAnnouncements();
        setShowAnnouncementModal(false);
      } else {
        toast.error(response.data.message || 'Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  }, [baseUrl, projectId, fetchAnnouncements]);

  const updateAnnouncement = async (announcementId, announcementData) => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'updateAnnouncement',
          announcement_id: announcementId,
          ...announcementData
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Announcement updated successfully');
        fetchAnnouncements();
        setShowAnnouncementModal(false);
        setEditingAnnouncement(null);
      } else {
        toast.error(response.data.message || 'Failed to update announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  const deleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'deleteAnnouncement',
          announcement_id: announcementId
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Announcement deleted successfully');
        fetchAnnouncements();
      } else {
        toast.error(response.data.message || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  // const getStatusBadge = (status) => {
  //   switch (status) {
  //     case 'completed':
  //       return (
  //         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  //           <CheckCircleIcon className="h-4 w-4 mr-1" />
  //           Completed
  //         </span>
  //       );
  //     case 'in_progress':
  //       return (
  //         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
  //           <ClockIcon className="h-4 w-4 mr-1" />
  //           In Progress
  //         </span>
  //       );
  //     case 'not_started':
  //       return (
  //         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
  //           <XCircleIcon className="h-4 w-4 mr-1" />
  //           Not Started
  //         </span>
  //       );
  //     default:
  //       return (
  //         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
  //           Unknown
  //         </span>
  //       );
  //   }
  // };

  // const filteredProjects = selectedStatus === 'all' 
  //   ? studentProjects 
  //   : studentProjects.filter(project => project.status === selectedStatus);

  const getPhaseStatus = (startDate, endDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (today < start) return 'upcoming';
    if (today > end) return 'completed';
    return 'active';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPhaseStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'upcoming':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <ClockIcon className="h-3 w-3 mr-1" />
            Upcoming
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 overflow-hidden flex">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
          {/* Enhanced Header Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-primary to-primary-medium rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
              <div className="relative">
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => navigate('/teacher/workspace')}
                    className="mr-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">
                      {projectMaster?.project_title || projectTitle || 'All Projects'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-primary-subtle opacity-90">
                      {projectMaster?.project_code && (
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          <span className="font-mono">{projectMaster.project_code}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>{allProjects.length} project{allProjects.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {projectMaster?.project_description && (
                      <p className="mt-2 text-primary-subtle opacity-90">{projectMaster.project_description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowPhaseModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary transition-all duration-200 shadow-lg"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Phase
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Project Phases Timeline */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-primary-subtle rounded-lg p-2 mr-3">
                  <ClockIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Phases</h2>
                  <p className="text-sm text-gray-600">Timeline and milestones for this project</p>
                </div>
              </div>
              {phases.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{phases.length} phase{phases.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              
              {phasesLoading ? (
                <div className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading phases...</p>
                </div>
              ) : phases.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <ClockIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No phases created</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Create phases to organize your project timeline and track progress through different milestones.
                  </p>
                  <button
                    onClick={() => setShowPhaseModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-lg"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Create Your First Phase
                  </button>
                </div>
              ) : (
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    {phases.map((phase, index) => {
                      const status = getPhaseStatus(phase.phase_start_date, phase.phase_end_date);
                      return (
                        <div key={phase.phase_main_id} className="relative">
                          {/* Timeline connector */}
                          {index < phases.length - 1 && (
                            <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                          )}
                          
                          <div className="flex items-start space-x-4">
                            {/* Timeline dot */}
                            <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-2 ${
                              status === 'active' ? 'bg-blue-500' :
                              status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            
                            {/* Phase content */}
                            <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {phase.phase_main_name}
                                    </h4>
                                    {getPhaseStatusBadge(status)}
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mb-2">
                                    {phase.phase_main_description}
                                  </p>
                                  
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    <div className="flex items-center">
                                      <CalendarIcon className="h-3 w-3 mr-1" />
                                      <span>{formatDate(phase.phase_start_date)}</span>
                                    </div>
                                    <span>→</span>
                                    <div className="flex items-center">
                                      <CalendarIcon className="h-3 w-3 mr-1" />
                                      <span>{formatDate(phase.phase_end_date)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Projects</p>
                  <p className="text-2xl font-semibold text-gray-900">{allProjects.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Active</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {allProjects.filter(p => p.project_is_active === 1).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Inactive</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {allProjects.filter(p => p.project_is_active === 0).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <XCircleIcon className="h-8 w-8 text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Members</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {allProjects.reduce((sum, p) => sum + (p.member_count || 0), 0)}                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* All Projects Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Projects</h3>
              <p className="text-sm text-gray-500 mt-1">{allProjects.length} projects found</p>
            </div>
            
            {allProjects.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
                <p className="mt-1 text-sm text-gray-500">No projects have been created yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                    
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Creator
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allProjects.map((project) => (
                      <tr key={project.project_main_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {project.project_title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={project.project_description}>
                            {project.project_description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-indigo-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {project.creator_name}
                              </div>
                              
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <UserIcon className="h-3 w-3 mr-1" />
                            {project.member_count} members
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {project.status_name ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {project.status_name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircleIcon className="h-3 w-3 mr-1" />
                              No Status
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              navigate(`/teacher/project-detail/${projectId}/${project.project_main_id}`, {
                                state: {
                                  projectMasterId: projectId,
                                  projectId: project.project_main_id,
                                  projectTitle: project.project_title
                                }
                              });
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            title="View Project Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Phase Modal */}
          <CreatePhaseModal
            show={showPhaseModal}
            onHide={() => setShowPhaseModal(false)}
            projectMasterId={projectId}
            onPhasesAdded={() => {
              // Refresh phases data after adding new phases
              fetchPhases();
            }}
            schoolYearStartDate={schoolYearStartDate}
            schoolYearEndDate={schoolYearEndDate}
            existingPhases={phases}
          />
          </div>
        </div>

        {/* Right Sidebar - Announcements */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto hidden lg:block">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-amber-50 rounded-lg p-2 mr-3">
                  <SpeakerWaveIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                  <p className="text-xs text-gray-600">Latest updates</p>
                </div>
              </div>
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="inline-flex items-center px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
            
            {announcementsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-xs text-gray-600">Loading...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <SpeakerWaveIcon className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No announcements</h3>
                <p className="text-xs text-gray-600">
                  No updates at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.announcement_id} className="bg-gray-50 rounded-lg p-4 border-l-3 border-l-amber-400">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-amber-100 rounded-lg p-2 mr-3">
                        <SpeakerWaveIcon className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {announcement.announcement_title}
                          </h3>
                          <div className="flex items-center space-x-1 ml-2">
                            <button
                              onClick={() => {
                                setEditingAnnouncement(announcement);
                                setShowAnnouncementModal(true);
                              }}
                              className="p-1 text-gray-400 hover:text-amber-600"
                              title="Edit announcement"
                            >
                              <PencilIcon className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deleteAnnouncement(announcement.announcement_id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete announcement"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed mb-3 line-clamp-3">
                          {announcement.announcement_text}
                        </p>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <UserIcon className="h-3 w-3 mr-1" />
                            <span className="font-medium">{announcement.author_name}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            <span>{new Date(announcement.announcement_created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Announcement Modal */}
        {showAnnouncementModal && (
          <AnnouncementModal
            show={showAnnouncementModal}
            onHide={() => {
              setShowAnnouncementModal(false);
              setEditingAnnouncement(null);
            }}
            onSubmit={editingAnnouncement ? 
              (data) => updateAnnouncement(editingAnnouncement.announcement_id, data) :
              createAnnouncement
            }
            initialData={editingAnnouncement}
            isEditing={!!editingAnnouncement}
          />
        )}
      </div>
    </div>
  );
};

export default Projects;
