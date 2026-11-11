// ============================================================
// TEMPO (logica) — quanto tempo ho passato a fare cosa.
// È la base sia degli obiettivi giornalieri sia delle statistiche.
// Funzioni pure, provate in test/tempo.test.mjs.
//
// COSA VIENE CONTATO come tempo fatto:
//  - studio: le sessioni di focus (studio effettivo) e i blocchi di
//    studio segnati "fatto" (per l'intera durata, se non hanno un focus);
//  - altri blocchi (attività, commissioni, tempo libero): solo se "fatto";
//  - lezioni e attività fisse: da sole, quando sono passate e non annullate
//    (si presume che ci sia andato; se no, la annullo per quel giorno);
//  - tempo aggiunto a mano su un obiettivo (es. "Lettura +30 min").
//
// Ogni pezzo di tempo è una "voce":
//   { gruppo, etichetta, titolo, materiaId, minuti }
//   gruppo: "studio" | "lezione" | "attivita" | "commissione" | "libero"
//
// OBIETTIVI
//   obiettivo       = { id, titolo, tipo: "studio" | "altro", minuti: [7 numeri] }
//                     minuti[0] è la domenica, minuti[1] il lunedì, ... (0 = nessun obiettivo)
//   obiettivoGiorno = { obiettivoId, data, minuti }      valore diverso per un solo giorno
//   registrazione   = { id, data, obiettivoId, titolo, studio, minuti }   tempo aggiunto a mano
// ============================================================

import { daGiorno, aggiungiGiorni } from "./date.js";
import { occorrenzeDelGiorno } from "./ricorrenze.js";

const durata = (voce) => voce.fine - voce.inizio;

// Tutte le voci di tempo fatto in un giorno.
// adesso = { giorno, minuti }: serve per sapere quali lezioni sono già passate.
export function tempoDelGiorno(stato, giorno, adesso) {
  const voci = [];
  const materia = (id) => stato.materie.find((m) => m.id === id);
  const sigla = (id) => (materia(id) ? materia(id).sigla : "Studio");

  // 1. Sessioni di focus
  for (const sessione of stato.sessioni) {
    if (sessione.data !== giorno) continue;
    voci.push({ gruppo: "studio", etichetta: sigla(sessione.materiaId), titolo: "", materiaId: sessione.materiaId, minuti: sessione.studio });
  }

  // 2. Blocchi segnati "fatto"
  for (const blocco of stato.blocchi) {
    if (blocco.data !== giorno || blocco.stato !== "fatto") continue;
    if (blocco.tipo === "studio") {
      // Se il blocco ha già delle sessioni di focus, il suo tempo è quello: non lo conto due volte
      if (stato.sessioni.some((s) => s.bloccoId === blocco.id)) continue;
      voci.push({ gruppo: "studio", etichetta: sigla(blocco.materiaId), titolo: blocco.titolo, materiaId: blocco.materiaId, minuti: durata(blocco) });
    } else if (blocco.tipo === "commissione") {
      voci.push({ gruppo: "commissione", etichetta: "Commissioni", titolo: blocco.titolo, materiaId: null, minuti: durata(blocco) });
    } else if (blocco.tipo === "libero") {
      // Un blocco libero con un titolo (es. "Lettura") fa categoria a sé nelle statistiche
      voci.push({ gruppo: "libero", etichetta: blocco.titolo || "Tempo libero", titolo: blocco.titolo, materiaId: null, minuti: durata(blocco) });
    } else {
      const flessibile = stato.flessibili.find((f) => f.id === blocco.flessibileId);
      const nome = (flessibile && flessibile.titolo) || blocco.titolo || "Altro";
      voci.push({ gruppo: "attivita", etichetta: nome, titolo: blocco.titolo, materiaId: null, minuti: durata(blocco) });
    }
  }

  // 3. Lezioni e attività fisse già passate
  for (const voce of occorrenzeDelGiorno(stato, giorno)) {
    if (voce.annullata) continue;
    const passata = giorno < adesso.giorno || (giorno === adesso.giorno && voce.fine <= adesso.minuti);
    if (!passata) continue;
    if (voce.tipo === "lezione") {
      voci.push({ gruppo: "lezione", etichetta: sigla(voce.materiaId), titolo: "", materiaId: voce.materiaId, minuti: durata(voce) });
    } else {
      voci.push({ gruppo: "attivita", etichetta: voce.titolo, titolo: voce.titolo, materiaId: null, minuti: durata(voce) });
    }
  }

  // 4. Tempo aggiunto a mano su un obiettivo
  for (const r of stato.registrazioni) {
    if (r.data !== giorno) continue;
    voci.push(r.studio
      ? { gruppo: "studio", etichetta: "Studio", titolo: "", materiaId: null, minuti: r.minuti }
      : { gruppo: "attivita", etichetta: r.titolo, titolo: r.titolo, materiaId: null, minuti: r.minuti });
  }
  return voci;
}

