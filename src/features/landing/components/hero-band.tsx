import { Button } from "@/shared/components/ui/button";

export function HeroBand() {
  return (
    <section className="bg-canvas text-ink py-24 md:py-32 px-6 md:px-12 w-full flex items-center justify-center">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        {/* Text Content (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-8">
          <h1 className="text-5xl md:text-7xl font-medium tracking-[-0.035em] leading-tight font-sans">
            Your family history,
            <br />
            safe on your device.
          </h1>
          <p className="text-body-md md:text-body-lg text-body max-w-2xl font-medium">
            A beautiful, local-first interactive family tree. No backend, no
            accounts, complete privacy. Map your ancestry and keep your data in
            your hands.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button variant="default">Open Family Tree</Button>
            <Button variant="secondary">Import JSON</Button>
          </div>
        </div>

        {/* Illustration (5 cols) */}
        <div className="md:col-span-5 bg-surface-soft rounded-3xl p-6 aspect-square flex items-center justify-center overflow-hidden">
          <img
            src="/hero_illustration.png"
            alt="3D stylized family tree illustration"
            className="w-full h-full object-cover rounded-2xl"
          />
        </div>
      </div>
    </section>
  );
}
