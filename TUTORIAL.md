# Tutorial: installare l'agenda su iPhone e collegare "Non disturbare"

## 1. Pubblicare l'app (una volta sola, dal computer)

1. Apri `https://github.com/pluto07-pixel/App-Claude` e vai in **Settings**.
2. In fondo alla pagina, sezione **Danger Zone**: **Change repository visibility** → **Change to public** e conferma. Con l'account gratuito GitHub Pages funziona solo sui repository pubblici. Diventa pubblico il codice, non i tuoi dati: quelli restano sul telefono.
3. Nel menu a sinistra apri **Pages**. In **Build and deployment**: Source **Deploy from a branch**, Branch **main**, cartella **/ (root)**, poi **Save**.
4. Aspetta un paio di minuti e ricarica la pagina: in alto compare l'indirizzo del sito, `https://pluto07-pixel.github.io/App-Claude/`.

## 2. Installare l'app su iPhone

1. Apri l'indirizzo con **Safari** (non con Chrome o da dentro un'altra app).
2. Tocca **Condividi** (il quadrato con la freccia) → **Aggiungi alla schermata Home** → **Aggiungi**.
3. Da ora apri l'agenda **solo dall'icona sulla Home**. L'app installata e la pagina in Safari hanno due archivi separati: i blocchi inseriti in una non compaiono nell'altra.
4. Aprila una volta con la rete attiva: da quel momento funziona anche offline.

## 3. Creare il comando rapido "Agenda Focus"

Una pagina web non può attivare Non disturbare. Può però far eseguire un comando dell'app **Comandi Rapidi**, e il comando sì. Va creato una volta. I nomi delle azioni possono cambiare leggermente tra le versioni di iOS: cercale con la barra di ricerca.

1. Apri **Comandi Rapidi** → **+** in alto a destra.
2. Tocca il nome in alto → **Rinomina** → scrivi esattamente `Agenda Focus` (A e F maiuscole, uno spazio).
3. Cerca e aggiungi l'azione **Se**. Tocca il primo campo e scegli **Input comando rapido**; lascia la condizione **presenta qualsiasi valore**. Se sotto compare una riga vuota "Condizione", toglila con il tondino **−** a destra.
4. Cerca **Modifica data** e trascinala subito sotto "Se", prima di "Altrimenti". Impostala così: **Aggiungi** [numero] **minuti** a [data].
   - Tieni premuto sul numero → scegli la variabile **Input comando rapido**.
   - Unità: **minuti**.
   - Tocca la data → scegli **Data attuale**.
5. Cerca **Imposta full immersion** e mettila sotto "Modifica data", sempre prima di "Altrimenti". Impostala su **Attiva** **Non disturbare** fino a **Ora**.
   - Tieni premuto sull'orario → scegli la variabile **Data modificata**.
6. Aggiungi un'altra **Imposta full immersion** sotto "Altrimenti", prima di "Fine del blocco se". Impostala su **Disattiva** **Non disturbare**.
7. Tocca la freccia in alto a sinistra per uscire: il comando si salva da solo.

Il comando finito si legge così:

```
Se  Input comando rapido  presenta qualsiasi valore
    Aggiungi  Input comando rapido  minuti a  Data attuale
    Attiva Non disturbare fino a  Data modificata
Altrimenti
    Disattiva Non disturbare
Fine del blocco "se"
```

L'agenda passa al comando i minuti rimanenti quando deve attivare Non disturbare, e non passa nulla quando deve spegnerlo.

## 4. Collegarlo all'agenda

1. Apri l'agenda → **Altro** → sezione **Focus**.
2. Tocca **Prova**. Si apre Comandi Rapidi; la prima volta iPhone può chiedere un permesso: consenti.
3. Controlla che in alto compaia la mezzaluna di Non disturbare e che dopo un minuto sparisca da sola. Se non sparisce, toccala e guarda l'orario di fine: se manca, ricontrolla il punto 5 qui sopra.
4. Torna all'agenda e imposta **Non disturbare durante il focus** su **Sì**.

## 5. Usare il focus

1. Crea un blocco di studio (pulsante **+**), poi toccalo → **Avvia focus**.
2. iPhone passa a Comandi Rapidi per attivare Non disturbare fino alla fine del blocco. Torna all'agenda toccando **◀ Agenda** in alto a sinistra.
3. Lo schermo resta acceso sul timer. Se esci dall'app o blocchi lo schermo, al rientro vedi quanto sei stato via; quel tempo non viene contato, a meno che tocchi **Conta come studio** (utile se hai bloccato il telefono per studiare sulla carta).
4. Alla fine prevista il focus si chiude da solo e Non disturbare si spegne da solo.
5. **Termina** → **Salva e chiudi** registra il tempo fatto fin lì; **Annulla il focus** non registra nulla. In entrambi i casi l'agenda riapre Comandi Rapidi per spegnere Non disturbare.

In **Altro → Focus** scegli tra focus libero e a cicli (per esempio 50 minuti di studio e 10 di pausa).

## 6. Aggiornamenti e backup

- Quando l'app viene aggiornata, la versione nuova compare alla **seconda** apertura: chiudila dal selettore delle app e riaprila due volte.
- Ogni tanto fai **Altro → Esporta** e salva il file in File o iCloud. Se elimini l'icona dalla Home, i dati vengono cancellati.
