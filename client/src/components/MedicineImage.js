import React from "react";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect fill="%231e293b" width="120" height="120" rx="8"/><text x="60" y="58" text-anchor="middle" fill="%2394a3b8" font-family="system-ui" font-size="11">No image</text><rect x="40" y="68" width="40" height="24" rx="4" fill="%23334155"/></svg>'
  );

export default function MedicineImage({ src, alt, className = "" }) {
  const [failed, setFailed] = React.useState(false);
  const url = src && !failed ? src : PLACEHOLDER;

  return (
    <img
      src={url}
      alt={alt || "Medicine"}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
