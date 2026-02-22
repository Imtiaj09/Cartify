import { Component, ViewChild } from '@angular/core';
import { ChartDataSets, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective, Label } from 'ng2-charts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  // Line Chart Configuration
  public lineChartData: ChartDataSets[] = [
    {
      data: [10, 12, 8, 14, 11, 13, 9],
      label: 'Revenue',
      fill: true,
      lineTension: 0.4,
      borderColor: '#50a571',
      backgroundColor: 'rgba(80, 165, 113, 0.1)',
      pointBackgroundColor: '#50a571',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#50a571'
    }
  ];
  public lineChartLabels: Label[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

  // Bar Chart Configuration
  public barChartData: ChartDataSets[] = [
    {
      data: [6, 7, 8, 6, 7, 8, 9, 10, 8, 7, 6, 8, 9, 10, 11],
      label: 'Users',
      backgroundColor: '#50a571'
    }
  ];
  public barChartLabels: Label[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
  public barChartType: ChartType = 'bar';
  public barChartLegend = false;
  public barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      xAxes: [
        {
          display: false
        }
      ],
      yAxes: [
        {
          display: false
        }
      ]
    },
    legend: {
      display: false
    }
  };
}
