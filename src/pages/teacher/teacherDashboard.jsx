import React, { useState, useEffect } from 'react';
import { FiLayers, FiFolder,  FiTrendingUp,  FiUsers, FiBriefcase } from 'react-icons/fi';
import FacultySidebar from '../../components/sidebar';
import { SecureStorage } from '../../utils/encryption';

const TeacherDashboard = () => {
 
  const [stats, setStats] = useState({
    totalProjects: 0,
    masterProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const teacherId = SecureStorage.getLocalItem('user_id');
        const apiUrl = SecureStorage.getLocalItem('url') + 'teacher.php';
        
        if (!teacherId) {
          console.error('Teacher ID not found');
          setLoading(false);
          return;
        }

        // Fetch project masters count
        const masterProjectsResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'countProjectMastersByTeacher',
            teacher_id: teacherId
          })
        });

        // Fetch total projects count
        const totalProjectsResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'countAllProjectsByTeacher',
            teacher_id: teacherId
          })
        });

        // Fetch recent projects
        const recentProjectsResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'fetchRecentProjects',
            teacher_id: teacherId,
            limit: 6
          })
        });

        const masterProjectsData = await masterProjectsResponse.json();
        const totalProjectsData = await totalProjectsResponse.json();
        const recentProjectsData = await recentProjectsResponse.json();

        if (masterProjectsData.status === 'success' && totalProjectsData.status === 'success') {
          setStats({
            totalProjects: totalProjectsData.data.total_projects,
            masterProjects: masterProjectsData.data.total_project_masters,
            completedProjects: 0, // TODO: Add completed projects count logic
            inProgressProjects: 0 // TODO: Add in-progress projects count logic
          });
        } else {
          console.error('Error fetching stats:', masterProjectsData.message || totalProjectsData.message);
          // Fallback to default values
          setStats({
            totalProjects: 0,
            masterProjects: 0,
            completedProjects: 0,
            inProgressProjects: 0
          });
        }

        // Set recent projects data
        if (recentProjectsData.status === 'success') {
          setRecentProjects(recentProjectsData.data);
        } else {
          console.error('Error fetching recent projects:', recentProjectsData.message);
          setRecentProjects([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        // Fallback to default values
        setStats({
          totalProjects: 0,
          masterProjects: 0,
          completedProjects: 0,
          inProgressProjects: 0
        });
        setRecentProjects([]);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, title, value, color, bgColor, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-3 rounded-xl ${bgColor}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div className="ml-4">
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && (
                <span className="flex items-center text-xs font-medium text-primary">
                  <FiTrendingUp className="w-3 h-3 mr-1" />
                  {trend}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <FacultySidebar />
        <main className="flex-1 p-6 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <FacultySidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-primary to-primary-medium rounded-2xl p-8 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Welcome back, {SecureStorage.getLocalItem('firstname') || 'Faculty'}!</h1>
                  <p className="text-primary-subtle opacity-90">Manage your projects and track student progress efficiently.</p>
                </div>
               
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              icon={FiLayers}
              title="Total Projects"
              value={stats.totalProjects}
              color="text-primary"
              bgColor="bg-primary-subtle"
              trend="+12%"
            />
            <StatCard 
              icon={FiFolder}
              title="Master Projects"
              value={stats.masterProjects}
              color="text-primary-medium"
              bgColor="bg-primary-light"
            />
        
          </div>

         
          {/* Projects Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
                  <p className="mt-1 text-sm text-gray-600">Your latest project activities</p>
                </div>
                <div className="flex items-center space-x-2">
                  <FiUsers className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">{recentProjects.length} recent projects</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              {recentProjects.length > 0 ? (
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
                    {recentProjects.map((project) => (
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
                            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-primary-subtle text-primary w-fit">
                              {project.master_project.code || 'N/A'}
                            </span>
                            <div className="text-sm text-gray-500 mt-1">
                              {project.master_project.title}
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
              ) : (
                <div className="text-center py-12">
                  <FiBriefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent projects</h3>
                  <p className="text-gray-600">You haven't created any projects yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;