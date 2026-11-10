// ============================================================
// ARCHIVIO — legge e scrive i dati sul telefono (localStorage)
// e gestisce il backup in un file JSON.
//
// localStorage è un piccolo magazzino chiave -> testo offerto dal
// browser. Salvo tutto lo stato come un unico testo JSON.
// ============================================================

import { statoIniziale, controllaStato, aggiorna } from "./modello.js";
import { oggi } from "./date.js";

const CHIAVE = "agenda.dati";

// Legge i dati salvati. Se non ce ne sono (o sono illeggibili) parte da zero.
export function carica() {
  try {
    const testo = localStorage.getItem(CHIAVE);
    if (!testo) return statoIniziale();
    const stato = JSON.parse(testo);
    if (controllaStato(stato)) return statoIniziale();
    return aggiorna(stato);
  } catch (errore) {
    console.warn("Dati non leggibili, riparto da zero.", errore);
    return statoIniziale();
  }
}

// Scrive i dati. Restituisce false se il telefono rifiuta (spazio pieno, modalità privata).
export function salva(stato) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(stato));
    return true;
  } catch (errore) {
    console.warn("Salvataggio non riuscito.", errore);
    return false;
  }
}

// Chiede al browser di non cancellare i dati quando lo spazio scarseggia.
// Non è una garanzia: per questo esiste il backup.
export function chiediPersistenza() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

// ---------- Backup ----------

// Prepara il file di backup e lo consegna.
// Su iPhone apro il pannello "Condividi" (da lì: Salva su File, AirDrop, Mail...);
// dove non esiste, scarico il file come un normale download.
// Restituisce "condiviso", "scaricato" oppure "annullato".
export async function esporta(stato) {
  const testo = JSON.stringify(stato, null, 2);
  const nome = `agenda-backup-${oggi()}.json`;
  const file = new File([testo], nome, { type: "application/json" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Backup agenda" });
      return "condiviso";
    } catch (errore) {
      if (errore.name === "AbortError") return "annullato";
      // qualunque altro problema: provo con il download qui sotto
    }
  }

  const indirizzo = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = indirizzo;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(indirizzo), 1000);
  return "scaricato";
}

// Legge un file di backup scelto dall'utente.
// Restituisce lo stato pronto all'uso, oppure lancia un errore con un messaggio chiaro.
export async function importa(file) {
  let stato;
  try {
    stato = JSON.parse(await file.text());
  } catch {
    throw new Error("Il file non è un backup valido.");
  }
  const errore = controllaStato(stato);
  if (errore) throw new Error(errore);
  return aggiorna(stato);
}
