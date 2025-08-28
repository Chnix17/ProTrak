import React, { useState, useEffect } from 'react';
import { FiLayers, FiFolder, FiCheckCircle, FiClock, FiPlus } from 'react-icons/fi';
import FacultySidebar from '../../components/sidebar';
import { Link } from 'react-router-dom';

const TeacherDashboard = () => {
  const [stats, setStats] = useState({
    totalProjects: 0,
    masterProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0
  });

  // Simulated data fetch - replace with actual API call
  useEffect(() => {
    // TODO: Replace with actual API call
    const fetchStats = async () => {
      // Simulated API response
      setTimeout(() => {
        setStats({
          totalProjects: 24,
          masterProjects: 5,
          completedProjects: 18,
          inProgressProjects: 6
        });
      }, 500);
    };

    fetchStats();
  }, []);

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-6 flex items-center">
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
      <div className="ml-4">
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <FacultySidebar />
      <div className="flex-1 overflow-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Faculty Dashboard</h1>
            <p className="text-gray-600">Track your projects and activities</p>
          </div>
          <Link
            to="/faculty/workspace/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPlus className="-ml-1 mr-2 h-5 w-5" />
            New Project
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={FiLayers} 
            title="Total Projects" 
            value={stats.totalProjects} 
            color="text-blue-500" 
          />
          <StatCard 
            icon={FiFolder} 
            title="Master Projects" 
            value={stats.masterProjects} 
            color="text-green-500" 
          />
          <StatCard 
            icon={FiCheckCircle} 
            title="Completed" 
            value={stats.completedProjects} 
            color="text-emerald-500" 
          />
          <StatCard 
            icon={FiClock} 
            title="In Progress" 
            value={stats.inProgressProjects} 
            color="text-amber-500" 
          />
        </div>

        {/* Projects Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Projects Overview</h2>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-b pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Project {i + 1}</h3>
                    <p className="text-sm text-gray-500">3 sub-projects • Last updated 2 days ago</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 rounded-full">
                      {i === 0 ? 'In Progress' : i === 1 ? 'Needs Review' : 'Completed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;