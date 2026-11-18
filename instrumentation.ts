import type { Instrumentation } from 'next';
import { alertError } from '@/lib/alert';

/**
 * Orice eroare de server pe care n-o prinde nimeni (pagini, rute API,
 * middleware) ajunge aici și pleacă pe email prin `lib/alert.ts`.
 * Erorile prinse în `catch` nu trec pe aici: acolo se cheamă `alertError`
 * direct (vezi /api/chat, /api/leads). Fișier identic în cele trei proiecte.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const e = err instanceof Error ? err : new Error(String(err));
  const digest = (err as { digest?: string })?.digest;
  // Fără query string: linkurile private au token-ul în ?k=.
  const path = request.path.split('?')[0];
  await alertError({
    area: 'request',
    kind: `${context.routeType}:${context.routePath}:${e.name}`,
    message: `${request.method} ${context.routePath}: ${e.message}`.slice(0, 200),
    details: {
      path,
      routeType: context.routeType,
      renderSource: context.renderSource,
      digest,
      stack: e.stack?.split('\n').slice(0, 8).join('\n'),
    },
  });
};
