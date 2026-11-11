// ============================================================
// APP — il punto di partenza. Tiene lo stato in memoria, decide
// cosa mostrare e reagisce ai tocchi. Gli altri file sono strumenti
// che questo file usa.
//
// Il ciclo è sempre lo stesso:
//   tocco -> modifico lo stato -> salvo -> ridisegno
// ============================================================

import { oggi, aggiungiGiorni, lunediDi, descrivi, arrotonda, minutiAdesso, GIORNI, daGiorno, inDurata } from "./date.js";
import { vociDelGiorno, statoFlessibili, impostaEccezione } from "./ricorrenze.js";
import { apriSettimanaTipo, apriOccorrenza } from "./settimana-tipo.js";
import { pulisci } from "./giornata.js";
import { obiettiviDelGiorno } from "./tempo.js";
import { apriObiettivi, apriObiettivoDelGiorno } from "./obiettivi.js";
import { disegnaStatistiche, preparaStatistiche, statisticheAOggi } from "./statistiche.js";
import { carica, salva, chiediPersistenza } from "./archivio.js";
import { disegnaTimeline, minutoAlTocco, PX_MINUTO } from "./giornata.js";
import { attivaTrascinamento } from "./trascina.js";
import { apriModuloBlocco } from "./modulo-blocco.js";
import { apriImpostazioni, applicaAspetto } from "./impostazioni.js";
import { messaggio } from "./foglio.js";
import { preparaFocus, avviaFocus } from "./schermo-focus.js";

// ---------- Stato in memoria ----------

let stato = carica();          // tutti i dati dell'agenda
let giorno = oggi();           // il giorno che sto guardando
let vista = "giornata";        // quale schermata è visibile: "giornata" oppure "statistiche"

// ---------- Elementi della pagina ----------

const elTestataGiorno = document.querySelector("#testata-giorno");
const elTestataData = document.querySelector("#testata-data");
const elSettimana = document.querySelector("#settimana");
const elTimeline = document.querySelector("#timeline");
const elAvviso = document.querySelector("#avviso");
const elFlessibili = document.querySelector("#flessibili");
const elObiettivi = document.querySelector("#obiettivi");
const elVistaGiornata = document.querySelector("#vista-giornata");
const elVistaStatistiche = document.querySelector("#vista-statistiche");

// ---------- Disegno ----------

function disegna() {
  // Mostro una schermata e nascondo l'altra
  elVistaGiornata.hidden = vista !== "giornata";
  elVistaStatistiche.hidden = vista !== "statistiche";
  document.querySelector("#vai-oggi").classList.toggle("attiva", vista === "giornata");
  document.querySelector("#vai-statistiche").classList.toggle("attiva", vista === "statistiche");
  if (vista === "statistiche") {
    disegnaStatistiche(elVistaStatistiche, stato);
    return;
  }

  const d = descrivi(giorno);
  elTestataGiorno.textContent = giorno === oggi() ? `Oggi · ${d.nome}` : d.nome;
  elTestataData.textContent = `${d.numero} ${d.mese}`;

  // Striscia della settimana: sette pulsanti da lunedì a domenica
  const lunedi = lunediDi(giorno);
  let html = "";
  for (let i = 0; i < 7; i++) {
    const g = aggiungiGiorni(lunedi, i);
    const classi = [];
    if (g === giorno) classi.push("scelto");
    if (g === oggi()) classi.push("oggi");
    if (vociDelGiorno(stato, g).some((v) => !v.annullata)) classi.push("pieno");
    const nome = GIORNI[daGiorno(g).getDay()];
    html += `
      <button class="${classi.join(" ")}" data-giorno="${g}" aria-label="${nome} ${descrivi(g).numero}">
        <span class="sigla">${nome.slice(0, 3)}</span>
        <span class="numero numeri">${descrivi(g).numero}</span>
      </button>`;
  }
  elSettimana.innerHTML = html;

  // Obiettivi del giorno: titolo, fatto / da fare, barra di avanzamento. Toccandone uno lo apro.
  elObiettivi.innerHTML = obiettiviDelGiorno(stato, giorno, { giorno: oggi(), minuti: minutiAdesso() }).map((o) => {
    const percento = o.traguardo > 0 ? Math.min(100, (o.fatto / o.traguardo) * 100) : 0;
    const raggiunto = o.traguardo > 0 && o.fatto >= o.traguardo;
    return `
    <button type="button" class="obiettivo-riga ${raggiunto ? "raggiunto" : ""}" data-obiettivo="${o.obiettivo.id}">
      <span class="obiettivo-testi">
        <span>${pulisci(o.obiettivo.titolo)}</span>
        <span class="numeri">${o.fatto > 0 ? inDurata(o.fatto) : "0"} / ${o.traguardo > 0 ? inDurata(o.traguardo) : "–"}${o.modificato ? " · modificato" : ""}</span>
      </span>
      <span class="barra-obiettivo"><i style="width:${percento}%"></i></span>
    </button>`;
  }).join("");

  // Attività flessibili: quante ne ho piazzate questa settimana. Toccandone una la piazzo oggi.
  elFlessibili.innerHTML = statoFlessibili(stato, giorno).map(({ flessibile, piazzate }) => `
    <button type="button" data-flessibile="${flessibile.id}" class="${piazzate >= flessibile.volte ? "completa" : ""}">
      ${pulisci(flessibile.titolo)} <span class="numeri">${piazzate}/${flessibile.volte}</span>
    </button>`).join("");

  const { sovrapposti } = disegnaTimeline(elTimeline, stato, giorno);
  elAvviso.textContent = sovrapposti > 0 ? "Alcuni blocchi si sovrappongono." : "";
}

