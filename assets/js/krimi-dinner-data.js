/**
 * KRIMI-DINNER – DATEN UND HILFSFUNKTIONEN FÜR DIE SKRIPTE
 *
 * Die Fälle selbst (Titel, Spieler, Preise, Murdernight-Adressen, Menüs,
 * UTM-Parameter) stehen NUR in data/cases.json. tools/cases.py schreibt sie
 * unten in den Block "Daten" – dort nie von Hand ändern, die nächste
 * Ausführung überschreibt ihn.
 *
 * Karten, Fallseiten und Rezept-Boxen stehen fertig im HTML (ebenfalls von
 * tools/cases.py). Diese Datei brauchen nur noch die Filter auf
 * krimi-dinner.html und die Krimi-Karte im Rezept-Raster
 * (recipes-overview.js).
 *
 * WICHTIG: Diese Seite verkauft die Krimi-Dinner NICHT. Kauf, Download und
 * alles Rechtliche laufen ausschließlich über Murdernight; hier wird nur
 * dorthin verlinkt. Deshalb steht nichts davon in shop-data.js oder in
 * worker/src/catalog.js – die Fälle dürfen nie im Warenkorb landen.
 */

/* Daten (geschrieben von tools/cases.py aus data/cases.json) – NICHT hier ändern. */
var KRIMI_SITE = {
  "name": "Murdernight",
  "lang": "en",
  "base": {
    "en": "https://murdernight.store",
    "de": "https://murdernight.de"
  },
  "paths": {
    "en": {
      "home": "/en",
      "shop": "/en/shop"
    },
    "de": {
      "home": "/",
      "shop": "/shop"
    }
  },
  "utm": {
    "utm_source": "constantinteck",
    "utm_medium": "website",
    "utm_campaign": "krimi-dinner"
  },
  "recipeCampaign": "krimi-dinner-rezept"
};

