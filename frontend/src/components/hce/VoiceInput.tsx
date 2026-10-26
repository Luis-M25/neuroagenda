'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceInputProps {
  onResult: (text: string) => void;
  value: string;
  placeholder?: string;
  className?: string;
}

export default function VoiceInput({ onResult, value, placeholder, className }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('El reconocimiento de voz no esta disponible en este navegador.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      let final = '';
      let temp = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          temp += event.results[i][0].transcript;
        }
      }
      if (final) {
        const newValue = value ? value + ' ' + final : final;
        onResult(newValue);
        setInterim('');
      } else {
        setInterim(temp);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      if (interim) {
        const newValue = value ? value + ' ' + interim : interim;
        onResult(newValue);
        setInterim('');
      }
      setIsListening(false);
    };

    recognition.start();
    setIsListening(true);
  }, [value, interim, onResult]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className={`relative ${className || ''}`}>
      <textarea
        value={value}
        onChange={(e) => onResult(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y min-h-[80px] text-sm"
      />
      {interim && (
        <div className="absolute bottom-2 left-3 right-3 bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs italic">
          {interim}
        </div>
      )}
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        title={isListening ? 'Detener grabacion' : 'Dictar por voz'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    </div>
  );
}
