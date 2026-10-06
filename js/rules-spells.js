// Every 2014-era spell outside the SRD that data.js/expansions.js don't already define, plus corrections.
// Loaded after srd-spells.js: merges the bundled SRD spells and these rows into LOCAL_SPELLS, so the app
// needs no network for spells. Summaries are original mechanical paraphrases; the full text is in the books.
// Display names drop the WotC character names the way the SRD does; slugs stay so saved sheets still resolve.
// Row: [source, index, name, level, school, classes, castingTime, range, components, duration, summary, higherLevel, material]
const NEW_SPELLS = [];
// Complete 2014 class lists where the data above or the SRD's (no artificer, no XGE/TCE additions) is short.
const SPELL_CLASS_FIXES = {};
// Tasha's optional "expanded spell list" additions, used when the character turns on Tasha's optional features.
const SPELL_OPTIONAL_CLASSES = {};
// Field corrections for existing rows: { level, school, castingTime, range, components, duration, summary, higherLevel, material, source }.
const SPELL_FIXES = {};
const SPELL_RENAMES = {};

// Spells 0–3 missing from the app. Row: [source, index, name, level, school, classes, castingTime, range, components, duration, summary, higherLevel, material]
// Source codes: SJ = Spelljammer: Astral Adventurer's Guide, LLoK = Lost Laboratory of Kwalish, BMT = The Book of Many Things,
// Planescape = Planescape: Adventures in the Multiverse (Sigil and the Outlands).
NEW_SPELLS.push(
  ["SJ", "air-bubble", "Air Bubble", 2, "Conjuration", ["artificer", "druid", "ranger", "sorcerer", "wizard"], "1 action", "60 feet", ["S"], "24 hours",
    "A willing creature you can see in range gets a globe of fresh air around its head (just one head if it has several), so it can breathe normally until the spell ends.",
    "Two more globes (for other creatures) for each slot level above 2nd.", ""],
  ["LLoK", "flock-of-familiars", "Flock of Familiars", 2, "Conjuration", ["warlock", "wizard"], "1 minute", "Touch", ["V", "S"], "Concentration, up to 1 hour",
    "Call three temporary familiars that use the find familiar rules, all celestials, fey, or fiends (your choice) in animal shapes you pick; one fewer appears if you already have a familiar. Within 1 mile they talk with you telepathically and can share their sight or hearing, and one of them per turn can deliver a touch spell you cast.",
    "One more familiar for each slot level above 2nd.", ""],
  ["BMT", "spray-of-cards", "Spray of Cards", 2, "Conjuration", ["bard", "sorcerer", "warlock", "wizard"], "1 action", "Self (15-foot cone)", ["V", "S", "M"], "Instantaneous",
    "Ghostly playing cards fan out in a 15-foot cone: each creature there makes a Dexterity save, taking 2d10 force damage and being blinded until the end of its next turn on a failure, or half damage only on a success.",
    "Damage increases by 1d10 for each slot level above 2nd.", ""],
  ["Planescape", "warp-sense", "Warp Sense", 2, "Divination", ["sorcerer", "warlock", "wizard"], "1 action", "Self", ["V", "S", "M"], "Concentration, up to 1 minute",
    "You sense portals, even dormant ones, within 30 feet. As an action you can study one you sensed with a DC 15 check using your spellcasting ability: on a success you learn where it leads and what key opens it, and the spell ends; on a failure you learn nothing and can't study that portal again until you recast the spell. 1 foot of stone, 1 inch of common metal, a thin sheet of lead, or 3 feet of wood or dirt blocks the sense.",
    "", ""],
  ["BMT", "antagonize", "Antagonize", 3, "Enchantment", ["bard", "sorcerer", "warlock", "wizard"], "1 action", "30 feet", ["V", "S", "M"], "Instantaneous",
    "One creature you choose in range makes a Wisdom save or takes 4d4 psychic damage and must at once use its reaction to make a melee attack against another creature you can see and pick; if it can't make that attack, it instead has disadvantage on its next attack roll before the start of your next turn. On a success it takes half damage only.",
    "Damage increases by 1d4 for each slot level above 3rd.", ""],
  // Original name "Galder's Tower" (named wizard) — display name stripped like the SRD does.
  ["LLoK", "galders-tower", "Conjured Tower", 3, "Conjuration", ["wizard"], "10 minutes", "30 feet", ["V", "S", "M"], "24 hours",
    "Raise a sturdy two-story tower, round or square, each floor 10 feet tall and up to 100 square feet, joined by a ladder and hatch. Each floor is one furnished room you pick (bedroom, study, dining room, lounge, washroom, observatory, or empty), and the inside stays warm and dry. Furnishings carried out turn to smoke; when the spell ends, everyone and everything not created by it is set safely outside. Recasting it before it ends adds another 24 hours, and casting it in the same spot with the same layout every day for a year makes the tower permanent.",
    "One additional story for each slot level above 3rd.", ""],
);

