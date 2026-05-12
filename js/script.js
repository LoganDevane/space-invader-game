/* ============================================================
   INVINCIBLE: VILTRUMITE ASSAULT — Game Engine
   ============================================================ */
 
// ===== DOM REFERENCES =====
const screens = {
    start:        document.getElementById('start-screen'),
    instructions: document.getElementById('instructions-screen'),
    name:         document.getElementById('name-screen'),
    game:         document.getElementById('game-screen'),
    gameover:     document.getElementById('gameover-screen'),
    victory:      document.getElementById('victory-screen'),
    leaderboard:  document.getElementById('leaderboard-screen'),
};
 
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
 
const hudScore = document.getElementById('hud-score');
const hudLevel = document.getElementById('hud-level');
const hudLives = document.getElementById('hud-lives');
const hudAmmo  = document.getElementById('hud-ammo');
const hudMsg   = document.getElementById('hud-message');
 
// ===== GENERATE STAR BACKGROUND =====
(function createStars() {
    const container = document.getElementById('stars-container');
    const count = 120;
    for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 3 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--dur', (Math.random() * 3 + 2) + 's');
        star.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(star);
    }
})();
 
// ===== AUDIO ENGINE (Web Audio API) =====
const AudioEngine = {
    ctx: null,
    musicGain: null,
    sfxGain: null,
    musicOsc: null,
 
    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.08;
        this.musicGain.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.15;
        this.sfxGain.connect(this.ctx.destination);
    },
 
    playTone(freq, duration, type = 'square', gainVal = 0.15) {
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
        this.playTone(880, 0.1, 'square', 0.12);
        this.playTone(1100, 0.08, 'square', 0.08);
    },
 
    enemyShoot() {
        this.playTone(200, 0.15, 'sawtooth', 0.08);
    },
 
    hit() {
        this.playTone(150, 0.2, 'sawtooth', 0.2);
        this.playTone(100, 0.3, 'square', 0.15);
    },
 
    explosion() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        src.buffer = buffer;
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        src.connect(gain);
        gain.connect(this.sfxGain);
        src.start();
    },
 
    playerHit() {
        this.playTone(80, 0.4, 'sawtooth', 0.25);
        this.playTone(60, 0.5, 'square', 0.2);
    },
 
    levelUp() {
        const t = this.ctx ? this.ctx.currentTime : 0;
        this.playTone(523, 0.15, 'square', 0.15);
        setTimeout(() => this.playTone(659, 0.15, 'square', 0.15), 150);
        setTimeout(() => this.playTone(784, 0.2, 'square', 0.15), 300);
        setTimeout(() => this.playTone(1047, 0.3, 'square', 0.2), 450);
    },
 
    gameOver() {
        this.playTone(400, 0.3, 'square', 0.15);
        setTimeout(() => this.playTone(300, 0.3, 'square', 0.15), 300);
        setTimeout(() => this.playTone(200, 0.5, 'sawtooth', 0.2), 600);
    },
 
    victory() {
        const notes = [523, 659, 784, 1047, 784, 1047, 1319];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.2, 'square', 0.12), i * 150);
        });
    },
 
    startMusic() {
        if (!this.ctx || this.musicOsc) return;
        const bassNotes = [65, 82, 73, 87, 65, 82, 98, 87];
        let noteIndex = 0;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = bassNotes[0];
        gain.gain.value = 0.06;
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start();
        this.musicOsc = osc;
        this._musicInterval = setInterval(() => {
            noteIndex = (noteIndex + 1) % bassNotes.length;
            if (this.musicOsc) {
                this.musicOsc.frequency.setValueAtTime(bassNotes[noteIndex], this.ctx.currentTime);
            }
        }, 600);
    },
 
    stopMusic() {
        if (this.musicOsc) {
            this.musicOsc.stop();
            this.musicOsc = null;
        }
        if (this._musicInterval) {
            clearInterval(this._musicInterval);
            this._musicInterval = null;
        }
    },
 
    buttonClick() {
        this.playTone(600, 0.06, 'square', 0.08);
    }
};
 
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
    KEY: 'invincible_leaderboard',
    MAX_ENTRIES: 20,
 
    getScores() {
        try {
            const data = localStorage.getItem(this.KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },
 
    saveScore(name, score) {
        const scores = this.getScores();
        const now = new Date();
        const duplicate = scores.find(s =>
            s.name === name && s.score === score &&
            (now - new Date(s.timestamp)) < 10000
        );
        if (duplicate) return false;
 
        scores.push({
            name: name,
            score: score,
            timestamp: now.toISOString()
        });
 
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
 
        if (scores.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        empty.classList.add('hidden');
 
        scores.forEach((entry, i) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            const date = new Date(entry.timestamp);
            const dateStr = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
            row.innerHTML = `
                <span class="lb-rank">#${i + 1}</span>
                <span class="lb-name">${escapeHtml(entry.name)}</span>
                <span class="lb-score">${entry.score.toLocaleString()}</span>
                <span class="lb-date">${dateStr}</span>
            `;
            list.appendChild(row);
        });
    }
};
 
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
 
// ===== GAME STATE =====
let game = null;
 
const LEVEL_CONFIG = [
    {
        level: 1,
        title: 'LEVEL 1',
        desc: 'Viltrumite Scouts Detected!',
        rows: 3,
        cols: 7,
        enemySpeed: 1,
        enemyDropSpeed: 20,
        enemyShoots: false,
        enemyShootChance: 0,
        ammo: Infinity,
        bossLevel: false,
        enemyHP: 1,
        pointsPerKill: 100,
    },
    {
        level: 2,
        title: 'LEVEL 2',
        desc: 'Viltrumite Warriors Incoming!',
        rows: 4,
        cols: 8,
        enemySpeed: 1.5,
        enemyDropSpeed: 25,
        enemyShoots: true,
        enemyShootChance: 0.003,
        ammo: 80,
        bossLevel: false,
        enemyHP: 2,
        pointsPerKill: 200,
    },
    {
        level: 3,
        title: 'LEVEL 3',
        desc: 'OMNI-MAN HAS ARRIVED!',
        rows: 2,
        cols: 5,
        enemySpeed: 2,
        enemyDropSpeed: 30,
        enemyShoots: true,
        enemyShootChance: 0.005,
        ammo: 60,
        bossLevel: true,
        enemyHP: 2,
        pointsPerKill: 300,
        bossHP: 50,
    }
];
 
// ===== DRAWING HELPERS =====
function drawPlayer(x, y, w, h) {
    // Invincible (Mark Grayson) - blue/yellow suit
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
    ctx.beginPath();
    ctx.moveTo(x + w * 0.15, y + h * 0.35);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w * 0.25, y + h * 0.8);
    ctx.closePath();
    ctx.fill();
 
    ctx.beginPath();
    ctx.moveTo(x + w * 0.85, y + h * 0.35);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w * 0.75, y + h * 0.8);
    ctx.closePath();
    ctx.fill();
 
    // Glowing eyes
    ctx.fillStyle = '#00E5FF';
    ctx.shadowColor = '#00E5FF';
    ctx.shadowBlur = 8;
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
}
 
