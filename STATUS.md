# POTA-kart – gjeldende status

Oppdatert: 2026-10-11. GitHub `main` er fasiten. Dette dokumentet er et **øyeblikksbilde**, ikke en kronologisk logg.

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
- Trinn 1–2 er verifisert i commit `125cbcb0d7cc6bba4cb0dda8e2444f5186a1f32a`. [Verify POTA map 38128439816](https://github.com/apagg/pota-kart/actions/runs/38128439816) = `completed/success`: geometri/JS, PC-/mobil-, GPS-, overlapps- og stiregresjonstester bestått. PC- og mobilskjermbilder finnes i kjøringens `geometry-browser-checks`-artefakt.
- Leaflets inline `position:relative` overstyres kun i PC-layout; kartstørrelsen oppdateres korrekt. Skjul/vis bevarer sentrum og zoom.
- Offentlig testpublisering er uttrykkelig godkjent av brukeren 2026-10-11. [Verify POTA map 38147397128](https://github.com/apagg/pota-kart/actions/runs/38147397128) = `completed/success`, inkludert PC/mobil og publisering av testkopi.
- Testkopien er lagret på `main` i commit `a0c64f22a6d263781344239f85f26ca7e803886f`. Bare `test/pc-ui/` ble publisert; hovedkartets kildekode er ikke slått sammen med UI-grenen.
- Testkart: https://apagg.github.io/pota-kart/test/pc-ui/. [GitHub Pages 38147518979](https://github.com/apagg/pota-kart/actions/runs/38147518979) = `completed/success`.
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
