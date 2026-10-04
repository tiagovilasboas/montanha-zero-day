---
title: "Construí um Jogo PWA em um Dia com Claude Opus 5.5 e Claude Code: Custo Real de Tokens e o Poder do Harness"
published: false
description: "Montanha: Zero Day, um PWA estilo Mega Man X feito com o Claude Opus 5.5 e Claude Code sobre um harness central de engenharia: benchmarks vs entrega real, assets gerados no Artlist e testes E2E com Playwright."
tags: ai, gamedev, javascript, claude
cover_image: https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/assets/devto-cover.png
---

Em um domingo, transformei uma ideia meio boba num jogo de verdade: **Montanha: Zero Day**, um plataforma cyberpunk no estilo Mega Man X que roda no navegador e no celular, offline, como PWA. O herói sou eu (o Montanha), a heroína é a Gle, e o vilão é um ransomware gigante chamado RANSOM-TITAN.

Fiz tudo em parceria com o **Claude Opus 5.5**, orquestrado pelo **Claude Code** e pelo Cowork (o ecossistema de agentes da Anthropic). No fim do dia, o painel de uso mostrava que eu tinha gastado **cerca de metade do limite diário de tokens**.

Este post conta o que o modelo promete nos benchmarks, como ele operou com maestria integrando ambiente local e nuvem, e o que entregou de verdade em um projeto real quando guiado por um **harness central de engenharia**.

