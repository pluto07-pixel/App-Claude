// ============================================================
// OBIETTIVI — i fogli per gli obiettivi giornalieri:
//  - l'elenco e il modulo con i valori per ogni giorno della settimana;
//  - il foglio "obiettivo di oggi": aggiungere tempo a mano e cambiare
//    il valore per un solo giorno.
// I calcoli stanno in js/tempo.js.
// ============================================================

import { apriFoglio, chiudiFoglio, collegaScelta } from "./foglio.js";
import { pulisci } from "./giornata.js";
import { nuovoId } from "./modello.js";
import { GIORNI, inDurata, daDurata, descrivi, daGiorno } from "./date.js";
import { traguardo } from "./tempo.js";

const ORDINE_GIORNI = [1, 2, 3, 4, 5, 6, 0];   // lunedì per primo
const stile = (scelto) => (scelto ? ' class="scelto"' : "");
const mostra = (minuti) => (minuti > 0 ? inDurata(minuti) : "");

// ---------- Elenco degli obiettivi ----------

export function apriObiettivi(stato, azioni) {
  let elenco = "";
  for (const o of stato.obiettivi) {
    // Riassunto della settimana: "Lun 2h · Mar 4h · ..."
    const settimana = ORDINE_GIORNI
      .filter((g) => o.minuti[g] > 0)
      .map((g) => `${GIORNI[g].slice(0, 3)} ${inDurata(o.minuti[g])}`)
      .join(" · ") || "Nessun giorno impostato";
    elenco += `
      <button type="button" class="riga" data-obiettivo="${o.id}" style="--colore:var(--accento)">
        <span class="riga-testo">${pulisci(o.titolo)}<small>${settimana}</small></span>
      </button>`;
  }
  if (!elenco) {
    elenco = `<p class="nota">Nessun obiettivo. Un obiettivo è un tempo da raggiungere ogni giorno (studio, lettura, ...), con un valore diverso per ogni giorno della settimana.</p>`;
  }

  const foglio = apriFoglio(`
    <h2 class="titolo">Obiettivi giornalieri</h2>
    ${elenco}
    <div class="azioni">
      <button type="button" class="pulsante" id="nuovo">+ Obiettivo</button>
    </div>
    <div class="azioni">
      <button type="button" class="pulsante largo discreto" id="chiudi">Chiudi</button>
    </div>
  `);
  foglio.querySelector("#chiudi").addEventListener("click", () => chiudiFoglio());
  foglio.querySelector("#nuovo").addEventListener("click", () => apriModuloObiettivo(stato, {}, azioni));
  foglio.addEventListener("click", (evento) => {
    const riga = evento.target.closest(".riga");
    if (riga) apriModuloObiettivo(stato, stato.obiettivi.find((o) => o.id === riga.dataset.obiettivo), azioni);
  });
}

// ---------- Modulo: un obiettivo e i suoi valori settimanali ----------

