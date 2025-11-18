// Espera o conteúdo da página carregar completamente antes de rodar o jogo
window.addEventListener('load', function() {
    // --- Configuração Inicial ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d'); // O "pincel" para desenhar no canvas

    // Define o tamanho do nosso palco
    canvas.width = 400;
    canvas.height = 600;

    // --- Nosso Jogador (O Foguete) ---
    const player = {
        x: 50,
        y: canvas.height / 2,
        width: 40,
        height: 20,
        color: '#00ffff',
        speed: 5 // Velocidade de movimento do jogador
    };



// --- Obstáculos (Asteroides) ---
const obstacles = []; // Array para guardar todos os asteroides na tela
let frameCount = 0; // Contador de frames, para controlar quando gerar novos obstáculos
const obstacleSpeed = 2; // Velocidade inicial dos asteroides
const obstacleColor = '#ff4d4d'; // Uma cor avermelhada para o perigo


    // --- Controle do Jogador ---
    const keys = {
        ArrowUp: false,
        ArrowDown: false
    };

    // Ouve o evento de uma tecla ser pressionada
    window.addEventListener('keydown', function(e) {
        if (keys.hasOwnProperty(e.key)) { // Verifica se a tecla é uma das que nos interessam
            e.preventDefault(); // Previne que a página role ao usar as setas
            keys[e.key] = true;
        }
    });

    // Ouve o evento de uma tecla ser solta
    window.addEventListener('keyup', function(e) {
        if (keys.hasOwnProperty(e.key)) {
            e.preventDefault();
            keys[e.key] = false;
        }
    });

    // --- Funções de Lógica e Desenho ---

    // Função que atualiza a posição do jogador com base nas teclas pressionadas
    function updatePlayerPosition() {
        if (keys.ArrowUp && player.y - player.height / 2 > 0) {
            player.y -= player.speed;
        }
        if (keys.ArrowDown && player.y + player.height / 2 < canvas.height) {
            player.y += player.speed;
        }
    }

    // Função para desenhar o jogador na tela
    function drawPlayer() {
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - player.height / 2);
        ctx.lineTo(player.x, player.y + player.height / 2);
        ctx.lineTo(player.x + player.width, player.y);
        ctx.closePath();
        ctx.fill();
    }

    // (depois da função drawPlayer)

// Função para gerar e adicionar um novo obstáculo ao array
function createObstacle() {
    const minHeight = 20;
    const maxHeight = 150;
    const height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);

    const minGap = 150; // Espaço mínimo para o jogador passar
    const maxGap = 250; // Espaço máximo
    const gap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);

    // Posição Y do topo do obstáculo de cima
    const topObstacleY = Math.floor(Math.random() * (canvas.height - gap - height));

    // Adiciona o obstáculo de cima
    obstacles.push({
        x: canvas.width, // Começa na borda direita
        y: 0,
        width: 30,
        height: topObstacleY
    });

    // Adiciona o obstáculo de baixo
    obstacles.push({
        x: canvas.width,
        y: topObstacleY + gap,
        width: 30,
        height: canvas.height - topObstacleY - gap
    });
}

// Função para mover e desenhar todos os obstáculos
function handleObstacles() {
    // A cada 150 frames, cria um novo par de obstáculos
    if (frameCount % 150 === 0) {
        createObstacle();
    }

    // Itera por todos os obstáculos para movê-los e desenhá-los
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        obs.x -= obstacleSpeed; // Move o obstáculo para a esquerda

        // Desenha o obstáculo
        ctx.fillStyle = obstacleColor;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }

    // Remove obstáculos que já saíram da tela para otimizar o jogo
    // Filtra o array, mantendo apenas os obstáculos que ainda estão na tela
    for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}


    // --- O Loop Principal do Jogo ---
    // Esta função é o coração do jogo, rodando repetidamente.
    // --- O Loop Principal do Jogo ---
function gameLoop() {
    // 1. Limpa toda a tela para o próximo desenho
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Atualiza o estado do jogo
    updatePlayerPosition();
    handleObstacles(); // <<<<<<< NOVA LINHA

    // 3. Desenha tudo nas novas posições
    drawPlayer();
    // A função handleObstacles já desenha os obstáculos

    // 4. Incrementa o contador de frames
    frameCount++; // <<<<<<< NOVA LINHA

    // 5. Pede ao navegador para chamar o gameLoop novamente
    requestAnimationFrame(gameLoop);
}

    // --- Iniciando o Jogo ---

    // Inicia o jogo!
    console.log("Jogo iniciado. Use as setas para cima e para baixo para mover.");
    gameLoop();
});
