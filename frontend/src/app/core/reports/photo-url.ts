// Alamat foto dari backend bisa berupa alamat penuh (http/https) atau jalur relatif (/storage/..., storage/...).
// Jalur relatif diarahkan ke server backend (bukan ke Vercel, yang tidak punya file itu), dan http diubah ke https
// supaya tidak diblokir browser sebagai konten campuran di halaman https.
const BACKEND = 'https://backend-sira-production.up.railway.app';

export function photoSrc(raw: unknown): string {
  const url = typeof raw === 'string' ? raw.trim() : '';
  if (!url) return '';
  if (/^(blob:|data:)/.test(url) || url.startsWith('/samples/')) return url; // /samples = foto contoh milik frontend
  if (/^https?:\/\//i.test(url)) {
    try {
      const u = new URL(url);
      // Backend kadang menulis alamat localhost/IP internal (APP_URL salah): ganti ke alamat backend asli.
      if (/^(localhost|127\.|0\.0\.0\.0)/.test(u.hostname) || u.hostname.endsWith('.railway.internal')) {
        return BACKEND + u.pathname + u.search;
      }
      if (u.protocol === 'http:' && u.hostname.endsWith('.up.railway.app')) u.protocol = 'https:';
      return u.toString();
    } catch {
      return url;
    }
  }
  return BACKEND + (url.startsWith('/') ? url : '/' + url);
}