// Full class list for EVERY spell 0–3 whose class list in the app is wrong or incomplete. Base lists only:
// PHB 2014 + XGE/SCAG/FTD/SCC/EGtW/AI lists + the TCE/ERLW artificer list. Tasha's "expanded spell list"
// additions live in SPELL_OPTIONAL_CLASSES. NOTE: spells first printed in TCE (mind sliver, caustic brew, mind whip,
// summon beast/fey/shadowspawn/undead, spirit shroud, intellect fortress) reach non-artificer classes ONLY through
// the optional expanded lists, so their base list is [] or ["artificer"] and the rest is in SPELL_OPTIONAL_CLASSES.
// "encode-thoughts" is on no class list (GGR Dimir guild-spell list only), hence [].
Object.assign(SPELL_CLASS_FIXES, {
  // level 0
  "acid-splash": ["artificer", "sorcerer", "wizard"],
  "dancing-lights": ["artificer", "bard", "sorcerer", "wizard"],
  "encode-thoughts": [],
  "fire-bolt": ["artificer", "sorcerer", "wizard"],
  "guidance": ["artificer", "cleric", "druid"],
  "light": ["artificer", "bard", "cleric", "sorcerer", "wizard"],
  "mage-hand": ["artificer", "bard", "sorcerer", "warlock", "wizard"],
  "mending": ["artificer", "bard", "cleric", "druid", "sorcerer", "wizard"],
  "message": ["artificer", "bard", "sorcerer", "wizard"],
  "mind-sliver": [],
  "poison-spray": ["artificer", "druid", "sorcerer", "warlock", "wizard"],
  "prestidigitation": ["artificer", "bard", "sorcerer", "warlock", "wizard"],
  "ray-of-frost": ["artificer", "sorcerer", "wizard"],
  "resistance": ["artificer", "cleric", "druid"],
  "shocking-grasp": ["artificer", "sorcerer", "wizard"],
  "spare-the-dying": ["artificer", "cleric"],
  // level 1
  "alarm": ["artificer", "ranger", "wizard"],
  "cure-wounds": ["artificer", "bard", "cleric", "druid", "paladin", "ranger"],
  "detect-magic": ["artificer", "bard", "cleric", "druid", "paladin", "ranger", "sorcerer", "wizard"],
  "disguise-self": ["artificer", "bard", "sorcerer", "wizard"],
  "expeditious-retreat": ["artificer", "sorcerer", "warlock", "wizard"],
  "faerie-fire": ["artificer", "bard", "druid"],
  "false-life": ["artificer", "sorcerer", "wizard"],
  "feather-fall": ["artificer", "bard", "sorcerer", "wizard"],
  "grease": ["artificer", "wizard"],
  "identify": ["artificer", "bard", "wizard"],
  "jump": ["artificer", "druid", "ranger", "sorcerer", "wizard"],
  "longstrider": ["artificer", "bard", "druid", "ranger", "wizard"],
  "purify-food-and-drink": ["artificer", "cleric", "druid", "paladin"],
  "sanctuary": ["artificer", "cleric"],
  "tashas-caustic-brew": ["artificer", "sorcerer", "wizard"],
  // level 2
  "aid": ["artificer", "cleric", "paladin"],
  "alter-self": ["artificer", "sorcerer", "wizard"],
  "arcane-lock": ["artificer", "wizard"],
  "blur": ["artificer", "sorcerer", "wizard"],
  "continual-flame": ["artificer", "cleric", "wizard"],
  "darkvision": ["artificer", "druid", "ranger", "sorcerer", "wizard"],
  "enhance-ability": ["artificer", "bard", "cleric", "druid", "sorcerer"],
  "enlarge-reduce": ["artificer", "sorcerer", "wizard"],
  "heat-metal": ["artificer", "bard", "druid"],
  "invisibility": ["artificer", "bard", "sorcerer", "warlock", "wizard"],
  "lesser-restoration": ["artificer", "bard", "cleric", "druid", "paladin", "ranger"],
  "levitate": ["artificer", "sorcerer", "wizard"],
  "magic-mouth": ["artificer", "bard", "wizard"],
  "magic-weapon": ["artificer", "paladin", "wizard"],
  "protection-from-poison": ["artificer", "cleric", "druid", "paladin", "ranger"],
  "rope-trick": ["artificer", "wizard"],
  "see-invisibility": ["artificer", "bard", "sorcerer", "wizard"],
  "spider-climb": ["artificer", "sorcerer", "warlock", "wizard"],
  "summon-beast": [],
  "tashas-mind-whip": [],
  "web": ["artificer", "sorcerer", "wizard"],
  // level 3
  "blink": ["artificer", "sorcerer", "wizard"],
  "create-food-and-water": ["artificer", "cleric", "paladin"],
  "dispel-magic": ["artificer", "bard", "cleric", "druid", "paladin", "sorcerer", "warlock", "wizard"],
  "fly": ["artificer", "sorcerer", "warlock", "wizard"],
  "glyph-of-warding": ["artificer", "bard", "cleric", "wizard"],
  "haste": ["artificer", "sorcerer", "wizard"],
  "intellect-fortress": ["artificer", "bard", "sorcerer", "warlock", "wizard"],
  "meld-into-stone": ["cleric", "druid"],
  "protection-from-energy": ["artificer", "cleric", "druid", "ranger", "sorcerer", "wizard"],
  "revivify": ["artificer", "cleric", "paladin"],
  "spirit-shroud": [],
  "summon-fey": [],
  "summon-shadowspawn": [],
  "summon-undead": [],
  "water-breathing": ["artificer", "druid", "ranger", "sorcerer", "wizard"],
  "water-walk": ["artificer", "cleric", "druid", "ranger", "sorcerer"],
});

// Tasha's Cauldron "Optional Rule: Expanded Spell List" additions (source "TCE-optional"), levels 0–3.
Object.assign(SPELL_OPTIONAL_CLASSES, {
  "mind-sliver": ["sorcerer", "warlock", "wizard"],
  "color-spray": ["bard"],
  "command": ["bard"],
  "entangle": ["ranger"],
  "grease": ["sorcerer"],
  "protection-from-evil-and-good": ["druid"],
  "searing-smite": ["ranger"],
  "aid": ["bard", "ranger"],
  "augury": ["druid", "wizard"],
  "continual-flame": ["druid"],
  "enhance-ability": ["ranger", "wizard"],
  "enlarge-reduce": ["bard", "druid"],
  "flame-blade": ["sorcerer"],
  "flaming-sphere": ["sorcerer"],
  "gentle-repose": ["paladin"],
  "gust-of-wind": ["ranger"],
  "magic-weapon": ["ranger", "sorcerer"],
  "mirror-image": ["bard"],
  "prayer-of-healing": ["paladin"],
  "summon-beast": ["druid", "ranger"],
  "tashas-mind-whip": ["sorcerer", "wizard"],
  "warding-bond": ["paladin"],
  "aura-of-vitality": ["cleric", "druid"],
  "elemental-weapon": ["druid", "ranger"],
  "mass-healing-word": ["bard"],
  "meld-into-stone": ["ranger"],
  "revivify": ["druid", "ranger"],
  "slow": ["bard"],
  "speak-with-dead": ["wizard"],
  "spirit-shroud": ["cleric", "paladin", "warlock", "wizard"],
  "summon-fey": ["druid", "ranger", "warlock", "wizard"],
  "summon-shadowspawn": ["warlock", "wizard"],
  "summon-undead": ["warlock", "wizard"],
  "vampiric-touch": ["sorcerer"],
});

