// ===================================================================
// MICRO-INTERACTIONS - Sounds, Haptic, Animations & Feedback
// ===================================================================

const MICRO_CONFIG = {
  haptic: true, // Enable vibration on supported devices
  sounds: true, // Enable sound effects
  animations: true // Enable CSS animations
};

/**
 * Play haptic feedback (vibration)
 */
function triggerHaptic(pattern = 'light') {
  if (!MICRO_CONFIG.haptic || !navigator.vibrate) return;

  const patterns = {
    light: 10,          // 10ms short vibration
    medium: 50,         // 50ms medium vibration
    heavy: 100,         // 100ms strong vibration
    pulse: [30, 50, 30],    // Pulse pattern
    success: [10, 20, 10, 20, 10],  // Quick triple tap
    error: [100, 50, 100],  // Long-short-long
    warning: [50, 50, 50]   // Triple beat
  };

  navigator.vibrate(patterns[pattern] || patterns.light);
  console.log(`📳 Haptic: ${pattern}`);
}

/**
 * Play beep sound (using Web Audio API)
 */
function tocarBeep(type = 'click') {
  if (!MICRO_CONFIG.sounds || !window.audioCtx) return;

  try {
    const context = window.audioCtx;

    // Create oscillator
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.connect(gain);
    gain.connect(context.destination);

    const beeps = {
      click: { freq: 800, duration: 0.05 },
      whoosh: { freq: 400, duration: 0.1, sweep: true },
      success: { freq: 900, duration: 0.15 },
      error: { freq: 300, duration: 0.2 },
      warning: { freq: 600, duration: 0.1 }
    };

    const beep = beeps[type] || beeps.click;

    gain.gain.setValueAtTime(0.3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + beep.duration);

    if (beep.sweep) {
      osc.frequency.setValueAtTime(beep.freq * 2, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(beep.freq, context.currentTime + beep.duration);
    } else {
      osc.frequency.setValueAtTime(beep.freq, context.currentTime);
    }

    osc.start(context.currentTime);
    osc.stop(context.currentTime + beep.duration);

    console.log(`🔊 Beep: ${type}`);
  } catch (e) {
    console.log(`Beep failed: ${e.message}`);
  }
}

/**
 * Toast notification with sleek top HUD glassmorphism pill (Mobile-First)
 */
function toast(message, icon = '✓') {
  // If inside an already open modal, don't spam duplicate generic locks
  if (message && message.includes('Recurso exclusivo do Plano PRO')) {
    const upgradeModal = document.getElementById('modal-upgrade-nasa');
    if (upgradeModal && (upgradeModal.classList.contains('modal-upgrade-active') || upgradeModal.style.display === 'flex')) {
      return;
    }
  }

  // Use top HUD toast container
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      top: 14px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
      pointer-events: none;
      width: calc(100% - 32px);
      max-width: 420px;
    `;
    document.body.appendChild(toastContainer);
  }

  // Remove existing toasts to prevent blocking the screen
  while (toastContainer.firstChild) {
    toastContainer.removeChild(toastContainer.firstChild);
  }

  // Create toast pill element
  const toastEl = document.createElement('div');
  toastEl.className = 'toast-notification';
  toastEl.style.cssText = `
    background: rgba(15, 23, 42, 0.94);
    border: 1px solid rgba(34, 211, 238, 0.5);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(6, 182, 212, 0.25);
    color: #f8fafc;
    padding: 0.55rem 1rem;
    border-radius: 9999px;
    font-weight: 700;
    font-size: 0.78rem;
    line-height: 1.25;
    animation: toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    max-width: 100%;
    word-break: break-word;
    pointer-events: auto;
    cursor: pointer;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-align: left;
  `;
  toastEl.innerHTML = `<span style="font-size:1.05rem; line-height:1; flex-shrink:0;">${icon}</span><span style="flex:1;">${message}</span>`;
  toastEl.onclick = () => removeToast(toastEl);

  toastContainer.appendChild(toastEl);

  // Auto-remove after 2.8 seconds
  setTimeout(() => removeToast(toastEl), 2800);
}

/**
 * Remove toast notification with clean fade
 */
function removeToast(toastEl) {
  if (!toastEl) return;
  toastEl.style.transition = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
  toastEl.style.opacity = '0';
  toastEl.style.transform = 'translateY(-10px) scale(0.96)';
  setTimeout(() => toastEl.remove(), 260);
}

/**
 * Ripple effect on click
 */
function createRipple(event) {
  if (!MICRO_CONFIG.animations) return;

  const btn = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    left: ${x}px;
    top: ${y}px;
    animation: ripple-animation 0.6s ease-out;
    pointer-events: none;
  `;

  btn.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
  triggerHaptic('light');
}

/**
 * Bounce animation
 */
function playBounce(element) {
  if (!MICRO_CONFIG.animations) return;

  element.style.animation = 'bounce 0.6s ease';
  setTimeout(() => {
    element.style.animation = '';
  }, 600);
}

/**
 * Shake animation (error)
 */
function playShake(element) {
  if (!MICRO_CONFIG.animations) return;

  element.style.animation = 'shake 0.4s ease';
  triggerHaptic('error');
  setTimeout(() => {
    element.style.animation = '';
  }, 400);
}

/**
 * Pulse animation
 */
function playPulse(element, duration = 600) {
  if (!MICRO_CONFIG.animations) return;

  element.style.animation = `pulse ${duration}ms ease-in-out`;
  setTimeout(() => {
    element.style.animation = '';
  }, duration);
}

/**
 * Fade in animation
 */
function playFadeIn(element, duration = 300) {
  element.style.animation = `fadeIn ${duration}ms ease-in`;
  setTimeout(() => {
    element.style.animation = '';
  }, duration);
}

/**
 * Scale animation
 */
function playScale(element, scale = 0.95, duration = 300) {
  const originalTransform = element.style.transform;
  element.style.transform = `scale(${scale})`;
  setTimeout(() => {
    element.style.transform = originalTransform;
  }, duration);
}

/**
 * Toggle sounds
 */
function toggleSounds() {
  MICRO_CONFIG.sounds = !MICRO_CONFIG.sounds;
  const icon = document.getElementById('audio-icon');
  if (icon) {
    icon.textContent = MICRO_CONFIG.sounds ? '🔊' : '🔇';
  }
  toast(MICRO_CONFIG.sounds ? 'Som ativado' : 'Som desativado', MICRO_CONFIG.sounds ? '🔊' : '🔇');
}

/**
 * Toggle haptic
 */
function toggleHaptic() {
  MICRO_CONFIG.haptic = !MICRO_CONFIG.haptic;
  toast(MICRO_CONFIG.haptic ? 'Vibração ativada' : 'Vibração desativada', MICRO_CONFIG.haptic ? '📳' : '📳');
}

/**
 * Initialize Web Audio context
 */
function initAudioContext() {
  if (window.audioCtx) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    window.audioCtx = new AudioContext();
    console.log('✅ Web Audio API initialized');
  } catch (e) {
    console.log('⚠️ Web Audio API not supported');
  }
}

