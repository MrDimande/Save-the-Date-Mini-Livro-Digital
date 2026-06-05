/**
 * =========================================================
 *  HAXR Signature · RSVP — Google Apps Script Web App
 *  Save the Date · Jéssica & Samuel · 15.08.2026 · Villa Verde
 * =========================================================
 *
 *  Este script:
 *   1. Recebe os dados do formulário RSVP via POST
 *   2. Acrescenta uma linha numa aba chamada exactamente "RSVP"
 *      (cria a aba e os cabeçalhos automaticamente se não existir)
 *   3. Envia notificação editorial para os 3 e-mails dos noivos
 *
 *  Tutorial completo de deploy: ver rsvp/README.md
 * =========================================================
 */

// ====== CONFIGURAÇÃO — confirma estes valores antes de publicar ======
var SHEET_NAME = "RSVP";

var NOTIFY_TO = "samuelgovene@gmail.com";
var NOTIFY_CC = "muegejessica@gmail.com, aludimande@gmail.com";

var EMAIL_SUBJECT = "Confirmação de presença — Jéssica & Samuel";
var EVENT_LABEL   = "Casamento Jéssica & Samuel · 15.08.2026 · Villa Verde";

var SHEET_HEADERS = [
  "Data/Hora",
  "Nome",
  "Email",
  "Telefone",
  "Número de acompanhantes",
  "Mensagem",
  "Evento",
  "Confirmação"
];
// ======================================================================


/**
 * Endpoint principal — recebe o POST do front-end (URLSearchParams).
 * O Apps Script lê os campos via e.parameter.
 */
function doPost(e) {
  try {
    var p = (e && e.parameter) ? e.parameter : {};

    var dados = {
      nome: (p.nome || "").toString().trim(),
      email: (p.email || "").toString().trim(),
      telefone: (p.telefone || "").toString().trim(),
      acompanhantes: (p.acompanhantes || "0").toString().trim(),
      mensagem: (p.mensagem || "").toString().trim()
    };

    if (!dados.nome || !dados.email) {
      return jsonResponse({ ok: false, error: "Campos obrigatórios em falta." });
    }

    var sheet = getOrCreateSheet_();

    sheet.appendRow([
      new Date(),
      dados.nome,
      dados.email,
      dados.telefone || "—",
      dados.acompanhantes || "0",
      dados.mensagem || "—",
      EVENT_LABEL,
      "Sim"
    ]);

    enviarNotificacao_(dados);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}


/**
 * Endpoint GET opcional — útil para testar se o Web App está activo.
 * Abre o URL no browser e deve mostrar { ok: true, status: "alive" }.
 */
function doGet() {
  return jsonResponse({ ok: true, status: "alive", sheet: SHEET_NAME });
}


/**
 * Garante que existe uma aba chamada exactamente "RSVP" com cabeçalhos.
 * Cria a aba e os cabeçalhos se não existir.
 */
function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    var header = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
    header.setFontWeight("bold");
    header.setBackground("#f8f4ef");
    header.setFontColor("#1f1917");
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, SHEET_HEADERS.length);
  }

  return sheet;
}


/**
 * Notificação editorial enviada aos 3 e-mails dos noivos.
 */
function enviarNotificacao_(dados) {
  var html =
    '<div style="font-family:Georgia,\'Cormorant Garamond\',serif;color:#1f1917;background:#f8f4ef;padding:32px;border:1px solid #d8c7b8;max-width:560px;margin:auto;">' +
      '<p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:#7a1f2b;margin:0 0 18px;">' +
        'Confirmação de Presença' +
      '</p>' +
      '<h2 style="font-size:22px;font-weight:500;margin:0 0 4px;color:#1f1917;">' +
        'Jéssica <span style="color:#7a1f2b;font-style:italic;">&amp;</span> Samuel' +
      '</h2>' +
      '<p style="font-style:italic;color:rgba(31,25,23,0.65);margin:0 0 22px;font-size:13px;">' +
        EVENT_LABEL +
      '</p>' +
      '<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;color:#1f1917;">' +
        linha_("Nome", dados.nome) +
        linha_("Email", dados.email) +
        linha_("Telefone", dados.telefone || "—") +
        linha_("Acompanhantes", dados.acompanhantes || "0") +
        linha_("Mensagem", dados.mensagem || "—") +
      '</table>' +
      '<hr style="border:none;border-top:1px solid #d8c7b8;margin:26px 0 16px;" />' +
      '<p style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:rgba(31,25,23,0.5);margin:0;">' +
        'HAXR Signature · Save the Date' +
      '</p>' +
    '</div>';

  var plain =
    "Nova confirmação de presença\n\n" +
    "Nome:           " + dados.nome + "\n" +
    "Email:          " + dados.email + "\n" +
    "Telefone:       " + (dados.telefone || "—") + "\n" +
    "Acompanhantes:  " + (dados.acompanhantes || "0") + "\n" +
    "Mensagem:       " + (dados.mensagem || "—") + "\n\n" +
    "Evento: " + EVENT_LABEL + "\n\n" +
    "— HAXR Signature";

  MailApp.sendEmail({
    to: NOTIFY_TO,
    cc: NOTIFY_CC,
    subject: EMAIL_SUBJECT,
    body: plain,
    htmlBody: html,
    name: "HAXR Signature · Save the Date"
  });
}


/**
 * Helper: linha de tabela HTML para o email.
 */
function linha_(label, valor) {
  var safe = (valor === undefined || valor === null) ? "" : String(valor);
  safe = safe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return (
    '<tr>' +
      '<td style="padding:6px 12px 6px 0;color:rgba(31,25,23,0.6);font-style:italic;width:42%;">' + label + '</td>' +
      '<td style="padding:6px 0;color:#1f1917;">' + safe + '</td>' +
    '</tr>'
  );
}


/**
 * Helper: resposta JSON (não lida pelo front-end em modo no-cors,
 * mas útil para depuração via doGet ou Postman).
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
