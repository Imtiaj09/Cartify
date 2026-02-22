import { Component, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  // Line Chart Configuration
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [10, 12, 8, 14, 11, 13, 9],
        label: 'Revenue',
        fill: true,
        tension: 0.4,
        borderColor: '#50a571',
        backgroundColor: 'rgba(80, 165, 113, 0.1)',
        pointBackgroundColor: '#50a571',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#50a571'
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#e9ecef'
        },
        ticks: {
          callback: function(value) {
            return value + 'k';
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y + 'k';
          }
        }
      }
    }
  };

  // Bar Chart Configuration
  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
    datasets: [
      {
        data: [6, 7, 8, 6, 7, 8, 9, 10, 8, 7, 6, 8, 9, 10, 11],
        label: 'Users',
        backgroundColor: '#50a571',
        borderRadius: 5
      }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: false
      },
      y: {
        display: false
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };
}
