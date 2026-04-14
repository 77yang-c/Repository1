const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// 生成认证令牌
function generateToken(userId) {
  return 'token_' + userId + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '访问需要认证' });
  }
  
  // 简单验证令牌（实际项目中应使用JWT）
  const userId = token.split('_')[1];
  const user = users.find(u => u.id === parseInt(userId));
  
  if (!user) {
    return res.status(403).json({ error: '无效的认证令牌' });
  }
  
  req.user = user;
  next();
}

const app = express();
const port = 3001;

// 配置中间件
app.use(require('cors')());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('.'));

// 确保public目录存在
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}
if (!fs.existsSync('./public/images')) {
  fs.mkdirSync('./public/images');
}

// 内存数据库
let users = [
  { id: 1, username: '管理员', email: 'admin@yudong.com', password: 'admin123', status: 'active', registered_at: new Date().toISOString() }
];

let reviews = [];

let products = [
  {
    id: 1,
    name: '尤尼克斯天斧100ZZ',
    category: '羽毛球拍',
    price: 1299,
    stock: 50,
    status: 'in-stock',
    description: '尤尼克斯天斧100ZZ是一款专业级别的进攻型羽毛球拍，采用了最新的碳素技术，提供出色的爆发力和精准的控球能力。',
    specs: JSON.stringify({
      '拍框材质': '高弹性碳素',
      '拍杆材质': '高弹性碳素',
      '重量': '3U(85-89g)',
      '平衡点': '头重',
      '拍杆硬度': '硬',
      '推荐拉线磅数': '24-28磅'
    }),
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: '李宁神速8.0',
    category: '羽毛球拍',
    price: 999,
    stock: 30,
    status: 'in-stock',
    description: '李宁神速8.0采用了李宁独有的科技，提供出色的速度和灵活性。拍框设计优化了空气动力学性能，使挥拍更加流畅。',
    specs: JSON.stringify({
      '拍框材质': '碳纤维',
      '拍杆材质': '碳纤维',
      '重量': '4U(80-84g)',
      '平衡点': '均衡',
      '拍杆硬度': '中等',
      '推荐拉线磅数': '22-26磅'
    }),
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: '胜利V8.0',
    category: '羽毛球拍',
    price: 899,
    stock: 25,
    status: 'in-stock',
    description: '胜利V8.0是一款全能型羽毛球拍，无论是进攻还是防守都表现出色。采用了胜利的专利技术，提供稳定的性能和舒适的手感。',
    specs: JSON.stringify({
      '拍框材质': '碳素纤维',
      '拍杆材质': '碳素纤维',
      '重量': '3U(85-89g)',
      '平衡点': '均衡',
      '拍杆硬度': '中等偏硬',
      '推荐拉线磅数': '23-27磅'
    }),
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    name: '尤尼克斯AS-9羽毛球',
    category: '羽毛球',
    price: 120,
    stock: 100,
    status: 'in-stock',
    description: '尤尼克斯AS-9羽毛球采用优质鹅毛，飞行稳定，耐打性强，适合专业比赛和日常训练使用。',
    specs: JSON.stringify({
      '材质': '鹅毛',
      '速度': '77',
      '数量': '12只装',
      '适用场景': '比赛/训练',
      '耐打性': '高',
      '飞行稳定性': '优秀'
    }),
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    name: '李宁运动T恤',
    category: '运动服装',
    price: 199,
    stock: 40,
    status: 'in-stock',
    description: '李宁运动T恤采用透气排汗面料，穿着舒适，适合羽毛球等运动使用。设计时尚，颜色鲜艳，展现运动活力。',
    specs: JSON.stringify({
      '材质': '聚酯纤维',
      '功能': '透气排汗',
      '适用季节': '四季',
      '版型': '修身',
      '颜色': '多色可选',
      '尺码': 'S-XXL'
    }),
    created_at: new Date().toISOString()
  }
];

let orders = [];
let orderItems = [];

// 生成唯一ID
function generateId(array) {
  if (array.length === 0) return 1;
  return Math.max(...array.map(item => item.id)) + 1;
}

// 模拟文件上传
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// API接口

// 商品相关接口

// 获取所有商品
app.get('/api/products', (req, res) => {
  res.json(products);
});

// 获取单个商品
app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const product = products.find(p => p.id === parseInt(id));
  if (!product) {
    res.status(404).json({ error: '商品不存在' });
    return;
  }
  res.json(product);
});

// 添加商品
app.post('/api/products', authenticateToken, upload.single('image'), (req, res) => {
  const { name, category, price, stock, status, description, specs } = req.body;
  const image = req.file ? `/images/${req.file.filename}` : null;
  const newProduct = {
    id: generateId(products),
    name,
    category,
    price: parseFloat(price),
    stock: parseInt(stock),
    status,
    image,
    description,
    specs,
    created_at: new Date().toISOString()
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// 更新商品
app.put('/api/products/:id', authenticateToken, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const productIndex = products.findIndex(p => p.id === parseInt(id));
  if (productIndex === -1) {
    res.status(404).json({ error: '商品不存在' });
    return;
  }
  const { name, category, price, stock, status, description, specs } = req.body;
  const image = req.file ? `/images/${req.file.filename}` : req.body.existingImage;
  products[productIndex] = {
    ...products[productIndex],
    name,
    category,
    price: parseFloat(price),
    stock: parseInt(stock),
    status,
    image,
    description,
    specs
  };
  res.json(products[productIndex]);
});

// 删除商品
app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const productIndex = products.findIndex(p => p.id === parseInt(id));
  if (productIndex === -1) {
    res.status(404).json({ error: '商品不存在' });
    return;
  }
  products.splice(productIndex, 1);
  res.json({ message: '商品删除成功' });
});

