import { Component, OnDestroy, OnInit } from '@angular/core';
import { Product, ProductBadge, ProductService } from '../../shared/services/product.service';

interface HeroSlide {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  imageAlt: string;
}

interface LimitedDeal {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  ctaLink: string;
  dealPrice: number;
  originalPrice: number;
  claimedPercent: number;
  claimedUnits: number;
  totalUnits: number;
}

interface CountdownState {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly starScale: number[] = [1, 2, 3, 4, 5];

  heroSlides: HeroSlide[] = [
    {
      eyebrow: 'Limited Time Offers',
      title: 'General Deals Up to 50% Off',
      subtitle: 'Unlock top picks across electronics, fashion, and home essentials.',
      ctaText: 'Shop Deals',
      ctaLink: '#',
      imageUrl: 'https://placehold.co/700x460/png?text=General+Deals',
      imageAlt: 'General deals products'
    },
    {
      eyebrow: 'Performance Upgrade',
      title: 'Gaming Tech Mega Sale',
      subtitle: 'From high-speed gear to next-gen accessories, build your winning setup.',
      ctaText: 'Shop Gaming',
      ctaLink: '#',
      imageUrl: 'https://placehold.co/700x460/png?text=Gaming+Tech',
      imageAlt: 'Gaming setup products'
    },
    {
      eyebrow: 'New Season Edit',
      title: "Men's Fashion Essentials",
      subtitle: 'Discover polished fits, statement layers, and everyday premium style.',
      ctaText: 'Shop Fashion',
      ctaLink: '#',
      imageUrl: 'https://placehold.co/700x460/png?text=Mens+Fashion',
      imageAlt: "Men's fashion collection"
    }
  ];

  limitedDeal: LimitedDeal = {
    title: 'Wireless Noise-Canceling Headphones',
    subtitle: 'Studio-grade sound, all-day comfort, and active noise canceling for focus anywhere.',
    imageUrl: 'https://placehold.co/740x520/png?text=Limited+Time+Deal',
    imageAlt: 'Limited-time headphone deal',
    ctaLink: '#',
    dealPrice: 98.0,
    originalPrice: 149.0,
    claimedPercent: 65,
    claimedUnits: 182,
    totalUnits: 280
  };

  countdown: CountdownState = {
    days: '00',
    hours: '00',
    minutes: '00',
    seconds: '00'
  };

  trendingProducts: Product[] = [];
  bestSellingProducts: Product[] = [];

  private countdownTimerId: ReturnType<typeof setInterval> | null = null;
  private readonly dealEndAt = Date.now() + (2 * 24 * 60 * 60 + 13 * 60 * 60 + 18 * 60 + 25) * 1000;

  constructor(private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.updateCountdown();
    this.countdownTimerId = setInterval(() => this.updateCountdown(), 1000);
    this.loadHomeProducts();
  }

  ngOnDestroy(): void {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
  }

  getEffectivePrice(product: Product): number {
    return product.discountedPrice ?? product.price;
  }

