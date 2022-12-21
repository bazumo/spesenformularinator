import { InputHTMLAttributes } from "react";

// whatever an atomWithStorage
export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, ...rest } = props;
  return (
    <div className="flex flex-col">
      {label && <label className="text-xs">{label}</label>}
      <input {...rest}></input>
    </div>
  );
}
