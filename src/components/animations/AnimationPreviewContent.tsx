'use client';

import { AnimationCard } from './AnimationCard';
import { LinesFromEdges } from './LinesFromEdges';
import { ScatteredAssembly } from './ScatteredAssembly';
import { ParticleFormation } from './ParticleFormation';
import { CircuitStreams } from './CircuitStreams';

export function AnimationPreviewContent() {
  return (
    <section className="min-h-screen bg-[#071D2F] pt-20 pb-32">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-display text-[clamp(28px,4vw,40px)] font-semibold text-white tracking-[-0.04em]">
            Animation Preview
          </h1>
          <p className="mt-3 text-sm text-white/50 max-w-md mx-auto">
            Four &ldquo;All &rarr; One&rdquo; convergence concepts for the hero section.
            Each animation reflects the brand — many elements becoming one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimationCard
            title="1. Lines from Edges"
            description="Data lines stream from viewport edges toward center, crystallizing into the logo."
          >
            {(key) => <LinesFromEdges key={key} />}
          </AnimationCard>

          <AnimationCard
            title="2. Scattered Assembly"
            description="Logo pieces start scattered, then spring into position like puzzle pieces locking together."
          >
            {(key) => <ScatteredAssembly key={key} />}
          </AnimationCard>

          <AnimationCard
            title="3. Particle Formation"
            description="Particles swirl chaotically, then snap into position along the logo paths."
          >
            {(key) => <ParticleFormation key={key} />}
          </AnimationCard>

          <AnimationCard
            title="4. Circuit Streams"
            description="Circuit-board lines trace from corners with right-angle turns, converging to light up the logo."
          >
            {(key) => <CircuitStreams key={key} />}
          </AnimationCard>
        </div>
      </div>
    </section>
  );
}
