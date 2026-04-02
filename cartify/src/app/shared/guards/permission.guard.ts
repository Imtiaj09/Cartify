import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AdminPermissionKey, AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const requiredPermission = route.data.requiredPermission as AdminPermissionKey | undefined;

    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          return this.router.createUrlTree(['/shop/login'], { queryParams: { returnUrl: state.url } });
        }

        if (!requiredPermission) {
          return true;
        }

        if (this.authService.hasPermission(requiredPermission, user)) {
          return true;
        }

        return this.router.parseUrl('/admin/dashboard');
      })
    );
  }
}
