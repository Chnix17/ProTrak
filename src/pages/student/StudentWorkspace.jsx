import React, { useState, useEffect } from 'react';
import { 
  EyeIcon,
  DocumentTextIcon,
  UserPlusIcon,
  XMarkIcon
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
  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch student's joined workspaces
  const fetchStudentProjects = async () => {
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
  };

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
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your workspaces...</p>
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">My Workspaces</h1>
            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Join Workspace
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No workspaces</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by joining a workspace with a code from your teacher.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Join Workspace
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((item) => (
                <div key={item.student_joined_id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <DocumentTextIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <div className="ml-5 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{item.project.project_title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{item.project.project_description}</p>
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 space-y-1 sm:space-y-0 sm:space-x-2">
                          <span>Code: {item.project.project_code}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Joined: {new Date(item.student_joined_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/student/project/${item.project.project_master_id}`)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <EyeIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Workspace Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {projectDetails ? 'Confirm Join Workspace' : 'Join a Workspace'}
                </h2>
                <button
                  onClick={resetJoinForm}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {!projectDetails ? (
                <form onSubmit={validateProjectCode} className="space-y-4">
                  <div>
                    <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700">
                      Enter Project Code
                    </label>
                    <input
                      type="text"
                      id="joinCode"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                      placeholder="Enter project code"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={resetJoinForm}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isValidating}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isValidating ? 'Validating...' : 'Continue'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900">{projectDetails.project_title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{projectDetails.project_description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>Project Code: {projectDetails.project_code}</p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setProjectDetails(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleJoinWorkspace}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
