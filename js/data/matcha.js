/* ==========================================================
   MATCHA W LICZBACH
   numbers: karty z liczbami. draft: true pokazuje etykietę
   "do sprawdzenia". Gdy sprawdzisz liczbę, usuń "draft: true".
   trueFalse: pytania prawda/fałsz (answer: true albo false).
   ========================================================== */

window.MM_MATCHA = {
  numbers: [
    {
      n: "20–30", unit: { en: "days", pl: "dni" },
      title: { en: "in the shade", pl: "w cieniu" },
      text: { en: "Before harvest the tea bushes are covered from the sun. That makes the leaves darker green and sweeter.", pl: "Przed zbiorem krzewy herbaty są przykrywane przed słońcem. Liście są wtedy ciemniejsze i słodsze." },
      draft: true
    },
    {
      n: "70–80", unit: "°C",
      title: { en: "water, not boiling", pl: "woda, nie wrzątek" },
      text: { en: "Boiling water makes matcha bitter.", pl: "Wrzątek sprawia, że matcha jest gorzka." },
      draft: true
    },
    {
      n: "≈ 2", unit: "g",
      title: { en: "of powder per bowl", pl: "proszku na czarkę" },
      text: { en: "About two scoops of the bamboo spoon, called a chashaku.", pl: "Mniej więcej dwie łyżeczki bambusowej łyżki zwanej chashaku." },
      draft: true
    },
    {
      n: "100", unit: "%",
      title: { en: "of the leaf", pl: "liścia" },
      text: { en: "With regular tea you drink an infusion. With matcha you drink the whole leaf, ground to powder.", pl: "Zwykłą herbatę pijesz jako napar. Matchę pijesz razem z całym liściem zmielonym na proszek." }
    },
    {
      n: "80–120", unit: { en: "prongs", pl: "włosków" },
      title: { en: "on a bamboo whisk", pl: "w bambusowej miotełce" },
      text: { en: "The whisk, called a chasen, is cut from a single piece of bamboo.", pl: "Miotełka, czyli chasen, jest wycinana z jednego kawałka bambusa." },
      draft: true
    },
    {
      n: "≈ 40", unit: { en: "g / hour", pl: "g / godz." },
      title: { en: "from a stone mill", pl: "z kamiennych żaren" },
      text: { en: "Traditional granite mills grind slowly so the powder doesn't heat up.", pl: "Tradycyjne granitowe żarna mielą powoli, żeby proszek się nie nagrzewał." },
      draft: true
    }
  ],

  trueFalse: [
    { q: { en: "Matcha comes from the same plant as black tea.", pl: "Matcha pochodzi z tej samej rośliny co czarna herbata." }, answer: true,
      why: { en: "Both come from Camellia sinensis. The difference is in growing and processing.", pl: "Obie pochodzą z Camellia sinensis. Różnica jest w uprawie i obróbce." } },
    { q: { en: "You should make matcha with boiling water.", pl: "Matchę zalewa się wrzątkiem." }, answer: false,
      why: { en: "Use water around 70–80 °C. Boiling water makes it bitter.", pl: "Woda powinna mieć ok. 70–80 °C. Wrzątek sprawia, że jest gorzka." } },
    { q: { en: "Matcha tea bushes grow in the shade before harvest.", pl: "Krzewy na matchę przed zbiorem rosną w cieniu." }, answer: true,
      why: { en: "Shading for a few weeks makes the leaves greener and sweeter.", pl: "Kilka tygodni w cieniu sprawia, że liście są bardziej zielone i słodsze." } },
    { q: { en: "Matcha is a kind of coffee.", pl: "Matcha to rodzaj kawy." }, answer: false,
      why: { en: "It is green tea, ground into powder.", pl: "To zielona herbata zmielona na proszek." } },
    { q: { en: "The bamboo whisk for matcha is called a chasen.", pl: "Bambusowa miotełka do matchy nazywa się chasen." }, answer: true,
      why: { en: "Chasen is the whisk, chashaku is the spoon.", pl: "Chasen to miotełka, chashaku to łyżeczka." } },
    { q: { en: "With matcha you drink the whole tea leaf.", pl: "Pijąc matchę, pijesz cały liść herbaty." }, answer: true,
      why: { en: "The powder is the ground leaf, so nothing is left behind.", pl: "Proszek to zmielony liść, więc nic nie zostaje w fusach." } }
  ]
};
