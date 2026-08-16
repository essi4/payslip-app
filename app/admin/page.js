export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6" dir="rtl">
      <h1 className="text-3xl font-bold mb-8">پنل مدیریت چابکان</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <a
          href="/admin/employees"
          className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-bold mb-2"> کارکنان</h2>
          <p className="text-gray-600">مدیریت کارکنان شرکت</p>
        </a>

        <a
          href="/admin/payslips"
          className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-bold mb-2"> فیش‌های حقوقی</h2>
          <p className="text-gray-600">مشاهده و مدیریت فیش‌ها</p>
        </a>

        <a
          href="/admin/corrections"
          className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-bold mb-2"> اصلاح فیش</h2>
          <p className="text-gray-600">اصلاح اطلاعات فیش حقوقی</p>
        </a>

        <a
          href="/admin/reports"
          className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-bold mb-2"> گزارش‌ها</h2>
          <p className="text-gray-600">گزارش حقوق و کارکنان</p>
        </a>

        <a
          href="/admin/settings"
          className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-bold mb-2"> تنظیمات</h2>
          <p className="text-gray-600">تنظیمات سیستم</p>
        </a>

      </div>
    </div>
  );
}