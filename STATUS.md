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

## Neste konkrete handling
1. Sammenlign lokal GeoPackage med GitHub-kopien, kontroller geografisk utstrekning, topologi og duplikater i `hvaler_tillegg`.
2. Sammenlign med eksisterende Hvaler-stier og avgrens sikker utskifting.
3. Lag endring i testgren, test, commit og oppdater alle tre dokumentene.
4. Del testresultat med brukeren før eventuell publisering til `main`.

## Regler for korte samtaler
- Les bare nødvendige filer og vis korte oppsummeringer i chatten.
- Lagre hver fullførte deloppgave i GitHub med commit; oppdater `STATUS.md` umiddelbart med utført arbeid, testresultat, gren/commit, blokkeringer og neste steg.
- Oppdater `TODO.md` ved endret oppgavestatus og `PROJECT.md` ved varige tekniske beslutninger.
- Merk eksplisitt hva som er planlagt, utført, testet og publisert. Ikke kall arbeid ferdig før kode og dokumentasjon er lagret.
- Ikke skriv store kodefiler eller datasett i chatten.
- Bruk testgren for app- og dataendringer; avtal overgang til `main`.

## Klar startmelding
«Fortsett POTA-kartet fra GitHub. Les PROJECT.md, TODO.md og STATUS.md. Fortsett neste uferdige Hvaler-oppgave, og lagre arbeidet fortløpende på GitHub. Hold chatten kort.»
