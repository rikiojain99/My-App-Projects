"use client";

import {
  useEffect,
  useState,
  memo,
} from "react";

export type VendorFormValue = {
  vendorId: string | null;
  shopName: string;
  city: string;
  mobile: string;
  deliveredBy: string;
  oldBalance: number;
  isExisting: boolean;
};

type Props = {
  value: VendorFormValue;
  onChange: (patch: Partial<VendorFormValue>) => void;
};

function VendorForm({ value, onChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="mb-4 border p-2">
      <div className="flex justify-between items-start gap-2 m-1">
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-lg text-black ">
            Vendor Details
          {(value.isExisting || value.oldBalance > 0) && (
            <span className= " ml-2 text-xs font-medium text-amber-700">
              Old Balance: Rs.{value.oldBalance}
            </span>
          )}
          </h1>
          
        </div>
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="w-8 h-8 flex items-center justify-center rounded-full border hover:bg-gray-100 transition">
          {expanded ? "-" : "+"}
        </button>
      </div>

      {expanded && (
        <>
          <div className="space-y-2 grid grid-cols-2 gap-2 mt-2">
            <input
              type="text"
              value={value.shopName}
              onChange={(event) =>
                onChange({
                  shopName: event.target.value,
                  vendorId: value.isExisting ? value.vendorId : null,
                })
              }
              placeholder="Shop Name"
              className="w-full border p-2"
            />

            <input
              type="text"
              value={value.city}
              onChange={(event) => onChange({ city: event.target.value })}
              placeholder="City"
              className="w-full border p-2"
            />

            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={value.mobile}
              onChange={(event) =>
                onChange({
                  mobile: event.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              placeholder="Mobile"
              className="w-full border p-2"
            />

            <input
              type="text"
              value={value.deliveredBy}
              onChange={(event) => onChange({ deliveredBy: event.target.value })}
              placeholder="Delivery person name"
              className="w-full border p-2"
            />
          </div>
        </>
      )}
    </section>
  );
}

export default memo(VendorForm);
