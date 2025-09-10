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
  UploadOutlined,
  EyeOutlined,
  CloseOutlined
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
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [revisionsList, setRevisionsList] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [revisionResponseFiles, setRevisionResponseFiles] = useState({});
  const [uploadingRevisionResponse, setUploadingRevisionResponse] = useState({});
  const [phaseProjectId, setPhaseProjectId] = useState(null);
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
      
      // Ensure we have a valid phase_main_id
      if (!phase?.phase_main_id) {
        console.error('No phase_main_id available:', phase);
        toast.error('Phase ID not available');
        return;
      }

      const requestPayload = { 
        operation: 'fetchPhasesProjectDetail',
        phase_main_id: parseInt(phase.phase_main_id),
        project_main_id: parseInt(projectId)
      };
      
      console.log('Sending request payload:', requestPayload);
      console.log('Phase object:', phase);
      console.log('About to make API call to:', `${baseUrl}student.php`);
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        requestPayload,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('API Response received:', response.data);
      
      if (response.data.status === 'success') {
        const data = response.data.data;
        console.log('=== FULL API RESPONSE DATA ===');
        console.log('Complete response.data:', response.data);
        console.log('Complete data object:', data);
        console.log('==============================');
        setMessages(data.discussions || []);
        setAttachments(data.files || []);
        
        // Store the phase_project_id from the response
        if (data.phase?.phase_project_id) {
          console.log('Setting phaseProjectId to:', data.phase.phase_project_id);
          setPhaseProjectId(data.phase.phase_project_id);
        } else {
          console.log('No phase_project_id found in response:', data);
        }
        
        // Get the latest status - check multiple possible locations
        let latestStatus = 'In Progress';
        if (data.status) {
          // Direct status field
          latestStatus = data.status;
        } else if (data.current_status?.status_name) {
          // Nested in current_status object
          latestStatus = data.current_status.status_name;
        } else if (data.status_history && data.status_history.length > 0) {
          // From status history
          const sortedHistory = data.status_history.sort((a, b) => 
            new Date(b.phase_project_status_created_at) - new Date(a.phase_project_status_created_at)
          );
          latestStatus = sortedHistory[0].status_name;
        }
        
        console.log('Setting phase status to:', latestStatus);
        console.log('Current status object:', data.current_status);
        console.log('Status history:', data.status_history);
        setPhaseStatus(latestStatus);
      }
    } catch (error) {
      console.error('Error fetching phase data:', error);
      toast.error('Failed to load phase workspace');
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, phase]);

  useEffect(() => {
    if (isOpen && phase) {
      fetchPhaseData();
    }
  }, [isOpen, phase, fetchPhaseData]);

  useEffect(() => {
    console.log('Phase status changed to:', phaseStatus);
  }, [phaseStatus]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    // Check if we have the phase_project_id from fetchPhasesProjectDetail
    if (!phaseProjectId) {
      toast.error('Phase project ID not available. Please refresh the workspace.');
      return;
    }

    try {
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      console.log('Sending insertDiscussion with phaseProjectId:', phaseProjectId);
      console.log('Full payload:', {
        operation: 'insertDiscussion',
        discussion_text: newMessage.trim(),
        user_id: parseInt(userId),
        phase_project_id: parseInt(phaseProjectId)
      });
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'insertDiscussion',
          discussion_text: newMessage.trim(),
          user_id: parseInt(userId),
          phase_project_id: parseInt(phaseProjectId)
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
      console.log('Project ID:', phaseProjectId);
      
      for (const file of selectedFiles) {
        console.log('Processing file:', file.name, 'Size:', file.size);
        const base64Content = await convertFileToBase64(file);
        console.log('Base64 content length:', base64Content.length);
        
        const requestData = {
          operation: 'uploadPhaseFile',
          phase_project_id: parseInt(phaseProjectId),
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

  const fetchRevisions = async () => {
    try {
      setLoadingRevisions(true);
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        {
          operation: 'fetchRevisions',
          project_id: parseInt(phaseProjectId)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        setRevisionsList(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching revisions:', error);
      toast.error('Failed to load revisions');
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleRevisionResponseFileUpload = (file, revisionId) => {
    setRevisionResponseFiles(prev => ({
      ...prev,
      [revisionId]: [{
        uid: file.uid,
        name: file.name,
        status: 'done',
        originFileObj: file
      }]
    }));
    return false; // Prevent default upload behavior
  };

  // const removeRevisionResponseFile = (file, revisionId) => {
  //   setRevisionResponseFiles(prev => ({
  //     ...prev,
  //     [revisionId]: (prev[revisionId] || []).filter(f => f.uid !== file.uid)
  //   }));
  // };

  const submitRevisionResponse = async (revisionId, message = '') => {
    const files = revisionResponseFiles[revisionId] || [];
    if (files.length === 0) {
      toast.error('Please upload at least one file to respond to this revision');
      return;
    }

    try {
      setUploadingRevisionResponse(prev => ({ ...prev, [revisionId]: true }));
      const token = SecureStorage.getLocalItem('token');
      
      // Upload the revision response file using the new API format
      for (const file of files) {
        const base64Content = await convertFileToBase64(file.originFileObj);
        
        // Create a temporary file path for the revised file
        const revisedFilePath = `uploads_files/revisions/${Date.now()}_${file.name}`;
        
        const response = await axios.post(
          `${baseUrl}student.php`,
          {
            operation: 'updateFileRevise',
            revision_phase_id: parseInt(revisionId),
            revised_file: revisedFilePath,
            file: base64Content,
            file_name: file.name
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.status === 'success') {
          toast.success(`Revision response submitted successfully`);
        } else {
          throw new Error(response.data.message || 'Failed to submit revision response');
        }
      }
      
      // Clear files for this specific revision
      setRevisionResponseFiles(prev => ({ ...prev, [revisionId]: [] }));
      fetchPhaseData();
      fetchRevisions(); // Refresh revisions to show updated status
    } catch (error) {
      console.error('Error submitting revision response:', error);
      toast.error('Failed to submit revision response');
    } finally {
      setUploadingRevisionResponse(prev => ({ ...prev, [revisionId]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'Completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'Revision Needed':
      case 'Revision Nedded':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'Failed':
        return <CloseOutlined style={{ color: '#ff4d4f' }} />;
      case 'Under Review':
        return <EyeOutlined style={{ color: '#722ed1' }} />;
      case 'In Progress':
      default:
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Completed':
        return 'success';
      case 'Revision Needed':
      case 'Revision Nedded':
        return 'warning';
      case 'Failed':
        return 'error';
      case 'Under Review':
        return 'processing';
      case 'In Progress':
      default:
        return 'processing';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Approved':
        return 'Approved';
      case 'Completed':
        return 'Completed';
      case 'Revision Needed':
      case 'Revision Nedded':
        return 'Revision Needed';
      case 'Failed':
        return 'Failed';
      case 'Under Review':
        return 'Under Review';
      case 'In Progress':
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
    fileList: Array.isArray(selectedFiles) ? selectedFiles.map((file, index) => ({
      uid: file.uid || index,
      name: file.name,
      status: 'done',
      size: file.size
    })) : []
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
                  <Space size={4}>
                    {(() => {
                      const validStatusesForRevisions = ['Revision Needed', 'Revision Nedded', 'Completed', 'Approved', 'Failed'];
                      const shouldShow = validStatusesForRevisions.includes(phaseStatus);
                      console.log('=== VIEW REVISIONS BUTTON DEBUG (Student) ===');
                      console.log('Phase Status:', `"${phaseStatus}"`);
                      console.log('Phase Status Type:', typeof phaseStatus);
                      console.log('Valid Statuses:', validStatusesForRevisions);
                      console.log('Includes Failed?:', validStatusesForRevisions.includes('Failed'));
                      console.log('Status equals Failed?:', phaseStatus === 'Failed');
                      console.log('Should Show Button:', shouldShow);
                      console.log('=== END DEBUG ===');
                      return shouldShow;
                    })() && (
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setShowRevisionsModal(true);
                          fetchRevisions();
                        }}
                        style={{ 
                          fontSize: '12px',
                          color: '#faad14',
                          borderColor: '#faad14'
                        }}
                      >
                        View Revisions
                      </Button>
                    )}
                    <Upload {...uploadProps} showUploadList={false}>
                      <Button 
                        size="small" 
                        icon={<PaperClipOutlined />}
                        type="dashed"
                      >
                        Select Files
                      </Button>
                    </Upload>
                  </Space>
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

      {/* Enhanced View Revisions Modal */}
      <Modal
        title={
          <div style={{ 
            background: 'linear-gradient(135deg, #618264 0%, #79AC78 100%)',
            margin: '-24px -24px 0 -24px',
            padding: '20px 24px',
            color: 'white',
            borderRadius: '8px 8px 0 0'
          }}>
            <Space align="center">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <ExclamationCircleOutlined style={{ color: 'white', fontSize: '16px' }} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: 'white' }}>
                  📋 Revision Feedback
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px' }}>
                  Review teacher feedback and submit your revisions
                </Text>
              </div>
            </Space>
          </div>
        }
        open={showRevisionsModal}
        onCancel={() => setShowRevisionsModal(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
        styles={{
          header: { padding: 0, border: 'none' },
          body: { padding: '24px' }
        }}
      >
        {/* Enhanced Header Card */}
        <div style={{ 
          background: 'linear-gradient(135deg, #D0E7D2 0%, #B0D9B1 100%)',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
          border: '2px solid #79AC78',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative Elements */}
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            width: '60px',
            height: '60px',
            background: 'rgba(97, 130, 100, 0.1)',
            borderRadius: '50%'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            left: '-20px',
            width: '80px',
            height: '80px',
            background: 'rgba(121, 172, 120, 0.1)',
            borderRadius: '50%'
          }}></div>
          
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '24px',
            background: '#618264',
            color: 'white',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 'bold',
            letterSpacing: '0.5px'
          }}>
            REVISION REQUIRED
          </div>
          
          <Space direction="vertical" size={16} style={{ width: '100%', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#618264',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(97, 130, 100, 0.3)'
              }}>
                📝
              </div>
              <div>
                <Title level={3} style={{ margin: 0, color: '#618264' }}>
                  Teacher Feedback Available
                </Title>
                <Text style={{ color: '#79AC78', fontSize: '14px', fontWeight: '500' }}>
                  Please review the feedback below and submit your revised work
                </Text>
              </div>
            </div>
          </Space>
        </div>

        {loadingRevisions ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '3px solid #D0E7D2',
              borderTop: '3px solid #618264',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <Text style={{ color: '#618264', fontSize: '16px', fontWeight: '500' }}>
              Loading revision feedback...
            </Text>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', background: '#618264', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
              <div style={{ width: '8px', height: '8px', background: '#79AC78', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out 0.3s infinite' }}></div>
              <div style={{ width: '8px', height: '8px', background: '#B0D9B1', borderRadius: '50%', animation: 'pulse 1.5s ease-in-out 0.6s infinite' }}></div>
            </div>
          </div>
        ) : revisionsList.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'linear-gradient(135deg, #f8fffe 0%, #f0f9f1 100%)',
            borderRadius: '16px',
            border: '2px dashed #B0D9B1'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #D0E7D2 0%, #B0D9B1 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              📋
            </div>
            <Title level={4} style={{ color: '#618264', margin: '0 0 8px 0' }}>
              No Revision Feedback Found
            </Title>
            <Text style={{ color: '#79AC78', fontSize: '14px' }}>
              This phase hasn't received any revision feedback yet
            </Text>
          </div>
        ) : (
          <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '8px' }}>
            <List
              dataSource={revisionsList}
              renderItem={(revision, index) => (
                <List.Item style={{ border: 'none', padding: 0, marginBottom: '20px' }}>
                  <Card
                    style={{ 
                      width: '100%',
                      borderLeft: '5px solid #618264',
                      boxShadow: '0 4px 16px rgba(97, 130, 100, 0.15)',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                    bodyStyle={{ padding: 0 }}
                  >
                    {/* Card Header */}
                    <div style={{
                      background: 'linear-gradient(135deg, #D0E7D2 0%, #B0D9B1 100%)',
                      padding: '16px 20px',
                      borderBottom: '1px solid #B0D9B1'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#618264',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(97, 130, 100, 0.3)'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ color: '#618264', fontSize: '16px' }}>
                            Revision Request #{index + 1}
                          </Text>
                          <div style={{ marginTop: '4px' }}>
                            <Badge 
                              style={{
                                background: '#618264',
                                color: 'white',
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                border: 'none'
                              }}
                              count="Action Required"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div style={{ padding: '20px' }}>
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {revision.revision_feed_back && (
                          <div style={{
                            background: 'linear-gradient(135deg, #f8fffe 0%, #f0f9f1 100%)',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid #D0E7D2',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '-8px',
                              left: '16px',
                              background: '#618264',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              letterSpacing: '0.5px'
                            }}>
                              FEEDBACK
                            </div>
                            <Text style={{ 
                              fontSize: '14px', 
                              lineHeight: '1.7',
                              color: '#2d5a2f',
                              marginTop: '8px',
                              display: 'block'
                            }}>
                              {revision.revision_feed_back}
                            </Text>
                          </div>
                        )}

                        {revision.revision_file && (
                          <div style={{
                            background: '#f8fffe',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: '1px solid #D0E7D2'
                          }}>
                            <Space size={12} align="center">
                              <PaperClipOutlined style={{ color: '#618264', fontSize: '16px' }} />
                              <div style={{ flex: 1 }}>
                                <Text style={{ fontSize: '13px', color: '#618264', fontWeight: '500' }}>
                                  Attached File: {revision.revision_file}
                                </Text>
                              </div>
                              <Button
                                type="primary"
                                size="small"
                                icon={<DownloadOutlined />}
                                style={{ 
                                  background: '#618264',
                                  borderColor: '#618264',
                                  fontSize: '12px'
                                }}
                              >
                                Download
                              </Button>
                            </Space>
                          </div>
                        )}

                        {/* Student Response Section */}
                        <div style={{
                          marginTop: '16px',
                          padding: '16px',
                          background: revision.revised_file ? '#f0f9ff' : '#fff7e6',
                          borderRadius: '12px',
                          border: revision.revised_file ? '2px solid #91d5ff' : '2px dashed #ffd591'
                        }}>
                          <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Text strong style={{ 
                                fontSize: '14px', 
                                color: revision.revised_file ? '#0958d9' : '#d48806'
                              }}>
                                {revision.revised_file ? '📤 Your Response' : '⏳ Upload Your Response'}
                              </Text>
                              {revision.revised_file && (
                                <Badge 
                                  status="success" 
                                  text="Submitted" 
                                  style={{ fontSize: '12px' }}
                                />
                              )}
                            </div>
                            
                           
                           
                          </Space>
                        </div>

                        {/* Footer Info */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingTop: '12px',
                          borderTop: '1px solid #f0f0f0',
                          marginTop: '16px'
                        }}>
                          <Space size={20}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px' }}>📅</span>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {new Date(revision.revision_updated_at || Date.now()).toLocaleString()}
                              </Text>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '14px' }}>👤</span>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                By Teacher
                              </Text>
                            </div>
                          </Space>
                        </div>
                      </Space>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          </div>
        )}

        {/* Enhanced Upload Section */}
        <div style={{ 
          marginTop: '24px',
          background: 'linear-gradient(135deg, #f8fffe 0%, #f0f9f1 100%)',
          borderRadius: '16px',
          border: '2px solid #B0D9B1',
          overflow: 'hidden'
        }}>
          {/* Upload Header */}
          <div style={{
            background: 'linear-gradient(135deg, #618264 0%, #79AC78 100%)',
            padding: '16px 20px',
            color: 'white'
          }}>
            <Space align="center">
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)'
              }}>
                <UploadOutlined style={{ color: 'white', fontSize: '16px' }} />
              </div>
              <div>
                <Text style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
                  Upload Your Revised Work
                </Text>
                <div style={{ marginTop: '2px' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                    Submit your corrections based on the feedback above
                  </Text>
                </div>
              </div>
            </Space>
          </div>
          
          {/* Upload Content */}
          <div style={{ padding: '20px' }}>
            <div style={{ 
              background: '#fff',
              borderRadius: '12px',
              border: '2px dashed #B0D9B1',
              overflow: 'hidden'
            }}>
              <Upload.Dragger
                name="revisionResponseFiles"
                beforeUpload={handleRevisionResponseFileUpload}
                fileList={Array.isArray(revisionResponseFiles) ? revisionResponseFiles : []}
                onRemove={(file) => {
                  setRevisionResponseFiles(prev => Array.isArray(prev) ? prev.filter(f => f.uid !== file.uid) : []);
                }}
                style={{ 
                  background: 'linear-gradient(135deg, #fafffe 0%, #f5fbf6 100%)',
                  minHeight: '120px',
                  border: 'none'
                }}
                maxCount={1}
              >
                <div style={{ padding: '20px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'linear-gradient(135deg, #618264 0%, #79AC78 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 4px 12px rgba(97, 130, 100, 0.3)'
                  }}>
                    <UploadOutlined style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <Title level={5} style={{ color: '#618264', margin: '0 0 8px 0' }}>
                    Drop files here or click to upload
                  </Title>
                  <Text style={{ color: '#79AC78', fontSize: '13px' }}>
                    Upload one file only - PDF, DOC, DOCX, or image files
                  </Text>
                </div>
              </Upload.Dragger>
              
              {revisionResponseFiles.length > 0 && (
                <div style={{ 
                  padding: '16px 20px',
                  background: 'linear-gradient(135deg, #f8fffe 0%, #f0f9f1 100%)',
                  borderTop: '1px solid #D0E7D2'
                }}>
                  <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    <Text strong style={{ color: '#618264', fontSize: '14px' }}>
                      📎 Selected File
                    </Text>
                    
                    <List
                      size="small"
                      dataSource={revisionResponseFiles}
                      renderItem={(file) => (
                        <List.Item style={{ 
                          padding: '8px 12px',
                          background: '#fff',
                          borderRadius: '8px',
                          border: '1px solid #D0E7D2',
                          marginBottom: '8px'
                        }}>
                          <Space size={12} align="center" style={{ width: '100%' }}>
                            <FileOutlined style={{ color: '#618264', fontSize: '16px' }} />
                            <div style={{ flex: 1 }}>
                              <Text style={{ fontSize: '13px', fontWeight: '500', color: '#618264' }}>
                                {file.name}
                              </Text>
                            </div>
                            <Badge 
                              style={{
                                background: '#618264',
                                color: 'white',
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                border: 'none'
                              }}
                              count="Ready"
                            />
                          </Space>
                        </List.Item>
                      )}
                    />
                    
                    <div style={{ textAlign: 'right', marginTop: '12px' }}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<UploadOutlined />}
                        onClick={() => submitRevisionResponse({})}
                        loading={uploadingRevisionResponse}
                        style={{ 
                          background: 'linear-gradient(135deg, #618264 0%, #79AC78 100%)',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 12px rgba(97, 130, 100, 0.3)'
                        }}
                      >
                        {uploadingRevisionResponse ? 'Submitting...' : 'Submit Revision'}
                      </Button>
                    </div>
                  </Space>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

    </Modal>
  );
};

export default PhaseWorkspaceModal;
