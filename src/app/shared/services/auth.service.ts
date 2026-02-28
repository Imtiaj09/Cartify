import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  password?: string; // In a real app, never store plain text passwords
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  private readonly USERS_KEY = 'cartify_users';
  private readonly CURRENT_USER_KEY = 'currentUser';

  constructor() {
    const storedUser = localStorage.getItem(this.CURRENT_USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser ? JSON.parse(storedUser) : null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  register(userData: User): Observable<User> {
    const users = this.getUsers();

    // Check if email already exists
    if (users.find(u => u.email === userData.email)) {
      return throwError(() => new Error('Email already registered'));
    }

    // Create new user
    const newUser: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      // Use brand green for avatar background
      avatarUrl: `https://ui-avatars.com/api/?name=${userData.firstName}+${userData.lastName}&background=20a04b&color=fff`
    };

    // Save to users list
    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

    // Log in the user
    this.setCurrentUser(newUser);

    return of(newUser);
  }

  login(email: string, password: string): Observable<User> {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      // Remove password from user object before setting current user (optional security practice for frontend state)
      const { password, ...userWithoutPassword } = user;
      const safeUser = user as User; // For simplicity in this mock, we keep it compatible

      this.setCurrentUser(safeUser);
      return of(safeUser);
    } else {
      return throwError(() => new Error('Invalid email or password'));
    }
  }

  logout() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  updateUser(updatedData: Partial<User>): void {
    const currentUser = this.currentUserValue;

    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const users = this.getUsers();
    const index = users.findIndex((user) => user.id === currentUser.id);

    if (index === -1) {
      throw new Error('User not found');
    }

    const existingUser = users[index];
    const updatedUser: User = { ...existingUser, ...updatedData };
    users[index] = updatedUser;

    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

      const { password, ...safeUser } = updatedUser;
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(safeUser));
      this.currentUserSubject.next(safeUser as User);
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
    if (!currentUser) return throwError(() => new Error('No user logged in'));

    const users = this.getUsers();
    const index = users.findIndex(u => u.id === currentUser.id);

    if (index !== -1) {
      const user = users[index];
      if (user.password !== currentPassword) {
        return throwError(() => new Error('Incorrect current password'));
      }

      user.password = newPassword;
      users[index] = user;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      return of(true);
    }
    return throwError(() => new Error('User not found'));
  }

  private getUsers(): User[] {
    const usersJson = localStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  private setCurrentUser(user: User) {
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
