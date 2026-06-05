# Save the Date · Mini-Livro Digital

**HAXR Signature Edition · N.º 01**  
Save the Date editorial para **Jéssica Muege & Samuel Govene** — 15 de Agosto de 2026 · Villa Verde.

Mini-livro interactivo em **HTML, CSS e JavaScript puro**, sem frameworks. Experiência premium, mobile-first, com animação 3D de abertura, trilha sonora, contagem regressiva e sistema de confirmação de presença.

---

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Capa editorial** | Livro recriado em código com moldura, florais, tipografia de luxo e animação de entrada em sequência |
| **Abertura 3D** | Toque ou clique para abrir/fechar o livro com transição cinematográfica |
| **Página interior** | Foto do casal em full-bleed, overlay editorial, nomes, data, local e assinatura HAXR |
| **Contagem regressiva** | Mensagem narrativa dinâmica (*«X dias para o capítulo»*) |
| **RSVP** | Modal editorial com validação, Google Sheets + email automático e fallback `mailto:` |
| **Trilha sonora** | Música de fundo com fade-in na primeira abertura + botão play/pause discreto |
| **Hint de gesto** | Convite subtil *«Toca para abrir o capítulo»* — desaparece após a primeira interacção |
| **Responsivo** | Layout optimizado para telemóvel e desktop (proporção 9:16) |
| **SEO & partilha** | Meta tags Open Graph e Twitter Card para WhatsApp, Instagram e redes sociais |
| **Acessibilidade** | `dialog`, `aria-*`, `sr-only`, `prefers-reduced-motion` |

---

## Stack técnico

- **HTML5** — estrutura semântica, `<dialog>` nativo
- **CSS3** — variáveis, `clamp()`, animações, media queries, `aspect-ratio`
- **JavaScript (Vanilla)** — interacção do livro, RSVP, áudio, countdown
- **Google Apps Script** — backend RSVP (Sheets + notificações por email)
- **Google Fonts** — Cormorant Garamond, Great Vibes, Jost

Sem dependências npm, sem build step. Pronto para alojamento estático.

---

## Estrutura do projecto

```
save-the-date-mini-book/
├── index.html              # Estrutura do livro, RSVP, áudio
├── style.css               # Estilos editoriais + responsivo
├── script.js               # Interacções + RSVP_CONFIG
├── README.md               # Este ficheiro
├── assets/
│   ├── couple.jpg          # Foto interior (hero)
│   ├── target-cover.png    # Imagem OG / partilha social
│   ├── frame.png           # Moldura da capa
│   ├── branch-tr.png       # Ramo superior direito
│   ├── branch-bl.png       # Ramo inferior esquerdo
│   ├── rose-tl.png         # Rosa superior esquerda
│   ├── rose-br.png         # Rosa inferior direita
│   └── music/
│       └── everything-is-romantic.mp3
└── rsvp/
    ├── google-apps-script.gs   # Backend Google Sheets
    └── README.md               # Guia de deploy do RSVP
```

---

## Como correr localmente

### Opção 1 — Abrir directamente

Abre `index.html` no browser. Funciona para pré-visualização básica.

> Alguns browsers bloqueiam `fetch` para ficheiros locais. Para testar o RSVP, usa um servidor local.

### Opção 2 — Servidor local (recomendado)

