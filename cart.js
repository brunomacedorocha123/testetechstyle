// cart.js - Lógica do carrinho de compras

let cartItems = [];

// Carregar carrinho
async function loadCart() {
    try {
        showLoading(true);
        
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        // Buscar itens do carrinho com informações dos produtos
        const { data: cart, error } = await supabase
            .from('cart_items')
            .select(`
                *,
                products (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        cartItems = cart || [];
        displayCart();
        updateCartCount();
        
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        alert('Erro ao carregar carrinho.');
    } finally {
        showLoading(false);
    }
}

// Exibir carrinho
function displayCart() {
    const emptyCart = document.getElementById('empty-cart');
    const cartWithItems = document.getElementById('cart-with-items');
    const cartItemsList = document.getElementById('cart-items-list');

    if (cartItems.length === 0) {
        emptyCart.style.display = 'block';
        cartWithItems.style.display = 'none';
        return;
    }

    emptyCart.style.display = 'none';
    cartWithItems.style.display = 'block';

    // Calcular totais
    let subtotal = 0;
    
    cartItemsList.innerHTML = cartItems.map(item => {
        const product = item.products;
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        return `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${product.image_url}" alt="${product.name}" 
                         onerror="this.style.display='none'; this.parentElement.innerHTML='📱';">
                </div>
                <div class="cart-item-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <p class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-total">
                    <p class="price">R$ ${itemTotal.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-secondary remove-btn" onclick="removeFromCart('${item.id}')">Remover</button>
                </div>
            </div>
        `;
    }).join('');

    // Atualizar resumo
    updateSummary(subtotal);
}

// Atualizar quantidade
async function updateQuantity(cartItemId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(cartItemId);
        return;
    }

    try {
        const { error } = await supabase
            .from('cart_items')
            .update({ quantity: newQuantity })
            .eq('id', cartItemId);

        if (error) throw error;

        // Recarregar carrinho
        loadCart();
        
    } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
        alert('Erro ao atualizar quantidade.');
    }
}

// Remover item do carrinho
async function removeFromCart(cartItemId) {
    if (!confirm('Tem certeza que deseja remover este item do carrinho?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);

        if (error) throw error;

        // Recarregar carrinho
        loadCart();
        
    } catch (error) {
        console.error('Erro ao remover item:', error);
        alert('Erro ao remover item do carrinho.');
    }
}

// Atualizar resumo
function updateSummary(subtotal) {
    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('total').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

// Finalizar compra
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            alert('🎉 Compra finalizada com sucesso! Em breve você receberá um email de confirmação.');
            // Aqui você pode adicionar lógica para limpar o carrinho após a compra
        });
    }
}

// Utilitários
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// Atualizar contador do carrinho (reutilizar do products.js)
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
        const cartCountElements = document.querySelectorAll('#cart-count');
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
        });
        
    } catch (error) {
        console.error('Erro ao atualizar carrinho:', error);
        document.getElementById('cart-count').textContent = '0';
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    setupCheckout();
    updateCartCount();
});