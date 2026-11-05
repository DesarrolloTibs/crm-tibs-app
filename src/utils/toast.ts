import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
  customClass: {
    popup: 'rounded-xl shadow-lg border border-slate-150 font-sans',
    title: 'text-sm font-bold text-gray-800',
    htmlContainer: 'text-xs text-gray-600',
  },
});

export const showToast = {
  success: (message: string, title?: string) => {
    Toast.fire({
      icon: 'success',
      title: title || message,
      text: title ? message : undefined,
    });
  },
  error: (message: string, title?: string) => {
    Toast.fire({
      icon: 'error',
      title: title || message,
      text: title ? message : undefined,
    });
  },
  info: (message: string, title?: string) => {
    Toast.fire({
      icon: 'info',
      title: title || message,
      text: title ? message : undefined,
    });
  },
  warning: (message: string, title?: string) => {
    Toast.fire({
      icon: 'warning',
      title: title || message,
      text: title ? message : undefined,
    });
  },
};

export default showToast;
