/* ==========================================================
   QUIZ "Jaką jesteś stałą?" (wersja robocza)
   Każda odpowiedź daje punkt jednej stałej (cup = key z cups.js:
   "pi", "e", "h" albo "k"). Wygrywa stała z największą liczbą punktów.
   Pytania można dopisywać i usuwać. Liczba odpowiedzi może być dowolna.
   results: krótki "charakter" każdej stałej, pokazywany na końcu.
   ========================================================== */

window.MM_QUIZ = [
  {
    q: { en: "It's Friday evening. You are most likely...", pl: "Piątek wieczór. Najpewniej..." },
    a: [
      { en: "starting a conversation that lasts until 3 a.m.", pl: "zaczynasz rozmowę, która potrwa do 3 w nocy", cup: "pi" },
      { en: "at the same place with the same friends, and it gets better every week", pl: "siedzisz w tym samym miejscu z tymi samymi znajomymi i co tydzień jest lepiej", cup: "e" },
      { en: "at home, finally sorting out one small thing", pl: "jesteś w domu i wreszcie ogarniasz jedną drobną sprawę", cup: "h" },
      { en: "at a party that got way too hot", pl: "jesteś na imprezie, na której zrobiło się za gorąco", cup: "k" }
    ]
  },
  {
    q: { en: "Your desk right now:", pl: "Twoje biurko w tej chwili:" },
    a: [
      { en: "Notes full of circles and doodles.", pl: "Notatki pełne kółek i bazgrołów.", cup: "pi" },
      { en: "A pile that keeps growing.", pl: "Stos, który ciągle rośnie.", cup: "e" },
      { en: "Perfect order. Everything has its place.", pl: "Idealny porządek. Wszystko ma swoje miejsce.", cup: "h" },
      { en: "Organised chaos.", pl: "Uporządkowany chaos.", cup: "k" }
    ]
  },
  {
    q: { en: "Pick a superpower.", pl: "Wybierz supermoc." },
    a: [
      { en: "Never running out of things to say", pl: "Nigdy nie brakuje ci tematów", cup: "pi" },
      { en: "Getting a little better at everything, every day", pl: "Codziennie robisz małe postępy we wszystkim", cup: "e" },
      { en: "Seeing the world at the scale of atoms", pl: "Widzisz świat w skali atomów", cup: "h" },
      { en: "Controlling temperature", pl: "Kontrolujesz temperaturę", cup: "k" }
    ]
  },
  {
    q: { en: "In a group project you are the one who...", pl: "W projekcie grupowym to ty..." },
    a: [
      { en: "keeps the discussion going", pl: "podtrzymujesz dyskusję", cup: "pi" },
      { en: "makes steady progress every day", pl: "codziennie robisz stały postęp", cup: "e" },
      { en: "checks every detail", pl: "sprawdzasz każdy szczegół", cup: "h" },
      { en: "brings the energy at 2 a.m. before the deadline", pl: "wnosisz energię o 2 w nocy przed terminem", cup: "k" }
    ]
  },
  {
    q: { en: "Choose a place to talk.", pl: "Wybierz miejsce do rozmowy." },
    a: [
      { en: "A long walk with no destination", pl: "Długi spacer bez celu", cup: "pi" },
      { en: "Your favourite café, as always", pl: "Ulubiona kawiarnia, jak zawsze", cup: "e" },
      { en: "A quiet corner", pl: "Cichy kąt", cup: "h" },
      { en: "Next to the ping-pong table", pl: "Przy stole do ping-ponga", cup: "k" }
    ]
  },
  {
    q: { en: "How do you drink your tea?", pl: "Jak pijesz herbatę?" },
    a: [
      { en: "Refilled again and again", pl: "Dolewam bez końca", cup: "pi" },
      { en: "A little stronger every time", pl: "Za każdym razem trochę mocniejszą", cup: "e" },
      { en: "Exactly the same way, measured to the gram", pl: "Zawsze tak samo, odmierzoną co do grama", cup: "h" },
      { en: "Very hot or iced, never lukewarm", pl: "Bardzo gorącą albo z lodem, nigdy letnią", cup: "k" }
    ]
  },
  {
    q: { en: "Your phone's photo gallery is mostly...", pl: "W twojej galerii zdjęć jest głównie..." },
    a: [
      { en: "screenshots of conversations", pl: "zrzuty ekranu z rozmów", cup: "pi" },
      { en: "before-and-after photos", pl: "zdjęcia „przed i po”", cup: "e" },
      { en: "close-ups of tiny things", pl: "zbliżenia drobnych rzeczy", cup: "h" },
      { en: "concerts and parties", pl: "koncerty i imprezy", cup: "k" }
    ]
  }
];

window.MM_QUIZ_RESULTS = {
  pi: {
    en: "Endless and never repetitive. Your conversations go on and on, and no two are the same.",
    pl: "Bez końca i bez powtórek. Twoje rozmowy trwają i trwają, a żadna nie jest taka sama."
  },
  e: {
    en: "Natural growth. People like you more the longer they know you, and every conversation with you pays off.",
    pl: "Naturalny wzrost. Im dłużej ktoś cię zna, tym bardziej cię lubi, a każda rozmowa z tobą procentuje."
  },
  h: {
    en: "Small things, big meaning. You notice the tiny details that everyone else misses.",
    pl: "Małe rzeczy, wielkie znaczenie. Zauważasz drobiazgi, które inni przegapiają."
  },
  k: {
    en: "All about energy and temperature. You bring the warmth, and a little bit of chaos.",
    pl: "Energia i temperatura. Wnosisz ciepło i odrobinę chaosu."
  }
};
