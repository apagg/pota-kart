# POTA-kart – prosjektkunnskap

Sist gjennomgått: 2026-10-12. **GitHub er fasiten.** Se [STATUS.md](STATUS.md) for siste verifiserte tilstand, [TODO.md](TODO.md) for åpne oppgaver og [HISTORY.md](HISTORY.md) for tidligere arbeidsnotater.

## Start en ny arbeidsøkt
1. Les `PROJECT.md`, `STATUS.md` og `TODO.md` på GitHub. Kontroller faktisk `main`/arbeidsgren og relevante filer før endring.
2. Diskuter forslag og avtal omfang før app- eller dataendringer. Les bare relevante filer; unngå store kodeutdrag i chatten.
3. Gjør små commits på GitHub, normalt i testgren for app- og dataendringer; avtal sammenslåing med `main`.
4. Dokumenter varige beslutninger i PROJECT, oppgaver i TODO, siste faktiske resultat i STATUS og historikk i HISTORY ved behov. Oppsummer kort i chatten.

## Formål og publisering
Mobilvennlig interaktivt POTA-kart for Norge og Sverige med verifiserte parkgrenser, punkter der geometri mangler, stier, overlapp og GPS.

- Repository: https://github.com/apagg/pota-kart
- Hovedkart: https://apagg.github.io/pota-kart/
- Publisering: GitHub Pages fra `main`.
- Sist dokumentert appversjon: **0.11.0** (kontroller `README.md`, `index.html` og `app.js` ved ny versjon).
- `archive/v0.10.0` bevarer eldre kart. Separate forhåndsvisninger finnes under `test/` og er ikke hovedkartet.

## Varige brukerkrav
- Norge og Sverige støttes. Alle tilgjengelige verifiserte parkgeometrier vises; parker uten verifisert geometri beholdes som punkt.
- Flervalg er på ved oppstart. Parkvalg skal ikke gi automatisk zoom; nytt klikk på valgt park åpner informasjon igjen.
- Musepekerinformasjon på geometri og punkt; overlapp skal vise alle berørte parker (også flere enn to), med mobilvalg ved overlappende trykk.
- Stier: **61 m total korridorbredde** (30,5 m på hver side). Blå som grunnfarge; stier og parker blir grønne når GPS-posisjonen er innenfor. Valg gjør ikke symbolene større; valgt parkpunkt kan markeres mørkere.
- GPS: av → på og følg; dra kartet → GPS fortsatt på, men følging pauses; trykk igjen → følg; trykk mens følging er aktiv → av.
- Mobil: kompakt parkboks, aktiveringstall og `pota.app`-lenke. Håndtaket åpner/lukker parkdetaljer og valgtlisten; egne «Legg til/Fjern» og «Vis detaljer/Vis mindre»-knapper er fjernet etter avtale 2026-10-11. Ingen separat GPS-informasjonsboks eller egen varselboks om manglende geometri.
- Bakgrunnskart: OpenStreetMap, Esri og satellitt.
- Lokal serverport i bruk skal gi tydelig feilmelding, ikke automatisk bytte port.
- **Kyststien Østfold, godkjent 2026-10-11:** Hovedkartet erstatter NO-2542 med Østfold/Hvaler fra Oslofjorden.com. 109 gangruter + 13 sykkelruter = 122 ruter, hvorav 31 Hvaler. Brukeren godkjente gangrutetesten og bestilte sykkelrutene 2026-10-11; ferger utelates. Gamle GIS-/Hvaler-segmenter blandes ikke inn. Andre stier og 61 m korridor bevares. Brukeren godkjente den utvidede testen og bestilte sammenslåing 2026-10-11. Bredere redesign er fortsatt utsatt.

## Arkitektur
Statisk webapp med Leaflet, Turf og polygon-clipping; ingen egen appserver. `app.js` styrer modulrekkefølgen.

