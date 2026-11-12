// High-Speed Web Speech Recognition & Synthesis Engine
// Features: Fast interim debounce, Proximity Noise Suppression, Zero Self-Echo, and Instant Interruption

class SpeechEngine {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.isSupported = !!this.recognition && !!window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    this.audioCtx = null;
    this.mediaStream = null;
    this.debounceTimer = null;
    this.lastInterimText = '';

    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true; // High-speed immediate speech detection
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 3;
    }
  }

  // Audio chimes using Web Audio API (zero external assets needed)
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Request closest mic capture with noise suppression & echo cancellation
  async enableClosestMic() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !this.mediaStream) {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true, // Boosts closest voice
          },
        });
      } catch {
        // Fallback gracefully if permission denied
      }
    }
  }

  playChime(type = 'success') {
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'start') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'warning' || type === 'ambiguous') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(330, now + 0.12);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch {
      // Ignored
    }
  }

  startListening(onResult, onError, onEnd, onInterim) {
    if (!this.recognition) return false;
    if (this.isListening) return true;

    this.initAudio();
    this.enableClosestMic();
    this.playChime('start');

    // User speech started: If assistant is currently speaking, cancel immediately (Barge-in / interruption)
    this.recognition.onspeechstart = () => {
      if (this.isSpeaking) {
        this.cancelSpeech();
      }
    };

    this.recognition.onresult = (event) => {
      // Ignore results if assistant is speaking to avoid hearing its own speakers
      if (this.isSpeaking) {
        return;
      }

      let interimTranscript = '';
      let finalTranscript = '';
      let bestInterimCandidate = '';
      let bestConfidence = -1;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const alternatives = Array.from(item).map(alternative => ({
          transcript: (alternative && alternative.transcript ? alternative.transcript : '').trim(),
          confidence: typeof alternative.confidence === 'number' ? alternative.confidence : 0.5,
        })).filter(option => option.transcript);

        if (!alternatives.length) continue;

        const bestAlternative = alternatives.reduce((winner, candidate) => {
          const candidateScore = candidate.confidence + (/\b(sales|cells|sells|stock|products|today|compare|cash|withdraw|expense|customer|price)\b/i.test(candidate.transcript) ? 0.2 : 0);
          return candidateScore > winner.score ? { value: candidate.transcript, score: candidateScore } : winner;
        }, { value: alternatives[0].transcript, score: alternatives[0].confidence });

        if (item.isFinal) {
          finalTranscript += bestAlternative.value;
        } else {
          interimTranscript += bestAlternative.value;
          if (bestAlternative.score > bestConfidence) {
            bestInterimCandidate = bestAlternative.value;
            bestConfidence = bestAlternative.score;
          }
        }
      }

      const text = (finalTranscript || bestInterimCandidate || interimTranscript).trim();
      if (!text) return;

      if (onInterim && interimTranscript) {
        onInterim(bestInterimCandidate || interimTranscript);
      }

      // If browser returned an official isFinal, fire immediately!
      if (finalTranscript) {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.lastInterimText = '';
        if (onResult) onResult(finalTranscript.trim());
        return;
      }

      // Fast silence debounce for interim speech (550ms after user pauses speaking)
      this.lastInterimText = text;
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        if (this.lastInterimText && !this.isSpeaking) {
          const toSend = this.lastInterimText;
          this.lastInterimText = '';
          if (onResult) onResult(toSend.trim());
        }
      }, 550);
    };

    this.recognition.onerror = (err) => {
      if (err.error !== 'no-speech' && onError) {
        onError(err);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch {
      return false;
    }
  }

  stopListening() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
      this.isListening = false;
    }
  }

  /**
   * Speak back to the user clearly using TTS
   */
  speak(text, onComplete) {
    if (!window.speechSynthesis) {
      if (onComplete) onComplete();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.08; // Crisp, brisk, natural pace
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')) && v.lang.startsWith('en'));
      if (naturalVoice) utterance.voice = naturalVoice;

      this.isSpeaking = true;

      utterance.onend = () => {
        // Small 200ms buffer before re-enabling mic input to prevent speaker tail-echo
        setTimeout(() => {
          this.isSpeaking = false;
          if (onComplete) onComplete();
        }, 200);
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        if (onComplete) onComplete();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.isSpeaking = false;
      if (onComplete) onComplete();
    }
  }

  cancelSpeech() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }
}

export const speechEngine = new SpeechEngine();
