# POTA-kart – aktiv arbeidsstatus

Sist oppdatert: 2026-10-08.

## Start en ny samtale
Les `PROJECT.md`, `TODO.md` og denne filen på GitHub. Kontroller gjeldende gren og siste commit før arbeid. GitHub er fasiten; ikke rekonstruer status fra chatminne.

## Nåværende oppgave
**Hvaler: erstatte eksisterende stier med brukerens redigerte QGIS-data.**

- Brukeren har godkjent fortløpende GitHub-arbeid i samtalen.
- Sist dokumenterte appversjon: **0.11.0** på `main`. Bekreft aktuell commit før endringer.
- `Hvaler-redigering.gpkg` (og en senere fil omtalt som `Hvaler-redigering(1).gpkg`) er levert i tidligere samtaler, men filinnholdet er **ikke verifisert i denne arbeidsøkten**.
- Ingen Hvaler-import er bekreftet fullført.
- Spjærøy er særlig viktig. Bevar alle stier utenfor Hvaler.
- Endre ikke genererte data alene: oppdater varig datakilde/import og runtime-reserve slik at neste regenerering ikke fjerner redigeringen.

## Neste konkrete handling
1. Skaff tilgang til den nyeste GeoPackage-filen og inspiser lag, CRS, geometri og objekter.
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
