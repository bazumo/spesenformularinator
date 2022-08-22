import { FormEvent, useEffect, useRef, useState } from "react";
import "./App.css";
import { PDFDocument, rgb } from "pdf-lib";
import FileSaver from "file-saver";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import SignatureCanvas from "react-signature-canvas";
import ReactSignatureCanvas from "react-signature-canvas";
import { snakeCase } from "change-case";

const OFFSETS = {
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

// ghetto debug mode
const DEBUG = false;

// Warning - trash code ahead
async function createExpensePDF(expense: ExpenseInfo): Promise<PDFDocument> {
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

interface ExpenseInfo {
  firstName: string;
  lastName: string;
  committee: string;
  purpose: string;
  amount: number;
  dateReceipt: string;
  dateToday: string;
  signatureReciever: string;
  signatureBoard: string;
  comments: string;
  address: string;
  iban: string;
}

const currentFormStateAtom = atomWithStorage<ExpenseInfo>("currentFormState", {
  firstName: "",
  lastName: "",
  committee: "",
  purpose: "",
  amount: 0,
  dateReceipt: "",
  dateToday: "",
  signatureReciever: "",
  signatureBoard: "",
  comments: "",
  address: "",
  iban: "",
});

function App() {
  const [expense, setExpense] = useAtom(currentFormStateAtom);
  const [pdfSrc, setPdfSrc] = useState("");
  const previewDocument = async () => {
    const pdfDoc = await createExpensePDF(expense);

    const pdfSrc = await pdfDoc.saveAsBase64({ dataUri: true });

    setPdfSrc(pdfSrc);
  };

  const downloadDocument = async () => {
    const pdfDoc = await createExpensePDF(expense);

    const pdfBytes = await pdfDoc.save();

    var file = new File([pdfBytes], "invoice.out.pdf", {
      type: "application/pdf;charset=utf-8",
    });

    const fileName = snakeCase(
      `${expense.firstName}_${expense.lastName}_${expense.dateToday}_Spesenformular`
    );
    FileSaver.saveAs(file, fileName);
  };

  const sigCanvasYouRef = useRef<ReactSignatureCanvas>(null);
  const sigCanvasBoardRef = useRef<ReactSignatureCanvas>(null);

  useEffect(() => {
    /*
    const canvas = sigCanvasYouRef.current?.getCanvas()!;
    var ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.getContext("2d")!.scale(ratio, ratio); */
    sigCanvasYouRef.current?.fromDataURL(expense.signatureReciever);
    sigCanvasBoardRef.current?.fromDataURL(expense.signatureBoard);
    /*canvas.getContext("2d")!.scale(1 / ratio, 1 / ratio);

    console.log("scaled"); fuck this */
  }, [sigCanvasYouRef, sigCanvasBoardRef]);

  return (
    <div className="App">
      <h1>Spesenformularinator</h1>
      <div className="split">
        <main>
          <form className="expenseForm">
            <label>First name</label>
            <input
              type="text"
              placeholder="First name"
              value={expense.firstName}
              onChange={(e) =>
                setExpense({ ...expense, firstName: e.target.value })
              }
            />
            <label>Last name</label>

            <input
              type="text"
              placeholder="Last name"
              onChange={(e) =>
                setExpense({ ...expense, lastName: e.target.value })
              }
              value={expense.lastName}
            />
            <label>Budgetary Item</label>
            <input
              type="text"
              placeholder="Budgetary Item"
              onChange={(e) =>
                setExpense({ ...expense, committee: e.target.value })
              }
              value={expense.committee}
            />
            <label>Purpose</label>
            <input
              type="text"
              placeholder="Purpose"
              onChange={(e) =>
                setExpense({ ...expense, purpose: e.target.value })
              }
              value={expense.purpose}
            />
            <label>Amount</label>

            <input
              type="number"
              max={9999}
              placeholder="Amount in CHF"
              onChange={(e) =>
                setExpense({ ...expense, amount: parseFloat(e.target.value) })
              }
              value={expense.amount}
            />
            <label>Date on receipt</label>
            <input
              type="date"
              placeholder="Date on receipt"
              value={expense.dateReceipt}
              onChange={(e) =>
                setExpense({ ...expense, dateReceipt: e.target.value })
              }
            />
            <label>Today's date</label>
            <input
              type="date"
              placeholder="Todays date"
              value={expense.dateToday}
              onChange={(e) =>
                setExpense({ ...expense, dateToday: e.target.value })
              }
            />
            <label>Comment</label>
            <input
              type="text"
              placeholder="Comments"
              onChange={(e) =>
                setExpense({ ...expense, comments: e.target.value })
              }
              value={expense.comments}
            />
            <label>Address</label>

            <input
              type="text"
              placeholder="Address"
              onChange={(e) =>
                setExpense({ ...expense, address: e.target.value })
              }
              value={expense.address}
            />
            <label>IBAN</label>
            <input
              type="text"
              placeholder="IBAN"
              onChange={(e) => setExpense({ ...expense, iban: e.target.value })}
              value={expense.iban}
            />
            <h3>Your signature</h3>
            <button
              type="button"
              onClick={() => {
                setExpense({ ...expense, signatureReciever: "" });
                sigCanvasYouRef.current?.clear();
              }}
            >
              Clear signature
            </button>
            <SignatureCanvas
              penColor="red"
              ref={sigCanvasYouRef}
              canvasProps={{
                width: 500,
                height: 200,
                className: "sigCanvasYou",
              }}
              onEnd={() => {
                setExpense({
                  ...expense,
                  signatureReciever: sigCanvasYouRef.current?.toDataURL() ?? "",
                });
              }}
            />
            <h3>Boardmemeber signature</h3>
            <button
              onClick={() => {
                setExpense({ ...expense, signatureBoard: "" });
                sigCanvasBoardRef.current?.clear();
              }}
              type="button"
            >
              Clear signature
            </button>
            <SignatureCanvas
              penColor="green"
              canvasProps={{
                width: 500,
                height: 200,
                className: "sigCanvasBoard",
              }}
              ref={sigCanvasBoardRef}
              onEnd={() =>
                setExpense({
                  ...expense,
                  signatureBoard: sigCanvasBoardRef.current?.toDataURL() ?? "",
                })
              }
            />
            <button type="button" onClick={() => previewDocument()}>
              Preview PDF
            </button>
            <button type="button" onClick={() => downloadDocument()}>
              Download PDF
            </button>
          </form>
        </main>
        <aside>
          <div className="pdfContainer">
            <div className="pdf">
              <iframe src={pdfSrc} title="pdf" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
