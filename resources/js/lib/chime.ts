/**
 * Pure Web Audio API chime synthesizer for doctor call-in and queue notifications.
 * Works without external MP3 files and without network delay.
 */
export function playCallChime() {
    try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const playTone = (freq: number, start: number, duration: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + duration);
        };

        // Hospital chime: High melodic sequence (E5 -> G#5 -> B5)
        playTone(659.25, 0, 0.35);
        playTone(830.61, 0.22, 0.4);
        playTone(987.77, 0.45, 0.7);
    } catch {
        // Ignored if browser blocks auto-play
    }
}
