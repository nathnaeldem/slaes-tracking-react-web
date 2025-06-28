import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getReportData } from '../services/reportService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

const ReportsPage = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data } = await getReportData(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!reportData) return;
    
    import('jspdf').then(jsPDFModule => {
      import('jspdf-autotable').then(autoTableModule => {
        const { jsPDF } = jsPDFModule;
        const autoTable = autoTableModule.default;
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Report title
        doc.setFontSize(18);
        doc.text('Financial Analysis Report', pageWidth / 2, 15, null, null, 'center');
        
        // Date range
        doc.setFontSize(12);
        doc.text(`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, pageWidth / 2, 25, null, null, 'center');
        
        // Key metrics
        doc.setFontSize(14);
        doc.text('Financial Summary', 14, 35);
        
        const metricsData = [
          ['Total Sales', `ETB ${reportData.metrics.totalSales.toLocaleString()}`],
          ['Total Cost', `ETB ${reportData.metrics.totalCost.toLocaleString()}`],
          ['Gross Profit', `ETB ${reportData.metrics.totalProfit.toLocaleString()}`],
          ['Total Expenses', `ETB ${reportData.metrics.totalSpending.toLocaleString()}`],
          ['Net Profit', `ETB ${reportData.metrics.netProfit.toLocaleString()}`]
        ];
        
        autoTable(doc, {
          startY: 40,
          head: [['Metric', 'Value']],
          body: metricsData,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 12 }
        });
        
        // Transactions table
        doc.setFontSize(14);
        doc.text('Product Transactions', 14, doc.lastAutoTable.finalY + 10);
        
        const transactions = reportData.transactions.map(t => {
          const unitPrice = t.unit_price;
          const totalSale = t.total_sale;
          return [
            t.product_name,
            t.quantity,
            `ETB ${unitPrice.toLocaleString()} × ${t.quantity}`,
            `ETB ${totalSale.toLocaleString()}`,
            `ETB ${(t.import_price * t.quantity).toLocaleString()}`,
            new Date(t.transaction_date).toLocaleDateString()
          ];
        });
        
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Product', 'Qty', 'Import Price', 'Sold Price', 'Cost', 'Date']],
          body: transactions,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 10 },
          pageBreak: 'auto'
        });
        
        // Expenses table
        doc.setFontSize(14);
        doc.text('Expenses', 14, doc.lastAutoTable.finalY + 10);
        
        const expenses = reportData.spendings.map(s => [
          s.reason,
          s.category,
          `ETB ${s.amount.toLocaleString()}`,
          new Date(s.transaction_date).toLocaleDateString()
        ]);
        
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 15,
          head: [['Reason', 'Category', 'Amount', 'Date']],
          body: expenses,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          styles: { fontSize: 10 }
        });
        
        // Save the PDF
        doc.save(`financial-report-${new Date().toISOString().split('T')[0]}.pdf`);
      });
    });
  };

  // Prepare data for charts
  const prepareChartData = () => {
    if (!reportData) return null;
    
    const profitChartData = {
      labels: reportData.dailyData.map(item => item.date),
      datasets: [
        {
          label: 'Sales (ETB)',
          data: reportData.dailyData.map(item => item.sales),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y'
        },
        {
          label: 'Profit (ETB)',
          data: reportData.dailyData.map(item => item.profit),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          yAxisID: 'y'
        }
      ]
    };
    
    const profitChartOptions = {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: { 
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Amount (ETB)' }
        }
      }
    };
    
    const profitByCategoryData = {
      labels: reportData.profitByCategory.map(item => item.category),
      datasets: [{
        label: 'Profit (ETB)',
        data: reportData.profitByCategory.map(item => item.profit),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    return { profitChartData, profitChartOptions, profitByCategoryData };
  };
  
  const chartData = prepareChartData();

  return (
    <div className="container py-4">
      <div className="page-header mb-4">
        <h2 className="mb-2">Financial Analysis Dashboard</h2>
        <p className="text-muted">Detailed insights into sales, costs, and profitability</p>
      </div>
      
      <div className="report-controls card mb-4 p-3">
        <div className="d-flex flex-wrap align-items-center gap-3">
          <label className="mb-0">Date Range:</label>
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="form-control"
          />
          <span>to</span>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            className="form-control"
          />
          <button 
            onClick={fetchReportData} 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Loading...
              </>
            ) : 'Refresh'}
          </button>
          {reportData && (
            <button 
              onClick={handleExportPDF} 
              className="btn btn-success"
            >
              Export PDF
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Generating financial report...</p>
        </div>
      ) : reportData ? (
        <>
          <div className="row mb-4">
            <div className="col-md-2 mb-3">
              <div className="card bg-primary text-white p-3">
                <h5 className="card-title">Total Sales</h5>
                <p className="card-text display-6">ETB {reportData.metrics.totalSales.toLocaleString()}</p>
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <div className="card bg-danger text-white p-3">
                <h5 className="card-title">Total Cost</h5>
                <p className="card-text display-6">ETB {reportData.metrics.totalCost.toLocaleString()}</p>
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <div className="card bg-success text-white p-3">
                <h5 className="card-title">Gross Profit</h5>
                <p className="card-text display-6">ETB {reportData.metrics.totalProfit.toLocaleString()}</p>
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <div className="card bg-warning text-dark p-3">
                <h5 className="card-title">Expenses</h5>
                <p className="card-text display-6">ETB {reportData.metrics.totalSpending.toLocaleString()}</p>
              </div>
            </div>
            <div className="col-md-2 mb-3">
              <div className="card bg-info text-white p-3">
                <h5 className="card-title">Net Profit</h5>
                <p className="card-text display-6">ETB {reportData.metrics.netProfit.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="row mb-4">
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h4 className="card-title">Daily Sales & Profit</h4>
                  {chartData && <Line data={chartData.profitChartData} options={chartData.profitChartOptions} />}
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h4 className="card-title">Profit by Category</h4>
                  {chartData && <Bar data={chartData.profitByCategoryData} />}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-body">
              <h4 className="card-title">Product Transactions</h4>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total Sale</th>
                      <th>Cost</th>
                      <th>Profit</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.map((t, index) => {
                      const unitPrice = t.unit_price;
                      const totalSale = t.total_sale;
                      const TutalCusta = totalSale * t.quantity;
                      const totalCost = t.import_price * t.quantity;
                      const profit = TutalCusta - totalCost  ;
                      
                      return (
                        <tr key={index}>
                          <td>{t.product_name}</td>
                          <td>{t.quantity}</td>
                          <td>ETB {unitPrice.toLocaleString()}</td>
                          <td>ETB {totalSale.toLocaleString()}</td>
                          <td>ETB {totalCost.toLocaleString()}</td>
                          <td className={profit >= 0 ? 'text-success' : 'text-danger'}>
                            ETB {profit.toLocaleString()}
                          </td>
                          <td>{new Date(t.transaction_date).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Expenses</h4>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Reason</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.spendings.map((s, index) => (
                      <tr key={index}>
                        <td>{s.reason}</td>
                        <td>{s.category}</td>
                        <td className="text-danger">ETB {s.amount.toLocaleString()}</td>
                        <td>{new Date(s.transaction_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-info text-center">
          <p>Select a date range and click "Refresh" to generate financial report</p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;