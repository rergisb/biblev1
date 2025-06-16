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

// Enhanced audio playback with mobile compatibility
export const playAudioBuffer = (audioBuffer: ArrayBuffer): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      // Enhanced mobile compatibility settings
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      
      // iOS Safari specific settings
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        // iOS requires user interaction for audio playback
        audio.muted = false;
        audio.volume = 1.0;
      }
      
      let hasEnded = false;
      
      const cleanup = () => {
        if (!hasEnded) {
          hasEnded = true;
          URL.revokeObjectURL(audioUrl);
        }
      };
      
      audio.onended = () => {
        cleanup();
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        cleanup();
        reject(new Error('Audio playback failed'));
      };
      
      audio.oncanplaythrough = () => {
        console.log('Audio can play through');
      };
      
      audio.onloadstart = () => {
        console.log('Audio load started');
      };
      
      audio.onloadeddata = () => {
        console.log('Audio data loaded');
      };
      
      // Enhanced play with error handling for mobile
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playback started successfully');
          })
          .catch((error) => {
            console.error('Audio play promise rejected:', error);
            
            // Handle specific mobile errors
            if (error.name === 'NotAllowedError') {
              console.error('Audio playback not allowed - user interaction required');
              cleanup();
              reject(new Error('Audio playback requires user interaction on this device'));
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
        if (!hasEnded && audio.paused) {
          console.warn('Audio playback timeout - forcing cleanup');
          cleanup();
          reject(new Error('Audio playback timeout'));
        }
      }, 30000); // 30 second timeout
      
    } catch (error) {
      console.error('Error creating audio:', error);
      reject(error);
    }
  });
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