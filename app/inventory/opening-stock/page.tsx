"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

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

  /* ---------------- FILE UPLOAD ---------------- */
  const handleFileUpload = (file: File) => {
    setError("");
    setSuccess("");

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!json.length) {
          setError("Excel file is empty");
          return;
        }

        // Flexible column mapping
        const parsed: StockRow[] = json
          .map((r) => ({
            name:
              r["Item Name"] ||
              r["Item"] ||
              r["Name"] ||
              r["item"],
            qty: Number(
              r["Quantity"] ||
              r["Qty"] ||
              r["quantity"]
            ),
            rate: Number(
              r["Rate"] ||
              r["Price"] ||
              r["rate"]
            ),
          }))
          .filter(
            (r) =>
              r.name &&
              !isNaN(r.qty) &&
              r.qty > 0 &&
              !isNaN(r.rate)
          );

        if (!parsed.length) {
          setError(
            "No valid rows found. Check column names or values."
          );
          return;
        }

        setRows(parsed);
      } catch (err) {
        console.error(err);
        setError("Failed to read Excel file");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  /* ---------------- SAVE ---------------- */
  const saveOpeningStock = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/inventory/opening-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: rows }),
      });

      if (!res.ok) {
        throw new Error("API failed");
      }

      setSuccess("✅ Opening stock saved successfully");
      setRows([]);
    } catch (err) {
      console.error(err);
      setError("❌ Failed to save opening stock");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-3xl mx-auto bg-white border rounded-md p-6">
        <h1 className="text-xl font-semibold text-black mb-1">
          Opening Stock (One-Time Setup)
        </h1>

        <p className="text-sm text-gray-600 mb-4">
          Upload your current stock once to start billing immediately.
        </p>

        {/* Upload */}
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) =>
            e.target.files &&
            handleFileUpload(e.target.files[0])
          }
          className="mb-4"
        />

        {/* Errors */}
        {error && (
          <p className="text-sm text-red-600 mb-3">
            {error}
          </p>
        )}

        {/* Preview */}
        {rows.length > 0 && (
          <>
            <div className="border rounded mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-left">
                      Item Name
                    </th>
                    <th className="border p-2 text-center">
                      Quantity
                    </th>
                    <th className="border p-2 text-center">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="border p-2">
                        {r.name}
                      </td>
                      <td className="border p-2 text-center">
                        {r.qty}
                      </td>
                      <td className="border p-2 text-center">
                        ₹{r.rate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={saveOpeningStock}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:opacity-90"
            >
              {loading ? "Saving..." : "Save Opening Stock"}
            </button>
          </>
        )}

        {/* Success */}
        {success && (
          <p className="text-sm text-green-600 mt-3">
            {success}
          </p>
        )}

        {/* Warning */}
        <div className="mt-6 text-xs text-gray-500">
          ⚠️ This action should be done only once. Uploading
          again will overwrite existing stock.
        </div>
      </div>
    </div>
  );
}
