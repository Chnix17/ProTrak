import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
  SparklesIcon,
  UserGroupIcon
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
