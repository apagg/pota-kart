# POTA-kart – åpne oppgaver

Sist gjennomgått: 2026-10-08. **Kun aktive eller bevisst utsatte oppgaver** står her. Historiske avkrysninger og gamle CI-kjøringer finnes i [HISTORY.md](HISTORY.md).

## Neste oppgaver – avtal prioritet før implementering
- [ ] Vurder forbedring av nettverksfeilhåndtering og brukervennlige feilmeldinger uten å endre kartets funksjon.
- [ ] Utvid målrettede mobil-, GPS- og ytelsestester; avtal hvilke scenarier som skal prioriteres.
- [ ] Vurder videre opprydding i gjenværende `app-core.js` **uten** å berøre stisystemet eller endre oppførsel.

## Kontroller ved senere relevant arbeid
- [ ] Undersøk mulig avvik mellom ønsket søk (sentrering uten zoom) og kode som kan sette minst zoomnivå 11.
- [ ] Kontroller SE-0016 Kosterhavet, SE-0468 Tofta og SE-0334 Marstrand mot `archive/v0.10.0` ved geometriarbeid.
- [ ] Kontroller Ramsvikslandet SE-2071/SE-2073: ringtopologi, hull og overlapp mot historiske regresjonstall.
- [ ] Mål respons ved mange synlige geometrier og overlapp; verifiser GPS-følging og satellittkart når relevant.

## Utsatt etter brukerbeslutning – hele stisystemet
- [ ] Planlegg senere **samlet redesign av stier** med brukeren. Ikke begynn nå.
- [ ] Ved gjenopptakelse: vurder Hvaler-datasettet `Hvaler-redigering.gpkg` / `hvaler_tillegg`, eksisterende `data/hvaler/`, import, runtime-reserve, kommunegrenseklipping, kryssende segmenter og beskyttelse ved regenerering.
- [ ] Kontroller at stier utenfor Hvaler bevares og at ingen gamle eller dupliserte Hvaler-segmenter gjeninnføres. Bevar 61 m korridor og avtalt GPS-/fargeoppførsel.
- [ ] Avtal testgren, validering og eventuell publisering når stioppgaven gjenopptas. Tidligere godkjenning for direkte arbeid på `main` er ikke en ny bestilling om stiendringer.

## Fast arbeidsregel (ikke en uferdig engangsoppgave)
Kodeendringer skal committes og testes med endelig grønn GitHub Actions-status, inkludert relevante PC-/mobiltester, før ferdigmelding. Dokumentasjonsendringer alene krever ikke kodetest etter særskilt avtale. Se [PROJECT.md](PROJECT.md).
