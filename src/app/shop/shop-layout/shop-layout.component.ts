import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-shop-layout',
  templateUrl: './shop-layout.component.html',
  styleUrls: ['./shop-layout.component.css']
})
export class ShopLayoutComponent implements OnInit {
  isHeaderScrolled = false;

  ngOnInit(): void {
    this.updateScrollState();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollState();
  }

  private updateScrollState(): void {
    this.isHeaderScrolled = typeof window !== 'undefined' && window.scrollY > 8;
  }
}
