import "./globals.css";

export const metadata = {
  title: "سامانه آنلاین فیش حقوقی شرکت عرصه ساز لب رود",
  description:
    "سامانه دریافت آنلاین فیش حقوقی و مزایای پرسنل شرکت عرصه ساز لب رود",
};

const normalizeDigitsScript = `
(function () {
  var fa = "۰۱۲۳۴۵۶۷۸۹";
  var ar = "٠١٢٣٤٥٦٧٨٩";

  function normalize(value) {
    return String(value || "")
      .replace(/[۰-۹]/g, function (digit) { return String(fa.indexOf(digit)); })
      .replace(/[٠-٩]/g, function (digit) { return String(ar.indexOf(digit)); });
  }

  document.addEventListener("input", function (event) {
    var target = event.target;
    if (!target || !target.tagName || (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA")) return;

    var normalized = normalize(target.value);
    if (normalized === target.value) return;

    var prototype = target.tagName === "INPUT" ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
    var descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && descriptor.set) descriptor.set.call(target, normalized);
    else target.value = normalized;

    target.dispatchEvent(new Event("input", { bubbles: true }));
  }, true);
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <script dangerouslySetInnerHTML={{ __html: normalizeDigitsScript }} />
        {children}
      </body>
    </html>
  );
}
