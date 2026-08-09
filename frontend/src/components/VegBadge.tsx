import React from "react";

export const VegBadge: React.FC<{ size?: number }> = ({ size = 16 }) => {
  return (
    <div
      className="inline-flex items-center justify-center border-2 border-[#00875A] rounded-[3px] bg-white p-[2px]"
      style={{ width: size, height: size }}
      title="Pure Veg"
    >
      <div className="w-full h-full rounded-full bg-[#00875A]" />
    </div>
  );
};

export default VegBadge;
