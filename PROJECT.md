# POTA-kart – prosjektkunnskap

Sist gjennomgått: 2026-10-08. **GitHub er fasiten.** Se [STATUS.md](STATUS.md) for siste verifiserte tilstand, [TODO.md](TODO.md) for åpne oppgaver og [HISTORY.md](HISTORY.md) for tidligere arbeidsnotater.

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
- Mobil: kompakt parkboks, aktiveringstall, `pota.app`-lenke og valgfri «Vis detaljer». Ingen separat GPS-informasjonsboks eller egen varselboks om manglende geometri.
- Bakgrunnskart: OpenStreetMap, Esri og satellitt.
- Lokal serverport i bruk skal gi tydelig feilmelding, ikke automatisk bytte port.
- **Stisystemet er satt på vent.** Ikke endre Hvaler-stier, øvrige stier, kilder eller korridorberegning før ny avtale om samlet redesign. Tidligere detaljplaner er historikk, ikke aktiv arbeidsordre.

## Arkitektur
Statisk webapp med Leaflet, Turf og polygon-clipping; ingen egen appserver. `app.js` styrer modulrekkefølgen.

| Område | Viktige filer |
| --- | --- |
| Grensesnitt og oppstart | `index.html`, `styles.css`, `app.js`, `pota-startup.js`, `mobile-ui.js`, `mobile-ui.css` |
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
