---
title: "Superposition and the Bloch sphere"
excerpt: "A single qubit is not just a zero or a one but a point on a sphere, and that geometric picture is the gentlest way into the strangeness of quantum information."
author: "Dr. Sofia Marchetti"
readMinutes: 6
complexity: Entry
category: Theory
accent: blueVibrant
heroImage: "https://images.pexels.com/photos/220201/pexels-photo-220201.jpeg?auto=compress&cs=tinysrgb&w=1200"
codeNumber: 9
featured: false
publishedAt: "2026-01-15"
---

A classical bit is a simple thing: it is either zero or one, a switch up or down. A qubit
refuses to be pinned down so easily. Before measurement it can exist in a superposition, a
weighted blend of zero and one at the same time. This does not mean the qubit is secretly one
value we have not looked at yet; it means the qubit genuinely occupies a combination of both
possibilities, described by two numbers called amplitudes that capture how much of each the
state contains.

The amplitudes are not ordinary fractions. They are complex numbers, carrying both a size and
a phase, and their squared magnitudes give the probabilities of measuring zero or one. Because
those probabilities must add to one, the two amplitudes are constrained, and that constraint is
what lets us draw a qubit as a point on the surface of a sphere. This picture, the Bloch sphere,
turns abstract algebra into geometry.

![A glowing sphere representing quantum state](https://images.pexels.com/photos/355948/pexels-photo-355948.jpeg?auto=compress&cs=tinysrgb&w=1200 "Every pure state is a point")

On the Bloch sphere the north pole is the state zero and the south pole is the state one. Every
other point on the surface is a valid superposition. States along the equator are perfectly
balanced fifty-fifty mixtures of zero and one, differing only in their phase, which corresponds
to the angle around the equator. This is the crucial insight that classical intuition misses:
two qubits can have identical measurement odds yet behave completely differently because their
phases differ, and phase is the resource quantum algorithms exploit.

Quantum gates, the operations that compute with qubits, are simply rotations of this sphere. A
gate that swaps zero and one flips the sphere top to bottom. A gate that creates an equal
superposition rotates a pole to the equator. Because these are rotations rather than arbitrary
transformations, they are reversible, which is one reason quantum computation differs so deeply
from the irreversible logic of classical chips.

Measurement is where the geometry collapses. When you measure a qubit in the standard basis, you
force it to choose between the poles. A point near the north pole will almost certainly yield
zero, a point near the equator gives a coin flip, and after the measurement the qubit snaps to
whichever pole it reported. The rich continuum of the sphere reduces, in that instant, to a
single classical bit, and the phase information that was not aligned with the measurement axis is
lost.

The Bloch sphere also clarifies the limits of a lone qubit. With a single qubit you have one
sphere and only so much room to maneuver, which is why the real power of quantum computing appears
only when qubits interact. Two qubits cannot be drawn as two independent spheres once they become
entangled; their joint state lives in a larger space the picture cannot fully capture. Still, for
building first intuition, no tool is more valuable. Master the sphere, and superposition stops
feeling like a paradox and starts feeling like a place you can point to.
