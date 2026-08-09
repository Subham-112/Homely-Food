import React from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "red" | "maroon" | "outline" | "secondary";
  fullWidth?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth = true,
  icon: Icon,
  iconPosition = "right",
  children,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl py-3.5 px-6 text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

  const variantStyles = {
    primary: "bg-[#0B392B] hover:bg-[#07281E] text-white shadow-xs",
    red: "bg-[#C51E1E] hover:bg-[#A81717] text-white font-bold tracking-wide shadow-md",
    maroon: "bg-[#7A0C0C] hover:bg-[#610909] text-white font-bold shadow-xs",
    outline:
      "border-2 border-[#0B392B] text-[#0B392B] bg-transparent hover:bg-[#0B392B]/5 font-semibold",
    secondary: "bg-[#EBF5FC] text-[#0B392B] hover:bg-[#D6ECFA] font-semibold",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {Icon && iconPosition === "left" && <Icon className="w-5 h-5 mr-2" />}
      <span>{children}</span>
      {Icon && iconPosition === "right" && <Icon className="w-5 h-5 ml-2" />}
    </button>
  );
};

export default Button;
