import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../shared/services/auth.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

interface Order {
  id: string;
  date: Date;
  totalAmount: number;
  itemCount: number;
  status: 'Processing' | 'Shipped' | 'Delivered';
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser$: Observable<User | null>;
  activeTab = 'orders';
  isEditing = false;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  orders: Order[] = [
    {
      id: '#ORD-7829',
      date: new Date('2023-10-25'),
      totalAmount: 125.50,
      itemCount: 3,
      status: 'Processing'
    },
    {
      id: '#ORD-7828',
      date: new Date('2023-10-15'),
      totalAmount: 45.00,
      itemCount: 1,
      status: 'Shipped'
    },
    {
      id: '#ORD-7827',
      date: new Date('2023-09-28'),
      totalAmount: 320.75,
      itemCount: 5,
      status: 'Delivered'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.initForms();
  }

  initForms() {
    const user = this.authService.currentUserValue;
    if (user) {
      this.profileForm = this.fb.group({
        firstName: [user.firstName, Validators.required],
        lastName: [user.lastName, Validators.required],
        email: [user.email, [Validators.required, Validators.email]],
        phone: [user.phone || '']
      });

      this.passwordForm = this.fb.group({
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      }, { validator: this.passwordMatchValidator });
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  changeTab(tabName: string) {
    this.activeTab = tabName;
    this.successMessage = '';
    this.errorMessage = '';
    this.isEditing = false;
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';
    if (this.isEditing) {
      this.initForms(); // Reset form to current values when entering edit mode
    }
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) return;

    this.loading = true;
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Profile updated successfully!';
        this.isEditing = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Failed to update profile';
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) return;

    this.loading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Password changed successfully!';
        this.passwordForm.reset();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.message || 'Failed to change password';
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/shop/login']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Processing': return 'bg-warning text-dark';
      case 'Shipped': return 'bg-info text-dark';
      case 'Delivered': return 'bg-success';
      default: return 'bg-secondary';
    }
  }
}
