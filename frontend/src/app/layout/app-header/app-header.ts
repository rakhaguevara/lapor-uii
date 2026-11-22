import { Component, ElementRef, HostListener, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../../shared/icon/icon';

/*
  HEADER KUNING (dipakai Landing, Login, dan Shell)
  Kiri: logo + nama sistem. Kanan:
    - sudah login  -> pil profil (nama, peran) dengan menu "Keluar"
    - belum login  -> tombol "Masuk" (disembunyikan di halaman login lewat showLogin=false)
*/
@Component({
  selector: 'app-header',
  imports: [RouterLink, Icon],
  template: `
    <header class="bar" [class.compact]="!loggedIn()">
      <a class="brand" [routerLink]="loggedIn() ? '/beranda' : '/'" aria-label="UII SIRA, ke halaman utama">
        <img src="logo-uii.png" alt="" width="38" height="42">
        <span>
          <strong>UII SIRA</strong>
          <small>Sistem Informasi Respons Area</small>
        </span>
      </a>

      @if (loggedIn()) {
        <div class="menu-wrap">
          <button class="pill" type="button" aria-haspopup="menu" [attr.aria-expanded]="open()" (click)="open.set(!open())">
            <span class="avatar" aria-hidden="true"></span>
            <span class="who">
              <strong><span class="d-only">{{ user().name }}</span><span class="m-only">{{ firstName() }}</span></strong>
              <small>{{ user().role }}</small>
            </span>
            <app-icon name="chevron" [size]="18" [stroke]="2" />
          </button>
          @if (open()) {
            <div class="dropdown" role="menu">
              <button type="button" role="menuitem" (click)="logout()">Keluar</button>
            </div>
          }
        </div>
      } @else if (showLogin()) {
        <a class="pill login" routerLink="/login">Masuk <app-icon name="chevron" [size]="16" [stroke]="2.4" class="rot" /></a>
      }
    </header>
  `,
  styles: `
    :host { display: block; position: sticky; top: 0; z-index: 20; }
    .bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; height: var(--header-h); padding: 0 32px 0 40px; background: var(--yellow); }
    .bar.compact { height: 108px; padding-right: 50px; }
    .brand { display: flex; align-items: center; gap: 12px; color: var(--black); }
    .brand img { width: 38px; height: 42px; object-fit: contain; }
    .brand strong { display: block; font-size: 15px; font-weight: 700; line-height: 1.3; }
    .brand small { display: block; font-size: 12px; line-height: 1.3; color: var(--amber); }

    .menu-wrap { position: relative; }
    .pill { display: inline-flex; align-items: center; gap: 10px; height: 42px; padding: 0 12px 0 8px; border: 0; border-radius: var(--r-pill); background: var(--white); box-shadow: var(--shadow-pill); cursor: pointer; color: var(--black); }
    .avatar { width: 27px; height: 27px; border-radius: 50%; background: #d9d9d9; flex: none; }
    .who { display: flex; flex-direction: column; text-align: left; line-height: 1.2; }
    .who strong { font-size: 10px; font-weight: 600; }
    .who small { font-size: 9px; color: var(--muted); }
    .pill app-icon { color: var(--muted); }
    .pill.login { height: 41px; gap: 8px; padding: 0 12px 0 14px; font-size: 15px; font-weight: 500; }
    .rot { transform: rotate(-90deg); }
    .dropdown { position: absolute; right: 0; top: calc(100% + 8px); min-width: 160px; padding: 6px; border: 1px solid var(--line); border-radius: 12px; background: var(--white); box-shadow: 0 8px 24px rgb(20 36 62 / 16%); }
    .dropdown button { width: 100%; min-height: 40px; padding: 0 12px; border: 0; border-radius: 8px; background: none; text-align: left; font-size: 14px; font-weight: 500; cursor: pointer; }
    .dropdown button:hover { background: var(--bg); }

    @media (max-width: 800px) {
      .bar, .bar.compact { height: 68px; padding: 0 17px 0 22px; }
      .brand { gap: 8px; }
      .brand img { width: 26px; height: 29px; }
      .brand strong { font-size: 12px; }
      .brand small { font-size: 9.5px; }
      .pill { height: 32px; gap: 6px; padding: 0 8px 0 6px; }
      .avatar { width: 20px; height: 20px; }
      .pill.login { height: 32px; padding: 0 12px 0 16px; font-size: 14px; }
      .who strong { font-size: 10.5px; }
      .who small { font-size: 8.5px; }
    }
  `,
})
export class AppHeader {
  private auth = inject(AuthService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  showLogin = input(true);
  loggedIn = this.auth.loggedIn;
  user = this.auth.user;
  firstName = computed(() => this.auth.user().name.split(' ')[0]);
  open = signal(false);

  // Klik di luar menu atau tekan Esc menutup menu
  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!this.host.nativeElement.contains(e.target)) this.open.set(false);
  }
  @HostListener('document:keydown.escape')
  onEsc(): void { this.open.set(false); }

  logout(): void {
    this.open.set(false);
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
