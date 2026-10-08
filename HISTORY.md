# POTA-kart – dokumentasjonshistorikk

Arkivert 2026-10-08 ved opprydding i prosjektfilene. Innholdet nedenfor er **originaltekst før opprydding**, inkludert historiske og senere utdaterte statusutsagn. Ikke bruk arkivet som gjeldende arbeidsstatus; se `STATUS.md` og `TODO.md`.

---

## Arkiv: PROJECT.md (før opprydding)

# POTA-kart – prosjektkunnskap

Sist oppdatert: 2026-10-08.

## Start her ved en ny arbeidsøkt

Les denne filen og [TODO.md](TODO.md) før nye endringer. Kontroller deretter aktuell gren, commit, kode og relevante data på GitHub. Disse filene er prosjektets varige overlevering mellom arbeidsøkter.

Skill mellom brukerens beslutninger, verifisert kode, tidligere rapporter og utestede forslag. En tidligere samtale eller et versjonsnummer alene beviser ikke dagens oppførsel. Oppdater dokumentasjonen ved avslutning av en arbeidsøkt med endringer, validering, gren/commit, gjenstående arbeid og nødvendige kildefiler.

## Fast arbeidsmetode: GitHub som fasit

- GitHub-repositoryet er prosjektets kilde til sannhet. ChatGPT-samtalen brukes til diskusjon, beslutninger og korte statusrapporter, ikke som varig lagringssted for kode eller prosjektstatus.
- Diskuter foreslåtte endringer og avtal omfang før implementering. Les deretter bare relevante filer og datadeler fra GitHub; unngå å lime inn store filer eller lange kodeblokker i chatten.
- Gjennomfør endringer i repositoryet, test relevante funksjoner og lagre med tydelige commits. Bruk testgren for app- og dataendringer og avtal overgang til `main`.
- Oppdater `PROJECT.md` ved varige beslutninger og tekniske endringer, `TODO.md` ved oppgavestatus og neste steg, og `CHANGELOG.md` når denne finnes og versjonsendringer tilsier det.
- En oppgave regnes ikke som ferdig før endringene er committet på GitHub og relevant prosjektdokumentasjon er oppdatert. Hvis testing, commit eller dokumentasjon mangler, rapporter dette eksplisitt som uferdig.
- Oppsummer kort i chatten hva som ble endret, hvilke tester som ble kjørt, gren og commit, og eventuelle gjenstående punkter. Ved ny samtale les `PROJECT.md` og `TODO.md` og kontroller faktisk repository-status før videre arbeid.

## Formål og publisering

Interaktivt, mobilvennlig kart over POTA-referanser i Norge og Sverige, med registergrenser, stier, overlapp og egen GPS-posisjon.

- Repository: https://github.com/apagg/pota-kart
- Hovedkart: https://apagg.github.io/pota-kart/
- Publisering: GitHub Pages fra `main`.
- Verifisert utgangspunkt for denne dokumentasjonen: `main`, commit `337952562462f98f5d47162a22b48f700f0777c8`.
- `README.md`, `index.html` og `app.js` oppgir versjon **0.11.0**.
- `archive/v0.10.0` bevarer den eldre versjonen.
- `feature/all-park-geometries` finnes fortsatt. Prøvevisningen ligger i `test/all-geometries/` og er ikke automatisk identisk med hovedkartet.

## Avtalte funksjoner og brukerpreferanser

- Norge og Sverige skal støttes. Prioritet for norske stier har vært Østfold og Hvaler.
- Alle tilgjengelige, verifiserte geometrier vises i valgt land. Parker uten geometri vises som POTA-punkt.
- Flervalg er aktivert ved oppstart. Klikk på en park skal ikke automatisk zoome.
- Et nytt klikk på en allerede valgt park skal åpne informasjonen igjen.
- Musepekerinformasjon skal virke på selve geometrien, og ved overlapp vise alle aktuelle parker, også flere enn to.
- Overlapp vises automatisk uten at parkene må velges først. På mobil skal man kunne velge mellom parkene ved et overlappende trykkpunkt.
- Stier behandles som **61 meter total bredde**, altså **30,5 meter på hver side av midtlinjen**, ved GPS- og overlappberegning.
- Grunnfargen for stier er blå. Parker og stier blir grønne når GPS-posisjonen ligger innenfor. Valg skal ikke gjøre parkpunktet eller selve stien større.
- GPS-knapp: av → på med følging; dra kartet → GPS fortsetter, følging pauses; trykk igjen → følging gjenopptas; trykk mens følging er aktiv → GPS av.
- Den separate GPS-informasjonsboksen over kartet skal være fjernet.
- Mobilvisningen skal ha kompakt parkboks med navn, aktiveringstall og lenke til `pota.app`. «Vis detaljer» beholdes; tekniske analyser skal ikke dominere mobilvisningen.
- Separat varselboks for manglende geometri skal være fjernet. Det var denne boksen brukeren mente med Storelgen-meldingen, ikke parkens informasjonsboks.
- OpenStreetMap, Esri og satellitt er bakgrunnskartvalg i dagens `index.html`.
- Diskuter endringer og omfang før nye appversjoner. Bruk egen testgren for app-/dataendringer og avtal overgang til `main`.
- Dersom lokal serverport er opptatt, vis en tydelig feil om at en annen app/prosess bruker porten; ikke bytt port automatisk.

