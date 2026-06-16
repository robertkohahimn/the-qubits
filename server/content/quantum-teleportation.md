---
title: "Quantum teleportation, properly understood"
excerpt: "Teleportation moves a quantum state from one place to another without moving the particle, but it always rides on a classical message and never beats the speed of light."
author: "Dr. Idris Bello"
readMinutes: 7
complexity: Mid
category: Theory
accent: yellow
heroImage: "https://images.pexels.com/photos/586063/pexels-photo-586063.jpeg?auto=compress&cs=tinysrgb&w=1200"
codeNumber: 21
featured: false
publishedAt: "2026-01-28"
---

Quantum teleportation has the most science-fiction name in the field and almost none of the
science-fiction meaning. Nothing material is transported, no particle vanishes and reappears,
and nobody travels anywhere. What teleportation actually does is move the unknown quantum state of
one particle onto another distant particle, destroying the original in the process. It is a
protocol for transmitting information, and it solves a real problem: how to send a quantum state
you are not allowed to copy.

That prohibition is the no-cloning theorem, one of the foundational rules of quantum mechanics. You
cannot make an identical copy of an arbitrary unknown quantum state, which means you cannot simply
measure a qubit, write down the result, and rebuild it elsewhere, because measurement disturbs the
state and reveals only a fragment of it. Teleportation is the clever workaround that respects this
rule while still getting the state from sender to receiver.

![A beam of light split across distance](https://images.pexels.com/photos/2085998/pexels-photo-2085998.jpeg?auto=compress&cs=tinysrgb&w=1200 "Shared entanglement as the channel")

The protocol needs three ingredients. First, the sender, conventionally called Alice, holds the
qubit whose unknown state she wants to transmit. Second, Alice and the receiver, Bob, share a pair
of entangled qubits prepared in advance, one held by each. Third, they have an ordinary classical
communication channel, a phone line will do. The shared entanglement is the quiet hero of the
scheme; without it teleportation is impossible.

Alice begins by jointly measuring her unknown qubit together with her half of the entangled pair, a
specific kind of measurement that entangles them and yields one of four possible two-bit outcomes.
This measurement destroys the original state, satisfying no-cloning, and crucially tells Alice
nothing about what the state actually was. What it does is project Bob's distant qubit into a state
that is a known rotation of the original, with the particular rotation determined by which of the
four outcomes Alice obtained.

Now comes the step that keeps teleportation honest. Alice telephones Bob and sends him those two
classical bits. Until he receives them, Bob's qubit is useless; it could be any of four possibilities
and looks completely random. Once he learns Alice's outcome, he applies the corresponding correcting
rotation, and his qubit becomes an exact replica of the state Alice started with. Because that
classical message cannot travel faster than light, neither can the teleportation, which is exactly
why the protocol does not let you signal superluminally.

The result is striking when you tally the accounting. The full description of an arbitrary qubit
requires infinitely precise continuous parameters, yet teleportation conveys it perfectly using just
two classical bits, with the shared entanglement carrying the rest of the burden invisibly. This is
not a laboratory curiosity. Teleportation is a basic primitive for quantum networks and the quantum
internet, a means of shuttling states between processors and of building entanglement across long
distances through repeaters. Understood plainly, it is less magic than engineering: a disciplined way
to relocate fragile quantum information without ever copying or exceeding light speed.
