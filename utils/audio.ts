// Singleton AudioContext to manage state across playing
let audioCtx: AudioContext | null = null;

// Call this on the first user interaction (click/touch) to unlock audio on mobile
export const unlockAudioContext = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    if (!audioCtx) {
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.error("Audio unlock failed", e);
  }
};

export const playNotificationSound = () => {
  try {
    // Ensure context exists (fallback if unlock wasn't called, though mobile might block this)
    if (!audioCtx) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    
    if (!audioCtx) return;

    // Create master gain (volume)
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    // Oscillator 1 (Main Tone)
    const osc1 = audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc1.connect(masterGain);

    // Oscillator 2 (Harmonic)
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, audioCtx.currentTime); // A6
    osc2.connect(masterGain);

    // Envelope (Attack & Release) - "Glassy" effect
    const now = audioCtx.currentTime;
    
    // Attack
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.2, now + 0.01); // Quick fade in
    
    // Decay
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5); // Smooth fade out

    // Play
    osc1.start(now);
    osc2.start(now);
    
    // Stop
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
    
  } catch (error) {
    console.error("Audio play failed", error);
  }
};
