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
