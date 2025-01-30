import { useEffect, useState } from "react";

type UsePopupHooks<OpenParams, CloseParams> = {
  open?: (e: OpenParams) => void;
  close?: (e: CloseParams) => void
}

const prefix: Record<"popupOpen" | "popupClose", string> = {
  popupOpen: 'popup-open::',
  popupClose: 'popup-close::'
};

export const popupOpenEventName = (intent: string) => (prefix.popupOpen + intent) as keyof WindowEventMap;

export const popupCloseEventName = (intent: string) => (prefix.popupClose + intent) as keyof WindowEventMap;

/** call for open popup */
export const openPopup = <OpenParams>(intent: string, detail?: OpenParams) => {
  const name = popupOpenEventName(intent);
  const event = new CustomEvent<OpenParams>(name, { detail });
  window.dispatchEvent(event);
};

/** call for close popup */
export const closePopup = <CloseParams>(intent: string, detail?: CloseParams) => {
  const name = popupCloseEventName(intent);
  const event = new CustomEvent<CloseParams>(name, { detail });
  window.dispatchEvent(event);
};

/** manage concrete popup state */
export const usePopup = <OpenParams, CloseParams>(intent: string, hooks: UsePopupHooks<OpenParams, CloseParams> = {}): boolean => {
  const { open, close } = hooks;
  const [visible, visibleSet] = useState(false);

  /* onOpen subscription */
  useEffect(() => {
    const openHandler = (e: CustomEvent<OpenParams>) => {
      visibleSet(true);
      open?.(e.detail);
    };

    const name = popupOpenEventName(intent);
    const handler = openHandler as EventListener;

    window.addEventListener(name, handler);
    return () => window.removeEventListener(name, handler);
  }, [open]);

  /* onClose subscription */
  useEffect(() => {
    const closeHandler = (e: CustomEvent<CloseParams>) => {
      visibleSet(false);
      close?.(e.detail);
    };

    const name = popupCloseEventName(intent);
    const handler = closeHandler as EventListener;

    window.addEventListener(name, handler);
    return () => window.removeEventListener(name, handler);
  }, [close]);

  return visible;
}
