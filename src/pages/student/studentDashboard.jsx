import React, { useState, useEffect } from 'react';
import { FiLayers, FiCheckCircle, FiClock, FiAlertCircle, FiBriefcase } from 'react-icons/fi';
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

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-4 flex items-center">
      <div className={`p-2 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="ml-3">
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your projects...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:ml-64">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your project overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              icon={FiLayers}
              title="Total Projects"
              value={stats.totalProjects}
              color="text-indigo-500"
            />
            <StatCard 
              icon={FiClock}
              title="Active Projects"
              value={stats.activeProjects}
              color="text-blue-500"
            />
            <StatCard 
              icon={FiCheckCircle}
              title="Completed"
              value={stats.completedProjects}
              color="text-green-500"
            />
            <StatCard 
              icon={FiAlertCircle}
              title="Pending Tasks"
              value={stats.pendingTasks}
              color="text-amber-500"
            />
            <div 
              onClick={() => navigate('/student/workspace')}
              className="bg-white rounded-lg shadow p-4 flex items-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-full bg-indigo-100">
                <FiBriefcase className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <p className="text-gray-500 text-sm">My Workspaces</p>
                <p className="text-lg font-semibold text-indigo-600">View All</p>
              </div>
            </div>
          </div>

          {/* Active Projects Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">My Active Projects</h2>
              <p className="mt-1 text-sm text-gray-500">Projects you're currently working on</p>
            </div>
            
            {activeProjects.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {activeProjects.map((project) => (
                  <li key={project.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {project.project_name}
                        </h3>
                        <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {project.subject_name}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>Teacher: {project.teacher_name}</span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>Semester: {project.semester_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={() => navigate(`/student/workspace/${project.id}`)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          View Project
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-12 text-center">
                <FiLayers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No active projects</h3>
                <p className="mt-1 text-sm text-gray-500">You don't have any active projects at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;