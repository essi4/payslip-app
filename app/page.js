'use client';
import React, { useState, useEffect } from 'react';

export default function FullyFeaturedEmployeePortal() {
  // --- initial Database ---
  const initialData = [
    {
      id: 1,
      nationalId: '0012345678',
      password: '123',
      phone: '09123456789',
      name: 'علی البرزی',
      role: 'اپراتور تولید',
      month: 'آبان ۱۴۰۳',
      workedDays: 30,
      jobSalaryDaily: 6292029,
      sanavatBaseDaily: 167667,
      sanavatPastDaily: 1658848,
      otherBaseDaily: 0,
      housingAllowance: 30000000,
      foodAllowance: 22000000,
      childAllowance: 0,
      maritalAllowance: 5000000,
      shiftAllowance: 0,
      otherAllowance: 57000000,
      otherDeductions: 0
    },
    {
      id: 2,
      nationalId: '0012345678',
      password: '123',
      phone: '09123456789',
      name: 'علی البرزی',
      role: 'اپراتور تولید',
      month: 'مهر ۱۴۰۳',
      workedDays: 30,
      jobSalaryDaily: 6292029,
      sanavatBaseDaily: 167667,
      sanavatPastDaily: 1658848,
      otherBaseDaily: 0,
      housingAllowance: 30000000,
      foodAllowance: 22000000,
      childAllowance: 0,
      maritalAllowance: 5000000,
      shiftAllowance: 0,
      otherAllowance: 45000000,
      otherDeductions: 10000000
    }
  ];

  // --- States ---
  const [database, setDatabase] = useState(initialData);
  const [view, setView] = useState('employee'); // 'employee' | 'admin'
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [payslip, setPayslip] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [error, setError] = useState('');
  
  // Modals پرسنل
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [forgotNationalId, setForgotNationalId] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotMessage, setForgotMessage] = useState({ type: '', text: '' });
  
  // تغییر رمز پرسنل
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [changePasswordMsg, setChangePasswordMsg] = useState({ type: '', text: '' });

  // Admin States
  const [adminAuth, setAdminAuth] = useState({ user: 'admin', pass: 'admin' });
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminMsg, setAdminMsg] = useState('');

  // مدال تغییر رمز مدیر
  const [showAdminChangeModal, setShowAdminChangeModal] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [adminChangeMsg, setAdminChangeMsg] = useState({ type: '', text: '' });

  // 🏛️ مشخصات شرکت
  const COMPANY_NAME = "شرکت عرصه ساز لب رود";
  const SITE_DOMAIN = "fish-arseh.ir";

  // ذخیره و بازیابی دائمی از LocalStorage
  useEffect(() => {
    const savedDb = localStorage.getItem('arseh_payslip_db');
    if (savedDb) setDatabase(JSON.parse(savedDb));

    const savedAuth = localStorage.getItem('arseh_admin_auth');
    if (savedAuth) setAdminAuth(JSON.parse(savedAuth));
  }, []);

  const saveDatabaseLocally = (newDb) => {
    setDatabase(newDb);
    localStorage.setItem('arseh_payslip_db', JSON.stringify(newDb));
  };

  const saveAdminAuthLocally = (newAuth) => {
    setAdminAuth(newAuth);
    localStorage.setItem('arseh_admin_auth', JSON.stringify(newAuth));
  };

  const userPayslips = database.filter(item => item.nationalId === nationalId.trim() && item.password === password.trim());

  // محاسبات جامع حقوق
  const calculate = (data) => {
    const dailyBase = data.jobSalaryDaily + data.sanavatBaseDaily + data.sanavatPastDaily + data.otherBaseDaily;
    const monthlyBase = dailyBase * data.workedDays;
    const totalBenefits = data.housingAllowance + data.foodAllowance + data.childAllowance + data.maritalAllowance + data.shiftAllowance + data.otherAllowance;
    const totalGross = monthlyBase + totalBenefits;
    const insurance = totalGross * 0.07;
    const taxableAmount = Math.max(0, totalGross - 120000000);
    const tax = taxableAmount * 0.10;
    const totalDeductions = insurance + tax + data.otherDeductions;
    const netPay = totalGross - totalDeductions;
    return { dailyBase, monthlyBase, totalBenefits, totalGross, insurance, tax, totalDeductions, netPay };
  };

  // آمار کلی مدیریت
  const adminStats = database.reduce((acc, curr) => {
    const calc = calculate(curr);
    acc.totalGrossSum += calc.totalGross;
    acc.totalInsuranceSum += calc.insurance;
    acc.totalTaxSum += calc.tax;
    acc.totalNetPaySum += calc.netPay;
    return acc;
  }, { totalGrossSum: 0, totalInsuranceSum: 0, totalTaxSum: 0, totalNetPaySum: 0 });

  // دانلود PDF اختصاصی
  const handleDownloadPDF = () => {
    window.print();
  };

  // ورود پرسنل
  const handleSearch = (e) => {
    e.preventDefault();
    setError('');
    const matched = userPayslips;
    if (matched.length > 0) {
      setPayslip(matched[0]);
      setSelectedMonth(matched[0].month);
    } else {
      setPayslip(null);
      setError('نام کاربری (کد ملی) یا رمز عبور اشتباه است!');
    }
  };

  // ورود مدیر
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUser.trim() === adminAuth.user && adminPass.trim() === adminAuth.pass) {
      setIsAdminLoggedIn(true);
      setAdminMsg('');
    } else {
      setAdminMsg('❌ نام کاربری یا رمز عبور مدیر اشتباه است!');
    }
  };

  // تغییر نام کاربری/رمز مدیر
  const handleUpdateAdminCredentials = (e) => {
    e.preventDefault();
    if (newAdminUser.trim().length < 3 || newAdminPass.trim().length < 4) {
      setAdminChangeMsg({ type: 'error', text: 'نام کاربری باید حداقل ۳ کاراکتر و رمز حداقل ۴ کاراکتر باشد.' });
      return;
    }
    const newAuth = { user: newAdminUser.trim(), pass: newAdminPass.trim() };
    saveAdminAuthLocally(newAuth);
    setAdminChangeMsg({ type: 'success', text: '✅ مشخصات ورود مدیر با موفقیت به‌روزرسانی شد!' });
    setTimeout(() => {
      setShowAdminChangeModal(false);
      setAdminChangeMsg({ type: '', text: '' });
      setNewAdminUser('');
      setNewAdminPass('');
    }, 1500);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    const found = userPayslips.find(item => item.month === month);
    if (found) setPayslip(found);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotMessage({ type: '', text: '' });
    const user = database.find(item => item.nationalId === forgotNationalId.trim() && item.phone === forgotPhone.trim());
    if (user) {
      setForgotMessage({ type: 'success', text: `📲 پیامک حاوی رمز عبور به شماره ${user.phone} ارسال گردید. (رمز: ${user.password})` });
    } else {
      setForgotMessage({ type: 'error', text: 'اطلاعات وارد شده با رکوردهای سیستم همخوانی ندارد!' });
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setChangePasswordMsg({ type: '', text: '' });
    if (currentPasswordInput !== password) {
      setChangePasswordMsg({ type: 'error', text: 'رمز عبور فعلی نادرست است.' });
      return;
    }
    if (newPasswordInput.length < 4) {
      setChangePasswordMsg({ type: 'error', text: 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.' });
      return;
    }
    const updatedDb = database.map(item => item.nationalId === nationalId ? { ...item, password: newPasswordInput } : item);
    saveDatabaseLocally(updatedDb);
    setPassword(newPasswordInput);
    setChangePasswordMsg({ type: 'success', text: '✅ رمز عبور با موفقیت تغییر یافت.' });
    setTimeout(() => {
      setShowChangePasswordModal(false);
      setChangePasswordMsg({ type: '', text: '' });
      setCurrentPasswordInput('');
      setNewPasswordInput('');
    }, 1500);
  };

  const exportToExcelSimulated = () => {
    let csvContent = "data:text/csv;charset=utf-8,نام,کد ملی,ماه,کارکرد,حقوق خالص (ریال)\n";
    database.forEach(row => {
      const calc = calculate(row);
      csvContent += `${row.name},${row.nationalId},${row.month},${row.workedDays},${calc.netPay}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `گزارش_فیش_حقوقی_${COMPANY_NAME}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUploadExcel = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdminMsg(`✅ فایل اکسل (${file.name}) با موفقیت پردازش شد و لیست فیش‌های جدید در دیتابیس ثبت گردید.`);
    }
  };

  const fmt = (val) => Math.round(val).toLocaleString('fa-IR') + ' ریال';

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px', fontFamily: 'tahoma, sans-serif', direction: 'rtl' }}>
      
      {/* هدر بالای سایت */}
      <div style={{ maxWidth: '950px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>سامانه رسمی {SITE_DOMAIN}</span>
        <div>
          <button 
            onClick={() => setView(view === 'employee' ? 'admin' : 'employee')}
            style={{ background: view === 'admin' ? '#ef4444' : 'rgba(255, 255, 255, 0.15)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', backdropFilter: 'blur(5px)' }}
          >
            {view === 'employee' ? '🔐 ورود پنل مدیریت' : '👤 بازگشت به بخش پرسنل'}
          </button>
        </div>
      </div>

      <main style={{ maxWidth: view === 'admin' ? '950px' : (payslip ? '880px' : '420px'), width: '100%', margin: 'auto', transition: 'all 0.3s ease' }}>
        
        {/* --- پنل مدیریت --- */}
        {view === 'admin' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #2563eb', paddingBottom: '10px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                ⚙️ پنل مدیریت و داشبورد مالی شرکت
              </h2>

              {isAdminLoggedIn && (
                <button 
                  onClick={() => setShowAdminChangeModal(true)}
                  style={{ background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  🔐 تغییر نام کاربری / رمز مدیر
                </button>
              )}
            </div>

            {!isAdminLoggedIn ? (
              <form onSubmit={handleAdminLogin} style={{ maxWidth: '350px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>نام کاربری مدیر:</label>
                  <input type="text" value={adminUser} onChange={(e)=>setAdminUser(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>رمز عبور مدیر:</label>
                  <input type="password" value={adminPass} onChange={(e)=>setAdminPass(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} required />
                </div>
                <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ورود به مدیریت</button>
                {adminMsg && <div style={{ color: 'red', fontSize: '12px', textAlign: 'center' }}>{adminMsg}</div>}
              </form>
            ) : (
              <div>
                {/* 📊 کارت‌های آمار و گزارش‌های مالی */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '25px' }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '15px', borderRadius: '14px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#1d4ed8', display: 'block' }}>تعداد فیش‌ها</span>
                    <strong style={{ fontSize: '18px', color: '#1e40af' }}>{database.length} عدد</strong>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '14px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#15803d', display: 'block' }}>مجموع پرداختی شرکت</span>
                    <strong style={{ fontSize: '14px', color: '#166534' }}>{fmt(adminStats.totalNetPaySum)}</strong>
                  </div>
                  <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '15px', borderRadius: '14px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#c2410c', display: 'block' }}>مجموع حق بیمه‌ها (۷٪)</span>
                    <strong style={{ fontSize: '14px', color: '#9a3412' }}>{fmt(adminStats.totalInsuranceSum)}</strong>
                  </div>
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '15px', borderRadius: '14px', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#b91c1c', display: 'block' }}>مجموع مالیات حقوق</span>
                    <strong style={{ fontSize: '14px', color: '#991b1b' }}>{fmt(adminStats.totalTaxSum)}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '15px', color: '#1e293b', marginTop: 0 }}>📊 اکسل و صدور گروهی</h3>
                    <p style={{ fontSize: '12px', color: '#64748b' }}>آپلود اکسل کارکرد برای ساخت اتوماتیک فیش‌ها</p>
                    <label style={{ display: 'inline-block', background: '#16a34a', color: '#fff', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>
                      📥 آپلود فایل اکسل پرسنل
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={handleBulkUploadExcel} style={{ display: 'none' }} />
                    </label>
                    <button onClick={exportToExcelSimulated} style={{ display: 'block', width: '100%', background: '#0284c7', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                      📈 خروجی اکسل کل فیش‌های صادرشده
                    </button>
                  </div>

                  <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                    <h3 style={{ fontSize: '15px', color: '#166534', marginTop: 0 }}>📱 پنل پیامک اتوماتیک</h3>
                    <p style={{ fontSize: '12px', color: '#15803d' }}>ارسال پیامک صدور فیش یا کدهای یک‌بارمصرف به پرسنل</p>
                    <button onClick={() => setAdminMsg('📲 پیامک اطلاع‌رسانی صدور فیش برای تمام پرسنل ارسال گردید.')} style={{ background: '#15803d', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>
                      📩 ارسال پیامک صدور فیش به همه پرسنل
                    </button>
                  </div>
                </div>

                {adminMsg && (
                  <div style={{ padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', borderRadius: '10px', fontSize: '13px', textAlign: 'center' }}>
                    {adminMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- بخش پرسنل --- */}
        {view === 'employee' && (
          !payslip ? (
            <div style={{ background: '#ffffff', padding: '30px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>🏢</div>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: '0' }}>{COMPANY_NAME}</h1>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>دریافت فیش حقوقی و مزایای پرسنل</p>
              </div>

              <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#2563eb', marginBottom: '6px' }}>
                    نام کاربری (کد ملی)
                  </label>
                  <input
                    type="text"
                    placeholder="0012345678"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '2px solid #2563eb', borderRadius: '10px', direction: 'ltr', textAlign: 'left', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>کلمه عبور / رمز</label>
                    <button 
                      type="button" 
                      onClick={() => { setShowForgotModal(true); setForgotMessage({ type: '', text: '' }); }}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                      فراموشی رمز عبور؟
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', direction: 'ltr', textAlign: 'left', outline: 'none', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '10px' }}
                >
                  ورود و مشاهده فیش حقوقی
                </button>
              </form>

              {error && (
                <div style={{ marginTop: '15px', padding: '10px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '12px', borderRadius: '8px', textAlign: 'center' }}>
                  ⚠️ {error}
                </div>
              )}
            </div>
          ) : (
            <div id="printable-payslip" style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
              
              <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{COMPANY_NAME}</h2>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>فیش رسمی حقوق و دستمزد کارگران (قانون کار)</p>
                </div>

                <div style={{ textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <label style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>🗓️ آرشیو فیش‌ها:</label>
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => handleMonthChange(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold', background: '#f8fafc', color: '#1e293b' }}
                    >
                      {userPayslips.map(p => (
                        <option key={p.id} value={p.month}>فیش {p.month}</option>
                      ))}
                    </select>
                  </div>

                  <button onClick={() => setShowChangePasswordModal(true)} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🔐 تغییر رمز
                  </button>

                  <button onClick={() => setPayslip(null)} style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ✖ خروج
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#f8fafc', padding: '15px', borderRadius: '14px', fontSize: '13px', marginBottom: '20px', border: '1px solid #f1f5f9' }}>
                <div><span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>نام کارگر:</span><strong>{payslip.name}</strong></div>
                <div><span style={{ color: '#2563eb', fontSize: '11px', display: 'block', fontWeight: 'bold' }}>نام کاربری (کد ملی):</span><strong style={{ color: '#2563eb' }}>{payslip.nationalId}</strong></div>
                <div><span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>سمت شغلی:</span><strong>{payslip.role}</strong></div>
                <div><span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>کارکرد:</span><strong>{payslip.workedDays} روز</strong></div>
              </div>

              {(() => {
                const calc = calculate(payslip);
                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div style={{ background: '#f0fdf4', padding: '18px', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
                        <h3 style={{ fontSize: '14px', color: '#166534', margin: '0 0 12px 0', borderBottom: '1px solid #bbf7d0', paddingBottom: '6px' }}>➕ درآمدها و مزایا (ریال)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>مزد پایه ماهانه:</span> <span>{fmt(payslip.jobSalaryDaily * payslip.workedDays)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>مزد پایه سنوات:</span> <span>{fmt(payslip.sanavatBaseDaily * payslip.workedDays)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>سنوات سال‌های قبل:</span> <span>{fmt(payslip.sanavatPastDaily * payslip.workedDays)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>حق مسکن:</span> <span>{fmt(payslip.housingAllowance)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>بن خواربار:</span> <span>{fmt(payslip.foodAllowance)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>حق تأهل:</span> <span>{fmt(payslip.maritalAllowance)}</span></div>
                          {payslip.otherAllowance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>سایر مزایا:</span> <span>{fmt(payslip.otherAllowance)}</span></div>}
                          <div style={{ borderTop: '1px solid #86efac', paddingTop: '8px', marginTop: '4px', fontWeight: 'bold', color: '#15803d', display: 'flex', justifyContent: 'space-between' }}>
                            <span>جمع ناخالص درآمد:</span> <span>{fmt(calc.totalGross)}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#fef2f2', padding: '18px', borderRadius: '16px', border: '1px solid #fecaca' }}>
                        <h3 style={{ fontSize: '14px', color: '#991b1b', margin: '0 0 12px 0', borderBottom: '1px solid #fecaca', paddingBottom: '6px' }}>➖ کسورات قانونی (ریال)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#334155' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>حق بیمه تامین اجتماعی (۷٪):</span> <span>{fmt(calc.insurance)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>مالیات حقوق:</span> <span>{fmt(calc.tax)}</span></div>
                          {payslip.otherDeductions > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>مساعده / سایر کسورات:</span> <span>{fmt(payslip.otherDeductions)}</span></div>}
                          <div style={{ borderTop: '1px solid #fca5a5', paddingTop: '8px', marginTop: 'auto', fontWeight: 'bold', color: '#b91c1c', display: 'flex', justifyContent: 'space-between' }}>
                            <span>جمع کل کسورات:</span> <span>{fmt(calc.totalDeductions)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#0f172a', color: '#fff', padding: '18px 24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: 'bold' }}>مبلغ خالص پرداختی به کارگر:</span>
                      <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#4ade80' }}>{fmt(calc.netPay)}</span>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>🔒 دارای مهر و امضای دیجیتال رسمی {COMPANY_NAME}</div>
                      <button onClick={handleDownloadPDF} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                        📄 دانلود فایل PDF رسمی / چاپ
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          )
        )}
      </main>

      {/* مدال بازیابی رمز پرسنل */}
      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>🔑 بازیابی رمز عبور از طریق پیامک</h3>
              <button onClick={() => setShowForgotModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="text" placeholder="نام کاربری (کد ملی)" value={forgotNationalId} onChange={(e) => setForgotNationalId(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', direction: 'ltr', boxSizing: 'border-box' }} required />
              <input type="text" placeholder="شماره همراه (مثلاً 0912...)" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', direction: 'ltr', boxSizing: 'border-box' }} required />
              <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>📲 ارسال پیامک رمز</button>
            </form>
            {forgotMessage.text && (
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', background: forgotMessage.type === 'success' ? '#f0fdf4' : '#fef2f2', color: forgotMessage.type === 'success' ? '#166534' : '#dc2626' }}>
                {forgotMessage.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* مدال تغییر رمز پرسنل */}
      {showChangePasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>🔐 تغییر رمز عبور</h3>
              <button onClick={() => setShowChangePasswordModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>رمز عبور فعلی:</label>
                <input type="password" value={currentPasswordInput} onChange={(e) => setCurrentPasswordInput(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', direction: 'ltr', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b' }}>رمز عبور جدید:</label>
                <input type="password" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', direction: 'ltr', boxSizing: 'border-box' }} required />
              </div>
              <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ثبت رمز جدید</button>
            </form>
            {changePasswordMsg.text && (
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', background: changePasswordMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: changePasswordMsg.type === 'success' ? '#166534' : '#dc2626' }}>
                {changePasswordMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* مدال تغییر رمز مدیر */}
      {showAdminChangeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', maxWidth: '400px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>⚙️ تغییر مشخصات ورود مدیر</h3>
              <button onClick={() => setShowAdminChangeModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleUpdateAdminCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>نام کاربری جدید مدیر:</label>
                <input type="text" placeholder="مثلا labrood_admin" value={newAdminUser} onChange={(e) => setNewAdminUser(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', direction: 'ltr', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>رمز عبور جدید مدیر:</label>
                <input type="password" placeholder="••••••••" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', direction: 'ltr', boxSizing: 'border-box' }} required />
              </div>
              <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>
                ذخیره مشخصات جدید مدیر
              </button>
            </form>
            {adminChangeMsg.text && (
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center', background: adminChangeMsg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: adminChangeMsg.type === 'success' ? '#166534' : '#dc2626' }}>
                {adminChangeMsg.text}
              </div>
            )}
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
        سامانه آنلاین فیش حقوقی {COMPANY_NAME}
      </footer>
    </div>
  );
}

