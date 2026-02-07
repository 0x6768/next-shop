// pages/shop.js
import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Input, 
  Button, 
  Tag, 
  Typography,
  Spin,
  Empty
} from 'antd'
import { Icon } from '@iconify/react'
import { useRouter } from 'next/router'

const { Title, Text, Paragraph } = Typography
const { Search } = Input

// 分类
const categories = [
  { key: 'all', label: '全部' },
  { key: 'video', label: '视频' },
  { key: 'music', label: '音乐' },
  { key: 'game', label: '游戏' },
  { key: 'service', label: '服务' },
  { key: 'education', label: '学习' }
]

export default function ShopPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchText, setSearchText] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 获取商品数据
  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, searchText])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      if (searchText) {
        params.append('search', searchText)
      }
      
      const response = await fetch(`/api/products/list?${params.toString()}`)
      if (!response.ok) throw new Error('获取商品失败')
      const data = await response.json()
      setProducts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 跳转到详情页
  const goToDetail = (productId) => {
    router.push(`/product/${productId}`)
  }

  // 防抖搜索
  const handleSearch = (value) => {
    setSearchText(value)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#fafafa',
      padding: 24
    }}>
      {/* 头部 */}
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 0 20px 0',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          积分商城
        </Title>
        <Paragraph type="secondary">
          选择商品，输入积分码兑换
        </Paragraph>
      </div>

      {/* 搜索筛选 */}
      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto 24px auto'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          flexWrap: 'wrap',
          marginBottom: 16
        }}>
          {categories.map(category => (
            <Button
              key={category.key}
              type={selectedCategory === category.key ? 'primary' : 'default'}
              onClick={() => setSelectedCategory(category.key)}
              style={{ 
                borderRadius: 20,
                padding: '4px 16px'
              }}
            >
              {category.label}
            </Button>
          ))}
        </div>
        
        <Search
          placeholder="搜索商品..."
          allowClear
          size="large"
          onSearch={handleSearch}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<Icon icon="mdi:magnify" style={{ fontSize: 16 }} />}
          loading={loading}
        />
      </div>

      {/* 商品列表 */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }}>加载中...</Paragraph>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Icon 
              icon="mdi:alert-circle" 
              style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} 
            />
            <Title level={4} style={{ color: '#ff4d4f' }}>
              加载失败
            </Title>
            <Paragraph type="secondary">{error}</Paragraph>
            <Button 
              onClick={fetchProducts}
              style={{ marginTop: 16 }}
            >
              重试
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 0',
            background: '#fff',
            borderRadius: 8,
            marginTop: 24
          }}>
            <Icon 
              icon="mdi:package-variant" 
              style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} 
            />
            <Title level={4} style={{ color: '#bfbfbf' }}>
              没有找到商品
            </Title>
            <Paragraph type="secondary">
              换个搜索词试试
            </Paragraph>
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {products.map(product => (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <Card
                  hoverable
                  onClick={() => goToDetail(product.id)}
                  style={{ 
                    height: '100%',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                  bodyStyle={{ padding: 20, height: '100%' }}
                >
                  {/* 商品图标 */}
                  <div style={{ 
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    background: product.color + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    color: product.color,
                    fontSize: 20
                  }}>
                    <Icon icon={product.icon} width={24} height={24} />
                  </div>

                  {/* 商品名称 */}
                  <Title level={4} style={{ marginBottom: 8 }}>
                    {product.name}
                  </Title>

                  {/* 商品描述 */}
                  <Paragraph type="secondary" style={{ 
                    fontSize: 13, 
                    marginBottom: 12,
                    minHeight: 40
                  }}>
                    {product.description}
                  </Paragraph>

                  {/* 标签和价格 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 'auto'
                  }}>
                    <Tag color={product.color}>
                      {product.type === 'virtual' ? '虚拟商品' : 
                      product.type === 'service' ? '服务' : '课程'}
                    </Tag>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: 20, 
                        fontWeight: 600,
                        color: '#ff4d4f',
                        lineHeight: 1
                      }}>
                        {product.points}
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
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
    </div>
  )
}