// Base des ingrédients cosmétiques (liste INCI) : niveau de risque, rôle, explication et sources.
// Niveaux : none = sans risque connu, low = faible, mod = modéré, high = fort.
// Les explications résument les avis publics des agences citées ; elles ne remplacent pas un avis médical.
(function (root) {
"use strict";

const SOURCES = {
  SCCS: "CSSC – Comité scientifique européen pour la sécurité des consommateurs (avis publiés)",
  REG: "Règlement cosmétique européen (CE) n° 1223/2009 et ses annexes",
  ANSM: "ANSM – Agence nationale de sécurité du médicament et des produits de santé",
  ECHA: "ECHA – classification harmonisée CLP",
  REACH: "ECHA – restrictions REACH",
  CIRC: "CIRC – Centre international de recherche sur le cancer (OMS)",
  INRS: "INRS – fiches toxicologiques",
  ANSES: "ANSES – Agence nationale de sécurité sanitaire",
  EDL: "Listes européennes des perturbateurs endocriniens (edlists.org)"
};

// [motif, nom affiché, niveau, rôle, pourquoi, sources, étiquettes]
const RAW = [
  // ---------- Risque fort ----------
  [/isobutylparaben|isopropylparaben|phenylparaben|benzylparaben|pentylparaben/, "Parabène interdit", "high", "Conservateur",
    "Ces parabènes sont interdits dans les cosmétiques en Europe depuis 2014 faute de données de sécurité suffisantes et pour leur effet perturbateur endocrinien suspecté.", ["SCCS", "REG"], ["ed"]],
  [/butylparaben/, "Butylparabène", "high", "Conservateur",
    "Perturbateur endocrinien suspecté (effet œstrogénique). Sa concentration est limitée en Europe et il est interdit dans les produits sans rinçage destinés au siège des enfants de moins de 3 ans.", ["SCCS", "REG", "EDL"], ["ed"]],
  [/propylparaben/, "Propylparabène", "high", "Conservateur",
    "Perturbateur endocrinien suspecté. Concentration limitée en Europe et interdit dans les produits sans rinçage pour le siège des moins de 3 ans.", ["SCCS", "REG", "EDL"], ["ed"]],
  [/butylphenyl methylpropional|\blilial\b/, "Lilial (butylphenyl methylpropional)", "high", "Parfum",
    "Classé toxique pour la reproduction (catégorie 1B). Interdit dans les cosmétiques en Europe depuis mars 2022 : un produit qui en contient est ancien ou non conforme.", ["ECHA", "REG"], ["repro"]],
  [/zinc pyrithione/, "Pyrithione de zinc", "high", "Antipelliculaire, conservateur",
    "Classé toxique pour la reproduction (catégorie 1B). Interdit dans les cosmétiques en Europe depuis mars 2022.", ["ECHA", "REG", "SCCS"], ["repro"]],
  [/cyclotetrasiloxane|\bd4\b/, "Cyclotétrasiloxane (D4)", "high", "Silicone volatil",
    "Suspecté toxique pour la reproduction et perturbateur endocrinien, très persistant dans l'environnement. Interdit comme ingrédient cosmétique en Europe et limité à l'état de trace.", ["ECHA", "REACH", "REG"], ["ed", "repro"]],
  [/4-methylbenzylidene camphor|\b4-mbc\b|enzacamene/, "4-MBC (filtre UV)", "high", "Filtre UV",
    "Perturbateur endocrinien suspecté (thyroïde, hormones sexuelles). Le CSSC n'a pas pu conclure à sa sécurité ; il est retiré de la liste des filtres autorisés en Europe.", ["SCCS", "REG", "EDL"], ["ed"]],
  [/hydroquinone/, "Hydroquinone", "high", "Éclaircissant",
    "Interdite dans les cosmétiques en Europe (sauf faux ongles en usage professionnel) : risque d'irritation, d'ochronose (taches bleu-noir) et suspicion de mutagénicité.", ["REG", "ECHA"], ["cancer2B"]],
  [/\bformaldehyde\b|\bformol\b|methylene glycol|formaline/, "Formaldéhyde", "high", "Conservateur",
    "Cancérogène certain pour l'homme (groupe 1 du CIRC) et puissant allergène. Interdit comme ingrédient dans les cosmétiques en Europe depuis 2019.", ["CIRC", "INRS", "ECHA", "REG"], ["cancer1", "allergen"]],
  [/dmdm hydantoin|quaternium-15|imidazolidinyl urea|diazolidinyl urea|bronopol|2-bromo-2-nitropropane|sodium hydroxymethylglycinate|benzylhemiformal|5-bromo-5-nitro-1,3-dioxane/, "Libérateur de formaldéhyde", "high", "Conservateur",
    "Libère lentement du formaldéhyde, cancérogène certain (CIRC groupe 1) et allergène. L'étiquette doit porter « libère du formaldéhyde » au-delà d'un seuil très bas.", ["CIRC", "INRS", "SCCS", "REG"], ["cancer1", "allergen"]],
  [/methylchloroisothiazolinone/, "Méthylchloroisothiazolinone", "high", "Conservateur",
    "Allergène de contact très puissant (eczéma). Interdite dans les produits sans rinçage en Europe, tolérée à très faible dose dans les produits rincés.", ["SCCS", "REG", "ANSM"], ["allergen"]],
  [/methylisothiazolinone/, "Méthylisothiazolinone (MIT)", "high", "Conservateur",
    "Allergène de contact très fréquent, à l'origine d'une « épidémie » d'eczémas dans les années 2010. Interdite dans les produits sans rinçage en Europe depuis 2017 et très limitée dans les produits rincés.", ["SCCS", "REG", "ANSM"], ["allergen"]],
  [/p-phenylenediamine|\bppd\b|paraphenylenediamine/, "Paraphénylènediamine (PPD)", "high", "Colorant capillaire",
    "Allergène de contact très puissant (réactions parfois sévères, notamment après un tatouage au henné noir). Interdite pour les moins de 16 ans selon l'étiquetage obligatoire.", ["SCCS", "REG", "ANSM"], ["allergen"]],
  [/toluene-2,5-diamine/, "Toluène-2,5-diamine", "high", "Colorant capillaire",
    "Allergène de contact puissant, de la même famille que la PPD. Étiquetage d'avertissement obligatoire.", ["SCCS", "REG"], ["allergen"]],
  [/\bbha\b|butylated hydroxyanisole/, "BHA (butylhydroxyanisol)", "high", "Antioxydant",
    "Cancérogène possible pour l'homme (groupe 2B du CIRC) et perturbateur endocrinien suspecté.", ["CIRC", "EDL"], ["cancer2B", "ed"]],
  [/triclosan/, "Triclosan", "high", "Antibactérien, conservateur",
    "Perturbateur endocrinien suspecté (thyroïde), favorise la résistance des bactéries, très toxique pour les organismes aquatiques. Autorisé seulement dans quelques produits et à faible dose.", ["SCCS", "REG", "ECHA"], ["ed"]],
  [/triclocarban/, "Triclocarban", "high", "Antibactérien",
    "Perturbateur endocrinien suspecté et très toxique pour les organismes aquatiques. Usage limité en Europe.", ["SCCS", "REG", "EDL"], ["ed"]],
  [/benzophenone-3|oxybenzone/, "Benzophénone-3 (oxybenzone)", "high", "Filtre UV",
    "Perturbateur endocrinien suspecté et allergène. Le CSSC a jugé les anciennes doses trop élevées : sa concentration est fortement réduite en Europe depuis 2022. Nocif pour les coraux.", ["SCCS", "REG", "EDL"], ["ed", "allergen"]],

  // ---------- Risque modéré ----------
  [/cetrimonium bromide|cetrimonium chloride|\bcetrimide\b|steartrimonium chloride/, "Cétrimonium (bromure ou chlorure)", "mod", "Tensioactif cationique, conservateur",
    "A un fort pouvoir irritant pour la peau et les yeux à l'état pur (classification CLP). Sa concentration est limitée par le règlement européen selon l'usage (rincé ou non) ; à éviter sur peau sensible ou lésée.", ["ECHA", "REG", "SCCS"], ["irritant"]],
  [/benzalkonium chloride|benzethonium chloride/, "Chlorure de benzalkonium", "mod", "Conservateur, antiseptique",
    "Irritant pour la peau et les yeux, et sensibilisant chez certaines personnes. Concentration limitée en Europe.", ["ECHA", "REG", "SCCS"], ["irritant", "allergen"]],
  [/sodium lauryl sulfate|ammonium lauryl sulfate|\bsls\b/, "Laurylsulfate (SLS)", "mod", "Tensioactif moussant",
    "Irritant pour la peau et les yeux, il dessèche et fragilise la barrière cutanée, surtout en usage fréquent ou sur peau atopique.", ["ECHA", "SCCS"], ["irritant"]],
  [/cyclopentasiloxane|cyclohexasiloxane|\bd5\b|\bd6\b/, "Cyclopentasiloxane (D5) / D6", "mod", "Silicone volatil",
    "Très persistant et bioaccumulable dans l'environnement. Sa présence est restreinte en Europe dans les produits rincés, puis dans les produits sans rinçage.", ["REACH", "ECHA", "SCCS"], ["env"]],
  [/ethylhexyl methoxycinnamate|octinoxate|octyl methoxycinnamate/, "Octinoxate (filtre UV)", "mod", "Filtre UV",
    "Perturbateur endocrinien suspecté ; sa sécurité est en cours de réévaluation par le CSSC. Nocif pour les milieux aquatiques.", ["SCCS", "EDL"], ["ed"]],
  [/homosalate/, "Homosalate (filtre UV)", "mod", "Filtre UV",
    "Perturbateur endocrinien suspecté. Le CSSC a jugé l'ancienne dose trop élevée : il est limité depuis 2022 et réservé aux produits pour le visage.", ["SCCS", "REG", "EDL"], ["ed"]],
  [/octocrylene/, "Octocrylène (filtre UV)", "mod", "Filtre UV",
    "Peut se dégrader en benzophénone avec le temps ; perturbateur endocrinien suspecté et allergène photo-induit. Jugé sûr par le CSSC jusqu'à 10 %.", ["SCCS", "EDL"], ["ed", "allergen"]],
  [/resorcinol/, "Résorcinol", "mod", "Colorant capillaire",
    "Allergène de contact et perturbateur endocrinien suspecté (thyroïde). Concentration limitée et avertissements obligatoires.", ["SCCS", "REG", "ECHA"], ["ed", "allergen"]],
  [/\btalc\b|\btalcum\b/, "Talc", "mod", "Poudre, absorbant",
    "Classé « probablement cancérogène » (groupe 2A) par le CIRC en 2024, notamment en usage génital. À ne pas inhaler : éviter les poudres pour bébés.", ["CIRC", "ANSM"], ["cancer2A"]],
  [/cocamide dea|lauramide dea|cocamide mea|diethanolamine|\bdea\b/, "Cocamide DEA / diéthanolamine", "mod", "Agent moussant",
    "Le condensat de diéthanolamine d'huile de coco est classé « cancérogène possible » (groupe 2B) par le CIRC ; risque de formation de nitrosamines.", ["CIRC", "SCCS"], ["cancer2B"]],
  [/polyaminopropyl biguanide|polyhexamethylene biguanide|\bphmb\b/, "PHMB (polyaminopropyl biguanide)", "mod", "Conservateur",
    "Suspecté cancérogène (catégorie 2) et sensibilisant cutané. Limité à 0,1 % et interdit dans les sprays en Europe.", ["ECHA", "SCCS", "REG"], ["cancer2B", "allergen"]],
  [/salicylic acid|acide salicylique/, "Acide salicylique", "mod", "Exfoliant, conservateur",
    "Classé toxique pour la reproduction suspecté (catégorie 2). Autorisé à faible dose, mais à éviter chez les moins de 3 ans (sauf shampooings) et pendant la grossesse en produit sans rinçage.", ["SCCS", "ECHA", "REG"], ["repro"]],
  [/titanium dioxide.*nano|\[nano\]|\(nano\)/, "Nanoparticules", "mod", "Filtre UV, pigment",
    "Sous forme nano, les particules peuvent être inhalées dans les sprays et poudres. Le dioxyde de titane inhalé est classé « cancérogène possible » (CIRC 2B). Sans souci sur peau saine en crème.", ["SCCS", "CIRC", "ANSES"], ["cancer2B"]],
  [/aluminum chlorohydrate|aluminium chlorohydrate|aluminum zirconium|aluminium zirconium|aluminum chloride|aluminium chloride|sels? d'aluminium/, "Sel d'aluminium", "mod", "Anti-transpirant",
    "Une partie passe la peau, surtout si elle est lésée (après rasage). L'ANSM avait recommandé une limite basse ; le CSSC a ensuite jugé sûres les doses courantes. Prudence sur peau abîmée.", ["ANSM", "SCCS"], []],
  [/galaxolide|hexamethylindanopyran|tonalide|acetyl hexamethyl tetralin|musk ketone/, "Musc synthétique", "mod", "Parfum",
    "Persistant dans l'environnement et l'organisme ; perturbateur endocrinien suspecté pour certains.", ["SCCS", "EDL"], ["ed", "env"]],

  // ---------- Risque faible ----------
  [/sodium laureth sulfate|ammonium laureth sulfate|\bsles\b/, "Laureth sulfate (SLES)", "low", "Tensioactif moussant",
    "Moins irritant que le SLS mais peut dessécher. Peut contenir des traces de 1,4-dioxane liées à sa fabrication.", ["SCCS"], ["irritant"]],
  [/behentrimonium|cetrimonium methosulfate|polyquaternium/, "Ammonium quaternaire", "low", "Démêlant, antistatique",
    "Utilisé en après-shampooing à faible dose ; peut irriter les yeux et les peaux sensibles.", ["SCCS", "REG"], ["irritant"]],
  [/methylparaben|ethylparaben/, "Parabène court (méthyl/éthyl)", "low", "Conservateur",
    "Les parabènes courts sont jugés sûrs par le CSSC aux doses autorisées ; ils sont bien moins actifs que les parabènes longs.", ["SCCS", "REG"], []],
  [/phenoxyethanol/, "Phénoxyéthanol", "low", "Conservateur",
    "Sûr à 1 % maximum chez l'adulte selon le CSSC. L'ANSM recommande de l'éviter dans les produits sans rinçage pour le siège des enfants de moins de 3 ans.", ["SCCS", "ANSM"], []],
  [/\bbht\b|butylated hydroxytoluene/, "BHT (butylhydroxytoluène)", "low", "Antioxydant",
    "Perturbateur endocrinien suspecté à forte dose ; jugé sûr par le CSSC aux concentrations utilisées en cosmétique.", ["SCCS", "EDL"], ["ed"]],
  [/\bpeg-?\d+|\bppg-?\d+|ceteareth|laureth-\d+|steareth|polysorbate/, "Dérivé éthoxylé (PEG, polysorbate…)", "low", "Émulsifiant",
    "Peut contenir des traces d'oxyde d'éthylène ou de 1,4-dioxane ; facilite la pénétration d'autres substances sur peau lésée.", ["SCCS"], []],
  [/paraffinum liquidum|mineral oil|huile minérale|petrolatum|vaseline|paraffin\b|microcrystalline wax|ozokerite|ceresin/, "Dérivé pétrolier (huile minérale, vaseline)", "low", "Émollient, occlusif",
    "Bien toléré par la peau s'il est hautement raffiné ; risque de contamination par des hydrocarbures aromatiques (MOAH) s'il l'est mal, surtout dans les produits pour les lèvres.", ["ANSES", "SCCS"], []],
  [/benzophenone|butyl methoxydibenzoylmethane|avobenzone|ethylhexyl salicylate|octisalate|benzophenone-4/, "Filtre UV chimique", "low", "Filtre UV",
    "Autorisé en Europe ; certains filtres peuvent provoquer des allergies au soleil et sont nocifs pour les milieux aquatiques.", ["SCCS", "REG"], ["allergen"]],
  [/\bparfum\b|\bfragrance\b|\baroma\b/, "Parfum", "low", "Parfum",
    "Mélange de composés non détaillés sur l'étiquette ; principale cause d'allergie aux cosmétiques. À éviter sur peau atopique et chez le bébé.", ["SCCS", "REG"], ["allergen"]],
  [/limonene|linalool|citral|geraniol|eugenol|coumarin|cinnamal|cinnamyl alcohol|citronellol|benzyl salicylate|benzyl benzoate|benzyl cinnamate|hexyl cinnamal|amyl cinnamal|alpha-isomethyl ionone|farnesol|hydroxycitronellal|anise alcohol|isoeugenol|evernia/, "Allergène de parfum", "low", "Parfum",
    "Fait partie des allergènes de parfum dont la mention est obligatoire en Europe au-delà d'un seuil. Sans problème sauf allergie connue.", ["SCCS", "REG"], ["allergen"]],
  [/triethanolamine|^tea$/, "Triéthanolamine (TEA)", "low", "Régulateur de pH",
    "Peut irriter et former des nitrosamines avec certains ingrédients ; son usage est encadré en Europe.", ["SCCS", "REG"], []],
  [/retinol|retinyl palmitate|retinyl acetate/, "Rétinol (vitamine A)", "low", "Actif anti-âge",
    "Sûr aux doses limitées par l'Europe, mais il s'ajoute à la vitamine A de l'alimentation : à éviter pendant la grossesse par précaution. Peut irriter.", ["SCCS", "REG"], ["preg"]],
  [/benzyl alcohol/, "Alcool benzylique", "low", "Conservateur, solvant",
    "Allergène de parfum à mention obligatoire ; bien toléré en général.", ["SCCS", "REG"], ["allergen"]],
  [/alcohol denat|alcool dénaturé|^alcohol$|ethanol/, "Alcool", "low", "Solvant",
    "Peut dessécher et irriter les peaux sensibles en usage répété.", ["SCCS"], ["irritant"]],
  [/polyethylene|polypropylene|nylon-\d+|acrylates copolymer|acrylates\/c10-30|polymethyl methacrylate|polystyrene/, "Polymère plastique (microplastique)", "low", "Texturant, exfoliant",
    "Sans danger reconnu pour la peau, mais pollue durablement l'eau. L'Europe interdit progressivement les microplastiques ajoutés.", ["REACH", "ECHA"], ["env"]],
  [/sodium benzoate|potassium sorbate|sorbic acid|benzoic acid|dehydroacetic acid/, "Conservateur doux", "low", "Conservateur",
    "Conservateur bien toléré, également utilisé dans l'alimentation ; rares irritations.", ["SCCS", "REG"], []],
  [/propylene glycol|butylene glycol|pentylene glycol/, "Glycol", "low", "Humectant, solvant",
    "Bien toléré en général ; irritations ou allergies rares, surtout sur peau atopique.", ["SCCS"], []],
  [/cocamidopropyl betaine/, "Cocamidopropyl bétaïne", "low", "Tensioactif doux",
    "Tensioactif doux, mais ses impuretés de fabrication peuvent être allergisantes chez quelques personnes.", ["SCCS"], ["allergen"]],
  [/\bci ?[1-6]\d{4}\b/, "Colorant (CI)", "low", "Colorant",
    "Colorant autorisé par l'annexe IV du règlement cosmétique ; quelques colorants peuvent être allergisants.", ["REG"], []],
  [/kojic acid/, "Acide kojique", "low", "Éclaircissant",
    "Limité à 1 % dans les produits visage depuis 2024 selon l'avis du CSSC.", ["SCCS", "REG"], []],
  [/isopropyl myristate|isopropyl palmitate/, "Myristate d'isopropyle", "low", "Émollient",
    "Bien toléré, mais peut favoriser les boutons sur peau grasse (comédogène).", [], []],

  // ---------- Sans risque connu ----------
  [/^aqua\b|^water\b|^eau\b|aqua \(water\)|eau \(aqua\)/, "Eau (aqua)", "none", "Solvant", "Base de la plupart des cosmétiques.", [], []],
  [/glycerin|glycérine|glycerol/, "Glycérine", "none", "Hydratant", "Hydratant de référence, très bien toléré.", [], []],
  [/cetearyl alcohol|cetyl alcohol|stearyl alcohol|behenyl alcohol|myristyl alcohol/, "Alcool gras", "none", "Émollient, épaississant", "Malgré son nom, ce n'est pas un alcool desséchant : c'est une cire douce issue des huiles végétales.", [], []],
  [/glyceryl stearate|glyceryl oleate|glyceryl caprylate|sorbitan|cetearyl glucoside|coco-glucoside|decyl glucoside|lauryl glucoside|caprylyl\/capryl glucoside|sucrose|polyglyceryl/, "Émulsifiant doux", "none", "Émulsifiant", "Émulsifiant ou tensioactif doux, généralement d'origine végétale.", [], []],
  [/\boil\b|butter|huile|beurre/, "Huile ou beurre végétal", "none", "Émollient", "Huile ou beurre végétal nourrissant. Allergie possible seulement en cas d'allergie connue à la plante (ex. fruits à coque).", [], []],
  [/hexanediol|1,2-hexanediol|caprylhydroxamic acid|glyceryl caprylate|levulinic acid|sodium levulinate|sodium anisate|p-anisic acid/, "Conservateur doux", "none", "Conservateur, humectant", "Conservateur ou co-conservateur doux, bien toléré aux doses utilisées.", [], []],
  [/caprylic\/capric triglyceride|squalane|coco-caprylate|dicaprylyl|isoamyl laurate|c12-15 alkyl benzoate|ethylhexyl palmitate|octyldodecanol|isononyl isononanoate|caprylyl glycol|ethylhexylglycerin/, "Émollient", "none", "Émollient", "Émollient bien toléré qui donne de la douceur.", [], []],
  [/dimethicone|amodimethicone|dimethiconol|cyclomethicone|silica|silicone/, "Silicone ou silice", "none", "Texturant", "Inerte et bien toléré par la peau ; les silicones non volatils sont peu biodégradables.", [], []],
  [/tocopherol|tocopheryl|vitamin e/, "Vitamine E", "none", "Antioxydant", "Antioxydant protecteur, très bien toléré.", [], []],
  [/panthenol|allantoin|bisabolol|niacinamide|hyaluron|sodium pca|betaine|urea|ceramide|cholesterol|madecassoside|centella|aloe barbadensis|aloe vera|chamomilla|calendula|avena sativa|\boat\b|glycyrrhiza|ascorbyl|ascorbic acid|ferulic|caffeine|zinc gluconate|lactobacillus|inulin|trehalose|beta-glucan/, "Actif apaisant ou hydratant", "none", "Soin", "Ingrédient de soin reconnu comme bien toléré.", [], []],
  [/xanthan|carbomer|cellulose|guar|carrageenan|sclerotium|acacia|gellan|agar|alginate|pullulan|hydroxyethylcellulose|starch|amidon|maltodextrin/, "Épaississant", "none", "Texturant", "Gélifiant ou épaississant sans risque connu.", [], []],
  [/citric acid|lactic acid|sodium citrate|sodium hydroxide|potassium hydroxide|sodium chloride|magnesium|calcium carbonate|sodium bicarbonate|disodium edta|tetrasodium edta|sodium phytate|tetrasodium glutamate diacetate|gluconolactone|sodium gluconate/, "Régulateur ou stabilisant", "none", "pH, stabilité", "Ajuste le pH ou stabilise la formule ; sans effet sur la peau dans le produit fini.", [], []],
  [/sodium cocoyl isethionate|sodium lauroyl sarcosinate|sodium cocoyl glutamate|disodium cocoyl glutamate|sodium lauroyl glutamate|sodium coco-sulfate|sodium cocoamphoacetate|lauryl betaine/, "Tensioactif doux", "none", "Nettoyant", "Tensioactif doux, bien toléré.", [], []],
  [/zinc oxide|kaolin|mica|iron oxides|\bci ?77\d{3}\b|titanium dioxide|bentonite|montmorillonite|illite|charcoal/, "Minéral", "none", "Pigment, absorbant", "Minéral sans risque connu sur la peau (hors forme nano en spray).", [], []],
  [/cera alba|beeswax|cire d'abeille|candelilla|carnauba|lanolin/, "Cire", "none", "Texturant", "Cire naturelle bien tolérée ; la lanoline peut rarement être allergisante.", [], []],
  [/extract|extrait|leaf|flower|root|seed|fruit|juice|hydrolat|hydrolyzed/, "Extrait végétal", "none", "Soin", "Extrait de plante ; allergie possible seulement en cas de sensibilité à la plante.", [], []]
];

// Références précises, quand elles existent, ajoutées aux sources générales
const REFS = {
  "Parabène interdit": ["Règlement (UE) n° 358/2014 – interdiction de cinq parabènes"],
  "Butylparabène": ["Règlement (UE) n° 1004/2014 – limites du propyl- et du butylparabène"],
  "Propylparabène": ["Règlement (UE) n° 1004/2014 – limites du propyl- et du butylparabène"],
  "Lilial (butylphenyl methylpropional)": ["Règlement (UE) 2021/1902 – interdiction de substances CMR"],
  "Pyrithione de zinc": ["Règlement (UE) 2021/1902 – interdiction de substances CMR"],
  "Formaldéhyde": ["CIRC, Monographie volume 100F (2012) – formaldéhyde", "INRS, fiche toxicologique FT 7 – formaldéhyde"],
  "Libérateur de formaldéhyde": ["CIRC, Monographie volume 100F (2012) – formaldéhyde", "INRS, fiche toxicologique FT 7 – formaldéhyde"],
  "Méthylisothiazolinone (MIT)": ["Règlement (UE) 2016/1198 – MIT interdite dans les produits sans rinçage"],
  "Méthylchloroisothiazolinone": ["Règlement (UE) n° 1003/2014 – mélange MCI/MIT limité aux produits rincés"],
  "Talc": ["CIRC, Monographie volume 136 (2024) – talc"],
  "Nanoparticules": ["CIRC, Monographie volume 93 (2010) – dioxyde de titane"],
  "Cocamide DEA / diéthanolamine": ["CIRC, Monographie volume 101 (2013) – condensat de diéthanolamine d'huile de coco"],
  "Phénoxyéthanol": ["ANSM, recommandation de 2012 sur le phénoxyéthanol chez l'enfant de moins de 3 ans"]
};
// Noms affichés en français pour les ingrédients courants
const FR = { "aqua": "Eau", "water": "Eau", "aqua (water)": "Eau", "water (aqua)": "Eau", "glycerin": "Glycérine", "panthenol": "Vitamine B5 (panthénol)", "allantoin": "Allantoïne",
  "tocopherol": "Vitamine E (tocophérol)", "tocopheryl acetate": "Vitamine E (acétate de tocophéryle)", "xanthan gum": "Gomme xanthane", "sodium chloride": "Sel (chlorure de sodium)",
  "citric acid": "Acide citrique", "lactic acid": "Acide lactique", "sodium hydroxide": "Soude (hydroxyde de sodium)", "sodium benzoate": "Benzoate de sodium", "potassium sorbate": "Sorbate de potassium",
  "parfum": "Parfum", "parfum (fragrance)": "Parfum", "fragrance": "Parfum", "cetrimonium bromide": "Bromure de cétrimonium", "cetrimonium chloride": "Chlorure de cétrimonium",
  "sodium lauryl sulfate": "Laurylsulfate de sodium", "sodium laureth sulfate": "Laureth sulfate de sodium", "niacinamide": "Vitamine B3 (niacinamide)", "sodium hyaluronate": "Acide hyaluronique (sel)",
  "hyaluronic acid": "Acide hyaluronique", "urea": "Urée", "salicylic acid": "Acide salicylique", "alcohol denat.": "Alcool dénaturé", "alcohol denat": "Alcool dénaturé", "alcohol": "Alcool",
  "titanium dioxide": "Dioxyde de titane", "zinc oxide": "Oxyde de zinc", "talc": "Talc", "kaolin": "Kaolin (argile)", "butyrospermum parkii butter": "Beurre de karité",
  "butyrospermum parkii (shea) butter": "Beurre de karité", "cocos nucifera oil": "Huile de coco", "argania spinosa kernel oil": "Huile d'argan", "simmondsia chinensis seed oil": "Huile de jojoba",
  "prunus amygdalus dulcis oil": "Huile d'amande douce", "olea europaea fruit oil": "Huile d'olive", "helianthus annuus seed oil": "Huile de tournesol", "aloe barbadensis leaf juice": "Jus d'aloe vera",
  "cetearyl alcohol": "Alcool cétéarylique", "cetyl alcohol": "Alcool cétylique", "phenoxyethanol": "Phénoxyéthanol", "limonene": "Limonène", "linalool": "Linalol", "citral": "Citral",
  "geraniol": "Géraniol", "citronellol": "Citronellol", "coumarin": "Coumarine", "eugenol": "Eugénol", "benzyl alcohol": "Alcool benzylique", "dimethicone": "Diméthicone", "silica": "Silice",
  "caprylic/capric triglyceride": "Triglycérides caprylique/caprique", "squalane": "Squalane", "propylene glycol": "Propylène glycol", "butylene glycol": "Butylène glycol",
  "disodium edta": "EDTA disodique", "tetrasodium edta": "EDTA tétrasodique", "cera alba": "Cire d'abeille", "beeswax": "Cire d'abeille", "lanolin": "Lanoline", "mica": "Mica", "caffeine": "Caféine",
  "bisabolol": "Bisabolol", "ascorbic acid": "Vitamine C (acide ascorbique)", "retinol": "Rétinol (vitamine A)", "retinyl palmitate": "Palmitate de rétinyle (vitamine A)", "methylparaben": "Méthylparabène",
  "ethylparaben": "Éthylparabène", "propylparaben": "Propylparabène", "butylparaben": "Butylparabène", "triclosan": "Triclosan", "1,2-hexanediol": "1,2-Hexanediol", "sodium cocoamphoacetate": "Cocoamphoacétate de sodium",
  "cocamidopropyl betaine": "Cocamidopropyl bétaïne", "coco-glucoside": "Coco-glucoside", "decyl glucoside": "Décyl glucoside", "glyceryl stearate": "Stéarate de glycéryle", "paraffinum liquidum": "Huile minérale (paraffine liquide)",
  "petrolatum": "Vaseline", "aluminum chlorohydrate": "Chlorhydrate d'aluminium", "methylisothiazolinone": "Méthylisothiazolinone", "benzophenone-3": "Benzophénone-3", "octocrylene": "Octocrylène", "homosalate": "Homosalate" };
// Familles (le nom de la famille ne remplace pas le nom de l'ingrédient)
const GENERIC = new Set(["Huile ou beurre végétal", "Émulsifiant doux", "Émollient", "Silicone ou silice", "Actif apaisant ou hydratant", "Épaississant", "Régulateur ou stabilisant", "Tensioactif doux",
  "Minéral", "Cire", "Extrait végétal", "Conservateur doux", "Alcool gras", "Glycol", "Allergène de parfum", "Colorant (CI)", "Dérivé éthoxylé (PEG, polysorbate…)", "Dérivé pétrolier (huile minérale, vaseline)",
  "Filtre UV chimique", "Ammonium quaternaire", "Polymère plastique (microplastique)", "Parabène interdit", "Libérateur de formaldéhyde", "Sel d'aluminium", "Musc synthétique", "Nanoparticules", "Alcool"]);
function cap(s) { return s.replace(/\s+/g, " ").replace(/(^|[\s(\-\/])([a-zà-ÿ])/g, (m, a, b) => a + b.toUpperCase()); }
function displayName(label, e) {
  const k = label.toLowerCase().replace(/\s+/g, " ").trim();
  if (FR[k]) return FR[k];
  if (e && !GENERIC.has(e.name)) return e.name.replace(/ \(.*\)$/, "") === e.name ? e.name : e.name;
  return /^[A-Z0-9 ,\-()\/\[\].]+$/.test(label) ? cap(label.toLowerCase()) : label;
}
const DB = RAW.map(([re, name, lv, fn, why, src, tags]) => ({ re, name, lv, fn, why, src, tags, refs: REFS[name] || [] }));

// Découpe la liste INCI en ingrédients (en ignorant les virgules entre parenthèses)
function splitInci(text) {
  const out = []; let cur = "", depth = 0;
  const s = String(text || "").replace(/^\s*(ingr[ée]dients?|ingredients|composition|inci)\s*:?/i, "").replace(/\s+/g, " ");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    const numComma = ch === "," && /\d/.test(s[i - 1] || "") && /\d/.test(s[i + 1] || ""); // 1,2-hexanediol
    if ((ch === "," || ch === ";" || ch === "•" || ch === "·") && depth === 0 && !numComma) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out.map(x => x.replace(/[*°.]+$/g, "").replace(/^[\s\-–*]+|[\s*]+$/g, "").trim()).filter(x => x && x.length < 120);
}
function lookup(ing) {
  const s = ing.toLowerCase();
  for (const e of DB) if (e.re.test(s)) return e;
  return null;
}
// Composition détaillée : un élément par ingrédient de la liste
function composition(inci) {
  const seen = new Set();
  return splitInci(inci).filter(x => { const k = x.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .map(ing => { const e = lookup(ing); return { label: ing, name: displayName(ing, e), entry: e, lv: e ? e.lv : "unk" }; });
}

// Qualités du produit (absence d'ingrédients controversés), sur la liste complète
const QUALITIES = [
  ["noParaben", "🧴", "Sans parabène nocif", "Certains parabènes (butyl, propyl et les parabènes interdits) sont suspectés d'être des perturbateurs endocriniens.", c => !c.some(x => x.entry && /^(Butylparabène|Propylparabène|Parabène interdit)$/.test(x.entry.name))],
  ["noSulfate", "🫧", "Sans sulfate irritant", "Le laurylsulfate (SLS) est un détergent puissant qui décape et irrite la peau.", c => !c.some(x => x.entry && x.entry.name === "Laurylsulfate (SLS)")],
  ["noEd", "🧬", "Sans perturbateur endocrinien suspecté", "Aucun ingrédient de la composition n'est sur les listes de perturbateurs endocriniens suspectés.", c => !c.some(x => x.entry && x.entry.tags.includes("ed"))],
  ["noFormol", "⚗️", "Sans formaldéhyde", "Ni formaldéhyde ni conservateur qui en libère (cancérogène certain, allergène).", c => !c.some(x => x.entry && /formaldéhyde/i.test(x.entry.name))],
  ["noAllergen", "🌸", "Sans allergène de parfum", "Pas de parfum ni d'allergène de parfum à déclaration obligatoire : idéal pour les peaux sensibles.", c => !c.some(x => x.entry && x.entry.tags.includes("allergen") && /Parfum/.test(x.entry.fn))],
  ["noSilicone", "🌊", "Sans silicone persistant", "Pas de silicone volatil (D4, D5, D6), très persistant dans l'environnement.", c => !c.some(x => x.entry && /Silicone volatil/.test(x.entry.fn))],
  ["noPlastic", "♻️", "Sans microplastique", "Pas de polymère plastique ajouté qui pollue durablement l'eau.", c => !c.some(x => x.entry && /microplastique/.test(x.entry.name))]
];
function qualities(comp) { return comp.length ? QUALITIES.filter(q => q[4](comp)).map(([k, ico, title, why]) => ({ k, ico, title, why })) : []; }

root.CosmeticDB = { SOURCES, DB, splitInci, lookup, composition, qualities, displayName };
})(typeof window !== "undefined" ? window : globalThis);
