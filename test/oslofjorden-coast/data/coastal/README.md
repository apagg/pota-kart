# Oslofjorden.com – separat kyststitest

Dette er en datakildeprøve for NO-2542 Kyststien Østfold. Filen inneholder
Østfold-delen av Oslofjorden.coms KML, inkludert Hvaler. Kyststien i denne
testversjonen erstatter både den gamle GIS-kilden og vårt redigerte Hvaler-lag;
ingen av dem blandes inn. Andre POTA-parker og stier er uendret.

Gangruter (blå og turkise kildestiler) og sykkelalternativer (grønne kildestiler)
brukes i POTA-geometrien. Brukeren godkjente gangrutetesten og ba 2026-10-11 om
at sykkelrutene også tas med. 109 gangruter + 13 sykkelruter gir 122 ruter totalt,
inkludert alle 31 Hvaler-rutene. Alle bruker de vanlige blå/gule/grønne appfargene
og samme 61 m korridor, GPS- og overlappsregler. Ferger og ukjente kategorier
beholdes som kildemetadata, men inngår ikke i geometrien. Kildens rutefarger er
ikke en garanti for offisiell POTA-avgrensning. Testen må vurderes før sammenslåing.

## Husk ved annen eller utvidet bruk

Brukeren oppgir at appen foreløpig brukes privat. Oslofjorden.com oppgir at
materiale kan brukes privat og kommersiell utnyttelse krever skriftlig avtale.
Det er ikke funnet en åpen gjenbrukslisens. Avklar rettigheter med eieren før
eventuell annen, bredere eller kommersiell bruk; dette notatet skal følge dataene.

GitHub-repositoryet og GitHub Pages-testlenken er offentlig tilgjengelige.
Brukeren ble informert om dette og valgte vanlig testlenke 2026-10-11.
Dette valget dokumenterer brukerens bestilling og er ikke tillatelse fra kildeeieren.

Kilde: https://www.oslofjorden.com/geodata/turer_oslofjorden_plain82.kml

Kart: https://www.oslofjorden.com/kyststi/kart_kyststier_oslofjorden.html

Forklaring: https://www.oslofjorden.com/kyststi/forklaring_turkart.html

Vilkår: https://www.oslofjorden.com/om_oss.html

Hentet 2026-10-11. Kildens Last-Modified var 2026-05-26 21:53 UTC. KML-hash og
filterkategori er lagret i GeoJSON-filen. Importer en kontrollert lokal KML med
`python3 scripts/import-oslofjorden-coast.py --input /path/to/source.kml --snapshot-date 2026-10-11 --source-last-modified 2026-05-26T21:53:00Z`.
