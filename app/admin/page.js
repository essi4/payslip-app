'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function EnhancedEmployeePortal() {
  const [payslipsList, setPayslipsList] = useState([
    {
      id: 1,
      employeeName: 'علی البرزی',
      nationalId: '0012345678',
      jobTitle: 'اپراتور تولید',
      workDays: 30,
      baseSalary: 188760820,
      baseSeniority: 5040010,
      pastSeniority: 49745440,
      housingAllowance: 20000000,
      groceryAllowance: 22000000,
      maritalAllowance: 5000000, // حق تأهل / عائله‌مندی
      childAllowance: 0, // حق اولاد
      overtimePay: 0, // اضافه کاری
      otherBenefits: 57000000, // سایر مزایا
      insuranceDeduction: 25028942, // بیمه ۷٪
      taxDeduction: 22755632, // مالیات
      otherDeductions: 0, // سایر کسورات
      netPay: 308771746,
      smsSent: true,
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayslipToEdit, setSelectedPayslipToEdit] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // تابع آپلود اکسل با پشتیبانی از آیتم‌های کامل قانون کار
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json(ws);

        const formattedData = data.map((row, index) => {
          const baseSalary = Number(row['مزد پایه']) || Number(row['حقوق پایه']) || 0;
          const baseSeniority = Number(row['مزد پایه سنوات']) || 0;
          const pastSeniority = Number(row['سنوات سالهای قبل']) || 0;
          const housingAllowance = Number(row['حق مسکن']) || 0;
          const groceryAllowance = Number(row['بن خواربار']) || Number(row['بن معیشت']) || 0;
          const maritalAllowance = Number(row['حق تأهل']) || Number(row['حق عائله مندی']) || 0;
          const childAllowance = Number(row['حق اولاد']) || 0;
          const overtimePay = Number(row['اضافه کاری']) || 0;
          const otherBenefits = Number(row['سایر مزایا']) || 0;

          const totalEarnings = baseSalary + baseSeniority + pastSeniority + housingAllowance + groceryAllowance + maritalAllowance + childAllowance + overtimePay + otherBenefits;

          const insuranceDeduction = Number(row['بیمه']) || Number(row['حق بیمه تامین اجتماعی']) || 0;
          const taxDeduction = Number(row['مالیات']) || Number(row['مالیات حقوق']) || 0;
          const otherDeductions = Number(row['سایر کسورات']) || 0;

          const totalDeductions = insuranceDeduction + taxDeduction + otherDeductions;
          const netPay = totalEarnings - totalDeductions;

          return {
            id: Date.now() + index,
            employeeName: row['نام کارگر'] || row['نام پرسنل'] || 'بدون نام',
            nationalId: String(row['کد ملی'] || ''),
            jobTitle: row['سمت شغلی'] || 'کارگر',
            workDays: Number(row['کارکرد']) || 30,
            baseSalary,
            baseSeniority,
            pastSeniority,
            housingAllowance,
            groceryAllowance,
            maritalAllowance,
            childAllowance,
            overtimePay,
            otherBenefits,
            insuranceDeduction,
            taxDeduction,
            otherDeductions,
            netPay,
            smsSent: false,
          };
        });

        setPayslipsList(formattedData);
        alert('فایل اکسل طبق استانداردهای قانون کار بارگذاری شد!');
      } catch (err) {
        alert('خطا در خواندن فایل اکسل.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleEditClick = (item) => {
    setSelectedPayslipToEdit({ ...item });
    setIsEditModalOpen(true);
  };

  // محاسبه خودکار مبلغ خالص پرداختی بر اساس درآمدها و کسورات
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = Number(value) || 0;

    setSelectedPayslipToEdit((prev) => {
      const updated = { ...prev, [name]: name === 'jobTitle' ? value : numValue };
      
      const earnings = 
        (updated.baseSalary || 0) +
        (updated.baseSeniority || 0) +
        (updated.pastSeniority || 0) +
        (updated.housingAllowance || 0) +
        (updated.groceryAllowance || 0) +
        (updated.maritalAllowance || 0) +
        (updated.childAllowance || 0) +
        (updated.overtimePay || 0) +
        (updated.otherBenefits || 0);

      const deductions = 
        (updated.insuranceDeduction || 0) +
        (updated.taxDeduction || 0) +
        (updated.otherDeductions || 0);

      updated.netPay = earnings - deductions;
      return updated;
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setPayslipsList((prev) =>
      prev.map((item) => (item.id === selectedPayslipToEdit.id ? selectedPayslipToEdit : item))
    );
    setIsEditModalOpen(false);
  };

  const handleDeletePayslip = (id) => {
    if (confirm('آیا از حذف این فیش حقوقی اطمینان دارید؟')) {
      setPayslipsList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const filteredPayslips = payslipsList.filter(
    (item) =>
      item.employeeName.includes(searchTerm) ||
      item.nationalId.includes(searchTerm)
  );

  return (
    <div style={{ direction: 'rtl', fontFamily: 'Tahoma, sans-serif', padding: '20px', backgroundColor: '#0f172a', minHeight: '100vh', color: '#333' }}>
      
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)', maxWidth: '1300px', margin: '0 auto' }}>
        
        {/* هدر بالایی */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>⚙️ پنل مدیریت و فیش حقوقی (قانون کار)</h1>
            <span style={{ fontSize: '12px', color: '#64748b' }}>شرکت عرصه ساز لب رود</span>
          </div>
          <button style={{ backgroundColor: '#e11d48', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
            🔒 تغییر رمز / مدیر
          </button>
        </div>

        {/* ۴ کارت خلاصه وضعیت */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={cardStyle}>
            <span style={cardTitleStyle}>تعداد فیش‌ها</span>
            <span style={cardValueStyle}>{payslipsList.length} عدد</span>
          </div>
          <div style={cardStyle}>
            <span style={cardTitleStyle}>مجموع پرداختی به کارگران</span>
            <span style={cardValueStyle}>{payslipsList.reduce((acc, curr) => acc + curr.netPay, 0).toLocaleString()} ریال</span>
          </div>
          <div style={cardStyle}>
            <span style={cardTitleStyle}>مجموع بیمه تامین اجتماعی (۷٪)</span>
            <span style={cardValueStyle}>{payslipsList.reduce((acc, curr) => acc + curr.insuranceDeduction, 0).toLocaleString()} ریال</span>
          </div>
          <div style={cardStyle}>
            <span style={cardTitleStyle}>مجموع مالیات حقوق</span>
            <span style={cardValueStyle}>{payslipsList.reduce((acc, curr) => acc + curr.taxDeduction, 0).toLocaleString()} ریال</span>
          </div>
        </div>

        {/* دکمه‌های عملیاتی */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <label style={{ ...btnStyle, backgroundColor: '#10b981', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
            📊 آپلود فایل اکسل پرسنل
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <button style={{ ...btnStyle, backgroundColor: '#06b6d4' }}>📥 خروجی اکسل کامل</button>
          <button style={{ ...btnStyle, backgroundColor: '#3b82f6' }}>📲 ارسال پیامک صدور فیش</button>
          <button onClick={() => setPayslipsList([])} style={{ ...btnStyle, backgroundColor: '#ef4444', marginRight: 'auto' }}>🗑️ حذف کلی فیش‌ها</button>
        </div>

        {/* کادر جستجو */}
        <div style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="🔍 جستجو بر اساس نام کارگر یا کد ملی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        {/* جدول کامل قانون کار */}
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                <th style={thStyle}>نام کارگر</th>
                <th style={thStyle}>کد ملی</th>
                <th style={thStyle}>سمت شغلی</th>
                <th style={thStyle}>حقوق پایه</th>
                <th style={thStyle}>حق مسکن</th>
                <th style={thStyle}>بن خواربار</th>
                <th style={thStyle}>حق تأهل/اولاد</th>
                <th style={thStyle}>سایر مزایا</th>
                <th style={thStyle}>کسورات (بیمه/مالیات)</th>
                <th style={thStyle}>خالص پرداختی (ریال)</th>
                <th style={thStyle}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayslips.length > 0 ? (
                filteredPayslips.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>{item.employeeName}</td>
                    <td style={tdStyle}>{item.nationalId}</td>
                    <td style={tdStyle}>{item.jobTitle}</td>
                    <td style={tdStyle}>{item.baseSalary.toLocaleString()}</td>
                    <td style={tdStyle}>{item.housingAllowance.toLocaleString()}</td>
                    <td style={tdStyle}>{item.groceryAllowance.toLocaleString()}</td>
                    <td style={tdStyle}>{(item.maritalAllowance + item.childAllowance).toLocaleString()}</td>
                    <td style={tdStyle}>{(item.otherBenefits + item.baseSeniority + item.pastSeniority + item.overtimePay).toLocaleString()}</td>
                    <td style={{ ...tdStyle, color: '#ef4444' }}>{(item.insuranceDeduction + item.taxDeduction + item.otherDeductions).toLocaleString()}</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#059669', fontSize: '13px' }}>{item.netPay.toLocaleString()}</td>
                    <td style={tdStyle}>
                      <button onClick={() => handleEditClick(item)} style={actionBtnStyle('#f59e0b')}>اصلاح / ویرایش</button>
                      <button onClick={() => handleDeletePayslip(item.id)} style={actionBtnStyle('#ef4444')}>حذف</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ padding: '20px', color: '#94a3b8' }}>هیچ فیشی یافت نشد.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* مودال ویرایش آیتم‌های قانون کار */}
      {isEditModalOpen && selectedPayslipToEdit && (
        <div style={modalBackdropStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ marginBottom: '16px', fontSize: '15px', color: '#0f172a', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              ✏️ ویرایش فیش قانون کار: {selectedPayslipToEdit.employeeName}
            </h3>
            <form onSubmit={handleSaveEdit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>سمت شغلی:</label>
                <input type="text" name="jobTitle" value={selectedPayslipToEdit.jobTitle} onChange={handleEditInputChange} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>مزد پایه ماهانه (ریال):</label>
                <input type="number" name="baseSalary" value={selectedPayslipToEdit.baseSalary} onChange={handleEditInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>مزد پایه سنوات (ریال):</label>
                <input type="number" name="baseSeniority" value={selectedPayslipToEdit.baseSeniority} onChange={handleEditInputChange} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>سنوات سال‌های قبل (ریال):</label>
                <input type="number" name="pastSeniority" value={selectedPayslipToEdit.pastSeniority} onChange={handleEditInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>حق مسکن (ریال):</label>
                <input type="number" name="housingAllowance" value={selectedPayslipToEdit.housingAllowance} onChange={handleEditInputChange} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>بن خواربار (ریال):</label>
                <input type="number" name="groceryAllowance" value={selectedPayslipToEdit.groceryAllowance} onChange={handleEditInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>حق تأهل (ریال):</label>
                <input type="number" name="maritalAllowance" value={selectedPayslipToEdit.maritalAllowance} onChange={handleEditInputChange} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>حق اولاد (ریال):</label>
                <input type="number" name="childAllowance" value={selectedPayslipToEdit.childAllowance} onChange={handleEditInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>اضافه کاری / سایر مزایا (ریال):</label>
                <input type="number" name="otherBenefits" value={selectedPayslipToEdit.otherBenefits} onChange={handleEditInputChange} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                <strong style={{ fontSize: '12px', color: '#ef4444' }}>🔻 کسورات قانونی:</strong>
              </div>

              <div>
                <label style={labelStyle}>حق بیمه تأمین اجتماعی ۷٪ (ریال):</label>
                <input type="number" name="insuranceDeduction" value={selectedPayslipToEdit.insuranceDeduction} onChange={handleEditInputChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>مالیات حقوق (ریال):</label>
                <input type="number" name="taxDeduction" value={selectedPayslipToEdit.taxDeduction} onChange={handleEditInputChange} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2', backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '8px', marginTop: '6px' }}>
                <label style={{ ...labelStyle, fontWeight: 'bold', color: '#166534' }}>مبلغ خالص پرداختی به کارگر (محاسبه خودکار):</label>
                <input type="number" value={selectedPayslipToEdit.netPay} readOnly style={{ ...inputStyle, backgroundColor: '#fff', fontWeight: 'bold', color: '#059669', fontSize: '15px' }} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ ...btnStyle, backgroundColor: '#10b981', flex: 1 }}>ذخیره تغییرات</button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ ...btnStyle, backgroundColor: '#64748b', flex: 1 }}>انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const cardStyle = { backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' };
const cardTitleStyle = { display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px' };
const cardValueStyle = { fontSize: '16px', fontWeight: 'bold', color: '#0f172a' };
const btnStyle = { border: 'none', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' };
const thStyle = { padding: '12px 8px', fontWeight: 'bold' };
const tdStyle = { padding: '10px 8px' };
const actionBtnStyle = (bgColor) => ({ backgroundColor: bgColor, color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', marginLeft: '4px', fontSize: '11px', fontWeight: 'bold' });
const modalBackdropStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalBoxStyle = { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', width: '520px', maxHeight: '92vh', overflowY: 'auto' };
const labelStyle = { display: 'block', marginBottom: '3px', fontSize: '11px', color: '#475569' };
const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', fontSize: '12px' };

