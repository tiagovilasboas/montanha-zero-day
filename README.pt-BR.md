# Montanha: Zero Day

[![Play online](https://img.shields.io/badge/play-online-3df0ff?style=flat-square)](https://tiagovilasboas.github.io/montanha-zero-day/) [![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-ff4fd8?style=flat-square&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/tiagovilasboas) ![PWA](https://img.shields.io/badge/PWA-offline-ffd23d?style=flat-square) ![No build](https://img.shields.io/badge/vanilla-JS%20%2B%20canvas-9b5cff?style=flat-square) [![License: MIT](https://img.shields.io/badge/code-MIT-7dff9b?style=flat-square)](LICENSE)

Plataforma 2D em PWA, pensada para celular: pegada de Mega Man, sabor de Final Fantasy e uma cidade cyberpunk.
Ele foi resgatar a Gle. Agora é ela quem vai buscar ele.

**▶ Jogue agora: [tiagovilasboas.github.io/montanha-zero-day](https://tiagovilasboas.github.io/montanha-zero-day/)**

Roda em qualquer navegador moderno: no computador com teclado e no celular com controles de toque. No celular, use **Adicionar à tela de início** (ou o botão **Instalar app** do jogo) para instalar e jogar offline.

| Montanha, fase 1 | Gle, fase 3 |
|---|---|
| ![Montanha voando com a mochila de jato sobre os telhados de Neo-Sampa](docs/screenshots/montanha-jetpack.webp) | ![Gle esperando o feixe de pulso desligar dentro do Núcleo](docs/screenshots/gle-pulse-beams.webp) |

*Read in English: [README.md](README.md)*

## O jogo

**Neo-Sampa, 2099.** A IA invasora LEGIÃO NULL tomou a rede do planeta. A Gle foi sequestrada e trancada numa cápsula.

- **Fase 1, Telhados do Cecapão.** Você joga com o **Montanha**: mochila com jato, relógio hacker e o robô BYTE. No fim ele encontra a Gle na cápsula (sobem corações), então uma garra do RANSOM-TITAN o rapta e a Gle é libertada.
- **Fases 2 e 3, Subsolo 404: Servidor Submerso e Kernel Panic: o Núcleo.** Você joga com a **Gle**, que vai atrás do RANSOM-TITAN com a manopla dourada, botas que planam e um BYTE rosa. O Núcleo tem feixes de pulso que ligam e desligam no ritmo, uma subida sobre lasers e um corredor de torretas antes do chefe.
- **Final.** Depois do chefe, a Gle usa a chave do RANSOM-TITAN e tira o Montanha da cela no fundo do Núcleo.

### Destaques

- **Dois heróis, cada um com seu estilo:** o Montanha voa com a mochila de jato ciano, a Gle plana com as botas de luz douradas. Mesma física, visual próprio (aura, rastro e animações).
- **Hacking:** três tipos de puzzle nos terminais (sequência, binário e grade de nós com dica), torretas que passam para o seu lado e pulso EMP.
- **História contada no jogo:** diálogos com retrato, cena no fim da fase 1 (corações, a garra que rapta o Montanha, a Gle libertada) e um final que fecha a história.
- **O Núcleo (fase 3):** feixes de pulso que ligam e desligam no ritmo, subida sobre um poço de laser, corredor de torretas e o chefe RANSOM-TITAN com fase de firewall.
- **Trilha original em cada fase,** sintetizada ao vivo com WebAudio.
- **Feito para celular:** só na horizontal, zoom de câmera pensado para telas pequenas, controles de toque translúcidos e pausa quando o app vai para o fundo.
- **PWA offline:** instalável, com service worker que guarda tudo em cache.

### Controles

| Ação | Teclado | Toque |
|---|---|---|
| Mover | `←` `→` ou `A` `D` | direcional |
| Pular | `Z`, `Espaço`, `↑` ou `W` | PULO |
| Planar (JET / botas) | segure o pulo no ar | segure PULO |
| Atirar | `X` ou `J` (segure para carregar, solte para o tiro que atravessa) | TIRO |
| Hackear | `C` ou `K` | HACK |
| Pausar | `Esc` ou `P` | II |
| Avançar diálogo | `Enter`, pulo ou tiro | toque nos botões |

Hackeie perto de uma torreta vermelha para ela lutar do seu lado, perto de um terminal amarelo para abrir o puzzle, e longe de tudo para soltar um pulso EMP que paralisa inimigos.
O jogo é só na horizontal no celular: em pé aparece a tela "Gire o celular" e o jogo fica pausado (instalado, o manifest já pede paisagem; no Android, o botão **Tela cheia** trava a orientação).

## Rodar

É um site estático. O service worker precisa de `http(s)`, então sirva a pasta:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

O progresso fica no `localStorage`, na chave `montanha-zero-day-v1`.

`index.html` e os ícones são gerados a partir do `game.html`: `pip install pillow && python3 build.py`.
O build também carimba o `VERSION` do `sw.js` com um hash do código e da arte. Antes de cada publicação, rode `python3 build.py --sw` (ou o build completo) para os apps instalados atualizarem.

## Publicar

A versão no ar é servida pelo **GitHub Pages** a partir da raiz da `main`: cada push atualiza [tiagovilasboas.github.io/montanha-zero-day](https://tiagovilasboas.github.io/montanha-zero-day/) em um ou dois minutos. Rode `python3 build.py --sw` antes de publicar para quem instalou receber a atualização.

Qualquer hospedagem estática serve. No GitHub Pages, o plano gratuito exige repositório público. Cloudflare Pages, Netlify e Vercel aceitam repositório privado no plano gratuito (build vazio, publicar a raiz).

## Documentação

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): módulos, loop, câmera, eventos e como adicionar conteúdo (em inglês).
- [docs/ART_PIPELINE.md](docs/ART_PIPELINE.md): como a arte foi feita e como regenerar os assets (em inglês).

## Créditos

Arte gerada no Artlist (Nano Banana 2 para imagens, Seedance 1.5 e 2.0 para os clipes de animação) a partir de prompts originais e fotos de referência do autor. Música e efeitos são sintetizados no navegador com WebAudio; não há arquivos de áudio. Desenvolvido com a ajuda do Claude Opus 5.5 (Cowork).

## Apoie

Curtiu o jogo? Você pode apoiar novas fases e projetos pelo **[GitHub Sponsors](https://github.com/sponsors/tiagovilasboas)**. Estrela no repositório, bugs e sugestões nas issues também ajudam muito.

## Autor

Feito por [Tiago Vilas Boas](https://github.com/tiagovilasboas). O código está sob a [licença MIT](LICENSE). A arte, os personagens e os retratos (`assets/`, `icons/`, `docs/screenshots/`, além do próprio Montanha, da Gle e do BYTE) têm todos os direitos reservados.
