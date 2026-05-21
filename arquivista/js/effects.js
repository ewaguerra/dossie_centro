class DesktopEffects {
  constructor() {
    this.corruptionLevel = 0; 
    this.glitchActive = false;
    this.init();
  }

  init() {
    // Aplicar scanlines no desktop
    const desktop = document.getElementById('desktop');
    if (desktop) desktop.classList.add('scanlines');
    
    // Iniciar relógio
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
  }

  updateClock() {
    const clock = document.getElementById('system-time');
    if (clock) {
      const now = new Date();
      // Estilo GNOME: Sat 3 Oct, 14:17
      const options = { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      };
      let dateStr = now.toLocaleString('en-US', options);
      // Ajuste fino do formato
      clock.textContent = dateStr.replace(/,/g, '');
    }
  }

  applyGlitchEffect(element) {
    if (!element) return;
    element.classList.add('glitching');
    
    const duration = 200 + Math.random() * 400;
    setTimeout(() => {
      element.classList.remove('glitching');
    }, duration);
  }

  randomGlitch() {
    if (this.glitchActive) return;
    
    this.glitchActive = true;
    const windows = document.querySelectorAll('.window');
    const randomWindow = windows[Math.floor(Math.random() * windows.length)];
    
    if (randomWindow) {
      this.applyGlitchEffect(randomWindow);
    } else {
      // Glitch no dock se não houver janelas
      this.applyGlitchEffect(document.querySelector('.dock'));
    }
    
    setTimeout(() => {
      this.glitchActive = false;
    }, 1000);
  }

  triggerSystemGlitch() {
    document.body.classList.add('glitching');
    // Dispara glitch ReactBits em todos os elementos [data-glitch]
    if (window.ReactBitsEffects) {
      window.ReactBitsEffects.triggerAllGlitches();
    }
    setTimeout(() => document.body.classList.remove('glitching'), 500);
  }
}
