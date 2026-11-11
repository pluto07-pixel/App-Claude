// ============================================================
// STATISTICHE — la schermata che mostra quanto tempo passo a fare cosa.
// I numeri li calcola riepilogoPeriodo in js/tempo.js; qui li disegno.
//
// I grafici sono semplici barre fatte con HTML e CSS, senza librerie.
// Ogni barra ha accanto il nome e il valore scritti: il colore non è
// mai l'unico modo per capire a cosa si riferisce.
// ============================================================

import { riepilogoPeriodo } from "./tempo.js";
import { pulisci } from "./giornata.js";
import { oggi, minutiAdesso, lunediDi, aggiungiGiorni, descrivi, daGiorno, inGiorno, inDurata } from "./date.js";

// Il periodo che sto guardando: settimana o mese, e una data al suo interno
let periodo = "settimana";
let riferimento = oggi();

// Primo e ultimo giorno del periodo scelto
function estremi() {
  if (periodo === "settimana") {
    const lunedi = lunediDi(riferimento);
    return { da: lunedi, a: aggiungiGiorni(lunedi, 6) };
  }
  const data = daGiorno(riferimento);
  const primo = new Date(data.getFullYear(), data.getMonth(), 1, 12);
  const ultimo = new Date(data.getFullYear(), data.getMonth() + 1, 0, 12);   // giorno 0 del mese dopo = ultimo di questo
  return { da: inGiorno(primo), a: inGiorno(ultimo) };
}

function titoloPeriodo(da, a) {
  const d1 = descrivi(da);
  const d2 = descrivi(a);
  if (periodo === "mese") return `${d1.mese} ${d1.anno}`;
  return d1.mese === d2.mese ? `${d1.numero} – ${d2.numero} ${d2.mese}` : `${d1.numero} ${d1.mese} – ${d2.numero} ${d2.mese}`;
}

const durata = (minuti) => (minuti > 0 ? inDurata(minuti) : "0 min");

// Un elenco di barre orizzontali: nome a sinistra, valore a destra, barra sotto.
// Le barre sono in proporzione alla più lunga dell'elenco.
function elencoBarre(righe) {
  const massimo = Math.max(...righe.map((r) => r.minuti), 1);
  return righe.map((r) => `
    <div class="barra-riga">
      <div class="barra-testi"><span>${pulisci(r.etichetta)}</span><span class="numeri">${durata(r.minuti)}</span></div>
      <div class="barra-pista"><i style="width:${(r.minuti / massimo) * 100}%;${r.colore ? `background:${r.colore}` : ""}"></i></div>
    </div>`).join("");
}

