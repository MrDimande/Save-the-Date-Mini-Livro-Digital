/* =========================================================
   HAXR Signature · Save the Date — interacção do livro + RSVP
   ========================================================= */
(function () {
  "use strict";

  /* =========================================================
     CONFIGURAÇÃO RSVP — substitui o URL pelo do teu Apps Script
     ========================================================= */
  var RSVP_CONFIG = {
    /* URL do Web App publicado pelo Apps Script */
    apiUrl: "https://script.google.com/macros/s/AKfycbx4NOnsJeZtI5pTNQp4bmZySIirdKvNSYm6SYXS5I0rkHW_aYp1Ko-jxNKMPYCZT_wh_A/exec",

    /* Assunto e destinatários (usados também no fallback mailto) */
    subject: "Confirmação de presença — Jéssica & Samuel",
    emails: {
      to: "samuelgovene@gmail.com",
      cc: ["muegejessica@gmail.com", "aludimande@gmail.com"]
    },

    /* Timeout antes de assumir que o envio falhou */
    timeoutMs: 8000,

    /* Tempo de auto-close do estado de sucesso */
    successAutoCloseMs: 6000,

    /* Tempo de espera no estado erro antes de abrir o mailto */
    errorMailtoDelayMs: 1200
  };

  /* ======================= LIVRO ========================= */
  var book = document.getElementById("book");
  var cover = document.getElementById("cover");
  var bookHint = document.getElementById("bookHint");

  if (book && cover) {
    var isOpen = false;
    var isAnimating = false;
    var hintDismissed = false;
    var ANIM_MS = 2400;

    var dismissHint = function () {
      if (hintDismissed || !bookHint) return;
      hintDismissed = true;
      bookHint.classList.add("is-dismissed");
      window.setTimeout(function () {
        if (bookHint && bookHint.parentNode) {
          bookHint.parentNode.removeChild(bookHint);
        }
      }, 900);
    };

    var toggleBook = function () {
      if (isAnimating) return;
      isAnimating = true;
      isOpen = !isOpen;
      book.classList.toggle("is-open", isOpen);
      cover.setAttribute("aria-expanded", String(isOpen));

      /* hint editorial — desaparece para sempre na primeira abertura */
      if (isOpen) dismissHint();

      /* dispara música apenas na primeira abertura — gesto válido p/ mobile */
      if (isOpen && typeof startMusicOnFirstOpen === "function") {
        startMusicOnFirstOpen();
      }

      window.setTimeout(function () { isAnimating = false; }, ANIM_MS);
    };

    book.addEventListener("click", function (event) {
      if (event.target.closest("a")) return;
      if (event.target.closest("button")) return;
      if (event.target.closest("dialog")) return;
      toggleBook();
    });

    cover.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
        event.preventDefault();
        toggleBook();
      }
    });
  }

  /* ======================= TRILHA SONORA ========================= */
  var audio = document.getElementById("bg-music");
  var musicBtn = document.getElementById("musicToggle");

  /* default exposto para o hook do livro — mesmo que o audio não exista */
  var startMusicOnFirstOpen = function () {};

  if (audio && musicBtn) {
    var TARGET_VOLUME = 0.55;
    var FADE_IN_MS = 1500;
    var FADE_OUT_MS = 600;
    var musicStarted = false;
    var fadeRAF = null;

    audio.volume = 0;
    audio.loop = true;

    function clearFade() {
      if (fadeRAF) {
        cancelAnimationFrame(fadeRAF);
        fadeRAF = null;
      }
    }

    function fade(toVol, durMs, onDone) {
      clearFade();
      var fromVol = audio.volume;
      var startTs = null;
      function step(ts) {
        if (!startTs) startTs = ts;
        var p = Math.min(1, (ts - startTs) / durMs);
        audio.volume = Math.max(0, Math.min(1, fromVol + (toVol - fromVol) * p));
        if (p < 1) {
          fadeRAF = requestAnimationFrame(step);
        } else {
          fadeRAF = null;
          if (typeof onDone === "function") onDone();
        }
      }
      fadeRAF = requestAnimationFrame(step);
    }

    function showButton() {
      musicBtn.hidden = false;
      requestAnimationFrame(function () {
        musicBtn.classList.add("is-visible");
      });
    }

    function setPausedState(paused) {
      musicBtn.classList.toggle("is-paused", paused);
      musicBtn.setAttribute("aria-pressed", String(!paused));
      musicBtn.setAttribute(
        "aria-label",
        paused ? "Retomar música de fundo" : "Pausar música de fundo"
      );
    }

    /* exposto para o livro chamar na 1ª abertura */
    startMusicOnFirstOpen = function () {
      if (musicStarted) return;
      musicStarted = true;

      var playPromise = audio.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(function () {
            showButton();
            setPausedState(false);
            fade(TARGET_VOLUME, FADE_IN_MS);
          })
          .catch(function () {
            /* browser bloqueou — mostra botão para o utilizador iniciar */
            musicStarted = false;
            showButton();
            setPausedState(true);
          });
      } else {
        showButton();
        setPausedState(false);
        fade(TARGET_VOLUME, FADE_IN_MS);
      }
    };

    /* toggle do botão (sem reiniciar) */
    musicBtn.addEventListener("click", function () {
      if (audio.paused) {
        var p = audio.play();
        var afterPlay = function () {
          setPausedState(false);
          fade(TARGET_VOLUME, FADE_OUT_MS);
        };
        if (p && typeof p.then === "function") {
          p.then(afterPlay).catch(function () { /* silencioso */ });
        } else {
          afterPlay();
        }
      } else {
        fade(0, FADE_OUT_MS, function () {
          audio.pause();
          setPausedState(true);
        });
      }
    });

    /* sincroniza estado se o audio terminar/pausar por outro motivo */
    audio.addEventListener("pause", function () {
      if (audio.volume === 0) return; /* fade-out manual em curso */
      setPausedState(true);
    });
    audio.addEventListener("play", function () { setPausedState(false); });
  }

  /* ======================= CONTAGEM REGRESSIVA ========================= */
  /* Data do casamento — Jéssica & Samuel · 15 de Agosto de 2026 */
  (function () {
    var el = document.getElementById("countdownText");
    if (!el) return;

    /* mês 0-indexado (7 = Agosto) */
    var WEDDING = new Date(2026, 7, 15);

    function render() {
      var now = new Date();
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var target = new Date(WEDDING.getFullYear(), WEDDING.getMonth(), WEDDING.getDate());

      var diffDays = Math.round((target - today) / 86400000);

      var text;
      if (diffDays > 1) {
        text = diffDays + " dias para o capítulo";
      } else if (diffDays === 1) {
        text = "Falta apenas 1 dia para o capítulo";
      } else if (diffDays === 0) {
        text = "Hoje começa o capítulo";
      } else if (diffDays === -1) {
        text = "Ontem começou o nosso capítulo";
      } else {
        text = "O capítulo está a ser escrito";
      }

      el.textContent = text;
    }

    render();

    /* re-renderiza à meia-noite caso a página esteja aberta na transição de dia */
    var nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 5, 0);
    var msUntilMidnight = nextMidnight - new Date();
    window.setTimeout(function () {
      render();
      window.setInterval(render, 86400000);
    }, msUntilMidnight);
  })();

  /* ======================= RSVP ========================= */
  var dialogEl = document.getElementById("rsvpDialog");
  var openBtn = document.getElementById("rsvpOpen");
  var closeBtn = document.getElementById("rsvpClose");
  var retryBtn = document.getElementById("rsvpRetry");

  if (!dialogEl || !openBtn) return;

  var form = dialogEl.querySelector("form");
  var submitBtn = document.getElementById("rsvpSubmit");
  var states = {
    idle: dialogEl.querySelector('[data-state="idle"]'),
    loading: dialogEl.querySelector('[data-state="loading"]'),
    success: dialogEl.querySelector('[data-state="success"]'),
    error: dialogEl.querySelector('[data-state="error"]')
  };
  var fields = {
    nome: document.getElementById("rsvpNome"),
    email: document.getElementById("rsvpEmail"),
    telefone: document.getElementById("rsvpTelefone"),
    acompanhantes: document.getElementById("rsvpAcomp"),
    mensagem: document.getElementById("rsvpMsg")
  };

  /* ----- estados ----- */
  function setState(name) {
    Object.keys(states).forEach(function (key) {
      var el = states[key];
      if (!el) return;
      if (key === name) {
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });
  }

  /* ----- abrir / fechar ----- */
  function openDialog() {
    setState("idle");
    if (typeof dialogEl.showModal === "function") {
      dialogEl.showModal();
    } else {
      dialogEl.setAttribute("open", "");
    }
    window.setTimeout(function () {
      if (fields.nome) fields.nome.focus();
    }, 60);
  }

  function closeDialog() {
    if (dialogEl.open) {
      try { dialogEl.close(); } catch (e) { dialogEl.removeAttribute("open"); }
    } else {
      dialogEl.removeAttribute("open");
    }
    /* limpa erros visuais ao fechar */
    Array.prototype.forEach.call(
      form.querySelectorAll(".is-invalid"),
      function (el) { el.classList.remove("is-invalid"); }
    );
  }

  openBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    openDialog();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      closeDialog();
    });
  }

  /* fechar ao clicar no backdrop */
  dialogEl.addEventListener("click", function (event) {
    if (event.target === dialogEl) closeDialog();
  });

  /* fechar com Esc — comportamento nativo do <dialog>, mas garante consistência */
  dialogEl.addEventListener("cancel", function (event) {
    event.preventDefault();
    closeDialog();
  });

  /* ----- validação ----- */
  function validate(data) {
    var errors = {};
    if (!data.nome || data.nome.trim().length < 2) {
      errors.nome = "Indica o teu nome.";
    }
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRe.test(data.email.trim())) {
      errors.email = "Indica um email válido.";
    }
    return errors;
  }

  function showErrors(errors) {
    Object.keys(fields).forEach(function (key) {
      var input = fields[key];
      if (!input) return;
      var fieldEl = input.closest(".rsvp__field");
      if (!fieldEl) return;
      var errEl = fieldEl.querySelector('[data-error-for="' + key + '"]');
      if (errors[key]) {
        fieldEl.classList.add("is-invalid");
        if (errEl) errEl.textContent = errors[key];
      } else {
        fieldEl.classList.remove("is-invalid");
        if (errEl) errEl.textContent = "";
      }
    });
  }

  /* ----- submissão ----- */
  function getFormData() {
    return {
      nome: (fields.nome.value || "").trim(),
      email: (fields.email.value || "").trim(),
      telefone: (fields.telefone.value || "").trim(),
      acompanhantes: fields.acompanhantes.value || "0",
      mensagem: (fields.mensagem.value || "").trim()
    };
  }

  function buildMailto(data) {
    var ccList = (RSVP_CONFIG.emails.cc || []).join(",");
    var subject = encodeURIComponent(RSVP_CONFIG.subject);

    var lines = [
      "Olá, Jéssica e Samuel.",
      "",
      "Recebi o Save the Date do vosso casamento no dia 15 de Agosto de 2026 e confirmo a minha presença.",
      "",
      "Nome:           " + (data.nome || "—"),
      "Email:          " + (data.email || "—"),
      "Telefone:       " + (data.telefone || "—"),
      "Acompanhantes:  " + (data.acompanhantes || "0"),
      "Mensagem:       " + (data.mensagem || "—"),
      "",
      "Com carinho,",
      data.nome || "[Nome do convidado]",
      "",
      "— — —",
      "Curadoria HAXR Signature"
    ];

    var body = encodeURIComponent(lines.join("\n"));
    var to = encodeURIComponent(RSVP_CONFIG.emails.to || "");
    var cc = ccList ? "&cc=" + encodeURIComponent(ccList) : "";

    return "mailto:" + to + "?subject=" + subject + cc + "&body=" + body;
  }

  function fallbackToMailto(data) {
    setState("error");
    window.setTimeout(function () {
      window.location.href = buildMailto(data);
    }, RSVP_CONFIG.errorMailtoDelayMs);
  }

  function postWithTimeout(url, params, ms) {
    return new Promise(function (resolve, reject) {
      var timeoutId = window.setTimeout(function () {
        reject(new Error("timeout"));
      }, ms);

      /* no-cors → resposta opaca; tratamos qualquer return como envio submetido */
      fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: params.toString()
      })
        .then(function () {
          window.clearTimeout(timeoutId);
          resolve();
        })
        .catch(function (err) {
          window.clearTimeout(timeoutId);
          reject(err);
        });
    });
  }

  function submitRsvp(data) {
    /* monta os dados para Apps Script (e.parameter) */
    var params = new URLSearchParams();
    params.append("nome", data.nome);
    params.append("email", data.email);
    params.append("telefone", data.telefone);
    params.append("acompanhantes", data.acompanhantes);
    params.append("mensagem", data.mensagem);

    var url = RSVP_CONFIG.apiUrl;

    /* se a URL não estiver configurada, vai directo para mailto */
    if (!url || url.indexOf("COLE_AQUI") === 0) {
      fallbackToMailto(data);
      return;
    }

    setState("loading");

    postWithTimeout(url, params, RSVP_CONFIG.timeoutMs)
      .then(function () {
        setState("success");
        window.setTimeout(closeDialog, RSVP_CONFIG.successAutoCloseMs);
      })
      .catch(function () {
        fallbackToMailto(data);
      });
  }

  /* submit do formulário */
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = getFormData();
    var errors = validate(data);
    showErrors(errors);

    if (Object.keys(errors).length > 0) {
      var firstInvalid = form.querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    submitRsvp(data);
  });

  /* tentar novamente */
  if (retryBtn) {
    retryBtn.addEventListener("click", function () {
      setState("idle");
    });
  }

  /* limpa erros à medida que o utilizador corrige */
  Object.keys(fields).forEach(function (key) {
    var input = fields[key];
    if (!input) return;
    input.addEventListener("input", function () {
      var fieldEl = input.closest(".rsvp__field");
      if (fieldEl && fieldEl.classList.contains("is-invalid")) {
        fieldEl.classList.remove("is-invalid");
      }
    });
  });
})();