| Område | Viktige filer |
| --- | --- |
| Grensesnitt og oppstart | `index.html`, `styles.css`, `app.js`, `pota-startup.js`, `desktop-ui.js`, `mobile-ui.js`, `mobile-ui.css` |
| Kart og GPS | `map-setup.js`, `map-layers.js`, `gps-controller.js` |
| Parker og register | `norway-park-registry.js`, `sweden-park-registry.js`, `sweden-heritage-registry.js`, `pota-park-loader.js` |
| Parkvalg og informasjon | `park-selection-state.js`, `park-selection-controller.js`, `park-info-ui.js`, `park-diagnostics.js`, `pota-activation.js` |
| Geometri og overlapp | `geometry-atlas.js`, `geometry-topology.js`, `geometry-format-utils.js`, `geojson-utils.js`, `polygon-layer-utils.js`, `overlap-engine.js`, `overlap-worker.js` |
| Felles hjelpere og gjenværende integrasjon | `diagnostics.js`, `app-text-utils.js`, `app-core.js`, `pota-cache-bootstrap.js` |
| Data og bygging | `data/pota-NO.json`, `data/pota-SE.json`, `data/geometries/`, `data/kulturminner/`, `data/hvaler/`, `scripts/update-geometries.py`, `scripts/update-kulturminner.py` |

Full geometri lastes for relevante utsnitt ved høyere zoom. Overlapp beregnes med Web Worker. `app-core.js` inneholder fortsatt integrasjon og sti-/overlappslogikk; ikke refaktorer stidelen uten ny avtale.

## Datakilder og dataintegritet
- POTA-referanselister: lokale JSON-data med referanse, navn, posisjon, kildelenke og aktiveringstall.
- Sverige: Naturvårdsverket, blant annet verneområder og Natura 2000.
- Norge: Miljødirektoratets Naturbase, inkludert VV-/FS-/FK-identifikatorer.
- Kulturminner: Riksantikvaren og Geonorge WFS ved behov.
- Stier: Kartverkets Turrutebase/Fotrute og ekstern rutekilde for Kyststien Østfold (NO-2542). Brukerredigerte Hvaler-data har egen kilde og import; se STATUS/HISTORY for tidligere arbeid.

Usikre registerkoblinger skal forbli punkter. Bevar verifiserte kopier ved midlertidige kildefeil, delpolygoner og hull. GeoJSON-koordinater er lengdegrad/breddegrad; kontroller akser ved WFS/EPSG:4326. Ikke beskriv brukerredigerte stier som uendrede offisielle registerdata.

Automatiske arbeidsflyter ligger i `.github/workflows/`. `update-pota-data.yml` oppdaterer POTA-lister og kulturminner daglig; dette er ikke det samme som full regenerering av geometriatlaset. `geometry-preview.yml` validerer kart og nettleseroppførsel ved relevante kodeendringer.

## Ufravikelig kvalitetssikring ved kodeendringer
- Etter **hver kodeendring**: kontroller relevante GitHub Actions-kjøringer til endelig `completed` med `conclusion=success`. En `pending`, `queued`, `in_progress` eller `cancelled` kjøring er **ikke** godkjenning.
- Kontroller relevante geometri-/JavaScript-tester og nettlesertester for PC og mobil; GPS ved relevante endringer. Ved feil: undersøk, rett, commit og følg ny kjøring til endelig resultat.
- Ved nyere commit og kansellert kjøring: følg siste relevante erstatningskjøring. Ved infrastrukturblokkering: dokumenter begrensningen; ikke meld oppgaven ferdig.
- Før kodeoppgaven avsluttes: commit, oppdater PROJECT/TODO/STATUS ved behov, og kontroller også eventuelle nyere relevante CI-kjøringer. Ikke overlat kontrollen til brukeren.
- **Unntak avtalt 2026-10-08:** Ved rene dokumentasjonsendringer uten endring av kode, data eller workflows kreves ingen ny kodetest. Verifiser i stedet at dokumentene er lagret korrekt på GitHub.

