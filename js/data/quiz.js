/* ==========================================================
   QUIZ "Jakim kubkiem jesteś?"
   Każda odpowiedź daje punkt jednemu kubkowi (cup = key z cups.js).
   Wygrywa kubek z największą liczbą punktów.
   Pytania można dopisywać i usuwać. Liczba odpowiedzi może być dowolna.
   ========================================================== */

window.MM_QUIZ = [
  {
    q: { en: "It's Friday evening. You are most likely...", pl: "Piątek wieczór. Najpewniej..." },
    a: [
      { en: "at home with a film and snacks", pl: "jesteś w domu z filmem i przekąskami", cup: "h" },
      { en: "on a spontaneous trip somewhere", pl: "jesteś w spontanicznej podróży", cup: "c" },
      { en: "with the same friends as always", pl: "siedzisz z tymi samymi znajomymi co zawsze", cup: "G" },
      { en: "at a party you heard about an hour ago", pl: "jesteś na imprezie, o której wiesz od godziny", cup: "e" }
    ]
  },
  {
    q: { en: "Your desk right now:", pl: "Twoje biurko w tej chwili:" },
    a: [
      { en: "Perfect order. Everything has a place.", pl: "Idealny porządek. Wszystko ma swoje miejsce.", cup: "h" },
      { en: "Organised chaos. I know where things are.", pl: "Uporządkowany chaos. Wiem, gdzie co jest.", cup: "kB" },
      { en: "Mostly mugs.", pl: "Głównie kubki.", cup: "NA" },
      { en: "Desk? I work on the bed.", pl: "Biurko? Pracuję na łóżku.", cup: "c" }
    ]
  },
  {
    q: { en: "Pick a superpower.", pl: "Wybierz supermoc." },
    a: [
      { en: "Teleportation", pl: "Teleportacja", cup: "c" },
      { en: "Reading minds", pl: "Czytanie w myślach", cup: "e" },
      { en: "Stopping time", pl: "Zatrzymywanie czasu", cup: "kB" },
      { en: "Making copies of yourself", pl: "Robienie swoich kopii", cup: "NA" }
    ]
  },
  {
    q: { en: "In a group project you are the one who...", pl: "W projekcie grupowym to ty..." },
    a: [
      { en: "checks every detail", pl: "sprawdzasz każdy szczegół", cup: "h" },
      { en: "keeps everyone together", pl: "trzymasz wszystkich razem", cup: "G" },
      { en: "has ten ideas a minute", pl: "masz dziesięć pomysłów na minutę", cup: "e" },
      { en: "does it all the night before", pl: "robisz wszystko noc przed terminem", cup: "kB" }
    ]
  },
  {
    q: { en: "Choose a place to talk.", pl: "Wybierz miejsce do rozmowy." },
    a: [
      { en: "A quiet café", pl: "Cicha kawiarnia", cup: "G" },
      { en: "A long walk", pl: "Długi spacer", cup: "c" },
      { en: "A ping-pong table", pl: "Stół do ping-ponga", cup: "e" },
      { en: "A big table full of people", pl: "Duży stół pełen ludzi", cup: "NA" }
    ]
  },
  {
    q: { en: "How do you drink your tea?", pl: "Jak pijesz herbatę?" },
    a: [
      { en: "Exactly the same way every time", pl: "Zawsze dokładnie tak samo", cup: "h" },
      { en: "Whatever is in the cupboard", pl: "Co jest w szafce", cup: "kB" },
      { en: "With someone, never alone", pl: "Z kimś, nigdy w pojedynkę", cup: "G" },
      { en: "Iced, even in December", pl: "Z lodem, nawet w grudniu", cup: "c" }
    ]
  },
  {
    q: { en: "Your phone's photo gallery is mostly...", pl: "W twojej galerii zdjęć jest głównie..." },
    a: [
      { en: "screenshots of notes", pl: "zrzuty ekranu z notatek", cup: "h" },
      { en: "people", pl: "ludzie", cup: "G" },
      { en: "food", pl: "jedzenie", cup: "NA" },
      { en: "memes", pl: "memy", cup: "e" }
    ]
  }
];
