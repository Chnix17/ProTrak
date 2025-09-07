import React, { useState, useEffect, useCallback } from 'react';
import { Progress, Card, Row, Col, Typography, Statistic, Tooltip, Alert, Badge } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  FlagOutlined,
  ProjectOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { SecureStorage } from '../../../utils/encryption';
import axios from 'axios';

const { Title, Text } = Typography;

const ProjectProgressBar = ({ project, projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch tasks for progress calculation
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchAssignedTaskByProjectMainId',
          project_main_id: parseInt(projectId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        const taskData = response.data.data;
        if (Array.isArray(taskData)) {
          setTasks(taskData);
        } else {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks for progress:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, projectId]);

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId, fetchTasks]);

  // Calculate task progress
  const calculateTaskProgress = () => {
    if (!tasks || tasks.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completedTasks = tasks.filter(task => task.project_task_is_done === 1);
    const percentage = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    
    return {
      completed: completedTasks.length,
      total: tasks.length,
      percentage: Math.round(percentage)
    };
  };

  // Calculate phase progress - count all completed phases (including failed)
  const calculatePhaseProgress = () => {
    if (!project?.phases || project.phases.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    // Count phases that have been processed (have a final status)
    const completedPhases = project.phases.filter(phase => {
      const status = phase.status.toLowerCase();
      return status === 'completed' || 
             status === 'approved' || 
             status === 'passed' || 
             status === 'failed';
    });
    
    const percentage = project.phases.length > 0 ? (completedPhases.length / project.phases.length) * 100 : 0;
    
    return {
      completed: completedPhases.length,
      total: project.phases.length,
      percentage: Math.round(percentage)
    };
  };

  // Calculate overall progress (weighted combination)
  const calculateOverallProgress = () => {
    const taskProgress = calculateTaskProgress();
    const phaseProgress = calculatePhaseProgress();
    
    // If no tasks or phases, return 0
    if (taskProgress.total === 0 && phaseProgress.total === 0) {
      return { percentage: 0, status: 'Not Started' };
    }
    
    // Weight: 60% tasks, 40% phases (phases are more important milestones)
    const taskWeight = 0.6;
    const phaseWeight = 0.4;
    
    let weightedProgress = 0;
    let totalWeight = 0;
    
    if (taskProgress.total > 0) {
      weightedProgress += taskProgress.percentage * taskWeight;
      totalWeight += taskWeight;
    }
    
    if (phaseProgress.total > 0) {
      weightedProgress += phaseProgress.percentage * phaseWeight;
      totalWeight += phaseWeight;
    }
    
    const overallPercentage = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
    
    // Determine status based on percentage
    let status = 'Not Started';
    if (overallPercentage >= 100) status = 'Completed';
    else if (overallPercentage >= 80) status = 'Nearly Complete';
    else if (overallPercentage >= 50) status = 'In Progress';
    else if (overallPercentage > 0) status = 'Started';
    
    return { percentage: overallPercentage, status };
  };

  // Analyze project failure risk
  const analyzeProjectHealth = () => {
    const taskProgress = calculateTaskProgress();
    // const phaseProgress = calculatePhaseProgress();
    
    if (!project?.phases || project.phases.length === 0) {
      return { risk: 'unknown', level: 'info', message: 'No phases available for analysis' };
    }

    // Count phase statuses
    const statusCounts = {
      failed: 0,
      revisions: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      approved: 0
    };

    project.phases.forEach(phase => {
      const status = phase.status.toLowerCase();
      if (status === 'failed') statusCounts.failed++;
      else if (status === 'revision nedded' || status === 'revisions needed') statusCounts.revisions++;
      else if (status === 'pending') statusCounts.pending++;
      else if (status === 'in progress') statusCounts.inProgress++;
      else if (status === 'completed') statusCounts.completed++;
      else if (status === 'approved') statusCounts.approved++;
    });

    const totalPhases = project.phases.length;
    const failedRate = (statusCounts.failed / totalPhases) * 100;
    const revisionRate = (statusCounts.revisions / totalPhases) * 100;
    const completionRate = ((statusCounts.completed + statusCounts.approved) / totalPhases) * 100;
    const taskCompletionRate = taskProgress.percentage;

    // Risk analysis logic - simplified to 3 levels
    let risk = 'good';
    let level = 'success';
    let message = 'Project is progressing well';
    let recommendations = [];

    // Critical risk: ALL phases failed AND tasks not completed
    if (statusCounts.failed === totalPhases && taskCompletionRate < 100) {
      risk = 'critical';
      level = 'error';
      message = 'Critical: All phases failed with incomplete tasks';
      recommendations.push('Immediate intervention required - all phases have failed');
      recommendations.push('Review project requirements and provide additional support');
      recommendations.push('Consider project restructuring or timeline extension');
    }
    // Medium risk: Some failures or low completion rates
    else if (failedRate > 0 || revisionRate >= 30 || (taskCompletionRate < 60 && completionRate < 50)) {
      risk = 'medium';
      level = 'warning';
      message = 'Medium risk: Some concerns detected';
      recommendations.push('Monitor progress closely');
      recommendations.push('Address any blockers preventing completion');
      recommendations.push('Provide support for struggling phases');
    }
    // Good: Project on track
    else {
      risk = 'good';
      level = 'success';
      message = 'Good: Project is on track';
      recommendations.push('Continue current approach');
      recommendations.push('Maintain quality standards');
    }

    return {
      risk,
      level,
      message,
      recommendations,
      metrics: {
        failedRate: Math.round(failedRate),
        revisionRate: Math.round(revisionRate),
        completionRate: Math.round(completionRate),
        taskCompletionRate: Math.round(taskCompletionRate)
      },
      statusCounts
    };
  };

  const taskProgress = calculateTaskProgress();
  const phaseProgress = calculatePhaseProgress();
  const overallProgress = calculateOverallProgress();
  const projectHealth = analyzeProjectHealth();

  // Get progress color based on percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#52c41a'; // Green
    if (percentage >= 60) return '#79AC78'; // Medium green
    if (percentage >= 40) return '#faad14'; // Yellow
    if (percentage >= 20) return '#ff7875'; // Orange-red
    return '#ff4d4f'; // Red
  };

  return (
    <Card 
      className="shadow-sm border border-gray-100 mb-6"
      loading={isLoading}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-[#D0E7D2] rounded-lg p-3">
              <ProjectOutlined className="h-6 w-6 text-[#618264]" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <Title level={4} className="!mb-1" style={{ color: '#618264' }}>
                  Project Progress
                </Title>
                <Badge 
                  status={projectHealth.level === 'error' ? 'error' : 
                          projectHealth.level === 'warning' ? 'warning' : 
                          projectHealth.level === 'success' ? 'success' : 'processing'}
                  text={
                    <span className={`text-xs font-medium ${
                      projectHealth.level === 'error' ? 'text-red-600' :
                      projectHealth.level === 'warning' ? 'text-yellow-600' :
                      projectHealth.level === 'success' ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      {projectHealth.risk.toUpperCase()} RISK
                    </span>
                  }
                />
              </div>
              <Text type="secondary" className="text-sm">
                Overall completion rate and project health analysis
              </Text>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{overallProgress.percentage}%</div>
                <div className="text-sm text-gray-500">{phaseProgress.completed} of {phaseProgress.total} phases completed</div>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                overallProgress.percentage >= 80 ? 'bg-green-100' :
                overallProgress.percentage >= 60 ? 'bg-yellow-100' :
                overallProgress.percentage >= 40 ? 'bg-orange-100' :
                'bg-red-100'
              }`}>
                <span className={`text-lg font-bold ${
                  overallProgress.percentage >= 80 ? 'text-green-600' :
                  overallProgress.percentage >= 60 ? 'text-yellow-600' :
                  overallProgress.percentage >= 40 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {overallProgress.percentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Health Analysis Alert */}
        <Alert
          message={projectHealth.message}
          description={
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="font-medium">Failed Phases:</span> {projectHealth.metrics.failedRate}%
                </div>
                <div>
                  <span className="font-medium">Revisions Needed:</span> {projectHealth.metrics.revisionRate}%
                </div>
              </div>
            
            </div>
          }
          type={projectHealth.level}
          showIcon
          icon={
            projectHealth.level === 'error' ? <ExclamationCircleOutlined /> :
            projectHealth.level === 'warning' ? <WarningOutlined /> :
            projectHealth.level === 'success' ? <CheckCircleOutlined /> :
            <InfoCircleOutlined />
          }
          className="mb-4"
        />

        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Text strong>Overall Progress</Text>
            <Text type="secondary">{overallProgress.percentage}%</Text>
          </div>
          <Progress
            percent={overallProgress.percentage}
            strokeColor={getProgressColor(overallProgress.percentage)}
            trailColor="#f0f0f0"
            strokeWidth={8}
            showInfo={false}
            className="mb-4"
          />
        </div>

        {/* Detailed Progress Breakdown */}
        <Row gutter={24}>
          {/* Task Progress */}
          <Col xs={24} lg={12}>
            <Card size="small" className="h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircleOutlined style={{ color: '#618264' }} />
                    <Text strong>Task Completion</Text>
                  </div>
                  <Tooltip title={`${taskProgress.completed} of ${taskProgress.total} tasks completed`}>
                    <Text type="secondary">{taskProgress.percentage}%</Text>
                  </Tooltip>
                </div>
                <Progress
                  percent={taskProgress.percentage}
                  strokeColor="#618264"
                  trailColor="#f0f0f0"
                  size="small"
                  showInfo={false}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{taskProgress.completed} completed</span>
                  <span>{taskProgress.total} total</span>
                </div>
              </div>
            </Card>
          </Col>

          {/* Phase Progress */}
          <Col xs={24} lg={12}>
            <Card size="small" className="h-full">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FlagOutlined style={{ color: '#79AC78' }} />
                    <Text strong>Phase Completion</Text>
                  </div>
                  <Tooltip title={`${phaseProgress.completed} of ${phaseProgress.total} phases completed (including failed)`}>
                    <Text type="secondary">{phaseProgress.percentage}%</Text>
                  </Tooltip>
                </div>
                <Progress
                  percent={phaseProgress.percentage}
                  strokeColor="#79AC78"
                  trailColor="#f0f0f0"
                  size="small"
                  showInfo={false}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{phaseProgress.completed} completed</span>
                  <span>{phaseProgress.total} total phases</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Phase Status Breakdown */}
        {project?.phases && project.phases.length > 0 && (
          <Card size="small" className="mt-4">
            <div className="space-y-3">
              <Text strong className="text-sm">Phase Status Breakdown</Text>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {(() => {
                  const statusCounts = {
                    'in progress': 0,
                    'pending': 0,
                    'under review': 0,
                    'revisions needed': 0,
                    'approved': 0,
                    'completed': 0,
                    'failed': 0
                  };

                  project.phases.forEach(phase => {
                    const status = phase.status.toLowerCase();
                    if (status === 'revision nedded') {
                      statusCounts['revisions needed']++;
                    } else if (statusCounts.hasOwnProperty(status)) {
                      statusCounts[status]++;
                    }
                  });

                  const statusColors = {
                    'in progress': '#1890ff',
                    'pending': '#faad14',
                    'under review': '#722ed1',
                    'revisions needed': '#fa8c16',
                    'approved': '#52c41a',
                    'completed': '#618264',
                    'failed': '#ff4d4f'
                  };

                  return Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="text-center p-2 bg-gray-50 rounded-lg">
                      <div 
                        className="text-lg font-bold"
                        style={{ color: statusColors[status] }}
                      >
                        {count}
                      </div>
                      <div className="text-xs text-gray-600 capitalize">
                        {status.replace('_', ' ')}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </Card>
        )}

        {/* Progress Statistics */}
        <Row gutter={16} className="pt-4 border-t border-gray-100">
          <Col xs={12} sm={6}>
            <Statistic
              title="Tasks Done"
              value={taskProgress.completed}
              suffix={`/ ${taskProgress.total}`}
              valueStyle={{ color: '#618264', fontSize: '18px' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Phases Completed"
              value={phaseProgress.completed}
              suffix={`/ ${phaseProgress.total}`}
              valueStyle={{ color: '#79AC78', fontSize: '18px' }}
              prefix={<FlagOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Tasks Pending"
              value={taskProgress.total - taskProgress.completed}
              valueStyle={{ color: '#faad14', fontSize: '18px' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic
              title="Phases Pending"
              value={phaseProgress.total - phaseProgress.completed}
              valueStyle={{ color: '#722ed1', fontSize: '18px' }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default ProjectProgressBar;