function apriModuloObiettivo(stato, obiettivo, azioni) {
  const nuovo = !obiettivo.id;
  const tipo = obiettivo.tipo || (stato.obiettivi.some((o) => o.tipo === "studio") ? "altro" : "studio");
  const minuti = obiettivo.minuti || [0, 0, 0, 0, 0, 0, 0];

  const foglio = apriFoglio(`
    <h2 class="titolo">${nuovo ? "Nuovo obiettivo" : "Modifica obiettivo"}</h2>

    <div class="campo">
      <span class="etichetta">Cosa misura</span>
      <div class="segmenti" id="scelta-tipo">
        <button type="button" data-valore="studio"${stile(tipo === "studio")}>Studio</button>
        <button type="button" data-valore="altro"${stile(tipo === "altro")}>Altra attività</button>
      </div>
      <p class="nota" id="nota-tipo"></p>
    </div>

    <label class="campo">
      <span class="etichetta">Nome</span>
      <input type="text" id="campo-titolo" maxlength="40" autocomplete="off" placeholder="Lettura" value="${pulisci(obiettivo.titolo || "")}">
    </label>

    <label class="campo">
      <span class="etichetta">Uguale ogni giorno (facoltativo)</span>
      <input type="text" id="campo-tutti" autocomplete="off" placeholder="es. 30m: riempie tutti i giorni">
    </label>

    <span class="etichetta">Obiettivo per giorno della settimana</span>
    <p class="nota" style="margin:6px 0 12px">Scrivi una durata: 2h, 1h30, 45m. Lascia vuoto per nessun obiettivo quel giorno.</p>
    <div class="griglia-giorni">
      ${ORDINE_GIORNI.map((g) => `
        <label>
          <span>${GIORNI[g]}</span>
          <input type="text" data-giorno="${g}" autocomplete="off" value="${mostra(minuti[g])}">
        </label>`).join("")}
    </div>

    <p class="errore" id="errore" role="alert" style="margin-top:12px"></p>

    <div class="azioni">
      ${nuovo ? "" : `<button type="button" class="pulsante pericolo" id="elimina">Elimina</button>`}
      <button type="button" class="pulsante discreto" id="indietro">Indietro</button>
      <button type="button" class="pulsante principale" id="salva">${nuovo ? "Aggiungi" : "Salva"}</button>
    </div>
  `);

  const cerca = (selettore) => foglio.querySelector(selettore);
  const torna = () => apriObiettivi(stato, azioni);
  const campoTitolo = cerca("#campo-titolo");

  function mostraPerTipo(tipoScelto) {
    cerca("#nota-tipo").textContent = tipoScelto === "studio"
      ? "Conta da solo tutto lo studio a casa: blocchi di studio segnati fatti e tempo di focus. Le lezioni non contano."
      : "Conta i blocchi e le attività che hanno lo stesso nome dell'obiettivo, più il tempo che aggiungi a mano dalla schermata principale.";
    if (tipoScelto === "studio" && !campoTitolo.value.trim()) campoTitolo.value = "Studio";
  }
  const leggiTipo = collegaScelta(cerca("#scelta-tipo"), mostraPerTipo);
  mostraPerTipo(tipo);

  // "Uguale ogni giorno": copia il valore in tutti e sette i campi
  cerca("#campo-tutti").addEventListener("change", (evento) => {
    const valore = daDurata(evento.target.value);
    if (valore === null) return;
    for (const campo of foglio.querySelectorAll("[data-giorno]")) campo.value = mostra(valore);
  });

  // Quando esco da un campo riscrivo la durata in forma ordinata ("90" -> "1h30")
  foglio.addEventListener("change", (evento) => {
    if (!evento.target.matches("[data-giorno]")) return;
    const valore = daDurata(evento.target.value);
    if (valore !== null) evento.target.value = mostra(valore);
  });

  cerca("#indietro").addEventListener("click", torna);

  cerca("#salva").addEventListener("click", () => {
    const valori = [0, 0, 0, 0, 0, 0, 0];
    for (const campo of foglio.querySelectorAll("[data-giorno]")) {
      const valore = daDurata(campo.value);
      if (valore === null || valore > 1440) {
        cerca("#errore").textContent = `Durata non valida per ${GIORNI[campo.dataset.giorno].toLowerCase()}: scrivi ad esempio 2h, 1h30 o 45m.`;
        return;
      }
      valori[Number(campo.dataset.giorno)] = valore;
    }
    const titolo = campoTitolo.value.trim();
    if (!titolo) {
      cerca("#errore").textContent = "Scrivi il nome dell'obiettivo.";
      return;
    }
    const risultato = { id: obiettivo.id || nuovoId(), titolo, tipo: leggiTipo(), minuti: valori };
    if (nuovo) stato.obiettivi.push(risultato);
    else stato.obiettivi[stato.obiettivi.findIndex((o) => o.id === obiettivo.id)] = risultato;
    azioni.aggiorna();
    torna();
  });

  if (!nuovo) {
    const elimina = cerca("#elimina");
    elimina.addEventListener("click", () => {
      if (!elimina.classList.contains("conferma")) {
        elimina.classList.add("conferma");
        elimina.textContent = "Conferma";
        return;
      }
      // Tolgo l'obiettivo e i valori speciali dei singoli giorni.
      // Il tempo già aggiunto a mano resta nelle statistiche.
      stato.obiettivi = stato.obiettivi.filter((o) => o.id !== obiettivo.id);
      stato.obiettiviGiorno = stato.obiettiviGiorno.filter((o) => o.obiettivoId !== obiettivo.id);
      azioni.aggiorna();
      torna();
    });
  }
}

// ---------- Foglio: l'obiettivo in un giorno preciso ----------
// voce = { obiettivo, traguardo, fatto, modificato } come lo calcola obiettiviDelGiorno

