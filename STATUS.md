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
- **UI-grunnstrukturen er ryddet:** Den gamle flate infoboksen, DOM-ankrene, ompakking ved oppstart og gjenoppretting av gamle innstillings-/hjelpseksjoner er fjernet. PC-sidepanel, mobilfane, verktøy og innstillingsseksjoner ligger direkte i index.html. Bare unike delte felt flyttes mellom navngitte PC-/mobilplasser; den gamle flytende panel-/reserveboks-CSS-en er fjernet.
- Oppstart venter kun på at interaksjoner kobles opp. Feil i app.js/moduler vises i et separat feilfelt, uten gammel infoboks som reservevisning.
- **Siste verifiserte mobilkode:** `a02037c83795d6562d04b13d4585e44a1301c9d4`; [Verify POTA map 38162481897](https://github.com/apagg/pota-kart/actions/runs/38162481897) = `completed/success`. Geometri/JS, PC/mobil, GPS, overlapp, oppstart og direkte/gjentatte Kyststien-klikk består. Tester kontrollerer parkfyll/kant før og etter valg, uendret Kyststien-stil, samlet mobilfane, venstre innstillinger, fjerning/tømming, karttype og PC-gjenoppretting. Skjermbilder for PC og mobil er kontrollert.
- **Testpublisering:** `47cc6acead32b12762c6c3dfaef84b97cfdd1db2`; [GitHub Pages 38162624895](https://github.com/apagg/pota-kart/actions/runs/38162624895) = `completed/success`. Parkutseendet er publisert under `test/mobile-ui/`; hovedkartets app er bevart.
- **Parkutseende til vurdering:** Vanlige parkpolygoner har 25 % fyll og 2 px kant; valgte parkpolygoner har 40 % fyll og 3,5 px kant. Overlapp, stier, stikorridorer, punktmarkører og GPS-farger beholder sine innstillinger. Brukeren har godkjent å prøve endringen, men har ennå ikke vurdert resultatet.
- **Manuell kontroll:** Brukeren har bekreftet første mobiltrinn og GPS-presentasjonen med «ser bra ut», og samlet fane/venstre Innstillinger med «dette ble mye bedre». Brukeren bekreftet deretter at UI for både mobil og PC er tilfredsstillende. Brukeren bekreftet at oppstartsblinkingen var borte og bestilte oppryddingen. Brukeren har også bekreftet det nye grensesnittet etter oppryddingen med «jeg er fornøyd med det nye ui». Markering av valgte parker i overlappslisten er fortsatt utsatt.

## Satt på vent: stisystemet
**Ikke endre Hvaler eller øvrige stier før brukeren ber om en samlet omarbeiding.**

Historisk er `Hvaler-redigering.gpkg` og `hvaler_tillegg` undersøkt, og det finnes kode for eksport og integrasjon i `data/hvaler/`, `scripts/export-hvaler.py`, `scripts/update-geometries.py` og kartets runtime. Dette er **ikke** en bekreftelse på at alle geografiske grense-/overlappstilfeller er endelig validert. Tidligere analyser og mulige restfeil er bevart i [HISTORY.md](HISTORY.md). Ingen stiendring er gjort i denne dokumentasjonsoppryddingen.

## Start neste samtale
«Fortsett POTA-kartet fra GitHub. Les PROJECT.md, STATUS.md og TODO.md først. Bruk HISTORY.md kun ved behov. Diskuter neste endring før du redigerer kode. Stisystemet er satt på vent.»
