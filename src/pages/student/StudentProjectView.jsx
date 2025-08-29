import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import ModalCreateProject from './lib/modal_create_project';

const StudentProjectView = () => {
  const { projectMasterId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [collaboratorProjects, setCollaboratorProjects] = useState([]);
  const [masterProject, setMasterProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch other collaborators' projects in this workspace
  const fetchCollaboratorProjects = async () => {
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
  };

  // Fetch student's projects for this master project
  const fetchMyProjects = async () => {
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
  };

  // Fetch master project details if no projects found
  const fetchMasterProjectDetails = async () => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchJoinedWorkspace',
          student_id: SecureStorage.getLocalItem('user_id')
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
  };

  // Handle successful project creation
  const handleProjectCreated = () => {
    fetchMyProjects();
  };

  useEffect(() => {
    fetchMyProjects();
    fetchCollaboratorProjects();
  }, [projectMasterId]);

  useEffect(() => {
    if (projects.length === 0 && !isLoading) {
      fetchMasterProjectDetails();
    }
  }, [projects, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your projects...</p>
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
          {/* Header with back button */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => navigate('/student/workspace')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">
                {masterProject?.project_title || 'Project Workspace'}
              </h1>
              {masterProject && (
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                  <span>Code: {masterProject.project_code}</span>
                  {masterProject.teacher_name && (
                    <>
                      <span>•</span>
                      <span className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {masterProject.teacher_name}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Project
            </button>
          </div>

          {/* Master project description */}
          {masterProject?.project_description && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <p className="text-gray-700">{masterProject.project_description}</p>
            </div>
          )}

          {/* My Projects Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
              {projects.length > 0 && (
                <span className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            
            {projects.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first main project for this workspace.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Create Main Project
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <div key={`${project.project_main_id}-${index}`} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {project.title || `Project ${index + 1}`}
                        </h3>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigate(`/student/project/${projectMasterId}/${project.project_main_id}`);
                        }}
                        className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <EyeIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Collaborators Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Other Collaborators</h2>
            {collaboratorProjects.length > 0 && (
              <span className="text-sm text-gray-500">{collaboratorProjects.length} collaborator{collaboratorProjects.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          
          {isLoadingCollaborators ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading collaborators...</p>
            </div>
          ) : collaboratorProjects.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <UserIcon className="mx-auto h-8 w-8 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No other collaborators</h3>
              <p className="mt-1 text-sm text-gray-500">
                You're the only student working on this project workspace.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collaboratorProjects.map((collaborator, index) => (
                <div key={`collaborator-${collaborator.project_main_id || index}`} className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-l-green-400">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          {collaborator.creator_name || 'Student'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {collaborator.project_title}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          {collaborator.project_description}
                        </p>
                        <div className="space-y-1 text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            <span>{collaborator.member_count} member{collaborator.member_count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              collaborator.project_is_active === 1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {collaborator.project_is_active === 1 ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // Navigate to collaborator's project or handle view action
                          toast.info('Collaborator project view functionality to be implemented');
                        }}
                        className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <EyeIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <ModalCreateProject
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
        projectMasterId={projectMasterId}
      />
      </div>
    </div>
  );
};

export default StudentProjectView;
