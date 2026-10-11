# POTA-kart – gjeldende status

Oppdatert: 2026-10-08. GitHub `main` er fasiten. Dette dokumentet er et **øyeblikksbilde**, ikke en kronologisk logg.

## Nå
- **Kart:** https://apagg.github.io/pota-kart/
- **Sist dokumenterte appversjon:** 0.11.0. Verifiser faktisk versjon ved ny kodeendring.
- **Kodeopprydding:** [PR #2](https://github.com/apagg/pota-kart/pull/2) er **merget til `main`**, merge-commit `cc8e76e9ce8ab582acba4c39158908023e3f3350`.
- **Verifisert kode og publisering:** [Verify POTA map 37839249143](https://github.com/apagg/pota-kart/actions/runs/37839249143) = `completed/success`, geometri/JS og PC-/mobiltester bestått. [GitHub Pages 37839248127](https://github.com/apagg/pota-kart/actions/runs/37839248127) = `completed/success`. Hvaler-eksport 37839249070 = `completed/success`.
- **Manuell kontroll:** Brukeren testet den isolerte kodeoppryddingsversjonen og meldte at alt så bra ut før sammenslåingen.
- **Testvisning:** https://apagg.github.io/pota-kart/test/code-refactor/ (separat kopi; kan avvike fra senere `main`).

## Aktiv prioritet – PC-UI (2026-10-11)
- Brukeren har godkjent oppsett og oppstart av trinn 1–2 på `test/pc-ui`, basert på `main` 94e6bcfa12b52c6656a8ccee46c0e36a8c16c9cd.
- Implementert for verifisering: fast 350 px sidepanel, skjul/vis med kartstørrelse uten panorering, kompakt parkinfo med utvidbare detaljer, ingen PC-popup, overlappliste i panelet og klikkbar valgliste med antall.
- PC-oppsettet ligger i et eget UI-lag. Mobilfilene og alle data-/GPS-/geometri-/overlappsberegninger er uendret.
- Nettlesertesten er tilpasset avtalt PC-presentasjon og utvidet med bredder, skjul/vis, parkdetaljer og valg fra liste uten kartbevegelse. Eksisterende mobil-/GPS-/geometritester beholdes.
- CI og publisering er ennå ikke bekreftet. Ikke regn oppgaven som ferdig før kjøringene har `completed/success`.
- Testadresse etter vellykket publisering: https://apagg.github.io/pota-kart/test/pc-ui/.
- Trinn 3 (GPS på kartet og sammenleggbare innstillinger) gjenstår til etter første brukertest. Hovedkartets UI er uendret.

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
