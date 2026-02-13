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
 *Bill Estimate*
-----------------------------

 Customer: *${customerName || "Valued Customer"}*
 Date: ${date}

-----------------------------
  *ITEM DETAILS*

${itemLines}

-----------------------------

  *BILL SUMMARY*

Subtotal : Rs.${grandTotal}
Discount : Rs.${discount || 0}
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
