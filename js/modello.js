// ============================================================
// MODELLO — la forma dei dati e le funzioni che li creano,
// li controllano e li interrogano. Qui non c'è nulla che tocchi
// lo schermo: sono funzioni "pure" (stesso ingresso, stessa uscita),
// quindi facili da provare.
//
//   stato    = { versione, materie[], blocchi[], sessioni[], focus, impostazioni{} }
//   sessione = { id, data, bloccoId, materiaId, inizio, fine, studio, interruzioni, fuori }
//   materia = { id, nome, sigla, cfu, colore }
//   blocco  = { id, data, inizio, fine, tipo, materiaId, titolo, stato }
// ============================================================

export const VERSIONE = 1;

// Versione dell'app mostrata in "Altro": la aumento a ogni pubblicazione,
// insieme a VERSIONE in sw.js, così si vede a colpo d'occhio quale versione è in uso.
export const VERSIONE_APP = 5;

export const TIPI = [
  { id: "studio", nome: "Studio" },
  { id: "commissione", nome: "Commissione" },
  { id: "libero", nome: "Libero" },
  { id: "altro", nome: "Altro" },
];

export const STATI = [
  { id: "pianificato", nome: "Pianificato" },
  { id: "fatto", nome: "Fatto" },
  { id: "saltato", nome: "Saltato" },
];

// Colori dei blocchi che non hanno una materia
const COLORI_TIPO = { commissione: "#7d786f", libero: "#63706f", altro: "#5a5956", attivita: "#6f7480" };

// Lo stato con cui parte l'app la prima volta
export function statoIniziale() {
  return {
    versione: VERSIONE,
    materie: [
      { id: "mat1", nome: "Matematica 1", sigla: "Matematica 1", cfu: 9, colore: "#8c93a8" },
      { id: "info1", nome: "Fondamenti di Informatica 1", sigla: "Informatica 1", cfu: 9, colore: "#8fa394" },
      { id: "almd", nome: "Algebra Lineare e Matematica Discreta", sigla: "Algebra lineare", cfu: 6, colore: "#a3927f" },
      { id: "emc", nome: "Elementi di Matematica Computazionale", sigla: "Mat. computazionale", cfu: 6, colore: "#9c8798" },
    ],
    blocchi: [],
    ricorrenze: [],          // lezioni e attività fisse che si ripetono (vedi js/ricorrenze.js)
    eccezioni: [],           // singole occorrenze annullate o spostate
    flessibili: [],          // attività con frequenza settimanale ma senza giorno fisso
    sessioni: [],            // studio effettivo registrato dalla modalità focus
    focus: null,             // il focus in corso, se ce n'è uno (vedi js/focus.js)
    impostazioni: {
      inizioGiornata: 450,   // 7:30
      fineGiornata: 1410,    // 23:30
      accento: "ottone",     // oppure "acciaio"
      titoli: "serif",       // oppure "sans"
      ultimoBackup: null,    // giorno dell'ultimo backup esportato
      focusModalita: "libera", // oppure "cicli"
      cicloStudio: 50,       // minuti di studio per ciclo
      cicloPausa: 10,        // minuti di pausa per ciclo
      nonDisturbare: false,  // lancia il comando rapido all'avvio e alla fine del focus
    },
  };
}

// Identificatore unico per un nuovo blocco
export function nuovoId() {
  if (globalThis.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Crea un blocco completo partendo dai campi dati (gli altri prendono un default)
export function creaBlocco(campi) {
  return {
    id: nuovoId(),
    data: campi.data,
    inizio: campi.inizio,
    fine: campi.fine,
    tipo: campi.tipo || "studio",
    materiaId: campi.materiaId || null,
    titolo: (campi.titolo || "").trim(),
    stato: campi.stato || "pianificato",
    flessibileId: campi.flessibileId || null,   // se il blocco è una "volta" di un'attività flessibile
  };
}

// Controlla un blocco. Restituisce un messaggio d'errore, oppure null se va bene.
export function controllaBlocco(blocco) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(blocco.data || "")) return "Giorno non valido.";
  if (!Number.isInteger(blocco.inizio) || !Number.isInteger(blocco.fine)) return "Orario non valido.";
  if (blocco.inizio < 0 || blocco.fine > 1440) return "Orario fuori dalla giornata.";
  if (blocco.fine <= blocco.inizio) return "La fine deve venire dopo l'inizio.";
  if (!TIPI.some((t) => t.id === blocco.tipo)) return "Tipo non valido.";
  if (!STATI.some((s) => s.id === blocco.stato)) return "Stato non valido.";
  if (blocco.tipo === "studio" && !blocco.materiaId) return "Scegli una materia.";
  return null;
}