function drawEnemy(x, y, w, h, type, hp, maxHP, frame) {
    const dmgRatio = hp / maxHP;
 
    if (type === 'scout') {
        // Viltrumite Scout - grey/white soldier
        ctx.fillStyle = `rgb(${180 * dmgRatio + 75}, ${180 * dmgRatio + 75}, ${180 * dmgRatio + 75})`;
        ctx.fillRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.7);
 
        // Viltrumite "V" symbol
        ctx.strokeStyle = '#C62828';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y + h * 0.3);
        ctx.lineTo(x + w * 0.5, y + h * 0.65);
        ctx.lineTo(x + w * 0.7, y + h * 0.3);
        ctx.stroke();
 
        // Eyes - red glow
        ctx.fillStyle = '#C62828';
        ctx.shadowColor = '#C62828';
        ctx.shadowBlur = 6;
        ctx.fillRect(x + w * 0.28, y + h * 0.25, w * 0.12, h * 0.08);
        ctx.fillRect(x + w * 0.6, y + h * 0.25, w * 0.12, h * 0.08);
        ctx.shadowBlur = 0;
 
        // Mustache (Viltrumite trademark)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.3, y + h * 0.52);
        ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.6, x + w * 0.7, y + h * 0.52);
        ctx.stroke();
 
    } else if (type === 'warrior') {
        // Viltrumite Warrior - armored, red accents
        ctx.fillStyle = `rgb(${120 * dmgRatio + 60}, ${60 * dmgRatio + 30}, ${60 * dmgRatio + 30})`;
        ctx.fillRect(x + w * 0.1, y + h * 0.1, w * 0.8, h * 0.8);
 
        // Armor lines
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.7);
 
        // "V" emblem
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.25, y + h * 0.25);
        ctx.lineTo(x + w * 0.5, y + h * 0.65);
        ctx.lineTo(x + w * 0.75, y + h * 0.25);
        ctx.stroke();
 
        // Eyes
        ctx.fillStyle = '#FF4444';
        ctx.shadowColor = '#FF4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(x + w * 0.25, y + h * 0.2, w * 0.15, h * 0.1);
        ctx.fillRect(x + w * 0.6, y + h * 0.2, w * 0.15, h * 0.1);
        ctx.shadowBlur = 0;
 
        // Wing-like shoulder pads
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.2);
        ctx.lineTo(x + w * 0.15, y + h * 0.5);
        ctx.lineTo(x + w * 0.15, y + h * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + w, y + h * 0.2);
        ctx.lineTo(x + w * 0.85, y + h * 0.5);
        ctx.lineTo(x + w * 0.85, y + h * 0.2);
        ctx.closePath();
        ctx.fill();
    }
}
 
