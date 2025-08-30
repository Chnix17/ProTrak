import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  CheckCircleIcon, 
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  SparklesIcon,
  FolderIcon
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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading phases...</p>
        <div className="mt-2 flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary-medium rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-primary-subtle rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-subtle rounded-lg p-3">
              <FolderIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Project Phases</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your project milestones and track progress through each phase</p>
            </div>
          </div>
          {phases.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <SparklesIcon className="h-4 w-4" />
              <span>{phases.length} phase{phases.length !== 1 ? 's' : ''} available</span>
            </div>
          )}
        </div>
      </div>


      {/* Enhanced Phases List */}
      {phases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="bg-primary-subtle rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <DocumentTextIcon className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No phases available yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Project phases will be loaded automatically from the system once they are configured by your instructor.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {phases.map((phase, index) => {
            const isCompleted = phase.status.toLowerCase() === 'completed' || phase.status.toLowerCase() === 'approved';
            const isInProgress = phase.status.toLowerCase() === 'in progress';
            const needsRevision = phase.status.toLowerCase() === 'needs revision';
            const isNotStarted = phase.status.toLowerCase() === 'not started';
            
            return (
              <div
                key={phase.phase_main_id || index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Phase Header */}
                <div className={`p-6 border-l-4 ${
                  isCompleted ? 'border-green-500 bg-green-50/50' :
                  needsRevision ? 'border-yellow-500 bg-yellow-50/50' :
                  isInProgress ? 'border-primary bg-primary-subtle/30' :
                  'border-gray-300 bg-gray-50/50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          isCompleted ? 'bg-green-100' :
                          needsRevision ? 'bg-yellow-100' :
                          isInProgress ? 'bg-primary-subtle' :
                          'bg-gray-100'
                        }`}>
                          {getPhaseStatusIcon(phase.status)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-gray-900">
                            {phase.phase_main_name || `Phase ${index + 1}`}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              isCompleted ? 'bg-green-100 text-green-800' :
                              needsRevision ? 'bg-yellow-100 text-yellow-800' :
                              isInProgress ? 'bg-primary-subtle text-primary' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {phase.status}
                            </span>
                            {needsRevision && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                Action Required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {phase.phase_main_description && phase.phase_main_description !== 'N/A' && (
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {phase.phase_main_description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {phase.phase_start_date && (
                          <div className="flex items-center bg-white/80 px-3 py-1 rounded-lg">
                            <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                            <span className="font-medium">Start:</span>
                            <span className="ml-1">{new Date(phase.phase_start_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {phase.phase_end_date && (
                          <div className="flex items-center bg-white/80 px-3 py-1 rounded-lg">
                            <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                            <span className="font-medium">End:</span>
                            <span className="ml-1">{new Date(phase.phase_end_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {isNotStarted && (
                        <button
                          onClick={() => handleStartPhase(phase)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <PlayIcon className="-ml-1 mr-2 h-4 w-4" />
                          Start Phase
                        </button>
                      )}
                      
                      {(isInProgress || isCompleted || needsRevision) && (
                        <button
                          onClick={() => {
                            setSelectedPhase(phase);
                            setShowWorkspaceModal(true);
                          }}
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                            isCompleted
                              ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                              : needsRevision
                              ? 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                              : 'text-white bg-primary hover:bg-primary-medium focus:ring-primary'
                          }`}
                        >
                          <EyeIcon className="-ml-1 mr-2 h-4 w-4" />
                          {needsRevision ? 'Review Feedback' : isCompleted ? 'View Results' : 'Open Workspace'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Start Phase Modal */}
      {showStartModal && selectedPhase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary via-primary-medium to-primary-subtle p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                    <PlayIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Start Phase</h3>
                    <p className="text-white/90 text-sm">Initialize your project phase</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    setSelectedPhase(null);
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-primary-subtle rounded-lg p-2">
                    <DocumentTextIcon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {selectedPhase.phase_main_name}
                  </h4>
                </div>
                
                {selectedPhase.phase_main_description && selectedPhase.phase_main_description !== 'N/A' && (
                  <p className="text-gray-700 mb-4 leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {selectedPhase.phase_main_description}
                  </p>
                )}
                
                <div className="space-y-3">
                  {selectedPhase.phase_start_date && (
                    <div className="flex items-center bg-primary-subtle/20 p-3 rounded-lg">
                      <CalendarIcon className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Start Date:</span>
                        <span className="ml-2 text-sm text-gray-700">
                          {new Date(selectedPhase.phase_start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedPhase.phase_end_date && (
                    <div className="flex items-center bg-primary-subtle/20 p-3 rounded-lg">
                      <CalendarIcon className="h-5 w-5 mr-3 text-primary" />
                      <div>
                        <span className="text-sm font-medium text-gray-900">End Date:</span>
                        <span className="ml-2 text-sm text-gray-700">
                          {new Date(selectedPhase.phase_end_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">Important Notice</p>
                    <p className="text-sm text-yellow-700">
                      Once you start this phase, you'll be able to access the workspace and begin your work. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={confirmStartPhase}
                  className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white bg-gradient-to-r from-primary to-primary-medium hover:from-primary-medium hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 hover:shadow-lg"
                >
                  <PlayIcon className="-ml-1 mr-2 h-5 w-5" />
                  Start Phase
                </button>
                <button
                  onClick={() => {
                    setShowStartModal(false);
                    setSelectedPhase(null);
                  }}
                  className="flex-1 inline-flex justify-center items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
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
