// ============================================================
// FOGLIO — il pannello che sale dal basso (modifica di un blocco,
// impostazioni) e il breve messaggio di conferma.
// C'è un solo foglio aperto alla volta.
// ============================================================

let aperto = null;   // { velo, foglio } del foglio visibile, oppure null

// Apre un foglio con l'HTML dato e restituisce l'elemento,
// così chi lo chiama può collegare i pulsanti che contiene.
export function apriFoglio(html) {
  chiudiFoglio(true);

  const velo = document.createElement("div");
  velo.className = "velo";
  const foglio = document.createElement("div");
  foglio.className = "foglio";
  foglio.setAttribute("role", "dialog");
  foglio.setAttribute("aria-modal", "true");
  foglio.innerHTML = html;
  document.body.append(velo, foglio);

  velo.addEventListener("click", () => chiudiFoglio());

  // Aggiungo la classe al fotogramma successivo: così il browser vede
  // prima lo stato "chiuso" e poi anima il passaggio ad "aperto".
  requestAnimationFrame(() => {
    velo.classList.add("aperto");
    foglio.classList.add("aperto");
  });

  document.body.style.overflow = "hidden";   // la pagina sotto non scorre
  aperto = { velo, foglio };
  return foglio;
}

// subito = true: toglie il foglio senza animazione
export function chiudiFoglio(subito = false) {
  if (!aperto) return;
  const { velo, foglio } = aperto;
  aperto = null;
  document.body.style.overflow = "";
  velo.classList.remove("aperto");
  foglio.classList.remove("aperto");
  const togli = () => { velo.remove(); foglio.remove(); };
  if (subito) togli();
  else setTimeout(togli, 260);   // aspetto la fine dell'animazione
}

// Messaggio breve che compare e sparisce da solo
let timerMessaggio = null;
export function messaggio(testo) {
  let elemento = document.querySelector(".messaggio");
  if (!elemento) {
    elemento = document.createElement("div");
    elemento.className = "messaggio";
    elemento.setAttribute("role", "status");
    document.body.append(elemento);
  }
  elemento.textContent = testo;
  requestAnimationFrame(() => elemento.classList.add("visibile"));
  clearTimeout(timerMessaggio);
  timerMessaggio = setTimeout(() => elemento.classList.remove("visibile"), 2200);
}

// Collega una scelta "a segmenti": al tocco di un pulsante lo evidenzia
// e chiama alCambio(valore). Restituisce una funzione che legge il valore scelto.
export function collegaScelta(contenitore, alCambio) {
  contenitore.addEventListener("click", (evento) => {
    const pulsante = evento.target.closest("button[data-valore]");
    if (!pulsante) return;
    for (const altro of contenitore.querySelectorAll("button")) {
      altro.classList.toggle("scelto", altro === pulsante);
    }
    if (alCambio) alCambio(pulsante.dataset.valore);
  });
  return () => {
    const scelto = contenitore.querySelector("button.scelto");
    return scelto ? scelto.dataset.valore : null;
  };
}
