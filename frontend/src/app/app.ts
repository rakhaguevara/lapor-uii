import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/toast/toast';

// Komponen paling luar. Isinya "slot" tempat halaman ditampilkan sesuai alamat URL,
// dan tempat notifikasi singkat (toast) yang dipakai semua halaman.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  template: '<router-outlet /><app-toast />',
})
export class App {}