function drawBoss(x, y, w, h, hp, maxHP, frame) {
    const dmgRatio = hp / maxHP;
 
    // Omni-Man body - white/red/grey suit
    ctx.fillStyle = '#DDDDDD';
    ctx.fillRect(x + w * 0.15, y + h * 0.2, w * 0.7, h * 0.65);
 
    // Red chest area
    ctx.fillStyle = `rgb(${Math.floor(198 * dmgRatio + 57)}, ${Math.floor(40 * dmgRatio)}, ${Math.floor(40 * dmgRatio)})`;
    ctx.fillRect(x + w * 0.25, y + h * 0.25, w * 0.5, h * 0.4);
 
    // "O" emblem on chest
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.45, w * 0.12, 0, Math.PI * 2);
    ctx.stroke();
 
    // Head
    ctx.fillStyle = '#F5C6A0';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.15, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
 
    // Mustache (Nolan's iconic mustache)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.35, y + h * 0.17);
    ctx.quadraticCurveTo(x + w * 0.42, y + h * 0.22, x + w * 0.5, y + h * 0.17);
    ctx.quadraticCurveTo(x + w * 0.58, y + h * 0.22, x + w * 0.65, y + h * 0.17);
    ctx.quadraticCurveTo(x + w * 0.58, y + h * 0.24, x + w * 0.5, y + h * 0.2);
    ctx.quadraticCurveTo(x + w * 0.42, y + h * 0.24, x + w * 0.35, y + h * 0.17);
    ctx.fill();
 
    // Hair
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.12, w * 0.18, Math.PI, 0, false);
    ctx.fill();
 
    // Angry red eyes
    ctx.fillStyle = '#FF0000';
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 15;
    ctx.fillRect(x + w * 0.38, y + h * 0.11, w * 0.08, h * 0.04);
    ctx.fillRect(x + w * 0.55, y + h * 0.11, w * 0.08, h * 0.04);
    ctx.shadowBlur = 0;
 
    // Cape flowing
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
 
    // Boss HP bar
    const barW = w * 0.8;
    const barH = 6;
    const barX = x + w * 0.1;
    const barY = y - 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = dmgRatio > 0.5 ? '#C62828' : dmgRatio > 0.25 ? '#FF8F00' : '#FF0000';
    ctx.fillRect(barX, barY, barW * dmgRatio, barH);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
 
    // Fists animation
    const fistOff = Math.sin(frame * 0.08) * 5;
    ctx.fillStyle = '#F5C6A0';
    ctx.beginPath();
    ctx.arc(x + w * 0.08, y + h * 0.55 + fistOff, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.92, y + h * 0.55 - fistOff, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
}
 
