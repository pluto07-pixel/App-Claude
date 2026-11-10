// ============================================================
// SETTIMANA TIPO — i fogli per gestire lezioni, attività fisse e
// attività flessibili, e quello per cambiare una singola occorrenza.
//
// Questi fogli modificano direttamente lo stato e poi chiamano
// azioni.aggiorna(), che salva e ridisegna la giornata.
// ============================================================

import { apriFoglio, chiudiFoglio, collegaScelta } from "./foglio.js";
import { pulisci } from "./giornata.js";
import { nuovoId, trovaMateria } from "./modello.js";
import { GIORNI, inOrario, daOrario, inDurata, oggi, descrivi } from "./date.js";
import { controllaRicorrenza, controllaFlessibile, impostaEccezione, trovaEccezione } from "./ricorrenze.js";

// Ordine dei giorni da mostrare: lunedì per primo (nei dati 0 è domenica)
const ORDINE_GIORNI = [1, 2, 3, 4, 5, 6, 0];
const stile = (scelto) => (scelto ? ' class="scelto"' : "");

function nomeRicorrenza(stato, ricorrenza) {
  const materia = trovaMateria(stato, ricorrenza.materiaId);
  return ricorrenza.tipo === "lezione" && materia ? materia.sigla : ricorrenza.titolo;
}

// ---------- Elenco: tutta la settimana tipo ----------

export function apriSettimanaTipo(stato, azioni) {
  let elenco = "";
  for (const giorno of ORDINE_GIORNI) {
    const delGiorno = stato.ricorrenze
      .filter((r) => r.giorno === giorno)
      .sort((a, b) => a.inizio - b.inizio);
    if (delGiorno.length === 0) continue;
    elenco += `<p class="etichetta gruppo">${GIORNI[giorno]}</p>`;
    for (const r of delGiorno) {
      const materia = trovaMateria(stato, r.materiaId);
      const dettagli = [r.tipo === "lezione" ? "Lezione" : "Attività", r.aula].filter(Boolean).join(" · ");
      elenco += `
        <button type="button" class="riga" data-ricorrenza="${r.id}" style="--colore:${materia ? materia.colore : "#6f7480"}">
          <span class="riga-orario numeri">${inOrario(r.inizio)} – ${inOrario(r.fine)}</span>
          <span class="riga-testo">${pulisci(nomeRicorrenza(stato, r))}<small>${pulisci(dettagli)}</small></span>
        </button>`;
    }
  }
  if (!elenco) elenco = `<p class="nota">Nessuna lezione o attività fissa. Aggiungile qui sotto: compariranno da sole in ogni giorno corrispondente.</p>`;

  let flessibili = "";
  for (const f of stato.flessibili) {
    flessibili += `
      <button type="button" class="riga" data-flessibile="${f.id}" style="--colore:#6f7480">
        <span class="riga-orario numeri">${f.volte}× sett.</span>
        <span class="riga-testo">${pulisci(f.titolo)}<small>${inDurata(f.durata)} ogni volta</small></span>
      </button>`;
  }

  const foglio = apriFoglio(`
    <h2 class="titolo">Settimana tipo</h2>
    ${elenco}
    <div class="azioni">
      <button type="button" class="pulsante" id="nuova-lezione">+ Lezione</button>
      <button type="button" class="pulsante" id="nuova-attivita">+ Attività fissa</button>
    </div>

    <div class="separatore"></div>
    <span class="etichetta">Attività flessibili</span>
    <p class="nota" style="margin-bottom:12px">Hanno una frequenza settimanale ma non un giorno fisso (es. palestra 3 volte). Le piazzi tu, giorno per giorno, dalla schermata principale.</p>
    ${flessibili}
    <div class="azioni">
      <button type="button" class="pulsante" id="nuova-flessibile">+ Attività flessibile</button>
    </div>

    <div class="azioni">
      <button type="button" class="pulsante largo discreto" id="chiudi">Chiudi</button>
    </div>
  `);

  const cerca = (selettore) => foglio.querySelector(selettore);
  cerca("#chiudi").addEventListener("click", () => chiudiFoglio());
  cerca("#nuova-lezione").addEventListener("click", () => apriModuloRicorrenza(stato, { tipo: "lezione" }, azioni));
  cerca("#nuova-attivita").addEventListener("click", () => apriModuloRicorrenza(stato, { tipo: "attivita" }, azioni));
  cerca("#nuova-flessibile").addEventListener("click", () => apriModuloFlessibile(stato, {}, azioni));
  foglio.addEventListener("click", (evento) => {
    const riga = evento.target.closest(".riga");
    if (!riga) return;
    if (riga.dataset.ricorrenza) {
      apriModuloRicorrenza(stato, stato.ricorrenze.find((r) => r.id === riga.dataset.ricorrenza), azioni);
    } else {
      apriModuloFlessibile(stato, stato.flessibili.find((f) => f.id === riga.dataset.flessibile), azioni);
    }
  });
}

