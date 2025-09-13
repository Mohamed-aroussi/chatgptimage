
// Fix: Add types for the Web Speech API to resolve "Cannot find name 'SpeechRecognition'" error.
// These types are usually available in the 'dom' lib, which might be missing from the project's tsconfig.
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}
declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};
declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionApi {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

const getSpeechRecognition = (): (new () => SpeechRecognition) | null => {
  const Api = window as unknown as SpeechRecognitionApi;
  return Api.SpeechRecognition || Api.webkitSpeechRecognition || null;
};

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setError('خاصية التعرف على الصوت غير مدعومة في هذا المتصفح.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'ar-SA';
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setError(`خطأ في التعرف على الصوت: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
          setError('بدأ التعرف على الصوت بالفعل.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, transcript, startListening, stopListening, error };
};
