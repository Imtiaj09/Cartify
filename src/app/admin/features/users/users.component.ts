import { Component } from '@angular/core';

type UserAccountStatus = 'Active' | 'Inactive' | 'Banned';
type UserStatusFilter = UserAccountStatus | 'All';

export interface DirectoryUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  joinedDate: string;
  status: UserAccountStatus;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {
  searchQuery = '';
  selectedStatus: UserStatusFilter = 'All';

  readonly users: DirectoryUser[] = [
    {
      id: 1001,
      name: 'Olivia Bennett',
      email: 'olivia.bennett@example.com',
      phone: '+1 (312) 555-0142',
      address: 'Chicago, IL',
      totalOrders: 42,
      joinedDate: '2024-01-14',
      status: 'Active'
    },
    {
      id: 1002,
      name: 'Noah Carter',
      email: 'noah.carter@example.com',
      phone: '+1 (646) 555-0189',
      address: 'New York, NY',
      totalOrders: 18,
      joinedDate: '2024-06-03',
      status: 'Inactive'
    },
    {
      id: 1003,
      name: 'Mia Richardson',
      email: 'mia.richardson@example.com',
      phone: '+1 (213) 555-0107',
      address: 'Los Angeles, CA',
      totalOrders: 76,
      joinedDate: '2023-11-21',
      status: 'Active'
    },
    {
      id: 1004,
      name: 'Ethan Powell',
      email: 'ethan.powell@example.com',
      phone: '+1 (206) 555-0192',
      address: 'Seattle, WA',
      totalOrders: 9,
      joinedDate: '2025-02-09',
      status: 'Banned'
    },
    {
      id: 1005,
      name: 'Ava Johnson',
      email: 'ava.johnson@example.com',
      phone: '+1 (713) 555-0120',
      address: 'Houston, TX',
      totalOrders: 34,
      joinedDate: '2024-09-28',
      status: 'Active'
    },
    {
      id: 1006,
      name: 'Liam Cooper',
      email: 'liam.cooper@example.com',
      phone: '+1 (602) 555-0174',
      address: 'Phoenix, AZ',
      totalOrders: 12,
      joinedDate: '2025-01-17',
      status: 'Banned'
    },
    {
      id: 1007,
      name: 'Sophia Turner',
      email: 'sophia.turner@example.com',
      phone: '+1 (305) 555-0155',
      address: 'Miami, FL',
      totalOrders: 25,
      joinedDate: '2024-04-11',
      status: 'Active'
    }
  ];

  get totalUsers(): number {
    return this.users.length;
  }

  get activeUsers(): number {
    return this.users.filter((user) => user.status === 'Active').length;
  }

  get bannedUsers(): number {
    return this.users.filter((user) => user.status === 'Banned').length;
  }

  get filteredUsers(): DirectoryUser[] {
    const query = this.searchQuery.trim().toLowerCase();

    return this.users.filter((user) => {
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesStatus =
        this.selectedStatus === 'All' || user.status === this.selectedStatus;

      return matchesQuery && matchesStatus;
    });
  }

  trackByUserId(index: number, user: DirectoryUser): number {
    return user.id;
  }

  getInitials(name: string): string {
    const nameParts = name.trim().split(' ').filter(Boolean);

    if (!nameParts.length) {
      return 'NA';
    }

    if (nameParts.length === 1) {
      return nameParts[0].slice(0, 2).toUpperCase();
    }

    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  }

  getStatusBadgeClass(status: UserAccountStatus): string {
    if (status === 'Active') {
      return 'bg-success';
    }

    if (status === 'Inactive') {
      return 'bg-secondary';
    }

    return 'bg-danger';
  }

  exportUserList(): void {
    const csvHeader = [
      'User ID',
      'Name',
      'Email',
      'Phone',
      'Address',
      'Total Orders',
      'Joined Date',
      'Status'
    ];

    const csvRows = this.filteredUsers.map((user) => [
      this.escapeCsvValue(user.id.toString()),
      this.escapeCsvValue(user.name),
      this.escapeCsvValue(user.email),
      this.escapeCsvValue(user.phone),
      this.escapeCsvValue(user.address),
      this.escapeCsvValue(user.totalOrders.toString()),
      this.escapeCsvValue(user.joinedDate),
      this.escapeCsvValue(user.status)
    ].join(','));

    const csvContent = [csvHeader.join(','), ...csvRows].join('\n');
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = 'users-directory.csv';
    anchor.click();

    URL.revokeObjectURL(url);
  }

  viewProfile(user: DirectoryUser): void {
    console.log('View profile:', user.id);
  }

  editUser(user: DirectoryUser): void {
    console.log('Edit user:', user.id);
  }

  suspendUser(user: DirectoryUser): void {
    console.log('Suspend user:', user.id);
  }

  private escapeCsvValue(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }
}