// ---------- Modulo: lezione o attività fissa ----------

function apriModuloRicorrenza(stato, ricorrenza, azioni) {
  const nuova = !ricorrenza.id;
  const lezione = ricorrenza.tipo === "lezione";
  // Per una lezione nuova ripropongo il periodo usato l'ultima volta: di solito è lo stesso semestre
  const periodo = stato.impostazioni.periodoLezioni || {};
  const dal = ricorrenza.dal || (lezione && periodo.dal) || oggi();
  const al = nuova ? (lezione && periodo.al) || "" : ricorrenza.al || "";
  const giornoScelto = nuova ? null : ricorrenza.giorno;

  const foglio = apriFoglio(`
    <h2 class="titolo">${nuova ? "Nuova" : "Modifica"} ${lezione ? "lezione" : "attività fissa"}</h2>

    ${lezione ? `
    <div class="campo">
      <span class="etichetta">Materia</span>
      <div class="materie" id="scelta-materia">
        ${stato.materie.map((m) => `
          <button type="button" data-valore="${m.id}" style="--colore:${m.colore}"${stile(m.id === ricorrenza.materiaId)}>${pulisci(m.sigla)}</button>`).join("")}
      </div>
    </div>
    <label class="campo">
      <span class="etichetta">Aula</span>
      <input type="text" id="campo-aula" maxlength="40" autocomplete="off" value="${pulisci(ricorrenza.aula || "")}">
    </label>` : `
    <label class="campo">
      <span class="etichetta">Nome</span>
      <input type="text" id="campo-titolo" maxlength="60" autocomplete="off" placeholder="Padel" value="${pulisci(ricorrenza.titolo || "")}">
    </label>`}

    <div class="campo">
      <span class="etichetta">Giorno della settimana</span>
      <div class="segmenti" id="scelta-giorno">
        ${ORDINE_GIORNI.map((g) => `<button type="button" data-valore="${g}"${stile(g === giornoScelto)}>${GIORNI[g].slice(0, 3)}</button>`).join("")}
      </div>
    </div>

    <div class="due-colonne">
      <label class="campo">
        <span class="etichetta">Inizio</span>
        <input type="time" id="campo-inizio" step="300" value="${inOrario(ricorrenza.inizio ?? 510)}">
      </label>
      <label class="campo">
        <span class="etichetta">Fine</span>
        <input type="time" id="campo-fine" step="300" value="${inOrario(ricorrenza.fine ?? 630)}">
      </label>
    </div>

    <div class="due-colonne">
      <label class="campo">
        <span class="etichetta">Vale dal</span>
        <input type="date" id="campo-dal" value="${dal}">
      </label>
      <label class="campo">
        <span class="etichetta">Fino al${lezione ? "" : " (facoltativo)"}</span>
        <input type="date" id="campo-al" value="${al}">
      </label>
    </div>

    <p class="errore" id="errore" role="alert"></p>

    <div class="azioni">
      ${nuova ? "" : `<button type="button" class="pulsante pericolo" id="elimina">Elimina</button>`}
      <button type="button" class="pulsante discreto" id="indietro">Indietro</button>
      <button type="button" class="pulsante principale" id="salva">${nuova ? "Aggiungi" : "Salva"}</button>
    </div>
  `);

  const cerca = (selettore) => foglio.querySelector(selettore);
  const leggiMateria = lezione ? collegaScelta(cerca("#scelta-materia")) : () => null;
  const leggiGiorno = collegaScelta(cerca("#scelta-giorno"));
  const torna = () => apriSettimanaTipo(stato, azioni);

  cerca("#indietro").addEventListener("click", torna);

  cerca("#salva").addEventListener("click", () => {
    const giorno = leggiGiorno();
    const risultato = {
      id: ricorrenza.id || nuovoId(),
      tipo: ricorrenza.tipo,
      titolo: lezione ? "" : cerca("#campo-titolo").value.trim(),
      materiaId: leggiMateria(),
      aula: lezione ? cerca("#campo-aula").value.trim() : "",
      giorno: giorno === null ? null : Number(giorno),
      inizio: daOrario(cerca("#campo-inizio").value),
      fine: daOrario(cerca("#campo-fine").value),
      dal: cerca("#campo-dal").value,
      al: cerca("#campo-al").value || null,
    };
    const errore = controllaRicorrenza(risultato);
    if (errore) {
      cerca("#errore").textContent = errore;
      return;
    }
    if (nuova) {
      stato.ricorrenze.push(risultato);
    } else {
      // Se cambio giorno della settimana, le eccezioni salvate non hanno più senso: le tolgo
      if (risultato.giorno !== ricorrenza.giorno) {
        stato.eccezioni = stato.eccezioni.filter((e) => e.ricorrenzaId !== ricorrenza.id);
      }
      stato.ricorrenze[stato.ricorrenze.findIndex((r) => r.id === ricorrenza.id)] = risultato;
    }
    if (lezione) stato.impostazioni.periodoLezioni = { dal: risultato.dal, al: risultato.al };
    azioni.aggiorna();
    torna();
  });

  if (!nuova) {
    const elimina = cerca("#elimina");
    elimina.addEventListener("click", () => {
      if (!elimina.classList.contains("conferma")) {
        elimina.classList.add("conferma");
        elimina.textContent = "Elimina tutta la serie";
        return;
      }
      stato.ricorrenze = stato.ricorrenze.filter((r) => r.id !== ricorrenza.id);
      stato.eccezioni = stato.eccezioni.filter((e) => e.ricorrenzaId !== ricorrenza.id);
      azioni.aggiorna();
      torna();
    });
  }
}

