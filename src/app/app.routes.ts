import { Routes } from '@angular/router';
import { authGuard } from './core/providers/auth.guard';
import { unauthGuard } from './core/providers/unauth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./routes/home/home.component').then((m) => m.HomeComponent),
      },

      // #region Errors
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
      // #endregion
    ],
  },

  // #region Login
  {
    path: 'login',
    canActivate: [unauthGuard],
    loadComponent: () =>
      import('./routes/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  // #endregion

  // #region Fallback
  {
    path: '**',
    redirectTo: 'error/404',
    pathMatch: 'full',
  },
  // #endregion
];
