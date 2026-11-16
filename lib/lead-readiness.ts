// „Gata de ofertă”: cererea la care o firmă poate trimite azi o ofertă cu șanse
// reale, după ce a declarat clientul în formular (13 nov 2026).
//
// De ce: firmele au spus-o direct, „cereri slabe, oameni nehotărâți”. Pe cele
// 244 de cereri valide de la 1 septembrie, 43% așteptau un program (AFM
// baterii, Casa Verde) și 33% se informau sau voiau montajul peste 3 luni, iar
// firmele le ocoleau deja singure: 0,26 revendicări pe cerere la cele care
// așteaptă un program, față de 1,39 la cele cu bani proprii și „cât mai
// repede”. Toate cele 3 lucrări câștigate veneau din grupul al doilea. Trimise
// toate pe același email, cele dintâi le îngroapă pe celelalte.
//
// Regula folosește doar ce e deja obligatoriu în formular (finanțarea și
// termenul), nu un scor: cu 3 câștiguri nu avem cu ce valida un număr.
//
//  - bani proprii sau credit, cu montajul „cât mai repede” sau în 1-3 luni;
//  - cererile comerciale, mereu: sunt puține (13 de la 1 septembrie), au fost
//    revendicate toate și finanțarea lor nu se judecă la fel.
//
// Ce NU e aici: cererea trecută pe „sunt gata” de client mai târziu. Alerta ei
// pleacă pe drumul ei (lib/informez, lib/confirmare-activa) și nu trece prin
// regula asta.
//
// Fără importuri: o folosesc ruta de cereri, cronul și paginile de admin.

const OWN_MONEY = new Set(['fonduri-proprii', 'credit']);
const SOON = new Set(['cat-mai-repede', '1-3-luni']);

export function isReadyLead(l: { finantare?: string; termen?: string; segment?: string }): boolean {
  if ((l.segment || '').trim().toLowerCase() === 'comercial') return true;
  return hasReadyAnswers(l);
}

/**
 * Doar răspunsurile clientului: bani proprii sau credit și montajul în cel mult
 * 3 luni. E eticheta „Gata de ofertă” de pe cardul din /cereri și filtrul ei
 * (16 nov 2026, ca etichetele Bark: un fapt declarat, nu un scor). Fără
 * scurtătura pentru comerciale de la alerte: pe card, eticheta trebuie să spună
 * exact ce a răspuns omul.
 */
export function hasReadyAnswers(l: { finantare?: string; termen?: string }): boolean {
  return OWN_MONEY.has((l.finantare || '').trim()) && SOON.has((l.termen || '').trim());
}

/**
 * Din ce zi alerta pe județ pleacă doar pe cererile gata de ofertă. Folosită
 * numai la afișarea din /admin: o cerere mai veche fără alertă are alt motiv
 * (nimeni abonat pe județ, înainte de alerte), nu regula asta.
 */
export const READY_ALERTS_FROM = '2026-11-13';
