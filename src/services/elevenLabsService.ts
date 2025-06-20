const ELEVENLABS_API_KEY = 'sk_8ddbd27c76d5badb5381028b8d44c9c8c6cca4b9acf85f66';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Using a popular voice ID from ElevenLabs (Rachel - a warm, friendly voice)
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export const defaultVoiceSettings: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true
};

// Global audio context for better mobile support
let audioContext: AudioContext | null = null;
let currentAudioSource: AudioBufferSourceNode | null = null;

// Initialize audio context with user interaction
const initializeAudioContext = async (): Promise<AudioContext> => {
  if (!audioContext) {
    try {
      // Use webkitAudioContext for Safari compatibility
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      
      // Resume context if suspended (required for mobile)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      console.log('✅ Audio context initialized:', audioContext.state);
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error);
      throw new Error('Audio not supported on this device');
    }
  }
  
  // Ensure context is running
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  
  return audioContext;
};

// Get API key from localStorage or fallback to default
const getApiKey = (): string => {
  try {
    const config = localStorage.getItem('elevenlabs-config');
    if (config) {
      const parsed = JSON.parse(config);
      return parsed.apiKey || ELEVENLABS_API_KEY;
    }
  } catch (error) {
    console.error('Error reading API config:', error);
  }
  return ELEVENLABS_API_KEY;
};

// Get voice settings from localStorage or fallback to default
const getVoiceSettings = (): VoiceSettings => {
  try {
    const config = localStorage.getItem('elevenlabs-config');
    if (config) {
      const parsed = JSON.parse(config);
      return parsed.voiceSettings || defaultVoiceSettings;
    }
  } catch (error) {
    console.error('Error reading voice settings:', error);
  }
  return defaultVoiceSettings;
};

// Get voice ID from localStorage or fallback to default
const getVoiceId = (): string => {
  try {
    const config = localStorage.getItem('elevenlabs-config');
    if (config) {
      const parsed = JSON.parse(config);
      return parsed.voiceId || DEFAULT_VOICE_ID;
    }
  } catch (error) {
    console.error('Error reading voice ID:', error);
  }
  return DEFAULT_VOICE_ID;
};

export const testApiConnection = async (testApiKey?: string): Promise<boolean> => {
  try {
    const apiKey = testApiKey || getApiKey();
    
    const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
      headers: {
        'xi-api-key': apiKey
      }
    });

    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

