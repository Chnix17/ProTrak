import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import MainTab from './components/MainTab';
import KanbanTab from './components/KanbanTab';

const ProjectDetailView = () => {
  const { projectMasterId, projectId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('main');
  const [project, setProject] = useState(null);
  const [masterProject, setMasterProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const baseUrl = SecureStorage.getLocalItem("url");

  const fetchProjectDetails = async () => {
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
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const tabs = [
    { id: 'main', name: 'Main', description: 'Project phases and milestones' },
    { id: 'kanban', name: 'Kanban', description: 'Task management and to-do lists' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate(`/student/project/${projectMasterId}`)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {project?.title || 'Project Details'}
              </h1>
              <div className="mt-1 text-sm text-gray-600">
                <span>{masterProject?.project_title}</span>
                {masterProject?.project_code && (
                  <>
                    <span className="mx-2">•</span>
                    <span>Code: {masterProject.project_code}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Project Description */}
          {project?.description && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <p className="text-gray-700">{project.description}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'main' && (
                <MainTab 
                  project={project} 
                  projectId={projectId}
                  onProjectUpdate={fetchProjectDetails}
                />
              )}
              {activeTab === 'kanban' && (
                <KanbanTab 
                  project={project} 
                  projectId={projectId}
                  onTaskUpdate={fetchProjectDetails}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailView;
