import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

export const unauthGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.isAuthenticated()) ? router.navigate(['/home']) : true;
};
