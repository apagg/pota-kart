# POTA-kart – gjeldende status

Oppdatert: 2026-10-13. GitHub er fasiten: main er stabil hovedversjon, develop er aktiv arbeidsgren. Dette dokumentet er et **øyeblikksbilde**, ikke en kronologisk logg.

## Nå
- **Pågående develop-endring:** Valg Geometri/Bare punkter i Kartinnstillinger, felles på PC/mobil og lagret lokalt. Punktmodus skjuler atlas/valgt geometri/overlapp; GPS beholder geometri og farger. Lokal visnings-/GPS-/punktklikk-/mobiltest består. Første CI 38381571968 stoppet fordi den eldre atlas-testen forsøkte å trykke Karttype bak utvidet innstillingsfane; testen lukker nå fanen først. Tegnforklaringen tilpasses punktmodus. Ny full CI og publisering pågår.
- **Develop-import:** Brukeren bestilte 2026-10-13 gang- og sykkelrutene. NO-2590 Vestfold: 197 segmenter (10 sykkel); NO-2641 Telemark: 26 (3 sykkel). Ferger/stengte ruter utelatt; Østfolds 122 ruter er uendret. Kildeomfanget inkluderer turforslag og historiske kommunegrupper, se data/coastal/README.md.
- **Verifisert develop-kode:** `3dc3c895fe482d3ffbd60c79731d908acfbf54db`; Verify POTA map `38374153434` = completed/success. Tester dekker eksakte ruter ved alle zoomnivåer, sykkel-GPS, 61 m/20–44 m grense, fjerning av gamle punktmarkører, gul/grønn prioritet, gjentatte PC-/mobilvalg samt eksisterende geometri-, overlapps-, UI-, GPS-/kompass- og aktiveringstester. Den responsive testen venter på faktisk feltplassering ved størrelsesbytte. Første to CI-kjøringer stoppet på testkode og er erstattet av den grønne kjøringen.
- **Develop-publisering:** Isolert previewcommit `ff9f8bfe2e022d0859136f44faa3a3f60315051f` endrer bare test/develop. Pages `38374461934` = completed/success. Live test/develop viser riktig commit i asset-URL, og begge rutefiler samt app-core.js/geometry-atlas.js er byte-identiske med verifisert kode. Live main viser fortsatt 0.12.0. Ny versjon og sammenslåing av app/data til main er ikke bestilt; main-root forblir 0.12.0.
- **Arbeidsflyt:** 0.12.0 er stabil på main. Develop og separat testkart er opprettet etter brukerens bestilling 2026-10-13. Nye app-/dataendringer gjøres i develop til brukeren godkjenner en ny versjon. Archive/v0.12.0 bevarer utgangspunktet. Main-infrastrukturkontroll 38369531888 og develop-kontroll 38369752436 = completed/success. Previewpublisering 1641d1c080fc8752462c4f5f8bea9a4192562ef8 og Pages 38369999678 = completed/success. Live hovedkart forblir 0.12.0, og test/develop viser Utvikling med commit-ID i lokale asset-URL-er.
- **Siste endring:** Versjon 0.12.0, kode `d8ef89bd7a546eeef029d17e553e1600b7950a58`, bestilt 2026-10-13. Nummeret er oppdatert i sidetittel, PC-/mobilheader, bootstrap og dokumentasjon. README har et kort versjonsnotat for UI, aktiveringsfarger, kyststidata og GPS/kompass. Ingen kart-/GPS-/geometriregler er endret ved versjonsløftet.
- **Siste sammenslåing:** [PR #6](https://github.com/apagg/pota-kart/pull/6), merge `7ef44ec4a540c976e66bb9b86e03c3f6c7fc9bd2`: NO-2542 bruker Oslofjorden.coms 109 gangruter + 13 sykkelruter, inkludert alle 31 Hvaler-rutene. Tidligere GIS-/Hvaler-kombinasjon erstattes. Mobil/PC, GPS, overlapp og aktiveringsfarger fra PR #4/#5 er bevart.
- **Verifisert kode:** [Verify POTA map 38361099823](https://github.com/apagg/pota-kart/actions/runs/38361099823) = completed/success. Versjonskontroll og eksisterende geometri-, Kyststi-, overlapps-, PC-/mobil-, GPS-/kompass- og aktiveringstester består. Mobiltesten forventer og viser 0.12.0.
- **Publisering:** [Pages 38361099225](https://github.com/apagg/pota-kart/actions/runs/38361099225) = completed/success. Live sidetittel og begge synlige versjonsfelt viser 0.12.0; bootstrap bruker 012-release. Kort versjonsnotat er lagret i README. Tidligere testkopier beholder sin historiske versjon.
- **Manuell kontroll:** Brukeren testet og godkjente gang-/sykkelrutene, leste bruksvilkårene og godkjente ikke-kommersiell bruk, deretter sammenslåing 2026-10-11 med «du kan slå den sammen». Dette dokumenterer brukerens vurdering, ikke en lisens fra kildeeieren. Tidligere UI, GPS, aktiveringsfarger og park-/punktfyll er fortsatt godkjent.
- Versjon 0.12.0, GPS-kompass og kyststikilden er ferdigstilt og publisert. Ingen implementerings- eller publiseringsoppgave gjenstår.

## Grensesnitt og parkutseende i hovedkartet
- **PC:** Fast 350 px sidepanel med skjul/vis, kompakt parkinfo og utvidbare detaljer, klikkbar valgliste, ingen PC-popup og overlappliste i panelet. GPS/zoom øverst til høyre. Kartinnstillinger, tegnforklaring og hjelp/teknisk informasjon kan foldes sammen. Søke- og GPS-feil forblir synlige med lukkede seksjoner.
- Teknisk valg-/overlappsdiagnostikk beregnes først når hjelpseksjonen åpnes på PC. Dette bevarer rettingen av tregt valg av Kyststien.
- **Mobil:** Parkinfo, detaljer og valgtlisten er samlet i én opptrekksfane uten bunnmeny. Trykk eller dra i håndtaket åpner/lukker fanen. Parkheaderens «Legg til/Fjern» og «Vis detaljer/Vis mindre» er fjernet. Fjerning/tømming er tilgjengelig i valgtlisten; kartvalg legger til parker. Valg fra listen bevarer kartutsnitt og geometriinstanser.
- Innstillinger ligger til venstre under søk og karttype. Karttype åpner bare OpenStreetMap/Esri/satellitt; Innstillinger viser land, flervalg, tegnforklaring og sammenleggbar hjelp. Lukk går tilbake til kompakt parkinfo.
- GPS ligger under 44 × 44 px zoomknapper til høyre, med «GPS av», «Søker», «Følger» eller «Pauset». GPS-prikken bruker kompassretning ved tilgjengelig sensor, ellers kjent GPS-bevegelsesretning. Eksisterende GPS-beregninger og følging er bevart.
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

## Importert i develop: Vestfold og Telemark
- Samme KML/snapshotløsning er teknisk mulig. Kandidater med samme kategoriutvalg: NO-2590 Vestfold 197 linjer (199 minus 2 ferger), NO-2641 Telemark 26 (28 minus 1 ferge og 1 Stengt). Begge har nå runtime-atlasgeometri i develop.
- Kildeomfanget inkluderer turforslag og historiske kommunegrupper. Import er bestilt og implementert i develop, inkludert sykkelruter. Detaljer og kilder står i PROJECT.md. Importen er verifisert i develop; brukeren godkjente visningen med «ser bra ut» 2026-10-13.

## Neste arbeid
- Les pågående kildeundersøkelser og oppgaver fra develop. Vestfold/Telemark er importert i develop og klare for brukertest; nye ruter er ikke lagt inn i hovedkartet.
- Avtal eventuell markering av allerede valgte parker i mobilens overlappsliste. Dette er fortsatt utsatt.
- Andre mulige forbedringer og senere regresjonskontroller står i [TODO.md](TODO.md). Aktiveringsmarkering og punktutseende er ferdigstilt i hovedkartet.

## Oslofjorden-kyststiruter i hovedkartet
- NO-2542 bruker 122 gang-/sykkelruter i Østfold, inkludert alle 31 Hvaler-rutene, fra KML-snapshot 2026-10-11. Ferger/ukjente kategorier utelates. Den gamle GIS-/Hvaler-kombinasjonen brukes ikke ved noen zoomnivåer.
- Samme blå/gule/grønne appfarger, 61 m korridor, GPS og overlapp. Testene kontrollerer eksakt geometri ved alle zoomnivåer, kart-/GPS-treff på alle 13 sykkelruter, 20/44 m GPS-grense og responsive Kyststi-klikk. Andre parker/stier er bevart.
- Brukeren har godkjent rutene og sammenslåingen. Kilden er nå i hovedkartet; testkopien https://apagg.github.io/pota-kart/test/oslofjorden-coast/ er et separat øyeblikksbilde.
- Varig bruksvilkårsnotat: [data/coastal/README.md](https://github.com/apagg/pota-kart/blob/main/data/coastal/README.md), metadata og PROJECT.md. Brukeren har lest vilkårene og er komfortabel med ikke-kommersiell bruk. Ved annen/bredere/kommersiell bruk må rettighetene avklares med kildeeieren.

## Satt på vent: implementering av stisystemet
**NO-2542-kildebyttet er ferdigstilt i hovedkartet. Øvrig samlet stiomarbeiding er fortsatt utsatt.**

Historisk er `Hvaler-redigering.gpkg` og `hvaler_tillegg` undersøkt, og kode for eksport og integrasjon finnes i `data/hvaler/`, `scripts/export-hvaler.py` og `scripts/update-geometries.py`. Dette bekrefter ikke at alle geografiske grense-/overlappstilfeller er endelig validert. Tidligere analyser og mulige restfeil er bevart i [HISTORY.md](HISTORY.md). Tidligere UI-/aktiveringssammenslåinger endret ikke stidata; PR #6 har nå byttet kilden for NO-2542. Automatisk Export Hvaler trails 38163371384 fullførte med success uten ny commit.

## Start neste samtale
«Fortsett POTA-kartet på develop fra GitHub. Les PROJECT.md, STATUS.md og TODO.md fra develop først. Main er stabil 0.12.0; ny versjon/sammenslåing krever min godkjenning. Bruk HISTORY.md kun ved behov. Diskuter neste endring før du redigerer kode. NO-2542 bruker nå godkjente Oslofjorden-ruter i hovedkartet; øvrig stiomarbeiding er satt på vent.»
