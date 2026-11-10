// ============================================================
// MODULO BLOCCO — il foglio per creare o modificare un blocco.
// ============================================================

import { TIPI, STATI, creaBlocco, controllaBlocco } from "./modello.js";
import { inOrario, daOrario } from "./date.js";
import { apriFoglio, chiudiFoglio, collegaScelta } from "./foglio.js";
import { pulisci } from "./giornata.js";

// stato:   lo stato dell'app (serve per l'elenco delle materie)
// blocco:  il blocco da modificare, oppure una bozza { data, inizio, fine } per uno nuovo
// azioni:  { salva(blocco), elimina(id) } — cosa fare quando l'utente conferma
export function apriModuloBlocco(stato, blocco, azioni) {
  const nuovo = !blocco.id;
  const tipo = blocco.tipo || "studio";
  const stile = (scelto) => (scelto ? ' class="scelto"' : "");

  const foglio = apriFoglio(`
    <h2 class="titolo">${nuovo ? "Nuovo blocco" : "Modifica blocco"}</h2>

    <div class="campo">
      <span class="etichetta">Tipo</span>
      <div class="segmenti" id="scelta-tipo">
        ${TIPI.map((t) => `<button type="button" data-valore="${t.id}"${stile(t.id === tipo)}>${t.nome}</button>`).join("")}
      </div>
    </div>

    <div class="campo" id="campo-materia">
      <span class="etichetta">Materia</span>
      <div class="materie" id="scelta-materia">
        ${stato.materie.map((m) => `
          <button type="button" data-valore="${m.id}" style="--colore:${m.colore}"${stile(m.id === blocco.materiaId)}>
            ${pulisci(m.sigla)}
          </button>`).join("")}
      </div>
    </div>

    <label class="campo">
      <span class="etichetta" id="etichetta-titolo">Titolo</span>
      <input type="text" id="campo-titolo" maxlength="60" autocomplete="off" value="${pulisci(blocco.titolo || "")}">
    </label>

    <div class="due-colonne">
      <label class="campo">
        <span class="etichetta">Inizio</span>
        <input type="time" id="campo-inizio" step="300" value="${inOrario(blocco.inizio)}">
      </label>
      <label class="campo">
        <span class="etichetta">Fine</span>
        <input type="time" id="campo-fine" step="300" value="${inOrario(Math.min(blocco.fine, 1439))}">
      </label>
    </div>

    <label class="campo">
      <span class="etichetta">Giorno</span>
      <input type="date" id="campo-giorno" value="${blocco.data}">
    </label>

    ${nuovo ? "" : `
    <div class="campo">
      <span class="etichetta">Stato</span>
      <div class="segmenti" id="scelta-stato">
        ${STATI.map((s) => `<button type="button" data-valore="${s.id}"${stile(s.id === blocco.stato)}>${s.nome}</button>`).join("")}
      </div>
    </div>`}

    <p class="errore" id="errore" role="alert"></p>

    <div class="azioni">
      ${nuovo ? "" : `<button type="button" class="pulsante pericolo" id="elimina">Elimina</button>`}
      <button type="button" class="pulsante discreto" id="annulla">Annulla</button>
      <button type="button" class="pulsante principale" id="salva">${nuovo ? "Aggiungi" : "Salva"}</button>
    </div>
  `);

  const cerca = (selettore) => foglio.querySelector(selettore);

  // La materia serve solo per lo studio: la nascondo per gli altri tipi
  function mostraPerTipo(tipoScelto) {
    cerca("#campo-materia").hidden = tipoScelto !== "studio";
    cerca("#etichetta-titolo").textContent =
      tipoScelto === "studio" ? "Argomento (facoltativo)" : "Titolo";
  }
  const leggiTipo = collegaScelta(cerca("#scelta-tipo"), mostraPerTipo);
  const leggiMateria = collegaScelta(cerca("#scelta-materia"));
  const leggiStato = nuovo ? () => "pianificato" : collegaScelta(cerca("#scelta-stato"));
  mostraPerTipo(tipo);

  // Se sposto l'inizio, la fine lo segue mantenendo la stessa durata
  let durata = blocco.fine - blocco.inizio;
  cerca("#campo-inizio").addEventListener("change", () => {
    const inizio = daOrario(cerca("#campo-inizio").value);
    if (inizio === null) return;
    cerca("#campo-fine").value = inOrario(Math.min(inizio + durata, 1439));
  });
  cerca("#campo-fine").addEventListener("change", () => {
    const inizio = daOrario(cerca("#campo-inizio").value);
    const fine = daOrario(cerca("#campo-fine").value);
    if (inizio !== null && fine !== null && fine > inizio) durata = fine - inizio;
  });

  cerca("#annulla").addEventListener("click", () => chiudiFoglio());

  cerca("#salva").addEventListener("click", () => {
    const tipoScelto = leggiTipo();
    const campi = {
      data: cerca("#campo-giorno").value,
      inizio: daOrario(cerca("#campo-inizio").value),
      fine: daOrario(cerca("#campo-fine").value),
      tipo: tipoScelto,
      materiaId: tipoScelto === "studio" ? leggiMateria() : null,
      titolo: cerca("#campo-titolo").value,
      stato: leggiStato(),
    };
    // Per un blocco esistente tengo lo stesso id, per uno nuovo ne creo uno
    const risultato = nuovo ? creaBlocco(campi) : { ...creaBlocco(campi), id: blocco.id };
    const errore = controllaBlocco(risultato);
    if (errore) {
      cerca("#errore").textContent = errore;
      return;
    }
    azioni.salva(risultato);
    chiudiFoglio();
  });

  // Eliminare richiede due tocchi: il primo chiede conferma
  if (!nuovo) {
    const elimina = cerca("#elimina");
    elimina.addEventListener("click", () => {
      if (!elimina.classList.contains("conferma")) {
        elimina.classList.add("conferma");
        elimina.textContent = "Conferma";
        return;
      }
      azioni.elimina(blocco.id);
      chiudiFoglio();
    });
  }
}
