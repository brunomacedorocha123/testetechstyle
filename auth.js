// auth.js - Lógica de autenticação CORRIGIDA

// Verificar autenticação e redirecionar
async function checkAuthState() {
    try {
        const { data } = await supabase.auth.getSession();
        
        const currentPage = window.location.pathname.split('/').pop();
        
        if (data.session) {
            // USUÁRIO LOGADO
            if (currentPage === 'index.html' || currentPage === '' || currentPage === 'login.html' || currentPage === 'cadastro.html') {
                window.location.href = 'home.html';
            }
            
            // Atualizar interface se estiver na home
            if (currentPage === 'home.html') {
                updateUserInterface(data.session.user);
            }
            
        } else {
            // USUÁRIO NÃO LOGADO
            if (currentPage === 'home.html') {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

// Atualizar interface do usuário logado
function updateUserInterface(user) {
    const userName = user.user_metadata?.name || user.email;
    const welcomeElement = document.getElementById('welcome-message');
    const userInfoElement = document.getElementById('user-info');
    
    if (welcomeElement) {
        welcomeElement.textContent = `Bem-vindo, ${userName}!`;
    }
    
    if (userInfoElement) {
        userInfoElement.textContent = `Email: ${user.email}`;
    }
}

// Login
async function handleLogin(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            showMessage('login-message', `Erro: ${error.message}`, 'error');
            return false;
        } else {
            showMessage('login-message', 'Login realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
            return true;
        }
    } catch (error) {
        showMessage('login-message', 'Erro ao fazer login.', 'error');
        return false;
    }
}

// Cadastro - CORRIGIDO
async function handleRegister(name, email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    full_name: name
                },
                // CORREÇÃO: URL absoluta do Netlify
                emailRedirectTo: 'https://testetechstyle.netlify.app/home.html'
            }
        });
        
        if (error) {
            if (error.message.includes('already registered')) {
                showMessage('register-message', 'Este e-mail já está cadastrado. Faça login.', 'error');
            } else {
                showMessage('register-message', `Erro: ${error.message}`, 'error');
            }
            return false;
        } else {
            showMessage('register-message', 'Cadastro realizado! Verifique seu e-mail para confirmação.', 'success');
            return true;
        }
    } catch (error) {
        showMessage('register-message', 'Erro no cadastro.', 'error');
        return false;
    }
}

// Logout
async function handleLogout() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Mostrar mensagens
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Verificar confirmação de email na URL
function checkEmailConfirmation() {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const type = urlParams.get('type');
    const accessToken = urlParams.get('access_token');
    
    if (type === 'signup' && accessToken) {
        showMessage('login-message', 'Email confirmado com sucesso! Faça login.', 'success');
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Event Listeners quando DOM carregar - CORRIGIDO
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuthState();
    
    // Verificar confirmação de email
    checkEmailConfirmation();
    
    // Login Form - CORRIGIDO
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // CORREÇÃO: IDs específicos
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            await handleLogin(email, password);
        });
    }
    
    // Register Form - CORRIGIDO
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // CORREÇÃO: IDs específicos
            const name = registerForm.querySelector('input[type="text"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;
            await handleRegister(name, email, password);
        });
    }
    
    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});