Dette er krav som skal bevares. Enkelte detaljer må sammenholdes med kode og tester: søk var tidligere avtalt å sentrere uten zoom, men dagens `showParkLink` bruker `Math.max(11, map.getZoom())` ved søk. Dette er registrert som et mulig avvik i TODO.

## Arkitektur og viktige filer

Appen er et statisk webkart med Leaflet, Turf og polygon-clipping; den krever ikke en egen appserver.

| Fil eller mappe | Rolle |
| --- | --- |
| `index.html`, `styles.css` | Kart og grensesnitt for større skjermer |
| `app.js` | Laster modulene i rekkefølge |
| `pota-cache-bootstrap.js` | Leder POTA-listeforespørsler til lokale datafiler |
| `app-core.js` | Kart, søk, parkvalg, datakilder, stier og GPS |
| `geometry-atlas.js` | Geometrioversikt, detaljlasting, GPS-farger, valg i overlapp og visning av overlapp |
| `geometry-topology.js` | Håndtering av polygongeometri og ringtopologi |
| `overlap-engine.js`, `overlap-worker.js` | Overlappberegning i bakgrunnsarbeider |
| `mobile-ui.js`, `mobile-ui.css` | Mobilvisning |
| `preview-mobile.html` | Mobilforhåndsvisning i 390 × 844 ramme |
| `data/pota-NO.json`, `data/pota-SE.json` | Lokale POTA-referanselister |
| `data/geometries/*-index.json` | Geometrikoblinger, metadata og mangler |
| `data/geometries/*-overview.geojson` | Forenklede oversiktsgeometrier |
| `data/geometries/NO-*.json`, `SE-*.json` | Filer med full geometri, fordelt i deler |
| `data/kulturminner/` | Verifiserte kulturminnegeometrier |
| `scripts/update-geometries.py` | Bygger registergeometri, indeks og oversikt |
| `scripts/update-kulturminner.py` | Oppdaterer verifiserte kulturminnekopier |

Fra zoomnivå 10 lastes full geometri for kartutsnittet. Parkvalg og analyse bruker full geometri. Overlappberegning skjer i en Web Worker; beregning og tegning begrenses til relevante områder for å holde kartet responsivt.

## Datakilder og verifisering

- **POTA:** referanser, navn, posisjoner, kildelenker og aktiveringstall.
- **Sverige:** Naturvårdsverkets registerdata, blant annet verneområder og Natura 2000. Det finnes også resolverkode for andre områdetyper.
- **Norge:** Naturbase fra Miljødirektoratet; verneområder samt statlig sikrede og kartlagte friluftslivsområder, med VV-/FS-/FK-ID.
- **Kulturminner:** Riksantikvarens register og Geonorge WFS som reserve. Eksakte lokalitets-ID-er og bekreftede undernummer brukes.
- **Norske turstier:** Kartverkets Turrutebase har vært grunnlag for Fotrute-uttrekk til QGIS. Dette komplette kartlaget er ikke det samme som dagens lagrede POTA-stigeometri.
- **Kyststien Østfold, NO-2542:** dagens importer og runtime-reserve bruker rutelaget `https://kart.analyseabo.no/arcgis/rest/services/Turkart/RegFriluft_innsyn/MapServer/15/query`.

Usikre registerkoblinger skal beholdes som punkt. En kildefeil skal ikke overskrive en tidligere verifisert kopi når POTA-kildelenken er den samme. Bevar delpolygoner og hull. GeoJSON bruker koordinatrekkefølgen lengdegrad/breddegrad; WFS EPSG:4326 kan kreve aksekonvertering.

Registergrensen kan avvike fra hele POTA-området, særlig for kulturminner. Brukerredigerte stier må få tydelig opprinnelse og må ikke beskrives som uendrede, offisielt verifiserte registerdata.

### Automatisk oppdatering

`.github/workflows/update-pota-data.yml` er konfigurert til daglig oppdatering kl. 03:17 UTC: POTA-lister og kulturminner oppdateres, lagres og publiseres. Den oppdaterer ikke automatisk hele geometriatlaset.

`.github/workflows/geometry-preview.yml` kjører «Verify POTA map» ved angitte kodeendringer på `main` og `feature/all-park-geometries`. På feature-grenen regenereres geometri og prøvevisningen publiseres til `test/all-geometries`. En ny Hvaler-testgren får ikke automatisk denne publiseringen; kontrollopplegget må tilpasses.

## Aktivt arbeid: Hvaler-stier

