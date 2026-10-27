'use client';

import { useEffect, useState, type ComponentProps } from 'react';
import Input from './Input';

// Câmpul de telefon din toate formularele (27 oct 2026). Verificarea e cea din
// lib/phone (libphonenumber-js), încărcată când apare câmpul, nu cu pagina.
// Greșeala apare sub câmp după ce omul iese din el și e pusă și ca validare
// nativă (setCustomValidity), deci oprește trimiterea ca orice câmp obligatoriu.
// Serverul verifică la fel, pentru un formular vechi din cache.

/** Verifică un câmp de telefon și pune greșeala pe el. '' = bun sau gol (golul îl prinde `required`). */
export async function checkPhoneInput(input: unknown): Promise<string> {
  if (!(input instanceof HTMLInputElement)) return '';
  let msg = '';
  if (input.value.trim()) {
    const { cleanPhone, PHONE_ERROR } = await import('@/lib/phone');
    if (!cleanPhone(input.value)) msg = PHONE_ERROR;
  }
  input.setCustomValidity(msg);
  return msg;
}

/**
 * La trimitere: verifică telefonul formularului și, dacă e greșit, arată bula
 * pe câmp. Fără asta, un click pe buton imediat după tastare ar trimite
 * formularul înainte ca verificarea de la ieșirea din câmp să se termine.
 */
export async function phoneInputOk(form: HTMLFormElement): Promise<boolean> {
  const input = form.elements.namedItem('telefon');
  if (!(await checkPhoneInput(input))) return true;
  (input as HTMLInputElement).reportValidity();
  return false;
}

type PhoneInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'inputMode'>;

export default function PhoneInput({ onChange, onBlur, error, autoComplete = 'tel', ...props }: PhoneInputProps) {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void import('@/lib/phone');
  }, []);

  async function check(el: EventTarget) {
    setMsg(await checkPhoneInput(el));
  }

  return (
    <Input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete={autoComplete}
      onChange={(e) => {
        onChange?.(e);
        // Odată arătată, greșeala dispare pe loc când numărul devine bun.
        if (msg) void check(e.target);
      }}
      onBlur={(e) => {
        onBlur?.(e);
        void check(e.target);
      }}
      error={error || msg || undefined}
    />
  );
}
