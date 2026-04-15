// View setup
const routes = [
    'login',
    'signup',
    'addressSetup',
    'product',
    'order',
    'cart',
    'tracking',
    'chatbot',
    'feedback',
    'owner'
];

// ============================================
// LIVE EMAIL (EmailJS) CONFIGURATION
// Create a free account at emailjs.com to get these:
const EMAILJS_PUBLIC_KEY = "crEkq8cfLG1438t3O"; // From Account -> API Keys
const EMAILJS_SERVICE_ID = "service_7l1to7x"; // E.g., service_xgx2...
const EMAILJS_TEMPLATE_ID = "template_t7d6s5v"; // E.g., template_l1x...

// Initialize EmailJS immediately if the key is provided
if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    console.log("EmailJS Initialized Successfully!");
}
// ============================================

// Mock Databases
let usersDb = {};
let orders = [];

// App State
let currentUser = {
    id: '',
    name: '',
    email: '',
    addresses: [], // array of objects { string: '...', state: '...' }
    cart: [], // array of { size, qty, price }
    selectedQty: '500g',
    selectedAddressIdx: 0,
    latestOrder: null
};

let tempSignup = { id: '', pass: '', email: '' };
let basePrice = 850; // Default price for 500g

// -- LOCAL STORAGE DATABASE 💾 --
function saveState() {
    localStorage.setItem('honey_users', JSON.stringify(usersDb));
    localStorage.setItem('honey_orders', JSON.stringify(orders));
    localStorage.setItem('honey_userState', JSON.stringify(currentUser));
    localStorage.setItem('honey_basePrice', basePrice.toString());
}

function loadState() {
    const sUsers = localStorage.getItem('honey_users');
    if (sUsers) usersDb = JSON.parse(sUsers);
    
    const sOrders = localStorage.getItem('honey_orders');
    if (sOrders) orders = JSON.parse(sOrders);
    
    const sState = localStorage.getItem('honey_userState');
    if (sState) {
        currentUser = JSON.parse(sState);
        if(!currentUser.cart) currentUser.cart = []; // Patch for older saves
    }
    
    const sPrice = localStorage.getItem('honey_basePrice');
    if (sPrice) basePrice = parseInt(sPrice);
}
// --------------------------------

// Render logic
const app = document.getElementById('app');

const globalUI = `
    <div id="email-notification-system" class="email-mockup-panel">
       <div class="email-header"><i data-lucide="mail" size="16"></i> <span style="margin-left:5px;">Email Sent to</span> <span id="email-notif-target" style="font-weight:bold; margin-left: 5px;"></span></div>
       <div class="email-body">
           <strong style="display:block; margin-bottom: 5px;"><span id="email-notif-sub"></span></strong>
           <span id="email-notif-msg" style="color:var(--brown-soft); font-size: 0.9rem;"></span>
        </div>
    </div>
    
    <div id="top-nav" class="top-nav" style="display: none;">
        <div class="nav-brand" onclick="navigate('product')">🍯 Raw Honey</div>
        <div class="nav-links">
            <button onclick="navigate('product')" class="nav-btn"><i data-lucide="home"></i> Home</button>
            <button onclick="navigate('cart')" class="nav-btn"><i data-lucide="shopping-cart"></i> Cart</button>
            <button onclick="navigate('tracking')" class="nav-btn"><i data-lucide="package"></i> My Orders</button>
            <button onclick="navigate('chatbot')" class="nav-btn"><i data-lucide="bot"></i> AI Buddy</button>
            <button onclick="logout()" class="nav-btn"><i data-lucide="log-out"></i> Logout</button>
        </div>
    </div>
`;

