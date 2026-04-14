// 全局变量
let cart = [];
let currentProduct = null;
let currentStep = 1;

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', function() {
    // 加载商品数据
    loadProducts();
    loadRecommendedProducts();
    
    // 初始化事件监听器
    initEventListeners();
    
    // 初始化雷达图
    initRadarChart();
    
    // 检查本地存储中的用户信息
    checkUserLogin();
});

// 初始化事件监听器
function initEventListeners() {
    // 暗黑模式切换
    document.querySelector('.dark-toggle').addEventListener('click', toggleDarkMode);
    
    // 登录/注册模态框
    document.getElementById('loginBtn').addEventListener('click', () => {
        document.getElementById('loginModal').classList.add('active');
    });
    
    document.getElementById('loginClose').addEventListener('click', () => {
        document.getElementById('loginModal').classList.remove('active');
    });
    
    // 登录/注册选项卡切换
    document.querySelectorAll('.login-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // 切换选项卡
            document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 切换表单
            document.querySelectorAll('.login-form').forEach(form => form.classList.remove('active'));
            document.getElementById(tabId + 'Form').classList.add('active');
        });
    });
    
    // 登录表单提交
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
    
    // 注册表单提交
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });
    
    // 购物车
    document.querySelector('.cart-icon').addEventListener('click', toggleCart);
    
    // 价格滑块
    document.getElementById('price').addEventListener('input', function() {
        document.getElementById('priceValue').textContent = '¥' + this.value;
    });
    
    // 排序按钮
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const sortType = this.textContent;
            sortProducts(sortType);
        });
    });
    
    // 筛选按钮
    document.querySelector('.sidebar .btn-primary').addEventListener('click', applyFilters);
    
    // 结算步骤
    document.getElementById('checkoutModal')?.querySelector('.checkout-btn')?.addEventListener('click', openCheckoutModal);
}

// 加载商品数据
async function loadProducts() {
    try {
        // 检查缓存
        const cachedProducts = localStorage.getItem('cachedProducts');
        if (cachedProducts) {
            const products = JSON.parse(cachedProducts);
            renderProducts(products);
            return;
        }
        
        const response = await fetch('http://localhost:3001/api/products');
        const products = await response.json();
        
        // 缓存数据，有效期10分钟
        localStorage.setItem('cachedProducts', JSON.stringify(products));
        localStorage.setItem('cachedProductsTime', Date.now().toString());
        
        renderProducts(products);
    } catch (error) {
        console.error('加载商品失败:', error);
    }
}

// 加载推荐商品
async function loadRecommendedProducts() {
    try {
        // 检查缓存
        const cachedProducts = localStorage.getItem('cachedProducts');
        let products;
        
        if (cachedProducts) {
            products = JSON.parse(cachedProducts);
        } else {
            const response = await fetch('http://localhost:3001/api/products');
            products = await response.json();
            // 缓存数据，有效期10分钟
            localStorage.setItem('cachedProducts', JSON.stringify(products));
            localStorage.setItem('cachedProductsTime', Date.now().toString());
        }
        
        // 随机选择3个商品作为推荐
        const recommended = products.sort(() => 0.5 - Math.random()).slice(0, 3);
        renderRecommendedProducts(recommended);
    } catch (error) {
        console.error('加载推荐商品失败:', error);
    }
}

// 渲染商品列表
function renderProducts(products) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        productGrid.appendChild(productCard);
    });
}

// 渲染推荐商品
function renderRecommendedProducts(products) {
    const recommendedGrid = document.getElementById('recommendedGrid');
    recommendedGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        recommendedGrid.appendChild(productCard);
    });
}

