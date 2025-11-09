// SmartShop starter script.js
const API = 'https://fakestoreapi.com/products';
let products = [];
let cart = [];
let balance = Number(localStorage.getItem('balance') || 1000);
const DELIVERY = 50;
const SHIPPING = 30;
const DEFAULT_DISCOUNT = 0;

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const productsEl = document.getElementById('products');
  const cartBtn = document.getElementById('cartBtn');
  const cartPanel = document.getElementById('cartPanel');
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const deliveryEl = document.getElementById('delivery');
  const shippingEl = document.getElementById('shipping');
  const discountEl = document.getElementById('discount');
  const totalEl = document.getElementById('total');
  const couponInput = document.getElementById('couponInput');
  const applyCoupon = document.getElementById('applyCoupon');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const balanceEl = document.getElementById('balance');
  const addMoneyBtn = document.getElementById('addMoney');
  const resetBalance = document.getElementById('resetBalance');
  const modeToggle = document.getElementById('modeToggle');
  const bannerImg = document.getElementById('bannerImg');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const reviewList = document.getElementById('reviewList');
  const prevReview = document.getElementById('prevReview');
  const nextReview = document.getElementById('nextReview');

  // Initialize UI
  updateBalanceUI();
  deliveryEl.innerText = DELIVERY;
  shippingEl.innerText = SHIPPING;

  // Dark mode
  const savedMode = localStorage.getItem('darkMode') === 'true';
  if (savedMode) {
    document.documentElement.classList.add('dark');
    modeToggle.textContent = '☀️ Light Mode';
    document.body.classList.add('dark');
  }

  modeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    document.body.classList.toggle('dark');
    modeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('darkMode', isDark);
  });

  // Fetch products
  fetch(API)
    .then(r => r.json())
    .then(data => {
      products = data;
      renderProducts(products);
    })
    .catch(err => {
      products = [];
      productsEl.innerHTML = '<p class="p-4">Failed to load products. Check network.</p>';
      console.error(err);
    });

  // Fetch reviews JSON (local)
  fetch('./data/reviews.json')
    .then(r => r.json())
    .then(data => {
      renderReviews(data);
    })
    .catch(err => {
      reviewList.innerHTML = '<p class="text-sm">No reviews available.</p>';
      console.error(err);
    });

  // Banner images
  const banners = [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=60',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&q=60',
    'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1600&q=60'
  ];
  let bIndex = 0;
  function showBanner(i){ bannerImg.src = banners[i]; }
  prevBtn.onclick = () => { bIndex = (bIndex-1+banners.length)%banners.length; showBanner(bIndex); }
  nextBtn.onclick = () => { bIndex = (bIndex+1)%banners.length; showBanner(bIndex); }
  setInterval(()=>{ bIndex=(bIndex+1)%banners.length; showBanner(bIndex); }, 4000);

  // Search & Sort
  searchInput.addEventListener('input', (e)=> {
    const q = e.target.value.toLowerCase().trim();
    let filtered = products.filter(p => p.title.toLowerCase().includes(q));
    if (sortSelect.value) applySort(filtered, sortSelect.value);
    renderProducts(filtered);
  });
  sortSelect.addEventListener('change', ()=> {
    const val = sortSelect.value;
    let arr = [...products];
    if (searchInput.value) arr = arr.filter(p => p.title.toLowerCase().includes(searchInput.value.toLowerCase()));
    if (val) applySort(arr, val);
    renderProducts(arr);
  });

  function applySort(arr, val){
    if (val === 'low') arr.sort((a,b)=>a.price-b.price);
    if (val === 'high') arr.sort((a,b)=>b.price-a.price);
  }

  // Cart interactions
  cartBtn.addEventListener('click', ()=> cartPanel.classList.toggle('hidden'));

  function addToCart(product){
    const exists = cart.find(c => c.id === product.id);
    if (exists){ exists.qty++; }
    else cart.push({ ...product, qty:1 });
    updateCartUI();
  }

  function removeFromCart(id){
    cart = cart.filter(c=>c.id!==id);
    updateCartUI();
  }

  function updateCartUI(){
    cartCount.innerText = cart.reduce((s,i)=>s+i.qty,0);
    cartItems.innerHTML = '';
    let subtotal = 0;
    cart.forEach(item=>{
      subtotal += item.price * item.qty;
      const div = document.createElement('div');
      div.className = 'flex justify-between items-center';
      div.innerHTML = `<div class="text-sm">${item.title} x ${item.qty}</div>
                       <div class="flex items-center gap-2">
                         <div class="font-semibold">${(item.price*item.qty).toFixed(2)}</div>
                         <button class="text-red-500 text-sm" data-id="${item.id}">Remove</button>
                       </div>`;
      cartItems.appendChild(div);
    });
    subtotalEl.innerText = subtotal.toFixed(2);
    discountEl.innerText = DEFAULT_DISCOUNT;
    const total = subtotal + DELIVERY + SHIPPING - Number(discountEl.innerText || 0);
    totalEl.innerText = total.toFixed(2);
  }

  cartItems.addEventListener('click', (e)=> {
    if (e.target.matches('button[data-id]')){
      const id = Number(e.target.dataset.id);
      removeFromCart(id);
    }
  });

  // Coupon
  applyCoupon.addEventListener('click', ()=>{
    const code = couponInput.value.trim().toUpperCase();
    let subtotal = Number(subtotalEl.innerText || 0);
    if (code === 'SMART10'){
      const disc = subtotal * 0.10;
      discountEl.innerText = disc.toFixed(2);
    } else {
      alert('Invalid coupon');
      discountEl.innerText = '0';
    }
    const total = subtotal + DELIVERY + SHIPPING - Number(discountEl.innerText || 0);
    totalEl.innerText = total.toFixed(2);
  });

  // Checkout - check balance
  checkoutBtn.addEventListener('click', ()=>{
    const total = Number(totalEl.innerText || 0);
    if (total > balance){
      alert('Total exceeds your balance! Add more money.');
      return;
    }
    if (cart.length === 0){ alert('Cart is empty'); return; }
    balance -= total;
    localStorage.setItem('balance', balance);
    cart = [];
    updateCartUI();
    updateBalanceUI();
    alert('Purchase successful!');
  });

  // Balance controls
  addMoneyBtn.addEventListener('click', ()=>{
    balance += 1000;
    localStorage.setItem('balance', balance);
    updateBalanceUI();
  });
  resetBalance.addEventListener('click', ()=>{
    balance = 1000;
    localStorage.setItem('balance', balance);
    updateBalanceUI();
  });

  function updateBalanceUI(){ balanceEl.innerText = balance + ' BDT'; }

  // Render products
  function renderProducts(list){
    productsEl.innerHTML = '';
    list.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'bg-white dark:bg-gray-800 dark:text-white p-4 rounded shadow flex flex-col transition-colors duration-200';
      card.innerHTML = `
        <img src="${p.image}" class="h-40 object-contain mb-3" alt="${p.title}" />
        <h3 class="text-sm font-semibold mb-1">${p.title}</h3>
        <div class="text-lg font-bold mb-2">${p.price.toFixed(2)} BDT</div>
        <div class="mt-auto flex items-center justify-between">
          <div class="text-sm">⭐ ${p.rating?.rate || 'N/A'}</div>
          <button class="addBtn bg-blue-600 text-white px-3 py-1 rounded" data-id="${p.id}">Add to Cart</button>
        </div>
      `;
      productsEl.appendChild(card);
    });
    // attach add handlers
    document.querySelectorAll('.addBtn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = Number(btn.dataset.id);
        const prod = products.find(x=>x.id===id);
        // Check if exceed balance:
        const subtotal = Number(subtotalEl.innerText || 0) + prod.price;
        const newTotal = subtotal + DELIVERY + SHIPPING - Number(discountEl.innerText || 0);
        if (newTotal > balance){
          alert('Cannot add — total would exceed your balance. Add money or remove items.');
          return;
        }
        addToCart(prod);
      });
    });
  }

  // Reviews render
  let reviews = [];
  let rIndex = 0;
  function renderReviews(arr){
    reviews = arr;
    showReview(rIndex);
  }
  function showReview(i){
    if (!reviews.length) { reviewList.innerHTML = '<p>No reviews yet.</p>'; return; }
    rIndex = (i+reviews.length)%reviews.length;
    const r = reviews[rIndex];
    reviewList.innerHTML = `<div class="p-4 border rounded">
      <div class="font-semibold">${r.name} <span class="text-sm font-normal">(${r.date})</span></div>
      <div class="text-yellow-500">⭐ ${r.rating}</div>
      <p class="mt-2">${r.comment}</p>
    </div>`;
  }
  prevReview.addEventListener('click', ()=> showReview(rIndex-1));
  nextReview.addEventListener('click', ()=> showReview(rIndex+1));
  setInterval(()=> showReview(rIndex+1), 5000);

  // form handling
  const contactForm = document.getElementById('contactForm');
  contactForm.addEventListener('submit', (e)=> {
    e.preventDefault();
    alert('Thanks for contacting us! (This is a demo.)');
    contactForm.reset();
  });

  // Back to top
  document.getElementById('backToTop').addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
});
