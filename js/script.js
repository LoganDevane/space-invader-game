/* ============================================================
   INVINCIBLE: VILTRUMITE ASSAULT v2.0 — THRAGG UPDATE
   Advanced Game Engine with Background Music, Power-ups,
   Combo System, 4 Levels, and Advanced Visual Effects
   ============================================================ */
 
// ===== DOM REFERENCES =====
const screens = {
    start: document.getElementById('start-screen'),
    instructions: document.getElementById('instructions-screen'),
    name: document.getElementById('name-screen'),
    game: document.getElementById('game-screen'),
    gameover: document.getElementById('gameover-screen'),
    victory: document.getElementById('victory-screen'),
    leaderboard: document.getElementById('leaderboard-screen'),
};
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const hudScore = document.getElementById('hud-score');
const hudLevel = document.getElementById('hud-level');
const hudLives = document.getElementById('hud-lives');
const hudAmmo = document.getElementById('hud-ammo');
const hudMsg = document.getElementById('hud-message');
const hudCombo = document.getElementById('hud-combo');
 
// ===== PARALLAX STAR BACKGROUND (Canvas) =====
const bgCanvas = document.getElementById('bg-canvas');
const bgCtx = bgCanvas.getContext('2d');
const starLayers = [[], [], []];
let bgFrame = 0;
 
function initBgCanvas() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    starLayers.forEach(l => l.length = 0);
    // Layer 0: far stars (small, slow)
    for (let i = 0; i < 100; i++) {
        starLayers[0].push({ x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, size: Math.random() * 1.2 + 0.4, speed: 0.15, alpha: Math.random() * 0.5 + 0.2 });
    }
    // Layer 1: mid stars
    for (let i = 0; i < 60; i++) {
        starLayers[1].push({ x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, size: Math.random() * 1.8 + 0.8, speed: 0.4, alpha: Math.random() * 0.6 + 0.3 });
    }
    // Layer 2: close stars (big, fast)
    for (let i = 0; i < 25; i++) {
        starLayers[2].push({ x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, size: Math.random() * 2.5 + 1.5, speed: 0.8, alpha: Math.random() * 0.7 + 0.3 });
    }
}
 
// Nebula colors that shift based on current level
const nebulaColors = [
    { r: 30, g: 58, b: 95 },   // default blue
    { r: 20, g: 80, b: 40 },   // level 1 green-ish
    { r: 120, g: 40, b: 20 },  // level 2 orange
    { r: 100, g: 20, b: 20 },  // level 3 red (Omni-Man)
    { r: 80, g: 20, b: 100 },  // level 4 purple (Thragg)
];
let currentNebula = 0;
 
function renderBg() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgFrame++;
 
    // Nebula glow
    const nc = nebulaColors[currentNebula];
    const pulse = Math.sin(bgFrame * 0.005) * 0.3 + 0.7;
    const grd = bgCtx.createRadialGradient(
        bgCanvas.width * 0.5 + Math.sin(bgFrame * 0.002) * 100,
        bgCanvas.height * 0.4 + Math.cos(bgFrame * 0.003) * 50,
        0, bgCanvas.width / 2, bgCanvas.height / 2, bgCanvas.width * 0.8
    );
    grd.addColorStop(0, `rgba(${nc.r},${nc.g},${nc.b},${0.08 * pulse})`);
    grd.addColorStop(0.5, `rgba(${nc.r},${nc.g},${nc.b},${0.03 * pulse})`);
    grd.addColorStop(1, 'transparent');
    bgCtx.fillStyle = grd;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
 
    // Second nebula
    const grd2 = bgCtx.createRadialGradient(
        bgCanvas.width * 0.3 + Math.cos(bgFrame * 0.0015) * 80,
        bgCanvas.height * 0.7 + Math.sin(bgFrame * 0.002) * 60,
        0, bgCanvas.width / 2, bgCanvas.height / 2, bgCanvas.width * 0.6
    );
    grd2.addColorStop(0, `rgba(${nc.r + 30},${nc.g},${nc.b + 20},${0.05 * pulse})`);
    grd2.addColorStop(1, 'transparent');
    bgCtx.fillStyle = grd2;
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
 
    // Stars
    starLayers.forEach(layer => {
        layer.forEach(star => {
            star.y += star.speed;
            if (star.y > bgCanvas.height) { star.y = -2; star.x = Math.random() * bgCanvas.width; }
            const twinkle = Math.sin(bgFrame * 0.03 + star.x) * 0.3 + 0.7;
            bgCtx.globalAlpha = star.alpha * twinkle;
            bgCtx.fillStyle = '#fff';
            bgCtx.beginPath();
            bgCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            bgCtx.fill();
        });
    });
    bgCtx.globalAlpha = 1;
 
    requestAnimationFrame(renderBg);
}
 
initBgCanvas();
renderBg();
window.addEventListener('resize', () => { bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight; });
 
