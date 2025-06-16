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
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // iOS Safari specific settings
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        recognition.continuous = false; // Force false for iOS
        recognition.interimResults = false; // Disable interim results on iOS for stability
      }

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        finalTranscriptRef.current = '';
      };

      recognition.onresult = (event) => {
        console.log('Speech recognition result:', event);
        let interimTranscript = '';
        let finalTranscript = '';
        let maxConfidence = 0;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0.8;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            maxConfidence = Math.max(maxConfidence, confidence);
            finalTranscriptRef.current = finalTranscript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update transcript with either final or interim result
        const currentTranscript = finalTranscript || interimTranscript;
        if (currentTranscript.trim()) {
          setTranscript(currentTranscript.trim());
          if (finalTranscript) {
            setConfidence(maxConfidence);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error, event);
        setIsListening(false);
        
        // Handle specific mobile errors
        if (event.error === 'not-allowed') {
          console.error('Microphone permission denied');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected - this is normal');
          // Don't treat no-speech as a real error
          return;
        } else if (event.error === 'audio-capture') {
          console.error('Audio capture failed - check microphone');
        } else if (event.error === 'network') {
          console.error('Network error during speech recognition');
        }
        
        // Only reset transcript on serious errors
        if (event.error === 'network' || event.error === 'service-not-allowed' || event.error === 'not-allowed') {
          setTranscript('');
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // If we have a final transcript, make sure it's set
        if (finalTranscriptRef.current.trim()) {
          setTranscript(finalTranscriptRef.current.trim());
        }
      };

    } catch (error) {
      console.error('Error initializing speech recognition:', error);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition on cleanup:', error);
        }
      }
    };
  }, [browserSupportsSpeechRecognition]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) {
      console.log('Cannot start - no recognition or already listening');
      return;
    }

    console.log('Starting speech recognition...');
    setTranscript('');
    setConfidence(0);
    finalTranscriptRef.current = '';
    
    try {
      // Request microphone permission explicitly on mobile
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log('Microphone permission granted');
            if (recognitionRef.current) {
              recognitionRef.current.start();
            }
          })
          .catch((error) => {
            console.error('Microphone permission denied:', error);
            setIsListening(false);
          });
      } else {
        // Fallback for older browsers
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) {
      console.log('Cannot stop - no recognition or not listening');
      return;
    }

    console.log('Stopping speech recognition...');
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      setIsListening(false);
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