Brukeren har redigert alle ønskede Hvaler-stier i QGIS og tidligere levert **`Hvaler-redigering.gpkg`**. Instruksen er å erstatte de gamle Hvaler-stiene med disse og bevare stier utenfor Hvaler.

Tidligere ble hele **Fotrute-kartlaget** etterspurt, særlig stiene vist i v8.10 på **Spjærøy**. Spjærøy var den korrigerte stedsangivelsen. Brukeren fikk veiledning om bakgrunnskart og kopiering av stier til `hvaler_tillegg`.

Per denne arbeidsøkten er selve GeoPackage-filen ikke tilgjengelig i det lokale arbeidsområdet og finnes ikke i den kontrollerte filtrestrukturen på `main`. Laginnhold, koordinatsystem og geometrivaliditet er derfor ikke kontrollert her, og importen er ikke utført.

**Brukerbeslutning 2026-10-08:** Bare laget `hvaler_tillegg` skal brukes som ny kilde for Hvaler. Det skal erstatte **alle andre stier på Hvaler**. Lagene `hvaler_original` og `hvaler_redigering` skal ikke importeres. Bevar stier utenfor Hvaler, også deler av ruter som krysser kommunegrensen. Kontroller og håndter ugyldige eller dupliserte linjer før import. Definer også en sikker avgrensning av gamle Hvaler-segmenter; ikke slett en hel rute som også fortsetter utenfor Hvaler.

Importerens oppdatering må bevare det manuelle tillegget. Det er ikke tilstrekkelig å endre bare en generert geometri-JSON som senere kan bli overskrevet.

## Historiske kontrollpunkter

Følgende er tidligere arbeidsresultater eller feilrapporter, ikke ferske bekreftelser av dagens data:

- Svenske koblinger økte historisk fra 2024 til 2079 og 2119 av 2221 referanser. Ikke bruk disse som dagens antall.
- Ramsvikslandet: ringtopologi ble rekonstruert til 11 delpolygoner for SE-2071. Historisk areal var 848,2 ha for SE-2071, 1928,4 ha for SE-2073 og 846,8 ha overlapp. Bevar dette som regresjonsreferanse.
- SE-0016 Kosterhavet, SE-0468 Tofta og SE-0334 Marstrand hadde tidligere rapporter om manglende geometri i nyere versjon sammenlignet med 0.10.0.
- Enhusvidda (FS00000814), Landeparken (FK00022917) og Ravneberget (kulturminne-ID 94448) ble tidligere oppgitt løst med nye kilder.
- Overlappytelse og tooltip for mer enn to overlappende parker har vært viktige feilområder. Nye stidata skal kontrolleres mot disse.

## Validering ved kommende endringer

Eksisterende kontroller:

```sh
python3 scripts/test-geometries.py
python3 scripts/test_update_kulturminner.py
node scripts/test-overlap-engine.cjs
node scripts/test-atlas.cjs
```

Nettlesertesten trenger HTTP-server og testavhengigheter som beskrevet i `geometry-preview.yml`; kommandoene alene er ikke et komplett oppsett. Kjør relevante kontroller for endringen og test på både mobil og større skjerm. Dokumentasjonsopprettelsen 2026-10-08 innebar kildeinspeksjon, ikke en ny full kjøretidstest av kartet.

## Arbeidsgren og tilbakeføring (beslutning 2026-10-08)
- Brukeren har godkjent å gjøre Hvaler-endringene direkte på `main`, fremfor å opprette testgren.
- Ta vare på commit-SHA før hver endring, gjør små commits, test og oppdater `STATUS.md` og `TODO.md` fortløpende.
- Ved feil kan vi reversere endringscommits; ikke overskriv historikk eller bruk force-push.
- Originalfilen `Hvaler-redigering.gpkg` beholdes uendret som sikkerhetskopi.

## Beslutning 2026-10-08: stisystemet utsettes
- Brukeren ønsker å omarbeide **hele stisystemet senere**. Ikke endre Hvaler-stier, øvrige stier, korridorberegning eller datakilder nå uten ny avtale.
- Nåværende forbedringsfase prioriterer modulstruktur, diagnostikk, feilhåndtering og tester uten funksjonelle endringer i kartet.
- Ny modul `diagnostics.js` lastes før kartmotoren og holder de 50 siste feilmeldingene i minnet. `scripts/test-diagnostics.cjs` tester dette og kjøres i GitHub Actions.

## Kodeopprydding uten stiendringer (2026-10-08)
- `geojson-utils.js` er skilt ut fra `app-core.js` og lastes før kartmotoren. `featuresOfGeoJson` beholder samme signatur og semantikk, men kan nå testes uten Leaflet eller Turf.
- `scripts/test-geojson-utils.cjs` er lagt til i CI. Preview-publiseringen kopierer både `geojson-utils.js` og `diagnostics.js`, slik at testkartet ikke mangler oppstartsavhengigheter.
- Ingen stidata eller stifunksjoner ble endret. GitHub Actions-resultat og nettleserregresjon gjenstår å bekrefte.