// ===== ADVANCED AUDIO ENGINE =====
const AudioEngine = {
    ctx: null,
    musicGain: null,
    sfxGain: null,
    musicNodes: [],
    musicEnabled: true,
    _menuMusic: null,
    _battleMusic: null,
    _currentMusic: null,
 
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.1;
        this.musicGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.12;
        this.sfxGain.connect(this.ctx.destination);
    },
 
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        document.getElementById('audio-toggle').textContent = this.musicEnabled ? '🔊' : '🔇';
        if (this.musicEnabled) {
            this.musicGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        } else {
            this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
        }
    },
 
    playTone(freq, duration, type = 'square', gainVal = 0.12) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
 
    shoot() {
        this.playTone(880, 0.08, 'square', 0.1);
        this.playTone(1200, 0.06, 'sine', 0.06);
    },
    enemyShoot() { this.playTone(200, 0.12, 'sawtooth', 0.06); },
    hit() {
        this.playTone(150, 0.15, 'sawtooth', 0.15);
        this.playTone(100, 0.2, 'square', 0.1);
    },
    explosion() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.35;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = buffer;
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        src.connect(gain);
        gain.connect(this.sfxGain);
        src.start();
    },
    playerHit() {
        this.playTone(80, 0.35, 'sawtooth', 0.2);
        this.playTone(60, 0.4, 'square', 0.15);
    },
    powerUp() {
        [784, 988, 1319, 1568].forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.12, 'sine', 0.1), i * 80);
        });
    },
    levelUp() {
        [523, 659, 784, 1047].forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.18, 'square', 0.12), i * 160);
        });
    },
    gameOver() {
        [400, 300, 200].forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.35, 'sawtooth', 0.15), i * 300);
        });
    },
    victory() {
        [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.18, 'square', 0.1), i * 130);
        });
    },
    bossWarning() {
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playTone(120, 0.15, 'sawtooth', 0.15);
                this.playTone(60, 0.2, 'square', 0.1);
            }, i * 250);
        }
    },
    buttonClick() { this.playTone(600, 0.05, 'square', 0.06); },
 
    // ===== PERSISTENT BACKGROUND MUSIC =====
    startMenuMusic() {
        this.stopAllMusic();
        if (!this.ctx) return;
        this._currentMusic = 'menu';
 
        // Dreamy ambient pad
        const notes = [
            { freq: 130.81, dur: 2.0 },  // C3
            { freq: 146.83, dur: 2.0 },  // D3
            { freq: 164.81, dur: 2.0 },  // E3
            { freq: 174.61, dur: 2.0 },  // F3
            { freq: 196.00, dur: 2.0 },  // G3
            { freq: 164.81, dur: 2.0 },  // E3
        ];
        let noteIdx = 0;
        const playNext = () => {
            if (this._currentMusic !== 'menu') return;
            const n = notes[noteIdx % notes.length];
            // Pad sound
            ['sine', 'triangle'].forEach(type => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.value = n.freq;
                gain.gain.setValueAtTime(0, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.3);
                gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + n.dur - 0.3);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + n.dur);
                osc.connect(gain);
                gain.connect(this.musicGain);
                osc.start();
                osc.stop(this.ctx.currentTime + n.dur);
            });
 
            // Sub bass
            const bass = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bass.type = 'sine';
            bass.frequency.value = n.freq / 2;
            bassGain.gain.setValueAtTime(0, this.ctx.currentTime);
            bassGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.2);
            bassGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + n.dur);
            bass.connect(bassGain);
            bassGain.connect(this.musicGain);
            bass.start();
            bass.stop(this.ctx.currentTime + n.dur);
 
            noteIdx++;
            this._menuTimer = setTimeout(playNext, n.dur * 1000 - 100);
        };
        playNext();
    },
 
    startBattleMusic(level) {
        this.stopAllMusic();
        if (!this.ctx) return;
        this._currentMusic = 'battle';
 
        const bpm = 120 + (level - 1) * 15;
        const beatDur = 60 / bpm;
 
        // Bass pattern per level
        const bassPatterns = [
            [65, 65, 82, 73, 65, 82, 98, 87],         // Level 1: mellow
            [73, 73, 98, 87, 73, 98, 110, 98],         // Level 2: tense
            [55, 55, 73, 65, 55, 73, 87, 65],          // Level 3: dark
            [49, 49, 65, 55, 49, 65, 73, 55],          // Level 4: menacing
        ];
 
        const pattern = bassPatterns[Math.min(level - 1, 3)];
        let beatIdx = 0;
 
        const playBeat = () => {
            if (this._currentMusic !== 'battle') return;
 
            const freq = pattern[beatIdx % pattern.length];
 
            // Bass
            const bass = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bass.type = 'triangle';
            bass.frequency.value = freq;
            bassGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + beatDur * 0.9);
            bass.connect(bassGain);
            bassGain.connect(this.musicGain);
            bass.start();
            bass.stop(this.ctx.currentTime + beatDur);
 
            // Kick on beats 0, 4
            if (beatIdx % 4 === 0) {
                const kick = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kick.type = 'sine';
                kick.frequency.setValueAtTime(150, this.ctx.currentTime);
                kick.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.15);
                kickGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
                kickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
                kick.connect(kickGain);
                kickGain.connect(this.musicGain);
                kick.start();
                kick.stop(this.ctx.currentTime + 0.2);
            }
 
            // Hi-hat on off-beats
            if (beatIdx % 2 === 1) {
                const bufSize = this.ctx.sampleRate * 0.05;
                const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
                const d = buf.getChannelData(0);
                for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
                const hh = this.ctx.createBufferSource();
                const hhGain = this.ctx.createGain();
                hh.buffer = buf;
                hhGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
                hhGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                hh.connect(hhGain);
                hhGain.connect(this.musicGain);
                hh.start();
            }
 
            // Melody flourish every 8 beats for levels 3+
            if (level >= 3 && beatIdx % 8 === 0) {
                const melodyFreqs = level === 4 ? [196, 233, 261, 311] : [220, 261, 330, 392];
                melodyFreqs.forEach((mf, mi) => {
                    setTimeout(() => {
                        if (this._currentMusic !== 'battle') return;
                        this.playTone(mf, 0.15, 'sine', 0.03);
                    }, mi * 100);
                });
            }
 
            beatIdx++;
            this._battleTimer = setTimeout(playBeat, beatDur * 1000);
        };
        playBeat();
    },
 
    stopAllMusic() {
        this._currentMusic = null;
        clearTimeout(this._menuTimer);
        clearTimeout(this._battleTimer);
    }
};
 
// Audio toggle button
document.getElementById('audio-toggle').addEventListener('click', () => {
    AudioEngine.init();
    AudioEngine.toggleMusic();
});
 
// ===== SCREEN MANAGEMENT =====
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
    screens[name].style.animation = 'none';
    screens[name].offsetHeight;
    screens[name].style.animation = '';
}
 
// ===== LEADERBOARD (localStorage) =====
const Leaderboard = {
    KEY: 'invincible_leaderboard_v2',
    MAX_ENTRIES: 20,
    getScores() {
        try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
        catch { return []; }
    },
    saveScore(name, score, level, kills) {
        const scores = this.getScores();
        const now = new Date();
        if (scores.find(s => s.name === name && s.score === score && (now - new Date(s.timestamp)) < 10000)) return false;
        scores.push({ name, score, level, kills, timestamp: now.toISOString() });
        scores.sort((a, b) => b.score - a.score);
        if (scores.length > this.MAX_ENTRIES) scores.length = this.MAX_ENTRIES;
        localStorage.setItem(this.KEY, JSON.stringify(scores));
        return true;
    },
    render() {
        const list = document.getElementById('leaderboard-list');
        const empty = document.getElementById('lb-empty');
        const scores = this.getScores();
        list.innerHTML = '';
        if (scores.length === 0) { empty.classList.remove('hidden'); return; }
        empty.classList.add('hidden');
        scores.forEach((entry, i) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            const d = new Date(entry.timestamp);
            row.innerHTML = `
                <span class="lb-rank">#${i + 1}</span>
                <span class="lb-name">${escapeHtml(entry.name)}</span>
                <span class="lb-score">${entry.score.toLocaleString()}</span>
                <span class="lb-date">${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}</span>`;
            list.appendChild(row);
        });
    }
};
 
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
 
// ===== LEVEL CONFIGURATION =====
const LEVEL_CONFIG = [
    {
        level: 1, title: 'LEVEL 1', desc: 'Viltrumite Scouts Detected!',
        rows: 3, cols: 7, enemySpeed: 1, enemyDropSpeed: 20,
        enemyShoots: false, enemyShootChance: 0, ammo: Infinity,
        bossLevel: false, enemyHP: 1, pointsPerKill: 100,
        powerUpChance: 0.08,
    },
    {
        level: 2, title: 'LEVEL 2', desc: 'Viltrumite Warriors Incoming!',
        rows: 4, cols: 8, enemySpeed: 1.5, enemyDropSpeed: 25,
        enemyShoots: true, enemyShootChance: 0.003, ammo: 100,
        bossLevel: false, enemyHP: 2, pointsPerKill: 200,
        powerUpChance: 0.1,
    },
    {
        level: 3, title: 'LEVEL 3', desc: 'OMNI-MAN HAS ARRIVED!',
        rows: 2, cols: 5, enemySpeed: 2, enemyDropSpeed: 30,
        enemyShoots: true, enemyShootChance: 0.005, ammo: 80,
        bossLevel: true, enemyHP: 2, pointsPerKill: 150,
        bossHP: 25, bossName: 'OMNI-MAN', powerUpChance: 0.12,
    },
    {
        level: 4, title: 'LEVEL 4', desc: 'THRAGG — Grand Regent of Viltrum!',
        rows: 3, cols: 6, enemySpeed: 2.5, enemyDropSpeed: 35,
        enemyShoots: true, enemyShootChance: 0.007, ammo: 60,
        bossLevel: true, enemyHP: 3, pointsPerKill: 400,
        bossHP: 80, bossName: 'THRAGG', powerUpChance: 0.15,
        thragg: true,
    }
];
 