var KRIMI_CASES = [
  {
    "id": "the-comet-vintage",
    "players": "8–12",
    "hours": 4,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/the-comet-vintage.jpg",
    "moods": [
      "glamorous"
    ],
    "occasions": [
      "new-years-eve",
      "birthday",
      "team-event"
    ],
    "menu": {
      "starter": "baba-ganoush",
      "main": "creamy-roasted-red-pepper-tomato-pasta",
      "dessert": "grape-sorbet"
    },
    "recipes": [
      "grape-sorbet",
      "peach-sorbet",
      "baba-ganoush",
      "creamy-roasted-red-pepper-tomato-pasta"
    ],
    "en": {
      "title": "The Comet Vintage",
      "genre": "Country-house classic",
      "setting": "An old wine estate on the Moselle",
      "path": "/en/mysteries/the-comet-vintage",
      "teaser": "At 10:30 p.m. Konrad von Altenbrunn means to open the last bottle of Comet Wine – at 10:19 he lies dead in the fermentation cellar. A rockslide has cut off the estate, and nobody leaves until morning.",
      "roles": [
        {
          "name": "Henrike von Altenbrunn",
          "role": "Lady of Altenbrunn Estate, hostess of the evening",
          "text": "Henrike has run the house, the books and the guests of Altenbrunn for thirty years, while her husband Konrad lives in the cellar. Tonight she has counted the candles, seated the guests and read every speech beforehand. She is the hostess of the opening of the Comet."
        },
        {
          "name": "Viktor Ahrendt",
          "role": "Construction entrepreneur and wine collector from Cologne",
          "text": "Viktor made a fortune with parking garages and hotels and spends it again on old bottles. He came from Cologne this afternoon and has already mentioned several times what his cellar is worth."
        },
        {
          "name": "Jakob von Altenbrunn",
          "role": "Son of the house, young vintner",
          "text": "Jakob is supposed to take over Altenbrunn one day and only came back from a season in New Zealand on Tuesday. Jakob wants stainless steel instead of oak barrels, labels without a crest, and a father who lets a sentence finish."
        },
        {
          "name": "Kai Brenninger",
          "role": "Insurance appraiser (art and wine)",
          "text": "Kai appraises paintings, watches and wine cellars for an insurer and has insured the Comet bottle for tonight. Kai holds a clipboard as if it were something to hold on to."
        },
        {
          "name": "Sascha Dorn",
          "role": "Sommelier for the evening (certified)",
          "text": "Sascha pours tonight, decants, and is to open the Comet bottle at half past ten, with a hand that must not shake. Sascha can tell a vintage by its scent and a guest by the glass."
        },
        {
          "name": "Dr. Ilka Feldhaus",
          "role": "Wine chemist, head of a testing laboratory",
          "text": "Ilka tests wines for everything that doesn't belong in them and writes the minute next to every measurement. Konrad invited Ilka to take a sample of the Comet Wine after the opening; the meter case is waiting in the vault."
        },
        {
          "name": "Jo Kessler",
          "role": "Wine critic and wine author",
          "text": "Jo is the best-known voice on old Moselle wines, with a column, television appearances and the book “The Night of the Comet.” Jo has known Altenbrunn for years and pulls out the notebook all evening long."
        },
        {
          "name": "Toni Lehnert",
          "role": "Cellar master at Altenbrunn for 35 years",
          "text": "Toni knows every barrel at Altenbrunn by its sound and Konrad since the first day of apprenticeship. The machines of the old wine press have left Toni hard of hearing; anyone who wants something from Toni has to say it twice."
        },
        {
          "name": "Elsbeth Rauen",
          "role": "Vintner from the neighboring estate",
          "text": "Elsbeth works the vineyard sites right next to Altenbrunn, has done so for sixty years, and has knees that can't manage a cellar stairway anymore. She and Konrad have been quarreling since both of them could walk."
        },
        {
          "name": "Luca Reinhold",
          "role": "Viticulture apprentice, second year at Altenbrunn",
          "text": "Luca learns the trade from Toni and helps with serving and clearing tonight. Luca is everywhere and noticed by no one."
        },
        {
          "name": "Mika Sandor",
          "role": "Cook for the evening",
          "text": "Mika has cooked for the big evenings at Altenbrunn for three years and dreams of a restaurant of Mika's own in the old press hall. Tonight's menu is saddle of venison, quince and Riesling sabayon."
        },
        {
          "name": "Leopold Wendland",
          "role": "Auctioneer, owner of the Wendland Auction House in Cologne",
          "text": "In forty years Leopold has brought more famous bottles under the hammer than anyone else in the country and has a story for every one of them. His auction house in Cologne carries his name. He arrived as early as Friday to look over the cellar at Altenbrunn for a catalog."
        }
      ]
    },
    "de": {
      "title": "Der Kometenjahrgang",
      "genre": "Landhaus-Klassik",
      "setting": "Ein altes Weingut an der Mosel",
      "path": "/krimis/der-kometenjahrgang"
    }
  },
  {
    "id": "the-last-sleigh-ride",
    "players": "6–10",
    "hours": 3,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/the-last-sleigh-ride.jpg",
    "moods": [
      "cosy"
    ],
    "occasions": [
      "christmas",
      "birthday",
      "team-event"
    ],
    "seasonal": [
      11,
      12
    ],
    "menu": {
      "starter": "strawberry-smoothie",
      "main": "cheesy-roasted-chicken-wrap",
      "dessert": "fudgy-chocolate-raspberry-banana-bread"
    },
    "recipes": [
      "strawberry-smoothie",
      "cheesy-roasted-chicken-wrap",
      "fudgy-chocolate-raspberry-banana-bread",
      "thick-raspberry-chia-pudding"
    ],
    "en": {
      "title": "The Last Sleigh Ride",
      "genre": "Fairytale",
      "setting": "The Christmas village at the North Pole",
      "path": "/en/mysteries/the-last-sleigh-ride",
      "teaser": "Christmas Eve at the North Pole: just before the midnight flight, Santa is found in his armchair in the map room, as if asleep – and he never wakes up. By the oldest law of the village, no sleigh flies while a wrong goes unanswered.",
      "roles": [
        {
          "name": "Margaret Claus",
          "role": "Santa’s wife, mistress of the house",
          "text": "Margaret runs Santa’s house, tends the Christmas roses in the winter garden and cooks salves and drops for people and animals in her herb room. In the village everyone calls her Mother Claus. Tonight she is hosting the Christmas Eve feast."
        },
        {
          "name": "Brunhild Anvil",
          "role": "sleigh smith",
          "text": "Brunhild has reshod Santa’s sleigh three times already and riveted every harness in the stable with her own hands. Tonight she is helping with the loading in the workshop."
        },
        {
          "name": "Ambrosius Quill",
          "role": "Keeper of the List, archivist",
          "text": "Ambrosius keeps the Great Book, which records who was nice and who was not, and makes the fair copy in stardust ink. Together with the reindeer master he carries one of the two keys to the Star Room."
        },
        {
          "name": "Tannwig Nimble",
          "role": "head elf, master of the toy workshop",
          "text": "Tannwig runs the workshop and knows when every single toy was built and for whom. Tonight the sleigh gets loaded, and Tannwig counts every parcel twice."
        },
        {
          "name": "Jule Bellchime",
          "role": "bell-ringer and keeper of the seal",
          "text": "Jule rings the village bells and every year seals the finished List with green fir wax. No sleigh takes off without Jule’s midnight bells, and wherever Jule goes, the brass bells on the jacket hem jingle along."
        },
        {
          "name": "Sigrun Hornlund",
          "role": "reindeer master",
          "text": "Sigrun grew up in the reindeer stable and knows every animal by name, above all the old lead stag Northstar. Tonight she harnesses the reindeer to the sleigh, and whoever gets in her way hears about it."
        },
        {
          "name": "Ruprecht Rimefrost",
          "role": "Knecht Ruprecht, Santa’s companion",
          "text": "Ruprecht came to the village from the south twenty years ago and rides with Santa every year, carrying the sack and the switch. He speaks little and chops wood when something is weighing on him."
        },
        {
          "name": "Flocke Silversnow",
          "role": "post elf, brings the wish letters",
          "text": "Flocke fetches the world’s wish letters from the Northern Lights Post Office and sorts them for the archive. Letters arrive until the last minute, and Flocke carries each one into the house."
        },
        {
          "name": "Ilvi Starwatch",
          "role": "star reader, navigation",
          "text": "Ilvi reads from the stars and the northern lights which way the sleigh must go, and gives every course exact to the quarter point. Tonight Ilvi is watching the sky through the glass roof of the winter garden."
        },
        {
          "name": "Krümel Sugarglaze",
          "role": "head kitchen elf, gingerbread bakery",
          "text": "Krümel bakes the village’s gingerbread and every year cooks the cocoa the Old Man drinks before the flight. Without Krümel’s kitchen there would be no feast, and Krümel likes hearing that."
        }
      ]
    },
    "de": {
      "title": "Die letzte Bescherung",
      "genre": "Märchenhaft",
      "setting": "Im Weihnachtsdorf am Nordpol",
      "path": "/krimis/die-letzte-bescherung"
    }
  },
  {
    "id": "the-last-night-at-fjell",
    "players": "5–6",
    "hours": 3,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/the-last-night-at-fjell.jpg",
    "moods": [
      "cosy"
    ],
    "occasions": [
      "new-years-eve",
      "birthday"
    ],
    "menu": {
      "starter": "",
      "main": "creamy-one-pan-salmon-pasta",
      "dessert": "blueberry-sorbet"
    },
    "recipes": [
      "creamy-one-pan-salmon-pasta",
      "blueberry-sorbet",
      "thick-blueberry-chia-pudding"
    ],
    "en": {
      "title": "The Last Night at Fjell",
      "genre": "Historical",
      "setting": "A Norwegian mountain hotel, 1928",
      "path": "/en/mysteries/the-last-night-at-fjell",
      "teaser": "A snowstorm, a dead telegraph line and the last evening of Hotel Fjell, 1928. At 10:05 p.m. Consul Halvard Mørk, who has just sold the hotel, is found dead at his desk in the tower room.",
      "roles": [
        {
          "name": "Margit Haugen",
          "role": "Director of the Fjell Mountain Hotel",
          "text": "Margit has run the hotel since 1912 and knows every creaking floorboard in it. Tonight she is giving the farewell dinner for the last guests; as of tomorrow she no longer has a position."
        },
        {
          "name": "Eirik Brekke",
          "role": "the hotel's mountain guide and ski instructor",
          "text": "For eight winters Eirik has led the guests through the high mountains and kept charge of the ski room. He says little, and in any weather he can tell when it is about to turn."
        },
        {
          "name": "Liv Mørk",
          "role": "the Consul's daughter",
          "text": "Liv grew up in the hotel and has kept house for her father since her mother died. She learned of the hotel's sale from the newspaper."
        },
        {
          "name": "Doctor S. Aas",
          "role": "a doctor from Bergen, regular guest",
          "text": "Doctor Aas has a practice in Bergen and has come to Fjell for two weeks every winter for many years, always staying in Room 7. In the house Aas is thought of as quiet, helpful and a good listener."
        },
        {
          "name": "Jo Vik",
          "role": "takes photographs for an illustrated magazine from Oslo",
          "text": "Jo Vik is here to photograph the hotel's last evening for an illustrated magazine and has set up a darkroom in the old linen room. It is Jo's first time at Fjell, and Jo looks at everything very closely."
        },
        {
          "name": "Nils Ødegaard",
          "role": "stationmaster of the Fjell railway stop",
          "text": "For twenty years Nils has kept the little stop below the hotel, with its telegraph and its signal lamps. He likes to tell how things used to be on the line. Tonight the storm has left him stranded at the hotel."
        }
      ]
    },
    "de": {
      "title": "Die letzte Nacht in Fjell",
      "genre": "Historisch",
      "setting": "Ein norwegisches Berghotel, 1928",
      "path": "/krimis/die-letzte-nacht-in-fjell"
    }
  },
  {
    "id": "radio-silence-on-ares",
    "players": "6–8",
    "hours": 3,
    "difficulty": "medium",
    "price": 8.99,
    "image": "assets/img/krimi/radio-silence-on-ares.jpg",
    "moods": [
      "scifi"
    ],
    "occasions": [
      "new-years-eve",
      "birthday"
    ],
    "menu": {
      "starter": "dragon-fruit-smoothie",
      "main": "peanut-spicy-udon",
      "dessert": "dragonfruit-mango-sorbet"
    },
    "recipes": [
      "dragon-fruit-smoothie",
      "peanut-spicy-udon",
      "dragonfruit-mango-sorbet"
    ],
    "en": {
      "title": "Radio Silence on Ares",
      "genre": "Sci-fi",
      "setting": "A Mars station in 2152",
      "path": "/en/mysteries/radio-silence-on-ares",
      "teaser": "Mars, 2152: a storm has sealed the main airlock and cut all contact with Earth. At 10:07 p.m. Commander Marit Halvorsen is found dead in the observation dome – and there are no police up here.",
      "roles": [
        {
          "name": "Kim Varga",
          "role": "Head of Supply and Galley",
          "text": "Kim keeps the supplies in order and turns freeze-dried rations into meals the crew talks about for days afterward. Tonight Kim has invited everyone to dinner in the mess."
        },
        {
          "name": "Dario Ferrante",
          "role": "Shuttle Pilot",
          "text": "Dario flies the shuttle between the station and orbit and considers himself the best pilot on Mars. In the storm he is stuck like everyone else, and bored out of his mind."
        },
        {
          "name": "Dr. Yuki Hartmann",
          "role": "Head of Geology and Drilling Program",
          "text": "Yuki led the deepest drilling operation on Mars; the first drill core from 400 meters down is her pride and joy. Without her drilling program, the station would not exist."
        },
        {
          "name": "Sanna Kowalczyk",
          "role": "Communications and Navigation Officer",
          "text": "Sanna is the voice of the station: every message from Earth crosses her desk. Since the antenna failed in the storm, she has been trying to get it working again."
        },
        {
          "name": "Ezra Moll",
          "role": "Botany and Hydroponics",
          "text": "Ezra tends the greenhouse that grows every fresh tomato on the station and talks to the plants when no one is listening. Ezra is the youngest crew member."
        },
        {
          "name": "Dr. Lena Okafor",
          "role": "Station Physician",
          "text": "Lena patches up cuts, measures radiation doses and knows every crew member's medical file. She's the first one people call and the last to leave."
        },
        {
          "name": "Tomás Reyes",
          "role": "Chief Engineer, Life Support and Power",
          "text": "Tomás keeps the air, water and power running and knows every pipe on the station by its first name. Since the storm he barely sleeps."
        },
        {
          "name": "Viktor Sandström",
          "role": "Envoy of the Operating Company (Nereid Consortium)",
          "text": "Viktor has been on Ares for two weeks, sent by the consortium to assess whether the station is still worth it. He is polite, well dressed and asks a lot of questions."
        }
      ]
    },
    "de": {
      "title": "Funkstille auf Ares",
      "genre": "Sci-Fi",
      "setting": "Eine Marsstation im Jahr 2152",
      "path": "/krimis/funkstille-auf-ares"
    }
  },
  {
    "id": "witching-hour-at-ravenmoor",
    "players": "6–7",
    "hours": 3,
    "difficulty": "medium",
    "price": 8.99,
    "image": "assets/img/krimi/witching-hour-at-ravenmoor.jpg",
    "moods": [
      "spooky"
    ],
    "occasions": [
      "halloween"
    ],
    "menu": {
      "starter": "",
      "main": "creamy-sucuk-carbonara",
      "dessert": "healthy-raspberry-chocolate-nice-cream"
    },
    "recipes": [
      "creamy-sucuk-carbonara",
      "healthy-raspberry-chocolate-nice-cream"
    ],
    "en": {
      "title": "Witching Hour at Ravenmoor",
      "genre": "Historical",
      "setting": "A haunted castle, Halloween 1986",
      "path": "/en/mysteries/witching-hour-at-ravenmoor",
      "teaser": "Halloween 1986, live from Scotland's most haunted castle: in the middle of the broadcast, horror-show host Desmond Crane is found dead. The storm has flooded the only bridge to the mainland.",
      "roles": [
        {
          "name": "Morgan Ravenmoor",
          "role": "Lord/Lady of Ravenmoor Castle, host of the ball",
          "text": "Morgan Ravenmoor is the last member of a family that has lived at Ravenmoor Castle for seven centuries. Tonight Morgan hosts the great ball, exactly two hundred years to the day after the fall of the Grey Lady, and all of Great Britain is meant to watch on television."
        },
        {
          "name": "Jamie Blackwood",
          "role": "Camera Operator for the show",
          "text": "Jamie Blackwood is the camera for \"Witching Hour\" — twenty years old, on the team since 1985, and quicker with a cable than most are with a match. Jamie prefers to see the world through the viewfinder."
        },
        {
          "name": "Father Callum Doyle",
          "role": "The village's Catholic priest",
          "text": "Father Callum Doyle has been the priest in the village below Ravenmoor for two years. Desmond Crane invited him to bless the Tower Room before the broadcast, and Father Doyle came because he felt someone here ought to watch over the souls."
        },
        {
          "name": "Robin Hale",
          "role": "Producer, \"Witching Hour with Desmond Crane\"",
          "text": "Robin Hale has produced \"Witching Hour\" since 1984 — the show that brings half of Britain to the television on Friday nights. Without Robin, there is no broadcast schedule, no budget, and no coffee in the Broadcast Van."
        },
        {
          "name": "Sam Kincaid",
          "role": "Bestselling Horror Author, Guest of Honor",
          "text": "Sam Kincaid has conquered the bestseller lists with three horror novels and has been called, for years now, the darkest voice in British literature by the press. Morgan invited Sam to Ravenmoor as the guest of honor — for the press, and for the atmosphere of the evening."
        },
        {
          "name": "Dr. Evelyn Shaw",
          "role": "Parapsychologist, scientific advisor to the show",
          "text": "Dr. Evelyn Shaw measures what others only feel: cold spots, humidity, electromagnetic fields. For the past year she has been the scientific advisor to \"Witching Hour,\" and tonight she has set up her equipment at the most famous haunted site in Scotland. She doesn't trust feelings. She trusts logs."
        },
        {
          "name": "Madame Lucinda Vane",
          "role": "Medium and Spiritist",
          "text": "Madame Lucinda Vane has spoken to the dead for thirty years, or so her calling card says. She has been a guest at Ravenmoor for three weeks now, brought in to calm the Grey Lady, and tonight she means to show everyone what she can do."
        }
      ]
    },
    "de": {
      "title": "Geisterstunde auf Ravenmoor",
      "genre": "Historisch",
      "setting": "Ein Spukschloss, Halloween 1986",
      "path": "/krimis/geisterstunde-auf-ravenmoor"
    }
  },
  {
    "id": "murder-before-hibernation",
    "players": "5–7",
    "hours": 3,
    "difficulty": "medium",
    "price": 8.99,
    "image": "assets/img/krimi/murder-before-hibernation.jpg",
    "moods": [
      "cosy"
    ],
    "occasions": [
      "birthday",
      "halloween"
    ],
    "menu": {
      "starter": "granola-berry-smoothie-bowl",
      "main": "creamy-roasted-red-pepper-tomato-pasta",
      "dessert": "chocolate-banana-ice-cream"
    },
    "recipes": [
      "granola-berry-smoothie-bowl",
      "chocolate-banana-ice-cream",
      "thick-mango-chia-pudding"
    ],
    "en": {
      "title": "Murder Before Hibernation",
      "genre": "Fairytale",
      "setting": "An autumn forest of talking animals",
      "path": "/en/mysteries/murder-before-hibernation",
      "teaser": "Bruno Bear's farewell supper before hibernation: honey wine, mushroom wreaths and a table full of talking forest animals – almost all of them with something to hide. Soon after the toast the mood is gone, and nobody can leave the forest before dawn.",
      "roles": [
        {
          "name": "Bruno Bear",
          "role": "Elder of the Forest, honey brewer and host of the Honeypaw",
          "text": "Bruno is big, good-natured and tired by nature; for weeks he has been longing for his hibernation. His honey wine is famous all over the forest, his memory in autumn is not."
        },
        {
          "name": "Mika Roe",
          "role": "Forest Courier",
          "text": "Mika carries the mail through the whole forest and knows every path and every sender. Mika is faster on the runs than in conversation, but not by much, and flinches at every crack in the underbrush."
        },
        {
          "name": "Frieda Fox",
          "role": "Tracker and honorary Forest Police Officer",
          "text": "Frieda reads tracks the way other people read the newspaper. Because she is a fox, she is the first to be suspected of every misdeed in the forest, and she takes it with dry humor."
        },
        {
          "name": "Hanna Magpie",
          "role": "Curio dealer and collector (anything that glitters)",
          "text": "Hanna deals in anything that glitters, rattles or ended up in the two-legs' trash. She talks fast, flatters freely and has a story for every piece, usually a better one than the piece deserves."
        },
        {
          "name": "Dieter Badger",
          "role": "Master Builder of Earthworks and Tunnels",
          "text": "Dieter digs tunnels that hold, and hates shoddy work wherever he finds it. He rarely says more than he has to, and what he says can usually be measured."
        },
        {
          "name": "Egon Squirrel",
          "role": "Master of the Stores of the Community Granary",
          "text": "Egon keeps the books on the whole forest's winter supplies and knows at any hour how many acorns are lying where. He talks fast, counts constantly, and is convinced that without him winter wouldn't even take place."
        },
        {
          "name": "Maria Mouse",
          "role": "Herb gatherer and tea supplier",
          "text": "Maria knows every herb in the forest and supplies her tea to half the neighborhood. She is small, quiet and polite, and when something goes missing in the forest, everyone looks at her first."
        }
      ]
    },
    "de": {
      "title": "Mord vor dem Winterschlaf",
      "genre": "Märchenhaft",
      "setting": "Der herbstliche Tierwald",
      "path": "/krimis/mord-vor-dem-winterschlaf"
    }
  },
  {
    "id": "closing-bell-on-the-24th-floor",
    "players": "6–7",
    "hours": 3,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/closing-bell-on-the-24th-floor.jpg",
    "moods": [
      "glamorous"
    ],
    "occasions": [
      "birthday",
      "team-event"
    ],
    "menu": {
      "starter": "mango-passionfruit-smoothie",
      "main": "peanut-spicy-udon",
      "dessert": "lemon-sorbet"
    },
    "recipes": [
      "mango-passionfruit-smoothie",
      "lemon-sorbet",
      "kiwi-sorbet"
    ],
    "en": {
      "title": "Closing Bell on the 24th Floor",
      "genre": "Modern / Business",
      "setting": "The executive floor of a corporation",
      "path": "/en/mysteries/closing-bell-on-the-24th-floor",
      "teaser": "The night before the annual results, eight people are still at work on the 24th floor of Vandrell Tower. At 10:15 p.m. CEO Dr. Konrad Rehberg sits dead in his office – and since 8 p.m. the elevators only go up with an access card.",
      "roles": [
        {
          "name": "Robin Castell",
          "role": "Head of Investor Relations & Communications",
          "text": "Robin sells the market every number as good news and knows every business journalist by first name. Nobody in the building knows better what a headline costs."
        },
        {
          "name": "Felix Brenner",
          "role": "Executive Assistant to the CEO",
          "text": "Felix is the youngest on the floor and has been Rehberg's assistant for a year. He is ambitious and quick, and you can still see his nerves."
        },
        {
          "name": "Samir Haddad",
          "role": "Head of IT Security",
          "text": "Samir sees what happens on the Vandrell Group network and keeps quiet about it, as his job requires. He is thorough and trusts only what can be logged."
        },
        {
          "name": "Adrian Keller",
          "role": "General Counsel, Legal & Compliance",
          "text": "Adrian is the lawyer on the executive board and writes the rules everyone in the group is supposed to follow. His manner is courteous; on the substance he does not give way."
        },
        {
          "name": "Nora Lindqvist",
          "role": "Head of the Executive Office",
          "text": "Nobody gets to Konrad Rehberg without passing Nora's desk. She knows who was with him and when, and she doesn't talk about it."
        },
        {
          "name": "Dr. Isabel Thalberg",
          "role": "Head of Group Accounting",
          "text": "Isabel has run Group Accounting at Vandrell Group for eleven years. She works quietly and precisely, and without her no annual closing gets finished."
        },
        {
          "name": "Helena Voss",
          "role": "Chief Financial Officer",
          "text": "For six years Helena has been responsible for the Vandrell Group's numbers. She is precise and impatient, and she thinks she would make the better CEO."
        }
      ]
    },
    "de": {
      "title": "Schlusskurs im 24. Stock",
      "genre": "Modern / Business",
      "setting": "Die Vorstandsetage eines Konzerns",
      "path": "/krimis/schlusskurs-im-24-stock"
    }
  },
  {
    "id": "death-at-studio-7",
    "players": "6–8",
    "hours": 3,
    "difficulty": "medium",
    "price": 8.99,
    "image": "assets/img/krimi/death-at-studio-7.jpg",
    "moods": [
      "glamorous"
    ],
    "occasions": [
      "new-years-eve",
      "birthday",
      "team-event"
    ],
    "menu": {
      "starter": "strawberry-passion-fruit-smoothie",
      "main": "creamy-one-pan-salmon-pasta",
      "dessert": "strawberry-sorbet"
    },
    "recipes": [
      "strawberry-passion-fruit-smoothie",
      "strawberry-sorbet",
      "coconut-mango-sorbet",
      "pineapple-sorbet"
    ],
    "en": {
      "title": "Death at Studio 7",
      "genre": "Historical",
      "setting": "Hollywood, 1934",
      "path": "/en/mysteries/death-at-studio-7",
      "teaser": "Hollywood, 1934: the night shoot for “Fog over Macau” is under way, but the leading man has vanished. At 10:00 p.m. producer Harold J. Sterling is found dead in his office, and studio security seals off the lot.",
      "roles": [
        {
          "name": "Frankie Dolan",
          "role": "Unit Production Manager",
          "text": "For twelve years Frankie has held every shooting schedule at Bellcrest Pictures together: extras, coffee, and nerves. Tonight Frankie runs the shoot on Studio 7 and now this gathering in the commissary as well."
        },
        {
          "name": "Vivian Ashby",
          "role": "Leading lady",
          "text": "Vivian is the new star of Bellcrest: three pictures, three hits. In “Fog over Macau” she plays the singer Lily Shaw. Tomorrow her engagement to the producer Harold J. Sterling is due to appear in the papers."
        },
        {
          "name": "Danny Cole",
          "role": "Double and stand-in for Grant Maddox",
          "text": "Danny has Grant Maddox’s height, his walk and the back of his head – just not his face. For two years Danny has stood in the light for Grant while the lamps are set, and taken the jumps when things get dangerous."
        },
        {
          "name": "Rosa Delgado",
          "role": "wardrobe mistress",
          "text": "Rosa has sewn, mended and pressed in the wardrobe department at Bellcrest since the talkies came in. She knows every dress Vivian Ashby wears down to the last snap, and she hears more than anyone thinks."
        },
        {
          "name": "Leopold Kastner",
          "role": "Director",
          "text": "Leopold Kastner made celebrated films in Berlin and has worked in Hollywood since 1933; “Fog over Macau” is his second picture for Bellcrest. He speaks softly, sees everything, and shoots every scene until it is right."
        },
        {
          "name": "Eddie Malone",
          "role": "Cameraman",
          "text": "Eddie cranked silent pictures when Hollywood was still orange groves. No cameraman at the studio lights a face as beautifully as he does; the stars ask for him by name."
        },
        {
          "name": "Lorraine Pike",
          "role": "Gossip columnist",
          "text": "Lorraine writes the column “Behind the Curtain” for a big Los Angeles newspaper. Whoever she praises gets cast; whoever she pans soon sells insurance. Tonight she is writing about Vivian Ashby."
        },
        {
          "name": "Sam Whitaker",
          "role": "Screenwriter",
          "text": "Sam wrote “Fog over Macau” – every line, every shot, every last sentence in the rain. For weeks Sam has been working nights at the studio, because every scene Sterling doesn’t like has to be rewritten overnight."
        }
      ]
    },
    "de": {
      "title": "Tod im Studio 7",
      "genre": "Historisch",
      "setting": "Hollywood im Jahr 1934",
      "path": "/krimis/tod-im-studio-7"
    }
  },
  {
    "id": "the-night-of-the-waxworks",
    "players": "8–10",
    "hours": 3,
    "difficulty": "tricky",
    "price": 8.99,
    "image": "assets/img/krimi/the-night-of-the-waxworks.jpg",
    "moods": [
      "spooky"
    ],
    "occasions": [
      "birthday",
      "halloween"
    ],
    "menu": {
      "starter": "baba-ganoush",
      "main": "creamy-sucuk-carbonara",
      "dessert": "avocado-ice-cream"
    },
    "recipes": [
      "avocado-ice-cream",
      "mango-raspberry-sorbet",
      "strawberry-pineapple-sorbet",
      "yellow-watermelon-sorbet"
    ],
    "en": {
      "title": "The Night of the Waxworks",
      "genre": "Modern / Business",
      "setting": "A Halloween case in a hotel full of wax figures",
      "path": "/en/mysteries/the-night-of-the-waxworks",
      "teaser": "Halloween at Hotel Marrow, a house full of historic wax figures: at midnight the owner means to announce what will become of it. Shortly before, he sits dead on the throne chair in the gallery – and the storm surge keeps the police away.",
      "roles": [
        {
          "name": "Marlene Vogt",
          "role": "hotel manager",
          "text": "Marlene has run Hotel Marrow for eleven years and knows every key, every invoice and every rumor in the house. Punctual to the point of pain, Marlene looks at the clock more often than at the guests tonight."
        },
        {
          "name": "Tilda Ahlers",
          "role": "actor in the Chamber of Horrors",
          "text": "Tilda plays the ghost of the Poisoner in the basement of Hotel Marrow and leads the guests through the Chamber of Horrors. In the séance, Tilda gives the spirit voice behind the fireplace curtain, and nobody except Marlene and Mirabel knows about it."
        },
        {
          "name": "Mirabel Dorn",
          "role": "medium hired for the séance",
          "text": "Mirabel Dorn has led spirit invocations for thirty years and tonight sits with her tarot table in the corner of the salon. She likes to talk about the “house that listens,” whispers, and reads meaning into every sign."
        },
        {
          "name": "Dr. Benedikt Falk",
          "role": "family doctor and regular guest",
          "text": "Dr. Falk is Cornelius Marrow’s oldest friend, practices in Nebelstein, and smokes the same pipe mixture as his friend on every occasion. He considers séances hocus-pocus and would rather drink his cognac."
        },
        {
          "name": "Viktor Halden",
          "role": "investor",
          "text": "Viktor Halden buys hotels with a history and sells them as an experience. He has bid €14 million for Hotel Marrow and negotiates at every opportunity, even over the canapés."
        },
        {
          "name": "Ines Hartung",
          "role": "appraiser for the auction house Kessler & Rohde",
          "text": "Ines authenticates historic wax figures for the auction house Kessler & Rohde, and at Hotel Marrow she is to assess the collection ahead of its sale. She likes to explain how to tell real wax, and lets no wrong word about it stand."
        },
        {
          "name": "Leopold Marrow",
          "role": "head bartender",
          "text": "Leopold has run the salon bar for fifteen years and knows every guest’s favorite drink. As the owner’s only son, he knows his father is deciding the future of the house tonight."
        },
        {
          "name": "Greta Nolte",
          "role": "blogger, “Nebelstein After Midnight”",
          "text": "Greta writes about haunted places and ghost houses, and she invited herself to the gala as a press guest. Her phone is always raised, and no shiver goes unphotographed."
        },
        {
          "name": "Fenna Ostermann",
          "role": "conservator of the wax figures",
          "text": "Fenna has restored the figures of Hotel Marrow for nine years and lives under the roof. She talks about the wax figures as if they were people, wears the studio key on her belt, and steers clear of every argument."
        },
        {
          "name": "Oskar Pfeiffer",
          "role": "night porter",
          "text": "Oskar has sat in the porter’s lodge of Hotel Marrow for forty years and logs every call, every guest and every key. He knows the house better than the master of the house does, and he rarely says more than he is asked."
        }
      ]
    },
    "de": {
      "title": "Das Wachsfigurenhotel",
      "genre": "Modern / Business",
      "setting": "Halloween in einem Hotel voller Wachsfiguren",
      "path": "/krimis/das-wachsfigurenhotel"
    }
  }
];

