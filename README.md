# POTA Kart 0.10.0

Mobilvennlig webkart for POTA-parker i Norge og Sverige.

## 0.9.0

- Bygger på den stabile POTA Kart v8.19-koden.
- OpenStreetMap og Esri som valgbare bakgrunnskart.
- Mobiltilpasset panel.
- GPS-knapp som viser posisjon og nøyaktighet.
- GPS-kontroll mot valgte parkpolygoner og 61 m korridor for valgte stier.
- Eksisterende flervalg, overlapp, trail- og parkresolving beholdt.

## GitHub Pages

Publiser fra `main`-branchen med GitHub Pages. Siden må kjøres over HTTPS for at mobil nettleser skal gi GPS-tilgang.

## Personvern

GPS-posisjonen behandles lokalt i nettleseren og sendes ikke til dette repositoryet. Eksterne kart- og geodatatjenester vil fortsatt motta vanlige nettverksforespørsler fra nettleseren.


### Kulturminner fra Riksantikvaren

Parker med en Kulturminnesøk-lenke og en numerisk lokalitets-ID bruker først verifisert geometri fra `data/kulturminner/<id>.geojson`. Hvis en lagret kopi mangler, forsøker kartet et direkte oppslag hos Riksantikvaren. Kartet oppgir verifiseringsdato og viser registerets avgrensning; den dekker ikke nødvendigvis hele POTA-området.

Den daglige POTA-oppdateringen oppdager automatisk slike ID-er og kjører `scripts/update-kulturminner.py`. Skriptet bruker Riksantikvarens JSON-API, med det offisielle lokalitetsdatasettet hos Geonorge WFS som reserve. Bare eksakte ID-treff godtas. Registrerte undernummer tas med når registerets egen Kulturminnesøk-lenke bekrefter samme hoved-ID. WFS-delpolygoner og hull beholdes, og EPSG:4326-aksene konverteres fra bredde/lengde til GeoJSONs lengde/bredde. En kildefeil erstatter aldri en tidligere verifisert kopi. `data/kulturminner/index.json` viser hvilke parker som har tilgjengelig geometri og eventuelle oppdateringsfeil. Oppdateringsjobben ber GitHub Pages bygge på nytt etterpå.

Manuelt: `python3 scripts/update-kulturminner.py --attempts 2 --timeout 60`.



### Versjon 0.10.0 – mobilvisning

På skjermbredder opptil 700 px fyller kartet skjermen. Runde knapper åpner søk og kartinnstillinger eller henter egen posisjon. Parkinformasjonen vises i en kompakt boks nederst; dra håndtaket opp eller trykk «Vis detaljer» for å utvide. Bunnmenyen gir tilgang til kart, valgte parker og innstillinger. Enkeltvalg, flervalg, fjerning, registergrenser og overlappsdiagnostikk bruker de eksisterende kartfunksjonene. På større skjermer brukes sidepanelet.

`preview-mobile.html` viser appen i en 390 × 844 px ramme for kontroll på en datamaskin.
