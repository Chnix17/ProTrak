import React, { useState, useEffect } from 'react';
import { 
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
          <p className="text-sm text-gray-600">View team tasks</p>
        </div>
      </div>


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
