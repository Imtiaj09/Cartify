import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective, Label } from 'ng2-charts';
import { Subscription } from 'rxjs';
import { Order, OrderService } from '../../../shop/services/order.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  totalRevenue = 0;
  totalOrders = 0;
  pendingOrders = 0;
  uniqueCustomers = 0;
  recentOrders: Order[] = [];

  public lineChartData: ChartDataSets[] = [this.createRevenueDataset([0])];
  public lineChartLabels: Label[] = ['No Data'];
  public lineChartType: ChartType = 'line';
  public lineChartLegend = false;
  public lineChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [
        {
          gridLines: {
            display: false
          }
        }
      ],
      yAxes: [
        {
          ticks: {
            beginAtZero: true
          },
          gridLines: {
            color: '#e9ecef'
          }
        }
      ]
    },
    legend: {
      display: false
    }
  };

  private ordersSubscription?: Subscription;

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.ordersSubscription = this.orderService.allOrders$.subscribe((orders) => {
      this.totalOrders = orders.length;
      this.totalRevenue = orders
        .filter((order) => order.status !== 'Cancelled')
        .reduce((sum, order) => sum + order.total, 0);
      this.pendingOrders = orders.filter((order) => order.status === 'Pending').length;
      this.uniqueCustomers = this.calculateUniqueCustomers(orders);

      this.recentOrders = [...orders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      this.updateRevenueChart(orders);
    });
  }

  ngOnDestroy(): void {
    this.ordersSubscription?.unsubscribe();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge bg-warning text-dark';
      case 'Processing':
        return 'badge bg-secondary';
      case 'Shipped':
        return 'badge bg-info text-dark';
      case 'Delivered':
        return 'badge bg-success';
      case 'Cancelled':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  private calculateUniqueCustomers(orders: Order[]): number {
    const uniqueKeys = new Set<string>();

    orders.forEach((order) => {
      const email = order.customerDetails.email.trim().toLowerCase();

      if (email) {
        uniqueKeys.add(`email:${email}`);
        return;
      }

      if (order.userId) {
        uniqueKeys.add(`user:${order.userId}`);
        return;
      }

      const fallbackName = order.customerDetails.name.trim().toLowerCase();
      if (fallbackName) {
        uniqueKeys.add(`name:${fallbackName}`);
      }
    });

    return uniqueKeys.size;
  }

  private updateRevenueChart(orders: Order[]): void {
    const revenueByDate = new Map<string, number>();

    orders.forEach((order) => {
      if (order.status === 'Cancelled') {
        return;
      }

      const orderDate = new Date(order.date);
      if (Number.isNaN(orderDate.getTime())) {
        return;
      }

      const key = this.toDateKey(orderDate);
      revenueByDate.set(key, (revenueByDate.get(key) || 0) + order.total);
    });

    const sortedKeys = Array.from(revenueByDate.keys()).sort();
    const lastSevenKeys = sortedKeys.slice(-7);

    if (lastSevenKeys.length === 0) {
      this.lineChartLabels = ['No Data'];
      this.lineChartData = [this.createRevenueDataset([0])];
      this.chart?.update();
      return;
    }

    this.lineChartLabels = lastSevenKeys.map((key) => this.formatDateLabel(key));
    const points = lastSevenKeys.map((key) => Number((revenueByDate.get(key) || 0).toFixed(2)));
    this.lineChartData = [this.createRevenueDataset(points)];
    this.chart?.update();
  }

  private createRevenueDataset(points: number[]): ChartDataSets {
    return {
      data: points,
      label: 'Revenue',
      fill: true,
      lineTension: 0.4,
      borderColor: '#50a571',
      backgroundColor: 'rgba(80, 165, 113, 0.1)',
      pointBackgroundColor: '#50a571',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#50a571'
    };
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateLabel(dateKey: string): string {
    const date = new Date(`${dateKey}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateKey;
    }

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  }
}
