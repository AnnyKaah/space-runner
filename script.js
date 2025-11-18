window.addEventListener('load', function() {
    // --- Configuração Inicial ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 600;

    // --- Estados do Jogo ---
    let gameState = 'start'; // 'start', 'playing', 'gameOver'
    let score = 0;
    let level = 1;
    let frameCount = 0;
    let bestScore = localStorage.getItem('spaceRunnerBestScore') || 0; // Salva o melhor placar

    // --- Carregamento de Assets ---
    const heroImage = new Image();
    heroImage.src = 'assets/hero-background.png';
    const bgLayer1 = new Image();
    bgLayer1.src = 'assets/bg-layer-1.png';
    const bgLayer2 = new Image();
    bgLayer2.src = 'assets/bg-layer-2.png';
    
    const playerImage = new Image();
    playerImage.src = 'assets/player.png';
    const asteroidImage = new Image();
    asteroidImage.src = 'assets/asteroid.png';
    const energyImage = new Image();
    energyImage.src = 'assets/energy.png';
    const shieldPowerupImage = new Image();
    shieldPowerupImage.src = 'assets/shield_powerup.png';
    const shieldActiveImage = new Image();
    shieldActiveImage.src = 'assets/shield_active.png';

    // --- Configuração do Fundo com Paralaxe ---
    let bg1_x = 0;
    let bg2_x = 0;
    const parallaxSpeedLayer1 = 0.2; // Velocidade da camada mais distante
    const parallaxSpeedLayer2 = 0.5; // Velocidade da camada intermediária

    // --- Jogador ---
    const player = {
        x: 50,
        y: canvas.height / 2,
        width: 50,
        height: 40,
        speed: 5,
        shieldActive: false
    };

    // --- Controles ---
    const keys = { ArrowUp: false, ArrowDown: false };
    // Adiciona um "botão" invisível na tela de início
    const startButton = { x: canvas.width / 2 - 100, y: canvas.height / 2 + 40, width: 200, height: 50 };

    function handleMouseClick(event) {
        if (gameState === 'start' || gameState === 'gameOver') {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Verifica se o clique foi dentro da área do "botão"
            if (mouseX > startButton.x && mouseX < startButton.x + startButton.width &&
                mouseY > startButton.y && mouseY < startButton.y + startButton.height) {
                resetGame();
                gameState = 'playing';
            }
        }
    }
    canvas.addEventListener('click', handleMouseClick);

    window.addEventListener('keydown', function(e) {
        if (gameState === 'playing' && keys.hasOwnProperty(e.key)) {
            e.preventDefault();
            keys[e.key] = true;
        }
    });
    window.addEventListener('keyup', function(e) {
        if (keys.hasOwnProperty(e.key)) {
            e.preventDefault();
            keys[e.key] = false;
        }
    });

    // --- Obstáculos, Colecionáveis e Power-ups ---
    let obstacles = [];
    let collectibles = [];
    let obstacleSpeed = 3;

    function createObstacle() {
        const obstacleWidth = 50;
        const gap = 200;
        const randomHeight = Math.floor(Math.random() * (canvas.height - gap - 80)) + 40;

        obstacles.push({ x: canvas.width, y: 0, width: obstacleWidth, height: randomHeight });
        obstacles.push({ x: canvas.width, y: randomHeight + gap, width: obstacleWidth, height: canvas.height - randomHeight - gap });

        if (Math.random() < 0.5) {
            collectibles.push({ x: canvas.width + obstacleWidth / 2, y: randomHeight + gap / 2, type: 'energy', width: 30, height: 30 });
        } else if (Math.random() < 0.1) {
            collectibles.push({ x: canvas.width + obstacleWidth / 2, y: randomHeight + gap / 2, type: 'shield', width: 30, height: 30 });
        }
    }

    function handleGameElements() {
        if (frameCount % (120 - level * 5) === 0) createObstacle();
        
        obstacles.forEach(obs => {
            obs.x -= obstacleSpeed;
            ctx.drawImage(asteroidImage, obs.x, obs.y, obs.width, obs.height);
        });
        obstacles = obstacles.filter(obs => obs.x + obs.width > 0);

        collectibles.forEach(item => {
            item.x -= obstacleSpeed;
            const img = item.type === 'energy' ? energyImage : shieldPowerupImage;
            ctx.drawImage(img, item.x, item.y, item.width, item.height);
        });
        collectibles = collectibles.filter(item => item.x + item.width > 0);
    }

    // --- Lógica do Jogo ---
    function updatePlayerPosition() {
        if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
        if (keys.ArrowDown && player.y < canvas.height - player.height) player.y += player.speed;
    }

    function checkCollisions() {
        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (isColliding(player, obstacles[i])) {
                if (player.shieldActive) {
                    player.shieldActive = false;
                    obstacles.splice(i, 1);
                } else {
                    gameState = 'gameOver';
                    if (score > bestScore) {
                        bestScore = score;
                        localStorage.setItem('spaceRunnerBestScore', bestScore);
                    }
                }
                return;
            }
        }
        for (let i = collectibles.length - 1; i >= 0; i--) {
            if (isColliding(player, collectibles[i])) {
                if (collectibles[i].type === 'energy') score += 50;
                else if (collectibles[i].type === 'shield') player.shieldActive = true;
                collectibles.splice(i, 1);
            }
        }
    }
    
    function isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
    }

    function updateScoreAndLevel() {
        score++;
        if (level < 10 && score > 0 && score % 500 === 0) {
            level++;
            obstacleSpeed += 0.5;
        }
    }
    
    function resetGame() {
        score = 0;
        level = 1;
        obstacleSpeed = 3;
        obstacles = [];
        collectibles = [];
        player.y = canvas.height / 2;
        player.shieldActive = false;
        frameCount = 0;
    }

    // --- Funções de Desenho ---
    function drawBackground() {
        // Desenha a primeira camada e a move
        ctx.drawImage(bgLayer1, bg1_x, 0, canvas.width, canvas.height);
        ctx.drawImage(bgLayer1, bg1_x + canvas.width, 0, canvas.width, canvas.height); // Desenha uma cópia para o loop
        bg1_x -= parallaxSpeedLayer1;
        if (bg1_x < -canvas.width) bg1_x = 0;

        // Desenha a segunda camada e a move mais rápido
        ctx.drawImage(bgLayer2, bg2_x, 0, canvas.width, canvas.height);
        ctx.drawImage(bgLayer2, bg2_x + canvas.width, 0, canvas.width, canvas.height);
        bg2_x -= parallaxSpeedLayer2;
        if (bg2_x < -canvas.width) bg2_x = 0;
    }

    function drawPlayer() {
        ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
        if (player.shieldActive) {
            ctx.drawImage(shieldActiveImage, player.x - 10, player.y - 10, player.width + 20, player.height + 20);
        }
    }

    function drawUI() {
        ctx.fillStyle = 'white';
        ctx.font = '24px "Courier New", Courier, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Pontos: ${score}`, 20, 40);
        ctx.textAlign = 'right';
        ctx.fillText(`Recorde: ${bestScore}`, canvas.width - 20, 40);
    }

    function drawStartScreen() {
        // Desenha a imagem de fundo da hero page
        ctx.drawImage(heroImage, 0, 0, canvas.width, canvas.height);
        
        // Desenha um botão estilizado para iniciar
        ctx.fillStyle = '#00ffff'; // Cor neon ciano
        ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('INICIAR', canvas.width / 2, canvas.height / 2 + 65);
    }

    function drawGameOverScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff4d4d';
        ctx.textAlign = 'center';
        ctx.font = '50px "Courier New", Courier, monospace';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 80);
        ctx.fillStyle = 'white';
        ctx.font = '20px "Courier New", Courier, monospace';
        ctx.fillText(`Pontuação: ${score}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText(`Seu Recorde: ${bestScore}`, canvas.width / 2, canvas.height / 2 + 10);
        
        // Reutiliza o mesmo estilo de botão
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px "Courier New", Courier, monospace';
        ctx.fillText('JOGAR DE NOVO', canvas.width / 2, canvas.height / 2 + 65);
    }

    // --- Loop Principal do Jogo ---
    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (gameState === 'playing') {
            frameCount++;
            drawBackground(); // Desenha o fundo dinâmico
            updatePlayerPosition();
            handleGameElements();
            checkCollisions();
            updateScoreAndLevel();
            drawPlayer();
            drawUI();
        } else if (gameState === 'start') {
            drawStartScreen();
        } else if (gameState === 'gameOver') {
            drawGameOverScreen();
        }

        requestAnimationFrame(gameLoop);
    }

    // Inicia o jogo
    gameLoop();
});