// ===== DRAWING HELPERS =====
function drawPlayer(x, y, w, h, shieldActive, frame) {
    ctx.save();
    // Body
    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(x + w * 0.2, y + h * 0.3, w * 0.6, h * 0.6);
    // Head
    ctx.fillStyle = '#F5C6A0';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.25, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Mask
    ctx.fillStyle = '#1E3A5F';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.25, w * 0.2, 0, Math.PI, true);
    ctx.fill();
    // Yellow "I" emblem
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + w * 0.42, y + h * 0.4, w * 0.16, h * 0.35);
    // Cape
    ctx.fillStyle = '#FFD700';
    const capeWave = Math.sin(frame * 0.1) * 5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.35);
    ctx.lineTo(x - 5 + capeWave, y + h + 5);
    ctx.lineTo(x + w * 0.25, y + h * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.85, y + h * 0.35);
    ctx.lineTo(x + w + 5 - capeWave, y + h + 5);
    ctx.lineTo(x + w * 0.75, y + h * 0.8);
    ctx.closePath();
    ctx.fill();
    // Glowing eyes
    ctx.fillStyle = '#00E5FF';
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 10;
    ctx.fillRect(x + w * 0.35, y + h * 0.2, w * 0.08, h * 0.06);
    ctx.fillRect(x + w * 0.57, y + h * 0.2, w * 0.08, h * 0.06);
    ctx.shadowBlur = 0;
    // Arms
    ctx.fillStyle = '#1E3A5F';
    ctx.fillRect(x + w * 0.05, y + h * 0.35, w * 0.15, h * 0.35);
    ctx.fillRect(x + w * 0.8, y + h * 0.35, w * 0.15, h * 0.35);
    // Gloves
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + w * 0.05, y + h * 0.6, w * 0.15, h * 0.1);
    ctx.fillRect(x + w * 0.8, y + h * 0.6, w * 0.15, h * 0.1);
 
    // Engine trail
    const trailFlicker = Math.sin(frame * 0.3) * 3;
    ctx.fillStyle = '#00E5FF';
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35, y + h);
    ctx.lineTo(x + w / 2, y + h + 15 + trailFlicker);
    ctx.lineTo(x + w * 0.65, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
 
    // Shield bubble
    if (shieldActive) {
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 20;
        ctx.globalAlpha = 0.4 + Math.sin(frame * 0.1) * 0.2;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.7, h * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}
 
function drawEnemy(x, y, w, h, type, hp, maxHP, frame) {
    const dmg = hp / maxHP;
    ctx.save();
    if (type === 'scout') {
        ctx.fillStyle = `rgb(${Math.floor(180 * dmg + 75)}, ${Math.floor(180 * dmg + 75)}, ${Math.floor(180 * dmg + 75)})`;
        ctx.fillRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.7);
        ctx.strokeStyle = '#C62828';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y + h * 0.3);
        ctx.lineTo(x + w * 0.5, y + h * 0.65);
        ctx.lineTo(x + w * 0.7, y + h * 0.3);
        ctx.stroke();
        ctx.fillStyle = '#C62828';
        ctx.shadowColor = '#C62828';
        ctx.shadowBlur = 6;
        ctx.fillRect(x + w * 0.28, y + h * 0.25, w * 0.12, h * 0.08);
        ctx.fillRect(x + w * 0.6, y + h * 0.25, w * 0.12, h * 0.08);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y + h * 0.52);
        ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.6, x + w * 0.7, y + h * 0.52);
        ctx.stroke();
    } else if (type === 'warrior') {
        ctx.fillStyle = `rgb(${Math.floor(120 * dmg + 60)}, ${Math.floor(60 * dmg + 30)}, ${Math.floor(60 * dmg + 30)})`;
        ctx.fillRect(x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.7);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.25, y + h * 0.25);
        ctx.lineTo(x + w * 0.5, y + h * 0.65);
        ctx.lineTo(x + w * 0.75, y + h * 0.25);
        ctx.stroke();
        ctx.fillStyle = '#FF4444';
        ctx.shadowColor = '#FF4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(x + w * 0.25, y + h * 0.2, w * 0.15, h * 0.1);
        ctx.fillRect(x + w * 0.6, y + h * 0.2, w * 0.15, h * 0.1);
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#8B0000';
        ctx.beginPath(); ctx.moveTo(x, y + h * 0.2); ctx.lineTo(x + w * 0.15, y + h * 0.5); ctx.lineTo(x + w * 0.15, y + h * 0.2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + w, y + h * 0.2); ctx.lineTo(x + w * 0.85, y + h * 0.5); ctx.lineTo(x + w * 0.85, y + h * 0.2); ctx.closePath(); ctx.fill();
    } else if (type === 'elite') {
        // Thragg's elite guards (purple)
        ctx.fillStyle = `rgb(${Math.floor(80 * dmg + 40)}, ${Math.floor(20 * dmg + 15)}, ${Math.floor(100 * dmg + 55)})`;
        ctx.fillRect(x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8);
        ctx.strokeStyle = '#E040FB';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + w * 0.12, y + h * 0.12, w * 0.76, h * 0.76);
        // Crown/crest
        ctx.fillStyle = '#E040FB';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y + h * 0.15);
        ctx.lineTo(x + w * 0.4, y);
        ctx.lineTo(x + w * 0.5, y + h * 0.12);
        ctx.lineTo(x + w * 0.6, y);
        ctx.lineTo(x + w * 0.7, y + h * 0.15);
        ctx.closePath();
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#E040FB';
        ctx.shadowColor = '#E040FB';
        ctx.shadowBlur = 12;
        ctx.fillRect(x + w * 0.25, y + h * 0.3, w * 0.15, h * 0.1);
        ctx.fillRect(x + w * 0.6, y + h * 0.3, w * 0.15, h * 0.1);
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}
 
