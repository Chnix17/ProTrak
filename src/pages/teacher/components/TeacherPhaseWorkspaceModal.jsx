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
  Tooltip,
  Divider,
  Form,
  Select
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
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { toast } from 'sonner';
import { SecureStorage } from '../../../utils/encryption';
import axios from 'axios';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

const TeacherPhaseWorkspaceModal = ({ isOpen, onClose, phase, projectId, onPhaseUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phaseStatus, setPhaseStatus] = useState('In Progress');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFiles, setRevisionFiles] = useState([]);
  const [reviewFiles, setReviewFiles] = useState([]);
  const [uploadingRevision] = useState(false);
  const [uploadingReview] = useState(false);
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [revisionsList, setRevisionsList] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [reviewForm] = Form.useForm();
  const [revisionForm] = Form.useForm();
  const [phaseProjectId, setPhaseProjectId] = useState(null);
  const messagesEndRef = useRef(null);
  const baseUrl = SecureStorage.getLocalItem("url");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchPhaseData = React.useCallback(async () => {
    console.log('=== FETCH PHASE DATA CALLED ===');
    console.log('Modal isOpen:', isOpen);
    console.log('Phase:', phase);
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
        phase_main_id: parseInt(phase.phase_main_id)
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

  const handleRevisionFileUpload = (file) => {
    setRevisionFiles(prev => [...prev, {
      uid: file.uid,
      name: file.name,
      status: 'done',
      originFileObj: file
    }]);
    return false; // Prevent default upload behavior
  };

  const handleReviewFileUpload = (file) => {
    setReviewFiles(prev => [...prev, {
      uid: file.uid,
      name: file.name,
      status: 'done',
      originFileObj: file
    }]);
    return false; // Prevent default upload behavior
  };

  const submitRevisionReview = async (values) => {
    try {
      setIsSubmittingReview(true);
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      // First, insert the revision details
      const insertResponse = await axios.post(
        `${baseUrl}teacher.php`,
        {
          operation: 'insertRevisions',
          revision_phase_id: phase?.phase_id,
          revision_phase_project_id: parseInt(phaseProjectId),
          revision_created_by: parseInt(userId),
          revision_file: revisionFiles.length > 0 ? revisionFiles[0].name : '',
          revision_feed_back: values.feedback || ''
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (insertResponse.data.status !== 'success') {
        throw new Error(insertResponse.data.message || 'Failed to save revision details');
      }
      
      // Then update the phase status to revision
      const updateResponse = await axios.post(
        `${baseUrl}teacher.php`,
        {
          operation: 'updateRevision',
          phase_project_id: parseInt(phaseProjectId),
          phase_project_status_created_by: parseInt(userId)
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (updateResponse.data.status === 'success') {
        toast.success('Revision feedback submitted successfully');
        setShowRevisionModal(false);
        revisionForm.resetFields();
        setRevisionFiles([]);
        fetchPhaseData();
        onPhaseUpdate && onPhaseUpdate();
      } else {
        throw new Error(updateResponse.data.message || 'Failed to update phase status');
      }
    } catch (error) {
      console.error('Error submitting revision:', error);
      toast.error('Failed to submit revision');
    } finally {
      setIsSubmittingReview(false);
    }
  };


  const handleReviewClick = async () => {
    // Check if we have the phase_project_id from fetchPhasesProjectDetail
    if (!phaseProjectId) {
      toast.error('Phase project ID not available. Please refresh the workspace.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        { 
          operation: 'updateReview',
          phase_project_id: parseInt(phaseProjectId),
          created_by: parseInt(userId)
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success('Phase marked as under review');
        fetchPhaseData();
        onPhaseUpdate && onPhaseUpdate();
      } else {
        toast.error('Failed to update review status');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review status');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const fetchRevisions = async () => {
    if (!phaseProjectId) {
      toast.error('Phase project ID not available. Please refresh the workspace.');
      return;
    }

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

  // const handleApproveRevision = async (revisionPhaseId) => {
  //   if (!phaseProjectId) {
  //     toast.error('Phase project ID not available. Please refresh the workspace.');
  //     return;
  //   }

  //   try {
  //     const token = SecureStorage.getLocalItem('token');
  //     const userId = SecureStorage.getLocalItem('user_id');
      
  //     const response = await axios.post(
  //       `${baseUrl}teacher.php`,
  //       {
  //         operation: 'approveRevision',
  //         revision_phase_id: revisionPhaseId,
  //         phase_project_id: parseInt(phaseProjectId),
  //         approved_by: parseInt(userId)
  //       },
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );
      
  //     if (response.data.status === 'success') {
  //       toast.success('Revision approved successfully');
  //       fetchRevisions(); // Refresh the list
  //       fetchPhaseData(); // Refresh phase data
  //       onPhaseUpdate && onPhaseUpdate();
  //     } else {
  //       toast.error('Failed to approve revision');
  //     }
  //   } catch (error) {
  //     console.error('Error approving revision:', error);
  //     toast.error('Failed to approve revision');
  //   }
  // };

  // const handleFailRevision = async (revisionPhaseId) => {
  //   if (!phaseProjectId) {
  //     toast.error('Phase project ID not available. Please refresh the workspace.');
  //     return;
  //   }

  //   try {
  //     const token = SecureStorage.getLocalItem('token');
  //     const userId = SecureStorage.getLocalItem('user_id');
      
  //     const response = await axios.post(
  //       `${baseUrl}teacher.php`,
  //       {
  //         operation: 'failRevision',
  //         revision_phase_id: revisionPhaseId,
  //         phase_project_id: parseInt(phaseProjectId),
  //         failed_by: parseInt(userId)
  //       },
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );
      
  //     if (response.data.status === 'success') {
  //       toast.success('Revision marked as failed');
  //       fetchRevisions(); // Refresh the list
  //       fetchPhaseData(); // Refresh phase data
  //       onPhaseUpdate && onPhaseUpdate();
  //     } else {
  //       toast.error('Failed to mark revision as failed');
  //     }
  //   } catch (error) {
  //     console.error('Error failing revision:', error);
  //     toast.error('Failed to mark revision as failed');
  //   }
  // };

  // const handleReviseAgain = async (revisionPhaseId) => {
  //   if (!phaseProjectId) {
  //     toast.error('Phase project ID not available. Please refresh the workspace.');
  //     return;
  //   }

  //   try {
  //     const token = SecureStorage.getLocalItem('token');
  //     const userId = SecureStorage.getLocalItem('user_id');
      
  //     const response = await axios.post(
  //       `${baseUrl}teacher.php`,
  //       {
  //         operation: 'requestRevisionAgain',
  //         revision_phase_id: revisionPhaseId,
  //         phase_project_id: parseInt(phaseProjectId),
  //         requested_by: parseInt(userId)
  //       },
  //       {
  //         headers: {
  //           'Authorization': `Bearer ${token}`,
  //           'Content-Type': 'application/json'
  //         }
  //       }
  //     );
      
  //     if (response.data.status === 'success') {
  //       toast.success('Additional revision requested');
  //       fetchRevisions(); // Refresh the list
  //       fetchPhaseData(); // Refresh phase data
  //       onPhaseUpdate && onPhaseUpdate();
  //     } else {
  //       toast.error('Failed to request additional revision');
  //     }
  //   } catch (error) {
  //     console.error('Error requesting revision:', error);
  //     toast.error('Failed to request additional revision');
  //   }
  // };

  // New unified approve/decline function for both revisions and non-revisions
  const handleApprovePhase = async (approve) => {
    if (!phaseProjectId) {
      toast.error('Phase project ID not available. Please refresh the workspace.');
      return;
    }

    try {
      const token = SecureStorage.getLocalItem('token');
      const userId = SecureStorage.getLocalItem('user_id');
      
      const response = await axios.post(
        `${baseUrl}teacher.php`,
        {
          operation: 'updateApprovePhase',
          phase_project_id: parseInt(phaseProjectId),
          created_by: parseInt(userId),
          approve: approve
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast.success(approve ? 'Phase approved successfully' : 'Phase declined successfully');
        fetchPhaseData(); // Refresh phase data
        onPhaseUpdate && onPhaseUpdate();
        // Close any open modals
        setShowReviewForm(false);
        setShowRevisionsModal(false);
      } else {
        toast.error(`Failed to ${approve ? 'approve' : 'decline'} phase`);
      }
    } catch (error) {
      console.error(`Error ${approve ? 'approving' : 'declining'} phase:`, error);
      toast.error(`Failed to ${approve ? 'approve' : 'decline'} phase`);
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

  const downloadFile = (file) => {
    const downloadUrl = `${baseUrl}uploads_files/${file.phase_project_file}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.phase_project_file;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canReviewPhase = () => {
    return ['In Progress', 'Revision Needed'].includes(phaseStatus) && phaseStatus !== 'Approved';
  };

  return (
    <Modal
      title={
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>
            <EyeOutlined style={{ marginRight: 8 }} />
            {phase?.phase_main_name} - Teacher Review
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
            {/* Phase Review Actions */}
            <div style={{ 
              padding: '16px', 
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: '#fafafa'
            }}>
             
            </div>

            {/* Messages Area */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '16px',
              backgroundColor: '#fafafa'
            }}>
              {/* Under Review Message
              {phaseStatus === 'Under Review' && (
                <Alert
                  message="Phase Under Review"
                  description="This phase is currently being reviewed by the teacher. Students can continue discussions but cannot make changes to submissions."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )} */}

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">Loading workspace...</Text>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <Empty
                  description="No messages yet. Start the discussion with your students!"
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
                            {message.user_type && (
                              <Badge 
                                size="small" 
                                status={message.user_type === 'teacher' ? 'success' : 'default'} 
                                text={message.user_type === 'teacher' ? 'Teacher' : 'Student'}
                              />
                            )}
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
                  placeholder="Type your feedback or message... (Shift+Enter for new line)"
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
            {/* Attachments Header */}
            <div style={{ 
              padding: '16px', 
              borderBottom: '1px solid #f0f0f0'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <Title level={5} style={{ margin: 0 }}>
                  <FileOutlined style={{ marginRight: 8 }} />
                  Student Submissions
                </Title>
                <Space size={4}>
                  {(() => {
                    const validStatusesForRevisions = ['Revision Needed', 'Revision Nedded', 'Completed', 'Approved', 'Failed'];
                    const shouldShow = validStatusesForRevisions.includes(phaseStatus);
                    console.log('=== VIEW REVISIONS BUTTON DEBUG ===');
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
                  {canReviewPhase() && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={handleReviewClick}
                      loading={isSubmittingReview}
                      style={{ fontSize: '12px' }}
                    >
                      Review
                    </Button>
                  )}
                </Space>
              </div>
              
              {/* Review Action Buttons for Under Review Status */}
              {phaseStatus === 'Under Review' && phaseStatus !== 'Completed' && phaseStatus !== 'Failed' && phaseStatus !== 'Revision Needed' && phaseStatus !== 'Approved' && (
                <div style={{ marginBottom: '16px' }}>
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: '12px', color: '#722ed1' }}>
                      Review Actions
                    </Text>
                    <Space size={4} wrap>
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleApprovePhase(true)}
                        style={{ 
                          fontSize: '11px',
                          backgroundColor: '#52c41a',
                          borderColor: '#52c41a'
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        icon={<ExclamationCircleOutlined />}
                        onClick={() => setShowRevisionModal(true)}
                        style={{ 
                          fontSize: '11px',
                          color: '#faad14',
                          borderColor: '#faad14'
                        }}
                      >
                        Revision
                      </Button>
                      <Button
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => handleApprovePhase(false)}
                        style={{ fontSize: '11px' }}
                      >
                        Decline
                      </Button>
                    </Space>
                  </Space>
                </div>
              )}
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Review files uploaded by students
              </Text>
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
                  description="No files submitted yet"
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

      {/* Specialized Revision Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>Request Revision with Resources</span>
          </Space>
        }
        open={showRevisionModal}
        onCancel={() => {
          setShowRevisionModal(false);
          revisionForm.resetFields();
          setRevisionFiles([]);
        }}
        footer={null}
        width={700}
        style={{ top: 20 }}
      >
        <div style={{ 
          background: 'linear-gradient(135deg, #fff7e6 0%, #fff2d9 100%)',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ffd591'
        }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Title level={5} style={{ margin: 0, color: '#d48806' }}>
              📝 Revision Feedback Center
            </Title>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              Provide detailed feedback and attach revision resources to help students improve their work
            </Text>
          </Space>
        </div>

        <Form
          form={revisionForm}
          layout="vertical"
          onFinish={submitRevisionReview}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="feedback"
                label={
                  <Space>
                    <EditOutlined />
                    <span>Revision Feedback</span>
                  </Space>
                }
                rules={[{ required: true, message: 'Please provide revision feedback' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="Explain what needs to be revised and provide specific guidance..."
                  style={{ borderColor: '#ffd591' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              <PaperClipOutlined style={{ color: '#faad14' }} />
              <span style={{ color: '#d48806' }}>Revision Resources</span>
            </Space>
          </Divider>

          <div style={{ 
            background: '#fafafa',
            padding: '16px',
            borderRadius: '6px',
            border: '1px dashed #d9d9d9',
            marginBottom: '20px'
          }}>
            <Upload.Dragger
              name="revisionFiles"
              multiple
              beforeUpload={handleRevisionFileUpload}
              fileList={revisionFiles}
              onRemove={(file) => {
                setRevisionFiles(prev => prev.filter(f => f.uid !== file.uid));
              }}
              style={{ background: '#fff' }}
            >
              <p className="ant-upload-drag-icon">
                <PaperClipOutlined style={{ fontSize: '32px', color: '#faad14' }} />
              </p>
              <p className="ant-upload-text" style={{ color: '#d48806' }}>
                <strong>Upload Revision Resources</strong>
              </p>
              <p className="ant-upload-hint" style={{ fontSize: '12px' }}>
                Attach reference materials, examples, templates, or guides to help students with revisions
              </p>
            </Upload.Dragger>
            
            {revisionFiles.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <Text strong style={{ fontSize: '12px', color: '#d48806' }}>
                  📎 Attached Resources ({revisionFiles.length})
                </Text>
                <List
                  size="small"
                  dataSource={revisionFiles}
                  renderItem={(file) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      <Space size={8}>
                        <FileOutlined style={{ color: '#faad14' }} />
                        <Text style={{ fontSize: '12px' }}>{file.name}</Text>
                        <Badge status="success" text="Ready" />
                      </Space>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowRevisionModal(false);
                revisionForm.resetFields();
                setRevisionFiles([]);
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmittingReview || uploadingRevision}
                style={{ 
                  backgroundColor: '#faad14',
                  borderColor: '#faad14'
                }}
                icon={<ExclamationCircleOutlined />}
              >
                Submit Revision Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Review Form Modal */}
      <Modal
        title="Submit Phase Review"
        open={showReviewForm}
        onCancel={() => {
          setShowReviewForm(false);
          reviewForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={submitRevisionReview}
        >
          <Form.Item
            name="status"
            label="Review Decision"
            rules={[{ required: true, message: 'Please select a review decision' }]}
          >
            <Select placeholder="Select review decision">
              <Option value="approved">
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  Approve Phase
                </Space>
              </Option>
              <Option value="revision">
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  Needs Revision
                </Space>
              </Option>
              <Option value="failed">
                <Space>
                  <CloseOutlined style={{ color: '#ff4d4f' }} />
                  Mark as Failed
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="feedback"
            label="Feedback (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Provide feedback for the students..."
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <PaperClipOutlined />
                <span>Attach Files (Optional)</span>
              </Space>
            }
          >
            <Upload
              name="reviewFiles"
              multiple
              beforeUpload={handleReviewFileUpload}
              fileList={reviewFiles}
              onRemove={(file) => {
                setReviewFiles(prev => prev.filter(f => f.uid !== file.uid));
              }}
            >
              <Button icon={<PaperClipOutlined />} loading={uploadingReview}>
                Upload Files
              </Button>
            </Upload>
            {reviewFiles.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {reviewFiles.length} file(s) attached
                </Text>
              </div>
            )}
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setShowReviewForm(false);
                reviewForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmittingReview || uploadingReview}
              >
                Submit Review
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Revisions Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            <span>📋 Revision History & Feedback</span>
          </Space>
        }
        open={showRevisionsModal}
        onCancel={() => setShowRevisionsModal(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <div style={{ 
          background: 'linear-gradient(135deg, #fff7e6 0%, #fff1d6 100%)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '2px solid #ffd591',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-10px',
            right: '20px',
            background: '#faad14',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            REVISION TRACKER
          </div>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#faad14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
              }}>
                📝
              </div>
              <div>
                <Title level={4} style={{ margin: 0, color: '#d48806' }}>
                  Phase Revision Overview
                </Title>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  Track all revision requests and feedback for this phase
                </Text>
              </div>
            </div>
          </Space>
        </div>

        {loadingRevisions ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Loading revision history...</Text>
            </div>
          </div>
        ) : revisionsList.length === 0 ? (
          <Empty
            image={<ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />}
            description={
              <div>
                <Text strong>No Revisions Found</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  This phase hasn't received any revision feedback yet
                </Text>
              </div>
            }
            style={{ marginTop: 40 }}
          />
        ) : (
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <List
              dataSource={revisionsList}
              renderItem={(revision, index) => (
                <List.Item style={{ border: 'none', padding: 0, marginBottom: '16px' }}>
                  <Card
                    style={{ 
                      width: '100%',
                      borderLeft: '4px solid #faad14',
                      boxShadow: '0 2px 8px rgba(250, 173, 20, 0.1)'
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Space direction="vertical" size={8} style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#faad14',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {index + 1}
                          </div>
                          <Text strong style={{ color: '#d48806' }}>
                            Revision Request #{index + 1}
                          </Text>
                          <Badge 
                            status="warning" 
                       
                            style={{ fontSize: '11px' }}
                          />
                        </div>
                        
                        {revision.revision_feed_back && (
                          <div style={{
                            background: '#fffbe6',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #fff7e6',
                            marginLeft: '32px'
                          }}>
                            <Text style={{ fontSize: '13px', lineHeight: '1.6' }}>
                              {revision.revision_feed_back}
                            </Text>
                          </div>
                        )}

                        {revision.revision_file && (
                          <div style={{ marginLeft: '32px' }}>
                            <Space size={8}>
                              <PaperClipOutlined style={{ color: '#faad14' }} />
                              <Text style={{ fontSize: '12px', color: '#d48806' }}>
                                Attached: {revision.revision_file}
                              </Text>
                              <Button
                                type="link"
                                size="small"
                                icon={<DownloadOutlined />}
                                style={{ fontSize: '11px', padding: '0 4px' }}
                              >
                                Download
                              </Button>
                            </Space>
                          </div>
                        )}

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid #f0f0f0',
                          marginLeft: '32px'
                        }}>
                          <Space size={16}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              📅 {new Date(revision.revision_created_at || Date.now()).toLocaleString()}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              👤 By Teacher
                            </Text>
                          </Space>
                          
                        </div>
                        
                        {/* Student Response Section */}
                        <div style={{
                          marginTop: '12px',
                          marginLeft: '32px',
                          padding: '12px',
                          background: revision.revised_file ? '#f0f9ff' : '#fff7e6',
                          borderRadius: '8px',
                          border: revision.revised_file ? '1px solid #bae7ff' : '1px solid #ffd591',
                          cursor: revision.revised_file ? 'pointer' : 'default'
                        }}
                        onClick={revision.revised_file ? () => {
                          setShowRevisionsModal(false);
                          setShowRevisionModal(true);
                          revisionForm.setFieldsValue({ feedback: revision.revision_feed_back || '' });
                        } : undefined}
                        >
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Text strong style={{ 
                              fontSize: '12px', 
                              color: revision.revised_file ? '#0958d9' : '#d48806'
                            }}>
                              {revision.revised_file ? '📤 Student Response (Click to review)' : '⏳ Student Response'}
                            </Text>
                            {revision.revised_file ? (
                              <Space size={8}>
                                <PaperClipOutlined style={{ color: '#1890ff' }} />
                                <Text style={{ fontSize: '12px' }}>
                                  {revision.revised_file}
                                </Text>
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<DownloadOutlined />}
                                  style={{ fontSize: '11px', padding: '0 4px' }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Download
                                </Button>
                              </Space>
                            ) : (
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                No follow-up file uploaded yet
                              </Text>
                            )}
               
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

        {/* Action Buttons Section */}
        {phaseStatus !== 'Approved' && (
          <div style={{ 
            marginTop: '20px',
            padding: '20px',
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)',
            borderRadius: '12px',
            border: '2px solid #91d5ff',
            textAlign: 'center'
          }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {phaseStatus !== 'Completed' && (
              <div>
                <Text style={{ fontSize: '14px', color: '#0958d9', fontWeight: 'bold' }}>
                  📋 Review Actions
                </Text>
                <br />
                <Text style={{ fontSize: '12px', color: '#595959' }}>
                  Choose an action to take on this phase revision
                </Text>
              </div>
            )}
            
            {phaseStatus !== 'Completed' && (
              <Space size={12} wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApprovePhase(true)}
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    height: '40px',
                    minWidth: '120px',
                    fontWeight: 'bold'
                  }}
                  disabled={revisionsList.length === 0}
                >
                  Approve Phase
                </Button>
                
                <Button
                  size="large"
                  icon={<ExclamationCircleOutlined />}
                  onClick={() => {
                    setShowRevisionsModal(false);
                    setShowRevisionModal(true);
                  }}
                  style={{ 
                    color: '#faad14',
                    borderColor: '#faad14',
                    height: '40px',
                    minWidth: '120px',
                    fontWeight: 'bold'
                  }}
                  disabled={revisionsList.length === 0}
                >
                  Request Revision
                </Button>
                
                <Button
                  danger
                  size="large"
                  icon={<CloseOutlined />}
                  onClick={() => handleApprovePhase(false)}
                  style={{
                    height: '40px',
                    minWidth: '120px',
                    fontWeight: 'bold'
                  }}
                  disabled={revisionsList.length === 0}
                >
                  Decline Phase
                </Button>
              </Space>
            )}
            
           
          </Space>
          </div>
        )}
      </Modal>
    </Modal>
  );
};

export default TeacherPhaseWorkspaceModal;
