import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Avatar, 
  Typography, 
  Row, 
  Col, 
  Rate, 
  Tag, 
  Badge,
  Divider,
  Spin,
  Button,
  message
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  CalendarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { SecureStorage } from '../../../utils/encryption';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const MembersTab = ({ projectId, isViewOnly = false }) => {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingRating, setEditingRating] = useState(null);
  const [tempRatings, setTempRatings] = useState({});
  const baseUrl = SecureStorage.getLocalItem("url");

  // Fetch project members
  const fetchMembers = useCallback(async () => {
    try {
      setIsLoading(true);
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
        setMembers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [baseUrl, projectId]);

  useEffect(() => {
    if (projectId) {
      fetchMembers();
    }
  }, [projectId, fetchMembers]);

  // Update member rating
  const updateMemberRating = async (memberId, newRating) => {
    try {
      const token = SecureStorage.getLocalItem('token');
      
      const response = await axios.post(
        `${baseUrl}student.php`,
        { 
          operation: 'updateMemberRating',
          project_users_id: memberId,
          project_main_id: parseInt(projectId),
          rating: newRating
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        message.success('Rating updated successfully!');
        // Update local state
        setMembers(prevMembers => 
          prevMembers.map(member => 
            member.project_users_id === memberId 
              ? { ...member, project_member_rating: newRating }
              : member
          )
        );
      } else {
        message.error('Failed to update rating');
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      message.error('Failed to update rating');
    }
  };

  // Handle rating edit
  const handleRatingEdit = (memberId) => {
    setEditingRating(memberId);
    const member = members.find(m => m.project_users_id === memberId);
    setTempRatings({
      ...tempRatings,
      [memberId]: member?.project_member_rating || 0
    });
  };

  // Handle rating save
  const handleRatingSave = (memberId) => {
    const newRating = tempRatings[memberId];
    updateMemberRating(memberId, newRating);
    setEditingRating(null);
    setTempRatings({
      ...tempRatings,
      [memberId]: undefined
    });
  };

  // Handle rating cancel
  const handleRatingCancel = (memberId) => {
    setEditingRating(null);
    setTempRatings({
      ...tempRatings,
      [memberId]: undefined
    });
  };

  // Handle rating change
  const handleRatingChange = (memberId, value) => {
    setTempRatings({
      ...tempRatings,
      [memberId]: value
    });
  };

  // Get member role badge color
  const getRoleBadgeColor = (email) => {
    // You can determine role based on email or other criteria
    if (email.includes('admin')) return '#ff4d4f';
    if (email.includes('faculty')) return '#1890ff';
    return '#52c41a'; // Default for students
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={4} className="!mb-1" style={{ color: '#618264' }}>
            Project Members
          </Title>
          <Text type="secondary">
            Team members working on this project
          </Text>
        </div>
        <Badge 
          count={members.length} 
          style={{ backgroundColor: '#618264' }}
          className="mr-2"
        >
          <TeamOutlined className="text-2xl text-gray-400" />
        </Badge>
      </div>

      {/* Members Grid */}
      <Row gutter={[16, 16]}>
        {members.map((member) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={member.project_users_id}>
            <Card
              className="member-card hover:shadow-lg transition-shadow duration-300"
              style={{ borderRadius: '12px', border: '1px solid #f0f0f0' }}
            >
              <div className="text-center space-y-4">
                {/* Avatar */}
                <div className="relative">
                  <Avatar 
                    size={64} 
                    style={{ backgroundColor: '#618264' }}
                    icon={<UserOutlined />}
                    className="mx-auto"
                  >
                    {member.full_name?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Badge 
                    status={member.is_active ? "success" : "default"}
                    className="absolute -bottom-1 -right-1"
                  />
                </div>

                {/* Member Info */}
                <div>
                  <Title level={5} className="!mb-1 text-gray-900">
                    {member.full_name}
                  </Title>
                  <div className="flex items-center justify-center space-x-1 text-sm text-gray-500 mb-2">
                    <MailOutlined className="text-xs" />
                    <Text type="secondary" className="text-xs">
                      {member.user_email}
                    </Text>
                  </div>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  {!isViewOnly && editingRating === member.project_users_id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2">
                        <Rate 
                          value={tempRatings[member.project_users_id]} 
                          onChange={(value) => handleRatingChange(member.project_users_id, value)}
                          style={{ fontSize: '16px', color: '#faad14' }}
                        />
                        <Text className="text-sm text-gray-600">
                          {tempRatings[member.project_users_id]}.0
                        </Text>
                      </div>
                      <div className="flex justify-center space-x-2">
                        <Button 
                          size="small" 
                          type="primary"
                          onClick={() => handleRatingSave(member.project_users_id)}
                          style={{ backgroundColor: '#618264', borderColor: '#618264' }}
                        >
                          Save
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => handleRatingCancel(member.project_users_id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <Rate 
                          disabled 
                          value={member.project_member_rating || 0} 
                          style={{ fontSize: '16px', color: '#faad14' }}
                        />
                        <Text className="text-sm text-gray-600">
                          {member.project_member_rating || 0}.0
                        </Text>
                      </div>
                      {!isViewOnly && (
                        <Button 
                          size="small" 
                          type="link"
                          onClick={() => handleRatingEdit(member.project_users_id)}
                          className="text-xs p-0 h-auto"
                          style={{ color: '#618264' }}
                        >
                          Edit Rating
                        </Button>
                      )}
                    </div>
                  )}
                  <Text type="secondary" className="text-xs">
                    Performance Rating
                  </Text>
                </div>

                <Divider className="!my-3" />

                {/* Member Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Text type="secondary">Role:</Text>
                    <Tag 
                      color={getRoleBadgeColor(member.user_email)}
                      className="text-xs"
                    >
                      Member
                    </Tag>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <Text type="secondary">Joined:</Text>
                    <div className="flex items-center space-x-1">
                      <CalendarOutlined className="text-xs" />
                      <Text className="text-xs">
                        {dayjs(member.project_members_joined_at).format('MMM DD, YYYY')}
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <Text type="secondary">Status:</Text>
                    <Badge 
                      status={member.is_active ? "success" : "default"}
                      text={member.is_active ? "Active" : "Inactive"}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Empty State */}
      {members.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <TeamOutlined className="text-6xl text-gray-300 mb-4" />
          <Title level={4} type="secondary">
            No Members Found
          </Title>
          <Text type="secondary">
            No members have been added to this project yet.
          </Text>
        </div>
      )}

      <style jsx>{`
        .member-card:hover {
          transform: translateY(-2px);
        }
        
        .member-card .ant-card-body {
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default MembersTab;