export function trovaMateria(stato, materiaId) {
  return stato.materie.find((m) => m.id === materiaId) || null;
}

// Il testo da mostrare sul blocco: il titolo scritto, altrimenti materia o tipo
export function titoloDi(stato, blocco) {
  if (blocco.titolo) return blocco.titolo;
  const materia = trovaMateria(stato, blocco.materiaId);
  if ((blocco.tipo === "studio" || blocco.tipo === "lezione") && materia) return materia.sigla;
  const tipo = TIPI.find((t) => t.id === blocco.tipo);
  return tipo ? tipo.nome : "Attività";
}

export function coloreDi(stato, blocco) {
  const materia = trovaMateria(stato, blocco.materiaId);
  if ((blocco.tipo === "studio" || blocco.tipo === "lezione") && materia) return materia.colore;
  if (blocco.flessibileId) return COLORI_TIPO.attivita;
  return COLORI_TIPO[blocco.tipo] || COLORI_TIPO.altro;
}

// I blocchi di un giorno, in ordine di orario
export function blocchiDelGiorno(stato, giorno) {
  return stato.blocchi
    .filter((b) => b.data === giorno)
    .sort((a, b) => a.inizio - b.inizio || a.fine - b.fine);
}

// Due blocchi si sovrappongono se uno comincia prima che l'altro finisca
export function siSovrappongono(a, b) {
  return a.inizio < b.fine && b.inizio < a.fine;
}

// Decide come affiancare i blocchi che si sovrappongono.
// Riceve i blocchi di un giorno già ordinati e restituisce, per ognuno,
// { blocco, colonna, colonne }: in quale colonna va e quante colonne ha il suo gruppo.
//
// Idea: scorro i blocchi in ordine; un "gruppo" è una catena di blocchi che si
// toccano. Dentro il gruppo metto ogni blocco nella prima colonna libera.
export function disponi(blocchi) {
  const risultato = [];
  let gruppo = [];       // elementi del gruppo corrente
  let fineColonne = [];  // per ogni colonna, l'orario di fine dell'ultimo blocco
  let fineGruppo = -1;

  function chiudiGruppo() {
    for (const elemento of gruppo) elemento.colonne = fineColonne.length;
    risultato.push(...gruppo);
    gruppo = [];
    fineColonne = [];
  }

  for (const blocco of blocchi) {
    if (gruppo.length > 0 && blocco.inizio >= fineGruppo) chiudiGruppo();
    let colonna = fineColonne.findIndex((fine) => fine <= blocco.inizio);
    if (colonna === -1) colonna = fineColonne.length;
    fineColonne[colonna] = blocco.fine;
    fineGruppo = Math.max(fineGruppo, blocco.fine);
    gruppo.push({ blocco, colonna, colonne: 1 });
  }
  chiudiGruppo();
  return risultato;
}

// Controlla che un oggetto letto da un file di backup abbia la forma giusta.
// Restituisce un messaggio d'errore oppure null.
export function controllaStato(stato) {
  if (!stato || typeof stato !== "object") return "Il file non contiene dati dell'agenda.";
  if (!Number.isInteger(stato.versione)) return "Manca la versione dei dati.";
  if (stato.versione > VERSIONE) return "Il backup viene da una versione più recente dell'app.";
  if (!Array.isArray(stato.materie) || !Array.isArray(stato.blocchi)) return "Mancano materie o blocchi.";
  for (const blocco of stato.blocchi) {
    const errore = controllaBlocco(blocco);
    if (errore && errore !== "Scegli una materia.") return `Blocco non valido: ${errore}`;
  }
  return null;
}

// Porta dati salvati da una versione vecchia alla forma attuale.
// Per ora c'è una sola versione: completo soltanto i campi mancanti.
export function aggiorna(stato) {
  const base = statoIniziale();
  return {
    ...base,
    ...stato,
    versione: VERSIONE,
    ricorrenze: Array.isArray(stato.ricorrenze) ? stato.ricorrenze : [],
    eccezioni: Array.isArray(stato.eccezioni) ? stato.eccezioni : [],
    flessibili: Array.isArray(stato.flessibili) ? stato.flessibili : [],
    sessioni: Array.isArray(stato.sessioni) ? stato.sessioni : [],
    focus: stato.focus || null,
    impostazioni: { ...base.impostazioni, ...(stato.impostazioni || {}) },
  };
}
