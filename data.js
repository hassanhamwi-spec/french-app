// Lesson content for the family French app (Phase 1).
// Source: photos of the Lebanese grade 2 books (CRDP). Arabic-letter pronunciation is APPROXIMATE: the audio is the reference.
window.APP_DATA = {
  lessons: [
    {
      id: "instr",
      book: "كل الكتب",
      icon: "🗣️",
      color: "#7c4dff",
      titleAr: "كلمات التعليمات",
      titleFr: "Les consignes",
      intro: "هالكلمات بتتكرر بكل الكتب والتمارين. إذا فهمتيها بتفهمي شو مطلوب من ابنك بأي تمرين.",
      script: [
        "اسمعي الكلمة مرتين (عادي وبطيء) وكرريها بصوت عالي.",
        "اقري المعنى وشو لازم يعمل الولد.",
        "افتحي أي تمرين بالكتاب ودوري على كلمة التعليمات بأول السطر.",
        "قولي له بالعربي شو مطلوب، وبعدين بالفرنسي: «Relie!» وخليه يعيدها معك."
      ],
      words: [
        { fr: "Relie", say: "Relie", p: "رولي", m: "وصّل (بخط)" },
        { fr: "Entoure", say: "Entoure", p: "أنتور", m: "حوّط (حط دايرة)" },
        { fr: "Colorie", say: "Colorie", p: "كولوري", m: "لوّن" },
        { fr: "Complète", say: "Complète", p: "كونبليت", m: "كمّل (الناقص)" },
        { fr: "Remets dans l'ordre", say: "Remets dans l'ordre", p: "رومي دان لوردر", m: "رتّب" },
        { fr: "Recopie", say: "Recopie", p: "روكوبي", m: "أعد كتابتها (انسخ)" },
        { fr: "Marque", say: "Marque", p: "مارك", m: "حط إشارة / علّم" },
        { fr: "Écris", say: "Écris", p: "إيكري", m: "اكتب" },
        { fr: "Associe", say: "Associe", p: "أسوسيه", m: "طابق / اربط" },
        { fr: "Cite", say: "Cite", p: "سيت", m: "اذكر" },
        { fr: "Observe", say: "Observe", p: "أوبسيرف", m: "لاحظ / تفرّج منيح" },
        { fr: "Combien ?", say: "Combien ?", p: "كونبيان", m: "كم؟" },
        { fr: "Pourquoi ?", say: "Pourquoi ?", p: "بوركوا", m: "ليش؟" },
        { fr: "Comment ?", say: "Comment ?", p: "كومان", m: "كيف؟" },
        { fr: "Qui ?", say: "Qui ?", p: "كي", m: "مين؟" },
        { fr: "Attention !", say: "Attention !", p: "أتانسيون", m: "انتبه!" },
        { fr: "Voici", say: "Voici", p: "فواسي", m: "ها هو / ها هي" },
        { fr: "Il y a", say: "Il y a", p: "إيل ي آ", m: "في / يوجد" },
        { fr: "On discute", say: "On discute", p: "أون ديسكيت", m: "نتناقش" },
        { fr: "Révisons", say: "Révisons", p: "ريفيزون", m: "لنراجع" },
        { fr: "Vérifie tes connaissances", say: "Vérifie tes connaissances", p: "فيريفي تي كونيسانس", m: "تأكّد من معلوماتك" }
      ]
    },

    {
      id: "ch",
      book: "Le Voyage des mots",
      icon: "🔤",
      color: "#ef6c00",
      titleAr: "صوت ch (الوحدة 3)",
      titleFr: "Le son [ch]",
      intro: "حرفين ch بالفرنسي بيعطوا صوت «ش» متل الشين العربية. بالتمرين بالكتاب لازم الولد يلوّن أو يحوّط الكلمة اللي فيها هالصوت.",
      script: [
        "قولي: ch = ش. كرري شا، شـِ، شو (بشفايف مدوّرة)، شي.",
        "اسمعي كل كلمة وشوفي الحرفين ch بالكتابة.",
        "خليه يسمع الكلمة ويقول إذا سمع «ش» أو لا.",
        "تمرين الكتاب 5: حوّطوا الكلمات اللي فيها ch (شوفي الجواب تحت)."
      ],
      sounds: [
        { fr: "cha", say: "cha", p: "شا" },
        { fr: "che", say: "che", p: "شـِ (خفيفة)" },
        { fr: "chu", say: "chu", p: "شو (قولي «شي» بشفايف مدوّرة)" },
        { fr: "chi", say: "chi", p: "شي" }
      ],
      words: [
        { fr: "un champion", say: "un champion", p: "أن شامبيون", m: "بطل", ch: true },
        { fr: "la machine", say: "la machine", p: "لا ماشين", m: "الآلة", ch: true },
        { fr: "un chalet", say: "un chalet", p: "أن شاليه", m: "بيت خشبي (شاليه)", ch: true },
        { fr: "un chemin", say: "un chemin", p: "أن شومان", m: "طريق", ch: true },
        { fr: "une chenille", say: "une chenille", p: "أون شونّي", m: "يسروع (دودة صغيرة)", ch: true },
        { fr: "un chapeau", say: "un chapeau", p: "أن شابو", m: "قبّعة", ch: true },
        { fr: "un chat", say: "un chat", p: "أن شا", m: "قط", ch: true },
        { fr: "une chemise", say: "une chemise", p: "أون شومِيز", m: "قميص", ch: true },
        { fr: "un parachute", say: "un parachute", p: "أن باراشوت", m: "مظلّة (باراشوت)", ch: true },
        { fr: "une machine à laver", say: "une machine à laver", p: "أون ماشين آ لافيه", m: "غسّالة", ch: true },
        { fr: "la clé", say: "la clé", p: "لا كليه", m: "المفتاح", ch: false },
        { fr: "la classe", say: "la classe", p: "لا كلاس", m: "الصف", ch: false },
        { fr: "un hibou", say: "un hibou", p: "أن إيبو", m: "بومة", ch: false },
        { fr: "un livre", say: "un livre", p: "أن ليفر", m: "كتاب", ch: false },
        { fr: "l'hiver", say: "l'hiver", p: "ليفير", m: "الشتاء", ch: false }
      ],
      keys: [
        { q: "تمرين 5: حوّط الكلمة إذا شفت «ch»", a: "فيها ch (بتنحوّط): champion، machine، chenille، chalet، chemin. ما فيها ch: clé، classe، hibou، livre، hiver. انتبهي: ch بـ machine جوّا الكلمة (ma-chine) بس بتعطي نفس صوت الشين." }
      ]
    },

    {
      id: "champignon",
      book: "Le Voyage des mots",
      icon: "🍄",
      color: "#2e7d32",
      titleAr: "قصة الفطر الصغير (الوحدة 3)",
      titleFr: "Le petit champignon",
      intro: "بداية القصة: فطر صغير عايش بالغابة تحت شجرة. بيسمع خطوات فيخبّي حاله ورا العشب، وبيشوف حذاء كبير لولد. الولد بيسلّم عليه، والفطر بيحكي إنو عنده صديق عصفور.",
      script: [
        "اقري الملخص العربي بالأعلى مرة، وبعدين شوفي الصور بالكتاب.",
        "تعلّمي الكلمات الأساسية واحدة واحدة مع الصوت.",
        "اقري جملة جملة من الكتاب، وبعد كل جملة قولي لابنك معناها بالعربي.",
        "اسأليه بالعربي: مين سمع خطوات؟ وين اختبأ؟ مين صاحبه؟ (الجواب: الفطر، ورا العشب، العصفور)."
      ],
      words: [
        { fr: "le petit champignon", say: "le petit champignon", p: "لو بوتي شامبينيون", m: "الفطر الصغير" },
        { fr: "la forêt", say: "la forêt", p: "لا فوريه", m: "الغابة" },
        { fr: "un arbre", say: "un arbre", p: "أن أربر", m: "شجرة" },
        { fr: "un pas / des pas", say: "des pas", p: "دي با", m: "خطوة / خطوات" },
        { fr: "le chemin", say: "le chemin", p: "لو شومان", m: "الطريق" },
        { fr: "une touffe d'herbe", say: "une touffe d'herbe", p: "أون توف ديرب", m: "حزمة عشب" },
        { fr: "une chaussure", say: "une chaussure", p: "أون شوسّير", m: "حذاء" },
        { fr: "un garçon", say: "un garçon", p: "أن غارسون", m: "ولد" },
        { fr: "Bonjour !", say: "Bonjour !", p: "بونجور", m: "صباح الخير / مرحبا" },
        { fr: "un ami", say: "un ami", p: "أن أمي", m: "صديق" },
        { fr: "un moineau", say: "un moineau", p: "أن موانو", m: "عصفور دوري" },
        { fr: "un nid", say: "un nid", p: "أن ني", m: "عش" },
        { fr: "une branche", say: "une branche", p: "أون برانش", m: "غصن" },
        { fr: "une mouche", say: "une mouche", p: "أون موش", m: "ذبابة" },
        { fr: "une chenille", say: "une chenille", p: "أون شونّي", m: "يسروع (دودة صغيرة)" }
      ],
      keys: [
        { q: "تمرين 7: رتّب الكلمات", a: "Le moineau a son nid sur la plus haute branche. = العصفور عشّه على أعلى غصن." },
        { q: "تمرين 9: أي مجموعة كلمات لها معنى؟", a: "Quelqu'un marchait sur le chemin. = واحد كان عم يمشي على الطريق. (الجملتين التانيتين ما إلهم معنى)." }
      ]
    },

    {
      id: "time",
      book: "Le Voyage des mots",
      icon: "📅",
      color: "#00838f",
      titleAr: "أمس واليوم وبكرا",
      titleFr: "Hier, aujourd'hui, demain",
      intro: "بالتمرين 8 لازم يوصّل الوقت (أمس، اليوم، بكرا) مع الجملة المناسبة. الفعل بيتغيّر حسب الوقت.",
      script: [
        "علّميه الكلمات التلاتة مع الصوت.",
        "ارسمي خط زمن بسيط: أمس ← اليوم ← بكرا.",
        "اقري كل جملة وقولي معناها وخليه يحدد إذا صارت أو عم تصير أو رح تصير.",
        "جرّبي بجمل من حياتكم: «Hier j'ai mangé...»."
      ],
      words: [
        { fr: "Hier", say: "Hier", p: "إيير", m: "أمس" },
        { fr: "Aujourd'hui", say: "Aujourd'hui", p: "أوجوردوي", m: "اليوم" },
        { fr: "Demain", say: "Demain", p: "دومان", m: "بكرا" },
        { fr: "je mange au restaurant", say: "je mange au restaurant", p: "جو مونج أو ريستوران", m: "عم آكل (أو باكل) بالمطعم" },
        { fr: "j'ai mangé du poulet", say: "j'ai mangé du poulet", p: "جيه مونجيه دو بوليه", m: "أكلت دجاج" },
        { fr: "je mangerai chez grand-mère", say: "je mangerai chez grand-mère", p: "جو مونجريه شيه غران ميير", m: "رح آكل عند جدّتي" }
      ],
      keys: [
        { q: "تمرين 8: وصّل", a: "Hier ← j'ai mangé du poulet (أمس أكلت دجاج). Aujourd'hui ← je mange au restaurant (اليوم باكل بالمطعم). Demain ← je mangerai chez grand-mère (بكرا رح آكل عند جدتي)." }
      ]
    },

    {
      id: "garden",
      book: "Mon 2nd Livre de Sciences",
      icon: "🌱",
      color: "#558b2f",
      titleAr: "كيف نهتم بالحدائق؟ (علوم)",
      titleFr: "Leçon 3 : Comment prendre soin des jardins ?",
      intro: "الدرس بيحكي كيف أبو سامي بيهتم بحديقته: بيسقي النباتات، بيقلب التراب، بيقلّم الأشجار والشجيرات، وبينظّف الحديقة بأدوات خاصة.",
      script: [
        "طلّعي على الصور الأربعة بالكتاب واسألي ابنك بالعربي: شو عم يعمل البستاني بكل صورة؟",
        "علّميه الأفعال: arroser، retourner، tailler، nettoyer.",
        "علّميه أسماء الأدوات التلاتة: pelle، râteau، pelle-bêche.",
        "إذا عندكم نبتة بالبيت، اسقوها وقولوا: «J'arrose la plante»."
      ],
      words: [
        { fr: "un jardin", say: "un jardin", p: "أن جاردان", m: "حديقة" },
        { fr: "un jardinier", say: "un jardinier", p: "أن جاردينيه", m: "بستاني" },
        { fr: "une plante", say: "une plante", p: "أون بلانت", m: "نبتة" },
        { fr: "arroser", say: "arroser", p: "أروزيه", m: "يسقي" },
        { fr: "retourner la terre", say: "retourner la terre", p: "روتورنيه لا تير", m: "يقلب التراب" },
        { fr: "la terre", say: "la terre", p: "لا تير", m: "التراب / الأرض" },
        { fr: "tailler", say: "tailler", p: "تايّيه", m: "يقلّم" },
        { fr: "un buisson", say: "un buisson", p: "أن بويسّون", m: "شجيرة" },
        { fr: "nettoyer", say: "nettoyer", p: "نيتواييه", m: "ينظّف" },
        { fr: "aérer la terre", say: "aérer la terre", p: "أيريه لا تير", m: "يهوّي التراب" },
        { fr: "un outil", say: "un outil", p: "أن أوتي", m: "أداة" },
        { fr: "la pelle", say: "la pelle", p: "لا بيل", m: "الرفش (مجرفة)" },
        { fr: "le râteau", say: "le râteau", p: "لو راتو", m: "الأداة ذات الأسنان لجمع الأوراق وتسوية التراب" },
        { fr: "la pelle-bêche", say: "la pelle-bêche", p: "لا بيل بيش", m: "رفش الحفر" },
        { fr: "une source de nourriture", say: "une source de nourriture", p: "أون سورس دو نوريتير", m: "مصدر غذاء" },
        { fr: "régulièrement", say: "régulièrement", p: "ريغوليير مان", m: "بانتظام" }
      ],
      keys: [
        { q: "أسئلة «On discute» (2 إلى 5 من نص الدرس)", a: "2: البستاني بيقلب التراب ليهوّيه (aérer). 3: بيقلّم الأشجار والشجيرات ليجمّلها (embellir). 4: بيسقي، بيقلب ويهوّي التراب، بيقلّم، وبينظّف بانتظام. 5: pelle، râteau (وكمان pelle-bêche)." },
        { q: "السؤال 6: Pourquoi est-il important de prendre soin d'un jardin ?", a: "اقتراح من عندنا (مو من الكتاب): لأنو الحديقة بتعطينا غذاء وبتخلّي المكان حلو ونضيف. اسألي معلمة ابنك إذا بدها جواب محدد." },
        { q: "تمرين A: الجدول", a: "من الكتاب: الجواب الأول «source de nourriture» ← «l'arroser régulièrement». الباقي اقتراحات من عندنا: للاستعمال: مكان للنزهة والراحة، تزيين البيت. للاهتمام: نقلب ونهوّي التراب، نقلّم الأشجار، ننظّف الحديقة." }
      ]
    },

    {
      id: "math",
      book: "Construire les Mathématiques",
      icon: "➕",
      color: "#c2185b",
      titleAr: "مسائل الحساب",
      titleFr: "Problèmes (2)",
      intro: "مسائل كلامية بالفرنسي. المهم تفهمي الجملة: مين عنده شو؟ مين بيعطي أو بيضيف؟ وشو بيسأل السؤال؟",
      script: [
        "اقري المسألة بالفرنسي وقولي ابنك معناها بالعربي.",
        "اسأليه: شو العملية؟ (جمع أو طرح).",
        "خليه يحلها على ورقة ويكتب الجواب بالجملة: «Il a ... images».",
        "اشطبي الكلمات الجديدة وارجعي اسمعيها من التطبيق."
      ],
      words: [
        { fr: "Combien ?", say: "Combien ?", p: "كونبيان", m: "كم؟" },
        { fr: "en tout", say: "en tout", p: "أن تو", m: "بالمجموع" },
        { fr: "Il a", say: "Il a", p: "إيل آ", m: "عنده" },
        { fr: "une image", say: "une image", p: "أون إيماج", m: "صورة" },
        { fr: "une bille", say: "une bille", p: "أون بيي", m: "كرية (بِلْية)" },
        { fr: "un bonbon", say: "un bonbon", p: "أن بونبون", m: "حلوى" },
        { fr: "une boîte", say: "une boîte", p: "أون بوات", m: "علبة" },
        { fr: "un timbre", say: "un timbre", p: "أن تانبر", m: "طابع" },
        { fr: "donner", say: "donne", p: "دون", m: "يعطي" },
        { fr: "prendre", say: "prend", p: "بران", m: "ياخد" },
        { fr: "ajouter", say: "ajoute", p: "أجوت", m: "يضيف" },
        { fr: "avancer", say: "avance", p: "أفانس", m: "يتقدّم" },
        { fr: "une case", say: "une case", p: "أون كاز", m: "مربّع / خانة" },
        { fr: "en rouge", say: "en rouge", p: "أن روج", m: "بالأحمر" },
        { fr: "en bleu", say: "en bleu", p: "أن بلو", m: "بالأزرق" },
        { fr: "en vert", say: "en vert", p: "أن فير", m: "بالأخضر" },
        { fr: "en noir", say: "en noir", p: "أن نوار", m: "بالأسود" }
      ],
      keys: [
        { q: "مسألة 1: Ghazi a 38 images. Son frère lui en donne 15.", a: "غازي عنده 38 صورة، وأخوه بيعطيه 15. كم صورة عنده بالمجموع؟ 38 + 15 = 53" },
        { q: "مسألة 2: Karim a 26 billes. Il prend 18 billes à son frère.", a: "كريم عنده 26 كرية وبياخد 18 من أخوه. كم كرية صار عنده؟ 26 + 18 = 44" },
        { q: "مسألة 3: Dans une boîte, il y a 37 bonbons. Hicham en ajoute 18.", a: "بالعلبة 37 حلوى وهشام بيضيف 18. كم حلوى هلأ؟ 37 + 18 = 55" },
        { q: "مسألة 4: Imad est sur la case 46. Il avance de 8 cases.", a: "عماد على المربع 46 وبيتقدّم 8 مربعات. على أي مربع صار؟ 46 + 8 = 54" },
        { q: "مسألة 5: Nabil a 12 timbres. Son frère lui en donne 25, puis 14.", a: "نبيل عنده 12 طابع وأخوه بيعطيه 25 وبعدين 14. كم طابع عنده؟ 12 + 25 + 14 = 51" }
      ]
    }
  ]
};