export const synthesizeSpeech = async (
  text: string,
  voiceId?: string,
  voiceSettings?: VoiceSettings,
  testApiKey?: string
): Promise<ArrayBuffer> => {
  try {
    const apiKey = testApiKey || getApiKey();
    const finalVoiceId = voiceId || getVoiceId();
    const finalVoiceSettings = voiceSettings || getVoiceSettings();

    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${finalVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: finalVoiceSettings
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    throw error;
  }
};

// Enhanced audio playback with Web Audio API for better mobile support
export const playAudioBuffer = async (audioBuffer: ArrayBuffer): Promise<void> => {
  try {
    console.log('🔊 Starting audio playback...');
    
    // Stop any currently playing audio
    stopCurrentAudio();
    
    // Initialize audio context
    const context = await initializeAudioContext();
    
    // Decode audio data
    const decodedBuffer = await context.decodeAudioData(audioBuffer.slice(0));
    
    // Create audio source
    const source = context.createBufferSource();
    source.buffer = decodedBuffer;
    source.connect(context.destination);
    
    // Store reference for stopping
    currentAudioSource = source;
    
    return new Promise((resolve, reject) => {
      let hasEnded = false;
      
      const cleanup = () => {
        if (!hasEnded) {
          hasEnded = true;
          if (currentAudioSource === source) {
            currentAudioSource = null;
          }
        }
      };
      
      source.onended = () => {
        console.log('✅ Audio playback completed');
        cleanup();
        resolve();
      };
      
      // Handle errors
      const handleError = (error: any) => {
        console.error('❌ Audio playback error:', error);
        cleanup();
        reject(new Error('Audio playback failed'));
      };
      
      try {
        // Start playback
        source.start(0);
        console.log('🎵 Audio source started');
        
        // Fallback timeout
        setTimeout(() => {
          if (!hasEnded) {
            console.warn('⏰ Audio playback timeout');
            cleanup();
            reject(new Error('Audio playback timeout'));
          }
        }, 30000);
        
      } catch (error) {
        handleError(error);
      }
    });
    
  } catch (error) {
    console.error('❌ Error in playAudioBuffer:', error);
    
    // Fallback to HTML5 audio for older browsers
    return playAudioBufferFallback(audioBuffer);
  }
};

// Fallback HTML5 audio method
const playAudioBufferFallback = (audioBuffer: ArrayBuffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔄 Using HTML5 audio fallback...');
      
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      // Store reference globally for stopping
      (window as any).currentAudio = audio;
      
      // Enhanced mobile compatibility settings
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      
      // iOS Safari specific settings
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        audio.muted = false;
        audio.volume = 1.0;
        // Force load on iOS
        audio.load();
      }
      
      let hasEnded = false;
      
      const cleanup = () => {
        if (!hasEnded) {
          hasEnded = true;
          URL.revokeObjectURL(audioUrl);
          if ((window as any).currentAudio === audio) {
            (window as any).currentAudio = null;
          }
        }
      };
      
      audio.onended = () => {
        console.log('✅ HTML5 audio playback completed');
        cleanup();
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('❌ HTML5 audio playback error:', error);
        cleanup();
        reject(new Error('Audio playback failed'));
      };
      
      audio.onpause = () => {
        if (!hasEnded && audio.currentTime >= 0) {
          console.log('🔇 Audio manually paused');
          cleanup();
          resolve();
        }
      };
      
      audio.oncanplaythrough = () => {
        console.log('✅ Audio can play through');
      };
      
      // Enhanced play with error handling for mobile
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ HTML5 audio playback started successfully');
          })
          .catch((error) => {
            console.error('❌ HTML5 audio play promise rejected:', error);
            
            // Handle specific mobile errors
            if (error.name === 'NotAllowedError') {
              console.error('Audio playback not allowed - user interaction required');
              cleanup();
              reject(new Error('Please tap the screen first to enable audio on your device'));
            } else if (error.name === 'NotSupportedError') {
              console.error('Audio format not supported');
              cleanup();
              reject(new Error('Audio format not supported on this device'));
            } else {
              cleanup();
              reject(error);
            }
          });
      }
      
      // Fallback timeout for mobile devices
      setTimeout(() => {
        if (!hasEnded && audio.paused && audio.currentTime === 0) {
          console.warn('⏰ HTML5 audio playback timeout - forcing cleanup');
          cleanup();
          reject(new Error('Audio playback timeout'));
        }
      }, 30000);
      
    } catch (error) {
      console.error('❌ Error creating HTML5 audio:', error);
      reject(error);
    }
  });
};

// Function to stop currently playing audio
export const stopCurrentAudio = (): void => {
  // Stop Web Audio API source
  if (currentAudioSource) {
    try {
      console.log('🛑 Stopping Web Audio API source');
      currentAudioSource.stop();
      currentAudioSource = null;
    } catch (error) {
      console.log('Note: Audio source already stopped');
      currentAudioSource = null;
    }
  }
  
  // Stop HTML5 audio fallback
  const currentAudio = (window as any).currentAudio;
  if (currentAudio && !currentAudio.paused) {
    console.log('🛑 Stopping HTML5 audio');
    currentAudio.pause();
    currentAudio.currentTime = 0;
    (window as any).currentAudio = null;
  }
};

// Function to ensure audio context is ready (call this on user interaction)
export const prepareAudioContext = async (): Promise<void> => {
  try {
    await initializeAudioContext();
    console.log('✅ Audio context prepared for playback');
  } catch (error) {
    console.error('❌ Failed to prepare audio context:', error);
  }
};

export const getAvailableVoices = async (testApiKey?: string) => {
  try {
    const apiKey = testApiKey || getApiKey();
    
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching voices:', error);
    throw error;
  }
};