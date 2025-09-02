import React, { useState, useEffect, useCallback } from 'react';
import { Progress, Card, Row, Col, Typography, Statistic, Tooltip } from 'antd';
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  FlagOutlined,
  ProjectOutlined 
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

  const taskProgress = calculateTaskProgress();
  const phaseProgress = calculatePhaseProgress();
  const overallProgress = calculateOverallProgress();

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
              <Title level={4} className="!mb-1" style={{ color: '#618264' }}>
                Project Progress
              </Title>
              <Text type="secondary" className="text-sm">
                Overall completion rate for this project
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
