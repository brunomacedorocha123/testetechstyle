// products.js - Lógica de produtos e carrinho

let allProducts = [];

// Carregar produtos do banco
async function loadProducts() {
    try {
        showLoading(true);
        
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        allProducts = products || [];
        displayProducts(allProducts);
        updateCartCount();
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showError('Erro ao carregar produtos. Tente novamente.');
    } finally {
        showLoading(false);
    }
}

// Exibir produtos
function displayProducts(products) {
    const container = document.getElementById('products-container');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image_url}" alt="${product.name}" 
                     onerror="this.style.display='none'; this.parentElement.innerHTML='📱';">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                <p class="stock">Estoque: ${product.stock}</p>
                <button class="btn-primary add-to-cart" 
                        onclick="addToCart('${product.id}')"
                        ${product.stock === 0 ? 'disabled' : ''}>
                    ${product.stock === 0 ? 'Sem Estoque' : 'Adicionar ao Carrinho'}
                </button>
            </div>
        </div>
    `).join('');
}

// Adicionar ao carrinho - CORRIGIDA PARA EVITAR DUPLICAÇÃO
async function addToCart(productId) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            alert('Por favor, faça login para adicionar produtos ao carrinho.');
            window.location.href = 'login.html';
            return;
        }
        
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            showError('Produto não encontrado.');
            return;
        }
        
        if (product.stock === 0) {
            showError('Produto sem estoque.');
            return;
        }
        
        // VERIFICAR SE JÁ ESTÁ NO CARRINHO - CORREÇÃO AQUI
        const { data: existingItem, error: checkError } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();
        
        if (checkError && checkError.code !== 'PGRST116') {
            throw checkError;
        }
        
        if (existingItem) {
            // Já está no carrinho - apenas atualizar quantidade
            const newQuantity = existingItem.quantity + 1;
            
            // Verificar se não ultrapassa o estoque
            if (newQuantity > product.stock) {
                showError('Quantidade máxima em estoque atingida.');
                return;
            }
            
            const { error: updateError } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', existingItem.id);
            
            if (updateError) throw updateError;
            showSuccess('Quantidade atualizada no carrinho!');
            
        } else {
            // Não está no carrinho - adicionar novo item
            const { error: insertError } = await supabase
                .from('cart_items')
                .insert({
                    user_id: user.id,
                    product_id: productId,
                    quantity: 1
                });
            
            if (insertError) throw insertError;
            showSuccess('Produto adicionado ao carrinho!');
        }
        
        updateCartCount();
        
    } catch (error) {
        console.error('Erro ao adicionar ao carrinho:', error);
        showError('Erro ao adicionar produto ao carrinho.');
    }
}

// Atualizar contador do carrinho
async function updateCartCount() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            document.getElementById('cart-count').textContent = '0';
            return;
        }
        
        const { data: cart, error } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('user_id', user.id);
        
        if (error) throw error;
        
        const totalItems = cart ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
        
    } catch (error) {
        console.error('Erro ao atualizar carrinho:', error);
        document.getElementById('cart-count').textContent = '0';
    }
}

// Filtrar produtos
function setupFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const category = document.getElementById('category-filter').value;
    const sort = document.getElementById('sort-filter').value;
    
    let filteredProducts = [...allProducts];
    
    // Filtrar por categoria
    if (category !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
            product.category === category
        );
    }
    
    // Ordenar
    switch (sort) {
        case 'price_asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price_desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
        default:
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    displayProducts(filteredProducts);
}

// Utilitários
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(message) {
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 3000);
    }
}

// Inicializar quando DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupFilters();
    updateCartCount();
    
    // Atualizar contador do carrinho a cada 10 segundos
    setInterval(updateCartCount, 10000);
});