// ============================================================
// TRASCINA — sposta un blocco tenendolo premuto e muovendo il dito.
//
// Il problema su touch: lo stesso gesto (dito che scorre in verticale)
// serve anche a scorrere la pagina. La soluzione classica è la
// "pressione lunga": se tengo fermo il dito per circa 0,4 s il blocco
// si "stacca" e da lì il movimento sposta il blocco invece della pagina.
// Se invece muovo subito il dito, è uno scorrimento normale.
// ============================================================

import { inOrario } from "./date.js";
import { PX_MINUTO } from "./giornata.js";

const ATTESA = 380;       // millisecondi di pressione prima di staccare il blocco
const TOLLERANZA = 8;     // pixel di movimento ammessi durante l'attesa
const PASSO = 15;         // il blocco scatta di 15 minuti in 15 minuti
const BORDO = 130;        // vicino ai bordi dello schermo la pagina scorre da sola

// contenitore: l'elemento .timeline
// alRilascio(id, nuovoInizio): chiamata quando il blocco viene lasciato in un orario diverso
export function attivaTrascinamento(contenitore, alRilascio) {
  let presa = null;            // informazioni sul blocco premuto in questo momento
  let ignoraProssimoTocco = false;

  contenitore.addEventListener("pointerdown", (evento) => {
    const elemento = evento.target.closest(".blocco");
    if (!elemento || evento.button > 0) return;
    const inizio = Number(elemento.dataset.inizio);
    presa = {
      elemento,
      puntatore: evento.pointerId,
      inizio,
      nuovoInizio: inizio,
      durata: Number(elemento.dataset.fine) - inizio,
      // posizione di partenza nella pagina (schermo + scorrimento)
      partenza: evento.clientY + window.scrollY,
      y: evento.clientY,
      attiva: false,
      timer: setTimeout(stacca, ATTESA),
    };
  });

  function stacca() {
    if (!presa) return;
    presa.attiva = true;
    presa.elemento.classList.add("trascinato");
    // "cattura": da ora gli eventi del dito arrivano a questo elemento anche se esce dai bordi
    try { presa.elemento.setPointerCapture(presa.puntatore); } catch {}
    requestAnimationFrame(passo);
  }

  // Eseguita a ogni fotogramma finché il blocco è staccato
  function passo() {
    if (!presa || !presa.attiva) return;
    if (presa.y < BORDO) window.scrollBy(0, -7);
    else if (presa.y > window.innerHeight - BORDO) window.scrollBy(0, 7);
    aggiornaPosizione();
    requestAnimationFrame(passo);
  }

  function aggiornaPosizione() {
    const area = contenitore.querySelector(".area-blocchi");
    const da = Number(area.dataset.da);
    const a = Number(area.dataset.a);
    const spostamento = (presa.y + window.scrollY - presa.partenza) / PX_MINUTO;
    let nuovo = presa.inizio + Math.round(spostamento / PASSO) * PASSO;
    nuovo = Math.max(da, Math.min(nuovo, a - presa.durata));   // resta dentro la timeline
    if (nuovo === presa.nuovoInizio) return;
    presa.nuovoInizio = nuovo;
    presa.elemento.style.top = `${(nuovo - da) * PX_MINUTO}px`;
    const orario = presa.elemento.querySelector(".blocco-orario");
    if (orario) orario.textContent = `${inOrario(nuovo)} – ${inOrario(nuovo + presa.durata)}`;
  }

  contenitore.addEventListener("pointermove", (evento) => {
    if (!presa || evento.pointerId !== presa.puntatore) return;
    presa.y = evento.clientY;
    // Mi sono mosso prima dello stacco: è uno scorrimento, lascio perdere
    if (!presa.attiva && Math.abs(evento.clientY + window.scrollY - presa.partenza) > TOLLERANZA) {
      annulla();
    }
  });

  // Mentre trascino impedisco alla pagina di scorrere.
  // { passive: false } serve perché di norma il browser non permette
  // di bloccare lo scorrimento da dentro un evento touch.
  contenitore.addEventListener("touchmove", (evento) => {
    if (presa && presa.attiva) evento.preventDefault();
  }, { passive: false });

  contenitore.addEventListener("pointerup", (evento) => {
    if (!presa || evento.pointerId !== presa.puntatore) return;
    const { attiva, elemento, inizio, nuovoInizio } = presa;
    annulla();
    if (!attiva) return;                // tocco breve: ci pensa il normale "click"
    ignoraProssimoTocco = true;         // il rilascio non deve aprire il foglio di modifica
    setTimeout(() => { ignoraProssimoTocco = false; }, 80);
    if (nuovoInizio !== inizio) alRilascio(elemento.dataset.id, nuovoInizio);
  });

  contenitore.addEventListener("pointercancel", () => {
    if (!presa) return;
    const { attiva, elemento, inizio } = presa;
    annulla();
    if (attiva) alRilascio(elemento.dataset.id, inizio);   // rimetto tutto com'era
  });

  // Intercetto il click prima degli altri (fase di "cattura") per scartarlo dopo un trascinamento
  contenitore.addEventListener("click", (evento) => {
    if (!ignoraProssimoTocco) return;
    ignoraProssimoTocco = false;
    evento.stopPropagation();
    evento.preventDefault();
  }, true);

  // Niente menu contestuale sulla pressione lunga
  contenitore.addEventListener("contextmenu", (evento) => {
    if (evento.target.closest(".blocco")) evento.preventDefault();
  });

  function annulla() {
    if (!presa) return;
    clearTimeout(presa.timer);
    presa.elemento.classList.remove("trascinato");
    presa = null;
  }
}
