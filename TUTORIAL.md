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

## 6. Lezioni fisse e impegni periodici

Tutto parte da **Altro → Settimana tipo: lezioni e attività**.

**Lezioni.** Tocca **+ Lezione**, scegli materia, aula, giorno della settimana, orario e periodo ("Vale dal" e "Fino al": inizio e fine delle lezioni del semestre). Una materia con lezione in due giorni diversi va inserita due volte, una per giorno. Il periodo viene riproposto da solo alla lezione successiva. Da quel momento la lezione compare in ogni giorno corrispondente.

**Attività fisse** (giorno e orario precisi, es. padel il giovedì 18:00–19:30). Tocca **+ Attività fissa**: nome, giorno, orario. "Fino al" è facoltativo: senza data vale sempre.

**Attività flessibili** (frequenza settimanale senza giorno fisso, es. palestra 3 volte). Tocca **+ Attività flessibile**: nome, volte a settimana, durata. Nella schermata principale compare un contatore, per esempio "Palestra 1/3". Toccalo nel giorno in cui vuoi andarci: si apre un blocco già compilato, scegli l'orario e conferma. I blocchi segnati "saltato" non vengono contati.

**Cambiare una sola volta.** Tocca la lezione o l'attività sulla timeline:
- **Annulla solo questa volta**: resta una piccola etichetta "annullata" da cui puoi ripristinarla;
- **Sposta**: cambi giorno e orario di quella sola occorrenza (oppure tienila premuta e trascinala);
- **Ripristina l'orario normale**: toglie la modifica;
- **Modifica tutta la serie**: cambia la regola per tutte le settimane.

## 7. Obiettivi giornalieri

Apri **Obiettivi** nella barra in basso → **+ Obiettivo**.

1. **Cosa misura.** "Studio" conta da solo tutto lo studio a casa (blocchi di studio segnati fatti e tempo di focus; le lezioni non contano). "Altra attività" conta i blocchi e le attività con lo stesso nome dell'obiettivo, più il tempo che aggiungi a mano.
2. **Nome.** Per esempio Studio, Lettura.
3. **Valore per ogni giorno della settimana.** Scrivi una durata in ogni campo: `2h`, `1h30`, `45m`. Campo vuoto = nessun obiettivo quel giorno. "Uguale ogni giorno" riempie tutti i campi in una volta.

Gli obiettivi del giorno compaiono sopra la timeline con una barra di avanzamento. Toccandone uno puoi:
- **aggiungere tempo fatto** (+15 min, +30 min, +1h, oppure "Completa"), utile per la lettura serale;
- **cambiare l'obiettivo solo per quel giorno**, senza toccare i valori settimanali, e ripristinarlo.

## 8. Statistiche

Apri **Statistiche** nella barra in basso. Scegli **Settimana** o **Mese** e scorri i periodi con le frecce. Trovi: tempo totale registrato, dove va il tempo (studio a casa, lezioni, palestra, padel, lettura...), studio giorno per giorno (tocca una colonna per il valore), studio a casa e lezioni per materia, obiettivi raggiunti, focus.

Cosa viene contato:
- **studio a casa**: il tempo di focus, oppure la durata dei blocchi di studio segnati **fatto**;
- **altri blocchi** (palestra, commissioni, tempo libero): solo se segnati **fatto**;
- **lezioni e attività fisse**: da sole, una volta passate. Se non ci sei andato, annullale per quel giorno;
- **tempo aggiunto a mano** su un obiettivo.

Un blocco lasciato su "pianificato" non conta: per avere statistiche vere, segna i blocchi come fatti o saltati.

## 9. Aggiornamenti e backup

- Gli aggiornamenti arrivano da soli: all'apertura l'app controlla se c'è una versione nuova e si ricarica. Per forzare il controllo: **Altro → Cerca aggiornamenti**. Il numero di versione è scritto lì accanto.
- Ogni tanto fai **Altro → Esporta** e salva il file in File o iCloud. Se elimini l'icona dalla Home, i dati vengono cancellati.
