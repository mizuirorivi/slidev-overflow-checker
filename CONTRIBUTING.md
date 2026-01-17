# Contributing

Thanks for your interest in contributing to **slidev-overflow-checker**.

---

## What this project is (and isn’t)

**This project is:**
- A lightweight CLI tool
- Focused on detecting layout overflows in Slidev slides
- Heuristic-based by design (not a perfect validator)
- Intended to work well in CI or automated workflows


---

## Ways to contribute

You don’t need to submit code to contribute.

### 1. Report issues or edge cases
If you encounter:
- False positives
- False negatives
- Slides that break in unexpected ways (code, images, fonts, etc.)

Please open an issue and include:
- A minimal reproduction (if possible)
- Slide content type (code, text, images)
- Export target (PDF, browser, etc.)

Even incomplete reports are helpful.

---

### 2. Discuss design trade-offs
Design discussions are especially welcome, for example:
- Where heuristics break down
- What “good enough” detection means in practice
- How this might fit into CI or AI-generated workflows

Feel free to open a Discussion or Issue for this.

---

### 3. Small, focused code changes
If you’d like to submit code:
- Keep changes minimal and scoped
- Avoid large refactors unless discussed first
- Prefer clarity over cleverness

If you’re unsure whether a change fits, open an issue first.

---

## Development setup

```bash
git clone https://github.com/mizuirorivi/slidev-overflow-checker
cd slidev-overflow-checker
npm install
Run locally:
```
```bash
npm run build
npm run check
(If this changes, please update this file.)
```
## Philosophy
This tool exists because:

Some failures are easy to miss by humans

AI-generated artifacts make this worse

Detecting failure early is often more valuable than fixing it perfectly

Contributions that align with this philosophy are more likely to be accepted.

Code of Conduct
Be respectful and constructive.
This project follows the spirit of common open source codes of conduct.

Thank you for taking the time to contribute.
Even reading or trying the tool is appreciated.
