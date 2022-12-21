import { PDFDocument, rgb } from "pdf-lib";
import { ExpenseInfo } from "./App";

// ghetto debug mode
const DEBUG = false;

export const OFFSETS = {
  NAME: [310, 720],
  COMMITTEE_AND_EVENT: [310, 635],
  PURPOSE: [310, 574],
  AMOUNT: [310, 513],
  DATE_RECEIPT: [440, 450],
  DATE_TODAY: [440, 385],
  SIGNATURE_RECIEVER: [310, 319],
  SIGNATURE_BOARD: [310, 255],
  COMMENTS: [20, 162],
  MONEY_CHECKBOX: [22, 125],
  PAYER_LINE_1: [20, 87],
  PAYER_LINE_2: [20, 49],
};

// Warning - trash code ahead
export async function createExpensePDF(
  expense: ExpenseInfo
): Promise<PDFDocument> {
  const url = "/invoice.pdf";
  const arrayBuffer = await fetch(url).then((res) => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  const page = pages[0];

  page.setFontSize(16);

  if (DEBUG) {
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        page.drawText(`${i} ${j}`);
        page.moveTo(i * 100, j * 100);
      }
    }
  }

  const fullName = `${expense.firstName} ${expense.lastName}`;

  page.setFontColor(rgb(0.8, 0, 0));

  page.moveTo(OFFSETS.NAME[0], OFFSETS.NAME[1]);
  page.drawText(fullName);
  page.moveTo(OFFSETS.COMMITTEE_AND_EVENT[0], OFFSETS.COMMITTEE_AND_EVENT[1]);
  page.drawText(expense.committee);
  page.moveTo(OFFSETS.PURPOSE[0], OFFSETS.PURPOSE[1]);
  page.drawText(expense.purpose);

  page.setFontSize(20);

  const digits_franken = Math.floor(expense.amount)
    .toString()
    .padStart(4, " ")
    .split("");
  const digits_rappen = expense.amount.toFixed(2).split(".")[1].split("");

  page.drawText(digits_franken[0], {
    x: OFFSETS.AMOUNT[0] + 130,
    y: OFFSETS.AMOUNT[1],
  });

  page.drawText(digits_franken[1], {
    x: OFFSETS.AMOUNT[0] + 158,
    y: OFFSETS.AMOUNT[1],
  });

  page.drawText(digits_franken[2], {
    x: OFFSETS.AMOUNT[0] + 183,
    y: OFFSETS.AMOUNT[1],
  });

  page.drawText(digits_franken[3], {
    x: OFFSETS.AMOUNT[0] + 206,
    y: OFFSETS.AMOUNT[1],
  });

  page.drawText(digits_rappen[0], {
    x: OFFSETS.AMOUNT[0] + 234,
    y: OFFSETS.AMOUNT[1],
  });

  page.drawText(digits_rappen[1], {
    x: OFFSETS.AMOUNT[0] + 256,
    y: OFFSETS.AMOUNT[1],
  });

  function fillDateInBoxesAt(date_string: string, x: number, y: number) {
    const date = new Date(date_string);
    const dateYearDigits = (date.getFullYear() % 100).toString().split("");
    const dateMonthDigits = (date.getMonth() + 1) // L M A O
      .toString()
      .padStart(2, "0")
      .split("");
    const dateDateDigits = date.getDate().toString().padStart(2, " ").split("");
    console.log(dateMonthDigits);
    page.drawText(dateDateDigits[0] ?? "", {
      x: x + 0,
      y,
    });
    page.drawText(dateDateDigits[1] ?? "", {
      x: x + 22,
      y,
    });
    page.drawText(dateMonthDigits[0] ?? "", {
      x: x + 52,
      y,
    });
    page.drawText(dateMonthDigits[1] ?? "", {
      x: x + 76,
      y,
    });
    page.drawText(dateYearDigits[0] ?? "", {
      x: x + 103,
      y,
    });
    page.drawText(dateYearDigits[1] ?? "", {
      x: x + 124,
      y,
    });
  }

  fillDateInBoxesAt(
    expense.dateReceipt,
    OFFSETS.DATE_RECEIPT[0],
    OFFSETS.DATE_RECEIPT[1]
  );

  fillDateInBoxesAt(
    expense.dateToday,
    OFFSETS.DATE_TODAY[0],
    OFFSETS.DATE_TODAY[1]
  );

  if (expense.signatureReciever) {
    page.moveTo(OFFSETS.SIGNATURE_RECIEVER[0], OFFSETS.SIGNATURE_RECIEVER[1]);
    const signatureRecieverImg = await pdfDoc.embedPng(
      expense.signatureReciever
    );
    page.drawImage(signatureRecieverImg, {
      width: 120,
      height: 40,
    });
  }

  if (expense.signatureBoard) {
    page.moveTo(OFFSETS.SIGNATURE_BOARD[0], OFFSETS.SIGNATURE_BOARD[1]);
    const signatureBoardImg = await pdfDoc.embedPng(expense.signatureBoard);
    page.drawImage(signatureBoardImg, {
      width: 120,
      height: 40,
    });
  }

  page.moveTo(OFFSETS.MONEY_CHECKBOX[0], OFFSETS.MONEY_CHECKBOX[1]);
  page.drawText("X");

  page.setFontSize(12);
  page.moveTo(OFFSETS.COMMENTS[0], OFFSETS.COMMENTS[1]);
  page.drawText(expense.comments);

  page.moveTo(OFFSETS.PAYER_LINE_1[0], OFFSETS.PAYER_LINE_1[1]);
  page.drawText(`${fullName}, ${expense.address}`);
  page.moveTo(OFFSETS.PAYER_LINE_2[0], OFFSETS.PAYER_LINE_2[1]);
  page.drawText(`${expense.iban}`);

  return pdfDoc;
}