// 创建商品卡片
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const imageUrl = product.image || 'https://images.unsplash.com/photo-1584040762208-f8dbf58c71d0?auto=format&fit=crop&q=80&w=200';
    
    card.innerHTML = `
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='200' viewBox='0 0 280 200'%3E%3Crect width='280' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' dy='.3em' fill='%23999'%3E加载中...%3C/text%3E%3C/svg%3E" data-src="${imageUrl}" alt="${product.name}" class="product-image lazy" onclick="openProductModal(${product.id})"><div>
        <div class="product-info">
            <h3 class="product-name" onclick="openProductModal(${product.id})"><a href="#">${product.name}<a><h3>
            <div class="product-price">¥${product.price}<div>
            <div class="product-rating">
                <i class="fas fa-star"><i>
                <i class="fas fa-star"><i>
                <i class="fas fa-star"><i>
                <i class="fas fa-star"><i>
                <i class="fas fa-star-half-alt"><i>
            <div>
            <div class="product-actions">
                <button class="btn btn-outline" onclick="openProductModal(${product.id})"><i class="fas fa-eye"><i> 查看详情<button>
                <button class="btn btn-primary" onclick="addToCart(${product.id}, 1)"><i class="fas fa-shopping-cart"><i> 加入购物车<button>
            <div>
        <div>
    `;
    
    return card;
}

// 打开商品详情模态框
async function openProductModal(productId) {
    try {
        const response = await fetch(`http://localhost:3001/api/products/${productId}`);
        const product = await response.json();
        currentProduct = product;
        
        // 填充模态框数据
        document.getElementById('modalProductName').textContent = product.name;
        document.getElementById('modalProductTitle').textContent = product.name;
        document.getElementById('modalProductPrice').textContent = product.price;
        document.getElementById('modalProductDescription').textContent = product.description;
        document.getElementById('modalProductImage').src = product.image || 'https://images.unsplash.com/photo-1584040762208-f8dbf58c71d0?auto=format&fit=crop&q=80&w=400';
        
        // 填充商品参数
        const specsContainer = document.getElementById('modalProductSpecs');
        specsContainer.innerHTML = '';
        const specs = JSON.parse(product.specs);
        for (const [key, value] of Object.entries(specs)) {
            const specItem = document.createElement('div');
            specItem.innerHTML = `<strong>${key}：</strong>${value}`;
            specsContainer.appendChild(specItem);
        }
        
        // 显示模态框
        document.getElementById('productModal').style.display = 'flex';
        
        // 加载相关推荐
        loadRelatedProducts(product.category);
        
        // 加载商品评价
        loadProductReviews(productId);
    } catch (error) {
        console.error('加载商品详情失败:', error);
    }
}

