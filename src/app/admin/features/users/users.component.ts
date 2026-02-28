import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../../../shared/services/auth.service';

type UserStatusFilter = User['status'] | 'All';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  searchQuery = '';
  selectedStatus: UserStatusFilter = 'All';
  readonly fallbackAvatarUrl = 'https://ui-avatars.com/api/?name=User&background=e9ecef&color=495057';

  private usersSubscription?: Subscription;

  constructor(private readonly authService: AuthService) {}

  ngOnInit(): void {
    this.usersSubscription = this.authService.allUsers$.subscribe((users) => {
      this.users = users
        .filter((user) => user.role === 'CUSTOMER')
        .sort(
          (a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
        );
    });
  }

  ngOnDestroy(): void {
    this.usersSubscription?.unsubscribe();
  }

  onToggleStatus(userId: string): void {
    this.authService.toggleUserStatus(userId);
  }

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter((user) => user.status === 'Active').length;
  }

  get suspendedUsers(): number {
    return this.users.filter((user) => user.status === 'Suspended').length;
  }

  get filteredUsers(): User[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesQuery = !query || fullName.includes(query) || user.email.toLowerCase().includes(query);
      const matchesStatus = this.selectedStatus === 'All' || user.status === this.selectedStatus;

      return matchesQuery && matchesStatus;
    });
  }

  onFilterChange(): void {}

  trackByUserId(_index: number, user: User): string {
    return user.id;
  }

  getActionLabel(user: User): string {
    return user.status === 'Active' ? 'Suspend' : 'Activate';
  }

  getActionButtonClass(user: User): string {
    return user.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success';
  }
}
