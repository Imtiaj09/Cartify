import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService, UserRole } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    const expectedRoles = this.extractExpectedRolesFromSnapshot(route);
    return this.authorizeByRole(state.url, expectedRoles);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const expectedRoles = this.extractExpectedRolesFromSnapshot(childRoute);
    return this.authorizeByRole(state.url, expectedRoles);
  }

  canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> {
    const requestedUrl = `/${segments.map((segment) => segment.path).join('/')}`;
    const expectedRoles = this.extractExpectedRolesFromRoute(route);

    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          this.router.navigate(['/shop/login'], { queryParams: { returnUrl: requestedUrl } });
          return false;
        }

        if (expectedRoles.length > 0 && !expectedRoles.includes(user.role)) {
          this.router.navigateByUrl(this.authService.getDefaultRouteForRole(user.role));
          return false;
        }

        return true;
      })
    );
  }

  private authorizeByRole(url: string, expectedRoles: UserRole[]): Observable<boolean | UrlTree> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          return this.router.createUrlTree(['/shop/login'], { queryParams: { returnUrl: url } });
        }

        if (expectedRoles.length > 0 && !expectedRoles.includes(user.role)) {
          return this.router.parseUrl(this.authService.getDefaultRouteForRole(user.role));
        }

        return true;
      })
    );
  }

  private extractExpectedRolesFromSnapshot(route: ActivatedRouteSnapshot): UserRole[] {
    let cursor: ActivatedRouteSnapshot | null = route;

    while (cursor) {
      const roles = this.normalizeExpectedRoles(cursor.data?.expectedRoles);

      if (roles.length > 0) {
        return roles;
      }

      cursor = cursor.parent;
    }

    return [];
  }

  private extractExpectedRolesFromRoute(route: Route): UserRole[] {
    return this.normalizeExpectedRoles(route.data?.expectedRoles);
  }

  private normalizeExpectedRoles(value: unknown): UserRole[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((role): role is UserRole => (
      role === 'Super Admin' ||
      role === 'Sub Admin' ||
      role === 'Customer'
    ));
  }
}