// ---------- Modulo: attività flessibile ----------

function apriModuloFlessibile(stato, flessibile, azioni) {
  const nuova = !flessibile.id;
  const foglio = apriFoglio(`
    <h2 class="titolo">${nuova ? "Nuova" : "Modifica"} attività flessibile</h2>
    <label class="campo">
      <span class="etichetta">Nome</span>
      <input type="text" id="campo-titolo" maxlength="60" autocomplete="off" placeholder="Palestra" value="${pulisci(flessibile.titolo || "")}">
    </label>
    <div class="due-colonne">
      <label class="campo">
        <span class="etichetta">Volte a settimana</span>
        <input type="number" id="campo-volte" inputmode="numeric" min="1" max="7" value="${flessibile.volte ?? 3}">
      </label>
      <label class="campo">
        <span class="etichetta">Durata (min)</span>
        <input type="number" id="campo-durata" inputmode="numeric" min="15" max="600" step="5" value="${flessibile.durata ?? 90}">
      </label>
    </div>
    <p class="errore" id="errore" role="alert"></p>
    <div class="azioni">
      ${nuova ? "" : `<button type="button" class="pulsante pericolo" id="elimina">Elimina</button>`}
      <button type="button" class="pulsante discreto" id="indietro">Indietro</button>
      <button type="button" class="pulsante principale" id="salva">${nuova ? "Aggiungi" : "Salva"}</button>
    </div>
  `);

  const cerca = (selettore) => foglio.querySelector(selettore);
  const torna = () => apriSettimanaTipo(stato, azioni);
  cerca("#indietro").addEventListener("click", torna);

  cerca("#salva").addEventListener("click", () => {
    const risultato = {
      id: flessibile.id || nuovoId(),
      titolo: cerca("#campo-titolo").value.trim(),
      volte: Math.round(Number(cerca("#campo-volte").value)),
      durata: Math.round(Number(cerca("#campo-durata").value)),
    };
    const errore = controllaFlessibile(risultato);
    if (errore) {
      cerca("#errore").textContent = errore;
      return;
    }
    if (nuova) stato.flessibili.push(risultato);
    else stato.flessibili[stato.flessibili.findIndex((f) => f.id === flessibile.id)] = risultato;
    azioni.aggiorna();
    torna();
  });

  if (!nuova) {
    const elimina = cerca("#elimina");
    elimina.addEventListener("click", () => {
      if (!elimina.classList.contains("conferma")) {
        elimina.classList.add("conferma");
        elimina.textContent = "Conferma";
        return;
      }
      // I blocchi già piazzati restano sulla timeline come blocchi normali
      stato.flessibili = stato.flessibili.filter((f) => f.id !== flessibile.id);
      azioni.aggiorna();
      torna();
    });
  }
}

