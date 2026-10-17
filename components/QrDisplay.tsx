"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  url: string;
  label?: string;
}

export function QrDisplay({ url, label }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Inline QR with hover-reveal expand button */}
      <div className="relative group inline-block">
        {/* marginSize: a white quiet zone, so the code still scans on a dark-mode card. */}
        <QRCodeSVG value={url} size={200} marginSize={2} />
        <button
          onClick={() => setExpanded(true)}
          className="absolute top-1 right-1 bg-white/80 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-900"
          title="Expand QR code"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
      {label && <p className="text-xs text-gray-400 mt-1">{label}</p>}

      {/* Modal expanded view */}
      {expanded && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-surface rounded-xl p-8 flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
            <QRCodeSVG value={url} size={480} marginSize={2} />
            <button
              onClick={() => setExpanded(false)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
