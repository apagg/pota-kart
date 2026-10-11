# POTA-kart – gjeldende status

Oppdatert: 2026-10-11. GitHub `main` er fasiten. Dette dokumentet er et **øyeblikksbilde**, ikke en kronologisk logg.

## Nå
- **Kart:** https://apagg.github.io/pota-kart/
- **Appversjon:** 0.11.0.
- **Siste sammenslåing:** Aktiveringsmarkering, blå/gule/grønne punkter, 100 m GPS-radius for punktparker og punktfyll 90 % / 100 % via [PR #5](https://github.com/apagg/pota-kart/pull/5), merge-commit `ed4a14c068e24f40de096a541049a4ceea143e95`. Mobil-/PC-grensesnittet fra PR #4 er bevart.
- **Verifisert kode:** [Verify POTA map 38171388125](https://github.com/apagg/pota-kart/actions/runs/38171388125) på `main` = `completed/success`. Geometri, overlapp, GPS, PC/mobil, oppstart, Kyststien og aktiveringstester består. PR-kjøring [38171232542](https://github.com/apagg/pota-kart/actions/runs/38171232542) = `completed/success`.
- **Publisering:** [GitHub Pages 38171387679](https://github.com/apagg/pota-kart/actions/runs/38171387679) = `completed/success`. Live kontroll av hovedkartet bekreftet kallesignalinnstillinger og oppdatert punktfyll.
- **Manuell kontroll:** Brukeren har testet og godkjent aktiveringsvisning, punktfarger, 100 m GPS-radius og punktfyll 90 % / 100 %. Fullføring/sammenslåing ble bestilt med «jeg er fornøyd vi kan fullføre» 2026-10-11. Tidligere mobil-/PC-grensesnitt og parkfyll 25 % / 40 % er også godkjent.
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

## Aktiveringsmarkering i hovedkartet
- Funksjonen er slått sammen og publisert på https://apagg.github.io/pota-kart/. Testkopien på https://apagg.github.io/pota-kart/test/activated-parks/ er et separat øyeblikksbilde.
- Flere hovedkallesignaler i Innstillinger, automatiske profilaliaser, gulmarkering ved minst 10 QSO. Punkter og parkgeometri bruker samme blå/gule/grønne farger. GPS-grønn prioriteres. Valgte punkter er mørkere med uendret radius på skjermen.
- Punktparker uten geometri får grønn GPS-markering innenfor 100 m fra POTA-punktet. Parker med geometri følger fortsatt sine faktiske grenser; overlapp og 61 m stikorridor bevares.
- Offentlig profil gir rask start, men bare nylig aktivitet. Full parkhistorikk sjekkes automatisk for valgte parker og opptil 40 nærliggende parker ved innzooming. Ett oppslag om gangen, cache og automatisk oppfriskning etter 15 minutter. Feil vises uten å fjerne tidligere bekreftede aktiveringer.
- **Kode:** `ed4a14c068e24f40de096a541049a4ceea143e95`. **Verify POTA map:** `38171388125` success. Relevante PC-/mobil-/GPS-/Kyststien-/aktiveringstester passerte. Punktfyllet er 90 % for vanlige punkter og 100 % for valgte punkter; farger, radius og øvrige markørinnstillinger er bevart.
- **Tidligere godkjent testpublisering:** `b3405aa305dfac3eadc260c908efb4b47a820dfb`, Pages `38170526025` success.
- **Live kontroll:** LB6BK fant 9 aktiverte parker; NO-3198 Enhusvidda viste gul geometri og «Aktivert av LB6BK». Automatisk historikkø startet ved innzooming. Ingen innlogging eller passord brukes.
- Hele testversjonen er brukertestet og godkjent. PR #5 er slått sammen; ingen implementerings-, publiserings- eller sammenslåingsoppgave gjenstår for denne funksjonen.

## Neste arbeid
- Avtal eventuell markering av allerede valgte parker i mobilens overlappsliste. Dette er fortsatt utsatt.
- Andre mulige forbedringer og senere regresjonskontroller står i [TODO.md](TODO.md). Aktiveringsmarkering og punktutseende er ferdigstilt i hovedkartet.

## Ny undersøkelse: kyststidata fra Oslofjorden.com
- Brukeren ba om ny kildeundersøkelse 2026-10-11. Kartet bruker offentlig tilgjengelig KML med 608 rutelinjer, hvorav 125 i Østfold og 31 på Hvaler. Filen kan teknisk konverteres til GeoJSON, men er et blandet turdatasett, ikke en komplett nasjonal kyststiliste.
- Bruksvilkårene oppgir privat bruk; offentlig viderepublisering bør avklares med eieren. Rutetyper og POTA-tilknytning må kontrolleres før eventuell import.
- Anbefalt neste trinn er rettighetsavklaring og separat sammenligning av Østfold/Hvaler med dagens data. Ingen appkode, sti-/Hvaler-data eller korridorregler er endret. Se PROJECT.md for eksakte kilde-URL-er og analyse.

## Satt på vent: implementering av stisystemet
**Ikke endre Hvaler eller øvrige stier før brukeren ber om en samlet omarbeiding.**

Historisk er `Hvaler-redigering.gpkg` og `hvaler_tillegg` undersøkt, og kode for eksport og integrasjon finnes i `data/hvaler/`, `scripts/export-hvaler.py` og `scripts/update-geometries.py`. Dette bekrefter ikke at alle geografiske grense-/overlappstilfeller er endelig validert. Tidligere analyser og mulige restfeil er bevart i [HISTORY.md](HISTORY.md). Ingen sti-/geometridata ble endret i disse sammenslåingene. Automatisk Export Hvaler trails 38163371384 fullførte med success uten ny commit.

## Start neste samtale
«Fortsett POTA-kartet fra GitHub. Les PROJECT.md, STATUS.md og TODO.md først. Bruk HISTORY.md kun ved behov. Diskuter neste endring før du redigerer kode. Stisystemet er satt på vent.»