const views = {
    login: `
        <div id="login-view" class="view active">
            <div class="bg-texture"></div>
            <div id="bee-container"></div>
            
            <div id="user-notification" class="site-notification"></div>

            <div class="login-card" style="z-index: 50;">
                <h2 id="login-title">Welcome Back 🍯</h2>
                <div class="input-group">
                    <label id="login-id-label">User ID</label>
                    <input type="text" id="login-id" placeholder="Enter your ID" autocomplete="off">
                </div>
                <div class="input-group">
                    <label>Password</label>
                    <input type="password" id="login-pass" placeholder="Enter your password">
                </div>
                <button class="btn-primary" id="login-action-btn" style="width: 100%; margin-top: 1rem;" onclick="handleLogin()">
                    Enter the Hive <i data-lucide="arrow-right"></i>
                </button>
                <div style="text-align: center; margin-top: 1.5rem;">
                    <a href="#" onclick="navigate('signup'); return false;" style="color: var(--amber-dark); font-size: 0.9rem; text-decoration: none; font-weight: 500;">New here? Create Account</a>
                </div>
            </div>
        </div>
    `,
    signup: `
        <div id="signup-view" class="view">
            <div class="bg-texture"></div>
            <div class="container" style="max-width: 450px; margin: 4rem auto; padding: 2.5rem; background: var(--white); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; z-index: 10;">
                <h2 style="color: var(--brown); margin-bottom: 2rem; text-align: center;">Join the Swarm 🐝</h2>
                <p style="text-align: center; color: var(--brown-soft); margin-bottom: 1.5rem;">Step 1 of 2: Secure your account</p>
                
                <div class="input-group">
                    <label>Choose a User ID</label>
                    <input type="text" id="signup-id" placeholder="e.g. honeylover99" autocomplete="off">
                </div>
                <div class="input-group">
                    <label>Email Address</label>
                    <input type="email" id="signup-email" placeholder="you@example.com">
                </div>
                <div class="input-group">
                    <label>Create Password</label>
                    <input type="password" id="signup-pass" placeholder="Enter secure password">
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 2rem;">
                    <button class="btn-secondary" onclick="navigate('login')">Cancel</button>
                    <button class="btn-primary" onclick="handleSignupStep1()">Next: Address <i data-lucide="arrow-right"></i></button>
                </div>
            </div>
        </div>
    `,
    addressSetup: `
        <div id="addressSetup-view" class="view">
            <div class="bg-texture"></div>
            <div class="container" style="max-width: 550px; margin: 4rem auto; padding: 2.5rem; background: var(--white); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; z-index: 10;">
                <h2 style="color: var(--brown); margin-bottom: 1rem;">Where to deliver? 🏡</h2>
                <p style="color:var(--brown-soft); margin-bottom: 1.5rem; font-size: 0.95rem;">Enter your Indian Pincode to auto-detect your region.</p>
                
                <div class="input-group">
                    <label>Full Name</label>
                    <input type="text" id="setup-name" placeholder="John Doe">
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div class="input-group" style="margin-bottom:0;">
                        <label>Pincode</label>
                        <input type="text" id="setup-pincode" placeholder="e.g. 560001" oninput="detectPincode(this.value)" maxlength="6">
                    </div>
                    <div class="input-group" style="margin-bottom:0; display: flex; align-items: flex-end;">
                         <p id="pin-status" style="margin-bottom: 12px; font-size: 0.85rem; color: var(--amber-dark); font-weight: 500;"></p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                    <div class="input-group">
                        <label>State</label>
                        <input type="text" id="setup-state" placeholder="Auto-filled" readonly style="background: var(--cream); cursor: not-allowed;">
                    </div>
                    <div class="input-group">
                        <label>District</label>
                        <input type="text" id="setup-district" placeholder="Auto-filled" readonly style="background: var(--cream); cursor: not-allowed;">
                    </div>
                </div>

                <div class="input-group">
                    <label>House No., Building, Area</label>
                    <textarea id="setup-address" rows="2" placeholder="123 Honeycomb Lane..."></textarea>
                </div>
                
                <div style="display: flex; justify-content: space-between; margin-top: 2rem;">
                    <button class="btn-secondary" onclick="navigate('signup')">Back</button>
                    <button class="btn-primary" onclick="completeRegistration()">Finish Setup <i data-lucide="check"></i></button>
                </div>
            </div>
        </div>
    `,
    product: `
        <div id="product-view" class="view">
            <div class="hero-section">
                <div class="honey-drip-container" id="product-honey-drip" style="position: absolute; top:0; left:0; width:100%; height:150px; overflow:hidden;"></div>
                
                <div class="hero-text">
                    <h1>100% Raw <br><span style="color: var(--amber)">Natural Honey</span> 🍯</h1>
                    <p class="tagline">Unprocessed. Unfiltered. Direct from hive.</p>
                    <p style="margin-bottom: 2rem; color: var(--brown-soft); font-size: 1.2rem;">
                        Experience the golden-dark color and earthy, rich taste. Harvested responsibly to preserve every drop of natural goodness.
                    </p>
                    
                    <h3 style="margin-bottom: 1rem;">Select Size</h3>
                    <div class="product-cards" id="qty-cards" style="margin-bottom: 2rem;">
                        <div class="product-card" data-val="250g" onclick="selectQty('250g')">
                            <p class="qty-label" id="price-250g">250g</p>
                        </div>
                        <div class="product-card selected" data-val="500g" onclick="selectQty('500g')">
                            <p class="qty-label" id="price-500g">500g</p>
                        </div>
                        <div class="product-card" data-val="1kg" onclick="selectQty('1kg')">
                            <p class="qty-label" id="price-1kg">1kg</p>
                        </div>
                    </div>

                    <button class="btn-primary" onclick="addToCart()">Add to Cart <i data-lucide="shopping-cart"></i></button>
                    <button class="btn-secondary" onclick="navigate('cart')" style="margin-left: 10px;">View Cart</button>
                </div>
                
                <div class="hero-image-container">
                   <img src="assets/hero_jar.png" class="hero-image" alt="100% Raw Natural Honey Jar">
                </div>
            </div>

            <div class="trust-section">
                <div class="trust-badge">
                    <div class="trust-icon"><i data-lucide="info" size="32"></i></div>
                    <h3>No Sugar Added</h3>
                    <p style="font-size:0.9rem; color:var(--brown-soft)">Pure sweetness directly from nature.</p>
                </div>
                <div class="trust-badge">
                    <div class="trust-icon"><i data-lucide="flame" size="32"></i></div>
                    <h3>No Heating</h3>
                    <p style="font-size:0.9rem; color:var(--brown-soft)">Cold-extracted to preserve enzymes.</p>
                </div>
                <div class="trust-badge">
                    <div class="trust-icon"><i data-lucide="check-circle" size="32"></i></div>
                    <h3>FSSAI Certified</h3>
                    <p style="font-size:0.9rem; color:var(--brown-soft)">100% compliant with safety standards.</p>
                </div>
            </div>
        </div>
    `,
    cart: `
        <div id="cart-view" class="view" style="padding-top: 5rem;">
            <h1 style="text-align: center; margin-top: 2rem;">Your Cart 🛒</h1>
            <div class="order-container">
                <div style="background: var(--white); padding: 2rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    <div id="cart-items-container"></div>
                    <div style="border-top: 2px dashed #eee; margin-top: 1rem; padding-top: 1rem; display: flex; justify-content: space-between;">
                        <h3>Total Estimate:</h3>
                        <h3 id="cart-total-price" style="color: var(--amber-dark);">₹0</h3>
                    </div>
                    <button class="btn-primary" style="width: 100%; margin-top: 2rem;" onclick="navigate('order')" id="checkout-btn">Proceed to Checkout <i data-lucide="credit-card"></i></button>
                </div>
            </div>
        </div>
    `,
    order: `
        <div id="order-view" class="view" style="padding-top: 5rem;">
            <h1 style="text-align: center; margin-top: 2rem;">Secure Checkout 🔒</h1>
            <div class="order-container">
                <div class="order-form">
                    <h3 style="margin-bottom: 1rem;">Delivery Address</h3>
                    <div id="address-selector" class="payment-methods" style="margin-bottom: 0;"></div>
                    <div id="new-address-box" style="display: none; margin-top: 10px; background: var(--white); padding: 15px; border-radius: 10px; border: 1px dashed var(--amber);">
                        <p style="font-size:0.85rem; color:var(--brown-soft); margin-bottom: 5px;">(Simulated Address Input)</p>
                        <textarea id="new-address-input" rows="2" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #ddd; font-family: var(--font-main);" placeholder="Enter new complete address details..."></textarea>
                        <button class="btn-primary" style="padding: 8px 16px; margin-top: 10px; font-size: 0.9rem;" onclick="addNewAddress()">Save New Location</button>
                    </div>

                    <h3 style="margin-bottom: 1rem; margin-top: 2rem;">Payment Method</h3>
                    <div class="payment-methods">
                        <label class="payment-option">
                            <input type="radio" name="payment" value="UPI" checked>
                            <span><i data-lucide="smartphone"></i> UPI / Online</span>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment" value="COD">
                            <span><i data-lucide="banknote"></i> Cash on Delivery</span>
                        </label>
                    </div>
                </div>

                <div class="offers-box">
                    <h3 style="color: var(--amber-dark); display: flex; align-items: center; gap: 10px;">
                        <i data-lucide="gift"></i> Offer Summary
                    </h3>
                    <ul>
                        <li><i data-lucide="check" color="green"></i> Free wooden honey dipper on orders over 500g</li>
                        <li><i data-lucide="check" color="green"></i> Secure & Pure Packaging</li>
                        <li><i data-lucide="check" color="green"></i> Fast Native Delivery via Coimbatore HQ</li>
                    </ul>
                    
                    <div style="margin-top: 3rem; display: flex; gap: 1rem;">
                        <button class="btn-secondary" style="flex: 1;" onclick="navigate('product')">Back</button>
                        <button class="btn-primary" style="flex: 2;" onclick="placeOrder()">Place Order <i data-lucide="credit-card"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `,
    tracking: `
        <div id="tracking-view" class="view" style="padding-top: 5rem;">
            <div class="container" style="max-width: 800px; margin: 2rem auto; padding: 2rem; background: var(--white); border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <h2 style="text-align: center; color: var(--brown); margin-bottom: 2rem;">My Orders 📦</h2>
                
                <div id="multi-orders-list"></div>

                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
                    <button class="btn-secondary" onclick="navigate('product')"><i data-lucide="shopping-bag"></i> Continue Shopping</button>
                    <button class="btn-secondary" onclick="navigate('chatbot')"><i data-lucide="message-circle"></i> Support</button>
                </div>
            </div>
        </div>
    `,
    chatbot: `
        <div id="chatbot-view" class="view">
            <div class="chat-container">
                <div class="chat-header">
                    <div style="width: 40px; height: 40px; background: var(--amber); border-radius: 50%; display: flex; align-items:center; justify-content:center;">🍯</div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem;">Honey AI</h3>
                        <p style="margin: 0; font-size: 0.8rem; opacity: 0.8;">Online • Ready to assist</p>
                    </div>
                    <button style="margin-left:auto; background:none; border:none; color:white; cursor:pointer;" onclick="navigate('tracking')">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="chat-messages" id="chat-box">
                    <div class="msg bot">Hello! I'm your Honey Assistant. Ask me anything about how to use your 100% Raw Natural Honey! 🐝</div>
                </div>
                
                <div class="quick-prompts">
                    <div class="q-prompt" onclick="sendQuickMsg('How to use honey for cough?')">How to use honey for cough?</div>
                    <div class="q-prompt" onclick="sendQuickMsg('How to use honey for skin?')">How to use honey for skin?</div>
                    <div class="q-prompt" onclick="sendQuickMsg('How should I store it?')">How should I store it?</div>
                </div>
                
                <div class="chat-input">
                    <input type="text" id="chat-input" placeholder="Ask a question..." onkeypress="if(event.key === 'Enter') sendUserMsg()">
                    <button class="btn-primary" style="padding: 12px; border-radius: 50%; width: 50px;" onclick="sendUserMsg()">
                        <i data-lucide="send"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    owner: `
        <div id="owner-view" class="view">
            <div class="owner-container">
                <header class="owner-header">
                    <h2>Owner Dashboard <span style="font-size: 1rem; color:var(--brown-soft); font-weight:normal;">(Coimbatore HQ)</span> 👑🐝</h2>
                    <button class="btn-secondary btn-sm" onclick="logout()">Logout</button>
                </header>

                <div id="owner-notification" class="site-notification"></div>

                <div class="dashboard-content">
                    
                    <div style="background: var(--cream); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border-left: 5px solid var(--amber);">
                        <h3>Update Product Price</h3>
                        <p style="font-size: 0.9rem; color: var(--brown-soft); margin-bottom: 1rem;">Set the base price for 500g. Other sizes scale automatically.</p>
                        <div style="display: flex; gap: 10px; align-items: flex-end;">
                            <div class="input-group" style="margin-bottom: 0; flex: 1;">
                                <label>Base Price (₹)</label>
                                <input type="number" id="base-price-input" value="850">
                            </div>
                            <button class="btn-primary" onclick="updatePrice()">Update Price</button>
                        </div>
                    </div>

                    <h3 style="margin-bottom: 1rem; color: #c62828;"><i data-lucide="alert-circle"></i> Action Required (Pending)</h3>
                    <div id="pending-orders-list"></div>

                    <h3 style="margin-bottom: 1rem; margin-top: 3rem; color: var(--brown-soft);"><i data-lucide="clock"></i> Order History</h3>
                    <div id="history-orders-list"></div>

                </div>
            </div>
        </div>
    `
};

// Mount views
app.innerHTML = globalUI + Object.values(views).join('');
lucide.createIcons();

// --- Logics --- //

function navigate(viewName) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById(viewName + '-view').classList.add('active');
    window.scrollTo(0,0);
    
    if(viewName === 'login') {
        initBees();
    }
    
    const nav = document.getElementById('top-nav');
    if(nav) {
        if(['login', 'signup', 'addressSetup', 'owner'].includes(viewName)) {
            nav.style.display = 'none';
        } else {
            nav.style.display = 'flex';
        }
    }

    if(viewName === 'product') {
        renderPrices();
        initDrippingHoney('product-honey-drip');
    }
    if(viewName === 'owner') {
        document.getElementById('base-price-input').value = basePrice;
        renderOrders();
    }
    if(viewName === 'cart') {
        renderCart();
    }
    if(viewName === 'order') {
        renderAddressSelector();
    }
    if(viewName === 'tracking') {
        renderTracking();
    }
}

function logout() {
    currentUser = { id: '', name: '', email: '', addresses: [], cart: [], selectedQty: '500g', selectedAddressIdx: 0, latestOrder: null };
    saveState();
    
    // Hide nav bar
    const nav = document.getElementById('top-nav');
    if(nav) nav.style.display = 'none';

    document.getElementById('login-id').value = '';
    document.getElementById('login-pass').value = '';
    navigate('login');
    showNotification('Logged out successfully', 'user-notification');
}

function showNotification(msg, elementId = 'user-notification', duration = 4000) {
    const el = document.getElementById(elementId);
    if(!el) return;
    el.innerHTML = msg;
    el.classList.add('show');
    setTimeout(() => { el.classList.remove('show'); }, duration);
}

function showEmailAlert(email, subject, message, orderData = null) {
    // 1. Show the beautiful simulated UI popup to the user no matter what
    const el = document.getElementById('email-notification-system');
    if(el) {
        document.getElementById('email-notif-target').innerText = email;
        document.getElementById('email-notif-sub').innerText = subject;
        document.getElementById('email-notif-msg').innerText = message;
        el.classList.add('show');
        setTimeout(() => { el.classList.remove('show'); }, 8000); 
    }

    // 2. Transmit the physical email over the internet if the keys are ready!
    if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
        
        // Let's create the PERFECT JSON dictionary that perfectly matches the STUCK template!
        const templateParams = {
            user_email: email, 
            subject: subject, 
            message: message,
            order_id: orderData ? orderData.id : "N/A",
            cost: {
                shipping: orderData ? (orderData.shipping > 0 ? orderData.shipping : 0) : 0,
                tax: orderData ? orderData.tax : 0,
                total: orderData ? orderData.price : 0
            },
            orders: orderData ? orderData.items.map(i => {
                return {
                    name: 'Raw Natural Honey (' + i.qty + ')',
                    units: 1,
                    price: i.price,
                    image_url: 'https://cdn-icons-png.flaticon.com/512/3252/3252069.png'
                }
            }) : []
        };
        
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then(() => {
                console.log('REAL EMAIL SENT SUCCESSFULLY to ' + email);
            })
            .catch((error) => {
                console.error('Email API Error:', error);
                
                // Show the specific network rejection message from EmailJS
                let exactReason = error.text || error.message || JSON.stringify(error);
                alert("EmailJS Cloud Error: " + exactReason + "\n\nDouble-check that your Service is enabled and Template ID is typed correctly!");
            });
    }
}

// Global Price Logic
function updatePrice() {
    const input = document.getElementById('base-price-input').value;
    if(input && parseInt(input) > 0) {
        const newVal = parseInt(input);
        if(newVal < basePrice) {
            // Price Drop -> Send simulated marketing blast to all!
            showEmailAlert('All Registered Customers', '🍯 Sweet News: Honey Price Dropped!', `Our 500g raw honey is now only ₹${newVal}. Order fresh harvest direct from Coimbatore today!`);
        }
        basePrice = newVal;
        saveState();
        showNotification('✅ Price successfully updated to ₹' + basePrice, 'owner-notification');
    }
}

function renderPrices() {
    const price250 = Math.round(basePrice / 2 + 25);
    const price500 = basePrice;
    const price1000 = Math.round(basePrice * 2 - 100);
    
    document.getElementById('price-250g').innerHTML = `250g<br>Quarter kg<br><span style="color:var(--amber-dark); font-size: 1.1rem; margin-top: 5px; display: block;">₹${price250}</span>`;
    document.getElementById('price-500g').innerHTML = `500g<br>Half kg<br><span style="color:var(--amber-dark); font-size: 1.1rem; margin-top: 5px; display: block;">₹${price500}</span>`;
    document.getElementById('price-1kg').innerHTML = `1kg<br>Full kg<br><span style="color:var(--amber-dark); font-size: 1.1rem; margin-top: 5px; display: block;">₹${price1000}</span>`;
}

// Multi-Step Signup Logic
function handleSignupStep1() {
    const id = document.getElementById('signup-id').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-pass').value.trim();
    
    if(!id || !pass || !email) { alert("Please provide ID, Email, and Password."); return; }
    if(usersDb[id] || id === 'chandru') { alert("User ID already exists! Please choose another."); return; }
    
    tempSignup.id = id;
    tempSignup.pass = pass;
    tempSignup.email = email;
    navigate('addressSetup');
}

async function detectPincode(pin) {
    const statusEl = document.getElementById('pin-status');
    const stateEl = document.getElementById('setup-state');
    const distEl = document.getElementById('setup-district');
    
    if(pin.length === 6 && !isNaN(pin)) {
        statusEl.innerText = "🔍 Auto-detecting region...";
        statusEl.style.color = "var(--brown-soft)";
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await res.json();
            if(data[0].Status === 'Success') {
                const po = data[0].PostOffice[0];
                stateEl.value = po.State;
                distEl.value = po.District;
                statusEl.innerText = "✅ Region Auto-detected";
                statusEl.style.color = "var(--amber-dark)";
            } else {
                statusEl.innerText = "❌ Invalid Pincode";
                statusEl.style.color = "#c62828";
                stateEl.value = ""; distEl.value = "";
            }
        } catch(e) {
            statusEl.innerText = "⚠️ Network Error";
            statusEl.style.color = "#c62828";
        }
    } else {
        statusEl.innerText = ""; stateEl.value = ""; distEl.value = "";
    }
}

function completeRegistration() {
    const name = document.getElementById('setup-name').value.trim();
    const pin = document.getElementById('setup-pincode').value.trim();
    const state = document.getElementById('setup-state').value;
    const dist = document.getElementById('setup-district').value;
    const addr = document.getElementById('setup-address').value.trim();

    if(!name || !pin || !addr || !state) {
        alert("Please completely fill out your location constraints.");
        return;
    }

    const fullAddress = `${addr}, ${dist}, ${state} - ${pin}`;

    usersDb[tempSignup.id] = {
        pass: tempSignup.pass,
        email: tempSignup.email,
        name: name,
        addresses: [{ string: fullAddress, state: state }]
    };

    currentUser.id = tempSignup.id;
    currentUser.name = name;
    currentUser.email = tempSignup.email;
    currentUser.addresses = usersDb[tempSignup.id].addresses;
    currentUser.selectedAddressIdx = 0;

    saveState();
    tempSignup = {id:'', pass:'', email:''}; // clear memory
    
    showEmailAlert(currentUser.email, 'Welcome to Premium Honey! 🍯', 'Your account has been created. Ready to taste nature?');
    navigate('product');
}

// Login Logic
function handleLogin() {
    const id = document.getElementById('login-id').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    
    if(!id) { showNotification('Please enter a User ID', 'user-notification', 3000); return; }

    if(id === 'chandru' && pass === 'krishi') {
        currentUser.id = 'chandru';
        currentUser.name = 'Owner';
        saveState();
        navigate('owner');
        if(orders.some(o => o.status === 'pending')) {
            showNotification('<h3>🔔 New Order Received!</h3>Check your pending action board.', 'owner-notification');
        }
    } else {
        // Enforce Authentication
        if(!usersDb[id] || usersDb[id].pass !== pass) {
            showNotification('Invalid credentials! Please try again or create an account.', 'user-notification');
            return;
        }
        
        currentUser.id = id;
        currentUser.name = usersDb[id].name;
        currentUser.email = usersDb[id].email;
        currentUser.addresses = usersDb[id].addresses;
        currentUser.selectedAddressIdx = 0;
        
        saveState();

        showNotification('Welcome back!', 'user-notification');
        navigate('product');
    }
}

// Addresses at Checkout
function renderAddressSelector() {
    const container = document.getElementById('address-selector');
    let html = '';
    
    currentUser.addresses.forEach((addrObj, idx) => {
        const isChecked = (idx === currentUser.selectedAddressIdx) ? 'checked' : '';
        html += `
            <label class="payment-option">
                <input type="radio" name="address" value="${idx}" ${isChecked} onchange="selectAddress(${idx})">
                <span>${addrObj.string}</span>
            </label>
        `;
    });
    
    html += `
        <label class="payment-option" style="background: var(--cream); border: 1px dashed var(--amber);">
            <input type="radio" name="address" value="-1" onchange="toggleNewAddressBox()">
            <span><i data-lucide="plus"></i> Add New Location (Simulated)</span>
        </label>
    `;
    
    container.innerHTML = html;
    lucide.createIcons();
    document.getElementById('new-address-box').style.display = 'none';
}

function selectAddress(idx) {
    currentUser.selectedAddressIdx = parseInt(idx);
    document.getElementById('new-address-box').style.display = 'none';
}

function toggleNewAddressBox() {
    document.getElementById('new-address-box').style.display = 'block';
    currentUser.selectedAddressIdx = -1;
}

function addNewAddress() {
    const val = document.getElementById('new-address-input').value.trim();
    if(val) {
        // Since it's a simulated box, we'll assume state 'Unknown' and +4 days randomly
        const newObj = { string: val, state: 'National Region' };
        usersDb[currentUser.id].addresses.push(newObj);
        currentUser.selectedAddressIdx = currentUser.addresses.length - 1;
        saveState();
        renderAddressSelector();
        document.getElementById('new-address-input').value = '';
    } else {
        alert("Location cannot be empty!");
    }
}

// Cart & Order Submission
function selectQty(val) {
    currentUser.selectedQty = val;
    document.querySelectorAll('.product-card').forEach(b => b.classList.remove('selected'));
    document.querySelector(`.product-card[data-val="${val}"]`).classList.add('selected');
}

function addToCart() {
    let p = basePrice;
    if(currentUser.selectedQty === '250g') p = Math.round(basePrice / 2 + 25);
    if(currentUser.selectedQty === '1kg') p = Math.round(basePrice * 2 - 100);
    
    currentUser.cart.push({
        id: 'ITM' + Date.now(),
        qty: currentUser.selectedQty,
        price: p
    });
    
    saveState();
    showNotification(`Added ${currentUser.selectedQty} to cart! 🛒`);
}

function renderCart() {
    const c = document.getElementById('cart-items-container');
    if(!c) return;
    
    if(!currentUser.cart || currentUser.cart.length === 0) {
        c.innerHTML = '<p style="text-align: center; color: var(--brown-soft); margin-bottom:0;">Your cart is empty.</p>';
        document.getElementById('cart-total-price').innerText = '₹0';
        document.getElementById('checkout-btn').style.display = 'none';
        return;
    }
    
    document.getElementById('checkout-btn').style.display = 'block';
    let html = '';
    let total = 0;
    
    currentUser.cart.forEach((item, idx) => {
        total += item.price;
        html += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #eee;">
            <div style="display:flex; align-items:center; gap: 15px;">
                <img src="assets/ordered_jar.png" width="40" alt="Honey">
                <strong>Raw Honey - ${item.qty}</strong>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:20px; align-items:center; width: 120px;">
                <span style="color:var(--amber-dark); font-weight:bold;">₹${item.price}</span>
                <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#d32f2f; cursor:pointer;" title="Remove Item">
                    <i data-lucide="trash-2" size="18"></i>
                </button>
            </div>
        </div>`;
    });
    
    c.innerHTML = html;
    document.getElementById('cart-total-price').innerText = '₹' + total;
    lucide.createIcons();
}