// ---------- Foglio: una singola occorrenza toccata sulla timeline ----------
// Da qui si annulla o si sposta SOLO quella volta, senza toccare la serie.

export function apriOccorrenza(stato, voce, azioni) {
  const ricorrenza = stato.ricorrenze.find((r) => r.id === voce.ricorrenzaId);
  if (!ricorrenza) return;
  const eccezione = trovaEccezione(stato, voce.ricorrenzaId, voce.dataOriginale);
  const d = descrivi(voce.dataOriginale);
  const tipo = ricorrenza.tipo === "lezione" ? "Lezione" : "Attività";

  let nota = `${tipo} di ${d.nome.toLowerCase()} ${d.numero} ${d.mese}${ricorrenza.aula ? ` · ${pulisci(ricorrenza.aula)}` : ""}.`;
  if (voce.annullata) nota += " Annullata.";
  else if (voce.spostata) nota += ` Spostata rispetto all'orario normale (${inOrario(ricorrenza.inizio)} – ${inOrario(ricorrenza.fine)}).`;

  const foglio = apriFoglio(`
    <h2 class="titolo">${pulisci(nomeRicorrenza(stato, ricorrenza))}</h2>
    <p class="nota" style="margin:-8px 0 18px">${nota}</p>

    ${voce.annullata ? "" : `
    <span class="etichetta">Sposta solo questa volta</span>
    <label class="campo" style="margin-top:8px">
      <input type="date" id="campo-giorno" value="${voce.data}" aria-label="Giorno">
    </label>
    <div class="due-colonne">
      <label class="campo">
        <span class="etichetta">Inizio</span>
        <input type="time" id="campo-inizio" step="300" value="${inOrario(voce.inizio)}">
      </label>
      <label class="campo">
        <span class="etichetta">Fine</span>
        <input type="time" id="campo-fine" step="300" value="${inOrario(voce.fine)}">
      </label>
    </div>
    <p class="errore" id="errore" role="alert"></p>
    <div class="azioni" style="margin-top:0">
      <button type="button" class="pulsante principale" id="sposta">Sposta</button>
    </div>`}

    <div class="azioni" style="flex-direction:column">
      ${voce.annullata ? "" : `<button type="button" class="pulsante largo" id="annulla-volta">Annulla solo questa volta</button>`}
      ${eccezione ? `<button type="button" class="pulsante largo" id="ripristina">Ripristina l'orario normale</button>` : ""}
      <button type="button" class="pulsante largo discreto" id="serie">Modifica tutta la serie</button>
      <button type="button" class="pulsante largo discreto" id="chiudi">Chiudi</button>
    </div>
  `);

  const cerca = (selettore) => foglio.querySelector(selettore);
  const applica = (campi, nuovoGiorno) => {
    impostaEccezione(stato, voce.ricorrenzaId, voce.dataOriginale, campi);
    azioni.aggiorna(nuovoGiorno);
    chiudiFoglio();
  };

  cerca("#chiudi").addEventListener("click", () => chiudiFoglio());
  cerca("#serie").addEventListener("click", () => apriModuloRicorrenza(stato, ricorrenza, azioni));
  if (eccezione) cerca("#ripristina").addEventListener("click", () => applica(null, voce.dataOriginale));

  if (!voce.annullata) {
    cerca("#annulla-volta").addEventListener("click", () => applica({ annullata: true }));
    cerca("#sposta").addEventListener("click", () => {
      const nuovaData = cerca("#campo-giorno").value;
      const inizio = daOrario(cerca("#campo-inizio").value);
      const fine = daOrario(cerca("#campo-fine").value);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nuovaData)) { cerca("#errore").textContent = "Giorno non valido."; return; }
      if (inizio === null || fine === null || fine <= inizio) { cerca("#errore").textContent = "La fine deve venire dopo l'inizio."; return; }
      // Se rimetto giorno e orario della regola, l'eccezione non serve più
      const comeLaRegola = nuovaData === voce.dataOriginale && inizio === ricorrenza.inizio && fine === ricorrenza.fine;
      applica(comeLaRegola ? null : { nuovaData, inizio, fine }, nuovaData);
    });
  }
}
