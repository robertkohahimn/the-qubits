---
title: "Post-quantum cryptography arrives"
excerpt: "With standards now finalised, the migration to encryption that resists quantum attack has begun, driven by the threat of adversaries who harvest data today to decrypt it later."
author: "Dr. Camille Roux"
readMinutes: 8
complexity: Mid
category: Cryptography
accent: orange
heroImage: "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=1200"
codeNumber: 70
featured: false
publishedAt: "2026-04-26"
---

For decades, the cryptography securing the internet rested on two hard mathematical problems:
factoring large numbers, which underpins RSA, and the discrete logarithm, which underpins much of
elliptic-curve cryptography. Shor's algorithm threatens both. A large fault-tolerant quantum
computer would unravel them efficiently, and although such a machine does not yet exist, the prospect
is concrete enough that defenders cannot afford to wait. Post-quantum cryptography is the field's
answer: encryption schemes that run on ordinary classical computers but resist attack by quantum ones.

The urgency comes from a strategy known as harvest now, decrypt later. An adversary can record
encrypted traffic today and simply store it, betting that a quantum computer years from now will
unlock it. Any information that must stay secret for a decade or more, state secrets, health records,
long-lived financial data, is already at risk even though the decrypting machine has not been built.
For such data the quantum threat is not a future problem but a present one.

![A lock formed from circuit traces](https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200 "Hard problems quantum cannot break")

Post-quantum schemes rest on mathematical problems for which no efficient quantum algorithm is known.
The most prominent family is lattice-based cryptography, whose security relates to the difficulty of
finding short vectors in high-dimensional grids of points. Other approaches draw on the hardness of
decoding random error-correcting codes, on multivariate polynomial equations, and on the security of
hash functions, the last being especially trusted because it relies on very conservative assumptions.
Diversity here is deliberate, hedging against the chance that one family is later broken.

After a multi-year public competition, the United States standards body NIST selected a first slate of
algorithms for standardisation. A lattice-based scheme now known as ML-KEM, derived from a design
called Kyber, became the recommended method for key establishment, while ML-DSA, derived from Dilithium,
and the hash-based SLH-DSA, derived from SPHINCS+, were chosen for digital signatures. The finalised
standards, published in 2024, transformed post-quantum cryptography from a research topic into a
deployment mandate.

Migration is harder than swapping one algorithm for another. Post-quantum keys and signatures are
generally larger than their classical counterparts, straining protocols and bandwidth-limited devices
that were never designed for them. Many organisations are deploying hybrid schemes that combine a
classical algorithm with a post-quantum one, so that a connection stays secure as long as either
holds, a sensible insurance policy while the new schemes accumulate real-world scrutiny. Major web
browsers and messaging platforms have already enabled hybrid key exchange by default.

The transition will take years, and history counsels patience: past cryptographic migrations stretched
over a decade as protocols, hardware, and standards slowly aligned. The encouraging news is that the
groundwork is laid. The algorithms are chosen, the standards are written, and the engineering of
crypto-agility, the ability to switch primitives without rebuilding everything, has become a design
priority. The race is not against a quantum computer that exists today but against the data being
quietly stored against the one that eventually will.
