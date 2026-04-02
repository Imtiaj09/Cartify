import { Component, OnInit } from '@angular/core';

interface Category {
  id: number;
  name: string;
  icon: string;
  itemCount: number;
}

interface Product {
  id: number;
  name: string;
  image: string;
  createdDate: string;
  orderCount: number;
}

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {

  categories: Category[] = [
    { id: 1, name: 'Electronics', icon: 'bi-laptop', itemCount: 120 },
    { id: 2, name: 'Fashion', icon: 'bi-bag', itemCount: 85 },
    { id: 3, name: 'Accessories', icon: 'bi-watch', itemCount: 45 },
    { id: 4, name: 'Home & Kitchen', icon: 'bi-house-door', itemCount: 60 },
    { id: 5, name: 'Sports', icon: 'bi-bicycle', itemCount: 30 },
    { id: 6, name: 'Beauty', icon: 'bi-stars', itemCount: 50 },
  ];

  products: Product[] = [
    { id: 1, name: 'Wireless Headphones', image: 'https://via.placeholder.com/40', createdDate: '2023-10-25', orderCount: 150 },
    { id: 2, name: 'Smart Watch', image: 'https://via.placeholder.com/40', createdDate: '2023-10-24', orderCount: 89 },
    { id: 3, name: 'Running Shoes', image: 'https://via.placeholder.com/40', createdDate: '2023-10-23', orderCount: 210 },
    { id: 4, name: 'Leather Wallet', image: 'https://via.placeholder.com/40', createdDate: '2023-10-22', orderCount: 45 },
    { id: 5, name: 'Sunglasses', image: 'https://via.placeholder.com/40', createdDate: '2023-10-21', orderCount: 76 },
    { id: 6, name: 'Backpack', image: 'https://via.placeholder.com/40', createdDate: '2023-10-20', orderCount: 112 },
    { id: 7, name: 'Gaming Mouse', image: 'https://via.placeholder.com/40', createdDate: '2023-10-19', orderCount: 34 },
    { id: 8, name: 'Mechanical Keyboard', image: 'https://via.placeholder.com/40', createdDate: '2023-10-18', orderCount: 98 },
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