var KRIMI_PREVIEWS = [];

var KRIMI_SOCIAL = {
  "reviews": [],
  "photos": []
};
/* /Daten */
/** Sichtbare Beschriftungen je Sprache – passend zu KRIMI_SITE.lang. */
var KRIMI_LABELS = {
  en: {
    players: "players",
    duration: function (hours) { return "approx. " + hours + " hrs"; },
    toCase: "View case",
    getCase: function (price) { return "Get the case – " + price; },
    seasonal: "Seasonal pick",
    perfectFor: "Perfect for:",
    difficultyLevel: "Difficulty",
    /* TODO: Erklärungen mit Murdernight abgleichen – wie definieren sie
       "Medium" und "Tricky"? */
    difficultyHelp: {
      easy: "Easy: the clues lead fairly directly to the culprit – good for a first murder mystery night.",
      medium: "Medium: some clues only make sense together – fine for mixed groups.",
      tricky: "Tricky: the decisive clues are well hidden – for groups who like a real puzzle."
    },
    moods: { cosy: "Cosy", spooky: "Spooky", glamorous: "Glamorous", scifi: "Sci-fi" },
    filters: {
      players: "Players",
      mood: "Mood",
      occasion: "Occasion",
      count: function (shown, all) {
        return shown === all ? "All " + all + " cases" : shown + " of " + all + " cases";
      },
      reset: "Reset"
    },
    playerBuckets: [[5, 6], [7, 9], [10, 12]],
    seasonalBanner: function (title, occasion) {
      return { short: title + " · seasonal pick", long: title + " – the murder mystery for your " + occasion };
    },
    menuFor: "Cook for",
    reviewsHeading: "From your murder mystery nights",
    occasions: {
      christmas: "Christmas party",
      halloween: "Halloween party",
      "new-years-eve": "New Year's Eve",
      birthday: "Birthday",
      "game-night": "Game night",
      "team-event": "Office party"
    },
    toGame: "To the game",
    toCases: "See the cases",
    allCases: function (count) { return "See all " + count + " cases"; },
    newTab: "opens Murdernight in a new tab",
    hintEyebrow: "Murder mystery dinner",
    hintText: "This dish is part of a murder mystery dinner menu.",
    hintTextGeneric: "Cooking for friends? Make it a murder mystery night.",
    hintDetailGeneric: function (count, price) {
      return count + " cases to print at home · " + price + " each";
    },
    difficulty: { easy: "Easy", medium: "Medium", tricky: "Tricky" },
    coverAlt: function (title, setting) {
      return "Cover of the murder mystery dinner " + title + (setting ? " – " + setting : "");
    },
    locale: "en-IE"
  },
  de: {
    players: "Personen",
    duration: function (hours) {
      return "ca. " + String(hours).replace(".", ",") + " Std.";
    },
    toCase: "Zum Fall",
    getCase: function (price) { return "Fall holen – " + price; },
    seasonal: "Passt zur Saison",
    perfectFor: "Ideal für:",
    difficultyLevel: "Schwierigkeit",
    difficultyHelp: {
      easy: "Leicht: Die Hinweise führen recht direkt zum Täter – gut für den ersten Krimiabend.",
      medium: "Mittel: Manche Hinweise ergeben erst zusammen Sinn – passt für gemischte Gruppen.",
      tricky: "Knifflig: Die entscheidenden Hinweise sind gut versteckt – für Gruppen, die gern rätseln."
    },
    moods: { cosy: "Gemütlich", spooky: "Gruselig", glamorous: "Glamourös", scifi: "Sci-Fi" },
    filters: {
      players: "Personen",
      mood: "Stimmung",
      occasion: "Anlass",
      count: function (shown, all) {
        return shown === all ? "Alle " + all + " Fälle" : shown + " von " + all + " Fällen";
      },
      reset: "Zurücksetzen"
    },
    playerBuckets: [[5, 6], [7, 9], [10, 12]],
    seasonalBanner: function (title, occasion) {
      return { short: title + " · passt zur Saison", long: title + " – der Krimi für deine " + occasion };
    },
    menuFor: "Menü für",
    reviewsHeading: "Von euren Krimiabenden",
    occasions: {
      christmas: "Weihnachtsfeier",
      halloween: "Halloween",
      "new-years-eve": "Silvester",
      birthday: "Geburtstag",
      "game-night": "Spieleabend",
      "team-event": "Teamevent"
    },
    toGame: "Zum Spiel",
    toCases: "Zu den Fällen",
    allCases: function (count) { return "Alle " + count + " Fälle ansehen"; },
    newTab: "öffnet Murdernight in neuem Tab",
    hintEyebrow: "Krimi-Dinner",
    hintText: "Dieses Gericht ist Teil eines Krimi-Dinner-Menüs.",
    hintTextGeneric: "Kochst du für Freunde? Mach einen Krimiabend daraus.",
    hintDetailGeneric: function (count, price) {
      return count + " Fälle zum Ausdrucken · je " + price;
    },
    difficulty: { easy: "Leicht", medium: "Mittel", tricky: "Knifflig" },
    coverAlt: function (title, setting) {
      return "Cover des Krimi-Dinners " + title + (setting ? " – " + setting : "");
    },
    locale: "de-DE"
  }
};