// 切换商品状态
app.put('/api/products/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const productIndex = products.findIndex(p => p.id === parseInt(id));
  if (productIndex === -1) {
    res.status(404).json({ error: '商品不存在' });
    return;
  }
  products[productIndex].status = products[productIndex].status === 'in-stock' ? 'out-of-stock' : 'in-stock';
  res.json({ id: products[productIndex].id, status: products[productIndex].status });
});

// 评价相关接口

// 获取商品评价
app.get('/api/products/:id/reviews', (req, res) => {
  const { id } = req.params;
  const productReviews = reviews.filter(r => r.product_id === parseInt(id));
  res.json(productReviews);
});

// 添加商品评价
app.post('/api/products/:id/reviews', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  
  const newReview = {
    id: generateId(reviews),
    product_id: parseInt(id),
    user_id: req.user.id,
    username: req.user.username,
    rating: parseInt(rating),
    comment,
    created_at: new Date().toISOString()
  };
  
  reviews.push(newReview);
  res.status(201).json(newReview);
});

// 删除商品评价
app.delete('/api/reviews/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const reviewIndex = reviews.findIndex(r => r.id === parseInt(id));
  if (reviewIndex === -1) {
    res.status(404).json({ error: '评价不存在' });
    return;
  }
  
  // 检查是否是评价的作者或管理员
  if (reviews[reviewIndex].user_id !== req.user.id && req.user.email !== 'admin@yudong.com') {
    return res.status(403).json({ error: '无权删除此评价' });
  }
  
  reviews.splice(reviewIndex, 1);
  res.json({ message: '评价删除成功' });
});

// 用户相关接口

// 获取所有用户
app.get('/api/users', (req, res) => {
  res.json(users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    status: user.status,
    registered_at: user.registered_at
  })));
});

// 添加用户
app.post('/api/users', async (req, res) => {
  try {
    const { username, email, phone, password, status } = req.body;
    
    // 检查邮箱是否已存在
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser = {
      id: generateId(users),
      username,
      email,
      phone,
      password: hashedPassword,
      status: status || 'active',
      registered_at: new Date().toISOString()
    };
    users.push(newUser);
    res.status(201).json({ id: newUser.id, username: newUser.username, email: newUser.email, phone: newUser.phone, status: newUser.status });
  } catch (error) {
    console.error('注册用户失败:', error);
    res.status(500).json({ error: '注册失败，请重试' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 查找用户
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 验证密码
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    
    // 生成认证令牌
    const token = generateToken(user.id);
    
    // 登录成功，返回用户信息和令牌
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      status: user.status,
      registered_at: user.registered_at,
      token: token
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败，请重试' });
  }
});

// 更新用户
app.put('/api/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userIndex = users.findIndex(u => u.id === parseInt(id));
  if (userIndex === -1) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  const { username, email, phone, status } = req.body;
  users[userIndex] = {
    ...users[userIndex],
    username,
    email,
    phone,
    status
  };
  res.json({ id: users[userIndex].id, username: users[userIndex].username, email: users[userIndex].email, phone: users[userIndex].phone, status: users[userIndex].status });
});

// 删除用户
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userIndex = users.findIndex(u => u.id === parseInt(id));
  if (userIndex === -1) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  users.splice(userIndex, 1);
  res.json({ message: '用户删除成功' });
});

// 订单相关接口

// 获取所有订单
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// 获取订单详情
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === parseInt(id));
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  const items = orderItems.filter(item => item.order_id === parseInt(id));
  res.json({ ...order, items });
});

// 添加订单
app.post('/api/orders', (req, res) => {
  const { user_id, user_name, total_amount, shipping_address, payment_method, items } = req.body;
  const newOrder = {
    id: generateId(orders),
    user_id,
    user_name,
    total_amount,
    status: 'pending',
    shipping_address,
    payment_method,
    created_at: new Date().toISOString()
  };
  orders.push(newOrder);
  
  // 添加订单商品
  items.forEach(item => {
    const newOrderItem = {
      id: generateId(orderItems),
      order_id: newOrder.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price
    };
    orderItems.push(newOrderItem);
  });
  
  res.status(201).json({ ...newOrder, items });
});

// 更新订单状态
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const orderIndex = orders.findIndex(o => o.id === parseInt(id));
  if (orderIndex === -1) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  orders[orderIndex].status = status;
  res.json({ id: orders[orderIndex].id, status: orders[orderIndex].status });
});

// 模拟支付接口
app.post('/api/payments', (req, res) => {
  try {
    const { order_id, payment_method, amount } = req.body;
    
    // 查找订单
    const order = orders.find(o => o.id === parseInt(order_id));
    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }
    
    // 模拟支付处理
    setTimeout(() => {
      // 支付成功
      order.status = 'paid';
      
      // 生成支付凭证
      const payment = {
        id: generateId([]), // 简单生成ID
        order_id: order.id,
        payment_method,
        amount,
        status: 'success',
        transaction_id: 'TRX' + Date.now() + Math.floor(Math.random() * 1000),
        paid_at: new Date().toISOString()
      };
      
      res.json({
        success: true,
        payment,
        message: '支付成功'
      });
    }, 1500); // 模拟支付延迟
    
  } catch (error) {
    console.error('支付失败:', error);
    res.status(500).json({ error: '支付失败，请重试' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});