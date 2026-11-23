import { registerLocaleData } from '@angular/common';
import localeId from '@angular/common/locales/id';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { mockInterceptor } from './core/mock/mock-api';
import { apiUrlInterceptor } from './core/http/api-url.interceptor';

// Daftarkan bahasa Indonesia agar tanggal tampil "18 Nov 2026", bukan versi Inggris
registerLocaleData(localeId);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, mockInterceptor, apiUrlInterceptor])),
    { provide: LOCALE_ID, useValue: 'id' },
  ],
};
