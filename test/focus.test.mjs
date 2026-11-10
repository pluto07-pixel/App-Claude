// Prove della logica del focus. Si eseguono con:  node test/focus.test.mjs
// Nessuna libreria: una funzione "verifica" confronta il valore ottenuto con quello atteso.

import { creaFocus, fasi, faseAttuale, riepilogo, inCronometro } from "../js/focus.js";

const MIN = 60 * 1000;
let falliti = 0;

function verifica(nome, ottenuto, atteso) {
  const ok = JSON.stringify(ottenuto) === JSON.stringify(atteso);
  if (!ok) falliti++;
  console.log(`${ok ? "ok  " : "ERRORE"} ${nome}${ok ? "" : ` — ottenuto ${JSON.stringify(ottenuto)}, atteso ${JSON.stringify(atteso)}`}`);
}

// Un focus di prova che parte all'istante 0 e dura "durata" minuti
function focusDiProva(durata, modalita = "libera", assenze = []) {
  return { avvio: 0, fine: durata * MIN, modalita, studioMin: 50, pausaMin: 10, assenze };
}
const minuti = (r) => ({ studio: r.studio / MIN, pausa: r.pausa / MIN, fuori: r.fuori / MIN, interruzioni: r.interruzioni });

// --- Modalità libera
verifica("libera, 60 minuti senza uscite",
  minuti(riepilogo(focusDiProva(60), 60 * MIN)), { studio: 60, pausa: 0, fuori: 0, interruzioni: 0 });
verifica("libera, a metà",
  minuti(riepilogo(focusDiProva(60), 30 * MIN)), { studio: 30, pausa: 0, fuori: 0, interruzioni: 0 });
verifica("oltre la fine prevista il tempo non cresce",
  minuti(riepilogo(focusDiProva(60), 500 * MIN)).studio, 60);

// --- Cicli 50/10
verifica("cicli 50/10 su 120 minuti: 100 di studio, 20 di pausa",
  minuti(riepilogo(focusDiProva(120, "cicli"), 120 * MIN)), { studio: 100, pausa: 20, fuori: 0, interruzioni: 0 });
verifica("cicli: le fasi si fermano alla fine prevista",
  fasi(focusDiProva(70, "cicli"), 70 * MIN).map((f) => `${f.tipo} ${f.da / MIN}-${f.a / MIN}`),
  ["studio 0-50", "pausa 50-60", "studio 60-70"]);
verifica("cicli: al minuto 55 sono in pausa", faseAttuale(focusDiProva(120, "cicli"), 55 * MIN).tipo, "pausa");
verifica("cicli: al minuto 65 sono nel secondo ciclo di studio",
  [faseAttuale(focusDiProva(120, "cicli"), 65 * MIN).tipo, faseAttuale(focusDiProva(120, "cicli"), 65 * MIN).numero], ["studio", 2]);

// --- Uscite dall'app
verifica("un'uscita di 10 minuti durante lo studio non conta",
  minuti(riepilogo(focusDiProva(60, "libera", [{ da: 20 * MIN, a: 30 * MIN, conta: false }]), 60 * MIN)),
  { studio: 50, pausa: 0, fuori: 10, interruzioni: 1 });
verifica("la stessa uscita, se scelgo di contarla, resta studio (ma è registrata)",
  minuti(riepilogo(focusDiProva(60, "libera", [{ da: 20 * MIN, a: 30 * MIN, conta: true }]), 60 * MIN)),
  { studio: 60, pausa: 0, fuori: 10, interruzioni: 1 });
verifica("un'uscita durante la pausa non è un'interruzione",
  minuti(riepilogo(focusDiProva(120, "cicli", [{ da: 52 * MIN, a: 58 * MIN, conta: false }]), 120 * MIN)),
  { studio: 100, pausa: 20, fuori: 0, interruzioni: 0 });
verifica("un'uscita a cavallo tra studio e pausa toglie solo la parte di studio",
  minuti(riepilogo(focusDiProva(120, "cicli", [{ da: 45 * MIN, a: 55 * MIN, conta: false }]), 120 * MIN)),
  { studio: 95, pausa: 20, fuori: 5, interruzioni: 1 });
verifica("l'uscita per lanciare il comando viene ignorata",
  minuti(riepilogo(focusDiProva(60, "libera", [{ da: 0, a: 1 * MIN, conta: false, comando: true }]), 60 * MIN)),
  { studio: 60, pausa: 0, fuori: 0, interruzioni: 0 });
verifica("un'uscita di 3 secondi non è un'interruzione",
  minuti(riepilogo(focusDiProva(60, "libera", [{ da: 10 * MIN, a: 10 * MIN + 3000, conta: false }]), 60 * MIN)).interruzioni, 0);
verifica("un'uscita ancora aperta arriva fino ad adesso",
  minuti(riepilogo(focusDiProva(60, "libera", [{ da: 20 * MIN, a: null, conta: false }]), 40 * MIN)),
  { studio: 20, pausa: 0, fuori: 20, interruzioni: 1 });
verifica("un'uscita che supera la fine si ferma alla fine",
  minuti(riepilogo(focusDiProva(60, "libera", [{ da: 50 * MIN, a: 90 * MIN, conta: false }]), 90 * MIN)).studio, 50);

// --- Creazione del focus da un blocco
const impostazioni = { focusModalita: "libera", cicloStudio: 50, cicloPausa: 10 };
const blocco = { id: "b", materiaId: "mat1", inizio: 15 * 60, fine: 17 * 60 };
const alle = (ore, min) => new Date(2026, 10, 10, ore, min, 20).getTime();
const oraDiFine = (focus) => { const d = new Date(focus.fine); return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}:${d.getSeconds()}`; };
verifica("avvio alle 15:20 dentro il blocco: finisce alle 17:00 in punto", oraDiFine(creaFocus(blocco, "", impostazioni, alle(15, 20))), "17:00:0");
verifica("avvio alle 14:45 (poco prima): finisce alle 17:00", oraDiFine(creaFocus(blocco, "", impostazioni, alle(14, 45))), "17:00:0");
verifica("avvio alle 18:10 (fuori dal blocco): dura due ore, fino alle 20:10", oraDiFine(creaFocus(blocco, "", impostazioni, alle(18, 10))), "20:10:0");
verifica("avvio alle 23:00: non supera le 23:59", oraDiFine(creaFocus(blocco, "", impostazioni, alle(23, 0))), "23:59:0");

// --- Formato del cronometro
verifica("cronometro sotto l'ora", inCronometro(5 * MIN + 9000), "5:09");
verifica("cronometro sopra l'ora", inCronometro(65 * MIN + 9000), "1:05:09");

console.log(falliti === 0 ? "\nTutte le prove superate." : `\n${falliti} prove fallite.`);
process.exit(falliti === 0 ? 0 : 1);
