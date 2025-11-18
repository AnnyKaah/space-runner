window.addEventListener('load', function() {
    // --- Configuração Inicial do Canvas ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 600;

    // --- LÓGICA DE PRÉ-CARREGAMENTO (PRELOADER) ---
    const assetSources = {
        // Imagens
        heroImage: 'assets/hero-background.png', bgLayer1: 'assets/bg-layer-1.png', bgLayer2: 'assets/bg-layer-2.png',
        playerImage: 'assets/player.png', asteroidImage: 'assets/asteroid.png', energyImage: 'assets/energy.png',
        shieldPowerupImage: 'assets/shield_powerup.png', shieldActiveImage: 'assets/shield_active.png', 
        slowmoPowerupImage: 'assets/slowmo_powerup.png',
        enemyShipImage: 'assets/enemy_ship.png',
        projectileImage: 'assets/projectile.png',
        buttonImage: 'assets/button.png', soundOnIcon: 'assets/sound_on.png', soundOffIcon: 'assets/sound_off.png',
        settingsIcon: 'assets/settings_icon.png', // NOVO ASSET
        backIcon: 'assets/back_icon.png', // NOVO ASSET
        // Sons
        collectSfx: 'assets/sfx/collect.mp3', powerupSfx: 'assets/sfx/powerup.mp3', explosionSfx: 'assets/sfx/explosion.mp3',
        music: 'assets/sfx/music.mp3', newRecordSfx: 'assets/sfx/new_record.mp3',
        slowmoSfx: 'assets/sfx/slowmo.mp3', slowmoEndSfx: 'assets/sfx/slowmo_end.mp3',
        enemyShootSfx: 'assets/sfx/enemy_shoot.mp3'
    };

    const assets = {};
    let assetsLoaded = 0;
    const totalAssets = Object.keys(assetSources).length;

    for (const key in assetSources) {
        const src = assetSources[key];
        if (src.endsWith('.png')) {
            assets[key] = new Image();
            assets[key].onload = () => assetsLoaded++;
        } else {
            assets[key] = new Audio();
            assets[key].oncanplaythrough = () => assetsLoaded++;
        }
        assets[key].src = src;
    }
    
    // --- CLASSES DO JOGO ---
    class Player {
        constructor(game) {
            this.game = game;
            this.width = 50; this.height = 40; this.speed = 5;
            this.maxLives = 3;
            this.reset();
        }
        reset() {
            this.x = 50; this.y = canvas.height / 2;
            this.shieldActive = false; this.trailParticles = [];
            this.lives = this.maxLives;
            this.isInvincible = false;
            this.invincibilityTimer = 0;
        }
        draw(ctx) {
            // Efeito de piscar quando invencível
            if (this.isInvincible) {
                if (Math.floor(this.game.frameCount / 5) % 2 === 0) {
                    return; // Pula o desenho em alguns frames para criar o efeito
                }
            }
            ctx.drawImage(assets.playerImage, this.x, this.y, this.width, this.height);
            if (this.shieldActive) {
                ctx.drawImage(assets.shieldActiveImage, this.x - 10, this.y - 10, this.width + 20, this.height + 20);
            }
        }
        update() {
            // Lógica do temporizador de invencibilidade
            if (this.isInvincible) {
                this.invincibilityTimer--;
                if (this.invincibilityTimer <= 0) {
                    this.isInvincible = false;
                }
            }
            if (this.game.keys.ArrowUp && this.y > 0) this.y -= this.speed;
            if (this.game.keys.ArrowDown && this.y < this.game.height - this.height) this.y += this.speed;
        }
        handleTrail(ctx) {
            this.trailParticles.push({ x: this.x, y: this.y + this.height / 2, size: Math.random() * 5 + 2, opacity: 1 });
            for (let i = this.trailParticles.length - 1; i >= 0; i--) {
                const p = this.trailParticles[i];
                p.x -= this.speed * 1.5; p.opacity -= 0.05; p.size -= 0.1;
                if (p.opacity <= 0 || p.size <= 0) { this.trailParticles.splice(i, 1); } 
                else { ctx.fillStyle = `rgba(255, 200, 0, ${p.opacity})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
            }
        }
        loseLife() {
            if (this.isInvincible) return;
            this.lives--;
            this.isInvincible = true;
            this.invincibilityTimer = 120; // 2 segundos de invencibilidade a 60 FPS
        }
    }

    class Obstacle {
        constructor(game, x, y, size, isWandering = false, vy = 0) {
            this.game = game;
            this.x = x; this.y = y; this.size = size;
            this.isWandering = isWandering; this.vy = vy;
        }
        update() {
            this.x -= this.game.obstacleSpeed;
            if (this.isWandering) {
                this.y += this.vy;
                if (this.y < 0 || this.y > this.game.height) { this.vy *= -1; }
            }
        }
        draw(ctx) {
            ctx.drawImage(assets.asteroidImage, this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        }
    }

    class Collectible {
        constructor(game, x, y, type) {
            this.game = game;
            this.x = x; this.y = y; this.type = type;
            this.width = 30; this.height = 30;
            this.initialY = y;
            // Lógica para selecionar a imagem correta
            if (type === 'energy') this.image = assets.energyImage;
            else if (type === 'shield') this.image = assets.shieldPowerupImage;
            else if (type === 'slowmo') this.image = assets.slowmoPowerupImage;

        }
        update() {
            this.x -= this.game.obstacleSpeed;
            this.y = this.initialY + Math.sin(this.game.frameCount * 0.1) * 5;
        }
        draw(ctx) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    class Particle {
        constructor(game, x, y, color, count = 10) {
            this.game = game;
            this.particles = [];
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: x, y: y,
                    size: Math.random() * 5 + 2,
                    speedX: Math.random() * 3 - 1.5,
                    speedY: Math.random() * 3 - 1.5,
                    color: color,
                    opacity: 1
                });
            }
        }
        update() {
            this.particles.forEach(p => {
                p.x += p.speedX; p.y += p.speedY;
                p.opacity -= 0.03;
                if (p.size > 0.2) p.size -= 0.1;
            });
            this.particles = this.particles.filter(p => p.opacity > 0 && p.size > 0.2);
        }
    }

    class Enemy {
        constructor(game) {
            this.game = game;
            this.width = 50;
            this.height = 45;
            this.x = this.game.width;
            this.y = Math.random() * (this.game.height * 0.8) + (this.game.height * 0.1);
            this.speedX = -1;
            this.shootTimer = Math.random() * 120; // Randomiza o primeiro tiro
            this.shootInterval = 120; // Atira a cada 2 segundos
            this.markedForDeletion = false;
        }
        update() {
            this.x += this.speedX;
            if (this.x + this.width < 0) this.markedForDeletion = true;

            this.shootTimer++;
            if (this.shootTimer >= this.shootInterval) {
                this.shoot();
                this.shootTimer = 0;
            }
        }
        draw(ctx) {
            ctx.drawImage(assets.enemyShipImage, this.x, this.y, this.width, this.height);
        }
        shoot() {
            const projectileX = this.x;
            const projectileY = this.y + this.height / 2 - 5; // Ajusta a posição do projétil
            this.game.projectiles.push(new Projectile(this.game, projectileX, projectileY));
            this.game.playSound(assets.enemyShootSfx);
        }
    }

    class Projectile {
        constructor(game, x, y) {
            this.game = game;
            this.x = x; this.y = y;
            this.width = 20; this.height = 10;
            this.speed = -4; // Velocidade do projétil
            this.markedForDeletion = false;
        }
        update() {
            this.x += this.speed;
            if (this.x + this.width < 0) this.markedForDeletion = true;
        }
        draw(ctx) { ctx.drawImage(assets.projectileImage, this.x, this.y, this.width, this.height); }
    }

    class Game {
        constructor(canvas, ctx) {
            this.canvas = canvas;
            this.ctx = ctx;
            this.width = canvas.width;
            this.height = canvas.height;
            
            // Estados e Variáveis
            this.gameState = 'loading';
            this.score = 0; this.level = 1; this.frameCount = 0;
            this.bestScore = localStorage.getItem('spaceRunnerBestScore') || 0;
            this.newBestScoreReached = false;
            this.isMuted = false;
            // Carrega volumes do localStorage ou usa padrões
            this.musicVolume = localStorage.getItem('spaceRunnerMusicVolume') || 0.3;
            this.sfxVolume = localStorage.getItem('spaceRunnerSfxVolume') || 0.5;
            this.previousGameState = 'start';

            this.screenShake = 0;
            this.obstacleSpeed = 3;
            this.bg1_x = 0; this.bg2_x = 0;
            this.parallaxSpeedLayer1 = 0.2; this.parallaxSpeedLayer2 = 0.5;

            // Estado do Power-up Slow Motion
            this.isSlowMotionActive = false;
            this.slowMotionTimer = 0;
            this.originalObstacleSpeed = 3;

            // Entidades do Jogo
            this.particles = []; this.obstacles = []; this.collectibles = []; this.enemies = []; this.projectiles = [];
            this.player = new Player(this);

            // Controles e UI
            this.keys = { ArrowUp: false, ArrowDown: false };
            this.startButton = { x: this.width / 2 - 100, y: 450, width: 200, height: 50 };
            this.muteButton = { x: this.width - 40, y: 10, width: 30, height: 30 };
            this.settingsButton = { x: 10, y: 10, width: 40, height: 40 };
            this.backButton = { x: 10, y: 10, width: 40, height: 40 };
            this.pauseButton = { x: 10, y: 10, width: 40, height: 40 };

            // Botões da tela de pausa
            this.resumeButton = { x: this.width / 2 - 100, y: 200, width: 200, height: 50 };
            this.pauseSettingsButton = { x: this.width / 2 - 100, y: 270, width: 200, height: 50 };
            this.quitButton = { x: this.width / 2 - 100, y: 340, width: 200, height: 50 };

            // UI da tela de configurações
            this.musicSlider = { x: this.width / 2 - 100, y: 200, width: 200, height: 20, handleX: 0 };
            this.sfxSlider = { x: this.width / 2 - 100, y: 350, width: 200, height: 20, handleX: 0 };
            this.draggingSlider = null; // Qual slider está sendo arrastado
            this.updateSliderHandles();

            // Inicializa os event listeners
            this.initListeners();
        }

        initListeners() {
            this.canvas.addEventListener('click', this.handleMouseClick.bind(this));
            window.addEventListener('keydown', e => { if (this.gameState === 'playing' && this.keys.hasOwnProperty(e.key)) { e.preventDefault(); this.keys[e.key] = true; } });
            window.addEventListener('keyup', e => { if (this.keys.hasOwnProperty(e.key)) { e.preventDefault(); this.keys[e.key] = false; } });
            this.canvas.addEventListener('touchstart', this.handleTouch.bind(this), { passive: false });
            this.canvas.addEventListener('touchmove', this.handleTouch.bind(this), { passive: false });
            // Listeners para arrastar os sliders
            this.canvas.addEventListener('mousedown', this.handleSliderDragStart.bind(this));
            window.addEventListener('mousemove', this.handleSliderDrag.bind(this));
            window.addEventListener('mouseup', this.handleSliderDragEnd.bind(this));
        }

        // --- MÉTODOS DE CONTROLE ---
        handleTouch(event) {
            if (this.gameState === 'playing') {
                event.preventDefault();
                const touch = event.touches[0];
                this.player.y = touch.clientY - this.canvas.getBoundingClientRect().top - (this.player.height / 2);
            }
        }

        handleMouseClick(event) {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left, mouseY = event.clientY - rect.top;

            // Botão de Pausa (durante o jogo)
            if (this.gameState === 'playing' && this.isClickInside(mouseX, mouseY, this.pauseButton)) {
                this.gameState = 'paused';
                return;
            }

            // Botões da tela de Pausa
            if (this.gameState === 'paused') {
                if (this.isClickInside(mouseX, mouseY, this.resumeButton)) {
                    this.gameState = 'playing';
                } else if (this.isClickInside(mouseX, mouseY, this.pauseSettingsButton)) {
                    this.previousGameState = 'paused'; // Para voltar para a pausa
                    this.gameState = 'settings';
                } else if (this.isClickInside(mouseX, mouseY, this.quitButton)) {
                    this.gameState = 'start';
                }
                return;
            }

            // Botão de Mudo (atalho)
            if (this.gameState !== 'settings' && this.gameState !== 'paused' && this.isClickInside(mouseX, mouseY, this.muteButton)) {
                this.isMuted = !this.isMuted;
                assets.music.muted = this.isMuted;
                return;
            }

            // Botão de Configurações
            if ((this.gameState === 'start' || this.gameState === 'gameOver') && this.isClickInside(mouseX, mouseY, this.settingsButton)) {
                this.previousGameState = this.gameState;
                this.gameState = 'settings';
                return;
            }

            // Botão de Voltar (da tela de Configurações)
            if (this.gameState === 'settings') {
                if (this.isClickInside(mouseX, mouseY, this.backButton)) {
                    this.gameState = this.previousGameState;
                    return;
                }
            }

            // Botão de Iniciar/Jogar de Novo
            if ((this.gameState === 'start' || this.gameState === 'gameOver') && this.isClickInside(mouseX, mouseY, this.startButton)) {
                if (assets.music.paused) { assets.music.play(); }
                this.resetGame();
                this.gameState = 'playing';
            }
        }

        handleSliderDragStart(event) {
            if (this.gameState !== 'settings') return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            if (this.isClickInside(mouseX, mouseY, this.musicSlider)) this.draggingSlider = this.musicSlider;
            else if (this.isClickInside(mouseX, mouseY, this.sfxSlider)) this.draggingSlider = this.sfxSlider;

            if (this.draggingSlider) this.updateVolumeFromMouse(mouseX);
        }

        handleSliderDrag(event) {
            if (!this.draggingSlider) return;
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            this.updateVolumeFromMouse(mouseX);
        }

        handleSliderDragEnd() {
            this.draggingSlider = null;
        }

        updateVolumeFromMouse(mouseX) {
            const slider = this.draggingSlider;
            let handleX = mouseX - slider.x;
            handleX = Math.max(0, Math.min(slider.width, handleX)); // Limita o movimento
            slider.handleX = handleX;
            const volume = (handleX / slider.width).toFixed(2);

            if (slider === this.musicSlider) {
                this.musicVolume = volume;
                assets.music.volume = this.musicVolume;
                localStorage.setItem('spaceRunnerMusicVolume', this.musicVolume);
            } else if (slider === this.sfxSlider) {
                this.sfxVolume = volume;
                localStorage.setItem('spaceRunnerSfxVolume', this.sfxVolume);
            }
        }
        isClickInside(x, y, rect) { return x > rect.x && x < rect.x + rect.width && y > rect.y && y < rect.y + rect.height; }
        playSound(sound) { if (!this.isMuted) { const sfx = sound.cloneNode(true); sfx.volume = this.sfxVolume; sfx.play(); } }

        // --- MÉTODOS DE LÓGICA DO JOGO ---
        resetGame() { this.score = 0; this.level = 1; this.obstacleSpeed = 3; this.frameCount = 0; this.newBestScoreReached = false; this.obstacles = []; this.collectibles = []; this.particles = []; this.enemies = []; this.projectiles = []; this.player.reset(); this.isSlowMotionActive = false; this.slowMotionTimer = 0; }
        
        createObstacle() {
            const baseGap = 220, minGap = 160;
            const gap = Math.max(minGap, baseGap - this.level * 8);
            const position = Math.random() * (this.height - gap - 100) + 50;
            const clusterCount = Math.floor(Math.random() * 5) + 3 + this.level;
            for (let i = 0; i < clusterCount; i++) { this.obstacles.push(new Obstacle(this, this.width + (Math.random() * 100), Math.random() * (position - 50), Math.random() * 30 + 20)); }
            for (let i = 0; i < clusterCount; i++) { this.obstacles.push(new Obstacle(this, this.width + (Math.random() * 100), position + gap + (Math.random() * (this.height - position - gap)), Math.random() * 30 + 20)); }
            if (this.level >= 3 && Math.random() < 0.15) { this.obstacles.push(new Obstacle(this, this.width + 50, Math.random() * this.height, Math.random() * 20 + 25, true, (Math.random() - 0.5) * 2)); }
            const collectibleY = position + gap / 2;

            // Chance de criar um inimigo em vez de um obstáculo
            if (this.level >= 4 && Math.random() < 0.2) { // 20% de chance a partir do nível 4
                this.enemies.push(new Enemy(this));
            }

            // Lógica de spawn de coletáveis
            const rand = Math.random();
            if (rand < 0.08 && this.level >= 2) { // 8% de chance a partir do nível 2
                this.collectibles.push(new Collectible(this, this.width + 50, collectibleY, 'slowmo'));
            } else if (rand < 0.15) { // 7% de chance (total 15%)
                this.collectibles.push(new Collectible(this, this.width + 50, collectibleY, 'shield'));
            } else if (rand < 0.6) { // 45% de chance (total 60%)
                this.collectibles.push(new Collectible(this, this.width + 50, collectibleY, 'energy'));
            }
        }

        handleGameElements() {
            if (this.frameCount % (150 - this.level * 5) === 0) this.createObstacle();
            this.obstacles.forEach(obs => obs.update());
            this.collectibles.forEach(item => item.update());
            this.enemies.forEach(enemy => enemy.update());
            this.projectiles.forEach(proj => proj.update());
            this.particles.forEach(p => p.update());

            // Lógica do timer do Slow Motion
            if (this.isSlowMotionActive) {
                this.slowMotionTimer--;
                if (this.slowMotionTimer <= 0) this.deactivateSlowMotion();
            }

            this.obstacles = this.obstacles.filter(obs => obs.x + obs.size > 0);
            this.collectibles = this.collectibles.filter(item => item.x + item.width > 0);
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);
            this.projectiles = this.projectiles.filter(proj => !proj.markedForDeletion);
            this.particles = this.particles.filter(p => p.particles.length > 0);
        }

        checkCollisions() {
            // Jogador vs Obstáculos
            for (let i = this.obstacles.length - 1; i >= 0; i--) { // Loop reverso para remoção segura
                const obs = this.obstacles[i];
                const dist = Math.hypot(this.player.x + this.player.width / 2 - obs.x, this.player.y + this.player.height / 2 - obs.y);
                if (!this.player.isInvincible && dist < obs.size / 2 + this.player.width / 2 - 10) {
                    this.particles.push(new Particle(this, obs.x, obs.y, '#ff6347', 20));
                    if (this.player.shieldActive) {
                        this.player.shieldActive = false;
                        this.obstacles.splice(i, 1);
                        this.playSound(assets.explosionSfx);
                    } else {
                        this.player.loseLife();
                        this.playSound(assets.explosionSfx);
                        this.screenShake = 15;
                        if (this.player.lives <= 0) {
                            this.gameState = 'gameOver';
                            if (this.score > this.bestScore) { this.bestScore = this.score; localStorage.setItem('spaceRunnerBestScore', this.bestScore); }
                        }
                    }
                }
            }

            // Jogador vs Inimigos
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                if (!this.player.isInvincible && this.isRectColliding(this.player, enemy)) {
                    this.handlePlayerHit(enemy.x, enemy.y);
                    enemy.markedForDeletion = true;
                }
            }

            // Jogador vs Projéteis Inimigos
            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const proj = this.projectiles[i];
                if (!this.player.isInvincible && this.isRectColliding(this.player, proj)) {
                    this.handlePlayerHit(proj.x, proj.y);
                    proj.markedForDeletion = true;
                }
            }

            // Jogador vs Coletáveis
            for (let i = this.collectibles.length - 1; i >= 0; i--) { // Loop reverso para remoção segura
                const item = this.collectibles[i];
                if (this.player.x < item.x + item.width && this.player.x + this.player.width > item.x && this.player.y < item.y + item.height && this.player.y + this.player.height > item.y) {
                    if (item.type === 'energy') { this.score += 50; this.playSound(assets.collectSfx); this.particles.push(new Particle(this, item.x + item.width / 2, item.y + item.height / 2, '#ffd700', 10)); } 
                    else if (item.type === 'shield') { this.player.shieldActive = true; this.playSound(assets.powerupSfx); this.particles.push(new Particle(this, item.x + item.width / 2, item.y + item.height / 2, '#00bfff', 15)); } 
                    else if (item.type === 'slowmo') { this.activateSlowMotion(); }
                    this.collectibles.splice(i, 1);
                }
            }
        }

        isRectColliding(rect1, rect2) {
            return rect1.x < rect2.x + rect2.width &&
                   rect1.x + rect1.width > rect2.x &&
                   rect1.y < rect2.y + rect2.height &&
                   rect1.height + rect1.y > rect2.y;
        }

        handlePlayerHit(x, y) {
            this.particles.push(new Particle(this, x, y, '#ff6347', 20));
            this.player.loseLife();
            this.playSound(assets.explosionSfx);
            this.screenShake = 15;
            if (this.player.lives <= 0) {
                this.gameState = 'gameOver';
                if (this.score > this.bestScore) { this.bestScore = this.score; localStorage.setItem('spaceRunnerBestScore', this.bestScore); }
            }
        }

        activateSlowMotion() {
            if (!this.isSlowMotionActive) { // Evita reativar se já estiver ativo
                this.originalObstacleSpeed = this.obstacleSpeed;
                this.obstacleSpeed *= 0.5; // Reduz a velocidade pela metade
            }
            this.isSlowMotionActive = true;
            this.slowMotionTimer = 300; // 5 segundos a 60 FPS
            this.playSound(assets.slowmoSfx);
        }

        deactivateSlowMotion() {
            this.isSlowMotionActive = false;
            this.obstacleSpeed = this.originalObstacleSpeed; // Restaura a velocidade
            this.playSound(assets.slowmoEndSfx);
        }

        updateScoreAndLevel() { this.score++; if (!this.newBestScoreReached && this.score > this.bestScore) { this.newBestScoreReached = true; this.playSound(assets.newRecordSfx); } if (this.level < 10 && this.score > 0 && this.score % 500 === 0) { this.level++; this.obstacleSpeed += 0.5; } }

        // --- MÉTODOS DE DESENHO ---
        drawBackground() { this.bg1_x = (this.bg1_x - this.parallaxSpeedLayer1) % this.width; this.bg2_x = (this.bg2_x - this.parallaxSpeedLayer2) % this.width; this.ctx.drawImage(assets.bgLayer1, this.bg1_x, 0, this.width, this.height); this.ctx.drawImage(assets.bgLayer1, this.bg1_x + this.width, 0, this.width, this.height); this.ctx.drawImage(assets.bgLayer2, this.bg2_x, 0, this.width, this.height); this.ctx.drawImage(assets.bgLayer2, this.bg2_x + this.width, 0, this.width, this.height); }
        
        drawGameElements() {
            this.obstacles.forEach(obs => obs.draw(this.ctx));
            this.collectibles.forEach(item => item.draw(this.ctx));
            this.enemies.forEach(enemy => enemy.draw(this.ctx));
            this.projectiles.forEach(proj => proj.draw(this.ctx));
            this.particles.forEach(p => p.particles.forEach(particle => {
                this.ctx.save(); this.ctx.globalAlpha = particle.opacity; this.ctx.fillStyle = particle.color;
                this.ctx.beginPath(); this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); this.ctx.fill();
                this.ctx.restore();
            }));
        }

        drawTextWithOutline(text, x, y, font, fillColor, outlineColor, textAlign = 'left') {
            const textMetrics = this.ctx.measureText('M'); const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
            this.ctx.font = font; this.ctx.textAlign = textAlign;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'; this.ctx.shadowBlur = 5; this.ctx.shadowOffsetX = 2; this.ctx.shadowOffsetY = 2;
            this.ctx.strokeStyle = outlineColor; this.ctx.lineWidth = 4; this.ctx.strokeText(text, x, y);
            const gradient = this.ctx.createLinearGradient(x, y - textHeight / 2, x, y + textHeight / 2);
            gradient.addColorStop(0, fillColor); gradient.addColorStop(1, '#cccccc');
            this.ctx.fillStyle = gradient; this.ctx.fillText(text, x, y);
            this.ctx.shadowColor = 'transparent'; this.ctx.shadowBlur = 0; this.ctx.shadowOffsetX = 0; this.ctx.shadowOffsetY = 0;
        }

        drawUI() {
            let scoreColor = 'white', scoreFont = 'bold 22px "Courier New", Courier, monospace';
            if (this.newBestScoreReached && this.frameCount % 20 < 10) { scoreColor = '#FFD700'; }
            this.drawTextWithOutline(`PONTOS: ${this.score}`, 20, 35, scoreFont, scoreColor, 'black', 'left');
            this.drawTextWithOutline(`RECORDE: ${this.bestScore}`, 20, 60, '16px "Courier New", Courier, monospace', 'white', 'black', 'left');

            // Desenha as vidas do jogador
            this.ctx.globalAlpha = this.player.isInvincible ? 0.5 : 1.0;
            for (let i = 0; i < this.player.lives; i++) {
                this.ctx.drawImage(assets.playerImage, this.width - 40 - (i * 35), 45, 30, 24);
            }
            this.ctx.globalAlpha = 1.0;
        }

        drawMuteButton() { this.ctx.drawImage(this.isMuted ? assets.soundOffIcon : assets.soundOnIcon, this.muteButton.x, this.muteButton.y, this.muteButton.width, this.muteButton.height); }
        drawCustomButton(text, buttonRect) { this.ctx.drawImage(assets.buttonImage, buttonRect.x, buttonRect.y, buttonRect.width, buttonRect.height); this.ctx.fillStyle = '#FFFFFF'; this.ctx.font = 'bold 24px "Courier New", Courier, monospace'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle'; this.ctx.fillText(text, buttonRect.x + buttonRect.width / 2, buttonRect.y + buttonRect.height / 2); }
        drawLoadingScreen() { this.ctx.fillStyle = 'black'; this.ctx.fillRect(0, 0, this.width, this.height); this.ctx.fillStyle = 'white'; this.ctx.textAlign = 'center'; this.ctx.font = '20px "Courier New", Courier, monospace'; const progress = totalAssets > 0 ? (assetsLoaded / totalAssets) * 100 : 100; this.ctx.fillText(`CARREGANDO... ${Math.floor(progress)}%`, this.width / 2, this.height / 2); }
        
        drawTitle() {
            const scale = 1 + Math.sin(this.frameCount * 0.05) * 0.05; // Efeito de pulsar
            this.ctx.save();
            this.ctx.translate(this.width / 2, 150);
            this.ctx.scale(scale, scale);
            this.drawTextWithOutline('SPACE', 0, -40, 'bold 70px "Courier New", Courier, monospace', '#ff4d4d', 'black', 'center');
            this.drawTextWithOutline('RUNNER', 0, 40, 'bold 70px "Courier New", Courier, monospace', 'white', 'black', 'center');
            this.ctx.restore();
        }

        drawStartScreen() { 
            this.drawBackground(); // Usa o fundo parallax dinâmico
            this.drawTitle(); // Desenha o título animado
            this.drawTextWithOutline('Use as setas ou deslize para mover', this.width / 2, this.height - 200, '18px "Courier New", Courier, monospace', 'white', 'black', 'center');
            this.drawCustomButton('INICIAR', this.startButton); 
            this.player.draw(this.ctx); 
            this.drawMuteButton(); 
            this.ctx.drawImage(assets.settingsIcon, this.settingsButton.x, this.settingsButton.y, this.settingsButton.width, this.settingsButton.height);
        }

        drawPauseScreen() {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.drawTextWithOutline('PAUSADO', this.width / 2, 100, 'bold 50px "Courier New", Courier, monospace', 'white', 'black', 'center');
            this.drawCustomButton('CONTINUAR', this.resumeButton);
            this.drawCustomButton('CONFIGURAÇÕES', this.pauseSettingsButton);
            this.drawCustomButton('SAIR', this.quitButton);
        }

        drawSettingsScreen() {
            this.drawBackground();
            this.drawTextWithOutline('CONFIGURAÇÕES', this.width / 2, 80, 'bold 40px "Courier New", Courier, monospace', 'white', 'black', 'center');
            
            // Slider de Música
            this.drawTextWithOutline('Música', this.width / 2, 160, '24px "Courier New", Courier, monospace', 'white', 'black', 'center');
            this.drawSlider(this.musicSlider);

            // Slider de Efeitos Sonoros
            this.drawTextWithOutline('Efeitos', this.width / 2, 310, '24px "Courier New", Courier, monospace', 'white', 'black', 'center');
            this.drawSlider(this.sfxSlider);

            // Botão de Voltar
            this.ctx.drawImage(assets.backIcon, this.backButton.x, this.backButton.y, this.backButton.width, this.backButton.height);
        }

        drawSlider(slider) {
            this.ctx.fillStyle = '#444';
            this.ctx.fillRect(slider.x, slider.y, slider.width, slider.height);
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillRect(slider.x + slider.handleX - 5, slider.y - 5, 10, slider.height + 10);
        }
        
        drawGameOverScreen() { this.drawBackground(); this.drawGameElements(); this.player.draw(this.ctx); this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; this.ctx.fillRect(0, 0, this.width, this.height); this.ctx.fillStyle = 'white'; this.ctx.textBaseline = 'middle'; this.drawTextWithOutline('Sua Pontuação', this.width / 2, this.height / 2 - 100, '20px "Courier New", Courier, monospace', 'white', 'black', 'center'); this.drawTextWithOutline(this.score, this.width / 2, this.height / 2 - 40, 'bold 70px "Courier New", Courier, monospace', '#ff4d4d', 'black', 'center'); this.drawTextWithOutline(`RECORDE: ${this.bestScore}`, this.width / 2, this.height / 2 + 20, '16px "Courier New", Courier, monospace', 'white', 'black', 'center'); this.drawCustomButton('JOGAR DE NOVO', this.startButton); this.drawMuteButton(); }

        // --- LOOP PRINCIPAL ---
        run() {
            this.ctx.clearRect(0, 0, this.width, this.height);
            if (this.gameState === 'loading') {
                this.drawLoadingScreen();
                if (assetsLoaded >= totalAssets) {
                    this.gameState = 'start';
                    assets.music.loop = true;
                    assets.music.volume = this.musicVolume;
                    assets.music.muted = this.isMuted;
                }
            } else {
                this.ctx.save();
                if (this.screenShake > 0) { this.ctx.translate(Math.random() * 10 - 5, Math.random() * 10 - 5); this.screenShake--; }
                if (this.gameState === 'playing') {
                    this.frameCount++;
                    this.drawBackground();
                    this.player.handleTrail(this.ctx);
                    this.player.update();
                    this.handleGameElements();
                    this.checkCollisions();
                    this.updateScoreAndLevel();
                    this.drawGameElements();
                    this.player.draw(this.ctx);
                    this.drawUI();
                    this.drawMuteButton();
                    this.ctx.drawImage(assets.settingsIcon, this.pauseButton.x, this.pauseButton.y, this.pauseButton.width, this.pauseButton.height);
                } else if (this.gameState === 'start') {
                    this.drawStartScreen();
                    this.frameCount++; // Incrementa o frameCount para as animações da tela inicial
                    // Animação do jogador na tela inicial
                    this.player.y = (this.height / 2) + Math.sin(this.frameCount * 0.05) * 10;
                } else if (this.gameState === 'settings') {
                    this.drawSettingsScreen();
                } else if (this.gameState === 'paused') {
                    // Desenha o estado do jogo por baixo e a tela de pausa por cima
                    this.drawGameElements(); this.player.draw(this.ctx); this.drawUI();
                    this.drawPauseScreen();
                } else if (this.gameState === 'gameOver') {
                    this.drawGameOverScreen();
                }
                this.ctx.restore();
            }
            requestAnimationFrame(this.run.bind(this));
        }

        updateSliderHandles() {
            this.musicSlider.handleX = this.musicSlider.width * this.musicVolume;
            this.sfxSlider.handleX = this.sfxSlider.width * this.sfxVolume;
        }
    }

    const game = new Game(canvas, ctx);
    game.run();
});
