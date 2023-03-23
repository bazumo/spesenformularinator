import classNames from "classnames";
import { InputHTMLAttributes } from "react";

// whatever an atomWithStorage
export function Input(
  props: InputHTMLAttributes<HTMLInputElement> & { label?: string }
) {
  const { label, className, ...rest } = props;
  return (
    <div className="flex flex-col">
      {label && <label className="text-xs">{label}</label>}
      <input
        className={classNames(
          "invalid:bg-red-100 dark:invalid:bg-red-900",
          className
        )}
        {...rest}
      ></input>
    </div>
  );
}