function removeFromCart(idx) {
    currentUser.cart.splice(idx, 1);
    saveState();
    renderCart();
}

function placeOrder() {
    if(!currentUser.cart || currentUser.cart.length === 0) return;
    if(currentUser.selectedAddressIdx === -1) {
        alert("Please save or select a delivery location.");
        return;
    }

    const payment = document.querySelector('input[name="payment"]:checked').value;
    const addrObj = currentUser.addresses[currentUser.selectedAddressIdx];
    const stateStr = addrObj.state.toLowerCase();
    
    // Coimbatore Logic Engine
    let dx = 5;
    if(stateStr.includes('tamil nadu')) dx = 2;
    else if(stateStr.includes('kerala') || stateStr.includes('karnataka') || stateStr.includes('andhra') || stateStr.includes('telangana')) dx = 3;

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + dx);
    const etaStr = arrivalDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    let subTotal = currentUser.cart.reduce((sum, item) => sum + item.price, 0);
    let shipping = subTotal >= 1000 ? 0 : 50; 
    let tax = Math.round(subTotal * 0.05); // 5% GST
    let totalPrice = subTotal + shipping + tax;

    const newOrder = {
        id: 'ORD' + Math.floor(Math.random()*10000) + Date.now().toString().slice(-3),
        userId: currentUser.id,
        userEmail: currentUser.email,
        name: currentUser.name,
        address: addrObj.string,
        eta: etaStr,
        items: [...currentUser.cart],
        price: totalPrice,
        subTotal: subTotal,
        tax: tax,
        shipping: shipping,
        payment: payment,
        time: new Date().toLocaleTimeString(),
        status: 'pending' // pending, accepted, shipped, delivered
    };
    
    orders.push(newOrder);
    currentUser.cart = []; // Empty cart after placement
    saveState();
    navigate('tracking');
    
    // Fallback simple message for the email confirmation as requested!
    let simpleMsg = `Thank you ${currentUser.name}! Your order has been confirmed successfully. Order Tracking ID: ${newOrder.id}`;
    
    showEmailAlert(currentUser.email, '🍯 Order Confirmed: ' + newOrder.id, simpleMsg, newOrder);
}

