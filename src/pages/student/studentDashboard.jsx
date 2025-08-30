import React, { useState, useEffect } from 'react';
import { FiLayers, FiCheckCircle, FiClock, FiAlertCircle, FiBriefcase, FiTrendingUp, FiCalendar, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar';
import { SecureStorage } from '../../utils/encryption';
import axios from 'axios';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingTasks: 0
  });

  // Fetch student's projects and stats
  useEffect(() => {
    const fetchStudentProjects = async () => {
      try {
        setLoading(true);
        const token = SecureStorage.getLocalItem('token');
        const baseUrl = SecureStorage.getLocalItem("url");
        
        // Fetch active projects
        const projectsResponse = await axios.post(
          `${baseUrl}student.php`,
          { 
            operation: 'fetchStudentProjects',
            studentId: SecureStorage.getLocalItem('user_id')
          },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (projectsResponse.data.status === 'success') {
          const projects = projectsResponse.data.data || [];
          setActiveProjects(projects);

          // Calculate stats
          const totalProjects = projects.length;
          const activeProjectsCount = projects.filter(p => p.status !== 'completed').length;
          const completedProjectsCount = projects.filter(p => p.status === 'completed').length;
          
          setStats({
            totalProjects,
            activeProjects: activeProjectsCount,
            completedProjects: completedProjectsCount,
            pendingTasks: 0 // TODO: Implement task counting if available
          });
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProjects();
  }, []);

  // const getStatusBadge = (status) => {
  //   const statusClasses = {
  //     'in-progress': 'bg-blue-100 text-blue-800',
  //     'completed': 'bg-green-100 text-green-800',
  //     'not-started': 'bg-gray-100 text-gray-800',
  //     'overdue': 'bg-red-100 text-red-800'
  //   };
    
  //   const statusText = {
  //     'in-progress': 'In Progress',
  //     'completed': 'Completed',
  //     'not-started': 'Not Started',
  //     'overdue': 'Overdue'
  //   };
    
  //   return (
  //     <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100'}`}>
  //       {statusText[status] || status}
  //     </span>
  //   );
  // };

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
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your projects...</p>
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
              <h1 className="text-3xl font-bold mb-2">Welcome back, {SecureStorage.getLocalItem('firstname') || 'Student'}!</h1>
              <p className="text-primary-subtle opacity-90">Track your progress and manage your projects efficiently.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard 
              icon={FiLayers}
              title="Total Projects"
              value={stats.totalProjects}
              color="text-primary"
              bgColor="bg-primary-subtle"
              trend="+12%"
            />
            <StatCard 
              icon={FiClock}
              title="Active Projects"
              value={stats.activeProjects}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
            <StatCard 
              icon={FiCheckCircle}
              title="Completed"
              value={stats.completedProjects}
              color="text-primary-medium"
              bgColor="bg-primary-light"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div 
              onClick={() => navigate('/student/workspace')}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-primary-subtle group-hover:bg-primary-light transition-colors">
                    <FiBriefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">My Workspaces</h3>
                    <p className="text-gray-600 text-sm">Access all your project workspaces</p>
                  </div>
                </div>
                <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-blue-50">
                  <FiCalendar className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
                  <p className="text-gray-600 text-sm">Stay on track with your submissions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Projects Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">My Active Projects</h2>
                  <p className="mt-1 text-sm text-gray-600">Projects you're currently working on</p>
                </div>
                <div className="flex items-center space-x-2">
                  <FiUsers className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">{activeProjects.length} projects</span>
                </div>
              </div>
            </div>
            
            {activeProjects.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeProjects.map((project) => (
                    <div key={project.id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {project.project_name}
                          </h3>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-subtle text-primary">
                                {project.subject_name}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Teacher:</span> {project.teacher_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Semester:</span> {project.semester_name}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Last updated: 2 days ago
                        </div>
                        <button
                          onClick={() => navigate(`/student/workspace/${project.id}`)}
                          className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                        >
                          Open Project
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiLayers className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active projects</h3>
                <p className="text-gray-500 mb-6">You don't have any active projects at the moment.</p>
                <button 
                  onClick={() => navigate('/student/workspace')}
                  className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-medium transition-colors"
                >
                  Browse Available Projects
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;