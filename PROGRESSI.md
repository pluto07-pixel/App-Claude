# PROGRESSI

Agenda personale con obiettivo di studio adattivo. Questo file serve a riprendere il lavoro in una nuova sessione.

## Stato attuale

**Fasi 1 e 5 completate** (10 novembre 2026). L'app mostra la giornata, salva i dati, funziona offline, si può installare e ha la modalità focus.

Cosa funziona:
- vista giornata: timeline verticale, linea dell'ora attuale, striscia della settimana, frecce giorno prima/dopo, pulsante Oggi;
- blocchi: creazione (pulsante + oppure tocco su un orario vuoto), modifica, eliminazione in due tocchi, stato pianificato/fatto/saltato, spostamento ad altro giorno;
- trascinamento: pressione lunga (circa 0,4 s) e poi movimento verticale, a scatti di 15 minuti;
- sovrapposizioni permesse: i blocchi si affiancano e compare un avviso;
- backup: esporta (pannello Condividi su iPhone) e importa JSON, con conferma;
- PWA: manifest, icone, service worker, font inclusi;
- aspetto: accento (ottone/acciaio) e titoli (serif/sans sottile) si cambiano da "Altro";
- focus: timer a schermo intero avviato da un blocco di studio, libero o a cicli, studio effettivo registrato in `stato.sessioni`, uscite dall'app registrate (non contate, salvo scelta), schermo tenuto acceso;
- Non disturbare: all'avvio e alla chiusura anticipata l'app lancia il comando rapido "Agenda Focus" (istruzioni in `TUTORIAL.md`).

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
- Focus anticipato rispetto all'ordine delle fasi (richiesta di Davide). Il tempo si calcola dagli istanti salvati, non contando i secondi, perché iPhone sospende i timer in secondo piano.
- Non disturbare passa da Comandi Rapidi (`shortcuts://run-shortcut`): il comando riceve i minuti rimanenti oppure "off". Alla fine prevista non serve nulla, iPhone lo spegne da solo.
- Il blocco schermo è indistinguibile dall'uscita dall'app: per questo al rientro c'è "Conta come studio".

## Da decidere

- Accento e titoli definitivi (per ora ottone + serif; si provano dall'app o da `stile.html`).
- Fase 4: il recupero può far superare il massimo di 6 ore?
- Fase 10: notifiche su iPhone (senza server non sono affidabili).
- Da verificare su iPhone vero: trascinamento, pannello Condividi, lancio del comando rapido dall'app installata.

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
js/focus.js           calcoli del focus (funzioni pure)
js/schermo-focus.js   timer a schermo intero, uscite, Non disturbare
js/foglio.js          pannello dal basso e messaggi
js/modulo-blocco.js   modulo nuovo/modifica blocco
js/impostazioni.js    foglio "Altro"
test/focus.test.mjs   prove del focus: node test/focus.test.mjs
TUTORIAL.md           installazione su iPhone e comando rapido
```

## Fasi

1. ~~Stile, struttura, dati, vista giornata, trascinamento, backup, PWA, pubblicazione~~
2. Lezioni ricorrenti ed eccezioni sulla singola occorrenza **(prossima)**
3. Attività periodiche fisse e flessibili
4. Obiettivo adattivo con test, barra, recupero parziale, modalità sessione
5. ~~Modalità focus con registrazione automatica e Non disturbare~~
6. Esami, conto alla rovescia, simulatore della media
7. Inserimento rapido testuale e pianificazione automatica
8. Rituali, abitudini, revisione settimanale
9. Statistiche
10. Extra: .ics e notifiche

## Come provarla sul computer

I moduli JavaScript non funzionano aprendo `index.html` con un doppio clic: serve un piccolo server.
Dalla cartella del progetto: `python -m http.server 8000`, poi aprire `http://localhost:8000`.
