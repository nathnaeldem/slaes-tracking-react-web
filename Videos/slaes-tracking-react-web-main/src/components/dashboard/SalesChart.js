import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = ({ chartData, title }) => {
  if (!chartData || !chartData.labels || !chartData.data) {
    return <div>Loading chart data...</div>;
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Sales (ETB)',
        data: chartData.data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16
        }
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                callback: function(value) {
                    return 'ETB ' + value;
                }
            }
        }
    }
  };

  return (
    <div style={{ height: '400px', width: '100%' }}>
        <Bar data={data} options={options} />
    </div>
  );
};

export default SalesChart;
