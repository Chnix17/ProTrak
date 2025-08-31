import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  UserIcon,
  UsersIcon,
  CodeBracketIcon,
  FolderIcon,
  ChartBarIcon,
  ClockIcon,
  UserPlusIcon,
  SpeakerWaveIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import ModalCreateProject from './lib/modal_create_project';
import InviteStudentModal from './lib/InviteStudentModal';

const StudentProjectView = () => {
  const { projectMasterId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [collaboratorProjects, setCollaboratorProjects] = useState([]);
  const [masterProject, setMasterProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [processingCollaboration, setProcessingCollaboration] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch other collaborators' projects in this workspace
  const fetchCollaboratorProjects = React.useCallback(async () => {
    try {
      setIsLoadingCollaborators(true);
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchCollaborator',
          user_id: parseInt(userId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setCollaboratorProjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching collaborator projects:', error);
      toast.error('Failed to load collaborator projects');
    } finally {
      setIsLoadingCollaborators(false);
    }
  }, [baseUrl]);

  // Fetch student's projects for this master project
  const fetchMyProjects = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchMyProjects',
          user_id: parseInt(userId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        // Filter projects for this specific master project and extract project items
        const masterProject = response.data.data.find(
          project => project.project_master_id === parseInt(projectMasterId)
        );
        
        if (masterProject) {
          // Set master project info
          setMasterProject({
            project_title: masterProject.project_title,
            project_description: masterProject.project_description,
            project_code: masterProject.project_code,
            teacher_name: masterProject.teacher_name
          });
          
          // Extract and set project items
          const projectItems = masterProject.project_items || [];
          setProjects(projectItems);
        } else {
          setProjects([]);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, projectMasterId]);

  // Fetch master project details if no projects found
  const fetchMasterProjectDetails = React.useCallback(async () => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchJoinedWorkspace',
          student_id: userId
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        const masterProjectData = response.data.data.find(
          item => item.project.project_master_id === parseInt(projectMasterId)
        );
        
        if (masterProjectData) {
          setMasterProject({
            project_title: masterProjectData.project.project_title,
            project_description: masterProjectData.project.project_description,
            project_code: masterProjectData.project.project_code,
            teacher_name: 'Unknown' // This might need to be fetched separately
          });
        }
      }
    } catch (error) {
      console.error('Error fetching master project details:', error);
    }
  }, [baseUrl, projectMasterId]);

  // Fetch announcements for this project
  const fetchAnnouncements = React.useCallback(async () => {
    try {
      setIsLoadingAnnouncements(true);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchAnnouncements',
          project_master_id: parseInt(projectMasterId)
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
      setIsLoadingAnnouncements(false);
    }
  }, [baseUrl, projectMasterId]);

  // Handle successful project creation
  const handleProjectCreated = () => {
    fetchMyProjects();
  };

  // Handle collaboration acceptance
  const handleAcceptCollaboration = async (projectMembersId) => {
    try {
      setProcessingCollaboration(projectMembersId);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'updateCollaborator',
          project_members_id: projectMembersId,
          accepted: true
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Collaboration accepted successfully!');
        fetchCollaboratorProjects(); // Refresh the list
      } else {
        toast.error('Failed to accept collaboration');
      }
    } catch (error) {
      console.error('Error accepting collaboration:', error);
      toast.error('Failed to accept collaboration');
    } finally {
      setProcessingCollaboration(null);
    }
  };

  // Handle collaboration decline
  const handleDeclineCollaboration = async (projectMembersId) => {
    try {
      setProcessingCollaboration(projectMembersId);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'updateCollaborator',
          project_members_id: projectMembersId,
          accepted: false
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Collaboration declined');
        fetchCollaboratorProjects(); // Refresh the list
      } else {
        toast.error('Failed to decline collaboration');
      }
    } catch (error) {
      console.error('Error declining collaboration:', error);
      toast.error('Failed to decline collaboration');
    } finally {
      setProcessingCollaboration(null);
    }
  };

  useEffect(() => {
    fetchMyProjects();
    fetchCollaboratorProjects();
    fetchAnnouncements();
  }, [projectMasterId, fetchMyProjects, fetchCollaboratorProjects, fetchAnnouncements]);

  useEffect(() => {
    if (projects.length === 0 && !isLoading) {
      fetchMasterProjectDetails();
    }
  }, [projects, isLoading, fetchMasterProjectDetails]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      

      <Sidebar />
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
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
                      onClick={() => navigate('/student/workspace')}
                      className="mr-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold mb-2">
                        {masterProject?.project_title || 'Project Workspace'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-4 text-primary-subtle opacity-90">
                        {masterProject?.project_code && (
                          <div className="flex items-center">
                            <CodeBracketIcon className="h-4 w-4 mr-1" />
                            <span className="font-mono">{masterProject.project_code}</span>
                          </div>
                        )}
                        {masterProject?.teacher_name && (
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>{masterProject.teacher_name}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <FolderIcon className="h-4 w-4 mr-1" />
                          <span>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowInviteModal(true)}
                        className="inline-flex items-center px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary transition-all duration-200 border border-white/20"
                      >
                        <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        Invite Students
                      </button>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary transition-all duration-200 shadow-lg"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        New Project
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* My Projects Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-primary-subtle rounded-lg p-2 mr-3">
                    <FolderIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">My Projects</h2>
                    <p className="text-sm text-gray-600">Your individual contributions to this workspace</p>
                  </div>
                </div>
                {projects.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <ChartBarIcon className="h-4 w-4" />
                    <span>{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              
              {projects.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                  <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Start contributing to this workspace by creating your first project. This will be your main deliverable for this assignment.
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-lg"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Create Your First Project
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project, index) => (
                    <div key={`${project.project_main_id}-${index}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-primary-subtle rounded-xl p-3 group-hover:bg-primary-light transition-colors">
                              <FolderIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                {project.title || `Project ${index + 1}`}
                              </h3>
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <UsersIcon className="h-4 w-4 mr-1" />
                                <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center text-xs text-gray-500">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span>Last updated 2 days ago</span>
                          </div>
                          <button
                            onClick={() => {
                              navigate(`/student/project/${projectMasterId}/${project.project_main_id}`);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                          >
                            <EyeIcon className="-ml-0.5 mr-2 h-4 w-4" />
                            Open Project
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

        {/* Collaborations Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-blue-50 rounded-lg p-2 mr-3">
                  <UsersIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Collaborations</h2>
                  <p className="text-sm text-gray-600">Manage your project collaborations and invitations</p>
                </div>
              </div>
              {collaboratorProjects.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <UsersIcon className="h-4 w-4" />
                  <span>{collaboratorProjects.length} collaboration{collaboratorProjects.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          
            {isLoadingCollaborators ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading collaborators...</p>
              </div>
            ) : collaboratorProjects.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <UsersIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No collaborations</h3>
                <p className="text-gray-600">
                  You don't have any collaboration invitations or active collaborations at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Pending Invitations */}
                {collaboratorProjects.filter(collab => collab.member_is_active === 0).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                        {collaboratorProjects.filter(collab => collab.member_is_active === 0).length}
                      </span>
                      Pending Invitations
                    </h3>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                      {collaboratorProjects
                        .filter(collab => collab.member_is_active === 0)
                        .map((collaborator, index) => (
                        <div key={`pending-${collaborator.project_main_id || index}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group border-l-4 border-l-yellow-400">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 bg-yellow-50 rounded-xl p-3 group-hover:bg-yellow-100 transition-colors">
                                  <UserIcon className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                                    {collaborator.creator_name || 'Student'}
                                  </h3>
                                  <p className="text-sm text-gray-600 font-medium">
                                    {collaborator.project_title}
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {collaborator.project_description}
                            </p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center text-xs text-gray-500">
                                <UsersIcon className="h-4 w-4 mr-1" />
                                <span>{collaborator.member_count} member{collaborator.member_count !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleDeclineCollaboration(collaborator.project_members_id)}
                                  disabled={processingCollaboration === collaborator.project_members_id}
                                  className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingCollaboration === collaborator.project_members_id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                                  ) : null}
                                  Decline
                                </button>
                                <button
                                  onClick={() => handleAcceptCollaboration(collaborator.project_members_id)}
                                  disabled={processingCollaboration === collaborator.project_members_id}
                                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processingCollaboration === collaborator.project_members_id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                                  ) : null}
                                  Accept
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Collaborations */}
                {collaboratorProjects.filter(collab => collab.member_is_active === 1).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mr-2">
                        {collaboratorProjects.filter(collab => collab.member_is_active === 1).length}
                      </span>
                      Active Collaborations
                    </h3>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                      {collaboratorProjects
                        .filter(collab => collab.member_is_active === 1)
                        .map((collaborator, index) => (
                        <div key={`active-${collaborator.project_main_id || index}`} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group border-l-4 border-l-green-400">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 bg-green-50 rounded-xl p-3 group-hover:bg-green-100 transition-colors">
                                  <UserIcon className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                                    {collaborator.creator_name || 'Student'}
                                  </h3>
                                  <p className="text-sm text-gray-600 font-medium">
                                    {collaborator.project_title}
                                  </p>
                                </div>
                              </div>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {collaborator.project_description}
                            </p>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center text-xs text-gray-500">
                                <UsersIcon className="h-4 w-4 mr-1" />
                                <span>{collaborator.member_count} member{collaborator.member_count !== 1 ? 's' : ''}</span>
                              </div>
                              <button
                                onClick={() => {
                                  navigate(`/student/project-detail/${collaborator.project_main_master_id}/${collaborator.project_main_id}`);
                                }}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition-all duration-200"
                              >
                                <EyeIcon className="-ml-0.5 mr-2 h-4 w-4" />
                                View Project
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Right Sidebar - Announcements */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto hidden lg:block">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="bg-amber-50 rounded-lg p-2 mr-3">
                <SpeakerWaveIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Announcements</h2>
                <p className="text-xs text-gray-600">Latest updates</p>
              </div>
            </div>
            
            {isLoadingAnnouncements ? (
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
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          {announcement.announcement_title}
                        </h3>
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
      </div>

      {/* Create Project Modal */}
      <ModalCreateProject
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
        projectMasterId={projectMasterId}
      />

      {/* Invite Student Modal */}
      <InviteStudentModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        projectMasterId={projectMasterId}
      />
    </div>
  );
};

export default StudentProjectView;
