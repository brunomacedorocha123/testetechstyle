// checkout.js - Lógica do checkout e finalização de pedidos

let cartItems = [];
let orderTotal = 0;

// Carregar itens do carrinho para o checkout
async function loadCheckout() {
    try {
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
            .eq('user_id', user.id);

        if (error) throw error;

        cartItems = cart || [];
        displayOrderSummary();
        updateCartCount();
        
    } catch (error) {
        console.error('Erro ao carregar checkout:', error);
        alert('Erro ao carregar itens do carrinho.');
    }
}

// Exibir resumo do pedido
function displayOrderSummary() {
    const orderItemsContainer = document.getElementById('order-items');
    let subtotal = 0;

    if (cartItems.length === 0) {
        orderItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
        updateTotals(0);
        return;
    }

    orderItemsContainer.innerHTML = cartItems.map(item => {
        const product = item.products;
        const itemTotal = product.price * item.quantity;
        subtotal += itemTotal;

        return `
            <div class="order-item">
                <div class="order-item-info">
                    <h4>${product.name}</h4>
                    <p class="order-item-quantity">Quantidade: ${item.quantity}</p>
                </div>
                <div class="order-item-price">
                    <p class="price">R$ ${itemTotal.toFixed(2).replace('.', ',')}</p>
                </div>
            </div>
        `;
    }).join('');

    updateTotals(subtotal);
}

// Atualizar totais
function updateTotals(subtotal) {
    orderTotal = subtotal;
    
    document.getElementById('subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('total').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

// Finalizar pedido
async function finalizeOrder() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            alert('Por favor, faça login para finalizar a compra.');
            return;
        }

        if (cartItems.length === 0) {
            alert('Seu carrinho está vazio.');
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;

        // 1. Criar o pedido
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                total: orderTotal,
                status: 'pending'
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Adicionar itens ao pedido
        const orderItems = cartItems.map(item => ({
            order_id: order.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.products.price
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // 3. Criar registro de pagamento
        const { error: paymentError } = await supabase
            .from('payments')
            .insert({
                order_id: order.id,
                status: 'pending',
                payment_method: paymentMethod
            });

        if (paymentError) throw paymentError;

        // 4. Limpar carrinho
        const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        // 5. Redirecionar para confirmação
        alert(`🎉 Pedido #${order.id.substring(0, 8)} criado com sucesso!`);
        window.location.href = `pedido-detalhes.html?id=${order.id}`;

    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        alert('Erro ao finalizar pedido. Tente novamente.');
    }
}

// Atualizar contador do carrinho (reutilizar função existente)
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
        document.getElementById('cart-count').textContent = totalItems;
        
    } catch (error) {
        console.error('Erro ao atualizar carrinho:', error);
        document.getElementById('cart-count').textContent = '0';
    }
}

// Inicializar checkout quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    loadCheckout();
    
    // Botão finalizar pedido
    const finalizeBtn = document.getElementById('finalize-order');
    if (finalizeBtn) {
        finalizeBtn.addEventListener('click', finalizeOrder);
    }
});