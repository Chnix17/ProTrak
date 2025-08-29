import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  Row, 
  Col, 
  Card, 
  Input, 
  Button, 
  Upload, 
  List, 
  Avatar, 
  Space, 
  Spin, 
  Empty, 
  Typography, 
  Badge,
  Tooltip
} from 'antd';
import { 
  PaperClipOutlined,
  SendOutlined,
  FileOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
import axios from 'axios';

const { TextArea } = Input;
const { Text, Title } = Typography;

const PhaseWorkspaceModal = ({ isOpen, onClose, phase, projectId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phaseStatus, setPhaseStatus] = useState('in_progress');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const baseUrl = SecureStorage.getLocalItem("url");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };



  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchPhaseData = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'fetchPhasesProjectDetail',
          phase_project_id: parseInt(projectId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        const data = response.data.data;
        setMessages(data.discussions || []);
        setAttachments(data.files || []);
        setPhaseStatus(data.current_status?.status_name?.toLowerCase() || 'in_progress');
      }
    } catch (error) {
      console.error('Error fetching phase data:', error);
      toast.error('Failed to load phase workspace');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, projectId]);

  useEffect(() => {
    if (isOpen && phase) {
      fetchPhaseData();
    }
  }, [isOpen, phase, fetchPhaseData]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'insertDiscussion',
          discussion_text: newMessage.trim(),
          user_id: parseInt(userId),
          phase_project_id: parseInt(projectId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setNewMessage('');
        fetchPhaseData(); // Refresh messages
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  // const handleFileSelect = (event) => {
  //   const files = Array.from(event.target.files);
  //   setSelectedFiles(files);
  // };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:type;base64, prefix
      reader.onerror = error => reject(error);
    });
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('No files selected');
      return;
    }

    console.log('Starting file upload for', selectedFiles.length, 'files');

    try {
      setIsUploading(true);
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      console.log('Token:', token ? 'exists' : 'missing');
      console.log('User ID:', userId);
      console.log('Project ID:', projectId);
      
      for (const file of selectedFiles) {
        console.log('Processing file:', file.name, 'Size:', file.size);
        const base64Content = await convertFileToBase64(file);
        console.log('Base64 content length:', base64Content.length);
        
        const requestData = {
          operation: 'uploadPhaseFile',
          phase_project_id: parseInt(projectId),
          user_id: parseInt(userId),
          file: base64Content,
          file_name: file.name
        };
        
        console.log('Sending JSON request:', requestData);
        console.log('Request URL:', `${baseUrl}student.php`);
        
        const response = await axios.post(
          `${baseUrl}student.php`,
          requestData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        console.log('Response:', response.data);
        
        if (response.data.status === 'success') {
          toast.success(`${file.name} uploaded successfully`);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchPhaseData(); // Refresh attachments
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'needs_revision':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'in_progress':
      default:
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'needs_revision':
        return 'warning';
      case 'in_progress':
      default:
        return 'processing';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'needs_revision':
        return 'Needs Revision';
      case 'in_progress':
      default:
        return 'In Progress';
    }
  };

  // const formatFileSize = (bytes) => {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  const downloadFile = (file) => {
    const downloadUrl = `${baseUrl}uploads_files/${file.phase_project_file}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.phase_project_file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadProps = {
    multiple: true,
    accept: '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif',
    beforeUpload: (file) => {
      setSelectedFiles(prev => [...prev, file]);
      return false; // Prevent automatic upload
    },
    onRemove: (file) => {
      setSelectedFiles(prev => prev.filter(f => f.uid !== file.uid));
    },
    fileList: selectedFiles.map((file, index) => ({
      uid: file.uid || index,
      name: file.name,
      status: 'done',
      size: file.size
    }))
  };

  return (
    <Modal
      title={
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>
            {phase?.phase_main_name} - Workspace
          </Title>
          <Space>
            {getStatusIcon(phaseStatus)}
            <Badge 
              status={getStatusColor(phaseStatus)} 
              text={getStatusText(phaseStatus)}
            />
          </Space>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width="90vw"
      style={{ maxWidth: 1200, top: 20 }}
      bodyStyle={{ 
        height: '80vh', 
        padding: 0,
        overflow: 'hidden'
      }}
      footer={null}
      destroyOnClose
    >
      <Row style={{ height: '100%' }}>
        {/* Main Chat Area */}
        <Col xs={24} lg={16} style={{ height: '100%' }}>
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRight: '1px solid #f0f0f0'
          }}>
            {/* Messages Area */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px',
              backgroundColor: '#fafafa'
            }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">Loading workspace...</Text>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <Empty
                  description="No messages yet. Start the discussion!"
                  style={{ marginTop: 40 }}
                />
              ) : (
                <List
                  dataSource={messages}
                  renderItem={(message) => (
                    <List.Item style={{ border: 'none', padding: '8px 0' }}>
                      <Card
                        size="small"
                        style={{ 
                          width: '100%',
                          maxWidth: '70%',
                          marginLeft: 0
                        }}
                        bodyStyle={{ padding: '12px 16px' }}
                      >
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space size={8}>
                            <Avatar size="small" icon={<UserOutlined />} />
                            <Text strong style={{ fontSize: '12px' }}>
                              {`${message.users_fname} ${message.users_mname ? message.users_mname + ' ' : ''}${message.users_lname}`}
                            </Text>
                          </Space>
                          <Text>{message.phase_discussion_text}</Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {new Date(message.phase_discussion_created_at).toLocaleString()}
                          </Text>
                        </Space>
                      </Card>
                    </List.Item>
                  )}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{ 
              padding: '16px', 
              borderTop: '1px solid #f0f0f0',
              backgroundColor: '#fff'
            }}>
              <Space.Compact style={{ width: '100%' }}>
                <TextArea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPressEnter={(e) => {
                    if (!e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message... (Shift+Enter for new line)"
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{ height: 'auto' }}
                />
              </Space.Compact>
            </div>
          </div>
        </Col>

        {/* Attachments Sidebar */}
        <Col xs={24} lg={8} style={{ height: '100%' }}>
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#fff'
          }}>
            {/* Upload Section */}
            <div style={{ 
              padding: '16px', 
              borderBottom: '1px solid #f0f0f0'
            }}>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <Title level={5} style={{ margin: 0 }}>Attachments</Title>
                  <Upload {...uploadProps} showUploadList={false}>
                    <Button 
                      size="small" 
                      icon={<PaperClipOutlined />}
                      type="dashed"
                    >
                      Select Files
                    </Button>
                  </Upload>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <Card size="small" style={{ backgroundColor: '#f9f9f9' }}>
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                      }}>
                        <Text strong style={{ fontSize: '12px' }}>
                          Selected Files ({selectedFiles.length})
                        </Text>
                        <Button
                          size="small"
                          type="primary"
                          icon={<UploadOutlined />}
                          onClick={uploadFiles}
                          loading={isUploading}
                        >
                          Upload
                        </Button>
                      </div>
                      <List
                        size="small"
                        dataSource={selectedFiles}
                        renderItem={(file) => (
                          <List.Item style={{ padding: '4px 0' }}>
                            <Text style={{ fontSize: '11px' }}>
                              {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </Text>
                          </List.Item>
                        )}
                      />
                    </Space>
                  </Card>
                )}
              </Space>
            </div>

            {/* Attachments List */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px'
            }}>
              {attachments.length === 0 ? (
                <Empty
                  image={<FileOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
                  description="No files uploaded yet"
                  style={{ marginTop: 40 }}
                />
              ) : (
                <List
                  size="small"
                  dataSource={attachments}
                  renderItem={(file) => (
                    <List.Item
                      actions={[
                        <Tooltip title="Download">
                          <Button
                            type="text"
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => downloadFile(file)}
                          />
                        </Tooltip>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar size="small" icon={<FileOutlined />} />}
                        title={
                          <Tooltip title={file.phase_project_file}>
                            <Text 
                              style={{ fontSize: '13px' }}
                              ellipsis={{ tooltip: true }}
                            >
                              {file.phase_project_file}
                            </Text>
                          </Tooltip>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              By {`${file.users_fname} ${file.users_mname ? file.users_mname + ' ' : ''}${file.users_lname}`}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {new Date(file.phase_file_created_at).toLocaleDateString()}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

export default PhaseWorkspaceModal;