// Salva e ridisegna: da chiamare dopo ogni modifica ai dati
function aggiorna() {
  if (!salva(stato)) messaggio("Salvataggio non riuscito");
  disegna();
}

function vaiA(nuovoGiorno) {
  giorno = nuovoGiorno;
  disegna();
}

// Porta in vista l'ora attuale (o le 8:00 se guardo un altro giorno)
function scorriAllOra() {
  if (vista !== "giornata") return;
  const area = elTimeline.querySelector(".area-blocchi");
  const da = Number(area.dataset.da);
  const minuto = giorno === oggi() ? minutiAdesso() : 480;
  const y = elTimeline.offsetTop + (minuto - da) * PX_MINUTO - window.innerHeight * 0.3;
  window.scrollTo(0, Math.max(0, y));
}

// ---------- Azioni sui blocchi ----------

const azioniBlocco = {
  salva(blocco) {
    const posizione = stato.blocchi.findIndex((b) => b.id === blocco.id);
    if (posizione === -1) stato.blocchi.push(blocco);
    else stato.blocchi[posizione] = blocco;
    if (blocco.data !== giorno) giorno = blocco.data;   // seguo il blocco se cambia giorno
    aggiorna();
  },
  elimina(id) {
    stato.blocchi = stato.blocchi.filter((b) => b.id !== id);
    aggiorna();
  },
  avviaFocus(blocco) {
    avviaFocus(blocco);
  },
};

function nuovoBlocco(inizio) {
  // Senza un orario indicato propongo la prossima mezz'ora (oggi) o le 9:00
  if (inizio === undefined) {
    inizio = giorno === oggi() ? Math.ceil((minutiAdesso() + 1) / 30) * 30 : 540;
  }
  inizio = Math.max(0, Math.min(inizio, 1380));
  apriModuloBlocco(stato, { data: giorno, inizio, fine: inizio + 60 }, azioniBlocco);
}

// Usate dai fogli della settimana tipo: salvano, ridisegnano e (se serve) cambiano giorno
const azioniSettimana = {
  aggiorna(nuovoGiorno) {
    if (nuovoGiorno) giorno = nuovoGiorno;
    aggiorna();
  },
};

// ---------- Tocchi ----------

// Tocco su un obiettivo del giorno: aggiungo tempo o cambio il valore per quel giorno
elObiettivi.addEventListener("click", (evento) => {
  const riga = evento.target.closest("[data-obiettivo]");
  if (!riga) return;
  const voce = obiettiviDelGiorno(stato, giorno, { giorno: oggi(), minuti: minutiAdesso() })
    .find((o) => o.obiettivo.id === riga.dataset.obiettivo);
  if (voce) apriObiettivoDelGiorno(stato, voce, giorno, azioniSettimana);
});

document.querySelector("#vai-obiettivi").addEventListener("click", () => apriObiettivi(stato, azioniSettimana));

document.querySelector("#vai-statistiche").addEventListener("click", () => {
  vista = "statistiche";
  statisticheAOggi();
  disegna();
  window.scrollTo(0, 0);
});
preparaStatistiche(elVistaStatistiche, () => disegna());

// Tocco su un'attività flessibile: propongo un blocco di quella durata nel giorno che sto guardando
elFlessibili.addEventListener("click", (evento) => {
  const pulsante = evento.target.closest("button[data-flessibile]");
  if (!pulsante) return;
  const flessibile = stato.flessibili.find((f) => f.id === pulsante.dataset.flessibile);
  const inizio = Math.min(giorno === oggi() ? Math.ceil((minutiAdesso() + 1) / 30) * 30 : 1080, 1439 - flessibile.durata);
  apriModuloBlocco(stato, {
    data: giorno, inizio, fine: inizio + flessibile.durata,
    tipo: "altro", titolo: flessibile.titolo, flessibileId: flessibile.id,
  }, azioniBlocco);
});

document.querySelector("#giorno-prima").addEventListener("click", () => vaiA(aggiungiGiorni(giorno, -1)));
document.querySelector("#giorno-dopo").addEventListener("click", () => vaiA(aggiungiGiorni(giorno, 1)));