## Historikk og regresjonsreferanser
Tidligere test-ID-er, refaktorering, Hvaler-analyse og feilrapporter ligger i [HISTORY.md](HISTORY.md). Kjente kontrollpunkter for senere arbeid omfatter Ramsvikslandet (SE-2071/SE-2073), Kosterhavet (SE-0016), Tofta (SE-0468), Marstrand (SE-0334), mobiloverlapp og ytelse. Tidligere rapporter er ikke automatisk dagens feilstatus.

## Avtalt PC-grensesnitt (2026-10-11)
- PC-grensesnittet er brukertestet og godkjent for `main` 2026-10-11. UI-testgren: `test/pc-ui`; separat testkopi under `test/pc-ui/`. Fremtidige appendringer følger samme test-/godkjenningsflyt.
- Fast venstre sidepanel, 350 px og full høyde; kartet fyller resten. Panelet kan skjules uten automatisk panorering eller zoom.
- Søk øverst. Kompakt parkinfo med referanse, navn, aktiveringer, pota.app og «Vis flere detaljer». Tom parkboks skjules.
- Valgte parker vises som liste med antall når minst én park er valgt; valg fra listen oppdaterer info uten å flytte kartet.
- Ingen PC-popup ved parkvalg; valg ved overlapp vises i sidepanelet. Mouseover beholdes.
- GPS og zoom øverst til høyre på kartet. Sammenleggbare kartinnstillinger (land, bakgrunnskart og flervalg), tegnforklaring og hjelp/teknisk informasjon. Søke-/GPS-feil er synlige selv med lukkede seksjoner.
- Teknisk valg-/overlappsdiagnostikk beregnes først når hjelpseksjonen åpnes på PC. Lukket seksjon skal ikke gjenta kostbare korridor-/arealberegninger ved parkvalg; selve kart-, GPS- og overlappsmotorene bevares.
- Mobiloppsett, parkdata, geometrier, GPS-beregninger, overlapp og hele stisystemet bevares. `desktop-ui.js` styrer kun PC-presentasjonen over 700 px.

## Avtalt mobiltrinn 1 (2026-10-11)
- Egen testgren `test/mobile-ui`; isolert testkart https://apagg.github.io/pota-kart/test/mobile-ui/. Kompakt parkboks med aktiveringer/pota.app og tydelig «Vis detaljer»/«Vis mindre». Utvidelsen viser områdenavn, parktype og tilgjengelig geometri; manglende geometri vises kun inne i utvidet parkboks.
- Generell bruksanvisning og datakilder samles under sammenleggbar hjelp i innstillinger.
- Valgte parker kan åpnes fra listen uten panorering/zoom eller ny lasting av valgt geometri. Gjeldende park markeres; fjerning og tømming har separate knapper.
- Første trinn endrer ikke GPS-/zoomplassering, park-/stidata, geometri-, GPS- eller overlappsfunksjoner. PC-oppsettet skal bevares. Testvisning og eventuell sammenslåing følger avtalt gjennomgang.

- Mobilens kartlag-knapp åpner kun karttypevalg (OpenStreetMap/Esri/satellitt). Innstillinger viser land, flervalg, tegnforklaring og hjelp. Avtalt 2026-10-11 etter brukerens tilbakemelding om to like menyer.

## Avtalt mobil-GPS (2026-10-11)
- Brukeren har bestilt GPS-delen på `test/mobile-ui`: GPS-knapp under zoom til høyre, minst 44 px zoomknapper og synlig tekst for GPS av, søking, følging og pauset følging.
- Knappen bruker eksisterende GPS-kontroller. Dra pauser følging, nytt trykk gjenopptar samme GPS-watch, og trykk under følging slår av. Ingen separat GPS-informasjonsboks.
- PC-oppsettet og GPS-/geometri-/overlappsberegningene bevares. Markering av valgte parker i mobilens overlappsliste er fortsatt utsatt.

