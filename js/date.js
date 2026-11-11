// ============================================================
// DATE — piccole funzioni su giorni e orari.
//
// Due convenzioni valgono in tutta l'app:
//  - un GIORNO è una stringa "AAAA-MM-GG" (es. "2026-11-10");
//  - un ORARIO è un numero intero: i minuti passati dalla mezzanotte
//    (15:00 -> 900). Durate e confronti diventano semplice aritmetica.
// ============================================================

export const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
export const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

// Aggiunge lo zero davanti: 7 -> "07"
function dueCifre(n) {
  return String(n).padStart(2, "0");
}

// Oggetto Date -> "AAAA-MM-GG" (usando l'ora locale del telefono)
export function inGiorno(data) {
  return `${data.getFullYear()}-${dueCifre(data.getMonth() + 1)}-${dueCifre(data.getDate())}`;
}

// "AAAA-MM-GG" -> oggetto Date a mezzogiorno.
// Mezzogiorno e non mezzanotte: così il cambio dell'ora legale
// non può far scivolare la data al giorno prima.
export function daGiorno(giorno) {
  const [anno, mese, numero] = giorno.split("-").map(Number);
  return new Date(anno, mese - 1, numero, 12);
}

export function oggi() {
  return inGiorno(new Date());
}

export function aggiungiGiorni(giorno, quanti) {
  const data = daGiorno(giorno);
  data.setDate(data.getDate() + quanti);
  return inGiorno(data);
}

// Il lunedì della settimana a cui appartiene il giorno
export function lunediDi(giorno) {
  const giornoSettimana = daGiorno(giorno).getDay(); // 0 = domenica
  const daLunedi = (giornoSettimana + 6) % 7;        // lunedì -> 0, domenica -> 6
  return aggiungiGiorni(giorno, -daLunedi);
}

// "2026-11-10" -> { nome: "Martedì", numero: 10, mese: "novembre" }
export function descrivi(giorno) {
  const data = daGiorno(giorno);
  return {
    nome: GIORNI[data.getDay()],
    numero: data.getDate(),
    mese: MESI[data.getMonth()],
    anno: data.getFullYear(),
  };
}

// 900 -> "15:00"
export function inOrario(minuti) {
  return `${dueCifre(Math.floor(minuti / 60))}:${dueCifre(minuti % 60)}`;
}

// "15:00" -> 900. Restituisce null se il testo non è un orario valido.
export function daOrario(testo) {
  const trovato = /^(\d{1,2}):(\d{2})$/.exec(testo || "");
  if (!trovato) return null;
  const ore = Number(trovato[1]);
  const min = Number(trovato[2]);
  if (ore > 24 || min > 59 || ore * 60 + min > 1440) return null;
  return ore * 60 + min;
}

// Minuti dalla mezzanotte in questo momento
export function minutiAdesso() {
  const ora = new Date();
  return ora.getHours() * 60 + ora.getMinutes();
}

// Arrotonda a multipli di "passo" minuti (15 di default)
export function arrotonda(minuti, passo = 15) {
  return Math.round(minuti / passo) * passo;
}

// 165 -> "2h45", 90 -> "1h30", 45 -> "45 min"
export function inDurata(minuti) {
  const ore = Math.floor(minuti / 60);
  const resto = minuti % 60;
  if (ore === 0) return `${resto} min`;
  return resto === 0 ? `${ore}h` : `${ore}h${dueCifre(resto)}`;
}

// Legge una durata scritta a mano e la trasforma in minuti.
// Accetta "2h", "1h30", "1:30", "1,5h", "45m", "45 min", "90".
// Un numero da solo vale ore se è piccolo (fino a 10) e minuti se è grande: "2" -> 2 ore, "90" -> 90 minuti.
// Testo vuoto -> 0. Testo non riconosciuto -> null.
export function daDurata(testo) {
  const t = String(testo || "").trim().toLowerCase().replace(",", ".");
  if (t === "") return 0;
  let trovato = /^(\d+(?:\.\d+)?)\s*h\s*(\d{1,2})?\s*(?:m|min)?$/.exec(t);
  if (trovato) return Math.round(Number(trovato[1]) * 60) + Number(trovato[2] || 0);
  trovato = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (trovato) return Number(trovato[1]) * 60 + Number(trovato[2]);
  trovato = /^(\d+)\s*(?:m|min)$/.exec(t);
  if (trovato) return Number(trovato[1]);
  trovato = /^(\d+)$/.exec(t);
  if (trovato) return Number(trovato[1]) <= 10 ? Number(trovato[1]) * 60 : Number(trovato[1]);
  return null;
}
