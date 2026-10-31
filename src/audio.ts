import { ShoeFootsteps } from './footsteps';
export type OfficeSound = 'tear' | 'pin' | 'keyboard' | 'mail' | 'collection' | 'paper' | 'drawer' | 'drawer-close' | 'box' | 'place' | 'chair' | 'stamp' | 'message' | 'step' | 'distant' | 'door' | 'machine' | 'water' | 'pour' | 'shred' | 'satchel' | 'switch' | 'tab' | 'notebook' | 'notebook-close' | 'pencil' | 'mug' | 'complete' | 'tick' | 'building';
interface SoundPoint {
    x: number;
    z: number;
}
export class OfficeAudio {
    private recent = new Map<OfficeSound, number>();
    private dropped = 0;
    readonly maxVoices = 48;
    private fan?: GainNode;
    private fanOn = false;
    private fanPoint: SoundPoint = { x: 0, z: 0 };
    private context?: AudioContext;
    private master?: GainNode;
    private ambient?: GainNode;
    private volume = .3;
    private playing = false;
    private focused = true;
    private voices = new Set<AudioScheduledSourceNode>();
    private coffee?: AudioScheduledSourceNode;
    private printer?: AudioScheduledSourceNode;
    private water?: AudioScheduledSourceNode;
    private shredder?: AudioScheduledSourceNode;
    private spatial = new Set<{
        point: SoundPoint;
        gain: GainNode;
        pan: StereoPannerNode;
        variation: number;
    }>();
    private buffers = new Map<number, AudioBuffer>();
    private listener = { x: 0, z: 0, yaw: 0 };
    private last: OfficeSound | 'brew' | null = null;
    private events = 0;
    private steps = 0;
    private shoes?: ShoeFootsteps;
    start() {
        if (!this.context) {
            const ctx = this.context = new AudioContext();
            this.master = ctx.createGain();
            this.master.gain.value = this.volume * .22;
            this.master.connect(ctx.destination);
            this.ambient = ctx.createGain();
            this.ambient.gain.value = 0;
            this.ambient.connect(this.master);
            for (const [frequency, level] of [[60, .09], [120, .018]]) {
                const oscillator = ctx.createOscillator(), gain = ctx.createGain();
                oscillator.frequency.value = frequency;
                gain.gain.value = level;
                oscillator.connect(gain).connect(this.ambient);
                oscillator.start();
            }
            const air = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
            air.buffer = this.noiseBuffer(2);
            air.loop = true;
            filter.type = 'lowpass';
            filter.frequency.value = 380;
            gain.gain.value = .025;
            air.connect(filter).connect(gain).connect(this.ambient);
            air.start();
            this.fan = ctx.createGain();
            this.fan.gain.value = 0;
            this.fan.connect(this.master);
            const fanNoise = ctx.createBufferSource(), fanFilter = ctx.createBiquadFilter();
            fanNoise.buffer = this.noiseBuffer(2);
            fanNoise.loop = true;
            fanFilter.type = 'lowpass';
            fanFilter.frequency.value = 740;
            fanNoise.connect(fanFilter).connect(this.fan);
            fanNoise.start();
            this.shoes = new ShoeFootsteps(ctx, this.master, (source, started) => {
                if (started)
                    this.voices.add(source);
                else
                    this.voices.delete(source);
            });
        }
        void this.shoes?.load().catch(() => {
        });
        void this.context.resume().catch(() => {
        });
        this.levels();
    }
    private levels() {
        if (!this.context)
            return;
        const t = this.context.currentTime;
        this.master!.gain.setTargetAtTime(this.focused ? this.volume * .22 : 0, t, .06);
        this.ambient!.gain.setTargetAtTime(this.focused && this.playing ? 1 : 0, t, .2);
        this.fanLevel();
    }
    setFan(on: boolean, point: SoundPoint) {
        this.fanOn = on;
        this.fanPoint = point;
        this.fanLevel();
    }
    private fanLevel() {
        if (this.context && this.fan) {
            const distance = Math.hypot(this.fanPoint.x - this.listener.x, this.fanPoint.z - this.listener.z);
            this.fan.gain.setTargetAtTime(this.fanOn && this.focused && this.playing ? .075 / (1 + (distance / 3) ** 2) : 0, this.context.currentTime, .18);
        }
    }
    setVolume(value: number) {
        this.volume = Math.max(0, Math.min(1, value));
        this.levels();
    }
    setSceneState(playing: boolean, focused: boolean) {
        if (this.playing === playing && this.focused === focused)
            return;
        this.playing = playing;
        this.focused = focused;
        this.levels();
    }
    setListener(x: number, z: number, yaw: number) {
        this.listener.x = x;
        this.listener.z = z;
        this.listener.yaw = yaw;
        this.fanLevel();
        if (!this.context)
            return;
        for (const source of this.spatial) {
            const dx = source.point.x - x, dz = source.point.z - z, d = Math.hypot(dx, dz);
            source.pan.pan.setTargetAtTime(Math.max(-.85, Math.min(.85, (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / Math.max(d, 1))), this.context.currentTime, .04);
            source.gain.gain.setTargetAtTime(source.variation / (1 + (d / 5) ** 2), this.context.currentTime, .04);
        }
    }
    setTap(_running: boolean) {
    } // Compatibility with retired kitchen saves; there is no tap in this environment.
    private noiseBuffer(seconds: number) {
        let buffer = this.buffers.get(seconds);
        if (!buffer) {
            const ctx = this.context!;
            buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++)
                data[i] = Math.random() * 2 - 1;
            this.buffers.set(seconds, buffer);
        }
        return buffer;
    }
    private output(point?: SoundPoint) {
        const ctx = this.context!, gain = ctx.createGain(), pan = ctx.createStereoPanner(), variation = .94 + Math.random() * .12;
        gain.gain.value = variation;
        gain.connect(pan).connect(this.master!);
        const source = point ? { point: { x: point.x, z: point.z }, gain, pan, variation } : null;
        if (source) {
            this.spatial.add(source);
            this.setListener(this.listener.x, this.listener.z, this.listener.yaw);
        }
        return { gain, dispose: () => {
                if (source)
                    this.spatial.delete(source);
                gain.disconnect();
                pan.disconnect();
            } };
    }
    private noise(seconds: number, frequency: number, level: number, point?: SoundPoint, band = false) {
        const ctx = this.context!, t = ctx.currentTime, source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), envelope = ctx.createGain(), out = this.output(point);
        source.buffer = this.noiseBuffer(seconds);
        filter.type = band ? 'bandpass' : 'lowpass';
        filter.frequency.value = frequency * (.93 + Math.random() * .14);
        filter.Q.value = .65;
        envelope.gain.setValueAtTime(.001, t);
        envelope.gain.linearRampToValueAtTime(level, t + Math.min(.05, seconds / 4));
        if (seconds >= 2)
            envelope.gain.setValueAtTime(level * .85, t + seconds - .25);
        envelope.gain.exponentialRampToValueAtTime(.001, t + seconds);
        source.connect(filter).connect(envelope).connect(out.gain);
        source.onended = () => {
            source.disconnect();
            filter.disconnect();
            envelope.disconnect();
            out.dispose();
            this.voices.delete(source);
            if (this.coffee === source)
                this.coffee = undefined;
            if (this.printer === source)
                this.printer = undefined;
            if (this.water === source)
                this.water = undefined;
            if (this.shredder === source)
                this.shredder = undefined;
        };
        this.voices.add(source);
        source.start();
        return source;
    }
    private tone(frequency: number, end: number, seconds: number, level: number, point?: SoundPoint) {
        const ctx = this.context!, t = ctx.currentTime, o = ctx.createOscillator(), gain = ctx.createGain(), out = this.output(point);
        o.type = 'triangle';
        o.frequency.setValueAtTime(frequency, t);
        o.frequency.exponentialRampToValueAtTime(end, t + seconds);
        gain.gain.setValueAtTime(level, t);
        gain.gain.exponentialRampToValueAtTime(.001, t + seconds);
        o.connect(gain).connect(out.gain);
        this.voices.add(o);
        o.onended = () => {
            o.disconnect();
            gain.disconnect();
            out.dispose();
            this.voices.delete(o);
        };
        o.start();
        o.stop(t + seconds + .01);
    }
    stopMachines() {
        this.stopBrew();
        try {
            this.printer?.stop();
        }
        catch {
        }
        this.printer = undefined;
        for (const source of [this.water, this.shredder])
            try {
                source?.stop();
            }
            catch {
            }
        this.water = this.shredder = undefined;
    }
    stopBrew() {
        try {
            this.coffee?.stop();
        }
        catch {
        }
        this.coffee = undefined;
    }
    brew(point?: SoundPoint) {
        this.start();
        this.stopBrew();
        if (this.voices.size > this.maxVoices - 3)
            return;
        this.last = 'brew';
        this.events++;
        this.coffee = this.noise(5, 620, .3, point, true);
        this.tone(95, 60, .25, .13, point);
    }
    footstep(running = false) {
        if (!this.context || this.context.state !== 'running' || !this.focused || this.voices.size > this.maxVoices - 4)
            return;
        this.last = 'step';
        this.events++;
        this.steps++;
        if (!this.shoes?.play(running))
            this.noise(.065, 1500, .18, undefined, true);
    }
    sound(type: OfficeSound, point?: SoundPoint) {
        if (type === 'step') {
            this.footstep();
            return;
        }
        if (!this.context || this.context.state !== 'running' || !this.focused)
            return;
        const now = this.context.currentTime, previous = this.recent.get(type) ?? -Infinity;
        if (now - previous < (type === 'tick' ? .8 : type === 'message' ? .18 : .055) || this.voices.size > this.maxVoices - 3) {
            this.dropped++;
            return;
        }
        this.recent.set(type, now);
        this.last = type;
        this.events++;
        switch (type) {
            case 'tear': this.noise(.32, 2600, .18, point, true); break;
            case 'pin': this.noise(.045, 1700, .15, point); this.tone(210, 120, .04, .05, point); break;
            case 'keyboard': this.noise(.025, 1600, .06, point); break;
            case 'mail': this.tone(630, 840, .13, .09, point); break;
            case 'collection': this.noise(.08, 900, .12, point); this.tone(430, 570, .15, .12, point); break;
            case 'drawer':
                this.noise(.38, 1450, .38, point, true);
                this.tone(170, 75, .2, .22, point);
                break;
            case 'drawer-close':
                this.noise(.13, 480, .4, point);
                this.tone(110, 48, .18, .3, point);
                break;
            case 'box':
                this.noise(.45, 2200, .27, point, true);
                this.tone(85, 48, .12, .12, point);
                break;
            case 'paper':
                this.noise(.13 + Math.random() * .09, 2800 + Math.random() * 1200, .19, point, true);
                break;
            case 'tab':
                this.noise(.08, 2400, .16, point, true);
                this.tone(130, 90, .06, .06, point);
                break;
            case 'notebook':
                this.noise(.3, 1700, .2, point, true);
                this.tone(95, 65, .12, .09, point);
                break;
            case 'notebook-close':
                this.noise(.13, 800, .23, point);
                break;
            case 'pencil':
                this.noise(.1, 3900, .09, point, true);
                break;
            case 'mug':
                this.tone(950, 650, .13, .065, point);
                this.noise(.045, 1000, .1, point);
                break;
            case 'complete':
                this.tone(430, 520, .14, .065, point);
                break;
            case 'tick':
                this.noise(.018, 2600, .045, point, true);
                break;
            case 'building':
                this.noise(.7, 180 + Math.random() * 170, .065, point, true);
                break;
            case 'place':
                this.noise(.12, 1600, .28, point);
                this.tone(160, 85, .1, .12, point);
                break;
            case 'chair':
                this.noise(.3, 700, .23, point, true);
                this.tone(210, 130, .2, .1, point);
                break;
            case 'pour':
                this.water = this.noise(2, 2100, .38, point, true);
                break;
            case 'shred':
                this.shredder = this.noise(2.2, 850, .4, point, true);
                this.tone(95, 65, .25, .2, point);
                break;
            case 'satchel':
                this.noise(.22, 2200, .32, point, true);
                break;
            case 'switch':
                this.noise(.06, 1600, .12, point);
                break;
            case 'door':
                this.noise(.45, 520, .34, point);
                this.tone(135, 62, .32, .18, point);
                break;
            case 'machine':
                this.printer = this.noise(4, 1150, .23, point, true);
                this.tone(170, 100, .18, .12, point);
                break;
            case 'water':
                this.noise(.45, 1900, .13, point, true);
                break;
            case 'distant':
                this.noise(.9, 300, .09, point);
                this.tone(95, 75, .8, .06, point);
                break;
            case 'stamp':
                this.noise(.08, 500, .28, point);
                this.tone(140, 55, .15, .25, point);
                break;
            case 'message':
                this.tone(620, 440, .12, .09, point);
                break;
        }
    }
    stats() {
        return { dropped: this.dropped, maxVoices: this.maxVoices, state: this.context?.state ?? 'idle', steps: this.steps, footsteps: this.shoes?.stats() ?? { samples: 0, echoSeconds: 0, active: 0, lastSample: null }, voices: this.voices.size, ambient: this.playing && this.focused, focused: this.focused, volume: this.volume, masterGain: this.master?.gain.value ?? 0, ambientGain: this.ambient?.gain.value ?? 0, last: this.last, events: this.events };
    }
}
