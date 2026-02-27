import { Component } from '@angular/core';

type SortBy = 'newest' | 'priceLowToHigh' | 'priceHighToLow';
type ProductBadge = 'Sale' | 'Hot' | null;

interface CatalogProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  discountedPrice: number | null;
  category: string;
  tags: string[];
  colors: string[];
  rating: number;
  reviewCount: number;
  badge: ProductBadge;
  createdAt: string;
  images: string[];
}

interface SortOption {
  value: SortBy;
  label: string;
}

interface ColorOption {
  name: string;
  value: string;
}

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.css']
})
export class ProductCatalogComponent {
  readonly categories: string[] = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];
  readonly colorOptions: ColorOption[] = [
    { name: 'Mint', value: '#aaddbb' },
    { name: 'Rose', value: '#ffb7b2' },
    { name: 'Sky', value: '#b2d8ff' },
    { name: 'Sand', value: '#f5f5dc' },
    { name: 'Charcoal', value: '#4a4a4a' }
  ];
  readonly starScale: number[] = [1, 2, 3, 4, 5];
  readonly ratingOptions: number[] = [5, 4, 3, 2, 1];
  readonly sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'priceLowToHigh', label: 'Price: Low to High' },
    { value: 'priceHighToLow', label: 'Price: High to Low' }
  ];
  readonly priceMin = 1000;
  readonly priceStep = 500;
  readonly loadStep = 8;

  readonly products: CatalogProduct[] = [
    {
      id: 1,
      name: 'Quantum X Smartphone',
      description: 'Flagship 5G phone with pro-grade camera and all-day battery.',
      price: 64900,
      discountedPrice: 58900,
      category: 'Electronics',
      tags: ['New Arrival', '5G'],
      colors: ['#4a4a4a', '#b2d8ff'],
      rating: 5,
      reviewCount: 182,
      badge: 'Hot',
      createdAt: '2026-02-15T08:30:00Z',
      images: [
        'https://placehold.co/900x1100/eef5ff/1f2a44?text=Quantum+X+Front',
        'https://placehold.co/900x1100/dce8fb/1f2a44?text=Quantum+X+Back'
      ]
    },
    {
      id: 2,
      name: 'Noise-Cancel Headphones',
      description: 'Wireless over-ear headphones with active noise cancellation.',
      price: 11900,
      discountedPrice: 8900,
      category: 'Electronics',
      tags: ['Best Seller', 'Wireless'],
      colors: ['#4a4a4a', '#f5f5dc'],
      rating: 5,
      reviewCount: 264,
      badge: 'Sale',
      createdAt: '2026-02-10T06:20:00Z',
      images: [
        'https://placehold.co/900x1100/f1f5f9/2f3438?text=Headphones+Front',
        'https://placehold.co/900x1100/e5eaef/2f3438?text=Headphones+Side'
      ]
    },
    {
      id: 3,
      name: '4K Smart TV 55"',
      description: 'Cinema-grade 4K panel with HDR and voice assistant built in.',
      price: 72500,
      discountedPrice: 69900,
      category: 'Electronics',
      tags: ['Home Cinema', 'Limited'],
      colors: ['#4a4a4a'],
      rating: 4,
      reviewCount: 88,
      badge: null,
      createdAt: '2026-01-27T13:00:00Z',
      images: [
        'https://placehold.co/900x1100/eaf0f6/2f3438?text=4K+Smart+TV+Front',
        'https://placehold.co/900x1100/d8e2ef/2f3438?text=4K+Smart+TV+Angle'
      ]
    },
    {
      id: 4,
      name: 'Classic Bomber Jacket',
      description: 'Premium bomber jacket with soft inner lining for daily wear.',
      price: 5900,
      discountedPrice: 4700,
      category: 'Fashion',
      tags: ['Men', 'Winter'],
      colors: ['#4a4a4a', '#aaddbb'],
      rating: 4,
      reviewCount: 136,
      badge: 'Sale',
      createdAt: '2026-02-03T10:40:00Z',
      images: [
        'https://placehold.co/900x1100/f7f9fc/3d4348?text=Bomber+Jacket+Front',
        'https://placehold.co/900x1100/e6ebf1/3d4348?text=Bomber+Jacket+Back'
      ]
    },
    {
      id: 5,
      name: 'Linen Co-ord Set',
      description: 'Breathable linen set crafted for relaxed everyday styling.',
      price: 4800,
      discountedPrice: null,
      category: 'Fashion',
      tags: ['Women', 'Minimal'],
      colors: ['#f5f5dc', '#ffb7b2'],
      rating: 4,
      reviewCount: 74,
      badge: null,
      createdAt: '2026-01-22T09:10:00Z',
      images: [
        'https://placehold.co/900x1100/faf7f2/6b5f54?text=Linen+Set+Front',
        'https://placehold.co/900x1100/f2ece4/6b5f54?text=Linen+Set+Detail'
      ]
    },
    {
      id: 6,
      name: 'Street Runner Sneakers',
      description: 'Lightweight cushioning and grip-focused outsole for all-day walks.',
      price: 6900,
      discountedPrice: 5900,
      category: 'Sports',
      tags: ['Unisex', 'Running'],
      colors: ['#b2d8ff', '#4a4a4a'],
      rating: 4,
      reviewCount: 194,
      badge: 'Hot',
      createdAt: '2026-02-06T11:55:00Z',
      images: [
        'https://placehold.co/900x1100/f2f7ff/22324a?text=Runner+Sneakers+Side',
        'https://placehold.co/900x1100/e2ebfa/22324a?text=Runner+Sneakers+Top'
      ]
    },
    {
      id: 7,
      name: 'Pro Yoga Mat',
      description: 'High-density anti-slip yoga mat with moisture-resistant finish.',
      price: 2400,
      discountedPrice: 1990,
      category: 'Sports',
      tags: ['Fitness', 'Home Gym'],
      colors: ['#aaddbb', '#ffb7b2'],
      rating: 5,
      reviewCount: 121,
      badge: 'Sale',
      createdAt: '2026-01-29T07:05:00Z',
      images: [
        'https://placehold.co/900x1100/ecfaf2/24563d?text=Yoga+Mat+Rolled',
        'https://placehold.co/900x1100/dcf1e4/24563d?text=Yoga+Mat+Flat'
      ]
    },
    {
      id: 8,
      name: 'Digital Air Fryer 6L',
      description: 'Oil-light cooking with smart presets and rapid heat circulation.',
      price: 10500,
      discountedPrice: 9400,
      category: 'Home',
      tags: ['Kitchen', 'Smart'],
      colors: ['#4a4a4a', '#f5f5dc'],
      rating: 4,
      reviewCount: 83,
      badge: null,
      createdAt: '2026-01-18T14:30:00Z',
      images: [
        'https://placehold.co/900x1100/f6f7f8/3f4447?text=Air+Fryer+Front',
        'https://placehold.co/900x1100/e8eaed/3f4447?text=Air+Fryer+Open'
      ]
    },
    {
      id: 9,
      name: 'Espresso Maker Pro',
      description: '19-bar pressure machine delivering cafe-level espresso at home.',
      price: 18500,
      discountedPrice: 16200,
      category: 'Home',
      tags: ['Coffee', 'Premium'],
      colors: ['#4a4a4a', '#b2d8ff'],
      rating: 5,
      reviewCount: 91,
      badge: 'Hot',
      createdAt: '2026-02-12T16:45:00Z',
      images: [
        'https://placehold.co/900x1100/f2f5f8/273240?text=Espresso+Maker+Front',
        'https://placehold.co/900x1100/e5ebf1/273240?text=Espresso+Maker+Side'
      ]
    },
    {
      id: 10,
      name: 'Minimal Desk Lamp',
      description: 'Warm to cool adjustable lighting with touch dimmer controls.',
      price: 3200,
      discountedPrice: null,
      category: 'Home',
      tags: ['Workspace', 'Lighting'],
      colors: ['#f5f5dc', '#4a4a4a'],
      rating: 4,
      reviewCount: 57,
      badge: null,
      createdAt: '2026-01-05T08:00:00Z',
      images: [
        'https://placehold.co/900x1100/fcf9f2/7a6850?text=Desk+Lamp+On',
        'https://placehold.co/900x1100/f3ecdf/7a6850?text=Desk+Lamp+Off'
      ]
    },
    {
      id: 11,
      name: 'Glow Repair Skincare Set',
      description: 'Hydrating cleanser, serum and cream bundle for daily glow.',
      price: 4200,
      discountedPrice: 3600,
      category: 'Beauty',
      tags: ['Skincare', 'Bundle'],
      colors: ['#ffb7b2', '#f5f5dc'],
      rating: 5,
      reviewCount: 146,
      badge: 'Sale',
      createdAt: '2026-02-08T12:20:00Z',
      images: [
        'https://placehold.co/900x1100/fff2f2/7a3d45?text=Skincare+Set+Front',
        'https://placehold.co/900x1100/ffe7e7/7a3d45?text=Skincare+Set+Flatlay'
      ]
    },
    {
      id: 12,
      name: 'Matte Lip Palette',
      description: 'Long-wear matte shades designed for bold and natural looks.',
      price: 1900,
      discountedPrice: null,
      category: 'Beauty',
      tags: ['Makeup', 'Daily Use'],
      colors: ['#ffb7b2', '#4a4a4a'],
      rating: 4,
      reviewCount: 66,
      badge: null,
      createdAt: '2026-01-14T15:10:00Z',
      images: [
        'https://placehold.co/900x1100/fff4f5/6d4048?text=Lip+Palette+Open',
        'https://placehold.co/900x1100/ffe9ec/6d4048?text=Lip+Palette+Swatches'
      ]
    },
    {
      id: 13,
      name: 'Pulse Bluetooth Speaker',
      description: 'Portable speaker with deep bass and 14-hour playback time.',
      price: 5600,
      discountedPrice: 4900,
      category: 'Electronics',
      tags: ['Portable', 'Party'],
      colors: ['#4a4a4a', '#aaddbb'],
      rating: 4,
      reviewCount: 118,
      badge: 'Sale',
      createdAt: '2026-02-01T05:45:00Z',
      images: [
        'https://placehold.co/900x1100/f1f6f3/2c4a3a?text=Bluetooth+Speaker+Front',
        'https://placehold.co/900x1100/e2ede6/2c4a3a?text=Bluetooth+Speaker+Back'
      ]
    },
    {
      id: 14,
      name: 'Urban Travel Backpack',
      description: 'Water-resistant commuter backpack with padded laptop sleeve.',
      price: 4100,
      discountedPrice: 3500,
      category: 'Fashion',
      tags: ['Travel', 'Utility'],
      colors: ['#4a4a4a', '#b2d8ff'],
      rating: 4,
      reviewCount: 109,
      badge: null,
      createdAt: '2026-01-26T10:00:00Z',
      images: [
        'https://placehold.co/900x1100/f2f6fb/2e3a4e?text=Travel+Backpack+Front',
        'https://placehold.co/900x1100/e3ebf6/2e3a4e?text=Travel+Backpack+Inside'
      ]
    },
    {
      id: 15,
      name: 'Smart Fitness Band',
      description: 'Track heart rate, sleep and workouts with a bright AMOLED screen.',
      price: 7800,
      discountedPrice: 6900,
      category: 'Sports',
      tags: ['Wearable', 'Health'],
      colors: ['#4a4a4a', '#ffb7b2'],
      rating: 5,
      reviewCount: 207,
      badge: 'Hot',
      createdAt: '2026-02-14T18:15:00Z',
      images: [
        'https://placehold.co/900x1100/f6f7f9/1f2733?text=Fitness+Band+Display',
        'https://placehold.co/900x1100/e8ecf1/1f2733?text=Fitness+Band+Strap'
      ]
    },
    {
      id: 16,
      name: 'Robot Vacuum Cleaner',
      description: 'Smart mapping robot vacuum with app scheduling and auto-charge.',
      price: 33500,
      discountedPrice: 29900,
      category: 'Home',
      tags: ['Smart Home', 'Cleaning'],
      colors: ['#f5f5dc', '#4a4a4a'],
      rating: 4,
      reviewCount: 73,
      badge: 'Sale',
      createdAt: '2026-02-04T04:50:00Z',
      images: [
        'https://placehold.co/900x1100/f8f8f3/444444?text=Robot+Vacuum+Top',
        'https://placehold.co/900x1100/ebebe2/444444?text=Robot+Vacuum+Dock'
      ]
    }
  ];

  readonly priceRangeMax = this.computePriceRangeMax();

  selectedCategories: string[] = [];
  selectedColor = '';
  selectedRating = 0;
  sortBy: SortBy = 'newest';
  maxPrice = this.priceRangeMax;
  visibleCount = this.loadStep;
  isMobileFiltersOpen = false;

  get filteredProducts(): CatalogProduct[] {
    const categorySet = new Set(this.selectedCategories);

    const filtered = this.products.filter((product) => {
      if (categorySet.size > 0 && !categorySet.has(product.category)) {
        return false;
      }

      if (this.selectedColor && !product.colors.includes(this.selectedColor)) {
        return false;
      }

      if (this.selectedRating > 0 && product.rating < this.selectedRating) {
        return false;
      }

      if (this.getEffectivePrice(product) > this.maxPrice) {
        return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (this.sortBy === 'priceLowToHigh') {
        return this.getEffectivePrice(a) - this.getEffectivePrice(b);
      }

      if (this.sortBy === 'priceHighToLow') {
        return this.getEffectivePrice(b) - this.getEffectivePrice(a);
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }

  get visibleProducts(): CatalogProduct[] {
    return this.filteredProducts.slice(0, this.visibleCount);
  }

  get showingCount(): number {
    return this.visibleProducts.length;
  }

  get totalCount(): number {
    return this.filteredProducts.length;
  }

  get canLoadMore(): boolean {
    return this.visibleCount < this.totalCount;
  }

  onCategoryChange(category: string, event: Event): void {
    const target = event.target as HTMLInputElement | null;

    if (!target) {
      return;
    }

    if (target.checked && !this.selectedCategories.includes(category)) {
      this.selectedCategories = [...this.selectedCategories, category];
    }

    if (!target.checked) {
      this.selectedCategories = this.selectedCategories.filter((item) => item !== category);
    }

    this.resetVisibleCount();
  }

  onMaxPriceChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;

    if (!target) {
      return;
    }

    this.maxPrice = Number(target.value);
    this.resetVisibleCount();
  }

  onColorFilterChange(color: string): void {
    this.selectedColor = this.selectedColor === color ? '' : color;
    this.resetVisibleCount();
  }

  onRatingFilterChange(rating: number): void {
    this.selectedRating = this.selectedRating === rating ? 0 : rating;
    this.resetVisibleCount();
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement | null;

    if (!target) {
      return;
    }

    const selectedValue = target.value as SortBy;

    if (this.sortOptions.some((option) => option.value === selectedValue)) {
      this.sortBy = selectedValue;
    }
  }

  loadMore(): void {
    this.visibleCount = Math.min(this.visibleCount + this.loadStep, this.totalCount);
  }

  openMobileFilters(): void {
    this.isMobileFiltersOpen = true;
  }

  closeMobileFilters(): void {
    this.isMobileFiltersOpen = false;
  }

  clearAllFilters(): void {
    this.selectedCategories = [];
    this.selectedColor = '';
    this.selectedRating = 0;
    this.maxPrice = this.priceRangeMax;
    this.resetVisibleCount();
  }

  clearPriceFilter(): void {
    this.maxPrice = this.priceRangeMax;
    this.resetVisibleCount();
  }

  clearColorFilter(): void {
    this.selectedColor = '';
    this.resetVisibleCount();
  }

  clearRatingFilter(): void {
    this.selectedRating = 0;
    this.resetVisibleCount();
  }

  removeCategoryFilter(category: string): void {
    this.selectedCategories = this.selectedCategories.filter((item) => item !== category);
    this.resetVisibleCount();
  }

  isCategorySelected(category: string): boolean {
    return this.selectedCategories.includes(category);
  }

  getColorLabel(colorValue: string): string {
    const color = this.colorOptions.find((item) => item.value === colorValue);
    return color ? color.name : colorValue;
  }

  getEffectivePrice(product: CatalogProduct): number {
    return product.discountedPrice ?? product.price;
  }

  hasDiscount(product: CatalogProduct): boolean {
    return product.discountedPrice !== null && product.discountedPrice < product.price;
  }

  getDiscountPercent(product: CatalogProduct): number {
    if (!this.hasDiscount(product) || product.discountedPrice === null) {
      return 0;
    }

    return Math.round(((product.price - product.discountedPrice) / product.price) * 100);
  }

  trackByProductId(index: number, product: CatalogProduct): number {
    return product.id;
  }

  trackByValue(index: number, value: string | number): string | number {
    return value;
  }

  trackBySort(index: number, option: SortOption): string {
    return option.value;
  }

  trackByColor(index: number, color: ColorOption): string {
    return color.value;
  }

  private resetVisibleCount(): void {
    this.visibleCount = this.loadStep;
  }

  private computePriceRangeMax(): number {
    const highestPrice = this.products.reduce((maxPrice, product) => {
      const effectivePrice = product.discountedPrice ?? product.price;
      return Math.max(maxPrice, product.price, effectivePrice);
    }, 0);

    return Math.ceil(highestPrice / this.priceStep) * this.priceStep;
  }
}