  hasDiscount(product: Product): boolean {
    return product.discountedPrice !== null && product.discountedPrice < product.price;
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

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  private loadHomeProducts(): void {
    const allProducts = this.productService.getProducts();

    this.trendingProducts = this.getTrendingProducts(allProducts);
    this.bestSellingProducts = this.getBestSellingProducts(allProducts);
    this.updateLimitedDeal(allProducts);
  }

  private getTrendingProducts(products: Product[]): Product[] {
    const trending = products.filter(
      (p) => p.isHighlighted || (p.tags && p.tags.some((tag) => tag.toLowerCase().includes('trending')))
    );

    return this.fillWithFallback(trending, 4);
  }

  private getBestSellingProducts(products: Product[]): Product[] {
    const bestSelling = products.filter((p) => p.discountedPrice !== null);
    return this.fillWithFallback(bestSelling, 4);
  }

  private updateLimitedDeal(products: Product[]): void {
    const bestDealProduct = products.reduce((best, current) => {
      if (current.discountedPrice === null) {
        return best;
      }

      const currentDiscount = (current.price - current.discountedPrice) / current.price;
      const bestDiscount = best && best.discountedPrice ? (best.price - best.discountedPrice) / best.price : 0;

      return currentDiscount > bestDiscount ? current : best;
    }, null as Product | null);

    if (bestDealProduct && bestDealProduct.discountedPrice !== null) {
      this.limitedDeal = {
        title: bestDealProduct.name,
        subtitle: bestDealProduct.description,
        imageUrl: bestDealProduct.mainImage,
        imageAlt: bestDealProduct.name,
        ctaLink: '#',
        dealPrice: bestDealProduct.discountedPrice,
        originalPrice: bestDealProduct.price,
        claimedPercent: 75,
        claimedUnits: Math.floor(bestDealProduct.stock * 0.75),
        totalUnits: bestDealProduct.stock
      };
    }
  }

  private fillWithFallback(products: Product[], count: number): Product[] {
    if (products.length >= count) {
      return products.slice(0, count);
    }

    const needed = count - products.length;
    const fallback = this.getDummyProducts().slice(0, needed);
    return [...products, ...fallback];
  }

  private getDummyProducts(): Product[] {
    return [
      {
        id: 991,
        name: 'Classic Bomber Jacket',
        description: 'Premium bomber jacket.',
        price: 8900,
        discountedPrice: 7900,
        category: 'Fashion',
        tags: ['Trending'],
        colors: [],
        stock: 10,
        isHighlighted: false,
        mainImage: 'https://placehold.co/900x1100/f7f9fc/3d4348?text=Bomber+Jacket',
        images: [],
        createdAt: new Date().toISOString(),
        rating: 4,
        reviewCount: 128,
        badge: 'Sale'
      },
      {
        id: 992,
        name: 'Chronograph Elite Watch',
        description: 'Luxury watch.',
        price: 12400,
        discountedPrice: 10900,
        category: 'Accessories',
        tags: ['Trending'],
        colors: [],
        stock: 10,
        isHighlighted: false,
        mainImage: 'https://placehold.co/900x1100/f2f5f8/2f3438?text=Smart+Watch',
        images: [],
        createdAt: new Date().toISOString(),
        rating: 5,
        reviewCount: 94,
        badge: 'Hot'
      },
      {
        id: 993,
        name: 'Street Runner Sneakers',
        description: 'Comfortable sneakers.',
        price: 7650,
        discountedPrice: 6990,
        category: 'Footwear',
        tags: ['Trending'],
        colors: [],
        stock: 10,
        isHighlighted: false,
        mainImage: 'https://placehold.co/900x1100/f2f7ff/22324a?text=Sneakers',
        images: [],
        createdAt: new Date().toISOString(),
        rating: 4,
        reviewCount: 72,
        badge: 'Sale'
      },
      {
        id: 994,
        name: 'Urban Cap',
        description: 'Stylish cap.',
        price: 2500,
        discountedPrice: 2200,
        category: 'Accessories',
        tags: ['Trending'],
        colors: [],
        stock: 10,
        isHighlighted: false,
        mainImage: 'https://placehold.co/900x1100/eef5ff/1f2a44?text=Cap',
        images: [],
        createdAt: new Date().toISOString(),
        rating: 4,
        reviewCount: 58,
        badge: 'Sale'
      }
    ];
  }

  private updateCountdown(): void {
    const remainingMs = Math.max(this.dealEndAt - Date.now(), 0);
    const totalSeconds = Math.floor(remainingMs / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.countdown = {
      days: this.formatTimeUnit(days),
      hours: this.formatTimeUnit(hours),
      minutes: this.formatTimeUnit(minutes),
      seconds: this.formatTimeUnit(seconds)
    };

    if (remainingMs === 0 && this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
  }

  private formatTimeUnit(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
