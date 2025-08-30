import React, { useState, useEffect, useCallback } from 'react';
import { 
  EyeIcon,
  CheckCircleIcon, 
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
// import { SecureStorage } from '../../../utils/encryption';
import TeacherPhaseWorkspaceModal from './TeacherPhaseWorkspaceModal';

const TeacherMainTab = ({ project, projectId, onProjectUpdate }) => {
  const [phases, setPhases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(null);
  // const baseUrl = SecureStorage.getLocalItem("url");

  const fetchPhases = useCallback(async () => {
    try {
      setIsLoading(true);
      // Use phases from the project data passed from parent
      if (project && project.phases) {
        console.log('Setting phases in TeacherMainTab:', project.phases);
        setPhases(project.phases);
      }
    } catch (error) {
      console.error('Error fetching phases:', error);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  const handleViewPhase = (phase) => {
    console.log('Selected phase in TeacherMainTab:', phase);
    setSelectedPhase(phase);
    setShowWorkspaceModal(true);
  };

  const getPhaseStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'needs revision':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'not started':
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPhaseStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'needs revision':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not started':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionButtonStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500';
      case 'needs revision':
        return 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500';
      case 'in progress':
        return 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500';
      default:
        return 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500';
    }
  };

  const canReviewPhase = (status) => {
    const reviewableStatuses = ['in progress', 'completed', 'needs revision', 'approved'];
    return reviewableStatuses.includes(status.toLowerCase());
  };

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

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
          <h3 className="text-lg font-medium text-gray-900">Project Phases Review</h3>
          <p className="text-sm text-gray-600">Review student progress and provide feedback on project phases</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              <EyeIcon className="h-3 w-3 mr-1" />
              Teacher Review Mode
            </span>
          </div>
        </div>
      </div>

      {/* Phases List */}
      {phases.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No phases available</h3>
          <p className="mt-1 text-sm text-gray-500">
            No project phases have been created yet for this project.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div
              key={phase.phase_main_id || index}
              className={`border rounded-lg p-4 ${getPhaseStatusColor(phase.status)} transition-all hover:shadow-md`}
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

                  {/* Review Status Indicator */}
                  {phase.status.toLowerCase() === 'needs revision' && (
                    <div className="mt-3 flex items-center space-x-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-700 font-medium">Requires student revision</span>
                    </div>
                  )}
                  
                  {phase.status.toLowerCase() === 'approved' && (
                    <div className="mt-3 flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700 font-medium">Approved by teacher</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {canReviewPhase(phase.status) && (
                    <button
                      onClick={() => handleViewPhase(phase)}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getActionButtonStyle(phase.status)}`}
                    >
                      <EyeIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                      Review Phase
                    </button>
                  )}
                  
                  {phase.status.toLowerCase() === 'not started' && (
                    <div className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-md">
                      <ClockIcon className="-ml-0.5 mr-1.5 h-4 w-4" />
                      Waiting for Student
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

  

      {/* Teacher Phase Workspace Modal */}
      <TeacherPhaseWorkspaceModal
        isOpen={showWorkspaceModal}
        onClose={() => {
          setShowWorkspaceModal(false);
          setSelectedPhase(null);
        }}
        phase={selectedPhase}
        projectId={projectId}
        onPhaseUpdate={onProjectUpdate}
      />
    </div>
  );
};

export default TeacherMainTab;