## Videre moduluttrekk 2026-10-08
- `map-setup.js` inneholder nå kartinitialisering, panes, UI-referanser, bakgrunnskart og lagringsvalg for bakgrunnskart. `app.js` laster den etter `geometry-atlas.js` og før `app-core.js`.
- Uttrekket flyttet opprinnelige linjer uten tilsiktet oppførselsendring. Ingen stidata eller GPS-/stiberegninger er endret.
- GitHub Actions har syntakssjekk av ny modul og inkluderer den i isolert testpublisering. CI-resultat er ikke bekreftet.

## Moduluttrekk: GPS og kartlag (2026-10-08)
- `map-layers.js` overtar WMS-kildelag, utvalgsvariabler og overlappslaget fra `app-core.js`.
- `gps-controller.js` overtar GPS-tilstand, posisjonsoppdatering, GPS-kontroller, følg/pause, valgte områders GPS-status og hendelseslyttere. Den eksisterende logikken er flyttet uendret, inkludert stibuffer; stisystemet er fortsatt utsatt.
- `app.js` laster nå `geometry-atlas.js`, `map-setup.js`, `map-layers.js`, `gps-controller.js` og deretter `app-core.js` i denne rekkefølgen. `scripts/test-module-wiring.cjs` sikrer innlastingsrekkefølgen og at funksjonene er flyttet.
- CI er utvidet med syntakssjekk, modul-koblingstest og kopi av nye filer til isolert testkart. Kjøreresultater og nettlesertest er ikke bekreftet.

## Obligatorisk testing etter hver kodeendring (besluttet 2026-10-08)
- Etter hver kodeendring skal relevante automatiske tester kjøres og resultatene kontrolleres, inkludert GitHub Actions. For funksjoner som kan påvirke brukergrensesnittet skal relevante nettlesertester utføres, også mobil og GPS når det er aktuelt.
- Ved feil skal årsaken undersøkes, koden rettes og testene kjøres på nytt før oppgaven kan meldes ferdig.
- Dokumenter faktisk utførte tester, resultat, eventuelle begrensninger og commit i STATUS.md og oppdater TODO.md.
- En commit eller konfigurert CI-test er ikke bevis for at testene er bestått. Oppgaven er ikke ferdig før testresultatene er bekreftet. Dersom tilgang eller testmiljø hindrer verifisering, oppgi tydelig at arbeidet er uverifisert og avvent videre risikofylt refaktorering.
- Stisystemet, inkludert Hvaler, skal fortsatt ikke endres før brukeren ber om samlet omarbeiding.

## CI-feil og retting 2026-10-08
- GitHub Actions-kjøring 37831758037 feilet i `scripts/test-diagnostics.cjs`: Error-instans opprettet utenfor `node:vm` ble ikke gjenkjent med `instanceof Error` inne i VM. Testen forventet `offline`, men fikk `Error: offline`.
- `diagnostics.js` bruker nå en streng `error.message` når tilgjengelig på tvers av JavaScript-realm, og fallback til `String(error)`. Testen dekker både host-Error og VM-Error.
- Rettelsen ligger i testgrenen `refactor/core-geometry-helpers`; grønn GitHub Actions og nettlesertester må bekreftes før sammenslåing.

