// ============================================================
// IMPOSTAZIONI — il foglio "Altro": aspetto e backup.
// ============================================================

import { apriFoglio, chiudiFoglio, collegaScelta, messaggio } from "./foglio.js";
import { esporta, importa } from "./archivio.js";
import { oggi, descrivi } from "./date.js";
import { lanciaComando, NOME_COMANDO } from "./schermo-focus.js";

// Applica alla pagina l'accento e il carattere dei titoli scelti
export function applicaAspetto(impostazioni) {
  document.documentElement.dataset.accento = impostazioni.accento;
  document.documentElement.dataset.titoli = impostazioni.titoli;
}

// stato:  lo stato dell'app
// azioni: { cambiaImpostazioni(modifiche), sostituisciStato(nuovoStato), apriSettimanaTipo() }
export function apriImpostazioni(stato, azioni) {
  const imp = stato.impostazioni;
  const stile = (scelto) => (scelto ? ' class="scelto"' : "");
  let testoBackup = "Nessun backup esportato finora.";
  if (imp.ultimoBackup) {
    const d = descrivi(imp.ultimoBackup);
    testoBackup = `Ultimo backup: ${d.numero} ${d.mese} ${d.anno}.`;
  }

  const foglio = apriFoglio(`
    <h2 class="titolo">Altro</h2>

    <button type="button" class="pulsante largo accento" id="settimana-tipo">Settimana tipo: lezioni e attività</button>

    <div class="campo">
      <span class="etichetta">Accento</span>
      <div class="segmenti" id="scelta-accento">
        <button type="button" data-valore="ottone"${stile(imp.accento === "ottone")}>Ottone</button>
        <button type="button" data-valore="acciaio"${stile(imp.accento === "acciaio")}>Acciaio</button>
      </div>
    </div>

    <div class="campo">
      <span class="etichetta">Titoli</span>
      <div class="segmenti" id="scelta-titoli">
        <button type="button" data-valore="serif"${stile(imp.titoli === "serif")}>Serif</button>
        <button type="button" data-valore="sans"${stile(imp.titoli === "sans")}>Sans sottile</button>
      </div>
    </div>

    <div class="separatore"></div>

    <div class="campo">
      <span class="etichetta">Focus</span>
      <div class="segmenti" id="scelta-modalita">
        <button type="button" data-valore="libera"${stile(imp.focusModalita !== "cicli")}>Libero</button>
        <button type="button" data-valore="cicli"${stile(imp.focusModalita === "cicli")}>A cicli</button>
      </div>
    </div>
    <div class="due-colonne" id="campi-cicli">
      <label class="campo">
        <span class="etichetta">Studio (min)</span>
        <input type="number" id="ciclo-studio" inputmode="numeric" min="10" max="120" value="${imp.cicloStudio}">
      </label>
      <label class="campo">
        <span class="etichetta">Pausa (min)</span>
        <input type="number" id="ciclo-pausa" inputmode="numeric" min="1" max="60" value="${imp.cicloPausa}">
      </label>
    </div>
    <div class="campo">
      <span class="etichetta">Non disturbare durante il focus</span>
      <div class="segmenti" id="scelta-nd">
        <button type="button" data-valore="no"${stile(!imp.nonDisturbare)}>No</button>
        <button type="button" data-valore="si"${stile(imp.nonDisturbare)}>Sì</button>
      </div>
      <p class="nota">Richiede il comando rapido "${NOME_COMANDO}" (vedi TUTORIAL.md). "Prova" attiva Non disturbare per un minuto.</p>
      <div class="azioni" style="margin-top:12px">
        <button type="button" class="pulsante" id="prova-nd">Prova</button>
        <button type="button" class="pulsante" id="spegni-nd">Disattiva</button>
      </div>
    </div>

    <div class="separatore"></div>

    <span class="etichetta">Backup</span>
    <p class="nota" id="nota-backup">${testoBackup}</p>
    <p class="nota">I dati vivono solo su questo telefono. Esporta un backup ogni tanto e conservalo in File o iCloud.</p>
    <div class="azioni">
      <button type="button" class="pulsante" id="esporta">Esporta</button>
      <button type="button" class="pulsante" id="importa">Importa</button>
    </div>
    <input type="file" id="file-backup" accept=".json,application/json" hidden>
    <p class="errore" id="errore-backup" role="alert" style="margin-top:12px"></p>

    <div class="azioni">
      <button type="button" class="pulsante largo discreto" id="chiudi">Chiudi</button>
    </div>
  `);

  const cerca = (selettore) => foglio.querySelector(selettore);

  collegaScelta(cerca("#scelta-accento"), (valore) => azioni.cambiaImpostazioni({ accento: valore }));
  collegaScelta(cerca("#scelta-titoli"), (valore) => azioni.cambiaImpostazioni({ titoli: valore }));
  cerca("#chiudi").addEventListener("click", () => chiudiFoglio());
  cerca("#settimana-tipo").addEventListener("click", () => azioni.apriSettimanaTipo());

  // Focus: modalità, durata dei cicli, Non disturbare
  const mostraCicli = (modalita) => { cerca("#campi-cicli").hidden = modalita !== "cicli"; };
  mostraCicli(imp.focusModalita);
  collegaScelta(cerca("#scelta-modalita"), (valore) => {
    azioni.cambiaImpostazioni({ focusModalita: valore });
    mostraCicli(valore);
  });
  // Legge un numero da un campo e lo tiene tra un minimo e un massimo
  const collegaNumero = (selettore, chiave, minimo, massimo) => {
    cerca(selettore).addEventListener("change", (evento) => {
      let valore = Math.round(Number(evento.target.value));
      if (!Number.isFinite(valore)) valore = minimo;
      valore = Math.max(minimo, Math.min(valore, massimo));
      evento.target.value = valore;
      azioni.cambiaImpostazioni({ [chiave]: valore });
    });
  };
  collegaNumero("#ciclo-studio", "cicloStudio", 10, 120);
  collegaNumero("#ciclo-pausa", "cicloPausa", 1, 60);
  collegaScelta(cerca("#scelta-nd"), (valore) => azioni.cambiaImpostazioni({ nonDisturbare: valore === "si" }));
  cerca("#prova-nd").addEventListener("click", () => lanciaComando("1"));
  cerca("#spegni-nd").addEventListener("click", () => lanciaComando("off"));

  cerca("#esporta").addEventListener("click", async () => {
    const esito = await esporta(stato);
    if (esito === "annullato") return;
    azioni.cambiaImpostazioni({ ultimoBackup: oggi() });
    cerca("#nota-backup").textContent = "Ultimo backup: oggi.";
    messaggio("Backup esportato");
  });

  // Importare sostituisce tutti i dati, quindi avviene in due tocchi:
  // il primo apre il selettore di file, il secondo (dopo aver letto il file) conferma.
  const campoFile = cerca("#file-backup");
  let inAttesa = null;   // lo stato letto dal file, in attesa di conferma

  cerca("#importa").addEventListener("click", () => {
    if (!inAttesa) {
      campoFile.click();
      return;
    }
    azioni.sostituisciStato(inAttesa);
    chiudiFoglio();
    messaggio("Backup importato");
  });

  campoFile.addEventListener("change", async () => {
    const file = campoFile.files[0];
    campoFile.value = "";
    if (!file) return;
    try {
      inAttesa = await importa(file);
      cerca("#errore-backup").textContent = "";
      const pulsante = cerca("#importa");
      pulsante.textContent = `Sostituisci (${inAttesa.blocchi.length} blocchi)`;
      pulsante.classList.add("pericolo", "conferma");
    } catch (errore) {
      cerca("#errore-backup").textContent = errore.message;
    }
  });
}
