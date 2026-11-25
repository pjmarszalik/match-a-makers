/* ==========================================================
   KUBKI - kolory i tematy rozmów
   Na razie 4 kubki robocze (placeholder), nazwane od stałych.
   - key: krótka nazwa w adresie (temat.html?k=pi), bez spacji i polskich liter
   - symbol: duży napis na kubku
   - color: kolor kubka (kod HEX, np. "#e2654a")
   - placeholder: true pokazuje etykietę "placeholder". Usuń, gdy kubek jest ostateczny.
   - topic: temat rozmowy; zostaw null, dopóki go nie wybierzecie
   - about: 1-2 zdania, czym jest ta stała
   - fact: jedna ciekawostka; source: skąd jest (link)
   - questions: pytania na start rozmowy. sample: true = etykieta "przykład".
   Kubek można dodać, kopiując cały blok { ... } razem z przecinkiem.
   ========================================================== */

window.MM_CUPS = [
  {
    key: "pi",
    symbol: "π",
    name: { en: "Pi", pl: "Liczba pi" },
    value: "3.14159 26535 89793…",
    color: "#e8a13a",
    placeholder: true,
    topic: null,
    about: {
      en: "The ratio of any circle's circumference to its diameter. Its digits never end and never settle into a repeating pattern.",
      pl: "Stosunek obwodu dowolnego okręgu do jego średnicy. Jej cyfry nigdy się nie kończą i nigdy nie układają się w powtarzający się wzór."
    },
    fact: {
      en: "NASA's Jet Propulsion Laboratory uses only 15 decimal places of π, even for its most precise interplanetary navigation. With 37 decimal places you could calculate the circumference of the observable universe to within the width of a single hydrogen atom.",
      pl: "Laboratorium JPL NASA używa tylko 15 cyfr π po przecinku, nawet do najdokładniejszej nawigacji międzyplanetarnej. Mając 37 cyfr po przecinku, można policzyć obwód obserwowalnego Wszechświata z dokładnością do szerokości jednego atomu wodoru."
    },
    source: { label: "NASA JPL", url: "https://www.jpl.nasa.gov/edu/news/how-many-decimals-of-pi-do-we-really-need/" },
    questions: [
      { en: "What could you talk about for hours?", pl: "O czym możesz mówić godzinami?", sample: true },
      { en: "What is a never-ending project of yours?", pl: "Jaki masz projekt, który nigdy się nie kończy?", sample: true },
      { en: "What is something you never get tired of?", pl: "Co nigdy ci się nie nudzi?", sample: true }
    ]
  },
  {
    key: "e",
    symbol: "e",
    name: { en: "Euler's number", pl: "Liczba Eulera" },
    value: "2.71828 18284 59045…",
    color: "#3f8fd6",
    placeholder: true,
    topic: null,
    about: {
      en: "The number behind natural growth and decay: compound interest, populations, radioactivity. It is the base of the natural logarithm.",
      pl: "Liczba stojąca za naturalnym wzrostem i zanikiem: procentem składanym, populacjami, promieniotwórczością. To podstawa logarytmu naturalnego."
    },
    fact: {
      en: "The 37% rule. If you meet candidates one at a time and must decide on the spot, the best strategy is to let the first 37% (that is 1/e) go by, then pick the first one who beats everyone before. It finds the very best about 37% of the time, and no strategy does better.",
      pl: "Reguła 37%. Jeśli poznajesz kandydatów po kolei i musisz decydować od razu, najlepiej przepuścić pierwsze 37% (czyli 1/e), a potem wybrać pierwszego, który jest lepszy od wszystkich wcześniejszych. Tak trafisz na najlepszego w ok. 37% przypadków i żadna strategia nie da więcej."
    },
    source: { label: "Wikipedia: Secretary problem", url: "https://en.wikipedia.org/wiki/Secretary_problem" },
    questions: [
      { en: "What is something that grew on you over time?", pl: "Co z czasem coraz bardziej ci się podoba?", sample: true },
      { en: "Which small habit has paid off the most for you?", pl: "Który mały nawyk najbardziej ci się opłacił?", sample: true },
      { en: "What would you like to get a little better at every day?", pl: "W czym chcesz codziennie robić małe postępy?", sample: true }
    ]
  },
  {
    key: "h",
    symbol: "h",
    name: { en: "Planck constant", pl: "Stała Plancka" },
    value: "6.626 070 15 × 10⁻³⁴ J·s",
    color: "#e2654a",
    placeholder: true,
    topic: null,
    about: {
      en: "It links the energy of light to its frequency and sets the scale of the quantum world. Max Planck introduced it in 1900 and later called the idea \"an act of desperation\".",
      pl: "Łączy energię światła z jego częstotliwością i wyznacza skalę świata kwantowego. Max Planck wprowadził ją w 1900 roku, a później nazwał ten pomysł „aktem desperacji”."
    },
    fact: {
      en: "Since 20 May 2019 the kilogram has been defined by fixing the value of h. Before that, a kilogram was simply the mass of one platinum-iridium cylinder, kept near Paris since 1889.",
      pl: "Od 20 maja 2019 roku kilogram jest zdefiniowany przez ustaloną wartość h. Wcześniej kilogram był po prostu masą jednego walca z platyny i irydu, przechowywanego pod Paryżem od 1889 roku."
    },
    source: { label: "BIPM", url: "https://www.bipm.org/en/si-base-units/kilogram" },
    questions: [
      { en: "What is something small that made your week better?", pl: "Jaka drobna rzecz poprawiła ci ten tydzień?", sample: true },
      { en: "Which tiny detail do you always notice?", pl: "Jaki drobny szczegół zawsze zauważasz?", sample: true },
      { en: "What is a small thing that makes a big difference for you?", pl: "Jaka mała rzecz robi dla ciebie dużą różnicę?", sample: true }
    ]
  },
  {
    key: "k",
    symbol: "k",
    name: { en: "Boltzmann constant", pl: "Stała Boltzmanna" },
    value: "1.380 649 × 10⁻²³ J/K",
    color: "#8b62c2",
    placeholder: true,
    topic: null,
    about: {
      en: "It connects temperature with the energy of single particles. Since 2019 it is what defines the kelvin.",
      pl: "Łączy temperaturę z energią pojedynczych cząstek. Od 2019 roku to ona definiuje kelwin."
    },
    fact: {
      en: "Boltzmann's entropy formula, S = k log W, is engraved on his grave in Vienna. Yet the k in it was introduced by Max Planck, not by Boltzmann.",
      pl: "Wzór Boltzmanna na entropię, S = k log W, jest wyryty na jego grobie w Wiedniu. A samo k wprowadził Max Planck, nie Boltzmann."
    },
    source: { label: "Wikipedia: Boltzmann's entropy formula", url: "https://en.wikipedia.org/wiki/Boltzmann%27s_entropy_formula" },
    questions: [
      { en: "Summer or winter, and why?", pl: "Lato czy zima i dlaczego?", sample: true },
      { en: "Is your room usually tidy, or is it a high-entropy place?", pl: "Twój pokój jest zwykle posprzątany, czy panuje w nim wysoka entropia?", sample: true },
      { en: "What gives you energy when you are tired?", pl: "Co daje ci energię, kiedy brakuje ci sił?", sample: true }
    ]
  }
];
