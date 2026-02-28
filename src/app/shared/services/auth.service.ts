import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';

export type UserStatus = 'Active' | 'Suspended';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  registrationDate: string;
  phone?: string;
  avatarUrl?: string;
  password?: string; // In a real app, never store plain text passwords
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_KEY = 'cartify_users';
  private readonly CURRENT_USER_KEY = 'currentUser';

  private readonly currentUserSubject: BehaviorSubject<User | null>;
  public readonly currentUser$: Observable<User | null>;

  public readonly allUsers$ = new BehaviorSubject<User[]>([]);

  constructor() {
    const users = this.loadUsersFromStorage();
    this.allUsers$.next(users);

    const storedCurrentUser = localStorage.getItem(this.CURRENT_USER_KEY);
    const currentUser = storedCurrentUser ? this.normalizeUser(JSON.parse(storedCurrentUser) as Partial<User>) : null;

    this.currentUserSubject = new BehaviorSubject<User | null>(currentUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  register(userData: Partial<User>): Observable<User> {
    const firstName = (userData.firstName || '').trim();
    const lastName = (userData.lastName || '').trim();
    const email = (userData.email || '').trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      return throwError(() => new Error('Missing required registration fields'));
    }

    const users = [...this.allUsers$.value];

    if (users.find((user) => user.email.toLowerCase() === email)) {
      return throwError(() => new Error('Email already registered'));
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      firstName,
      lastName,
      email,
      status: 'Active',
      registrationDate: new Date().toISOString(),
      phone: userData.phone,
      password: userData.password,
      avatarUrl: userData.avatarUrl || `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=20a04b&color=fff`
    };

    users.push(newUser);
    this.saveUsers(users);
    this.setCurrentUser(this.toSafeUser(newUser));

    return of(this.toSafeUser(newUser));
  }

  login(email: string, password: string): Observable<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.allUsers$.value.find(
      (candidate) => candidate.email.toLowerCase() === normalizedEmail && candidate.password === password
    );

    if (!user) {
      return throwError(() => new Error('Invalid email or password'));
    }

    if (user.status === 'Suspended') {
      return throwError(() => new Error('Your account is suspended. Please contact support.'));
    }

    const safeUser = this.toSafeUser(user);
    this.setCurrentUser(safeUser);

    return of(safeUser);
  }

  logout(): void {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  toggleUserStatus(userId: string): void {
    const users: User[] = this.allUsers$.value.map((user): User => {
      if (user.id !== userId) {
        return user;
      }

      const toggledStatus: UserStatus = user.status === 'Active' ? 'Suspended' : 'Active';

      return {
        ...user,
        status: toggledStatus
      };
    });

    this.saveUsers(users);

    const currentUser = this.currentUserValue;
    if (!currentUser) {
      return;
    }

    const updatedCurrent = users.find((user) => user.id === currentUser.id);
    if (!updatedCurrent) {
      return;
    }

    const safeUpdatedCurrent = this.toSafeUser(updatedCurrent);

    if (safeUpdatedCurrent.status === 'Suspended') {
      this.logout();
      return;
    }

    this.setCurrentUser(safeUpdatedCurrent);
  }

  updateUser(updatedData: Partial<User>): void {
    const currentUser = this.currentUserValue;

    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const users = [...this.allUsers$.value];
    const index = users.findIndex((user) => user.id === currentUser.id);

    if (index === -1) {
      throw new Error('User not found');
    }

    const existingUser = users[index];
    const updatedUser = this.normalizeUser({
      ...existingUser,
      ...updatedData,
      id: existingUser.id,
      email: existingUser.email,
      password: existingUser.password
    });

    users[index] = updatedUser;

    try {
      this.saveUsers(users);
      this.setCurrentUser(this.toSafeUser(updatedUser));
    } catch {
      throw new Error('Unable to save profile changes. The selected image may be too large.');
    }
  }

  updateProfile(updatedData: Partial<User>): Observable<User> {
    const currentUser = this.currentUserValue;

    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    this.updateUser(updatedData);
    const updatedCurrentUser = this.currentUserValue;

    if (!updatedCurrentUser) {
      return throwError(() => new Error('User update failed'));
    }

    return of(updatedCurrentUser);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    const currentUser = this.currentUserValue;

    if (!currentUser) {
      return throwError(() => new Error('No user logged in'));
    }

    const users = [...this.allUsers$.value];
    const index = users.findIndex((user) => user.id === currentUser.id);

    if (index === -1) {
      return throwError(() => new Error('User not found'));
    }

    const user = users[index];

    if (user.password !== currentPassword) {
      return throwError(() => new Error('Incorrect current password'));
    }

    users[index] = {
      ...user,
      password: newPassword
    };

    this.saveUsers(users);

    return of(true);
  }

  private loadUsersFromStorage(): User[] {
    const usersJson = localStorage.getItem(this.USERS_KEY);

    if (!usersJson) {
      return [];
    }

    try {
      const parsed = JSON.parse(usersJson) as Partial<User>[];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((user) => this.normalizeUser(user));
    } catch {
      return [];
    }
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    this.allUsers$.next(users);
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private normalizeUser(user: Partial<User>): User {
    const firstName = (user.firstName || '').trim();
    const lastName = (user.lastName || '').trim();

    return {
      id: user.id || Math.random().toString(36).substr(2, 9),
      firstName,
      lastName,
      email: (user.email || '').trim().toLowerCase(),
      status: user.status === 'Suspended' ? 'Suspended' : 'Active',
      registrationDate: user.registrationDate || new Date().toISOString(),
      phone: user.phone,
      avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${firstName || 'User'}+${lastName || 'Account'}&background=20a04b&color=fff`,
      password: user.password
    };
  }

  private toSafeUser(user: User): User {
    const { password, ...safeUser } = user;
    return safeUser as User;
  }
}