// ===== PARTICLES =====
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 1;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 4 + 2;
        this.color = color;
    }
 
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy += 0.05;
    }
 
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
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
        this.boss = null;
        this.ammo = Infinity;
        this.keys = {};
        this.shootCooldown = 0;
        this.enemyDirection = 1;
        this.transitioning = false;
        this.invulnerable = 0;
 
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
            if (e.code === 'KeyP' && this.running && !this.transitioning) {
                this.togglePause();
            }
            if (e.code === 'Space') e.preventDefault();
        };
        this._keyUp = (e) => {
            this.keys[e.code] = false;
        };
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
        AudioEngine.stopMusic();
    }
 
    togglePause() {
        this.paused = !this.paused;
        document.getElementById('pause-overlay').classList.toggle('hidden', !this.paused);
        if (this.paused) {
            AudioEngine.stopMusic();
        } else {
            AudioEngine.startMusic();
        }
    }
 
    start() {
        this.running = true;
        AudioEngine.init();
        AudioEngine.startMusic();
        this.initLevel();
        this.loop();
    }
 
    initLevel() {
        const cfg = LEVEL_CONFIG[this.levelIndex];
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.boss = null;
        this.enemyDirection = 1;
        this.ammo = cfg.ammo;
 
        const pw = 50, ph = 60;
        this.player = {
            x: canvas.width / 2 - pw / 2,
            y: canvas.height - ph - 20,
            w: pw,
            h: ph,
            speed: 6
        };
 
        // Spawn enemies
        const enemyW = 40, enemyH = 40;
        const gap = 15;
        const totalW = cfg.cols * (enemyW + gap) - gap;
        const startX = (canvas.width - totalW) / 2;
        const startY = 70;
 
        for (let r = 0; r < cfg.rows; r++) {
            for (let c = 0; c < cfg.cols; c++) {
                this.enemies.push({
                    x: startX + c * (enemyW + gap),
                    y: startY + r * (enemyH + gap),
                    w: enemyW,
                    h: enemyH,
                    hp: cfg.enemyHP,
                    maxHP: cfg.enemyHP,
                    type: cfg.level === 1 ? 'scout' : 'warrior',
                    alive: true,
                });
            }
        }
 
        // Spawn boss on level 3
        if (cfg.bossLevel) {
            const bw = 120, bh = 140;
            this.boss = {
                x: canvas.width / 2 - bw / 2,
                y: 50,
                w: bw,
                h: bh,
                hp: cfg.bossHP,
                maxHP: cfg.bossHP,
                speed: 2,
                direction: 1,
                shootTimer: 0,
                alive: true,
            };
        }
 
        // Show level transition
        this.showLevelTransition(cfg);
 
        // Update HUD
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
        }, 2000);
    }
 
    updateHUD() {
        hudScore.textContent = this.score.toLocaleString();
        hudLevel.textContent = this.levelIndex + 1;
        const hearts = [];
        for (let i = 0; i < this.lives; i++) hearts.push('❤️');
        hudLives.textContent = hearts.join('') || '💀';
        hudAmmo.textContent = this.ammo === Infinity ? '∞' : this.ammo;
    }
 
    showHUDMessage(msg) {
        hudMsg.textContent = msg;
        hudMsg.style.animation = 'none';
        hudMsg.offsetHeight;
        hudMsg.style.animation = '';
        setTimeout(() => { hudMsg.textContent = ''; }, 1500);
    }
 
    spawnParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
 
    loop() {
        if (!this.running) return;
        if (!this.paused && !this.transitioning) {
            this.update();
        }
        this.render();
        this.frame++;
        requestAnimationFrame(() => this.loop());
    }
 
    update() {
        const cfg = LEVEL_CONFIG[this.levelIndex];
 
        // Player movement
        if ((this.keys['ArrowLeft'] || this.keys['KeyA']) && this.player.x > 5) {
            this.player.x -= this.player.speed;
        }
        if ((this.keys['ArrowRight'] || this.keys['KeyD']) && this.player.x + this.player.w < canvas.width - 5) {
            this.player.x += this.player.speed;
        }
 
        // Shooting
        if (this.keys['Space'] && this.shootCooldown <= 0 && this.ammo > 0) {
            this.bullets.push({
                x: this.player.x + this.player.w / 2 - 3,
                y: this.player.y - 5,
                w: 6,
                h: 15,
                speed: 8,
            });
            if (this.ammo !== Infinity) this.ammo--;
            this.shootCooldown = 12;
            AudioEngine.shoot();
            this.updateHUD();
        }
        if (this.shootCooldown > 0) this.shootCooldown--;
 
        // Update bullets
        this.bullets = this.bullets.filter(b => {
            b.y -= b.speed;
            return b.y + b.h > 0;
        });
 
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(b => {
            b.y += b.speed;
            return b.y < canvas.height;
        });
 
        // Enemy movement
        let hitEdge = false;
        const aliveEnemies = this.enemies.filter(e => e.alive);
 
        aliveEnemies.forEach(e => {
            e.x += cfg.enemySpeed * this.enemyDirection;
            if (e.x + e.w > canvas.width - 10 || e.x < 10) {
                hitEdge = true;
            }
        });
 
        if (hitEdge) {
            this.enemyDirection *= -1;
            aliveEnemies.forEach(e => {
                e.y += cfg.enemyDropSpeed;
            });
        }
 
        // Enemy shooting
        if (cfg.enemyShoots && aliveEnemies.length > 0) {
            aliveEnemies.forEach(e => {
                if (Math.random() < cfg.enemyShootChance) {
                    this.enemyBullets.push({
                        x: e.x + e.w / 2 - 3,
                        y: e.y + e.h,
                        w: 6,
                        h: 12,
                        speed: 4 + this.levelIndex,
                    });
                    AudioEngine.enemyShoot();
                }
            });
        }
 
        // Boss update
        if (this.boss && this.boss.alive) {
            this.boss.x += this.boss.speed * this.boss.direction;
            if (this.boss.x + this.boss.w > canvas.width - 20 || this.boss.x < 20) {
                this.boss.direction *= -1;
            }
 
            // Boss shooting (3 bullets in spread)
            this.boss.shootTimer++;
            if (this.boss.shootTimer > 40) {
                this.boss.shootTimer = 0;
                for (let angle = -1; angle <= 1; angle++) {
                    this.enemyBullets.push({
                        x: this.boss.x + this.boss.w / 2 - 3 + angle * 20,
                        y: this.boss.y + this.boss.h,
                        w: 8,
                        h: 14,
                        speed: 5,
                        vx: angle * 1.5,
                    });
                }
                AudioEngine.enemyShoot();
            }
        }
 
        // Update enemy bullets with vx (for boss spread)
        this.enemyBullets.forEach(b => {
            if (b.vx) b.x += b.vx;
        });
 
        // Bullet-enemy collision
        this.bullets.forEach(b => {
            aliveEnemies.forEach(e => {
                if (this.collides(b, e)) {
                    e.hp--;
                    b.y = -100;
                    if (e.hp <= 0) {
                        e.alive = false;
                        this.score += cfg.pointsPerKill;
                        this.kills++;
                        this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#C62828');
                        AudioEngine.explosion();
                    } else {
                        AudioEngine.hit();
                        this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#FFD700', 5);
                    }
                    this.updateHUD();
                }
            });
 
            // Bullet-boss collision
            if (this.boss && this.boss.alive && this.collides(b, this.boss)) {
                this.boss.hp--;
                b.y = -100;
                this.score += 50;
                this.spawnParticles(b.x, b.y, '#FFD700', 4);
                AudioEngine.hit();
 
                if (this.boss.hp <= 0) {
                    this.boss.alive = false;
                    this.score += 2000;
                    this.kills++;
                    this.spawnParticles(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, '#C62828', 30);
                    this.spawnParticles(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, '#FFD700', 20);
                    AudioEngine.explosion();
                    this.showHUDMessage('OMNI-MAN DEFEATED!');
                }
                this.updateHUD();
            }
        });
 
        // Invulnerability timer
        if (this.invulnerable > 0) this.invulnerable--;
 
        // Enemy bullet-player collision
        if (this.invulnerable <= 0) {
            this.enemyBullets.forEach(b => {
                if (this.collides(b, this.player)) {
                    b.y = canvas.height + 100;
                    this.playerDamage();
                }
            });
 
            // Enemy-player collision
            aliveEnemies.forEach(e => {
                if (this.collides(e, this.player)) {
                    e.alive = false;
                    this.playerDamage();
                    this.spawnParticles(e.x + e.w / 2, e.y + e.h / 2, '#C62828');
                }
            });
        }
 
        // Check enemy reaching bottom
        aliveEnemies.forEach(e => {
            if (e.y + e.h >= this.player.y) {
                this.endGame(false);
                return;
            }
        });
 
        // Update particles
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);
 
        // Check win condition for level
        const allEnemiesDead = this.enemies.every(e => !e.alive);
        const bossDead = !this.boss || !this.boss.alive;
 
        if (allEnemiesDead && bossDead && !this.transitioning) {
            if (this.levelIndex < LEVEL_CONFIG.length - 1) {
                this.levelIndex++;
                this.initLevel();
            } else {
                this.endGame(true);
            }
        }
    }
 
    playerDamage() {
        this.lives--;
        this.invulnerable = 90; // ~1.5 seconds
        this.updateHUD();
        AudioEngine.playerHit();
 
        // Screen shake
        const gameScreen = document.getElementById('game-screen');
        gameScreen.classList.add('screen-shake', 'damage-flash');
        setTimeout(() => {
            gameScreen.classList.remove('screen-shake', 'damage-flash');
        }, 300);
 
        if (this.lives <= 0) {
            this.endGame(false);
        } else {
            this.showHUDMessage(`${this.lives} LIVES REMAINING!`);
        }
    }
 
    collides(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    }
 
    render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
 
        // Draw scrolling background grid lines (subtle)
        ctx.strokeStyle = 'rgba(30, 58, 95, 0.15)';
        ctx.lineWidth = 1;
        const gridOffset = (this.frame * 0.3) % 60;
        for (let y = gridOffset; y < canvas.height; y += 60) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
 
        // Draw particles (behind everything)
        this.particles.forEach(p => p.draw());
 
        // Draw player (flashing when invulnerable)
        if (this.invulnerable <= 0 || Math.floor(this.frame / 4) % 2 === 0) {
            drawPlayer(this.player.x, this.player.y, this.player.w, this.player.h);
        }
 
        // Draw player bullets
        this.bullets.forEach(b => {
            ctx.fillStyle = '#00E5FF';
            ctx.shadowColor = '#00E5FF';
            ctx.shadowBlur = 10;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.shadowBlur = 0;
        });
 
        // Draw enemy bullets
        this.enemyBullets.forEach(b => {
            ctx.fillStyle = '#FF4444';
            ctx.shadowColor = '#FF4444';
            ctx.shadowBlur = 8;
            ctx.fillRect(b.x, b.y, b.w, b.h);
            ctx.shadowBlur = 0;
        });
 
        // Draw enemies
        this.enemies.filter(e => e.alive).forEach(e => {
            drawEnemy(e.x, e.y, e.w, e.h, e.type, e.hp, e.maxHP, this.frame);
        });
 
        // Draw boss
        if (this.boss && this.boss.alive) {
            drawBoss(this.boss.x, this.boss.y, this.boss.w, this.boss.h,
                     this.boss.hp, this.boss.maxHP, this.frame);
        }
    }
 
    endGame(victory) {
        this.running = false;
        AudioEngine.stopMusic();
 
        // Save score
        const saved = this.playerName.trim().length >= 3 ?
            Leaderboard.saveScore(this.playerName, this.score) : false;
 
        if (victory) {
            AudioEngine.victory();
            document.getElementById('victory-score').textContent = this.score.toLocaleString();
            document.getElementById('victory-saved-msg').classList.toggle('hidden', !saved);
            showScreen('victory');
        } else {
            AudioEngine.gameOver();
            document.getElementById('gameover-title').textContent =
                this.lives <= 0 ? 'GAME OVER' : 'DEFEATED';
            document.getElementById('final-score').textContent = this.score.toLocaleString();
            document.getElementById('final-level').textContent = this.levelIndex + 1;
            document.getElementById('final-kills').textContent = this.kills;
            document.getElementById('score-saved-msg').classList.toggle('hidden', !saved);
            showScreen('gameover');
        }
 
        this.cleanup();
    }
}
 
