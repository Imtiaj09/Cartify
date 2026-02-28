import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';

export type UserStatus = 'Active' | 'Suspended';
export type UserRole = 'Super Admin' | 'Sub Admin' | 'Customer';
export type AdminUserRole = Exclude<UserRole, 'Customer'>;
export type AdminPermissionKey = keyof AdminPermissions;

export interface AdminPermissions {
  manageProducts: boolean;
  manageOrders: boolean;
  manageUsers: boolean;
  viewReports: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  permissions: AdminPermissions;
  registrationDate: string;
  token: string;
  phone?: string;
  avatarUrl?: string;
}

interface RegisterRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AdminCreateRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: AdminUserRole;
  permissions: AdminPermissions;
  temporaryPassword: string;
  phone?: string;
  avatarUrl?: string;
  status?: UserStatus;
}

export interface AdminUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: AdminUserRole;
  permissions?: AdminPermissions;
  phone?: string;
  avatarUrl?: string;
  status?: UserStatus;
}

interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  permissions: AdminPermissions;
  registrationDate: string;
  passwordHash: string;
  phone?: string;
  avatarUrl?: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  role: UserRole;
  permissions: AdminPermissions;
  registrationDate: string;
  phone?: string;
  avatarUrl?: string;
  iat: number;
  exp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private readonly USERS_KEY = 'cartify_users';
  private readonly TOKEN_KEY = 'cartify_access_token';
  private readonly LEGACY_CURRENT_USER_KEY = 'currentUser';
  private readonly TOKEN_TTL_SECONDS = 8 * 60 * 60;

  private readonly fallbackAdminSeed = {
    firstName: 'System',
    lastName: 'Admin',
    email: 'admin@cartify.dev',
    password: 'Admin@123',
    role: 'Super Admin' as AdminUserRole
  };

  private users: StoredUser[] = [];

  private readonly currentUserSubject: BehaviorSubject<User | null>;
  public readonly currentUser$: Observable<User | null>;

  public readonly allUsers$ = new BehaviorSubject<User[]>([]);

  constructor() {
    const loadedUsers = this.loadUsersFromStorage();
    this.users = this.ensureSeedUsers(loadedUsers);
    this.persistUsers(this.users);
    this.allUsers$.next(this.toPublicUsers(this.users));

    this.migrateLegacyCurrentUserToToken();
    const currentUser = this.hydrateCurrentUserFromStoredToken(this.users);

    this.currentUserSubject = new BehaviorSubject<User | null>(currentUser);
    this.currentUser$ = this.currentUserSubject.asObservable();

    if (!currentUser) {
      localStorage.removeItem(this.TOKEN_KEY);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAdminRole(role: UserRole): role is AdminUserRole {
    return role === 'Super Admin' || role === 'Sub Admin';
  }

  getDefaultRouteForRole(role: UserRole): string {
    return this.isAdminRole(role) ? '/admin/dashboard' : '/shop/home';
  }

  canAccessRoute(url: string, role: UserRole): boolean {
    const normalizedUrl = this.normalizeRoute(url);

    if (normalizedUrl.startsWith('/admin')) {
      return this.isAdminRole(role);
    }

    return true;
  }

  getPostLoginRedirectUrl(user: User, returnUrl?: string | null): string {
    const normalizedReturnUrl = (returnUrl || '').trim();

    if (normalizedReturnUrl && this.canAccessRoute(normalizedReturnUrl, user.role)) {
      return this.normalizeRoute(normalizedReturnUrl);
    }

    return this.getDefaultRouteForRole(user.role);
  }

  getAdminUsersSnapshot(): User[] {
    return this.allUsers$.value.filter((user) => this.isAdminRole(user.role));
  }

  getAdminPermissions(user: User | null = this.currentUserValue): AdminPermissions {
    if (!user || !this.isAdminRole(user.role)) {
      return this.createDeniedPermissions();
    }

    if (user.role === 'Super Admin') {
      return this.createFullPermissions();
    }

    return this.normalizePermissions(user.permissions);
  }

  hasPermission(permission: AdminPermissionKey, user: User | null = this.currentUserValue): boolean {
    return this.getAdminPermissions(user)[permission];
  }

  hasAllPermissions(permissions: AdminPermissionKey[], user: User | null = this.currentUserValue): boolean {
    if (!permissions.length) {
      return true;
    }

    return permissions.every((permission) => this.hasPermission(permission, user));
  }

  hasAnyPermission(permissions: AdminPermissionKey[], user: User | null = this.currentUserValue): boolean {
    if (!permissions.length) {
      return true;
    }

    return permissions.some((permission) => this.hasPermission(permission, user));
  }

  register(userData: RegisterRequest): Observable<User> {
    const firstName = (userData.firstName || '').trim();
    const lastName = (userData.lastName || '').trim();
    const email = (userData.email || '').trim().toLowerCase();
    const password = (userData.password || '').trim();

    if (!firstName || !lastName || !email || !password) {
      return throwError(() => new Error('Missing required registration fields'));
    }

    if (this.users.find((user) => user.email === email)) {
      return throwError(() => new Error('Email already registered'));
    }

    const newUser: StoredUser = this.normalizeStoredUser({
      id: this.generateId(),
      firstName,
      lastName,
      email,
      status: 'Active',
      role: 'Customer',
      permissions: this.createDeniedPermissions(),
      registrationDate: new Date().toISOString(),
      phone: userData.phone,
      avatarUrl: userData.avatarUrl,
      passwordHash: this.createPasswordHash(password, email)
    });

    this.saveUsers([...this.users, newUser]);
    return of(this.establishSession(newUser));
  }

  createAdminAccount(payload: AdminCreateRequest): User {
    const firstName = (payload.firstName || '').trim();
    const lastName = (payload.lastName || '').trim() || 'Admin';
    const email = (payload.email || '').trim().toLowerCase();
    const temporaryPassword = (payload.temporaryPassword || '').trim();

    if (!firstName || !email || !temporaryPassword) {
      throw new Error('Name, email, and temporary password are required.');
    }

    if (temporaryPassword.length < 6) {
      throw new Error('Temporary password must be at least 6 characters.');
    }

    if (this.users.some((user) => user.email === email)) {
      throw new Error('Email already registered.');
    }

    const role: AdminUserRole = payload.role === 'Sub Admin' ? 'Sub Admin' : 'Super Admin';
    const permissions = this.permissionsForRole(role, payload.permissions);

    const newAdmin: StoredUser = this.normalizeStoredUser({
      id: this.generateId(),
      firstName,
      lastName,
      email,
      status: payload.status === 'Suspended' ? 'Suspended' : 'Active',
      role,
      permissions,
      registrationDate: new Date().toISOString(),
      phone: payload.phone,
      avatarUrl: payload.avatarUrl,
      passwordHash: this.createPasswordHash(temporaryPassword, email)
    });

    this.saveUsers([...this.users, newAdmin]);

    return this.toPublicUser(newAdmin, '');
  }

  updateAdminAccount(userId: string, payload: AdminUpdateRequest): User {
    const index = this.users.findIndex((user) => user.id === userId);

    if (index === -1) {
      throw new Error('Admin not found.');
    }

    const existing = this.users[index];

    if (!this.isAdminRole(existing.role)) {
      throw new Error('Target user is not an admin account.');
    }

    const currentUser = this.currentUserValue;
    const nextRole: AdminUserRole = payload.role
      ? (payload.role === 'Sub Admin' ? 'Sub Admin' : 'Super Admin')
      : existing.role;

    if (
      currentUser &&
      currentUser.id === userId &&
      currentUser.role === 'Super Admin' &&
      nextRole === 'Sub Admin'
    ) {
      throw new Error('You cannot downgrade your own Super Admin account.');
    }

    const nextEmail = (payload.email || existing.email).trim().toLowerCase();

    if (this.users.some((user) => user.email === nextEmail && user.id !== existing.id)) {
      throw new Error('Email already registered to another account.');
    }

    const nextFirstName = (payload.firstName || existing.firstName).trim();

    if (!nextFirstName) {
      throw new Error('First name is required.');
    }

    const updated: StoredUser = this.normalizeStoredUser({
      ...existing,
      firstName: nextFirstName,
      lastName: (payload.lastName || existing.lastName).trim(),
      email: nextEmail,
      role: nextRole,
      permissions: this.permissionsForRole(nextRole, payload.permissions || existing.permissions),
      status: payload.status || existing.status,
      phone: payload.phone !== undefined ? payload.phone : existing.phone,
      avatarUrl: payload.avatarUrl !== undefined ? payload.avatarUrl : existing.avatarUrl,
      passwordHash: existing.passwordHash
    });

    const users = [...this.users];
    users[index] = updated;
    this.saveUsers(users);

    return this.toPublicUser(updated, '');
  }

  deleteAdminAccount(userId: string): void {
    const existing = this.users.find((user) => user.id === userId);

    if (!existing) {
      return;
    }

    if (!this.isAdminRole(existing.role)) {
      throw new Error('Only admin accounts can be removed here.');
    }

    const currentUser = this.currentUserValue;

    if (
      currentUser &&
      currentUser.id === userId &&
      currentUser.role === 'Super Admin'
    ) {
      throw new Error('You cannot delete your own Super Admin account.');
    }

    this.saveUsers(this.users.filter((user) => user.id !== userId));
  }

  login(email: string, password: string): Observable<User> {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const expectedHash = this.createPasswordHash(password || '', normalizedEmail);

    const user = this.users.find(
      (candidate) => candidate.email === normalizedEmail && candidate.passwordHash === expectedHash
    );

    if (!user) {
      return throwError(() => new Error('Invalid email or password'));
    }

    if (user.status === 'Suspended') {
      return throwError(() => new Error('Your account is suspended. Please contact support.'));
    }

    return of(this.establishSession(user));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.LEGACY_CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  toggleUserStatus(userId: string): void {
    const users = this.users.map((user) => {
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
  }

  updateUser(updatedData: Partial<User>): void {
    const currentUser = this.currentUserValue;

    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const index = this.users.findIndex((user) => user.id === currentUser.id);

    if (index === -1) {
      throw new Error('User not found');
    }

    const existingUser = this.users[index];
    const updatedUser = this.normalizeStoredUser({
      ...existingUser,
      ...updatedData,
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      permissions: existingUser.permissions,
      passwordHash: existingUser.passwordHash
    });

    const users = [...this.users];
    users[index] = updatedUser;

    try {
      this.saveUsers(users);
      this.establishSession(updatedUser);
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

    const users = [...this.users];
    const index = users.findIndex((user) => user.id === currentUser.id);

    if (index === -1) {
      return throwError(() => new Error('User not found'));
    }

    const user = users[index];
    const currentPasswordHash = this.createPasswordHash(currentPassword || '', user.email);

    if (user.passwordHash !== currentPasswordHash) {
      return throwError(() => new Error('Incorrect current password'));
    }

    users[index] = {
      ...user,
      passwordHash: this.createPasswordHash(newPassword || '', user.email)
    };

    this.saveUsers(users);

    return of(true);
  }

  private readonly handleStorageEvent = (event: StorageEvent): void => {
    if (event.key === this.USERS_KEY) {
      this.users = this.loadUsersFromStorage();
      this.allUsers$.next(this.toPublicUsers(this.users));
      this.syncCurrentSessionWithStoredUsers();
      return;
    }

    if (event.key === this.TOKEN_KEY) {
      const currentUser = this.hydrateCurrentUserFromStoredToken(this.users);
      this.currentUserSubject.next(currentUser);
    }
  };

  private loadUsersFromStorage(): StoredUser[] {
    const usersJson = localStorage.getItem(this.USERS_KEY);

    if (!usersJson) {
      return [];
    }

    try {
      const parsed = JSON.parse(usersJson) as Array<
        Partial<StoredUser> & {
          password?: string;
          role?: UserRole | 'ADMIN' | 'CUSTOMER';
        }
      >;

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((user) => this.normalizeStoredUser(user));
    } catch {
      return [];
    }
  }

  private saveUsers(users: StoredUser[]): void {
    this.users = [...users];
    this.persistUsers(this.users);
    this.allUsers$.next(this.toPublicUsers(this.users));
    this.syncCurrentSessionWithStoredUsers();
  }

  private persistUsers(users: StoredUser[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private establishSession(user: StoredUser): User {
    const token = this.issueToken(user);
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.removeItem(this.LEGACY_CURRENT_USER_KEY);

    const payload = this.decodeToken(token);

    if (!payload) {
      throw new Error('Unable to create a valid token for this session.');
    }

    const sessionUser = this.toPublicUserFromPayload(payload, token);
    this.currentUserSubject.next(sessionUser);

    return sessionUser;
  }

  private hydrateCurrentUserFromStoredToken(users: StoredUser[]): User | null {
    const token = this.getAccessToken();

    if (!token) {
      return null;
    }

    const payload = this.decodeToken(token);

    if (!payload) {
      return null;
    }

    const storedUser = users.find((user) => user.id === payload.sub);

    if (!storedUser || storedUser.status === 'Suspended') {
      return null;
    }

    return this.toPublicUserFromPayload(payload, token);
  }

  private syncCurrentSessionWithStoredUsers(): void {
    const currentUser = this.currentUserValue;

    if (!currentUser) {
      return;
    }

    const storedUser = this.users.find((user) => user.id === currentUser.id);

    if (!storedUser || storedUser.status === 'Suspended') {
      this.logout();
      return;
    }

    if (this.hasUserClaimsDrift(currentUser, storedUser)) {
      this.establishSession(storedUser);
    }
  }

  private hasUserClaimsDrift(currentUser: User, storedUser: StoredUser): boolean {
    return (
      currentUser.firstName !== storedUser.firstName ||
      currentUser.lastName !== storedUser.lastName ||
      currentUser.email !== storedUser.email ||
      currentUser.status !== storedUser.status ||
      currentUser.role !== storedUser.role ||
      !this.areSamePermissions(currentUser.permissions, storedUser.permissions) ||
      currentUser.registrationDate !== storedUser.registrationDate ||
      (currentUser.phone || '') !== (storedUser.phone || '') ||
      (currentUser.avatarUrl || '') !== (storedUser.avatarUrl || '')
    );
  }

  private migrateLegacyCurrentUserToToken(): void {
    const existingToken = this.getAccessToken();

    if (existingToken) {
      localStorage.removeItem(this.LEGACY_CURRENT_USER_KEY);
      return;
    }

    const legacyCurrentUserJson = localStorage.getItem(this.LEGACY_CURRENT_USER_KEY);

    if (!legacyCurrentUserJson) {
      return;
    }

    try {
      const legacy = JSON.parse(legacyCurrentUserJson) as Partial<User> & { id?: string; email?: string };
      const normalizedEmail = (legacy.email || '').trim().toLowerCase();
      const matchingStoredUser = this.users.find(
        (user) => user.id === legacy.id || (!!normalizedEmail && user.email === normalizedEmail)
      );

      if (matchingStoredUser && matchingStoredUser.status === 'Active') {
        const token = this.issueToken(matchingStoredUser);
        localStorage.setItem(this.TOKEN_KEY, token);
      }
    } catch {
      // Ignore malformed legacy payload and clear it below.
    } finally {
      localStorage.removeItem(this.LEGACY_CURRENT_USER_KEY);
    }
  }

  private ensureSeedUsers(users: StoredUser[]): StoredUser[] {
    if (users.some((user) => this.isAdminRole(user.role))) {
      return users;
    }

    const adminUser: StoredUser = this.normalizeStoredUser({
      id: this.generateId(),
      firstName: this.fallbackAdminSeed.firstName,
      lastName: this.fallbackAdminSeed.lastName,
      email: this.fallbackAdminSeed.email,
      status: 'Active',
      role: this.fallbackAdminSeed.role,
      permissions: this.createFullPermissions(),
      registrationDate: new Date().toISOString(),
      passwordHash: this.createPasswordHash(this.fallbackAdminSeed.password, this.fallbackAdminSeed.email)
    });

    return [...users, adminUser];
  }

  private normalizeStoredUser(
    user: Partial<StoredUser> & {
      password?: string;
      role?: UserRole | 'ADMIN' | 'CUSTOMER';
    }
  ): StoredUser {
    const firstName = (user.firstName || '').trim();
    const lastName = (user.lastName || '').trim();
    const email = (user.email || '').trim().toLowerCase();
    const status = user.status === 'Suspended' ? 'Suspended' : 'Active';
    const role = this.normalizeRole(user.role);

    return {
      id: user.id || this.generateId(),
      firstName,
      lastName,
      email,
      status,
      role,
      permissions: this.permissionsForRole(role, user.permissions),
      registrationDate: user.registrationDate || new Date().toISOString(),
      phone: user.phone,
      avatarUrl: user.avatarUrl || this.buildAvatarUrl(firstName, lastName),
      passwordHash: this.resolvePasswordHash(user, email)
    };
  }

  private resolvePasswordHash(
    user: Partial<StoredUser> & { password?: string },
    email: string
  ): string {
    if (typeof user.passwordHash === 'string' && user.passwordHash.trim()) {
      return user.passwordHash;
    }

    if (typeof user.password === 'string' && user.password.trim()) {
      return this.createPasswordHash(user.password, email);
    }

    return '';
  }

  private normalizeRole(role?: UserRole | 'ADMIN' | 'CUSTOMER'): UserRole {
    if (role === 'Super Admin' || role === 'Sub Admin' || role === 'Customer') {
      return role;
    }

    if (role === 'ADMIN') {
      return 'Super Admin';
    }

    return 'Customer';
  }

  private permissionsForRole(
    role: UserRole,
    permissions?: Partial<AdminPermissions>
  ): AdminPermissions {
    if (role === 'Super Admin') {
      return this.createFullPermissions();
    }

    if (role === 'Sub Admin') {
      return this.normalizePermissions(permissions);
    }

    return this.createDeniedPermissions();
  }

  private normalizePermissions(permissions?: Partial<AdminPermissions>): AdminPermissions {
    return {
      manageProducts: !!permissions?.manageProducts,
      manageOrders: !!permissions?.manageOrders,
      manageUsers: !!permissions?.manageUsers,
      viewReports: !!permissions?.viewReports
    };
  }

  private createFullPermissions(): AdminPermissions {
    return {
      manageProducts: true,
      manageOrders: true,
      manageUsers: true,
      viewReports: true
    };
  }

  private createDeniedPermissions(): AdminPermissions {
    return {
      manageProducts: false,
      manageOrders: false,
      manageUsers: false,
      viewReports: false
    };
  }

  private areSamePermissions(left: AdminPermissions, right: AdminPermissions): boolean {
    return (
      left.manageProducts === right.manageProducts &&
      left.manageOrders === right.manageOrders &&
      left.manageUsers === right.manageUsers &&
      left.viewReports === right.viewReports
    );
  }

  private toPublicUsers(users: StoredUser[]): User[] {
    return users.map((user) => this.toPublicUser(user, ''));
  }

  private toPublicUser(user: StoredUser, token: string): User {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      role: user.role,
      permissions: user.permissions,
      registrationDate: user.registrationDate,
      token,
      phone: user.phone,
      avatarUrl: user.avatarUrl
    };
  }

  private issueToken(user: StoredUser): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      role: user.role,
      permissions: user.permissions,
      registrationDate: user.registrationDate,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      iat: now,
      exp: now + this.TOKEN_TTL_SECONDS
    };

    const header = this.base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = this.base64UrlEncode(JSON.stringify(payload));

    return `${header}.${body}.mock-signature`;
  }

  private decodeToken(token: string): JwtPayload | null {
    const tokenParts = token.split('.');

    if (tokenParts.length < 2) {
      return null;
    }

    try {
      const payloadString = this.base64UrlDecode(tokenParts[1]);
      const payload = JSON.parse(payloadString) as JwtPayload;

      if (!payload || typeof payload.sub !== 'string' || typeof payload.exp !== 'number') {
        return null;
      }

      if (payload.exp * 1000 <= Date.now()) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private toPublicUserFromPayload(payload: JwtPayload, token: string): User {
    return {
      id: payload.sub,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      status: payload.status,
      role: payload.role,
      permissions: this.permissionsForRole(payload.role, payload.permissions),
      registrationDate: payload.registrationDate,
      token,
      phone: payload.phone,
      avatarUrl: payload.avatarUrl
    };
  }

  private createPasswordHash(password: string, email: string): string {
    const source = `${(email || '').trim().toLowerCase()}::${password || ''}`;
    let hash = 2166136261;

    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    return `fnv1a_${(hash >>> 0).toString(16)}`;
  }

  private normalizeRoute(url: string): string {
    const trimmedUrl = (url || '').trim();

    if (!trimmedUrl) {
      return '/';
    }

    return trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`;
  }

  private base64UrlEncode(value: string): string {
    const encoded = btoa(unescape(encodeURIComponent(value)));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  private base64UrlDecode(value: string): string {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    return decodeURIComponent(escape(atob(`${padded}${padding}`)));
  }

  private buildAvatarUrl(firstName: string, lastName: string): string {
    const safeFirstName = firstName || 'User';
    const safeLastName = lastName || 'Account';
    return `https://ui-avatars.com/api/?name=${safeFirstName}+${safeLastName}&background=20a04b&color=fff`;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
