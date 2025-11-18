# 🚀 Space Runner

**[➡️ JOGUE AGORA ⬅️](https://AnnyKaah.github.io/space-runner/)** 

![Gameplay Demo](gameplay_demo.gif)

Um jogo de nave estilo arcade "endless runner" construído com HTML5 Canvas e JavaScript puro. Desvie de asteroides, colete power-ups e lute pela maior pontuação em uma jornada infinita pelo espaço!

## ✨ Funcionalidades

-   **Dificuldade Progressiva:** O jogo se torna mais desafiador à medida que você avança, com vãos menores, mais asteroides e maior velocidade.
-   **Controles Duplos:** Jogue no desktop com as **teclas de seta** ou em dispositivos móveis com **controles de toque** intuitivos (deslize o dedo na tela).
-   **Power-ups:** Colete **escudos** para se proteger de uma colisão e **orbes de energia** para aumentar sua pontuação.
-   **Inimigos Dinâmicos:** Enfrente não apenas aglomerados de asteroides, mas também **asteroides errantes** que se movem verticalmente, adicionando um desafio extra.
-   **Efeitos Visuais Polidos:**
    -   Fundo com efeito parallax para uma sensação de profundidade.
    -   Explosões de partículas ao colidir ou coletar itens.
    -   Efeito de rastro na nave.
    -   Animações na tela inicial e textos com gradiente e contorno para melhor legibilidade.
-   **Sistema de Recorde:** Sua melhor pontuação é salva localmente no navegador. Desafie a si mesmo para quebrá-la!
-   **Áudio Imersivo:** Música de fundo e efeitos sonoros para colisões, coletas e novos recordes, com a opção de silenciar a qualquer momento.

## 🎮 Como Jogar

### Objetivo

Sobreviva o maior tempo possível desviando dos asteroides. Sua pontuação aumenta com o tempo e ao coletar orbes de energia.

### Controles

-   **Desktop:** Use as teclas `Seta para Cima` e `Seta para Baixo` para mover a nave.
-   **Mobile:** Toque e deslize o dedo na tela para mover a nave verticalmente.

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído do zero, sem o uso de frameworks ou bibliotecas externas, utilizando apenas tecnologias web padrão:

-   **HTML5**
-   **CSS3**
-   **JavaScript (ES6+)**
    -   Programação Orientada a Objetos (Classes para `Game`, `Player`, `Obstacle`, etc.)
    -   HTML5 Canvas API para renderização.
    -   Web Audio API para efeitos sonoros.
    -   `localStorage` para persistência do recorde.

## 📂 Como Executar Localmente

Como este é um projeto de JavaScript puro, você não precisa de nenhuma ferramenta de compilação.

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/AnnyKaah/space-runner
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd seu-repositorio
    ```

3.  **Inicie um servidor local:**
    O jogo precisa ser servido por um servidor web para que o carregamento de assets (imagens e sons) funcione corretamente devido às políticas de segurança do navegador (CORS).

    Se você tem o **Python 3** instalado, pode usar:
    ```bash
    python -m http.server
    ```

    Se você tem o **Node.js**, pode instalar e usar o `live-server`:
    ```bash
    npm install -g live-server
    live-server
    ```

4.  **Abra no navegador:**
    Acesse `http://localhost:8000` (ou o endereço fornecido pelo `live-server`).


---

## 🗺️ Roadmap do Projeto

Esta é uma visão geral do desenvolvimento do projeto, mostrando o que já foi feito e o que está planejado para o futuro.

### ✅ Funcionalidades Implementadas

- [x] **Estrutura do Jogo:** Arquitetura base com HTML5 Canvas e classes JavaScript (`Game`, `Player`, etc.).
- [x] **Movimento e Controles:** Movimento do jogador com suporte a teclado (desktop) e toque (mobile).
- [x] **Obstáculos e Dificuldade:** Geração procedural de asteroides com dificuldade que aumenta progressivamente.
- [x] **Colisões e Fim de Jogo:** Detecção de colisão precisa e ciclo de "Game Over".
- [x] **Pontuação e Recorde:** Sistema de pontuação em tempo real com armazenamento de recorde local.
- [x] **Power-ups:** Implementação de Escudo e Orbe de Energia.
- [x] **Feedback Visual e Sonoro:** Efeitos de partículas, som, música e tela tremendo.
- [x] **UI Dinâmica:** Telas de início e fim de jogo animadas e informativas.

### 🚀 Próximos Passos (Ideias para o Futuro)

- [ ] **Habilidade de Tiro para o Jogador:** Implementar um power-up que permita ao jogador atirar e destruir obstáculos e inimigos por um tempo limitado.
- [ ] **Chefão (Boss):** Criar um inimigo "chefe" que aparece a cada 5.000 pontos, com padrões de ataque únicos e mais vida.
- [ ] **Novos Tipos de Inimigos:** Adicionar naves que seguem o jogador ou se movem em padrões complexos.
- [ ] **Sistema de Conquistas (Achievements):** Criar um sistema para recompensar o jogador por alcançar marcos específicos (ex: "Sobreviva por 2 minutos", "Destrua 50 asteroides").
- [ ] **Leaderboard Online:** Integrar com um serviço como o Firebase para criar um ranking global de pontuações.
- [x] **Hospedagem:** Publicar o jogo no GitHub Pages para que qualquer pessoa possa jogar através de um link.

 ---

 Desenvolvido com ❤️ por Anny Karoline.