// Multi-Order Tracking Sequence 
function renderTracking() {
    const list = document.getElementById('multi-orders-list');
    if(!list) return;

    const myOrders = orders.filter(o => o.userId === currentUser.id).reverse();
    
    if(myOrders.length === 0) {
        list.innerHTML = "<p style='text-align:center; color: var(--brown-soft);'>You haven't placed any orders yet. Time for some honey!</p>";
        return;
    }
    
    let html = '';
    myOrders.forEach(o => {
        let itemsStr = o.items ? o.items.map(i => i.qty).join(', ') : o.quantity; // backwards compat for mock orders
        if(!itemsStr) itemsStr = "Custom Order";

        const activeIdx = ['pending', 'accepted', 'shipped', 'delivered'].indexOf(o.status);
        const steps = ['Placed', 'Preparing', 'Shipped', 'Delivered'];
        
        let timelineHtml = '<div style="display:flex; justify-content:space-between; margin-top:20px; padding-top:20px; border-top: 1px dashed #eee;">';
        steps.forEach((s, idx) => {
            let color = idx <= activeIdx ? 'var(--amber-dark)' : '#ddd';
            timelineHtml += `<div style="text-align:center; flex:1; border-top: 3px solid ${color}; padding-top: 5px;">
                <span style="font-size:0.8rem; color:${idx <= activeIdx ? 'var(--brown)' : '#999'}; font-weight:${idx <= activeIdx ? 'bold' : 'normal'}">${s}</span>
            </div>`;
        });
        timelineHtml += '</div>';

        html += `
        <div style="background:var(--cream); padding: 1.5rem; border-radius:12px; margin-bottom: 2rem; border-left: 5px solid var(--amber);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <strong style="color:var(--brown); font-size:1.1rem;">Order Number: <span style="font-family: monospace; color:var(--amber-dark);">${o.id}</span></strong>
                <span style="background:var(--white); padding:4px 10px; border-radius:4px; font-size:0.8rem; border:1px solid #ddd; font-weight:bold;">ETA: ${o.eta}</span>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size: 0.9rem; color:var(--brown-soft);">
                <div>
                    <p style="margin-bottom:5px;"><strong>Items:</strong> Honey (${itemsStr})</p>
                    <p style="margin-bottom:5px;"><strong>Total Paid:</strong> ₹${o.price}</p>
                </div>
                <div>
                    <p style="margin-bottom:5px;"><strong>Payment:</strong> ${o.payment}</p>
                    <p style="margin-bottom:5px;"><strong>Destination:</strong> ${o.address}</p>
                </div>
            </div>
            ${timelineHtml}
            ${o.status === 'delivered' ? 
                (!o.feedback ? `
                <div style="background: var(--white); padding: 15px; margin-top: 20px; border-radius: 8px; border: 1px dashed var(--amber);">
                    <h4 style="margin-bottom: 10px; color: var(--brown);">How did you like the Honey? 🍯</h4>
                    <textarea id="fb-text-${o.id}" rows="2" placeholder="Tell us about the taste, packaging, delivery..." style="width: -webkit-fill-available; border-radius: 6px; border: 1px solid #ccc; padding: 10px; font-family: inherit; margin-bottom: 10px; resize: vertical;"></textarea>
                    <button class="btn-primary" onclick="submitFeedback('${o.id}')" style="padding: 8px 15px; font-size: 0.9rem;">Submit Feedback ⭐️</button>
                </div>` : `
                <div style="background: var(--white); padding: 15px; margin-top: 20px; border-radius: 8px; border: 1px dashed #4CAF50;">
                    <h4 style="margin-bottom: 5px; color: #2E7D32;">Feedback Submitted ⭐️</h4>
                    <p style="font-size: 0.9rem; color: var(--brown-soft); font-style: italic;">"${o.feedback}"</p>
                </div>`) 
            : ''}
        </div>`;
    });
    
    list.innerHTML = html;
}

