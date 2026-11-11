// Prove del conteggio del tempo, degli obiettivi e delle statistiche.
// Si eseguono con:  node test/tempo.test.mjs

import { tempoDelGiorno, traguardo, obiettiviDelGiorno, riepilogoPeriodo } from "../js/tempo.js";
import { daDurata } from "../js/date.js";

let falliti = 0;
function verifica(nome, ottenuto, atteso) {
  const ok = JSON.stringify(ottenuto) === JSON.stringify(atteso);
  if (!ok) falliti++;
  console.log(`${ok ? "ok  " : "ERRORE"} ${nome}${ok ? "" : ` — ottenuto ${JSON.stringify(ottenuto)}, atteso ${JSON.stringify(atteso)}`}`);
}

// Settimana di prova: lunedì 9 – domenica 15 novembre 2026. "Adesso" è mercoledì 11 alle 20:00.
const adesso = { giorno: "2026-11-11", minuti: 1200 };
const LUN = "2026-11-09", MAR = "2026-11-10", MER = "2026-11-11", GIO = "2026-11-12", DOM = "2026-11-15";

function statoDiProva() {
  return {
    materie: [{ id: "mat1", sigla: "Matematica 1", colore: "#111" }, { id: "info1", sigla: "Informatica 1", colore: "#222" }],
    blocchi: [
      { id: "b1", data: LUN, inizio: 900, fine: 1020, tipo: "studio", materiaId: "mat1", titolo: "", stato: "fatto" },        // 2h, senza focus
      { id: "b2", data: LUN, inizio: 1080, fine: 1200, tipo: "studio", materiaId: "info1", titolo: "", stato: "fatto" },     // 2h, ma con focus da 80 min
      { id: "b3", data: LUN, inizio: 600, fine: 660, tipo: "studio", materiaId: "mat1", titolo: "", stato: "pianificato" },  // non fatto
      { id: "b4", data: MAR, inizio: 1080, fine: 1170, tipo: "altro", titolo: "Palestra", flessibileId: "P", stato: "fatto" },
      { id: "b5", data: MAR, inizio: 1320, fine: 1350, tipo: "libero", titolo: "Lettura", stato: "fatto" },
      { id: "b6", data: MAR, inizio: 600, fine: 630, tipo: "commissione", titolo: "Spesa", stato: "saltato" },
    ],
    sessioni: [{ id: "s", data: LUN, bloccoId: "b2", materiaId: "info1", studio: 80, interruzioni: 2, fuori: 5 }],
    ricorrenze: [
      { id: "L", tipo: "lezione", titolo: "", materiaId: "mat1", aula: "", giorno: 3, inizio: 510, fine: 630, dal: "2026-09-28", al: "2026-12-18" },  // mercoledì 8:30–10:30
      { id: "S", tipo: "lezione", titolo: "", materiaId: "info1", aula: "", giorno: 3, inizio: 1230, fine: 1290, dal: "2026-09-28", al: null },       // mercoledì 20:30–21:30 (non ancora passata)
      { id: "K", tipo: "attivita", titolo: "Padel", materiaId: null, aula: "", giorno: 4, inizio: 1080, fine: 1170, dal: "2026-09-01", al: null },     // giovedì
    ],
    eccezioni: [],
    flessibili: [{ id: "P", titolo: "Palestra", volte: 3, durata: 90 }],
    obiettivi: [
      { id: "OS", titolo: "Studio", tipo: "studio", minuti: [0, 120, 240, 120, 120, 120, 0] },   // lun 2h, mar 4h
      { id: "OL", titolo: "Lettura", tipo: "altro", minuti: [30, 30, 30, 30, 30, 30, 30] },
    ],
    obiettiviGiorno: [],
    registrazioni: [],
  };
}
const riassumi = (voci) => voci.map((v) => `${v.gruppo}:${v.etichetta}:${v.minuti}`).sort();

// --- Conteggio del tempo
verifica("lunedì: blocco fatto per intero, blocco con focus conta il focus, blocco non fatto non conta",
  riassumi(tempoDelGiorno(statoDiProva(), LUN, adesso)), ["studio:Informatica 1:80", "studio:Matematica 1:120"]);
verifica("martedì: palestra e lettura contano, la commissione saltata no",
  riassumi(tempoDelGiorno(statoDiProva(), MAR, adesso)), ["attivita:Palestra:90", "libero:Lettura:30"]);
verifica("mercoledì alle 20: la lezione del mattino conta, quella delle 20:30 non ancora",
  riassumi(tempoDelGiorno(statoDiProva(), MER, adesso)), ["lezione:Matematica 1:120"]);
