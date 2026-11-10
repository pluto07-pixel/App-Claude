# PROGRESSI

Agenda personale con obiettivo di studio adattivo. Questo file serve a riprendere il lavoro in una nuova sessione.

## Stato attuale

**Fase 1 completata** (10 novembre 2026). L'app si apre, mostra la giornata, salva i dati, funziona offline e si può installare.

Cosa funziona:
- vista giornata: timeline verticale, linea dell'ora attuale, striscia della settimana, frecce giorno prima/dopo, pulsante Oggi;
- blocchi: creazione (pulsante + oppure tocco su un orario vuoto), modifica, eliminazione in due tocchi, stato pianificato/fatto/saltato, spostamento ad altro giorno;
- trascinamento: pressione lunga (circa 0,4 s) e poi movimento verticale, a scatti di 15 minuti;
- sovrapposizioni permesse: i blocchi si affiancano e compare un avviso;
- backup: esporta (pannello Condividi su iPhone) e importa JSON, con conferma;
- PWA: manifest, icone, service worker, font inclusi;
- aspetto: accento (ottone/acciaio) e titoli (serif/sans sottile) si cambiano da "Altro".

## Decisioni prese

- HTML, CSS e JavaScript senza framework, con moduli ES (`import`/`export`).
- Dati in `localStorage`, chiave `agenda.dati`, un unico oggetto JSON con campo `versione`.
- Orari come minuti dalla mezzanotte, giorni come stringhe `AAAA-MM-GG`.
- Disegno: a ogni modifica si ricostruisce l'HTML della timeline dallo stato.
- Service worker "prima la copia, poi l'aggiornamento": una modifica pubblicata si vede alla seconda apertura. Quando cambia l'elenco dei file va aumentata `VERSIONE` in `sw.js`.
- Pubblicazione e backup anticipati alla fase 1 (richiesta di Davide).
- Si costruiscono tutte e 12 le funzionalità (richiesta di Davide), una fase per sessione.
- Telefono di riferimento: iPhone 14.
- Font: Inter e Cormorant Garamond, ridotti ai caratteri latini (`fonts/`).

## Da decidere

- Accento e titoli definitivi (per ora ottone + serif; si provano dall'app o da `stile.html`).
- Fase 4: il recupero può far superare il massimo di 6 ore?
- Fase 10: notifiche su iPhone (senza server non sono affidabili).

## Struttura

```
index.html            pagina dell'app
stile.html            pagina di prova dello stile
manifest.webmanifest  dati per l'installazione
sw.js                 service worker (offline)
css/base.css          variabili, font, regole generali
css/componenti.css    testata, timeline, blocchi, foglio, pulsanti
js/app.js             avvio, stato in memoria, tocchi
js/modello.js         forma dei dati e funzioni pure
js/date.js            giorni e orari
js/archivio.js        localStorage e backup
js/giornata.js        disegno della timeline
js/trascina.js        pressione lunga e trascinamento
js/foglio.js          pannello dal basso e messaggi
js/modulo-blocco.js   modulo nuovo/modifica blocco
js/impostazioni.js    foglio "Altro"
```

## Fasi

1. ~~Stile, struttura, dati, vista giornata, trascinamento, backup, PWA, pubblicazione~~
2. Lezioni ricorrenti ed eccezioni sulla singola occorrenza **(prossima)**
3. Attività periodiche fisse e flessibili
4. Obiettivo adattivo con test, barra, recupero parziale, modalità sessione
5. Modalità focus con registrazione automatica
6. Esami, conto alla rovescia, simulatore della media
7. Inserimento rapido testuale e pianificazione automatica
8. Rituali, abitudini, revisione settimanale
9. Statistiche
10. Extra: .ics e notifiche

## Come provarla sul computer

I moduli JavaScript non funzionano aprendo `index.html` con un doppio clic: serve un piccolo server.
Dalla cartella del progetto: `python -m http.server 8000`, poi aprire `http://localhost:8000`.