function submitFeedback(id) {
    const box = document.getElementById('fb-text-' + id);
    if(!box || !box.value.trim()) return;
    
    const targetOrder = orders.find(o => o.id === id);
    if(targetOrder) {
        targetOrder.feedback = box.value.trim();
        saveState();
        renderTracking();
        showNotification("Thank you for your feedback! 🍯");
    }
}

// Owner Features
function renderOrders() {
    const listPending = document.getElementById('pending-orders-list');
    const listHistory = document.getElementById('history-orders-list');
    
    listPending.innerHTML = '';
    listHistory.innerHTML = '';

    const pendingMods = orders.filter(o => o.status === 'pending');
    const historyMods = orders.filter(o => o.status !== 'pending');

    if(pendingMods.length === 0) {
        listPending.innerHTML = '<p style="color:var(--brown-soft); font-size:1rem;">All caught up! No pending orders.</p>';
    } else {
        pendingMods.slice().reverse().forEach(o => listPending.appendChild(createOrderHTML(o)));
    }

    if(historyMods.length === 0) {
        listHistory.innerHTML = '<p style="color:var(--brown-soft); font-size:1rem;">No history yet.</p>';
    } else {
        // Reverse history to show most recent changes first potentially
        historyMods.slice().reverse().forEach(o => listHistory.appendChild(createOrderHTML(o)));
    }
}

