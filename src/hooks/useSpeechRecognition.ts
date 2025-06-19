import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  confidence: number;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
  error: string | null;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const isStartingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPermissionRef = useRef(false);

  // Detect device type
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  // Enhanced browser support detection
  const browserSupportsSpeechRecognition = (() => {
    if (typeof window === 'undefined') return false;
    
    const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window;
    const hasSpeechRecognition = 'SpeechRecognition' in window;
    
    console.log('Browser support check:', {
      hasWebkitSpeechRecognition,
      hasSpeechRecognition,
      isIOS,
      isAndroid,
      isMobile,
      userAgent: navigator.userAgent
    });
    
    return hasWebkitSpeechRecognition || hasSpeechRecognition;
  })();

  // Request microphone permission explicitly
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    if (hasPermissionRef.current) {
      return true;
    }

    try {
      console.log('Requesting microphone permission...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia not supported');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          ...(isIOS && { sampleRate: 16000 }) // iOS prefers 16kHz
        } 
      });
      
      console.log('Microphone permission granted');
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped audio track:', track.label);
      });
      
      hasPermissionRef.current = true;
      setError(null);
      return true;
      
    } catch (permissionError) {
      console.error('Microphone permission error:', permissionError);
      hasPermissionRef.current = false;
      
      if (permissionError instanceof Error) {
        if (permissionError.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (permissionError.name === 'NotFoundError') {
          setError('No microphone found. Please check your device has a microphone.');
        } else if (permissionError.name === 'NotReadableError') {
          setError('Microphone is being used by another application.');
        } else {
          setError('Unable to access microphone. Please check your device settings.');
        }
      }
      
      return false;
    }
  }, [isIOS]);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.log('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      
      // Configure based on device type
      if (isIOS) {
        // iOS Safari requires very specific settings
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        // iOS-specific webkit properties
        if ('webkitSpeechRecognition' in window) {
          try {
            (recognition as any).webkitContinuous = false;
            (recognition as any).webkitInterimResults = false;
          } catch (e) {
            console.log('Could not set webkit properties:', e);
          }
        }
      } else if (isAndroid) {
        // Android Chrome settings
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
      } else {
        // Desktop settings
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
      }

      recognition.onstart = () => {
        console.log('✅ Speech recognition started successfully');
        setIsListening(true);
        setError(null);
        isStartingRef.current = false;
        finalTranscriptRef.current = '';
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // Set timeout based on device - iOS needs shorter timeout
        const timeoutDuration = isIOS ? 8000 : 15000;
        timeoutRef.current = setTimeout(() => {
          console.log('⏰ Speech recognition timeout - auto stopping');
          if (recognitionRef.current && isListening) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              console.log('Error stopping on timeout:', e);
            }
          }
        }, timeoutDuration);
      };

      recognition.onresult = (event) => {
        console.log('🎤 Speech recognition result:', event);
        
        // Clear timeout since we got a result
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        let interimTranscript = '';
        let finalTranscript = '';
        let maxConfidence = 0;
        
        // Process all results
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const resultTranscript = result[0].transcript;
          const resultConfidence = result[0].confidence || 0.8;
          
          console.log(`Result ${i}: "${resultTranscript}" (final: ${result.isFinal}, confidence: ${resultConfidence})`);
          
          if (result.isFinal) {
            finalTranscript += resultTranscript;
            maxConfidence = Math.max(maxConfidence, resultConfidence);
            finalTranscriptRef.current = finalTranscript;
          } else if (!isIOS) {
            // Only use interim results on non-iOS devices
            interimTranscript += resultTranscript;
          }
        }
        
        // Update transcript
        const currentTranscript = finalTranscript || interimTranscript;
        if (currentTranscript.trim()) {
          console.log('📝 Setting transcript:', currentTranscript);
          setTranscript(currentTranscript.trim());
          if (finalTranscript) {
            setConfidence(maxConfidence);
            
            // On iOS and mobile, stop immediately after getting final result
            if (isMobile) {
              setTimeout(() => {
                if (recognitionRef.current) {
                  try {
                    console.log('📱 Mobile: Auto-stopping after final result');
                    recognitionRef.current.stop();
                  } catch (e) {
                    console.log('Error auto-stopping:', e);
                  }
                }
              }, 100);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error, event);
        
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setIsListening(false);
        isStartingRef.current = false;
        
        // Handle specific errors with user-friendly messages
        switch (event.error) {
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access and try again.');
            hasPermissionRef.current = false;
            break;
          case 'no-speech':
            console.log('No speech detected - this is normal');
            setError(null); // Don't show error for no speech
            break;
          case 'audio-capture':
            setError('Cannot access microphone. Please check if another app is using it.');
            break;
          case 'network':
            setError('Network error. Please check your internet connection.');
            break;
          case 'service-not-allowed':
            setError('Speech recognition service not allowed. Please check browser settings.');
            break;
          case 'bad-grammar':
            setError('Speech recognition grammar error.');
            break;
          case 'language-not-supported':
            setError('Language not supported.');
            break;
          case 'aborted':
            console.log('Speech recognition aborted');
            setError(null);
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        console.log('🏁 Speech recognition ended');
        
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setIsListening(false);
        isStartingRef.current = false;
        
        // If we have a final transcript, make sure it's set
        if (finalTranscriptRef.current.trim()) {
          console.log('📝 Setting final transcript on end:', finalTranscriptRef.current);
          setTranscript(finalTranscriptRef.current.trim());
        }
      };

    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setError('Failed to initialize speech recognition.');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition on cleanup:', error);
        }
      }
    };
  }, [browserSupportsSpeechRecognition, isIOS, isAndroid, isMobile]);

  const startListening = useCallback(async (): Promise<void> => {
    if (!recognitionRef.current || isListening || isStartingRef.current) {
      console.log('❌ Cannot start - no recognition, already listening, or starting');
      return;
    }

    console.log('🎙️ Starting speech recognition...');
    isStartingRef.current = true;
    setTranscript('');
    setConfidence(0);
    setError(null);
    finalTranscriptRef.current = '';
    
    try {
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        isStartingRef.current = false;
        throw new Error('Microphone permission required');
      }
      
      // Add a small delay for mobile devices to ensure permission is fully granted
      const startDelay = isMobile ? 300 : 100;
      
      setTimeout(() => {
        if (recognitionRef.current && isStartingRef.current) {
          try {
            console.log('🚀 Actually starting recognition...');
            recognitionRef.current.start();
          } catch (startError) {
            console.error('❌ Error starting recognition:', startError);
            isStartingRef.current = false;
            setIsListening(false);
            
            if (startError instanceof Error) {
              if (startError.message.includes('already started')) {
                setError('Speech recognition is already active. Please wait a moment and try again.');
              } else {
                setError('Failed to start speech recognition. Please try again.');
              }
            }
          }
        }
      }, startDelay);
      
    } catch (error) {
      console.error('❌ Error in startListening:', error);
      isStartingRef.current = false;
      setIsListening(false);
      
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to start speech recognition.');
      }
      throw error;
    }
  }, [isListening, isMobile, requestMicrophonePermission]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.log('❌ Cannot stop - no recognition instance');
      return;
    }

    console.log('🛑 Stopping speech recognition...');
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('❌ Error stopping speech recognition:', error);
      setIsListening(false);
      isStartingRef.current = false;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    console.log('🔄 Resetting transcript');
    setTranscript('');
    setConfidence(0);
    setError(null);
    finalTranscriptRef.current = '';
  }, []);

  return {
    transcript,
    isListening,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error
  };
};