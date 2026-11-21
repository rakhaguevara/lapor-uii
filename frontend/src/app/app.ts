import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Komponen paling luar. Isinya hanya "slot" tempat halaman ditampilkan sesuai alamat URL.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
