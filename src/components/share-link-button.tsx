"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, Check } from "lucide-react";

interface ShareLinkButtonProps {
  salary: number;
  bonus?: number;
  includeBonusInTaxableIncome: "yes" | "no";
}

export function ShareLinkButton({
  salary,
  bonus,
  includeBonusInTaxableIncome,
}: ShareLinkButtonProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("salary", String(salary));
    if (bonus !== undefined) {
      url.searchParams.set("bonus", String(bonus));
    } else {
      url.searchParams.delete("bonus");
    }
    url.searchParams.set("includeBonusInTaxableIncome", includeBonusInTaxableIncome);

    setShareUrl(url.toString());
  }, [salary, bonus, includeBonusInTaxableIncome]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy link.");
    }
  };

  return (
    <button
      type="button"
      onClick={copyToClipboard}
      className="relative inline-flex items-center p-1 rounded-md text-gray-600 hover:bg-accent focus:outline-none focus:ring-2 group"
    >
      {copied ? (
        <Check className="h-6 w-6 text-yellow-500" />
      ) : (
        <ClipboardList className="h-6 w-6" />
      )}

      {/* Tooltip on hover */}
      <span
        className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white transition-opacity duration-200 pointer-events-none ${
          copied ? "opacity-0" : "group-hover:opacity-100 opacity-0"
        }`}
      >
        Copy shareable link
      </span>

      {/* Toast-like "Copied!" message */}
      {copied && (
        <span
          className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-yellow-600 px-2 py-1 text-xs text-white shadow-lg select-none pointer-events-none"
          role="alert"
        >
          Copied!
        </span>
      )}
    </button>
  );
}
