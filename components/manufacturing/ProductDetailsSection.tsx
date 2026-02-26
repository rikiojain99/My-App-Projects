"use client";

import Input from "@/components/ui/Input";

type Props = {
  productName: string;
  producedQty: number;
  disabled?: boolean;
  onProductNameChange: (value: string) => void;
  onProducedQtyChange: (value: number) => void;
};

export default function ProductDetailsSection({
  productName,
  producedQty,
  disabled = false,
  onProductNameChange,
  onProducedQtyChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Input
        label="Product Name"
        value={productName}
        onChange={(e) => onProductNameChange(e.target.value)}
        placeholder="Enter product name"
        disabled={disabled}
        autoComplete="off"
      />

      <Input
        label="Produced Qty"
        type="number"
        min={1}
        value={Number.isFinite(producedQty) ? String(producedQty) : "1"}
        onChange={(e) => {
          const next = Number(e.target.value);
          onProducedQtyChange(
            Number.isFinite(next) && next > 0 ? next : 1
          );
        }}
        disabled={disabled}
      />
    </div>
  );
}