// Corrections to existing NON-SRD spells, only the fields that change. Keys: school, castingTime, range, components,
// duration, summary, higherLevel, material. data.js LOCAL_SPELLS entries carry no school / higher_level / material at
// all, so those are supplied here (spells.js only reads upcast dice from higher_level, so without these the data.js
// spells never scale when upcast).
Object.assign(SPELL_FIXES, {
  // level 0
  "blade-ward": { school: "Abjuration", summary: "A warding sigil gives you resistance to bludgeoning, piercing, and slashing damage dealt by weapon attacks; it lasts until your next turn is over." },
  "booming-blade": { school: "Evocation", higherLevel: "At 5th level the hit itself deals an extra 1d8 thunder damage and the moving damage becomes 2d8; both rise by 1d8 at 11th level and again at 17th level.", material: "a melee weapon worth at least 1 sp" },
  "control-flames": { school: "Transmutation" },
  "create-bonfire": { school: "Conjuration", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level." },
  "friends": { school: "Enchantment", summary: "Your Charisma checks aimed at one creature that isn't hostile to you have advantage for the duration. Once the spell ends, the creature knows it was magically swayed and turns hostile toward you; how it retaliates is up to the DM." },
  "frostbite": { school: "Evocation", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level." },
  "green-flame-blade": { school: "Evocation", higherLevel: "At 5th level the hit itself deals an extra 1d8 fire damage and the leaping fire deals 1d8 + your spellcasting ability modifier; both rise by 1d8 at 11th level and again at 17th level.", material: "a melee weapon worth at least 1 sp" },
  "gust": { school: "Transmutation", summary: "Pick one at a point in range: a Medium or smaller creature makes a Strength save or is pushed up to 5 feet away from you; an object of up to 5 pounds that no one holds or carries is shoved up to 10 feet away (no damage); or a harmless breeze effect such as rustling leaves or slamming shutters." },
  "infestation": { school: "Conjuration", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level." },
  "lightning-lure": { school: "Evocation", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level." },
  "magic-stone": { school: "Transmutation" },
  "mind-sliver": { school: "Enchantment", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level.", summary: "One creature you can see makes an Intelligence save or takes 1d6 psychic damage, and the next saving throw it makes before your next turn ends is reduced by 1d4." },
  "mold-earth": { school: "Transmutation" },
  "primal-savagery": { school: "Transmutation", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level." },
  "shape-water": { school: "Transmutation" },
  "sword-burst": { school: "Conjuration", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level." },
  "thorn-whip": { school: "Transmutation", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level." },
  "thunderclap": { school: "Evocation", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level." },
  "toll-the-dead": { school: "Necromancy", higherLevel: "Damage increases by one die (d8 or d12) at 5th level, 11th level, and 17th level.", summary: "One creature you can see makes a Wisdom save or takes 1d8 necrotic damage (1d12 if it is missing any hit points)." },
  "word-of-radiance": { school: "Evocation", higherLevel: "Damage increases by one die at 5th level, 11th level, and 17th level.", summary: "Each creature you choose that you can see within 5 feet makes a Constitution save or takes 1d6 radiant damage." },
  // level 1
  "absorb-elements": { school: "Abjuration", higherLevel: "The extra damage increases by 1d6 for each slot level above 1st." },
  "armor-of-agathys": { school: "Abjuration", higherLevel: "The temporary hit points and the cold damage both increase by 5 for each slot level above 1st." },
  "arms-of-hadar": { school: "Conjuration", higherLevel: "Damage increases by 1d6 for each slot level above 1st.", summary: "Shadowy tendrils strike every creature within 10 feet of you; each makes a Strength save. On a failure it takes 2d6 necrotic damage and loses its reaction until its next turn; on a success it takes half damage only." },
  "catapult": { school: "Transmutation", higherLevel: "Damage increases by 1d8 for each slot level above 1st, and the maximum object weight rises by 5 pounds per slot level." },
  "cause-fear": { higherLevel: "One additional creature for each slot level above 1st; the targets must be within 30 feet of each other." },
  "ceremony": { material: "25 gp worth of powdered silver, which the spell consumes" },
  "chromatic-orb": { school: "Evocation", higherLevel: "Damage increases by 1d8 for each slot level above 1st.", material: "a diamond worth at least 50 gp" },
  "compelled-duel": { school: "Enchantment" },
  "dissonant-whispers": { school: "Enchantment", higherLevel: "Damage increases by 1d6 for each slot level above 1st." },
  "earth-tremor": { school: "Evocation", higherLevel: "Damage increases by 1d6 for each slot level above 1st." },
  "ensnaring-strike": { school: "Conjuration", higherLevel: "Damage increases by 1d6 for each slot level above 1st.", summary: "The next creature you hit with a weapon attack makes a Strength save (Large or bigger creatures have advantage) or is restrained by thorny vines until the spell ends, taking 1d6 piercing damage at the start of each of its turns. It, or anyone who can reach it, can use an action on a Strength check against your spell save DC to tear it free." },
  "gift-of-alacrity": { components: ["V", "S"] },
  "hail-of-thorns": { school: "Conjuration", higherLevel: "Damage increases by 1d10 for each slot level above 1st (maximum 6d10)." },
  "hex": { school: "Enchantment", higherLevel: "With a 3rd- or 4th-level slot you can concentrate on it for up to 8 hours; with a 5th-level or higher slot, up to 24 hours." },
  "ice-knife": { school: "Conjuration", higherLevel: "The cold damage increases by 1d6 for each slot level above 1st." },
  "jims-magic-missile": { higherLevel: "One more dart for each slot level above 1st (the gold tax rises by 1 gp per slot level too).", material: "1 gp, which the spell consumes" },
  "ray-of-sickness": { school: "Necromancy", higherLevel: "Damage increases by 1d8 for each slot level above 1st." },
  "searing-smite": { school: "Evocation", higherLevel: "The initial extra damage increases by 1d6 for each slot level above 1st." },
  "silvery-barbs": { school: "Enchantment" },
  "snare": { school: "Abjuration", material: "25 feet of rope, which the spell consumes", summary: "Lay a rope in a 5-foot-radius circle that turns into a nearly invisible trap (an Intelligence (Investigation) check against your spell save DC spots it). The first Small, Medium, or Large creature to step in makes a Dexterity save or is hoisted 3 feet up, hanging upside down and restrained until the spell ends. It repeats the Dexterity save at the end of each of its turns, or anyone who can reach it can use an action on an Intelligence (Arcana) check against your DC to free it." },
  "tashas-caustic-brew": { school: "Evocation", higherLevel: "Damage increases by 2d4 for each slot level above 1st." },
  "thunderous-smite": { school: "Evocation" },
  "witch-bolt": { school: "Evocation", higherLevel: "The initial damage increases by 1d12 for each slot level above 1st." },
  "wrathful-smite": { school: "Evocation" },
  // level 2
  "aganazzars-scorcher": { school: "Evocation", higherLevel: "Damage increases by 1d8 for each slot level above 2nd." },
  "borrowed-knowledge": { material: "a book worth at least 25 gp" },
  "cloud-of-daggers": { school: "Conjuration", higherLevel: "Damage increases by 2d4 for each slot level above 2nd.", summary: "Whirling blades fill a 5-foot cube centered on a point in range. A creature takes 4d4 slashing damage the first time on a turn that it moves into the cube, and again whenever it starts its turn inside." },
  "crown-of-madness": { school: "Enchantment" },
  "dragons-breath": { school: "Transmutation", higherLevel: "Damage increases by 1d6 for each slot level above 2nd." },
  "fortunes-favor": { higherLevel: "One additional creature for each slot level above 2nd.", material: "a white pearl worth at least 100 gp, which the spell consumes" },
  "gift-of-gab": { material: "2 gp, which the spell consumes" },
  "healing-spirit": { school: "Conjuration", higherLevel: "Healing increases by 1d6 for each slot level above 2nd.", summary: "A spirit fills a 5-foot cube you can see in range. Whenever you or a creature you can see moves into its space for the first time on a turn or starts its turn there, you can have that creature regain hit points equal to 1d6 (no action; constructs and undead are unaffected). It can heal 1 + the modifier of your spellcasting ability times (minimum twice) before it vanishes. A bonus action moves it up to 30 feet." },
  "immovable-object": { higherLevel: "With a 4th- or 5th-level slot the DC to move it rises by 5, it holds up to 8,000 pounds, and it lasts 24 hours; with a 6th-level or higher slot the DC rises by 10, it holds up to 20,000 pounds, and it lasts until dispelled.", material: "gold dust worth at least 25 gp, which the spell consumes", summary: "An object of up to 10 pounds you touch is magically locked in place; you and creatures you designate can move it freely, and an optional password spoken within 5 feet suppresses the spell for 1 minute. Fixed in midair it supports up to 4,000 pounds before falling. Anyone else can use an action on a Strength check against your spell save DC to shift it up to 10 feet." },
  "jims-glowing-coin": { material: "a coin, plus 2 gp, which the spell consumes" },
  "mind-spike": { school: "Divination", higherLevel: "Damage increases by 1d8 for each slot level above 2nd." },
  "phantasmal-force": { school: "Illusion" },
  "shadow-blade": { school: "Illusion", higherLevel: "The blade deals 3d8 with a 3rd- or 4th-level slot, 4d8 with a 5th- or 6th-level slot, and 5d8 with a 7th-level or higher slot." },
  "skywrite": { duration: "Concentration, up to 1 day", summary: "Up to ten words made of cloud appear in a patch of sky you can see and stay until the spell ends; a strong wind can scatter them and end it early." },
  "snillocs-snowball-swarm": { school: "Evocation", higherLevel: "Damage increases by 1d6 for each slot level above 2nd." },
  "summon-beast": { material: "a feather, tuft of fur, and fish tail inside a gilded acorn worth at least 200 gp" },
  "tashas-mind-whip": { school: "Enchantment", higherLevel: "One additional creature for each slot level above 2nd; the targets must be within 30 feet of each other." },
  "warding-wind": { school: "Evocation" },
  // level 3
  "aura-of-vitality": { school: "Evocation", summary: "A 30-foot healing aura centered on you moves with you. As a bonus action on each of your turns, one creature in the aura (you included) regains hit points equal to 2d6." },
  "conjure-barrage": { school: "Conjuration" },
  "crusaders-mantle": { school: "Evocation", summary: "A 30-foot aura centered on you moves with you; while inside it, you and every non-hostile creature deal an extra 1d4 radiant damage with each weapon hit." },
  "elemental-weapon": { school: "Transmutation", higherLevel: "With a 5th- or 6th-level slot the bonus is +2 and the extra damage 2d4; with a 7th-level or higher slot, +3 and 3d4." },
  "erupting-earth": { school: "Transmutation", higherLevel: "Damage increases by 1d12 for each slot level above 3rd." },
  "fast-friends": { summary: "One humanoid in range that can see, hear, and understand you makes a Wisdom save or is charmed for the duration and willingly carries out tasks you set it. If a task would harm it or clash with its normal behavior it can save again (with advantage if you or your allies are fighting it), and the spell ends if a task would surely kill it. Afterward it knows it was charmed." },
  "feign-death": { school: "Necromancy" },
  "hunger-of-hadar": { school: "Conjuration", summary: "A 20-foot-radius sphere of lightless, freezing void appears at a point in range: no light can brighten it, creatures wholly inside are blinded, and it is difficult terrain. A creature starting its turn inside takes 2d6 cold damage, and one ending its turn inside makes a Dexterity save or takes 2d6 acid damage." },
  "incite-greed": { material: "a gem worth at least 50 gp" },
  "intellect-fortress": { school: "Abjuration", higherLevel: "One additional creature for each slot level above 3rd; the targets must be within 30 feet of each other.", summary: "You or one willing creature you can see in range gains resistance to psychic damage and advantage on Intelligence, Wisdom, and Charisma saves for the duration." },
  "life-transference": { school: "Necromancy", higherLevel: "Damage increases by 1d8 for each slot level above 3rd.", summary: "You take 4d8 necrotic damage that nothing can reduce, and one creature you can see in range is healed by twice the necrotic damage you took." },
  "lightning-arrow": { summary: "Your next ranged weapon attack becomes a bolt of lightning: instead of weapon damage the target takes 4d8 lightning damage on a hit or half that on a miss. Hit or miss, every creature within 10 feet of the target makes a Dexterity save, taking 2d8 lightning damage on a failure or half on a success." },
  "melfs-minute-meteors": { school: "Evocation", higherLevel: "Two more meteors for each slot level above 3rd.", summary: "Six tiny meteors orbit you. On the turn you cast it, and with a bonus action on each later turn, you launch one or two at points within 120 feet; each explodes, and every creature within 5 feet of the impact makes a Dexterity save, taking 2d6 fire damage on a failure or half on a success." },
  "spirit-shroud": { school: "Necromancy", higherLevel: "The extra damage increases by 1d8 for every two slot levels above 3rd.", summary: "Spirits of the dead surround you. Your attacks deal an extra 1d8 radiant, necrotic, or cold damage (chosen when cast) to creatures within 10 feet that you hit, and a creature that takes this damage is blocked from any healing until the start of your next turn. Any creature you choose that starts its turn within 10 feet of you loses 10 feet of speed until the start of your next turn." },
  "summon-fey": { material: "a gilded flower worth at least 300 gp" },
  "summon-lesser-demons": { higherLevel: "Twice as many demons with a 6th- or 7th-level slot; three times as many with an 8th- or 9th-level slot.", material: "a vial of blood from a humanoid killed within the past 24 hours, consumed when the spell ends if used to draw the circle", summary: "Roll a d6 to call demons the DM picks: 1-2, two of CR 1 or lower; 3-4, four of CR 1/2 or lower; 5-6, eight of CR 1/4 or lower. They are hostile to everyone (you included), roll their own initiative as a group, and attack the nearest non-demons. If you draw a blood circle around your space while casting, they can't cross it, harm it, or target anyone inside it." },
  "summon-shadowspawn": { material: "tears inside a crystal vial worth at least 300 gp" },
  "summon-undead": { material: "a gilded skull worth at least 300 gp" },
  "thunder-step": { school: "Conjuration", higherLevel: "Damage increases by 1d10 for each slot level above 3rd." },
  "tidal-wave": { school: "Conjuration" },
});

// Display renames to strip WotC character names (keep slug).
Object.assign(SPELL_RENAMES, {
  "tashas-caustic-brew": "Caustic Brew",
  "tashas-mind-whip": "Mind Whip",
  "melfs-minute-meteors": "Minute Meteors",
  "aganazzars-scorcher": "Scorcher",
  "snillocs-snowball-swarm": "Snowball Swarm",
  "maximilians-earthen-grasp": "Earthen Grasp",
  "nathairs-mischief": "Fey Mischief",
  "rimes-binding-ice": "Binding Ice",
  "ashardalons-stride": "Flame Stride",
  "jims-glowing-coin": "Glowing Coin",
  "jims-magic-missile": "Unreliable Magic Missile",
  "galders-tower": "Conjured Tower",
});

// Spells 4–9 missing from the app. Row: [source, index, name, level, school, classes, castingTime, range, components, duration, summary, higherLevel, material]
NEW_SPELLS.push(
  ["XGE", "maelstrom", "Maelstrom", 5, "Evocation", ["druid"], "1 action", "120 feet", ["V", "S", "M"], "Concentration, up to 1 minute",
    "A 30-foot-radius pool of churning water, 5 feet deep, swirls around a point on the ground you can see; its area is difficult terrain. A creature that starts its turn in the pool makes a Strength save or takes 6d6 bludgeoning damage and is dragged 10 feet toward the center.",
    "", "paper or leaf in the shape of a funnel"],
  ["XGE", "wrath-of-nature", "Wrath of Nature", 5, "Evocation", ["druid", "ranger"], "1 action", "120 feet", ["V", "S"], "Concentration, up to 1 minute",
    "Trees, rocks, and grass in a 60-foot cube around a point you can see turn against your enemies. Trees: at the start of each of your turns, each enemy within 10 feet of a tree in the cube makes a Dexterity save or takes 4d6 slashing damage. Grass and undergrowth in the cube are difficult terrain for your enemies. Roots: at the end of each of your turns, one creature of your choice on the ground in the cube makes a Strength save or is restrained until the spell ends (an action and a Strength (Athletics) check against your spell save DC frees it). Rocks: as a bonus action, fling a loose rock at a creature in the cube with a ranged spell attack; a hit deals 3d8 nonmagical bludgeoning damage and the target makes a Strength save or falls prone.",
    "", ""],
  ["LLoK", "galders-speedy-courier", "Speedy Courier", 4, "Conjuration", ["warlock", "wizard"], "1 action", "10 feet", ["V", "S", "M"], "10 minutes",
    "A Small, nearly transparent air elemental appears holding an empty open chest 3 feet on each side; it is immune to all damage and can't interact with anything. Load the chest, then name a living creature you have met and seen, or one whose hair, nail, or other body part you hold. When the lid closes, elemental and chest vanish and reappear next to that creature, which learns what is inside and how long it has to collect it; no one else can open the chest. If the target is on another plane or protected from magical detection or location, the contents land at your feet instead. Whatever remains in the chest when the spell ends, or when the recipient sends the elemental back, reappears at your feet.",
    "With an 8th-level slot, the chest can reach a creature on a different plane of existence.",
    "25 gold pieces, or mineral goods of equivalent value, which the spell consumes"],
  ["PAitM", "gate-seal", "Gate Seal", 4, "Abjuration", ["sorcerer", "warlock", "wizard"], "1 minute", "60 feet", ["V", "S", "M"], "24 hours",
    "Reinforce the barrier between planes in a stationary 30-foot cube you can see. Portals inside it shut and can't be opened, and any spell or effect that opens a portal or carries creatures between planes, such as gate or plane shift, fails when used to enter or leave the cube.",
    "With a 6th-level or higher slot, the spell lasts until dispelled.",
    "a broken portal key, which the spell consumes"], // VERIFY: source book (wikidot lists Planescape: Adventures in the Multiverse; some lists credit The Book of Many Things)
  ["BMT", "spirit-of-death", "Spirit of Death", 4, "Necromancy", ["sorcerer", "warlock", "wizard"], "1 action", "60 feet", ["V", "S", "M"], "Concentration, up to 1 hour",
    "Call a Reaper Spirit (Medium undead; AC 11 + the spell's level; 40 hit points + 10 per slot level above 4th; walks and hovers at 30 feet, passes through creatures and objects) in an unoccupied space within range. It makes a number of scythe attacks equal to half the spell's level (rounded down), each a melee spell attack with advantage dealing 1d8 + 3 + the spell's level necrotic damage. As a bonus action it can haunt a creature within 10 feet: you both always know the target's direction and distance, and whenever the target starts its turn within 10 feet of the spirit it makes a Wisdom save or is frightened until its next turn. It acts right after you, obeys your verbal commands (it dodges if given none), and vanishes at 0 hit points or when the spell ends.",
    "Use the slot's level wherever the spell's level appears in the spirit's statistics.",
    "a gilded playing card worth at least 400 gp and depicting an avatar of death"], // VERIFY: haunt save ability (Wisdom assumed)
  ["AAG", "create-spelljamming-helm", "Create Spelljamming Helm", 5, "Transmutation", ["artificer", "wizard"], "1 action", "Touch", ["V", "S", "M"], "Instantaneous",
    "Holding the crystal rod, touch an unoccupied chair of Large size or smaller. The rod vanishes and the chair becomes a spelljamming helm, the magic item that lets a vessel be piloted through the void and between worlds.",
    "", "a crystal rod worth at least 5,000 gp, which the spell consumes"],
  ["IDRotF", "create-magen", "Create Magen", 7, "Transmutation", ["wizard"], "1 hour", "Touch", ["V", "S", "M"], "Instantaneous",
    "Turn a life-sized doll into a magen, a magical construct whose type you choose when you cast; it obeys your commands without question. Creating it lowers your hit point maximum by the magen's challenge rating (at least 1), and only a wish spell can restore the lost maximum.",
    "", "a vial of quicksilver worth 500 gp and a life-sized human doll, both of which the spell consumes, and an intricate crystal rod worth at least 1,500 gp that is not consumed"],
);

// Full class list for EVERY spell 4–9 whose class list in the app is wrong or incomplete (artificer per TCE list).
// SRD spells from dnd5eapi lack artificer; dnd5eapi also wrongly lists Divination as druid-only and Arcane Eye as cleric.
Object.assign(SPELL_CLASS_FIXES, {
  "arcane-eye": ["artificer", "wizard"],                       // was cleric,wizard: cleric is not on the PHB list
  "divination": ["cleric"],                                    // was druid: PHB lists it for cleric only (druid/wizard are TCE optional)
  "fabricate": ["artificer", "wizard"],
  "faithful-hound": ["artificer", "wizard"],
  "freedom-of-movement": ["artificer", "bard", "cleric", "druid", "ranger"],
  "private-sanctum": ["artificer", "wizard"],
  "resilient-sphere": ["artificer", "wizard"],
  "secret-chest": ["artificer", "wizard"],
  "stone-shape": ["artificer", "cleric", "druid", "wizard"],
  "stoneskin": ["artificer", "druid", "ranger", "sorcerer", "wizard"],
  "animate-objects": ["artificer", "bard", "sorcerer", "wizard"],
  "arcane-hand": ["artificer", "wizard"],
  "creation": ["artificer", "sorcerer", "wizard"],
  "greater-restoration": ["artificer", "bard", "cleric", "druid"],
  "wall-of-stone": ["artificer", "druid", "sorcerer", "wizard"],
  "power-word-heal": ["bard"],                                 // was bard,cleric: cleric access is TCE optional only
});
// Tasha's expanded spell lists (optional rule, "TCE-optional"), levels 4–9. Spells that are new in TCE
// (summons, Otherworldly Guise, Dream of the Blue Veil, Blade of Disaster) are on their base lists instead.
Object.assign(SPELL_OPTIONAL_CLASSES, {
  "phantasmal-killer": ["bard"],
  "divination": ["druid", "wizard"],
  "fire-shield": ["druid", "sorcerer"],
  "dominate-beast": ["ranger"],
  "aura-of-life": ["cleric"],
  "aura-of-purity": ["cleric"],
  "telepathic-bond": ["bard"],
  "cone-of-cold": ["druid"],
  "greater-restoration": ["ranger"],
  "arcane-hand": ["sorcerer"],
  "mislead": ["warlock"],
  "planar-binding": ["warlock"],
  "teleportation-circle": ["warlock"],
  "heroes-feast": ["bard"],
  "sunbeam": ["cleric"],
  "flesh-to-stone": ["druid", "sorcerer"],
  "freezing-sphere": ["sorcerer"],
  "prismatic-spray": ["bard"],
  "symbol": ["druid"],
  "antipathy-sympathy": ["bard"],
  "sunburst": ["cleric"],
  "incendiary-cloud": ["druid"],
  "demiplane": ["sorcerer"],
  "prismatic-wall": ["bard"],
  "power-word-heal": ["cleric"],
});

// Corrections to existing NON-SRD spells — only the fields that change.
// NOTE: `source` is included for data.js LOCAL_SPELLS entries, which have no school/source today.
Object.assign(SPELL_FIXES, {
  // ---- data.js LOCAL_SPELLS (missing school + source) ----
  "aura-of-life": { school: "Abjuration", source: "PHB",
    summary: "The aura travels with you. You and every nonhostile creature inside it resist necrotic damage and can't have your hit point maximums lowered, and a nonhostile living creature that begins its turn in the aura at 0 hit points regains 1 hit point." },
  "aura-of-purity": { school: "Abjuration", source: "PHB",
    summary: "The aura travels with you. You and every nonhostile creature inside it can't contract disease, resist poison damage, and gain advantage on saves against effects that would blind, charm, deafen, frighten, paralyze, poison, or stun." },
  "grasping-vine": { school: "Conjuration", source: "PHB" },
  "staggering-smite": { school: "Evocation", source: "PHB",
    summary: "4d6 psychic damage is added the first time you land a melee weapon attack while the spell lasts. The struck creature then makes a Wisdom save or, until the end of its next turn, rolls attacks and ability checks at disadvantage and can't use reactions." },
  "banishing-smite": { school: "Abjuration", source: "PHB" },
  "circle-of-power": { school: "Abjuration", source: "PHB",
    summary: "A 30-foot aura of divine power moves with you. You and friendly creatures inside roll with advantage on saves against spells and magical effects, and when one of you succeeds on such a save against an effect that deals half damage on a success, it takes no damage at all." },
  "destructive-wave": { school: "Evocation", source: "PHB" },
  "storm-sphere": { school: "Evocation", source: "XGE",
    summary: "A 20-foot-radius sphere of whirling wind whose space is difficult terrain. A creature in it when it forms, or that ends its turn there, makes a Strength save or takes 2d6 bludgeoning damage. On each of your turns you can use a bonus action to fire a bolt from its center at a creature within 60 feet of the center: a ranged spell attack (with advantage if the target is inside the sphere) dealing 4d6 lightning damage.",
    higher: "Both the bludgeoning and the lightning damage increase by 1d6 for each slot level above 4th." },
  "vitriolic-sphere": { school: "Evocation", source: "XGE", material: "a drop of giant slug bile",
    summary: "A 20-foot-radius burst of acid: each creature in it makes a Dexterity save. On a failure it takes 10d4 acid damage at once and 5d4 more at the end of its next turn; on a success it takes half the initial damage and nothing later.",
    higher: "The initial damage increases by 2d4 for each slot level above 4th." },
  "watery-sphere": { school: "Conjuration", source: "XGE", material: "a droplet of water",
    summary: "A 5-foot-radius sphere of water hovers no more than 10 feet above the ground. Each creature in its space makes a Strength save or is restrained and engulfed (a success pushes it to the nearest open space; Huge or larger creatures succeed automatically, and a smaller one may choose to fail). A restrained creature repeats the save at the end of each of its turns. The sphere holds up to four Medium or smaller creatures or one Large one, and as an action you can roll it up to 30 feet in a straight line, carrying its captives." },
  "shadow-of-moil": { school: "Necromancy", source: "XGE", material: "an undead eyeball encased in a gem worth at least 150 gp",
    summary: "2d8 necrotic damage strikes any creature within 10 feet that hits you with an attack. Flame-like shadows also make you heavily obscured to others, dim light within 10 feet of you becomes darkness and bright light becomes dim, and you resist radiant damage." },
  "sickening-radiance": { school: "Evocation", source: "XGE",
    summary: "Sickly green light fills a 30-foot-radius sphere and bends around corners. A creature that enters it for the first time on a turn or starts its turn there makes a Constitution save or takes 4d10 radiant damage, gains a level of exhaustion, and glows in a 5-foot radius so it can't benefit from being invisible. The glow and the exhaustion vanish when the spell ends." },
  "far-step": { school: "Conjuration", source: "XGE",
    summary: "Blink to an open space you can see within 60 feet, and repeat that jump with a bonus action on each of your turns while the spell lasts." },
  "holy-weapon": { school: "Evocation", source: "XGE",
    summary: "2d8 radiant damage is added to every hit with a weapon you touch, which also sheds bright light for 30 feet and dim light 30 feet beyond. As a bonus action you can end the spell in a burst: each creature you choose within 30 feet makes a Constitution save or takes 4d8 radiant damage and is blinded for 1 minute (repeating the save at the end of each of its turns); a success halves the damage and avoids the blindness." },
  "steel-wind-strike": { school: "Conjuration", source: "XGE", material: "a melee weapon worth at least 1 sp" },
  "synaptic-static": { school: "Enchantment", source: "XGE" },
  "mental-prison": { school: "Illusion", source: "XGE",
    summary: "5d10 psychic damage to one creature, which makes an Intelligence save; on a success that ends the spell. On a failure it also sees itself hemmed in by a deadly illusion that only it perceives and that blocks its sight and hearing beyond: if it is moved out, attacks through, or reaches through the illusion, it takes 10d10 psychic damage and the spell ends. Creatures immune to being charmed are unaffected." },
  "crown-of-stars": { school: "Evocation", source: "XGE",
    summary: "4d12 radiant damage per mote: seven starry motes circle your head, and as a bonus action you hurl one at a creature or object within 120 feet with a ranged spell attack. The spell ends when the last mote is gone. With four or more motes left you shed bright light 30 feet (dim 30 more); with one to three, dim light 30 feet.",
    higher: "Two additional motes for each slot level above 7th." },
  "abi-dalzims-horrid-wilting": { school: "Necromancy", source: "XGE", material: "a bit of sponge" },
  "psychic-scream": { school: "Enchantment", source: "XGE",
    summary: "Up to ten creatures you can see make an Intelligence save or take 14d6 psychic damage and are stunned; a success halves the damage and avoids the stun. Creatures with Intelligence 2 or lower are unaffected. A stunned target repeats the save at the end of each of its turns." },

  // ---- expansions.js ----
  "gravity-sinkhole": { material: "a black marble" },
  "summon-aberration": { material: "a pickled tentacle and an eyeball in a platinum-inlaid vial worth at least 400 gp",
    summary: "Call an Aberrant Spirit in one of three alien forms, whose statistics scale with the spell's level; it shares your initiative, obeys your verbal commands, and vanishes at 0 hit points or when the spell ends." },
  "summon-construct": { material: "an ornate stone and metal lockbox worth at least 400 gp" },
  "summon-elemental": { material: "air, a pebble, ash, and water inside a gold-inlaid vial worth at least 400 gp" },
  "summon-greater-demon": { material: "a vial of blood from a humanoid killed within the past 24 hours" },
  "summon-celestial": { material: "a golden reliquary worth at least 500 gp" },
  "summon-fiend": { material: "humanoid blood inside a ruby vial worth at least 600 gp",
    summary: "Call a Fiendish Spirit (a demon, a devil, or a third fiendish form) whose statistics scale with the spell's level; it shares your initiative, obeys your verbal commands, and vanishes at 0 hit points or when the spell ends." },
  "summon-draconic-spirit": { material: "an object with the image of a dragon engraved on it, worth at least 500 gp",
    summary: "Call a Draconic Spirit (chromatic, gem, or metallic) whose statistics scale with the spell's level; you also gain resistance to one damage type the spirit resists. It shares your initiative, obeys your verbal commands, and vanishes at 0 hit points or when the spell ends." },
  "dawn": { material: "a sunburst pendant worth at least 100 gp" },
  "infernal-calling": { material: "a ruby worth at least 999 gp" },
  "negative-energy-flood": { material: "a broken bone and a square of black silk" },
  "transmute-rock": { material: "clay and water" },
  "wall-of-light": { material: "a hand mirror",
    summary: "A wall of light 60 feet long, 10 feet high, and 5 feet thick. Each creature in it when it appears makes a Constitution save, taking 4d8 radiant damage and being blinded for 1 minute on a failure (repeating the save at the end of each of its turns), half damage and no blindness on a success; a creature that ends its turn in the wall also takes 4d8 radiant damage. As an action you can fire a beam at a creature within 60 feet of the wall (ranged spell attack, 4d8 radiant damage), shortening the wall by 10 feet hit or miss." },
  "create-homunculus": { material: "clay, ash, and mandrake root, all of which the spell consumes, and a jewel-encrusted dagger worth at least 1,000 gp",
    summary: "Cut yourself with a jeweled dagger, taking 2d4 piercing damage that can't be reduced, to craft a loyal homunculus companion; you can have only one at a time." },
  "druid-grove": { material: "mistletoe, which the spell consumes, that was harvested with a golden sickle under the light of a full moon" },
  "fizbans-platinum-shield": { material: "a platinum-plated dragon scale worth at least 500 gp" },
  "gravity-fissure": { material: "a fistful of iron filings" },
  "investiture-of-flame": {
    summary: "Your action can blast a 15-foot line of fire: each creature in it makes a Dexterity save, taking 4d8 fire damage on a failure, half on a success. You are also immune to fire, resist cold, shed bright light, and a creature that first moves within 5 feet of you on a turn or ends its turn there takes 1d10 fire damage." },
  "soul-cage": { material: "a tiny silver cage worth 100 gp" },
  "tashas-otherworldly-guise": { material: "an object engraved with a symbol of the Outer Planes, worth at least 500 gp" },
  "tensers-transformation": { material: "a few hairs from a bull" },
  "draconic-transformation": { material: "a statuette of a wyrmling worth at least 500 gp" },
  "dream-of-the-blue-veil": { material: "a magic item or a willing creature from the destination world" },
  "temple-of-the-gods": { material: "a holy symbol worth at least 5 gp" },
  "tether-essence": { material: "a spool of platinum cord worth at least 250 gp, which the spell consumes",
    summary: "Two creatures you can see make Constitution saves, with disadvantage if they are within 30 feet of each other (either may fail willingly). If both fail, they are linked: any damage or healing one receives is mirrored onto the other, and the spell ends for both if either drops to 0 hit points." },
  "whirlwind": { material: "a piece of straw",
    summary: "A 10-foot-radius, 30-foot-high whirlwind forms on the ground; your action moves it up to 30 feet. A creature that enters it for the first time on a turn or starts its turn there makes a Dexterity save, taking 10d6 bludgeoning damage on a failure, half on a success, and a Large or smaller creature that fails must also pass a Strength save or be restrained and carried inside it." },
  "dark-star": { material: "a shard of onyx and a drop of the caster's blood, both of which the spell consumes",
    summary: "A 40-foot-radius sphere of magical darkness and crushing gravity that is difficult terrain, blocks all sound (creatures inside are deafened and can't cast spells with verbal components), and defeats darkvision. A creature that enters it for the first time on a turn or starts its turn there makes a Constitution save, taking 8d10 force damage on a failure, half on a success; one reduced to 0 hit points is crushed to dust along with its nonmagical gear." },
  "maddening-darkness": { material: "a drop of pitch mixed with a drop of mercury" },
  "mighty-fortress": { material: "a diamond worth at least 500 gp, which the spell consumes" },
  "reality-break": { material: "a crystal prism" },
  "telepathy": { material: "a pair of linked silver rings" },
  "conjure-volley": { material: "one piece of ammunition or one thrown weapon",
    summary: "8d8 damage of the weapon's type: shoot nonmagical ammunition or toss a nonmagical weapon skyward at a point you choose, and a storm of copies rains down. Each creature in a 40-foot-radius, 20-foot-high cylinder there makes a Dexterity save, taking full damage on a failure, half on a success." },
  "swift-quiver": { material: "a quiver containing at least one piece of ammunition",
    summary: "A quiver you touch refills itself with nonmagical ammunition for the duration, and on each of your turns a bonus action lets you make two attacks with a weapon that fires from it. Pieces drawn from it crumble at the end of the spell." },
  "invulnerability": { material: "a small piece of adamantine worth at least 500 gp, which the spell consumes" },
  "mass-polymorph": { material: "a caterpillar cocoon",
    summary: "Turn up to ten creatures you can see into beasts whose challenge rating is no higher than theirs (or half their level); an unwilling creature makes a Wisdom save to resist, and shapechangers succeed automatically. Each gains temporary hit points equal to its new form's hit points and reverts when they are gone." },
  "power-word-heal": {
    summary: "A creature you touch regains all its hit points, and any charmed, frightened, paralyzed, or stunned condition on it ends; if it is prone it can use its reaction to stand. Undead and constructs are unaffected." },
  "blade-of-disaster": {
    summary: "Open a blade-shaped rift and make up to two melee spell attacks with it against targets within 5 feet of it, each dealing 4d12 force damage on a hit; it scores a critical hit on an 18 or higher, dealing 12d12 force in total. As a bonus action on later turns, move it up to 30 feet and attack twice again." },
  "ravenous-void": { material: "a small, nine-pointed star made of iron",
    summary: "5d10 force damage to any creature that enters the 20-foot-radius gravity well for the first time on a turn or starts its turn there, and it is restrained while inside (an action and a Strength check against your spell save DC frees it or a creature it can reach). The well and everything within 100 feet of it are difficult terrain; a creature that starts its turn within 100 feet makes a Strength save or is dragged as close to the center as possible, loose objects are pulled in and destroyed, and a creature reduced to 0 hit points is annihilated with its nonmagical gear." },
  "time-ravage": { material: "an hourglass filled with diamond dust worth at least 5,000 gp, which the spell consumes",
    summary: "One creature makes a Constitution save, taking 10d12 necrotic damage on a failure, half on a success. On a failure it also ages to the brink of death: it will die of old age within 30 days, has disadvantage on attack rolls, ability checks, and saving throws, and its walking speed is halved. Only wish or a 9th-level greater restoration reverses this." },
});

// Display renames to strip WotC character names (slug kept).
Object.assign(SPELL_RENAMES, {
  "raulothims-psychic-lance": "Psychic Lance",
  "fizbans-platinum-shield": "Platinum Shield",
  "tashas-otherworldly-guise": "Otherworldly Guise",
  "tensers-transformation": "Transformation",
  "abi-dalzims-horrid-wilting": "Horrid Wilting",
});

// Tal'Dorei Campaign Setting Reborn spells used by the Oath of the Open Sea.
NEW_SPELLS.push(
  ["TDCSR", "freedom-of-the-waves", "Freedom of the Waves", 3, "Conjuration", ["druid", "ranger", "sorcerer"], "1 action", "120 feet", ["V", "S", "M"], "Instantaneous",
    "Seawater crashes into a 15-foot-radius, 10-foot-high cylinder centered on a point in range. Each creature there makes a Strength save or takes 2d8 bludgeoning damage and falls prone; you can let up to your spellcasting modifier (minimum 1) creatures succeed automatically. If you are inside the area, you can teleport to an unoccupied space you can see within it as part of the casting.", "", "a strand of wet hair"],
  ["TDCSR", "freedom-of-the-winds", "Freedom of the Winds", 5, "Abjuration", ["druid", "ranger", "sorcerer"], "1 action", "Self", ["V", "S", "M"], "Concentration, up to 10 minutes",
    "You gain a 60-foot flying speed, advantage on ability checks to avoid being grappled, and advantage on saves against being restrained or paralyzed. When a spell or attack targets you, you can use your reaction to teleport up to 60 feet to an unoccupied space you can see; if that takes you out of the effect's range you are unaffected. The spell then ends.", "", "a scrap of sailcloth"]
);

(() => {
  const toDetail = ([source, index, name, level, school, classes, castingTime, range, components, duration, summary, higher, material]) => Object.assign(
    localSpell(index, name, level, classes, castingTime, range, components, duration, /^concentration/i.test(duration), summary),
    { school: { index: school.toLowerCase(), name: school }, ritual: /ritual/i.test(castingTime), source },
    higher ? { higher_level: [higher] } : {},
    material ? { material } : {}
  );
  const known = new Set(LOCAL_SPELLS.map(spell => spell.index));
  [...SRD_SPELLS, ...NEW_SPELLS.map(toDetail)].forEach(detail => {
    if (known.has(detail.index)) return;
    known.add(detail.index);
    LOCAL_SPELLS.push(detail);
  });
  const classList = ids => ids.map(id => ({ index: id, name: id.charAt(0).toUpperCase() + id.slice(1) }));
  LOCAL_SPELLS.forEach(detail => {
    const fix = SPELL_FIXES[detail.index] || {};
    if ("level" in fix) detail.level = fix.level;
    if (fix.school) detail.school = { index: fix.school.toLowerCase(), name: fix.school };
    if (fix.castingTime) Object.assign(detail, { casting_time: fix.castingTime, ritual: /ritual/i.test(fix.castingTime) });
    if (fix.range) detail.range = fix.range;
    if (fix.components) detail.components = fix.components;
    if (fix.duration) Object.assign(detail, { duration: fix.duration, concentration: /^concentration/i.test(fix.duration) });
    if (fix.summary) detail.desc = [fix.summary];
    const higher = "higherLevel" in fix ? fix.higherLevel : fix.higher;
    if (higher !== undefined) detail.higher_level = higher ? [higher] : [];
    if ("material" in fix) detail.material = fix.material;
    if (fix.source) detail.source = fix.source;
    if (SPELL_RENAMES[detail.index]) detail.name = SPELL_RENAMES[detail.index];
    if (SPELL_CLASS_FIXES[detail.index]) detail.classes = classList(SPELL_CLASS_FIXES[detail.index]);
    // Spells first printed in Tasha's (summons, Mind Sliver, Spirit Shroud...) are on their classes' lists in Tasha's own
    // spell chapter; only older spells added to a class by the "expanded spell list" feature stay optional.
    if (SPELL_OPTIONAL_CLASSES[detail.index] && !detail.classes.length) detail.classes = classList(SPELL_OPTIONAL_CLASSES[detail.index]);
    else if (SPELL_OPTIONAL_CLASSES[detail.index]) detail.optionalClasses = SPELL_OPTIONAL_CLASSES[detail.index];
  });
  LOCAL_SPELL_INDEX.length = 0;
  LOCAL_SPELLS.forEach(detail => LOCAL_SPELL_INDEX.push({
    index: detail.index, name: detail.name, level: detail.level,
    classes: detail.classes.map(cls => cls.index), optionalClasses: detail.optionalClasses || []
  }));
})();
