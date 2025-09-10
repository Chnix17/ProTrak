import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
  SparklesIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import TeacherMainTab from './components/TeacherMainTab';
import MembersTab from './components/MembersTab';
import TaskTab from './components/TaskTab';
import ProjectProgressBar from './components/ProjectProgressBar';


const TeacherProjectDetailView = () => {
  const { projectMasterId, projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('main');
  const [project, setProject] = useState(null);
  const [masterProject, setMasterProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const baseUrl = SecureStorage.getLocalItem("url");

  const fetchProjectDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchProjectMainById',
          project_main_id: parseInt(projectId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setProject(response.data.data);
        // Set master project info from the main project data
        setMasterProject({
          project_title: response.data.data.project_title,
          project_code: `PROJ-${response.data.data.project_main_id}`,
          project_description: response.data.data.project_description
        });
      } else {
        toast.error('Failed to load project details');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, baseUrl]);

  // Check if all phases are completed
  const areAllPhasesCompleted = useCallback(() => {
    if (!project?.phases || project.phases.length === 0) {
      console.log('No phases found or empty phases array');
      return false;
    }
    const allCompleted = project.phases.every(phase => {
      const status = phase.status?.toLowerCase();
      const isComplete = status === 'completed' || status === 'approved' || status === 'passed';
      console.log(`Phase ${phase.phase_name || 'unnamed'}: status=${status}, isComplete=${isComplete}`);
      return isComplete;
    });
    console.log('All phases completed:', allCompleted);
    return allCompleted;
  }, [project]);

  // Handle project status update (complete/fail)
  const handleUpdateProjectStatus = async (isCompleted) => {
    if (!areAllPhasesCompleted()) {
      toast.error('All phases must be completed before updating project status');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      // Log the data being sent
      const requestData = {
        operation: 'updateCompleteStatus',
        project_status_project_main_id: parseInt(projectId),
        is_completed: isCompleted,
        user_id: userId
      };
      
      console.log('Sending request to update project status:', requestData);
      
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        JSON.stringify(requestData), // Ensure data is stringified
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Response from server:', response.data);

      if (response.data && response.data.status === 'success') {
        toast.success(`Project marked as ${isCompleted ? 'completed' : 'failed'} successfully`);
        fetchProjectDetails(); // Refresh project data
      } else {
        const errorMsg = response.data?.message || 'Failed to update project status';
        console.error('API Error:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error updating project status:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      toast.error(`Failed to update project status: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Show confirmation dialog for status update
  const showStatusUpdateConfirm = (isCompleted) => {
    console.log('showStatusUpdateConfirm called with isCompleted:', isCompleted);
    
    const confirmMessage = `Are you sure you want to mark this project as ${isCompleted ? 'completed' : 'failed'}?`;
    const userConfirmed = window.confirm(confirmMessage);
    
    if (userConfirmed) {
      handleUpdateProjectStatus(isCompleted);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  const tabs = [
    { id: 'main', name: 'Main', description: 'Project phases and review workspace' },
    { id: 'tasks', name: 'Tasks', description: 'View project tasks and assignments' },
    { id: 'members', name: 'Members', description: 'View project team members and ratings' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading project details...</p>
            <div className="mt-2 flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary-medium rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-primary-subtle rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="p-6">
          {/* Enhanced Gradient Header */}
          <div className="relative bg-gradient-to-r from-primary via-primary-medium to-primary-subtle rounded-2xl shadow-xl mb-8 overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute top-1/2 -left-8 w-32 h-32 bg-white/5 rounded-full"></div>
              <div className="absolute bottom-0 right-1/4 w-16 h-16 bg-white/10 rounded-full"></div>
            </div>
            
            <div className="relative p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <button
                    onClick={() => navigate(`/teacher/projects`, {
                      state: {
                        projectId: projectMasterId,
                        projectTitle: masterProject?.project_title
                      }
                    })}
                    className="mt-1 p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                  >
                    <ArrowLeftIcon className="h-6 w-6" />
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                        <DocumentTextIcon className="h-6 w-6 text-white" />
                      </div>
                      <h1 className="text-3xl font-bold text-white">
                        {project?.title || 'Project Review'}
                      </h1>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-white/90">
                      <div className="flex items-center space-x-2">
                        <SparklesIcon className="h-4 w-4" />
                        <span className="font-medium">{masterProject?.project_title}</span>
                      </div>
                      {masterProject?.project_code && (
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                          <span className="text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            {masterProject.project_code}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                        <span className="text-sm bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full font-medium">
                          Teacher Review Mode
                        </span>
                      </div>
                      {/* Project Status Actions */}
                      {console.log('Rendering status buttons. Current status:', project?.status_master_name)}
                      {areAllPhasesCompleted() && project?.status_master_name?.toLowerCase() !== 'completed' && 
                        project?.status_master_name?.toLowerCase() !== 'failed' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => showStatusUpdateConfirm(true)}
                              disabled={isUpdatingStatus}
                              className="text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full font-medium flex items-center space-x-1 transition-colors disabled:opacity-50"
                            >
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              <span>Mark as Completed</span>
                            </button>
                            <button
                              onClick={() => showStatusUpdateConfirm(false)}
                              disabled={isUpdatingStatus}
                              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full font-medium flex items-center space-x-1 transition-colors disabled:opacity-50"
                            >
                              <XCircleIcon className="h-3.5 w-3.5" />
                              <span>Mark as Failed</span>
                            </button>
                          </div>
                        </div>
                      )}
                      {project?.status_master_name && (
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                          <span className={`text-sm font-medium px-3 py-1.5 rounded-full flex items-center space-x-1.5 
                            ${
                              project.status_master_name.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                              project.status_master_name.toLowerCase() === 'in progress' ? 'bg-blue-100 text-blue-800' :
                              project.status_master_name.toLowerCase() === 'pending' ? 'bg-amber-100 text-amber-800' :
                              'bg-white/20 text-white'
                            }`}>
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            <span className="font-semibold">{project.status_master_name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Description Card */}
          {project?.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary-subtle rounded-lg p-2 mr-4">
                  <DocumentTextIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Description</h3>
                  <p className="text-gray-700 leading-relaxed">{project.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Project Progress Bar */}
          <ProjectProgressBar 
            project={project} 
            projectId={projectId}
          />

          {/* Enhanced Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="border-b border-gray-100">
              <nav className="-mb-px flex space-x-1 px-6">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const TabIcon = tab.id === 'main' ? ClipboardDocumentListIcon : 
                                 tab.id === 'tasks' ? Squares2X2Icon : UserGroupIcon;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'border-primary text-primary bg-primary-subtle/30'
                          : 'border-transparent text-gray-500 hover:text-primary hover:border-primary-medium hover:bg-primary-subtle/20'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <TabIcon className={`h-4 w-4 transition-colors ${
                          isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'
                        }`} />
                        <span>{tab.name}</span>
                      </div>
                      {isActive && (
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary to-primary-medium rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </nav>
              
              {/* Tab Description */}
              <div className="px-6 py-3 bg-gray-50/50">
                <p className="text-sm text-gray-600">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
            </div>

            {/* Enhanced Tab Content */}
            <div className="p-6">
              <div className="transition-all duration-300 ease-in-out">
                {activeTab === 'main' && (
                  <div className="animate-fadeIn">
                    <TeacherMainTab 
                      project={project} 
                      projectId={projectId}
                      onProjectUpdate={fetchProjectDetails}
                    />
                  </div>
                )}
                {activeTab === 'tasks' && (
                  <div className="animate-fadeIn">
                    <TaskTab 
                      project={project} 
                      projectId={projectId}
                      onTaskUpdate={fetchProjectDetails}
                      isViewOnly={true}
                    />
                  </div>
                )}
                {activeTab === 'members' && (
                  <div className="animate-fadeIn">
                    <MembersTab 
                      projectId={projectId}
                      isViewOnly={true}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProjectDetailView;
