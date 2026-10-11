# POTA-kart – gjeldende status

Oppdatert: 2026-10-11. GitHub `main` er fasiten. Dette dokumentet er et **øyeblikksbilde**, ikke en kronologisk logg.

## Nå
- **Kart:** https://apagg.github.io/pota-kart/
- **Appversjon:** 0.11.0.
- **Siste sammenslåing:** Mobil-/PC-grensesnitt, direkte UI-struktur og tydeligere parkflater via [PR #4](https://github.com/apagg/pota-kart/pull/4), merge-commit `f8f50f3d71e53537d47a361575fb90a4082dad6c`.
- **Verifisert kode:** [Verify POTA map 38163371527](https://github.com/apagg/pota-kart/actions/runs/38163371527) på `main` = `completed/success`. Geometri/JS, PC/mobil, oppstart, parkutseende, GPS, overlapp og direkte/gjentatte Kyststien-klikk består. PR-kjøring [38163190191](https://github.com/apagg/pota-kart/actions/runs/38163190191) = `completed/success`.
- **Publisering:** [GitHub Pages 38163371404](https://github.com/apagg/pota-kart/actions/runs/38163371404) = `completed/success`.
- **Manuell kontroll:** Brukeren har testet og bekreftet mobil-/PC-grensesnittet, GPS-presentasjonen, samlet opptrekksfane, venstre Innstillinger, oppstart uten gammel infoboks og parkfyll 25 % / 40 %. Sammenslåing til `main` ble uttrykkelig godkjent med «du kan slå sammen» 2026-10-11.
- Ingen aktiv sammenslåingsoppgave gjenstår. PC-grensesnittet og Kyststien-rettingen fra PR #3 er bevart.

## Grensesnitt og parkutseende i hovedkartet
- **PC:** Fast 350 px sidepanel med skjul/vis, kompakt parkinfo og utvidbare detaljer, klikkbar valgliste, ingen PC-popup og overlappliste i panelet. GPS/zoom øverst til høyre. Kartinnstillinger, tegnforklaring og hjelp/teknisk informasjon kan foldes sammen. Søke- og GPS-feil forblir synlige med lukkede seksjoner.
- Teknisk valg-/overlappsdiagnostikk beregnes først når hjelpseksjonen åpnes på PC. Dette bevarer rettingen av tregt valg av Kyststien.
- **Mobil:** Parkinfo, detaljer og valgtlisten er samlet i én opptrekksfane uten bunnmeny. Trykk eller dra i håndtaket åpner/lukker fanen. Parkheaderens «Legg til/Fjern» og «Vis detaljer/Vis mindre» er fjernet. Fjerning/tømming er tilgjengelig i valgtlisten; kartvalg legger til parker. Valg fra listen bevarer kartutsnitt og geometriinstanser.
- Innstillinger ligger til venstre under søk og karttype. Karttype åpner bare OpenStreetMap/Esri/satellitt; Innstillinger viser land, flervalg, tegnforklaring og sammenleggbar hjelp. Lukk går tilbake til kompakt parkinfo.
- GPS ligger under 44 × 44 px zoomknapper til høyre, med «GPS av», «Søker», «Følger» eller «Pauset». Eksisterende GPS-beregninger og følging er bevart.
- **Oppstart:** PC-sidepanel, mobilfane, verktøy og innstillingsseksjoner ligger direkte i `index.html`. Gammel flat infoboks, DOM-ankre, ompakking ved oppstart og gammel flytende panel-/reserveboks-CSS er fjernet. Bare unike delte felt flyttes mellom navngitte PC-/mobilplasser. Feil i app.js/moduler vises i et separat feilfelt.
- **Parkflater:** Vanlige parkpolygoner har 25 % fyll / 2 px kant; valgte parkpolygoner har 40 % fyll / 3,5 px kant. Kantens synlighet er fortsatt 90 % i atlaslaget. Overlapp beholder 48 % lilla / 25 % grønt fyll og 1 px kant. Stier, stikorridorer, punktmarkører og GPS-farger beholder egne innstillinger.
- Målrettede tester dekker 320/390/640 px, samlet fane, venstre innstillinger, knappestørrelser, lange parknavn, fjerning/tømming, karttype, parkstil før/etter valg, uendret Kyststien-stil, forsinket oppstart/synlige oppstartsfeil og gjentatte PC-/mobilbytter.
- **Separate testkopier:** https://apagg.github.io/pota-kart/test/mobile-ui/ og https://apagg.github.io/pota-kart/test/pc-ui/. De er øyeblikksbilder og kan avvike fra senere endringer i hovedkartet.

## Undersøkelse: automatisk aktiveringsmarkering
- Brukeren ønsker flere kallesignaler i Innstillinger og gule aktiverte parker. Manuell CSV-import er avvist. LB6BK-profilen inkluderer SM/LB6BK som alternativt kallesignal.
- Offentlig profil er bekreftet begrenset til nylig aktivitet (25 rader på en profil med 492 aktiveringer). Full brukerparkoversikt avviste uautorisert forespørsel med 403. Ingen dokumentert tredjepartsinnlogging er funnet.
- En offentlig vei finnes per park: parkhistorikk med `count=all` og CORS for nettlesere. Bekreftet LB6BK-aktiveringer i NO-3198 og SE-0016. Profil + automatisk historikksjekk av synlige parker med cache er foreslått til vurdering; dette gir gradvis kontroll, ikke en komplett global liste i ett kall.
- Ingen appkode, parkfarger eller data er endret i undersøkelsen. Se PROJECT/TODO for funn og uavklarte valg.
- Brukeren har også bekreftet hovedkartet etter PR #4 med «ser bra ut» 2026-10-11.

## Neste arbeid
- Avtal eventuell markering av allerede valgte parker i mobilens overlappsliste. Dette er fortsatt utsatt.
- Andre mulige forbedringer og senere regresjonskontroller står i [TODO.md](TODO.md). Brukeren ønsker nå å undersøke automatisk gulmarkering av aktiverte parker; implementering er ikke avtalt.

## Satt på vent: stisystemet
**Ikke endre Hvaler eller øvrige stier før brukeren ber om en samlet omarbeiding.**

Historisk er `Hvaler-redigering.gpkg` og `hvaler_tillegg` undersøkt, og kode for eksport og integrasjon finnes i `data/hvaler/`, `scripts/export-hvaler.py` og `scripts/update-geometries.py`. Dette bekrefter ikke at alle geografiske grense-/overlappstilfeller er endelig validert. Tidligere analyser og mulige restfeil er bevart i [HISTORY.md](HISTORY.md). Ingen sti-/geometridata ble endret i denne UI-sammenslåingen. Automatisk Export Hvaler trails 38163371384 fullførte med success uten ny commit.

## Start neste samtale
«Fortsett POTA-kartet fra GitHub. Les PROJECT.md, STATUS.md og TODO.md først. Bruk HISTORY.md kun ved behov. Diskuter neste endring før du redigerer kode. Stisystemet er satt på vent.»
