import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  EyeIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import { Create_Modal as CreateModal } from './lib/modal_create_project';
import { useNavigate } from 'react-router-dom';

const Workspace = () => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [isLoading, setIsLoading] = useState({
    semesters: true,
    schoolYears: false,
    projects: false
  });


  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch semesters on component mount
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const token = SecureStorage.getLocalItem('token');
        const response = await axios.post(
          `${baseUrl}admin.php`,
          { operation: 'fetchSemester' },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.data.status === 'success') {
          setSemesters(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedSemester(response.data.data[0].semester_id);
          }
        }
      } catch (error) {
        console.error('Error fetching semesters:', error);
        toast.error('Failed to load semesters');
      } finally {
        setIsLoading(prev => ({ ...prev, semesters: false }));
      }
    };

    fetchSemesters();
  }, [baseUrl]);

  // Fetch school years when semester changes
  useEffect(() => {
    const fetchSchoolYears = async () => {
      if (!selectedSemester) return;
      
      try {
        setIsLoading(prev => ({ ...prev, schoolYears: true }));
        const token = SecureStorage.getLocalItem('token');
        const response = await axios.post(
          `${baseUrl}admin.php`,
          { 
            operation: 'fetchSchoolYearBySemesterId',
            semesterId: selectedSemester
          },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.data.status === 'success') {
          setSchoolYears(response.data.data);
          if (response.data.data.length > 0) {
            setSelectedSchoolYear(response.data.data[0].school_year_id);
          } else {
            setSelectedSchoolYear('');
            setProjects([]);
          }
        }
      } catch (error) {
        console.error('Error fetching school years:', error);
        toast.error('Failed to load school years');
      } finally {
        setIsLoading(prev => ({ ...prev, schoolYears: false }));
      }
    };

    fetchSchoolYears();
  }, [selectedSemester, baseUrl]);

  const fetchProjects = useCallback(async () => {
    if (!selectedSchoolYear) return;
    
    try {
      setIsLoading(prev => ({ ...prev, projects: true }));
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'fetchProjectMasterBySchool_year_id',
          schoolYearId: selectedSchoolYear,
          project_teacher_id: SecureStorage.getLocalItem('user_id')
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
      setIsLoading(prev => ({ ...prev, projects: false }));
    }
  }, [selectedSchoolYear, baseUrl]);

  // Fetch projects when school year changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);



  // const deleteProject = async (projectId) => {
  //   if (window.confirm('Are you sure you want to delete this project?')) {
  //     try {
  //       const token = SecureStorage.getLocalItem('token');
  //       await axios.delete(`${baseUrl}teacher.php`, {
  //         headers: { Authorization: `Bearer ${token}` }
  //       });
  //       fetchProjects(selectedSemester);
  //     } catch (error) {
  //       console.error('Error deleting project:', error);
  //     }
  //   }
  // };

  if (isLoading.semesters) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading semesters...</p>
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
            <h1 className="text-2xl font-bold text-gray-800">Workspace</h1>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(Number(e.target.value))}
                  className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isLoading.schoolYears}
                >
                  <option value="">Select Semester</option>
                  {semesters.map((semester) => (
                    <option key={semester.semester_id} value={semester.semester_id}>
                      {semester.semester_name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSchoolYear}
                  onChange={(e) => setSelectedSchoolYear(Number(e.target.value))}
                  className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={!selectedSemester || isLoading.schoolYears || isLoading.projects}
                >
                  <option value="">Select School Year</option>
                  {schoolYears.map((year) => (
                    <option key={year.school_year_id} value={year.school_year_id}>
                      {year.school_year_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setShowProjectForm(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                disabled={!selectedSchoolYear || isLoading.projects}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Project
              </button>
            </div>
          </div>

          {isLoading.projects ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : !selectedSchoolYear ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Select a school year</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a semester and school year to view projects
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No projects available for the selected school year.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowProjectForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  New Project
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div key={project.project_master_id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{project.project_title}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {project.project_is_active === '1' ? 'Active' : 'Inactive'}
                          </span>
                        </p>
                        {project.project_description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {project.project_description}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => {
                            // Handle edit
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600"
                          title="Edit project"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            navigate('/teacher/projects', { 
                              state: { 
                                projectId: project.project_master_id,
                                projectTitle: project.project_title,
                                schoolYearId: selectedSchoolYear,
                                semesterId: selectedSemester
                              }
                            });
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600"
                          title="View project"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700">Code:</span>
                        <span className="ml-1 font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {project.project_code}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Project Modal */}
          <CreateModal
            show={showProjectForm}
            onHide={() => setShowProjectForm(false)}
            fetchProjects={fetchProjects}
            selectedSemester={selectedSemester}
            selectedSchoolYear={selectedSchoolYear}
          />
            
        </div>
      </div>
    </div>
  );
};

export default Workspace;