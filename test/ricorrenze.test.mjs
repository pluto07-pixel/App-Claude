// Prove di lezioni ricorrenti, eccezioni e attività flessibili.
// Si eseguono con:  node test/ricorrenze.test.mjs

import { occorrenzeDelGiorno, vociDelGiorno, impostaEccezione, statoFlessibili, controllaRicorrenza } from "../js/ricorrenze.js";

let falliti = 0;
function verifica(nome, ottenuto, atteso) {
  const ok = JSON.stringify(ottenuto) === JSON.stringify(atteso);
  if (!ok) falliti++;
  console.log(`${ok ? "ok  " : "ERRORE"} ${nome}${ok ? "" : ` — ottenuto ${JSON.stringify(ottenuto)}, atteso ${JSON.stringify(atteso)}`}`);
}

// Lezione di Matematica ogni lunedì 8:30–10:30, dal 28 settembre al 18 dicembre 2026
const lezione = { id: "L", tipo: "lezione", titolo: "", materiaId: "mat1", aula: "A1", giorno: 1, inizio: 510, fine: 630, dal: "2026-09-28", al: "2026-12-18" };
const nuovoStato = () => ({ blocchi: [], ricorrenze: [lezione], eccezioni: [], flessibili: [] });
const orari = (voci) => voci.map((v) => `${v.inizio}-${v.fine}${v.annullata ? " annullata" : ""}${v.spostata ? " spostata" : ""}`);

// --- Ricorrenza
verifica("compare di lunedì", orari(occorrenzeDelGiorno(nuovoStato(), "2026-11-16")), ["510-630"]);
verifica("non compare di martedì", orari(occorrenzeDelGiorno(nuovoStato(), "2026-11-17")), []);
verifica("non compare prima dell'inizio del periodo", orari(occorrenzeDelGiorno(nuovoStato(), "2026-09-21")), []);
verifica("compare il primo giorno del periodo", orari(occorrenzeDelGiorno(nuovoStato(), "2026-09-28")), ["510-630"]);
verifica("non compare dopo la fine del periodo", orari(occorrenzeDelGiorno(nuovoStato(), "2026-12-21")), []);
verifica("senza data di fine vale per sempre",
  orari(occorrenzeDelGiorno({ ...nuovoStato(), ricorrenze: [{ ...lezione, al: null }] }, "2030-01-07")), ["510-630"]);

// --- Eccezioni
let stato = nuovoStato();
impostaEccezione(stato, "L", "2026-11-16", { annullata: true });
verifica("annullata: resta visibile come annullata solo quel lunedì", orari(occorrenzeDelGiorno(stato, "2026-11-16")), ["510-630 annullata"]);
verifica("annullata: il lunedì dopo è normale", orari(occorrenzeDelGiorno(stato, "2026-11-23")), ["510-630"]);

stato = nuovoStato();
impostaEccezione(stato, "L", "2026-11-16", { nuovaData: "2026-11-16", inizio: 660, fine: 780 });
verifica("spostata di orario nello stesso giorno", orari(occorrenzeDelGiorno(stato, "2026-11-16")), ["660-780 spostata"]);

stato = nuovoStato();
impostaEccezione(stato, "L", "2026-11-16", { nuovaData: "2026-11-18", inizio: 900, fine: 1020 });
verifica("spostata ad altro giorno: sparisce dal lunedì", orari(occorrenzeDelGiorno(stato, "2026-11-16")), []);
verifica("spostata ad altro giorno: compare il mercoledì", orari(occorrenzeDelGiorno(stato, "2026-11-18")), ["900-1020 spostata"]);
verifica("spostata: la regola non cambia", [stato.ricorrenze[0].giorno, stato.ricorrenze[0].inizio], [1, 510]);

impostaEccezione(stato, "L", "2026-11-16", null);
verifica("ripristinata: torna al lunedì", orari(occorrenzeDelGiorno(stato, "2026-11-16")), ["510-630"]);
verifica("una sola eccezione per occorrenza", (() => {
  const s = nuovoStato();
  impostaEccezione(s, "L", "2026-11-16", { annullata: true });
  impostaEccezione(s, "L", "2026-11-16", { nuovaData: "2026-11-16", inizio: 600, fine: 720 });
  return s.eccezioni.length;
})(), 1);

// --- Blocchi e occorrenze insieme
stato = nuovoStato();
stato.blocchi.push({ id: "b", data: "2026-11-16", inizio: 420, fine: 480, tipo: "studio" });
verifica("la giornata unisce blocchi e lezioni in ordine", vociDelGiorno(stato, "2026-11-16").map((v) => v.id), ["b", "r:L:2026-11-16"]);

// --- Attività flessibili: palestra 3 volte a settimana
stato = nuovoStato();
stato.flessibili.push({ id: "P", titolo: "Palestra", volte: 3, durata: 90 });
const palestra = (data, statoBlocco = "pianificato") => ({ id: data, data, inizio: 1080, fine: 1170, tipo: "altro", flessibileId: "P", stato: statoBlocco });
stato.blocchi.push(palestra("2026-11-09"), palestra("2026-11-11"), palestra("2026-11-15", "saltato"), palestra("2026-11-16"));
const conta = (giorno) => statoFlessibili(stato, giorno).map((x) => `${x.piazzate}/${x.flessibile.volte}, mancano ${x.mancanti}`);
verifica("settimana 9–15 novembre: due piazzate, quella saltata non conta", conta("2026-11-12"), ["2/3, mancano 1"]);
verifica("settimana 16–22 novembre: una piazzata", conta("2026-11-16"), ["1/3, mancano 2"]);
verifica("la domenica appartiene alla settimana del lunedì precedente", conta("2026-11-15"), ["2/3, mancano 1"]);

// --- Controlli
verifica("lezione senza materia", controllaRicorrenza({ ...lezione, materiaId: null }), "Scegli una materia.");
verifica("fine prima dell'inizio", controllaRicorrenza({ ...lezione, fine: 500 }), "La fine deve venire dopo l'inizio.");
verifica("periodo al contrario", controllaRicorrenza({ ...lezione, al: "2026-09-01" }), "La data di fine viene prima di quella di inizio.");
verifica("lezione valida", controllaRicorrenza(lezione), null);

console.log(falliti === 0 ? "\nTutte le prove superate." : `\n${falliti} prove fallite.`);
process.exit(falliti === 0 ? 0 : 1);
