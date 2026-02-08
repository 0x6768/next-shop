import React from 'react';
import { Layout, Card, Button, Space, Typography } from 'antd';
import { useRouter } from 'next/router'
const { Header, Content } = Layout;
const { Title, Text } = Typography;
const site_name = process.env.NEXT_PUBLIC_SITE_NAME;
const App = () => {
  const router = useRouter()
  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 40px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1,
      }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
          <Text strong>{site_name}</Text>
        </div>
        {/* <Space size="large">
          <a href="#" style={{ color: '#666' }}>查看文档</a>
          <a href="#" style={{ color: '#666' }}>反馈问题</a>
          <a href="#" style={{ color: '#666' }}>赞助鸣谢</a>
        </Space> */}
      </Header>

      <Content style={{ padding: '40px 0' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 40px',
          textAlign: 'left'
        }}>
          <div style={{ marginBottom: '0.5rem' }}>
          
            <span style={{
               background: 'linear-gradient(135deg, #00b37e, #ffd149)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              fontSize: '3rem',
              fontWeight: 'bold',
              lineHeight: 1.2
            }}>Szyang's Shop</span>
          </div>
          <Title level={2} style={{
            fontSize: '2.5rem',
            margin: '0.5rem 0',
            position: 'relative',
            background: 'linear-gradient(135deg, #333, #666)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            一个简单的积分商城网站
          </Title>
          
          <Text style={{
            fontSize: '1.2rem',
            color: '#666',
            margin: '1.5rem 0 2rem',
            display: 'block',
            maxWidth: '600px'
          }}>更好用的Nextjs商城网站</Text>
          
          <Button
            type="primary"
            shape="round"
            size="large"
            style={{
              background: '#ffc107',
              color: '#333',
              border: 'none',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
            }}
            // 重定向到shop
            onClick={() => router.push('/shop')}
          >
            快速开始
          </Button>
        </div>

        {/* <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          padding: '60px 40px',
          maxWidth: '1200px',
          margin: '0 auto',
          flexWrap: 'wrap'
        }}>
          <Card
            hoverable
            style={{ width: 300, borderRadius: '12px' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00b37e'
            }}>
              <Icon icon="mdi:chart-box-outline" width="48" height="48" />
            </div>
            <Title level={4}>更稳定</Title>
            <Text type="secondary">
              主备源站负载均衡、多云融合全网分发、双 DNS 解析，与其亡羊补牢，不如未雨绸缪。
            </Text>
          </Card>

          <Card
            hoverable
            style={{ width: 300, borderRadius: '12px' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00b37e'
            }}>
              <Icon icon="mdi:lock-outline" width="48" height="48" />
            </div>
            <Title level={4}>更安全</Title>
            <Text type="secondary">
              全链路加密通信，劫持、"加料"概率降到最低，所有资源原样提供。
            </Text>
          </Card>

          <Card
            hoverable
            style={{ width: 300, borderRadius: '12px' }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{
              fontSize: '2rem',
              marginBottom: '1rem',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00b37e'
            }}>
              <Icon icon="mdi:lightning-bolt-outline" width="48" height="48" />
            </div>
            <Title level={4}>更快速</Title>
            <Text type="secondary">
              分发节点覆盖 70 多个国家和地区，针对多种网络环境进行优化。
            </Text>
          </Card>
        </div> */}
      </Content>
    </Layout>
  );
};

export default App;