👉 **Jogue aqui:** [tiagovilasboas.github.io/montanha-zero-day](https://tiagovilasboas.github.io/montanha-zero-day/)  
👉 **Código-fonte:** [github.com/tiagovilasboas/montanha-zero-day](https://github.com/tiagovilasboas/montanha-zero-day)

![Tela de Título do Montanha: Zero Day](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/title-screen.webp)

---

## O Prompt Inicial: Menos do que Você Imagina

Muita gente pergunta que tipo de mega-prompt de 10 páginas foi necessário para criar um jogo do zero. A resposta é: **quase nada.**

O prompt de partida foi surpreendentemente direto:

> *"Crie um jogo de plataforma cyberpunk estilo Mega Man X em JavaScript puro (módulos ES) com canvas. O herói é o Montanha (mochila a jato, relógio hacker), a heroína é a Gle, e o chefe final é um vírus ransomware chamado RANSOM-TITAN. Precisa rodar offline como PWA no celular e no desktop."*

Como um modelo vai de um prompt de 3 linhas para uma arquitetura limpa de 24 módulos ES funcionais sem se perder ou alucinar código espaguete?

O segredo não foi prompt engineering. Foi **Harness Engineering**.

### Construído Sobre um Harness Central de Engenharia

Em vez de jogar dezenas de instruções ad-hoc em cada sessão, minha máquina opera orientada pelo **harness-core** (`~/Github/harness-core`).

O harness atua como um sistema canônico de guias (feedforward) e sensores (feedback):
1. **Limites de Arquitetura Claros:** Responsabilidade Única (SRP) por módulo — desacoplando física, input, áudio, renderização e estado em módulos ES orientados a eventos, sem bibliotecas pesadas.
2. **Invariantes e Sem Suposições (No Assumptions):** O agente não assume nada sem verificar. Ele inspeciona o estado do DOM/canvas, roda comandos reais no shell e confirma o comportamento antes de declarar pronto.
3. **Commits Orientados a Domínio:** Commits semânticos e atômicos (`feat(hero)`, `fix(gameplay)`, `style(mobile)`).

O Claude Code com o Opus 5.5 se adequou perfeitamente a esse harness. Ele alternou com naturalidade entre o terminal local (scripts Python, processamento ffmpeg, git) e o raciocínio na nuvem, respeitando cada steering e convenção sem inventar dependências desnecessárias.

---

## O Opus 5.5 em Números

A Anthropic lançou o Opus 5.5 em 22 de setembro de 2026. Os números abaixo são **divulgados pela própria Anthropic**, então vale ler com o devido ceticismo: não existe ainda uma comparação independente com o mesmo harness para todos os modelos.

| Benchmark | Opus 5.5 | Fable 5.1 | Opus 5 | GPT-6 Astra |
|---|---|---|---|---|
| Terminal-Bench 4.0 | **66,4%** | 55,8% | 52,3% | 57,9% |
| FrontierCode v1.1 | **54,4%** | 50,3% | 48,0% | 53,3% |
| CursorBench 4.0 | **57,8%** | 51,8% | 46,6% | — |
| GDPval-AA v2.1 (Elo) | **1846** | 1735 | 1708 | 1542 |
| Humanity's Last Exam (com ferramentas) | **67,7%** | 65,6% | 63,6% | 57,2% |
| AutomationBench | 40,0% | 31,4% | 26,9% | **41,4%** |
| Terminal-Bench-Science 0.1 | 58,7% | 52,6% | 29,0% | **64,6%** |

Dois pontos de honestidade: o GPT-6 Astra ganha em AutomationBench e Terminal-Bench-Science. E, segundo a Vellum, parte das tarefas de ciência caiu para o Opus 5 por causa das salvaguardas de biologia.

### O Índice da Artificial Analysis

O índice da [Artificial Analysis](https://artificialanalysis.ai/models) agrega várias avaliações independentes em uma métrica unificada:

| Modelo | Intelligence Index |
|---|---|
| **Claude Opus 5.5 (max)** | **58** |
| Claude Sonnet 5.5 (max) | 56 |
| Claude Opus 5.5 (xhigh) | 56 |
| Claude Opus 5.5 (high) | 54 |
| Claude Fable 5.1 (max) | 53 |
| MiMo-V2.6-Pro | 46 |

O Opus 5.5 lidera com folga (a mediana de modelos semelhantes é 26). O contraponto é que ele **gerou 260 milhões de tokens** ao longo do teste, contra 81M da mediana. Ele pensa bastante e processa profundamente antes de agir. A velocidade medida foi de 92,4 tokens/s.

### Economia e Tokens

| | Opus 5.5 | Opus 5 | Fable 5.1 |
|---|---|---|---|
| Entrada (por 1M tokens) | US$ 4 | US$ 5 | US$ 10 |
| Saída (por 1M tokens) | US$ 20 | US$ 25 | US$ 50 |

A Anthropic estima que tarefas típicas saiam **~40% mais baratas que no Opus 5** porque o modelo precisa de menos iterações para concluir a meta. Na prática, meu dia inteiro de código, geração de arte e testes coube em metade do teto diário.

---

## O Jogo

- **Fase 1:** Você controla o Montanha (jetpack vertical e relógio hacker que atira e invade terminais). Ao final, encontra a Gle presa em uma cápsula. Sobem corações, mas a garra do RANSOM-TITAN desce do céu e o rapta. Era uma armadilha.
- **Fases 2 e 3:** Gle assume o resgate com manopla dourada e botas de velocidade.
- **Final:** Ela destrói o chefe, pega a chave e abre a cela do Montanha.

Arquitetura: **JavaScript puro em módulos ES** (~2.700 linhas em 24 módulos), HTML5 Canvas, loop fixo a 60 Hz, PWA offline via service worker, trilha sonora inteiramente sintetizada com WebAudio (sem arquivos de áudio pesados) e arte HD. Sem frameworks, sem build.

![O fim da fase 1: corações, a garra do RANSOM-TITAN desce, agarra o Montanha e o leva para longe da cápsula da Gle](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/abduction-cutscene.jpg)
*O fim da fase 1, quadro a quadro: corações, a garra desce, agarra o Montanha e o leva embora.*

![A Gle planando com as botas de luz douradas na sala de servidores alagada da fase 2](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/gle-boots.jpg)

![A Gle diante do chefe RANSOM-TITAN, um cadeado gigante com um olho vermelho, na arena do Núcleo](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/boss-fight.jpg)

---

## Arte HD Gerada com Créditos no Artlist

Para os gráficos do jogo, utilizamos créditos na plataforma **[Artlist.io](https://artlist.io/)**.

Para quem não conhece, o Artlist evoluiu para uma plataforma criativa completa com ferramentas de IA generativa para imagens, vídeo e geração de assets.

O que fizemos com esses créditos:
1. **Sprites com Nano Banana 2:** Geramos artes cel-shaded HD-2D dos personagens a partir de imagens de referência, mantendo a consistência do visual (barba, boné, hoodie e smartwatch do Montanha).
2. **Ciclos de Animação com Seedance:** Transformamos poses estáticas em vídeos 720p a 24 fps.
3. **Isolamento em Chroma Key:** Todos os sprites foram gerados sobre fundos planos em magenta (`#FF00FF`) ou verde para recorte limpo.

### Integrando o Artlist ao Pipeline Python Local

Durante a geração, o ambiente conteinerizado do agente enfrentou bloqueio de rede para o host de download do Artlist. O Claude Code não travou:
- Abriu o vídeo no navegador da máquina host.
- Extraiu os frames brutos para um elemento `<canvas>`.
- Mediu o delta de pixels entre os quadros para identificar o ciclo exato de 2 passos (19 frames a 24 fps).
- Enviou os frames em WebP para o script local (`tools/process_art.py`), onde o Python executou despill de chroma key, alinhou o ponto de ancoragem nos pés e empacotou a spritesheet final.

Custo: **590 créditos do Artlist**. Resultado: personagens com animação fluida sem desenhar um único frame na mão.

---

## Testes End-to-End no Playwright e Navegação Autônoma

Outro destaque da postura do Opus 5.5 e do Claude Code foi a direção autônoma dos testes.

Em vez de assumir que o código funcionava, ele orquestrou testes E2E usando **Playwright em Chromium headless**:
- **Bot Jogador Autônomo:** O Claude criou um script de teste que reproduzia a física do próprio jogo (`js/physics.js`). Esse bot simulava comandos de pulo, movimentação e tiro, estressando as hitboxes das fases.
- **Detecção de Gargalos de 1 Pixel:** Na expansão da fase 3 (com feixes de laser pulsantes), o bot acusou que um dos pulos ficava exatamente **1 pixel fora de alcance** se o salto fosse feito no limite da beirada. O modelo ajustou a coordenada do bloco em `config.js` e validou a passagem.
- **Exploração de Mecânicas:** O teste no Playwright identificou que dava para tomar 3 de dano de propósito e atravessar lasers usando a invulnerabilidade temporária pós-dano. O modelo corrigiu os feixes para atuarem como paredes sólidas durante o piscar do herói.
- **Varredura Completa de Telas:** Testou cutscenes, diálogos com portraits HD, vitória sobre o chefe e transição para o mapa.

![Montanha voando com o jetpack em Neo-Sampa](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/montanha-jetpack.webp)

![Gle encarando os feixes de laser pulsantes na Fase 3](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/gle-pulse-beams.webp)

---

## O Que o Modelo Entregou na Prática

### 1. Auditoria com Subagentes em Paralelo
Para revisar bugs e consistência narrativa, o Claude disparou **dois subagentes em paralelo**: um focado em furos de roteiro e outro focado em física e glitches no navegador. Eles apontaram 16 problemas e corrigiram os principais:
- *Ressurreição do Chefe:* Se o herói morresse durante a explosão do chefe, o botão "Tentar Novamente" reconstruía o chefe com vida cheia.
- *Queda Fatal na Fase 1:* O recuo (knockback) ao tomar dano jogava o herói direto em fossos sem saída.

### 2. O Ajuste Fino da Sensação de Movimento
Quando comentei que *"a Gle parecia mais fluida de controlar que o Montanha"*, ele não alterou a velocidade às cegas. Primeiro conferiu a física: era idêntica. Depois foi direto na arte:
- Ao pular, o Montanha ficava virado para trás porque o vídeo de geração tinha espelhado a pose.
- O ciclo de corrida repetia sempre a mesma perna na frente.

Ele espelhou a folha de sprites, criou lógica para alternar frames de subida e flutuação com a mochila a jato e desenhou auras neon próprias para cada herói.

![Quadros do pulo do Montanha antes (de costas, dois quadros de frente para a câmera) e depois (quadros de lado, espelhados)](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/jump-before-after.png)

![Ciclo de corrida do Montanha antes (mesma perna na frente a cada passo) e depois (loop de dois passos gerado de novo)](https://raw.githubusercontent.com/tiagovilasboas/montanha-zero-day/main/docs/screenshots/run-before-after.png)

---

## A Conclusão: O Que Isso Diz Sobre o Futuro

O que mais impressiona no conjunto não é apenas a velocidade de digitar código, mas a **capacidade de julgamento e direção técnica**.

O Claude Code operando o Opus 5.5 gerenciou:
- Respeito à governança do harness central de engenharia.
- Extração de mídia e acionamento de pipeline local.
- Testes automatizados E2E no Playwright com bots de gameplay.
- Higiene e organização de commits por domínio.

Se em **poucas horas de um domingo** o Opus 5.5 foi capaz de conceber, refinar, testar e publicar um jogo de plataforma completo com gráficos, som e PWA...

**Em quanto tempo essa mesma capacidade reconstrói seu sistema legado, ferramenta interna ou SaaS todinho do zero?**

Não se engane: isso é bom demais. Com o Opus 5.5, **a Anthropic coloca a corrida pelos modelos LLM em outro patamar**. Não estamos mais falando de chat interativo, snippets pontuais ou mero autocompletar de código. Estamos diante de engenharia autônoma de ponta a ponta: raciocínio profundo orquestrando ferramentas locais no SO, ambientes em nuvem, geração criativa de mídia e sensores de validação rigorosa.

Quando a capacidade do modelo encontra um harness bem estruturado, o desenvolvimento de software deixa de ser um trabalho braçal de sintaxe e passa a ser pura condução de arquitetura e estratégia.

---

## O Cenário Maior: Opus 5.5 Provoca um Renascimento de Jogos no Navegador

O *Montanha: Zero Day* não é um ponto fora da curva isolado. Na comunidade global, o Opus 5.5 operado com o Claude Code virou uma verdadeira febre de desenvolvimento de jogos sem engines pesadas (adeus overhead de Unity e Unreal):

- **[Awesome Opus 5.5 Games](https://github.com/VibeFin/awesome-opus-5.5-games):** Curadoria colaborativa com quase 200 jogos jogáveis criados com o modelo.
- **[Rundevue (Built with Opus 5.5)](https://rundevue.com/built-with/opus-5-5):** Vitrine com clones de Rocket League, mundos abertos, pod racers e simuladores rodando direto em WebGL/Three.js.
- **[Hearthlight](https://hearthlight.github.io/):** Jogo de aventura pixel-art com 10 capítulos, 8 personagens, masmorras e multiplayer para até 8 pessoas, desenvolvido do zero com Claude Code + Opus 5.5 + Three.js apenas com iterações em linguagem natural ([Discussão no Reddit](https://www.reddit.com/r/ClaudeAI/comments/1wtcs7k/i_opensourced_the_cozy_pixelart_game_opus_55_made/)).
- **NUTSHOT!:** Criado pelo brasileiro Yan Mantovani, mostrando como um shooter 3D de browser nasceu de poucos prompts e foi calibrado via playtesting interativo.
- **O Fenômeno Fallout: New York:** Um fan game de navegador impressionante com 117 localidades, 112 personagens e 46 armas feito com Opus 5.5, que viralizou a ponto de atrair a atenção da imprensa especializada.

O padrão que emergiu é inequívoco:  
`Opus 5.5 + Claude Code` → `TypeScript / JavaScript Modular (ESM)` → `Canvas / Three.js / WebGL` → `Assets Procedurais / Generativos` → `Distribuição Instantânea via Web`.

Quando o design de software é protegido por um harness rigoroso, o desenvolvedor dispensa a burocracia de engines e coloca universos ricos e interativos para rodar na web em questão de horas.

---

**Links e Fontes:**
- [Jogar Montanha: Zero Day](https://tiagovilasboas.github.io/montanha-zero-day/)
- [Repositório no GitHub](https://github.com/tiagovilasboas/montanha-zero-day)
- [Anúncio do Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5)
- [Leaderboard da Artificial Analysis](https://artificialanalysis.ai/models)
- [Artlist Generative Suite](https://artlist.io/)
- [Awesome Opus 5.5 Games](https://github.com/VibeFin/awesome-opus-5.5-games)
- [Rundevue Showcase](https://rundevue.com/built-with/opus-5-5)