/**
 * Initialize micro-interactions
 */
document.addEventListener('DOMContentLoaded', function() {
  initAudioContext();

  // Add CSS animations to document
  addAnimationStyles();

  console.log('✅ Micro-interactions initialized');
});

/**
 * Add animation CSS to document
 */
function addAnimationStyles() {
  if (document.getElementById('micro-interactions-styles')) return;

  const style = document.createElement('style');
  style.id = 'micro-interactions-styles';
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideDown {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(20px);
      }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-8px); }
      75% { transform: translateX(8px); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }

    .toast-notification {
      animation: slideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    }

    button:active {
      transform: scale(0.95) !important;
    }

    input:focus,
    select:focus,
    textarea:focus {
      animation: fadeIn 0.2s ease;
    }
  `;

  document.head.appendChild(style);
  console.log('✅ Animation styles added');
}

/**
 * Trigger celebratory animation (for wins/upgrades)
 */
function triggerCelebration() {
  if (!MICRO_CONFIG.animations) return;

  // Create confetti effect
  tocarSomNasa('sucesso');
  triggerHaptic('success');

  // Add celebration emoji rain
  const celebration = document.createElement('div');
  celebration.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `;

  const emojis = ['🎉', '🎯', '⭐', '✨', '🎯'];
  for (let i = 0; i < 20; i++) {
    const emoji = document.createElement('span');
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.cssText = `
      position: absolute;
      left: ${Math.random() * 100}%;
      top: -50px;
      font-size: 2rem;
      animation: celebrationFall 3s linear forwards;
      opacity: 0;
    `;
    emoji.style.setProperty('--delay', `${i * 0.05}s`);
    celebration.appendChild(emoji);
  }

  document.body.appendChild(celebration);

  // Add celebration animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes celebrationFall {
      to {
        transform: translateY(100vh) rotate(360deg);
        opacity: 1;
      }
    }
    span[style*="celebrationFall"] {
      animation-delay: var(--delay) !important;
    }
  `;
  document.head.appendChild(style);

  setTimeout(() => celebration.remove(), 3000);
  console.log('🎉 Celebration triggered');
}

// Export for use in other scripts
window.microInteractions = {
  toast,
  triggerHaptic,
  tocarBeep,
  playBounce,
  playShake,
  playPulse,
  playFadeIn,
  playScale,
  triggerCelebration,
  toggleSounds,
  toggleHaptic,
  createRipple
};

console.log('✨ Micro-interactions module loaded');
