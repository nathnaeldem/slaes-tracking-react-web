// Remove problematic imports
// Replace with:
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useEffect,useState } from 'react';
import { getSalesData } from '../../services/reportService';
// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);
const SalesDashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  
  useEffect(() => {
    fetchSalesData();
  }, [startDate, endDate]);

  const fetchSalesData = async () => {
    const { data } = await getSalesData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    setSalesData(data);
  };

  // Chart data configuration
  const chartData = {
    labels: salesData.map(item => item.date),
    datasets: [
      {
        label: 'Daily Sales (ETB)',
        data: salesData.map(item => item.total_sales),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'Transactions',
        data: salesData.map(item => item.transactions),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        type: 'bar',
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Sales (ETB)' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: { display: true, text: 'Transactions' },
        grid: { drawOnChartArea: false }
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Sales Analytics</h3>
        <div className="date-range">
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
          />
          <span>to</span>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
          />
        </div>
      </div>
      
      <div className="card-body">
        {salesData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <p>No sales data available for selected period</p>
        )}
      </div>
    </div>
  );
};
export default SalesDashboard