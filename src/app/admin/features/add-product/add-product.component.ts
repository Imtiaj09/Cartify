import { Component, OnInit } from '@angular/core';
import { NewProductInput, ProductService } from '../../../shared/services/product.service';

interface AddProductFormModel {
  name: string;
  description: string;
  price: number | null;
  discountedPrice: number | null;
  category: string;
  stock: number | null;
  isHighlighted: boolean;
}

interface DraftAddProductState {
  form: AddProductFormModel;
  selectedColors: string[];
  selectedTag: string;
  customTags: string;
  productImages: string[];
  mainImage: string;
}

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit {
  readonly categories: string[] = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];
  readonly quickTags: string[] = ['Trending', 'New Arrival', 'Best Seller', 'Limited Edition'];
  readonly colors: string[] = ['#aaddbb', '#ffb7b2', '#b2d8ff', '#f5f5dc', '#4a4a4a'];

  productImages: string[] = [];
  mainImage = '';

  selectedColors: string[] = [];
  selectedTag = '';
  customTags = '';

  isPublishing = false;
  publishAlertMessage = '';
  publishAlertType: 'success' | 'danger' | '' = '';

  productForm: AddProductFormModel = this.createInitialFormState();

  private readonly draftStorageKey = 'cartify_add_product_draft';

  constructor(private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.loadDraft();
  }

  selectColor(color: string): void {
    if (this.selectedColors.includes(color)) {
      this.selectedColors = this.selectedColors.filter((selectedColor) => selectedColor !== color);
    } else {
      this.selectedColors = [...this.selectedColors, color];
    }

    this.saveDraft();
  }

  isColorSelected(color: string): boolean {
    return this.selectedColors.includes(color);
  }

  triggerFileInput(inputId: string): void {
    const fileInput = document.getElementById(inputId) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.click();
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    try {
      const files = Array.from(input.files);

      for (const file of files) {
        const compressedImage = await this.productService.compressImageFile(file, 100);
        this.productImages = [...this.productImages, compressedImage];

        if (!this.mainImage) {
          this.mainImage = compressedImage;
        }
      }

      this.saveDraft();
    } catch {
      this.showAlert('danger', 'Failed to process one or more selected images.');
    } finally {
      input.value = '';
    }
  }

  async onReplaceFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0 || !this.mainImage) {
      return;
    }

    try {
      const file = input.files[0];
      const compressedImage = await this.productService.compressImageFile(file, 100);
      const selectedIndex = this.productImages.indexOf(this.mainImage);

      if (selectedIndex >= 0) {
        this.productImages[selectedIndex] = compressedImage;
      } else {
        this.productImages = [compressedImage, ...this.productImages];
      }

      this.mainImage = compressedImage;
      this.saveDraft();
    } catch {
      this.showAlert('danger', 'Failed to replace the selected image.');
    } finally {
      input.value = '';
    }
  }

  setMainImage(image: string): void {
    this.mainImage = image;
    this.saveDraft();
  }

  removeImage(image: string, event: Event): void {
    event.stopPropagation();

    this.productImages = this.productImages.filter((item) => item !== image);

    if (this.mainImage === image) {
      this.mainImage = this.productImages.length > 0 ? this.productImages[0] : '';
    }

    this.saveDraft();
  }

  saveDraft(): void {
    const draftState: DraftAddProductState = {
      form: this.productForm,
      selectedColors: this.selectedColors,
      selectedTag: this.selectedTag,
      customTags: this.customTags,
      productImages: this.productImages,
      mainImage: this.mainImage
    };

    localStorage.setItem(this.draftStorageKey, JSON.stringify(draftState));
  }

  async publishProduct(): Promise<void> {
    this.clearAlert();

    const validationMessage = this.validateBeforePublish();

    if (validationMessage) {
      this.showAlert('danger', validationMessage);
      return;
    }

    this.isPublishing = true;

    try {
      const price = Number(this.productForm.price);
      const normalizedDiscountedPrice =
        this.productForm.discountedPrice === null || this.productForm.discountedPrice === undefined
          ? null
          : Number(this.productForm.discountedPrice);

      const payload: NewProductInput = {
        name: this.productForm.name.trim(),
        description: this.productForm.description.trim(),
        price,
        discountedPrice:
          normalizedDiscountedPrice !== null && normalizedDiscountedPrice >= 0 && normalizedDiscountedPrice < price
            ? normalizedDiscountedPrice
            : null,
        category: this.productForm.category,
        tags: this.buildTags(),
        colors: this.selectedColors,
        stock: Math.max(0, Number(this.productForm.stock) || 0),
        isHighlighted: this.productForm.isHighlighted,
        mainImage: this.mainImage || this.getPlaceholderImage(this.productForm.name),
        images: this.productImages.length > 0 ? this.productImages : [this.getPlaceholderImage(this.productForm.name)],
        rating: 4,
        reviewCount: 0,
        badge: normalizedDiscountedPrice !== null ? 'Sale' : null
      };

      this.productService.addProduct(payload);
      this.resetFormState();
      this.showAlert('success', 'Product published successfully and synced to local storage.');
    } catch {
      this.showAlert('danger', 'Failed to publish product. Please try again.');
    } finally {
      this.isPublishing = false;
    }
  }

  private loadDraft(): void {
    const rawDraft = localStorage.getItem(this.draftStorageKey);

    if (!rawDraft) {
      return;
    }

    try {
      const parsedDraft = JSON.parse(rawDraft) as DraftAddProductState;

      this.productForm = {
        ...this.createInitialFormState(),
        ...parsedDraft.form
      };
      this.selectedColors = Array.isArray(parsedDraft.selectedColors) ? parsedDraft.selectedColors : [];
      this.selectedTag = parsedDraft.selectedTag || '';
      this.customTags = parsedDraft.customTags || '';
      this.productImages = Array.isArray(parsedDraft.productImages) ? parsedDraft.productImages : [];
      this.mainImage = parsedDraft.mainImage || (this.productImages.length > 0 ? this.productImages[0] : '');
    } catch {
      localStorage.removeItem(this.draftStorageKey);
    }
  }

  private validateBeforePublish(): string {
    if (!this.productForm.name.trim()) {
      return 'Product name is required.';
    }

    if (!this.productForm.description.trim()) {
      return 'Product description is required.';
    }

    if (this.productForm.price === null || Number(this.productForm.price) <= 0) {
      return 'Product price must be greater than 0.';
    }

    if (!this.productForm.category) {
      return 'Please select a product category.';
    }

    if (this.selectedColors.length === 0) {
      return 'Please select at least one color.';
    }

    return '';
  }

  private buildTags(): string[] {
    const tagsFromInput = this.customTags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => Boolean(tag));

    const mergedTags = this.selectedTag ? [this.selectedTag, ...tagsFromInput] : tagsFromInput;

    if (mergedTags.length === 0) {
      return ['New Arrival'];
    }

    return Array.from(new Set(mergedTags));
  }

  private getPlaceholderImage(label: string): string {
    const normalizedLabel = encodeURIComponent((label || 'Product').trim());
    return `https://placehold.co/900x1100/f2f5f8/2f3438?text=${normalizedLabel}`;
  }

  private resetFormState(): void {
    this.productForm = this.createInitialFormState();
    this.selectedColors = [];
    this.selectedTag = '';
    this.customTags = '';
    this.productImages = [];
    this.mainImage = '';
    localStorage.removeItem(this.draftStorageKey);
  }

  private createInitialFormState(): AddProductFormModel {
    return {
      name: '',
      description: '',
      price: null,
      discountedPrice: null,
      category: '',
      stock: 0,
      isHighlighted: false
    };
  }

  private clearAlert(): void {
    this.publishAlertMessage = '';
    this.publishAlertType = '';
  }

  private showAlert(type: 'success' | 'danger', message: string): void {
    this.publishAlertType = type;
    this.publishAlertMessage = message;
  }
}