// ===== EVENT LISTENERS =====
function initAudioOnInteraction() {
    AudioEngine.init();
    AudioEngine.buttonClick();
}
 
// Start button
document.getElementById('btn-start').addEventListener('click', () => {
    initAudioOnInteraction();
    showScreen('name');
    setTimeout(() => document.getElementById('player-name-input').focus(), 100);
});
 
// Instructions
document.getElementById('btn-instructions').addEventListener('click', () => {
    initAudioOnInteraction();
    showScreen('instructions');
});
 
document.getElementById('btn-back-start').addEventListener('click', () => {
    AudioEngine.buttonClick();
    showScreen('start');
});
 
// Leaderboard from menu
document.getElementById('btn-leaderboard-menu').addEventListener('click', () => {
    initAudioOnInteraction();
    Leaderboard.render();
    showScreen('leaderboard');
});
 
document.getElementById('btn-lb-back').addEventListener('click', () => {
    AudioEngine.buttonClick();
    showScreen('start');
});
 
// Name confirm
document.getElementById('btn-confirm-name').addEventListener('click', startGame);
document.getElementById('player-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') startGame();
});
 
function startGame() {
    const nameInput = document.getElementById('player-name-input');
    const name = nameInput.value.trim();
    if (name.length < 3) {
        nameInput.style.borderColor = '#C62828';
        nameInput.style.boxShadow = '0 0 20px rgba(198,40,40,0.5)';
        setTimeout(() => {
            nameInput.style.borderColor = '#FFD700';
            nameInput.style.boxShadow = '';
        }, 1000);
        return;
    }
 
    if (game) game.cleanup();
    showScreen('game');
    game = new Game(name);
    game.start();
}
 
