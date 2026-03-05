import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Login from './components/Login';
import './App.css';

// 1. UPDATE THIS URL with your live Render backend link
const API_URL = "https://rent-tracker-rmhk.onrender.com"; 

const PROPERTIES_LIST = ["351, Sector 56", "2628, Gali 26", "Gali 40, Sanjay Colony"];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function App() {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [payments, setPayments] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedYear, setSelectedYear] = useState('All Years');

  const [formData, setFormData] = useState({ 
    property_name: PROPERTIES_LIST[0], tenant_name: '', base_rent: '', 
    electricity_units: '', electricity_amount: '',
    month: MONTHS[new Date().getMonth()], date: new Date().toISOString().split('T')[0] 
  });

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    setToken(null);
    setPayments([]);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data || []);
    } catch (err) { 
      if (err.response && err.response.status === 401) handleLogout();
      console.error("Error fetching data:", err); 
    }
  }, [token, handleLogout]);

  useEffect(() => {
    if (token) loadData();
    document.body.className = darkMode ? 'dark-mode' : '';
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    document.title = "Rentals.";
  }, [darkMode, token, loadData]);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const handleLogin = (accessToken) => {
    setToken(accessToken);
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    const br = parseFloat(formData.base_rent) || 0;
    const ea = parseFloat(formData.electricity_amount) || 0;
    const total = br + ea;

    const payload = { 
      ...formData, 
      base_rent: br,
      electricity_units: parseFloat(formData.electricity_units) || 0,
      electricity_amount: ea,
      total_amount: total
    };
    
    try {
      await axios.post(`${API_URL}/api/payments`, payload, authHeaders);
      setFormData({ ...formData, tenant_name: '', base_rent: '', electricity_units: '', electricity_amount: '' });
      loadData();
    } catch (err) { 
      alert("Error saving record. Check if backend is awake."); 
    }
  };

  const printReceipt = (p) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Receipt - ${p.tenant_name}</title>
          <style>
            body { font-family: -apple-system, sans-serif; padding: 40px; color: #1d1d1f; }
            .receipt { border: 1px solid #e2e8f0; padding: 40px; border-radius: 24px; max-width: 400px; margin: auto; }
            .header { border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px; }
            .total { font-size: 24px; font-weight: 700; color: #0071e3; margin-top: 20px; border-top: 2px solid #0071e3; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2 style="margin:0">Rent Receipt</h2>
              <p style="color:#86868b; margin:5px 0 0 0">${p.property_name}</p>
            </div>
            <div class="row"><span>Tenant:</span> <strong>${p.tenant_name}</strong></div>
            <div class="row"><span>Date:</span> <span>${p.date}</span></div>
            <div class="row"><span>Period:</span> <span>${p.month} ${p.date.split('-')[0]}</span></div>
            <div class="row" style="margin-top:20px;"><span>Base Rent:</span> <span>₹${p.base_rent || 0}</span></div>
            <div class="row"><span>Electricity (${p.electricity_units || 0} Units):</span> <span>₹${p.electricity_amount || 0}</span></div>
            <div class="row total"><span>Total Paid:</span> <span>₹${p.total_amount || 0}</span></div>
            <p style="text-align:center; font-size:11px; color:#86868b; margin-top:30px;">Generated via Rentals. Dashboard</p>
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const formatCurrency = (v) => new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(v || 0);

  const getFiltered = (propName = null) => {
    let d = propName ? payments.filter(p => p.property_name === propName) : payments;
    if (selectedMonth !== 'All Months') d = d.filter(p => p.month === selectedMonth);
    if (selectedYear !== 'All Years') d = d.filter(p => p.date && p.date.startsWith(selectedYear));
    return d;
  };

  // Ensure s + i.total_amount handles potential null values to prevent NaN
  const grandTotal = getFiltered().reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
  const uniqueYears = ['All Years', ...new Set(payments.map(p => p.date ? p.date.split('-')[0] : ""))].filter(y => y !== "").sort().reverse();

  return (
    <div className="App">
      {!token ? (
        <Login API_URL={API_URL} onLogin={handleLogin} />
      ) : (
      <>
      <header className="apple-header">
        <h1>Rentals.</h1>
        <div className="summary-pill">
          <span>{selectedMonth} {selectedYear === 'All Years' ? '' : selectedYear} Total: </span>
          <span className="grand-total">{formatCurrency(grandTotal)}</span>
        </div>
        <div className="top-controls">
          <select className="apple-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="apple-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            <option value="All Months">All Months</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="apple-select" onClick={() => setDarkMode(!darkMode)}>{darkMode ? '☀️' : '🌙'}</button>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="form-container">
        <h3>Record Combined Payment</h3>
        <form onSubmit={handleSubmit} className="apple-form">
          <select className="apple-input" value={formData.property_name} onChange={e => setFormData({...formData, property_name: e.target.value})}>
            {PROPERTIES_LIST.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input className="apple-input" placeholder="Tenant" value={formData.tenant_name} onChange={e => setFormData({...formData, tenant_name: e.target.value})} required />
          <input className="apple-input" placeholder="Rent (₹)" type="number" value={formData.base_rent} onChange={e => setFormData({...formData, base_rent: e.target.value})} required />
          <input className="apple-input" placeholder="Elec Units" type="number" value={formData.electricity_units} onChange={e => setFormData({...formData, electricity_units: e.target.value})} />
          <input className="apple-input" placeholder="Elec Rent (₹)" type="number" value={formData.electricity_amount} onChange={e => setFormData({...formData, electricity_amount: e.target.value})} />
          <select className="apple-input" value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})}>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input className="apple-input" type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          <button type="submit" className="add-btn">Save Record</button>
        </form>
      </div>

      <div className="tables-container">
        {PROPERTIES_LIST.map(prop => {
          const filtered = getFiltered(prop);
          const propTotal = filtered.reduce((s, i) => s + (parseFloat(i.total_amount) || 0), 0);
          return (
            <div key={prop} className="property-card">
              <div className="prop-label">{prop}</div>
              <div className="prop-amount">{formatCurrency(propTotal)}</div>
              <div className="ledger-scroll">
                {filtered.map(p => (
                  <div key={p.id} className="apple-list-item">
                    <div>
                      <div className="tenant-name">{p.tenant_name}</div>
                      <div className="sub-text">Rent: ₹{p.base_rent || 0} | Elec: ₹{p.electricity_amount || 0} ({p.electricity_units || 0} U)</div>
                      <div className="sub-text">{p.date} • {p.month}</div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <span className="amount-small">{formatCurrency(p.total_amount)}</span>
                      <button className="receipt-btn" onClick={() => printReceipt(p)}>Slip</button>
                      <button className="del-btn-minimal" onClick={async () => {
                        if(window.confirm("Delete?")) { 
                          try {
                            await axios.delete(`${API_URL}/api/payments/${p.id}`, authHeaders); 
                            loadData(); 
                          } catch(err) { alert("Delete failed."); }
                        }
                      }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}
    </div>
  );
}
export default App;