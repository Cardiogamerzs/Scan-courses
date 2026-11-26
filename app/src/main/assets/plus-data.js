// Contenus de la version 4.7 (rédigés en français, traduits en anglais par lang-en.js).
// Sources citées à chaque bloc. Ce sont des repères généraux, pas un avis médical.
(function (root) {
"use strict";
const P = root.SoveePlus = {};

/* ---------- Fruits et légumes de saison en France (calendrier Interfel / mangerbouger.fr) ---------- */
// [libellé, clé d'ingrédient des recettes ou ""]
const V = (s) => s.split(",").map(x => { const [n, k] = x.split(":"); return [n.trim(), (k || "").trim()]; });
P.SEASON = [
  { veg: V("Betterave:betterave,Carotte:carotte,Céleri-rave:celerirave,Chou:chou,Chou de Bruxelles,Endive:endive,Épinard:epinard,Mâche,Navet:navet,Panais:panais,Poireau:poireau,Potiron:potiron,Salsifis,Topinambour"), fruit: V("Citron:citron,Clémentine:clementine,Kiwi:kiwi,Mandarine,Orange:orange,Pamplemousse,Poire:poire,Pomme:pomme") },
  { veg: V("Betterave:betterave,Carotte:carotte,Céleri-rave:celerirave,Chou:chou,Chou de Bruxelles,Endive:endive,Épinard:epinard,Mâche,Navet:navet,Panais:panais,Poireau:poireau,Salsifis,Topinambour"), fruit: V("Citron:citron,Clémentine:clementine,Kiwi:kiwi,Mandarine,Orange:orange,Pamplemousse,Poire:poire,Pomme:pomme") },
  { veg: V("Betterave:betterave,Carotte:carotte,Céleri-rave:celerirave,Chou:chou,Endive:endive,Épinard:epinard,Mâche,Navet:navet,Panais:panais,Poireau:poireau,Radis:radis,Salsifis"), fruit: V("Citron:citron,Kiwi:kiwi,Orange:orange,Pamplemousse,Poire:poire,Pomme:pomme") },
  { veg: V("Asperge:asperge,Blette:blette,Carotte:carotte,Chou-fleur:choufleur,Épinard:epinard,Laitue:salade,Navet:navet,Poireau:poireau,Radis:radis"), fruit: V("Kiwi:kiwi,Pamplemousse,Pomme:pomme,Rhubarbe:rhubarbe") },
  { veg: V("Artichaut:artichaut,Asperge:asperge,Blette:blette,Concombre:concombre,Épinard:epinard,Fève:feve,Laitue:salade,Petits pois:petitspois,Radis:radis"), fruit: V("Cerise:cerise,Fraise:fraise,Rhubarbe:rhubarbe") },
  { veg: V("Artichaut:artichaut,Aubergine:aubergine,Concombre:concombre,Courgette:courgette,Fève:feve,Haricot vert:hv,Laitue:salade,Petits pois:petitspois,Radis:radis,Tomate:tomate"), fruit: V("Abricot:abricot,Cerise:cerise,Fraise:fraise,Framboise:framboise,Melon:melon,Pêche:peche") },
  { veg: V("Aubergine:aubergine,Concombre:concombre,Courgette:courgette,Fenouil:fenouil,Haricot vert:hv,Maïs,Poivron:poivron,Tomate:tomate"), fruit: V("Abricot:abricot,Cassis,Framboise:framboise,Melon:melon,Myrtille:myrtille,Nectarine,Pastèque:pasteque,Pêche:peche,Prune:prune") },
  { veg: V("Aubergine:aubergine,Concombre:concombre,Courgette:courgette,Fenouil:fenouil,Haricot vert:hv,Maïs,Poivron:poivron,Tomate:tomate"), fruit: V("Figue:figue,Melon:melon,Mirabelle,Mûre,Myrtille:myrtille,Pastèque:pasteque,Pêche:peche,Poire:poire,Prune:prune,Raisin:raisin") },
  { veg: V("Aubergine:aubergine,Brocoli:brocoli,Champignon:champi,Chou-fleur:choufleur,Courgette:courgette,Fenouil:fenouil,Haricot vert:hv,Poivron:poivron,Potiron:potiron,Tomate:tomate"), fruit: V("Figue:figue,Noix:noix,Poire:poire,Pomme:pomme,Prune:prune,Raisin:raisin") },
  { veg: V("Betterave:betterave,Brocoli:brocoli,Butternut:butternut,Champignon:champi,Céleri-rave:celerirave,Chou:chou,Épinard:epinard,Fenouil:fenouil,Navet:navet,Panais:panais,Poireau:poireau,Potiron:potiron"), fruit: V("Châtaigne,Coing,Noix:noix,Poire:poire,Pomme:pomme,Raisin:raisin") },
  { veg: V("Betterave:betterave,Butternut:butternut,Carotte:carotte,Céleri-rave:celerirave,Chou:chou,Chou de Bruxelles,Endive:endive,Épinard:epinard,Mâche,Navet:navet,Panais:panais,Poireau:poireau,Potiron:potiron,Topinambour"), fruit: V("Châtaigne,Clémentine:clementine,Coing,Kiwi:kiwi,Mandarine,Poire:poire,Pomme:pomme") },
  { veg: V("Betterave:betterave,Carotte:carotte,Céleri-rave:celerirave,Chou:chou,Chou de Bruxelles,Endive:endive,Épinard:epinard,Mâche,Navet:navet,Panais:panais,Poireau:poireau,Potiron:potiron,Salsifis,Topinambour"), fruit: V("Châtaigne,Citron:citron,Clémentine:clementine,Kiwi:kiwi,Mandarine,Orange:orange,Poire:poire,Pomme:pomme") }
];
P.SEASON_SRC = "Calendrier des fruits et légumes de saison (Interfel, mangerbouger.fr – Santé publique France). Varie un peu selon les régions.";

/* ---------- Substitutions en cuisine ---------- */
P.SUBS = [
  ["🥚", "Œuf (1)", [["1 c. à soupe de graines de lin moulues + 3 c. à soupe d'eau", "laisser gonfler 10 min, idéal en pâtisserie"], ["50 g de compote de pommes", "gâteaux moelleux"], ["½ banane écrasée", "pancakes, muffins"], ["3 c. à soupe d'aquafaba (jus de pois chiches)", "se monte en neige comme un blanc"]]],
  ["🧈", "Beurre (100 g)", [["80 g d'huile neutre (colza, tournesol)", "gâteaux, pâtes à tarte"], ["100 g de purée d'amande ou de cacahuète", "goût plus marqué"], ["100 g de compote", "allège les gâteaux (texture plus dense)"]]],
  ["🥛", "Lait (25 cl)", [["25 cl de boisson végétale (soja, avoine, amande)", "même quantité"], ["12 cl d'eau + 12 cl de crème", "pour une sauce"]]],
  ["🍶", "Crème fraîche", [["Yaourt à la grecque ou fromage blanc", "hors du feu pour qu'il ne tranche pas"], ["Crème de coco", "plats exotiques"], ["Ricotta détendue avec un peu de lait", "pâtes, gratins"]]],
  ["🌾", "Farine de blé", [["Fécule de maïs (moitié de la quantité)", "pour épaissir une sauce"], ["Poudre d'amande + farine de riz", "gâteaux sans gluten"], ["Flocons d'avoine mixés", "crumble, pancakes"]]],
  ["🍬", "Sucre (100 g)", [["70 g de miel ou de sirop d'érable", "baisser le four de 10 °C"], ["Banane bien mûre ou compote", "et réduire le sucre"], ["Dattes mixées", "biscuits, energy balls"]]],
  ["🍷", "Vin blanc (cuisine)", [["Bouillon de légumes + 1 c. à soupe de vinaigre ou de jus de citron", "même quantité"]]],
  ["🍷", "Vin rouge (cuisine)", [["Bouillon de bœuf + 1 c. à soupe de vinaigre balsamique", "daube, bourguignon"], ["Jus de raisin + vinaigre", "pour les sauces"]]],
  ["🧀", "Parmesan", [["Comté ou beaufort râpé", "même quantité"], ["Levure maltée", "version végétale"]]],
  ["🥓", "Lardons", [["Tofu fumé en dés", "version végétarienne"], ["Champignons poêlés + paprika fumé", "goût fumé"]]],
  ["🥩", "Viande hachée", [["Lentilles vertes ou corail cuites", "bolognaise, hachis"], ["Protéines de soja texturées réhydratées", "même usage"]]],
  ["🍚", "Riz", [["Quinoa, boulgour ou semoule", "même cuisson ou plus rapide"], ["Chou-fleur râpé", "« riz » de légume, plus léger"]]],
  ["🍝", "Pâtes", [["Courgette en spaghettis", "plus léger"], ["Pâtes de lentilles ou de pois chiches", "plus de protéines"]]],
  ["🍋", "Citron", [["Vinaigre de cidre (moitié de la quantité)", "assaisonnements"], ["Citron vert", "même usage"]]],
  ["🧄", "Ail frais", [["¼ c. à café d'ail en poudre par gousse", "même goût, plus doux"]]],
  ["🌿", "Herbes fraîches", [["1 c. à café d'herbes séchées pour 1 c. à soupe de fraîches", "à ajouter en début de cuisson"]]],
  ["🫒", "Huile d'olive", [["Huile de colza", "à froid, riche en oméga-3"]]],
  ["🍫", "Chocolat (cuisson)", [["3 c. à soupe de cacao + 1 c. à soupe d'huile pour 30 g", "brownies, gâteaux"]]],
  ["🍞", "Chapelure", [["Flocons d'avoine mixés", "panures"], ["Poudre d'amande", "sans gluten"], ["Biscottes écrasées", "même usage"]]],
  ["🧂", "Sel", [["Herbes, épices, citron, ail", "pour relever sans saler (attention aux sels de régime au potassium avec certains traitements)"]]],
  ["🥥", "Lait de coco", [["Yaourt nature + un peu de lait", "curry plus léger"]]],
  ["🍯", "Miel", [["Sirop d'érable ou d'agave", "même quantité"]]],
  ["🌽", "Maïzena", [["Farine (le double)", "pour épaissir"], ["Pomme de terre râpée", "soupes"]]],
  ["🧅", "Échalote", [["Oignon (un tiers de la quantité)", "plus fort en goût"]]],
  ["🥛", "Babeurre / lait ribot", [["Lait + 1 c. à soupe de jus de citron, 10 min", "pancakes, scones"]]],
  ["🧁", "Levure chimique (1 sachet)", [["½ c. à café de bicarbonate + 1 c. à soupe de jus de citron", "à enfourner vite"]]],
  ["🥜", "Fruits à coque (allergie)", [["Graines de tournesol ou de courge", "pesto, crumble"]]],
  ["🍅", "Tomates fraîches", [["Tomates concassées en boîte", "hors saison, souvent meilleures en sauce"]]]
];
P.SUBS_SRC = "Équivalences de cuisine usuelles. En cas d'allergie, vérifie toujours l'étiquette du produit de remplacement.";

/* ---------- Conservation (repères indicatifs : USDA FoodKeeper, ANSES, DGAL) ---------- */
// [emoji, aliment, réfrigérateur, congélateur, astuce]
P.KEEP = [
  ["🥩", "Viande hachée crue", "1 à 2 jours", "3 à 4 mois", "À cuire à cœur, surtout pour les enfants."],
  ["🍗", "Volaille crue", "1 à 2 jours", "9 mois", "Ne jamais laver la volaille crue (projections de bactéries)."],
  ["🥩", "Viande rouge crue (steak, rôti)", "3 à 5 jours", "4 à 12 mois", ""],
  ["🐟", "Poisson cru", "1 à 2 jours", "3 à 6 mois", "Poissons gras : 2 à 3 mois au congélateur."],
  ["🦐", "Crevettes, fruits de mer crus", "1 à 2 jours", "3 à 6 mois", ""],
  ["🍲", "Plat cuisiné maison", "3 à 4 jours", "2 à 3 mois", "Refroidir vite (moins de 2 h) avant de mettre au frigo."],
  ["🍚", "Riz cuit", "2 à 3 jours", "1 à 2 mois", "Refroidir rapidement : le riz cuit laissé tiède favorise une bactérie (Bacillus cereus)."],
  ["🍝", "Pâtes cuites", "3 à 5 jours", "1 à 2 mois", ""],
  ["🥣", "Soupe maison", "3 à 4 jours", "2 à 3 mois", ""],
  ["🍖", "Jambon cuit entamé", "3 à 5 jours", "1 à 2 mois", ""],
  ["🥓", "Saucisson entamé", "3 semaines", "1 à 2 mois", "Au frais, emballé."],
  ["🥚", "Œufs", "28 jours après la ponte", "Non (en coquille)", "Blancs seuls : 12 mois au congélateur."],
  ["🥛", "Lait ouvert", "3 à 5 jours", "3 mois", "Bien refermer la bouteille."],
  ["🍶", "Crème fraîche ouverte", "5 à 7 jours", "Déconseillé", ""],
  ["🥄", "Yaourts", "Jusqu'à la date (DLC)", "1 à 2 mois", ""],
  ["🧀", "Fromage à pâte dure entamé", "3 à 4 semaines", "6 mois (râpé)", "Envelopper dans du papier, pas de film serré."],
  ["🧀", "Fromage frais ou à pâte molle", "1 semaine", "Déconseillé", ""],
  ["🧈", "Beurre", "Jusqu'à la date", "6 à 9 mois", ""],
  ["🍞", "Pain", "À éviter (il rassit plus vite)", "3 mois", "Le garder à température ambiante 2 à 3 jours."],
  ["🥬", "Salade, légumes feuilles", "3 à 7 jours", "Non", "Dans le bac à légumes, dans un torchon humide."],
  ["🥕", "Carottes, légumes racines", "2 à 3 semaines", "10 à 12 mois (blanchis)", ""],
  ["🍓", "Fruits rouges", "2 à 3 jours", "8 à 12 mois", "Ne les laver qu'au dernier moment."],
  ["🍎", "Pommes", "3 à 4 semaines", "8 mois (cuites)", "Elles font mûrir les autres fruits : à ranger à part."],
  ["🍌", "Bananes", "Pas au frigo", "6 mois (épluchées)", "Parfaites congelées pour les smoothies."],
  ["🥑", "Avocat mûr", "2 à 3 jours", "Purée : 4 mois", ""],
  ["🍄", "Champignons", "3 à 7 jours", "10 mois (cuits)", "Dans un sac en papier."],
  ["🌿", "Herbes fraîches", "5 à 7 jours", "6 mois (hachées)", "Dans un verre d'eau, comme un bouquet."],
  ["🍅", "Sauce tomate maison", "5 à 7 jours", "4 mois", ""],
  ["🥫", "Conserve ouverte", "3 à 4 jours", "", "La transvaser dans une boîte fermée."],
  ["🫙", "Confiture ouverte", "6 mois", "", ""],
  ["🧊", "Tofu ouvert", "3 à 5 jours", "5 mois", "Dans l'eau, changée chaque jour."],
  ["🍼", "Lait maternel tiré", "4 jours (au fond du frigo, 4 °C)", "4 mois", "Après décongélation : 24 h au frigo, ne pas recongeler."],
  ["🍼", "Biberon de lait infantile préparé", "À donner dans l'heure", "Non", "Ne pas garder un biberon entamé."]
];
P.KEEP_TIPS = ["Frigo réglé à 4 °C au plus, zone la plus froide pour viandes et poissons.", "Décongeler au frigo, jamais à température ambiante.", "Ne jamais recongeler un aliment cru décongelé (sauf s'il a été cuit entre-temps).", "DLC « à consommer jusqu'au » : ne pas dépasser. DDM « de préférence avant » : encore bon après si bien conservé."];
P.KEEP_SRC = "Repères indicatifs : USDA FoodKeeper, ANSES, ministère de l'Agriculture (DGAL), Santé publique France (lait maternel).";

/* ---------- Sommeil et alimentation (INSV, Santé publique France, ANSES) ---------- */
P.SLEEP = [
  ["⏰", "Dîner 2 à 3 h avant le coucher", "Un repas copieux ou très gras juste avant de dormir retarde l'endormissement et favorise les remontées acides."],
  ["🍝", "Des féculents au dîner", "Pâtes, riz, pain complet ou légumineuses : un dîner avec des glucides complexes peut aider à l'endormissement."],
  ["☕", "Pas de caféine après 14 h", "Café, thé, cola, boissons énergisantes : la caféine agit plusieurs heures (demi-vie d'environ 5 h)."],
  ["🍷", "L'alcool n'aide pas à dormir", "Il endort, mais il fragmente le sommeil en deuxième partie de nuit et aggrave les ronflements."],
  ["🥛", "Laitages, banane, oléagineux", "Sources de tryptophane et de magnésium : une collation légère si tu as faim le soir."],
  ["💧", "Boire surtout dans la journée", "Moins de liquide le soir pour éviter les réveils nocturnes."],
  ["🌶️", "Pas trop épicé ni trop salé le soir", "Reflux, soif nocturne."],
  ["📱", "Écrans éteints 1 h avant", "La lumière bleue retarde la sécrétion de mélatonine."]
];
P.SLEEP_BABY = [
  ["👶", "Dors quand bébé dort", "Les siestes comptent, même courtes."],
  ["🍎", "Des collations simples à portée de main", "Yaourt, fruit, poignée d'amandes, tartine : mieux que les biscuits sucrés."],
  ["☕", "Café avant 14 h seulement", "Sinon la nuit suivante sera encore plus courte. Si tu allaites, pas plus de 2 à 3 tasses par jour."],
  ["🍲", "Cuisine en avance", "Des plats congelés en portions pour les soirs difficiles (batch cooking)."]
];
P.SLEEP_SRC = "Sources : Institut national du sommeil et de la vigilance (INSV), Santé publique France, ANSES.";

/* ---------- Grossesse : la taille du bébé en fruit (semaines d'aménorrhée) ---------- */
P.FRUIT = { 4: ["🌱", "une graine de pavot"], 5: ["⚪", "une graine de sésame"], 6: ["🫘", "une lentille"], 7: ["🫐", "une myrtille"], 8: ["🍓", "une framboise"], 9: ["🍇", "un grain de raisin"], 10: ["🍊", "un kumquat"],
  11: ["🟣", "une figue"], 12: ["🍋", "un citron vert"], 13: ["🫛", "une gousse de petits pois"], 14: ["🍋", "un citron"], 15: ["🍎", "une pomme"], 16: ["🥑", "un avocat"], 17: ["🥔", "un navet"],
  18: ["🫑", "un poivron"], 19: ["🍅", "une tomate"], 20: ["🍌", "une banane"], 21: ["🥕", "une carotte"], 22: ["🎃", "une courge spaghetti"], 23: ["🥭", "une grosse mangue"], 24: ["🌽", "un épi de maïs"],
  25: ["🥔", "un rutabaga"], 26: ["🧅", "une botte d'oignons nouveaux"], 27: ["🥦", "un chou-fleur"], 28: ["🍆", "une aubergine"], 29: ["🎃", "une courge butternut"], 30: ["🥬", "un chou"],
  31: ["🥥", "une noix de coco"], 32: ["🥔", "un céleri-rave"], 33: ["🍍", "un ananas"], 34: ["🍈", "un melon"], 35: ["🍈", "un gros melon"], 36: ["🥬", "une laitue romaine"], 37: ["🥬", "une botte de blettes"],
  38: ["🥬", "un poireau"], 39: ["🍉", "une petite pastèque"], 40: ["🎃", "une citrouille"], 41: ["🎃", "une belle citrouille"] };
P.FRUIT_NOTE = "Comparaison indicative : chaque bébé grandit à son rythme.";

/* ---------- Grossesse : rendez-vous et examens en France (ameli.fr, HAS, CNGOF) ---------- */
// [id, SA début, SA fin, titre, détail]
P.RDV = [
  ["c1", 0, 14, "1re consultation et déclaration de grossesse", "Avant la fin du 3e mois (14 SA) : examen, prise de sang (groupe sanguin, toxoplasmose, rubéole, syphilis…), déclaration à l'Assurance maladie et à la CAF."],
  ["e1", 11, 14, "1re échographie", "Entre 11 et 13 SA + 6 jours, avec le dépistage combiné de la trisomie 21 si tu le souhaites."],
  ["epp", 12, 24, "Entretien prénatal précoce", "Obligatoire depuis 2020, idéalement au 4e mois, avec une sage-femme ou un médecin."],
  ["cm", 15, 41, "Consultations mensuelles", "Une par mois à partir du 4e mois (7 consultations au total). Prise de sang toxoplasmose chaque mois si tu n'es pas immunisée."],
  ["e2", 20, 25, "2e échographie (morphologique)", "Vers 22 SA : l'anatomie du bébé est étudiée en détail."],
  ["coq", 20, 36, "Vaccin contre la coqueluche", "Recommandé entre 20 et 36 SA pour protéger bébé dès la naissance (HAS 2022)."],
  ["hgpo", 24, 28, "Dépistage du diabète gestationnel", "Test de charge en glucose (HGPO) entre 24 et 28 SA s'il y a des facteurs de risque (âge ≥ 35 ans, surpoids, antécédents…)."],
  ["b6", 24, 28, "Prise de sang du 6e mois", "Hépatite B, numération (anémie), recherche d'agglutinines irrégulières si rhésus négatif."],
  ["antid", 27, 29, "Injection anti-D (si rhésus négatif)", "Vers 28 SA, si ton médecin ou ta sage-femme la prescrit."],
  ["e3", 30, 35, "3e échographie", "Vers 32 SA : croissance et position du bébé."],
  ["vrs", 32, 36, "Bronchiolite (VRS)", "Vaccin proposé entre 32 et 36 SA selon la saison, ou anticorps donnés à bébé après la naissance : à voir avec ta sage-femme (HAS 2024)."],
  ["anest", 32, 37, "Consultation d'anesthésie", "Au 8e mois, même si tu ne prévois pas de péridurale."],
  ["sgb", 34, 38, "Prélèvement vaginal (streptocoque B)", "Entre 34 et 38 SA."],
  ["prep", 20, 39, "Préparation à la naissance", "7 séances prises en charge après l'entretien prénatal, avec une sage-femme."],
  ["cong", 35, 35, "Début du congé maternité", "6 semaines avant la date prévue pour un 1er ou un 2e enfant (une partie peut être reportée après la naissance)."],
  ["valise", 34, 36, "Valise de maternité prête", "Papiers (carte Vitale, carnet de maternité, échographies), tenues pour toi et bébé."],
  ["terme", 41, 41, "Terme", "Si bébé n'est pas né, une surveillance est prévue à la maternité."]
];
P.RDV_SRC = "Sources : ameli.fr (suivi de grossesse), Haute Autorité de santé, CNGOF. Ton calendrier exact est fixé par ta sage-femme ou ton médecin.";

/* ---------- Liste de naissance (modifiable) ---------- */
P.BIRTH = [
  ["🛏️ Chambre", ["Lit ou berceau", "Matelas ferme adapté au lit", "2 gigoteuses (turbulettes)", "3 draps-housses", "Babyphone"]],
  ["👕 Vêtements (taille naissance et 1 mois)", ["6 bodies", "6 pyjamas", "2 gilets", "Bonnet de naissance", "Chaussettes", "Combinaison pour sortir (décembre !)"]],
  ["🛁 Toilette et soins", ["Baignoire ou transat de bain", "Thermomètre de bain", "Liniment ou eau nettoyante", "Sérum physiologique en dosettes", "Compresses et cotons", "Thermomètre médical", "Coupe-ongles bébé", "Couches taille 1"]],
  ["🍼 Repas", ["Coussin d'allaitement", "Tire-lait (location possible en pharmacie)", "Biberons et goupillon", "Bavoirs et langes"]],
  ["🚗 Sorties", ["Siège auto homologué i-Size (dos à la route)", "Poussette avec nacelle", "Porte-bébé ou écharpe", "Sac à langer", "Ombrelle ou chancelière"]],
  ["🧳 Valise de maternité", ["Carte Vitale, carte de mutuelle, carnet de maternité", "Échographies et résultats d'examens", "Chemises de nuit ou pyjamas qui s'ouvrent devant", "Chaussons, trousse de toilette", "Tenue de sortie pour bébé", "Couverture pour le siège auto"]]
];

/* ---------- Fer, folates et calcium pendant la grossesse (ANSES, Santé publique France) ---------- */
P.IRON = [
  ["🩸 Fer bien absorbé (héminique)", "Viande rouge bien cuite, boudin noir, volaille, moules et coquillages cuits, sardines. Le foie est à éviter enceinte (excès de vitamine A).", ["boeuf", "boeufhache", "moule", "sardine", "dinde", "poulet"]],
  ["🌱 Fer végétal", "Lentilles, pois chiches, haricots, tofu, épinards, céréales complètes, graines. Mieux absorbé avec de la vitamine C dans le même repas (agrumes, kiwi, poivron), moins bien avec le thé ou le café.", ["corail", "lentille", "pchiche", "hrouge", "harblanc", "tofu", "epinard", "quinoa"]],
  ["🥬 Folates (vitamine B9)", "Légumes verts à feuilles, légumineuses, agrumes, avocat. En plus de la supplémentation prescrite en début de grossesse.", ["epinard", "brocoli", "salade", "avocat", "orange", "corail", "pchiche"]],
  ["🥛 Calcium", "Produits laitiers pasteurisés (2 à 3 par jour), fromages à pâte dure (comté, emmental), eaux riches en calcium, amandes, choux.", ["yaourt", "lait", "fblanc", "emmental", "comte", "amande", "chou"]]
];
P.IRON_SRC = "Sources : ANSES (repères alimentaires femmes enceintes), Santé publique France (1000 premiers jours). Ne prends pas de complément de fer sans prescription.";

/* ---------- Régime méditerranéen : questionnaire MEDAS (étude PREDIMED) ---------- */
// La question sur le vin est retirée : la consommation d'alcool n'est pas recommandée.
P.MEDAS = [
  ["oil1", "L'huile d'olive est ta principale matière grasse en cuisine ?"],
  ["oil4", "Tu utilises au moins 4 cuillères à soupe d'huile d'olive par jour (cuisson, salades) ?"],
  ["veg", "Tu manges au moins 2 portions de légumes par jour (dont une crue) ?"],
  ["fruit", "Tu manges au moins 3 fruits par jour ?"],
  ["meat", "Moins d'une portion par jour de viande rouge, steak haché ou charcuterie ?"],
  ["butter", "Moins d'une portion par jour de beurre, margarine ou crème ?"],
  ["soda", "Moins d'une boisson sucrée ou soda par jour ?"],
  ["leg", "Au moins 3 portions de légumineuses par semaine (lentilles, pois chiches, haricots) ?"],
  ["fish", "Au moins 3 portions de poisson ou fruits de mer par semaine ?"],
  ["pastry", "Moins de 3 fois par semaine des gâteaux, biscuits ou viennoiseries du commerce ?"],
  ["nuts", "Au moins 3 poignées de fruits à coque par semaine (noix, amandes, noisettes) ?"],
  ["poultry", "Tu préfères la volaille à la viande rouge ?"],
  ["sofrito", "Au moins 2 fois par semaine, un plat avec une sauce maison tomate, oignon, ail et huile d'olive ?"]
];
P.MEDAS_SRC = "Questionnaire MEDAS (Schröder et al., 2011, étude PREDIMED), sans la question sur le vin. Score sur 13 : 9 ou plus = très bonne adhésion au régime méditerranéen.";

/* ---------- Recettes par région ---------- */
// [clé, nom, emoji, x, y (sur la carte 0-100), mots-clés des noms de recettes]
P.REGIONS = [
  ["nor", "Normandie", "🍎", 33, 19, /normand|camembert|cidre|teurgoule|livarot|calvados|pont-l|vallee d'auge/],
  ["bre", "Bretagne", "🥞", 12, 29, /breton|galette|crepe|\bfar\b|kig ha|kouign|cotriade|saint-jacques/],
  ["nord", "Nord", "🍺", 54, 6, /flamand|carbonade|welsh|maroilles|potjevleesch|chicon|endives au jambon|ch'ti/],
  ["idf", "Paris", "🗼", 50, 23, /parisien|croque-monsieur|croque-madame|soupe a l'oignon|\bbrie\b|paris-brest|hachis parmentier/],
  ["als", "Alsace et Lorraine", "🥨", 82, 27, /alsac|choucroute|flammekueche|tarte flambee|baeckeoffe|kouglof|spaetzle|munster|lorrain|mirabelle|madeleine/],
  ["loire", "Val de Loire", "🏰", 37, 40, /tatin|rillette|sainte-maure|crottin|tourangeau/],
  ["bou", "Bourgogne", "🍇", 63, 43, /bourguignon|meurette|gougere|epoisses|persille|dijon/],
  ["lyo", "Lyon", "🦁", 66, 56, /lyonnais|quenelle|saucisson brioche|bugne|cervelle de canut/],
  ["sav", "Savoie et Alpes", "🏔️", 80, 56, /savoyard|tartiflette|raclette|fondue|reblochon|diot|croziflette|beaufort|gratin dauphinois|dauphinois/],
  ["auv", "Auvergne", "🧀", 52, 61, /auvergnat|truffade|aligot|cantal|saint-nectaire|\bpuy\b|potee/],
  ["so", "Sud-Ouest et Pays basque", "🦆", 27, 72, /cassoulet|garbure|confit de canard|magret|landais|perigourdin|basque|piperade|axoa|chipiron|basquaise|bordelais/],
  ["lang", "Languedoc et Catalogne", "☀️", 50, 81, /brandade|tielle|catalan|cargolade|aligot/],
  ["pro", "Provence et Côte d'Azur", "🌿", 71, 80, /provencal|ratatouille|\btian\b|pistou|aioli|bouillabaisse|tapenade|nicois|socca|pissaladiere|daube|anchoiade|fougasse|calisson|panisse/],
  ["cor", "Corse", "🐗", 91, 90, /\bcorse\b|figatelli|brocciu|fiadone/]
];
P.FRANCE_PATH = "M52 2 L47 4 L40 12 L38 17 L31 16 L27 13 L25 20 L18 21 L10 23 L2 25 L4 30 L12 33 L18 37 L20 41 L23 47 L25 51 L26 58 L25 66 L23 74 L21 80 L28 83 L36 86 L44 88 L47 87 L50 83 L55 81 L60 83 L66 84 L72 82 L78 80 L84 77 L82 71 L80 64 L82 58 L78 54 L80 50 L84 42 L85 32 L86 26 L80 23 L74 20 L68 16 L62 12 L58 8 Z M88 84 L93 86 L94 94 L90 97 L87 92 Z";

/* ---------- Quelques recettes régionales (pour 4 personnes), même format que recipes-hand.js ---------- */
P.REGION_RECIPES = [
  ["Endives au jambon gratinées (façon ch'ti)", "fr", "plat", 50, 4, "", "endive:800 jambon:160 lait:500 farine:40 beurre:30 emmental:60 sel:0", "Fais cuire les endives 20 min à la vapeur et presse-les pour retirer l'eau.|Prépare une béchamel avec le beurre, la farine et le lait.|Roule chaque endive dans une tranche de jambon, dispose dans un plat, nappe de béchamel et parsème d'emmental.|Fais gratiner 20 min à 200 °C."],
  ["Carbonade flamande légère (sans bière)", "fr", "plat", 150, 4, "", "boeuf:700 oignon:300 bouillon:10 painc:60 moutarde:20 sucre:10 vinaigre:15 pdt:800 sel:0", "Fais dorer la viande en morceaux puis les oignons émincés.|Ajoute 50 cl de bouillon, le vinaigre et le sucre, puis les tranches de pain tartinées de moutarde sur le dessus.|Couvre et laisse mijoter 2 h à feu doux en remuant de temps en temps.|Sers avec les pommes de terre cuites à l'eau."],
  ["Poulet vallée d'Auge (sans calvados)", "fr", "plat", 50, 4, "", "cuisse:900 champi:300 pomme:300 echalote:60 cremel:150 bouillon:5 riz:240 sel:0", "Fais dorer les cuisses de poulet, ajoute les échalotes et les champignons.|Ajoute 20 cl de bouillon, couvre et laisse cuire 30 min.|Fais revenir les pommes en quartiers à part et ajoute-les avec la crème légère en fin de cuisson.|Sers avec le riz."],
  ["Teurgoule normande (riz au lait à la cannelle)", "fr", "dessert", 180, 6, "", "rizrond:120 lait:1000 sucre:80 epices:3", "Mélange le riz, le sucre et la cannelle dans un plat en terre.|Verse le lait froid par-dessus.|Fais cuire 3 h à 150 °C sans remuer : une croûte dorée se forme."],
  ["Œufs en meurette (sauce sans vin)", "fr", "plat", 40, 4, "", "oeuf:400 lardons:100 champi:200 echalote:60 bouillon:10 concentre:20 farine:15 baguette:150 sel:0", "Fais revenir les lardons, les échalotes et les champignons.|Saupoudre de farine, ajoute 40 cl de bouillon et le concentré, laisse réduire 15 min.|Poche les œufs 3 min dans l'eau frémissante vinaigrée.|Sers les œufs nappés de sauce avec des croûtons de pain."],
  ["Gougères au comté", "fr", "entree", 45, 6, "", "farine:125 beurre:80 oeuf:200 comte:100 lait:125 sel:0", "Porte à ébullition 12 cl d'eau, le lait et le beurre, verse la farine d'un coup et dessèche la pâte 1 min.|Hors du feu, incorpore les œufs un à un puis le comté.|Forme des petits tas sur une plaque et enfourne 25 min à 200 °C sans ouvrir le four."],
  ["Salade lyonnaise à l'œuf mollet", "fr", "entree", 25, 4, "", "salade:250 oeuf:240 lardons:120 baguette:100 vinaigre:20 huile:30 moutarde:10 sel:0", "Fais cuire les œufs 6 min, refroidis-les et écale-les.|Fais dorer les lardons et des croûtons de pain.|Prépare une vinaigrette à la moutarde, mélange avec la salade, ajoute lardons, croûtons et un œuf par assiette."],
  ["Gratin de quenelles sauce tomate", "fr", "plat", 40, 4, "", "semoule:200 oeuf:150 lait:250 beurre:30 concasse:500 oignon:80 emmental:50 salade:150 sel:0", "Prépare une pâte avec le lait chaud, le beurre, la semoule et les œufs, forme des quenelles avec deux cuillères.|Poche-les 10 min dans l'eau frémissante.|Dispose-les sur la sauce tomate à l'oignon, parsème d'emmental et gratine 20 min à 200 °C. Sers avec la salade."],
  ["Brandade de morue légère", "fr", "plat", 50, 4, "", "cabillaud:500 pdt:600 lait:200 huile:40 ail:10 herbes:10 salade:150 sel:0", "Fais pocher le poisson 8 min dans le lait avec l'ail.|Fais cuire les pommes de terre à l'eau et écrase-les.|Mélange avec le poisson émietté, l'huile d'olive et un peu de lait de cuisson.|Gratine 15 min à 200 °C et sers avec la salade."],
  ["Tielle sétoise (tourte au poisson et tomate)", "fr", "plat", 60, 6, "", "pizza:400 thon:280 concasse:400 oignon:150 ail:10 epices:3 huile:20 salade:200 sel:0", "Fais revenir l'oignon et l'ail, ajoute la tomate, le paprika et laisse réduire 15 min. Ajoute le thon émietté.|Étale les deux tiers de la pâte dans un moule, garnis, couvre avec le reste et soude les bords.|Enfourne 35 min à 200 °C et sers avec la salade."],
  ["Soupe corse aux haricots et légumes", "fr", "soupe", 60, 4, "", "harblanc:400 pdt:300 carotte:200 poireau:150 chou:250 oignon:100 jamboncru:60 bouillon:10 herbes:10 sel:0", "Fais revenir l'oignon et le jambon cru en dés.|Ajoute les légumes en morceaux et 1,5 l de bouillon, laisse cuire 40 min.|Ajoute les haricots 10 min avant la fin et les herbes au moment de servir."],
  ["Fiadone (gâteau corse au fromage frais et citron)", "fr", "dessert", 50, 8, "", "ricotta:500 oeuf:250 sucre:120 citron:60", "Mélange la ricotta avec le sucre et le zeste de citron.|Incorpore les œufs battus.|Verse dans un moule et fais cuire 35 min à 180 °C. Sers froid."]
];
P.REGION_OF = { "Endives au jambon gratinées (façon ch'ti)": "nord", "Carbonade flamande légère (sans bière)": "nord", "Poulet vallée d'Auge (sans calvados)": "nor", "Teurgoule normande (riz au lait à la cannelle)": "nor", "Œufs en meurette (sauce sans vin)": "bou", "Gougères au comté": "bou", "Salade lyonnaise à l'œuf mollet": "lyo", "Gratin de quenelles sauce tomate": "lyo", "Brandade de morue légère": "lang", "Tielle sétoise (tourte au poisson et tomate)": "lang", "Soupe corse aux haricots et légumes": "cor", "Fiadone (gâteau corse au fromage frais et citron)": "cor" };

/* ---------- Mode Noël : recettes de fêtes plus légères ---------- */
// Même format que recipes-hand.js
P.XMAS = [
  ["Dinde rôtie aux marrons et légumes d'hiver", "fr", "plat", 120, 6, "noel", "dinde:1200 marron:400 carotte:400 panais:400 oignon:150 huile:30 herbes:10 bouillon:10 sel:0", "Préchauffe le four à 180 °C.|Dispose les légumes coupés en morceaux autour de la volaille, arrose d'huile et de bouillon.|Fais rôtir 1 h 30 en arrosant toutes les 20 min, ajoute les marrons 20 min avant la fin.|Vérifie la cuisson à cœur (jus clair) avant de servir."],
  ["Saumon en croûte d'herbes et purée de céleri", "fr", "plat", 40, 4, "noel", "saumon:600 herbes:20 chapelure:30 citron:50 celerirave:700 lait:150 huile:15 sel:0", "Fais cuire le céleri en morceaux 20 min à l'eau, mixe-le avec le lait.|Mélange chapelure, herbes et zeste de citron, étale sur les pavés de saumon.|Enfourne 15 min à 200 °C et sers sur la purée."],
  ["Velouté de châtaignes et champignons", "fr", "entree", 35, 4, "noel", "marron:300 champi:300 oignon:100 bouillon:10 cremel:100 huile:10 sel:0", "Fais revenir l'oignon et les champignons dans l'huile.|Ajoute les châtaignes et 80 cl de bouillon, laisse cuire 20 min.|Mixe avec la crème légère et rectifie l'assaisonnement."],
  ["Chapon farci aux pommes et noix", "fr", "plat", 180, 8, "noel", "chapon:3000 pomme:500 noix:80 oignon:150 painc:150 lait:100 herbes:10 sel:0", "Mélange le pain trempé dans le lait, les pommes en dés, les noix, l'oignon et les herbes pour la farce.|Farcis le chapon, ficelle-le et enfourne à 170 °C.|Compte 3 h environ en arrosant régulièrement, la viande doit être bien cuite à cœur."],
  ["Bûche roulée légère aux fruits rouges", "fr", "dessert", 50, 8, "noel", "oeuf:200 sucre:80 farine:80 fblanc:300 framboise:250 sel:0", "Fouette les œufs avec le sucre jusqu'à ce que le mélange blanchisse, ajoute la farine.|Étale sur une plaque et cuis 10 min à 180 °C, roule à chaud dans un torchon.|Déroule, garnis de fromage blanc et de fruits rouges, roule de nouveau et garde au frais 2 h."],
  ["Pain d'épices maison", "fr", "dessert", 70, 10, "noel", "farine:250 miel:200 lait:150 oeuf:100 epices:10 sucre:50 sel:0", "Fais tiédir le lait avec le miel et les épices.|Mélange avec la farine, le sucre, les œufs et une pincée de levure.|Verse dans un moule à cake et cuis 50 min à 160 °C."],
  ["Clémentines rôties à la cannelle", "fr", "dessert", 25, 4, "noel", "clementine:600 miel:30 epices:2 amande:30", "Coupe les clémentines en deux, arrose de miel et de cannelle.|Enfourne 15 min à 200 °C et parsème d'amandes effilées grillées."],
  ["Verrines d'avocat et crevettes", "fr", "entree", 15, 6, "noel", "avocat:300 crevette:250 citron:50 tomcerise:150 herbes:5 sel:0", "Écrase les avocats avec le jus de citron.|Monte les verrines : avocat, tomates cerises en dés, crevettes cuites.|Garde au frais et parsème d'herbes au moment de servir."],
  ["Gratin de patates douces et marrons", "fr", "plat", 60, 6, "noel", "patate:1000 marron:300 lait:300 emmental:80 epices:2 sel:0", "Coupe les patates douces en rondelles fines.|Alterne patates et marrons dans un plat, verse le lait épicé, parsème de fromage.|Enfourne 45 min à 180 °C."],
  ["Truffes au chocolat noir et cacao", "fr", "dessert", 30, 10, "noel", "choco:200 cremel:100 cacao:20", "Fais fondre le chocolat dans la crème chaude.|Laisse prendre 2 h au frais, forme des billes et roule-les dans le cacao."]
];
P.XMAS_ING = { marron: ["Châtaignes cuites (marrons)", "ep", 180, 2.5, 38, 1.5, 0], chapon: ["Chapon", "vi", 230, 19, 0, 17, 3000, "m"], chapelure: ["Chapelure", "ep", 380, 12, 75, 4, 0, "g"] };

/* ---------- Index glycémique estimé par catégorie (tables internationales, Atkinson et al. 2021) ---------- */
// [motif sur les catégories Open Food Facts, IG approximatif, libellé]
P.GI = [
  [/en:sodas|en:sweetened-beverages|en:fruit-juices/, 65, "boissons sucrées et jus"],
  [/en:white-breads|en:sandwich-breads|en:baguettes|en:breads(?!.*whole)/, 75, "pain blanc"],
  [/en:wholemeal-breads|en:whole-grain-breads|en:rye-breads/, 55, "pain complet ou de seigle"],
  [/en:rice-cakes|en:puffed/, 82, "galettes de riz soufflé"],
  [/en:breakfast-cereals.*(corn|flakes)|en:corn-flakes/, 80, "céréales soufflées ou pétales de maïs"],
  [/en:mueslis|en:rolled-oats|en:oat-flakes|en:porridge/, 55, "flocons d'avoine, muesli"],
  [/en:pastas|en:spaghetti|en:noodles/, 50, "pâtes (cuisson al dente)"],
  [/en:basmati/, 58, "riz basmati"],
  [/en:rices|en:white-rices/, 70, "riz blanc"],
  [/en:potatoes|en:mashed-potatoes|en:french-fries|en:chips-and-fries/, 78, "pommes de terre"],
  [/en:legumes|en:lentils|en:chickpeas|en:beans/, 30, "légumineuses"],
  [/en:dairies|en:yogurts|en:milks/, 35, "produits laitiers"],
  [/en:biscuits|en:cookies|en:cakes|en:pastries|en:viennoiseries/, 65, "biscuits et gâteaux"],
  [/en:chocolate-spreads|en:hazelnut-spreads|en:cocoa-and-hazelnuts-spreads/, 33, "pâte à tartiner chocolat-noisette"],
  [/en:chocolates/, 40, "chocolat"],
  [/en:honeys|en:sugars|en:confectioneries|en:candies/, 70, "sucres et confiseries"],
  [/en:jams/, 55, "confitures"],
  [/en:bananas/, 51, "banane"],
  [/en:apples|en:pears|en:oranges|en:fresh-fruits/, 40, "fruits frais"]
];
P.GI_SRC = "Estimation d'après la catégorie du produit (tables internationales d'index glycémique, Atkinson et al., 2021). L'IG réel dépend de la recette, de la cuisson et du repas.";

/* ---------- Calendrier des promos : périodes habituelles (dates exactes : prospectus de ton magasin) ---------- */
// [mois de début (1-12), mois de fin, emoji, titre, détail]
P.PROMO_CAL = [
  [1, 1, "🥂", "Lendemains de fêtes", "Déstockage des produits de Noël (chocolats, foie gras, saumon) début janvier."],
  [2, 2, "🥞", "Chandeleur (2 février)", "Promotions sur farine, œufs, lait, pâtes à tartiner autour du 2 février."],
  [3, 4, "🍷", "Foires aux vins de printemps", "Plusieurs enseignes organisent une foire aux vins au printemps (mars-avril)."],
  [3, 4, "🍫", "Pâques", "Chocolats de Pâques, agneau ; déstockage du chocolat juste après Pâques."],
  [6, 8, "🍖", "Saison des barbecues", "Viandes à griller, boissons, glaces et produits d'apéritif en été."],
  [8, 9, "🎒", "Rentrée", "Petits-déjeuners, goûters et produits du quotidien en lots fin août et septembre."],
  [9, 10, "🍷", "Foires aux vins d'automne", "La plus grande période de promotions sur le vin, de fin août à octobre selon les enseignes."],
  [11, 12, "🎄", "Fêtes de fin d'année", "Foie gras, saumon, chocolats, champagne : comparer dès novembre."]
];
P.PROMO_SRC = "Périodes habituelles des opérations commerciales en France. Les dates changent chaque année et selon l'enseigne : vérifie dans le prospectus de ton magasin.";

/* ---------- Marques de distributeurs (panier anti-inflation) ---------- */
P.MDD = /carrefour|auchan|leclerc|marque rep[eè]re|eco\+|\bu\b|syst[eè]me u|bien vu|casino|monoprix|intermarch[eé]|top budget|chabrior|p[aâ]turages|lidl|aldi|netto|franprix|leader price|cora|match|simply|lid?l|milbona|belbake|cien|tous les jours|super u|delisse|saint eloi|monique ranou|paquito|itin[eé]raire des saveurs|reflets de france|n[o°]1|premier prix|1er prix|cmi|c['’]est qui le patron/i;

/* ---------- Succès façon jeu vidéo ---------- */
// [clé, emoji, titre, description, condition(journal)]
P.ACHIEVEMENTS = [
  ["bio10", "🏴", "Pirate du bio", "10 produits bio scannés", l => new Set(l.filter(x => x.e === "scan" && x.bio).map(x => x.c)).size >= 10],
  ["vegking", "🥕", "Roi des légumes", "10 recettes végétariennes ouvertes", l => l.filter(x => x.e === "recipe" && x.veg).length >= 10],
  ["antigaspi", "🧊", "Capitaine anti-gaspi", "10 produits consommés à temps", l => l.filter(x => x.e === "eaten").length >= 10],
  ["navig", "🧭", "Navigateur des rayons", "100 scans", l => l.filter(x => x.e === "scan").length >= 100],
  ["noscan", "🌙", "Scanneur de minuit", "Un scan entre minuit et 5 h", l => l.some(x => x.e === "scan" && new Date(x.t).getHours() < 5)],
  ["compare5", "⚖️", "Juge impartial", "5 comparaisons", l => l.filter(x => x.e === "compare").length >= 5],
  ["planner", "📅", "Grand stratège", "Planning de la semaine rempli", l => l.some(x => x.e === "plan")],
  ["medas", "🫒", "Cœur méditerranéen", "Score méditerranéen de 9 ou plus", l => l.some(x => x.e === "medas" && x.s >= 9)],
  ["health7", "📈", "Patient modèle", "7 mesures de santé notées", l => l.filter(x => x.e === "measure").length >= 7],
  ["ticket", "🧾", "Comptable de l'extrême", "Un ticket de caisse scanné", l => l.some(x => x.e === "ticket")],
  ["surprise", "🎲", "Aventurier du dîner", "5 fois « Surprends-moi »", l => l.filter(x => x.e === "surprise").length >= 5],
  ["xmas", "🎄", "Lutin gourmand", "Une recette de Noël ouverte", l => l.some(x => x.e === "recipe" && x.xmas)],
  ["water", "💧", "Maître de l'hydratation", "8 verres d'eau dans la journée", l => l.some(x => x.e === "water8")],
  ["region", "🗺️", "Tour de France", "Recettes de 5 régions ouvertes", l => new Set(l.filter(x => x.e === "region").map(x => x.r)).size >= 5]
];
P.LEVELS = ["Moussaillon", "Mousse", "Matelot", "Quartier-maître", "Second", "Capitaine", "Amiral", "Légende des mers"];

/* ---------- Mascotte : accessoires (dessinés ici, génériques) ---------- */
P.HATS = {
  none: "",
  straw: '<ellipse cx="50" cy="30" rx="44" ry="9" fill="#e9c46a" stroke="#b08a2e" stroke-width="2"/><path d="M26 30 Q28 6 50 6 Q72 6 74 30 Z" fill="#f4d58d" stroke="#b08a2e" stroke-width="2"/><path d="M27 25 Q50 31 73 25 L74 30 Q50 36 26 30 Z" fill="#d62828"/>',
  santa: '<path d="M22 30 Q40 -2 72 6 Q86 10 88 26 L80 24 Q74 12 62 14 Q44 16 36 32 Z" fill="#d62828"/><circle cx="86" cy="28" r="7" fill="#fff"/><rect x="16" y="26" width="64" height="12" rx="6" fill="#fff"/>',
  crown: '<path d="M24 34 L28 10 L40 24 L50 6 L60 24 L72 10 L76 34 Z" fill="#ffd23f" stroke="#c99700" stroke-width="2"/><circle cx="50" cy="26" r="3" fill="#e63946"/><circle cx="36" cy="28" r="2.5" fill="#457b9d"/><circle cx="64" cy="28" r="2.5" fill="#2a9d8f"/>',
  chef: '<path d="M28 34 L28 22 Q16 20 20 10 Q24 2 34 6 Q40 -2 50 2 Q60 -2 66 6 Q76 2 80 10 Q84 20 72 22 L72 34 Z" fill="#fff" stroke="#ccc" stroke-width="2"/><rect x="28" y="28" width="44" height="7" fill="#eee"/>',
  cap: '<path d="M24 32 Q24 8 50 8 Q76 8 76 32 Z" fill="#1d4ed8"/><path d="M60 30 Q86 28 94 34 Q80 38 60 34 Z" fill="#1e3a8a"/><circle cx="50" cy="9" r="3" fill="#1e3a8a"/>',
  party: '<path d="M38 34 L52 0 L66 34 Z" fill="#7c3aed"/><circle cx="52" cy="1" r="4" fill="#facc15"/><circle cx="48" cy="22" r="2" fill="#facc15"/><circle cx="56" cy="14" r="2" fill="#22c55e"/><circle cx="57" cy="27" r="2" fill="#f43f5e"/>',
  beanie: '<path d="M22 34 Q22 4 50 4 Q78 4 78 34 Z" fill="#2a9d8f"/><rect x="20" y="28" width="60" height="9" rx="4" fill="#264653"/><circle cx="50" cy="4" r="6" fill="#e9c46a"/>'
};
P.HAT_LIST = [["none", "Aucun"], ["straw", "Chapeau de paille"], ["santa", "Bonnet de Noël"], ["crown", "Couronne"], ["chef", "Toque"], ["cap", "Casquette"], ["party", "Chapeau de fête"], ["beanie", "Bonnet"]];
P.TINTS = [["none", "Rouge d'origine", ""], ["pink", "Rose", "hue-rotate(-20deg) saturate(1.1)"], ["violet", "Violet", "hue-rotate(-70deg)"], ["blue", "Bleu", "hue-rotate(-140deg)"], ["green", "Vert", "hue-rotate(110deg)"], ["gold", "Doré", "hue-rotate(40deg) saturate(1.3)"]];
})(window);
