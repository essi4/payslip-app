import CompanyWelcomeBanner from "./CompanyWelcomeBanner";
import EmployeeBottomNav from "./EmployeeBottomNav";

export default function PayslipLayout({ children }) {
  return (
    <>
      <CompanyWelcomeBanner />
      <EmployeeBottomNav />
      <div className="pt-20 sm:pt-24">{children}</div>
    </>
  );
}
