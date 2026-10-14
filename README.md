# React Learning

Faça uma pergunta sobre React e receba a resposta em **vídeo de 3 a 5 minutos**, com narração, legendas e animações (código que acende linha a linha, diagramas, árvores de componentes, comparações).

## Como funciona

```
pergunta ──► servidor (Hono) ──► Claude API ──► roteiro em JSON ──► Remotion Player ──► vídeo no navegador
                                  (saída estruturada)   (cenas + narração)          + voz do navegador
```

1. **Roteiro.** `server/` envia a pergunta à Claude (`claude-opus-5-5`) pedindo uma saída estruturada que segue o schema de `shared/lesson.ts`: de 14 a 22 cenas, cada uma com um tipo visual (`title`, `bullets`, `code`, `diagram`, `tree`, `compare`, `callout`, `summary`) e o texto da narração.
2. **Vídeo.** `src/video/` transforma cada cena em animação [Remotion](https://www.remotion.dev). O vídeo toca direto no navegador (`@remotion/player`), sem renderizar arquivo nem usar servidor de vídeo.
3. **Narração.** `src/hooks/useNarration.ts` fala cada cena com a Web Speech API do navegador. A fala é o "relógio mestre": se demora mais que a cena, o vídeo espera; se termina antes, o vídeo avança.
4. **Banco de perguntas.** A aba "Banco de perguntas" traz 445 perguntas de React (busca, filtro por tema, sorteio de uma que você ainda não viu e marcação das que já viraram vídeo). Clicar em uma pergunta preenche o campo para gerar o vídeo.
5. **Histórico.** Os vídeos gerados ficam salvos no `localStorage` do navegador.

Há uma aula de exemplo (`src/lessons/sample.ts`) que funciona sem chave de API.

## Rodando

```bash
npm install
cp .env.example .env      # preencha ANTHROPIC_API_KEY
npm run dev               # web em http://localhost:5173 e API em :8787
```

Para atualizar o banco de perguntas a partir do GitHub: `npm run import:questions` (ou `-- ./README.md` com um arquivo local).

Outros comandos: `npm run typecheck`, `npm run build`, `npm run check` (valida a aula de exemplo e o schema enviado à Claude).

## Estrutura

| Pasta | O que tem |
|---|---|
| `shared/lesson.ts` | Schema do roteiro (zod), cálculo de tempo e saneamento da saída da IA |
| `data/questions.json` | Banco de perguntas (gerado por `scripts/import-questions.ts`) |
| `server/` | API `POST /api/lesson` e o prompt do roteirista |
| `src/video/` | Composição Remotion e uma cena por tipo visual |
| `src/hooks/useNarration.ts` | Sincronia entre a voz e o vídeo |
| `src/components/`, `src/App.tsx` | Interface: pergunta, player, capítulos, histórico |

## Para criar um tipo novo de cena

1. Adicione o schema em `shared/lesson.ts` e inclua na união `SceneSchema`.
2. Crie o componente em `src/video/scenes/` (use `SceneFrame` e `useSceneProgress`).
3. Registre-o em `renderScene` (`src/video/LessonVideo.tsx`) e descreva o tipo em `server/prompt.ts`.

## Observações

- **Fontes de perguntas.** O banco vem de [sudheerj/reactjs-interview-questions](https://github.com/sudheerj/reactjs-interview-questions) (MIT; veja `THIRD_PARTY_NOTICES.md`) e usa só os títulos. O artigo de 100 perguntas da GreatFrontend não foi importado: é conteúdo proprietário e, além disso, o domínio estava bloqueado na rede desta sessão.

- **Voz.** A voz padrão é a do navegador (grátis, mas robótica). A narração fica atrás de um único ponto (`useNarration`), então dá para trocar por uma voz neural (por exemplo, uma voz clonada) gerando o áudio no servidor, sem mexer nas cenas.
- **Licença do Remotion.** O Remotion é gratuito para pessoas físicas e pequenas equipes, mas exige licença paga para empresas maiores. Veja [remotion.dev/license](https://www.remotion.dev/license) antes de usar comercialmente.
- **Custo.** Cada vídeo é uma chamada à Claude API (alguns milhares de tokens de saída).
