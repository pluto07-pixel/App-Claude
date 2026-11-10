// ============================================================
// SCHERMO FOCUS — il timer a schermo intero, la registrazione
// delle uscite dall'app e il collegamento con "Non disturbare".
//
// NON DISTURBARE: una pagina web non può accendere le modalità di
// iPhone. Può però aprire un indirizzo speciale, shortcuts://..., che
// fa eseguire un comando dell'app Comandi Rapidi. Il comando (che si
// crea una volta sola sul telefono, vedi TUTORIAL.md) riceve un testo:
//   - un numero  -> attiva Non disturbare per quel numero di minuti;
//   - "off"      -> lo disattiva.
// Se il focus arriva alla fine prevista non serve fare nulla: iPhone
// spegne Non disturbare da solo all'orario indicato.
// ============================================================

import { creaFocus, faseAttuale, riepilogo, studioPerso, inCronometro, SOGLIA_INTERRUZIONE } from "./focus.js";
import { nuovoId, titoloDi, trovaMateria } from "./modello.js";
import { inGiorno, inDurata } from "./date.js";
import { pulisci } from "./giornata.js";

export const NOME_COMANDO = "Agenda Focus";

let app = null;          // { stato(), salva(), ridisegna() }: fornito da app.js
let schermo = null;      // l'elemento a schermo intero, quando è visibile
let orologio = null;     // il timer che aggiorna lo schermo ogni secondo
let schermoAcceso = null;
let ultimoLancio = 0;    // istante dell'ultimo comando lanciato

// Da chiamare una volta all'avvio dell'app
export function preparaFocus(contesto) {
  app = contesto;
  document.addEventListener("visibilitychange", alCambioVisibilita);
  if (app.stato().focus) {
    chiudiAssenzaAperta(Date.now());
    mostra();
  }
}

// ---------- Non disturbare ----------

// Fa eseguire il comando rapido passando "testo" come input.
// Attenzione: questo porta in primo piano Comandi Rapidi, poi si torna all'agenda a mano.
export function lanciaComando(testo) {
  ultimoLancio = Date.now();
  const indirizzo = "shortcuts://run-shortcut"
    + `?name=${encodeURIComponent(NOME_COMANDO)}&input=text&text=${encodeURIComponent(testo)}`;
  window.location.href = indirizzo;
}

function nonDisturbareAttivo() {
  return app.stato().impostazioni.nonDisturbare === true;
}

// ---------- Avvio ----------

export function avviaFocus(blocco) {
  const stato = app.stato();
  if (stato.focus) return;
  const adesso = Date.now();
  stato.focus = creaFocus(blocco, titoloDi(stato, blocco), stato.impostazioni, adesso);
  app.salva();
  mostra();
  if (nonDisturbareAttivo()) {
    const minuti = Math.max(1, Math.ceil((stato.focus.fine - adesso) / 60000));
    lanciaComando(String(minuti));
  }
}

// ---------- Uscite dall'app (Page Visibility API) ----------
// Il browser avvisa ogni volta che la pagina smette di essere visibile
// (cambio app, blocco schermo) e quando torna visibile.

function alCambioVisibilita() {
  const focus = app.stato().focus;
  if (!focus) return;
  const adesso = Date.now();
  if (document.hidden) {
    focus.assenze.push({
      da: adesso,
      a: null,
      conta: false,
      // se sono uscito subito dopo aver lanciato il comando, l'uscita è "colpa" dell'app
      comando: adesso - ultimoLancio < 4000,
    });
    app.salva();   // salvo subito: l'app potrebbe venire chiusa mentre è in secondo piano
  } else {
    const assenza = chiudiAssenzaAperta(adesso);
    tieniSchermoAcceso();
    aggiornaSchermo();
    if (assenza) mostraAvvisoRientro(assenza);
  }
}

function chiudiAssenzaAperta(adesso) {
  const focus = app.stato().focus;
  const aperta = focus && focus.assenze.find((a) => a.a === null);
  if (!aperta) return null;
  aperta.a = adesso;
  app.salva();
  return aperta;
}

