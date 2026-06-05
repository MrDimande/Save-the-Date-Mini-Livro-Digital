# RSVP · Save the Date · Jéssica & Samuel

Sistema de confirmação de presença do mini-livro digital **HAXR Signature**.

Funciona em **3 camadas**:

1. **Front-end** (`index.html` + `style.css` + `script.js`) — modal editorial com formulário discreto.
2. **Google Sheets + Apps Script** — guarda cada confirmação numa folha exportável para Excel.
3. **Fallback `mailto:`** — abre o cliente de email do convidado se o envio online falhar (timeout de 8s ou erro de rede).

---

## ⚠️ Regra obrigatória

> **A aba da Google Sheet tem de se chamar exactamente `RSVP`** (com maiúsculas).
> Se não existir, o Apps Script cria-a automaticamente com os cabeçalhos correctos.

---

## 📋 Passo 1 — Criar a Google Sheet

1. Vai a [https://sheets.new](https://sheets.new) e cria uma nova folha de cálculo.
2. Dá-lhe um nome claro, por exemplo: **`RSVP · Jéssica & Samuel · 15.08.2026`**.
3. **Não precisas de criar a aba RSVP manualmente** — o script cria-a sozinho na primeira confirmação.
   Mas se preferires, podes criá-la já com o nome exacto: `RSVP`.

---

## 📋 Passo 2 — Abrir o Apps Script

1. Dentro da Google Sheet, vai a **Extensões → Apps Script**.
2. Abre o ficheiro local **`rsvp/google-apps-script.gs`** deste projecto.
3. Copia **todo o conteúdo** e cola dentro do Apps Script, **substituindo o conteúdo de `Code.gs`**.
4. Confirma que estes valores estão correctos no topo do ficheiro:

```js
var SHEET_NAME = "RSVP";
var NOTIFY_TO  = "samuelgovene@gmail.com";
var NOTIFY_CC  = "muegejessica@gmail.com, aludimande@gmail.com";
var EMAIL_SUBJECT = "Confirmação de presença — Jéssica & Samuel";
```

5. Clica em **💾 Guardar** (ou `Ctrl+S`). Dá um nome ao projecto, por exemplo: `RSVP HAXR`.

---

## 📋 Passo 3 — Publicar como Web App

1. No Apps Script, clica em **Implementar → Nova implementação**.
2. No ícone do engrenagem (⚙️), seleciona **Aplicação Web**.
3. Preenche:
   - **Descrição**: `RSVP HAXR Signature`
   - **Executar como**: `Eu (o teu email)`
   - **Quem tem acesso**: **`Qualquer pessoa`** ⚠️ (essencial para o front-end conseguir enviar)
4. Clica em **Implementar**.
5. Vai pedir autorização — clica em **Autorizar acesso**, escolhe a tua conta Google, em **`Avançado` → `Aceder a (não seguro)`** e dá permissão.
6. Copia o **URL do Web App**. Vai parecer algo como:

```
https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXX/exec
```

---

## 📋 Passo 4 — Ligar o front-end

Abre `script.js` e substitui o placeholder na configuração:

```js
var RSVP_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbx.../exec", // ← cola o URL aqui
  ...
};
```

Guarda o ficheiro, recarrega a página, e está pronto.

---

## 📋 Passo 5 — Testar

1. Abre o `index.html` no browser.
2. Abre o livro, clica em **Confirmar Presença**.
3. Preenche o formulário e submete.
4. Confirma que:
   - Aparece o estado de sucesso: *“Confirmação recebida com carinho.”*
   - Foi adicionada uma nova linha na aba `RSVP` da Google Sheet.
   - Recebeste um email com o detalhe da confirmação.

> Se houver erro de rede ou timeout (8s), o site abre automaticamente o cliente de email do convidado já com os 3 destinatários e o corpo pré-preenchido — **nenhuma confirmação se perde**.

---

## 🔁 Re-publicar depois de alterações ao Apps Script

Sempre que alteras o `.gs`:

1. **Implementar → Gerir implementações**
2. No teu deploy, clica no ✏️ (editar) e em **Versão → Nova versão**
3. **Implementar**
4. **O URL não muda.** Não é preciso actualizar o `script.js`.

---

## 📊 Exportar para Excel

Na Google Sheet:

- **Ficheiro → Transferir → Microsoft Excel (.xlsx)**

Tens a lista de confirmações pronta a usar.

---

## 🔒 Notas técnicas

- **`URLSearchParams` no front-end** — o Apps Script lê os campos via `e.parameter`.
  Não usar `JSON.stringify` nesta versão.
- **Modo `no-cors`** — o browser bloquearia a leitura da resposta, mas o envio chega na mesma. Tratamos qualquer retorno do `fetch` como *“envio submetido”* (resposta opaca).
- **Timeout 8s** — se o servidor demora mais que 8 segundos, dispara o fallback `mailto:`.
- **Fallback `mailto:`** — também é activado em qualquer erro de rede.
- **Aba `RSVP` automática** — se ainda não existir, o Apps Script cria-a com os cabeçalhos editoriais.

---

## 📁 Estrutura

```
save-the-date-mini-book/
├── index.html
├── style.css
├── script.js                       ← define apiUrl em RSVP_CONFIG
└── rsvp/
    ├── google-apps-script.gs       ← cola dentro do Apps Script
    └── README.md                   ← este ficheiro
```

---

## ✉️ Mensagem de sucesso

> **“Confirmação recebida com carinho.
> Mal podemos esperar para vos ver no nosso primeiro capítulo.”**

— *HAXR Signature*
