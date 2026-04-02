import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css']
})
export class TransactionsComponent implements OnInit {

  // --- Mock Data for UI ---

  // 1. Top Metric Cards
  summaryCards = [
    {
      title: 'Total Revenue',
      value: '৳35,450.00',
      change: '10.4%',
      isPositive: true,
      icon: 'bi-cash-stack'
    },
    {
      title: 'Completed Transactions',
      value: '1,240',
      change: '14.4%',
      isPositive: true,
      icon: 'bi-check2-circle'
    },
    {
      title: 'Pending Transactions',
      value: '58',
      change: '2.1%',
      isPositive: false,
      icon: 'bi-clock-history'
    },
    {
      title: 'Failed Transactions',
      value: '12',
      change: '1.8%',
      isPositive: false,
      icon: 'bi-x-circle'
    }
  ];

  // 2. Data for the main transactions table
  transactions = [
    { id: '#CUST001', name: 'Noman Manzoor', date: '25 Oct, 2023', total: '350.00', method: 'Mastercard', status: 'Complete' },
    { id: '#CUST002', name: 'Jane Smith', date: '25 Oct, 2023', total: '150.00', method: 'Visa', status: 'Pending' },
    { id: '#CUST003', name: 'John Doe', date: '24 Oct, 2023', total: '89.99', method: 'Bkash', status: 'Canceled' },
    { id: '#CUST004', name: 'Emily Davis', date: '23 Oct, 2023', total: '1,200.00', method: 'Mastercard', status: 'Complete' },
    { id: '#CUST005', name: 'Robert Brown', date: '22 Oct, 2023', total: '75.50', method: 'Nagad', status: 'Complete' },
    { id: '#CUST006', name: 'Mike Johnson', date: '21 Oct, 2023', total: '45.00', method: 'Visa', status: 'Pending' },
  ];

  // 3. Active filter for the table tabs
  activeFilter: string = 'All order';

  constructor() { }

  ngOnInit(): void {
  }

  // Helper function to set the active filter
  setFilter(filter: string): void {
    this.activeFilter = filter;
  }
}
