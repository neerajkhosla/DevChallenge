const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

const toasts = new Set<Toast>();

const addToast = (toast: Toast) => {
  toasts.add(toast);
  setTimeout(() => {
    toasts.delete(toast);
  }, TOAST_REMOVE_DELAY);
};

export function toast({
  title,
  description,
  variant,
}: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}) {
  const id = genId();

  const newToast: Toast = {
    id,
    title,
    description,
    variant,
  };

  addToast(newToast);

  return newToast;
}
