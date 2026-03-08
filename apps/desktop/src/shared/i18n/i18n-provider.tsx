import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { useUiStore } from "../../features/ui/store/ui-store";
import type { UILocale } from "../types";
import { translations } from "./translations";

type I18nContextValue = {
  locale: UILocale;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return Object.entries(params).reduce(
    (result, [key, value]) => result.split(`{${key}}`).join(String(value)),
    template,
  );
}

export function I18nProvider({ children }: PropsWithChildren) {
  const locale = useUiStore((state) => state.locale);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      t: (key, params) => {
        const template = translations[locale][key] ?? translations.en[key] ?? key;
        return interpolate(template, params);
      },
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