const uguali = (a, b) => (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

// Una voce conta per un obiettivo?
//  - obiettivo di tipo "studio": conta tutto lo studio a casa (non le lezioni);
//  - altri obiettivi: contano i blocchi e le attività che si chiamano come l'obiettivo
//    (es. obiettivo "Lettura" <- blocco intitolato "Lettura", o tempo aggiunto a mano).
function contaPer(obiettivo, voce) {
  if (obiettivo.tipo === "studio") return voce.gruppo === "studio";
  if (voce.gruppo === "studio" || voce.gruppo === "lezione") return false;
  return uguali(voce.etichetta, obiettivo.titolo) || uguali(voce.titolo, obiettivo.titolo);
}

// L'obiettivo in minuti per quel giorno: il valore del giorno della settimana,
// a meno che per quel giorno preciso ne abbia impostato uno diverso.
export function traguardo(stato, obiettivo, giorno) {
  const speciale = stato.obiettiviGiorno.find((o) => o.obiettivoId === obiettivo.id && o.data === giorno);
  if (speciale) return { minuti: speciale.minuti, modificato: true };
  return { minuti: obiettivo.minuti[daGiorno(giorno).getDay()] || 0, modificato: false };
}

// Gli obiettivi di un giorno con il loro avanzamento
export function obiettiviDelGiorno(stato, giorno, adesso) {
  const voci = tempoDelGiorno(stato, giorno, adesso);
  return stato.obiettivi.map((obiettivo) => {
    const { minuti, modificato } = traguardo(stato, obiettivo, giorno);
    const fatto = voci.filter((v) => contaPer(obiettivo, v)).reduce((somma, v) => somma + v.minuti, 0);
    return { obiettivo, traguardo: minuti, fatto, modificato };
  }).filter((o) => o.traguardo > 0 || o.fatto > 0 || o.modificato);
}

// Somma i minuti in una mappa chiave -> { etichetta, minuti, ... }
function aggiungi(mappa, chiave, etichetta, minuti, extra = {}) {
  if (!mappa.has(chiave)) mappa.set(chiave, { etichetta, minuti: 0, ...extra });
  mappa.get(chiave).minuti += minuti;
}
const ordinati = (mappa) => [...mappa.values()].sort((a, b) => b.minuti - a.minuti);

// Il resoconto di un periodo (da "da" ad "a" compresi).
export function riepilogoPeriodo(stato, da, a, adesso) {
  const categorie = new Map();
  const studioPerMateria = new Map();
  const lezioniPerMateria = new Map();
  const perGiorno = [];
  const obiettivi = new Map();
  let totale = 0;

  for (let giorno = da; giorno <= a; giorno = aggiungiGiorni(giorno, 1)) {
    const voci = tempoDelGiorno(stato, giorno, adesso);
    let studioGiorno = 0;
    let totaleGiorno = 0;
    for (const voce of voci) {
      totaleGiorno += voce.minuti;
      const materia = stato.materie.find((m) => m.id === voce.materiaId);
      const colore = materia ? materia.colore : null;
      if (voce.gruppo === "studio") {
        studioGiorno += voce.minuti;
        aggiungi(categorie, "studio", "Studio a casa", voce.minuti);
        aggiungi(studioPerMateria, voce.materiaId || "_", voce.etichetta, voce.minuti, { colore });
      } else if (voce.gruppo === "lezione") {
        aggiungi(categorie, "lezione", "Lezioni", voce.minuti);
        aggiungi(lezioniPerMateria, voce.materiaId || "_", voce.etichetta, voce.minuti, { colore });
      } else {
        // Stesso nome = stessa categoria, anche se una volta era un blocco e un'altra tempo aggiunto a mano
        aggiungi(categorie, `nome:${voce.etichetta.trim().toLowerCase()}`, voce.etichetta, voce.minuti);
      }
    }
    totale += totaleGiorno;
    perGiorno.push({ giorno, studio: studioGiorno, totale: totaleGiorno });

    // Obiettivi: conto solo i giorni fino a oggi
    if (giorno <= adesso.giorno) {
      for (const o of obiettiviDelGiorno(stato, giorno, adesso)) {
        if (!obiettivi.has(o.obiettivo.id)) obiettivi.set(o.obiettivo.id, { titolo: o.obiettivo.titolo, previsti: 0, raggiunti: 0, fatto: 0, traguardo: 0 });
        const riga = obiettivi.get(o.obiettivo.id);
        riga.fatto += o.fatto;
        riga.traguardo += o.traguardo;
        if (o.traguardo > 0) {
          riga.previsti++;
          if (o.fatto >= o.traguardo) riga.raggiunti++;
        }
      }
    }
  }

  const sessioni = stato.sessioni.filter((s) => s.data >= da && s.data <= a);
  return {
    totale,
    categorie: ordinati(categorie),
    studioPerMateria: ordinati(studioPerMateria),
    lezioniPerMateria: ordinati(lezioniPerMateria),
    perGiorno,
    obiettivi: [...obiettivi.values()],
    focus: {
      sessioni: sessioni.length,
      minuti: sessioni.reduce((somma, s) => somma + s.studio, 0),
      interruzioni: sessioni.reduce((somma, s) => somma + s.interruzioni, 0),
    },
  };
}
