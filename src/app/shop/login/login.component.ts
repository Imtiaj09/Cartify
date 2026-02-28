import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  submitted = false;
  error = '';
  loading = false;
  showPassword = false;
  private returnUrl: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    const currentUser = this.authService.currentUserValue;

    if (currentUser) {
      const redirectUrl = this.authService.getPostLoginRedirectUrl(
        currentUser,
        this.route.snapshot.queryParamMap.get('returnUrl')
      );
      this.router.navigateByUrl(redirectUrl);
    }
  }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(this.f.email.value, this.f.password.value)
      .subscribe({
        next: (user) => {
          const redirectUrl = this.authService.getPostLoginRedirectUrl(user, this.returnUrl);
          this.router.navigateByUrl(redirectUrl);
        },
        error: error => {
          this.error = error.message || 'Login failed';
          this.loading = false;
        }
      });
  }
}
