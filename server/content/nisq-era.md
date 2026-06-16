---
title: "Living in the NISQ era"
excerpt: "Today's machines are noisy and intermediate-scale, too small for full error correction yet large enough to probe what near-term quantum advantage might look like."
author: "Dr. Hannah Voss"
readMinutes: 7
complexity: Mid
category: Algorithms
accent: pink
heroImage: "https://images.pexels.com/photos/586019/pexels-photo-586019.jpeg?auto=compress&cs=tinysrgb&w=1200"
codeNumber: 55
featured: false
publishedAt: "2026-02-18"
---

The physicist John Preskill coined the term NISQ in 2018 to name the awkward, fascinating
phase the field now occupies. NISQ stands for noisy intermediate-scale quantum: machines with
roughly fifty to a few thousand qubits, large enough to defy easy classical simulation yet far
too small to run the heavy machinery of fault-tolerant error correction. Living in this era
means accepting that every gate carries a meaningful chance of error and that computations
must finish before noise washes the answer away.

The defining constraint is depth. Because errors accumulate with each operation, useful NISQ
circuits must be shallow, completing their work in tens or hundreds of layers rather than the
billions a full Shor run would demand. This rules out the famous textbook algorithms and forces
a different design philosophy: keep the quantum part short, and lean on a classical computer to
do as much of the heavy lifting as possible.

![Researcher tuning a quantum experiment](https://images.pexels.com/photos/3825527/pexels-photo-3825527.jpeg?auto=compress&cs=tinysrgb&w=1200 "Short circuits, classical helpers")

The signature strategy is the variational algorithm, a quantum-classical hybrid. A short,
parameterised quantum circuit prepares a trial state and measures some quantity of interest;
a classical optimiser then adjusts the parameters and the loop repeats, gradually steering the
circuit toward a good solution. The variational quantum eigensolver applies this idea to
estimating the ground-state energy of molecules, a natural fit because chemistry is itself
quantum. The quantum approximate optimisation algorithm aims it at combinatorial problems.

These methods are pragmatic but not magic. The classical optimisation can stall in flat regions
of the parameter landscape, the so-called barren plateaus, where gradients vanish and learning
grinds to a halt as systems grow. Noise both helps mask and worsens these effects, and it is
still debated which variational problems, if any, will yield a clear advantage over the best
classical algorithms on hardware we can actually build soon.

That debate sharpened after early claims of quantum supremacy, later reframed more cautiously as
quantum advantage, in which a processor performed a contrived sampling task far faster than a
supercomputer was thought able to. Each such claim provoked improved classical simulations that
narrowed or sometimes erased the gap, a healthy back-and-forth that keeps expectations honest.
The tasks chosen were deliberately artificial, designed to be hard for classical machines rather
than useful in themselves.

Error mitigation is the connective tissue of the era. Unlike error correction, which actively
fixes faults using many physical qubits, mitigation tries to estimate and subtract the effect of
noise after the fact, through techniques like running circuits at amplified noise levels and
extrapolating back to zero. These tricks extend the reach of small machines without paying the
enormous qubit overhead of full correction, buying time until larger, cleaner hardware arrives.

Whether NISQ devices deliver genuine commercial value or mainly serve as a proving ground remains
genuinely uncertain. What is clear is that the era is teaching the community how to characterise
noise, benchmark hardware honestly, and co-design algorithms with the limits of real machines in
mind, lessons that will matter long after the noisy intermediate-scale chapter closes.
