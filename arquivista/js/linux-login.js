/**
 * Login Handler para Linux Desktop
 */

class LinuxBootLoader {
  constructor() {
    this.bootScreen = document.getElementById('login-screen');
    this.desktop = document.getElementById('desktop');
    this.passwordInput = document.getElementById('password');
    this.loginBtn = document.getElementById('login-btn');
    this.errorMsg = document.getElementById('error-msg');
    this.progressBar = document.querySelector('.progress-bar');
    
    this.correctPassword = 'ARGAMASSA';
    this.init();
  }

  init() {
    // Animar boot ao carregar
    this.animateBoot();

    // Listeners
    if (this.loginBtn) {
      this.loginBtn.addEventListener('click', () => this.handleLogin());
    }
    if (this.passwordInput) {
      this.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleLogin();
      });
      // Auto-focus no input
      setTimeout(() => this.passwordInput.focus(), 2500);
    }

    // Atualizar hora do sistema
    this.updateSystemTime();
    setInterval(() => this.updateSystemTime(), 1000);
  }

  animateBoot() {
    // Animar barra de progresso
    setTimeout(() => {
      if (this.progressBar) this.progressBar.style.animation = 'none';
    }, 3000);
  }

  handleLogin() {
    const input = this.passwordInput.value.toUpperCase().trim();

    if (input === this.correctPassword) {
      this.successLogin();
    } else {
      this.failLogin();
    }
  }

  successLogin() {
    this.bootScreen.classList.add('hidden');
    this.desktop.classList.remove('hidden');
    this.desktop.classList.add('active');

    // Inicializar desktop manager se existir
    if (window.desktopManager) {
      window.desktopManager.init();
    }
    
    // Disparar efeito de glitch do sistema legado se disponível
    if (window.effects) {
      window.effects.triggerSystemGlitch();
    }
  }

  failLogin() {
    this.errorMsg.textContent = '✗ Chave incorreta. Tente novamente.';
    this.passwordInput.value = '';
    this.passwordInput.focus();

    // Shake animation
    this.loginBtn.style.animation = 'none';
    setTimeout(() => {
      this.loginBtn.style.animation = 'loginShake 0.4s ease-out';
    }, 10);
  }

  updateSystemTime() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const systemTime = document.getElementById('system-time');
    if (systemTime) {
      systemTime.textContent = time;
    }
  }
}

// Adicionar animação de shake ao CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes loginShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
  }
`;
document.head.appendChild(style);

// Inicializar quando o DOM carregar
window.addEventListener('DOMContentLoaded', () => {
  window.bootLoader = new LinuxBootLoader();
});
