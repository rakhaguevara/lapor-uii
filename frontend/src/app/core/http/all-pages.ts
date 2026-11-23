import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

// Backend membagi daftar per halaman (15 baris, tidak semua endpoint menghormati per_page).
// Ambil halaman pertama, lalu sisanya sekaligus, dan gabungkan jadi satu larik. Bentuk data lain (larik biasa) dikembalikan apa adanya.
export async function allPages<T = any>(http: HttpClient, url: string, params: Record<string, string> = {}): Promise<T[]> {
  const first: any = await firstValueFrom(http.get(url, { params }));
  const d = first?.data;
  if (Array.isArray(d)) return d as T[];
  const out: T[] = Array.isArray(d?.data) ? [...d.data] : [];
  const last = Math.min(Number(d?.last_page) || 1, 30);
  if (last > 1) {
    const rest = await Promise.all(
      Array.from({ length: last - 1 }, (_, i) => firstValueFrom(http.get<any>(url, { params: { ...params, page: String(i + 2) } }))),
    );
    for (const r of rest) if (Array.isArray(r?.data?.data)) out.push(...r.data.data);
  }
  return out;
}