/**
 * Der eine Weg zu einem Link nach Murdernight.
 *
 *   krimiUrl("/en/shop")                          -> … ?utm_campaign=krimi-dinner
 *   krimiUrl("/en/shop", KRIMI_SITE.recipeCampaign) -> … ?utm_campaign=krimi-dinner-rezept
 *   krimiUrl(path, null, "the-comet-vintage")     -> … &utm_content=the-comet-vintage
 *
 * utm_content sagt, welcher Link geklickt wurde: bei Fallkarten die id des
 * Falls, bei allgemeinen Knöpfen deren Stelle (z. B. "closing-cta").
 *
 * Kein Link zu Murdernight wird irgendwo von Hand geschrieben – nur so
 * lässt sich ein UTM-Parameter später an einer Stelle ändern.
 */
function krimiUrl(path, campaign, content) {
  var params = [];

  Object.keys(KRIMI_SITE.utm).forEach(function (key) {
    var value =
      key === "utm_campaign" && campaign ? campaign : KRIMI_SITE.utm[key];
    params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
  });
  if (content) params.push("utm_content=" + encodeURIComponent(content));

  return (
    KRIMI_SITE.base[KRIMI_SITE.lang] +
    path +
    (path.indexOf("?") === -1 ? "?" : "&") +
    params.join("&")
  );
}

