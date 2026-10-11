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

## Aktivt arbeid – mobil-UI
- Egen testgren `test/mobile-ui`; [mobiltestkart](https://apagg.github.io/pota-kart/test/mobile-ui/). Ingen sammenslåing av mobiltrinnet til hovedkartet er godkjent.
- Parkinfo, detaljer og valgtlisten er samlet i én opptrekksfane uten bunnmeny etter brukerens bestilling 2026-10-11. Lukket fane viser kompakt parkinfo; utvidet fane viser områdenavn/parktype/geometri, antall og klikkbar valgliste med gjeldende park markert, separat fjerning og tømming. Valg fra listen bevarer kartutsnitt og geometriinstanser.
- Innstillinger ligger til venstre under søk og karttype. Karttype åpner bare OpenStreetMap/Esri/satellitt; Innstillinger viser land, flervalg, tegnforklaring og sammenleggbar hjelp. Lukk går tilbake til kompakt parkinfo.
- GPS ligger under 44 × 44 px zoomknapper til høyre, med «GPS av», «Søker», «Følger» eller «Pauset». Eksisterende GPS-logikk og PC-oppsett er bevart.
- **Siste verifiserte mobilkode:** `64b71c38ee316ca77927577b884f2c721a745d9f`; [Verify POTA map 38157356974](https://github.com/apagg/pota-kart/actions/runs/38157356974) = `completed/success`. Geometri/JS, PC/mobil, GPS, overlapp og Kyststien består. Målrettede tester dekker samlet fane, fravær av bunnmeny, venstre innstillinger, knappestørrelser, lange parknavn uten kollisjon med lukk, fjerning/tømming, karttype og PC-gjenoppretting. Skjermbilder ved 320/390/640 px er kontrollert.
- **Testpublisering:** `6fb854c9348d901ec3fecbddaf5d689aa3aa1696`; [GitHub Pages 38157480644](https://github.com/apagg/pota-kart/actions/runs/38157480644) = `completed/success`. Apppublisering endret kun fire filer under `test/mobile-ui/`; hovedkartets app er bevart.
- **Manuell kontroll:** Brukeren har bekreftet første mobiltrinn og GPS-presentasjonen med «ser bra ut». Den nye samlede fanen og plasseringen av Innstillinger venter på brukerens kontroll. Markering av valgte parker i overlappslisten er fortsatt utsatt.

## Satt på vent: stisystemet
**Ikke endre Hvaler eller øvrige stier før brukeren ber om en samlet omarbeiding.**

Historisk er `Hvaler-redigering.gpkg` og `hvaler_tillegg` undersøkt, og det finnes kode for eksport og integrasjon i `data/hvaler/`, `scripts/export-hvaler.py`, `scripts/update-geometries.py` og kartets runtime. Dette er **ikke** en bekreftelse på at alle geografiske grense-/overlappstilfeller er endelig validert. Tidligere analyser og mulige restfeil er bevart i [HISTORY.md](HISTORY.md). Ingen stiendring er gjort i denne dokumentasjonsoppryddingen.

## Start neste samtale
«Fortsett POTA-kartet fra GitHub. Les PROJECT.md, STATUS.md og TODO.md først. Bruk HISTORY.md kun ved behov. Diskuter neste endring før du redigerer kode. Stisystemet er satt på vent.»
