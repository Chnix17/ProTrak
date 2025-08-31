import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  EyeIcon,
  CalendarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  CodeBracketIcon
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
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading semesters...</p>
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
                  <h1 className="text-3xl font-bold mb-2">My Workspace</h1>
                  <p className="text-primary-subtle opacity-90">Manage your projects and track student progress</p>
                </div>
                <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <div className="flex space-x-2">
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(Number(e.target.value))}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-gray-900 bg-white"
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
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-gray-900 bg-white"
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
                    className="inline-flex items-center px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary transition-all duration-200 shadow-lg disabled:opacity-50"
                    disabled={!selectedSchoolYear || isLoading.projects}
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Project
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <UsersIcon className="h-4 w-4" />
                  <span>{projects.length} projects</span>
                </div>
              </div>
            </div>
          </div>

          {isLoading.projects ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading projects...</p>
              </div>
            </div>
          ) : !selectedSchoolYear ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <CalendarIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a school year</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Please select a semester and school year to view and manage your projects.
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <DocumentTextIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first project to start collaborating with students and tracking their progress.
              </p>
              <button
                type="button"
                onClick={() => setShowProjectForm(true)}
                className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-lg"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <div key={project.project_master_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary-subtle rounded-xl p-3 group-hover:bg-primary-light transition-colors">
                          <DocumentTextIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {project.project_title}
                          </h3>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <CodeBracketIcon className="h-4 w-4 mr-1" />
                            <span className="font-mono">{project.project_code}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.project_is_active === '1' 
                            ? 'bg-primary-subtle text-primary' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                    
                        </span>
                      </div>
                    </div>
                    
                    {project.project_description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {project.project_description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center text-xs text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>Created {new Date(project.project_date_created).toLocaleDateString()}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            // Handle edit
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
                          title="Edit project"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
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
                          className="inline-flex items-center px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                          title="View project"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Open
                        </button>
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