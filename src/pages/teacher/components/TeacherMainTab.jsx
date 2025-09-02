import React, { useState, useEffect, useCallback } from 'react';
import { 
  EyeIcon,
  CheckCircleIcon, 
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  FolderIcon
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
      case 'passed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'in progress':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'under review':
        return <EyeIcon className="h-5 w-5 text-purple-500" />;
      case 'revision nedded':
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
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'revision nedded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not started':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // const getActionButtonStyle = (status) => {
  //   switch (status.toLowerCase()) {
  //     case 'completed':
  //     case 'approved':
  //     case 'passed':
  //       return 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500';
  //     case 'failed':
  //       return 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500';
  //     case 'revision nedded':
  //       return 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:ring-yellow-500';
  //     case 'under review':
  //       return 'text-purple-700 bg-purple-100 hover:bg-purple-200 focus:ring-purple-500';
  //     case 'in progress':
  //       return 'text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500';
  //     default:
  //       return 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500';
  //   }
  // };

  const canReviewPhase = (status) => {
    const reviewableStatuses = ['in progress', 'completed', 'revision nedded', 'approved', 'passed', 'failed', 'under review'];
    return reviewableStatuses.includes(status.toLowerCase());
  };

  // const calculatePassingRate = () => {
  //   if (!phases || phases.length === 0) return { rate: 0, passed: 0, total: 0 };
    
  //   const completedPhases = phases.filter(phase => {
  //     const status = phase.status.toLowerCase();
  //     return status === 'passed' || status === 'completed' || status === 'approved';
  //   });
    
  //   const rate = (completedPhases.length / phases.length) * 100;
  //   return {
  //     rate: Math.round(rate),
  //     passed: completedPhases.length,
  //     total: phases.length
  //   };
  // };

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

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
              <h3 className="text-xl font-semibold text-gray-900">Project Phases Review</h3>
              <p className="text-sm text-gray-600 mt-1">Review student progress and provide feedback on project phases</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <EyeIcon className="h-4 w-4" />
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-subtle text-primary">
                Teacher Review Mode
              </span>
            </div>
            {phases.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <SparklesIcon className="h-4 w-4" />
                <span>{phases.length} phase{phases.length !== 1 ? 's' : ''} available</span>
              </div>
            )}
          </div>
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
            No project phases have been created yet for this project. Phases will appear here once students begin working.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {phases.map((phase, index) => {
            const isCompleted = phase.status.toLowerCase() === 'completed' || phase.status.toLowerCase() === 'approved' || phase.status.toLowerCase() === 'passed';
            const isFailed = phase.status.toLowerCase() === 'failed';
            const isInProgress = phase.status.toLowerCase() === 'in progress';
            const isUnderReview = phase.status.toLowerCase() === 'under review';
            const needsRevision = phase.status.toLowerCase() === 'revision nedded';
            const isNotStarted = phase.status.toLowerCase() === 'not started';
            
            return (
              <div
                key={phase.phase_main_id || index}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Phase Header */}
                <div className={`p-6 border-l-4 ${
                  isCompleted ? 'border-green-500 bg-green-50/50' :
                  isFailed ? 'border-red-500 bg-red-50/50' :
                  needsRevision ? 'border-yellow-500 bg-yellow-50/50' :
                  isUnderReview ? 'border-purple-500 bg-purple-50/50' :
                  isInProgress ? 'border-primary bg-primary-subtle/30' :
                  'border-gray-300 bg-gray-50/50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${
                          isCompleted ? 'bg-green-100' :
                          isFailed ? 'bg-red-100' :
                          needsRevision ? 'bg-yellow-100' :
                          isUnderReview ? 'bg-purple-100' :
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
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPhaseStatusColor(phase.status)}`}>
                              {phase.status}
                            </span>
                            {(needsRevision || isUnderReview) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                Requires Review
                              </span>
                            )}
                            {isUnderReview && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <EyeIcon className="h-3 w-3 mr-1" />
                                Under Review
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                {phase.status.toLowerCase() === 'passed' ? 'Passed' : 'Teacher Approved'}
                              </span>
                            )}
                            {isFailed && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                Failed
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
                      {canReviewPhase(phase.status) && (
                        <button
                          onClick={() => handleViewPhase(phase)}
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                            isCompleted
                              ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                              : isFailed
                              ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
                              : needsRevision
                              ? 'text-white bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                              : isUnderReview
                              ? 'text-white bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                              : 'text-white bg-primary hover:bg-primary-medium focus:ring-primary'
                          }`}
                        >
                          <EyeIcon className="-ml-1 mr-2 h-4 w-4" />
                          {isFailed ? 'Review Failed Phase' : needsRevision ? 'Review Feedback' : isCompleted ? 'View Results' : isUnderReview ? 'Review Phase' : 'Review Phase'}
                        </button>
                      )}
                      
                      {isNotStarted && (
                        <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg">
                          <ClockIcon className="-ml-1 mr-2 h-4 w-4" />
                          Waiting for Student
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
