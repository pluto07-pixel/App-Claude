// ============================================================
// GIORNATA — disegna la timeline verticale di un giorno.
//
// Come funziona il disegno in tutta l'app: non modifico i singoli
// pezzi della pagina uno per uno. Ogni volta che i dati cambiano
// ricostruisco l'HTML della timeline partendo dallo stato. È meno
// "furbo" ma molto più semplice: lo schermo è sempre una funzione dei dati.
// ============================================================

import { inOrario, minutiAdesso, oggi } from "./date.js";
import { blocchiDelGiorno, disponi, titoloDi, coloreDi } from "./modello.js";

// Scala verticale: quanti pixel vale un minuto
export const PX_MINUTO = 1.1;

// Sostituisce i caratteri speciali dell'HTML, così un titolo scritto
// dall'utente (es. "<b>") viene mostrato come testo e non interpretato.
export function pulisci(testo) {
  return String(testo).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

// Da che ora a che ora mostrare la timeline: la giornata impostata,
// allargata alle ore intere e ai blocchi che dovessero uscirne.
export function intervallo(stato, blocchi) {
  let da = stato.impostazioni.inizioGiornata;
  let a = stato.impostazioni.fineGiornata;
  for (const blocco of blocchi) {
    da = Math.min(da, blocco.inizio);
    a = Math.max(a, blocco.fine);
  }
  return { da: Math.floor(da / 60) * 60, a: Math.ceil(a / 60) * 60 };
}

// Costruisce la timeline dentro "contenitore"
export function disegnaTimeline(contenitore, stato, giorno) {
  const blocchi = blocchiDelGiorno(stato, giorno);
  const { da, a } = intervallo(stato, blocchi);
  const altezza = (a - da) * PX_MINUTO;

  let html = "";

  // Righe delle ore
  for (let minuti = da; minuti <= a; minuti += 60) {
    const y = (minuti - da) * PX_MINUTO;
    html += `<div class="ora" style="top:${y}px"><span class="numeri">${inOrario(minuti % 1440)}</span></div>`;
  }

  // Blocchi
  html += `<div class="area-blocchi" data-da="${da}" data-a="${a}">`;
  let sovrapposti = 0;
  for (const { blocco, colonna, colonne } of disponi(blocchi)) {
    const durata = blocco.fine - blocco.inizio;
    const classi = ["blocco", blocco.stato];
    if (durata < 40) classi.push("corto");
    if (colonne > 1) { classi.push("sovrapposto"); sovrapposti++; }
    const stile = [
      `top:${(blocco.inizio - da) * PX_MINUTO}px`,
      `height:${Math.max(durata * PX_MINUTO - 2, 18)}px`,
      `left:${(colonna / colonne) * 100}%`,
      `width:calc(${100 / colonne}% - 3px)`,
      `--colore:${coloreDi(stato, blocco)}`,
    ].join(";");
    html += `
      <button class="${classi.join(" ")}" style="${stile}"
              data-id="${blocco.id}" data-inizio="${blocco.inizio}" data-fine="${blocco.fine}">
        <span class="blocco-titolo">${pulisci(titoloDi(stato, blocco))}</span>
        <span class="blocco-orario numeri">${inOrario(blocco.inizio)} – ${inOrario(blocco.fine)}</span>
      </button>`;
  }
  if (blocchi.length === 0) {
    html += `<p class="vuoto" style="top:${Math.min(altezza / 2, 260)}px">Giornata vuota. Tocca un orario per aggiungere un blocco.</p>`;
  }
  html += `</div>`;

  // Linea dell'ora attuale, solo se sto guardando oggi
  if (giorno === oggi()) {
    const adesso = minutiAdesso();
    if (adesso >= da && adesso <= a) {
      html += `<div class="adesso" style="top:${(adesso - da) * PX_MINUTO}px"></div>`;
    }
  }

  contenitore.style.height = `${altezza}px`;
  contenitore.innerHTML = html;
  return { da, a, sovrapposti };
}

// Dato un punto toccato sullo schermo (coordinata verticale), a che minuto corrisponde?
export function minutoAlTocco(contenitore, clientY) {
  const area = contenitore.querySelector(".area-blocchi");
  const riquadro = area.getBoundingClientRect();
  return Number(area.dataset.da) + (clientY - riquadro.top) / PX_MINUTO;
}
