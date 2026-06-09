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

  /* bloqueia fecho fantasma do livro após toque no CTA (Safari iOS) */
  var blockBookToggleUntil = 0;

  /* ======================= LIVRO ========================= */
  var book = document.getElementById("book");
  var cover = document.getElementById("cover");
  var coverTap = document.getElementById("coverTap");
  var bookSpread = document.getElementById("bookSpread");
  var pageHint = document.getElementById("pageHint");

  if (book && cover) {
    var isOpen = false;
    var isAnimating = false;
    var hintDismissed = false;
    var currentPage = 0;
    var PAGE_COUNT = 2;
    var ANIM_MS = 2400;
    var swipeStartX = 0;
    var swipeStartY = 0;
    var swipeTracking = false;
    var swipeMoved = false;
    var pageHintDismissed = false;
    var isPageTurning = false;
    var PAGE_TURN_BLOCK_MS = 980;
    var PAGE_TURN_ANIM_MS = 920;
    var SWIPE_MIN_PX = 36;

    var dismissHint = function () {
      if (hintDismissed) return;
      hintDismissed = true;

      if (coverTap) coverTap.classList.add("is-dismissed");

      window.setTimeout(function () {
        if (coverTap && coverTap.parentNode) {
          coverTap.parentNode.removeChild(coverTap);
        }
      }, 900);
    };

    var dismissPageHint = function () {
      if (pageHintDismissed) return;
      pageHintDismissed = true;
      if (pageHint) pageHint.classList.add("is-dismissed");
    };

    var updatePageFolio = function (index) {
      if (!bookSpread) return;
      var dots = bookSpread.querySelectorAll("[data-page-dot]");
      for (var i = 0; i < dots.length; i++) {
        dots[i].classList.toggle("is-active", Number(dots[i].getAttribute("data-page-dot")) === index);
      }
    };

    var goToPage = function (index, force) {
      if (!bookSpread) return;
      index = Math.max(0, Math.min(PAGE_COUNT - 1, index));
      if (index === currentPage) {
        if (!force) return;
        updatePageFolio(index);
        return;
      }
      if (isPageTurning) return;

      isPageTurning = true;
      bookSpread.classList.add("is-page-turning");
      window.setTimeout(function () {
        bookSpread.classList.remove("is-page-turning");
        isPageTurning = false;
      }, PAGE_TURN_ANIM_MS);

      currentPage = index;
      bookSpread.setAttribute("data-page", String(index));
      updatePageFolio(index);

      var heroPage = bookSpread.querySelector(".page--hero");
      var dressPage = bookSpread.querySelector(".page--dress");
      if (heroPage) heroPage.setAttribute("aria-hidden", index === 0 ? "false" : "true");
      if (dressPage) dressPage.setAttribute("aria-hidden", index === 1 ? "false" : "true");

      if (index >= 1) dismissPageHint();
      updatePageHints(index);
      blockBookToggleUntil = Date.now() + PAGE_TURN_BLOCK_MS;

      if (index === 0 && dressPage) {
        window.setTimeout(function () {
          var scroll = dressPage.querySelector(".dress__scroll");
          if (scroll) scroll.scrollTop = 0;
        }, PAGE_TURN_ANIM_MS);
      }
    };

    var toggleBook = function () {
      if (isAnimating) return;
      isAnimating = true;
      blockBookToggleUntil = Date.now() + ANIM_MS;
      isOpen = !isOpen;
      book.classList.toggle("is-open", isOpen);
      cover.setAttribute("aria-expanded", String(isOpen));

      if (!isOpen) goToPage(0, true);

      /* hint editorial — desaparece para sempre na primeira abertura */
      if (isOpen) dismissHint();

      /* livro aberto — música entra; livro fechado — música pára */
      if (isOpen && typeof startMusicOnBookOpen === "function") {
        startMusicOnBookOpen();
      } else if (!isOpen && typeof pauseMusicOnBookClose === "function") {
        pauseMusicOnBookClose();
      }

      window.setTimeout(function () { isAnimating = false; }, ANIM_MS);
    };

    /* toque nas margens — virar página ou fechar (como livro físico) */
    var handleSpreadPointer = function (coords, target) {
      if (!isOpen || !isInSpreadBounds(coords.x, coords.y)) return false;

      if (
        target.closest(".book-page-edge--next") ||
        isInRightMargin(coords.x, coords.y)
      ) {
        if (currentPage < PAGE_COUNT - 1) {
          handlePageTurn(-1);
        }
        return true;
      }

      if (
        target.closest(".book-page-edge--prev") ||
        isInLeftMargin(coords.x, coords.y)
      ) {
        if (currentPage > 0) {
          handlePageTurn(1);
        } else {
          toggleBook();
        }
        return true;
      }

      return false;
    };

    var isInteractiveTarget = function (target) {
      return !!target.closest(
        "a, button, dialog, input, select, textarea, label, .hero__cta, .countdown, .music-toggle, .rsvp, .rsvp__panel, .book-page-folio"
      );
    };

    var isSwipeBlockedTarget = function (target) {
      return !!target.closest(
        "button, a, input, select, textarea, label, .hero__cta, .countdown, .music-toggle, .rsvp, .rsvp__panel"
      );
    };

    var PAGE_MARGIN_RATIO = 0.18;

    var getSpreadRect = function () {
      return bookSpread ? bookSpread.getBoundingClientRect() : null;
    };

    var isInSpreadBounds = function (x, y) {
      var rect = getSpreadRect();
      if (!rect) return false;
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    /* margem esquerda — página anterior ou fechar no Cap. I */
    var isInLeftMargin = function (x, y) {
      var rect = getSpreadRect();
      if (!rect) return false;
      return (
        x >= rect.left &&
        x <= rect.left + rect.width * PAGE_MARGIN_RATIO &&
        y >= rect.top &&
        y <= rect.bottom
      );
    };

    /* margem direita — página seguinte */
    var isInRightMargin = function (x, y) {
      var rect = getSpreadRect();
      if (!rect) return false;
      return (
        x >= rect.right - rect.width * PAGE_MARGIN_RATIO &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      );
    };

    var updatePageHints = function (index) {
      if (!bookSpread) return;
      var prevHint = bookSpread.querySelector(".book-page-hint--prev");
      var prevEdge = bookSpread.querySelector(".book-page-edge--prev");
      if (prevHint) {
        prevHint.innerHTML = index === 0
          ? "Toque · fechar"
          : "Toque · Cap.&nbsp;I";
      }
      if (prevEdge) {
        prevEdge.setAttribute("title", index === 0 ? "Fechar livro" : "Capítulo I");
      }
    };

    var handlePageTurn = function (direction) {
      if (!isOpen) return false;
      if (direction < 0 && currentPage < PAGE_COUNT - 1) {
        goToPage(currentPage + 1, true);
        return true;
      }
      if (direction > 0 && currentPage > 0) {
        goToPage(currentPage - 1, true);
        return true;
      }
      return false;
    };

    var getEventCoords = function (event) {
      var touch = (event.touches && event.touches[0]) ||
        (event.changedTouches && event.changedTouches[0]);
      if (touch) return { x: touch.clientX, y: touch.clientY };
      return { x: event.clientX, y: event.clientY };
    };

    var isPointInEl = function (el, x, y) {
      if (!el || el.hidden || el.getAttribute("aria-hidden") === "true") return false;
      var rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) return false;
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    var isOverBookControls = function (event) {
      if (isInteractiveTarget(event.target)) return true;

      var rsvp = document.getElementById("rsvpDialog");
      if (rsvp && rsvp.open) return true;
      if (Date.now() < blockBookToggleUntil) return true;

      var coords = getEventCoords(event);
      var controls = [
        document.getElementById("rsvpOpen"),
        document.getElementById("countdown")
      ];
      for (var i = 0; i < controls.length; i++) {
        if (isPointInEl(controls[i], coords.x, coords.y)) return true;
      }
      return false;
    };

    book.addEventListener("click", function (event) {
      if (isOverBookControls(event)) return;
      if (Date.now() < blockBookToggleUntil) return;

      var coords = getEventCoords(event);

      if (!isOpen) {
        toggleBook();
        return;
      }

      handleSpreadPointer(coords, event.target);
    });

    if (bookSpread) {
      updatePageFolio(0);

      bookSpread.addEventListener("touchstart", function (event) {
        if (!isOpen || event.touches.length !== 1) return;
        if (isSwipeBlockedTarget(event.target)) return;
        swipeStartX = event.touches[0].clientX;
        swipeStartY = event.touches[0].clientY;
        swipeTracking = true;
        swipeMoved = false;
      }, { passive: true });

      bookSpread.addEventListener("touchmove", function (event) {
        if (!swipeTracking || !isOpen || event.touches.length !== 1) return;
        var dx = event.touches[0].clientX - swipeStartX;
        var dy = event.touches[0].clientY - swipeStartY;
        if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.1) {
          swipeMoved = true;
          blockBookToggleUntil = Date.now() + PAGE_TURN_BLOCK_MS;
        }
      }, { passive: true });

      bookSpread.addEventListener("touchend", function (event) {
        if (!swipeTracking || !isOpen) return;
        swipeTracking = false;
        var touch = event.changedTouches[0];
        if (!touch) return;
        var dx = touch.clientX - swipeStartX;
        var dy = touch.clientY - swipeStartY;

        if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.1) {
          if (handlePageTurn(dx < 0 ? -1 : 1)) {
            event.preventDefault();
            return;
          }
        }

        /* toque curto na margem — virar página ou fechar */
        if (!swipeMoved && handleSpreadPointer(
          { x: touch.clientX, y: touch.clientY },
          event.target
        )) {
          event.preventDefault();
        }
      }, { passive: false });

      var folio = bookSpread.querySelector(".book-page-folio");
      if (folio) {
        folio.addEventListener("click", function (event) {
          if (!isOpen || Date.now() < blockBookToggleUntil) return;
          var dot = event.target.closest("[data-page-dot]");
          if (!dot) return;
          event.stopPropagation();
          var idx = Number(dot.getAttribute("data-page-dot"));
          if (idx !== currentPage) goToPage(idx);
        });
      }

      updatePageHints(0);
    }

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

  /* hooks expostos para o livro — no-ops se o audio não existir */
  var startMusicOnBookOpen = function () {};
  var pauseMusicOnBookClose = function () {};

  if (audio && musicBtn) {
    var TARGET_VOLUME = 0.55;
    var FADE_IN_MS = 1500;
    var FADE_OUT_MS = 600;
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

    function beginPlayback() {
      showButton();
      setPausedState(false);
      fade(TARGET_VOLUME, FADE_IN_MS);
    }

    function hideButton() {
      musicBtn.classList.remove("is-visible");
    }

    /* livro abre — trilha retoma sempre com fade (gesto válido p/ mobile) */
    startMusicOnBookOpen = function () {
      clearFade();

      var resume = function () {
        beginPlayback();
      };

      if (!audio.paused) {
        resume();
        return;
      }

      var playPromise = audio.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(resume)
          .catch(function () {
            /* browser bloqueou — mostra botão para o utilizador iniciar */
            showButton();
            setPausedState(true);
          });
      } else {
        resume();
      }
    };

    /* livro fecha por completo — trilha pára com fade */
    pauseMusicOnBookClose = function () {
      clearFade();
      fade(0, FADE_OUT_MS, function () {
        audio.pause();
        audio.volume = 0;
        setPausedState(true);
        hideButton();
      });
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

  var handleRsvpOpen = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") {
      e.stopImmediatePropagation();
    }
    blockBookToggleUntil = Date.now() + 500;
    openDialog();
  };

  var stopBookFromRsvpTouch = function (e) {
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") {
      e.stopImmediatePropagation();
    }
    blockBookToggleUntil = Date.now() + 500;
  };

  openBtn.addEventListener("click", handleRsvpOpen);
  openBtn.addEventListener("touchstart", stopBookFromRsvpTouch, { capture: true, passive: true });
  openBtn.addEventListener("touchend", stopBookFromRsvpTouch, { capture: true, passive: true });

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
