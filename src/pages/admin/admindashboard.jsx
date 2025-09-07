import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiLayers, 
  FiTrendingUp, 

  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import Sidebar from '../../components/sidebar';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import { toast } from 'sonner';

// Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxPages = 5; // Maximum number of page buttons to show
  let startPage, endPage;

  if (totalPages <= maxPages) {
    startPage = 1;
    endPage = totalPages;
  } else {
    const maxPagesBeforeCurrent = Math.floor(maxPages / 2);
    const maxPagesAfterCurrent = Math.ceil(maxPages / 2) - 1;
    
    if (currentPage <= maxPagesBeforeCurrent) {
      startPage = 1;
      endPage = maxPages;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      startPage = totalPages - maxPages + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        <FiChevronLeft size={20} />
      </button>
      <div className="flex space-x-1">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-md flex items-center justify-center ${
              currentPage === page
                ? 'bg-green-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-md ${
          currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <FiChevronRight size={20} />
      </button>
    </div>
  );
};

const AdminDashboard = () => {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalMasterProjects: 0,
    activeProjects: 0,
    studentCount: 0,
    teacherCount: 0,
    adminCount: 0,
    systemHealth: 100
  });
  
  // Pagination states

  const [allProjectsPage, setAllProjectsPage] = useState(1);
 
  const itemsPerPage = 5;
  
  // Calculate pagination for all projects
  const indexOfLastProject = allProjectsPage * itemsPerPage;
  const indexOfFirstProject = indexOfLastProject - itemsPerPage;
  const currentProjects = allProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalProjectPages = Math.ceil(allProjects.length / itemsPerPage);
  

  // Fetch admin dashboard data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const token = SecureStorage.getLocalItem('token');
        const baseUrl = SecureStorage.getLocalItem("url");
        
        // Fetch system stats
        const statsResponse = await axios.post(
          `${baseUrl}admin.php`,
          { 
            operation: 'getSystemStats'
          },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (statsResponse.data.status === 'success') {
          const data = statsResponse.data.data;
          setStats({
            totalUsers: data.total_users || 0,
            totalProjects: data.total_projects || 0,
            totalMasterProjects: data.total_master_projects || 0,
            activeProjects: data.active_projects || 0,
            studentCount: data.student_count || 0,
            teacherCount: data.teacher_count || 0,
            adminCount: data.admin_count || 0,
            systemHealth: data.system_health || 100
          });
        }

        // Fetch all projects
        const projectsResponse = await axios.post(
          `${baseUrl}admin.php`,
          { 
            operation: 'fetchAllProjects'
          },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (projectsResponse.data.status === 'success') {
          setAllProjects(projectsResponse.data.data || []);
        }

      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load dashboard data');
        // Set fallback data
        setStats({
          totalUsers: 156,
          totalProjects: 89,
          totalMasterProjects: 12,
          activeProjects: 34,
          studentCount: 120,
          teacherCount: 25,
          adminCount: 11,
          systemHealth: 98
        });
        setAllProjects([
          {
            project_main_id: 1,
            project_title: 'Sample Project 1',
            project_description: 'Sample project description',
            creator_name: 'John Doe',
            member_count: 3,
            status_name: 'In Progress',
            project_created_at: new Date().toISOString(),
            master_project: {
              title: 'Sample Master Project',
              code: 'SMP001',
              teacher_name: 'Prof. Jane Smith',
              teacher_email: 'jane.smith@university.edu'
            }
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const StatCard = ({ icon: Icon, title, value, color, bgColor, trend, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${bgColor} mr-4`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className="text-right">
            <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading admin dashboard...</p>
          </div>
        </main>
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
              <h1 className="text-3xl font-bold mb-2">Welcome back, {SecureStorage.getLocalItem('firstname') || 'Administrator'}!</h1>
              <p className="text-primary-subtle opacity-90">Monitor system performance and manage the entire platform efficiently.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon={FiUsers}
              title="Total Users"
              value={stats.totalUsers}
              subtitle={`${stats.studentCount} Students, ${stats.teacherCount} Teachers, ${stats.adminCount} Admins`}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard 
              icon={FiLayers}
              title="Total Projects"
              value={stats.totalProjects}
              subtitle={`Across ${stats.totalMasterProjects} Master Projects`}
              color="text-green-600"
              bgColor="bg-green-50"
            />
            <StatCard 
              icon={FiTrendingUp}
              title="Active Projects"
              value={stats.activeProjects}
              subtitle={`${Math.round((stats.activeProjects / stats.totalProjects) * 100) || 0}% of total projects`}
              color="text-purple-600"
              bgColor="bg-purple-50"
            />
        
          </div>

     
      
            
          </div>

          {/* All Projects List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">All Projects</h2>
                  <p className="mt-1 text-sm text-gray-600">Overview of all projects in the system</p>
                </div>
                <div className="flex items-center space-x-2">
                  <FiUsers className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">{allProjects.length} projects total</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {allProjects.length > 0 ? (
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Master Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentProjects.map((project) => (
                        <tr key={project.project_main_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">
                                {project.project_title}
                              </div>
                              <div className="text-sm text-gray-500">
                                By {project.creator_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600 w-fit">
                                {project.master_project?.code || 'N/A'}
                              </span>
                              <div className="text-sm text-gray-500 mt-1">
                                {project.master_project?.title || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <FiUsers className="w-4 h-4 text-gray-400 mr-1" />
                              {project.member_count}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              project.status_name === 'Completed' ? 'bg-green-50 text-green-600' :
                              project.status_name === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                              project.status_name === 'Pending' ? 'bg-yellow-50 text-yellow-600' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {project.status_name || 'No Status'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(project.project_created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {totalProjectPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <Pagination 
                        currentPage={allProjectsPage}
                        totalPages={totalProjectPages}
                        onPageChange={setAllProjectsPage}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <FiLayers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                  <p className="text-gray-600">There are no projects in the system yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

  );
};

export default AdminDashboard;