"""Constants derived from x^2 - x - 1 = 0 and Planck 2018."""

import math

# ── From the polynomial ──────────────────────────────────────────────────────
SQRT5 = math.sqrt(5)
PHI = (1 + SQRT5) / 2          # 1.6180339887...
PSI = (1 - SQRT5) / 2          # -0.6180339887...
INV_PHI = 1 / PHI              # 0.6180339887...
PHI_SQ = PHI ** 2              # 2.6180339887...
LN_PHI = math.log(PHI)         # 0.4812118250...
LN_PHI_SQ = math.log(PHI_SQ)   # 0.9624236501...

# ── Planck 2018 best-fit ─────────────────────────────────────────────────────
N_S = 0.9649
A_S = 2.1e-9
K_PIVOT = 0.05                  # Mpc^{-1}
DN_S_DLN_K = -0.0045            # running (68% CL)

# ── Derived ──────────────────────────────────────────────────────────────────
RATE = (1 - N_S) / LN_PHI_SQ   # levels per e-fold = 0.03647
N_EFOLDS_SQRT5 = SQRT5 / RATE  # = 61.3 (the prediction)

# ── Cosmological (for a0(z)) ─────────────────────────────────────────────────
C_LIGHT = 2.998e8               # m/s
H0_SI = 67.4e3 / 3.086e22      # 67.4 km/s/Mpc in s^{-1}
OMEGA_LAMBDA = 0.685
A0_LOCAL = C_LIGHT * H0_SI / (2 * math.pi)  # ~1.1e-10 m/s^2
