# POTA-kart – gjeldende status

Oppdatert: 2026-10-11. GitHub `main` er fasiten. Dette dokumentet er et **øyeblikksbilde**, ikke en kronologisk logg.

## Nå
- **Kart:** https://apagg.github.io/pota-kart/
- **Appversjon:** 0.11.0. PC-grensesnittet og Kyststien-rettingen er slått sammen via [PR #3](https://github.com/apagg/pota-kart/pull/3), merge-commit `ca6bc68751ec6092d07bfac4da5a815318178897`.
- **Verifisert kode:** [Verify POTA map 38151657363](https://github.com/apagg/pota-kart/actions/runs/38151657363) på `main` = `completed/success`. Geometri/JS, PC/mobil, GPS, overlapp og direkte/gjentatte Kyststien-klikk er bestått. PR-kjøring 38151632404 = `completed/success`.
- **Publisering:** [GitHub Pages 38151657256](https://github.com/apagg/pota-kart/actions/runs/38151657256) = `completed/success`.
- **Manuell kontroll:** Brukeren testet PC-trinnene og bekreftet også Kyststien-rettingen med «ser bra ut». Sammenslåing til hovedkartet ble uttrykkelig godkjent 2026-10-11.
- Tidligere kodeopprydding er ferdig via PR #2. Ingen aktiv sammenslåingsoppgave gjenstår.

## PC-grensesnitt i hovedkartet (2026-10-11)
- Fast 350 px sidepanel med skjul/vis, kompakt parkinfo og utvidbare detaljer, klikkbar valgliste, ingen PC-popup og overlappliste i panelet.
- GPS/zoom øverst til høyre. Kartinnstillinger, tegnforklaring og hjelp/teknisk informasjon kan foldes sammen. Søke- og GPS-feil forblir synlige med lukkede seksjoner.
- Skjult teknisk valg-/overlappsdiagnostikk beregnes først når hjelpseksjonen åpnes på PC. Dette fjerner gjentatte kostbare beregninger ved valg av Kyststien; beregningsfunksjonene er bevart. Nyvalg tok omtrent 1,4–2,0 sekunder i den godkjente testkjøringen 38151094191, gjentatt flervalg 0,24–0,32 sekunder.
- Mobilens opprinnelige elementplassering gjenopprettes ved 700 px. Mobilfiler, park-/stidata, geometri-, GPS- og overlappsfunksjoner er uendret.
- **Separat testkopi:** https://apagg.github.io/pota-kart/test/pc-ui/ på testgrenen `test/pc-ui`. Kan avvike fra senere endringer i hovedkartet.

## Satt på vent: stisystemet
**Ikke endre Hvaler eller øvrige stier før brukeren ber om en samlet omarbeiding.**

Historisk er `Hvaler-redigering.gpkg` og `hvaler_tillegg` undersøkt, og det finnes kode for eksport og integrasjon i `data/hvaler/`, `scripts/export-hvaler.py`, `scripts/update-geometries.py` og kartets runtime. Dette er **ikke** en bekreftelse på at alle geografiske grense-/overlappstilfeller er endelig validert. Tidligere analyser og mulige restfeil er bevart i [HISTORY.md](HISTORY.md). Ingen stiendring er gjort i denne dokumentasjonsoppryddingen.

## Start neste samtale
«Fortsett POTA-kartet fra GitHub. Les PROJECT.md, STATUS.md og TODO.md først. Bruk HISTORY.md kun ved behov. Diskuter neste endring før du redigerer kode. Stisystemet er satt på vent.»
