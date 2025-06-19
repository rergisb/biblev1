import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  confidence: number;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  browserSupportsSpeechRecognition: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const isStartingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced browser support detection for mobile
  const browserSupportsSpeechRecognition = (() => {
    if (typeof window === 'undefined') return false;
    
    // Check for both standard and webkit versions
    const hasWebkitSpeechRecognition = 'webkitSpeechRecognition' in window;
    const hasSpeechRecognition = 'SpeechRecognition' in window;
    
    // Additional check for iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    console.log('Browser support check:', {
      hasWebkitSpeechRecognition,
      hasSpeechRecognition,
      isIOS,
      isSafari,
      userAgent: navigator.userAgent
    });
    
    return hasWebkitSpeechRecognition || hasSpeechRecognition;
  })();

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.log('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      
      // Enhanced configuration for mobile compatibility
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      
      // iOS Safari specific settings - very conservative approach
      if (isIOS) {
        recognition.continuous = false; // Must be false for iOS
        recognition.interimResults = false; // Must be false for iOS stability
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        // iOS requires these specific settings
        if ('webkitSpeechRecognition' in window) {
          (recognition as any).webkitContinuous = false;
          (recognition as any).webkitInterimResults = false;
        }
      } else if (isAndroid) {
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
        console.log('Speech recognition started successfully');
        setIsListening(true);
        isStartingRef.current = false;
        finalTranscriptRef.current = '';
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // Set a timeout for iOS (it often doesn't trigger onend properly)
        if (isIOS) {
          timeoutRef.current = setTimeout(() => {
            console.log('iOS timeout - forcing stop');
            if (recognitionRef.current && isListening) {
              try {
                recognitionRef.current.stop();
              } catch (e) {
                console.log('Error stopping on timeout:', e);
              }
            }
          }, 10000); // 10 second timeout for iOS
        }
      };

      recognition.onresult = (event) => {
        console.log('Speech recognition result received:', event);
        
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
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0.8;
          
          console.log(`Result ${i}: "${transcript}" (final: ${result.isFinal}, confidence: ${confidence})`);
          
          if (result.isFinal) {
            finalTranscript += transcript;
            maxConfidence = Math.max(maxConfidence, confidence);
            finalTranscriptRef.current = finalTranscript;
          } else if (!isIOS) {
            // Only use interim results on non-iOS devices
            interimTranscript += transcript;
          }
        }
        
        // For iOS, we only get final results, so use them immediately
        const currentTranscript = finalTranscript || interimTranscript;
        if (currentTranscript.trim()) {
          console.log('Setting transcript:', currentTranscript);
          setTranscript(currentTranscript.trim());
          if (finalTranscript) {
            setConfidence(maxConfidence);
            
            // On iOS, stop immediately after getting final result
            if (isIOS) {
              setTimeout(() => {
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.stop();
                  } catch (e) {
                    console.log('Error stopping after final result:', e);
                  }
                }
              }, 100);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error, event);
        
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setIsListening(false);
        isStartingRef.current = false;
        
        // Handle specific errors
        if (event.error === 'not-allowed') {
          console.error('Microphone permission denied');
          setTranscript('');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
          // On iOS, this is common and not really an error
          if (!isIOS) {
            setTranscript('');
          }
        } else if (event.error === 'audio-capture') {
          console.error('Audio capture failed - check microphone');
          setTranscript('');
        } else if (event.error === 'network') {
          console.error('Network error during speech recognition');
          setTranscript('');
        } else if (event.error === 'aborted') {
          console.log('Speech recognition aborted');
          // Don't clear transcript on abort
        } else {
          console.error('Unknown speech recognition error:', event.error);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended, final transcript:', finalTranscriptRef.current);
        
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setIsListening(false);
        isStartingRef.current = false;
        
        // If we have a final transcript, make sure it's set
        if (finalTranscriptRef.current.trim()) {
          console.log('Setting final transcript on end:', finalTranscriptRef.current);
          setTranscript(finalTranscriptRef.current.trim());
        }
      };

    } catch (error) {
      console.error('Error initializing speech recognition:', error);
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
  }, [browserSupportsSpeechRecognition]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current || isListening || isStartingRef.current) {
      console.log('Cannot start - no recognition, already listening, or starting');
      return;
    }

    console.log('Starting speech recognition...');
    isStartingRef.current = true;
    setTranscript('');
    setConfidence(0);
    finalTranscriptRef.current = '';
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    try {
      // For iOS, we need to be very careful about permissions and timing
      if (isIOS) {
        console.log('iOS detected - using iOS-specific flow');
        
        // Request permission first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            console.log('Requesting microphone permission for iOS...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000 // iOS prefers 16kHz
              } 
            });
            console.log('iOS microphone permission granted');
            
            // Stop the stream immediately
            stream.getTracks().forEach(track => track.stop());
            
            // Wait a bit longer for iOS
            setTimeout(() => {
              if (recognitionRef.current && isStartingRef.current) {
                try {
                  console.log('Starting iOS speech recognition...');
                  recognitionRef.current.start();
                } catch (startError) {
                  console.error('Error starting iOS recognition:', startError);
                  isStartingRef.current = false;
                  setIsListening(false);
                }
              }
            }, 200); // Longer delay for iOS
            
          } catch (permissionError) {
            console.error('iOS microphone permission denied:', permissionError);
            isStartingRef.current = false;
            setIsListening(false);
            throw new Error('Microphone permission required for iOS');
          }
        } else {
          // Fallback for older iOS versions
          console.log('Using fallback method for iOS');
          setTimeout(() => {
            if (recognitionRef.current && isStartingRef.current) {
              try {
                recognitionRef.current.start();
              } catch (startError) {
                console.error('Error starting iOS recognition (fallback):', startError);
                isStartingRef.current = false;
                setIsListening(false);
              }
            }
          }, 200);
        }
      } else {
        // Non-iOS devices
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            console.log('Requesting microphone permission...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              } 
            });
            console.log('Microphone permission granted');
            
            // Stop the stream immediately
            stream.getTracks().forEach(track => track.stop());
            
            setTimeout(() => {
              if (recognitionRef.current && isStartingRef.current) {
                try {
                  recognitionRef.current.start();
                } catch (startError) {
                  console.error('Error starting recognition after permission:', startError);
                  isStartingRef.current = false;
                  setIsListening(false);
                }
              }
            }, 100);
            
          } catch (permissionError) {
            console.error('Microphone permission denied:', permissionError);
            isStartingRef.current = false;
            setIsListening(false);
            throw new Error('Microphone permission required');
          }
        } else {
          // Fallback for older browsers
          console.log('Using fallback method to start recognition');
          recognitionRef.current.start();
        }
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      isStartingRef.current = false;
      setIsListening(false);
      throw error;
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) {
      console.log('Cannot stop - no recognition or not listening');
      return;
    }

    console.log('Stopping speech recognition...');
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setIsListening(false);
      isStartingRef.current = false;
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    console.log('Resetting transcript');
    setTranscript('');
    setConfidence(0);
    finalTranscriptRef.current = '';
  }, []);

  return {
    transcript,
    isListening,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition
  };
};