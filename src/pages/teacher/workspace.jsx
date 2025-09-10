import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  EyeIcon,
  CalendarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CodeBracketIcon,
  ChartBarIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import Sidebar from '../../components/sidebar';
import { Create_Modal as CreateModal } from './lib/modal_create_project';
import EditProjectModal from './lib/EditProjectModal';
import { useNavigate } from 'react-router-dom';

const Workspace = () => {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'
  const [searchTerm, setSearchTerm] = useState('');
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
          if (response.data.data.length === 0) {
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

  // Update project master function
  const updateProjectMaster = async (projectData) => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        {
          operation: 'updateProjectMaster',
          project_master_id: projectData.project_master_id,
          project_title: projectData.project_title,
          project_description: projectData.project_description
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Project updated successfully!');
        fetchProjects(); // Refresh the projects list
        setShowEditModal(false);
        setSelectedProject(null);
      } else {
        toast.error(response.data.message || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  // Handle edit project
  const handleEditProject = (project) => {
    setSelectedProject(project);
    setShowEditModal(true);
  };

  // Archive project master function
  const archiveProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Are you sure you want to archive "${projectTitle}"? This will make the project inactive.`)) {
      return;
    }

    try {
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        {
          operation: 'updateArchive',
          project_master_id: projectId,
          archive: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Project archived successfully!');
        fetchProjects(); // Refresh the projects list
      } else {
        toast.error(response.data.message || 'Failed to archive project');
      }
    } catch (error) {
      console.error('Error archiving project:', error);
      toast.error('Failed to archive project');
    }
  };

  // Restore archived project function
  const restoreProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Are you sure you want to restore "${projectTitle}"? This will make the project active again.`)) {
      return;
    }

    try {
      const token = SecureStorage.getLocalItem('token');
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        {
          operation: 'updateArchive',
          project_master_id: projectId,
          archive: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.status === 'success') {
        toast.success('Project restored successfully!');
        fetchProjects(); // Refresh the projects list
      } else {
        toast.error(response.data.message || 'Failed to restore project');
      }
    } catch (error) {
      console.error('Error restoring project:', error);
      toast.error('Failed to restore project');
    }
  };

  // Filter projects based on view mode and search term
  const filteredProjects = projects.filter(project => {
    const matchesViewMode = viewMode === 'active' 
      ? project.project_is_active === 1 || project.project_is_active === '1'
      : project.project_is_active === 0 || project.project_is_active === '0';
    
    const matchesSearch = searchTerm === '' || 
      project.project_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.project_description && project.project_description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesViewMode && matchesSearch;
  });



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
        <div className="p-3 sm:p-6">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-gradient-to-r from-primary to-primary-medium rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-6 lg:p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
              <div className="relative">
                {/* Title Section */}
                <div className="mb-4 sm:mb-6">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 leading-tight">Project Masters Workspace</h1>
                  <p className="text-primary-subtle opacity-90 text-sm sm:text-base">Manage your projects and track student progress</p>
                </div>
                
                {/* Filters Section */}
                <div className="space-y-3 sm:space-y-4">
                  {/* Dropdowns */}
                  <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(Number(e.target.value))}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-gray-900 bg-white text-sm sm:text-base"
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
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-white focus:border-white text-gray-900 bg-white text-sm sm:text-base"
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
                  
                  {/* Add Project Button */}
                  <button
                    onClick={() => setShowProjectForm(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-primary font-medium sm:font-semibold rounded-lg sm:rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary transition-all duration-200 shadow-lg disabled:opacity-50 text-sm sm:text-base"
                    disabled={!selectedSchoolYear || isLoading.projects}
                  >
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Add Project
                  </button>
                </div>
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
                  <span>{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</span>
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

          {isLoading.projects ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading projects...</p>
              </div>
            </div>
          ) : !selectedSchoolYear ? (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 lg:p-12 text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <CalendarIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Select a school year</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-sm sm:max-w-md mx-auto leading-relaxed">
                Please select a semester and school year to view and manage your projects.
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 lg:p-12 text-center">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <DocumentTextIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-sm sm:max-w-md mx-auto leading-relaxed">
                Create your first project to start collaborating with students and tracking their progress.
              </p>
              <button
                type="button"
                onClick={() => setShowProjectForm(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-primary text-white font-medium sm:font-semibold rounded-lg sm:rounded-xl hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-lg text-sm sm:text-base"
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No {viewMode} projects found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm 
                      ? 'Try adjusting your search or filter criteria.'
                      : viewMode === 'active'
                        ? 'Get started by creating a new project.'
                        : 'No archived projects found.'}
                  </p>
                  {viewMode === 'active' && !searchTerm && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowProjectForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                        New Project
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredProjects.map((project) => (
                <div key={project.project_master_id} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start mb-4">
                      <div className="flex-shrink-0 bg-primary-subtle rounded-lg sm:rounded-xl p-2 sm:p-3 group-hover:bg-primary-light transition-colors">
                        <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors leading-tight mb-1">
                          {project.project_title}
                        </h3>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <CodeBracketIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          <span className="font-mono truncate">CODE: {project.project_code}</span>
                        </div>
                        {project.project_is_active === '1' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-subtle text-primary mt-2">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {project.project_description && (
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                        {project.project_description}
                      </p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-gray-100 gap-3 sm:gap-0">
                      <div className="flex items-center text-xs text-gray-500">
                        <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span>Created {new Date(project.project_date_created).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 sm:py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200"
                          title="Edit project"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        {project.project_is_active === 1 ? (
                          <button
                            onClick={() => archiveProject(project.project_master_id, project.project_title)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 sm:py-2 text-xs font-medium text-orange-600 bg-orange-100 rounded-lg hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all duration-200"
                            title="Archive project"
                          >
                            <ArchiveBoxIcon className="h-3 w-3 mr-1" />
                            Archive
                          </button>
                        ) : (
                          <button
                            onClick={() => restoreProject(project.project_master_id, project.project_title)}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 sm:py-2 text-xs font-medium text-green-600 bg-green-100 rounded-lg hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all duration-200"
                            title="Restore project"
                          >
                            <ArchiveBoxIcon className="h-3 w-3 mr-1" />
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Find the specific project data to get its school year dates
                            const selectedProject = projects.find(p => p.project_master_id === project.project_master_id);
                            console.log('=== WORKSPACE NAVIGATION DEBUG ===');
                            console.log('Selected project:', selectedProject);
                            console.log('Project school_year_start_date:', selectedProject?.school_year_start_date);
                            console.log('Project school_year_end_date:', selectedProject?.school_year_end_date);
                            console.log('Navigating with state:', {
                              projectId: project.project_master_id,
                              projectTitle: project.project_title,
                              schoolYearId: selectedSchoolYear,
                              semesterId: selectedSemester,
                              schoolYearStartDate: selectedProject?.school_year_start_date,
                              schoolYearEndDate: selectedProject?.school_year_end_date
                            });
                            
                            navigate('/teacher/projects', { 
                              state: { 
                                projectId: project.project_master_id,
                                projectTitle: project.project_title,
                                schoolYearId: selectedSchoolYear,
                                semesterId: selectedSemester,
                                schoolYearStartDate: selectedProject?.school_year_start_date,
                                schoolYearEndDate: selectedProject?.school_year_end_date
                              }
                            });
                          }}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center px-3 py-1.5 sm:py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
                          title="View project"
                        >
                          <EyeIcon className="h-3 w-3 mr-1" />
                          Open
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
              )}
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

          {/* Edit Project Modal */}
          <EditProjectModal
            show={showEditModal}
            onHide={() => {
              setShowEditModal(false);
              setSelectedProject(null);
            }}
            project={selectedProject}
            onUpdate={updateProjectMaster}
          />
            
        </div>
      </div>
    </div>
  );
};

export default Workspace;