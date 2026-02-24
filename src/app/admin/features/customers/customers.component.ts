import { Component, OnInit } from '@angular/core';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color, Label } from 'ng2-charts';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {

  // --- Summary Cards Data ---
  summaryCards = [
    { title: 'Total Customers', value: '11,040', change: '14.4%', isPositive: true },
    { title: 'New Customers', value: '2,370', change: '20%', isPositive: true },
    { title: 'Visitor', value: '250k', change: '20%', isPositive: true }
  ];

  // --- Chart Configuration (Customer Overview) ---
  public lineChartData: ChartDataSets[] = [
    { data: [22000, 22000, 37000, 37000, 26000, 48000, 30000, 41000, 41000], label: 'Active Customers' },
  ];
  public lineChartLabels: Label[] = ['Sun', '', 'Mon', '', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  public lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    legend: { display: false },
    scales: {
      xAxes: [{ gridLines: { display: false }, ticks: { fontColor: '#b0b0b0' } }],
      yAxes: [{
        gridLines: { color: '#f3f3f3', zeroLineColor: '#f3f3f3' },
        ticks: { fontColor: '#b0b0b0', min: 0, max: 50000, stepSize: 10000, callback: (value) => value + 'k' }
      }]
    },
    elements: {
      line: { tension: 0.4, borderWidth: 2, fill: true },
      point: { radius: 0, hitRadius: 10, hoverRadius: 5 }
    },
    tooltips: {
      backgroundColor: '#aaddbb',
      titleFontColor: '#000',
      bodyFontColor: '#000',
      borderColor: '#fff',
      borderWidth: 1
    }
  };
  public lineChartColors: Color[] = [
    {
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.15)',
    },
  ];
  public lineChartLegend = false;
  public lineChartType: 'line' = 'line'; // Typed correctly for ng2-charts v2

  // --- Customer Table Data ---
  customers = [
    { id: '#CUST001', name: 'John Doe', phone: '+1234567890', orders: 25, spend: '3,450.00', status: 'Active' },
    { id: '#CUST001', name: 'John Doe', phone: '+1234567890', orders: 25, spend: '3,450.00', status: 'Active' },
    { id: '#CUST001', name: 'John Doe', phone: '+1234567890', orders: 25, spend: '3,450.00', status: 'Active' },
    { id: '#CUST001', name: 'John Doe', phone: '+1234567890', orders: 25, spend: '3,450.00', status: 'Active' },
    { id: '#CUST001', name: 'Jane Smith', phone: '+1234567890', orders: 5, spend: '250.00', status: 'Inactive' },
    { id: '#CUST001', name: 'Emily Davis', phone: '+1234567890', orders: 30, spend: '4,600.00', status: 'VIP' },
    { id: '#CUST001', name: 'Jane Smith', phone: '+1234567890', orders: 5, spend: '250.00', status: 'Inactive' },
    { id: '#CUST001', name: 'John Doe', phone: '+1234567890', orders: 25, spend: '3,450.00', status: 'Active' },
    { id: '#CUST001', name: 'Emily Davis', phone: '+1234567890', orders: 30, spend: '4,600.00', status: 'VIP' },
    { id: '#CUST001', name: 'Jane Smith', phone: '+1234567890', orders: 5, spend: '250.00', status: 'Inactive' },
  ];

  constructor() { }

  ngOnInit(): void {
  }
}
