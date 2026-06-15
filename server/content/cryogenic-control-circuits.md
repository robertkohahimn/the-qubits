---
title: "Cryogenic control circuits and the wiring bottleneck"
excerpt: "Every superconducting qubit needs control lines that pierce a dilution refrigerator. Scaling past a few hundred qubits means moving the electronics into the cold."
author: "Dr. Lena Kowalski"
readMinutes: 7
complexity: High
category: Hardware
accent: orange
heroImage: "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1200"
codeNumber: 38
featured: false
publishedAt: "2026-04-12"
---

Superconducting quantum processors live at the bottom of a dilution refrigerator, where
the mixing chamber holds temperatures near ten millikelvin. At that point the thermal
energy of the environment is small enough that aluminium and niobium become
superconducting and the Josephson junctions that define a transmon qubit behave as
clean, nonlinear oscillators. The physics is elegant, but the plumbing is brutal. Each
qubit typically demands several control lines: a microwave drive to rotate its state, a
flux bias to tune its frequency, and a readout line shared through a resonator.

For a fifty-qubit chip this is merely awkward. For the million-qubit machines that
fault-tolerant computing will eventually require, running an individual coaxial cable
from room-temperature electronics down through every cooling stage is simply
impossible. The cables carry heat, occupy space, and load the refrigerator's limited
cooling power. This is the wiring bottleneck, and it has quietly become one of the
central engineering problems of the field.

![Cryogenic dilution refrigerator wiring](https://images.pexels.com/photos/2156/sky-earth-space-working.jpg?auto=compress&cs=tinysrgb&w=1200 "Heat budget at ten millikelvin")

The most promising response is to push the control electronics into the cold. Cryogenic
CMOS, often called cryo-CMOS, runs conventional silicon transistors at four kelvin,
close enough to the qubits to multiplex many control signals onto far fewer wires
crossing each temperature stage. Companies and academic groups have demonstrated
controllers that generate the shaped microwave pulses for gates while dissipating only
milliwatts of power, a figure that must keep shrinking because the four-kelvin stage has
a cooling budget measured in watts, not kilowatts.

A complementary approach uses single-flux-quantum logic, a superconducting digital
technology that represents bits as tiny voltage pulses and dissipates almost nothing.
SFQ circuits can in principle sit at the same stage as the qubits and clock at tens of
gigahertz, but integrating them without injecting noise into neighbouring qubits remains
delicate. Crosstalk, in which a pulse meant for one qubit leaks into another, grows
harder to suppress as components are packed together.

Thermal management ties all of this together. Every photon of stray infrared radiation,
every poorly filtered control line, and every milliwatt dumped by a nearby amplifier
shortens coherence times and raises gate error rates. Engineers now design the entire
signal chain as a heat budget, attenuating and filtering at each plate of the
refrigerator so that room-temperature noise never reaches the chip. Materials matter
too: superconducting coaxial lines carry signals down without resistive heating, while
carefully chosen attenuators thermalise the noise away.

The lesson echoes the broader story of quantum hardware. The qubit itself is rarely the
limiting factor; the apparatus that talks to it usually is. Solving the wiring
bottleneck will not make headlines the way a new qubit record does, yet without
cryogenic control electronics, scalable interconnects, and disciplined heat budgets, the
large machines we imagine cannot be built. The cold, it turns out, is where the next
decade of progress will be wired.