// Al rientro: una riga discreta con il tempo passato fuori. Nessun rimprovero.
function mostraAvvisoRientro(assenza) {
  const focus = app.stato().focus;
  if (!focus || !schermo || assenza.comando) return;
  const perso = studioPerso(focus, assenza, Date.now());
  if (perso < SOGLIA_INTERRUZIONE) return;
  const avviso = schermo.querySelector("#f-avviso");
  if (!avviso) return;
  avviso.innerHTML = `
    <span>Fuori dall'app per ${inCronometro(perso)}. Non contati.</span>
    <button type="button" id="f-conta">Conta come studio</button>`;
  avviso.hidden = false;
  avviso.querySelector("#f-conta").addEventListener("click", () => {
    assenza.conta = true;
    app.salva();
    avviso.hidden = true;
    aggiornaSchermo();
  });
}

// Chiede al telefono di non spegnere lo schermo durante il focus (Wake Lock API).
// Il permesso decade ogni volta che l'app va in secondo piano, quindi lo richiedo al rientro.
async function tieniSchermoAcceso() {
  if (!("wakeLock" in navigator) || !app.stato().focus) return;
  try { schermoAcceso = await navigator.wakeLock.request("screen"); } catch {}
}
function lasciaSpegnereSchermo() {
  if (schermoAcceso) schermoAcceso.release().catch(() => {});
  schermoAcceso = null;
}

// ---------- Schermo ----------

function mostra() {
  const stato = app.stato();
  const focus = stato.focus;
  const materia = trovaMateria(stato, focus.materiaId);
  const oraFine = new Date(focus.fine);
  const fineTesto = `${String(oraFine.getHours()).padStart(2, "0")}:${String(oraFine.getMinutes()).padStart(2, "0")}`;

  if (!schermo) {
    schermo = document.createElement("div");
    schermo.className = "focus";
    document.body.append(schermo);
  }
  schermo.innerHTML = `
    <div class="focus-alto">
      <span class="etichetta" id="f-fase"></span>
      <h2 class="titolo">${pulisci(materia ? materia.sigla : focus.titolo)}</h2>
      ${materia && focus.titolo !== materia.sigla ? `<p class="secondario">${pulisci(focus.titolo)}</p>` : ""}
    </div>
    <div class="focus-centro">
      <div class="titolo numeri focus-tempo" id="f-tempo"></div>
      <div class="barra-obiettivo"><i id="f-barra"></i></div>
      <p class="secondario numeri" id="f-resto" data-fine="${fineTesto}"></p>
      <p class="secondario numeri" id="f-ciclo"></p>
    </div>
    <div class="focus-basso">
      <p class="focus-avviso" id="f-avviso" hidden></p>
      <div class="focus-azioni" id="f-azioni">
        <button type="button" class="pulsante largo" id="f-termina">Termina</button>
      </div>
    </div>`;
  document.body.style.overflow = "hidden";

  schermo.querySelector("#f-termina").addEventListener("click", chiediComeTerminare);

  clearInterval(orologio);
  orologio = setInterval(aggiornaSchermo, 1000);
  tieniSchermoAcceso();
  aggiornaSchermo();
}

// Eseguita ogni secondo: ricalcola tutto dagli istanti salvati e aggiorna i testi
function aggiornaSchermo() {
  const focus = app.stato().focus;
  if (!focus || !schermo) return;
  const adesso = Date.now();
  if (adesso >= focus.fine) {
    concludi(focus.fine, false);   // fine naturale: Non disturbare si spegne da solo
    return;
  }
  const dati = riepilogo(focus, adesso);
  const fase = faseAttuale(focus, adesso);
  const inPausa = fase && fase.tipo === "pausa";

  let etichetta = inPausa ? "Pausa" : "Studio";
  if (focus.modalita === "cicli" && fase) etichetta += ` · ciclo ${fase.numero}`;
  schermo.querySelector("#f-fase").textContent = etichetta;
  schermo.classList.toggle("in-pausa", inPausa);

  schermo.querySelector("#f-tempo").textContent = inCronometro(dati.studio);
  schermo.querySelector("#f-barra").style.width = `${(dati.trascorso / (focus.fine - focus.avvio)) * 100}%`;

  const resto = schermo.querySelector("#f-resto");
  resto.textContent = `Mancano ${inCronometro(focus.fine - adesso)} · fino alle ${resto.dataset.fine}`;

  let ciclo = "";
  if (focus.modalita === "cicli" && fase && fase.a < focus.fine) {
    ciclo = inPausa ? `Si riprende tra ${inCronometro(fase.a - adesso)}` : `Pausa tra ${inCronometro(fase.a - adesso)}`;
  }
  schermo.querySelector("#f-ciclo").textContent = ciclo;
}