**Com Python:**
```bash
cd save-the-date-mini-book
python -m http.server 8080
```
Abre [http://localhost:8080](http://localhost:8080)

**Com Node.js (npx):**
```bash
npx serve .
```

**Com VS Code / Cursor:**
Extensão *Live Server* → clicar em *Go Live*.

---

## Personalização

### Nomes, data e local

| O quê | Onde |
|-------|------|
| Nomes na capa e interior | `index.html` — `.cover__names`, `.names--hero` |
| Data do evento | `index.html` — `.cover__date`, `.hero__day`, `.hero__when` |
| Local | `index.html` — `.hero__place` |
| Contagem regressiva | `script.js` — variável `WEDDING` (linha ~206) |
| Título e meta SEO | `index.html` — `<title>`, `<meta name="description">`, Open Graph |

Exemplo — alterar a data do casamento no countdown:

```js
var WEDDING = new Date(2026, 7, 15); // mês 0-indexado: 7 = Agosto
```

### Paleta e tipografia

Em `style.css`, secção `:root`:

```css
:root {
  --ivory: #f8f4ef;
  --burgundy: #7a1f2b;
  --champagne: #d8c7b8;
  --font-display: "Cormorant Garamond", serif;
  --font-script: "Great Vibes", cursive;
  --font-sans: "Jost", sans-serif;
}
```

### Imagens

Substitui os ficheiros em `assets/` mantendo os mesmos nomes, ou actualiza os `src` em `index.html`.

| Ficheiro | Uso | Recomendação |
|----------|-----|--------------|
| `couple.jpg` | Página interior | Vertical, alta resolução, rostos centrados no terço superior |
| `target-cover.png` | Partilha WhatsApp/redes | 1200×630 px ou proporção similar |
| PNGs da capa | Decoração editorial | Fundo transparente |

### Música

1. Coloca o ficheiro `.mp3` em `assets/music/`
2. Actualiza o `src` do `<audio>` em `index.html`
3. Volume e fade configuráveis em `script.js` — `TARGET_VOLUME`, `FADE_IN_MS`, `FADE_OUT_MS`

> A música só inicia na **primeira abertura do livro** (gesto do utilizador), respeitando políticas de autoplay dos browsers.

### RSVP

Configuração central em `script.js`:

```js
var RSVP_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/SEU_ID/exec",
  subject: "Confirmação de presença — Jéssica & Samuel",
  emails: {
    to: "samuelgovene@gmail.com",
    cc: ["muegejessica@gmail.com", "aludimande@gmail.com"]
  },
  timeoutMs: 8000,
  successAutoCloseMs: 6000,
  errorMailtoDelayMs: 1200
};
```

**Guia completo de deploy do RSVP:** [`rsvp/README.md`](rsvp/README.md)

---

## Publicar online

O projecto é 100% estático. Podes alojar em qualquer serviço de ficheiros estáticos:

| Plataforma | Passos rápidos |
|------------|----------------|
| **Netlify** | Arrasta a pasta para [app.netlify.com/drop](https://app.netlify.com/drop) ou liga ao Git |
| **Vercel** | `vercel --prod` na raiz do projecto |
| **GitHub Pages** | Push para `gh-pages` ou activa Pages nas definições do repositório |
| **Cloudflare Pages** | Liga o repositório Git — build command vazio, output `/` |

### Checklist antes de publicar

- [ ] Substituir `apiUrl` do RSVP pelo URL real do Apps Script
- [ ] Confirmar que `assets/target-cover.png` existe (partilha social)
- [ ] Testar abertura do livro no telemóvel
- [ ] Testar RSVP com uma confirmação real
- [ ] Testar fallback `mailto:` (desliga a rede ou usa URL inválido)
- [ ] Verificar meta tags com [opengraph.xyz](https://www.opengraph.xyz) ou similar

### Domínio personalizado

Após deploy, aponta o domínio (ex.: `save-the-date.jessicaesamuel.pt`) nas definições DNS do alojamento. Actualiza `og:image` com URL absoluta se necessário:

```html
<meta property="og:image" content="https://teu-dominio.pt/assets/target-cover.png" />
```

---

## RSVP — como funciona

```
Convidado preenche formulário
        │
        ▼
   fetch POST (no-cors) ──► Google Apps Script
        │                         │
        │                         ├── Grava linha na Sheet «RSVP»
        │                         └── Envia email aos noivos
        │
        ▼ (timeout 8s ou erro)
   Fallback mailto: ──► Cliente de email do convidado
                         (corpo pré-preenchido, 3 destinatários)
```

- **Sheet exportável** — Ficheiro → Transferir → Excel (.xlsx)
- **Nenhuma confirmação se perde** — o fallback garante entrega por email
- **Modal discreto** — só aparece ao clicar em *Confirmar Presença*

---

## Experiência do utilizador

1. **Entrada** — O livro aparece com animação suave na capa editorial
2. **Hint** — *«Toca para abrir o capítulo»* convida à interacção
3. **Abertura** — Capa gira em 3D; música inicia com fade-in; interior revela-se em sequência
4. **Interior** — Nomes, data, local, countdown e CTA de confirmação
5. **RSVP** — Modal editorial; sucesso ou fallback automático
6. **Música** — Botão fixo no canto inferior direito para play/pause

---

## Acessibilidade

- Capa com `role="button"`, `tabindex="0"` e suporte a teclado (`Enter` / `Espaço`)
- Textos alternativos em imagens relevantes; decorativos com `aria-hidden`
- Nomes completos em `.sr-only` para leitores de ecrã
- Countdown com `aria-live="polite"`
- Modal RSVP com `aria-labelledby` e `aria-describedby`
- Animações reduzidas com `prefers-reduced-motion: reduce`

---

## Performance

- Fontes com `preconnect` ao Google Fonts
- Imagens da capa com `loading="eager"` (above the fold)
- Foto interior com `decoding="async"`
- CSS e JS sem bundlers — um único request por ficheiro
- Proporção fixa `9:16` evita layout shift
- Áudio com `preload="auto"` — carrega após interacção inicial

---

## Browsers suportados

| Browser | Versão mínima |
|---------|---------------|
| Chrome / Edge | 90+ |
| Safari (iOS/macOS) | 15+ |
| Firefox | 88+ |

Requer suporte a: CSS `aspect-ratio`, `<dialog>`, `fetch`, `URLSearchParams`, CSS `:has()`.

---

## Créditos

| Elemento | Detalhe |
|----------|---------|
| **Curadoria** | HAXR Signature |
| **Edição** | N.º 01 — *O Primeiro Capítulo* |
| **Tipografia** | Cormorant Garamond · Great Vibes · Jost (Google Fonts) |
| **Trilha sonora** | *Everything is Romantic* — Alina Kay |
| **Tecnologia** | HTML · CSS · JavaScript · Google Apps Script |

---

## Suporte

- **RSVP / Google Sheets:** ver [`rsvp/README.md`](rsvp/README.md)
- **Alterações visuais:** `style.css` + `index.html`
- **Lógica e integrações:** `script.js`

---

*HAXR Signature — Save the Date editorial para casamentos e celebrações premium.*