// Game Over buttons
document.getElementById('btn-play-again').addEventListener('click', () => {
    AudioEngine.buttonClick();
    showScreen('name');
    setTimeout(() => document.getElementById('player-name-input').focus(), 100);
});
 
document.getElementById('btn-gameover-leaderboard').addEventListener('click', () => {
    AudioEngine.buttonClick();
    Leaderboard.render();
    showScreen('leaderboard');
});
 
document.getElementById('btn-gameover-menu').addEventListener('click', () => {
    AudioEngine.buttonClick();
    showScreen('start');
});
 
// Victory buttons
document.getElementById('btn-victory-again').addEventListener('click', () => {
    AudioEngine.buttonClick();
    showScreen('name');
    setTimeout(() => document.getElementById('player-name-input').focus(), 100);
});
 
document.getElementById('btn-victory-leaderboard').addEventListener('click', () => {
    AudioEngine.buttonClick();
    Leaderboard.render();
    showScreen('leaderboard');
});
 
document.getElementById('btn-victory-menu').addEventListener('click', () => {
    AudioEngine.buttonClick();
    showScreen('start');
});
 
// Pause quit
document.getElementById('btn-quit').addEventListener('click', () => {
    if (game) game.cleanup();
    AudioEngine.buttonClick();
    showScreen('start');
});
 
// Initialize start screen
showScreen('start');