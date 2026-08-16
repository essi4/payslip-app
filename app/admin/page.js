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
      description: "ایجاد، مشاهده و مدیریت فیش‌ها",
      href: "/admin/payslips",
      icon: "",
    },
    {
      title: "اصلاح فیش",
      description: "ویرایش و اصلاح اطلاعات فیش حقوقی",
      href: "/admin/corrections",
      icon: "",
    },
    {
      title: "گزارش‌ها",
      description: "گزارش حقوق، بیمه، مالیات و پرداخت‌ها",
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

  const stats = [
    {
      title: "تعداد کارکنان",
      value: "0",
      icon: "",
      color: "bg-blue-50",
    },
    {
      title: "فیش‌های صادر شده",
      value: "0",
      icon: "",
      color: "bg-emerald-50",
    },
    {
      title: "فیش‌های ماه جاری",
      value: "0",
      icon: "",
      color: "bg-purple-50",
    },
    {
      title: "مجموع پرداختی",
      value: "۰ ریال",
      icon: "",
      color: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">

      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5">

          <div className="flex items-center justify-between gap-4">

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">
                پنل مدیریت
              </h1>

              <p className="text-sm text-slate-500 mt-2">
                مدیریت حقوق و دستمزد شرکت عرصه ساز لب رود
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-slate-700">
                  مدیر سیستم
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  دسترسی کامل
                </p>
              </div>

              <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center text-lg font-bold shadow">
                م
              </div>

            </div>
          </div>

        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* Welcome */}
        <div className="mb-8">

          <h2 className="text-2xl font-bold text-slate-800">
             داشبورد
          </h2>

          <p className="text-slate-500 mt-2">
            خلاصه وضعیت سیستم حقوق و دستمزد
          </p>

        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

          {stats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition"
            >

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    {stat.title}
                  </p>

                  <p className="text-2xl md:text-3xl font-extrabold text-slate-800 mt-3">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center text-2xl`}
                >
                  {stat.icon}
                </div>

              </div>

            </div>
          ))}

        </div>

        {/* Management */}
        <div className="mb-5">

          <h2 className="text-xl font-bold text-slate-800">
            مدیریت سیستم
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            دسترسی سریع به بخش‌های مختلف پنل مدیریت
          </p>

        </div>

        {/* Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group bg-white rounded-2xl border shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >

              <div className="flex items-start gap-4">

                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl group-hover:scale-110 transition">
                  {item.icon}
                </div>

                <div className="flex-1">

                  <h3 className="text-lg font-bold text-slate-800">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-500 leading-6 mt-2">
                    {item.description}
                  </p>

                  <div className="mt-4 text-sm font-bold text-slate-700 group-hover:text-blue-600 transition">
                    ورود به بخش ←
                  </div>

                </div>

              </div>

            </a>
          ))}

        </div>

        {/* Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-8">

          {/* Chart */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">

            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-lg font-bold text-slate-800">
                   نمودار گزارش‌ها
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  وضعیت پرداخت حقوق در ماه‌های اخیر
                </p>
              </div>

            </div>

            <div className="h-48 flex items-end justify-around gap-3 border-b border-slate-200 px-3">

              <div className="w-10 bg-slate-200 rounded-t-xl h-16"></div>
              <div className="w-10 bg-slate-300 rounded-t-xl h-24"></div>
              <div className="w-10 bg-slate-400 rounded-t-xl h-32"></div>
              <div className="w-10 bg-slate-300 rounded-t-xl h-20"></div>
              <div className="w-10 bg-slate-500 rounded-t-xl h-40"></div>
              <div className="w-10 bg-slate-300 rounded-t-xl h-28"></div>

            </div>

            <div className="flex justify-around text-xs text-slate-400 mt-3">
              <span>فروردین</span>
              <span>اردیبهشت</span>
              <span>خرداد</span>
              <span>تیر</span>
              <span>مرداد</span>
              <span>شهریور</span>
            </div>

          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">

            <div className="mb-5">

              <h2 className="text-lg font-bold text-slate-800">
                 آخرین فعالیت‌ها
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                فعالیت‌های اخیر سیستم
              </p>

            </div>

            <div className="space-y-4">

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">

                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-700">
                    مدیریت کارکنان
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    هنوز فعالیتی ثبت نشده است
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">

                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-700">
                    فیش‌های حقوقی
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    هنوز فیشی صادر نشده است
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">

                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-700">
                    گزارش‌ها
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    هنوز گزارشی ایجاد نشده است
                  </p>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="text-center mt-10 text-xs text-slate-400">
          سیستم مدیریت حقوق و دستمزد
        </div>

      </main>

    </div>
  );
}