function createOrderHTML(o) {
    const div = document.createElement('div');
    div.className = 'order-card';
    div.innerHTML = `
        <div class="order-info">
            <h4>Order ${o.id} <span class="badge ${o.status}">${o.status}</span></h4>
            <p><strong>Customer:</strong> ${o.name} &lt;${o.userEmail}&gt;</p>
            <p><strong>Address:</strong> ${o.address}</p>
            <p><strong>Item:</strong> ${o.product || 'Raw Honey'} (${o.quantity || o.items.length + ' pcs'}) - <strong>₹${o.price}</strong></p>
            <p style="font-size: 0.85rem; color: #2E7D32; font-weight: bold; margin-top: 5px;">ETA Constraint: ${o.eta}</p>
            <p style="font-size: 0.8rem; color: var(--brown-soft);">Placed at: ${o.time} via ${o.payment}</p>
            ${o.feedback ? `<p style="margin-top: 10px; padding: 10px; background: #fff8e1; border-left: 3px solid #ffb300; font-style: italic; font-size: 0.9rem; border-radius: 4px;"><strong>Feedback:</strong> "${o.feedback}"</p>` : ''}
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px; align-items: flex-end;">
            <label style="font-size:0.8rem; font-weight:bold; color:var(--brown-soft);">Change Status:</label>
            <select class="status-dropdown" onchange="updateOrderStatus('${o.id}', this.value)">
                <option value="pending" ${o.status==='pending'?'selected':''}>⏳ Pending</option>
                <option value="accepted" ${o.status==='accepted'?'selected':''}>✅ Accpt / Prepare</option>
                <option value="shipped" ${o.status==='shipped'?'selected':''}>📦 Shipped</option>
                <option value="delivered" ${o.status==='delivered'?'selected':''}>🏡 Delivered</option>
            </select>
        </div>
    `;
    return div;
}