## Avtalt samlet mobilfane (2026-10-11)
- Innstillinger flyttes til venstre under søk og karttype. Zoom og GPS blir til høyre.
- Bunnmenyen med Kart, Valgte parker og Innstillinger fjernes. Én opptrekksfane går ned til skjermkanten med safe-area-støtte.
- Lukket fane viser kompakt parkinfo. Utvidet fane viser parkdetaljer og valgtlisten sammen, inkludert antall, gjeldende park, separat fjerning og tømming.
- Karttype og Innstillinger åpner egne visninger i samme fane; lukk går tilbake til kompakt parkinfo. Valg fra listen åpner parkinfo uten panorering/zoom eller ny geometri.
- Endringen prøves på `test/mobile-ui` før eventuell godkjent sammenslåing. PC og kart-/GPS-/geometrilogikk bevares.

- Forenkling godkjent 2026-10-11: fjern begge handlingsknappene fra mobilens parkheader. Håndtaket brukes for å åpne/lukke fanen, kartvalg legger til parker, og fjerning/tømming gjøres i valgtlisten. PC-knappene beholdes.

## Oppstartsvisning (2026-10-11)
- PC-panelet, mobilfanen og mobilverktøyene ligger nå direkte i HTML-en. Den gamle flate infoboksen og rekonstruering med opprinnelige DOM-ankre er fjernet etter brukerens bestilling 2026-10-11.
- En tidlig CSS-regel holder interaktive flater skjult til hendelsene er koblet opp; den brukes ikke til å skjule en gammel reserveboks.
- Oppstartsfeil frigjør skjulingen og vises i et eget feilfelt, også hvis selve app.js ikke kan lastes. Kart-, GPS- og geometrioppførsel bevares.

## Direkte UI-struktur (2026-10-11)
- `index.html` eier PC-sidepanelet, mobilfanen, verktøyknappene, valgliste-/overlappsplasser og innstillingsseksjonene. UI-modulene kobler opp handlinger og oppdaterer informasjon.
- Unike søk-/land-/karttype-/flervalg-/tegnforklarings-/GPS-statusfelt flyttes bare mellom navngitte PC- og mobilplasser. Verdier og lyttere beholdes ved endret skjermbredde.
- PC-modulen flytter ikke innstillings-/hjelpseksjoner eller gjenoppretter den gamle panelrekkefølgen. GPS-knappen har én skjult hjemmeplass på mobil og en Leaflet-kontroll på PC.
- Gammelt flytende panel og gammel mobil reserveboks er fjernet fra CSS. Godkjent utseende og kart-/GPS-/geometrilogikk skal bevares.

## Avtalt parkutseende (2026-10-11)
- Vanlige parkpolygoner har 25 % fyll og 2 px kant, og valgte parkpolygoner har 40 % fyll og 3,5 px kant. Kantens synlighet er fortsatt 90 % i atlaslaget.
- Overlapp beholder 48 % lilla fyll / 25 % grønt fyll og 1 px kant. Stier, stikorridorer og punktmarkører beholder egne innstillinger. GPS-fargene beholdes.
- Brukeren har testet og godkjent parkutseendet og hele mobil-/PC-grensesnittet, og uttrykkelig godkjent sammenslåing til `main` 2026-10-11.

## Godkjent sammenslåing (2026-10-11)
- Mobil-/PC-grensesnitt, samlet mobilfane, GPS-presentasjon, direkte UI-struktur og parkfyll 25 % / 40 % er brukertestet og godkjent for `main` via PR #4.
- Hovedkartet bruker nå denne løsningen. Tidligere trinnbeskrivelser over dokumenterer avtalene; testkopiene er bare øyeblikksbilder. Nye appendringer avtales og testes separat.

