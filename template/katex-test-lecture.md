---
title: KaTeX Mathematics Test
canvasWidth: 1280
routerMode: history
---

# KaTeX Mathematics Test

## Fast Math Typesetting for Presentations

### Basic Arithmetic

The quadratic formula: $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$

The golden ratio: $\phi = \frac{1 + \sqrt{5}}{2}$

Euler's identity: $e^{i\pi} + 1 = 0$

---

## Calculus and Analysis

### Derivatives

$$\frac{d}{dx}\left(\frac{x^2 + 1}{x - 1}\right) = \frac{2x(x - 1) - (x^2 + 1)}{(x - 1)^2}$$

### Integrals

$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

$$\int_0^1 x^n dx = \frac{1}{n+1}$$

$$\iint_R f(x,y) \, dx\,dy$$

### Limits

$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$

$$\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e$$

---

## Linear Algebra

### Matrices

$$
\begin{bmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{bmatrix}
$$

### Matrix Operations

$$\mathbf{A} \cdot \mathbf{B} = \mathbf{C}$$

$$\mathbf{A}^{-1} \mathbf{A} = \mathbf{I}$$

$$\det(\mathbf{A}) = \lambda_1 \lambda_2 \cdots \lambda_n$$

### Vector Operations

$$\mathbf{v} \cdot \mathbf{w} = \|\mathbf{v}\| \|\mathbf{w}\| \cos \theta$$

$$\|\mathbf{v}\| = \sqrt{v_1^2 + v_2^2 + v_3^2}$$

---

## Statistics and Probability

### Probability Distributions

**Normal Distribution:**
$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

**Binomial Distribution:**
$$P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}$$

### Expected Value and Variance

$$\mathbb{E}[X] = \sum_{i} x_i P(X = x_i)$$

$$\operatorname{Var}(X) = \mathbb{E}[X^2] - \mathbb{E}[X]^2$$

### Custom Macros

Our custom macros are working:
- $\RR$ (Real numbers)
- $\NN$ (Natural numbers) 
- $\ZZ$ (Integers)
- $\QQ$ (Rational numbers)
- $\argmin$ and $\argmax$

---

## Physics Formulas

### Mechanics

**Newton's Second Law:** $F = ma$

**Kinetic Energy:** $E_k = \frac{1}{2}mv^2$

**Gravitational Force:** $F = G\frac{m_1 m_2}{r^2}$

### Electromagnetism

**Coulomb's Law:** $F = k\frac{q_1 q_2}{r^2}$

**Ohm's Law:** $V = IR$

**Electric Field:** $\mathbf{E} = \frac{\mathbf{F}}{q}$

### Relativity

**Mass-Energy Equivalence:** $E = mc^2$

**Time Dilation:** $\Delta t' = \frac{\Delta t}{\sqrt{1 - \frac{v^2}{c^2}}}$

---

## Advanced Mathematics

### Complex Analysis

$$i^2 = -1$$

$$z = a + bi$$

$$|z| = \sqrt{a^2 + b^2}$$

### Number Theory

**Prime Number Theorem:**
$$\pi(x) \sim \frac{x}{\ln x}$$

**Riemann Zeta Function:**
$$\zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s}$$

### Topology

**Euler Characteristic:**
$$\chi = V - E + F$$

**Fundamental Group:**
$$\pi_1(X, x_0)$$

---

## Chemical Equations

### Chemical Reactions

**Water Formation:**
$$\mathrm{2H_2 + O_2 \rightarrow 2H_2O}$$

**Photosynthesis:**
$$\mathrm{6CO_2 + 6H_2O \xrightarrow{light} C_6H_{12}O_6 + 6O_2}$$

**Acid-Base Neutralization:**
$$\mathrm{HCl + NaOH \rightarrow NaCl + H_2O}$$

### Thermodynamics

**Gibbs Free Energy:**
$$\Delta G = \Delta H - T\Delta S$$

**Arrhenius Equation:**
$$k = A e^{-E_a/RT}$$

---

## Aligned Equations

### System of Equations

$$
\begin{aligned}
2x + 3y &= 7 \\
x - y &= 1
\end{aligned}
$$

### Proof Example

$$
\begin{aligned}
(a + b)^2 &= a^2 + 2ab + b^2 \\
&= a^2 + b^2 + 2ab \\
&= (a + b)^2
\end{aligned}
$$

---

## Numbered Equations

### Equation 1

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} \tag{1}
$$

### Equation 2

$$
E = mc^2 \tag{2}
$$

### Cross-Reference

As we saw in equation (1), the Gaussian integral evaluates to $\sqrt{\pi}$.

---

## LaTeX Commands Reference

### Greek Letters

$\alpha, \beta, \gamma, \delta, \epsilon, \zeta, \eta, \theta, \iota, \kappa, \lambda, \mu, \nu, \xi, \pi, \rho, \sigma, \tau, \upsilon, \phi, \chi, \psi, \omega$

