
/**
 * LINUX DO Credit 易支付 Node.js SDK
 * 基于原SDK改造，使用fetch API
 */

/**
 * 签名算法
 * @param {Object} params 参数对象
 * @param {string} key 密钥
 * @returns {string} MD5签名
 */
function generateSign(params, key) {
  // 过滤空值和sign字段
  const filtered = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== null && v !== undefined && k !== 'sign' && k !== 'sign_type') {
      filtered[k] = v;
    }
  }
  
  // ASCII排序
  const sortedKeys = Object.keys(filtered).sort();
  const signStr = sortedKeys
    .map(k => `${k}=${filtered[k]}`)
    .join('&') + key;
  
  // MD5哈希
  return require('crypto')
    .createHash('md5')
    .update(signStr)
    .digest('hex')
    .toLowerCase();
}

class Epay {
  /**
   * 构造函数
   * @param {Object} config
   * @param {string} config.pid 商户ID
   * @param {string} config.key 商户密钥
   * @param {string} [config.baseUrl] 基础URL，默认: https://credit.linux.do/epay
   */
  constructor({ pid, key, baseUrl }) {
    this.pid = pid;
    this.key = key;
    this.baseUrl = baseUrl || 'https://credit.linux.do/epay';
  }

  /**
   * 发起支付
   * @param {Object} params
   * @param {string} params.name 商品名称
   * @param {string|number} params.money 金额
   * @param {string} params.out_trade_no 商户订单号
   * @param {string} [params.return_url] 返回地址
   * @returns {Promise<Object>}
   */
  async pay(params) {
    const payload = {
      pid: this.pid,
      type: 'epay',
      out_trade_no: params.out_trade_no,
      name: params.name.substring(0, 64),
      money: typeof params.money === 'number' ? params.money.toFixed(2) : params.money,
      notify_url: '', // LINUX DO 用后台配置的
      return_url: params.return_url || '',
      sign_type: 'MD5'
    };
    
    payload.sign = generateSign(payload, this.key);
    
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      formData.append(key, value);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/pay/submit.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        redirect: 'manual' // 不自动跳转
      
      });
      
      // 成功返回302跳转
      if (response.status === 302 || response.status === 301) {
        const location = response.headers.get('location');
        if (location) {
          return {
            success: true,
            code: 1,
            data: {
              pay_url: location,
              order_no: params.out_trade_no
            }
          };
        }
      }
      
      // 处理错误
      const errorText = await response.text();
      console.error('支付请求失败:', {
        status: response.status,
        body: errorText
      });
      
      // 尝试解析错误信息
      let errorMsg = '支付请求失败';
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error_msg || errorMsg;
      } catch (e) {
        // 如果不是JSON，使用原始文本
        if (errorText.includes('签名验证失败')) {
          errorMsg = '签名验证失败，请检查密钥';
        } else if (errorText.includes('金额必须大于0')) {
          errorMsg = '金额必须大于0';
        } else if (errorText.includes('订单已过期')) {
          errorMsg = '订单已过期';
        } else {
          errorMsg = errorText.substring(0, 100);
        }
      }
      
      throw new Error(errorMsg);
      
    } catch (error) {
      console.error('支付请求异常:', error);
      throw error;
    }
  }

  /**
   * 查询订单
   * @param {string} out_trade_no 商户订单号
   * @returns {Promise<Object>}
   */
  async order(out_trade_no) {
    const params = new URLSearchParams({
      act: 'order',
      pid: this.pid,
      key: this.key,
      out_trade_no: out_trade_no
    });
    
    try {
      const response = await fetch(`${this.baseUrl}/api.php?${params}`);
      
      if (response.status === 404) {
        return {
          code: -1,
          msg: '订单不存在或已完成',
          status: 0
        };
      }
      
      if (!response.ok) {
        throw new Error(`查询失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 适配LINUX DO的响应格式
      if (data.code === 1) {
        return {
          success: true,
          code: 1,
          data: {
            trade_no: data.trade_no,
            out_trade_no: data.out_trade_no,
            type: data.type,
            pid: data.pid,
            addtime: data.addtime,
            endtime: data.endtime,
            name: data.name,
            money: data.money,
            status: data.status, // 1=成功，0=失败/处理中
            raw: data
          }
        };
      } else {
        return {
          success: false,
          code: data.code || -1,
          msg: data.msg || '查询失败',
          raw: data
        };
      }
      
    } catch (error) {
      console.error('订单查询异常:', error);
      throw error;
    }
  }

  /**
   * 退款
   * @param {string} trade_no 平台订单号
   * @param {string|number} money 退款金额
   * @param {string} [out_trade_no] 商户订单号（可选）
   * @returns {Promise<Object>}
   */
  async refund(trade_no, money, out_trade_no) {
    const payload = {
      pid: this.pid,
      key: this.key,
      trade_no: trade_no,
      money: typeof money === 'number' ? money.toFixed(2) : money
    };
    
    if (out_trade_no) {
      payload.out_trade_no = out_trade_no;
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/api.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(payload).toString()
      });
      
      if (!response.ok) {
        throw new Error(`退款请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.code === 1) {
        return {
          success: true,
          code: 1,
          msg: data.msg || '退款成功',
          data: data
        };
      } else {
        return {
          success: false,
          code: data.code || -1,
          msg: data.msg || '退款失败',
          data: data
        };
      }
      
    } catch (error) {
      console.error('退款请求异常:', error);
      throw error;
    }
  }

  /**
   * 验证回调签名
   * @param {Object|URLSearchParams} params 回调参数
   * @returns {boolean} 签名是否有效
   */
  verifyNotify(params) {
    // 如果是URLSearchParams，转换为对象
    let paramsObj = {};
    if (params instanceof URLSearchParams) {
      params.forEach((value, key) => {
        paramsObj[key] = value;
      });
    } else {
      paramsObj = { ...params };
    }
    
    const sign = paramsObj.sign;
    const signType = paramsObj.sign_type || 'MD5';
    
    if (!sign) {
      return false;
    }
    
    delete paramsObj.sign;
    delete paramsObj.sign_type;
    
    const localSign = generateSign(paramsObj, this.key);
    return sign.toLowerCase() === localSign.toLowerCase();
  }
}

// 使用示例
async function demo() {
  const epay = new LinuxDoEpay({
    pid: 'your_pid_here',
    key: 'your_key_here'
  });

  try {
    // 1. 发起支付
    const orderNo = 'ORDER_' + Date.now();
    const payResult = await epay.pay({
      out_trade_no: orderNo,
      name: '测试商品',
      money: 10.00,
      return_url: 'https://your-site.com/pay/success'
    });
    
    if (payResult.success) {
      console.log('支付创建成功:', payResult.data.pay_url);
      // 这里可以重定向到 pay_url
    }

    // 2. 查询订单
    setTimeout(async () => {
      const orderResult = await epay.order(orderNo);
      console.log('订单查询结果:', orderResult);
    }, 5000);

  } catch (error) {
    console.error('操作失败:', error.message);
  }
}

// 导出模块
module.exports = Epay;