## Aktiveringsmarkering (2026-10-11)
- Brukeren ønsker gule parker når minst ett kallesignal i Innstillinger har en godkjent aktivering der. Flere hovedkallesignaler skal kunne legges inn. LB6BK er hovedkallesignal; POTA-profilen inkluderer SM/LB6BK som alternativt kallesignal.
- Manuell CSV-import er avvist fordi aktiveringslisten oppdateres ofte. Automatisk oppdatering er nødvendig. Brukeren har bestilt implementering på egen testgren.
- Offentlig `/profile/{callsign}` gir `other_callsigns`, statistikk og nylig aktivitet. Test med W3AAX (492 aktiveringer) returnerte bare 25 aktiveringsrader, også med `?count=all`. Ikke behandle dette som komplett historikk.
- `/user/stats/activator/park` returnerte HTTP 403 / «Not authorized» uten innlogging. POTA-nettstedet bruker Cognito, men ingen dokumentert tredjepartsinnlogging er funnet; ikke lov en ferdig «Logg inn med POTA»-integrasjon.
- Offentlig `/park/activations/{reference}?count=all` returnerer parkhistorikk med `activeCallsign`, `qso_date` og `totalQSOs`, og CORS `Access-Control-Allow-Origin: *`. Testet med NO-3198 og SE-0016; LB6BK finnes i begge. POTA-nettstedet bruker samme endepunkt for parkhistorikk.
- Implementert og brukertestet på `test/activated-parks`, deretter slått sammen til `main` via PR #5: offentlig profil som rask start, deretter automatisk parkhistorikk for valgte parker og opptil 40 nærliggende parker ved zoomnivå 10 eller høyere. Ett oppslag om gangen, lokal cache og oppfriskning etter 15 minutter. Nettverksfeil beholder tidligere bekreftet status og vises i Innstillinger. Dette gir gradvis historikksjekk; komplett global liste i ett kall er ikke funnet.
- Innstillinger støtter opptil 10 hovedkallesignaler. Profilens alternative kallesignaler tas med automatisk. Minst 10 QSO kreves for gulmarkering. GPS-grønn har prioritet; overlapp og parkfyll/kanttykkelser bevares.
- Testkart: https://apagg.github.io/pota-kart/test/activated-parks/. Kodecommit `3085d6fc346c6aaa5c63e11ff3b7e6a02600998c`, Verify UI Preview `38168302079` og Pages `38168457409` fullførte med success. Live nettleserkontroll bekreftet 9 aktiverte parker for LB6BK og gul NO-3198 med «Aktivert av LB6BK». Dette var første testpublisering. Senere punktfarger, GPS-radius og punktfyll er også brukertestet; sammenslåingen er godkjent 2026-10-11.

## Punktfarger og GPS-radius (avtalt 2026-10-11)
- Brukeren har godkjent aktiveringsvisningen visuelt og bestilt samme blå/gule/grønne farger på punktmarkører. Vanlige punkter er blå, aktiverte gule, og GPS-markering grønne. Valgte punkter får mørkere blå/gul nyanse med samme radius på skjermen.
- Parker uten geometri regnes som innenfor for GPS ved avstand på høyst 100 m fra POTA-referansepunktet. Dette gjelder GPS-status/farge; parker med geometri bruker fortsatt sine faktiske grenser. Ingen parkgrense eller stikorridor utvides.
- Verifisert kode `7e08ec983478efb5d4a3a67e0e2708a2908c70d7`; Verify POTA map `38169748717` fullførte med success. Testene dekker faktisk grønn/blå markør ved 99/101 m, gulmarkering, mørkere valgte punkter med uendret størrelse, grønn prioritet og bevarte geometri-/GPS-/mobilregler.

## Punktfyll (avtalt 2026-10-11)
- Brukeren har visuelt godkjent blå/gule/grønne punkter og 100 m GPS-radius. For bedre skille fra parkgeometrien er 90 % fyll godkjent for vanlige punktmarkører og 100 % for valgte punktmarkører. Farger og punktstørrelse beholdes; parkflatene beholder 25 % / 40 % fyll.

## Fullført aktiveringsvisning (2026-10-11)
- Brukeren har godkjent funksjonen, punktfargene, 100 m GPS-radius og punktfyll 90 % / 100 %, og bestilt fullføring. PR #5 er slått sammen med `main`; hovedkartet bruker løsningen.
- Merge `ed4a14c068e24f40de096a541049a4ceea143e95`, Verify POTA map `38171388125`, PR-kontroll `38171232542` og Pages `38171387679` er verifisert med success. Live hovedkart bekreftet nye innstillinger og punktfyll. Testkopien er et øyeblikksbilde; nye app-/dataendringer avtales separat.

