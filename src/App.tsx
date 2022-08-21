import { FormEvent, useEffect, useRef, useState } from "react";
import "./App.css";
import { PDFDocument, rgb } from "pdf-lib";
import FileSaver from "file-saver";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import SignatureCanvas from "react-signature-canvas";
import ReactSignatureCanvas from "react-signature-canvas";

const OFFSETS = {
  NAME: [310, 720],
  COMMITTEE_AND_EVENT: [310, 635],
  PURPOSE: [310, 574],
  AMOUNT: [310, 515],
  DATE_RECEIPT: [310, 450],
  DATE_TODAY: [310, 385],
  SIGNATURE_RECIEVER: [310, 319],
  SIGNATURE_BOARD: [310, 255],
  COMMENTS: [20, 162],
  PAYER_LINE_1: [20, 87],
  PAYER_LINE_2: [20, 49],
};

// ghetto debug mode
const DEBUG = false;

// Warning - trash code ahead
async function createExpensePDF(expense: ExpenseInfo): Promise<string> {
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

  page.moveTo(OFFSETS.AMOUNT[0], OFFSETS.AMOUNT[1]);
  page.drawText(`${expense.amount} CHF`);

  page.moveTo(OFFSETS.DATE_RECEIPT[0], OFFSETS.DATE_RECEIPT[1]);
  page.drawText(expense.dateReceipt);

  page.moveTo(OFFSETS.DATE_TODAY[0], OFFSETS.DATE_TODAY[1]);
  page.drawText(expense.dateToday);

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

  page.setFontSize(12);
  page.moveTo(OFFSETS.COMMENTS[0], OFFSETS.COMMENTS[1]);
  page.drawText(expense.comments);

  page.moveTo(OFFSETS.PAYER_LINE_1[0], OFFSETS.PAYER_LINE_1[1]);
  page.drawText(`${fullName}, ${expense.address}`);
  page.moveTo(OFFSETS.PAYER_LINE_2[0], OFFSETS.PAYER_LINE_2[1]);
  page.drawText(`${expense.iban}`);

  const pdfSrc = await pdfDoc.saveAsBase64({ dataUri: true });
  const pdfBytes = await pdfDoc.save();

  var file = new File([pdfBytes], "invoice.out.pdf", {
    type: "application/pdf;charset=utf-8",
  });
  FileSaver.saveAs(file, "invoice.pdf");

  return pdfSrc;
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
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const src = await createExpensePDF(expense);

    setPdfSrc(src);
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
      <h1>Expenseforminator</h1>
      <form className="expenseForm" onSubmit={(e) => onSubmit(e)}>
        <input
          type="text"
          placeholder="First name"
          value={expense.firstName}
          onChange={(e) =>
            setExpense({ ...expense, firstName: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Last name"
          onChange={(e) => setExpense({ ...expense, lastName: e.target.value })}
          value={expense.lastName}
        />
        <input
          type="text"
          placeholder="Budgetary Item"
          onChange={(e) =>
            setExpense({ ...expense, committee: e.target.value })
          }
          value={expense.committee}
        />
        <input
          type="text"
          placeholder="Purpose"
          onChange={(e) => setExpense({ ...expense, purpose: e.target.value })}
          value={expense.purpose}
        />
        <input
          type="number"
          placeholder="Amount in CHF"
          onChange={(e) =>
            setExpense({ ...expense, amount: parseInt(e.target.value) })
          }
          value={expense.amount}
        />
        <input
          type="date"
          placeholder="Date on receipt"
          value={expense.dateReceipt}
          onChange={(e) =>
            setExpense({ ...expense, dateReceipt: e.target.value })
          }
        />
        <input
          type="date"
          placeholder="Todays date"
          value={expense.dateToday}
          onChange={(e) =>
            setExpense({ ...expense, dateToday: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Comments"
          onChange={(e) => setExpense({ ...expense, comments: e.target.value })}
          value={expense.comments}
        />
        <input
          type="text"
          placeholder="Address"
          onChange={(e) => setExpense({ ...expense, address: e.target.value })}
          value={expense.address}
        />
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
          canvasProps={{ width: 500, height: 200, className: "sigCanvasYou" }}
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
          canvasProps={{ width: 500, height: 200, className: "sigCanvasBoard" }}
          ref={sigCanvasBoardRef}
          onEnd={() =>
            setExpense({
              ...expense,
              signatureBoard: sigCanvasBoardRef.current?.toDataURL() ?? "",
            })
          }
        />

        <button type="submit">Create PDF</button>
      </form>
      <div className="pdfContainer">
        <div className="pdf">
          <iframe src={pdfSrc} title="pdf" />
        </div>
      </div>
    </div>
  );
}

export default App;
