import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  UserIcon,
  CalendarIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
import axios from 'axios';

const KanbanTab = ({ project, projectId, onTaskUpdate }) => {
  const [tasks, setTasks] = useState({
    todo: [],
    in_progress: [],
    completed: []
  });
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    deadline: ''
  });
  const baseUrl = SecureStorage.getLocalItem("url");

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchProjectTasks',
          project_id: parseInt(projectId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        const tasksData = response.data.data || [];
        
        // Group tasks by status
        const groupedTasks = {
          todo: tasksData.filter(task => task.status === 'todo'),
          in_progress: tasksData.filter(task => task.status === 'in_progress'),
          completed: tasksData.filter(task => task.status === 'completed')
        };
        
        setTasks(groupedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchProjectMembers',
          project_id: parseInt(projectId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setMembers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'addTask',
          project_id: parseInt(projectId),
          created_by: parseInt(userId),
          title: newTask.title,
          description: newTask.description,
          assigned_to: newTask.assigned_to ? parseInt(newTask.assigned_to) : null,
          priority: newTask.priority,
          deadline: newTask.deadline
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Task added successfully');
        setNewTask({
          title: '',
          description: '',
          assigned_to: '',
          priority: 'medium',
          deadline: ''
        });
        setShowAddTask(false);
        fetchTasks();
        onTaskUpdate();
      } else {
        toast.error(response.data.message || 'Failed to add task');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'updateTaskStatus',
          task_id: taskId,
          status: newStatus
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Task status updated');
        fetchTasks();
      } else {
        toast.error(response.data.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <ExclamationCircleIcon className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.user_id === memberId);
    return member ? member.name : 'Unassigned';
  };

  useEffect(() => {
    fetchTasks();
    fetchMembers();
  }, [projectId]);

  const TaskCard = ({ task, onStatusChange }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1">
          {task.title}
        </h4>
        <div className="flex items-center space-x-1 ml-2">
          {getPriorityIcon(task.priority)}
        </div>
      </div>
      
      {task.description && (
        <p className="text-xs text-gray-600 mb-3">
          {task.description}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <UserIcon className="h-3 w-3" />
          <span>{getMemberName(task.assigned_to)}</span>
        </div>
        
        {task.deadline && (
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{new Date(task.deadline).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.task_id, e.target.value)}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  );

  const KanbanColumn = ({ title, tasks, status, count }) => (
    <div className="flex-1 bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
          {count}
        </span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {tasks.map((task) => (
          <TaskCard
            key={task.task_id}
            task={task}
            onStatusChange={updateTaskStatus}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Task Management</h3>
          <p className="text-sm text-gray-600">Organize and track team tasks</p>
        </div>
        <button
          onClick={() => setShowAddTask(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
          Add Task
        </button>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Add New Task</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter task title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To
              </label>
              <select
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select member</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter task description"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 mt-4">
            <button
              onClick={addTask}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Task
            </button>
            <button
              onClick={() => {
                setShowAddTask(false);
                setNewTask({
                  title: '',
                  description: '',
                  assigned_to: '',
                  priority: 'medium',
                  deadline: ''
                });
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex space-x-6 overflow-x-auto pb-4">
        <KanbanColumn
          title="To Do"
          tasks={tasks.todo}
          status="todo"
          count={tasks.todo.length}
        />
        <KanbanColumn
          title="In Progress"
          tasks={tasks.in_progress}
          status="in_progress"
          count={tasks.in_progress.length}
        />
        <KanbanColumn
          title="Completed"
          tasks={tasks.completed}
          status="completed"
          count={tasks.completed.length}
        />
      </div>
    </div>
  );
};

export default KanbanTab;
