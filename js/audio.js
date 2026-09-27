/* ==========================================================================
   Audio Synthesizer - Page-Turn Sound & Ambient Reading Focus Engine
   ========================================================================== */

class PageFlipAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.ambientEnabled = false;
        this.ambientNode = null;
        this.ambientGain = null;
    }

    initCtx() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    toggleAmbientSound() {
        this.initCtx();
        if (!this.ctx) return false;

        this.ambientEnabled = !this.ambientEnabled;

        if (this.ambientEnabled) {
            this.startAmbientRain();
        } else {
            this.stopAmbientRain();
        }
        return this.ambientEnabled;
    }

    startAmbientRain() {
        if (!this.ctx || this.ambientNode) return;
        const now = this.ctx.currentTime;

        // Generate 5-second looping soft rain noise buffer
        const bufferSize = this.ctx.sampleRate * 5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Pink noise filter curve
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
        }

        this.ambientNode = this.ctx.createBufferSource();
        this.ambientNode.buffer = buffer;
        this.ambientNode.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);

        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.001, now);
        this.ambientGain.gain.linearRampToValueAtTime(0.12, now + 1.5); // Soft fade in

        this.ambientNode.connect(filter);
        filter.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);

        this.ambientNode.start(now);
    }

    stopAmbientRain() {
        if (this.ambientNode && this.ambientGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.ambientGain.gain.linearRampToValueAtTime(0.001, now + 1.0); // Soft fade out
            setTimeout(() => {
                if (this.ambientNode) {
                    try { this.ambientNode.stop(); } catch (e) {}
                    this.ambientNode.disconnect();
                    this.ambientNode = null;
                }
            }, 1000);
        }
    }

    playPageTurnSound() {
        if (!this.enabled) return;

        try {
            this.initCtx();
            if (!this.ctx) return;

            const now = this.ctx.currentTime;
            
            // Layer 1: Paper Friction Sweep
            const duration = 0.22;
            const bufferSize = Math.floor(this.ctx.sampleRate * duration);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                const t = i / bufferSize;
                const envelope = Math.sin(t * Math.PI) * Math.exp(-t * 1.5);
                data[i] = (Math.random() * 2 - 1) * envelope;
            }

            const noiseNode = this.ctx.createBufferSource();
            noiseNode.buffer = buffer;

            const sweepFilter = this.ctx.createBiquadFilter();
            sweepFilter.type = 'bandpass';
            sweepFilter.frequency.setValueAtTime(1600, now);
            sweepFilter.frequency.exponentialRampToValueAtTime(320, now + duration);
            sweepFilter.Q.setValueAtTime(1.4, now);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.001, now);
            noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.03);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noiseNode.connect(sweepFilter);
            sweepFilter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noiseNode.start(now);
            noiseNode.stop(now + duration);

            // Layer 2: Soft Paper Landing Thump
            const thumpOsc = this.ctx.createOscillator();
            const thumpGain = this.ctx.createGain();

            thumpOsc.type = 'triangle';
            thumpOsc.frequency.setValueAtTime(110, now + 0.12);
            thumpOsc.frequency.exponentialRampToValueAtTime(35, now + duration);

            thumpGain.gain.setValueAtTime(0.001, now + 0.12);
            thumpGain.gain.linearRampToValueAtTime(0.22, now + 0.15);
            thumpGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            thumpOsc.connect(thumpGain);
            thumpGain.connect(this.ctx.destination);

            thumpOsc.start(now + 0.12);
            thumpOsc.stop(now + duration);

        } catch (e) {
            console.warn('Audio playback prevented or unsupported:', e);
        }
    }
}

window.pageFlipAudio = new PageFlipAudio();
