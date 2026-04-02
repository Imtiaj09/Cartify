import { Component, OnInit, HostListener } from '@angular/core';

@Component({
  selector: 'app-admin-role',
  templateUrl: './admin-role.component.html',
  styleUrls: ['./admin-role.component.css']
})
export class AdminRoleComponent implements OnInit {

  // Password visibility states
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  showProfilePassword = false;

  // Country Code Logic
  countries = [
    { code: '+880', flag: 'https://flagcdn.com/w20/bd.png', name: 'BD' },
    { code: '+91', flag: 'https://flagcdn.com/w20/in.png', name: 'IN' },
    { code: '+1', flag: 'https://flagcdn.com/w20/us.png', name: 'US' },
    { code: '+44', flag: 'https://flagcdn.com/w20/gb.png', name: 'UK' }
  ];
  selectedCountry = this.countries[0]; // Default to BD
  isCountryDropdownOpen = false;

  // Credit Card Logic
  selectedCardType = 'Mastercard';
  cardNumber = '2345'; // Default last 4 digits

  // Social Media Modal Logic
  isSocialModalOpen = false;
  socialLinks = {
    google: '',
    linkedin: '',
    facebook: '',
    twitter: ''
  };

  // Active Social Links (for display in Profile Card)
  activeSocialLinks = {
    google: '',
    linkedin: '',
    facebook: '',
    twitter: ''
  };

  // Profile Image Logic
  defaultProfileImage = 'https://via.placeholder.com/100';
  profileImage = this.defaultProfileImage;

  constructor() { }

  ngOnInit(): void {
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'current') {
      this.showCurrentPassword = !this.showCurrentPassword;
    } else if (field === 'new') {
      this.showNewPassword = !this.showNewPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    } else if (field === 'profile') {
      this.showProfilePassword = !this.showProfilePassword;
    }
  }

  toggleCountryDropdown(event: Event): void {
    event.stopPropagation();
    this.isCountryDropdownOpen = !this.isCountryDropdownOpen;
  }

  selectCountry(country: any): void {
    this.selectedCountry = country;
    this.isCountryDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.isCountryDropdownOpen = false;
  }

  onCardTypeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedCardType = select.value;

    // Set default digits based on card type
    if (this.selectedCardType === 'Mastercard') {
      this.cardNumber = '2345';
    } else if (this.selectedCardType === 'Visa') {
      this.cardNumber = '6789';
    } else {
      this.cardNumber = '';
    }
  }

  openSocialModal(): void {
    this.isSocialModalOpen = true;
  }

  closeSocialModal(): void {
    this.isSocialModalOpen = false;
  }

  saveSocialLinks(): void {
    // Copy current input values to active links
    this.activeSocialLinks = { ...this.socialLinks };
    this.closeSocialModal();
  }

  // Profile Image Handling
  triggerProfileUpload(): void {
    const fileInput = document.getElementById('profileUploadInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImage = e.target.result;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  deleteProfileImage(): void {
    this.profileImage = this.defaultProfileImage;
  }
}
