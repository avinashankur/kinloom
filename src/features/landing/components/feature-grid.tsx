export function FeatureGrid() {
  return (
    <section className="py-24 px-6 md:px-12 w-full bg-canvas flex items-center justify-center">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-medium tracking-[-0.02em] text-ink mb-6">
            A better way to build your tree.
          </h2>
          <p className="text-body text-body-md max-w-2xl mx-auto">
            Experience an interactive canvas that scales effortlessly with your
            family history, built entirely around privacy and simplicity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: Teal */}
          <div className="bg-brand-teal text-white rounded-3xl p-8 flex flex-col justify-between aspect-square">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Local First</h3>
              <p className="text-on-primary/90 text-body-md">
                Your data never leaves your browser. Every edit, every
                relationship, saved securely in your device's IndexedDB.
              </p>
            </div>
            <div className="mt-8 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center h-40">
              <img
                src="/mascot_teal.png"
                alt="Teal mascot illustration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Card 2: Pink */}
          <div className="bg-brand-pink text-white rounded-3xl p-8 flex flex-col justify-between aspect-square">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Infinite Canvas</h3>
              <p className="text-on-primary/90 text-body-md">
                Zoom, pan, and explore. Our specialized graph layout engine
                renders your ancestry dynamically as you add members.
              </p>
            </div>
            <div className="mt-8 rounded-xl overflow-hidden bg-black/20 flex items-center justify-center h-40">
              <img
                src="/mascot_pink.png"
                alt="Pink mascot illustration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Card 3: Lavender */}
          <div className="bg-brand-lavender text-ink rounded-3xl p-8 flex flex-col justify-between aspect-square">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Export Anywhere</h3>
              <p className="text-ink/80 text-body-md">
                Full JSON export capabilities mean you are never locked in. Back
                up your tree locally or share the file directly with relatives.
              </p>
            </div>
            <div className="mt-8 bg-white/40 rounded-xl flex items-center justify-center h-40 overflow-hidden">
              <div className="text-4xl font-mono text-ink/70">{"{ }"}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
