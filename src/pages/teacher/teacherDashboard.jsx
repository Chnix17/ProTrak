import React, { useState, useEffect } from 'react';
import { FiLayers, FiFolder, FiCheckCircle, FiClock, FiTrendingUp, FiCalendar, FiUsers, FiBriefcase } from 'react-icons/fi';
import FacultySidebar from '../../components/sidebar';
import { useNavigate } from 'react-router-dom';
import { SecureStorage } from '../../utils/encryption';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProjects: 0,
    masterProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0
  });
  const [loading, setLoading] = useState(true);

  // Simulated data fetch - replace with actual API call
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        setTimeout(() => {
          setStats({
            totalProjects: 24,
            masterProjects: 5,
            completedProjects: 18,
            inProgressProjects: 6
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching stats:', error);
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
            <StatCard 
              icon={FiCheckCircle}
              title="Completed"
              value={stats.completedProjects}
              color="text-primary-medium"
              bgColor="bg-primary-light"
            />
            <StatCard 
              icon={FiClock}
              title="In Progress"
              value={stats.inProgressProjects}
              color="text-blue-600"
              bgColor="bg-blue-50"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div 
              onClick={() => navigate('/faculty/workspace')}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-primary-subtle group-hover:bg-primary-light transition-colors">
                    <FiBriefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Project Workspaces</h3>
                    <p className="text-gray-600 text-sm">Manage all your project workspaces</p>
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
                  <h3 className="text-lg font-semibold text-gray-900">Project Deadlines</h3>
                  <p className="text-gray-600 text-sm">Monitor upcoming project deadlines</p>
                </div>
              </div>
            </div>
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
                  <span className="text-sm text-gray-500">3 active projects</span>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Project {i + 1}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-subtle text-primary">
                              Computer Science
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Students:</span> 15 enrolled
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Status:</span> 
                            <span className={`ml-1 px-2 py-1 text-xs font-medium rounded-full ${
                              i === 0 ? 'bg-blue-50 text-blue-600' : 
                              i === 1 ? 'bg-yellow-50 text-yellow-600' : 
                              'bg-green-50 text-green-600'
                            }`}>
                              {i === 0 ? 'In Progress' : i === 1 ? 'Needs Review' : 'Completed'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Last updated: 2 days ago
                      </div>
                      <button
                        onClick={() => navigate(`/faculty/workspace/project/${i + 1}`)}
                        className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                      >
                        View Project
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;