// 加载商品评价
async function loadProductReviews(productId) {
    try {
        const response = await fetch(`http://localhost:3001/api/products/${productId}/reviews`);
        const reviews = await response.json();
        
        const reviewsContainer = document.getElementById('productReviews');
        reviewsContainer.innerHTML = '';
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<div style="text-align: center; padding: 40px 0; color: #999;">暂无评价</div>';
            document.getElementById('modalProductReviews').textContent = '0';
            document.getElementById('modalProductRating').innerHTML = '';
            return;
        }
        
        // 计算平均评分
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        const roundedRating = Math.round(averageRating);
        
        // 显示评分
        let ratingHtml = '';
        for (let i = 1; i <= 5; i++) {
            ratingHtml += i <= roundedRating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        }
        document.getElementById('modalProductRating').innerHTML = ratingHtml;
        document.getElementById('modalProductReviews').textContent = reviews.length;
        
        // 显示评价列表
        reviews.forEach(review => {
            const reviewItem = document.createElement('div');
            reviewItem.style.padding = '15px';
            reviewItem.style.borderBottom = '1px solid #eee';
            
            // 生成评分星星
            let reviewRatingHtml = '';
            for (let i = 1; i <= 5; i++) {
                reviewRatingHtml += i <= review.rating ? '<i class="fas fa-star" style="color: #f39c12;"></i>' : '<i class="far fa-star" style="color: #f39c12;"></i>';
            }
            
            reviewItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-weight: 500;">${review.username}</span>
                    <div style="color: #f39c12;">${reviewRatingHtml}</div>
                </div>
                <p style="margin-bottom: 10px; color: #666;">${review.comment}</p>
                <div style="font-size: 0.8rem; color: #999;">${new Date(review.created_at).toLocaleString()}</div>
            `;
            
            reviewsContainer.appendChild(reviewItem);
        });
    } catch (error) {
        console.error('加载评价失败:', error);
    }
}

// 提交评价
async function submitReview() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('请先登录');
        return;
    }
    
    const rating = document.querySelector('input[name="rating"]:checked');
    const comment = document.getElementById('reviewComment').value;
    
    if (!rating) {
        alert('请选择评分');
        return;
    }
    
    if (!comment) {
        alert('请输入评价内容');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3001/api/products/${currentProduct.id}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                rating: rating.value,
                comment: comment
            })
        });
        
        if (response.ok) {
            alert('评价提交成功');
            // 重置表单
            document.querySelectorAll('input[name="rating"]').forEach(radio => radio.checked = false);
            document.getElementById('reviewComment').value = '';
            // 重新加载评价
            loadProductReviews(currentProduct.id);
        } else {
            const error = await response.json();
            alert(error.error || '评价提交失败');
        }
    } catch (error) {
        console.error('提交评价失败:', error);
        alert('评价提交失败，请重试');
    }
}

// 关闭商品详情模态框
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

// 加载相关推荐
async function loadRelatedProducts(category) {
    try {
        const response = await fetch('http://localhost:3001/api/products');
        const products = await response.json();
        const related = products.filter(p => p.category === category && p.id !== currentProduct.id).slice(0, 3);
        
        const relatedContainer = document.getElementById('relatedProducts');
        relatedContainer.innerHTML = '';
        
        related.forEach(product => {
            const relatedItem = document.createElement('div');
            relatedItem.style.cursor = 'pointer';
            relatedItem.style.textAlign = 'center';
            relatedItem.onclick = () => openProductModal(product.id);
            
            const imageUrl = product.image || 'https://images.unsplash.com/photo-1584040762208-f8dbf58c71d0?auto=format&fit=crop&q=80&w=150';
            
            relatedItem.innerHTML = `
                <img src="${imageUrl}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                <h4 style="font-size: 0.9rem; margin-bottom: 5px;">${product.name}</h4>
                <div style="color: var(--accent-color); font-weight: bold;">¥${product.price}</div>
            `;
            
            relatedContainer.appendChild(relatedItem);
        });
    } catch (error) {
        console.error('加载相关推荐失败:', error);
    }
}

// 更新模态框中的数量
function updateModalQuantity(delta) {
    const quantityElement = document.getElementById('modalQuantity');
    let quantity = parseInt(quantityElement.textContent);
    quantity = Math.max(1, quantity + delta);
    quantityElement.textContent = quantity;
}

// 从模态框加入购物车
function addToCartFromModal() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('modalQuantity').textContent);
    addToCart(currentProduct.id, quantity);
    closeProductModal();
}

// 立即购买
function buyNowFromModal() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('modalQuantity').textContent);
    cart = [{ ...currentProduct, quantity }];
    openCheckoutModal();
    closeProductModal();
}

// 加入购物车
async function addToCart(productId, quantity) {
    try {
        const response = await fetch(`http://localhost:3001/api/products/${productId}`);
        const product = await response.json();
        
        // 检查购物车中是否已有该商品
        const existingItemIndex = cart.findIndex(item => item.id === productId);
        
        if (existingItemIndex !== -1) {
            // 增加数量
            cart[existingItemIndex].quantity += quantity;
        } else {
            // 添加新商品
            cart.push({ ...product, quantity });
        }
        
        // 更新购物车显示
        updateCartDisplay();
        
        // 显示成功提示
        alert('商品已加入购物车');
    } catch (error) {
        console.error('加入购物车失败:', error);
    }
}

// 切换购物车显示
function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    cartModal.classList.toggle('active');
    
    if (cartModal.classList.contains('active')) {
        updateCartDisplay();
    }
}

