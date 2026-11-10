// ============================================================
// SERVICE WORKER — un piccolo programma che il browser tiene tra
// l'app e la rete. Serve a far funzionare l'app senza connessione.
//
// Strategia ("prima la copia, poi l'aggiornamento"):
//  1. all'installazione scarico tutti i file dell'app in una memoria (cache);
//  2. a ogni richiesta rispondo subito con la copia in cache: l'app si apre
//     all'istante e funziona offline;
//  3. intanto, se c'è rete, scarico la versione nuova e aggiorno la cache.
//     Conseguenza: una modifica pubblicata si vede alla SECONDA apertura.
//
// Se cambio l'elenco dei file, aumento il numero in VERSIONE.
// ============================================================

const VERSIONE = "agenda-3";

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
  "js/schermo-focus.js",
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
    caches.open(VERSIONE).then((cache) => cache.addAll(FILE)).then(() => self.skipWaiting())
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
      const dallaRete = fetch(richiesta)
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
