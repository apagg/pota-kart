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
- Trinn 1–2 er manuelt testet og godkjent av brukeren. Trinn 3 ble deretter godkjent for implementering og separat testpublisering.
- Trinn 1–3 er ferdige på `test/pc-ui`: fast 350 px sidepanel med skjul/vis, kompakt parkinfo og utvidbare detaljer, klikkbar valgliste, ingen PC-popup, overlappliste i panelet, GPS/zoom øverst til høyre og sammenleggbare kartinnstillinger, tegnforklaring og hjelp/teknisk informasjon.
- Søke- og GPS-feil forblir synlige selv med lukkede seksjoner. Mobilens opprinnelige elementplassering gjenopprettes ved 700 px.
- Verifisert kode: `c89c9de10e203b1349389ea133d7e45bc9aeed1d`. [Verify POTA map 38148644470](https://github.com/apagg/pota-kart/actions/runs/38148644470) = `completed/success`: geometri/JS, PC/mobil, GPS-følging og sti-/overlappsregresjoner bestått. Skjermbilder kontrollert i `geometry-browser-checks`-artefakten.
- Testkopi publisert til `test/pc-ui/` på `main` i commit `e968323226bf40bc93e7550d87ea97521adc2aac`. [GitHub Pages 38148749733](https://github.com/apagg/pota-kart/actions/runs/38148749733) = `completed/success`.
- **Testkart:** https://apagg.github.io/pota-kart/test/pc-ui/. Testversjonen er offentlig etter uttrykkelig brukerautorisasjon.
- Hovedkartets kildekode er ikke slått sammen med UI-grenen. Mobilfiler, parkdata, geometrier, GPS-beregninger, overlapp og hele stisystemet er uendret.
- Brukeren rapporterte 2026-10-11 at direkte klikk på Kyststien får kartet til å henge. Feilsøking pågår på testgrenen med egen test for direkte/gjentatte klikk, oversikts-/detaljzoom og enkelt-/flervalg. Ingen endring i stidata eller beregninger er gjort.
- Ingen sammenslåing til hovedkartet er godkjent.

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
