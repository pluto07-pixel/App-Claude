// ============================================================
// APP — il punto di partenza. Tiene lo stato in memoria, decide
// cosa mostrare e reagisce ai tocchi. Gli altri file sono strumenti
// che questo file usa.
//
// Il ciclo è sempre lo stesso:
//   tocco -> modifico lo stato -> salvo -> ridisegno
// ============================================================

import { oggi, aggiungiGiorni, lunediDi, descrivi, arrotonda, minutiAdesso, GIORNI, daGiorno } from "./date.js";
import { blocchiDelGiorno } from "./modello.js";
import { carica, salva, chiediPersistenza } from "./archivio.js";
import { disegnaTimeline, minutoAlTocco, PX_MINUTO } from "./giornata.js";
import { attivaTrascinamento } from "./trascina.js";
import { apriModuloBlocco } from "./modulo-blocco.js";
import { apriImpostazioni, applicaAspetto } from "./impostazioni.js";
import { messaggio } from "./foglio.js";

// ---------- Stato in memoria ----------

let stato = carica();          // tutti i dati dell'agenda
let giorno = oggi();           // il giorno che sto guardando

// ---------- Elementi della pagina ----------

const elTestataGiorno = document.querySelector("#testata-giorno");
const elTestataData = document.querySelector("#testata-data");
const elSettimana = document.querySelector("#settimana");
const elTimeline = document.querySelector("#timeline");
const elAvviso = document.querySelector("#avviso");

// ---------- Disegno ----------

function disegna() {
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
    if (blocchiDelGiorno(stato, g).length > 0) classi.push("pieno");
    const nome = GIORNI[daGiorno(g).getDay()];
    html += `
      <button class="${classi.join(" ")}" data-giorno="${g}" aria-label="${nome} ${descrivi(g).numero}">
        <span class="sigla">${nome.slice(0, 3)}</span>
        <span class="numero numeri">${descrivi(g).numero}</span>
      </button>`;
  }
  elSettimana.innerHTML = html;

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
};

function nuovoBlocco(inizio) {
  // Senza un orario indicato propongo la prossima mezz'ora (oggi) o le 9:00
  if (inizio === undefined) {
    inizio = giorno === oggi() ? Math.ceil((minutiAdesso() + 1) / 30) * 30 : 540;
  }
  inizio = Math.max(0, Math.min(inizio, 1380));
  apriModuloBlocco(stato, { data: giorno, inizio, fine: inizio + 60 }, azioniBlocco);
}

// ---------- Tocchi ----------

document.querySelector("#giorno-prima").addEventListener("click", () => vaiA(aggiungiGiorni(giorno, -1)));
document.querySelector("#giorno-dopo").addEventListener("click", () => vaiA(aggiungiGiorni(giorno, 1)));

elSettimana.addEventListener("click", (evento) => {
  const pulsante = evento.target.closest("button[data-giorno]");
  if (pulsante) vaiA(pulsante.dataset.giorno);
});

document.querySelector("#vai-oggi").addEventListener("click", () => {
  vaiA(oggi());
  scorriAllOra();
});

document.querySelector("#aggiungi").addEventListener("click", () => nuovoBlocco());

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
  });
});

// Tocco sulla timeline: su un blocco lo apro, su uno spazio vuoto ne creo uno lì
elTimeline.addEventListener("click", (evento) => {
  const elemento = evento.target.closest(".blocco");
  if (elemento) {
    const blocco = stato.blocchi.find((b) => b.id === elemento.dataset.id);
    if (blocco) apriModuloBlocco(stato, blocco, azioniBlocco);
    return;
  }
  const minuto = minutoAlTocco(elTimeline, evento.clientY);
  nuovoBlocco(Math.floor(minuto / 30) * 30);
});

// Pressione lunga + trascinamento: sposta il blocco mantenendone la durata
attivaTrascinamento(elTimeline, (id, nuovoInizio) => {
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
  navigator.serviceWorker.register("./sw.js").catch((errore) => {
    console.warn("Service worker non registrato.", errore);
  });
}