function updateOrderStatus(orderId, newStatus) {
    const o = orders.find(x => x.id === orderId);
    if(o && o.status !== newStatus) {
        o.status = newStatus;
        saveState();
        
        // Trigger user email based on state push
        let msg = '';
        if(newStatus === 'accepted') msg = 'Your order is accepted and being freshly packed from Coimbatore hive!';
        if(newStatus === 'shipped') msg = `Your honey is beautifully packed and shipped. It should arrive around ${o.eta}.`;
        if(newStatus === 'delivered') msg = 'Your order is recorded as Delivered. Enjoy the sweetness of raw nature!';
        
        if(msg) showEmailAlert(o.userEmail, `Update on Order ${o.id}`, msg);
        
        // Reloop 
        renderOrders();
    }
}

// Chatbot Logic
function addMessage(text, sender) {
    const box = document.getElementById('chat-box');
    const msg = document.createElement('div');
    msg.className = 'msg ' + sender;
    msg.innerText = text;
    box.appendChild(msg);
    box.scrollTop = box.scrollHeight;
}
function sendUserMsg() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(!text) return;
    addMessage(text, 'user');
    input.value = '';
    setTimeout(() => { botReply(text); }, 1000);
}
function sendQuickMsg(text) {
    addMessage(text, 'user');
    setTimeout(() => { botReply(text); }, 1000);
}
function botReply(text) {
    let reply = "I'm a simple AI currently! But yes, honey is wonderful for you! 🍯";
    if(text.toLowerCase().includes('cough')) {
        reply = "For a cough, mix 1-2 tablespoons of our raw honey with warm water and lemon. Drink it before bed to soothe your throat!";
    } else if(text.toLowerCase().includes('skin')) {
        reply = "Raw honey is amazing for the skin! Apply a thin layer directly to clean skin, leave it for 15 minutes, and wash off for a glowing, moisturized face.";
    } else if(text.toLowerCase().includes('store')) {
        reply = "Store your honey at room temperature in a dry place. Never refrigerate it, as it will crystalize faster! If it crystalizes, just gently warm the jar in a bowl of warm water.";
    }
    addMessage(reply, 'bot');
}

