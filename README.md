# POTA Kart 0.9.0

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