/** Die Fälle, die es in der eingestellten Sprache gibt. */
function krimiCases() {
  return KRIMI_CASES.filter(function (item) {
    return Boolean(item[KRIMI_SITE.lang]);
  });
}

/** Hat der Fall heute Saison (Feld "seasonal")? */
function krimiInSeason(item, date) {
  var month = (date || new Date()).getMonth() + 1;
  return Boolean(item.seasonal && item.seasonal.indexOf(month) !== -1);
}

/** Wie krimiCases(), aber Fälle mit Saison stehen vorn. */
function krimiCasesBySeason() {
  var cases = krimiCases();
  return cases
    .filter(function (item) { return krimiInSeason(item); })
    .concat(cases.filter(function (item) { return !krimiInSeason(item); }));
}

/** "5–7" -> [5, 7], "6" -> [6, 6] */
function krimiPlayerRange(item) {
  var numbers = String(item.players).match(/\d+/g) || [];
  var low = Number(numbers[0]);
  return [low, Number(numbers[1] || low)];
}

/** 16.9 -> "€16.90" (en) bzw. "16,90 €" (de) */
function krimiPrice(value) {
  return new Intl.NumberFormat(KRIMI_LABELS[KRIMI_SITE.lang].locale, {
    style: "currency",
    currency: "EUR"
  }).format(value);
}