// 更新购物车显示
function updateCartDisplay() {
    const cartBody = document.getElementById('cartBody');
    const cartTotal = document.getElementById('cartTotal');
    const cartCheckout = document.getElementById('cartCheckout');
    const cartCount = document.getElementById('cartCount');
    
    // 更新购物车数量
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div style="text-align: center; padding: 40px 0; color: #999;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>购物车为空</p>
            </div>
        `;
        cartTotal.style.display = 'none';
        cartCheckout.style.display = 'none';
    } else {
        cartBody.innerHTML = '';
        let totalAmount = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            
            const imageUrl = item.image || 'https://images.unsplash.com/photo-1584040762208-f8dbf58c71d0?auto=format&fit=crop&q=80&w=80';
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${imageUrl}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">¥${item.price}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                        <button style="margin-left: 20px;
                         background: transparent;
                          border: none; color: #999; 
                          cursor: pointer;
                          "onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            cartBody.appendChild(cartItem);
        });
        
        document.getElementById('totalAmount').textContent = '¥' + totalAmount.toFixed(2);
        cartTotal.style.display = 'flex';
        cartCheckout.style.display = 'block';
    }
}

// 更新购物车商品数量
function updateCartQuantity(productId, delta) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
        cart[itemIndex].quantity += delta;
        
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        
        updateCartDisplay();
    }
}

// 从购物车移除商品
function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);
    if (itemIndex !== -1) {
        cart.splice(itemIndex, 1);
        updateCartDisplay();
    }
}

// 打开结算模态框
function openCheckoutModal() {
    if (cart.length === 0) return;
    
    document.getElementById('checkoutModal').style.display = 'flex';
    currentStep = 1;
    updateCheckoutSteps();
}

// 关闭结算模态框
function closeCheckoutModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

// 更新结算步骤
function updateCheckoutSteps() {
    const steps = document.querySelectorAll('.checkout-steps .step');
    const stepContents = document.querySelectorAll('.step-content');
    
    steps.forEach((step, index) => {
        if (index + 1 <= currentStep) {
            step.classList.add('active');
            stepContents[index].style.display = 'block';
        } else {
            step.classList.remove('active');
            stepContents[index].style.display = 'none';
        }
    });
}

// 下一步
function nextStep() {
    if (currentStep < 3) {
        currentStep++;
        updateCheckoutSteps();
        
        // 如果是第三步，填充订单信息
        if (currentStep === 3) {
            fillOrderInfo();
        }
    }
}

// 上一步
function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateCheckoutSteps();
    }
}

// 填充订单信息
function fillOrderInfo() {
    // 填充收货信息
    document.getElementById('confirmName').textContent = document.getElementById('收货人').value || '未填写';
    document.getElementById('confirmPhone').textContent = document.getElementById('手机号码').value || '未填写';
    document.getElementById('confirmAddress').textContent = document.getElementById('详细地址').value || '未填写';
    
    // 填充商品信息
    const orderItemsContainer = document.getElementById('order-items');
    orderItemsContainer.innerHTML = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.style.display = 'flex';
        itemElement.style.justifyContent = 'space-between';
        itemElement.style.marginBottom = '10px';
        itemElement.innerHTML = `
            <span>${item.name} x ${item.quantity}</span>
            <span>¥${itemTotal.toFixed(2)}</span>
        `;
        
        orderItemsContainer.appendChild(itemElement);
    });
    
    // 填充支付信息
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const paymentMap = {
        'alipay': '支付宝',
        'wechat': '微信支付',
        'card': '银行卡'
    };
    document.getElementById('confirmPayment').textContent = paymentMap[paymentMethod];
    
    // 填充金额信息
    document.getElementById('subtotal').textContent = '¥' + subtotal.toFixed(2);
    document.getElementById('orderTotal').textContent = '¥' + subtotal.toFixed(2);
}

// 排序商品
function sortProducts(sortType) {
    const productGrid = document.getElementById('productGrid');
    const products = Array.from(productGrid.children);
    
    products.sort((a, b) => {
        const priceA = parseFloat(a.querySelector('.product-price').textContent.replace('¥', ''));
        const priceB = parseFloat(b.querySelector('.product-price').textContent.replace('¥', ''));
        
        switch (sortType) {
            case '价格↑':
                return priceA - priceB;
            case '价格↓':
                return priceB - priceA;
            case '销量':
                // 模拟销量排序
                return Math.random() - 0.5;
            default:
                return 0;
        }
    });
    
    // 重新渲染
    products.forEach(product => productGrid.appendChild(product));
}

// 应用筛选
function applyFilters() {
    const brand = document.getElementById('brand').value;
    const price = parseInt(document.getElementById('price').value);
    const balance = document.getElementById('balance').value;
    const hardness = document.getElementById('hardness').value;
    
    // 这里可以实现筛选逻辑
    alert(`筛选条件：品牌=${brand}，价格<=¥${price}，平衡点=${balance}，硬度=${hardness}`);
}

// 切换暗黑模式
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    document.querySelector('.navbar').classList.toggle('dark-mode');
    
    // 保存用户偏好
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// 初始化雷达图
function initRadarChart() {
    const chartDom = document.getElementById('radarChart');
    const myChart = echarts.init(chartDom);
    
    const option = {
        radar: {
            indicator: [
                { name: '进攻', max: 100 },
                { name: '防守', max: 100 },
                { name: '控制', max: 100 },
                { name: '速度', max: 100 },
                { name: '稳定', max: 100 },
                { name: '手感', max: 100 }
            ]
        },
        series: [{
            type: 'radar',
            data: [{
                value: [85, 70, 80, 75, 85, 90],
                name: '尤尼克斯天斧100ZZ',
                areaStyle: {}
            }]
        }]
    };
    
    myChart.setOption(option);
    
    // 响应式
    window.addEventListener('resize', () => {
        myChart.resize();
    });
}

// 登录
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('请输入邮箱和密码');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (response.ok) {
            const user = await response.json();
            // 保存用户信息和令牌到本地存储
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', user.token);
            
            // 更新UI
            updateUserUI();
            
            // 关闭模态框
            document.getElementById('loginModal').classList.remove('active');
            
            // 显示成功提示
            alert('登录成功！');
        } else {
            const error = await response.json();
            alert(error.error || '登录失败');
        }
    } catch (error) {
        console.error('登录失败:', error);
        alert('登录失败，请重试');
    }
}

// 注册
async function register() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (!email || !password || !confirmPassword) {
        alert('请填写所有字段');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                username: email.split('@')[0],
                email,
                password,
                status: 'active'
            })
        });
        
        if (response.ok) {
            const user = await response.json();
            // 保存用户信息到本地存储
            localStorage.setItem('user', JSON.stringify(user));
            
            // 更新UI
            updateUserUI();
            
            // 关闭模态框
            document.getElementById('loginModal').classList.remove('active');
            
            // 显示成功提示
            alert('注册成功！');
        } else {
            const error = await response.json();
            alert(error.error || '注册失败');
        }
    } catch (error) {
        console.error('注册失败:', error);
        alert('注册失败，请重试');
    }
}

// 检查用户登录状态
function checkUserLogin() {
    const user = localStorage.getItem('user');
    if (user) {
        updateUserUI();
    }
    
    // 检查暗黑模式偏好
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.querySelector('.navbar').classList.add('dark-mode');
    }
}

// 更新用户UI
function updateUserUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('authButtons').style.display = 'none';
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAvatar').textContent = user.name.charAt(0);
        
        // 绑定退出登录事件
        document.getElementById('logoutBtn').addEventListener('click', logout);
    }
}

// 退出登录
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'none';
    alert('已退出登录');
}

// 提交订单
async function submitOrder() {
    try {
        // 获取订单信息
        const orderData = {
            user_id: 1, // 模拟用户ID
            user_name: document.getElementById('收货人').value || '匿名用户',
            total_amount: parseFloat(document.getElementById('orderTotal').textContent.replace('¥', '')),
            shipping_address: {
                name: document.getElementById('收货人').value,
                phone: document.getElementById('手机号码').value,
                address: document.getElementById('详细地址').value
            },
            payment_method: document.querySelector('input[name="payment"]:checked').value,
            items: cart.map(item => ({
                product_id: item.id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price
            }))
        };

        // 发送订单到后端
        const response = await fetch('http://localhost:3001/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const order = await response.json();
            
            // 显示支付中提示
            const checkoutModal = document.getElementById('checkoutModal');
            checkoutModal.style.display = 'flex';
            const modalBody = checkoutModal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 50px 0;">
                    <div style="font-size: 3rem; margin-bottom: 20px;"><i class="fas fa-spinner fa-spin"></i></div>
                    <h3 style="margin-bottom: 15px;">支付处理中...</h3>
                    <p>请稍候，正在处理您的支付请求</p>
                </div>
            `;
            
            // 模拟支付
            await processPayment(order.id, orderData.payment_method, order.total_amount);
            
            // 清空购物车
            cart = [];
            updateCartDisplay();
            // 显示订单成功模态框
            checkoutModal.style.display = 'none';
            document.getElementById('orderSuccessModal').style.display = 'flex';
            // 保存订单ID到本地存储，以便查看详情
            localStorage.setItem('lastOrderId', order.id);
        } else {
            throw new Error('订单提交失败');
        }
    } catch (error) {
        console.error('提交订单失败:', error);
        alert('订单提交失败，请重试');
    }
}

