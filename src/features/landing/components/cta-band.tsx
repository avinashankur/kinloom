import { Button } from "@/shared/components/ui/button";

export function CtaBand() {
  return (
    <section className="py-24 px-6 md:px-12 bg-canvas flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        <div className="bg-surface-soft rounded-3xl p-12 md:p-20 text-center flex flex-col items-center gap-8">
          <h2 className="text-4xl md:text-5xl font-medium tracking-[-0.02em] text-ink max-w-2xl">
            Start mapping your ancestry today.
          </h2>
          <p className="text-body-md text-body max-w-xl">
            No signup required. Open the interactive canvas and begin adding
            your family members immediately.
          </p>
          <Button variant="default" className="mt-4 px-12">
            Open Family Tree
          </Button>
        </div>
      </div>
    </section>
  );
}
