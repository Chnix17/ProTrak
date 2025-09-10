import React, { useState, useEffect, useCallback } from 'react';
import { 
  EyeIcon,
  DocumentTextIcon,
  UserPlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  CodeBracketIcon,
  ArchiveBoxIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import { useNavigate } from 'react-router-dom';

const StudentWorkspace = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [projectDetails, setProjectDetails] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'
  const [searchTerm, setSearchTerm] = useState('');
  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch student's joined workspaces
  const fetchStudentProjects = useCallback(async () => {
    try {
      setIsLoading(true);
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
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl]);

  // Validate project code
  const validateProjectCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast.error('Please enter a project code');
      return;
    }

    try {
      setIsValidating(true);
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'findProjectMasterByCode',
          project_code: joinCode.trim()
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success' && response.data.data) {
        setProjectDetails(response.data.data);
      } else {
        toast.error('Project not found or invalid code');
        setProjectDetails(null);
      }
    } catch (error) {
      console.error('Error validating project code:', error);
      toast.error(error.response?.data?.message || 'Error validating project code');
      setProjectDetails(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle joining a workspace
  const handleJoinWorkspace = async () => {
    if (!projectDetails) return;

    try {
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      // First save the joined workspace
      const joinResponse = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'saveJoinedWorkspace',
          user_id: parseInt(userId),
          project_master_id: projectDetails.project_master_id
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (joinResponse.data.status === 'success') {
        toast.success('Successfully joined the workspace!');
        setShowJoinModal(false);
        setJoinCode('');
        setProjectDetails(null);
        fetchStudentProjects();
      } else {
        toast.error(joinResponse.data.message || 'Failed to join workspace');
      }
    } catch (error) {
      console.error('Error joining workspace:', error);
      toast.error(error.response?.data?.message || 'Failed to join workspace');
    }
  };

  const resetJoinForm = () => {
    setJoinCode('');
    setProjectDetails(null);
    setShowJoinModal(false);
  };

  useEffect(() => {
    fetchStudentProjects();
  }, [fetchStudentProjects]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your workspaces...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-primary to-primary-medium rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">My Workspaces</h1>
                  <p className="text-primary-subtle opacity-90">Collaborate on projects and track your progress</p>
                </div>
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary transition-all duration-200 shadow-lg"
                >
                  <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Join Workspace
                </button>
              </div>
            </div>
          </div>

          {/* View Mode Toggle and Search Bar */}
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
            {/* View Mode Toggle */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('active')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'active'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2 inline" />
                    Active Projects
                  </button>
                  <button
                    onClick={() => setViewMode('archived')}
                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
                      viewMode === 'archived'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ArchiveBoxIcon className="h-4 w-4 mr-2 inline" />
                    Archived Projects
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                  <ChartBarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{(() => {
                    const filteredCount = projects.filter(project => {
                      const projectData = project.project;
                      const matchesViewMode = viewMode === 'active' 
                        ? projectData.project_is_active === 1 || projectData.project_is_active === '1'
                        : projectData.project_is_active === 0 || projectData.project_is_active === '0';
                      
                      const matchesSearch = searchTerm === '' || 
                        projectData.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        projectData.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (projectData.project_description && projectData.project_description.toLowerCase().includes(searchTerm.toLowerCase()));
                      
                      return matchesViewMode && matchesSearch;
                    }).length;
                    return `${filteredCount} project${filteredCount !== 1 ? 's' : ''}`;
                  })()}</span>
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${viewMode} projects...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm sm:text-base"
                />
              </div>
            </div>
          </div>

          {/* Filter projects based on view mode and search term */}
          {(() => {
            const filteredProjects = projects.filter(project => {
              const projectData = project.project;
              const matchesViewMode = viewMode === 'active' 
                ? projectData.project_is_active === 1 || projectData.project_is_active === '1'
                : projectData.project_is_active === 0 || projectData.project_is_active === '0';
              
              const matchesSearch = searchTerm === '' || 
                projectData.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                projectData.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (projectData.project_description && projectData.project_description.toLowerCase().includes(searchTerm.toLowerCase()));
              
              return matchesViewMode && matchesSearch;
            });

            return filteredProjects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <DocumentTextIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No workspaces yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Get started by joining a workspace with a code from your teacher. Once you join, you'll be able to collaborate and track your project progress.
              </p>
              <button
                onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-lg"
              >
                <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Join Your First Workspace
              </button>
            </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No {viewMode} projects found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm 
                        ? 'Try adjusting your search or filter criteria.'
                        : viewMode === 'active'
                          ? 'Join a workspace to get started.'
                          : 'No archived projects found.'}
                    </p>
                    {viewMode === 'active' && !searchTerm && (
                      <div className="mt-6">
                        <button
                          onClick={() => setShowJoinModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                          <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
                          Join Workspace
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  filteredProjects.map((item) => (
                <div key={item.student_joined_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary-subtle rounded-xl p-3 group-hover:bg-primary-light transition-colors">
                          <DocumentTextIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {item.project.project_title}
                          </h3>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <CodeBracketIcon className="h-4 w-4 mr-1" />
                            <span className="font-mono">{item.project.project_code}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.project.project_description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center text-xs text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>Joined {new Date(item.student_joined_date).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => navigate(`/student/project/${item.project.project_master_id}`)}
                        className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                      >
                        <EyeIcon className="-ml-0.5 mr-2 h-4 w-4" />
                        Open Project
                      </button>
                    </div>
                  </div>
                </div>
                  ))
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Join Workspace Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {projectDetails ? 'Confirm Join' : 'Join Workspace'}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {projectDetails ? 'Review project details below' : 'Enter your project code to get started'}
                  </p>
                </div>
                <button
                  onClick={resetJoinForm}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {!projectDetails ? (
                <form onSubmit={validateProjectCode} className="space-y-6">
                  <div>
                    <label htmlFor="joinCode" className="block text-sm font-semibold text-gray-900 mb-2">
                      Project Code
                    </label>
                    <div className="relative">
                      <CodeBracketIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="joinCode"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                        placeholder="Enter your project code"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Ask your teacher for the project code</p>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetJoinForm}
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isValidating}
                      className="flex-1 px-4 py-3 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
                    >
                      {isValidating ? 'Validating...' : 'Continue'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-primary-subtle p-6 rounded-xl border border-primary-light">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-primary rounded-lg p-2">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{projectDetails.project_title}</h3>
                        <p className="text-gray-700 mt-2">{projectDetails.project_description}</p>
                        <div className="mt-4 flex items-center text-sm text-gray-600">
                          <CodeBracketIcon className="h-4 w-4 mr-1" />
                          <span className="font-mono bg-white px-2 py-1 rounded">{projectDetails.project_code}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setProjectDetails(null)}
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleJoinWorkspace}
                      className="flex-1 px-4 py-3 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                    >
                      Join Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentWorkspace;
