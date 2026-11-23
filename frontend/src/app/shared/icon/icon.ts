import { Component, computed, input } from '@angular/core';

// Kumpulan ikon garis (viewBox 24). Satu tempat, jadi tidak perlu pustaka ikon.
// Pakai: <app-icon name="plus" [size]="20" />  (ikon dekoratif, disembunyikan dari pembaca layar)
const PATHS = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  plus: 'M12 5v14M5 12h14',
  list: 'M5 8h14M5 12h14M5 16h14',
  ring: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  thumb: 'M7 22V11M2 13v7a2 2 0 0 0 2 2h13.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3H14V5a3 3 0 0 0-3-3l-4 9',
  edit: 'M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 11v6M14 11v6',
  sort: 'M8 20V5M4 9l4-4 4 4M16 4v15M12 15l4 4 4-4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  chevron: 'm6 9 6 6 6-6',
  upload: 'M12 19V5M5 12l7-7 7 7',
  check: 'm4 12.5 5 5L20 6.5',
  right: 'M5 12h14M13 6l6 6-6 6',
  left: 'M19 12H5M11 6l-6 6 6 6',
  chart: 'M4 20V10M10 20V4M16 20v-8M22 20H2',
  building: 'M4 21V4h10v17M14 9h6v12M8 8h2M8 12h2M8 16h2M3 21h18',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22',
  users:'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 20v-2a4 4 0 0 0-3-3.9M16 4.1a4 4 0 0 1 0 7.8',
} as const;

export type IconName = keyof typeof PATHS;

@Component({
  selector: 'app-icon',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" [attr.stroke-width]="stroke()" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: `:host { display: inline-flex; flex: none; } svg { display: block; }`,
})
export class Icon {
  name = input.required<IconName>();
  size = input(20);
  stroke = input(1.8);
  path = computed(() => PATHS[this.name()]);
}
