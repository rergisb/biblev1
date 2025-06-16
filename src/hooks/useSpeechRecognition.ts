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

  const browserSupportsSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = false; // Changed to false for better control
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

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
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      // Don't reset transcript on certain errors
      if (event.error !== 'no-speech' && event.error !== 'audio-capture') {
        // Only reset if it's a serious error
        if (event.error === 'network' || event.error === 'service-not-allowed') {
          setTranscript('');
        }
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

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [browserSupportsSpeechRecognition]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      console.log('Starting speech recognition...');
      setTranscript('');
      setConfidence(0);
      finalTranscriptRef.current = '';
      
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      console.log('Stopping speech recognition...');
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        setIsListening(false);
      }
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