function drawBoss(x, y, w, h, hp, maxHP, frame, isThragg) {
    const dmg = hp / maxHP;
    ctx.save();
 
    if (isThragg) {
        // === THRAGG — Grand Regent ===
        // Body - purple/black armor
        ctx.fillStyle = '#1A0A2E';
        ctx.fillRect(x + w * 0.15, y + h * 0.2, w * 0.7, h * 0.65);
 
        // Purple armor details
        const pr = Math.floor(120 * dmg + 40);
        ctx.fillStyle = `rgb(${pr}, 20, ${Math.floor(160 * dmg + 40)})`;
        ctx.fillRect(x + w * 0.2, y + h * 0.25, w * 0.6, h * 0.5);
 
        // Viltrumite emblem (larger, ornate)
        ctx.strokeStyle = '#E040FB';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y + h * 0.3);
        ctx.lineTo(x + w / 2, y + h * 0.6);
        ctx.lineTo(x + w * 0.7, y + h * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.45, w * 0.08, 0, Math.PI * 2);
        ctx.stroke();
 
        // Head
        ctx.fillStyle = '#D4A574';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.15, w * 0.2, 0, Math.PI * 2);
        ctx.fill();
 
        // White/grey hair
        ctx.fillStyle = '#CCCCCC';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.11, w * 0.2, Math.PI, 0, false);
        ctx.fill();
 
        // Thragg's distinctive handlebar mustache
        ctx.fillStyle = '#999';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.38, y + h * 0.17);
        ctx.quadraticCurveTo(x + w * 0.3, y + h * 0.22, x + w * 0.25, y + h * 0.19);
        ctx.moveTo(x + w * 0.62, y + h * 0.17);
        ctx.quadraticCurveTo(x + w * 0.7, y + h * 0.22, x + w * 0.75, y + h * 0.19);
        ctx.strokeStyle = '#999';
        ctx.stroke();
 
        // Glowing purple eyes
        const eyePulse = Math.sin(frame * 0.08) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(224, 64, 251, ${eyePulse})`;
        ctx.shadowColor = '#E040FB';
        ctx.shadowBlur = 20;
        ctx.fillRect(x + w * 0.37, y + h * 0.12, w * 0.09, h * 0.04);
        ctx.fillRect(x + w * 0.54, y + h * 0.12, w * 0.09, h * 0.04);
        ctx.shadowBlur = 0;
 
        // Shoulder spikes
        ctx.fillStyle = '#2D1050';
        for (let side = -1; side <= 1; side += 2) {
            const sx = side < 0 ? x + w * 0.08 : x + w * 0.82;
            ctx.beginPath();
            ctx.moveTo(sx, y + h * 0.25);
            ctx.lineTo(sx + side * w * 0.1, y + h * 0.15);
            ctx.lineTo(sx + side * w * 0.05, y + h * 0.45);
            ctx.closePath();
            ctx.fill();
        }
 
        // Flowing cape (purple, more dramatic)
        const capeWave = Math.sin(frame * 0.04) * 15;
        ctx.fillStyle = '#6A0DAD';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.1, y + h * 0.25);
        ctx.quadraticCurveTo(x - w * 0.15 + capeWave, y + h * 0.7, x - w * 0.05, y + h + 15);
        ctx.lineTo(x + w * 0.2, y + h * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w * 0.9, y + h * 0.25);
        ctx.quadraticCurveTo(x + w * 1.15 - capeWave, y + h * 0.7, x + w * 1.05, y + h + 15);
        ctx.lineTo(x + w * 0.8, y + h * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
 
        // Aura effect
        ctx.strokeStyle = `rgba(224, 64, 251, ${0.3 + Math.sin(frame * 0.05) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#E040FB';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h * 0.45, w * 0.55 + Math.sin(frame * 0.03) * 5, h * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
 
        // Fists
        const fistOff = Math.sin(frame * 0.08) * 6;
        ctx.fillStyle = '#D4A574';
        ctx.beginPath(); ctx.arc(x + w * 0.05, y + h * 0.55 + fistOff, w * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w * 0.95, y + h * 0.55 - fistOff, w * 0.08, 0, Math.PI * 2); ctx.fill();
 
    } else {
        // === OMNI-MAN ===
        ctx.fillStyle = '#DDDDDD';
        ctx.fillRect(x + w * 0.15, y + h * 0.2, w * 0.7, h * 0.65);
        const rr = Math.floor(198 * dmg + 57);
        ctx.fillStyle = `rgb(${rr}, ${Math.floor(40 * dmg)}, ${Math.floor(40 * dmg)})`;
        ctx.fillRect(x + w * 0.25, y + h * 0.25, w * 0.5, h * 0.4);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.45, w * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#F5C6A0';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.15, w * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.35, y + h * 0.17);
        ctx.quadraticCurveTo(x + w * 0.42, y + h * 0.22, x + w * 0.5, y + h * 0.17);
        ctx.quadraticCurveTo(x + w * 0.58, y + h * 0.22, x + w * 0.65, y + h * 0.17);
        ctx.quadraticCurveTo(x + w * 0.58, y + h * 0.24, x + w * 0.5, y + h * 0.2);
        ctx.quadraticCurveTo(x + w * 0.42, y + h * 0.24, x + w * 0.35, y + h * 0.17);
        ctx.fill();
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.12, w * 0.18, Math.PI, 0, false);
        ctx.fill();
        ctx.fillStyle = '#FF0000';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 15;
        ctx.fillRect(x + w * 0.38, y + h * 0.11, w * 0.08, h * 0.04);
        ctx.fillRect(x + w * 0.55, y + h * 0.11, w * 0.08, h * 0.04);
        ctx.shadowBlur = 0;
        const capeWave = Math.sin(frame * 0.05) * 10;
        ctx.fillStyle = '#C62828';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.1, y + h * 0.25);
        ctx.quadraticCurveTo(x - w * 0.1 + capeWave, y + h * 0.7, x, y + h + 10);
        ctx.lineTo(x + w * 0.2, y + h * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w * 0.9, y + h * 0.25);
        ctx.quadraticCurveTo(x + w * 1.1 - capeWave, y + h * 0.7, x + w, y + h + 10);
        ctx.lineTo(x + w * 0.8, y + h * 0.8);
        ctx.closePath();
        ctx.fill();
        const fistOff = Math.sin(frame * 0.08) * 5;
        ctx.fillStyle = '#F5C6A0';
        ctx.beginPath(); ctx.arc(x + w * 0.08, y + h * 0.55 + fistOff, w * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + w * 0.92, y + h * 0.55 - fistOff, w * 0.08, 0, Math.PI * 2); ctx.fill();
    }
 
    // Boss HP bar
    const barW = w * 0.9;
    const barH = 8;
    const barX = x + w * 0.05;
    const barY = y - 16;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barW, barH);
    const hpColor = isThragg
        ? (dmg > 0.5 ? '#9C27B0' : dmg > 0.25 ? '#E040FB' : '#FF4081')
        : (dmg > 0.5 ? '#C62828' : dmg > 0.25 ? '#FF8F00' : '#FF0000');
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * dmg, barH);
    ctx.strokeStyle = isThragg ? '#E040FB' : '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
 
    // Boss name
    ctx.font = "bold 10px 'Orbitron', sans-serif";
    ctx.fillStyle = isThragg ? '#E040FB' : '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(isThragg ? 'THRAGG' : 'OMNI-MAN', x + w / 2, barY - 4);
    ctx.textAlign = 'start';
 
    ctx.restore();
}
 
