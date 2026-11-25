/* ==========================================================
   KUBKI - kolory i tematy rozmów
   - key: krótka nazwa w adresie (temat.html?k=h), bez spacji i polskich liter
   - symbol: duży napis na kubku
   - color: kolor kubka (kod HEX, np. "#e76f51")
   - topic: temat rozmowy; zostaw null, dopóki go nie wybierzecie
   - questions: pytania na początek rozmowy. sample: true = pokazuje
     etykietę "przykład". Usuń "sample: true", gdy pytanie jest ostateczne.
   Kubek można dodać, kopiując cały blok { ... } razem z przecinkiem.
   ========================================================== */

window.MM_CUPS = [
  {
    key: "h",
    symbol: "h",
    name: { en: "Planck constant", pl: "Stała Plancka" },
    value: "6.626 070 15 × 10⁻³⁴ J·s",
    color: "#e2654a",
    topic: null,
    questions: [
      { en: "What is something small that made your week better?", pl: "Jaka mała rzecz poprawiła ci ten tydzień?", sample: true },
      { en: "What is a tiny habit you would recommend to anyone?", pl: "Jaki mały nawyk polecasz każdemu?", sample: true }
    ]
  },
  {
    key: "c",
    symbol: "c",
    name: { en: "Speed of light", pl: "Prędkość światła" },
    value: "299 792 458 m/s",
    color: "#e8a13a",
    topic: null,
    questions: [
      { en: "If you could be anywhere in the world in a second, where would you go?", pl: "Gdyby dało się w sekundę przenieść gdziekolwiek na świecie, gdzie by to było?", sample: true },
      { en: "What is the fastest decision you ever made that turned out well?", pl: "Jaka była twoja najszybsza decyzja, która okazała się dobra?", sample: true }
    ]
  },
  {
    key: "G",
    symbol: "G",
    name: { en: "Gravitational constant", pl: "Stała grawitacji" },
    value: "6.674 30 × 10⁻¹¹ m³·kg⁻¹·s⁻²",
    color: "#3f8fd6",
    topic: null,
    questions: [
      { en: "What is something that always pulls you back, no matter what?", pl: "Co zawsze cię przyciąga z powrotem, bez względu na wszystko?", sample: true },
      { en: "Which place feels like home to you?", pl: "Które miejsce jest dla ciebie jak dom?", sample: true }
    ]
  },
  {
    key: "e",
    symbol: "e",
    name: { en: "Elementary charge", pl: "Ładunek elementarny" },
    value: "1.602 176 634 × 10⁻¹⁹ C",
    color: "#8b62c2",
    topic: null,
    questions: [
      { en: "What gives you energy on a slow day?", pl: "Co daje ci energię w leniwy dzień?", sample: true },
      { en: "What could you talk about for hours?", pl: "O czym możesz mówić bez końca?", sample: true }
    ]
  },
  {
    key: "kB",
    symbol: "k",
    name: { en: "Boltzmann constant", pl: "Stała Boltzmanna" },
    value: "1.380 649 × 10⁻²³ J/K",
    color: "#de5f97",
    topic: null,
    questions: [
      { en: "Is your room usually tidy, or is it a high-entropy place?", pl: "Twój pokój jest zwykle posprzątany, czy panuje w nim wysoka entropia?", sample: true },
      { en: "Winter or summer, and why?", pl: "Zima czy lato i dlaczego?", sample: true }
    ]
  },
  {
    key: "NA",
    symbol: "N",
    name: { en: "Avogadro constant", pl: "Stała Avogadra" },
    value: "6.022 140 76 × 10²³ mol⁻¹",
    color: "#38557f",
    topic: null,
    questions: [
      { en: "If you could have a huge amount of one thing, what would it be?", pl: "Gdyby można było mieć ogromną ilość jednej rzeczy, co by to było?", sample: true },
      { en: "Do you collect anything? What about as a kid?", pl: "Masz jakąś kolekcję? A w dzieciństwie?", sample: true }
    ]
  }
];
