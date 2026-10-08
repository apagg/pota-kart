# POTA-kart – oppgaver og overlevering

Sist oppdatert: 2026-10-08. Les [PROJECT.md](PROJECT.md) først.

## Dagens status

- Verifisert kodegrunnlag: `main`, versjon 0.11.0, commit `337952562462f98f5d47162a22b48f700f0777c8` før dokumentasjonsendringen.
- Brukeren godkjente opprettelse av varig prosjektdokumentasjon på GitHub før videre Hvaler-arbeid.
- Appkode og kartdata endres ikke i denne dokumentasjonsøkten.
- Hvaler-importen er fortsatt neste hovedoppgave.

## Neste hovedoppgave: erstatte Hvaler-stiene

- [ ] Finn eller innhent `Hvaler-redigering.gpkg`. Filen er omtalt som levert i tidligere samtale, men ble ikke funnet i arbeidsområdet eller filtrestrukturen på `main` i denne økten.
- [x] Brukeren har bekreftet at **kun `hvaler_tillegg`** er sluttresultatet; `hvaler_original` og `hvaler_redigering` skal ikke importeres. Sjekk særlig Spjærøy.
- [ ] Kontroller og rens `hvaler_tillegg` for tom geometri og reelle duplikater uten å fjerne gyldige stier.
- [ ] Sammenlign mot dagens Kyststien Østfold (NO-2542). Skill komplett Fotrute-datasett fra stiene som faktisk skal inngå i POTA-kartet.
- [ ] Fjern **alle andre stier innenfor Hvaler** og erstatt dem kun med `hvaler_tillegg`; bevar segmenter utenfor Hvaler, inkludert deler av grensekryssende ruter.
- [ ] Avtal konkret endringsplan før ny appversjon og gjennomfør i egen testgren.
- [ ] Lagre den redigerte kilden med metadata og en reproducerbar import. Konverter til GeoJSON med lengdegrad/breddegrad og bevar alle gyldige linjedeler.
- [ ] Tilpass `scripts/update-geometries.py` slik at regenerering ikke overskriver Hvaler-redigeringen. Kontroller også runtime-reserven i `app-core.js`.
- [ ] Oppdater full geometri, oversiktslag, indeks og avgrensninger samlet.
- [ ] Kontroller at stier utenfor Hvaler er uendret, at gamle Hvaler-segmenter er erstattet og at duplikater ikke gjenstår.
- [ ] Bevar 61 m total stikorridor, blå grunnfarge og grønn GPS-farge, parkvalg, tooltip og mobilfunksjoner.
- [ ] Kjør relevante eksisterende tester og kontroller kartet visuelt på mobil og større skjerm, inkludert overlapp med flere enn to parker og GPS-følging.
- [ ] Oppgi test-URL, gren/commit, kildefil, segmentantall og validering. Avtal overføring til `main` etter at brukeren har vurdert prøveversjonen.

## Kontrollpunkter etter hovedoppgaven

Dette er tidligere rapporter eller mulige avvik; dagens feilstatus er ikke bekreftet.

- [ ] Kontroller SE-0016 Kosterhavet, SE-0468 Tofta og SE-0334 Marstrand mot dagens geometri og eventuelt `archive/v0.10.0`.
- [ ] Kontroller søk mot ønsket sentrering uten zoom. Dagens kode bruker minst zoomnivå 11 ved søk.
- [ ] Kontroller Ramsvikslandet SE-2071/SE-2073: ringtopologi, hull og overlapp mot historiske tall i PROJECT.
- [ ] Mål respons ved mange synlige geometrier og overlapp etter innlegging av nye stier.
- [ ] Bekreft satellittkart og GPS-følging i nettleseren ved neste karttest. Satellittvalg og GPS-logikk finnes i kontrollerte kildefiler.

## Ferdig i denne økten

- [x] Undersøkt GitHub-tilgang, filtruktur, gjeldende versjon, eksisterende grener og oppdateringsarbeidsflyter.
- [x] Dokumentert prosjektmål, brukerkrav, arkitektur, datakilder og historiske kontrollpunkter i PROJECT.md.
- [x] Dokumentert Hvaler-import som gjenstående arbeid, med presise kontroller før og etter import.
- [x] Lagt lenker til prosjektdokumentasjonen i README.md.

