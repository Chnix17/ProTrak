import React, { useState, useEffect } from 'react';
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
  BellIcon,
  TrashIcon,
  PencilIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { Create_Phase_Modal } from './lib/modal_create_phase';
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
  const [announcementSidebarCollapsed, setAnnouncementSidebarCollapsed] = useState(false);

  const baseUrl = SecureStorage.getLocalItem("url");
  
  // Get project details from navigation state
  const { projectId, projectTitle } = location.state || {};

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
  }, [projectId]);

  const fetchProjectMaster = async () => {
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
  };


  const fetchAllProjects = async () => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'fetchAllProjects',
          master_id: projectId  // You can make this dynamic based on your needs
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
  };

  const fetchPhases = async () => {
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
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      
      // For now, using sample data until backend API is implemented
      const sampleAnnouncements = [
        {
          id: 1,
          announcement_title: 'Project Milestone Update',
          announcement_content: 'We have successfully completed Phase 1 of the project. Great work everyone! Please prepare for Phase 2 which starts next week.',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          announcement_title: 'Weekly Team Meeting',
          announcement_content: 'Reminder: Our weekly team meeting is scheduled for Friday at 2:00 PM. Please come prepared with your progress updates.',
          created_at: '2024-01-14T09:15:00Z'
        },
        {
          id: 3,
          announcement_title: 'Documentation Guidelines',
          announcement_content: 'Please ensure all code is properly documented according to our project standards. Refer to the style guide for details.',
          created_at: '2024-01-13T14:45:00Z'
        }
      ];
      
      setTimeout(() => {
        setAnnouncements(sampleAnnouncements);
        setAnnouncementsLoading(false);
      }, 500);
      
      // Uncomment when backend API is ready
      /*
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'fetchAnnouncements',
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
        setAnnouncements(response.data.data || []);
      }
      */
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
      setAnnouncementsLoading(false);
    }
  };

  const createAnnouncement = async (announcementData) => {
    try {
      // For now, simulate API call with sample data
      const newAnnouncement = {
        id: Date.now(),
        announcement_title: announcementData.announcement_title,
        announcement_content: announcementData.announcement_content,
        created_at: new Date().toISOString()
      };
      
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      toast.success('Announcement created successfully');
      setShowAnnouncementModal(false);
      

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
  };

  const updateAnnouncement = async (announcementId, announcementData) => {
    try {
      // For now, simulate API call with sample data
      setAnnouncements(prev => prev.map(ann => 
        ann.id === announcementId 
          ? { ...ann, ...announcementData }
          : ann
      ));
      toast.success('Announcement updated successfully');
      setShowAnnouncementModal(false);
      setEditingAnnouncement(null);
      
      // Uncomment when backend API is ready
      /*
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
      */
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="h-4 w-4 mr-1" />
            In Progress
          </span>
        );
      case 'not_started':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Not Started
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

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
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden flex">
        {/* Main Content */}
        <div className={`transition-all duration-300 ${announcementSidebarCollapsed ? 'flex-1' : 'flex-1 lg:flex-none lg:w-2/3'} overflow-x-hidden`}>
          <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/teacher/workspace')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Workspace
            </button>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {projectMaster?.project_title || projectTitle || 'All Projects'}
                </h1>
                {projectMaster && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p><span className="font-medium">Code:</span> {projectMaster.project_code}</p>
                    {projectMaster.project_description && (
                      <p className="mt-1">{projectMaster.project_description}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPhaseModal(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Phase
                </button>
              </div>
            </div>
          </div>

          {/* Project Phases Timeline */}
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Project Phases</h3>
                  <span className="text-sm text-gray-500">{phases.length} phases</span>
                </div>
              </div>
              
              {phasesLoading ? (
                <div className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading phases...</p>
                </div>
              ) : phases.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No phases created</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create phases to organize your project timeline.
                  </p>
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
                        Project ID
                      </th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{project.project_main_id}
                        </td>
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
                              <div className="text-sm text-gray-500">
                                ID: {project.project_created_by_user_id}
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            project.project_is_active === 1 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {project.project_is_active === 1 ? (
                              <><CheckCircleIcon className="h-3 w-3 mr-1" />Active</>
                            ) : (
                              <><XCircleIcon className="h-3 w-3 mr-1" />Inactive</>
                            )}
                          </span>
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
          <Create_Phase_Modal
            show={showPhaseModal}
            onHide={() => setShowPhaseModal(false)}
            projectMasterId={projectId}
            onPhasesAdded={() => {
              // Refresh phases data after adding new phases
              fetchPhases();
            }}
          />
          </div>
        </div>

        {/* Announcement Sidebar */}
        <div className={`transition-all duration-300 bg-white border-l border-gray-200 ${announcementSidebarCollapsed ? 'w-12' : 'w-full lg:w-1/3'} flex flex-col`}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!announcementSidebarCollapsed && (
              <>
                <div className="flex items-center space-x-2">
                  <SpeakerWaveIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-medium text-gray-900">Announcements</h3>
                </div>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add
                </button>
              </>
            )}
            <button
              onClick={() => setAnnouncementSidebarCollapsed(!announcementSidebarCollapsed)}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              {announcementSidebarCollapsed ? (
                <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Sidebar Content */}
          {!announcementSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto">
              {announcementsLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading announcements...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-4 text-center">
                  <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No announcements</h3>
                  <p className="mt-1 text-sm text-gray-500">Create your first announcement to keep everyone informed.</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 flex-1">
                          {announcement.announcement_title}
                        </h4>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingAnnouncement(announcement);
                              setShowAnnouncementModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-indigo-600"
                            title="Edit announcement"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteAnnouncement(announcement.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete announcement"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        {announcement.announcement_content}
                      </p>
                      
                      <div className="flex items-center justify-end text-xs text-gray-500">
                        <span>
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
              (data) => updateAnnouncement(editingAnnouncement.id, data) :
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
