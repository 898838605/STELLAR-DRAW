/* =========================================================
   STELLAR DRAW · sound engine
   ========================================================= */
(function (NS) {
  "use strict";

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  function ramp(node, from, to, start, duration) {
    node.gain.cancelScheduledValues(start);
    node.gain.setValueAtTime(Math.max(0.0001, from), start);
    node.gain.exponentialRampToValueAtTime(Math.max(0.0001, to), start + duration);
  }

  class AudioEngine {
    constructor(audioElement) {
      this.audio = audioElement;
      this.audio.loop = true;
      this.ctx = null;
      this.master = null;
      this.musicBus = null;
      this.sfxBus = null;
      this.volume = 52;
      this.sfxEnabled = true;
      this.musicPlaying = false;
      this.playbackSource = null;
      this.synthSession = null;
      this.onChange = null;
      this.onError = null;

      const self = this;
      this.audio.addEventListener("play", function () {
        self.musicPlaying = true;
        self.playbackSource = "file";
        self.emit();
      });
      this.audio.addEventListener("pause", function () {
        if (self.playbackSource === "file") {
          self.musicPlaying = false;
          self.emit();
        }
      });
      this.audio.addEventListener("error", function () {
        self.musicPlaying = false;
        self.emit();
        if (typeof self.onError === "function") {
          self.onError("这段音乐暂时无法播放，请换一首试试。");
        }
      });
    }

    emit() {
      if (typeof this.onChange === "function") {
        this.onChange(this.musicPlaying, this.playbackSource);
      }
    }

    ensureContext() {
      if (!AudioContextClass) return null;
      if (!this.ctx) {
        try {
          this.ctx = new AudioContextClass();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.9;

          const compressor = this.ctx.createDynamicsCompressor();
          compressor.threshold.value = -16;
          compressor.knee.value = 20;
          compressor.ratio.value = 4;
          compressor.attack.value = 0.005;
          compressor.release.value = 0.25;

          this.musicBus = this.ctx.createGain();
          this.musicBus.gain.value = this.getMusicGain();
          this.sfxBus = this.ctx.createGain();
          this.sfxBus.gain.value = this.sfxEnabled ? 0.55 : 0;

          this.musicBus.connect(compressor);
          this.sfxBus.connect(compressor);
          compressor.connect(this.master);
          this.master.connect(this.ctx.destination);
        } catch (error) {
          this.ctx = null;
          return null;
        }
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(function () {});
      }
      return this.ctx;
    }

    getMusicGain() {
      return Math.max(0.0001, (this.volume / 100) * 0.9);
    }

    setVolume(value) {
      this.volume = Math.max(0, Math.min(100, Number(value) || 0));
      const fileVolume = Math.max(0, Math.min(1, (this.volume / 100) * 0.78));
      this.audio.volume = fileVolume;
      if (this.musicBus && this.ctx) {
        const now = this.ctx.currentTime;
        this.musicBus.gain.cancelScheduledValues(now);
        this.musicBus.gain.setTargetAtTime(this.getMusicGain(), now, 0.08);
      }
    }

    setSfxEnabled(enabled) {
      this.sfxEnabled = Boolean(enabled);
      if (this.sfxBus && this.ctx) {
        const now = this.ctx.currentTime;
        this.sfxBus.gain.cancelScheduledValues(now);
        this.sfxBus.gain.setTargetAtTime(this.sfxEnabled ? 0.55 : 0, now, 0.04);
      }
    }

    async playFile(url) {
      this.stopSynth();
      this.ensureContext();
      if (!url) return false;
      try {
        if (this.audio.src !== url) {
          this.audio.src = url;
          this.audio.currentTime = 0;
        }
        this.audio.volume = Math.max(0, Math.min(1, (this.volume / 100) * 0.78));
        await this.audio.play();
        this.musicPlaying = true;
        this.playbackSource = "file";
        this.emit();
        return true;
      } catch (error) {
        this.musicPlaying = false;
        this.emit();
        return false;
      }
    }

    startSynth() {
      const ctx = this.ensureContext();
      if (!ctx) return false;

      this.pauseFileOnly();
      this.stopSynth();

      const now = ctx.currentTime;
      const session = {
        gain: ctx.createGain(),
        filter: ctx.createBiquadFilter(),
        delay: ctx.createDelay(2.4),
        feedback: ctx.createGain(),
        wet: ctx.createGain(),
        nodes: [],
        chimeTimer: null,
        active: true
      };

      session.gain.gain.setValueAtTime(0.0001, now);
      session.gain.gain.exponentialRampToValueAtTime(0.56, now + 2.4);
      session.filter.type = "lowpass";
      session.filter.frequency.value = 680;
      session.filter.Q.value = 0.72;
      session.delay.delayTime.value = 0.46;
      session.feedback.gain.value = 0.34;
      session.wet.gain.value = 0.3;

      session.filter.connect(session.gain);
      session.gain.connect(this.musicBus);
      session.filter.connect(session.delay);
      session.delay.connect(session.feedback);
      session.feedback.connect(session.delay);
      session.delay.connect(session.wet);
      session.wet.connect(this.musicBus);

      const chord = [
        { frequency: 73.42, gain: 0.034, type: "sine", detune: -4 },
        { frequency: 110.0, gain: 0.026, type: "sine", detune: 3 },
        { frequency: 146.83, gain: 0.018, type: "triangle", detune: -2 },
        { frequency: 220.0, gain: 0.009, type: "sine", detune: 4 },
        { frequency: 293.66, gain: 0.0045, type: "sine", detune: 0 }
      ];

      chord.forEach(function (tone) {
        const oscillator = ctx.createOscillator();
        const toneGain = ctx.createGain();
        oscillator.type = tone.type;
        oscillator.frequency.value = tone.frequency;
        oscillator.detune.value = tone.detune;
        toneGain.gain.value = tone.gain;
        oscillator.connect(toneGain);
        toneGain.connect(session.filter);
        oscillator.start(now);
        session.nodes.push(oscillator, toneGain);
      });

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.038;
      lfoGain.gain.value = 185;
      lfo.connect(lfoGain);
      lfoGain.connect(session.filter.frequency);
      lfo.start(now);
      session.nodes.push(lfo, lfoGain);

      const self = this;
      function scheduleChime(delay) {
        if (!session.active) return;
        session.chimeTimer = window.setTimeout(function () {
          if (!session.active) return;
          const notes = [293.66, 349.23, 392.0, 440.0, 587.33, 698.46];
          self.playChime(notes[Math.floor(Math.random() * notes.length)], session);
          scheduleChime(2900 + Math.random() * 2600);
        }, delay);
      }
      scheduleChime(2000);

      this.synthSession = session;
      this.musicPlaying = true;
      this.playbackSource = "synth";
      this.emit();
      return true;
    }

    playChime(frequency, session) {
      if (!this.ctx || !session || !session.active) return;
      const ctx = this.ctx;
      const now = ctx.currentTime + 0.02;
      const gain = ctx.createGain();
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
      oscillator.connect(gain);
      gain.connect(session.filter);
      gain.connect(session.delay);
      oscillator.start(now);
      oscillator.stop(now + 2.9);
    }

    stopSynth() {
      const session = this.synthSession;
      if (!session) return;
      session.active = false;
      this.synthSession = null;
      if (session.chimeTimer) {
        window.clearTimeout(session.chimeTimer);
        session.chimeTimer = null;
      }
      if (this.ctx) {
        const now = this.ctx.currentTime;
        try {
          session.gain.gain.cancelScheduledValues(now);
          session.gain.gain.setValueAtTime(Math.max(0.0001, session.gain.gain.value), now);
          session.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
        } catch (error) {
          // Ignore a node that was already stopped.
        }
      }
      window.setTimeout(function () {
        session.nodes.forEach(function (node) {
          try {
            if (typeof node.stop === "function") node.stop();
          } catch (error) {
            // Node has already stopped.
          }
          try { node.disconnect(); } catch (error) { /* noop */ }
        });
        try { session.gain.disconnect(); } catch (error) { /* noop */ }
        try { session.filter.disconnect(); } catch (error) { /* noop */ }
      }, 800);
    }

    pauseFileOnly() {
      if (this.audio && !this.audio.paused) {
        this.audio.pause();
      }
    }

    pauseMusic() {
      this.pauseFileOnly();
      this.stopSynth();
      this.musicPlaying = false;
      this.playbackSource = null;
      this.emit();
    }

    playTick() {
      if (!this.sfxEnabled) return;
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const frequency = 620 + Math.random() * 380;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, now + 0.035);
      gain.gain.setValueAtTime(0.038, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      oscillator.connect(gain);
      gain.connect(this.sfxBus);
      oscillator.start(now);
      oscillator.stop(now + 0.05);
    }

    playWin() {
      if (!this.sfxEnabled) return;
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime + 0.02;
      const notes = [
        { frequency: 523.25, at: 0, gain: 0.12, length: 1.2 },
        { frequency: 659.25, at: 0.09, gain: 0.1, length: 1.3 },
        { frequency: 783.99, at: 0.19, gain: 0.1, length: 1.5 },
        { frequency: 1046.5, at: 0.34, gain: 0.13, length: 2.2 },
        { frequency: 1318.51, at: 0.5, gain: 0.05, length: 1.8 }
      ];
      const self = this;

      const low = ctx.createOscillator();
      const lowGain = ctx.createGain();
      low.type = "sine";
      low.frequency.setValueAtTime(130.81, now);
      lowGain.gain.setValueAtTime(0.0001, now);
      lowGain.gain.exponentialRampToValueAtTime(0.1, now + 0.12);
      lowGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
      low.connect(lowGain);
      lowGain.connect(this.sfxBus);
      low.start(now);
      low.stop(now + 2.7);

      notes.forEach(function (note) {
        const start = now + note.at;
        const gain = ctx.createGain();
        const oscillator = ctx.createOscillator();
        const harmonic = ctx.createOscillator();
        const harmonicGain = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(note.frequency, start);
        harmonic.type = "triangle";
        harmonic.frequency.setValueAtTime(note.frequency * 2.005, start);
        harmonicGain.gain.value = 0.22;

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + note.length);

        oscillator.connect(gain);
        harmonic.connect(harmonicGain);
        harmonicGain.connect(gain);
        gain.connect(self.sfxBus);

        oscillator.start(start);
        harmonic.start(start);
        oscillator.stop(start + note.length + 0.05);
        harmonic.stop(start + note.length + 0.05);
      });
    }
  }

  NS.AudioEngine = AudioEngine;
})(window.StellarDraw = window.StellarDraw || {});