verifica("giovedì (futuro): il padel non conta ancora", riassumi(tempoDelGiorno(statoDiProva(), GIO, adesso)), []);
verifica("una lezione annullata non conta", (() => {
  const s = statoDiProva(); s.eccezioni.push({ ricorrenzaId: "L", data: MER, annullata: true });
  return riassumi(tempoDelGiorno(s, MER, adesso));
})(), []);

// --- Obiettivi
const obiettivi = (stato, giorno) => obiettiviDelGiorno(stato, giorno, adesso).map((o) => `${o.obiettivo.titolo} ${o.fatto}/${o.traguardo}${o.modificato ? " *" : ""}`);
verifica("lunedì: studio 200 su 120, lettura 0 su 30", obiettivi(statoDiProva(), LUN), ["Studio 200/120", "Lettura 0/30"]);
verifica("martedì: obiettivo di studio diverso (4h); la lettura conta dal blocco con lo stesso titolo",
  obiettivi(statoDiProva(), MAR), ["Studio 0/240", "Lettura 30/30"]);
verifica("domenica: lo studio non ha obiettivo e non compare", obiettivi(statoDiProva(), DOM), ["Lettura 0/30"]);
verifica("le lezioni non contano per l'obiettivo di studio", obiettivi(statoDiProva(), MER), ["Studio 0/120", "Lettura 0/30"]);
verifica("obiettivo cambiato per un solo giorno", (() => {
  const s = statoDiProva(); s.obiettiviGiorno.push({ obiettivoId: "OS", data: MAR, minuti: 60 });
  return [obiettivi(s, MAR)[0], traguardo(s, s.obiettivi[0], "2026-11-17").minuti];
})(), ["Studio 0/60 *", 240]);
verifica("tempo aggiunto a mano", (() => {
  const s = statoDiProva();
  s.registrazioni.push({ id: "r1", data: MER, obiettivoId: "OL", titolo: "Lettura", studio: false, minuti: 20 });
  s.registrazioni.push({ id: "r2", data: MER, obiettivoId: "OS", titolo: "Studio", studio: true, minuti: 45 });
  return obiettivi(s, MER);
})(), ["Studio 45/120", "Lettura 20/30"]);

// --- Statistiche della settimana
const r = riepilogoPeriodo(statoDiProva(), LUN, DOM, adesso);
verifica("categorie in ordine di tempo", r.categorie.map((c) => `${c.etichetta} ${c.minuti}`),
  ["Studio a casa 200", "Lezioni 120", "Palestra 90", "Lettura 30"]);
verifica("totale", r.totale, 440);
verifica("stesso nome, una sola categoria (blocco + tempo aggiunto a mano)", (() => {
  const s = statoDiProva();
  s.registrazioni.push({ id: "r", data: LUN, obiettivoId: "OL", titolo: "Lettura", studio: false, minuti: 20 });
  return riepilogoPeriodo(s, LUN, DOM, adesso).categorie.filter((c) => c.etichetta === "Lettura").map((c) => c.minuti);
})(), [50]);
verifica("studio per materia", r.studioPerMateria.map((c) => `${c.etichetta} ${c.minuti}`), ["Matematica 1 120", "Informatica 1 80"]);
verifica("lezioni per materia", r.lezioniPerMateria.map((c) => `${c.etichetta} ${c.minuti}`), ["Matematica 1 120"]);
verifica("studio giorno per giorno", r.perGiorno.map((g) => g.studio), [200, 0, 0, 0, 0, 0, 0]);
verifica("obiettivi: contati solo i giorni fino a oggi", r.obiettivi.map((o) => `${o.titolo} ${o.raggiunti}/${o.previsti}`), ["Studio 1/3", "Lettura 1/3"]);
verifica("focus", r.focus, { sessioni: 1, minuti: 80, interruzioni: 2 });

// --- Lettura di una durata scritta a mano
verifica("2h", daDurata("2h"), 120);
verifica("1h30", daDurata("1h30"), 90);
verifica("1:30", daDurata("1:30"), 90);
verifica("1,5h", daDurata("1,5h"), 90);
verifica("45m", daDurata("45m"), 45);
verifica("45 min", daDurata("45 min"), 45);
verifica("90 (numero grande: minuti)", daDurata("90"), 90);
verifica("2 (numero piccolo: ore)", daDurata("2"), 120);
verifica("vuoto = nessun obiettivo", daDurata(""), 0);
verifica("0", daDurata("0"), 0);
verifica("testo senza senso", daDurata("boh"), null);

console.log(falliti === 0 ? "\nTutte le prove superate." : `\n${falliti} prove fallite.`);
process.exit(falliti === 0 ? 0 : 1);