export function apriObiettivoDelGiorno(stato, voce, giorno, azioni) {
  const { obiettivo } = voce;
  const d = descrivi(giorno);
  const aMano = stato.registrazioni
    .filter((r) => r.obiettivoId === obiettivo.id && r.data === giorno)
    .reduce((somma, r) => somma + r.minuti, 0);
  const normale = obiettivo.minuti[daGiorno(giorno).getDay()] || 0;   // il valore del giorno della settimana
  const mancano = Math.max(0, voce.traguardo - voce.fatto);

  const foglio = apriFoglio(`
    <h2 class="titolo">${pulisci(obiettivo.titolo)}</h2>
    <p class="nota" style="margin:-8px 0 18px">${d.nome} ${d.numero} ${d.mese}: ${voce.fatto > 0 ? inDurata(voce.fatto) : "0 min"} di ${voce.traguardo > 0 ? inDurata(voce.traguardo) : "nessun obiettivo"}.</p>

    <span class="etichetta">Aggiungi tempo fatto</span>
    <div class="azioni" style="margin-top:10px;flex-wrap:wrap">
      <button type="button" class="pulsante" data-aggiungi="15">+15 min</button>
      <button type="button" class="pulsante" data-aggiungi="30">+30 min</button>
      <button type="button" class="pulsante" data-aggiungi="60">+1h</button>
      ${mancano > 0 ? `<button type="button" class="pulsante accento" style="margin-bottom:0" data-aggiungi="${mancano}">Completa (+${inDurata(mancano)})</button>` : ""}
    </div>
    ${obiettivo.tipo === "studio" ? `<p class="nota">Lo studio dei blocchi fatti e del focus viene contato da solo: aggiungi qui solo quello fatto fuori dall'app.</p>` : ""}
    ${aMano > 0 ? `<div class="azioni" style="margin-top:12px"><button type="button" class="pulsante discreto" id="togli">Togli il tempo aggiunto a mano (${inDurata(aMano)})</button></div>` : ""}

    <div class="separatore"></div>

    <label class="campo">
      <span class="etichetta">Obiettivo solo per questo giorno</span>
      <input type="text" id="campo-giorno" autocomplete="off" placeholder="es. 3h" value="${mostra(voce.traguardo)}">
    </label>
    <p class="errore" id="errore" role="alert"></p>
    <div class="azioni" style="margin-top:0">
      <button type="button" class="pulsante" id="cambia">Cambia per oggi</button>
      ${voce.modificato ? `<button type="button" class="pulsante discreto" id="ripristina">Ripristina (${normale > 0 ? inDurata(normale) : "nessuno"})</button>` : ""}
    </div>

    <div class="azioni" style="flex-direction:column">
      <button type="button" class="pulsante largo discreto" id="modifica">Modifica i valori settimanali</button>
      <button type="button" class="pulsante largo discreto" id="chiudi">Chiudi</button>
    </div>
  `);

  const cerca = (selettore) => foglio.querySelector(selettore);
  const fine = () => { azioni.aggiorna(); chiudiFoglio(); };

  cerca("#chiudi").addEventListener("click", () => chiudiFoglio());
  cerca("#modifica").addEventListener("click", () => apriModuloObiettivo(stato, obiettivo, azioni));

  // Aggiunta a mano: salvo una "registrazione" per quel giorno
  foglio.addEventListener("click", (evento) => {
    const pulsante = evento.target.closest("[data-aggiungi]");
    if (!pulsante) return;
    stato.registrazioni.push({
      id: nuovoId(),
      data: giorno,
      obiettivoId: obiettivo.id,
      titolo: obiettivo.titolo,
      studio: obiettivo.tipo === "studio",
      minuti: Number(pulsante.dataset.aggiungi),
    });
    fine();
  });

  if (aMano > 0) {
    cerca("#togli").addEventListener("click", () => {
      stato.registrazioni = stato.registrazioni.filter((r) => !(r.obiettivoId === obiettivo.id && r.data === giorno));
      fine();
    });
  }

  // Valore diverso per un solo giorno: non tocca i valori settimanali
  const togliSpeciale = () => {
    stato.obiettiviGiorno = stato.obiettiviGiorno.filter((o) => !(o.obiettivoId === obiettivo.id && o.data === giorno));
  };
  cerca("#cambia").addEventListener("click", () => {
    const valore = daDurata(cerca("#campo-giorno").value);
    if (valore === null || valore > 1440) {
      cerca("#errore").textContent = "Durata non valida: scrivi ad esempio 2h, 1h30 o 45m.";
      return;
    }
    togliSpeciale();
    // Se riscrivo il valore normale non serve ricordarlo come eccezione
    if (valore !== traguardo(stato, obiettivo, giorno).minuti) {
      stato.obiettiviGiorno.push({ obiettivoId: obiettivo.id, data: giorno, minuti: valore });
    }
    fine();
  });
  if (voce.modificato) cerca("#ripristina").addEventListener("click", () => { togliSpeciale(); fine(); });
}