export function disegnaStatistiche(contenitore, stato) {
  const { da, a } = estremi();
  const adesso = { giorno: oggi(), minuti: minutiAdesso() };
  const dati = riepilogoPeriodo(stato, da, a, adesso);
  const scelto = (valore) => (periodo === valore ? ' class="scelto"' : "");

  let html = `
    <header class="testata">
      <div class="testata-riga">
        <div class="testata-data">
          <span class="etichetta">Statistiche</span>
          <h1 class="titolo">${titoloPeriodo(da, a)}</h1>
        </div>
        <div class="frecce">
          <button class="icona-pulsante" data-sposta="-1" aria-label="Periodo precedente"><svg viewBox="0 0 24 24"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg></button>
          <button class="icona-pulsante" data-sposta="1" aria-label="Periodo successivo"><svg viewBox="0 0 24 24"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg></button>
        </div>
      </div>
      <div class="segmenti" style="margin-top:12px">
        <button type="button" data-periodo="settimana"${scelto("settimana")}>Settimana</button>
        <button type="button" data-periodo="mese"${scelto("mese")}>Mese</button>
      </div>
    </header>
    <div class="statistiche-corpo">`;

  if (dati.totale === 0) {
    html += `<p class="nota">Nessun tempo registrato in questo periodo. Il tempo viene contato quando segni un blocco come fatto, usi il focus, aggiungi tempo a un obiettivo, o quando una lezione o un'attività fissa è passata.</p>`;
  } else {
    const studio = dati.categorie.find((c) => c.etichetta === "Studio a casa");
    html += `
      <section class="card">
        <span class="etichetta">Tempo registrato</span>
        <div class="obiettivo-valori">
          <span class="titolo numeri">${durata(dati.totale)}</span>
          <span class="secondario numeri">${studio ? `${durata(studio.minuti)} di studio a casa` : "nessuno studio a casa"}</span>
        </div>
      </section>

      <section>
        <span class="etichetta">Dove va il tempo</span>
        ${elencoBarre(dati.categorie)}
      </section>`;

    // Studio giorno per giorno: una colonna per giorno; toccandola leggo il valore
    const massimo = Math.max(...dati.perGiorno.map((g) => g.studio), 1);
    html += `
      <section>
        <span class="etichetta">Studio a casa, giorno per giorno</span>
        <div class="colonne ${dati.perGiorno.length > 7 ? "fitte" : ""}">
          <span class="colonne-massimo numeri">${durata(massimo)}</span>
          ${dati.perGiorno.map((g) => {
            const d = descrivi(g.giorno);
            const sigla = dati.perGiorno.length > 7 ? (d.numero % 5 === 0 || d.numero === 1 ? d.numero : "") : d.nome.slice(0, 1);
            return `
            <button type="button" class="colonna ${g.giorno === adesso.giorno ? "oggi" : ""}"
                    data-testo="${d.nome} ${d.numero} ${d.mese}: ${durata(g.studio)} di studio a casa, ${durata(g.totale)} in tutto"
                    aria-label="${d.nome} ${d.numero}: ${durata(g.studio)} di studio">
              <span class="colonna-area"><i style="height:${(g.studio / massimo) * 100}%"></i></span>
              <span class="colonna-sigla numeri">${sigla}</span>
            </button>`;
          }).join("")}
        </div>
        <p class="nota" id="dettaglio-giorno">Tocca una colonna per leggere il valore del giorno.</p>
      </section>`;

    if (dati.studioPerMateria.length > 0) {
      html += `<section><span class="etichetta">Studio a casa per materia</span>${elencoBarre(dati.studioPerMateria)}</section>`;
    }
    if (dati.lezioniPerMateria.length > 0) {
      html += `<section><span class="etichetta">Lezioni per materia</span>${elencoBarre(dati.lezioniPerMateria)}</section>`;
    }
  }

  if (dati.obiettivi.length > 0) {
    html += `
      <section>
        <span class="etichetta">Obiettivi</span>
        ${dati.obiettivi.map((o) => `
          <div class="barra-riga">
            <div class="barra-testi">
              <span>${pulisci(o.titolo)}</span>
              <span class="numeri">${o.raggiunti} su ${o.previsti} giorni · ${durata(o.fatto)} di ${durata(o.traguardo)}</span>
            </div>
            <div class="barra-pista"><i class="accento" style="width:${o.traguardo > 0 ? Math.min(100, (o.fatto / o.traguardo) * 100) : 0}%"></i></div>
          </div>`).join("")}
      </section>`;
  }

  if (dati.focus.sessioni > 0) {
    html += `
      <section>
        <span class="etichetta">Focus</span>
        <p class="numeri" style="margin-top:10px">${dati.focus.sessioni} ${dati.focus.sessioni === 1 ? "sessione" : "sessioni"} · ${durata(dati.focus.minuti)} · ${dati.focus.interruzioni} ${dati.focus.interruzioni === 1 ? "interruzione" : "interruzioni"}</p>
      </section>`;
  }

  html += `</div>`;
  contenitore.innerHTML = html;
}

// Collega i tocchi della schermata (una volta sola, all'avvio).
// ridisegna: funzione da chiamare quando cambia il periodo.
export function preparaStatistiche(contenitore, ridisegna) {
  contenitore.addEventListener("click", (evento) => {
    const cambio = evento.target.closest("[data-periodo]");
    if (cambio) {
      periodo = cambio.dataset.periodo;
      ridisegna();
      return;
    }
    const freccia = evento.target.closest("[data-sposta]");
    if (freccia) {
      const verso = Number(freccia.dataset.sposta);
      if (periodo === "settimana") {
        riferimento = aggiungiGiorni(riferimento, 7 * verso);
      } else {
        const data = daGiorno(riferimento);
        riferimento = inGiorno(new Date(data.getFullYear(), data.getMonth() + verso, 1, 12));
      }
      ridisegna();
      return;
    }
    const colonna = evento.target.closest(".colonna");
    if (colonna) {
      for (const altra of contenitore.querySelectorAll(".colonna")) altra.classList.toggle("scelta", altra === colonna);
      contenitore.querySelector("#dettaglio-giorno").textContent = colonna.dataset.testo;
    }
  });
}

// Riporta la schermata al periodo corrente (quando la apro dalla barra in basso)
export function statisticheAOggi() {
  riferimento = oggi();
}
