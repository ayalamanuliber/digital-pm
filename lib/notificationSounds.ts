// Notification sound utility

let audioContext: AudioContext | null = null;

// Initialize audio context on first user interaction
export const initializeAudio = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('Audio context initialized');
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }
  return audioContext;
};

export const playNotificationSound = (type: 'chat' | 'notification' = 'notification') => {
  try {
    // Check if sounds are enabled
    const chatSoundEnabled = localStorage.getItem('chatSoundEnabled') !== 'false';
    const notificationSoundEnabled = localStorage.getItem('notificationSoundEnabled') !== 'false';

    if (type === 'chat' && !chatSoundEnabled) {
      console.log('Chat sound disabled');
      return;
    }
    if (type === 'notification' && !notificationSoundEnabled) {
      console.log('Notification sound disabled');
      return;
    }

    // Initialize audio context if needed
    const ctx = initializeAudio();
    if (!ctx) {
      console.error('No audio context available');
      return;
    }

    // Resume audio context if suspended (browser restriction)
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log('Audio context resumed');
      });
    }

    if (type === 'chat') {
      console.log('Playing chat sound');
      playChatBeep(ctx);
    } else {
      console.log('Playing notification sound');
      playNotificationBeep(ctx);
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

function playChatBeep(audioContext: AudioContext) {
  // First beep
  const oscillator1 = audioContext.createOscillator();
  const gainNode1 = audioContext.createGain();

  oscillator1.connect(gainNode1);
  gainNode1.connect(audioContext.destination);

  oscillator1.frequency.value = 900; // Higher pitch
  oscillator1.type = 'sine';

  gainNode1.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 0.15);

  // Second beep
  const oscillator2 = audioContext.createOscillator();
  const gainNode2 = audioContext.createGain();

  oscillator2.connect(gainNode2);
  gainNode2.connect(audioContext.destination);

  oscillator2.frequency.value = 1100; // Even higher pitch
  oscillator2.type = 'sine';

  gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.2);
  gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);

  oscillator2.start(audioContext.currentTime + 0.2);
  oscillator2.stop(audioContext.currentTime + 0.35);
}

function playNotificationBeep(audioContext: AudioContext) {
  // Single attention-grabbing beep
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 700; // Lower pitch
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.4);
}