## Verifisert refaktorering 2026-10-08
- PR #2 (`refactor/core-geometry-helpers`) trekker polygonhjelpefunksjoner ut av `app-core.js` til `polygon-layer-utils.js`, uten tilsiktet endring i kartlogikk eller stidata.
- Etter retting av diagnostikktestene er GitHub Actions-kjøring [37832833178](https://github.com/apagg/pota-kart/actions/runs/37832833178) **fullført med `success`** for commit `2b8dc840120dd85b582b796010a42c90f647416e`. Geometri-/JavaScript-validering og nettlesertester for desktop og mobil bestod.
- PR #2 er fortsatt en separat testgren; `main` er ikke oppdatert med denne refaktoreringen. Senere dokumentasjonscommits endrer ikke programkoden, men endelig sammenslåing krever fortsatt egen beslutning.

## Videre kodeopprydding 2026-10-08
- `getPotaActivationCount` og den tilhørende femminutters statistikk-cachen er flyttet uendret fra `app-core.js` til `pota-activation.js`. Oppstartsrekkefølgen i `app.js` og CI-syntakskontroll / testpublisering er oppdatert.
- Ingen endringer i stier, GPS-logikk, parkgeometri eller beregningsregler. Endringen ligger kun i testgrenen `refactor/core-geometry-helpers`.
- GitHub Actions-kjøring [37833370316](https://github.com/apagg/pota-kart/actions/runs/37833370316) gjelder den nye kodeendringen. Kontroller endelig resultat før den regnes som ferdig.

- **Verifisert:** GitHub Actions-kjøring [37833435310](https://github.com/apagg/pota-kart/actions/runs/37833435310) fullførte med `success` etter POTA-aktiveringsuttrekket. Geometri/JS-kontroller og desktop-/mobilnettlesertester bestod. Testet commit: `5e8d52dd839d223667af24cb8d846aeaeadb6e13`.

## Parkinformasjon skilt ut (2026-10-08)
- `openParkInfo`, `reopenSelectedPark`, `bindSelectedGeometry` og `openOverlapChooser` er flyttet uten tilsiktet oppførselsendring fra `app-core.js` til `park-info-ui.js`; `app.js` og CI-pakking er oppdatert.
- GitHub Actions [37833958638](https://github.com/apagg/pota-kart/actions/runs/37833958638) fullførte med `success` for kodecommit `ccf5bc59f221dd47c830c5d9c0c5fd9b416d2420`, inkludert geometri/JS-kontroller og desktop-/mobilnettlesertester.
- Endringen er fortsatt i PR #2; `main` og stidata er ikke endret.

## Felles teksthjelpere skilt ut (2026-10-08)
- `norm`, `esc` og `getJSON` er flyttet uendret fra `app-core.js` til `app-text-utils.js`, med oppdatert oppstartsrekkefølge og CI-syntakskontroll/testkopiering.
- Ingen endring i stisystemet. GitHub Actions [37834519771](https://github.com/apagg/pota-kart/actions/runs/37834519771) for kodecommit `bee9492f55ad17ada6fb865547dfe03ae1ee1248` var fortsatt `pending` ved dokumentasjon; endelig resultat må verifiseres.

## Ufravikelig avslutningsregel for kodearbeid (2026-10-08)
- **IKKE AVSLUTT SVARET ELLER KODEARBEIDET MED EN TEST SOM `pending`, `queued`, `in_progress` ELLER `cancelled`.** Etter siste kodecommit skal assistenten selv følge GitHub Actions frem til en endelig `completed`-status er kontrollert direkte på GitHub. Ved kansellering på grunn av nyere commits: finn og følg den nyeste relevante kjøringen.
- Kontroller både samlet `conclusion` og at relevante geometri-/JavaScript-, desktop- og mobiltester har `success`. Ved `failure`: les jobbloggene, rett årsaken, push endring og følg ny kjøring til endelig resultat. Ved vedvarende infrastrukturblokkering: dokumenter eksplisitt blokkeringen, ikke påstå at arbeidet er ferdig.
- Først etter bekreftet grønn CI oppdateres `PROJECT.md`, `TODO.md` og `STATUS.md` med kjørings-ID, testet commit og resultat. Dokumentasjonscommits kan utløse ny kjøring; kontroller da også siste relevante kjøring før endelig svar. Ikke be brukeren om å følge testen på våre vegne.
- Eksempel: kjøring 37834519771 ble `cancelled`, men etterfølgende [37834623605](https://github.com/apagg/pota-kart/actions/runs/37834623605) ble `completed/success` for commit `f6c46cc24da0365c0148898573357a210d12f559`, inkludert geometri-/JavaScript- og desktop-/mobiltester.

## Ferdig moduluttrekk for parkvalg og oppstart (2026-10-08)
- `park-diagnostics.js`, `park-selection-state.js`, `pota-park-loader.js`, `park-selection-controller.js` og `pota-startup.js` er skilt ut fra `app-core.js` uten tilsiktet funksjonsendring. `app.js` og CI er oppdatert.
- [GitHub Actions 37837436277](https://github.com/apagg/pota-kart/actions/runs/37837436277) fullfort med `success` for kodecommit `eb87927df0a3bedece0479bffa844bc5575311c2`; geometri/JS og desktop-/mobiltester bestod.
- Hvaler og stisystemet er ikke endret. Gjenværende `app-core.js` inneholder fortsatt sti-/overlappsfunksjoner og geometri-/kartintegrasjon, som holdes utenfor denne oppryddingen.


---

## Arkiv: TODO.md (før opprydding)

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

## Neste moduluttrekk – POTA-statistikk
- [x] Flytt POTA-aktiveringscache og nettverksforespørsel til `pota-activation.js` uten logikkendringer.
- [x] Oppdater `app.js` og CI for den nye filen.
- [ ] Bekreft endelig CI-resultat for [37833370316](https://github.com/apagg/pota-kart/actions/runs/37833370316), inkludert nettlesertestene, før ferdigmelding.

- [x] Bekreftet `completed/success` for Actions [37833435310](https://github.com/apagg/pota-kart/actions/runs/37833435310), inkludert desktop-/mobiltester, på commit `5e8d52dd839d223667af24cb8d846aeaeadb6e13`. Dette erstatter den tidligere ventende statusen for samme kodeuttrekk.

## Parkinformasjon og overlappsvelger
- [x] Flytt parkinformasjon, popup, geometri-klikkbinding og overlappsvelger til `park-info-ui.js`.
- [x] Oppdater innlasting og CI-kontroller for modulen.
- [x] Verifiser GitHub Actions [37833958638](https://github.com/apagg/pota-kart/actions/runs/37833958638): `completed/success`, inkludert nettlesertester for PC og mobil.
- [ ] Vurder videre moduluttrekk i `app-core.js`, fortsatt uten endringer i stisystemet.

## Felles teksthjelpere
- [x] Flytt `norm`, `esc` og `getJSON` til `app-text-utils.js` uten logikkendringer.
- [x] Oppdater modulinnlasting og CI.
- [ ] Kontroller endelig Actions-status og nettlesertester for [37834519771](https://github.com/apagg/pota-kart/actions/runs/37834519771); status var `pending` ved dokumentasjon.

## Obligatorisk kontroll før avslutning av enhver kodeoppgave
- [x] Bekreftet at den nyere kjøringen [37834623605](https://github.com/apagg/pota-kart/actions/runs/37834623605) er `completed/success`, med bestått geometri/JS og desktop-/mobiltester, for `f6c46cc24da0365c0148898573357a210d12f559`.
- [ ] For **hver fremtidige kodeendring**: vent på og kontroller endelig GitHub Actions-status selv. Ikke avslutt ved `pending`, `in_progress` eller `cancelled`; følg erstatningskjøring eller rett feil til endelig resultat foreligger.
- [ ] Etter grønn CI: dokumenter test-ID, testet commit og resultater i prosjektfilene før ferdigmelding.

## Registermoduler (2026-10-08)
- [x] Flyttet norske og svenske parkregisterfunksjoner, svensk kulturminneoppslag og geometri-formatfunksjoner til fire egne moduler.
- [x] GitHub Actions 37835863095 og 37836430342: fullfort med success, inkludert desktop- og mobiltester.
- [ ] Fortsett med parkvalg og oppstart. Stisystemet skal ikke endres.

## Parkvalg og oppstart - ferdig moduluttrekk
- [x] Flytt parkdiagnostikk, parkutvalgsstatus, parkinnlasting, parkvalg og oppstart til egne moduler.
- [x] Oppdater bootstrap og CI; GitHub Actions 37837436277: completed/success med desktop-/mobiltester.
- [ ] Behold sti- og overlappslogikk uendret til separat godkjent arbeid. PR #2 er fortsatt ikke merget.


---

## Arkiv: STATUS.md (før opprydding)

# POTA-kart – aktiv arbeidsstatus

Sist oppdatert: 2026-10-08 (Hvaler-kilde funnet på GitHub).

## Start en ny samtale
Les `PROJECT.md`, `TODO.md` og denne filen på GitHub. Kontroller gjeldende gren og siste commit før arbeid. GitHub er fasiten; ikke rekonstruer status fra chatminne.

## Nåværende oppgave
**Hvaler: erstatte eksisterende stier med brukerens redigerte QGIS-data.**

- Brukeren har godkjent fortløpende GitHub-arbeid i samtalen.
- Sist dokumenterte appversjon: **0.11.0** på `main`. Bekreft aktuell commit før endringer.
- **Bekreftet:** `Hvaler-redigering.gpkg` er lastet opp i roten på `main` (Git blob SHA `c23430177d628e6cc0e00d9506a601963fe01b28`). Binærinnholdet og lagene er ennå ikke analysert i denne arbeidsøkten.
- Ingen Hvaler-import er bekreftet fullført.
- Spjærøy er særlig viktig. Bevar alle stier utenfor Hvaler.
- Endre ikke genererte data alene: oppdater varig datakilde/import og runtime-reserve slik at neste regenerering ikke fjerner redigeringen.

## GeoPackage-kontroll 2026-10-08
- Lokal kopi `Hvaler-redigering(2).gpkg` kontrollert som SQLite/GeoPackage EPSG:25832. GitHub-kopien `Hvaler-redigering.gpkg` finnes, men binær likhet er ennå ikke kontrollert.
- `hvaler_original`: 35 linjer; `hvaler_redigering`: 35 linjer og **identiske segment-ID-er og geometrier** som originalen.
- `hvaler_tillegg`: 449 rader, 1 uten geometri, 392 distinkte ikke-tomme geometri-BLOB-er; mangler segment-ID og kommune. Deduplisering og geografisk kontroll gjenstår.
- `scripts/update-geometries.py` og `app-core.js` henter NO-2542 fra eksternt rutelag; importen må også bevare manuelt tillegg ved regenerering og fallback.
- Ingen eksisterende kartdata er erstattet, ingen karttester er kjørt.

## Oppdatert kontroll av Hvaler (2026-10-08)
- Brukerkrav: bare `hvaler_tillegg` skal vises på Hvaler; alle tidligere Hvaler-stier skal erstattes. Arbeid direkte på `main` er godkjent.
- Lokal GeoPackage: 448 ikke-tomme linjegeometrier i `hvaler_tillegg` (449 rader totalt), 392 unike WKB-geometrier; samlet lengde før deduplisering ca. 63,41 km. Bounds i EPSG:25832: 604985,75 / 6542390,70 til 620909,28 / 6552983,13.
- Original Hvaler-lag: 35 linjer, ca. 34,82 km. Bare tilleggslaget skal brukes i resultatet.
- Eksisterende app og regenereringsskript har ekstern NO-2542 fallback; disse må oppdateres samlet slik at gamle stier ikke dukker opp igjen.
- Kartendring ikke utført eller testet ennå. Må ha sikker avgrensning av Hvaler før sammenslåing med øvrig Østfold.

## Neste konkrete handling
1. Sammenlign lokal GeoPackage med GitHub-kopien, kontroller geografisk utstrekning, topologi og duplikater i `hvaler_tillegg`.
2. Sammenlign med eksisterende Hvaler-stier og avgrens sikker utskifting.
3. Gjør endring direkte på `main` etter brukerens godkjenning; ta vare på tidligere commit for revert, test og oppdater dokumentasjon.
4. Kontroller kartet etter publisering.

## Regler for korte samtaler
- Les bare nødvendige filer og vis korte oppsummeringer i chatten.
- Lagre hver fullførte deloppgave i GitHub med commit; oppdater `STATUS.md` umiddelbart med utført arbeid, testresultat, gren/commit, blokkeringer og neste steg.
- Oppdater `TODO.md` ved endret oppgavestatus og `PROJECT.md` ved varige tekniske beslutninger.
- Merk eksplisitt hva som er planlagt, utført, testet og publisert. Ikke kall arbeid ferdig før kode og dokumentasjon er lagret.
- Ikke skriv store kodefiler eller datasett i chatten.
- Bruk testgren for app- og dataendringer; avtal overgang til `main`.

## Klar startmelding
«Fortsett POTA-kartet fra GitHub. Les PROJECT.md, TODO.md og STATUS.md. Fortsett neste uferdige Hvaler-oppgave, og lagre arbeidet fortløpende på GitHub. Hold chatten kort.»

## Implementering startet på main (2026-10-08)
- `scripts/export-hvaler.py` og `.github/workflows/export-hvaler.yml` er lagt til. GitHub Actions skal konvertere **kun** `hvaler_tillegg` fra sikkerhetskopien til `data/hvaler/hvaler-tillegg.geojson`, fjerne tomme/identiske linjer og lagre resultatet på `main`.
- `app-core.js` sin NO-2542 fallback er endret til å erstatte kildesegmenter merket `Kommune=Hvaler` med det genererte laget. Dersom generert GeoJSON ennå ikke finnes, beholdes eksisterende kilde som reserve.
- Siste trigger-commit: `ffa4afe`. **GitHub Actions-resultat, generert fil, nettlesertest og visning på Pages er ikke bekreftet.**
- **Gjenstående kritisk:** `scripts/update-geometries.py` bruker fremdeles ekstern NO-2542-kilde og kan reintrodusere gamle Hvaler-stier ved regenerering. Endre den før oppgaven markeres ferdig. Kontroller dessuten om kildegeometrien har Hvaler-deler i grensekryssende linjer, og at den statiske atlas-geometrien ikke overstyrer fallback.

## Neste implementering (2026-10-08)
- Generert `data/hvaler/hvaler-tillegg.geojson` er bekreftet til stede på GitHub (382749 tegn via connector).
- `scripts/update-geometries.py` er endret til å slå sammen Østfold-segmenter uten `Kommune=Hvaler` med bare redigerte Hvaler-linjer, slik at regenerering ikke gjeninnfører de gamle Hvaler-segmentene.
- `geometry-atlas.js` er endret til å prioritere redigert NO-2542-geometri fremfor lagret atlas-geometri.
- Runtime fallback i `app-core.js` bruker redigert Hvaler-fil dersom tilgjengelig.
- **Uverifisert:** full nettlesertest, geografisk klipping av eventuelle grensekryssende segmenter, og deploy på Pages. Segmenter som krysser Hvaler-grensen og mangler `Kommune=Hvaler` kan fortsatt måtte klippes; dette er ikke ferdig validert.
- Siste kodecommit for atlas: `86c5f3d`. Arbeid på `main` etter brukerens beslutning.

## Teknisk kontroll av lokal Hvaler GeoPackage (2026-10-08)
- Kontrollert den opplastede GeoPackage-kopien med SQLite, Shapely og pyproj. `hvaler_tillegg`: 449 rader, 448 linjer, én tom, 56 identiske duplikater, 392 unike geometrier; alle ikke-tomme linjer er gyldige og har positiv lengde. Lengde før deduplisering 73,732 km, etter deduplisering 63,412 km.
- `hvaler_original` og `hvaler_redigering` er geometrisk identiske (35/35), 34,819 km.
- Geografisk utstrekning av tillegg i EPSG:25832: 604985,75 / 6542390,70 til 620909,28 / 6552983,13. Nytt og gammelt nett er ikke identisk; ca. 31,13 km av gammelt nett ligger innen 30,5 m av nytt nett.
- **Bestått:** dataintegritet og identisk-duplikat-kontroll av lokal GeoPackage.
- **Ikke testet:** kommunegrenseklipping, GPS/61-meterskorridor i nettleser, GitHub Actions og Pages-publisering. Git-kloning fra container var blokkert av DNS/nettverk. Disse må fortsatt verifiseres før full godkjenning.

## Kodekvalitet – ny fase 2026-10-08
- Brukeren har satt all videre endring av Hvaler og øvrig stisystem på vent; ønsket er senere samlet redesign.
- På `main` er `diagnostics.js` lagt til som egen modul med begrenset feilbuffer (50 hendelser). `app.js` laster den før kartmodulene, og oppstartsfeil samt feil ved atlasinnlasting rapporteres gjennom den.
- `scripts/test-diagnostics.cjs` er lagt til, og `.github/workflows/geometry-preview.yml` kjører testen og syntakssjekk ved push.
- Ingen stidata, stioppslag eller korridorlogikk er endret i denne fasen.
- Teststatus: GitHub Actions-test er konfigurert, men kjøreresultat er ennå ikke bekreftet her.

## Moduluttrekk (2026-10-08)
- `featuresOfGeoJson` flyttet fra `app-core.js` til `geojson-utils.js`, lastet av `app.js` før kartkjernen.
- `scripts/test-geojson-utils.cjs` dekker null, FeatureCollection, Feature og ren geometri. CI kjører testen.
- Isolert testpublisering inkluderer nå både `diagnostics.js` og `geojson-utils.js`.
- Stisystemet er urørt. Automatiserte tester er konfigurert, men ikke verifisert kjørt i denne arbeidsøkten.

## Siste endring: map-setup.js
- Kartinitialisering, Leaflet-panes, UI-referanser og bakgrunnskart flyttet fra `app-core.js` til `map-setup.js` uten tilsiktet funksjonsendring.
- `app.js` laster ny modul før kartkjernen. GitHub Actions sjekker JavaScript-syntaks og inkluderer modulen i testpublisering.
- Ingen endringer i stier, stidata eller GPS-beregning. CI-status er foreløpig ikke bekreftet.

## Siste kodeendring: GPS-modul
- `gps-controller.js` og `map-layers.js` er skilt ut fra `app-core.js`; `app.js` laster dem i riktig rekkefølge.
- `scripts/test-module-wiring.cjs` er lagt til CI for å kontrollere modulrekkefølge og flyttede funksjoner.
- Ingen stidata eller endringer i sti- eller GPS-regler; kun omorganisering av eksisterende kode.
- GitHub Actions-status og visuell kontroll er fortsatt ikke bekreftet.

## Beslutning om testing (2026-10-08)
- Brukeren krever automatisk test og kontroll av GitHub Actions etter hver kodeendring, med nettleser-, mobil- og GPS-test når relevant.
- Dette er nå en fast regel i PROJECT.md. Tidligere moduluttrekk har fortsatt ikke bekreftet bestått CI/nettlesertest og er derfor uverifisert.

## Feilsøking av PR #2 / Actions 37831758037
- Kjøringen feilet under `node scripts/test-diagnostics.cjs` med `actual: Error: offline`, `expected: offline`. Årsak: `instanceof Error` gjenkjenner ikke Error fra et annet JavaScript-realm.
- Rettet diagnostikkens normalisering og utvidet testen i `refactor/core-geometry-helpers`. Ikke testbekreftet ennå. `main` er urørt.

## Bekreftet testresultat for PR #2 (2026-10-08)
- Den korrigerte kjøringen [37832833178](https://github.com/apagg/pota-kart/actions/runs/37832833178) er `completed` med `conclusion: success`.
- GitHub Actions viste bestått «Validate cached geometry and JavaScript» og «Test desktop and mobile map», inklusive øvrige teststeg.
- Testet programkode er commit `2b8dc840120dd85b582b796010a42c90f647416e`. Dokumentasjonsoppdateringer etterpå påvirker ikke programkoden. PR #2 er fortsatt åpen; `main` er urørt.

## CI verifisert og fast regel skjerpet (2026-10-08)
- Siste moduluttrekk (`app-text-utils.js`) er bekreftet gjennom [GitHub Actions 37834623605](https://github.com/apagg/pota-kart/actions/runs/37834623605): `completed/success`, commit `f6c46cc24da0365c0148898573357a210d12f559`; geometri/JavaScript og desktop/mobil bestod.
- Kjøring 37834519771 ble avbrutt fordi nyere commits utløste erstatningskjøring; en avbrutt kjøring er ikke en bestått test.
- Fast prosessregel: assistenten skal **ikke stoppe før endelig testresultat er kontrollert direkte i GitHub Actions**. Følg nyeste relevante kjøring ved kansellering, og rett eventuelle feil før ferdigmelding.

## Refaktorering av parkvalg og oppstart 2026-10-08
- Fem moduler skilt ut fra app-core.js. Actions 37837436277: completed/success for kodecommit eb87927df0a3bedece0479bffa844bc5575311c2, inkludert geometri/JS og desktop/mobil.
- Stier er uendret. PR #2 er fortsatt testgren.
