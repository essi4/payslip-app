"use client";

import { useEffect, useState } from "react";

function value(value, fallback = "—") {
  return value === null || value === undefined || String(value).trim() === "" ? fallback : String(value);
}

export default function EmployeeOrderPage() {
  const [employee, setEmployee] = useState(null);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/payslip", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({}) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || "نشست معتبر نیست.");
        setEmployee(result.employee);
        const docResponse = await fetch("/api/personnel/order-document", { cache: "no-store" });
        const docResult = await docResponse.json();
        if (docResponse.ok && docResult.success) setDocument(docResult.document || null);
      } catch (err) {
        setError(err.message || "نشست شما معتبر نیست.");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  function printOrder() {
    window.print();
  }

  function downloadOrder() {
    if (!document?.data) return;
    const link = window.document.createElement("a");
    link.href = document.data;
    link.download = document.name || "حکم-کارگزینی";
    link.click();
  }

  if (loading) return <main dir="rtl" className="min-h-screen bg-slate-100 p-4"><div className="mx-auto mt-12 max-w-2xl rounded-3xl bg-white p-10 text-center font-black text-slate-700 shadow-lg">در حال دریافت حکم کارگزینی...</div></main>;
  if (!employee) return <main dir="rtl" className="min-h-screen bg-slate-100 p-4"><div className="mx-auto mt-12 max-w-lg rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg"><div className="text-4xl">🔒</div><h1 className="mt-4 text-lg font-black text-slate-900">دسترسی به حکم کارگزینی</h1><p className="mt-2 text-sm font-bold text-red-600">{error || "نشست شما معتبر نیست."}</p><a href="/payslip" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white">بازگشت به پنل</a></div></main>;

  return <main dir="rtl" className="min-h-screen bg-slate-100 px-3 py-5 pb-28 md:px-5">
    <div className="mx-auto max-w-4xl">
      <header className="mb-4 overflow-hidden rounded-3xl bg-gradient-to-l from-slate-950 via-blue-950 to-slate-900 p-5 text-white shadow-xl md:p-7">
        <div className="text-[11px] font-bold text-blue-300">سیستم حقوق و دستمزد</div>
        <div className="mt-2 flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">📋</div><div><h1 className="text-xl font-black md:text-2xl">حکم کارگزینی</h1><p className="mt-1 text-xs font-bold text-slate-300">حکم واقعی ثبت‌شده توسط مدیریت</p></div></div>
      </header>

      {document ? <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl print:shadow-none">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><div className="text-sm font-black text-slate-900">{document.name}</div><div className="mt-1 text-[10px] font-bold text-slate-500">{document.mime === "application/pdf" ? "سند PDF" : "تصویر حکم"}</div></div>
          <div className="no-print flex gap-2"><button type="button" onClick={downloadOrder} className="rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-black text-white">⬇ دانلود</button><button type="button" onClick={printOrder} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-black">🖨 چاپ</button></div>
        </div>
        <div className="bg-slate-200 p-2 sm:p-5">
          {document.mime === "application/pdf" ? <iframe title="حکم کارگزینی" src={document.data} className="h-[75vh] min-h-[600px] w-full rounded-2xl bg-white" /> : <div className="flex min-h-[70vh] items-center justify-center rounded-2xl bg-white p-2"><img src={document.data} alt="حکم کارگزینی" className="max-h-[80vh] w-auto max-w-full object-contain" /></div>}
        </div>
      </section> : <section className="rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl"><div className="text-5xl">📭</div><h2 className="mt-4 text-lg font-black">حکم کارگزینی هنوز ثبت نشده است</h2><p className="mt-2 text-xs font-bold leading-6 text-slate-500">مدیریت باید فایل PDF یا تصویر حکم شما را در پرونده پرسنلی ثبت کند.</p></section>}

      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div><div className="text-[10px] font-bold text-slate-500">نام</div><div className="mt-1 text-xs font-black">{value(employee.full_name)}</div></div><div><div className="text-[10px] font-bold text-slate-500">کد پرسنلی</div><div className="mt-1 text-xs font-black">{value(employee.personnel_code)}</div></div><div><div className="text-[10px] font-bold text-slate-500">شماره حکم</div><div className="mt-1 text-xs font-black">{value(employee.last_order_number || employee.order_number)}</div></div><div><div className="text-[10px] font-bold text-slate-500">تاریخ حکم</div><div className="mt-1 text-xs font-black">{value(employee.last_order_date || employee.order_date)}</div></div></div>
      </section>

      <div className="no-print mt-5"><a href="/payslip" className="block rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-xs font-black">← بازگشت به پنل پرسنلی</a></div>
      <footer className="py-6 text-center text-[10px] text-slate-500">© سیستم حقوق و دستمزد</footer>
    </div>
  </main>;
}