## Undersøkt kilde: Oslofjorden.com kyststikart (2026-10-11)
- Brukeren har bestilt en ny undersøkelse av https://www.oslofjorden.com/kyststi/kart_kyststier_oslofjorden.html som kilde til kyststier. Dette er ikke bestilling om å erstatte eksisterende sti-/Hvaler-data eller om samlet redesign.
- HTML setter `karttype="kyststi_plain"`. `/includes/oslofjorden_mapo_v3.js` bruker OpenLayers, OpenStreetMap og KML `https://www.oslofjorden.com/geodata/turer_oslofjorden_plain82.kml`.
- KML hentet og XML-parset: 608 Placemark/LineString, 2 895 870 bytes, SHA-256 `cdfb490ce5a4b9b79de9d92b2d5402ccef9a8d9531c247ed80a69cce849775c6`. HTTP Last-Modified 2026-05-26 21:53 UTC. Navn, beskrivelser, rutelenker, koordinater, mappehierarki og stiler finnes.
- Mappen `turer_oestfold` har 125 rutelinjer / 13 763 koordinater; `Turer Hvaler kommune` har 31 / 1 555 koordinater. Hvaler inkluderer Vesterøy, Asmaløy, Spjærøy, Kirkøy og Søndre Sandøy. `sverige` har 33 linjer. Materialet er ikke dokumentert som alle norske kyststier; inkluderer andre turer, sykkelalternativer, ferger, svenskekysten, Oslofjorden og sørkysten.
- Alternativ `turer_oslofjorden_waypoints82.kml` har de samme 608 rutelinjene og 1 809 interessepunkter. Oversiktskartet bruker plain-filen, ikke waypoint-filen.
- Kartforklaringen https://www.oslofjorden.com/kyststi/forklaring_turkart.html skiller blå merkede/godkjente stier, grønne sykkelalternativer, turkise turmuligheter og mørkerøde ferger. Ikke alle ruter er klassifisert konsekvent ifølge nettstedet. Blått inkluderer også andre godkjente turveier; ikke filtrer kyststier utelukkende etter farge eller navn.
- Rettigheter: https://www.oslofjorden.com/om_oss.html sier materiale kun kan benyttes privat og kommersiell utnyttelse krever skriftlig avtale. Ingen åpen gjenbrukslisens er funnet. Avklar offentlig viderepublisering av rutekoordinater med eieren før eventuell import til offentlig GitHub/Pages.
- Teknisk anbefaling ved avklart bruk: bygg et lokalt GeoJSON-datasett i oppdateringsjobben, behold navn, rute-/områdemetadata, kildelenker, kategorier og dataversjon. HEAD med Origin ga ikke Access-Control-Allow-Origin; direkte nettleserhenting bør ikke være løsningen. POTA-kobling og 61 m korridor kan bruke dagens modell etter separat kvalitetssjekk.
- Dagens runtime har allerede KML-parser, men den beholder bare linje/navn og bruker nærhet/navnescore. Den er ikke tilstrekkelig til trygg, samlet import av denne blandede filen. NO-2542 bruker fortsatt eksisterende GIS-kilde med lokalt Hvaler-erstatningslag; dette er ikke endret.
- Undersøkelsen endret ingen appkode eller rutefil. Den senere bestilte Østfold/Hvaler-kildetesten og valgte erstatningsregler er dokumentert nedenfor; POTA-avgrensning og eventuell utvidet bruk må fortsatt vurderes.