// Animations //

// New Organic Bee Physics
const beeContainer = document.getElementById('bee-container');
const bees = [];

function initBees() {
    if(bees.length > 0) return; // Prevent recreation if simply navigating back
    for(let i=0; i<12; i++) {
        const bee = document.createElement('div');
        bee.className = 'bee';
        bee.innerHTML = '<span>🐝</span>';
        beeContainer.appendChild(bee);
        
        // Assign absolute starting positions near center
        const bx = window.innerWidth / 2;
        const by = window.innerHeight / 2;
        bee.dataset.x = bx;
        bee.dataset.y = by;
        bee.style.transform = `translate(${bx}px, ${by}px)`;

        bees.push({ el: bee });
        
        // Start fluid dispatch instantly
        setTimeout(() => triggerBeeFlight(bee), Math.random() * 500);
    }
}

function triggerBeeFlight(bee) {
    if(bee.classList.contains('scatter')) return;
    
    // Choose a random spot on the viewport
    const pad = 50;
    const nx = pad + Math.random() * (window.innerWidth - pad * 2);
    const ny = pad + Math.random() * (window.innerHeight - pad * 2);
    
    // Calculate orbital rotation so the bee visually turns to face its flight path
    const cx = parseFloat(bee.dataset.x);
    const cy = parseFloat(bee.dataset.y);
    let angle = Math.atan2(ny - cy, nx - cx) * (180 / Math.PI);
    
    // The native 🐝 emoji tends to face leftwards, we adjust by 180 degrees if necessary.
    // Adding 135 degrees gives it a natural upward/forward glide angle.
    angle += 135; 
    
    bee.style.transform = `translate(${nx}px, ${ny}px) rotate(${angle}deg)`;
    bee.dataset.x = nx;
    bee.dataset.y = ny;
    
    // Loop
    setTimeout(() => triggerBeeFlight(bee), 2500 + Math.random() * 2000);
}

// Scatter logic on field focus
function scatterBees() {
    bees.forEach(b => {
        b.el.classList.add('scatter');
        const sx = Math.random() > 0.5 ? window.innerWidth + 200 : -200;
        const sy = Math.random() > 0.5 ? window.innerHeight + 200 : -200;
        b.el.style.transform = `translate(${sx}px, ${sy}px) scale(0)`;
    });
}
function unscatterBees() {
    // Only bring them back if inputs are empty
    setTimeout(() => {
        const idVal = document.getElementById('login-id');
        const passVal = document.getElementById('login-pass');
        if(idVal && passVal && !idVal.value && !passVal.value) {
            bees.forEach(b => { 
                b.el.classList.remove('scatter'); 
                triggerBeeFlight(b.el);
            });
        }
    }, 100);
}

document.addEventListener('focusin', (e) => {
    if(e.target.id === 'login-id' || e.target.id === 'login-pass') scatterBees();
});
document.addEventListener('focusout', (e) => {
    if(e.target.id === 'login-id' || e.target.id === 'login-pass') unscatterBees();
});


// Honey Dripping logic
let dripsInjectedMap = {};
function initDrippingHoney(containerId) {
    if(dripsInjectedMap[containerId]) return;
    const container = document.getElementById(containerId);
    if(!container) return;
    
    dripsInjectedMap[containerId] = true;
    const vw = window.innerWidth;
    const numDrips = Math.floor(vw / 60); // less dense for aesthetic
    
    for(let i=0; i<numDrips; i++) {
        const drip = document.createElement('div');
        drip.className = 'drip';
        const left = (i * (vw/numDrips)) + (Math.random()*20);
        const width = 10 + Math.random()*15; 
        const height = 40 + Math.random()*100; 
        const dur = a = 2 + Math.random()*4; 
        const delay = Math.random()*-5; 
        
        drip.style.left = left + 'px';
        drip.style.width = width + 'px';
        drip.style.setProperty('--h', height + 'px');
        drip.style.setProperty('--dur', dur + 's');
        drip.style.animationDelay = delay + 's';
        container.appendChild(drip);
    }
}

// Ensure startup runs appropriately if starting natively
loadState();

// Smart Routing based on memory
if (currentUser.id) {
    if (currentUser.id === 'chandru') {
        navigate('owner');
    } else {
        navigate('product');
    }
} else {
    navigate('login');
}

