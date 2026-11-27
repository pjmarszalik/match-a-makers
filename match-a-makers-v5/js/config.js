/* ==========================================================
   Match(a) Makers - USTAWIENIA STRONY
   Tu zmieniasz daty, godziny, linki, ranking i wyniki głosowania.
   (Przy zmianie dat popraw też plik matcha-makers.ics, patrz niżej.)
   Godziny są w czasie polskim (zima = UTC+01:00).
   ========================================================== */

window.MM_CONFIG = {
  // Nazwa wydarzenia (pokazywana w nagłówku i stopce)
  name: "Match(a) Makers",

  // Dwa dni wydarzenia. Pierwszy = duże odliczanie, drugi = małe pod spodem.
  // UWAGA: jeśli zmienisz daty, zmień je też w pliku matcha-makers.ics.
  // Tam godziny są w UTC: zimą odejmij 1 godzinę (11:30 w Polsce = T103000Z).
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
  leaderboardUrl: "https://script.google.com/macros/s/AKfycbyhCjzDazGBdzZRhi_Zff0zhmEdNop6L1cxPd61mbq9zrDLdDMY3MR8V8t7hxPu3KZz/exec",

  // Duel na żywo (Gra → podzakładka Duel): projekt Firebase z Realtime Database.
  // Te klucze nie są tajne (każda strona z Firebase ma je w kodzie), bazę chronią
  // reguły (Firebase → Realtime Database → Rules, treść w pliku duel-firebase-rules.json).
  // Pusty databaseURL = duel schowany, a zakładki Gry wyglądają jak bez duela.
  duel: {
    apiKey: "AIzaSyD4IA8GLYWTfdO8SP_yaHY-2jZD6P7DzCg",
    authDomain: "match-a-makers-duel.firebaseapp.com",
    databaseURL: "https://match-a-makers-duel-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "match-a-makers-duel",
    storageBucket: "match-a-makers-duel.firebasestorage.app",
    messagingSenderId: "805986901198",
    appId: "1:805986901198:web:d7d61cf5d60508a528c49f"
  },

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
