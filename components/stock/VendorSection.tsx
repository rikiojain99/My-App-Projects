"use client";

type Props = {
  vendorName: string;
  setVendorName: (v: string) => void;
  purchaseDate: string;
  setPurchaseDate: (v: string) => void;
  vendors: string[];
  showVendorSuggestions: boolean;
  setShowVendorSuggestions: (v: boolean) => void;
};

export default function VendorSection({
  vendorName,
  setVendorName,
  purchaseDate,
  setPurchaseDate,
  vendors,
  showVendorSuggestions,
  setShowVendorSuggestions,
}: Props) {
  return (
    <>
      <div className="relative">
        <input
          type="text"
          placeholder="Vendor Name"
          value={vendorName}
          onChange={(e) => {
            setVendorName(e.target.value);
            setShowVendorSuggestions(true);
          }}
          onBlur={() =>
            setTimeout(() => setShowVendorSuggestions(false), 200)
          }
          className="w-full p-3 border rounded"
          required
        />

        {showVendorSuggestions && vendorName && (
          <div className="absolute z-50 bg-white border rounded w-full max-h-40 overflow-y-auto shadow-lg">
            {vendors
              .filter((v) =>
                v.toLowerCase().includes(vendorName.toLowerCase())
              )
              .map((v) => (
                <div
                  key={v}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setVendorName(v);
                    setShowVendorSuggestions(false);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-50"
                >
                  {v}
                </div>
              ))}
          </div>
        )}
      </div>

      <input
        type="date"
        value={purchaseDate}
        onChange={(e) => setPurchaseDate(e.target.value)}
        className="w-full p-3 border rounded"
        required
      />
    </>
  );
}
