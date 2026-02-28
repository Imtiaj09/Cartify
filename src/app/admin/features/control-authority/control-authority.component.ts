import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AdminCreateRequest, AdminUserRole, AuthService, User } from '../../../shared/services/auth.service';

type AdminRole = AdminUserRole;

export interface AuthorityPermissions {
  manageProducts: boolean;
  manageOrders: boolean;
  manageUsers: boolean;
  viewReports: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AuthorityPermissions;
  isActive: boolean;
  registrationDate: string;
}

interface AdminFormModel {
  name: string;
  email: string;
  role: AdminRole;
  temporaryPassword: string;
  permissions: AuthorityPermissions;
}

@Component({
  selector: 'app-control-authority',
  templateUrl: './control-authority.component.html',
  styleUrls: ['./control-authority.component.css']
})
export class ControlAuthorityComponent implements OnInit, OnDestroy {
  admins: AdminUser[] = [];
  currentPage = 1;
  itemsPerPage = 5;

  syncError = '';
  credentialNotice = '';

  isModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  editingAdminId: string | null = null;
  adminForm: AdminFormModel = this.createEmptyAdminForm();

  private currentUser: User | null = null;
  private usersSubscription?: Subscription;
  private currentUserSubscription?: Subscription;

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.usersSubscription = this.authService.allUsers$.subscribe((users) => {
      this.admins = users
        .filter((user): user is User & { role: AdminRole } => (
          user.role === 'Super Admin' || user.role === 'Sub Admin'
        ))
        .map((user) => this.toAdminUser(user))
        .sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }
    });

    this.currentUserSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.usersSubscription?.unsubscribe();
    this.currentUserSubscription?.unsubscribe();
  }

  get totalAdmins(): number {
    return this.admins.length;
  }

  get superAdmins(): number {
    return this.admins.filter((admin) => admin.role === 'Super Admin').length;
  }

  get subAdmins(): number {
    return this.admins.filter((admin) => admin.role === 'Sub Admin').length;
  }

  get modalTitle(): string {
    return this.modalMode === 'add' ? 'Add Admin' : 'Edit Admin';
  }

  get canSaveAdmin(): boolean {
    const name = this.adminForm.name.trim();
    const email = this.adminForm.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !emailRegex.test(email)) {
      return false;
    }

    if (this.modalMode === 'add') {
      return this.adminForm.temporaryPassword.trim().length >= 6;
    }

    return true;
  }

  get isSuperAdminSelected(): boolean {
    return this.adminForm.role === 'Super Admin';
  }

  get isEditingSelfSuperAdmin(): boolean {
    if (this.modalMode !== 'edit' || !this.editingAdminId || !this.currentUser) {
      return false;
    }

    return this.currentUser.role === 'Super Admin' && this.currentUser.id === this.editingAdminId;
  }

  get totalPages(): number {
    return Math.ceil(this.admins.length / this.itemsPerPage) || 1;
  }

  get paginatedAdmins(): AdminUser[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.admins.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get paginationPages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const pages: (number | string)[] = [1];

    if (current > 4) {
      pages.push('...');
    }

    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 4) {
      end = 5;
    }

    if (current >= total - 3) {
      start = total - 4;
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    if (current < total - 3) {
      pages.push('...');
    }

    pages.push(total);

    return pages;
  }

  openModal(admin?: AdminUser): void {
    this.syncError = '';

    if (admin) {
      this.modalMode = 'edit';
      this.editingAdminId = admin.id;
      this.adminForm = this.toFormModel(admin);
    } else {
      this.modalMode = 'add';
      this.editingAdminId = null;
      this.adminForm = this.createEmptyAdminForm();
    }

    this.onRoleChange();
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalMode = 'add';
    this.editingAdminId = null;
    this.adminForm = this.createEmptyAdminForm();
  }

  onRoleChange(): void {
    if (this.adminForm.role === 'Super Admin') {
      this.adminForm.permissions = this.createFullPermissions();
    }
  }

  saveAdmin(): void {
    if (!this.canSaveAdmin) {
      return;
    }

    this.syncError = '';

    const normalizedName = this.adminForm.name.trim();
    const normalizedEmail = this.adminForm.email.trim().toLowerCase();
    const role = this.adminForm.role;
    const permissions = this.permissionsForRole(role, this.adminForm.permissions);
    const nameParts = this.splitName(normalizedName);

    try {
      if (this.modalMode === 'edit' && this.editingAdminId) {
        if (this.isEditingSelfSuperAdmin && role === 'Sub Admin') {
          this.syncError = 'You cannot change your own role from Super Admin to Sub Admin.';
          return;
        }

        this.authService.updateAdminAccount(this.editingAdminId, {
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          email: normalizedEmail,
          role,
          permissions
        });
      } else {
        const request: AdminCreateRequest = {
          firstName: nameParts.firstName,
          lastName: nameParts.lastName,
          email: normalizedEmail,
          role,
          permissions,
          temporaryPassword: this.adminForm.temporaryPassword.trim(),
          status: 'Active'
        };

        this.authService.createAdminAccount(request);
        this.credentialNotice = `Temporary password for ${normalizedEmail}: ${request.temporaryPassword}`;
        this.currentPage = 1;
      }

      this.closeModal();
    } catch (error) {
      this.syncError = error instanceof Error ? error.message : 'Failed to save admin account.';
    }
  }

  deleteAdmin(id: string): void {
    this.syncError = '';

    if (this.isProtectedSelfDelete(id)) {
      this.syncError = 'You cannot delete your own Super Admin account.';
      return;
    }

    try {
      this.authService.deleteAdminAccount(id);
    } catch (error) {
      this.syncError = error instanceof Error ? error.message : 'Failed to delete admin account.';
    }
  }

  isDeleteDisabled(admin: AdminUser): boolean {
    return this.isProtectedSelfDelete(admin.id);
  }

  toggleStatus(id: string): void {
    this.syncError = '';
    this.authService.toggleUserStatus(id);
  }

  clearCredentialNotice(): void {
    this.credentialNotice = '';
  }

  getAccessModules(admin: AdminUser): string {
    const modules: string[] = [];

    if (admin.permissions.manageProducts) {
      modules.push('Manage Products');
    }

    if (admin.permissions.manageOrders) {
      modules.push('Manage Orders');
    }

    if (admin.permissions.manageUsers) {
      modules.push('Manage Users');
    }

    if (admin.permissions.viewReports) {
      modules.push('View Reports');
    }

    return modules.length ? modules.join(', ') : 'No module assigned';
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ').filter(Boolean);

    if (parts.length === 0) {
      return 'NA';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  trackByAdminId(_index: number, admin: AdminUser): string {
    return admin.id;
  }

  goToPage(page: number | string): void {
    if (typeof page !== 'number') {
      return;
    }

    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  hasMultiplePages(): boolean {
    return this.totalPages > 1;
  }

  private toAdminUser(user: User & { role: AdminRole }): AdminUser {
    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      permissions: { ...user.permissions },
      isActive: user.status === 'Active',
      registrationDate: user.registrationDate
    };
  }

  private isProtectedSelfDelete(adminId: string): boolean {
    return !!this.currentUser && this.currentUser.role === 'Super Admin' && this.currentUser.id === adminId;
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const parts = name.split(' ').map((part) => part.trim()).filter(Boolean);

    if (!parts.length) {
      return { firstName: '', lastName: 'Admin' };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ') || 'Admin'
    };
  }

  private permissionsForRole(role: AdminRole, permissions: AuthorityPermissions): AuthorityPermissions {
    if (role === 'Super Admin') {
      return this.createFullPermissions();
    }

    return {
      manageProducts: !!permissions.manageProducts,
      manageOrders: !!permissions.manageOrders,
      manageUsers: !!permissions.manageUsers,
      viewReports: !!permissions.viewReports
    };
  }

  private createFullPermissions(): AuthorityPermissions {
    return {
      manageProducts: true,
      manageOrders: true,
      manageUsers: true,
      viewReports: true
    };
  }

  private createEmptyAdminForm(): AdminFormModel {
    return {
      name: '',
      email: '',
      role: 'Sub Admin',
      temporaryPassword: '',
      permissions: {
        manageProducts: false,
        manageOrders: false,
        manageUsers: false,
        viewReports: false
      }
    };
  }

  private toFormModel(admin: AdminUser): AdminFormModel {
    return {
      name: admin.name,
      email: admin.email,
      role: admin.role,
      temporaryPassword: '',
      permissions: {
        ...admin.permissions
      }
    };
  }
}
