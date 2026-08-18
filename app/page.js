"use client";

import { useState } from "react";

export default function AdminPage() {
  const [nationalId, setNationalId] = useState("");
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSearch = async () => {
    if (!nationalId) return alert("لطفاً کد ملی را وارد کنید");
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/personnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId }),
      });
      const data = await res.json();
      if (data.success) {
        setEmployee(data.data);
      } else {
        alert(data.message);
        setEmployee(null);
      }
    } catch (err) {
      alert("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const res = await fetch("/api/personnel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("تغییرات با موفقیت ذخیره شد!");
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("خطا در ثبت ویرایش");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center" dir="rtl">
      <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-md space-y-6">
        <h1 className="text-xl font-bold text-slate-800 border-b pb-3">ویرایش و مدیریت فیش حقوقی</h1>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="کد ملی کارمند (مثلاً 1234567890)"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className="flex-1 border p-2 rounded-lg text-slate-800 outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "در حال جستجو..." : "جستجو"}
          </button>
        </div>

        {message && <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg text-sm">{message}</div>}

        {employee && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">نام و نام خانوادگی</label>
              <input
                type="text"
                value={employee.name}
                onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                className="w-full border p-2 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">سمت / نقش</label>
              <input
                type="text"
                value={employee.role}
                onChange={(e) => setEmployee({ ...employee, role: e.target.value })}
                className="w-full border p-2 rounded-lg text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">حقوق پایه (ریال)</label>
              <input
                type="text"
                value={employee.salary}
                onChange={(e) => setEmployee({ ...employee, salary: e.target.value })}
                className="w-full border p-2 rounded-lg text-slate-800"
              />
            </div>

            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              {loading ? "در حال ذخیره..." : "ثبت تغییرات فیش"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}