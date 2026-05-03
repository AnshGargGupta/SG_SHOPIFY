// --- 1. Global Variables & Config ---
const WATSAPP_NUMBER = "917889196330"; // Keep your number here
const ADMIN_PASSWORD = "SRGARG@6500"; 

// --- CLOUD DATABASE CONFIGURATION ---
const BIN_ID = "69f737ca36566621a81d40be"; 
const API_KEY = "$2a$10$23LycPQC7W0ekNdvAmGf1ebq6KwHeUNeJXKH8g1gbjYiEJoDUIYyO";

let products = [];

// --- 2. Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    // Show a temporary loading message
    document.getElementById('product-grid').innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Loading products...</p>';
    loadProducts();
});

// --- 3. View Management (SPA Logic) ---
function switchView(view) {
    const storeView = document.getElementById('store-view');
    const adminView = document.getElementById('admin-view');
    const heroSection = document.getElementById('hero-section');
    const collectionTitle = document.getElementById('collection-title');

    if (view === 'admin') {
        const enteredPassword = prompt("Please enter the Admin Password:");
        if (enteredPassword !== ADMIN_PASSWORD) {
            alert("Incorrect password. Access denied.");
            return; 
        }
    }

    document.getElementById('searchInput').value = '';
    renderProducts(products);

    if (view === 'home') {
        storeView.classList.remove('hidden');
        adminView.classList.add('hidden');
        heroSection.style.display = 'flex';
        collectionTitle.innerText = "Featured Products";
        window.scrollTo(0, 0);
    } else if (view === 'collection') {
        storeView.classList.remove('hidden');
        adminView.classList.add('hidden');
        heroSection.style.display = 'none';
        collectionTitle.innerText = "All Collection";
        window.scrollTo(0, 0);
    } else if (view === 'admin') {
        storeView.classList.add('hidden');
        adminView.classList.remove('hidden');
        renderAdminProducts(); 
        window.scrollTo(0, 0);
    }
}

// --- 4. CLOUD Data Management ---
async function loadProducts() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        const data = await response.json();
        
        // If the database has data, use it. Otherwise, keep it empty.
        products = data.record || []; 
        renderProducts(products);
    } catch (error) {
        console.error("Error loading products:", error);
        document.getElementById('product-grid').innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Error loading products. Please try again later.</p>';
    }
}

async function saveProducts() {
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify(products)
        });
    } catch (error) {
        console.error("Error saving products:", error);
        alert("There was an error saving to the database.");
    }
}

// --- 5. Rendering Products (Storefront) ---
function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (productsToRender.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No products found.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.onclick = () => openModal(product.id);

        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${product.mainImg}" alt="${product.name}">
            </div>
            <div class="card-info">
                <h4 class="card-title">${product.name}</h4>
                <p class="card-price">₹${product.price}</p>
                <button class="view-btn">View Details</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- 6. Search Functionality ---
function filterProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    if(document.getElementById('hero-section').style.display !== 'none' && query.length > 0) {
        switchView('collection');
        document.getElementById('searchInput').focus(); 
        document.getElementById('searchInput').value = query; 
    }

    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    renderProducts(filtered);
}

// --- 7. Modal Logic ---
const modal = document.getElementById('product-modal');

function openModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('modal-main-img').src = product.mainImg;
    document.getElementById('modal-title').innerText = product.name;
    document.getElementById('modal-price').innerText = `₹${product.price}`;
    document.getElementById('modal-desc').innerText = product.desc;

    const thumbnailsContainer = document.getElementById('modal-thumbnails');
    thumbnailsContainer.innerHTML = '';
    
    const allImages = [product.mainImg, ...product.subImgs].filter(url => url.trim() !== "");

    allImages.forEach((url, index) => {
        const img = document.createElement('img');
        img.src = url;
        if (index === 0) img.classList.add('active');
        img.onclick = () => {
            document.getElementById('modal-main-img').src = url;
            document.querySelectorAll('.thumbnail-container img').forEach(el => el.classList.remove('active'));
            img.classList.add('active');
        };
        thumbnailsContainer.appendChild(img);
    });

    const waBtn = document.getElementById('whatsapp-btn');
    const message = `Hello, I want to order ${product.name} priced at ₹${product.price}`;
    const waUrl = `https://wa.me/${WATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    waBtn.onclick = () => window.open(waUrl, '_blank');

    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// --- 8. Admin Panel Functionality ---
function renderAdminProducts() {
    const adminList = document.getElementById('admin-product-list');
    adminList.innerHTML = '';

    if (products.length === 0) {
        adminList.innerHTML = '<p>No products available.</p>';
        return;
    }

    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div class="admin-item-info">
                <img src="${product.mainImg}" alt="${product.name}">
                <div>
                    <strong>${product.name}</strong><br>
                    <span>₹${product.price}</span>
                </div>
            </div>
            <button class="delete-btn" onclick="deleteProduct('${product.id}')">Remove</button>
        `;
        adminList.appendChild(item);
    });
}

// Delete a product (Now syncs to the cloud)
async function deleteProduct(id) {
    if (confirm("Are you sure you want to remove this product?")) {
        products = products.filter(p => p.id !== id);
        
        // Temporarily change button text so you know it's saving
        document.body.style.cursor = 'wait';
        await saveProducts(); 
        document.body.style.cursor = 'default';
        
        renderAdminProducts();    
        renderProducts(products); 
    }
}

// Add a new product (Now syncs to the cloud)
document.getElementById('add-product-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.innerText = "Adding...";
    submitBtn.disabled = true;

    const newProduct = {
        id: Date.now().toString(),
        name: document.getElementById('p-name').value,
        price: document.getElementById('p-price').value,
        desc: document.getElementById('p-desc').value,
        mainImg: document.getElementById('p-main-img').value,
        subImgs: [
            document.getElementById('p-sub-1').value,
            document.getElementById('p-sub-2').value,
            document.getElementById('p-sub-3').value,
            document.getElementById('p-sub-4').value,
        ].filter(url => url.trim() !== "") 
    };

    products.unshift(newProduct); 
    
    // Save to cloud
    await saveProducts();
    
    this.reset();
    submitBtn.innerText = "Add Product";
    submitBtn.disabled = false;
    
    alert("Product added successfully!");
    renderAdminProducts();
    renderProducts(products);
});