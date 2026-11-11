// ============================================================
// SERVICE WORKER — un piccolo programma che il browser tiene tra
// l'app e la rete. Serve a far funzionare l'app senza connessione.
//
// Strategia ("prima la copia, poi l'aggiornamento"):
//  1. all'installazione scarico tutti i file dell'app in una memoria (cache);
//  2. a ogni richiesta rispondo subito con la copia in cache: l'app si apre
//     all'istante e funziona offline;
//  3. intanto, se c'è rete, scarico la versione nuova e aggiorno la cache.
//
// Quando pubblico una versione nuova aumento VERSIONE: il browser si accorge
// che questo file è cambiato, installa il nuovo service worker e la pagina
// (vedi in fondo a js/app.js) si ricarica da sola con i file nuovi.
//
// Se cambio l'elenco dei file, aumento il numero in VERSIONE.
// ============================================================

const VERSIONE = "agenda-6";

const FILE = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/base.css",
  "css/componenti.css",
  "js/app.js",
  "js/archivio.js",
  "js/date.js",
  "js/focus.js",
  "js/foglio.js",
  "js/giornata.js",
  "js/impostazioni.js",
  "js/modello.js",
  "js/modulo-blocco.js",
  "js/obiettivi.js",
  "js/ricorrenze.js",
  "js/schermo-focus.js",
  "js/settimana-tipo.js",
  "js/statistiche.js",
  "js/tempo.js",
  "js/trascina.js",
  "fonts/Inter.ttf",
  "fonts/CormorantGaramond.ttf",
  "icone/icona-180.png",
  "icone/icona-192.png",
  "icone/icona-512.png",
];

// Installazione: scarico tutto
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(VERSIONE)
      // cache: "reload" = scarica davvero dal sito. Senza, il browser potrebbe restituire
      // una copia vecchia di qualche minuto dalla SUA memoria e l'aggiornamento non si vedrebbe.
      .then((cache) => cache.addAll(FILE.map((file) => new Request(file, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

// Attivazione: elimino le cache delle versioni precedenti
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== VERSIONE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Ogni richiesta dell'app passa di qui
self.addEventListener("fetch", (evento) => {
  const richiesta = evento.request;
  if (richiesta.method !== "GET" || !richiesta.url.startsWith(self.location.origin)) return;

  evento.respondWith(
    caches.open(VERSIONE).then(async (cache) => {
      const copia = await cache.match(richiesta, { ignoreSearch: true });
      const dallaRete = fetch(richiesta, { cache: "no-cache" })   // chiede sempre al sito se c'è di nuovo
        .then((risposta) => {
          if (risposta.ok) cache.put(richiesta, risposta.clone());
          return risposta;
        })
        .catch(() => copia);   // senza rete resta la copia
      // Se ho la copia rispondo subito e lascio che l'aggiornamento finisca in sottofondo
      if (copia) {
        evento.waitUntil(dallaRete);
        return copia;
      }
      return dallaRete;
    })
  );
});
