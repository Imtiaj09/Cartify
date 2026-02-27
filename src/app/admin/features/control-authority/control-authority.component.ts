import { Component, OnInit } from '@angular/core';

type AdminRole = 'Super Admin' | 'Sub Admin';

export interface AuthorityPermissions {
  manageProducts: boolean;
  manageOrders: boolean;
  manageUsers: boolean;
  viewReports: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AuthorityPermissions;
  isActive: boolean;
}

interface AdminFormModel {
  name: string;
  email: string;
  role: AdminRole;
  permissions: AuthorityPermissions;
}

@Component({
  selector: 'app-control-authority',
  templateUrl: './control-authority.component.html',
  styleUrls: ['./control-authority.component.css']
})
export class ControlAuthorityComponent implements OnInit {
  private readonly adminStorageKey = 'cartify_control_authority_admins';
  admins: AdminUser[] = [];
  currentPage = 1;
  itemsPerPage = 5;

  isModalOpen = false;
  modalMode: 'add' | 'edit' = 'add';
  editingAdminId: number | null = null;
  adminForm: AdminFormModel = this.createEmptyAdminForm();

  ngOnInit(): void {
    const storedAdmins = this.loadAdminsFromStorage();

    if (storedAdmins !== null) {
      this.admins = storedAdmins;
      return;
    }

    this.admins = this.createMockAdmins();
    this.persistAdmins();
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

    return !!name && emailRegex.test(email);
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
    if (admin) {
      this.modalMode = 'edit';
      this.editingAdminId = admin.id;
      this.adminForm = this.toFormModel(admin);
    } else {
      this.modalMode = 'add';
      this.editingAdminId = null;
      this.adminForm = this.createEmptyAdminForm();
    }

    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalMode = 'add';
    this.editingAdminId = null;
    this.adminForm = this.createEmptyAdminForm();
  }

  saveAdmin(): void {
    if (!this.canSaveAdmin) {
      return;
    }

    const normalizedName = this.adminForm.name.trim();
    const normalizedEmail = this.adminForm.email.trim().toLowerCase();
    const normalizedPermissions = { ...this.adminForm.permissions };

    if (this.modalMode === 'edit' && this.editingAdminId !== null) {
      this.setAdmins(this.admins.map((admin) => {
        if (admin.id !== this.editingAdminId) {
          return admin;
        }

        return {
          ...admin,
          name: normalizedName,
          email: normalizedEmail,
          role: this.adminForm.role,
          permissions: normalizedPermissions
        };
      }));
    } else {
      const nextId = this.admins.length
        ? Math.max(...this.admins.map((admin) => admin.id)) + 1
        : 1;

      const newAdmin: AdminUser = {
        id: nextId,
        name: normalizedName,
        email: normalizedEmail,
        role: this.adminForm.role,
        permissions: normalizedPermissions,
        isActive: true
      };

      this.setAdmins([newAdmin, ...this.admins]);
      this.currentPage = 1;
    }

    this.closeModal();
  }

  deleteAdmin(id: number): void {
    this.setAdmins(this.admins.filter((admin) => admin.id !== id));
  }

  toggleStatus(id: number): void {
    this.setAdmins(this.admins.map((admin) => {
      if (admin.id !== id) {
        return admin;
      }

      return {
        ...admin,
        isActive: !admin.isActive
      };
    }));
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

  trackByAdminId(index: number, admin: AdminUser): number {
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

  private setAdmins(admins: AdminUser[]): void {
    this.admins = admins;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    this.persistAdmins();
  }

  private persistAdmins(): void {
    localStorage.setItem(this.adminStorageKey, JSON.stringify(this.admins));
  }

  private loadAdminsFromStorage(): AdminUser[] | null {
    const serializedAdmins = localStorage.getItem(this.adminStorageKey);

    if (!serializedAdmins) {
      return null;
    }

    try {
      const parsedAdmins: unknown = JSON.parse(serializedAdmins);

      if (!Array.isArray(parsedAdmins)) {
        return null;
      }

      if (!parsedAdmins.every((admin) => this.isAdminUser(admin))) {
        return null;
      }

      return parsedAdmins;
    } catch {
      return null;
    }
  }

  private isAdminUser(value: unknown): value is AdminUser {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const admin = value as Partial<AdminUser>;
    const permissions = admin.permissions as Partial<AuthorityPermissions> | undefined;

    return (
      typeof admin.id === 'number' &&
      Number.isFinite(admin.id) &&
      typeof admin.name === 'string' &&
      typeof admin.email === 'string' &&
      (admin.role === 'Super Admin' || admin.role === 'Sub Admin') &&
      typeof admin.isActive === 'boolean' &&
      !!permissions &&
      typeof permissions.manageProducts === 'boolean' &&
      typeof permissions.manageOrders === 'boolean' &&
      typeof permissions.manageUsers === 'boolean' &&
      typeof permissions.viewReports === 'boolean'
    );
  }

  private createMockAdmins(): AdminUser[] {
    return [
      {
        id: 1,
        name: 'Sarah Mitchell',
        email: 'sarah.mitchell@cartify.com',
        role: 'Super Admin',
        permissions: {
          manageProducts: true,
          manageOrders: true,
          manageUsers: true,
          viewReports: true
        },
        isActive: true
      },
      {
        id: 2,
        name: 'David Coleman',
        email: 'david.coleman@cartify.com',
        role: 'Sub Admin',
        permissions: {
          manageProducts: true,
          manageOrders: true,
          manageUsers: false,
          viewReports: true
        },
        isActive: true
      },
      {
        id: 3,
        name: 'Olivia Harper',
        email: 'olivia.harper@cartify.com',
        role: 'Sub Admin',
        permissions: {
          manageProducts: false,
          manageOrders: true,
          manageUsers: true,
          viewReports: false
        },
        isActive: false
      },
      {
        id: 4,
        name: 'James Foster',
        email: 'james.foster@cartify.com',
        role: 'Super Admin',
        permissions: {
          manageProducts: true,
          manageOrders: true,
          manageUsers: true,
          viewReports: true
        },
        isActive: true
      },
      {
        id: 5,
        name: 'Emma Cooper',
        email: 'emma.cooper@cartify.com',
        role: 'Sub Admin',
        permissions: {
          manageProducts: true,
          manageOrders: false,
          manageUsers: false,
          viewReports: true
        },
        isActive: true
      }
    ];
  }

  private createEmptyAdminForm(): AdminFormModel {
    return {
      name: '',
      email: '',
      role: 'Sub Admin',
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
      permissions: {
        ...admin.permissions
      }
    };
  }
}
