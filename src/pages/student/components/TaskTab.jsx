import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Tag, 
  Avatar, 

  Tooltip,
  Card,
  Row,
  Col,
  Typography,
  Badge,
  Dropdown,
  message
} from 'antd';
import { 
  PlusOutlined, 
 
  CalendarOutlined,
  FlagOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TaskTab = ({ project, projectId, onTaskUpdate }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch tasks for the project
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
        // Handle the response data - should be an array of tasks
        const taskData = response.data.data;
        if (Array.isArray(taskData)) {
          const transformedTasks = taskData.map(task => ({
            ...task,
            id: task.project_task_id,
            status: task.status || 'pending'
          }));
          setTasks(transformedTasks);
        } else {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, projectId]);

  // Fetch priorities from API
  const fetchPriorities = useCallback(async () => {
    try {
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { operation: 'fetchPriorities' },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        // Transform the data to include colors for each priority
        const priorityData = response.data.data.map(priority => ({
          ...priority,
          id: priority.project_priority_id,
          name: priority.project_priority_name,
          color: getPriorityColor(priority.project_priority_name)
        }));
        setPriorities(priorityData);
      }
    } catch (error) {
      console.error('Error fetching priorities:', error);
    }
  }, [baseUrl]);

  // Get priority color based on name
  const getPriorityColor = (priorityName) => {
    const colorMap = {
      'Low': '#52c41a',
      'Medium': '#faad14', 
      'High': '#ff4d4f',
      'Critical': '#ff1744'
    };
    return colorMap[priorityName] || '#d9d9d9';
  };

  // Fetch project members for assignment dropdown
  const fetchUsers = useCallback(async () => {
    try {
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchMembersByMainId',
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
        setUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching project members:', error);
    }
  }, [baseUrl, projectId]);

  useEffect(() => {
    if (projectId) {
      fetchTasks();
      fetchUsers();
      fetchPriorities();
    }
  }, [projectId, fetchTasks, fetchUsers, fetchPriorities]);

  // Handle task creation
  const handleCreateTask = async (values) => {
    try {
      const token = SecureStorage.getLocalItem('token');
      const currentUser = JSON.parse(SecureStorage.getLocalItem('user') || '{}');
      
      const taskData = {
        operation: 'insertTask',
        project_project_main_id: parseInt(projectId),
        project_task_name: values.project_task_name,
        project_assigned_by: currentUser.id || 1,
        project_priority_id: values.project_priority_id,
        project_start_date: values.dateRange[0].format('YYYY-MM-DD'),
        project_end_date: values.dateRange[1].format('YYYY-MM-DD'),
        assigned_users: values.assigned_users
      };

      const response = await axios.post(
        `${baseUrl}student.php`,
        taskData,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        message.success('Task created successfully!');
        setIsModalVisible(false);
        form.resetFields();
        fetchTasks();
        if (onTaskUpdate) onTaskUpdate();
      } else {
        message.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      message.error('Failed to create task');
    }
  };

  // Get priority color and icon
  const getPriorityDisplay = (priorityId) => {
    const priority = priorities.find(p => p.id === priorityId);
    if (!priority) return { color: '#d9d9d9', name: 'Unknown', icon: <ClockCircleOutlined /> };
    
    const icons = {
      'Low': <CheckCircleOutlined />,
      'Medium': <ClockCircleOutlined />,
      'High': <ExclamationCircleOutlined />,
      'Critical': <ExclamationCircleOutlined />
    };
    
    return {
      color: priority.color,
      name: priority.name,
      icon: icons[priority.name] || <ClockCircleOutlined />
    };
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': { color: '#faad14', text: 'Pending' },
      'in_progress': { color: '#1890ff', text: 'In Progress' },
      'completed': { color: '#52c41a', text: 'Completed' },
      'on_hold': { color: '#ff4d4f', text: 'On Hold' }
    };
    
    return statusMap[status] || { color: '#d9d9d9', text: 'Unknown' };
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Task Name',
      dataIndex: 'project_task_name',
      key: 'task_name',
      width: '25%',
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <div className="w-2 h-8 rounded-full" style={{ backgroundColor: getPriorityDisplay(record.project_priority_id).color }}></div>
          <div>
            <Text strong className="text-gray-900">{text}</Text>
            {record.description && (
              <div className="text-xs text-gray-500 mt-1">{record.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Assignees',
      dataIndex: 'assigned_users',
      key: 'assignees',
      width: '20%',
      render: (assignedUsers) => {
        if (!Array.isArray(assignedUsers) || assignedUsers.length === 0) {
          return <Text type="secondary">No assignees</Text>;
        }

  
        const remainingCount = assignedUsers.length - 3;

        return (
          <div className="flex items-center space-x-2">
            <Avatar.Group maxCount={3} size="small">
              {assignedUsers.map((user) => (
                <Tooltip key={user.project_assigned_id} title={user.user_name}>
                  <Avatar 
                    size="small" 
                    style={{ backgroundColor: '#618264' }}
                  >
                    {user.user_name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </Tooltip>
              ))}
            </Avatar.Group>
            {remainingCount > 0 && (
              <Text type="secondary" className="text-xs">
                +{remainingCount} more
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'project_priority_id',
      key: 'priority',
      width: '15%',
      render: (priorityId) => {
        const priority = getPriorityDisplay(priorityId);
        return (
          <Tag 
            color={priority.color} 
            icon={priority.icon}
            className="border-0 font-medium"
          >
            {priority.name}
          </Tag>
        );
      },
    },
    {
      title: 'Dates',
      key: 'dates',
      width: '20%',
      render: (_, record) => (
        <div className="text-sm">
          <div className="flex items-center space-x-1 text-gray-600">
            <CalendarOutlined className="text-xs" />
            <span>{dayjs(record.project_start_date).format('MMM DD')}</span>
            <span>-</span>
            <span>{dayjs(record.project_end_date).format('MMM DD')}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {dayjs(record.project_end_date).diff(dayjs(), 'days')} days left
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => {
        const statusDisplay = getStatusDisplay(status);
        return (
          <Badge 
            color={statusDisplay.color} 
            text={statusDisplay.text}
            className="font-medium"
          />
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: '5%',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: 'Edit Task' },
              { key: 'delete', label: 'Delete Task', danger: true }
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="!mb-1" style={{ color: '#618264' }}>
            Project Tasks
          </Title>
          <Text type="secondary">
            Manage and track project tasks with team assignments
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
          style={{ backgroundColor: '#618264', borderColor: '#618264' }}
          className="hover:!bg-[#79AC78] hover:!border-[#79AC78]"
        >
          Add Task
        </Button>
      </div>

      {/* Task Statistics */}
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Card className="text-center border-l-4" style={{ borderLeftColor: '#faad14' }}>
            <div className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'pending').length}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="text-center border-l-4" style={{ borderLeftColor: '#1890ff' }}>
            <div className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'in_progress').length}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="text-center border-l-4" style={{ borderLeftColor: '#52c41a' }}>
            <div className="text-2xl font-bold text-gray-900">{tasks.filter(t => t.status === 'completed').length}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="text-center border-l-4" style={{ borderLeftColor: '#618264' }}>
            <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </Card>
        </Col>
      </Row>

      {/* Tasks Table */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={tasks}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tasks`,
          }}
          className="monday-style-table"
          size="middle"
        />
      </Card>

      {/* Add Task Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#618264] rounded-lg flex items-center justify-center">
              <PlusOutlined className="text-white text-sm" />
            </div>
            <span className="text-lg font-semibold">Add New Task</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        className="add-task-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
          className="mt-6"
        >
          <Form.Item
            name="project_task_name"
            label="Task Name"
            rules={[{ required: true, message: 'Please enter task name' }]}
          >
            <Input 
              placeholder="Enter task name"
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="project_priority_id"
                label="Priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select 
                  placeholder="Select priority"
                  size="large"
                >
                  {priorities.map(priority => (
                    <Option key={priority.id} value={priority.id}>
                      <div className="flex items-center space-x-2">
                        <FlagOutlined style={{ color: priority.color }} />
                        <span>{priority.name}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="assigned_users"
                label="Assign To"
                rules={[{ required: true, message: 'Please assign users' }]}
              >
                <Select 
                  mode="multiple"
                  placeholder="Select team members"
                  size="large"
                  optionLabelProp="label"
                >
                  {users.map(user => (
                    <Option key={user.project_users_id} value={user.project_users_id} label={user.full_name}>
                      <div className="flex items-center space-x-2">
                        <Avatar size="small" style={{ backgroundColor: '#618264' }}>
                          {user.full_name?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <span>{user.full_name}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dateRange"
            label="Duration"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker 
              size="large"
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>

          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}
              size="large"
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              size="large"
              style={{ backgroundColor: '#618264', borderColor: '#618264' }}
              className="hover:!bg-[#79AC78] hover:!border-[#79AC78]"
            >
              Create Task
            </Button>
          </div>
        </Form>
      </Modal>

      <style jsx>{`
        .monday-style-table .ant-table-thead > tr > th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #e9ecef;
          font-weight: 600;
          color: #495057;
        }
        
        .monday-style-table .ant-table-tbody > tr:hover > td {
          background-color: #f8f9fa;
        }
        
        .add-task-modal .ant-modal-header {
          border-bottom: 1px solid #f0f0f0;
          padding: 20px 24px;
        }
        
        .add-task-modal .ant-modal-body {
          padding: 0 24px 24px;
        }
      `}</style>
    </div>
  );
};

export default TaskTab;