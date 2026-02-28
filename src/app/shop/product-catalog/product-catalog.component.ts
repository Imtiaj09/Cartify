import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product, ProductBadge, ProductService } from '../../shared/services/product.service';

type SortBy = 'newest' | 'priceLowToHigh' | 'priceHighToLow' | 'bestSelling';

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
export class ProductCatalogComponent implements OnInit {
  readonly starScale: number[] = [1, 2, 3, 4, 5];
  readonly ratingOptions: number[] = [5, 4, 3, 2, 1];
  readonly sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'priceLowToHigh', label: 'Price: Low to High' },
    { value: 'priceHighToLow', label: 'Price: High to Low' },
    { value: 'bestSelling', label: 'Best Selling' }
  ];
  readonly priceMin = 1000;
  readonly priceStep = 500;
  readonly loadStep = 8;

  readonly defaultCategories: string[] = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];
  readonly defaultColorOptions: ColorOption[] = [
    { name: 'Mint', value: '#aaddbb' },
    { name: 'Rose', value: '#ffb7b2' },
    { name: 'Sky', value: '#b2d8ff' },
    { name: 'Sand', value: '#f5f5dc' },
    { name: 'Charcoal', value: '#4a4a4a' }
  ];

  products: Product[] = [];
  categories: string[] = [...this.defaultCategories];
  colorOptions: ColorOption[] = [...this.defaultColorOptions];

  selectedCategories: string[] = [];
  selectedColor = '';
  selectedRating = 0;
  sortBy: SortBy = 'newest';
  priceRangeMax = this.priceMin;
  maxPrice = this.priceRangeMax;
  visibleCount = this.loadStep;
  isMobileFiltersOpen = false;

  selectedGalleryProduct: Product | null = null;
  isGalleryModalOpen = false;

  private readonly colorNameMap: Record<string, string> = {
    '#aaddbb': 'Mint',
    '#ffb7b2': 'Rose',
    '#b2d8ff': 'Sky',
    '#f5f5dc': 'Sand',
    '#4a4a4a': 'Charcoal'
  };

  constructor(
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.route.queryParams.subscribe((params) => {
      if (params['category']) {
        const category = params['category'];
        if (!this.selectedCategories.includes(category)) {
          this.selectedCategories = [category];
        }
      }

      if (params['sort']) {
        const sortParam = params['sort'] as SortBy;
        if (this.sortOptions.some((option) => option.value === sortParam)) {
          this.sortBy = sortParam;
        }
      }

      this.resetVisibleCount();
    });
  }

  get filteredProducts(): Product[] {
    const categorySet = new Set(this.selectedCategories);

    const filtered = this.products.filter((product) => {
      if (categorySet.size > 0 && !categorySet.has(product.category)) {
        return false;
      }

      if (this.selectedColor && !product.colors.includes(this.selectedColor)) {
        return false;
      }

      if (this.selectedRating > 0 && this.getProductRating(product) < this.selectedRating) {
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

      if (this.sortBy === 'bestSelling') {
        return (b.salesCount || 0) - (a.salesCount || 0);
      }

      return this.getProductCreatedAtTimestamp(b) - this.getProductCreatedAtTimestamp(a);
    });

    return filtered;
  }

  get visibleProducts(): Product[] {
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

  getEffectivePrice(product: Product): number {
    return product.discountedPrice ?? product.price;
  }

  hasDiscount(product: Product): boolean {
    return product.discountedPrice !== null && product.discountedPrice < product.price;
  }

  getDiscountPercent(product: Product): number {
    if (!this.hasDiscount(product) || product.discountedPrice === null) {
      return 0;
    }

    return Math.round(((product.price - product.discountedPrice) / product.price) * 100);
  }

  getProductRating(product: Product): number {
    return product.rating ?? 4;
  }

  getProductReviewCount(product: Product): number {
    return product.reviewCount ?? 0;
  }

  getProductBadge(product: Product): ProductBadge {
    if (product.badge === 'Sale' || product.badge === 'Hot') {
      return product.badge;
    }

    if (this.hasDiscount(product)) {
      return 'Sale';
    }

    if (product.isHighlighted) {
      return 'Hot';
    }

    return null;
  }

  openGallery(product: Product): void {
    this.selectedGalleryProduct = product;
    this.isGalleryModalOpen = true;
  }

  closeGallery(): void {
    this.isGalleryModalOpen = false;
    this.selectedGalleryProduct = null;
  }

  trackByProductId(index: number, product: Product): number {
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

  private loadProducts(): void {
    const hydratedProducts = this.productService
      .getProducts()
      .map((product) => this.hydrateProduct(product));

    this.products = hydratedProducts;
    this.categories = this.buildCategories(hydratedProducts);
    this.colorOptions = this.buildColorOptions(hydratedProducts);

    this.priceRangeMax = this.computePriceRangeMax();
    this.maxPrice = this.priceRangeMax;
  }

  private hydrateProduct(product: Product): Product {
    const normalizedMainImage = product.mainImage || this.getPlaceholderImage(product.name);
    const normalizedImages = product.images && product.images.length > 0 ? product.images : [normalizedMainImage];

    return {
      ...product,
      rating: product.rating ?? 4,
      reviewCount: product.reviewCount ?? 0,
      badge: this.getProductBadge(product),
      createdAt: product.createdAt || new Date().toISOString(),
      mainImage: normalizedMainImage,
      images: normalizedImages
    };
  }

  private buildCategories(products: Product[]): string[] {
    const categories = products
      .map((product) => product.category)
      .filter((category) => Boolean(category));

    const uniqueCategories = Array.from(new Set(categories));

    if (uniqueCategories.length === 0) {
      return [...this.defaultCategories];
    }

    return uniqueCategories;
  }

  private buildColorOptions(products: Product[]): ColorOption[] {
    const colors = products.reduce((allColors: string[], product) => {
      const productColors = Array.isArray(product.colors) ? product.colors : [];
      return [...allColors, ...productColors];
    }, []);

    const uniqueColors = Array.from(new Set(colors));

    if (uniqueColors.length === 0) {
      return [...this.defaultColorOptions];
    }

    return uniqueColors.map((value) => ({
      value,
      name: this.colorNameMap[value.toLowerCase()] ?? value
    }));
  }

  private resetVisibleCount(): void {
    this.visibleCount = this.loadStep;
  }

  private getProductCreatedAtTimestamp(product: Product): number {
    const timestamp = new Date(product.createdAt).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private computePriceRangeMax(): number {
    const highestPrice = this.products.reduce((maxPrice, product) => {
      const effectivePrice = product.discountedPrice ?? product.price;
      return Math.max(maxPrice, product.price, effectivePrice);
    }, this.priceMin);

    return Math.ceil(highestPrice / this.priceStep) * this.priceStep;
  }

  private getPlaceholderImage(label: string): string {
    const normalizedLabel = encodeURIComponent((label || 'Product').trim());
    return `https://placehold.co/900x1100/f2f5f8/2f3438?text=${normalizedLabel}`;
  }
}
