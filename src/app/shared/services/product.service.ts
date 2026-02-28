import { Injectable } from '@angular/core';

export type ProductBadge = 'Sale' | 'Hot' | null;

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountedPrice: number | null;
  category: string;
  tags: string[];
  colors: string[];
  stock: number;
  isHighlighted: boolean;
  mainImage: string;
  images: string[];
  createdAt: string;
  rating?: number;
  reviewCount?: number;
  badge?: ProductBadge;
  salesCount?: number;
}

export type NewProductInput = Omit<Product, 'id' | 'createdAt'> & Partial<Pick<Product, 'createdAt'>>;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly storageKey = 'cartify_products';

  constructor() {
    this.seedProductsIfEmpty();
  }

  seedProductsIfEmpty(): void {
    const currentProducts = this.readProductsFromStorage();

    if (currentProducts.length > 0) {
      return;
    }

    this.writeProductsToStorage(this.getSeedProducts());
  }

  getProducts(): Product[] {
    this.seedProductsIfEmpty();
    return this.readProductsFromStorage();
  }

  getHighlightedProducts(): Product[] {
    return this.getProducts().filter((product) => product.isHighlighted);
  }

  addProduct(productInput: NewProductInput): Product {
    const products = this.getProducts();
    const nextId = products.reduce((maxId, product) => Math.max(maxId, product.id), 0) + 1;

    const normalizedProduct: Product = this.normalizeProduct({
      ...productInput,
      id: nextId,
      createdAt: productInput.createdAt ?? new Date().toISOString()
    } as Product);

    const updatedProducts = [normalizedProduct, ...products];
    this.writeProductsToStorage(updatedProducts);
    return normalizedProduct;
  }

  async compressImageFile(file: File, maxSizeKb = 100): Promise<string> {
    const sourceDataUrl = await this.readFileAsDataUrl(file);
    const image = await this.loadImage(sourceDataUrl);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return sourceDataUrl;
    }

    const originalWidth = image.naturalWidth || image.width;
    const originalHeight = image.naturalHeight || image.height;

    if (originalWidth <= 0 || originalHeight <= 0) {
      return sourceDataUrl;
    }

    let quality = 0.86;
    let scale = 1;
    let bestDataUrl = sourceDataUrl;

    for (let attempt = 0; attempt < 14; attempt++) {
      const width = Math.max(1, Math.round(originalWidth * scale));
      const height = Math.max(1, Math.round(originalHeight * scale));

      canvas.width = width;
      canvas.height = height;

      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      bestDataUrl = compressedDataUrl;

      if (this.getDataUrlSizeKb(compressedDataUrl) <= maxSizeKb) {
        return compressedDataUrl;
      }

      if (quality > 0.5) {
        quality -= 0.08;
      } else {
        scale *= 0.84;
      }
    }

    return bestDataUrl;
  }

  private readProductsFromStorage(): Product[] {
    const rawProducts = localStorage.getItem(this.storageKey);

    if (!rawProducts) {
      return [];
    }

    try {
      const parsedProducts = JSON.parse(rawProducts) as Product[];

      if (!Array.isArray(parsedProducts)) {
        return [];
      }

      return parsedProducts.map((product) => this.normalizeProduct(product));
    } catch {
      return [];
    }
  }

  private writeProductsToStorage(products: Product[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(products));
  }

  private normalizeProduct(product: Product): Product {
    const normalizedPrice = Number(product.price) || 0;
    const normalizedDiscountedPrice =
      product.discountedPrice === null || product.discountedPrice === undefined
        ? null
        : Number(product.discountedPrice);

    return {
      id: Number(product.id) || 0,
      name: (product.name || '').trim(),
      description: (product.description || '').trim(),
      price: normalizedPrice,
      discountedPrice:
        normalizedDiscountedPrice !== null && normalizedDiscountedPrice >= 0 && normalizedDiscountedPrice < normalizedPrice
          ? normalizedDiscountedPrice
          : null,
      category: (product.category || 'General').trim(),
      tags: Array.isArray(product.tags)
        ? product.tags.map((tag) => String(tag).trim()).filter((tag) => Boolean(tag))
        : [],
      colors: Array.isArray(product.colors)
        ? product.colors.map((color) => String(color).trim()).filter((color) => Boolean(color))
        : [],
      stock: Math.max(0, Number(product.stock) || 0),
      isHighlighted: Boolean(product.isHighlighted),
      mainImage: product.mainImage || this.getPlaceholderImage(product.name || 'Product'),
      images:
        Array.isArray(product.images) && product.images.length > 0
          ? product.images.filter((image) => Boolean(image))
          : [product.mainImage || this.getPlaceholderImage(product.name || 'Product')],
      createdAt: product.createdAt || new Date().toISOString(),
      rating: typeof product.rating === 'number' ? product.rating : 4,
      reviewCount: typeof product.reviewCount === 'number' ? product.reviewCount : 0,
      badge: this.normalizeBadge(product.badge),
      salesCount: typeof product.salesCount === 'number' ? product.salesCount : 0
    };
  }

  private normalizeBadge(badge: ProductBadge | undefined): ProductBadge {
    if (badge === 'Sale' || badge === 'Hot') {
      return badge;
    }

    return null;
  }

  private async readFileAsDataUrl(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result;

        if (typeof result === 'string') {
          resolve(result);
          return;
        }

        reject(new Error('Failed to read image file.'));
      };

      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }

  private async loadImage(source: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to load image.'));
      image.src = source;
    });
  }

  private getDataUrlSizeKb(dataUrl: string): number {
    const parts = dataUrl.split(',');

    if (parts.length < 2) {
      return 0;
    }

    const base64 = parts[1];
    const padding = (base64.match(/=*$/) || [''])[0].length;
    const bytes = (base64.length * 3) / 4 - padding;
    return bytes / 1024;
  }

  private getPlaceholderImage(label: string): string {
    const sanitizedLabel = encodeURIComponent(label.replace(/\s+/g, ' ').trim());
    return `https://placehold.co/900x1100/f2f5f8/2f3438?text=${sanitizedLabel}`;
  }

  private getSeedProducts(): Product[] {
    return [
      {
        id: 1,
        name: 'Quantum X Smartphone',
        description: 'Flagship 5G phone with pro-grade camera and all-day battery.',
        price: 64900,
        discountedPrice: 58900,
        category: 'Electronics',
        tags: ['New Arrival', 'Trending', '5G'],
        colors: ['#4a4a4a', '#b2d8ff'],
        stock: 28,
        isHighlighted: true,
        mainImage: 'https://placehold.co/900x1100/eef5ff/1f2a44?text=Quantum+X+Front',
        images: [
          'https://placehold.co/900x1100/eef5ff/1f2a44?text=Quantum+X+Front',
          'https://placehold.co/900x1100/dce8fb/1f2a44?text=Quantum+X+Back'
        ],
        createdAt: '2026-02-15T08:30:00Z',
        rating: 5,
        reviewCount: 182,
        badge: 'Hot',
        salesCount: 1200
      },
      {
        id: 2,
        name: 'Noise-Cancel Headphones',
        description: 'Wireless over-ear headphones with active noise cancellation.',
        price: 11900,
        discountedPrice: 8900,
        category: 'Electronics',
        tags: ['Best Seller', 'Trending', 'Wireless'],
        colors: ['#4a4a4a', '#f5f5dc'],
        stock: 64,
        isHighlighted: true,
        mainImage: 'https://placehold.co/900x1100/f1f5f9/2f3438?text=Headphones+Front',
        images: [
          'https://placehold.co/900x1100/f1f5f9/2f3438?text=Headphones+Front',
          'https://placehold.co/900x1100/e5eaef/2f3438?text=Headphones+Side'
        ],
        createdAt: '2026-02-10T06:20:00Z',
        rating: 5,
        reviewCount: 264,
        badge: 'Sale',
        salesCount: 850
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
        stock: 14,
        isHighlighted: false,
        mainImage: 'https://placehold.co/900x1100/eaf0f6/2f3438?text=4K+Smart+TV+Front',
        images: [
          'https://placehold.co/900x1100/eaf0f6/2f3438?text=4K+Smart+TV+Front',
          'https://placehold.co/900x1100/d8e2ef/2f3438?text=4K+Smart+TV+Angle'
        ],
        createdAt: '2026-01-27T13:00:00Z',
        rating: 4,
        reviewCount: 88,
        badge: null,
        salesCount: 320
      },
      {
        id: 4,
        name: 'Classic Bomber Jacket',
        description: 'Premium bomber jacket with soft inner lining for daily wear.',
        price: 5900,
        discountedPrice: 4700,
        category: 'Fashion',
        tags: ['Men', 'Trending', 'Winter'],
        colors: ['#4a4a4a', '#aaddbb'],
        stock: 92,
        isHighlighted: true,
        mainImage: 'https://placehold.co/900x1100/f7f9fc/3d4348?text=Bomber+Jacket+Front',
        images: [
          'https://placehold.co/900x1100/f7f9fc/3d4348?text=Bomber+Jacket+Front',
          'https://placehold.co/900x1100/e6ebf1/3d4348?text=Bomber+Jacket+Back'
        ],
        createdAt: '2026-02-03T10:40:00Z',
        rating: 4,
        reviewCount: 136,
        badge: 'Sale',
        salesCount: 540
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
        stock: 55,
        isHighlighted: false,
        mainImage: 'https://placehold.co/900x1100/faf7f2/6b5f54?text=Linen+Set+Front',
        images: [
          'https://placehold.co/900x1100/faf7f2/6b5f54?text=Linen+Set+Front',
          'https://placehold.co/900x1100/f2ece4/6b5f54?text=Linen+Set+Detail'
        ],
        createdAt: '2026-01-22T09:10:00Z',
        rating: 4,
        reviewCount: 74,
        badge: null,
        salesCount: 210
      },
      {
        id: 6,
        name: 'Street Runner Sneakers',
        description: 'Lightweight cushioning and grip-focused outsole for all-day walks.',
        price: 6900,
        discountedPrice: 5900,
        category: 'Sports',
        tags: ['Unisex', 'Trending', 'Running'],
        colors: ['#b2d8ff', '#4a4a4a'],
        stock: 78,
        isHighlighted: true,
        mainImage: 'https://placehold.co/900x1100/f2f7ff/22324a?text=Runner+Sneakers+Side',
        images: [
          'https://placehold.co/900x1100/f2f7ff/22324a?text=Runner+Sneakers+Side',
          'https://placehold.co/900x1100/e2ebfa/22324a?text=Runner+Sneakers+Top'
        ],
        createdAt: '2026-02-06T11:55:00Z',
        rating: 4,
        reviewCount: 194,
        badge: 'Hot',
        salesCount: 980
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
        stock: 143,
        isHighlighted: false,
        mainImage: 'https://placehold.co/900x1100/ecfaf2/24563d?text=Yoga+Mat+Rolled',
        images: [
          'https://placehold.co/900x1100/ecfaf2/24563d?text=Yoga+Mat+Rolled',
          'https://placehold.co/900x1100/dcf1e4/24563d?text=Yoga+Mat+Flat'
        ],
        createdAt: '2026-01-29T07:05:00Z',
        rating: 5,
        reviewCount: 121,
        badge: 'Sale',
        salesCount: 450
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
        stock: 38,
        isHighlighted: false,
        mainImage: 'https://placehold.co/900x1100/f6f7f8/3f4447?text=Air+Fryer+Front',
        images: [
          'https://placehold.co/900x1100/f6f7f8/3f4447?text=Air+Fryer+Front',
          'https://placehold.co/900x1100/e8eaed/3f4447?text=Air+Fryer+Open'
        ],
        createdAt: '2026-01-18T14:30:00Z',
        rating: 4,
        reviewCount: 83,
        badge: null,
        salesCount: 670
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
        stock: 22,
        isHighlighted: true,
        mainImage: 'https://placehold.co/900x1100/f2f5f8/273240?text=Espresso+Maker+Front',
        images: [
          'https://placehold.co/900x1100/f2f5f8/273240?text=Espresso+Maker+Front',
          'https://placehold.co/900x1100/e5ebf1/273240?text=Espresso+Maker+Side'
        ],
        createdAt: '2026-02-12T16:45:00Z',
        rating: 5,
        reviewCount: 91,
        badge: 'Hot',
        salesCount: 340
      },
      {
        id: 10,
        name: 'Glow Repair Skincare Set',
        description: 'Hydrating cleanser, serum and cream bundle for daily glow.',
        price: 4200,
        discountedPrice: 3600,
        category: 'Beauty',
        tags: ['Skincare', 'Bundle', 'Trending'],
        colors: ['#ffb7b2', '#f5f5dc'],
        stock: 86,
        isHighlighted: true,
        mainImage: 'https://placehold.co/900x1100/fff2f2/7a3d45?text=Skincare+Set+Front',
        images: [
          'https://placehold.co/900x1100/fff2f2/7a3d45?text=Skincare+Set+Front',
          'https://placehold.co/900x1100/ffe7e7/7a3d45?text=Skincare+Set+Flatlay'
        ],
        createdAt: '2026-02-08T12:20:00Z',
        rating: 5,
        reviewCount: 146,
        badge: 'Sale',
        salesCount: 760
      }
    ];
  }
}
