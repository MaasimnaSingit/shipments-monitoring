export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    
    // Create master gain (volume)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.1, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Oscillator 1 (Main Tone)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc1.connect(masterGain);

    // Oscillator 2 (Harmonic)
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, ctx.currentTime); // A6
    osc2.connect(masterGain);

    // Envelope (Attack & Release) - "Glassy" effect
    const now = ctx.currentTime;
    
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

    // Cleanup
    setTimeout(() => {
      ctx.close();
    }, 600);
    
  } catch (error) {
    console.error("Audio play failed", error);
  }
};
