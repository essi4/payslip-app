"use client";

import { useEffect } from "react";

function normalizeDigits(value) {
  return String(value || "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export default function NormalizePersianDigits({ children }) {
  useEffect(() => {
    function handleInput(event) {
      const target = event.target;

      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        return;
      }

      const normalized = normalizeDigits(target.value);

      if (normalized === target.value) {
        return;
      }

      const prototype = target instanceof HTMLInputElement
        ? HTMLInputElement.prototype
        : HTMLTextAreaElement.prototype;

      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

      if (descriptor?.set) {
        descriptor.set.call(target, normalized);
      } else {
        target.value = normalized;
      }

      target.dispatchEvent(new Event("input", { bubbles: true }));
    }

    document.addEventListener("input", handleInput, true);

    return () => {
      document.removeEventListener("input", handleInput, true);
    };
  }, []);

  return children;
}
