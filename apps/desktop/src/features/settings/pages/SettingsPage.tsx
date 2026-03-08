import { useUiStore } from "../../ui/store/ui-store";
import { useI18n } from "../../../shared/i18n/i18n-provider";

export default function SettingsPage() {
  const { t } = useI18n();
  const theme = useUiStore((state) => state.theme);
  const locale = useUiStore((state) => state.locale);
  const reducedMotion = useUiStore((state) => state.reducedMotion);
  const glassEffects = useUiStore((state) => state.glassEffects);
  const defaultLibraryView = useUiStore((state) => state.defaultLibraryView);
  const setTheme = useUiStore((state) => state.setTheme);
  const setLocale = useUiStore((state) => state.setLocale);
  const setReducedMotion = useUiStore((state) => state.setReducedMotion);
  const setGlassEffects = useUiStore((state) => state.setGlassEffects);
  const setDefaultLibraryView = useUiStore((state) => state.setDefaultLibraryView);
  const resetPreferences = useUiStore((state) => state.resetPreferences);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,24rem)]">
      <section className="grid gap-6">
        <article className="atlas-glass-panel p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("settings.title")}</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{t("settings.subtitle")}</h1>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-white/70">
              <span>{t("settings.language")}</span>
              <select className="atlas-select-shell" value={locale} onChange={(event) => setLocale(event.target.value as "tr" | "en") }>
                <option value="tr">{t("settings.language.tr")}</option>
                <option value="en">{t("settings.language.en")}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm text-white/70">
              <span>{t("settings.defaultLibraryView")}</span>
              <select className="atlas-select-shell" value={defaultLibraryView} onChange={(event) => setDefaultLibraryView(event.target.value as "grid" | "list") }>
                <option value="grid">{t("library.grid")}</option>
                <option value="list">{t("library.list")}</option>
              </select>
            </label>
          </div>
        </article>

        <article className="atlas-glass-panel p-5 md:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("settings.appearance")}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["atlas-glass", t("settings.theme.glass")],
              ["atlas-ocean", t("settings.theme.ocean")],
              ["atlas-frost", t("settings.theme.frost")],
              ["atlas-carbon", t("settings.theme.carbon")],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`atlas-theme-card ${theme === value ? "is-active" : ""}`}
                onClick={() => setTheme(value as typeof theme)}
              >
                <span className="atlas-theme-preview" data-theme-preview={value} />
                <span className="mt-3 text-left text-base font-semibold text-white">{label}</span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <aside className="atlas-glass-panel p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/45">{t("settings.preferences")}</p>
        <div className="mt-4 grid gap-3">
          <label className="atlas-toggle-card">
            <div>
              <p className="font-semibold text-white">{t("settings.reduceMotion")}</p>
              <p className="mt-1 text-sm text-white/55">{t("settings.reduceMotionHint")}</p>
            </div>
            <input type="checkbox" className="toggle toggle-primary" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} />
          </label>
          <label className="atlas-toggle-card">
            <div>
              <p className="font-semibold text-white">{t("settings.glassEffects")}</p>
              <p className="mt-1 text-sm text-white/55">{t("settings.glassEffectsHint")}</p>
            </div>
            <input type="checkbox" className="toggle toggle-primary" checked={glassEffects} onChange={(event) => setGlassEffects(event.target.checked)} />
          </label>
        </div>

        <button type="button" className="btn atlas-secondary-btn mt-6 w-full" onClick={resetPreferences}>
          {t("settings.reset")}
        </button>
      </aside>
    </div>
  );
}
