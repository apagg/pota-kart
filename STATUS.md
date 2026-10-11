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
- «Legg til/Fjern» og «Vis detaljer/Vis mindre» er fjernet fra mobilens parkheader etter brukerens bestilling 2026-10-11. Trykk eller dra i håndtaket åpner/lukker fanen. Fjerning/tømming er fortsatt tilgjengelig i valgtlisten; valg på kartet legger til parker. Den lukkede fanen tar mindre plass.
- Innstillinger ligger til venstre under søk og karttype. Karttype åpner bare OpenStreetMap/Esri/satellitt; Innstillinger viser land, flervalg, tegnforklaring og sammenleggbar hjelp. Lukk går tilbake til kompakt parkinfo.
- GPS ligger under 44 × 44 px zoomknapper til høyre, med «GPS av», «Søker», «Følger» eller «Pauset». Eksisterende GPS-logikk og PC-oppsett er bevart.
- Oppstartsblink fra gammel infoboks er rettet: tidlig inline-CSS skjuler panelet frem til både mobil- og PC-modulen er montert. Modulfeil og feil ved lasting av app.js frigjør skjulingen og viser oppstartsfeil.
- **Siste verifiserte mobilkode:** `7ba12990fa5018280617b27f0f9614ff20c996cb`; [Verify POTA map 38159271340](https://github.com/apagg/pota-kart/actions/runs/38159271340) = `completed/success`. Geometri/JS, PC/mobil, GPS, overlapp og Kyststien består. Målrettede tester dekker åpning via trykk/dra, fravær av de to headerknappene, samlet fane, fravær av bunnmeny, venstre innstillinger, knappestørrelser, lange parknavn uten kollisjon med lukk, fjerning/tømming, karttype og PC-gjenoppretting. Oppstartstester holder PC-/mobilmodulen igjen og bekrefter skjult gammel boks, synlig ferdig UI og synlige oppstartsfeil ved blokkert app.js/desktop-ui.js. Skjermbilder av ferdig oppstart på PC/mobil og 320/390/640 px er kontrollert.
- **Testpublisering:** `aabec5f54a8e25233b7b951ec27235f2b42bac7d`; [GitHub Pages 38159391282](https://github.com/apagg/pota-kart/actions/runs/38159391282) = `completed/success`. Denne apppubliseringen endret kun app.js og index.html under `test/mobile-ui/`; hovedkartets app er bevart.
- **Manuell kontroll:** Brukeren har bekreftet første mobiltrinn og GPS-presentasjonen med «ser bra ut», og samlet fane/venstre Innstillinger med «dette ble mye bedre». Brukeren bekreftet deretter at UI for både mobil og PC er tilfredsstillende. Oppstartsrettingen venter på brukerens kontroll. Markering av valgte parker i overlappslisten er fortsatt utsatt.

## Satt på vent: stisystemet
**Ikke endre Hvaler eller øvrige stier før brukeren ber om en samlet omarbeiding.**

Historisk er `Hvaler-redigering.gpkg` og `hvaler_tillegg` undersøkt, og det finnes kode for eksport og integrasjon i `data/hvaler/`, `scripts/export-hvaler.py`, `scripts/update-geometries.py` og kartets runtime. Dette er **ikke** en bekreftelse på at alle geografiske grense-/overlappstilfeller er endelig validert. Tidligere analyser og mulige restfeil er bevart i [HISTORY.md](HISTORY.md). Ingen stiendring er gjort i denne dokumentasjonsoppryddingen.

## Start neste samtale
«Fortsett POTA-kartet fra GitHub. Les PROJECT.md, STATUS.md og TODO.md først. Bruk HISTORY.md kun ved behov. Diskuter neste endring før du redigerer kode. Stisystemet er satt på vent.»