// Power-up drawing
function drawPowerUp(x, y, w, h, type, frame) {
    ctx.save();
    const bob = Math.sin(frame * 0.08) * 3;
    const glow = Math.sin(frame * 0.1) * 0.3 + 0.7;
 
    const colors = { rapid: '#FFD700', shield: '#00E5FF', spread: '#FF4081' };
    const symbols = { rapid: '⚡', shield: '🛡', spread: '✦' };
    const color = colors[type];
 
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 * glow;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
 
    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + bob);
    ctx.lineTo(x + w, y + h / 2 + bob);
    ctx.lineTo(x + w / 2, y + h + bob);
    ctx.lineTo(x, y + h / 2 + bob);
    ctx.closePath();
    ctx.fillStyle = `${color}33`;
    ctx.fill();
    ctx.stroke();
 
    // Symbol
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.font = `${h * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(symbols[type], x + w / 2, y + h / 2 + bob);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
}
 
// ===== PARTICLES =====
class Particle {
    constructor(x, y, color, opts = {}) {
        this.x = x; this.y = y;
        this.vx = (opts.vx !== undefined ? opts.vx : (Math.random() - 0.5) * 6);
        this.vy = (opts.vy !== undefined ? opts.vy : (Math.random() - 0.5) * 6);
        this.life = 1;
        this.decay = opts.decay || (Math.random() * 0.03 + 0.02);
        this.size = opts.size || (Math.random() * 4 + 2);
        this.color = color;
        this.gravity = opts.gravity || 0.05;
        this.type = opts.type || 'square'; // square, circle, trail
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 4;
        if (this.type === 'circle') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.size, this.size);
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}
 
// Shockwave effect
class Shockwave {
    constructor(x, y, color, maxRadius = 80) {
        this.x = x; this.y = y;
        this.radius = 0; this.maxRadius = maxRadius;
        this.life = 1; this.color = color;
    }
    update() {
        this.radius += 4;
        this.life = 1 - this.radius / this.maxRadius;
    }
    draw() {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life * 0.5;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * this.life;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
    get alive() { return this.life > 0; }
}
 
// ===== MAIN GAME CLASS =====
class Game {
    constructor(playerName) {
        this.playerName = playerName;
        this.score = 0;
        this.lives = 3;
        this.levelIndex = 0;
        this.kills = 0;
        this.paused = false;
        this.running = false;
        this.frame = 0;
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.shockwaves = [];
        this.powerUps = [];
        this.boss = null;
        this.ammo = Infinity;
        this.keys = {};
        this.shootCooldown = 0;
        this.enemyDirection = 1;
        this.transitioning = false;
        this.invulnerable = 0;
        // Combo
        this.combo = 1;
        this.comboTimer = 0;
        this.maxCombo = 1;
        // Power-up states
        this.rapidFire = 0;
        this.shieldActive = 0;
        this.spreadShot = 0;
        // Thragg special
        this.thraggPhase = 0;
        this.thraggTeleportTimer = 0;
        this.thraggChargeTimer = 0;
        this.thraggCharging = false;
        // Bullet trails
        this.bulletTrails = [];
 
        this.resize();
        this.setupInput();
    }
 
    resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
 
    setupInput() {
        this._keyDown = (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyP' && this.running && !this.transitioning) this.togglePause();
            if (e.code === 'Space') e.preventDefault();
        };
        this._keyUp = (e) => { this.keys[e.code] = false; };
        this._resize = () => this.resize();
        window.addEventListener('keydown', this._keyDown);
        window.addEventListener('keyup', this._keyUp);
        window.addEventListener('resize', this._resize);
    }
 
    cleanup() {
        window.removeEventListener('keydown', this._keyDown);
        window.removeEventListener('keyup', this._keyUp);
        window.removeEventListener('resize', this._resize);
        this.running = false;
    }
 
    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pause-overlay').classList.toggle('hidden', !this.paused);
        if (this.paused) {
            AudioEngine.stopAllMusic();
        } else {
            AudioEngine.startBattleMusic(this.levelIndex + 1);
        }
    }
 
    start() {
        this.running = true;
        AudioEngine.init();
        AudioEngine.startBattleMusic(1);
        this.initLevel();
        this.loop();
    }
 
    initLevel() {
        const cfg = LEVEL_CONFIG[this.levelIndex];
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.shockwaves = [];
        this.powerUps = [];
        this.boss = null;
        this.enemyDirection = 1;
        this.ammo = cfg.ammo;
        this.bulletTrails = [];
 
        // Update nebula color
        currentNebula = this.levelIndex + 1;
 
        const pw = 50, ph = 60;
        this.player = {
            x: canvas.width / 2 - pw / 2,
            y: canvas.height - ph - 20,
            w: pw, h: ph, speed: 6
        };
 
        const enemyW = 40, enemyH = 40, gap = 15;
        const totalW = cfg.cols * (enemyW + gap) - gap;
        const startX = (canvas.width - totalW) / 2;
        const startY = 70;
 
        for (let r = 0; r < cfg.rows; r++) {
            for (let c = 0; c < cfg.cols; c++) {
                this.enemies.push({
                    x: startX + c * (enemyW + gap),
                    y: startY + r * (enemyH + gap),
                    w: enemyW, h: enemyH,
                    hp: cfg.enemyHP, maxHP: cfg.enemyHP,
                    type: cfg.thragg ? 'elite' : (cfg.level <= 1 ? 'scout' : 'warrior'),
                    alive: true,
                });
            }
        }
 
        if (cfg.bossLevel) {
            const bw = cfg.thragg ? 140 : 120;
            const bh = cfg.thragg ? 160 : 140;
            this.boss = {
                x: canvas.width / 2 - bw / 2, y: 50,
                w: bw, h: bh,
                hp: cfg.bossHP, maxHP: cfg.bossHP,
                speed: cfg.thragg ? 2.5 : 2,
                direction: 1, shootTimer: 0, alive: true,
                isThragg: !!cfg.thragg,
            };
            if (cfg.thragg) {
                this.thraggPhase = 0;
                this.thraggTeleportTimer = 0;
                this.thraggChargeTimer = 0;
                this.thraggCharging = false;
            }
            // Boss warning
            const hud = document.getElementById('game-hud');
            hud.classList.add(cfg.thragg ? 'thragg-warning' : 'boss-warning');
            AudioEngine.bossWarning();
        }
 
        // Start battle music for this level
        AudioEngine.startBattleMusic(cfg.level);
        this.showLevelTransition(cfg);
        this.updateHUD();
    }
 
    showLevelTransition(cfg) {
        this.transitioning = true;
        const overlay = document.getElementById('level-overlay');
        document.getElementById('level-title').textContent = cfg.title;
        document.getElementById('level-desc').textContent = cfg.desc;
        overlay.classList.remove('hidden');
        AudioEngine.levelUp();
        setTimeout(() => {
            overlay.classList.add('hidden');
            this.transitioning = false;
        }, 2200);
    }
 
    updateHUD() {
        hudScore.textContent = this.score.toLocaleString();
        hudLevel.textContent = this.levelIndex + 1;
        hudLives.textContent = Array(this.lives).fill('❤️').join('') || '💀';
        hudAmmo.textContent = this.ammo === Infinity ? '∞' : this.ammo;
        hudCombo.textContent = `x${this.combo}`;
        hudCombo.style.transform = this.combo > 1 ? 'scale(1.3)' : 'scale(1)';
        hudCombo.style.color = this.combo >= 8 ? '#FFD700' : this.combo >= 4 ? '#FF4081' : '#888';
    }
 
    showHUDMessage(msg) {
        hudMsg.textContent = msg;
        hudMsg.style.animation = 'none';
        hudMsg.offsetHeight;
        hudMsg.style.animation = '';
        setTimeout(() => { hudMsg.textContent = ''; }, 2000);
    }
 
    spawnParticles(x, y, color, count = 12, opts = {}) {
        for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color, opts));
    }
 
    spawnShockwave(x, y, color, maxR) {
        this.shockwaves.push(new Shockwave(x, y, color, maxR));
    }
 
    spawnPowerUp(x, y) {
        const types = ['rapid', 'shield', 'spread'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerUps.push({ x, y, w: 24, h: 24, type, vy: 1.5 });
    }
 
    loop() {
        if (!this.running) return;
        if (!this.paused && !this.transitioning) this.update();
        this.render();
        this.frame++;
        requestAnimationFrame(() => this.loop());
    }
 
    update() {
        const cfg = LEVEL_CONFIG[this.levelIndex];
 
        // Player movement
        if ((this.keys['ArrowLeft'] || this.keys['KeyA']) && this.player.x > 5)
            this.player.x -= this.player.speed;
        if ((this.keys['ArrowRight'] || this.keys['KeyD']) && this.player.x + this.player.w < canvas.width - 5)
            this.player.x += this.player.speed;
 
        // Shooting
        const fireRate = this.rapidFire > 0 ? 5 : 12;
        if (this.keys['Space'] && this.shootCooldown <= 0 && this.ammo > 0) {
            const bx = this.player.x + this.player.w / 2 - 3;
            const by = this.player.y - 5;
 
            if (this.spreadShot > 0) {
                // Spread: 3 bullets
                for (let angle = -1; angle <= 1; angle++) {
                    this.bullets.push({ x: bx + angle * 12, y: by, w: 5, h: 14, speed: 8, vx: angle * 2 });
                }
                if (this.ammo !== Infinity) this.ammo -= 3;
            } else {
                this.bullets.push({ x: bx, y: by, w: 6, h: 15, speed: 8, vx: 0 });
                if (this.ammo !== Infinity) this.ammo--;
            }
            this.shootCooldown = fireRate;
            AudioEngine.shoot();
            this.updateHUD();
        }
        if (this.shootCooldown > 0) this.shootCooldown--;
 
        // Power-up timers
        if (this.rapidFire > 0) this.rapidFire--;
        if (this.shieldActive > 0) this.shieldActive--;
        if (this.spreadShot > 0) this.spreadShot--;
 
        // Combo timer
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer <= 0) { this.combo = 1; this.updateHUD(); }
        }
 
        // Update bullets
        this.bullets = this.bullets.filter(b => {
            b.y -= b.speed;
            b.x += (b.vx || 0);
            // Add trail
            if (this.frame % 2 === 0) {
                this.bulletTrails.push({ x: b.x + b.w / 2, y: b.y + b.h, life: 1 });
            }
            return b.y + b.h > 0 && b.x > -20 && b.x < canvas.width + 20;
        });
 
        // Update bullet trails
        this.bulletTrails = this.bulletTrails.filter(t => {
            t.life -= 0.08;
            return t.life > 0;
        });
 
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(b => {
            b.y += b.speed;
            if (b.vx) b.x += b.vx;
            return b.y < canvas.height && b.x > -20 && b.x < canvas.width + 20;
        });
 
        // Enemy movement
        let hitEdge = false;
        const alive = this.enemies.filter(e => e.alive);
        alive.forEach(e => {
            e.x += cfg.enemySpeed * this.enemyDirection;
            if (e.x + e.w > canvas.width - 10 || e.x < 10) hitEdge = true;
        });
        if (hitEdge) {
            this.enemyDirection *= -1;
            alive.forEach(e => { e.y += cfg.enemyDropSpeed; });
        }
 
        // Enemy shooting
        if (cfg.enemyShoots && alive.length > 0) {
            alive.forEach(e => {
                if (Math.random() < cfg.enemyShootChance) {
                    this.enemyBullets.push({
                        x: e.x + e.w / 2 - 3, y: e.y + e.h,
                        w: 6, h: 12, speed: 4 + this.levelIndex, vx: 0,
                    });
                    AudioEngine.enemyShoot();
                }
            });
        }
 
        // Boss update
        if (this.boss && this.boss.alive) {
            if (this.boss.isThragg) {
                this.updateThragg();
            } else {
                this.updateOmniMan();
            }
        }
 
        // Bullet-enemy collision
        this.bullets.forEach(b => {
            alive.forEach(e => {
                if (this.collides(b, e)) {
                    e.hp--;
                    b.y = -100;
                    if (e.hp <= 0) {
                        e.alive = false;
                        const pts = cfg.pointsPerKill * this.combo;
                        this.score += pts;
                        this.kills++;
                        this.combo++;
                        this.comboTimer = 120;
                        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                        this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#C62828', 15);
                        this.spawnShockwave(e.x + e.w / 2, e.y + e.h / 2, '#C62828', 40);
                        AudioEngine.explosion();
                        // Power-up drop
                        if (Math.random() < cfg.powerUpChance) this.spawnPowerUp(e.x + e.w / 2, e.y + e.h / 2);
                    } else {
                        AudioEngine.hit();
                        this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#FFD700', 5);
                    }
                    this.updateHUD();
                }
            });
 
            // Bullet-boss
            if (this.boss && this.boss.alive && this.collides(b, this.boss)) {
                this.boss.hp--;
                b.y = -100;
                this.score += 50 * this.combo;
                this.spawnParticles(b.x, b.y, this.boss.isThragg ? '#E040FB' : '#FFD700', 4);
                AudioEngine.hit();
                if (this.boss.hp <= 0) {
                    this.boss.alive = false;
                    this.score += this.boss.isThragg ? 5000 : 2000;
                    this.kills++;
                    const bossColor = this.boss.isThragg ? '#E040FB' : '#C62828';
                    this.spawnParticles(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, bossColor, 40);
                    this.spawnParticles(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, '#FFD700', 25);
                    this.spawnShockwave(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, bossColor, 150);
                    AudioEngine.explosion();
                    this.showHUDMessage(this.boss.isThragg ? 'THRAGG DEFEATED!' : 'OMNI-MAN DEFEATED!');
                    document.getElementById('game-hud').classList.remove('boss-warning', 'thragg-warning');
                }
                this.updateHUD();
            }
        });
 
        // Invulnerability
        if (this.invulnerable > 0) this.invulnerable--;
 
        // Enemy bullet-player collision
        if (this.invulnerable <= 0) {
            this.enemyBullets.forEach(b => {
                if (this.collides(b, this.player)) {
                    b.y = canvas.height + 100;
                    if (this.shieldActive > 0) {
                        this.shieldActive = 0;
                        this.spawnParticles(this.player.x + this.player.w / 2, this.player.y, '#00E5FF', 15);
                        this.spawnShockwave(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#00E5FF', 60);
                        AudioEngine.hit();
                        this.showHUDMessage('SHIELD ABSORBED!');
                    } else {
                        this.playerDamage();
                    }
                }
            });
            // Enemy-player collision
            alive.forEach(e => {
                if (this.collides(e, this.player)) {
                    e.alive = false;
                    if (this.shieldActive > 0) {
                        this.shieldActive = 0;
                        this.spawnParticles(this.player.x + this.player.w / 2, this.player.y, '#00E5FF', 15);
                        AudioEngine.hit();
                    } else {
                        this.playerDamage();
                    }
                    this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#C62828');
                }
            });
        }
 
        // Power-up collection
        this.powerUps = this.powerUps.filter(pu => {
            pu.y += pu.vy;
            if (this.collides(pu, this.player)) {
                if (pu.type === 'rapid') { this.rapidFire = 300; this.showHUDMessage('RAPID FIRE!'); }
                else if (pu.type === 'shield') { this.shieldActive = 600; this.showHUDMessage('SHIELD ACTIVE!'); }
                else if (pu.type === 'spread') { this.spreadShot = 300; this.showHUDMessage('SPREAD SHOT!'); }
                AudioEngine.powerUp();
                this.spawnParticles(pu.x + pu.w / 2, pu.y + pu.h / 2, '#FFD700', 10, { type: 'circle' });
                return false;
            }
            return pu.y < canvas.height + 30;
        });
 
        // Enemy reaching bottom
        alive.forEach(e => {
            if (e.y + e.h >= this.player.y) { this.endGame(false); return; }
        });
 
        // Update particles & shockwaves
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);
        this.shockwaves.forEach(s => s.update());
        this.shockwaves = this.shockwaves.filter(s => s.alive);
 
        // Check win
        const allDead = this.enemies.every(e => !e.alive);
        const bossDead = !this.boss || !this.boss.alive;
        if (allDead && bossDead && !this.transitioning) {
            if (this.levelIndex < LEVEL_CONFIG.length - 1) {
                this.levelIndex++;
                this.initLevel();
            } else {
                this.endGame(true);
            }
        }
    }
 
    updateOmniMan() {
        const b = this.boss;
        b.x += b.speed * b.direction;
        if (b.x + b.w > canvas.width - 20 || b.x < 20) b.direction *= -1;
        b.shootTimer++;
        if (b.shootTimer > 40) {
            b.shootTimer = 0;
            for (let a = -1; a <= 1; a++) {
                this.enemyBullets.push({
                    x: b.x + b.w / 2 - 3 + a * 20, y: b.y + b.h,
                    w: 8, h: 14, speed: 5, vx: a * 1.5,
                });
            }
            AudioEngine.enemyShoot();
        }
    }
 
    updateThragg() {
        const b = this.boss;
        const hpRatio = b.hp / b.maxHP;
 
        // Phase transitions
        if (hpRatio < 0.3 && this.thraggPhase < 2) {
            this.thraggPhase = 2;
            this.showHUDMessage('THRAGG ENRAGED!');
            this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#E040FB', 30);
            this.spawnShockwave(b.x + b.w / 2, b.y + b.h / 2, '#E040FB', 120);
        } else if (hpRatio < 0.6 && this.thraggPhase < 1) {
            this.thraggPhase = 1;
            this.showHUDMessage('THRAGG POWERS UP!');
        }
 
        // Movement - faster in later phases
        const spd = b.speed * (1 + this.thraggPhase * 0.5);
        b.x += spd * b.direction;
        if (b.x + b.w > canvas.width - 20 || b.x < 20) b.direction *= -1;
 
        // Teleport mechanic (phase 1+)
        if (this.thraggPhase >= 1) {
            this.thraggTeleportTimer++;
            if (this.thraggTeleportTimer > 180) {
                this.thraggTeleportTimer = 0;
                this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#E040FB', 20);
                b.x = Math.random() * (canvas.width - b.w - 40) + 20;
                this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#E040FB', 20);
                this.spawnShockwave(b.x + b.w / 2, b.y + b.h / 2, '#E040FB', 80);
            }
        }
 
        // Shooting patterns
        b.shootTimer++;
        const shootInterval = this.thraggPhase >= 2 ? 20 : (this.thraggPhase >= 1 ? 30 : 35);
 
        if (b.shootTimer > shootInterval) {
            b.shootTimer = 0;
 
            if (this.thraggPhase >= 2) {
                // Phase 2: circular burst
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i + this.frame * 0.02;
                    this.enemyBullets.push({
                        x: b.x + b.w / 2, y: b.y + b.h / 2,
                        w: 8, h: 8, speed: 0,
                        vx: Math.cos(angle) * 4,
                        vy_custom: Math.sin(angle) * 4,
                    });
                }
            } else if (this.thraggPhase >= 1) {
                // Phase 1: aimed spread
                const dx = (this.player.x + this.player.w / 2) - (b.x + b.w / 2);
                const dy = (this.player.y) - (b.y + b.h);
                const dist = Math.sqrt(dx * dx + dy * dy);
                for (let a = -1; a <= 1; a++) {
                    this.enemyBullets.push({
                        x: b.x + b.w / 2 - 4, y: b.y + b.h,
                        w: 8, h: 8, speed: 0,
                        vx: (dx / dist) * 5 + a * 1.5,
                        vy_custom: (dy / dist) * 5,
                    });
                }
            } else {
                // Phase 0: 5-way spread
                for (let a = -2; a <= 2; a++) {
                    this.enemyBullets.push({
                        x: b.x + b.w / 2 - 3 + a * 15, y: b.y + b.h,
                        w: 8, h: 14, speed: 5, vx: a * 1.2,
                    });
                }
            }
            AudioEngine.enemyShoot();
        }
 
        // Charge attack (phase 2) - periodically charges toward player
        if (this.thraggPhase >= 2) {
            this.thraggChargeTimer++;
            if (this.thraggChargeTimer > 300 && !this.thraggCharging) {
                this.thraggCharging = true;
                this.thraggChargeTimer = 0;
                this.showHUDMessage('THRAGG CHARGES!');
            }
            if (this.thraggCharging) {
                b.y += 3;
                if (b.y + b.h > canvas.height * 0.5) {
                    this.thraggCharging = false;
                    b.y = 50;
                    this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#E040FB', 25);
                    this.spawnShockwave(b.x + b.w / 2, canvas.height * 0.5, '#E040FB', 100);
                }
            }
        }
 
        // Custom vy for Thragg bullets
        this.enemyBullets.forEach(eb => {
            if (eb.vy_custom !== undefined) {
                eb.y += eb.vy_custom;
                eb.speed = 0;
            }
        });
 
        // Aura particles
        if (this.frame % 5 === 0) {
            this.particles.push(new Particle(
                b.x + Math.random() * b.w, b.y + Math.random() * b.h,
                '#E040FB', { vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2, decay: 0.03, size: 2, gravity: -0.02, type: 'circle' }
            ));
        }
    }
 
    playerDamage() {
        this.lives--;
        this.invulnerable = 90;
        this.combo = 1;
        this.comboTimer = 0;
        this.updateHUD();
        AudioEngine.playerHit();
        const gs = document.getElementById('game-screen');
        gs.classList.add('screen-shake', 'damage-flash');
        setTimeout(() => gs.classList.remove('screen-shake', 'damage-flash'), 400);
        if (this.lives <= 0) this.endGame(false);
        else this.showHUDMessage(`${this.lives} LIVES REMAINING!`);
    }
 
    collides(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }
 
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
 
        // Subtle grid
        ctx.strokeStyle = 'rgba(30,58,95,0.08)';
        ctx.lineWidth = 1;
        const go = (this.frame * 0.3) % 60;
        for (let y = go; y < canvas.height; y += 60) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
 
        // Bullet trails
        this.bulletTrails.forEach(t => {
            ctx.globalAlpha = t.life * 0.4;
            ctx.fillStyle = '#00E5FF';
            ctx.fillRect(t.x - 1, t.y, 2, 4);
            ctx.globalAlpha = 1;
        });
 
        // Particles (behind)
        this.particles.forEach(p => p.draw());
        this.shockwaves.forEach(s => s.draw());
 
        // Player
        if (this.invulnerable <= 0 || Math.floor(this.frame / 4) % 2 === 0) {
            drawPlayer(this.player.x, this.player.y, this.player.w, this.player.h, this.shieldActive > 0, this.frame);
        }
 
        // Player bullets
        this.bullets.forEach(b => {
            ctx.fillStyle = '#00E5FF';
            ctx.shadowColor = '#00E5FF';
            ctx.shadowBlur = 12;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.shadowBlur = 0;
        });
 
        // Enemy bullets
        this.enemyBullets.forEach(b => {
            const isThraggBullet = b.vy_custom !== undefined;
            ctx.fillStyle = isThraggBullet ? '#E040FB' : '#FF4444';
            ctx.shadowColor = isThraggBullet ? '#E040FB' : '#FF4444';
            ctx.shadowBlur = 10;
            if (isThraggBullet) {
                ctx.beginPath();
                ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2 + 1, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(b.x, b.y, b.w, b.h);
            }
            ctx.shadowBlur = 0;
        });
 
        // Enemies
        this.enemies.filter(e => e.alive).forEach(e => {
            drawEnemy(e.x, e.y, e.w, e.h, e.type, e.hp, e.maxHP, this.frame);
        });
 
        // Boss
        if (this.boss && this.boss.alive) {
            drawBoss(this.boss.x, this.boss.y, this.boss.w, this.boss.h,
                this.boss.hp, this.boss.maxHP, this.frame, this.boss.isThragg);
        }
 
        // Power-ups
        this.powerUps.forEach(pu => {
            drawPowerUp(pu.x, pu.y, pu.w, pu.h, pu.type, this.frame);
        });
 
        // Active power-up indicators
        if (this.rapidFire > 0 || this.spreadShot > 0 || this.shieldActive > 0) {
            let py = canvas.height - 30;
            ctx.font = "bold 12px 'Orbitron', sans-serif";
            ctx.textAlign = 'center';
            const indicators = [];
            if (this.rapidFire > 0) indicators.push({ text: `⚡ RAPID ${Math.ceil(this.rapidFire / 60)}s`, color: '#FFD700' });
            if (this.shieldActive > 0) indicators.push({ text: `🛡 SHIELD ${Math.ceil(this.shieldActive / 60)}s`, color: '#00E5FF' });
            if (this.spreadShot > 0) indicators.push({ text: `✦ SPREAD ${Math.ceil(this.spreadShot / 60)}s`, color: '#FF4081' });
            indicators.forEach((ind, i) => {
                ctx.fillStyle = ind.color;
                ctx.globalAlpha = 0.8;
                ctx.fillText(ind.text, canvas.width / 2 + (i - (indicators.length - 1) / 2) * 130, py);
            });
            ctx.globalAlpha = 1;
            ctx.textAlign = 'start';
        }
    }
 
    endGame(victory) {
        this.running = false;
        AudioEngine.stopAllMusic();
        document.getElementById('game-hud').classList.remove('boss-warning', 'thragg-warning');
 
        const saved = this.playerName.trim().length >= 3 ?
            Leaderboard.saveScore(this.playerName, this.score, this.levelIndex + 1, this.kills) : false;
 
        if (victory) {
            AudioEngine.victory();
            document.getElementById('victory-score').textContent = this.score.toLocaleString();
            document.getElementById('victory-saved-msg').classList.toggle('hidden', !saved);
            showScreen('victory');
        } else {
            AudioEngine.gameOver();
            document.getElementById('gameover-title').textContent = this.lives <= 0 ? 'GAME OVER' : 'DEFEATED';
            document.getElementById('final-score').textContent = this.score.toLocaleString();
            document.getElementById('final-level').textContent = this.levelIndex + 1;
            document.getElementById('final-kills').textContent = this.kills;
            document.getElementById('final-combo').textContent = `x${this.maxCombo}`;
            document.getElementById('score-saved-msg').classList.toggle('hidden', !saved);
            showScreen('gameover');
        }
 
        this.cleanup();
        // Return to menu music after a short delay
        setTimeout(() => {
            if (!game || !game.running) AudioEngine.startMenuMusic();
        }, 2000);
    }
}
 
// ===== GAME INSTANCE =====
window.game = null;
let game = null;
 
function initAudioOnInteraction() {
    AudioEngine.init();
    AudioEngine.buttonClick();
    if (!AudioEngine._currentMusic) AudioEngine.startMenuMusic();
}
 
// Start
document.getElementById('btn-start').addEventListener('click', () => {
    initAudioOnInteraction();
    showScreen('name');
    setTimeout(() => document.getElementById('player-name-input').focus(), 100);
});
 
// Instructions
document.getElementById('btn-instructions').addEventListener('click', () => { initAudioOnInteraction(); showScreen('instructions'); });
document.getElementById('btn-back-start').addEventListener('click', () => { AudioEngine.buttonClick(); showScreen('start'); });
 
// Leaderboard
document.getElementById('btn-leaderboard-menu').addEventListener('click', () => { initAudioOnInteraction(); Leaderboard.render(); showScreen('leaderboard'); });
document.getElementById('btn-lb-back').addEventListener('click', () => { AudioEngine.buttonClick(); showScreen('start'); });
 
// Name
document.getElementById('btn-confirm-name').addEventListener('click', startGame);
document.getElementById('player-name-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(); });
 
function startGame() {
    const input = document.getElementById('player-name-input');
    const name = input.value.trim();
    if (name.length < 3) {
        input.style.borderColor = '#C62828';
        input.style.boxShadow = '0 0 25px rgba(198,40,40,0.5)';
        setTimeout(() => { input.style.borderColor = 'rgba(255,215,0,0.4)'; input.style.boxShadow = ''; }, 1000);
        return;
    }
    if (game) game.cleanup();
    showScreen('game');
    game = new Game(name);
    window.game = game;
    game.start();
}
 
// Game Over buttons
document.getElementById('btn-play-again').addEventListener('click', () => {
    AudioEngine.buttonClick(); showScreen('name');
    setTimeout(() => document.getElementById('player-name-input').focus(), 100);
});
document.getElementById('btn-gameover-leaderboard').addEventListener('click', () => { AudioEngine.buttonClick(); Leaderboard.render(); showScreen('leaderboard'); });
document.getElementById('btn-gameover-menu').addEventListener('click', () => { AudioEngine.buttonClick(); showScreen('start'); });
 
// Victory buttons
document.getElementById('btn-victory-again').addEventListener('click', () => {
    AudioEngine.buttonClick(); showScreen('name');
    setTimeout(() => document.getElementById('player-name-input').focus(), 100);
});
document.getElementById('btn-victory-leaderboard').addEventListener('click', () => { AudioEngine.buttonClick(); Leaderboard.render(); showScreen('leaderboard'); });
document.getElementById('btn-victory-menu').addEventListener('click', () => { AudioEngine.buttonClick(); showScreen('start'); });
 
// Pause quit
document.getElementById('btn-quit').addEventListener('click', () => {
    if (game) game.cleanup();
    AudioEngine.buttonClick();
    AudioEngine.startMenuMusic();
    showScreen('start');
});
 
// Initialize
showScreen('start');
currentNebula = 0;