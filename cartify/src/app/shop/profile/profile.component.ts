import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../shared/services/auth.service';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { Order, OrderService } from '../services/order.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser$: Observable<User | null>;
  activeTab = 'orders';
  isEditing = false;
  editFirstName = '';
  editLastName = '';
  editAvatarUrl = '';
  readonly defaultAvatarUrl = 'https://ui-avatars.com/api/?name=User&background=e9ecef&color=495057';
  private readonly maxAvatarSizeKb = 180;
  private readonly maxAvatarDimension = 320;
  passwordForm!: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  orders: Order[] = [];
  selectedOrder: Order | null = null;
  isInvoiceModalOpen = false;

  private authSubscription?: Subscription;
  private userOrdersSubscription?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly orderService: OrderService,
    private readonly router: Router,
    private readonly fb: FormBuilder
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.initPasswordForm();
    this.resetEditState();
    this.subscribeToCurrentUserOrders();
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.userOrdersSubscription?.unsubscribe();
    document.body.classList.remove('profile-invoice-open');
  }

  private initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  private resetEditState(): void {
    const user = this.authService.currentUserValue;
    this.editFirstName = user?.firstName ?? '';
    this.editLastName = user?.lastName ?? '';
    this.editAvatarUrl = user?.avatarUrl ?? '';
  }

  private subscribeToCurrentUserOrders(): void {
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      this.userOrdersSubscription?.unsubscribe();

      if (!user) {
        this.orders = [];
        return;
      }

      this.userOrdersSubscription = this.orderService.getUserOrders(user.id).subscribe((orders) => {
        this.orders = [...orders].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });
    });
  }

  passwordMatchValidator(g: FormGroup): { mismatch: true } | null {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  changeTab(tabName: string): void {
    this.activeTab = tabName;
    this.successMessage = '';
    this.errorMessage = '';
    this.isEditing = false;
    this.resetEditState();
    if (tabName !== 'orders') {
      this.closeInvoice();
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.isEditing) {
      this.resetEditState();
    }
  }

  async onFileSelected(event: any): Promise<void> {
    const file = event?.target?.files?.[0] as File | undefined;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    try {
      const sourceDataUrl = await this.readFileAsDataUrl(file);
      this.editAvatarUrl = await this.compressAvatarDataUrl(
        sourceDataUrl,
        this.maxAvatarDimension,
        this.maxAvatarSizeKb
      );
    } catch {
      this.errorMessage = 'Failed to process image. Please try another image.';
    } finally {
      this.loading = false;
      if (event?.target) {
        event.target.value = '';
      }
    }
  }

  saveChanges(): void {
    const firstName = this.editFirstName.trim();
    const lastName = this.editLastName.trim();

    if (!firstName || !lastName) {
      this.errorMessage = 'First name and last name are required.';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    try {
      this.authService.updateUser({
        firstName,
        lastName,
        avatarUrl: this.editAvatarUrl || undefined
      });
      this.successMessage = 'Profile updated successfully!';
      this.isEditing = false;
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Failed to save profile changes';
    } finally {
      this.loading = false;
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/shop/login']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'bg-secondary';
      case 'Processing':
        return 'bg-warning text-dark';
      case 'Shipped':
        return 'bg-info text-dark';
      case 'Delivered':
        return 'bg-success';
      case 'Cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getOrderItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  openInvoice(order: Order): void {
    this.selectedOrder = order;
    this.isInvoiceModalOpen = true;
    document.body.classList.add('profile-invoice-open');
  }

  closeInvoice(): void {
    this.selectedOrder = null;
    this.isInvoiceModalOpen = false;
    document.body.classList.remove('profile-invoice-open');
  }

  printInvoice(): void {
    window.print();
  }

  getOrderLineTotal(order: Order, itemIndex: number): number {
    const item = order.items[itemIndex];

    if (!item) {
      return 0;
    }

    const price = item.product.discountedPrice !== null
      ? item.product.discountedPrice
      : item.product.price;

    return price * item.quantity;
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }

        reject(new Error('Could not read image file.'));
      };

      reader.onerror = () => reject(new Error('Could not read image file.'));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not load image.'));
      image.src = source;
    });
  }

  private async compressAvatarDataUrl(sourceDataUrl: string, maxDimension: number, maxSizeKb: number): Promise<string> {
    const image = await this.loadImage(sourceDataUrl);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return sourceDataUrl;
    }

    const longestSide = Math.max(image.width, image.height) || 1;
    let scale = Math.min(1, maxDimension / longestSide);
    let width = Math.max(1, Math.round(image.width * scale));
    let height = Math.max(1, Math.round(image.height * scale));
    let bestDataUrl = sourceDataUrl;

    for (let attempt = 0; attempt < 10; attempt++) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      let quality = 0.85;
      let compressed = canvas.toDataURL('image/jpeg', quality);

      while (this.getDataUrlSizeKb(compressed) > maxSizeKb && quality > 0.5) {
        quality -= 0.07;
        compressed = canvas.toDataURL('image/jpeg', quality);
      }

      bestDataUrl = compressed;

      if (this.getDataUrlSizeKb(bestDataUrl) <= maxSizeKb) {
        return bestDataUrl;
      }

      scale *= 0.85;
      width = Math.max(64, Math.round(image.width * scale));
      height = Math.max(64, Math.round(image.height * scale));
    }

    return bestDataUrl;
  }

  private getDataUrlSizeKb(dataUrl: string): number {
    const parts = dataUrl.split(',');

    if (parts.length < 2) {
      return 0;
    }

    const base64 = parts[1];
    const padding = (base64.match(/=*$/) || [''])[0].length;
    const bytes = (base64.length * 3) / 4 - padding;
    return bytes / 1024;
  }
}
