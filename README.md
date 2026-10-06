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

## Versjon 0.11.0 – prøvevisning med alle geometriene

Utvikles på `feature/all-park-geometries`. Testadressen er
`https://apagg.github.io/pota-kart/test/all-geometries/`.
Hovedkartet endres ikke av testpubliseringen.

Alle parker i valgt land vises med lagret, verifisert registergeometri. Parker
uten geometri beholder POTA-punktet. Oversiktsgrensene er forenklet for rask
lasting; fra zoomnivå 10 lastes full geometri for kartutsnittet. Parkvalg og
analysen bruker full geometri. Kyststien beholder sitt 61 meter brede belte.
Ved overlapp kan man velge mellom alle parkene under trykkpunktet.

`python3 scripts/update-geometries.py` henter Naturbase via bekreftet VV/FS/FK-ID,
lagrede kulturminner via kulturminne-ID og svenske registerdata via ID eller
entydig eksakt navn nær POTA-posisjonen. Usikre koblinger beholdes som punkter.
En kildefeil beholder forrige verifiserte kopi hvis POTA-kildelenken er den samme.
`data/geometries/*-index.json` dokumenterer tilgjengelig geometri og mangler.

Arbeidsflyten `Build geometry test map` klargjør data, kjører geometri- og
nettlesertester, lagrer data på feature-branchen og kopierer deretter kun
prøvevisningen til `test/all-geometries` på hovedbranchen. Den kan kjøres manuelt
for å oppdatere data og testpubliseringen.
