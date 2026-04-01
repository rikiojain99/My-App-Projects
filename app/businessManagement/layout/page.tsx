"use client";

import Link from "next/link";
import { useState } from "react";

const VENDOR_ICON = String.fromCodePoint(0x1f9fe);
const FOLDER_ICON = String.fromCodePoint(0x1f4c2);
const CREDIT_ICON = String.fromCodePoint(0x1f4b3);
const STOCK_ICON = String.fromCodePoint(0x1f4e6);
const CLIPBOARD_ICON = String.fromCodePoint(0x1f5c2);
const CHART_ICON = String.fromCodePoint(0x1f4c8);
const MONEY_ICON = String.fromCodePoint(0x1f4b8);
const PAGE_ICON = String.fromCodePoint(0x1f4c4);
const USERS_ICON = String.fromCodePoint(0x1f465);
const FACTORY_ICON = String.fromCodePoint(0x1f3ed);

export default function Home() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-10">
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-center text-2xl font-semibold underline">
          Business Management
        </h1>

        <Section
          id="vendor"
          title="Vendor Management"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink
            href="/billing"
            icon={VENDOR_ICON}
            label="Vendor Estimate"
          />
          <DashboardLink
            href="/vendors/view-estimates"
            icon={FOLDER_ICON}
            label="View Vendor Estimates"
          />
          <DashboardLink
            href="/credit"
            icon={CREDIT_ICON}
            label="Credit Management"
          />
        </Section>

        <Section
          id="inventory"
          title="Inventory"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink
            href="/inventory/stock-holdings"
            icon={CLIPBOARD_ICON}
            label="Manage Stock Details"
          />
          <DashboardLink
            href="/inventory/stock-view"
            icon={STOCK_ICON}
            label="Stock History Manager"
          />
        </Section>

        <Section
          id="reports"
          title="Reports"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink
            href="/profit-report"
            icon={CHART_ICON}
            label="Profit Report"
          />
        </Section>

        <Section
          id="expenses"
          title="Expenses"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink
            href="/expenses/add-expense"
            icon={MONEY_ICON}
            label="Add Expense"
          />
          <DashboardLink
            href="/expenses/view-expenses"
            icon={PAGE_ICON}
            label="View Expenses"
          />
        </Section>

        <Section
          id="customers"
          title="Customers"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink
            href="/customers/details"
            icon={USERS_ICON}
            label="Customer Details"
          />
        </Section>

        <Section
          id="manufacturing"
          title="Manufacturing"
          openSection={openSection}
          setOpenSection={setOpenSection}
        >
          <DashboardLink
            href="/manufacturing/history"
            icon={FACTORY_ICON}
            label="Manufacturing History"
          />
        </Section>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
  openSection,
  setOpenSection,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  openSection: string | null;
  setOpenSection: (id: string | null) => void;
}) {
  const isOpen = openSection === id;

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpenSection(isOpen ? null : id)}
        className="flex w-full items-center justify-between px-4 py-3 font-semibold"
      >
        <span>{title}</span>
        <span
          className={`transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          v
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function DashboardLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex w-full items-center justify-between rounded-lg border px-4 py-3 transition hover:bg-gray-50"
    >
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-gray-400">&gt;</span>
    </Link>
  );
}
