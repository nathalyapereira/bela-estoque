import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/theme.service';
import { ThemeSwitcherComponent } from '../../../shared/components/theme-switcher/theme-switcher/theme-switcher.component';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[]; // undefined = todos podem ver
  badge?: number; // notificações/alertas
}
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    ThemeSwitcherComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private auth = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private breakpoints = inject(BreakpointObserver);

  public readonly sidenavAberta = signal(true);
  readonly sidenavCompacta = signal(false); // modo rail (só ícones)

  public readonly isMobile = toSignal(
    this.breakpoints
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  constructor() {
    if (this.isMobile()) {
      this.sidenavAberta.set(false);
    }
  }

  readonly nomeUsuario = computed(() => this.auth.user()?.name || '');
  readonly isAdmin = computed(() => this.auth.user()?.role === 'admin');
  readonly userRole = computed(() => this.auth.user()?.role || 'user');

  readonly iniciaisUsuario = computed(() => {
    const nome = this.nomeUsuario();
    if (!nome) return '?';
    return nome
      .split(' ')
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  });

  readonly navPrincipal: NavItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
    },
    {
      label: 'Estoque',
      icon: 'inventory_2',
      route: '/estoque',
    },
    {
      label: 'Produtos',
      icon: 'category',
      route: '/produtos',
    },
    {
      label: 'Categorias',
      icon: 'label',
      route: '/categorias',
    },
    {
      label: 'Fornecedores',
      icon: 'local_shipping',
      route: '/fornecedores',
    },
    {
      label: 'Relatórios',
      icon: 'bar_chart',
      route: '/relatorios',
    },
  ];

  readonly navSecundaria: NavItem[] = [
    {
      label: 'Configurações',
      icon: 'settings',
      route: '/configuracoes',
      roles: ['admin'],
    },
    {
      label: 'Meu perfil',
      icon: 'person',
      route: '/perfil',
    },
  ];

  readonly navPrincipalFiltrada = computed(() =>
    this.navPrincipal.filter(
      (item) => !item.roles || item.roles.includes(this.userRole() ?? ''),
    ),
  );

  readonly navSecundariaFiltrada = computed(() =>
    this.navSecundaria.filter(
      (item) => !item.roles || item.roles.includes(this.userRole() ?? ''),
    ),
  );

  // -------------------------------------------------------------------------
  // Ações
  // -------------------------------------------------------------------------
  toggleSidenav(): void {
    if (this.isMobile()) {
      this.sidenavAberta.update((v) => !v);
    } else {
      this.sidenavCompacta.update((v) => !v);
    }
  }

  fecharSidenavMobile(): void {
    if (this.isMobile()) {
      this.sidenavAberta.set(false);
    }
  }

  logout(): void {
    this.auth.logout().subscribe();
  }
}
