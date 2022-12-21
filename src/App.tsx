import { useState } from "react";
import FileSaver from "file-saver";
import { snakeCase } from "change-case";
import { createExpensePDF } from "./createExpensePDF";
import { v4 as uuidv4 } from "uuid";
import classNames from "classnames";
import { TEMPLATES } from "./TEMPLATES";
import { Input } from "./Input";
import { Button } from "./Button";
import { SignaturePad } from "./SignaturePad";
import { useDocumentStore } from "./useDocumentStore";

export interface ExpenseMetadata {
  uuid: string;
  formName: string;
  internalNote: string;
}
export type ExpenseInfo = ExpenseMetadata & {
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
};

function ExpenseForm(props: {
  expense: ExpenseInfo;
  setExpense: (expense: ExpenseInfo) => void;
}) {
  const { expense, setExpense } = props;

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

  return (
    <>
      <section className="px-4 py-2 flex flex-wrap flex-nowrap">
        <main>
          <form className="flex gap-2 flex-wrap">
            <div className="flex flex-col gap-2 m-2 w-[250px] items-stretch">
              <section className="flex flex-col">
                <span>Meta data</span>
                <Input
                  type="text"
                  label="Form name"
                  placeholder="Form name"
                  value={expense.formName}
                  onChange={(e) =>
                    setExpense({ ...expense, formName: e.target.value })
                  }
                />
                <Input
                  type="text"
                  label="Internal note"
                  placeholder="Internal note"
                  value={expense.internalNote}
                  onChange={(e) =>
                    setExpense({ ...expense, internalNote: e.target.value })
                  }
                />
              </section>

              <section className="flex flex-col gap-2 m-2">
                <span>Form data</span>

                <Input
                  type="text"
                  label="Last name"
                  placeholder="Last name"
                  onChange={(e) =>
                    setExpense({ ...expense, lastName: e.target.value })
                  }
                  value={expense.lastName}
                />

                <Input
                  type="text"
                  label="First name"
                  placeholder="First name"
                  value={expense.firstName}
                  onChange={(e) =>
                    setExpense({ ...expense, firstName: e.target.value })
                  }
                />

                <Input
                  label="Address"
                  type="text"
                  placeholder="Address"
                  onChange={(e) =>
                    setExpense({ ...expense, address: e.target.value })
                  }
                  value={expense.address}
                />
                <Input
                  label="IBAN"
                  type="text"
                  placeholder="IBAN"
                  onChange={(e) =>
                    setExpense({ ...expense, iban: e.target.value })
                  }
                  value={expense.iban}
                />
              </section>
            </div>
            <div className="flex flex-col gap-2 m-2 min-[250px]">
              <section className="flex flex-col gap-2 m-2">
                <span>Receipt details</span>

                <Input
                  label="Budgetary Item"
                  type="text"
                  placeholder="Budgetary Item"
                  onChange={(e) =>
                    setExpense({ ...expense, committee: e.target.value })
                  }
                  value={expense.committee}
                />
                <Input
                  label="Purpose"
                  type="text"
                  placeholder="Purpose"
                  onChange={(e) =>
                    setExpense({ ...expense, purpose: e.target.value })
                  }
                  value={expense.purpose}
                />

                <Input
                  label="Amount"
                  type="number"
                  max={9999}
                  placeholder="Amount in CHF"
                  onChange={(e) =>
                    setExpense({
                      ...expense,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  value={expense.amount}
                />
                <Input
                  label="Date on receipt"
                  type="date"
                  placeholder="Date on receipt"
                  value={expense.dateReceipt}
                  onChange={(e) =>
                    setExpense({ ...expense, dateReceipt: e.target.value })
                  }
                />
                <div className="flex gap-2">
                  <div className="flex-grow">
                    <Input
                      label="Today's date"
                      type="date"
                      placeholder="Todays date"
                      value={expense.dateToday}
                      onChange={(e) =>
                        setExpense({ ...expense, dateToday: e.target.value })
                      }
                    />
                  </div>
                  <button type="button">Today</button>
                </div>

                <Input
                  label="Comments"
                  type="text"
                  placeholder="Comments"
                  onChange={(e) =>
                    setExpense({ ...expense, comments: e.target.value })
                  }
                  value={expense.comments}
                />
              </section>

              <section className="flex flex-col gap-2 m-2">
                <SignaturePad
                  onClear={() => {
                    setExpense({ ...expense, signatureReciever: "" });
                  }}
                  data={expense.signatureReciever}
                  onData={(data) => {
                    setExpense({
                      ...expense,
                      signatureReciever: data,
                    });
                  }}
                  label="Your signature"
                  penColor="red"
                ></SignaturePad>

                <SignaturePad
                  onClear={() => {
                    setExpense({ ...expense, signatureBoard: "" });
                  }}
                  data={expense.signatureBoard}
                  onData={(data) => {
                    setExpense({
                      ...expense,
                      signatureBoard: data,
                    });
                  }}
                  label="Boardmemeber signature"
                  penColor="green"
                ></SignaturePad>
              </section>
            </div>
          </form>
        </main>
        <aside className="preview">
          <div className="flex gap-2 my-2">
            <Button onClick={() => previewDocument()}>Preview PDF</Button>
            <Button type="button" onClick={() => downloadDocument()}>
              Download PDF
            </Button>
          </div>
          <div>
            <iframe src={pdfSrc} title="pdf" className="w-[400px] h-[600px]" />
          </div>
        </aside>
      </section>
    </>
  );
}

function newExpense(template: Partial<ExpenseInfo>): ExpenseInfo {
  return {
    formName: "New Expense",
    internalNote: "",
    lastName: "",
    firstName: "",
    address: "",
    iban: "",
    committee: "",
    purpose: "",
    amount: 0,
    dateReceipt: "",
    dateToday: "",
    comments: "",
    signatureReciever: "",
    signatureBoard: "",
    ...template,
    uuid: uuidv4(),
  };
}

function DocumentTab(props: {
  onClick?: () => void;
  isActive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={classNames({
        "min-w-[250px] h-[100px] flex flex-col justify-center p-3 items-center rounded-xl gap-2 group cursor-pointer dark:hover:bg-zinc-700":
          true,
        "bg-zinc-300 dark:bg-zinc-700": props.isActive,
        "bg-zinc-200 dark:bg-zinc-800": !props.isActive,
      })}
      onClick={props.onClick}
    >
      {props.children}
    </div>
  );
}

function App() {
  const {
    keys,
    docs: expenses,
    updateDoc: updateExpense,
    addDoc: addExpense,
    removeDoc: removeExpense,
  } = useDocumentStore<ExpenseInfo>("expense");

  const [currentExpense, setCurrentExpense] = useState<string>("");

  const expense = expenses.find((e) => e?.uuid === currentExpense);

  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    Object.keys(TEMPLATES)[0]
  );

  return (
    <div className="App">
      <header className="px-4 py-2">
        <h1>Spesenformularinator</h1>
      </header>
      <section className="flex px-4 mb-4 border-b-2 border-t-2 border-zinc-200 dark:border-zinc-800 py-4 gap-4 max-w-[100vw] overflow-x-scroll">
        <DocumentTab>
          <div
            className="dark:text-zinc-400 flex gap-2 items-baseline"
            onClick={() => {
              const exp = newExpense(TEMPLATES[selectedTemplate]);
              addExpense(exp);
              setCurrentExpense(exp.uuid);
            }}
          >
            <span className="text-2xl">+</span>
            <span>New expense form</span>
          </div>
          <select
            value={selectedTemplate}
            onChange={(ev) => setSelectedTemplate(ev.target.value)}
          >
            {Object.entries(TEMPLATES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.formName}
              </option>
            ))}
          </select>
        </DocumentTab>
        {expenses.map((e) => (
          <DocumentTab
            onClick={() => setCurrentExpense(e.uuid)}
            isActive={e.uuid === currentExpense}
          >
            {e.formName}
            <div className="flex gap-2">
              <Button
                onClick={(ev) => {
                  ev.stopPropagation();
                  removeExpense(e);
                }}
              >
                Delete
              </Button>
              <Button
                onClick={(ev) => {
                  ev.stopPropagation();
                  const exp = newExpense(
                    expenses.find((e) => e.uuid === currentExpense) ?? {}
                  );
                  addExpense(exp);
                  setCurrentExpense(exp.uuid);
                }}
              >
                Duplicate
              </Button>
            </div>
          </DocumentTab>
        ))}
      </section>
      {expense && (
        <ExpenseForm
          expense={expense}
          setExpense={(updatedExpense) => updateExpense(updatedExpense)}
        ></ExpenseForm>
      )}
    </div>
  );
}

export default App;
