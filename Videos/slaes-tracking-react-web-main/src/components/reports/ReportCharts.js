import React from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const ReportCharts = ({ reportData }) => {

  const lineChartData = {
    labels: reportData?.daily_summary?.map(d => new Date(d.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Sales',
        data: reportData?.daily_summary?.map(d => Number(d.sales)) || [],
        borderColor: 'rgba(0, 184, 148, 1)',
        backgroundColor: 'rgba(0, 184, 148, 0.2)',
        fill: true,
      },
      {
        label: 'Expenses',
        data: reportData?.daily_summary?.map(d => Number(d.expenses)) || [],
        borderColor: 'rgba(225, 112, 85, 1)',
        backgroundColor: 'rgba(225, 112, 85, 0.2)',
        fill: true,
      },
    ],
  };

  const salesPieData = {
    labels: reportData?.sales_by_payment_method?.map(p => p.payment_method) || [],
    datasets: [
      {
        data: reportData?.sales_by_payment_method?.map(p => Number(p.total_sales)) || [],
        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f'],
      },
    ],
  };

  const expensesPieData = {
    labels: reportData?.expense_categories?.map(e => e.category) || [],
    datasets: [
      {
        data: reportData?.expense_categories?.map(e => Number(e.total_expenses)) || [],
        backgroundColor: ['#9b59b6', '#34495e', '#e67e22', '#1abc9c'],
      },
    ],
  };

  return (
    <div className="row mb-4">
      {reportData?.daily_summary && (
        <div className="col-md-12 mb-4">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Daily Sales & Expenses</h4>
              <Line data={lineChartData} />
            </div>
          </div>
        </div>
      )}
      {reportData?.sales_by_payment_method && (
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="card-title">Sales by Payment Method</h4>
              <Pie data={salesPieData} />
            </div>
          </div>
        </div>
      )}
      {reportData?.expense_categories && (
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="card-title">Expenses by Category</h4>
              <Pie data={expensesPieData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportCharts;
