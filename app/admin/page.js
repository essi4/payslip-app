export default function AdminPage() {
  const menuItems = [
    {
      title: "کارکنان",
      description: "مدیریت اطلاعات کارکنان شرکت",
      href: "/admin/employees",
      icon: "",
    },
    {
      title: "فیش‌های حقوقی",
      description: "مشاهده، صدور و مدیریت فیش‌ها",
      href: "/admin/payslips",
      icon: "",
    },
    {
      title: "اصلاح فیش",
      description: "بررسی و اصلاح اطلاعات فیش حقوقی",
      href: "/admin/corrections",
      icon: "",
    },
    {
      title: "گزارش‌ها",
      description: "گزارش حقوق، کارکنان و پرداخت‌ها",
      href: "/admin/reports",
      icon: "",
    },
    {
      title: "تنظیمات",
      description: "تنظیمات شرکت و سیستم",
      href: "/admin/settings",
      icon: "",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
              پنل مدیریت چابکان
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              مدیریت حقوق و دستمزد شرکت عرصه ساز لب رود
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-700">
                مدیر سیستم
              </p>
              <p className="text-xs text-slate-400">
                دسترسی کامل
              </p>
            </div>

            <div className="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold">
              م
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800">
            داشبورد مدیریت
          </h2>
          <p className="text-slate-500 mt-1">
            خلاصه وضعیت سیستم حقوق و دستمزد
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <p className="text-sm text-slate-500">تعداد کارکنان</p>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-bold text-slate-800">
                0
              </span>
              <span className="text-2xl"></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <p className="text-sm text-slate-500">فیش‌های صادر شده</p>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-bold text-slate-800">
                0
              </span>
              <span className="text-2xl"></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <p className="text-sm text-slate-500">درخواست اصلاح</p>
            <div className="flex items-end justify-between mt-3">
              <span className="text-3xl font-bold text-slate-800">
                0
              </span>
              <span className="text-2xl"></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-5">
            <p className="text-sm text-slate-500">مجموع پرداختی</p>
            <div className="flex items-end justify-between mt-3">
              <span className="text-2xl font-bold text-slate-800">
                ۰ ریال
              </span>
              <span className="text-2xl"></span>
            </div>
          </div>

        </div>

        {/* Management */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-800">
            مدیریت سیستم
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group bg-white rounded-2xl border shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  {item.icon}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-1">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 leading-6">
                    {item.description}
                  </p>

                  <div className="mt-4 text-sm font-semibold text-slate-700">
                    ورود به بخش ←
                  </div>
                </div>

              </div>
            </a>
          ))}

        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-2xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                آخرین فعالیت‌ها
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                فعالیت‌های اخیر سیستم
              </p>
            </div>
          </div>

          <div className="text-center py-10 text-slate-400">
            هنوز فعالیتی ثبت نشده است.
          </div>
        </div>

      </main>
    </div>
  );
}