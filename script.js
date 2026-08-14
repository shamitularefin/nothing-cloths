// 1. Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. PASTE YOUR FIREBASE CONFIG FROM YOUR SCREEN RIGHT HERE
const firebaseConfig = {
  apiKey: "AIzaSyD2-Cv2r1p1EOLum-Vki6AakC9G8YTtH5A",
  authDomain: "nothing-cloths.firebaseapp.com",
  projectId: "nothing-cloths",
  storageBucket: "nothing-cloths.firebasestorage.app",
  messagingSenderId: "171348520669",
  appId: "1:171348520669:web:f14d53dbe5e38d8c68b534",
  measurementId: "G-XFDHV18673"
};

// 3. Initialize Firebase & Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Product Database ---
const products = [
    { id: 1, name: "Baggy Pants", price: 1000, category: "pants", colors: ["#000000", "#1e3a8a", "#ffffff", "#8B4513"], colorNames: ["Black", "Blue", "White", "Brown"], img: "https://images.unsplash.com/photo-1624378439575-d10819252635?w=500" },
    { id: 2, name: "Baggy T-Shirt", price: 500, category: "shirts", colors: ["#000000", "#166534", "#991b1b", "#1e3a8a"], colorNames: ["Black", "Green", "Red", "Blue"], img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500" },
    { id: 3, name: "Trouser", price: 700, category: "pants", colors: ["#000000", "#1e3a8a", "#ffffff", "#8B4513"], colorNames: ["Black", "Blue", "White", "Brown"], img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500" }
];

// Local Storage Cart Helper
function getCart() {
    return JSON.parse(localStorage.getItem('nothing_cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('nothing_cart', JSON.stringify(cart));
    updateCartUI();
}

// Global UI Elements
const cartIcon = document.getElementById('cart-icon');
const cartSidebar = document.getElementById('cart-sidebar');
const closeCart = document.getElementById('close-cart');
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckout = document.getElementById('close-checkout');

// --- HOME PAGE LOGIC ---
const productGrid = document.getElementById('product-grid');
if (productGrid) {
    function renderProducts(items) {
        productGrid.innerHTML = items.map(prod => `
            <a href="product.html?id=${prod.id}" class="product-card">
                <img src="${prod.img}" alt="${prod.name}">
                <div class="product-info">
                    <h3>${prod.name}</h3>
                    <p class="price">${prod.price} BDT</p>
                </div>
            </a>
        `).join('');
    }

    renderProducts(products);

    document.querySelectorAll('.nav-links li').forEach(li => {
        li.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            const cat = e.target.getAttribute('data-category');
            renderProducts(cat === 'all' ? products : products.filter(p => p.category === cat));
        });
    });

    document.getElementById('sort-price').addEventListener('change', (e) => {
        let sorted = [...products];
        if (e.target.value === 'low-high') sorted.sort((a, b) => a.price - b.price);
        if (e.target.value === 'high-low') sorted.sort((a, b) => b.price - a.price);
        renderProducts(sorted);
    });
}

// --- DEDICATED PRODUCT PAGE LOGIC ---
const detailTitle = document.getElementById('detail-title');
if (detailTitle) {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const prod = products.find(p => p.id === productId) || products[0];

    let selectedColor = prod.colorNames[0];
    let selectedSize = "M";

    document.getElementById('detail-img').src = prod.img;
    detailTitle.innerText = prod.name;
    document.getElementById('detail-price').innerText = `${prod.price} BDT`;
    document.getElementById('color-label').innerText = selectedColor;

    const colorOptions = document.getElementById('color-options');
    colorOptions.innerHTML = prod.colors.map((hex, i) => `
        <div class="color-circle ${i === 0 ? 'selected' : ''}" style="background-color: ${hex}" data-name="${prod.colorNames[i]}"></div>
    `).join('');

    colorOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('color-circle')) {
            document.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedColor = e.target.getAttribute('data-name');
            document.getElementById('color-label').innerText = selectedColor;
        }
    });

    const sizeOptions = document.getElementById('size-options');
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    sizeOptions.innerHTML = sizes.map(size => `
        <div class="size-btn ${size === 'M' ? 'selected' : ''}">${size}</div>
    `).join('');

    sizeOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('size-btn')) {
            document.querySelectorAll('.size-btn').forEach(s => s.classList.remove('selected'));
            e.target.classList.add('selected');
            selectedSize = e.target.innerText;
        }
    });

    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
        const cart = getCart();
        cart.push({ ...prod, color: selectedColor, size: selectedSize, cartId: Date.now() });
        saveCart(cart);
        cartSidebar.classList.add('active');
    });
}

// --- SHARED CART & FIREBASE CHECKOUT LOGIC ---
function updateCartUI() {
    const cart = getCart();
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.innerText = cart.length;
    
    const cartItemsEl = document.getElementById('cart-items');
    if (cartItemsEl) {
        cartItemsEl.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div>
                    <h4>${item.name}</h4>
                    <small>${item.color} | Size: ${item.size}</small>
                </div>
                <div>
                    <span>${item.price} BDT</span>
                    <i class="fas fa-trash" style="cursor:pointer; margin-left:10px; color:red" onclick="removeFromCart(${item.cartId})"></i>
                </div>
            </div>
        `).join('');
    }
    
    const totalPriceEl = document.getElementById('total-price');
    if (totalPriceEl) {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        totalPriceEl.innerText = total;
    }
}

window.removeFromCart = function(cartId) {
    let cart = getCart();
    cart = cart.filter(item => item.cartId !== cartId);
    saveCart(cart);
};

if (cartIcon) cartIcon.onclick = () => cartSidebar.classList.add('active');
if (closeCart) closeCart.onclick = () => cartSidebar.classList.remove('active');

if (checkoutBtn) {
    checkoutBtn.onclick = () => {
        const cart = getCart();
        if(cart.length === 0) return alert("Your cart is empty!");
        cartSidebar.classList.remove('active');
        checkoutModal.style.display = 'flex';
    };
}

if (closeCheckout) closeCheckout.onclick = () => checkoutModal.style.display = 'none';

// --- SUBMIT ORDER DIRECTLY TO FIREBASE ---
const checkoutForm = document.getElementById('checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cart = getCart();
        if (cart.length === 0) return alert("Your cart is empty!");

        const inputs = checkoutForm.querySelectorAll('input, select');
        const orderData = {
            customerName: inputs[0].value,
            address: inputs[1].value,
            phone: inputs[2].value,
            paymentMethod: inputs[3].value,
            items: cart,
            totalPrice: cart.reduce((sum, item) => sum + item.price, 0),
            status: "Pending",
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "orders"), orderData);
            alert('Order placed successfully! We will contact you soon.');
            saveCart([]);
            checkoutModal.style.display = 'none';
            checkoutForm.reset();
        } catch (error) {
            console.error("Error sending order: ", error);
            alert('Failed to place order. Please try again.');
        }
    });
}

updateCartUI();