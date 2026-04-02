import { Injectable } from '@angular/core';

// This is a mock service to stand in for a real ToastrService like ngx-toastr.
// It helps resolve dependency injection errors during development when the
// full library isn't set up.

@Injectable({
  providedIn: 'root'
})
export class MockToastrService {
  success(message: string, title?: string): void {
    console.log(`Toastr Success: ${title || ''}`, message);
  }

  error(message: string, title?: string): void {
    console.error(`Toastr Error: ${title || ''}`, message);
  }

  info(message: string, title?: string): void {
    console.log(`Toastr Info: ${title || ''}`, message);
  }

  warning(message: string, title?: string): void {
    console.warn(`Toastr Warning: ${title || ''}`, message);
  }
}
