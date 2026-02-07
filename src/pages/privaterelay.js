import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Icon } from '@iconify/react';
import { 
  Button, 
  Card, 
  Typography, 
  Alert, 
  Space, 
  Spin, 
  message,
  Avatar,
  Tag,
  Divider,
  Row,
  Col
} from 'antd';
import { 
  MailOutlined, 
  CopyOutlined, 
  LogoutOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  UserOutlined,
  IdcardOutlined,
  SafetyOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const { code } = router.query;
  const [error, setError] = useState('');
  
  // 检查 URL 中是否有 code 参数
  useEffect(() => {
    const handleCallback = async () => {
      // 只有有 code 参数且没有用户数据时才处理
      if (code && !userData) {
        setLoading(true);
        setError('');
        
        try {
          console.log('获取授权码:', code);
          
          // 发送 POST 请求获取 token
          const response = await fetch('https://auth.7003410.xyz/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: code
            })
          });
          
          console.log('响应状态:', response.status);
          const result = await response.json();
          console.log('API 返回数据:', result);
          
          if (response.ok) {
            // 检查返回的数据结构
            if (result.user_info && result.user_info.email) {
              setUserData(result);
              
              // 保存到 localStorage
              localStorage.setItem('auth_data', JSON.stringify(result));
              
              // 清除 URL 参数
              router.replace('/privaterelay', undefined, { shallow: true });
              message.success('授权成功！');
            } else {
              setError('返回数据格式错误，缺少 user_info.email 字段');
              message.error('数据格式错误');
            }
          } else {
            setError(result.error || result.message || '获取失败');
            message.error(result.error || '授权失败');
          }
        } catch (error) {
          console.error('网络错误:', error);
          setError('网络请求失败: ' + error.message);
          message.error('网络错误');
        } finally {
          setLoading(false);
        }
      }
    };
    
    handleCallback();
  }, [code]);

  // 初始化时检查 localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('auth_data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.user_info && data.user_info.email) {
          setUserData(data);
        }
      } catch (err) {
        console.error('解析本地存储数据失败:', err);
        localStorage.removeItem('auth_data');
      }
    }
  }, []);

  // 跳转到登录页
  const handleLogin = () => {
    setLoading(true);
    setError('');
    
    // 使用当前页面作为回调地址
    const redirectUri = encodeURIComponent(window.location.origin + '/privaterelay');
    const authUrl = `https://auth.7003410.xyz/login.html?redirect_uri=${redirectUri}`;
    
    console.log('跳转到登录页:', authUrl);
    window.location.href = authUrl;
  };

  // 清除登录状态
  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem('auth_data');
    setError('');
    message.success('已退出登录');
  };

  // 复制邮箱
  const handleCopyEmail = async () => {
    if (userData?.user_info?.email) {
      try {
        await navigator.clipboard.writeText(userData.user_info.email);
        message.success('邮箱已复制到剪贴板');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  // 复制用户名
  const handleCopyUsername = async () => {
    if (userData?.user_info?.username) {
      try {
        await navigator.clipboard.writeText(userData.user_info.username);
        message.success('用户名已复制');
      } catch (err) {
        message.error('复制失败');
      }
    }
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <Card
          title={
            <Space align="center">
              <MailOutlined />
              <span>Linux.do 隐私邮箱授权</span>
              {userData && (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  已授权
                </Tag>
              )}
            </Space>
          }
          bordered={false}
          style={{ 
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" tip="正在处理授权..." />
            </div>
          ) : error ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Alert
                type="error"
                message="授权失败"
                description={
                  <div>
                    <p style={{ marginBottom: 8 }}>{error}</p>
                    {error.includes('invalid_grant') && (
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        可能原因：
                        <ul style={{ margin: '4px 0 0 20px' }}>
                          <li>授权码已过期</li>
                          <li>授权码已被使用</li>
                          <li>redirect_uri 不匹配</li>
                        </ul>
                      </div>
                    )}
                  </div>
                }
                showIcon
              />
              <Button 
                type="primary" 
                onClick={handleLogin}
                icon={<ReloadOutlined />}
                block
              >
                重新授权
              </Button>
            </Space>
          ) : userData ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 用户基本信息卡片 */}
              <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
                <Space align="start" style={{ width: '100%' }}>
                 
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <Title level={5} style={{ margin: 0 }}>
                        {userData.user_info.name}
                      </Title>
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {userData.user_info.username}
                      </Tag>
                    </div>
                    <Text type="secondary">ID: {userData.user_info.id}</Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag color={userData.user_info.active ? "success" : "default"}>
                        {userData.user_info.active ? "活跃" : "未激活"}
                      </Tag>
                      <Tag color="orange">
                        信任等级: {userData.user_info.trust_level}
                      </Tag>
                    </div>
                  </div>
                </Space>
              </Card>

              {/* 隐私邮箱卡片 */}
              <Card 
                title={
                  <Space>
                    <MailOutlined />
                    <span>隐私邮箱</span>
                  </Space>
                }
                size="small"
                extra={
                  <Button 
                    type="text" 
                    icon={<CopyOutlined />}
                    onClick={handleCopyEmail}
                    size="small"
                  >
                    复制
                  </Button>
                }
              >
                <div style={{ 
                  padding: '12px', 
                  background: '#f6f6f6', 
                  borderRadius: '6px',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}>
                  {userData.user_info.email}
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                  <SafetyOutlined /> 此邮箱为隐私保护邮箱，用于保护您的真实邮箱地址
                </div>
              </Card>

              {/* Token 信息（可折叠） */}
              <Card 
                title="授权信息" 
                size="small"
                type="inner"
              >
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text type="secondary">授权时间:</Text>
                    <br />
                    <Text>{formatTime(userData.timestamp)}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">Token 类型:</Text>
                    <br />
                    <Tag color="blue">{userData.token_type}</Tag>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">过期时间:</Text>
                    <br />
                    <Text>{userData.expires_in} 秒后</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary">会话有效期:</Text>
                    <br />
                    <Text>约 24 小时</Text>
                  </Col>
                </Row>
                
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
                  <IdcardOutlined /> 授权凭证已安全存储，24小时内有效
                </div>
              </Card>

              <Divider />

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button 
                  type="primary" 
                  icon={<CopyOutlined />}
                  onClick={handleCopyEmail}
                  block
                >
                  复制邮箱
                </Button>
                <Button 
                  type="default" 
                  icon={<CopyOutlined />}
                  onClick={handleCopyUsername}
                  block
                >
                  复制用户名
                </Button>
                <Button 
                  type="primary" 
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  block
                >
                  退出登录
                </Button>
              </div>
            </Space>
          ) : (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
             
              
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  <Icon icon="ion:shield-checkmark-outline" />
                </div>
                <Title level={4}>Linux.do OAuth 授权</Title>
                <Text type="secondary">
                  安全获取您的隐私邮箱地址，保护您的真实邮箱不被泄露
                </Text>
              </div>

              <Button 
                type="primary" 
                size="large"
                icon={<Icon icon="ion:logo-linux" />}
                onClick={handleLogin}
                loading={loading}
                block
                style={{ height: '48px', fontSize: '16px' }}
              >
                使用 Linux.do 账户授权
              </Button>

              <div style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
                <p>授权后将获取：用户名、邮箱、头像等基本信息</p>
                <p>我们不会获取您的密码，24小时后需要重新授权</p>
              </div>
            </Space>
          )}
        </Card>

        <div style={{ 
          marginTop: '16px', 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.7)',
          fontSize: '12px'
        }}>
          使用 Linux.do OAuth 2.0 服务进行授权验证
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .ant-spin-dot-item {
          background-color: #1890ff;
        }
      `}</style>
    </div>
  );
}