// ============================================================
// FOCUS (logica) — i calcoli della modalità focus, senza nulla
// che tocchi lo schermo. Funzioni pure, provate in test/focus.test.mjs.
//
// Idea di fondo: NON conto i secondi uno a uno. iPhone sospende i
// timer delle app in secondo piano, quindi un contatore perderebbe
// tempo. Salvo invece gli istanti (in millisecondi, come li dà
// Date.now()) e ogni volta ricalcolo tutto per differenza.
//
//   focus = {
//     bloccoId, materiaId, titolo,
//     avvio, fine,                       istanti di inizio e di fine prevista
//     modalita: "libera" | "cicli",
//     studioMin, pausaMin,               durata dei cicli
//     assenze: [{ da, a, conta, comando }]
//   }
//   assenza = un periodo in cui l'app non era in primo piano.
//     a:       null finché non sono rientrato
//     conta:   true se ho scelto di contarla comunque come studio
//     comando: true se è l'uscita provocata dall'app stessa per
//              lanciare il comando "Non disturbare" (va ignorata)
// ============================================================

const MINUTO = 60 * 1000;

// Prepara un nuovo focus a partire da un blocco di studio.
// Se avvio durante il blocco (o fino a 30 minuti prima), il focus finisce
// all'orario di fine del blocco; altrimenti dura quanto il blocco, da adesso.
export function creaFocus(blocco, titolo, impostazioni, adesso) {
  const mezzanotte = new Date(adesso);
  mezzanotte.setHours(0, 0, 0, 0);
  const minutiAdesso = Math.floor((adesso - mezzanotte.getTime()) / MINUTO);

  const dentroIlBlocco = minutiAdesso >= blocco.inizio - 30 && minutiAdesso < blocco.fine;
  let fineMinuti = dentroIlBlocco ? blocco.fine : minutiAdesso + (blocco.fine - blocco.inizio);
  fineMinuti = Math.min(fineMinuti, 1439);                 // non oltre le 23:59
  fineMinuti = Math.max(fineMinuti, minutiAdesso + 1);     // almeno un minuto

  return {
    bloccoId: blocco.id,
    materiaId: blocco.materiaId,
    titolo,
    avvio: adesso,
    fine: mezzanotte.getTime() + fineMinuti * MINUTO,
    modalita: impostazioni.focusModalita === "cicli" ? "cicli" : "libera",
    studioMin: impostazioni.cicloStudio,
    pausaMin: impostazioni.cicloPausa,
    assenze: [],
  };
}

// Divide il focus in fasi di studio e di pausa, dall'avvio fino a "finoA".
// In modalità libera c'è un'unica fase di studio.
export function fasi(focus, finoA) {
  const limite = Math.min(finoA, focus.fine);
  if (limite <= focus.avvio) return [];
  if (focus.modalita !== "cicli") {
    return [{ tipo: "studio", da: focus.avvio, a: limite, numero: 1 }];
  }
  const studio = Math.max(1, focus.studioMin) * MINUTO;
  const pausa = Math.max(1, focus.pausaMin) * MINUTO;
  const elenco = [];
  let t = focus.avvio;
  for (let numero = 1; t < limite; numero++) {
    elenco.push({ tipo: "studio", da: t, a: Math.min(t + studio, limite), numero });
    t += studio;
    if (t >= limite) break;
    elenco.push({ tipo: "pausa", da: t, a: Math.min(t + pausa, limite), numero });
    t += pausa;
  }
  return elenco;
}

// La fase in corso in un dato istante (calcolata sull'intero focus previsto)
export function faseAttuale(focus, adesso) {
  const elenco = fasi(focus, focus.fine);
  return elenco.find((f) => adesso >= f.da && adesso < f.a) || elenco[elenco.length - 1] || null;
}

// Quanti millisecondi hanno in comune gli intervalli [a1, a2] e [b1, b2]
function inComune(a1, a2, b1, b2) {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
}

// Quanto tempo di STUDIO copre un'assenza (le uscite durante le pause non contano)
export function studioPerso(focus, assenza, finoA) {
  const limite = Math.min(finoA, focus.fine);
  const fineAssenza = Math.min(assenza.a === null ? limite : assenza.a, limite);
  let perso = 0;
  for (const fase of fasi(focus, limite)) {
    if (fase.tipo === "studio") perso += inComune(assenza.da, fineAssenza, fase.da, fase.a);
  }
  return perso;
}

// Un'assenza più breve di così non viene considerata un'interruzione
export const SOGLIA_INTERRUZIONE = 5000;

// Il resoconto del focus fino all'istante "finoA". Tutto in millisecondi.
//   studio:        studio effettivo (fasi di studio meno le uscite non contate)
//   pausa:         tempo passato in pausa
//   fuori:         tempo di studio passato fuori dall'app
//   interruzioni:  quante volte sono uscito durante lo studio
//   trascorso:     tempo totale dall'avvio
export function riepilogo(focus, finoA) {
  const limite = Math.max(focus.avvio, Math.min(finoA, focus.fine));
  let studio = 0;
  let pausa = 0;
  for (const fase of fasi(focus, limite)) {
    if (fase.tipo === "studio") studio += fase.a - fase.da;
    else pausa += fase.a - fase.da;
  }
  let fuori = 0;
  let interruzioni = 0;
  for (const assenza of focus.assenze) {
    if (assenza.comando) continue;
    const perso = studioPerso(focus, assenza, limite);
    if (perso < SOGLIA_INTERRUZIONE) continue;
    interruzioni++;
    fuori += perso;
    if (!assenza.conta) studio -= perso;
  }
  return { studio, pausa, fuori, interruzioni, trascorso: limite - focus.avvio };
}

// Millisecondi -> "1:05:09" (oppure "5:09" sotto l'ora)
export function inCronometro(ms) {
  const secondi = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(secondi / 3600);
  const m = Math.floor((secondi % 3600) / 60);
  const s = secondi % 60;
  const due = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${due(m)}:${due(s)}` : `${m}:${due(s)}`;
}
