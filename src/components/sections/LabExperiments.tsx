'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlochSphere } from '@/components/ui/BlochSphere';
import { Card } from '@/components/ui/Card';
import { Fingerprint, Zap, Layers, Activity } from 'lucide-react';

export function LabExperiments() {
  const [theta, setTheta] = useState(Math.PI / 4);
  const [phi, setPhi] = useState(Math.PI / 4);

  return (
    <section className="py-24 lg:py-32 bg-surface-2 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-20"
        >
          <p className="mono-label mb-4">The Lab</p>
          <h2 className="text-4xl lg:text-5xl font-semibold text-heading tracking-tight mb-6">
            Interactive Experiments
          </h2>
          <p className="text-muted max-w-2xl mx-auto text-lg">
            Symbolic visualizations of quantum mechanics applied to intelligent data structures.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Experiment 1: Bloch Sphere / Superposition */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="p-8 border-border-light bg-white overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-accent-light text-accent">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-heading">Qubit Superposition</h3>
                  <p className="text-xs text-muted font-mono uppercase tracking-widest mt-1">Experiment 01</p>
                </div>
              </div>

              <div className="aspect-square w-full bg-surface rounded-2xl mb-8 border border-border-light relative overflow-hidden">
                <BlochSphere theta={theta} phi={phi} />
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-heading font-medium">Polar Angle (θ)</span>
                    <span className="text-muted font-mono">{(theta / Math.PI).toFixed(2)}π</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={Math.PI} 
                    step="0.01" 
                    value={theta}
                    onChange={(e) => setTheta(parseFloat(e.target.value))}
                    className="w-full accent-accent h-1.5 bg-border-light rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-heading font-medium">Azimuthal Angle (φ)</span>
                    <span className="text-muted font-mono">{(phi / Math.PI).toFixed(2)}π</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={2 * Math.PI} 
                    step="0.01" 
                    value={phi}
                    onChange={(e) => setPhi(parseFloat(e.target.value))}
                    className="w-full accent-accent h-1.5 bg-border-light rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="mt-8 p-4 rounded-xl bg-accent-light/50 border border-accent/10">
                <p className="text-sm text-accent leading-relaxed italic">
                  "A qubit is not 0 and 1 at the same time—it's a wave function with a magnitude and a phase. Superposition is the interference of these phases."
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Right Column: Other symbolic experiments */}
          <div className="space-y-8">
            {/* Experiment 2: Entanglement */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="p-8 border-border-light bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent-light text-accent">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-heading">Quantum Entanglement</h3>
                    <p className="text-xs text-muted font-mono uppercase tracking-widest mt-1">Experiment 02</p>
                  </div>
                </div>

                <div className="h-48 w-full bg-surface rounded-2xl mb-6 flex items-center justify-center border border-border-light relative">
                  <svg className="w-full h-full p-8" viewBox="0 0 400 200">
                    <motion.circle
                      cx="80" cy="100" r="15"
                      className="fill-accent"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.circle
                      cx="320" cy="100" r="15"
                      className="fill-accent"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.path
                      d="M 95 100 L 305 100"
                      stroke="#0A68F5"
                      strokeWidth="2"
                      strokeDasharray="10 5"
                      animate={{ strokeDashoffset: [-30, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.circle
                      cx="200" cy="100" r="40"
                      className="fill-accent-light"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.5, 2], opacity: [0, 0.5, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-mono text-accent uppercase tracking-[0.3em] font-bold">Constructive Interference</span>
                  </div>
                </div>
                
                <p className="text-muted leading-relaxed">
                  Connecting nodes with shared quantum states. Measuring one instantly determines the state of the other, regardless of distance—the substrate of quantum neural networks.
                </p>
              </Card>
            </motion.div>

            {/* Experiment 3: Brain Efficiency */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="p-8 border-border-light bg-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-accent-light text-accent">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-heading">Energy Advantage Proof</h3>
                    <p className="text-xs text-muted font-mono uppercase tracking-widest mt-1">Experiment 03</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono uppercase tracking-widest">
                      <span>NVIDIA H100 GPU</span>
                      <span className="text-error">100,000x Base</span>
                    </div>
                    <div className="h-2 w-full bg-border-light rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-error"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono uppercase tracking-widest">
                      <span>Human Brain</span>
                      <span>1x</span>
                    </div>
                    <div className="h-2 w-full bg-border-light rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '0.1%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-heading"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono uppercase tracking-widest">
                      <span>Quantum Gate (AQFP)</span>
                      <span className="text-accent">0.0001x</span>
                    </div>
                    <div className="h-2 w-full bg-border-light rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '0.01%' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-accent animate-pulse"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-muted leading-relaxed mt-6">
                  Quantum hardware achieves exponential energy efficiency compared to classical silicon. For AGI to be physically sustainable, it must be quantum.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
