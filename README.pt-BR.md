# Montanha: Zero Day

Plataforma 2D em PWA, pensada para celular: pegada de Mega Man, sabor de Final Fantasy e uma cidade cyberpunk.
Ele foi resgatar a Gle. Agora é ela quem vai buscar ele.

*Read in English: [README.md](README.md)*

## O jogo

**Neo-Sampa, 2099.** A IA invasora LEGIÃO NULL tomou a rede do planeta. A Gle foi sequestrada e trancada numa cápsula.

- **Fase 1, Telhados do Cecapão.** Você joga com o **Montanha**: mochila com jato, relógio hacker e o robô BYTE. No fim ele encontra a Gle na cápsula (sobem corações), então uma garra do RANSOM-TITAN o rapta e a Gle é libertada.
- **Fases 2 e 3, Subsolo 404: Servidor Submerso e Kernel Panic: o Núcleo.** Você joga com a **Gle**, que vai atrás do RANSOM-TITAN com a manopla dourada, botas que planam e um BYTE rosa.
- **Final.** Depois do chefe, a Gle usa a chave do RANSOM-TITAN e tira o Montanha da cela no fundo do Núcleo.

### Controles

| Ação | Teclado | Toque |
|---|---|---|
| Mover | `←` `→` ou `A` `D` | direcional |
| Pular | `Z`, `Espaço`, `↑` ou `W` | PULO |
| Planar (JET / botas) | segure o pulo no ar | segure PULO |
| Atirar | `X` ou `J` (segure para carregar, solte para o tiro que atravessa) | TIRO |
| Hackear | `C` ou `K` | HACK |
| Pausar | `Esc` ou `P` | II |

Hackeie perto de uma torreta vermelha para ela lutar do seu lado, perto de um terminal amarelo para abrir o puzzle, e longe de tudo para soltar um pulso EMP que paralisa inimigos.
Jogue com o celular deitado: o jogo ocupa a tela toda.

## Rodar

É um site estático. O service worker precisa de `http(s)`, então sirva a pasta:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

O progresso fica no `localStorage`, na chave `montanha-zero-day-v1`.

`index.html` e os ícones são gerados a partir do `game.html`: `pip install pillow && python3 build.py`.
Ao publicar JS ou arte novos, aumente o `VERSION` do `sw.js` para os apps instalados atualizarem.

## Publicar

Qualquer hospedagem estática serve. No GitHub Pages, o plano gratuito exige repositório público. Cloudflare Pages, Netlify e Vercel aceitam repositório privado no plano gratuito (build vazio, publicar a raiz).

## Documentação

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): módulos, loop, câmera, eventos e como adicionar conteúdo (em inglês).
- [docs/ART_PIPELINE.md](docs/ART_PIPELINE.md): como a arte foi feita e como regenerar os assets (em inglês).
