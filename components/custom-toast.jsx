import { toast } from "react-hot-toast";

const getPosition = (position) => {
  const positions = [
    "top-center",
    "top-right",
    "bottom-right",
    "bottom-center",
    "top-left",
  ];
  return positions[position] || "top-center";
};

const toastOptions = (position) => ({
  position: getPosition(position),
  duration: 3000,
  style: {
    background: "#fff",
    color: "#333",
    zIndex: 999999,
  },
});

export const successToast = (message, position = 0) => {
  toast.success(message, toastOptions(position));
};

export const errorToast = (message, position = 0) => {
  toast.error(message, toastOptions(position));
};

export const loadingToast = (message, position = 0) => {
  toast.loading(message, toastOptions(position));
};

export const warningToast = (message, position = 0) => {
  toast(message, { ...toastOptions(position), icon: "⚠️" });
};

export const customToast = (message, position = 0) => {
  toast(message, toastOptions(position));
};
