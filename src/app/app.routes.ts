import { Routes } from '@angular/router';
import { authGuard } from './core/providers/auth.guard';
import { unauthGuard } from './core/providers/unauth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./routes/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    canActivate: [unauthGuard],
    loadComponent: () =>
      import('./routes/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
];
