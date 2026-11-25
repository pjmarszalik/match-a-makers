/* ==========================================================
   Match(a) Makers - USTAWIENIA STRONY
   To jest jedyny plik, który trzeba zmieniać przy datach,
   godzinach, linkach, rankingu i wynikach głosowania.
   Godziny są w czasie polskim (zima = UTC+01:00).
   ========================================================== */

window.MM_CONFIG = {
  // Nazwa wydarzenia (pokazywana w nagłówku i stopce)
  name: "Match(a) Makers",

  // Dwa dni wydarzenia. Pierwszy = duże odliczanie, drugi = małe pod spodem.
  // UWAGA: jeśli zmienisz daty, zmień je też w pliku matcha-makers.ics
  days: [
    { start: "2026-12-15T11:30:00+01:00", end: "2026-12-15T13:30:00+01:00" },
    { start: "2026-12-16T11:30:00+01:00", end: "2026-12-16T13:30:00+01:00" }
  ],

  // Miejsce: pełna nazwa (stopka, FAQ, kalendarz) i krótka (bąbelek na stronie głównej)
  place: {
    en: "Students' Room (Pokój Studencki), Faculty of Physics, University of Warsaw",
    pl: "Pokój Studencki, Wydział Fizyki Uniwersytetu Warszawskiego"
  },
  placeShort: {
    en: "Students' Room · Physics UW",
    pl: "Pokój Studencki · Fizyka UW"
  },
  address: "ul. Pasteura 5, Warszawa",
  mapUrl: "https://www.openstreetmap.org/search?query=Pasteura%205%20Warszawa",

  // Social media. Zostaw "" jeśli jeszcze nie ma konta, link się wtedy nie pokaże.
  instagram: "",          // np. "https://www.instagram.com/matchamakers.uw/"
  instagramHandle: "",    // np. "@matchamakers.uw"
  email: "",              // np. "matchamakers@gmail.com"

  // Ranking w grze: adres aplikacji Apps Script (kończy się na /exec).
  // Zostaw "", dopóki go nie ma. Gra działa wtedy bez rankingu.
  leaderboardUrl: "",

  // Sukienka: link do oryginalnego zdjęcia (autorka: Cecilia Bleasdale) i ewentualne
  // własne zdjęcie na stronie, np. "img/dress.jpg". Zostaw "", żeby pokazać nasz rysunek.
  dressPhotoUrl: "https://en.wikipedia.org/wiki/The_dress",
  dressImage: "",

  // Sukienka: kiedy strona sama pokaże odsłonięcie (środek drugiego dnia).
  dressRevealAt: "2026-12-16T12:30:00+01:00",

  // Wyniki głosowania na sukienkę z wydarzenia. Wpisz liczby po liczeniu.
  // Zostaw null, dopóki nie ma wyników.
  dressResults: { blueBlack: null, whiteGold: null }
};
