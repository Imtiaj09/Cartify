import { Component, OnDestroy, OnInit } from '@angular/core';

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

  private countdownTimerId: ReturnType<typeof setInterval> | null = null;
  private readonly dealEndAt = Date.now() + (2 * 24 * 60 * 60 + 13 * 60 * 60 + 18 * 60 + 25) * 1000;

  ngOnInit(): void {
    this.updateCountdown();
    this.countdownTimerId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
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
