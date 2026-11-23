import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Menambahkan alamat backend di depan setiap permintaan yang diawali /api.
// Saat pengembangan apiUrl kosong (proxy yang meneruskan); saat produksi berisi alamat Railway.
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) =>
  req.url.startsWith('/api/') ? next(req.clone({ url: environment.apiUrl + req.url })) : next(req);
