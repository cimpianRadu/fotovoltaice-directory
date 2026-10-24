// Seriile graficului pe săptămâni, comune paginii (server) și graficului (client):
// o valoare exportată dintr-un fișier 'use client' nu se poate citi pe server.

export type SeriesKey = 'cereri' | 'revendicari' | 'oferte';

export interface WeekPoint {
  start: string;
  label: string;
  partial: boolean;
  cereri: number;
  revendicari: number;
  oferte: number;
}

// Primele trei sloturi ale paletei de referință (dataviz), validate pe toate
// perechile pe fundal alb. Verdele are contrast sub 3:1: de-aia etichetele de la
// capătul liniilor și tabelul de sub grafic.
export const SERIES: { key: SeriesKey; label: string; color: string }[] = [
  { key: 'cereri', label: 'Cereri', color: '#2a78d6' },
  { key: 'revendicari', label: 'Revendicări', color: '#eb6834' },
  { key: 'oferte', label: 'Oferte trimise', color: '#1baf7a' },
];