$\Alpha, \Beta, \Gamma, \Delta, \Epsilon, \Zeta, \Eta, \Theta, \Iota, \Kappa, \Lambda, \Mu, \Nu, \Xi, \Pi, \Rho, \Sigma, \Tau, \Upsilon, \Phi, \Chi, \Psi, \Omega$

### Mathematical Operators

$\sin, \cos, \tan, \log, \ln, \exp, \max, \min, \sup, \inf$

### Relations

$=, \neq, <, >, \leq, \geq, \approx, \sim, \equiv, \cong$

### Sets and Logic

$\in, \notin, \subset, \supset, \cup, \cap, \emptyset, \forall, \exists, \land, \lor, \lnot$

---

## Performance Comparison

KaTeX vs MathJax:

| Feature | KaTeX | MathJax |
|---------|-------|---------|
| Rendering Speed | ⚡ Very Fast | 🐌 Slower |
| Bundle Size | 📦 Smaller | 📦 Larger |
| LaTeX Support | ✅ Most common | ✅ Full support |
| MathML Support | ✅ Yes | ✅ Yes |
| Accessibility | ✅ Good | ✅ Excellent |

**KaTeX is ideal for presentations where fast rendering and small bundle size are important!**

---

## Custom Configuration

### Advanced KaTeX Setup

```typescript
// slidev.config.ts
import { defineConfig } from '@slidev/types'

export default defineConfig({
  katex: {
    macros: {
      "\\RR": "\\mathbb{R}",
      "\\NN": "\\mathbb{N}",
      "\\ZZ": "\\mathbb{Z}",
      "\\QQ": "\\mathbb{Q}",
      "\\EE": "\\mathbb{E}",
      "\\Var": "\\operatorname{Var}",
      "\\Cov": "\\operatorname{Cov}",
      "\\argmin": "\\mathop{\\arg\\min}",
      "\\argmax": "\\mathop{\\arg\\max}",
      "\\diff": "\\frac{d}{dx}",
      "\\pdiff": "\\frac{\\partial}{\\partial x}",
      "\\vec": "\\mathbf{#1}",
      "\\hat": "\\mathbf{\\hat{#1}}"
    },
    throwOnError: false,
    strict: "warn",
    trust: false,
    errorColor: "#cc0000",
    macros: {
      // ... more custom macros
    }
  }
})
```

### Usage with Custom Macros

```markdown
# Using Custom Macros

The derivative: $\diff f(x) = f'(x)$

Partial derivative: $\pdiff g(x,y)$

Vector: $\vec{v} = (v_1, v_2, v_3)$

Unit vector: $\hat{u}$

Expected value: $\EE[X]$

Variance: $\Var(X)$

Covariance: $\Cov(X,Y)$
```

---

## Troubleshooting

### Common Issues

#### Equations Not Rendering
1. Check that KaTeX is enabled in slidev.config.ts
2. Ensure proper math delimiters: `$...$` for inline, `$$...$$` for display
3. Verify LaTeX syntax is correct

#### Macros Not Working
1. Define macros in katex.config.ts or slidev.config.ts
2. Use double backslashes in configuration: `"\\\\RR": "\\\\mathbb{R}"`
3. Check macro names don't conflict with existing LaTeX commands

#### Performance Issues
1. Use inline math `$...$` instead of display math `$$...$$` when possible
2. Limit the number of complex equations per slide
3. Consider using simpler notation for better performance

### Browser Compatibility

- ✅ **Chrome** 80+
- ✅ **Firefox** 75+
- ✅ **Safari** 13+
- ✅ **Edge** 80+

---

## Best Practices

### Presentation Tips

1. **Use appropriate sizing:**
   - Inline math: `$x^2 + y^2 = z^2$`
   - Display math: `$$E = mc^2$$`

2. **Equation numbering:**
   - Use `\tag{label}` for manual numbering
   - Reference equations with `\ref{eq:label}`

3. **Consistent notation:**
   - Define variables once and reuse
   - Use consistent symbols throughout

4. **Readable fonts:**
   - Ensure sufficient contrast
   - Use appropriate font sizes for projection

### LaTeX Tips

1. **Spacing:**
   - Use `\,`, `\:`, `\;` for thin, medium, thick spaces
   - Use `\quad` and `\qquad` for larger spaces

2. **Alignment:**
   - Use `\begin{aligned}...\end{aligned}` for multi-line equations
   - Use `&` for alignment points

3. **Brackets and Delimiters:**
   - Use `\left(...\right)` for automatically sized delimiters
   - Use `\bigl(...\bigr)` for manually sized delimiters

---

*KaTeX brings professional mathematical typesetting to your presentations with lightning-fast performance!*