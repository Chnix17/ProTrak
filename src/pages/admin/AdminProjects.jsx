import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Table, Card, Button, Space, Tag, message, Spin, Select, Breadcrumb, Descriptions, Row, Col, Avatar, Badge, Typography } from 'antd';
import { 
  PlusOutlined, 
  EyeOutlined, 
  HomeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { SecureStorage } from '../../utils/encryption';


const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'view', or 'detail'
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailsPagination, setDetailsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [allProjects, setAllProjects] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [projectMembers, setProjectMembers] = useState({});
  const [projectTasks, setProjectTasks] = useState({});
  

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const token = SecureStorage.getLocalItem('token');
      const baseUrl = SecureStorage.getLocalItem("url");
      
      // Fetch all master projects
      const response = await fetch(`${baseUrl}admin.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation: 'fetchAllMasterProjects'
        })
      });

      const result = await response.json();
      console.log('API Response:', result); // Debug log
      
      if (result.status === 'success') {
        // Store all projects
        const projectsData = Array.isArray(result.data) ? result.data : [];
        setAllProjects(projectsData);
        
        // Extract unique teachers
        const uniqueTeachers = [];
        const teacherMap = new Map();
        
        projectsData.forEach(project => {
          const teacherId = project.project_teacher_id; // Updated to match the API response
          const teacherName = project.teacher_name;
          
          if (teacherId && teacherName && !teacherMap.has(teacherId)) {
            teacherMap.set(teacherId, true);
            uniqueTeachers.push({
              teacher_id: teacherId,
              name: teacherName
            });
          }
        });
        
        setTeacherOptions(uniqueTeachers);
        
        // Initial filter if a teacher is already selected
        const filteredProjects = selectedTeacher === 'all' 
          ? projectsData 
          : projectsData.filter(project => 
              String(project.project_teacher_id) === String(selectedTeacher)
            );
        
        setProjects(filteredProjects);
        setPagination(prevPagination => ({
          ...prevPagination,
          total: filteredProjects.length,
        }));
      } else {
        message.error(result.message || 'Failed to fetch projects');
        console.error('API Error:', result.message); // Debug log
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error('An error occurred while fetching projects');
    } finally {
      setLoading(false);
    }
  }, [selectedTeacher]);

  // Initial fetch and refetch when fetchProjects changes
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  // Update filtered projects when selectedTeacher changes
  useEffect(() => {
    if (allProjects.length > 0) {
      const filteredProjects = selectedTeacher === 'all' 
        ? allProjects 
        : allProjects.filter(project => String(project.teacher_id) === String(selectedTeacher));
      
      setProjects(filteredProjects);
      setPagination(prev => ({
        ...prev,
        total: filteredProjects.length,
        current: 1 // Reset to first page when filter changes
      }));
    }
  }, [selectedTeacher, allProjects]);

  // Fetch project members by project_main_id
  const fetchProjectMembers = useCallback(async (projectMainId) => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const baseUrl = SecureStorage.getLocalItem("url");
      
      const response = await fetch(`${baseUrl}student.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation: 'fetchMembersByMainId',
          project_main_id: projectMainId
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setProjectMembers(prev => ({
          ...prev,
          [projectMainId]: result.data
        }));
        return result.data;
      } else {
        console.error('Failed to fetch project members:', result.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
      return [];
    }
  }, []);

  const columns = [
    {
      title: 'Project Title',
      dataIndex: 'project_title',
      key: 'project_title',
      render: (text, record) => (
        <Link to={`/admin/projects/${record.project_master_id}`} className="font-medium text-primary hover:underline">
          {text}
        </Link>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'project_code',
      key: 'project_code',
    },
    {
      title: 'Teacher',
      dataIndex: 'teacher_name',
      key: 'teacher_name',
    },
    {
      title: 'Students',
      dataIndex: 'student_count',
      key: 'student_count',
      align: 'center',
      render: (count) => (
        <Tag color={count > 0 ? 'green' : 'default'}>
          {count} {count === 1 ? 'student' : 'students'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'project_is_active',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => viewProject(record)}
            title="View Details"
          />
          {/* <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => editProject(record.project_master_id)}
            title="Edit Project"
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => confirmDelete(record.project_master_id)}
            title="Delete Project"
          /> */}
        </Space>
      ),
    },
  ];

  const viewProject = async (project) => {
    try {
      setLoading(true);
      const token = SecureStorage.getLocalItem('token');
      const baseUrl = SecureStorage.getLocalItem("url");
      
      // First set the basic project info
      setSelectedProject(project);
      
      // Fetch detailed project information
      const response = await fetch(`${baseUrl}teacher.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation: 'fetchAllProjects',
          master_id: project.project_master_id
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Update the project with detailed information
        setSelectedProject(prev => ({
          ...prev,
          details: result.data || []
        }));
      } else {
        message.error(result.message || 'Failed to load project details');
      }
      
      setViewMode('view');
    } catch (error) {
      console.error('Error fetching project details:', error);
      message.error('An error occurred while loading project details');
    } finally {
      setLoading(false);
    }
  };

//   const editProject = (id) => {
//     // Implement edit project
//     console.log('Edit project:', id);
//   };

//   const confirmDelete = (id) => {
//     // Implement delete confirmation
//     console.log('Delete project:', id);
//   };

  // Fetch project tasks by project_main_id
  const fetchProjectTasks = useCallback(async (projectMainId) => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const baseUrl = SecureStorage.getLocalItem("url");
      
      const response = await fetch(`${baseUrl}student.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation: 'fetchAssignedTaskByProjectMainId',
          project_main_id: projectMainId
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setProjectTasks(prev => ({
          ...prev,
          [projectMainId]: result.data
        }));
        return result.data;
      } else {
        console.error('Failed to fetch project tasks:', result.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      return [];
    }
  }, []);

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

//   const breadcrumbItems = [
//     {
//       title: <Link to="/admin"><HomeOutlined /></Link>,
//       key: 'home',
//     },
//     {
//       title: 'Projects',
//       key: 'projects',
//     },
//   ];

//   const projectBreadcrumbItems = [
//     ...breadcrumbItems,
//     {
//       title: selectedProject?.project_title || 'All Projects',
//       key: 'project-details',
//     },
//   ];

  const handleBreadcrumbClick = (key) => {
    if (key === 'home') {
      // Navigate to admin dashboard
      window.location.href = '/admin';
    } else if (key === 'projects') {
      // Go back to projects list
      setViewMode('list');
      setSelectedProject(null);
      setSelectedDetailProject(null);
    } else if (key === 'master-project') {
      // Go back to master project view
      setViewMode('view');
      setSelectedDetailProject(null);
    }
  };

  const renderBreadcrumb = (mode, project = null) => {
    let items = [
      {
        title: <HomeOutlined />,
        key: 'home',
        onClick: () => handleBreadcrumbClick('home'),
      },
      {
        title: 'Projects',
        key: 'projects',
        onClick: () => handleBreadcrumbClick('projects'),
      },
    ];
    
    if (mode === 'view' && selectedProject) {
      // For project view: Home / Projects / [Master Project Title]
      items.push({
        title: selectedProject.project_title,
        key: 'master-project',
      });
    } else if (mode === 'detail' && project) {
      // For project detail: Home / Projects / [Master Project Title] / [Individual Project Title]
      items.push(
        {
          title: selectedProject?.project_title || 'Master Project',
          key: 'master-project',
          onClick: () => handleBreadcrumbClick('master-project'),
        },
        {
          title: project.project_title || 'Project Details',
          key: 'project-detail',
        }
      );
    }
    
    return (
      <Breadcrumb 
        className="mb-4"
        itemRender={(route, params, routes, paths) => {
          const last = routes.indexOf(route) === routes.length - 1;
          if (last) {
            return <span>{route.title}</span>;
          }
          if (route.onClick) {
            return (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  route.onClick();
                }} 
                style={{ 
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  color: '#1890ff',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                {route.title}
              </button>
            );
          }
          return <span>{route.title}</span>;
        }}
        items={items}
      />
    );
  };

  const renderProjectList = () => (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Projects Management</h1>
          {renderBreadcrumb('list')}
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
          <Select
            className="w-full sm:w-64"
            placeholder="Filter by teacher"
            value={selectedTeacher}
            onChange={(value) => {
              console.log('Selected teacher:', value);
              setSelectedTeacher(value);
            }}
            loading={loading}
            options={[
              { value: 'all', label: 'All Teachers' },
              ...teacherOptions.map(teacher => ({
                value: String(teacher.teacher_id),
                label: teacher.name
              }))
            ]}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            // onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto"
          >
            Create Project
          </Button>
        </div>
      </div>

      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={projects}
            rowKey="project_master_id"
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
          />
        </Spin>
      </Card>
    </>
  );

  const handleDetailsTableChange = (pagination) => {
    setDetailsPagination(pagination);
  };

  const [selectedDetailProject, setSelectedDetailProject] = useState(null);

  const { Title, Text } = Typography;

  // Helper function to calculate project progress based on phases
//   const calculateProjectProgress = (phases) => {
//     if (!phases || phases.length === 0) return 0;
    
//     const completedPhases = phases.filter(phase => 
//       phase.status === 'Done' || phase.status === 'Completed'
//     ).length;
    
//     return Math.round((completedPhases / phases.length) * 100);
//   };

  // Helper function to get status icon and color
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return { icon: <CheckCircleOutlined />, color: '#52c41a', bgColor: '#f6ffed' };
      case 'completed':
      case 'done':
        return { icon: <CheckCircleOutlined />, color: '#389e0d', bgColor: '#f6ffed' };
      case 'failed':
        return { icon: <ExclamationCircleOutlined />, color: '#ff4d4f', bgColor: '#fff2f0' };
      case 'in progress':
        return { icon: <ClockCircleOutlined />, color: '#1890ff', bgColor: '#e6f7ff' };
      case 'not started':
        return { icon: <ExclamationCircleOutlined />, color: '#8c8c8c', bgColor: '#f5f5f5' };
      case 'pending':
        return { icon: <ClockCircleOutlined />, color: '#faad14', bgColor: '#fffbe6' };
      case 'revisions needed':
        return { icon: <ExclamationCircleOutlined />, color: '#fa8c16', bgColor: '#fff7e6' };
      case 'under review':
        return { icon: <ClockCircleOutlined />, color: '#722ed1', bgColor: '#f9f0ff' };
      default:
        return { icon: <ExclamationCircleOutlined />, color: '#d9d9d9', bgColor: '#fafafa' };
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleProjectRowClick = async (project) => {
    try {
      setLoading(true);
      const token = SecureStorage.getLocalItem('token');
      const baseUrl = SecureStorage.getLocalItem("url");
      
      // Fetch the project details
      const response = await fetch(`${baseUrl}student.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          operation: 'fetchProjectMainById',
          project_main_id: project.project_main_id
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSelectedDetailProject(result.data);
        setViewMode('detail');
        // Fetch project members and tasks when viewing project details
        await fetchProjectMembers(project.project_main_id);
        await fetchProjectTasks(project.project_main_id);
      } else {
        message.error(result.message || 'Failed to load project details');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      message.error('An error occurred while loading project details');
    } finally {
      setLoading(false);
    }
  };

  const projectDetailsColumns = [
    {
      title: 'Project Title',
      dataIndex: 'project_title',
      key: 'project_title',
      render: (text, record) => (
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleProjectRowClick(record);
          }}
          style={{ 
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            color: '#1890ff',
            textDecoration: 'underline',
            padding: 0
          }}
        >
          {text}
        </button>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'project_description',
      key: 'project_description',
    },
    {
      title: 'Members',
      dataIndex: 'member_count',
      key: 'member_count',
      render: (count) => `${count} member${count !== 1 ? 's' : ''}`,
    },
    {
      title: 'Status',
      dataIndex: 'project_is_active',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={(e) => {
            e.stopPropagation();
            handleProjectRowClick(record);
          }}
          title="View Details"
        />
      ),
    },
  ];

  const renderEnhancedProjectDetail = (project) => {
    return (
      <div>
        <div className="mb-6">
          {renderBreadcrumb('detail', project)}
        </div>
        
        <Card 
          className="shadow-lg"
          style={{ 
            borderRadius: '12px',
            border: 'none',
            background: '#ffffff'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Title level={2} className="mb-2" style={{ color: '#618264' }}>
                  {project.project_title}
                </Title>
                <Text type="secondary" className="text-base">
                  {project.project_description || 'No description available'}
                </Text>
              </div>
             
            </div>
            
            {/* Progress Section */}
            {/* <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <Text strong className="text-lg">Progress</Text>
                <Text strong className="text-xl" style={{ color: '#618264' }}>
                  {progress}%
                </Text>
              </div>
              <Progress 
                percent={progress} 
                strokeColor={{
                  '0%': '#B0D9B1',
                  '100%': '#618264',
                }}
                strokeWidth={12}
                className="mb-4"
              />
            </div> */}
          </div>

          {/* Phases Section */}
          <div className="mb-8">
            <Title level={3} className="mb-4" style={{ color: '#618264' }}>
              Phases
            </Title>
            <div className="space-y-4">
              {project.phases && project.phases.length > 0 ? (
                project.phases.map((phase, index) => {
                  const statusConfig = getStatusConfig(phase.status);
                  return (
                    <Card 
                      key={phase.phase_main_id || index}
                      size="small"
                      className="border-l-4"
                      style={{ 
                        borderLeftColor: statusConfig.color,
                        backgroundColor: statusConfig.bgColor,
                        borderRadius: '8px'
                      }}
                    >
                      <Row align="middle" justify="space-between">
                        <Col flex="auto">
                          <div className="flex items-center gap-3">
                            <div 
                              className="flex items-center justify-center w-8 h-8 rounded-full"
                              style={{ 
                                backgroundColor: statusConfig.color,
                                color: 'white'
                              }}
                            >
                              {statusConfig.icon}
                            </div>
                            <div>
                              <Text strong className="text-base">
                                {phase.phase_main_name}
                              </Text>
                              <br />
                              <Text type="secondary" className="text-sm">
                                {phase.phase_main_description}
                              </Text>
                            </div>
                          </div>
                        </Col>
                        <Col>
                          <div className="text-right">
                            <Tag 
                              color={statusConfig.color}
                              className="mb-2"
                              style={{ 
                                borderRadius: '12px',
                                padding: '4px 12px',
                                fontWeight: '500'
                              }}
                            >
                              {phase.status}
                            </Tag>
                            <br />
                            <Text type="secondary" className="text-xs flex items-center gap-1">
                              <CalendarOutlined />
                              {formatDate(phase.phase_start_date)} - {formatDate(phase.phase_end_date)}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  );
                })
              ) : (
                <Card className="text-center py-8" style={{ backgroundColor: '#fafafa' }}>
                  <Text type="secondary">No phases available for this project</Text>
                </Card>
              )}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="mb-8">
            <Title level={3} className="mb-4" style={{ color: '#618264' }}>
              Tasks ({projectTasks[project.project_main_id]?.length || 0})
            </Title>
            {projectTasks[project.project_main_id] && projectTasks[project.project_main_id].length > 0 ? (
              <div className="space-y-4">
                {projectTasks[project.project_main_id].map((task) => (
                  <Card 
                    key={task.project_task_id}
                    className="border-l-4"
                    style={{ 
                      borderLeftColor: task.project_task_is_done ? '#52c41a' : '#faad14',
                      backgroundColor: task.project_task_is_done ? '#f6ffed' : '#fffbe6',
                      borderRadius: '8px'
                    }}
                  >
                    <Row align="middle" justify="space-between">
                      <Col flex="auto">
                        <div className="flex items-start gap-3">
                          <div 
                            className="flex items-center justify-center w-8 h-8 rounded-full mt-1"
                            style={{ 
                              backgroundColor: task.project_task_is_done ? '#52c41a' : '#faad14',
                              color: 'white'
                            }}
                          >
                            {task.project_task_is_done ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Text strong className="text-base">
                                {task.project_task_name}
                              </Text>
                              <Tag 
                                color={task.project_task_is_done ? 'green' : 'orange'}
                                style={{ borderRadius: '12px' }}
                              >
                                {task.project_task_is_done ? 'Completed' : 'In Progress'}
                              </Tag>
                            </div>
                            <div className="mb-2">
                              <Text type="secondary" className="text-sm flex items-center gap-1">
                                <CalendarOutlined />
                                {task.project_start_date} - {task.project_end_date}
                              </Text>
                            </div>
                            <div className="mb-2">
                              <Text type="secondary" className="text-sm">
                                <strong>Assigned by:</strong> {task.assigned_by_name}
                              </Text>
                            </div>
                            {task.assigned_users && task.assigned_users.length > 0 && (
                              <div>
                                <Text type="secondary" className="text-sm block mb-1">
                                  <strong>Assigned to:</strong>
                                </Text>
                                <div className="flex flex-wrap gap-1">
                                  {task.assigned_users.map((user) => (
                                    <Tag 
                                      key={user.project_assigned_id}
                                      style={{ 
                                        backgroundColor: '#D0E7D2',
                                        color: '#618264',
                                        border: '1px solid #B0D9B1',
                                        borderRadius: '12px'
                                      }}
                                    >
                                      {user.user_name}
                                    </Tag>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8" style={{ backgroundColor: '#fafafa' }}>
                <Text type="secondary">No tasks assigned to this project</Text>
              </Card>
            )}
          </div>

          {/* Students Section */}
          <div>
            <Title level={3} className="mb-4" style={{ color: '#618264' }}>
              Students ({projectMembers[project.project_main_id]?.length || 0})
            </Title>
            {projectMembers[project.project_main_id] && projectMembers[project.project_main_id].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectMembers[project.project_main_id].map((member, index) => (
                  <Card 
                    key={member.project_members_id} 
                    size="small"
                    className="text-center"
                    style={{ 
                      borderRadius: '12px',
                      border: '1px solid #D0E7D2'
                    }}
                  >
                    <Avatar 
                      size={48} 
                      icon={<UserOutlined />} 
                      style={{ 
                        backgroundColor: '#79AC78',
                        marginBottom: '12px'
                      }}
                    />
                    <div>
                      <Text strong className="text-sm block">
                        {member.full_name}
                      </Text>
                      <Text type="secondary" className="text-xs block mb-2">
                        {member.user_email}
                      </Text>
                      <div className="flex items-center justify-center gap-2">
                        <Badge 
                          count={member.project_member_rating} 
                          style={{ 
                            backgroundColor: '#618264',
                            fontSize: '10px'
                          }}
                        />
                        <Text type="secondary" className="text-xs">
                          Rating
                        </Text>
                      </div>
                      <Text type="secondary" className="text-xs block mt-1">
                        {index === 0 ? '(Leader)' : '(Member)'}
                      </Text>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8" style={{ backgroundColor: '#fafafa' }}>
                <Text type="secondary">No students assigned to this project</Text>
              </Card>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderProjectView = () => {
    if (viewMode === 'detail' && selectedDetailProject) {
      return renderEnhancedProjectDetail(selectedDetailProject);
    }

    return (
      <div>
        <div className="mb-6">
   
          {renderBreadcrumb('view', selectedProject)}
        </div>
        <Card 
          title={selectedProject?.project_title}
        >
          <Descriptions bordered column={1} className="mb-6">
            <Descriptions.Item label="Project Code">
              {selectedProject?.project_code}
            </Descriptions.Item>
            <Descriptions.Item label="Teacher">
              {selectedProject?.teacher_name}
            </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={selectedProject?.project_is_active ? 'green' : 'red'}>
              {selectedProject?.project_is_active ? 'Active' : 'Inactive'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {selectedProject?.project_description || 'No description available'}
          </Descriptions.Item>
        </Descriptions>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">All Projects</h3>
          <Table
            columns={projectDetailsColumns}
            dataSource={selectedProject?.details || []}
            rowKey="project_main_id"
            pagination={{
              ...detailsPagination,
              total: selectedProject?.details?.length || 0,
              pageSize: 10,
              showSizeChanger: false,
            }}
            onChange={handleDetailsTableChange}
            loading={loading}
            onRow={(record) => ({
              onClick: () => handleProjectRowClick(record),
              style: { cursor: 'pointer' }
            })}
          />
        </div>
      </Card>
    </div>
  );
  };

  return (
    <div className="p-6">
      {viewMode === 'list' ? renderProjectList() : renderProjectView()}
    </div>
  );
};

export default AdminProjects;
