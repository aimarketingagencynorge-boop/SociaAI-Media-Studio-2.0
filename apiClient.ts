import { auth } from './firebase';

/** Every backend operation is bound to the signed-in Firebase user. */
export async function apiFetch(path: string, init: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Zaloguj się, aby połączyć się ze stacją AI.');
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');
  return fetch(path, { ...init, headers });
}
