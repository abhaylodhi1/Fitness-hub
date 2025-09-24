// components/ProductImage.jsx
"use client";

import { useState } from "react";

export default function ProductImage({ src, alt, className, fallbackText }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold`}>
        {fallbackText || alt?.charAt(0).toUpperCase() || 'P'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}