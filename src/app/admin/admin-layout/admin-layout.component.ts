import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AdminPermissionKey, AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {

  pageTitle: string = 'Dashboard';
  isSidebarOpen: boolean = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // 1. Set title immediately on load (Fixes Refresh Bug)
    this.updateTitleFromRoute();

    // 2. Update title on subsequent navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateTitleFromRoute();
    });
  }

  private updateTitleFromRoute(): void {
    let child = this.activatedRoute.firstChild;
    while (child?.firstChild) {
      child = child.firstChild;
    }
    // Use 'title' from route data, or fallback to 'Dashboard'
    this.pageTitle = child?.snapshot.data['title'] || 'Dashboard';
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  hasPermission(permission: AdminPermissionKey): boolean {
    return this.authService.hasPermission(permission);
  }
}
