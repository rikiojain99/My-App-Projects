export function openWhatsApp(bill: any) {
  const {
    mobile,
     customerName,
    items,
    grandTotal,
    discount,
    finalTotal,
    paymentMode,
    cashAmount,
    upiAmount,
  } = bill;

  const date = new Date().toLocaleString("en-IN");

  const itemLines = items
    .map(
      (it: any, index: number) =>
        `${index + 1}. *${it.name}*
   ${it.qty} x Rs.${it.rate}  =  Rs.${it.total}`
    )
    .join("\n\n");

  let paymentBlock = "";

  if (paymentMode === "split") {
    paymentBlock = ` Cash Paid: Rs.${cashAmount}
 UPI Paid: Rs.${upiAmount}`;
  } else if (paymentMode === "upi") {
    paymentBlock = ` Paid via UPI: Rs.${finalTotal}`;
  } else {
    paymentBlock = ` Paid in Cash: Rs.${finalTotal}`;
  }

 const message = `
 *Estimate*
-----------------------------
 Customer: *${customerName || "Valued Customer"}*
 Date: ${date}
-----------------------------
  *ITEM DETAILS*
${itemLines}
-----------------------------
*TOTAL : Rs.${finalTotal}*
-----------------------------
${paymentBlock}
-----------------------------
 Thank you for shopping with us!`;
  const encoded = encodeURIComponent(message.trim());
  const whatsappURL = `https://wa.me/91${mobile}?text=${encoded}`;
  window.open(whatsappURL, "_blank");
}

export function openVendorBillingWhatsApp({
  mobile,
  vendorName,
  items,
  total,
  paymentLabel,
  oldBalance,
  newBalance,
}: {
  mobile: string;
  vendorName: string;
  items: Array<{
    name: string;
    qty: number;
    amount: number;
  }>;
  total: number;
  paymentLabel: "Credit" | "Paid";
  oldBalance?: number;
  newBalance?: number;
}) {
  const itemLines = items
    .map((item) => `- ${item.name} x ${item.qty} = Rs.${item.amount}`)
    .join("\n");

  const balanceBlock =
    paymentLabel === "Credit"
      ? `\nOld Balance: Rs.${oldBalance || 0}\nNew Total: Rs.${newBalance || total}`
      : "";

  const message = `Hello ${vendorName},

Items:
${itemLines}

Total: Rs.${total}
Payment: ${paymentLabel}${balanceBlock}`;

  const encoded = encodeURIComponent(message.trim());
  const whatsappURL = `https://wa.me/91${mobile}?text=${encoded}`;
  window.open(whatsappURL, "_blank");
}

export function openVendorCreditWhatsApp({
  mobile,
  vendorName,
  amount,
  previousBalance,
  newBalance,
}: {
  mobile: string;
  vendorName: string;
  amount: number;
  previousBalance: number;
  newBalance: number;
}) {
  const message = `Hello ${vendorName},

Payment Received: Rs.${amount}
Previous Balance: Rs.${previousBalance}
Remaining Balance: Rs.${newBalance}

Thank you.`;

  const encoded = encodeURIComponent(message.trim());
  const whatsappURL = `https://wa.me/91${mobile}?text=${encoded}`;
  window.open(whatsappURL, "_blank");
}
