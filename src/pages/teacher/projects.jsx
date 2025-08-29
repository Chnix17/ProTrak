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
  PlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { Create_Phase_Modal } from './lib/modal_create_phase';

const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allProjects, setAllProjects] = useState([]);
  const [studentProjects, setStudentProjects] = useState([]);
  const [projectMaster, setProjectMaster] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [phases, setPhases] = useState([]);
  const [phasesLoading, setPhasesLoading] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);

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
    fetchStudentProjects();
    fetchPhases();
    fetchAllProjects();
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
    }
  };

  const fetchStudentProjects = async () => {
    try {
      setIsLoading(true);
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'fetchStudentProjectsByProjectMasterId',
          projectMasterId: projectId
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setStudentProjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching student projects:', error);
      toast.error('Failed to load student projects');
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
          master_id: "2"  // You can make this dynamic based on your needs
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

  const filteredProjects = selectedStatus === 'all' 
    ? studentProjects 
    : studentProjects.filter(project => project.status === selectedStatus);

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
            <p className="mt-2 text-gray-600">Loading student projects...</p>
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
                  {projectMaster?.project_title || projectTitle || 'Student Projects'}
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
                  onClick={() => setShowAllProjects(!showAllProjects)}
                  className={`px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    showAllProjects ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  {showAllProjects ? 'Show Student Projects' : 'Show All Projects'}
                </button>
                
                {!showAllProjects && (
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                )}
                
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
                  <p className="text-2xl font-semibold text-gray-900">{studentProjects.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {studentProjects.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">In Progress</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {studentProjects.filter(p => p.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center">
                <XCircleIcon className="h-8 w-8 text-gray-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Not Started</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {studentProjects.filter(p => p.status === 'not_started').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* All Projects Table or Student Projects List */}
          {showAllProjects ? (
            /* All Projects Table */
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
                                navigate('/teacher/projects', {
                                  state: {
                                    projectId: project.project_main_id,
                                    projectTitle: project.project_title
                                  }
                                });
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-3"
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
          ) : (
            /* Student Projects List */
            filteredProjects.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No student projects found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedStatus === 'all' 
                    ? 'No students have been assigned to this project yet.'
                    : `No projects with status "${selectedStatus}" found.`
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Student Projects</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {filteredProjects.map((project, index) => (
                    <div key={project.student_project_id || index} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {project.student_name || `Student ${index + 1}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {project.student_id || 'ID: N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {getStatusBadge(project.status)}
                          
                          <div className="text-sm text-gray-500">
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              // Handle view project details
                              toast.info('View project details functionality coming soon');
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600"
                            title="View project details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {project.description && (
                        <div className="mt-3 text-sm text-gray-600">
                          <p>{project.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

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
    </div>
  );
};

export default Projects;
