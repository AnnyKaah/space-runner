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
        x: 50, // Posição inicial no eixo X
        y: canvas.height / 2, // Posição inicial no eixo Y (meio da tela)
        width: 40,
        height: 20,
        color: '#00ffff' // Cor neon ciano
    };

    // Função para desenhar o jogador
    function drawPlayer() {
        ctx.fillStyle = player.color;
        // Desenha um triângulo simples para representar o foguete
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - player.height / 2); // Ponta do foguete
        ctx.lineTo(player.x, player.y + player.height / 2); // Base de trás
        ctx.lineTo(player.x + player.width, player.y); // Meio da frente
        ctx.closePath();
        ctx.fill();
    }

    // --- O Loop do Jogo ---
    function gameLoop() {
        // 1. Limpar a tela a cada quadro (frame)
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Desenhar os elementos
        drawPlayer();

        // 3. Chamar o próximo quadro
        requestAnimationFrame(gameLoop);
    }

    // Inicia o jogo!
    gameLoop();
});
