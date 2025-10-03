// auth.js - Lógica de autenticação CORRIGIDA E MELHORADA

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
            if (currentPage === 'home.html' || currentPage === 'dados.html') {
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
    }
}

// Atualizar interface do usuário logado - CORRIGIDA
function updateUserInterface(user) {
    const userName = user.user_metadata?.name || user.email || 'Usuário';
    const welcomeElement = document.getElementById('welcome-message');
    const userInfoElement = document.getElementById('user-info');
    
    if (welcomeElement) {
        welcomeElement.textContent = `Bem-vindo, ${userName}!`;
    }
    
    if (userInfoElement) {
        userInfoElement.textContent = `Email: ${user.email}`;
    }
    
    // NOVO: Atualizar saudação no header da home
    const userNameElement = document.getElementById('user-name');
    const userWelcomeElement = document.getElementById('user-welcome');
    
    if (userNameElement && userWelcomeElement) {
        userNameElement.textContent = userName;
        userWelcomeElement.style.display = 'block';
    }
}

// Login - CORRIGIDO
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

// Logout - CORRIGIDO
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Erro ao fazer logout:', error);
            return;
        }
        // Redirecionar para index após logout
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Atualizar dados do usuário - NOVA FUNÇÃO
async function updateUserProfile(userData) {
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: {
                name: userData.full_name,
                full_name: userData.full_name
            }
        });
        
        if (error) {
            console.error('Erro ao atualizar perfil:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return false;
    }
}

// Mostrar mensagens - CORRIGIDA
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
        element.style.display = 'block';
        
        // Scroll para a mensagem se for erro
        if (type === 'error') {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }
}

// Verificar confirmação de email na URL - CORRIGIDA
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

// Obter usuário atual - NOVA FUNÇÃO
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Erro ao obter usuário:', error);
        return null;
    }
}

// Verificar se usuário está autenticado - NOVA FUNÇÃO
async function isAuthenticated() {
    const user = await getCurrentUser();
    return user !== null;
}

// Event Listeners quando DOM carregar - CORRIGIDO E MELHORADO
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
            
            const emailInput = loginForm.querySelector('input[type="email"]');
            const passwordInput = loginForm.querySelector('input[type="password"]');
            
            if (!emailInput || !passwordInput) {
                showMessage('login-message', 'Campos de email e senha não encontrados.', 'error');
                return;
            }
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            if (!email || !password) {
                showMessage('login-message', 'Por favor, preencha todos os campos.', 'error');
                return;
            }
            
            await handleLogin(email, password);
        });
    }
    
    // Register Form - CORRIGIDO
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nameInput = registerForm.querySelector('input[type="text"]');
            const emailInput = registerForm.querySelector('input[type="email"]');
            const passwordInput = registerForm.querySelector('input[type="password"]');
            
            if (!nameInput || !emailInput || !passwordInput) {
                showMessage('register-message', 'Campos do formulário não encontrados.', 'error');
                return;
            }
            
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            if (!name || !email || !password) {
                showMessage('register-message', 'Por favor, preencha todos os campos.', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('register-message', 'A senha deve ter pelo menos 6 caracteres.', 'error');
                return;
            }
            
            await handleRegister(name, email, password);
        });
    }
    
    // Logout Button - CORRIGIDO
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Confirmação antes de sair
            if (confirm('Tem certeza que deseja sair?')) {
                handleLogout();
            }
        });
    }
    
    // Atualizar saudação se usuário estiver logado em qualquer página
    setTimeout(async () => {
        const user = await getCurrentUser();
        if (user) {
            updateUserInterface(user);
        }
    }, 100);
});

// Listener para mudanças de autenticação - NOVO
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        console.log('Usuário logado:', session.user.email);
        updateUserInterface(session.user);
    } else if (event === 'SIGNED_OUT') {
        console.log('Usuário deslogado');
    }
});