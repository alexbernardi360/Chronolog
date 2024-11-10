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
  {
    path: 'error',
    children: [
      {
        path: '404',
        loadComponent: () =>
          import('./routes/errors/not-found.component').then(
            (c) => c.NotFoundComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'error/404',
    pathMatch: 'full',
  },
];
