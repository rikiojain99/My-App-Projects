"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import SaveStatusPopup, {
  type SavePopupStatus,
} from "@/components/ui/SaveStatusPopup";

type StockRow = {
  name: string;
  qty: number;
  rate: number;
};

export default function OpeningStockPage() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [savePopup, setSavePopup] = useState<{
    open: boolean;
    status: SavePopupStatus;
    title: string;
    message: string;
  }>({
    open: false,
    status: "saving",
    title: "",
    message: "",
  });

  /* ================= FILE UPLOAD ================= */

  const handleFileUpload = (file: File) => {
    setError("");
    setSuccess("");

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(
          e.target?.result as ArrayBuffer
        );
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!json.length) {
          setError("Excel file is empty");
          return;
        }

        const parsed: StockRow[] = json
          .map((r) => ({
            name: (
              r["Item Name"] ||
              r["Name"] ||
              r["name"] ||
              r["item"] ||
              ""
            )
              .toString()
              .trim(),
            qty: Number(
              r["Quantity"] || r["qty"] || r["quantity"] || 0
            ),
            rate: Number(
              r["Rate"] || r["rate"] || r["Price"] || 0
            ),
          }))
          .filter(
            (r) =>
              r.name &&
              !isNaN(r.qty) &&
              r.qty > 0 &&
              !isNaN(r.rate) &&
              r.rate >= 0
          );

        if (!parsed.length) {
          setError(
            "No valid rows found. Check column names or values."
          );
          return;
        }

        if (parsed.length > 5000) {
          setError("Too many rows. Maximum 5000 allowed.");
          return;
        }

        const uniqueMap = new Map<string, StockRow>();

        parsed.forEach((row) => {
          const key = row.name.toLowerCase();
          if (!uniqueMap.has(key)) {
            uniqueMap.set(key, row);
          }
        });

        const uniqueRows = Array.from(uniqueMap.values());
        setRows(uniqueRows);
      } catch (err) {
        console.error(err);
        setError("Failed to read Excel file");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  /* ================= TOTAL CALCULATION ================= */

  const totalItems = rows.length;

  const totalStockValue = useMemo(
    () => rows.reduce((sum, r) => sum + r.qty * r.rate, 0),
    [rows]
  );

  /* ================= SAVE ================= */

  const saveOpeningStock = async () => {
    if (!rows.length) return;

    const confirmSave = confirm(
      "Are you sure? This will overwrite existing stock."
    );
    if (!confirmSave) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setSavePopup({
      open: true,
      status: "saving",
      title: "Saving opening stock",
      message: "Please wait while we save data.",
    });

    try {
      const res = await fetch("/api/inventory/opening-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: rows }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "API failed");
      }

      setSuccess("Opening stock saved successfully");
      setRows([]);
      setSavePopup({
        open: true,
        status: "success",
        title: "Opening stock saved",
        message: "Data has been saved successfully.",
      });
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to save opening stock";
      setError(msg);
      setSavePopup({
        open: true,
        status: "error",
        title: "Save failed",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto bg-white border rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">
          Opening Stock Setup
        </h1>

        <p className="text-sm text-gray-600 mb-4">
          Upload your stock Excel file once to initialize
          inventory.
        </p>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) =>
            e.target.files &&
            handleFileUpload(e.target.files[0])
          }
          className="mb-4"
        />

        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}

        {rows.length > 0 && (
          <>
            <div className="bg-blue-50 border rounded-lg p-4 mb-4">
              <p className="text-sm">
                Total Items:{" "}
                <span className="font-semibold">
                  {totalItems}
                </span>
              </p>
              <p className="text-sm">
                Total Stock Value:{" "}
                <span className="font-semibold">
                  Rs. {totalStockValue.toLocaleString()}
                </span>
              </p>
            </div>

            <div className="border rounded mb-4 overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border p-2">#</th>
                    <th className="border p-2 text-left">
                      Item Name
                    </th>
                    <th className="border p-2 text-center">
                      Quantity
                    </th>
                    <th className="border p-2 text-center">
                      Rate
                    </th>
                    <th className="border p-2 text-center">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="border p-2 text-center">
                        {i + 1}
                      </td>
                      <td className="border p-2">{r.name}</td>
                      <td className="border p-2 text-center">
                        {r.qty}
                      </td>
                      <td className="border p-2 text-center">
                        Rs. {r.rate}
                      </td>
                      <td className="border p-2 text-center">
                        Rs. {(r.qty * r.rate).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={saveOpeningStock}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Opening Stock"}
            </button>
          </>
        )}

        {success && (
          <p className="text-sm text-green-600 mt-4">{success}</p>
        )}

        <div className="mt-6 text-xs text-gray-500">
          Uploading again will overwrite existing stock. Make sure
          this is your correct opening inventory.
        </div>
      </div>

      <SaveStatusPopup
        open={savePopup.open}
        status={savePopup.status}
        title={savePopup.title}
        message={savePopup.message}
        onClose={() =>
          setSavePopup((prev) => ({ ...prev, open: false }))
        }
      />
    </div>
  );
}
