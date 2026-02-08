// pages/product/[id].js
import React, { useState, useEffect } from 'react'
import { 
  Layout,
  Button, 
  Typography, 
  Form, 
  Input, 
  InputNumber,
  message,
  Spin,
  Modal,
  Alert,
  Space,
  Card,
  Divider
} from 'antd'
import { useRouter } from 'next/router'
const site_name = process.env.NEXT_PUBLIC_SITE_NAME;
const { Header, Content } = Layout
const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

export default function ProductDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState(null)
  const [productLoading, setProductLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [formValues, setFormValues] = useState(null)

  // 获取商品详情
  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    setProductLoading(true)
    try {
      const response = await fetch(`/api/products/details?id=${id}`)
      if (!response.ok) throw new Error('商品不存在')
      const data = await response.json()
      setProduct(data)
      
      if (data.stock === 0) {
        form.setFieldsValue({ quantity: 0 })
      }
    } catch (err) {
      message.error(err.message)
    } finally {
      setProductLoading(false)
    }
  }

  const showConfirm = (values) => {
    if (product.stock === 0) {
      message.error('商品已售罄，无法兑换')
      return
    }
    
    if (product.stock < 3 && product.stock > 0) {
      Modal.warning({
        title: '库存紧张',
        content: `该商品库存仅剩 ${product.stock} 件，请尽快兑换！`,
        okText: '知道了，继续兑换',
        onOk: () => {
          setFormValues(values)
          setShowConfirmModal(true)
        }
      })
    } else {
      setFormValues(values)
      setShowConfirmModal(true)
    }
  }

  const handleConfirmExchange = async () => {
    setConfirmLoading(true)
    try {
      const response = await fetch('/api/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          email: formValues.email,
          quantity: formValues.quantity || 1
        })
      })
      
      const result = await response.json()
      
      if (response.status === 400 && result.error?.includes('库存')) {
        message.error(result.error)
        fetchProduct()
        setConfirmLoading(false)
        setShowConfirmModal(false)
        return
      }
      
      if (!response.ok) {
        throw new Error(result.error || '兑换失败')
      }
      
      if (response.ok) {
        message.info('请稍后...')
        form.resetFields()
        setShowConfirmModal(false)
        
        setTimeout(() => {
          router.push(`${result.pay_url}`)
        }, 1500)
      }
    } catch (error) {
      console.error('兑换错误:', error)
      message.error(error.message || '兑换失败，请重试')
      setConfirmLoading(false)
    }
  }

  const handleCancelExchange = () => {
    setFormValues(null)
    setShowConfirmModal(false)
  }

  if (productLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: '#fff'
      }}>
        <Spin size="large" />
        <Text style={{ 
          marginLeft: 12,
          color: '#666',
          fontSize: '1rem'
        }}>
          加载中...
        </Text>
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
      }}>
        <Title level={3} style={{ marginBottom: 20, color: '#333' }}>
          商品不存在
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 24 }}>
          抱歉，您访问的商品可能已被下架或不存在
        </Paragraph>
        <Button 
          type="primary"
          shape="round"
          size="large"
          onClick={() => router.push('/shop')}
          style={{
            background: '#ffc107',
            color: '#333',
            border: 'none',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
          }}
        >
          返回商城
        </Button>
      </div>
    )
  }

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: '#fff',
    }}>
      {/* 导航栏 */}
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
          <Text strong onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>
            {site_name}
          </Text>
        </div>
        <Space>
          <Button
            type="text"
            style={{ color: '#333' }}
            onClick={() => router.push('/shop')}
          >
            返回商城
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '40px 0' }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 40px'
        }}>
          {/* 返回按钮 */}
          <Button 
            type="link" 
            onClick={() => router.back()}
            style={{ 
              padding: 0,
              marginBottom: 24,
              fontSize: '1rem',
              color: '#666'
            }}
          >
            ← 返回上一页
          </Button>

          {/* 商品基本信息卡片 */}
          <Card
            style={{ 
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: 24
            }}
            bodyStyle={{ padding: 32 }}
          >
            {/* 商品标题区域 */}
            <div style={{ marginBottom: 32 }}>
              <Title level={1} style={{
                fontSize: '2.5rem',
                marginBottom: '1rem',
                color: '#333',
                fontWeight: 600
              }}>
                {product.name}
              </Title>
              
              <Paragraph style={{
                fontSize: '1.2rem',
                color: '#666',
                marginBottom: '1.5rem',
                lineHeight: 1.6
              }}>
                {product.description}
              </Paragraph>

              {/* 商品类型标签 */}
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 16px',
                background: '#f5f5f5',
                borderRadius: 20,
                marginBottom: 16
              }}>
               
              </div>
            </div>

            {/* 价格和库存信息 */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '24px',
              background: '#fafafa',
              borderRadius: 12,
              marginBottom: 24
            }}>
              <div>
                <Text style={{ 
                  display: 'block',
                  fontSize: '1rem',
                  color: '#666',
                  marginBottom: 8
                }}>
                  兑换积分
                </Text>
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: 700,
                  color: '#ff6b35',
                  lineHeight: 1
                }}>
                  {product.points}
                  <Text style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 500,
                    color: '#999',
                    marginLeft: 4
                  }}>
                    积分
                  </Text>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <Text style={{ 
                  display: 'block',
                  fontSize: '1rem',
                  color: '#666',
                  marginBottom: 8
                }}>
                  当前库存
                </Text>
                <div style={{ 
                  fontSize: '2rem', 
                  fontWeight: 600,
                  color: product.stock === 0 ? '#ff4d4f' : 
                         product.stock < 3 ? '#fa8c16' : '#52c41a',
                  lineHeight: 1
                }}>
                  {product.stock}
                  <Text style={{ 
                    fontSize: '1.2rem',
                    fontWeight: 500,
                    color: product.stock === 0 ? '#ff4d4f' : 
                           product.stock < 3 ? '#fa8c16' : '#52c41a',
                    marginLeft: 4
                  }}>
                    件
                  </Text>
                </div>
              </div>
            </div>

            {/* 库存警告 */}
            {product.stock === 0 && (
              <Alert
                message="已售罄"
                description="该商品暂时缺货，请关注后续补货通知。"
                type="error"
                showIcon
                closable
                style={{ 
                  borderRadius: 8,
                  border: 'none',
                  background: '#fff2f0',
                  marginBottom: 24
                }}
              />
            )}
            {product.stock < 3 && product.stock > 0 && (
              <Alert
                message="库存紧张"
                description={`该商品库存仅剩 ${product.stock} 件，欲购从速！`}
                type="warning"
                showIcon
                closable
                style={{ 
                  borderRadius: 8,
                  border: 'none',
                  background: '#fffbe6',
                  marginBottom: 24
                }}
              />
            )}
          </Card>

          {/* 兑换表单卡片 */}
          <Card
            style={{ 
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              marginBottom: 32
            }}
            bodyStyle={{ padding: 32 }}
          >
            <Title level={4} style={{ 
              marginBottom: 24,
              color: '#333',
              fontSize: '1.5rem',
              fontWeight: 600
            }}>
              兑换商品
            </Title>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={showConfirm}
              initialValues={{ quantity: 1 }}
            >
              <Form.Item
                name="email"
                label="接收邮箱"
                rules={[
                  { required: true, message: '请输入接收邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
                extra="兑换成功后，商品卡密将发送到此邮箱"
              >
                <Input 
                  placeholder="请输入您的邮箱地址" 
                  size="large"
                  type="email"
                  maxLength={50}
                  disabled={product.stock === 0}
                  style={{ 
                    borderRadius: 8,
                    height: 48,
                    fontSize: '1rem'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="quantity"
                label="兑换数量"
                initialValue={1}
                rules={[
                  { required: true, message: '请选择数量' },
                  { 
                    type: 'number', 
                    min: 1, 
                    max: product.stock,
                    message: `数量必须在1-${product.stock}之间` 
                  }
                ]}
                extra={`最多可兑换 ${product.stock} 件`}
              >
                <InputNumber
                  min={1}
                  max={product.stock}
                  style={{ width: '100%' }}
                  size="large"
                  disabled={product.stock === 0}
                />
              </Form.Item>

              {/* 总计信息 */}
              <div style={{ 
                padding: 20,
                background: '#fafafa',
                borderRadius: 8,
                marginBottom: 24,
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.1rem'
                }}>
                  <Text style={{ color: '#666' }}>总计需要积分：</Text>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 700,
                      color: '#ff6b35',
                      lineHeight: 1
                    }}>
                      {product.points}
                      <Text style={{ 
                        fontSize: '1.2rem',
                        fontWeight: 500,
                        color: '#999',
                        marginLeft: 4
                      }}>
                        积分
                      </Text>
                    </div>
                    <Text style={{ fontSize: '0.875rem', color: '#999' }}>
                      （单价 {product.points} 积分 × 1 件）
                    </Text>
                  </div>
                </div>
              </div>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  disabled={product.stock === 0}
                  block
                  style={{
                    height: 56,
                    background: '#ffc107',
                    color: '#333',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)',
                    marginBottom: 12
                  }}
                >
                  {product.stock === 0 ? '已售罄' : '确认兑换'}
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {/* 商品详情 */}
          
        </div>
      </Content>

      {/* 确认兑换弹窗 */}
      <Modal
        title="确认兑换"
        open={showConfirmModal}
        onOk={handleConfirmExchange}
        onCancel={handleCancelExchange}
        confirmLoading={confirmLoading}
        okText="确认兑换"
        cancelText="取消"
        width={480}
        okButtonProps={{
          style: {
            background: '#ffc107',
            borderColor: '#ffc107',
            color: '#333',
            fontWeight: 600,
            height: 40
          }
        }}
        cancelButtonProps={{
          disabled: confirmLoading,
          style: { height: 40 }
        }}
      >
        <div style={{ lineHeight: 1.8, fontSize: '1rem' }}>
          {/* 库存警告 */}
          {product.stock < 3 && product.stock > 0 && (
            <Alert
              message={product.stock === 1 ? '⚠️ 最后1件！' : '库存紧张'}
              description={`该商品库存仅剩 ${product.stock} 件`}
              type="warning"
              showIcon
              style={{ 
                marginBottom: 20,
                borderRadius: 8
              }}
            />
          )}
          
          <div style={{ 
            padding: 20,
            background: '#fafafa',
            borderRadius: 8,
            marginBottom: 20
          }}>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '12px 8px',
              alignItems: 'center'
            }}>
              <Text style={{ color: '#666' }}>商品名称：</Text>
              <Text strong>{product.name}</Text>
              
              <Text style={{ color: '#666' }}>商品单价：</Text>
              <Text strong>{product.points} 积分</Text>
              
              <Text style={{ color: '#666' }}>兑换数量：</Text>
              <Text strong>{formValues?.quantity || 1} 件</Text>
              
              <Text style={{ color: '#666' }}>接收邮箱：</Text>
              <Text strong>{formValues?.email}</Text>
            </div>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <div style={{ 
              padding: 16,
              background: '#fff',
              borderRadius: 6,
              border: '1px solid #f0f0f0'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '1.1rem'
              }}>
                <Text style={{ color: '#666' }}>总计需要：</Text>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: 700,
                    color: '#ff6b35',
                    lineHeight: 1
                  }}>
                    {product.points * (formValues?.quantity || 1)}
                    <Text style={{ 
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      color: '#999',
                      marginLeft: 4
                    }}>
                      积分
                    </Text>
                  </div>
                  {product.stock > 0 && (
                    <Text style={{ 
                      fontSize: '0.875rem', 
                      color: '#52c41a',
                      marginTop: 4
                    }}>
                      兑换后库存：{product.stock - (formValues?.quantity || 1)} 件
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            padding: 12, 
            background: '#fff7e6', 
            borderRadius: 8,
            border: '1px solid #ffd591'
          }}>
            <Text style={{ color: '#666', fontSize: '0.875rem' }}>
              兑换成功后，积分将立即扣除，商品卡密将发送至上述邮箱，请确保信息无误。
            </Text>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}