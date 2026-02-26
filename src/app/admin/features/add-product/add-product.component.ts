import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css']
})
export class AddProductComponent implements OnInit {

  productImages: string[] = [];
  mainImage: string = '';

  // Color Selection Logic
  colors: string[] = ['#aaddbb', '#ffb7b2', '#b2d8ff', '#f5f5dc', '#4a4a4a'];
  selectedColor: string = '';

  constructor() { }

  ngOnInit(): void {
    this.loadFromLocalStorage();
  }

  // --- Color Selection Logic ---
  selectColor(color: string): void {
    this.selectedColor = color;
  }

  // --- Image Upload Logic ---

  triggerFileInput(inputId: string): void {
    const fileInput = document.getElementById(inputId) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      // Convert FileList to Array to process multiple files
      const files = Array.from(input.files);

      // Process each file sequentially to ensure all are saved
      files.forEach(file => {
        this.processFile(file);
      });

      input.value = ''; // Reset input
    }
  }

  onReplaceFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.mainImage) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newImage = e.target.result;
        const index = this.productImages.indexOf(this.mainImage);
        if (index !== -1) {
          this.productImages[index] = newImage;
        }
        this.mainImage = newImage;
        this.saveToLocalStorage();
      };
      reader.readAsDataURL(file);
      input.value = ''; // Reset input
    }
  }

  processFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64String = e.target.result;
      // Push to array first
      this.productImages.push(base64String);

      // Set main image if it's the first one
      if (!this.mainImage) {
        this.mainImage = base64String;
      }

      // Save to local storage after EACH file is processed
      this.saveToLocalStorage();
    };
    reader.readAsDataURL(file);
  }

  setMainImage(image: string): void {
    this.mainImage = image;
  }

  removeImage(image: string, event: Event): void {
    event.stopPropagation(); // Prevent triggering setMainImage
    const index = this.productImages.indexOf(image);
    if (index !== -1) {
      this.productImages.splice(index, 1);
      if (this.mainImage === image) {
        // If deleted image was main, set new main image (first one or empty)
        this.mainImage = this.productImages.length > 0 ? this.productImages[0] : '';
      }
      this.saveToLocalStorage();
    }
  }

  // --- Local Storage Persistence ---

  saveToLocalStorage(): void {
    // Ensure we are saving the current state of the array
    if (this.productImages.length > 0) {
        localStorage.setItem('draft_product_images', JSON.stringify(this.productImages));
    } else {
        localStorage.removeItem('draft_product_images');
    }
  }

  loadFromLocalStorage(): void {
    const storedImages = localStorage.getItem('draft_product_images');
    if (storedImages) {
      try {
        this.productImages = JSON.parse(storedImages);
        // Ensure mainImage is set if images exist but mainImage is empty
        if (this.productImages.length > 0 && !this.mainImage) {
          this.mainImage = this.productImages[0];
        }
      } catch (e) {
        console.error('Error parsing stored images', e);
        this.productImages = [];
      }
    }
  }
}
