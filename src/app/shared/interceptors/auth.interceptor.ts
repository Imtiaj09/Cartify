import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly unauthenticatedEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh'
  ];

  constructor(private readonly authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getAccessToken();

    if (!token || this.isUnauthenticatedEndpoint(req.url)) {
      return next.handle(req);
    }

    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next.handle(authReq);
  }

  private isUnauthenticatedEndpoint(url: string): boolean {
    return this.unauthenticatedEndpoints.some((endpoint) => url.includes(endpoint));
  }
}
