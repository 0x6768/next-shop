// pages/shop.js
import React, { useState, useEffect, useMemo } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Input, 
  Button, 
  Typography,
  Spin,
  Layout
} from 'antd'
import { useRouter } from 'next/router'

const { Header, Content } = Layout
const { Title, Text, Paragraph } = Typography
const { Search } = Input

export default function ShopPage() {
  const router = useRouter()
  const [searchText, setSearchText] = useState('')
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 获取所有商品数据
  useEffect(() => {
    fetchAllProducts()
  }, [])

  const fetchAllProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products/list')
      if (!response.ok) throw new Error('获取商品失败')
      const data = await response.json()
      setAllProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 本地搜索筛选
  const filteredProducts = useMemo(() => {
    if (!searchText.trim()) return allProducts
    
    const searchLower = searchText.toLowerCase().trim()
    return allProducts.filter(product => 
      product.name?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }, [allProducts, searchText])

  // 跳转到详情页
  const goToDetail = (productId) => {
    router.push(`/product/${productId}`)
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
            Szyang's Shop
          </Text>
        </div>
        <Button
          type="text"
          style={{ color: '#333' }}
          onClick={() => router.push('/')}
        >
          返回首页
        </Button>
      </Header>

      <Content style={{ padding: '40px 0' }}>
        {/* 头部标题区域 */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto 40px auto',
          padding: '0 40px',
          textAlign: 'left'
        }}>
        
          
        

          {/* 搜索框 */}
          <div style={{ maxWidth: 600 }}>
            <Search
              placeholder="搜索商品名称或描述..."
              allowClear
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            />
            {searchText && (
              <Text type="secondary" style={{ 
                display: 'block', 
                marginTop: '8px',
                fontSize: '0.875rem'
              }}>
                找到 {filteredProducts.length} 个商品
              </Text>
            )}
          </div>
        </div>

        {/* 商品列表区域 */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 40px'
        }}>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '100px 0',
              background: '#fff',
              borderRadius: '12px'
            }}>
              <Spin size="large" />
              <Text style={{ 
                display: 'block', 
                marginTop: '16px',
                color: '#666',
                fontSize: '1rem'
              }}>
                加载商品中...
              </Text>
            </div>
          ) : error ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '100px 0',
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <Title level={4} style={{ 
                color: '#333',
                marginBottom: '8px'
              }}>
                加载失败
              </Title>
              <Paragraph type="secondary" style={{ marginBottom: '24px' }}>
                {error}
              </Paragraph>
              <Button 
                type="primary"
                shape="round"
                onClick={fetchAllProducts}
                style={{
                  background: '#ffc107',
                  color: '#333',
                  border: 'none',
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)'
                }}
              >
                重试加载
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '100px 0',
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <Title level={4} style={{ 
                color: '#bfbfbf',
                marginBottom: '8px'
              }}>
                {searchText ? '未找到相关商品' : '暂无商品'}
              </Title>
              <Paragraph type="secondary">
                {searchText ? '请尝试其他搜索词' : '当前没有可兑换的商品'}
              </Paragraph>
            </div>
          ) : (
            <Row gutter={[24, 24]}>
              {filteredProducts.map(product => (
                <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                  <Card
                    hoverable
                    onClick={() => goToDetail(product.id)}
                    style={{ 
                      height: '100%',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      background: '#fff',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    bodyStyle={{ 
                      padding: '20px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* 商品名称和描述区域 */}
                    <div style={{ flex: 1 }}>
                      {/* 商品名称 */}
                      <Title level={4} style={{ 
                        marginBottom: '12px',
                        fontSize: '1.25rem',
                        color: '#333',
                        lineHeight: 1.4
                      }}>
                        {product.name}
                      </Title>

                      {/* 商品描述 */}
                      {/* <Paragraph type="secondary" style={{ 
                        fontSize: '0.875rem', 
                        marginBottom: '12px',
                        color: '#666',
                        lineHeight: 1.5,
                        minHeight: '60px',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {product.description}
                      </Paragraph> */}

                      {/* 商品标签（如果有的话） */}
                      {/* {product.tags && product.tags.length > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          {product.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              style={{
                                display: 'inline-block',
                                background: '#f0f0f0',
                                color: '#666',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                marginRight: '4px',
                                marginBottom: '4px'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )} */}
                    </div>

                    {/* 积分信息 */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      <Text style={{ fontSize: '0.875rem', color: '#999' }}>
                        需要积分
                      </Text>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 600,
                          background: '#1f1f1f',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          lineHeight: 1
                        }}>
                          {product.points}
                        </div>
                        <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                          积分
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Content>
    </Layout>
  )
}