elSettimana.addEventListener("click", (evento) => {
  const pulsante = evento.target.closest("button[data-giorno]");
  if (pulsante) vaiA(pulsante.dataset.giorno);
});

document.querySelector("#vai-oggi").addEventListener("click", () => {
  vista = "giornata";
  vaiA(oggi());
  scorriAllOra();
});

document.querySelector("#aggiungi").addEventListener("click", () => {
  // Dalle statistiche torno prima alla giornata: il blocco nuovo va visto lì
  if (vista !== "giornata") { vista = "giornata"; disegna(); }
  nuovoBlocco();
});

document.querySelector("#altro").addEventListener("click", () => {
  apriImpostazioni(stato, {
    cambiaImpostazioni(modifiche) {
      Object.assign(stato.impostazioni, modifiche);
      applicaAspetto(stato.impostazioni);
      aggiorna();
    },
    sostituisciStato(nuovoStato) {
      stato = nuovoStato;
      applicaAspetto(stato.impostazioni);
      aggiorna();
    },
    apriSettimanaTipo() {
      apriSettimanaTipo(stato, azioniSettimana);
    },
  });
});

// Tocco sulla timeline: su un blocco lo apro, su uno spazio vuoto ne creo uno lì
elTimeline.addEventListener("click", (evento) => {
  const elemento = evento.target.closest(".blocco");
  if (elemento) {
    // Le occorrenze di lezioni e attività fisse hanno un id che comincia con "r:"
    if (elemento.dataset.id.startsWith("r:")) {
      const voce = vociDelGiorno(stato, giorno).find((v) => v.id === elemento.dataset.id);
      if (voce) apriOccorrenza(stato, voce, azioniSettimana);
      return;
    }
    const blocco = stato.blocchi.find((b) => b.id === elemento.dataset.id);
    if (blocco) apriModuloBlocco(stato, blocco, azioniBlocco);
    return;
  }
  const minuto = minutoAlTocco(elTimeline, evento.clientY);
  nuovoBlocco(Math.floor(minuto / 30) * 30);
});

// Pressione lunga + trascinamento: sposta il blocco mantenendone la durata
attivaTrascinamento(elTimeline, (id, nuovoInizio) => {
  // Trascinare una lezione sposta solo quella volta: diventa un'eccezione
  if (id.startsWith("r:")) {
    const voce = vociDelGiorno(stato, giorno).find((v) => v.id === id);
    if (voce && nuovoInizio !== voce.inizio) {
      const inizio = arrotonda(nuovoInizio);
      impostaEccezione(stato, voce.ricorrenzaId, voce.dataOriginale,
        { nuovaData: giorno, inizio, fine: inizio + (voce.fine - voce.inizio) });
    }
    aggiorna();
    return;
  }
  const blocco = stato.blocchi.find((b) => b.id === id);
  if (!blocco) return;
  const durata = blocco.fine - blocco.inizio;
  blocco.inizio = arrotonda(nuovoInizio);
  blocco.fine = blocco.inizio + durata;
  aggiorna();
});

// ---------- Avvio ----------

applicaAspetto(stato.impostazioni);
disegna();
scorriAllOra();

// La modalità focus lavora sullo stesso stato: le passo come leggerlo, salvarlo e ridisegnare.
// stato() è una funzione e non il valore perché "stato" può essere sostituito (import di un backup).
preparaFocus({
  stato: () => stato,
  salva: () => { if (!salva(stato)) messaggio("Salvataggio non riuscito"); },
  ridisegna: disegna,
});
chiediPersistenza();

// La linea dell'ora attuale avanza: ridisegno una volta al minuto
// (non mentre sto trascinando un blocco: il ridisegno me lo toglierebbe da sotto il dito)
setInterval(() => {
  if (!document.querySelector(".blocco.trascinato")) disegna();
}, 60 * 1000);

// Quando torno all'app dopo averla lasciata, ridisegno (potrebbe essere cambiato il giorno)
let ultimoOggi = oggi();
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  if (oggi() !== ultimoOggi) {
    ultimoOggi = oggi();
    giorno = ultimoOggi;
  }
  disegna();
});

// Service worker: il programma che rende l'app disponibile offline (vedi sw.js)
if ("serviceWorker" in navigator) {
  // C'era già un service worker al comando quando ho aperto l'app?
  // Se sì e ne subentra uno nuovo, è arrivato un aggiornamento: ricarico per usarlo subito.
  // (Alla primissima apertura invece non ricarico: non c'è nulla di vecchio da sostituire.)
  const giaInstallata = Boolean(navigator.serviceWorker.controller);
  let ricaricata = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!giaInstallata || ricaricata) return;
    ricaricata = true;
    window.location.reload();
  });

  navigator.serviceWorker.register("./sw.js")
    .then((registrazione) => {
      // Controllo se c'è una versione nuova anche ogni volta che torno all'app
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) registrazione.update().catch(() => {});
      });
    })
    .catch((errore) => console.warn("Service worker non registrato.", errore));
}