## Oslofjorden-kildesnapshot i hovedkartet og varig rettighetsnotat
Brukeren bestilte en separat test med ny kilde 2026-10-11 og oppgir privat bruk. Etter informasjon om at GitHub Pages er offentlig tilgjengelig, valgte brukeren vanlig testlenke. Dette er ikke en tillatelse fra kildeeieren. Kildens vilkår oppgir privat bruk og skriftlig avtale ved kommersiell utnyttelse; ingen åpen gjenbrukslisens er funnet. **Ved annen, bredere eller kommersiell bruk må rettighetene avklares med Oslofjorden.com.** Notatet følger datasettet i [kildens bruksvilkårsnotat](https://github.com/apagg/pota-kart/blob/main/data/coastal/README.md) og metadata. Testlenke: https://apagg.github.io/pota-kart/test/oslofjorden-coast/. Brukeren har lest vilkårene, oppgir at ikke-kommersiell bruk er akseptabel for ham og bestilte sammenslåing til hovedkartet 2026-10-11. Dette er brukerens vurdering, ikke en ny lisens fra kildeeieren. Det varige notatet om annen/bredere/kommersiell bruk beholdes.

### Fullført sammenslåing av kyststikilden
[PR #6](https://github.com/apagg/pota-kart/pull/6) er slått sammen med merge `7ef44ec4a540c976e66bb9b86e03c3f6c7fc9bd2`. Main-kontroll `38175857227` og Pages `38175857211` fullførte med success. Live hovedkart laster cacheversjon 3 og nøyaktig den verifiserte 122-rutersfilen. `data/coastal/oslofjorden-ostfold-test.geojson` er produksjonssnapshotet (historisk filnavn beholdt), importert av `scripts/import-oslofjorden-coast.py`. Runtime erstatter NO-2542 i både oversikt, full geometri og bbox; eksisterende GIS-/Hvaler-kilder blandes ikke inn. Generell geometriregenerering bytter ikke automatisk dette manuelt kontrollerte KML-snapshotet. Andre stier og bredere redesign er fortsatt utsatt.

## GPS- og kompassretning (2026-10-12)
- Brukeren bestilte pil på GPS-prikken direkte i main, deretter kompassretning også ved stillstand. Tillatelsen til direkte main-arbeid gjelder denne GPS-utvidelsen, ikke andre endringer.
- Kompass har prioritet når telefonen gir gyldig nordreferert orientering. iPhone bruker `webkitCompassHeading`; Android bruker absolutt DeviceOrientation med W3Cs Z-X-Y rotasjonsmatrise. Relativ alpha brukes aldri som kompass. Skjermens orientering tas med; nær vertikal skjerm brukes fremoverretning fremfor en vertikal toppkant.
- GPS-bevegelsesretning er reserve hvis kompass ikke støttes, tillatelse avslås eller data er ugyldige. GPS-reserven skjules ved rapportert fart 0 eller ukjent retning. Kompass kan vises ved stillstand. Ingen retning blir vanlig GPS-prikk.
- Sensorforespørselen gjøres synkront fra GPS-knappens brukertrykk; der nettleseren krever `requestPermission`, bes det om absolutt orientering. Ingen forespørsel ved sidelasting. Sensorfeil blokkerer ikke GPS.
- Sensorlyttere fjernes ved GPS av; gamle tillatelsessvar kan ikke aktivere en avsluttet økt. Bakgrunnsvisning nullstiller kompassprøven. Relativ orientering erstatter ikke en kjent absolutt prøve. Skjermrotasjon og sensoroppdateringer roterer bare pilelementet, uten pan/zoom, ny geolokasjonswatch eller park-/overlappsberegning.
- GPS-prikkens 24 px med kant, nøyaktighetssirkel, følging, pausing og parkregler er bevart. Testene bruker simulerte Safari-/Android-sensordata; faktisk telefonkalibrering og sensortillatelse må prøves på brukerens mobil.
- W3C-grunnlag: https://www.w3.org/TR/orientation-event/. Første GPS-pil uten kompass ble verifisert i kode `9fe9f1cf46999622f0925beea9d23fb6725ef242`, Verify `38251517480` og Pages `38251517203`.

- Kompassimplementering `0ec419624807e8bc60b9593a3d032818511cd971`, Verify POTA map `38253810271` = completed/success. Simulatorer tester iPhone-/Android-data, skjerm-/telefonvinkel, stillstand, GPS-reserve, tillatelse og opprydding. PC-/mobilbilder er kontrollert. Pages `38254637963` = completed/success; live hovedkart bruker gps-compass-1. Publiseringsstatus står i STATUS.md.
