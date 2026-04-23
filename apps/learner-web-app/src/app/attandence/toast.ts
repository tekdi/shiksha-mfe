"use client";

import { toast, ToastOptions } from "react-toastify";

const baseOptions: ToastOptions = {
  position: "bottom-center",
  hideProgressBar: true,
  closeButton: true,
  autoClose: 3000,
};

export const showToastMessage = (
  message: string,
  type: "success" | "error" | "info" | "warning" = "success"
) => {
  const style = { color: "#fff" };
  switch (type) {
    case "error":
      toast.error(message, {
        ...baseOptions,
        style: { ...style, background: "#FF0000" },
      });
      break;
    case "info":
      toast.info(message, {
        ...baseOptions,
        style: { ...style, background: "#017AFF" },
      });
      break;
    case "warning":
      toast.warning(message, {
        ...baseOptions,
        style: { ...style, background: "#FFA500" },
      });
      break;
    default:
      toast.success(message, {
        ...baseOptions,
        style: { ...style, background: "#019722" },
      });
      break;
  }
};

