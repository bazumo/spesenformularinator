import { useEffect, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import ReactSignatureCanvas from "react-signature-canvas";

export function SignaturePad(props: {
  onClear: () => void;
  onData: (data: string) => void;
  data: string;
  label: string;
  penColor?: string;
}) {
  const ref = useRef<ReactSignatureCanvas>(null);

  useEffect(() => {
    /*
    const canvas = sigCanvasYouRef.current?.getCanvas()!;
    var ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.getContext("2d")!.scale(ratio, ratio); */
    ref.current?.fromDataURL(props.data);
    /*canvas.getContext("2d")!.scale(1 / ratio, 1 / ratio);
 
    console.log("scaled"); fuck this */
  }, [ref]);

  const penColor = props.penColor ?? "black";

  return (
    <div>
      <div className="relative w-[250px] h-[200px]">
        <div className="absolute">
          <SignatureCanvas
            penColor={penColor}
            ref={ref}
            canvasProps={{
              width: 250,
              height: 200,
              className: "w-[250px] h-[200px] bg-zinc-50 dark:bg-zinc-900",
            }}
            onEnd={() => {
              props.onData(ref.current?.toDataURL() ?? "");
            }}
          />
        </div>
        <div className="flex gap-2 items-start justify-between mb-2 absolute w-[250px] h-[200px] p-2 pointer-events-none">
          <label className="text-xs">{props.label}</label>
          <button
            type="button"
            className="pointer-events-auto"
            onClick={() => {
              ref.current?.clear();
              props.onClear();
            }}
          >
            Clear signature
          </button>
        </div>
      </div>
    </div>
  );
}