## Fast avslutning av arbeidsøkter

Oppdater begge dokumentene når noe endres. Oppgi hva som ble gjort, hva som faktisk ble testet, hvor endringen ligger og hva neste økt trenger. Merk utestede forhold eksplisitt. Flytt bare oppgaver til ferdig når det finnes bekreftet resultat.

Dokumentasjonen er en overlevering, ikke en automatisk synkronisering av samtaler. Nye samtaler bør starte med: «Vi fortsetter med POTA-kartet. Les PROJECT.md og TODO.md på GitHub først.»

## Ny prioritet (2026-10-08): kvalitet uten stiendringer
- [x] Avklar at hele stisystemet, inkludert Hvaler, settes på vent til en senere samlet omarbeiding.
- [x] Start trinnvis kodeopprydding: felles diagnostikkmodul, integrasjon i atlas/oppstart, automatisert regresjonstest.
- [ ] Bekreft grønn GitHub Actions-kjøring for diagnostikkendringen.
- [ ] Del opp `app-core.js` gradvis i uavhengige moduler med regresjonstester, uten å endre sti- eller kartoppførsel.
- [ ] Forbedre feilhåndtering og meldinger ved øvrige nettverksfeil.
- [ ] Utvid mobil-, GPS- og ytelsestester uten å endre stisystemet.

- [x] Flytt `featuresOfGeoJson` fra `app-core.js` til `geojson-utils.js`, og legg til en isolert regresjonstest.
- [x] Rett testkartets filkopiering så nye moduler (`diagnostics.js`, `geojson-utils.js`) følger med.
- [ ] Bekreft CI og nettlesertester etter moduluttrekket før større refaktorering.

- [x] Flytt kartinitialisering og bakgrunnskart fra `app-core.js` til `map-setup.js`.
- [x] Ta med `map-setup.js` i CI-syntakssjekk og isolert testkart.
- [ ] Verifiser at GitHub Actions og nettlesertestene består etter moduluttrekket; ingen grønn status er bekreftet ennå.

- [x] Skill ut WMS-kartlag og utvalgstilstand i `map-layers.js`.
- [x] Skill ut GPS-kontrolleren i `gps-controller.js` uten tilsiktet oppførselsendring.
- [x] Legg til modulrekkefølge-test (`scripts/test-module-wiring.cjs`) og oppdater testkartkopiering.
- [ ] Bekreft at GitHub Actions og nettlesertestene består etter GPS-uttrekket.

## Fast kvalitetsregel
- [ ] Kontroller faktisk GitHub Actions-resultat og relevante nettlesertester etter hver fremtidige kodeendring. Ikke marker oppgaver som ferdige før testene er bestått; dokumenter eventuelle blokkeringer.

- [x] Undersøk feil i Actions-kjøring 37831758037; identifisert cross-realm `Error`-håndtering i diagnostikktesten.
- [x] Rett `diagnostics.js` i testgrenen, utvid testen med VM-Error.
- [ ] Verifiser ny Actions-kjøring inklusive nettlesertester før PR #2 kan slås sammen med `main`.

## Bekreftet CI for PR #2 (2026-10-08)
- [x] Rett feil forventet antall diagnostikkoppføringer etter utvidet VM-test.
- [x] Kontroller GitHub Actions-kjøring [37832833178](https://github.com/apagg/pota-kart/actions/runs/37832833178): `completed/success` for commit `2b8dc840120dd85b582b796010a42c90f647416e`.
- [x] Bekreft at geometri-/JavaScript-kontroller og desktop-/mobilnettlesertester er bestått i denne kjøringen.
- [ ] Avgjør om PR #2 skal slås sammen med `main`; ingen automatisk sammenslåing.
- Merk: Eldre avkrysningspunkter om uverifisert CI ovenfor er historiske; denne nyere bekreftelsen gjelder PR #2.
