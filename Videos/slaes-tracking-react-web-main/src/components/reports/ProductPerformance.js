// Remove problematic import
// Replace with:
import { Bar } from 'react-chartjs-2';
import { getProductPerformance } from '../../services/reportService';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useState,useEffect } from 'react';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const ProductPerformance = () => {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data } = await getProductPerformance();
    setProducts(data);
  };

  // Prepare chart data
  const chartData = {
    labels: products.map(p => p.name),
    datasets: [
      {
        label: 'Units Sold',
        data: products.map(p => p.total_sold),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Revenue (ETB)',
        data: products.map(p => p.total_revenue),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        type: 'line',
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Units Sold' }
      },
      y1: {
        position: 'right',
        title: { display: true, text: 'Revenue (ETB)' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Product Performance</h3>
      </div>
      
      <div className="card-body">
        {products.length > 0 ? (
          <>
            <Bar data={chartData} options={options} />
            
            <div className="performance-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Total Revenue</th>
                    <th>Avg. Price</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.total_sold}</td>
                      <td>{product.total_revenue} ETB</td>
                      <td>{product.avg_price} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p>Loading product performance data...</p>
        )}
      </div>
    </div>
  );
};

export default ProductPerformance;