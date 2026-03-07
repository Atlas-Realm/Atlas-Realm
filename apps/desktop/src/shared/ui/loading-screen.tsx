export function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen w-full bg-base-100 text-base-content grid place-items-center">
      <span className="loading loading-spinner loading-lg text-primary" aria-hidden="true" />
      <p className="sr-only">{label}</p>
    </div>
  );
}
