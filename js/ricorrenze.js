// ============================================================
// RICORRENZE (logica) — lezioni e attività che si ripetono.
// Funzioni pure, provate in test/ricorrenze.test.mjs.
//
// L'idea chiave: una lezione NON viene copiata in ogni giorno.
// Salvo una sola "ricorrenza" (la regola: ogni lunedì 8:30–10:30,
// dal ... al ...) e le singole occorrenze le calcolo quando disegno
// un giorno. Così modificare la regola aggiorna tutto il semestre.
//
//   ricorrenza = { id, tipo: "lezione" | "attivita", titolo, materiaId, aula,
//                  giorno (0 = domenica ... 6 = sabato), inizio, fine, dal, al }
//
// Per cambiare UNA sola occorrenza senza toccare la regola salvo
// un'"eccezione", legata alla ricorrenza e alla data originale:
//
//   eccezione  = { ricorrenzaId, data, annullata: true }
//             oppure { ricorrenzaId, data, nuovaData, inizio, fine }   (spostata)
//
// Attività flessibili (es. palestra 3 volte a settimana): salvo solo
// la frequenza; ogni volta che ne piazzo una diventa un normale blocco
// con il campo flessibileId, e conto quelli della settimana.
//
//   flessibile = { id, titolo, volte, durata }
// ============================================================

import { daGiorno, lunediDi, aggiungiGiorni } from "./date.js";

// La ricorrenza cade in questo giorno? (giorno della settimana giusto e dentro il periodo)
export function valeNelGiorno(ricorrenza, giorno) {
  return daGiorno(giorno).getDay() === ricorrenza.giorno
    && giorno >= ricorrenza.dal
    && (!ricorrenza.al || giorno <= ricorrenza.al);
}

export function trovaEccezione(stato, ricorrenzaId, data) {
  return stato.eccezioni.find((e) => e.ricorrenzaId === ricorrenzaId && e.data === data) || null;
}

// Ogni occorrenza ha un identificatore costruito da ricorrenza e data originale: "r:<id>:<data>"
export function idOccorrenza(ricorrenzaId, data) {
  return `r:${ricorrenzaId}:${data}`;
}

// Costruisce la "voce" da mostrare sulla timeline: ha la stessa forma di un blocco
function creaVoce(ricorrenza, dataOriginale, giorno, inizio, fine, eccezione) {
  return {
    id: idOccorrenza(ricorrenza.id, dataOriginale),
    data: giorno,
    inizio,
    fine,
    tipo: ricorrenza.tipo,
    titolo: ricorrenza.titolo,
    materiaId: ricorrenza.materiaId,
    aula: ricorrenza.aula,
    ricorrenzaId: ricorrenza.id,
    dataOriginale,
    annullata: Boolean(eccezione && eccezione.annullata),
    spostata: Boolean(eccezione && !eccezione.annullata),
    stato: "pianificato",
  };
}

// Tutte le occorrenze di lezioni e attività fisse che cadono in un giorno
export function occorrenzeDelGiorno(stato, giorno) {
  const voci = [];

  // 1. Le ricorrenze che cadono oggi per regola
  for (const ricorrenza of stato.ricorrenze) {
    if (!valeNelGiorno(ricorrenza, giorno)) continue;
    const eccezione = trovaEccezione(stato, ricorrenza.id, giorno);
    if (!eccezione) {
      voci.push(creaVoce(ricorrenza, giorno, giorno, ricorrenza.inizio, ricorrenza.fine, null));
    } else if (eccezione.annullata) {
      voci.push(creaVoce(ricorrenza, giorno, giorno, ricorrenza.inizio, ricorrenza.fine, eccezione));
    } else if (eccezione.nuovaData === giorno) {
      // spostata di orario ma rimasta nello stesso giorno
      voci.push(creaVoce(ricorrenza, giorno, giorno, eccezione.inizio, eccezione.fine, eccezione));
    }
    // altrimenti è stata spostata in un altro giorno: qui non compare
  }

  // 2. Le occorrenze di altri giorni spostate a oggi
  for (const eccezione of stato.eccezioni) {
    if (eccezione.annullata || eccezione.nuovaData !== giorno || eccezione.data === giorno) continue;
    const ricorrenza = stato.ricorrenze.find((r) => r.id === eccezione.ricorrenzaId);
    if (ricorrenza) {
      voci.push(creaVoce(ricorrenza, eccezione.data, giorno, eccezione.inizio, eccezione.fine, eccezione));
    }
  }
  return voci;
}

// Tutto ciò che va sulla timeline di un giorno: blocchi + occorrenze, in ordine di orario
export function vociDelGiorno(stato, giorno) {
  return [
    ...stato.blocchi.filter((b) => b.data === giorno),
    ...occorrenzeDelGiorno(stato, giorno),
  ].sort((a, b) => a.inizio - b.inizio || a.fine - b.fine);
}

// Imposta (o toglie, con campi = null) l'eccezione di una singola occorrenza
export function impostaEccezione(stato, ricorrenzaId, data, campi) {
  stato.eccezioni = stato.eccezioni.filter((e) => !(e.ricorrenzaId === ricorrenzaId && e.data === data));
  if (campi) stato.eccezioni.push({ ricorrenzaId, data, ...campi });
}

// Per ogni attività flessibile: quante ne ho piazzate nella settimana del giorno dato
// e quante ne mancano. I blocchi segnati "saltato" non contano.
export function statoFlessibili(stato, giorno) {
  const lunedi = lunediDi(giorno);
  const domenica = aggiungiGiorni(lunedi, 6);
  return stato.flessibili.map((flessibile) => {
    const piazzate = stato.blocchi.filter((b) =>
      b.flessibileId === flessibile.id && b.data >= lunedi && b.data <= domenica && b.stato !== "saltato"
    ).length;
    return { flessibile, piazzate, mancanti: Math.max(0, flessibile.volte - piazzate) };
  });
}

// Controlli. Restituiscono un messaggio d'errore oppure null.
export function controllaRicorrenza(r) {
  if (r.tipo === "lezione" && !r.materiaId) return "Scegli una materia.";
  if (r.tipo === "attivita" && !r.titolo) return "Scrivi il nome dell'attività.";
  if (!Number.isInteger(r.giorno) || r.giorno < 0 || r.giorno > 6) return "Scegli il giorno della settimana.";
  if (!Number.isInteger(r.inizio) || !Number.isInteger(r.fine)) return "Orario non valido.";
  if (r.fine <= r.inizio) return "La fine deve venire dopo l'inizio.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.dal || "")) return "Indica da quando vale.";
  if (r.al && r.al < r.dal) return "La data di fine viene prima di quella di inizio.";
  return null;
}

export function controllaFlessibile(f) {
  if (!f.titolo) return "Scrivi il nome dell'attività.";
  if (!Number.isInteger(f.volte) || f.volte < 1 || f.volte > 7) return "Le volte a settimana vanno da 1 a 7.";
  if (!Number.isInteger(f.durata) || f.durata < 15 || f.durata > 600) return "La durata va da 15 a 600 minuti.";
  return null;
}