// 处理支付
async function processPayment(orderId, paymentMethod, amount) {
    try {
        const response = await fetch('http://localhost:3001/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: orderId,
                payment_method: paymentMethod,
                amount: amount
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                return result;
            } else {
                throw new Error('支付失败');
            }
        } else {
            throw new Error('支付请求失败');
        }
    } catch (error) {
        console.error('支付失败:', error);
        throw error;
    }
}

// 关闭订单成功模态框
function closeOrderSuccessModal() {
    document.getElementById('orderSuccessModal').style.display = 'none';
    // 跳转到首页
    window.location.href = 'index.html';
}

// 查看订单详情
function viewOrderDetails() {
    document.getElementById('orderSuccessModal').style.display = 'none';
    // 这里可以跳转到订单详情页面
    alert('查看订单详情功能开发中');
}

// 初始化页面
function initPage() {
    // 加载商品数据
    loadProducts();
    
    // 初始化事件监听器
    initEventListeners();
    
    // 检查用户登录状态
    checkUserLogin();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

// 图片懒加载
function initLazyLoad() {
    const lazyImages = document.querySelectorAll('.lazy');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const image = entry.target;
                image.src = image.dataset.src;
                image.classList.remove('lazy');
                observer.unobserve(image);
            }
        });
    });
    
    lazyImages.forEach(image => {
        imageObserver.observe(image);
    });
}

// 初始化评分星星交互
function initRatingStars() {
    const ratingInputs = document.querySelectorAll('.rating-input input');
    const ratingLabels = document.querySelectorAll('.rating-input label');
    
    ratingLabels.forEach((label, index) => {
        label.addEventListener('mouseenter', function() {
            // 高亮当前及之前的星星
            for (let i = 0; i <= index; i++) {
                ratingLabels[i].style.color = '#f39c12';
            }
        });
        
        label.addEventListener('mouseleave', function() {
            // 重置星星颜色
            ratingLabels.forEach((l, i) => {
                const radio = ratingInputs[i];
                l.style.color = radio.checked ? '#f39c12' : '#ddd';
            });
        });
        
        label.addEventListener('click', function() {
            // 保持选中状态
            ratingLabels.forEach((l, i) => {
                l.style.color = i <= index ? '#f39c12' : '#ddd';
            });
        });
    });
}

// 回到顶部功能
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    // 滚动检测
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'flex';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    // 点击事件
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 在页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    initLazyLoad();
    initRatingStars();
    initBackToTop();
});