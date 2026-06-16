---
title: "Shor's algorithm in practice"
excerpt: "Shor's algorithm can factor large numbers exponentially faster than any known classical method, but the gap between the theory and a working machine remains enormous."
author: "Dr. Priya Nair"
readMinutes: 8
complexity: Mid
category: Algorithms
accent: purple
heroImage: "https://images.pexels.com/photos/270348/pexels-photo-270348.jpeg?auto=compress&cs=tinysrgb&w=1200"
codeNumber: 27
featured: false
publishedAt: "2026-05-02"
---

Few results have shaped the public imagination of quantum computing as much as Shor's
algorithm. Published in 1994, it showed that a sufficiently large quantum computer could
factor an integer into its prime components in time that grows only polynomially with the
number of digits, where the best classical algorithms still require effort that grows
nearly exponentially. Because the security of RSA encryption rests on the difficulty of
factoring, this single result reframed quantum computing from a curiosity into a strategic
concern for cryptographers and governments alike.

The cleverness of the algorithm lies in turning factoring into a different question
entirely: finding the period of a function. Given a number to factor, one picks a random
companion value and considers the repeating pattern produced by raising it to successive
powers, modulo the target. Buried in the length of that repeating period is enough
information to extract a factor. The hard part classically is finding the period; the
quantum part makes it tractable.

![Abstract data and number patterns](https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=1200 "Periods hidden in interference")

The engine is the quantum Fourier transform. The algorithm prepares a superposition over
many possible inputs, evaluates the modular function across all of them at once, and then
applies the Fourier transform to convert the period into a sharp interference pattern.
Measuring the result yields, with high probability, a value from which the period can be
recovered by classical post-processing using continued fractions. The quantum computer does
not magically test every factor; it exploits interference so that wrong answers cancel and
the right structure stands out.

That elegance, however, collides with hardware reality. A faithful run of Shor's algorithm
on a cryptographically meaningful key requires not just thousands of high-quality qubits but
the modular exponentiation circuit, which is deep and gate-hungry. Realistic estimates for
breaking a 2048-bit RSA key call for on the order of millions of physical qubits once the
overhead of quantum error correction is included, along with billions of operations executed
without uncorrected faults. Today's processors, with at most a few hundred to a thousand
noisy qubits, are nowhere close.

Experimental demonstrations have factored only tiny numbers, and even those often relied on
simplifications that critics argued amounted to knowing the answer in advance. Such
demonstrations validate pieces of the machinery rather than the full threat. The honest
summary is that Shor's algorithm is provably powerful and practically distant, a combination
that makes it both reassuring and unsettling.

The unsettling part drives real action. Adversaries can harvest encrypted traffic today and
store it, betting on decryption once large machines arrive, a strategy known as harvest now,
decrypt later. That risk is precisely why standards bodies have begun rolling out
post-quantum cryptography built on mathematical problems Shor's algorithm does not break.
The algorithm may be years from running at scale, yet its mere existence has already changed
how we protect information.
