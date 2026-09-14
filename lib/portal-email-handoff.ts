/**
 * Cheia de sessionStorage prin care ecranul de confirmare al revendicării
 * (app/cereri/LeadCard.tsx) pasează emailul firmei formularului de login din
 * portal, fără să-l pună în URL — un `?email=` ar ajunge în pageview-ul Umami
 * și în logurile serverului.
 *
 * Trăiește într-un fișier separat ca să nu tragă /cereri după el nimic din
 * portal și invers: e o singură constantă, partajată de două componente client.
 */
export const PORTAL_EMAIL_KEY = 'portal_login_email';
