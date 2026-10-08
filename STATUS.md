# POTA-kart – gjeldende status

Oppdatert: 2026-10-08. GitHub `main` er fasiten. Dette dokumentet er et **øyeblikksbilde**, ikke en kronologisk logg.

## Nå
- **Kart:** https://apagg.github.io/pota-kart/
- **Sist dokumenterte appversjon:** 0.11.0. Verifiser faktisk versjon ved ny kodeendring.
- **Kodeopprydding:** [PR #2](https://github.com/apagg/pota-kart/pull/2) er **merget til `main`**, merge-commit `cc8e76e9ce8ab582acba4c39158908023e3f3350`.
- **Verifisert kode og publisering:** [Verify POTA map 37839249143](https://github.com/apagg/pota-kart/actions/runs/37839249143) = `completed/success`, geometri/JS og PC-/mobiltester bestått. [GitHub Pages 37839248127](https://github.com/apagg/pota-kart/actions/runs/37839248127) = `completed/success`. Hvaler-eksport 37839249070 = `completed/success`.
- **Manuell kontroll:** Brukeren testet den isolerte kodeoppryddingsversjonen og meldte at alt så bra ut før sammenslåingen.
- **Testvisning:** https://apagg.github.io/pota-kart/test/code-refactor/ (separat kopi; kan avvike fra senere `main`).

## Aktiv prioritet
Ingen ny funksjonsendring er avtalt etter PR #2. Neste mulige arbeid er feilhåndtering, målrettede tester eller ytterligere opprydding uten stiendringer; velg sammen med brukeren. Se [TODO.md](TODO.md).

## Satt på vent: stisystemet
**Ikke endre Hvaler eller øvrige stier før brukeren ber om en samlet omarbeiding.**

Historisk er `Hvaler-redigering.gpkg` og `hvaler_tillegg` undersøkt, og det finnes kode for eksport og integrasjon i `data/hvaler/`, `scripts/export-hvaler.py`, `scripts/update-geometries.py` og kartets runtime. Dette er **ikke** en bekreftelse på at alle geografiske grense-/overlappstilfeller er endelig validert. Tidligere analyser og mulige restfeil er bevart i [HISTORY.md](HISTORY.md). Ingen stiendring er gjort i denne dokumentasjonsoppryddingen.

## Denne dokumentasjonsoppryddingen
- `PROJECT.md` inneholder varige krav, arkitektur og testregler.
- `TODO.md` inneholder reelle åpne/utsatte oppgaver.
- `STATUS.md` inneholder kun aktuell tilstand.
- `HISTORY.md` bevarer **originale versjoner** av alle tre filene fra før oppryddingen.
- Kun Markdown-dokumentasjon er endret. Etter brukerens uttrykkelige beslutning kreves ingen ny kodetest; dokumentene skal kontrolleres på GitHub.

## Start neste samtale
«Fortsett POTA-kartet fra GitHub. Les PROJECT.md, STATUS.md og TODO.md først. Bruk HISTORY.md kun ved behov. Diskuter neste endring før du redigerer kode. Stisystemet er satt på vent.»
