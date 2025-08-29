import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  CheckCircleIcon, 
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
import axios from 'axios';
import PhaseWorkspaceModal from './PhaseWorkspaceModal';

const MainTab = ({ project, projectId, onProjectUpdate }) => {
  const [phases, setPhases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  const baseUrl = SecureStorage.getLocalItem("url");

  const fetchPhases = async () => {
    // Use phases from the project data passed from parent
    if (project && project.phases) {
      setPhases(project.phases);
    }
  };

  const handleStartPhase = (phase) => {
    setSelectedPhase(phase);
    setShowStartModal(true);
  };

  const confirmStartPhase = async () => {
    if (!selectedPhase) return;
    
    try {
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'insertPhase',
          phase_id: selectedPhase.phase_main_id,
          project_main_id: parseInt(projectId),
          created_by: parseInt(userId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Phase started successfully');
        setShowStartModal(false);
        // Open workspace modal after successful phase start
        setShowWorkspaceModal(true);
        onProjectUpdate();
      } else {
        toast.error(response.data.message || 'Failed to start phase');
      }
    } catch (error) {
      console.error('Error starting phase:', error);
      toast.error('Failed to start phase');
    }
  };


  const getPhaseStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in progress':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'not started':
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPhaseStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not started':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    fetchPhases();
  }, [project]);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading phases...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Project Phases</h3>
          <p className="text-sm text-gray-600">Manage your project milestones and phases</p>
        </div>
      </div>


      {/* Phases List */}
      {phases.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No phases yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Project phases will be loaded automatically from the system.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div
              key={phase.phase_main_id || index}
              className={`border rounded-lg p-4 ${getPhaseStatusColor(phase.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getPhaseStatusIcon(phase.status)}
                    <h4 className="text-lg font-medium text-gray-900">
                      {phase.phase_main_name || `Phase ${index + 1}`}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseStatusColor(phase.status)}`}>
                      {phase.status}
                    </span>
                  </div>
                  
                  {phase.phase_main_description && phase.phase_main_description !== 'N/A' && (
                    <p className="mt-2 text-sm text-gray-600">
                      {phase.phase_main_description}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    {phase.phase_start_date && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>Start: {new Date(phase.phase_start_date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {phase.phase_end_date && (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        <span>End: {new Date(phase.phase_end_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {phase.status.toLowerCase() === 'not started' && (
                    <button
                      onClick={() => handleStartPhase(phase)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlayIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                      Start Phase
                    </button>
                  )}
                  
                  {/* View button for all statuses */}
                  {(phase.status.toLowerCase() === 'in progress' || 
                    phase.status.toLowerCase() === 'completed' || 
                    phase.status.toLowerCase() === 'needs revision' ||
                    phase.status.toLowerCase() === 'approved') && (
                    <button
                      onClick={() => {
                        setSelectedPhase(phase);
                        setShowWorkspaceModal(true);
                      }}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        phase.status.toLowerCase() === 'completed' || phase.status.toLowerCase() === 'approved'
                          ? 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
                          : phase.status.toLowerCase() === 'needs revision'
                          ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500'
                          : 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500'
                      }`}
                    >
                      <DocumentTextIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                      View
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start Phase Modal */}
      {showStartModal && selectedPhase && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Start Phase</h3>
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    setSelectedPhase(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="text-md font-medium text-gray-800 mb-2">
                  {selectedPhase.phase_main_name}
                </h4>
                {selectedPhase.phase_main_description && selectedPhase.phase_main_description !== 'N/A' && (
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedPhase.phase_main_description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm text-gray-600">
                  {selectedPhase.phase_start_date && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>Start Date: {new Date(selectedPhase.phase_start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {selectedPhase.phase_end_date && (
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>End Date: {new Date(selectedPhase.phase_end_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  Are you sure you want to start this phase? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={confirmStartPhase}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlayIcon className="-ml-1 mr-2 h-4 w-4" />
                  Start Phase
                </button>
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    setSelectedPhase(null);
                  }}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Workspace Modal */}
      <PhaseWorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => {
          setShowWorkspaceModal(false);
          setSelectedPhase(null);
        }}
        phase={selectedPhase}
        projectId={projectId}
      />
    </div>
  );
};

export default MainTab;