// "Termina" non chiude subito: chiede cosa fare del tempo studiato
function chiediComeTerminare() {
  const azioni = schermo.querySelector("#f-azioni");
  azioni.innerHTML = `
    <button type="button" class="pulsante largo principale" id="f-salva">Salva e chiudi</button>
    <button type="button" class="pulsante largo pericolo" id="f-annulla">Annulla il focus (non salvare)</button>
    <button type="button" class="pulsante largo discreto" id="f-continua">Continua</button>`;
  azioni.querySelector("#f-salva").addEventListener("click", () => concludi(Date.now(), true));
  azioni.querySelector("#f-annulla").addEventListener("click", annulla);
  azioni.querySelector("#f-continua").addEventListener("click", () => {
    azioni.innerHTML = `<button type="button" class="pulsante largo" id="f-termina">Termina</button>`;
    azioni.querySelector("#f-termina").addEventListener("click", chiediComeTerminare);
  });
}

// Chiude il focus e registra lo studio effettivo.
// inAnticipo = true quando l'ho terminato io prima della fine: va spento Non disturbare.
function concludi(istante, inAnticipo) {
  const stato = app.stato();
  const focus = stato.focus;
  if (!focus) return;
  chiudiAssenzaAperta(Math.min(istante, Date.now()));
  const dati = riepilogo(focus, istante);
  const minutiStudio = Math.round(dati.studio / 60000);

  // Registro la sessione solo se c'è almeno un minuto di studio
  if (minutiStudio >= 1) {
    stato.sessioni.push({
      id: nuovoId(),
      data: inGiorno(new Date(focus.avvio)),
      bloccoId: focus.bloccoId,
      materiaId: focus.materiaId,
      inizio: focus.avvio,
      fine: Math.min(istante, focus.fine),
      studio: minutiStudio,                             // minuti di studio effettivo
      interruzioni: dati.interruzioni,
      fuori: Math.round(dati.fuori / 60000),            // minuti passati fuori dall'app
    });
    const blocco = stato.blocchi.find((b) => b.id === focus.bloccoId);
    if (blocco) blocco.stato = "fatto";
  }
  stato.focus = null;
  app.salva();
  fermaOrologio();

  const interruzioni = dati.interruzioni === 0 ? "Nessuna interruzione"
    : dati.interruzioni === 1 ? "1 interruzione" : `${dati.interruzioni} interruzioni`;
  schermo.innerHTML = `
    <div class="focus-alto">
      <span class="etichetta">Focus concluso</span>
      <h2 class="titolo">${pulisci(focus.titolo)}</h2>
    </div>
    <div class="focus-centro">
      <div class="titolo numeri focus-tempo">${minutiStudio >= 1 ? inDurata(minutiStudio) : "0 min"}</div>
      <p class="secondario">${minutiStudio >= 1 ? "di studio effettivo, registrati" : "Meno di un minuto: niente da registrare"}</p>
      <p class="secondario numeri">${interruzioni}${dati.fuori >= 60000 ? ` · ${inDurata(Math.round(dati.fuori / 60000))} fuori dall'app` : ""}</p>
    </div>
    <div class="focus-basso">
      <div class="focus-azioni">
        <button type="button" class="pulsante largo" id="f-chiudi">Chiudi</button>
      </div>
    </div>`;
  schermo.querySelector("#f-chiudi").addEventListener("click", chiudiSchermo);
  app.ridisegna();

  if (inAnticipo && nonDisturbareAttivo()) lanciaComando("off");
}

// Annulla: non registra nulla e spegne Non disturbare
function annulla() {
  app.stato().focus = null;
  app.salva();
  fermaOrologio();
  chiudiSchermo();
  app.ridisegna();
  if (nonDisturbareAttivo()) lanciaComando("off");
}

function fermaOrologio() {
  clearInterval(orologio);
  orologio = null;
  lasciaSpegnereSchermo();
}

function chiudiSchermo() {
  if (schermo) schermo.remove();
  schermo = null;
  document.body.style.overflow = "";
}
