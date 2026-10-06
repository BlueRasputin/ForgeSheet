// Every 2014-era subclass's features by level (SUBCLASS_FEATURES, keyed by the OFFICIAL_SUBCLASS_FALLBACK index),
// subclasses data.js lacks (ADDED_SUBCLASSES), subclass spells, Circle of the Land terrain spells, and the
// proficiencies and limited-use trackers each subclass grants (SUBCLASS_EXTRAS). Summaries are original paraphrases.
const SUBCLASS_FEATURES = {};
const ADDED_SUBCLASSES = [];
const LAND_CIRCLE_SPELLS = {};

// Subclasses: artificer, barbarian, bard, blood hunter, cleric.
// Feature rows: [classLevel, name, original summary, meta?]
//   meta.action: "action" | "bonus" | "reaction"; meta.uses: "1" | "2" | "PB" | "WIS" | "INT" | "CHA" | "CON" | "Hemocraft"
//   (ability tokens mean that modifier, minimum 1) or a short text when it scales; meta.recharge: "short" (short or long rest) | "long";
//   meta.cost: the class resource the feature spends ("Bardic Inspiration", "Channel Divinity", "Blood Maledict").
// Sources: PHB, DMG, SCAG, XGE, TCE, VRGtR, BGG (Bigby Presents: Glory of the Giants),
//   BH (Blood Hunter, D&D Beyond 2020 — third-party/creator content), TDCSR (Tal'Dorei Campaign Setting Reborn — third-party).
ADDED_SUBCLASSES.push(
  // [index, name, classIndex, className, flavor, source] — only subclasses missing from OFFICIAL_SUBCLASS_FALLBACK
  ["giant", "Giant", "barbarian", "Barbarian", "Primal Path", "BGG"],
  ["juggernaut", "Juggernaut", "barbarian", "Barbarian", "Primal Path", "TDCSR"],
  ["tragedy", "Tragedy", "bard", "Bard", "Bard College", "TDCSR"],
  ["blood", "Blood", "cleric", "Cleric", "Divine Domain", "TDCSR"],
  // "moon" is already the druid Circle of the Moon index, so the domain needs its own slug (see findings: name lookup collides).
  ["moon-domain", "Moon", "cleric", "Cleric", "Divine Domain", "TDCSR"],
);

Object.assign(SUBCLASS_FEATURES, {
  // ---------------------------------------------------------------- ARTIFICER
  alchemist: { source: "TCE", features: [
    [3, "Tool Proficiency", "You become proficient with alchemist's supplies; if you already were, pick proficiency with one other type of artisan's tools."],
    [3, "Alchemist Spells", "Always prepared and free against your prepared total: 3rd healing word, ray of sickness; 5th flaming sphere, acid arrow; 9th gaseous form, mass healing word; 13th blight, death ward; 17th cloudkill, raise dead."],
    [3, "Experimental Elixir", "Each long rest produces one free elixir in an empty flask with a random d6 effect: 1 heals 2d4 + INT mod; 2 +10 ft walking speed for 1 hour; 3 +1 AC for 10 minutes; 4 add 1d4 to attack rolls and saving throws for 1 minute; 5 10-ft flying speed for 10 minutes; 6 alter self for 10 minutes. You make two free elixirs at 6th and three at 15th, can spend a spell slot and an action to brew another with a chosen effect, need alchemist's supplies on you, and drinking or administering one takes an action; elixirs last until drunk or the end of your next long rest.", { action: "action", uses: "1 (2 at 6th, 3 at 15th)", recharge: "long" }],
    [5, "Alchemical Savant", "When a spell you cast uses alchemist's supplies as its focus, add your INT mod (min +1) to one roll of it that restores hit points or deals acid, fire, necrotic, or poison damage."],
    [9, "Restorative Reagents", "Anyone who drinks one of your elixirs also gains 2d6 + INT mod temporary hit points (min 1). Using alchemist's supplies as the focus, you can cast lesser restoration without a slot or preparing it a number of times equal to your INT mod (min 1) per long rest.", { uses: "INT", recharge: "long" }],
    [15, "Chemical Mastery", "You resist acid and poison damage and can't be poisoned. With alchemist's supplies as the focus, you can cast greater restoration and heal once each per long rest with no slot, no preparation, and no material component.", { uses: "1 each", recharge: "long" }],
  ]},
  armorer: { source: "TCE", features: [
    [3, "Tools of the Trade", "You gain heavy armor proficiency and proficiency with smith's tools (or another artisan's tool if you already had smith's tools)."],
    [3, "Armorer Spells", "Always prepared: 3rd magic missile, thunderwave; 5th mirror image, shatter; 9th hypnotic pattern, lightning bolt; 13th fire shield, greater invisibility; 17th passwall, wall of force."],
    [3, "Arcane Armor", "As an action with smith's tools in hand, convert armor you wear into Arcane Armor: it ignores its Strength requirement, is your artificer spellcasting focus, covers your whole body (helmet toggles as a bonus action), can't be removed against your will, replaces missing limbs, and dons or doffs as an action. It stays converted until you put on other armor or die.", { action: "action" }],
    [3, "Armor Model", "Choose Guardian or Infiltrator (swap after a short or long rest with smith's tools); the model's built-in weapon uses INT for attack and damage. Guardian: gauntlets deal 1d8 thunder and a struck creature has disadvantage on attacks against anyone but you until your next turn starts; Defensive Field gives temporary HP equal to your artificer level as a bonus action, PB times per long rest. Infiltrator: Lightning Launcher (ranged, 90/300 ft, 1d6 lightning plus an extra 1d6 once per turn), +5 ft walking speed, and advantage on Dexterity (Stealth) checks.", { action: "bonus", uses: "PB", recharge: "long" }],
    [5, "Extra Attack", "You attack twice whenever you take the Attack action on your turn."],
    [9, "Armor Modifications", "For infusions your Arcane Armor counts as four items (chest piece, boots, helmet, model weapon), and your infused-item limit rises by 2 as long as the extra items are parts of the armor."],
    [15, "Perfected Armor", "Guardian: when a Huge or smaller creature you can see ends its turn within 30 ft, use your reaction to force a STR save vs your spell save DC; on a failure you pull it up to 25 ft toward you and may make a melee weapon attack if it ends within 5 ft (PB uses per long rest). Infiltrator: a creature taking lightning damage from your launcher glows (5-ft dim light) until your next turn starts, has disadvantage on attacks against you, and the next attack roll against it has advantage and adds 1d6 lightning on a hit.", { action: "reaction", uses: "PB", recharge: "long" }],
  ]},
  artillerist: { source: "TCE", features: [
    [3, "Tool Proficiency", "You become proficient with woodcarver's tools; if you already were, pick another type of artisan's tools."],
    [3, "Artillerist Spells", "Always prepared: 3rd shield, thunderwave; 5th scorching ray, shatter; 9th fireball, wind wall; 13th ice storm, wall of fire; 17th cone of cold, wall of force."],
    [3, "Eldritch Cannon", "As an action with woodcarver's or smith's tools, make a Small or Tiny cannon within 5 ft (AC 18, HP 5 x artificer level, immune to poison and psychic, lasts 1 hour; mending restores 2d6). As a bonus action within 60 ft, fire it and move it up to 15 ft if it has legs: Flamethrower (15-ft cone, DEX save, 2d8 fire, half on success), Force Ballista (ranged spell attack within 120 ft, 2d8 force and a 5-ft push), or Protector (1d8 + INT mod temporary HP, min +1, to itself and chosen creatures within 10 ft). One free cannon per long rest, more by spending a spell slot; only one exists at a time.", { action: "action", uses: "1", recharge: "long" }],
    [5, "Arcane Firearm", "After a long rest you can carve sigils into a wand, staff, or rod with woodcarver's tools; artificer spells cast through it add 1d8 to one damage roll."],
    [9, "Explosive Cannon", "Every cannon damage roll gains 1d8. As an action within 60 ft you can detonate the cannon, destroying it: creatures within 20 ft make a DEX save vs your spell save DC, taking 3d8 force on a failure or half on a success.", { action: "action" }],
    [15, "Fortified Position", "You and your allies have half cover within 10 ft of your cannon. You may keep two cannons at once (both from one action, though not from one spell slot) and fire both with one bonus action."],
  ]},
  "battle-smith": { source: "TCE", features: [
    [3, "Tool Proficiency", "You become proficient with smith's tools; if you already were, pick another type of artisan's tools."],
    [3, "Battle Smith Spells", "Always prepared: 3rd heroism, shield; 5th branding smite, warding bond; 9th aura of vitality, conjure barrage; 13th aura of purity, fire shield; 17th banishing smite, mass cure wounds."],
    [3, "Battle Ready", "You gain martial weapon proficiency, and attacks with magic weapons can use your INT mod in place of STR or DEX for attack and damage."],
    [3, "Steel Defender", "You build a Medium construct companion (AC 15, HP 2 + INT mod + 5 x artificer level, 40 ft speed) that acts right after you and only Dodges unless you spend a bonus action to command it. It attacks with your spell attack modifier for 1d8 + PB force, can Repair 2d8 + PB HP three times per day, and uses its reaction to give an attacker disadvantage against a creature within 5 ft of it. Within an hour of its death you can revive it with smith's tools, an action, and a spell slot; a long rest lets you build a replacement.", { action: "bonus" }],
    [5, "Extra Attack", "You attack twice whenever you take the Attack action on your turn."],
    [9, "Arcane Jolt", "No more than once per turn, when your magic weapon attack or your steel defender hits, deal an extra 2d6 force to the target or restore 2d6 HP to a creature or object you can see within 30 ft of it. Uses equal your INT mod (min 1) per long rest.", { uses: "INT", recharge: "long" }],
    [15, "Improved Defender", "Arcane Jolt damage and healing become 4d6, your defender gains +2 AC, and a creature whose attack it deflects takes 1d4 + INT mod force damage."],
  ]},

  // ---------------------------------------------------------------- BARBARIAN
  berserker: { source: "PHB", features: [
    [3, "Frenzy", "When you rage you can choose to frenzy: for that rage you may make one melee weapon attack as a bonus action on each of your turns after this one. You take one level of exhaustion when the rage ends.", { action: "bonus" }],
    [6, "Mindless Rage", "While raging you can't be charmed or frightened, and such effects already on you pause until the rage ends."],
    [10, "Intimidating Presence", "As an action, one creature within 30 ft that can see or hear you makes a WIS save (DC 8 + prof + CHA mod) or is frightened of you until the end of your next turn; you can spend your action on later turns to extend it. It ends if the target leaves your line of sight or gets more than 60 ft away, and a creature that saves is immune to this feature for 24 hours.", { action: "action" }],
    [14, "Retaliation", "When a creature within 5 ft of you damages you, you can use your reaction to make one melee weapon attack against it.", { action: "reaction" }],
  ]},
  "totem-warrior": { source: "PHB", features: [
    [3, "Spirit Seeker", "You can cast beast sense and speak with animals, but only as rituals."],
    [3, "Totem Spirit", "Pick one animal. Bear: while raging, resistance to every damage type except psychic. Eagle: while raging without heavy armor, opportunity attacks against you have disadvantage and you can Dash as a bonus action. Wolf: while raging, your friends have advantage on melee attacks against enemies within 5 ft of you. Elk (SCAG): while raging without heavy armor, +15 ft walking speed. Tiger (SCAG): while raging, +10 ft long jump and +3 ft high jump."],
    [6, "Aspect of the Beast", "Pick one animal (same or different). Bear: double carrying capacity and advantage on STR checks to push, pull, lift, or break. Eagle: see clearly up to 1 mile as if within 100 ft, and dim light doesn't hinder your Perception checks. Wolf: track at a fast pace and move stealthily at a normal pace. Elk (SCAG): double travel pace for you and up to ten companions within 60 ft. Tiger (SCAG): proficiency in two of Athletics, Acrobatics, Stealth, and Survival."],
    [10, "Spirit Walker", "You can cast commune with nature, but only as a ritual."],
    [14, "Totemic Attunement", "Pick one animal. Bear: while raging, hostile creatures within 5 ft have disadvantage attacking anyone else (not if they can't see or hear you or can't be frightened). Eagle: while raging, fly at your walking speed, falling if you end a turn airborne. Wolf: while raging, a bonus action knocks a Large or smaller creature prone when you hit it with a melee weapon attack. Elk (SCAG): while raging, a bonus action during your move lets you pass through a Large or smaller creature, which makes a STR save (DC 8 + STR mod + prof) or falls prone and takes 1d12 + STR mod bludgeoning. Tiger (SCAG): while raging, after moving 20 ft straight at a Large or smaller target, make a bonus-action melee weapon attack against it."],
  ]},
  "ancestral-guardian": { source: "XGE", features: [
    [3, "Ancestral Protectors", "While raging, the first creature you hit on your turn is hindered until the start of your next turn: it has disadvantage on attack rolls against anyone but you, and others it hits resist that damage. The effect ends early if your rage does."],
    [6, "Spirit Shield", "While raging, when a creature you can see within 30 ft takes damage, use your reaction to reduce it by 2d6 (3d6 at 10th, 4d6 at 14th).", { action: "reaction" }],
    [10, "Consult the Spirits", "Cast augury or clairvoyance without a spell slot or material components, with WIS as the casting ability; the clairvoyance sensor is an invisible ancestral spirit. Once per short or long rest; augury takes 1 minute and clairvoyance 10 minutes to cast.", { action: "special", cost: "Consult the Spirits", uses: "1", recharge: "short" }],
    [14, "Vengeful Ancestors", "When Spirit Shield reduces damage from an attack, the attacker takes force damage equal to the amount prevented."],
  ]},
  "storm-herald": { source: "XGE", features: [
    [3, "Storm Aura", "While raging you emit a 10-ft aura (blocked by total cover) that triggers when you rage and again with a bonus action each turn; its save DC is 8 + prof + CON mod. Desert: each other creature in it takes 2 fire (3 at 5th, 4 at 10th, 5 at 15th, 6 at 20th). Sea: one creature makes a DEX save, 1d6 lightning on a failure or half on a success (2d6 at 10th, 3d6 at 15th, 4d6 at 20th). Tundra: chosen creatures gain 2 temporary HP (3/4/5/6 at 5th/10th/15th/20th). You may change environment each time you gain a barbarian level.", { action: "bonus" }],
    [6, "Storm Soul", "Desert: fire resistance, unbothered by extreme heat, and an action to ignite an unattended flammable object you touch. Sea: lightning resistance, water breathing, and a 30-ft swimming speed. Tundra: cold resistance, unbothered by extreme cold, and an action to freeze a 5-ft cube of water you touch for 1 minute (fails if a creature is inside)."],
    [10, "Shielding Storm", "Creatures you choose inside your aura share the damage resistance from your Storm Soul."],
    [14, "Raging Storm", "Desert: when a creature in the aura hits you, use your reaction to force a DEX save or it takes fire damage equal to half your barbarian level. Sea: when you hit a creature in the aura, use your reaction to force a STR save or it falls prone. Tundra: each time the aura activates, one creature you see in it makes a STR save or has speed 0 until the start of your next turn (no reaction needed).", { action: "special" }],
  ]},
  zealot: { source: "XGE", features: [
    [3, "Divine Fury", "While raging, the first creature you hit with a weapon attack on each of your turns takes an extra 1d6 + half your barbarian level damage, necrotic or radiant (chosen when you gain this feature)."],
    [3, "Warrior of the Gods", "Spells that only return you to life (not undeath), like raise dead, need no material components when cast on you."],
    [6, "Fanatical Focus", "Once per rage, you can reroll a saving throw you failed and must keep the new result.", { uses: "1 per rage" }],
    [10, "Zealous Presence", "As a bonus action, up to ten other creatures of your choice within 60 ft that can hear you gain advantage on attack rolls and saving throws until the start of your next turn. Once per long rest.", { action: "bonus", uses: "1", recharge: "long" }],
    [14, "Rage Beyond Death", "While raging, dropping to 0 HP doesn't make you unconscious. You still make death saves and take the usual effects of damage at 0 HP, but failed death saves don't kill you until the rage ends, and only if you are still at 0 HP then."],
  ]},
  beast: { source: "TCE", features: [
    [3, "Form of the Beast", "Each time you rage, grow a natural weapon (a simple melee weapon using STR) that lasts until the rage ends. Bite: 1d8 piercing, and once per turn when it damages a creature while you're below half HP you regain HP equal to your PB. Claws: 1d6 slashing each, and once per turn when you attack with a claw using the Attack action you get one more claw attack. Tail: 1d8 piercing with reach, and when a creature within 10 ft hits you, your reaction adds 1d8 to your AC against that attack."],
    [6, "Bestial Soul", "Your natural weapons count as magical for overcoming resistance and immunity. After each short or long rest choose one until the next rest: swim speed equal to walking speed plus water breathing; climb speed equal to walking speed, including upside down, with no checks; or once per turn, extend a jump by the total of a STR (Athletics) check in feet."],
    [10, "Infectious Fury", "When you hit with a natural weapon while raging, the target makes a WIS save (DC 8 + CON mod + prof); on a failure you choose whether it spends its reaction on a melee attack against another creature you pick or takes 2d12 psychic damage. Uses equal your PB per long rest.", { uses: "PB", recharge: "long" }],
    [14, "Call the Hunt", "When you rage, choose willing creatures within 30 ft up to your CON mod (min 1); you gain 5 temporary HP per creature that accepts. Until the rage ends, each of them can add 1d6 to the damage of one hit on each of its turns. Uses equal your PB per long rest.", { uses: "PB", recharge: "long" }],
  ]},
  "wild-magic-barbarian": { source: "TCE", features: [
    [3, "Magic Awareness", "As an action, until the end of your next turn you sense every spell and magic item within 60 ft that isn't behind total cover, learning each spell's school. Uses equal your PB per long rest.", { action: "action", uses: "PB", recharge: "long" }],
    [3, "Wild Surge", "When you rage, roll a d8 for a surge lasting until the rage ends (save DC 8 + prof + CON mod): 1 chosen creatures within 30 ft make a CON save or take 1d12 necrotic, and you gain 1d12 temporary HP; 2 teleport up to 30 ft, repeatable as a bonus action; 3 a spirit within 5 ft of a creature explodes at turn's end for 1d6 force (DEX save), repeatable as a bonus action; 4 a held weapon deals force and gains light and thrown (20/60), returning to your hand; 5 creatures that hit you take 1d6 force; 6 +1 AC for you and allies within 10 ft; 7 ground within 15 ft is difficult terrain for enemies; 8 a creature within 30 ft makes a CON save or takes 1d6 radiant and is blinded until your next turn, repeatable as a bonus action."],
    [6, "Bolstering Magic", "As an action, touch a creature (or yourself) and choose: it adds 1d3 to attack rolls and ability checks for 10 minutes, or it regains one expended spell slot of a level no higher than a d3 roll (each creature only once per long rest). Uses equal your PB per long rest.", { action: "action", uses: "PB", recharge: "long" }],
    [10, "Unstable Backlash", "Immediately after you take damage or fail a saving throw while raging, use your reaction to roll a new Wild Surge, which replaces the current one.", { action: "reaction" }],
    [14, "Controlled Surge", "Roll twice on the Wild Magic table and pick either; on matching numbers you can pick any effect."],
  ]},
  battlerager: { source: "SCAG", features: [
    [3, "Battlerager Armor", "Dwarves only unless your DM allows otherwise. While raging in spiked armor, you can use a bonus action to attack a target within 5 ft with the spikes (STR, 1d4 piercing), and a successful grapple made with the Attack action deals 3 piercing damage.", { action: "bonus" }],
    [6, "Reckless Abandon", "Using Reckless Attack while raging grants temporary HP equal to your CON mod (min 1); any left vanish when the rage ends."],
    [10, "Battlerager Charge", "While raging you can Dash as a bonus action.", { action: "bonus" }],
    [14, "Spiked Retribution", "While raging, not incapacitated, and in spiked armor, a creature within 5 ft that hits you with a melee attack takes 3 piercing damage."],
  ]},
  giant: { source: "BGG", features: [
    [3, "Giant's Power", "You learn to speak, read, and write Giant (or another language if you already know Giant) and learn druidcraft or thaumaturgy, with WIS as your casting ability."],
    [3, "Giant's Havoc", "While raging, add your Rage damage bonus to hits with STR-based ranged attacks using thrown weapons, your reach grows by 5 ft, and you become Large if you were smaller and there is room."],
    [6, "Elemental Cleaver", "When you rage, infuse a held weapon with acid, cold, fire, thunder, or lightning: its damage becomes that type, it deals an extra 1d6 of that type, and it gains thrown (20/60), reappearing in your hand right after a throw. Change the type as a bonus action while raging; the benefits stop while anyone else wields it.", { action: "bonus" }],
    [10, "Mighty Impel", "As a bonus action while raging, move a Medium or smaller creature within your reach to an unoccupied space you can see within 30 ft of you; an unwilling target makes a STR save (DC 8 + prof + STR mod) to resist. A creature left without support falls, taking falling damage and landing prone.", { action: "bonus" }],
    [14, "Demiurgic Colossus", "When you rage your reach increases by 10 ft instead, you can become Large or Huge, Mighty Impel can move Large or smaller creatures, and Elemental Cleaver's extra damage rises to 2d6."],
  ]},
  juggernaut: { source: "TDCSR", features: [
    [3, "Thunderous Blows", "Once per turn while raging, when you damage a creature with a melee attack you can push it up to 5 ft in any direction (10 ft from 10th level); a Huge or larger creature can resist with a STR save (DC 8 + prof + STR mod)."],
    [3, "Spirit of the Mountain", "While raging, you can't be knocked prone or moved against your will unless you are unconscious."],
    [6, "Demolishing Might", "Your melee attacks deal double damage to objects and structures and an extra 1d8 weapon damage to constructs."],
    // VERIFY: Resolute Stance activation — one source says "no action required" at the start of your turn, another says bonus action.
    [6, "Resolute Stance", "At the start of your turn you can take a stance until the start of your next turn: you can't be grappled, and both your weapon attacks and attacks against you have disadvantage."],
    [10, "Hurricane Strike", "When you push a creature at least 5 ft, use your reaction to leap to an unoccupied space next to it without spending movement or provoking opportunity attacks; it makes a STR save (DC 8 + prof + STR mod) or falls prone. If you push a creature to within 5 ft of an ally, that ally can use its reaction to make a melee weapon attack against it.", { action: "reaction" }],
    [14, "Unstoppable", "While raging your speed can't be reduced and you are immune to frightened, paralyzed, and stunned. If you already have one of those conditions you can still rage as a bonus action, suspending it for the rage."],
  ]},

  // ---------------------------------------------------------------- BARD
  lore: { source: "PHB", features: [
    [3, "Bonus Proficiencies", "You gain proficiency in any three skills of your choice."],
    [3, "Cutting Words", "When a creature you can see within 60 ft makes an attack roll, ability check, or damage roll, use your reaction and one Bardic Inspiration to subtract a roll of the die from the total (after the roll, before the result is known). Creatures that can't hear you or can't be charmed are unaffected.", { action: "reaction", cost: "Bardic Inspiration" }],
    [6, "Additional Magical Secrets", "Learn two spells from any class's list (cantrips or levels you can cast); they are bard spells for you and don't count against spells known."],
    [14, "Peerless Skill", "When you make an ability check, you can spend one Bardic Inspiration and add the die to the check (after the roll, before the result is known).", { cost: "Bardic Inspiration" }],
  ]},
  valor: { source: "PHB", features: [
    [3, "Bonus Proficiencies", "You gain proficiency with medium armor, shields, and martial weapons."],
    [3, "Combat Inspiration", "A creature holding your Bardic Inspiration die can add it to a weapon damage roll it just made, or use its reaction when attacked to add it to its AC against that attack (after the roll, before knowing whether it hits)."],
    [6, "Extra Attack", "You attack twice whenever you take the Attack action on your turn."],
    [14, "Battle Magic", "When you use your action to cast a bard spell, you can make one weapon attack as a bonus action.", { action: "bonus" }],
  ]},
  glamour: { source: "XGE", features: [
    [3, "Mantle of Inspiration", "As a bonus action, spend one Bardic Inspiration: up to CHA mod (min 1) creatures within 60 ft that can see you each gain 5 temporary HP (8 at 5th, 11 at 10th, 14 at 15th) and can immediately use their reaction to move up to their speed without provoking opportunity attacks.", { action: "bonus", cost: "Bardic Inspiration" }],
    [3, "Enthralling Performance", "After performing for at least 1 minute, up to CHA mod (min 1) humanoids within 60 ft that saw and heard all of it make a WIS save vs your spell save DC or are charmed by you for 1 hour, adoring you and obstructing your opponents. It ends early if the target is damaged, you attack it, or it sees you harm its allies; a target that saves never realizes you tried. Once per short or long rest.", { uses: "1", recharge: "short" }],
    [6, "Mantle of Majesty", "As a bonus action, cast command without a slot, then for 1 minute while you concentrate you can cast command as a bonus action each turn without a slot; creatures charmed by you automatically fail the save. Once per long rest.", { action: "bonus", uses: "1", recharge: "long" }],
    [14, "Unbreakable Majesty", "As a bonus action, for 1 minute or until you are incapacitated, the first time each turn a creature tries to attack you it makes a CHA save vs your spell save DC. On a failure it must pick another target or lose the attack; on a success it attacks normally but has disadvantage on saves against your spells on your next turn. Once per short or long rest.", { action: "bonus", uses: "1", recharge: "short" }],
  ]},
  swords: { source: "XGE", features: [
    [3, "Bonus Proficiencies", "You gain proficiency with medium armor and the scimitar, and a simple or martial melee weapon you are proficient with can be your bard spellcasting focus."],
    [3, "Fighting Style", "Choose Dueling (+2 damage with a one-handed melee weapon when you hold no other weapon) or Two-Weapon Fighting (add your ability modifier to the off-hand attack's damage)."],
    [3, "Blade Flourish", "When you take the Attack action, your walking speed rises by 10 ft for the turn, and once per turn when one of those weapon attacks hits you can spend one Bardic Inspiration to add the die to its damage plus one effect: Defensive (add the roll to your AC until your next turn starts), Slashing (deal the roll to another creature of your choice within 5 ft of you), or Mobile (push the target 5 ft + the roll, then use your reaction to move up to your walking speed to a space within 5 ft of it).", { cost: "Bardic Inspiration" }],
    [6, "Extra Attack", "You attack twice whenever you take the Attack action on your turn."],
    [14, "Master's Flourish", "When you use a Blade Flourish, you can roll a d6 in place of spending a Bardic Inspiration die."],
  ]},
  whispers: { source: "XGE", features: [
    [3, "Psychic Blades", "Once per round on your turn, when you hit with a weapon attack, spend one Bardic Inspiration to deal an extra 2d6 psychic damage (3d6 at 5th, 5d6 at 10th, 8d6 at 15th).", { cost: "Bardic Inspiration" }],
    [3, "Words of Terror", "After speaking alone with a humanoid for at least 1 minute, it makes a WIS save vs your spell save DC or is frightened of you or a creature you choose for 1 hour, ending if it is attacked or damaged or sees its allies attacked or damaged. A target that saves never realizes you tried. Once per short or long rest.", { uses: "1", recharge: "short" }],
    [6, "Mantle of Whispers", "When a humanoid dies within 30 ft, use your reaction to capture its shadow (kept until used or your next long rest). As an action, wear it as a disguise of that person for 1 hour (end it as a bonus action), knowing what they'd tell a casual acquaintance; others see through it with WIS (Insight) contested by your CHA (Deception) +5. You capture one shadow per short or long rest.", { action: "reaction", uses: "1", recharge: "short" }],
    [14, "Shadow Lore", "As an action, whisper to one creature within 30 ft, which makes a WIS save vs your spell save DC (it succeeds automatically if it can't hear you or shares no language). On a failure it is charmed for 8 hours or until you or your allies harm it, convinced you know its worst secret; it follows your orders but won't risk its life or fight for you unless already inclined. Once per long rest.", { action: "action", uses: "1", recharge: "long" }],
  ]},
  creation: { source: "TCE", features: [
    [3, "Mote of Potential", "A creature you give Bardic Inspiration also gets a mote that lasts until the die is used. On an ability check it rolls the die twice and keeps either; on an attack roll the target and chosen creatures within 5 ft of it make a CON save vs your spell save DC or take thunder damage equal to the die roll; on a saving throw it gains temporary HP equal to the die roll + your CHA mod (min 1)."],
    [3, "Performance of Creation", "As an action, create one nonmagical Medium or smaller item worth up to 20 x your bard level gp in an unoccupied space within 10 ft; it lasts a number of hours equal to your PB and only one can exist. Once per long rest, or spend a 2nd-level or higher slot to repeat it. The size limit grows to Large at 6th and Huge at 14th.", { action: "action", uses: "1", recharge: "long" }],
    [6, "Animating Performance", "As an action, animate a Large or smaller nonmagical item within 30 ft that no one is wearing or carrying for 1 hour (AC 16, HP 10 + 5 x bard level, 30 ft walk and hover fly; slam uses your spell attack for 1d10 + PB force). It acts after you and Dodges unless you command it with a bonus action, which can share the bonus action you use for Bardic Inspiration. Once per long rest, or spend a 3rd-level or higher slot.", { action: "action", uses: "1", recharge: "long" }],
    [14, "Creative Crescendo", "Performance of Creation makes a number of items equal to your CHA mod (min 2) at once; only one can be the maximum size and the rest must be Small or Tiny. The gp limit no longer applies."],
  ]},
  eloquence: { source: "TCE", features: [
    [3, "Silver Tongue", "On CHA (Persuasion) and CHA (Deception) checks, a d20 roll of 9 or lower counts as a 10."],
    [3, "Unsettling Words", "As a bonus action, spend one Bardic Inspiration on a creature you can see within 60 ft; it subtracts a roll of the die from the next saving throw it makes before the start of your next turn.", { action: "bonus", cost: "Bardic Inspiration" }],
    [6, "Unfailing Inspiration", "A creature that adds your Bardic Inspiration die to a roll and still fails keeps the die."],
    [6, "Universal Speech", "As an action, up to CHA mod (min 1) creatures within 60 ft understand you in any language for 1 hour. Once per long rest, or spend a spell slot to use it again.", { action: "action", uses: "1", recharge: "long" }],
    [14, "Infectious Inspiration", "When a creature within 60 ft succeeds on a roll using your Bardic Inspiration die, use your reaction to give a different creature within 60 ft that can hear you a Bardic Inspiration die for free. Uses equal your CHA mod (min 1) per long rest.", { action: "reaction", uses: "CHA", recharge: "long" }],
  ]},
  spirits: { source: "VRGtR", features: [
    [3, "Guiding Whispers", "You learn guidance (not counted against cantrips known), and its range is 60 ft when you cast it."],
    [3, "Spiritual Focus", "A candle, crystal ball, skull, spirit board, or tarokka deck can be your bard spellcasting focus. From 6th level, bard spells cast through it that deal damage or restore HP add 1d6 to one damage or healing roll."],
    [3, "Tales from Beyond", "Holding your focus, use a bonus action and one Bardic Inspiration to roll your Bardic Inspiration die on the Spirit Tales table; you keep that one tale until you bestow it or finish a short or long rest. As an action, bestow it on a creature within 30 ft (you included); saves use your spell save DC. The twelve tales range from extra dice on mental checks and temporary HP to teleports, blasts of damage, healing, and a stunning psychic tale.", { action: "bonus", cost: "Bardic Inspiration" }],
    [6, "Spirit Session", "During a 1-hour ritual (can be part of a rest) with up to PB willing creatures including you, learn one divination or necromancy spell from any class whose level is no higher than the number of participants and that you can cast. It counts as a bard spell outside your known total until you start a long rest. Once per long rest.", { uses: "1", recharge: "long" }],
    [14, "Mystical Connection", "When you roll on the Spirit Tales table, roll twice and choose; on matching numbers you can choose any tale."],
  ]},
  tragedy: { source: "TDCSR", features: [
    [3, "Poetry in Misery", "When you or an ally within 30 ft rolls a 1 on the d20 for an attack roll, ability check, or saving throw, use your reaction to regain one expended Bardic Inspiration.", { action: "reaction" }],
    [3, "Sorrowful Fate", "When you or an ally you can see forces a creature to save, spend one Bardic Inspiration to make it a CHA save instead. On a failure it takes psychic damage equal to a roll of your Bardic Inspiration die and is weighed by regret for 1 minute; if it drops to 0 HP then and can speak, it utters grim last words. Once per short or long rest.", { uses: "1", recharge: "short", cost: "Bardic Inspiration" }],
    [6, "Tale of Hubris", "When a creature lands a critical hit on you or an ally you can see within 60 ft, use your reaction and one Bardic Inspiration: for 1 minute or until it suffers a critical hit itself, weapon attacks against it crit on 18-20 (17-20 at 14th).", { action: "reaction", cost: "Bardic Inspiration" }],
    [6, "Impending Misfortune", "When you make an attack roll or saving throw, you can take a +10 bonus to it, but your next attack roll or saving throw takes -10 (the penalty lapses after a short or long rest). Usable again after a short or long rest or after you drop to 0 HP.", { uses: "1", recharge: "short" }],
    [14, "Nimbus of Pathos", "As an action, touch a willing creature: for 1 minute it gains +4 AC, advantage on attack rolls and saving throws, and an extra 1d10 radiant on weapon and spell attack hits, but weapon attacks against it crit on 18-20. When the effect ends, it drops to 0 HP and is dying. Once per long rest.", { action: "action", uses: "1", recharge: "long" }],
  ]},

  // ---------------------------------------------------------------- BLOOD HUNTER (BH)
  ghostslayer: { source: "BH", features: [
    [3, "Rite of the Dawn", "You learn this crimson rite: its extra damage is radiant, and while it is active your weapon sheds bright light in a 20-ft radius, you resist necrotic damage, and hits against undead roll one additional hemocraft die of rite damage."],
    [3, "Curse Specialist", "You gain one extra use of Blood Maledict, and your blood curses can affect creatures that have no blood."],
    [7, "Aether Walk", "At the start of your turn (not incapacitated), slip partly into the Ethereal Plane for rounds equal to your Hemocraft mod (min 1): move through creatures and objects as difficult terrain and see and affect things on the Ethereal Plane. Ending a turn inside an object deals 1d10 force; if it ends while you're inside one, you're shunted out and take 2 force damage per foot moved. Once per short or long rest (twice from 15th).", { uses: "1 (2 at 15th)", recharge: "short" }],
    // VERIFY: the D&D Beyond text may limit the extra die to hits against the branded creature.
    [11, "Brand of Sundering", "Hits with a weapon carrying an active crimson rite roll one additional hemocraft die of rite damage, and a branded creature with Incorporeal Movement or similar can't pass through creatures or objects."],
    [15, "Blood Curse of the Exorcist", "You gain this curse beyond your curses known: as a bonus action, a creature you see within 30 ft stops being charmed, frightened, or possessed. Amplified, whatever caused that effect takes 3d6 psychic and makes a WIS save or is stunned until the end of your next turn.", { action: "bonus", cost: "Blood Maledict" }],
    [18, "Rite Revival", "If you drop to 0 HP without dying outright while a crimson rite is active, you can end all your active rites to drop to 1 HP instead."],
  ]},
  lycan: { source: "BH", features: [
    [3, "Heightened Senses", "You have advantage on WIS (Perception) checks that rely on hearing or smell."],
    [3, "Hybrid Transformation", "As a bonus action, take a hybrid form for up to 1 hour (revert as a bonus action; ends if you fall unconscious or die) in which you can speak, use gear, and wear armor. You gain advantage on STR checks and saves and +1 melee damage (+2 at 11th, +3 at 18th); resistance to nonmagical, non-silvered bludgeoning, piercing, and slashing and +1 AC without heavy armor; and unarmed strikes that take your crimson rite, may use DEX, deal 1d6 bludgeoning or slashing (1d8 at 11th), and allow a bonus-action unarmed strike after an Attack action strike. Bloodlust: starting a turn below half HP, make a DC 8 WIS save (auto-fail while concentrating or raging) or move to and attack the nearest creature. Once per short or long rest.", { action: "bonus", uses: "1 (2 at 11th, unlimited at 18th)", recharge: "short" }],
    [7, "Stalker's Prowess", "Speed +10 ft, long jump +10 ft, and high jump +3 ft. In hybrid form, unarmed strikes gain +1 to hit (+2 at 11th, +3 at 18th) and count as magical while your crimson rite is on them."],
    [11, "Advanced Transformation", "Hybrid Transformation can be used twice per short or long rest. Lycan Regeneration: at the start of each of your turns in hybrid form while you have at least 1 HP but less than half your maximum, regain 1 + CON mod HP (min 1) before any bloodlust save."],
    [15, "Brand of the Voracious", "In hybrid form you have advantage on bloodlust saves and on attack rolls against a creature you have branded."],
    [18, "Hybrid Transformation Mastery", "Hybrid Transformation is unlimited and lasts until you revert, fall unconscious, or die. You also gain the Blood Curse of the Howl beyond your curses known: as an action, creatures within 30 ft that hear you make a WIS save or are frightened of you until the end of your next turn (also stunned while frightened if they fail by 5 or more); those who save are immune for 24 hours, and you may exclude creatures you see. Amplified range is 60 ft.", { action: "action", cost: "Blood Maledict" }],
  ]},
  mutant: { source: "BH", features: [
    [3, "Mutagencraft", "You know 4 mutagen formulas (5 at 7th, 6 at 11th, 7 at 15th, 8 at 18th) and brew 1 mutagen whenever you finish a short or long rest (2 at 7th, 3 at 15th). Drinking one is a bonus action, its effect and drawback last until your next short or long rest, and an action flushes every mutagen from your body. Mutagens work only on you and spoil at the end of your next rest.", { action: "bonus", uses: "1 (2 at 7th, 3 at 15th)", recharge: "short" }],
    [7, "Strange Metabolism", "You are immune to poison damage and the poisoned condition. Once per long rest, as a bonus action, you can ignore one mutagen's drawback for 1 minute.", { action: "bonus", uses: "1", recharge: "long" }],
    [11, "Brand of Axiom", "Branding a creature ends any illusion or invisibility on it, which can't benefit from either while branded. A branded creature in an altered form (polymorph, shapechanging, Wild Shape, and the like) makes a WIS save or reverts and is stunned until the end of your next turn, and each later attempt to change form needs the same save or fails and stuns it the same way."],
    [15, "Blood Curse of Corrosion", "You gain this curse beyond your curses known: as a bonus action, a creature within 30 ft is poisoned, repeating a CON save at the end of each of its turns to end it. Amplified, it takes 4d6 necrotic when cursed and again on each failed save.", { action: "bonus", cost: "Blood Maledict" }],
    [18, "Exalted Mutation", "As a bonus action, end one mutagen affecting you along with its drawback and replace it with any mutagen formula you know. Uses equal your Hemocraft mod (min 1) per long rest.", { action: "bonus", uses: "Hemocraft", recharge: "long" }],
  ]},
  "profane-soul": { source: "BH", features: [
    [3, "Otherworldly Patron", "Choose a patron (Archfey, Celestial, Fathomless, Fiend, Genie, Great Old One, Hexblade, Undead, or Undying); it shapes your Rite Focus, Revealed Arcana, and Unsealed Arcana."],
    [3, "Pact Magic", "You cast warlock spells using your Hemocraft ability (save DC 8 + prof + Hemocraft mod; attack prof + Hemocraft mod). You know 2 warlock cantrips (3 at 10th) and 2 spells rising to 11 by 20th; your pact slots, all one level and regained on a short or long rest, go 1 slot of 1st at 3rd, 2 at 6th, 2nd level at 7th, 3rd level at 13th, and 4th level at 19th."],
    [3, "Rite Focus", "While a crimson rite is active your weapon is your warlock focus and your patron adds a perk: Archfey, damaged targets glow and lose cover and invisibility until the end of your next turn; Celestial, a bonus action and a Blood Maledict use heal a creature within 60 ft for one hemocraft die + Hemocraft mod; Fathomless, water breathing and once per turn a rite hit cuts speed by 10 ft until your next turn; Fiend, reroll 1s and 2s on Rite of the Flame damage; Genie, a bonus action and a Blood Maledict use grant 30-ft flight for Hemocraft mod rounds; Great Old One, a critical hit frightens the target and chosen creatures within 10 ft of it until the end of your next turn; Hexblade, your next hit on a creature under your blood curse adds your PB to damage; Undead, a reaction halves necrotic damage you take; Undying, dropping a meaningful hostile creature to 0 HP restores one hemocraft die of HP."],
    [7, "Mystic Frenzy", "After you spend your action casting a cantrip, you may attack once with a weapon as a bonus action.", { action: "bonus" }],
    [7, "Revealed Arcana", "Once per long rest, cast your patron's spell with a pact slot: Archfey blur, Celestial lesser restoration, Fathomless gust of wind, Fiend scorching ray, Genie phantasmal force, Great Old One detect thoughts, Hexblade branding smite, Undead blindness/deafness, Undying silence.", { uses: "1", recharge: "long" }],
    [11, "Brand of the Sapping Scar", "Creatures you have branded have disadvantage on saving throws against your warlock spells."],
    [15, "Unsealed Arcana", "Once per long rest, cast your patron's spell without a slot: Archfey slow, Celestial revivify, Fathomless lightning bolt, Fiend fireball, Genie protection from energy, Great Old One haste, Hexblade blink, Undead speak with dead, Undying bestow curse.", { uses: "1", recharge: "long" }],
    [18, "Blood Curse of the Souleater", "You gain this curse beyond your curses known: when a creature that isn't a construct or undead drops to 0 HP within 30 ft, use your reaction to gain advantage on attack rolls and resistance to all damage until the end of your next turn. Amplified, you also regain one expended pact slot (amplifiable once per long rest).", { action: "reaction", cost: "Blood Maledict" }],
  ]},

  // ---------------------------------------------------------------- CLERIC
  knowledge: { source: "PHB", features: [
    [1, "Knowledge Domain Spells", "Always prepared: 1st command, identify; 3rd augury, suggestion; 5th nondetection, speak with dead; 7th arcane eye, confusion; 9th legend lore, scrying."],
    [1, "Blessings of Knowledge", "Learn two languages and become proficient in two of Arcana, History, Nature, and Religion; checks with those two skills double your proficiency bonus."],
    [2, "Channel Divinity: Knowledge of the Ages", "As an action, gain proficiency with one skill or tool of your choice for 10 minutes.", { action: "action", cost: "Channel Divinity" }],
    [6, "Channel Divinity: Read Thoughts", "As an action, a creature you can see within 60 ft makes a WIS save. On a failure you read its surface thoughts for 1 minute while it stays within 60 ft, and you can end this with an action to cast suggestion on it without a slot (it fails the save automatically); on a success you can't target it again until you finish a long rest.", { action: "action", cost: "Channel Divinity" }],
    [8, "Potent Spellcasting", "Add your WIS mod to the damage of your cleric cantrips."],
    [17, "Visions of the Past", "Meditate with concentration for 1 minute up to a number of minutes equal to your WIS score to see past events. Object Reading reveals how a held object's owner gained and lost it plus their latest significant event (earlier owners within WIS-score days cost 1 more minute each); Area Reading shows one significant event per minute within a 50-ft cube, reaching back WIS-score days. Once per short or long rest.", { uses: "1", recharge: "short" }],
  ]},
  life: { source: "PHB", features: [
    [1, "Life Domain Spells", "Always prepared: 1st bless, cure wounds; 3rd lesser restoration, spiritual weapon; 5th beacon of hope, revivify; 7th death ward, guardian of faith; 9th mass cure wounds, raise dead."],
    [1, "Bonus Proficiency", "You gain proficiency with heavy armor."],
    [1, "Disciple of Life", "Your healing spells of 1st level or higher restore an extra 2 + the spell's level HP."],
    [2, "Channel Divinity: Preserve Life", "As an action, split healing equal to 5 x your cleric level among creatures within 30 ft, raising none above half its HP maximum; it doesn't work on undead or constructs.", { action: "action", cost: "Channel Divinity" }],
    [6, "Blessed Healer", "When a spell of 1st level or higher you cast heals someone other than you, you regain 2 + the spell's level HP."],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 radiant damage (2d8 at 14th)."],
    [17, "Supreme Healing", "Healing dice from your spells always count as their maximum value instead of being rolled."],
  ]},
  light: { source: "PHB", features: [
    [1, "Light Domain Spells", "Always prepared: 1st burning hands, faerie fire; 3rd flaming sphere, scorching ray; 5th daylight, fireball; 7th guardian of faith, wall of fire; 9th flame strike, scrying."],
    [1, "Bonus Cantrip", "You gain the light cantrip if you don't already know it."],
    [1, "Warding Flare", "When a creature you can see within 30 ft attacks you, use your reaction to give the attack disadvantage (creatures that can't be blinded are immune). Uses equal your WIS mod (min 1) per long rest.", { action: "reaction", uses: "WIS", recharge: "long" }],
    [2, "Channel Divinity: Radiance of the Dawn", "As an action, magical darkness within 30 ft is dispelled and each hostile creature within 30 ft makes a CON save, taking 2d10 + your cleric level radiant on a failure or half on a success; total cover protects.", { action: "action", cost: "Channel Divinity" }],
    [6, "Improved Flare", "Warding Flare can also protect another creature attacked by a creature you can see within 30 ft."],
    [8, "Potent Spellcasting", "Add your WIS mod to the damage of your cleric cantrips."],
    [17, "Corona of Light", "As an action, shine sunlight for 1 minute (bright 60 ft, dim 30 ft more; dismiss with an action); enemies in the bright light have disadvantage on saves against spells that deal fire or radiant damage.", { action: "action" }],
  ]},
  nature: { source: "PHB", features: [
    [1, "Nature Domain Spells", "Always prepared: 1st animal friendship, speak with animals; 3rd barkskin, spike growth; 5th plant growth, wind wall; 7th dominate beast, grasping vine; 9th insect plague, tree stride."],
    [1, "Acolyte of Nature", "Learn one druid cantrip (a cleric cantrip for you) and gain proficiency in Animal Handling, Nature, or Survival."],
    [1, "Bonus Proficiency", "You gain proficiency with heavy armor."],
    [2, "Channel Divinity: Charm Animals and Plants", "As an action, each beast or plant creature within 30 ft that can see you makes a WIS save or is charmed by you for 1 minute or until it takes damage, staying friendly to you and allies you designate.", { action: "action", cost: "Channel Divinity" }],
    [6, "Dampen Elements", "When you or a creature within 30 ft takes acid, cold, fire, lightning, or thunder damage, use your reaction to grant resistance against that instance.", { action: "reaction" }],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 cold, fire, or lightning damage (your choice; 2d8 at 14th)."],
    [17, "Master of Nature", "While creatures are charmed by your Charm Animals and Plants, a bonus action lets you dictate what each of them does on its next turn.", { action: "bonus" }],
  ]},
  tempest: { source: "PHB", features: [
    [1, "Tempest Domain Spells", "Always prepared: 1st fog cloud, thunderwave; 3rd gust of wind, shatter; 5th call lightning, sleet storm; 7th control water, ice storm; 9th destructive wave, insect plague."],
    [1, "Bonus Proficiencies", "You gain proficiency with martial weapons and heavy armor."],
    [1, "Wrath of the Storm", "When a creature within 5 ft that you can see hits you, use your reaction to force a DEX save: 2d8 lightning or thunder (your choice) on a failure, half on a success. Uses equal your WIS mod (min 1) per long rest.", { action: "reaction", uses: "WIS", recharge: "long" }],
    [2, "Channel Divinity: Destructive Wrath", "When you roll lightning or thunder damage, spend Channel Divinity to deal the maximum instead.", { cost: "Channel Divinity" }],
    [6, "Thunderbolt Strike", "When you deal lightning damage to a Large or smaller creature, you can push it up to 10 ft away from you."],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 thunder damage (2d8 at 14th)."],
    [17, "Stormborn", "You have a flying speed equal to your walking speed whenever you are neither underground nor indoors."],
  ]},
  trickery: { source: "PHB", features: [
    [1, "Trickery Domain Spells", "Always prepared: 1st charm person, disguise self; 3rd mirror image, pass without trace; 5th blink, dispel magic; 7th dimension door, polymorph; 9th dominate person, modify memory."],
    [1, "Blessing of the Trickster", "As an action, touch another willing creature to give it advantage on DEX (Stealth) checks for 1 hour or until you use this again.", { action: "action" }],
    [2, "Channel Divinity: Invoke Duplicity", "As an action, create an illusory double of yourself within 30 ft for 1 minute (concentration). A bonus action moves it up to 30 ft (it must stay within 120 ft), you can cast spells from its space, and you have advantage on attacks against a creature within 5 ft of both of you.", { action: "action", cost: "Channel Divinity" }],
    [6, "Channel Divinity: Cloak of Shadows", "As an action, become invisible until the end of your next turn; attacking or casting a spell ends it.", { action: "action", cost: "Channel Divinity" }],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 poison damage (2d8 at 14th)."],
    [17, "Improved Duplicity", "Invoke Duplicity makes up to four doubles, and one bonus action moves any number of them."],
  ]},
  war: { source: "PHB", features: [
    [1, "War Domain Spells", "Always prepared: 1st divine favor, shield of faith; 3rd magic weapon, spiritual weapon; 5th crusader's mantle, spirit guardians; 7th freedom of movement, stoneskin; 9th flame strike, hold monster."],
    [1, "Bonus Proficiencies", "You gain proficiency with martial weapons and heavy armor."],
    [1, "War Priest", "After taking the Attack action, make one extra weapon attack as a bonus action. Uses: WIS modifier (minimum 1) per long rest.", { action: "bonus", uses: "WIS", recharge: "long" }],
    [2, "Channel Divinity: Guided Strike", "Add +10 to one of your attack rolls after seeing the roll but before knowing the result.", { cost: "Channel Divinity" }],
    [6, "Channel Divinity: War God's Blessing", "When a creature within 30 ft makes an attack roll, use your reaction to add +10 to it (after the roll, before the result is known).", { action: "reaction", cost: "Channel Divinity" }],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 damage of the weapon's type (2d8 at 14th)."],
    [17, "Avatar of Battle", "You resist bludgeoning, piercing, and slashing damage from nonmagical weapons."],
  ]},
  death: { source: "DMG", features: [
    [1, "Death Domain Spells", "Always prepared: 1st false life, ray of sickness; 3rd blindness/deafness, ray of enfeeblement; 5th animate dead, vampiric touch; 7th blight, death ward; 9th antilife shell, cloudkill."],
    [1, "Bonus Proficiency", "You gain proficiency with martial weapons."],
    [1, "Reaper", "Learn one necromancy cantrip from any class's list. Your necromancy cantrips that normally target one creature can instead target two within range that are within 5 ft of each other."],
    [2, "Channel Divinity: Touch of Death", "When you hit a creature with a melee attack, spend Channel Divinity to add necrotic damage equal to 5 + twice your cleric level.", { cost: "Channel Divinity" }],
    [6, "Inescapable Destruction", "Necrotic damage from your cleric spells and Channel Divinity options ignores resistance to necrotic damage."],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 necrotic damage (2d8 at 14th)."],
    [17, "Improved Reaper", "Your 1st- through 5th-level necromancy spells that target only one creature can target two within range that are within 5 ft of each other; consumed material components must be supplied for each target."],
  ]},
  arcana: { source: "SCAG", features: [
    [1, "Arcana Domain Spells", "Always prepared: 1st detect magic, magic missile; 3rd magic weapon, arcanist's magic aura; 5th dispel magic, magic circle; 7th arcane eye, secret chest; 9th planar binding, teleportation circle."],
    [1, "Arcane Initiate", "You gain proficiency in Arcana and learn two wizard cantrips, which count as cleric cantrips for you."],
    [2, "Channel Divinity: Arcane Abjuration", "As an action, one celestial, elemental, fey, or fiend within 30 ft that can see or hear you makes a WIS save or is turned for 1 minute or until damaged. From 5th level, a creature that fails is instead banished for 1 minute (as banishment, no concentration) if it is away from its home plane and its CR is 1/2 or lower (1 at 8th, 2 at 11th, 3 at 14th, 4 at 17th).", { action: "action", cost: "Channel Divinity" }],
    [6, "Spell Breaker", "When your spell of 1st level or higher restores HP to an ally, you can also end one spell on it whose level is no higher than the slot you used."],
    [8, "Potent Spellcasting", "Add your WIS mod to the damage of your cleric cantrips."],
    [17, "Arcane Mastery", "Choose one wizard spell each of 6th, 7th, 8th, and 9th level; they become always-prepared domain spells."],
  ]},
  forge: { source: "XGE", features: [
    [1, "Forge Domain Spells", "Always prepared: 1st identify, searing smite; 3rd heat metal, magic weapon; 5th elemental weapon, protection from energy; 7th fabricate, wall of fire; 9th animate objects, creation."],
    [1, "Bonus Proficiencies", "You gain proficiency with heavy armor and smith's tools."],
    [1, "Blessing of the Forge", "At the end of a long rest, touch one nonmagical suit of armor or simple or martial weapon; until the end of your next long rest (or your death) it is magical, granting +1 AC as armor or +1 to attack and damage rolls as a weapon. Once per long rest.", { uses: "1", recharge: "long" }],
    [2, "Channel Divinity: Artisan's Blessing", "Through an hour-long ritual, create a nonmagical item containing metal worth up to 100 gp (a weapon, armor, ten pieces of ammunition, tools, or another metal object) within 5 ft, consuming metal (coins count) of equal value; you can also copy a metal item you hold, such as a key.", { cost: "Channel Divinity" }],
    [6, "Soul of the Forge", "You resist fire damage and gain +1 AC while wearing heavy armor."],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 fire damage (2d8 at 14th)."],
    [17, "Saint of Forge and Fire", "You are immune to fire damage, and in heavy armor you resist nonmagical bludgeoning, piercing, and slashing damage."],
  ]},
  grave: { source: "XGE", features: [
    [1, "Grave Domain Spells", "Always prepared: 1st bane, false life; 3rd gentle repose, ray of enfeeblement; 5th revivify, vampiric touch; 7th blight, death ward; 9th antilife shell, raise dead."],
    [1, "Circle of Mortality", "Healing dice from your spells on a creature at 0 HP always use their maximum. You learn spare the dying (not counted against cantrips known), which for you has a 30-ft range and a bonus-action casting time."],
    [1, "Eyes of the Grave", "As an action, until the end of your next turn you know where any undead within 60 ft is, unless it has total cover or divination protection. Uses equal your WIS mod (min 1) per long rest.", { action: "action", uses: "WIS", recharge: "long" }],
    [2, "Channel Divinity: Path to the Grave", "As an action, curse a creature you can see within 30 ft until the end of your next turn; the next attack by you or an ally that hits it deals damage to which it is vulnerable, then the curse ends.", { action: "action", cost: "Channel Divinity" }],
    [6, "Sentinel at Death's Door", "When you or an ally you can see within 30 ft suffers a critical hit, use your reaction to make it a normal hit, cancelling any crit-triggered effects. Uses equal your WIS mod (min 1) per long rest.", { action: "reaction", uses: "WIS", recharge: "long" }],
    [8, "Potent Spellcasting", "Add your WIS mod to the damage of your cleric cantrips."],
    [17, "Keeper of Souls", "When an enemy you can see dies within 30 ft, you or an ally within 30 ft regains HP equal to its number of Hit Dice; you must not be incapacitated, and it can't happen again until the start of your next turn."],
  ]},
  order: { source: "GGR", features: [
    [1, "Order Domain Spells", "Always prepared: 1st command, heroism; 3rd hold person, zone of truth; 5th mass healing word, slow; 7th compulsion, locate creature; 9th commune, dominate person."],
    [1, "Bonus Proficiencies", "You gain proficiency with heavy armor and with your choice of Intimidation or Persuasion."],
    [1, "Voice of Authority", "When you cast a spell with a slot of 1st level or higher that targets an ally, that ally (your pick if several) can use its reaction right after the spell to make one weapon attack against a creature you can see and choose."],
    [2, "Channel Divinity: Order's Demand", "As an action, each creature of your choice within 30 ft that can see or hear you makes a WIS save or is charmed by you until the end of your next turn or until it takes damage; you can also make those that fail drop what they hold.", { action: "action", cost: "Channel Divinity" }],
    [6, "Embodiment of the Law", "When you cast an enchantment spell with a slot of 1st level or higher whose casting time is 1 action, you can cast it as a bonus action instead. Uses equal your WIS mod (min 1) per long rest.", { action: "bonus", uses: "WIS", recharge: "long" }],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 psychic damage (2d8 at 14th)."],
    [17, "Order's Wrath", "Once per turn, when you deal Divine Strike damage to a creature on your turn, curse it until the start of your next turn; the next ally hit against it adds 2d8 psychic damage and ends the curse."],
  ]},
  peace: { source: "TCE", features: [
    [1, "Peace Domain Spells", "Always prepared: 1st heroism, sanctuary; 3rd aid, warding bond; 5th beacon of hope, sending; 7th aura of purity, resilient sphere; 9th greater restoration, telepathic bond."],
    [1, "Implement of Peace", "You gain proficiency in your choice of Insight, Performance, or Persuasion."],
    [1, "Emboldening Bond", "As an action, bond a number of willing creatures within 30 ft equal to your PB (you can be one) for 10 minutes or until you use this again. While within 30 ft of another bonded creature, each can add 1d4 to an attack roll, ability check, or saving throw, no more than once per turn. Uses equal your PB per long rest.", { action: "action", uses: "PB", recharge: "long" }],
    [2, "Channel Divinity: Balm of Peace", "As an action, move up to your speed without provoking opportunity attacks; each creature you come within 5 ft of during the move can regain 2d6 + WIS mod HP (min 1), once per creature per use.", { action: "action", cost: "Channel Divinity" }],
    [6, "Protective Bond", "When a bonded creature is about to take damage, another bonded creature within 30 ft of it can use its reaction to teleport to a space within 5 ft of it and take all of that damage instead.", { action: "reaction" }],
    [8, "Potent Spellcasting", "Add your WIS mod to the damage of your cleric cantrips."],
    [17, "Expansive Bond", "Emboldening Bond and Protective Bond work within 60 ft, and a creature that takes damage through Protective Bond resists it."],
  ]},
  twilight: { source: "TCE", features: [
    [1, "Twilight Domain Spells", "Always prepared: 1st faerie fire, sleep; 3rd moonbeam, see invisibility; 5th aura of vitality, tiny hut; 7th aura of life, greater invisibility; 9th circle of power, mislead."],
    [1, "Bonus Proficiencies", "You gain proficiency with martial weapons and heavy armor."],
    [1, "Eyes of Night", "You have 300-ft darkvision that treats dim light as bright and darkness as dim. As an action, share it for 1 hour with willing creatures within 10 ft, up to your WIS mod (min 1); once per long rest, or spend any spell slot to share again.", { action: "action", uses: "1", recharge: "long" }],
    [1, "Vigilant Blessing", "As an action, touch a creature (possibly yourself) to give it advantage on its next initiative roll; it ends after that roll or when you use this again.", { action: "action" }],
    [2, "Channel Divinity: Twilight Sanctuary", "As an action, a 30-ft sphere of dim light centered on you lasts 1 minute (ends if you are incapacitated or die). Whenever a creature ends its turn inside, you can give it 1d6 + your cleric level temporary HP or end one charmed or frightened effect on it.", { action: "action", cost: "Channel Divinity" }],
    [6, "Steps of Night", "As a bonus action in dim light or darkness, gain a flying speed equal to your walking speed for 1 minute. Uses equal your PB per long rest.", { action: "bonus", uses: "PB", recharge: "long" }],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 radiant damage (2d8 at 14th)."],
    [17, "Twilight Shroud", "You and your allies have half cover while inside your Twilight Sanctuary."],
  ]},
  // TDCSR pp.168-169. VERIFY all numbers below against the book: the 2017 TDCS version differs (different spells, Blood Puppet at 2nd, Crimson Bond at 6th, Sanguine Recall at 8th with 1d6/level, aura 2d6).
  blood: { source: "TDCSR", features: [
    [1, "Blood Domain Spells", "Always prepared: 1st false life, sleep; 3rd hold person, ray of enfeeblement; 5th haste, slow; 7th blight, stoneskin; 9th dominate person, hold monster."],
    [1, "Bonus Proficiency", "You gain proficiency with martial weapons."],
    // VERIFY: instantaneous-duration restriction and whether every damaged creature takes the extra damage.
    [1, "Bloodletting Focus", "When a spell of 1st level or higher with an instantaneous duration damages a creature that has blood, it takes extra necrotic damage equal to 2 + the spell's level."],
    [2, "Channel Divinity: Crimson Bond", "As an action, focus on a sample of a creature's blood to bond with it for up to 1 hour (as concentration), learning its approximate distance, direction, and general health while it is within 10 miles. While bonded, an action and 2d6 necrotic damage to yourself force it to make a CON save; on a failure you see or hear through its senses for rounds equal to your WIS mod (min 1), and the bond then ends.", { action: "action", cost: "Channel Divinity" }],
    // VERIFY: save type (WIS per wiki), range, duration and what control allows.
    [6, "Channel Divinity: Blood Puppet", "As an action, a Large or smaller creature with blood (Huge or smaller from 17th) makes a WIS save or is charmed and you control its movements for up to 1 minute (concentration); unconscious creatures and corpses fail automatically.", { action: "action", cost: "Channel Divinity" }],
    // VERIFY: 1d8 per slot level (TDCSR) vs 1d6 (2017 TDCS).
    [6, "Sanguine Recall", "As an action, recover expended spell slots with a combined level up to half your cleric level (rounded up), none above 5th level, taking 1d8 necrotic damage per slot level recovered. Once per long rest.", { action: "action", uses: "1", recharge: "long" }],
    [8, "Divine Strike", "Once on each of your turns when a weapon attack hits, deal an extra 1d8 necrotic damage (2d8 at 14th)."],
    // VERIFY: 3d6 per TDCSR guides.
    [17, "Vascular Corruption Aura", "As an action, for 1 minute hostile creatures with blood take 3d6 necrotic damage when they first enter or start their turn within 30 ft of you, and any healing they receive there is halved (rounded up). Once per long rest.", { action: "action", uses: "1", recharge: "long" }],
  ]},
  // TDCSR pp.169-170.
  "moon-domain": { source: "TDCSR", features: [
    [1, "Moon Domain Spells", "Always prepared: 1st faerie fire, silent image; 3rd invisibility, moonbeam; 5th hypnotic pattern, major image; 7th greater invisibility, hallucinatory terrain; 9th dream, passwall."],
    [1, "Clarity of Catha", "When a creature you can see within 30 ft makes a WIS saving throw, use your reaction to give it advantage. Uses equal your PB per long rest.", { action: "reaction", uses: "PB", recharge: "long" }],
    // VERIFY: target (one creature you touch?) and whether the 17th-level upgrade changes it.
    [2, "Channel Divinity: Blessing of the Full Moon", "As an action, bless a creature with one of two gifts. Watchful Moon (1 hour): +10 ft speed and advantage on WIS (Perception) and WIS (Survival) checks that use smell or track a creature. Blood-Drenched Moon (10 minutes): advantage on attack rolls against a target that has one of the creature's conscious allies within 5 ft of it.", { action: "action", cost: "Channel Divinity" }],
    [6, "Channel Divinity: Mind of Two Moons", "Spend Channel Divinity to concentrate on two Moon Domain spells at once; concentration saves are made with disadvantage and a failure ends both.", { cost: "Channel Divinity" }],
    [8, "Empowered Cantrips", "Add your WIS mod to the damage of your cleric cantrips."],
    [17, "Eclipse of Ill Omen", "As a bonus action, fill a 60-ft radius around you with dim red light for up to 1 minute (concentration; counts as a Moon Domain spell for Mind of Two Moons), even underground or on other planes. Creatures you choose in it have disadvantage on saving throws, and once per turn when you deal radiant damage to a creature in it you can curse it so its speed is halved and it can't regain HP while the eclipse lasts. Once per long rest.", { action: "bonus", uses: "1", recharge: "long" }],
  ]},
});

// Always-prepared / always-known subclass spells by class level (spell index slugs from SCRATCH/spell-inventory.tsv).
// All slugs below exist in the inventory. Feature-cast spells that are NOT always known (Totem Warrior rituals, Ancestral
// Guardian augury/clairvoyance, Glamour command, Alchemist free casts, Profane Soul patron spells) are deliberately left out.
Object.assign(SUBCLASS_SPELLS, {
  alchemist: { 3: ["healing-word", "ray-of-sickness"], 5: ["flaming-sphere", "acid-arrow"], 9: ["gaseous-form", "mass-healing-word"], 13: ["blight", "death-ward"], 17: ["cloudkill", "raise-dead"] },
  armorer: { 3: ["magic-missile", "thunderwave"], 5: ["mirror-image", "shatter"], 9: ["hypnotic-pattern", "lightning-bolt"], 13: ["fire-shield", "greater-invisibility"], 17: ["passwall", "wall-of-force"] },
  artillerist: { 3: ["shield", "thunderwave"], 5: ["scorching-ray", "shatter"], 9: ["fireball", "wind-wall"], 13: ["ice-storm", "wall-of-fire"], 17: ["cone-of-cold", "wall-of-force"] },
  "battle-smith": { 3: ["heroism", "shield"], 5: ["branding-smite", "warding-bond"], 9: ["aura-of-vitality", "conjure-barrage"], 13: ["aura-of-purity", "fire-shield"], 17: ["banishing-smite", "mass-cure-wounds"] },
  // Bard College of Spirits: Guiding Whispers grants guidance (always known, not counted).
  spirits: { 3: ["guidance"] },
  knowledge: { 1: ["command", "identify"], 3: ["augury", "suggestion"], 5: ["nondetection", "speak-with-dead"], 7: ["arcane-eye", "confusion"], 9: ["legend-lore", "scrying"] },
  life: { 1: ["bless", "cure-wounds"], 3: ["lesser-restoration", "spiritual-weapon"], 5: ["beacon-of-hope", "revivify"], 7: ["death-ward", "guardian-of-faith"], 9: ["mass-cure-wounds", "raise-dead"] },
  // Light adds the light cantrip (Bonus Cantrip).
  light: { 1: ["light", "burning-hands", "faerie-fire"], 3: ["flaming-sphere", "scorching-ray"], 5: ["daylight", "fireball"], 7: ["guardian-of-faith", "wall-of-fire"], 9: ["flame-strike", "scrying"] },
  nature: { 1: ["animal-friendship", "speak-with-animals"], 3: ["barkskin", "spike-growth"], 5: ["plant-growth", "wind-wall"], 7: ["dominate-beast", "grasping-vine"], 9: ["insect-plague", "tree-stride"] },
  tempest: { 1: ["fog-cloud", "thunderwave"], 3: ["gust-of-wind", "shatter"], 5: ["call-lightning", "sleet-storm"], 7: ["control-water", "ice-storm"], 9: ["destructive-wave", "insect-plague"] },
  trickery: { 1: ["charm-person", "disguise-self"], 3: ["mirror-image", "pass-without-trace"], 5: ["blink", "dispel-magic"], 7: ["dimension-door", "polymorph"], 9: ["dominate-person", "modify-memory"] },
  war: { 1: ["divine-favor", "shield-of-faith"], 3: ["magic-weapon", "spiritual-weapon"], 5: ["crusaders-mantle", "spirit-guardians"], 7: ["freedom-of-movement", "stoneskin"], 9: ["flame-strike", "hold-monster"] },
  death: { 1: ["false-life", "ray-of-sickness"], 3: ["blindness-deafness", "ray-of-enfeeblement"], 5: ["animate-dead", "vampiric-touch"], 7: ["blight", "death-ward"], 9: ["antilife-shell", "cloudkill"] },
  arcana: { 1: ["detect-magic", "magic-missile"], 3: ["magic-weapon", "arcanists-magic-aura"], 5: ["dispel-magic", "magic-circle"], 7: ["arcane-eye", "secret-chest"], 9: ["planar-binding", "teleportation-circle"] },
  forge: { 1: ["identify", "searing-smite"], 3: ["heat-metal", "magic-weapon"], 5: ["elemental-weapon", "protection-from-energy"], 7: ["fabricate", "wall-of-fire"], 9: ["animate-objects", "creation"] },
  // Grave adds spare the dying (Circle of Mortality).
  grave: { 1: ["spare-the-dying", "bane", "false-life"], 3: ["gentle-repose", "ray-of-enfeeblement"], 5: ["revivify", "vampiric-touch"], 7: ["blight", "death-ward"], 9: ["antilife-shell", "raise-dead"] },
  order: { 1: ["command", "heroism"], 3: ["hold-person", "zone-of-truth"], 5: ["mass-healing-word", "slow"], 7: ["compulsion", "locate-creature"], 9: ["commune", "dominate-person"] },
  peace: { 1: ["heroism", "sanctuary"], 3: ["aid", "warding-bond"], 5: ["beacon-of-hope", "sending"], 7: ["aura-of-purity", "resilient-sphere"], 9: ["greater-restoration", "telepathic-bond"] },
  twilight: { 1: ["faerie-fire", "sleep"], 3: ["moonbeam", "see-invisibility"], 5: ["aura-of-vitality", "tiny-hut"], 7: ["aura-of-life", "greater-invisibility"], 9: ["circle-of-power", "mislead"] },
  // TDCSR (2022) list; the 2017 TDCS list differed (ray of sickness, crown of madness).
  blood: { 1: ["false-life", "sleep"], 3: ["hold-person", "ray-of-enfeeblement"], 5: ["haste", "slow"], 7: ["blight", "stoneskin"], 9: ["dominate-person", "hold-monster"] },
  "moon-domain": { 1: ["faerie-fire", "silent-image"], 3: ["invisibility", "moonbeam"], 5: ["hypnotic-pattern", "major-image"], 7: ["greater-invisibility", "hallucinatory-terrain"], 9: ["dream", "passwall"] },
});

// Mechanical extras: proficiencies and limited-use trackers. trackers: (level, prof) => [[name, max, "short"|"long"]]
// Also read by applySubclassExtras: tools, skills (fixed skill ids), cantrips (fixed slugs), languages (fixed),
// choices (free-text picks the player still has to make).
// classId guards entries whose display name collides with another class's subclass (lookup is by name today).
// Hemocraft mod: hemocraftAbility() (INT by default, WIS when the player picked it with DM permission).
Object.assign(SUBCLASS_EXTRAS, {
  // Artificer
  alchemist: { classId: "artificer", tools: ["Alchemist's supplies"], trackers: level => [
    level >= 3 ? ["Experimental Elixir", level >= 15 ? 3 : level >= 6 ? 2 : 1, "long"] : null,
    level >= 9 ? ["Restorative Reagents", Math.max(1, mod("int")), "long"] : null,
    level >= 15 ? ["Chemical Mastery: Greater Restoration", 1, "long"] : null,
    level >= 15 ? ["Chemical Mastery: Heal", 1, "long"] : null
  ].filter(Boolean) },
  armorer: { classId: "artificer", armor: ["Heavy armor"], tools: ["Smith's tools"], trackers: (level, prof) => [
    // Defensive Field only exists while the Guardian model is equipped.
    level >= 3 ? ["Defensive Field (Guardian)", prof, "long"] : null,
    level >= 15 ? ["Perfected Armor (Guardian)", prof, "long"] : null
  ].filter(Boolean) },
  // ponytail: Fortified Position's second cannon is "two with the same action" — tracked as one free creation per long rest.
  artillerist: { classId: "artificer", tools: ["Woodcarver's tools"], trackers: level => level >= 3 ? [["Eldritch Cannon", 1, "long"]] : [] },
  "battle-smith": { classId: "artificer", weapons: ["Martial weapons"], tools: ["Smith's tools"], trackers: level => [
    level >= 3 ? ["Steel Defender Repair", 3, "long"] : null,
    level >= 9 ? ["Arcane Jolt", Math.max(1, mod("int")), "long"] : null
  ].filter(Boolean) },
  // Barbarian
  "ancestral-guardian": { trackers: level => level >= 10 ? [["Consult the Spirits", 1, "short"]] : [] },
  zealot: { trackers: level => level >= 10 ? [["Zealous Presence", 1, "long"]] : [] },
  beast: { trackers: (level, prof) => [
    level >= 10 ? ["Infectious Fury", prof, "long"] : null,
    level >= 14 ? ["Call the Hunt", prof, "long"] : null
  ].filter(Boolean) },
  "wild-magic-barbarian": { classId: "barbarian", trackers: (level, prof) => [
    level >= 3 ? ["Magic Awareness", prof, "long"] : null,
    level >= 6 ? ["Bolstering Magic", prof, "long"] : null
  ].filter(Boolean) },
  giant: { classId: "barbarian", languages: ["Giant"], choices: ["Druidcraft or thaumaturgy cantrip (WIS)", "Another language if you already know Giant"] },
  // Bard
  lore: { choices: ["Any three skills"] },
  valor: { armor: ["Medium armor", "Shields"], weapons: ["Martial weapons"] },
  swords: { armor: ["Medium armor"], weapons: ["Scimitar"], choices: ["Fighting style: Dueling or Two-Weapon Fighting"] },
  glamour: { trackers: level => [
    level >= 3 ? ["Enthralling Performance", 1, "short"] : null,
    level >= 6 ? ["Mantle of Majesty", 1, "long"] : null,
    level >= 14 ? ["Unbreakable Majesty", 1, "short"] : null
  ].filter(Boolean) },
  whispers: { trackers: level => [
    level >= 3 ? ["Words of Terror", 1, "short"] : null,
    level >= 6 ? ["Mantle of Whispers", 1, "short"] : null,
    level >= 14 ? ["Shadow Lore", 1, "long"] : null
  ].filter(Boolean) },
  creation: { trackers: level => [
    level >= 3 ? ["Performance of Creation", 1, "long"] : null,
    level >= 6 ? ["Animating Performance", 1, "long"] : null
  ].filter(Boolean) },
  eloquence: { trackers: level => [
    level >= 6 ? ["Universal Speech", 1, "long"] : null,
    level >= 14 ? ["Infectious Inspiration", Math.max(1, mod("cha")), "long"] : null
  ].filter(Boolean) },
  spirits: { cantrips: ["guidance"], trackers: level => level >= 6 ? [["Spirit Session", 1, "long"]] : [] },
  tragedy: { trackers: level => [
    level >= 3 ? ["Sorrowful Fate", 1, "short"] : null,
    level >= 6 ? ["Impending Misfortune", 1, "short"] : null,
    level >= 14 ? ["Nimbus of Pathos", 1, "long"] : null
  ].filter(Boolean) },
  // Blood Hunter. Curse Specialist re-emits "Blood Maledict" one higher; allClassTrackers keeps the larger pool of a shared name.
  ghostslayer: { classId: "bloodhunter", trackers: level => [
    level >= 3 ? ["Blood Maledict", (level >= 17 ? 4 : level >= 13 ? 3 : level >= 6 ? 2 : 1) + 1, "short"] : null,
    level >= 7 ? ["Aether Walk", level >= 15 ? 2 : 1, "short"] : null
  ].filter(Boolean) },
  lycan: { classId: "bloodhunter", trackers: level => level >= 3 && level < 18 ? [["Hybrid Transformation", level >= 11 ? 2 : 1, "short"]] : [] },
  mutant: { classId: "bloodhunter", trackers: level => [
    level >= 3 ? ["Mutagens", level >= 15 ? 3 : level >= 7 ? 2 : 1, "short"] : null,
    level >= 7 ? ["Strange Metabolism", 1, "long"] : null,
    level >= 18 ? ["Exalted Mutation", Math.max(1, mod(hemocraftAbility())), "long"] : null
  ].filter(Boolean) },
  "profane-soul": { classId: "bloodhunter", trackers: level => [
    level >= 7 ? ["Revealed Arcana", 1, "long"] : null,
    level >= 15 ? ["Unsealed Arcana", 1, "long"] : null
  ].filter(Boolean) },
  // Cleric
  knowledge: { choices: ["Two languages", "Two of Arcana, History, Nature, Religion (proficiency, doubled bonus)"], trackers: level => level >= 17 ? [["Visions of the Past", 1, "short"]] : [] },
  life: { armor: ["Heavy armor"] },
  light: { cantrips: ["light"], trackers: () => [["Warding Flare", Math.max(1, mod("wis")), "long"]] },
  nature: { armor: ["Heavy armor"], choices: ["One druid cantrip", "One of Animal Handling, Nature, Survival"] },
  tempest: { armor: ["Heavy armor"], weapons: ["Martial weapons"], trackers: () => [["Wrath of the Storm", Math.max(1, mod("wis")), "long"]] },
  war: { armor: ["Heavy armor"], weapons: ["Martial weapons"], trackers: () => [["War Priest", Math.max(1, mod("wis")), "long"]] },
  death: { weapons: ["Martial weapons"], choices: ["One necromancy cantrip from any class"] },
  arcana: { skills: ["arcana"], choices: ["Two wizard cantrips"] },
  forge: { armor: ["Heavy armor"], tools: ["Smith's tools"], trackers: () => [["Blessing of the Forge", 1, "long"]] },
  grave: { cantrips: ["spare-the-dying"], trackers: level => [
    ["Eyes of the Grave", Math.max(1, mod("wis")), "long"],
    level >= 6 ? ["Sentinel at Death's Door", Math.max(1, mod("wis")), "long"] : null
  ].filter(Boolean) },
  order: { armor: ["Heavy armor"], choices: ["Intimidation or Persuasion"], trackers: level => level >= 6 ? [["Embodiment of the Law", Math.max(1, mod("wis")), "long"]] : [] },
  peace: { choices: ["One of Insight, Performance, Persuasion"], trackers: (level, prof) => [["Emboldening Bond", prof, "long"]] },
  twilight: { armor: ["Heavy armor"], weapons: ["Martial weapons"], trackers: (level, prof) => [
    ["Eyes of Night (share)", 1, "long"],
    level >= 6 ? ["Steps of Night", prof, "long"] : null
  ].filter(Boolean) },
  blood: { classId: "cleric", weapons: ["Martial weapons"], trackers: level => [
    level >= 6 ? ["Sanguine Recall", 1, "long"] : null,
    level >= 17 ? ["Vascular Corruption Aura", 1, "long"] : null
  ].filter(Boolean) },
  "moon-domain": { classId: "cleric", trackers: (level, prof) => [
    ["Clarity of Catha", prof, "long"],
    level >= 17 ? ["Eclipse of Ill Omen", 1, "long"] : null
  ].filter(Boolean) },
});

// Subclasses: druid, fighter, monk, paladin, ranger.
// Feature row: [classLevel, name, original summary, meta]
//   meta.action: "passive" | "action" | "bonus" | "reaction" | "free" | "special" (no single action type) | "rest"
//   meta.uses: number | "prof" | "2prof" | "level" | "wis" | "cha" | "con" | "str" (ability = modifier, minimum 1)
//   meta.recharge: "short" (short or long rest) | "long"
//   meta.optional: true marks a Tasha's optional replacement (source "TCE-optional")
//   meta.options: [[optionName, original summary], ...] for pick-lists (maneuvers, disciplines, runes, shots)
// Every summary is original wording; numbers follow the 2014-era books (wording never copied).
ADDED_SUBCLASSES.push(
  // [index, name, classIndex, className, flavor, source] — only subclasses missing from OFFICIAL_SUBCLASS_FALLBACK
  ["blighted", "Blighted", "druid", "Druid", "Druid Circle", "TDCSR"],
  ["cobalt-soul", "Cobalt Soul", "monk", "Monk", "Monastic Tradition", "TDCSR"],
  ["open-sea", "Open Sea", "paladin", "Paladin", "Sacred Oath", "TDCSR"]
);

Object.assign(SUBCLASS_FEATURES, {
  // ───────────────────────────── DRUID (circle at 2nd; features at 2/6/10/14) ─────────────────────────────
  land: { source: "PHB", features: [
    [2, "Bonus Cantrip", "Learn one extra druid cantrip of your choice; it doesn't count against your cantrips known.", { action: "passive" }],
    [2, "Natural Recovery", "Once per long rest, during a short rest, recover expended spell slots whose combined level is up to half your druid level (rounded up); none of them can be 6th level or higher.", { action: "rest", uses: 1, recharge: "long" }],
    [3, "Circle Spells", "Pick a land (arctic, coast, desert, forest, grassland, mountain, swamp, or Underdark) when you join. At druid levels 3, 5, 7, and 9 you gain that land's two spells; they are always prepared, don't count against prepared spells, and are druid spells for you.", { action: "passive" }],
    [6, "Land's Stride", "Nonmagical difficult terrain costs you no extra movement, and nonmagical plants neither slow nor hurt you. You have advantage on saves against plants magically made or manipulated to hinder movement, such as entangle.", { action: "passive" }],
    [10, "Nature's Ward", "Elementals and fey can't charm or frighten you, and you are immune to poison and disease.", { action: "passive" }],
    [14, "Nature's Sanctuary", "A beast or plant that attacks you must first make a Wisdom save against your spell save DC; on a failure it must pick another target or its attack automatically misses. On a success it is immune to this for 24 hours. It knows about this effect before attacking.", { action: "passive" }]
  ]},
  moon: { source: "PHB", features: [
    [2, "Combat Wild Shape", "Wild Shape takes a bonus action instead of an action. While transformed, you can use a bonus action to expend a spell slot and regain 1d8 hit points per level of that slot.", { action: "bonus" }],
    [2, "Circle Forms", "Your Wild Shape can become a beast of up to CR 1, ignoring the Beast Shapes table's CR column but still obeying its movement limits (no swimming speed before 4th level, no flying speed before 8th).", { action: "passive" }],
    [6, "Circle Forms (improved)", "Maximum beast CR becomes your druid level divided by 3, rounded down: CR 2 at 6th, 3 at 9th, 4 at 12th, 5 at 15th, 6 at 18th.", { action: "passive" }],
    [6, "Primal Strike", "Attacks you make in beast form count as magical for overcoming resistance and immunity to nonmagical attacks and damage.", { action: "passive" }],
    [10, "Elemental Wild Shape", "Expend two uses of Wild Shape at once to become an air, earth, fire, or water elemental.", { action: "bonus" }],
    [14, "Thousand Forms", "You can cast alter self at will.", { action: "action" }]
  ]},
  dreams: { source: "XGE", features: [
    [2, "Balm of the Summer Court", "You have a pool of d6s equal to your druid level. As a bonus action, pick an ally you can see within 120 feet and spend up to half your druid level in dice: it regains the total rolled and gains 1 temporary hit point per die spent. The pool refills on a long rest.", { action: "bonus", uses: "level", recharge: "long" }],
    [6, "Hearth of Moonlight and Shadow", "At the start of a short or long rest, touch a point to create an invisible 30-foot-radius sphere (blocked by total cover). You and allies inside get +5 to Dexterity (Stealth) and Wisdom (Perception) checks, and open-flame light inside can't be seen from outside. It ends when the rest ends or you leave it.", { action: "rest" }],
    [10, "Hidden Paths", "As a bonus action, teleport up to 60 feet to an unoccupied space you can see; or, as an action, teleport a willing creature you touch up to 30 feet to a space you can see. Uses equal your Wisdom modifier (minimum 1) per long rest.", { action: "bonus", uses: "wis", recharge: "long" }],
    [14, "Walker in Dreams", "When you finish a short rest, cast dream (as the messenger), scrying, or teleportation circle with no slot or material components. This teleportation circle opens to where you last finished a long rest on your current plane (it fails without being wasted if there is none). Once per long rest.", { action: "rest", uses: 1, recharge: "long" }]
  ]},
  shepherd: { source: "XGE", features: [
    [2, "Speech of the Woods", "You learn to speak, read, and write Sylvan. Beasts understand your speech, and you can interpret their noises and motions.", { action: "passive" }],
    [2, "Spirit Totem", "As a bonus action, summon an incorporeal spirit at a point you can see within 60 feet; it projects a 30-foot-radius aura for 1 minute and you can move it up to 60 feet as a bonus action. Bear: chosen creatures in the aura when it appears gain 5 + druid level temporary HP, and you and allies have advantage on Strength checks and saves in it. Hawk: your reaction grants advantage on an attack roll against a target in the aura, and you and allies have advantage on Wisdom (Perception) checks in it. Unicorn: advantage on ability checks to detect creatures in the aura, and when you heal with a spell slot, chosen creatures in the aura also regain HP equal to your druid level. Once per short or long rest.", { action: "bonus", uses: 1, recharge: "short" }],
    [6, "Mighty Summoner", "Beasts and fey you summon or create with a spell get 2 extra hit points per Hit Die, and their natural weapons count as magical against nonmagical resistance and immunity.", { action: "passive" }],
    [10, "Guardian Spirit", "A beast or fey you summoned or created with a spell that ends its turn in your Spirit Totem aura regains hit points equal to half your druid level.", { action: "passive" }],
    [14, "Faithful Summons", "When you drop to 0 hit points or are incapacitated against your will, you immediately get conjure animals as if cast with a 9th-level slot: four beasts of CR 2 or lower appear within 20 feet, guard you, and last 1 hour without concentration. Once per long rest.", { action: "special", uses: 1, recharge: "long" }]
  ]},
  spores: { source: "GGR", features: [ // reprinted in TCE
    [2, "Circle Spells", "You learn chill touch. At druid levels 3, 5, 7, and 9 you gain the listed circle spells; they are always prepared, don't count against prepared spells, and are druid spells for you.", { action: "passive" }],
    [2, "Halo of Spores", "When a creature you can see moves into a space within 10 feet of you or starts its turn there, your reaction deals 1d4 necrotic damage unless it succeeds on a Constitution save against your spell save DC. The die becomes 1d6 at 6th, 1d8 at 10th, and 1d10 at 14th level.", { action: "reaction" }],
    [2, "Symbiotic Entity", "As an action, expend a Wild Shape use to gain 4 temporary hit points per druid level. While active, Halo of Spores rolls its damage die twice and your melee weapon hits deal an extra 1d6 necrotic. It lasts 10 minutes, until those temporary hit points are gone, or until you use Wild Shape again.", { action: "action" }],
    [6, "Fungal Infestation", "When a Small or Medium beast or humanoid dies within 10 feet of you, your reaction raises it as a zombie with 1 hit point for 1 hour. It acts right after you, follows your mental commands, and can only take the Attack action for one melee attack. Uses equal your Wisdom modifier (minimum 1) per long rest.", { action: "reaction", uses: "wis", recharge: "long" }],
    [10, "Spreading Spores", "While Symbiotic Entity is active, as a bonus action hurl spores to a 10-foot cube up to 30 feet away for 1 minute. A creature entering or starting its turn there takes your Halo of Spores damage unless it passes a Constitution save (once per turn). You can't use the Halo reaction while the cube exists; it ends if you dismiss it (bonus action), use this again, or Symbiotic Entity ends.", { action: "bonus" }],
    [14, "Fungal Body", "You can't be blinded, deafened, frightened, or poisoned, and critical hits against you count as normal hits unless you are incapacitated.", { action: "passive" }]
  ]},
  stars: { source: "TCE", features: [
    [2, "Star Map", "You have a Tiny star chart that works as your druid focus. While holding it you know guidance, always have guiding bolt prepared (not counted against prepared spells), and can cast guiding bolt without a slot a number of times equal to your proficiency bonus per long rest. A lost map can be remade in a 1-hour ceremony during a rest.", { action: "passive", uses: "prof", recharge: "long" }],
    [2, "Starry Form", "As a bonus action, expend a Wild Shape use to glow (bright light 10 ft, dim 10 ft more) for 10 minutes instead of becoming a beast. Choose a constellation: Archer — on activation and as a bonus action on later turns, a ranged spell attack within 60 feet for 1d8 + Wisdom modifier radiant; Chalice — when a slot spell heals someone, you or a creature within 30 feet regains 1d8 + Wisdom modifier HP; Dragon — treat a d20 of 9 or lower as 10 on Intelligence or Wisdom checks and Constitution saves to keep concentration. Ends early if you dismiss it, are incapacitated, die, or use it again.", { action: "bonus" }],
    [6, "Cosmic Omen", "After each long rest, roll a die. Even (Weal): as a reaction, add 1d6 to an attack roll, save, or ability check a creature you can see within 30 feet is about to make. Odd (Woe): subtract 1d6 instead. Uses equal your proficiency bonus per long rest.", { action: "reaction", uses: "prof", recharge: "long" }],
    [10, "Twinkling Constellations", "Archer and Chalice rise to 2d8; Dragon also grants a 20-foot flying speed and hover. At the start of each of your turns in Starry Form you can switch constellations.", { action: "passive" }],
    [14, "Full of Stars", "While in Starry Form you resist bludgeoning, piercing, and slashing damage.", { action: "passive" }]
  ]},
  wildfire: { source: "TCE", features: [
    [2, "Circle Spells", "You gain the listed circle spells at druid levels 2, 3, 5, 7, and 9; they are always prepared, don't count against prepared spells, and are druid spells for you.", { action: "passive" }],
    [2, "Summon Wildfire Spirit", "As an action, expend a Wild Shape use to summon your Small elemental spirit within 30 feet; each creature within 10 feet of it (except you) makes a Dexterity save or takes 2d6 fire. Spirit: AC 13, HP 5 + 5 × druid level, speed 30 ft, fly 30 ft (hover); Flame Seed (spell attack, 60 ft, 1d6 + PB fire); Fiery Teleportation (it and willing creatures within 5 ft teleport up to 15 ft; creatures within 5 ft of where it left make a Dexterity save or take 1d6 + PB fire). It acts right after you, only Dodges unless you command it with a bonus action, and lasts 1 hour.", { action: "action" }],
    [6, "Enhanced Bond", "While your spirit is summoned, a spell you cast that deals fire damage or heals adds 1d8 to one damage or healing roll, and spells with a range other than self can originate from the spirit.", { action: "passive" }],
    [10, "Cauterizing Flames", "When a Small or larger creature dies within 30 feet of you or your spirit, a spectral flame stays in its space for 1 minute. When a creature you can see enters that space, your reaction snuffs the flame to heal it or burn it for 2d10 + your Wisdom modifier. Uses equal your proficiency bonus per long rest.", { action: "reaction", uses: "prof", recharge: "long" }],
    [14, "Blazing Revival", "If your spirit is within 120 feet when you drop to 0 hit points and fall unconscious, you can drop the spirit to 0 hit points instead; you regain half your hit points and stand up. Once per long rest.", { action: "special", uses: 1, recharge: "long" }]
  ]},
  blighted: { source: "TDCSR", features: [
    [2, "Defile Ground", "As a bonus action, corrupt a 10-foot-radius area centered within 60 feet for 1 minute. It is difficult terrain for creatures hostile to you, and a creature in it that takes damage from an attack or spell for the first time on a turn takes an extra 1d4 necrotic. Move it up to 30 feet as a bonus action; flying creatures are unaffected. At 10th level the radius is 20 feet and the die is 1d6; at 14th the die is 1d8. Once per short or long rest.", { action: "bonus", uses: 1, recharge: "short" }],
    [2, "Blighted Shape", "You gain proficiency in Intimidation. While in Wild Shape you get +2 AC and darkvision 60 feet (or +60 feet if the form already has darkvision).", { action: "passive" }],
    [6, "Call of the Shadowseeds", "When a creature that isn't undead or a construct takes damage inside your Defile Ground, your reaction summons a blighted sapling within 5 feet of it and can have it attack a creature within 5 feet. Sapling: Medium plant, AC 10 + PB, HP twice your druid level, speed 30 ft, blindsight 60 ft, claws (your spell attack, 2d4 + PB piercing; two claws at 14th level); vulnerable to fire, resists necrotic and poison. It lasts until 0 HP, your next long rest ends, or you summon another. Uses equal your proficiency bonus per long rest.", { action: "reaction", uses: "prof", recharge: "long" }],
    [10, "Foul Conjuration", "Beasts, fey, and plants you summon or create with spells or class features (including your sapling) are immune to necrotic and poison damage and the poisoned condition. When one drops to 0 hit points it bursts: creatures within 5 feet make a Constitution save against your spell save DC or take necrotic damage (CR 1/4 or lower 1d4; CR 1/2 1d6; CR 1+ that many d8; no CR: d6s equal to your proficiency bonus). You can detonate one as an action.", { action: "passive" }],
    [14, "Incarnation of Corruption", "You resist necrotic damage and gain +2 AC. When you start your turn inside your Defile Ground, you can use a bonus action to gain temporary hit points equal to your proficiency bonus.", { action: "passive" }]
  ]},

  // ───────────────────────────── FIGHTER (archetype at 3rd; features at 3/7/10/15/18) ─────────────────────────────
  champion: { source: "PHB", features: [
    [3, "Improved Critical", "Your weapon attacks score a critical hit on a 19 or 20.", { action: "passive" }],
    [7, "Remarkable Athlete", "Add half your proficiency bonus (rounded up) to Strength, Dexterity, and Constitution checks that don't already include your proficiency bonus (initiative included). Your running long jump goes extra feet equal to your Strength modifier.", { action: "passive" }],
    [10, "Additional Fighting Style", "Choose a second Fighting Style option.", { action: "passive" }],
    [15, "Superior Critical", "Your weapon attacks score a critical hit on an 18, 19, or 20.", { action: "passive" }],
    [18, "Survivor", "At the start of each of your turns, if you are at or below half your hit points but above 0, regain 5 + your Constitution modifier hit points.", { action: "passive" }]
  ]},
  "battle-master": { source: "PHB", features: [
    [3, "Combat Superiority", "You know 3 maneuvers and have 4 superiority dice (d8), all regained on a short or long rest. One maneuver per attack. Maneuver save DC = 8 + proficiency bonus + Strength or Dexterity modifier (your choice). Maneuvers known: 3 at 3rd, 5 at 7th, 7 at 10th, 9 at 15th; when you learn new ones you may swap one you know.", { action: "special", uses: "4 (5 at 7th, 6 at 15th)", recharge: "short", options: [
      ["Commander's Strike", "Give up one of your Attack-action attacks and use a bonus action: an ally who can see or hear you uses its reaction to make one weapon attack, adding the die to damage."],
      ["Disarming Attack", "On a hit, add the die to damage; the target makes a Strength save or drops one held item of your choice at its feet."],
      ["Distracting Strike", "On a hit, add the die to damage; the next attack against the target by someone other than you before your next turn has advantage."],
      ["Evasive Footwork", "When you move, roll the die and add it to your AC until you stop moving."],
      ["Feinting Attack", "Bonus action: pick a creature within 5 feet; your next attack against it this turn has advantage and adds the die to damage on a hit."],
      ["Goading Attack", "On a hit, add the die to damage; the target makes a Wisdom save or has disadvantage on attacks against anyone but you until the end of your next turn."],
      ["Lunging Attack", "On a melee weapon attack on your turn, reach increases by 5 feet for that attack; on a hit add the die to damage."],
      ["Maneuvering Attack", "On a hit, add the die to damage; an ally who can see or hear you may spend its reaction to move up to half its speed, and the target can't make opportunity attacks against that movement."],
      ["Menacing Attack", "On a hit, add the die to damage; the target makes a Wisdom save or is frightened of you until the end of your next turn."],
      ["Parry", "Reaction when a melee attack damages you: reduce the damage by the die roll + your Dexterity modifier."],
      ["Precision Attack", "Add the die to a weapon attack roll, before or after rolling but before the result is applied."],
      ["Pushing Attack", "On a hit, add the die to damage; a Large or smaller target makes a Strength save or is pushed up to 15 feet away."],
      ["Rally", "Bonus action: an ally who can see or hear you gains temporary HP equal to the die roll + your Charisma modifier."],
      ["Riposte", "Reaction when a creature misses you with a melee attack: make one melee weapon attack against it, adding the die to damage on a hit."],
      ["Sweeping Attack", "On a melee hit, another creature within 5 feet of the target and within your reach takes damage equal to the die roll if the original attack roll would hit it (same damage type)."],
      ["Trip Attack", "On a hit, add the die to damage; a Large or smaller target makes a Strength save or is knocked prone."],
      ["Ambush (TCE-optional)", "Add the die to a Dexterity (Stealth) check or initiative roll, if you aren't incapacitated."],
      ["Bait and Switch (TCE-optional)", "On your turn, spend at least 5 feet of movement to swap places with a willing creature within 5 feet (no opportunity attacks); you or it adds the die to AC until the start of your next turn."],
      ["Brace (TCE-optional)", "Reaction when a creature you can see moves into your melee weapon's reach: attack it, adding the die to damage on a hit."],
      ["Commanding Presence (TCE-optional)", "Add the die to a Charisma (Intimidation, Performance, or Persuasion) check."],
      ["Grappling Strike (TCE-optional)", "Right after a melee hit on your turn, try to grapple the target as a bonus action, adding the die to your Strength (Athletics) check."],
      ["Quick Toss (TCE-optional)", "Bonus action: make a ranged attack with a thrown weapon (drawing it as part of the attack), adding the die to damage on a hit."],
      ["Tactical Assessment (TCE-optional)", "Add the die to an Intelligence (Investigation), Intelligence (History), or Wisdom (Insight) check."]
    ] }],
    [3, "Student of War", "Gain proficiency with one type of artisan's tools of your choice.", { action: "passive" }],
    [7, "Know Your Enemy", "After 1 minute observing or interacting with a creature outside combat, learn whether it is your equal, superior, or inferior in two of: Strength, Dexterity, Constitution, AC, current HP, total class levels, fighter levels.", { action: "special" }],
    [7, "Combat Superiority (5 dice)", "Gain a fifth superiority die and learn two more maneuvers (5 known).", { action: "passive" }],
    [10, "Improved Combat Superiority (d10)", "Superiority dice become d10s, and you learn two more maneuvers (7 known).", { action: "passive" }],
    [15, "Relentless", "When you roll initiative with no superiority dice left, you regain one.", { action: "passive" }],
    [15, "Combat Superiority (6 dice)", "Gain a sixth superiority die and learn two more maneuvers (9 known).", { action: "passive" }],
    [18, "Improved Combat Superiority (d12)", "Superiority dice become d12s.", { action: "passive" }]
  ]},
  "eldritch-knight": { source: "PHB", features: [
    [3, "Spellcasting", "Third-caster Intelligence casting from the wizard list. Cantrips: 2 (3 at 10th). Spells known: 3 at 3rd, rising to 13 at 20th; all must be abjuration or evocation except the spells learned at 3rd (one of the first three), 8th, 14th, and 20th, which can be any school. Slots: 1st-level slots from 3rd, 2nd from 7th, 3rd from 13th, 4th from 19th. Spell save DC = 8 + proficiency bonus + Intelligence modifier. On level-up you may replace one known spell under the same school rule.", { action: "passive" }],
    [3, "Weapon Bond", "A 1-hour ritual (can be done in a short rest) bonds a weapon to you: you can't be disarmed of it unless incapacitated, and you can summon it to your hand as a bonus action if it's on the same plane. Up to two bonded weapons; bonding a third breaks one.", { action: "bonus" }],
    [7, "War Magic", "After you spend your action casting a cantrip, you may attack once with a weapon as a bonus action.", { action: "bonus" }],
    [10, "Eldritch Strike", "A creature you hit with a weapon attack has disadvantage on its next save against a spell you cast before the end of your next turn.", { action: "passive" }],
    [15, "Arcane Charge", "When you use Action Surge, you can teleport up to 30 feet to an unoccupied space you can see, before or after the extra action.", { action: "free" }],
    [18, "Improved War Magic", "When you use your action to cast any spell, you can make one weapon attack as a bonus action.", { action: "bonus" }]
  ]},
  "arcane-archer": { source: "XGE", features: [
    [3, "Arcane Archer Lore", "Gain proficiency in Arcana or Nature, and learn prestidigitation or druidcraft.", { action: "passive" }],
    [3, "Arcane Shot", "Learn 2 Arcane Shot options (one more at 7th, 10th, 15th, and 18th: 6 total). Once per turn, when you fire an arrow from a shortbow or longbow as part of the Attack action, apply one option (decided on hit unless no attack roll is involved). 2 uses per short or long rest. Save DC = 8 + proficiency bonus + Intelligence modifier. Options improve at 18th level.", { action: "special", uses: 2, recharge: "short", options: [
      ["Banishing Arrow", "Target makes a Charisma save or is banished until the end of its next turn (speed 0, incapacitated), then returns. 18th: also 2d6 force on hit."],
      ["Beguiling Arrow", "Extra 2d6 psychic (4d6 at 18th); target makes a Wisdom save or is charmed by an ally of yours within 30 feet until the start of your next turn (ends if that ally harms it)."],
      ["Bursting Arrow", "After the hit, the target and every other creature within 10 feet take 2d6 force (4d6 at 18th)."],
      ["Enfeebling Arrow", "Extra 2d6 necrotic (4d6 at 18th); target makes a Constitution save or deals half damage with weapon attacks until the start of your next turn."],
      ["Grasping Arrow", "Extra 2d6 poison; speed -10 feet and 2d6 slashing the first time each turn it moves without teleporting, for 1 minute (Strength (Athletics) vs your DC as an action removes it). Both 4d6 at 18th."],
      ["Piercing Arrow", "No attack roll: a 1-foot-wide, 30-foot line ignoring cover; each creature makes a Dexterity save, taking arrow damage + 1d6 piercing on a fail (2d6 at 18th), half on a success."],
      ["Seeking Arrow", "No attack roll: pick a creature seen in the past minute within range; the arrow curves to it (ignores half and three-quarters cover). Dexterity save: arrow damage + 1d6 force (2d6 at 18th) and you learn its location; half on a success."],
      ["Shadow Arrow", "Extra 2d6 psychic (4d6 at 18th); target makes a Wisdom save or can't see beyond 5 feet until the start of your next turn."]
    ] }],
    [7, "Magic Arrow", "Nonmagical arrows you fire from a shortbow or longbow count as magical for overcoming resistance and immunity.", { action: "passive" }],
    [7, "Curving Shot", "When you miss with a magic arrow, use a bonus action to reroll the attack against a different target within 60 feet of the first.", { action: "bonus" }],
    [7, "Arcane Shot Option", "Learn a third Arcane Shot option.", { action: "passive" }],
    [10, "Arcane Shot Option", "Learn a fourth Arcane Shot option.", { action: "passive" }],
    [15, "Ever-Ready Shot", "When you roll initiative with no Arcane Shot uses left, you regain one.", { action: "passive" }],
    [15, "Arcane Shot Option", "Learn a fifth Arcane Shot option.", { action: "passive" }],
    [18, "Arcane Shot Option", "Learn a sixth Arcane Shot option, and every option's damage improves.", { action: "passive" }]
  ]},
  cavalier: { source: "XGE", features: [
    [3, "Bonus Proficiency", "Gain proficiency in Animal Handling, History, Insight, Performance, or Persuasion, or learn one language.", { action: "passive" }],
    [3, "Born to the Saddle", "Advantage on saves to avoid falling off your mount; if you fall no more than 10 feet and aren't incapacitated, you land on your feet. Mounting or dismounting costs only 5 feet of movement.", { action: "passive" }],
    [3, "Unwavering Mark", "When you hit a creature with a melee weapon attack, mark it until the end of your next turn. While within 5 feet of you it has disadvantage on attacks that don't target you. If it damages someone other than you, on your next turn you can make a bonus-action melee weapon attack against it with advantage, adding half your fighter level to damage on a hit; this special attack has uses equal to your Strength modifier (minimum 1) per long rest.", { action: "bonus", uses: "str", recharge: "long" }],
    [7, "Warding Maneuver", "When you or a creature you can see within 5 feet is hit by an attack, while you wield a melee weapon or shield, your reaction adds 1d8 to the target's AC against it; if it still hits, the target resists its damage. Uses equal your Constitution modifier (minimum 1) per long rest.", { action: "reaction", uses: "con", recharge: "long" }],
    [10, "Hold the Line", "Creatures provoke opportunity attacks from you when they move 5 feet or more within your reach, and a creature you hit with one has its speed reduced to 0 until the end of the turn.", { action: "passive" }],
    [15, "Ferocious Charger", "Once per turn, if you move at least 10 feet straight toward a creature and then hit it, it makes a Strength save (DC 8 + proficiency bonus + Strength modifier) or is knocked prone.", { action: "passive" }],
    [18, "Vigilant Defender", "You get a special reaction once on every other creature's turn, usable only for opportunity attacks and not on a turn when you take your normal reaction.", { action: "reaction" }]
  ]},
  samurai: { source: "XGE", features: [
    [3, "Bonus Proficiency", "Gain proficiency in History, Insight, Performance, or Persuasion, or learn one language.", { action: "passive" }],
    [3, "Fighting Spirit", "As a bonus action, gain advantage on weapon attack rolls until the end of the turn and 5 temporary hit points (10 at 10th, 15 at 15th). 3 uses per long rest.", { action: "bonus", uses: 3, recharge: "long" }],
    [7, "Elegant Courtier", "Add your Wisdom modifier to Charisma (Persuasion) checks. Gain proficiency in Wisdom saves (or Intelligence or Charisma saves if you already have it).", { action: "passive" }],
    [10, "Tireless Spirit", "When you roll initiative with no Fighting Spirit uses left, you regain one.", { action: "passive" }],
    [15, "Rapid Strike", "Once per turn, when you take the Attack action and have advantage on an attack against a target, give up the advantage on that roll to make one extra weapon attack against that target.", { action: "passive" }],
    [18, "Strength Before Death", "When damage drops you to 0 hit points, your reaction delays unconsciousness and you take an extra turn immediately; damage during it causes death save failures as normal, and you fall unconscious afterward if still at 0. Once per long rest.", { action: "reaction", uses: 1, recharge: "long" }]
  ]},
  "psi-warrior": { source: "TCE", features: [
    [3, "Psionic Power", "You have Psionic Energy dice equal to twice your proficiency bonus (d6; d8 at 5th, d10 at 11th, d12 at 17th), all regained on a long rest; once per short or long rest you can regain one as a bonus action. Protective Field: reaction when you or a creature within 30 feet takes damage, spend a die to reduce it by the roll + Intelligence modifier (minimum 1). Psionic Strike: once per turn after a weapon hit on a target within 30 feet, spend a die for roll + Intelligence modifier force damage. Telekinetic Movement: as an action, move a Large or smaller loose object or a willing creature (not you) within 30 feet up to 30 feet, or a Tiny object to or from your hand; once per short or long rest free, then a die per extra use.", { action: "special", uses: "2prof", recharge: "long" }],
    [7, "Telekinetic Adept", "Psi-Powered Leap: as a bonus action, gain a flying speed of twice your walking speed until the end of the turn (once per short or long rest free, then spend a die). Telekinetic Thrust: when Psionic Strike deals damage, the target makes a Strength save (DC 8 + proficiency bonus + Intelligence modifier) or is knocked prone or moved up to 10 feet horizontally.", { action: "bonus" }],
    [10, "Guarded Mind", "You resist psychic damage. If you start your turn charmed or frightened, spend a die to end every such effect on you.", { action: "passive" }],
    [15, "Bulwark of Force", "As a bonus action, give up to your Intelligence modifier (minimum 1) creatures you can see within 30 feet, you included, half cover for 1 minute or until you're incapacitated. Once per long rest free, then spend a die.", { action: "bonus", uses: 1, recharge: "long" }],
    [18, "Telekinetic Master", "Cast telekinesis with no components (Intelligence); each turn you concentrate on it you can make one weapon attack as a bonus action. Once per long rest free, then spend a die.", { action: "action", uses: 1, recharge: "long" }]
  ]},
  "rune-knight": { source: "TCE", features: [
    [3, "Bonus Proficiencies", "Gain proficiency with smith's tools and learn to speak, read, and write Giant.", { action: "passive" }],
    [3, "Rune Carver", "Learn 2 runes (3 at 7th, 4 at 10th, 5 at 15th); on each level-up you may swap one. After a long rest, inscribe each known rune on a different weapon, armor, shield, jewelry, or other worn or held object. Each rune has a passive benefit and can be invoked once per short or long rest. Rune save DC = 8 + proficiency bonus + Constitution modifier.", { action: "special", options: [
      ["Cloud Rune", "Advantage on Sleight of Hand and Deception checks. Invoke (reaction): when you or a creature within 30 feet is hit, redirect the attack to another creature within 30 feet (not the attacker), using the same roll."],
      ["Fire Rune", "Double proficiency bonus on checks using tool proficiency. Invoke (on a weapon hit): extra 2d6 fire and a Strength save or restrained for 1 minute, taking 2d6 fire at the start of each of its turns (save repeats each turn end)."],
      ["Frost Rune", "Advantage on Animal Handling and Intimidation checks. Invoke (bonus action): +2 to Strength and Constitution checks and saves for 10 minutes."],
      ["Stone Rune", "Advantage on Insight checks and darkvision 120 feet. Invoke (reaction): a creature ending its turn within 30 feet makes a Wisdom save or is charmed for 1 minute, with speed 0 and incapacitated (save repeats each turn end)."],
      ["Hill Rune (7th level)", "Advantage on saves against being poisoned and resistance to poison. Invoke (bonus action): resistance to bludgeoning, piercing, and slashing for 1 minute."],
      ["Storm Rune (7th level)", "Advantage on Arcana checks and can't be surprised while not incapacitated. Invoke (bonus action): for 1 minute, your reaction gives advantage or disadvantage to an attack, save, or check by you or a creature within 60 feet."]
    ] }],
    [3, "Giant's Might", "As a bonus action, for 1 minute: become Large if you're smaller and there's room, gain advantage on Strength checks and saves, and once per turn add 1d6 to one weapon or unarmed hit. Uses equal your proficiency bonus per long rest.", { action: "bonus", uses: "prof", recharge: "long" }],
    [7, "Runic Shield", "When another creature you can see within 60 feet is hit by an attack roll, your reaction forces the attacker to reroll the d20 and use the new roll. Uses equal your proficiency bonus per long rest.", { action: "reaction", uses: "prof", recharge: "long" }],
    [7, "Rune Carver (3 runes)", "Learn a third rune; Hill and Storm runes become available.", { action: "passive" }],
    [10, "Great Stature", "Roll 3d4 and grow that many inches. Giant's Might extra damage becomes 1d8.", { action: "passive" }],
    [10, "Rune Carver (4 runes)", "Learn a fourth rune.", { action: "passive" }],
    [15, "Master of Runes", "Each rune can be invoked twice per short or long rest.", { action: "passive" }],
    [15, "Rune Carver (5 runes)", "Learn a fifth rune.", { action: "passive" }],
    [18, "Runic Juggernaut", "Giant's Might extra damage becomes 1d10, and you can grow to Huge instead, gaining 5 feet of reach while Huge.", { action: "passive" }]
  ]},
  "purple-dragon-knight": { source: "SCAG", features: [ // also published as "Banneret"
    [3, "Rallying Cry", "When you use Second Wind, up to three allies within 60 feet who can see or hear you each regain hit points equal to your fighter level.", { action: "bonus" }],
    [7, "Royal Envoy", "Gain proficiency in Persuasion (or, if you have it, in Animal Handling, Insight, Intimidation, or Performance). Your proficiency bonus is doubled for Persuasion checks.", { action: "passive" }],
    [10, "Inspiring Surge", "When you use Action Surge, one ally within 60 feet who can see or hear you can make one melee or ranged weapon attack with its reaction.", { action: "free" }],
    [15, "Bulwark", "When you use Indomitable to reroll an Intelligence, Wisdom, or Charisma save (and aren't incapacitated), one ally within 60 feet that failed a save against the same effect and can see or hear you also rerolls and must use the new roll.", { action: "free" }],
    [18, "Inspiring Surge (two allies)", "Inspiring Surge lets two allies within 60 feet attack instead of one.", { action: "passive" }]
  ]},
  "echo-knight": { source: "EGtW", features: [
    [3, "Manifest Echo", "As a bonus action, create a gray echo of yourself within 15 feet: AC 14 + proficiency bonus, 1 HP, immune to all conditions, uses your save bonuses, same size, occupies its space. Move it up to 30 feet on your turn (no action); it is destroyed if more than 30 feet away at the end of your turn. Bonus action: swap places with it for 15 feet of movement. Attack-action attacks can come from its space, and you can make opportunity attacks from its position. It lasts until destroyed, dismissed (bonus action), replaced, or you're incapacitated.", { action: "bonus" }],
    [3, "Unleash Incarnation", "When you take the Attack action, make one extra melee attack from the echo's position. Uses equal your Constitution modifier (minimum 1) per long rest.", { action: "free", uses: "con", recharge: "long" }],
    [7, "Echo Avatar", "As an action, see and hear through your echo for up to 10 minutes (you are blinded and deafened meanwhile); it can be up to 1,000 feet away without being destroyed. End it at any time.", { action: "action" }],
    [10, "Shadow Martyr", "Before an attack roll against a creature you can see, your reaction teleports the echo within 5 feet of that creature and the attack targets the echo instead. Once per short or long rest.", { action: "reaction", uses: 1, recharge: "short" }],
    [15, "Reclaim Potential", "When your echo is destroyed by damage and you have no temporary hit points, gain 2d6 + Constitution modifier temporary hit points. Uses equal your Constitution modifier (minimum 1) per long rest.", { action: "free", uses: "con", recharge: "long" }],
    [18, "Legion of One", "Manifest Echo can create two echoes that coexist (a third destroys both); anything you can do from one echo you can do from the other. When you roll initiative with no Unleash Incarnation uses left, regain one.", { action: "bonus" }]
  ]},

  // ───────────────────────────── MONK (tradition at 3rd; features at 3/6/11/17) ─────────────────────────────
  "open-hand": { source: "PHB", features: [
    [3, "Open Hand Technique", "When you hit with a Flurry of Blows attack, impose one: a Dexterity save or knocked prone; a Strength save or pushed up to 15 feet away; or no reactions until the end of your next turn (no save). Saves use your ki save DC.", { action: "passive" }],
    [6, "Wholeness of Body", "As an action, regain hit points equal to three times your monk level. Once per long rest.", { action: "action", uses: 1, recharge: "long" }],
    [11, "Tranquility", "At the end of a long rest you gain the effect of sanctuary until the start of your next long rest (it can end early normally); its save DC is 8 + Wisdom modifier + proficiency bonus.", { action: "passive" }],
    [17, "Quivering Palm", "When you hit with an unarmed strike, spend 3 ki to plant lethal vibrations lasting a number of days equal to your monk level. As an action (same plane), trigger them: the target makes a Constitution save, dropping to 0 hit points on a failure or taking 10d10 necrotic on a success. Only one target at a time; you can end them harmlessly without an action.", { action: "action" }]
  ]},
  shadow: { source: "PHB", features: [
    [3, "Shadow Arts", "As an action, spend 2 ki to cast darkness, darkvision, pass without trace, or silence without material components. You also learn minor illusion if you don't know it.", { action: "action" }],
    [6, "Shadow Step", "While in dim light or darkness, as a bonus action teleport up to 60 feet to an unoccupied space you can see that is also dim or dark; you then have advantage on your first melee attack before the end of the turn.", { action: "bonus" }],
    [11, "Cloak of Shadows", "While in dim light or darkness, use your action to turn invisible until you attack, cast a spell, or enter bright light.", { action: "action" }],
    [17, "Opportunist", "When a creature within 5 feet of you is hit by an attack from someone else, your reaction lets you make a melee attack against it.", { action: "reaction" }]
  ]},
  "four-elements": { source: "PHB", features: [
    [3, "Disciple of the Elements", "You know Elemental Attunement plus one other discipline; learn one more at 6th, 11th, and 17th (whenever you learn one you may swap one). Discipline spells need no material components. From 5th level you can spend extra ki to raise a discipline spell's level (+1 per ki) up to a total ki cost of 3 (5th-8th), 4 (9th-12th), 5 (13th-16th), or 6 (17th-20th). Saves use your ki save DC.", { action: "special", options: [
      ["Elemental Attunement", "Action: within 30 feet, make a harmless elemental sensory effect, light or snuff a candle, torch, or small campfire, chill or warm up to 1 pound of nonliving material for up to 1 hour, or shape a 1-foot cube of earth, fire, water, or mist into a crude form for 1 minute."],
      ["Fangs of the Fire Snake", "1 ki when you take the Attack action: unarmed strike reach +10 feet and fire damage for the turn; spend 1 more ki on a hit for an extra 1d10 fire."],
      ["Fist of Four Thunders", "2 ki: cast thunderwave."],
      ["Fist of Unbroken Air", "Action, 2 ki: a creature within 30 feet makes a Strength save or takes 3d10 bludgeoning (+1d10 per extra ki) and is pushed up to 20 feet and knocked prone; half damage and no push on a success."],
      ["Rush of the Gale Spirits", "2 ki: cast gust of wind."],
      ["Shape the Flowing River", "Action, 1 ki: within 120 feet, turn water to ice or back and reshape ice in an area up to 30 feet on a side, changing it by no more than half its largest dimension; can't trap or harm creatures."],
      ["Sweeping Cinder Strike", "2 ki: cast burning hands."],
      ["Water Whip", "Action, 2 ki: a creature you can see within 30 feet makes a Dexterity save or takes 3d10 bludgeoning (+1d10 per extra ki) and is knocked prone or pulled up to 25 feet closer; half damage and no other effect on a success. (Original printing said bonus action; errata made it an action.)"],
      ["Clench of the North Wind (6th)", "3 ki: cast hold person."],
      ["Gong of the Summit (6th)", "3 ki: cast shatter."],
      ["Flames of the Phoenix (11th)", "4 ki: cast fireball."],
      ["Mist Stance (11th)", "4 ki: cast gaseous form on yourself."],
      ["Ride the Wind (11th)", "4 ki: cast fly on yourself."],
      ["Breath of Winter (17th)", "6 ki: cast cone of cold."],
      ["Eternal Mountain Defense (17th)", "5 ki: cast stoneskin on yourself."],
      ["River of Hungry Flame (17th)", "5 ki: cast wall of fire."],
      ["Wave of Rolling Earth (17th)", "6 ki: cast wall of stone."]
    ] }],
    [6, "Extra Elemental Discipline", "Learn one more elemental discipline (3 known including Elemental Attunement).", { action: "passive" }],
    [11, "Extra Elemental Discipline", "Learn one more elemental discipline (4 known).", { action: "passive" }],
    [17, "Extra Elemental Discipline", "Learn one more elemental discipline (5 known).", { action: "passive" }]
  ]},
  "drunken-master": { source: "XGE", features: [
    [3, "Bonus Proficiencies", "Gain proficiency in Performance and with brewer's supplies (if you don't already have them).", { action: "passive" }],
    [3, "Drunken Technique", "Whenever you use Flurry of Blows, you also get the Disengage action and +10 feet walking speed until the end of the turn.", { action: "passive" }],
    [6, "Tipsy Sway", "Standing up from prone costs only 5 feet of movement. When a creature misses you with a melee attack, spend 1 ki as a reaction to make that attack hit another creature of your choice you can see within 5 feet of you (not the attacker).", { action: "reaction" }],
    [11, "Drunkard's Luck", "When you have disadvantage on an ability check, attack roll, or save, spend 2 ki to cancel the disadvantage for that roll.", { action: "free" }],
    [17, "Intoxicated Frenzy", "Flurry of Blows can make up to three extra attacks (five total), as long as each Flurry attack targets a different creature this turn.", { action: "passive" }]
  ]},
  kensei: { source: "XGE", features: [
    [3, "Path of the Kensei", "Choose one melee and one ranged kensei weapon type (simple or martial without heavy or special; longbow allowed); you are proficient and they count as monk weapons. Agile Parry: if you make an unarmed strike in the Attack action while holding a melee kensei weapon, +2 AC until the start of your next turn. Kensei's Shot: bonus action, ranged kensei weapon hits deal an extra 1d4 this turn. Way of the Brush: proficiency with calligrapher's or painter's supplies.", { action: "special" }],
    [6, "One with the Blade", "Kensei weapon attacks count as magical. Deft Strike: once per turn on a kensei weapon hit, spend 1 ki to add your Martial Arts die to damage. Choose an additional kensei weapon type.", { action: "passive" }],
    [11, "Sharpen the Blade", "As a bonus action, spend up to 3 ki to give a kensei weapon you touch a bonus to attack and damage equal to the ki spent for 1 minute (no effect on a magic weapon that already has such a bonus). Choose an additional kensei weapon type.", { action: "bonus" }],
    [17, "Unerring Accuracy", "Once per turn, when you miss with a monk weapon attack on your turn, reroll it. Choose an additional kensei weapon type.", { action: "passive" }]
  ]},
  "sun-soul": { source: "XGE", features: [ // originally SCAG; XGE version
    [3, "Radiant Sun Bolt", "A ranged spell attack option for the Attack action: 30 feet, proficient, Dexterity to attack and damage, radiant damage using your Martial Arts die. After using it in the Attack action, spend 1 ki to make it twice as a bonus action. With Extra Attack, any of your attacks can be sun bolts.", { action: "action" }],
    [6, "Searing Arc Strike", "Right after taking the Attack action, spend 2 ki to cast burning hands as a bonus action; each extra ki raises its level by 1, up to a total ki cost of half your monk level.", { action: "bonus" }],
    [11, "Searing Sunburst", "As an action, a 20-foot-radius sphere erupts at a point within 150 feet: Constitution save or 2d6 radiant (opaque total cover protects). Spend up to 3 ki for +2d6 each.", { action: "action" }],
    [17, "Sun Shield", "You shed bright light 30 feet and dim light 30 more (toggle as a bonus action). While lit, when a melee attack hits you, your reaction deals 5 + Wisdom modifier radiant to the attacker.", { action: "reaction" }]
  ]},
  mercy: { source: "TCE", features: [
    [3, "Implements of Mercy", "Gain proficiency in Insight, Medicine, and the herbalism kit, plus a special mask.", { action: "passive" }],
    [3, "Hand of Healing", "As an action, spend 1 ki to heal a creature you touch for your Martial Arts die + Wisdom modifier. When you use Flurry of Blows, you can replace one of its strikes with this, without spending ki for the healing.", { action: "action" }],
    [3, "Hand of Harm", "Once per turn when you hit with an unarmed strike, spend 1 ki for extra necrotic damage equal to your Martial Arts die + Wisdom modifier.", { action: "free" }],
    [6, "Physician's Touch", "Hand of Healing can also end one disease or the blinded, deafened, paralyzed, poisoned, or stunned condition. Hand of Harm can also poison the target until the end of your next turn.", { action: "passive" }],
    [11, "Flurry of Healing and Harm", "Each Flurry of Blows strike can be replaced with a free Hand of Healing, and one Flurry strike can apply Hand of Harm without its ki cost (still once per turn).", { action: "passive" }],
    [17, "Hand of Ultimate Mercy", "As an action, spend 5 ki and touch the corpse of a creature dead no more than 24 hours: it returns to life with 4d10 + your Wisdom modifier hit points, free of blinded, deafened, paralyzed, poisoned, and stunned. Once per long rest.", { action: "action", uses: 1, recharge: "long" }]
  ]},
  "astral-self": { source: "TCE", features: [
    [3, "Arms of the Astral Self", "As a bonus action, spend 1 ki to summon spectral arms for 10 minutes; creatures of your choice within 10 feet make a Dexterity save or take force damage equal to two rolls of your Martial Arts die. While present: use Wisdom for Strength checks and saves; make unarmed strikes with the arms with +5 feet reach, using Wisdom for attack and damage, dealing force damage.", { action: "bonus" }],
    [6, "Visage of the Astral Self", "As a bonus action (or with the arms), spend 1 ki for a spectral visage for 10 minutes: see normally in magical and nonmagical darkness to 120 feet; advantage on Insight and Intimidation checks; speak so only one creature within 60 feet hears you, or be heard up to 600 feet away.", { action: "bonus" }],
    [11, "Body of the Astral Self", "With both arms and visage active, the body appears (no action). Deflect Energy: reaction to reduce acid, cold, fire, force, lightning, or thunder damage by 1d10 + Wisdom modifier (minimum 1). Empowered Arms: once per turn, an astral-arm hit deals extra damage equal to your Martial Arts die.", { action: "reaction" }],
    [17, "Awakened Astral Self", "As a bonus action, spend 5 ki to summon arms, visage, and body and awaken them for 10 minutes: +2 AC, and Extra Attack makes three attacks instead of two if all use the astral arms.", { action: "bonus" }]
  ]},
  "ascendant-dragon": { source: "FTD", features: [
    [3, "Draconic Disciple", "Unarmed strike damage can become acid, cold, fire, lightning, or poison. If you fail an Intimidation or Persuasion check, your reaction rerolls it; once it turns a failure into a success, not again until a long rest. Learn Draconic or another language.", { action: "reaction", uses: 1, recharge: "long" }],
    [3, "Breath of the Dragon", "Replace one Attack-action attack with a 20-foot cone or 30-by-5-foot line of acid, cold, fire, lightning, or poison: Dexterity save (ki DC), two Martial Arts dice of damage on a failure (three at 11th), half on a success. Uses equal your proficiency bonus per long rest; with none left, spend 2 ki to use it.", { action: "special", uses: "prof", recharge: "long" }],
    [6, "Wings Unfurled", "When you use Step of the Wind, gain a flying speed equal to your walking speed until the end of the turn. Uses equal your proficiency bonus per long rest.", { action: "free", uses: "prof", recharge: "long" }],
    [11, "Aspect of the Wyrm", "As a bonus action, project a 10-foot aura for 1 minute: Frightful Presence (on activation and as a bonus action later, one creature in the aura makes a Wisdom save vs ki DC or is frightened 1 minute, repeating at each turn end) or Resistance (you and allies in it resist acid, cold, fire, lightning, or poison). Once per long rest, or spend 3 ki to use again. Breath of the Dragon now deals three Martial Arts dice.", { action: "bonus", uses: 1, recharge: "long" }],
    [17, "Ascendant Aspect", "Augment Breath: spend 1 ki to make Breath of the Dragon a 60-foot cone or 90-by-5-foot line dealing four Martial Arts dice. Blindsight 10 feet. Explosive Fury: when you activate Aspect of the Wyrm, chosen creatures in the aura make a Dexterity save or take 3d10 acid, cold, fire, lightning, or poison.", { action: "passive" }]
  ]},
  "long-death": { source: "SCAG", features: [
    [3, "Touch of Death", "When you reduce a creature within 5 feet to 0 hit points, gain temporary hit points equal to Wisdom modifier + monk level (minimum 1).", { action: "passive" }],
    [6, "Hour of Reaping", "As an action, each creature within 30 feet that can see you makes a Wisdom save or is frightened of you until the end of your next turn.", { action: "action" }],
    [11, "Mastery of Death", "When reduced to 0 hit points, spend 1 ki (no action) to drop to 1 hit point instead.", { action: "free" }],
    [17, "Touch of the Long Death", "As an action, touch a creature within 5 feet and spend 1-10 ki: it makes a Constitution save, taking 2d10 necrotic per ki on a failure or half on a success.", { action: "action" }]
  ]},
  "cobalt-soul": { source: "TDCSR", features: [
    [3, "Extract Aspects", "When you hit with a Flurry of Blows attack, you analyze the target: you learn its damage vulnerabilities, resistances, and immunities and its condition immunities. Until you finish a short or long rest, when an analyzed creature misses you with an attack, your reaction makes an unarmed strike against it if it's in reach.", { action: "reaction" }],
    [6, "Extort Truth", "When you hit with an unarmed strike (you may choose to deal no damage), spend 1 ki: the target makes a Charisma save or for up to 10 minutes can't knowingly lie and Charisma checks targeting it have advantage. You know whether it saved; it knows it is affected and can stay evasive.", { action: "free" }],
    [6, "Mystical Erudition", "Learn one language and gain proficiency in Arcana, History, Investigation, Nature, or Religion (or double your proficiency bonus for one of those you already have). Another language and skill at 11th and 17th level.", { action: "passive" }],
    [11, "Mind of Mercury", "Once per turn, if you've already used your reaction, spend 1 ki to take one more reaction (only one reaction per trigger). Mystical Erudition: second language and skill.", { action: "reaction" }],
    [17, "Debilitating Barrage", "When you hit with an unarmed strike, spend 3 ki: the target becomes vulnerable to a damage type you choose for 1 minute or until the end of a turn in which it takes that type (resistance is suppressed instead; immunity is unaffected). A creature can't be affected again for 24 hours. Mystical Erudition: third language and skill.", { action: "free" }]
  ]},

  // ───────────────────────────── PALADIN (oath at 3rd; features at 3/7/15/20; auras 10 ft → 30 ft at 18th) ─────────────────────────────
  devotion: { source: "PHB", features: [
    [3, "Tenets of Devotion", "Honesty, Courage, Compassion, Honor, Duty.", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Sacred Weapon", "As an action, a held weapon adds your Charisma modifier (minimum +1) to attack rolls for 1 minute, sheds bright light 20 feet and dim 20 more, and counts as magical. Ends if you drop it or fall unconscious; you can end it as part of another action.", { action: "action" }],
    [3, "Channel Divinity: Turn the Unholy", "As an action, each fiend or undead within 30 feet that can see or hear you makes a Wisdom save or is turned for 1 minute or until damaged.", { action: "action" }],
    [7, "Aura of Devotion", "While you're conscious, you and friendly creatures within 10 feet can't be charmed (30 feet at 18th).", { action: "passive" }],
    [15, "Purity of Spirit", "You are permanently under the effects of protection from evil and good.", { action: "passive" }],
    [18, "Aura of Devotion (30 ft)", "Aura of Devotion's range becomes 30 feet.", { action: "passive" }],
    [20, "Holy Nimbus", "As an action, for 1 minute you shed bright light 30 feet (dim 30 more); enemies starting their turn in the bright light take 10 radiant, and you have advantage on saves against spells cast by fiends or undead. Once per long rest.", { action: "action", uses: 1, recharge: "long" }]
  ]},
  ancients: { source: "PHB", features: [
    [3, "Tenets of the Ancients", "Kindle the Light, Shelter the Light, Preserve Your Own Light, Be the Light.", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Nature's Wrath", "As an action, spectral vines grab a creature you can see within 10 feet: Strength or Dexterity save (its choice) or restrained; it repeats the save at the end of each of its turns.", { action: "action" }],
    [3, "Channel Divinity: Turn the Faithless", "As an action, each fey or fiend within 30 feet that can hear you makes a Wisdom save or is turned for 1 minute or until damaged; disguised true forms are revealed while turned.", { action: "action" }],
    [7, "Aura of Warding", "You and friendly creatures within 10 feet resist damage from spells (30 feet at 18th).", { action: "passive" }],
    [15, "Undying Sentinel", "When reduced to 0 hit points and not killed outright, drop to 1 hit point instead (once per long rest). You suffer no frailty of old age and can't be magically aged.", { action: "special", uses: 1, recharge: "long" }],
    [18, "Aura of Warding (30 ft)", "Aura of Warding's range becomes 30 feet.", { action: "passive" }],
    [20, "Elder Champion", "As an action, transform for 1 minute: regain 10 hit points at the start of each turn, cast 1-action paladin spells as a bonus action, and enemies within 10 feet have disadvantage on saves against your paladin spells and Channel Divinity. Once per long rest.", { action: "action", uses: 1, recharge: "long" }]
  ]},
  vengeance: { source: "PHB", features: [
    [3, "Tenets of Vengeance", "Fight the Greater Evil, No Mercy for the Wicked, By Any Means Necessary, Restitution.", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Abjure Enemy", "As an action, one creature you can see within 60 feet makes a Wisdom save (fiends and undead at disadvantage; immune if it can't be frightened). Fail: frightened for 1 minute or until damaged, speed 0. Success: speed halved for 1 minute or until damaged.", { action: "action" }],
    [3, "Channel Divinity: Vow of Enmity", "As a bonus action, gain advantage on attack rolls against a creature you can see within 10 feet for 1 minute or until it drops to 0 hit points or falls unconscious.", { action: "bonus" }],
    [7, "Relentless Avenger", "When you hit with an opportunity attack, move up to half your speed right after as part of the same reaction, without provoking.", { action: "reaction" }],
    [15, "Soul of Vengeance", "When the target of your Vow of Enmity makes an attack, your reaction lets you make a melee weapon attack against it if it's in range.", { action: "reaction" }],
    [20, "Avenging Angel", "As an action, transform for 1 hour: flying speed 60 feet and a 30-foot aura; an enemy entering or starting its turn there for the first time in a battle makes a Wisdom save or is frightened of you for 1 minute or until damaged, and attacks against it have advantage. Once per long rest.", { action: "action", uses: 1, recharge: "long" }]
  ]},
  oathbreaker: { source: "DMG", features: [
    [3, "Oathbreaker", "No tenets: this oath is taken by an evil paladin who broke a sacred oath (DM's permission).", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Control Undead", "As an action, an undead you can see within 30 feet makes a Wisdom save or obeys you for 24 hours or until you use this again. Undead of CR equal to or above your paladin level are immune.", { action: "action" }],
    [3, "Channel Divinity: Dreadful Aspect", "As an action, each creature of your choice within 30 feet that can see you makes a Wisdom save or is frightened of you for 1 minute; one ending its turn more than 30 feet away can save again.", { action: "action" }],
    [7, "Aura of Hate", "You and fiends and undead within 10 feet add your Charisma modifier (minimum +1) to melee weapon damage; a creature benefits from only one paladin's aura (30 feet at 18th).", { action: "passive" }],
    [15, "Supernatural Resistance", "You resist bludgeoning, piercing, and slashing damage from nonmagical weapons.", { action: "passive" }],
    [18, "Aura of Hate (30 ft)", "Aura of Hate's range becomes 30 feet.", { action: "passive" }],
    [20, "Dread Lord", "As an action, a 1-minute aura dims bright light within 30 feet; frightened enemies starting their turn there take 4d10 psychic; you and chosen creatures in it are shrouded (sight-reliant attackers have disadvantage); as a bonus action, make a melee spell attack with the shadows for 3d10 + Charisma modifier necrotic. Once per long rest.", { action: "action", uses: 1, recharge: "long" }]
  ]},
  conquest: { source: "XGE", features: [
    [3, "Tenets of Conquest", "Douse the Flame of Hope, Rule with an Iron Fist, Strength Above All.", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Conquering Presence", "As an action, each creature of your choice you can see within 30 feet makes a Wisdom save or is frightened of you for 1 minute, repeating the save at the end of each of its turns.", { action: "action" }],
    [3, "Channel Divinity: Guided Strike", "After seeing an attack roll but before knowing the result, add +10 to it.", { action: "free" }],
    [7, "Aura of Conquest", "While not incapacitated, a creature frightened of you within 10 feet (not through total cover) has speed 0 and takes psychic damage equal to half your paladin level when it starts its turn there (30 feet at 18th).", { action: "passive" }],
    [15, "Scornful Rebuke", "When a creature hits you with an attack, it takes psychic damage equal to your Charisma modifier (minimum 1), if you aren't incapacitated.", { action: "passive" }],
    [18, "Aura of Conquest (30 ft)", "Aura of Conquest's range becomes 30 feet.", { action: "passive" }],
    [20, "Invincible Conqueror", "As an action, for 1 minute: resistance to all damage, one extra attack when you take the Attack action, and melee weapon attacks crit on 19-20. Once per long rest.", { action: "action", uses: 1, recharge: "long" }]
  ]},
  redemption: { source: "XGE", features: [
    [3, "Tenets of Redemption", "Peace, Innocence, Patience, Wisdom.", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Emissary of Peace", "As a bonus action, gain +5 to Charisma (Persuasion) checks for 10 minutes.", { action: "bonus" }],
    [3, "Channel Divinity: Rebuke the Violent", "Right after an attacker within 30 feet damages a creature other than you, your reaction forces a Wisdom save: it takes radiant damage equal to the damage it dealt, or half on a success.", { action: "reaction" }],
    [7, "Aura of the Guardian", "When a creature within 10 feet takes damage, your reaction takes that damage instead (no other effects transfer; it can't be reduced) (30 feet at 18th).", { action: "reaction" }],
    [15, "Protective Spirit", "If you end your turn in combat below half your hit points and aren't incapacitated, regain 1d6 + half your paladin level hit points.", { action: "passive" }],
    [18, "Aura of the Guardian (30 ft)", "Aura of the Guardian's range becomes 30 feet.", { action: "passive" }],
    [20, "Emissary of Redemption", "You resist all damage dealt by other creatures, and a creature that hits you takes radiant damage equal to half the damage you took. Both stop working against a creature you attack, cast a spell on, or damage (other than with this) until you finish a long rest.", { action: "passive" }]
  ]},
  glory: { source: "MOoT", features: [ // reprinted in TCE
    [3, "Tenets of Glory", "Actions over Words, Challenges Are but Tests, Hone the Body, Discipline the Soul.", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Peerless Athlete", "As a bonus action, for 10 minutes: advantage on Athletics and Acrobatics checks, double carrying/push/drag/lift capacity, and long and high jumps +10 feet (still costs movement).", { action: "bonus" }],
    [3, "Channel Divinity: Inspiring Smite", "Right after dealing Divine Smite damage, as a bonus action split 2d8 + paladin level temporary hit points among creatures of your choice within 30 feet (you included).", { action: "bonus" }],
    [7, "Aura of Alacrity", "Your walking speed rises by 10 feet. While you aren't incapacitated, an ally starting its turn within 5 feet of you gets +10 feet walking speed until the end of that turn (10 feet range at 18th).", { action: "passive" }],
    [15, "Glorious Defense", "When you or a creature you can see within 10 feet is hit by an attack roll, your reaction adds your Charisma modifier (minimum +1) to the target's AC; if it then misses, you can make one weapon attack against the attacker if in range. Uses equal your Charisma modifier (minimum 1) per long rest.", { action: "reaction", uses: "cha", recharge: "long" }],
    [18, "Aura of Alacrity (10 ft)", "The ally range of Aura of Alacrity becomes 10 feet (an exception to the usual 30-foot growth).", { action: "passive" }],
    [20, "Living Legend", "As a bonus action, for 1 minute: advantage on Charisma checks, once per turn turn a missed weapon attack into a hit, and reroll a failed save with your reaction (must use the new roll). Once per long rest, or expend a 5th-level slot to use again.", { action: "bonus", uses: 1, recharge: "long" }]
  ]},
  watchers: { source: "TCE", features: [
    [3, "Tenets of the Watchers", "Vigilance, Loyalty, Discipline.", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Watcher's Will", "As an action, you and up to your Charisma modifier (minimum 1) creatures you can see within 30 feet have advantage on Intelligence, Wisdom, and Charisma saves for 1 minute.", { action: "action" }],
    [3, "Channel Divinity: Abjure the Extraplanar", "As an action, each aberration, celestial, elemental, fey, or fiend within 30 feet that can hear you makes a Wisdom save or is turned for 1 minute or until damaged.", { action: "action" }],
    [7, "Aura of the Sentinel", "While not incapacitated, you and creatures of your choice within 10 feet add your proficiency bonus to initiative rolls (30 feet at 18th).", { action: "passive" }],
    [15, "Vigilant Rebuke", "When you or a creature you can see within 30 feet succeeds on an Intelligence, Wisdom, or Charisma save, your reaction deals 2d8 + Charisma modifier force damage to the creature that forced it.", { action: "reaction" }],
    [18, "Aura of the Sentinel (30 ft)", "Aura of the Sentinel's range becomes 30 feet.", { action: "passive" }],
    [20, "Mortal Bulwark", "As a bonus action, for 1 minute: truesight 120 feet, advantage on attacks against aberrations, celestials, elementals, fey, and fiends, and when you hit and damage a creature it makes a Charisma save (spell DC) or is banished to its native plane if not there (success: immune for 24 hours). Once per long rest, or expend a 5th-level slot to use again.", { action: "bonus", uses: 1, recharge: "long" }]
  ]},
  crown: { source: "SCAG", features: [
    [3, "Tenets of the Crown", "Law, Loyalty, Courage, Responsibility.", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Champion Challenge", "As a bonus action, each creature of your choice you can see within 30 feet makes a Wisdom save or can't willingly move more than 30 feet from you; ends if you're incapacitated or die or it ends up more than 30 feet away.", { action: "bonus" }],
    [3, "Channel Divinity: Turn the Tide", "As a bonus action, each creature of your choice within 30 feet that can hear you and is at or below half its hit points regains 1d6 + Charisma modifier (minimum 1) hit points.", { action: "bonus" }],
    [7, "Divine Allegiance", "When a creature within 5 feet of you takes damage, your reaction takes the damage instead; it can't be reduced or prevented.", { action: "reaction" }],
    [15, "Unyielding Saint", "Advantage on saves to avoid being paralyzed or stunned.", { action: "passive" }],
    [20, "Exalted Champion", "As an action, for 1 hour: resistance to nonmagical bludgeoning, piercing, and slashing; allies within 30 feet have advantage on death saves; you and allies within 30 feet have advantage on Wisdom saves. Ends early if you're incapacitated or die. Once per long rest.", { action: "action", uses: 1, recharge: "long" }]
  ]},
  "open-sea": { source: "TDCSR", features: [
    [3, "Tenets of the Open Sea", "No Greater Life than a Life Lived Free, Trust the Skies, Adapt like the Water, Explore the Uncharted.", { action: "passive" }],
    [3, "Oath Spells", "Always-prepared oath spells at paladin levels 3, 5, 9, 13, and 17 (not counted against prepared spells).", { action: "passive" }],
    [3, "Channel Divinity: Marine Layer", "As an action, fog fills a 20-foot radius around you for 10 minutes, moving with you and heavily obscuring the area; you and creatures within 5 feet of you treat it as lightly obscured. It spreads around corners and can't be dispersed unless you end it (no action).", { action: "action" }],
    [3, "Channel Divinity: Fury of the Tides", "As a bonus action, for 1 minute, once per turn when you hit with a weapon attack you can push the target 10 feet away; if it strikes an obstacle or creature it takes bludgeoning damage equal to your Charisma modifier.", { action: "bonus" }],
    [7, "Aura of Liberation", "While not incapacitated, you and creatures of your choice within 10 feet can't be grappled or restrained and ignore underwater movement and attack penalties; a creature already grappled or restrained entering the aura can spend 5 feet of movement to escape unless the restraint is magical (30 feet at 18th).", { action: "passive" }],
    [15, "Stormy Waters", "When a creature moves into or out of your reach, your reaction deals 1d12 bludgeoning and it makes a Strength save (spell DC) or is knocked prone.", { action: "reaction" }],
    [18, "Aura of Liberation (30 ft)", "Aura of Liberation's range becomes 30 feet.", { action: "passive" }],
    [20, "Mythic Swashbuckler", "As an action, for 1 minute: advantage on Strength (Athletics) checks and a climbing speed equal to your walking speed (doubled if you have one); advantage on attacks against a creature within 5 feet when no other creature is within 5 feet of you; Dash or Disengage as a bonus action; advantage on Dexterity checks and saves against effects you can see. Once per long rest.", { action: "action", uses: 1, recharge: "long" }]
  ]},

  // ───────────────────────────── RANGER (archetype at 3rd; features at 3/7/11/15) ─────────────────────────────
  hunter: { source: "PHB", features: [
    [3, "Hunter's Prey", "Choose one: Colossus Slayer (once per turn, a weapon hit on a creature below its hit point maximum deals an extra 1d8); Giant Killer (when a Large or larger creature within 5 feet hits or misses you, your reaction attacks it, if you can see it); Horde Breaker (once on each of your turns, after a weapon attack, make another attack with the same weapon against a different creature within 5 feet of the original target and in range).", { action: "special" }],
    [7, "Defensive Tactics", "Choose one: Escape the Horde (opportunity attacks against you have disadvantage); Multiattack Defense (after a creature hits you, +4 AC against its later attacks this turn); Steel Will (advantage on saves against being frightened).", { action: "passive" }],
    [11, "Multiattack", "Choose one: Volley (action: a ranged attack against any number of creatures within 10 feet of a point in range, one roll each, ammunition for each); Whirlwind Attack (action: a melee attack against each creature within 5 feet, one roll each).", { action: "action" }],
    [15, "Superior Hunter's Defense", "Choose one: Evasion (no damage on a successful Dexterity save for half, half on a failure); Stand Against the Tide (when a hostile creature misses you with a melee attack, your reaction makes it repeat the attack against another creature of your choice); Uncanny Dodge (reaction to halve the damage of an attack from an attacker you can see).", { action: "reaction" }]
  ]},
  "beast-master": { source: "PHB", features: [
    [3, "Ranger's Companion", "Gain a beast companion no larger than Medium and of CR 1/4 or lower. Add your proficiency bonus to its AC, attacks, damage, and proficient saves and skills; its HP maximum is the higher of its normal maximum or 4 × your ranger level. It acts on your initiative; you direct its movement freely and use your action to command Attack, Dash, Disengage, or Help (otherwise it Dodges). With Extra Attack, you can make one weapon attack when you command it to Attack. Replace a dead companion with 8 hours of bonding.", { action: "action" }],
    [3, "Primal Companion", "Optional replacement for Ranger's Companion. Summon a primal beast (Land, Sea, or Sky) that uses your proficiency bonus; it acts on your turn, Dodges unless you command it with a bonus action, or you can give up one Attack-action attack to have it Attack. Land: AC 13 + PB, HP 5 + 5 × ranger level, 40 ft walk/climb, Maul 1d8 + 2 + PB slashing, Charge +1d6 and Strength save or prone. Sea: AC 13 + PB, HP 5 + 5 × level, 5 ft walk, 60 ft swim, amphibious, Binding Strike 1d6 + 2 + PB and grappled. Sky: AC 13 + PB, HP 4 + 4 × level, 10 ft walk, 60 ft fly, Flyby, Shred 1d4 + 3 + PB slashing. Attacks use your spell attack bonus; save DCs use your spell save DC. Revive within 1 hour of death with an action and a spell slot; swap form on a long rest.", { action: "bonus", optional: true, source: "TCE-optional" }],
    [7, "Exceptional Training", "On a turn when your companion doesn't attack, use a bonus action to have it Dash, Disengage, or Help. Its attacks count as magical.", { action: "bonus" }],
    [11, "Bestial Fury", "When commanded to Attack, the companion makes two attacks (or uses Multiattack if it has it).", { action: "passive" }],
    [15, "Share Spells", "A spell you cast targeting yourself can also affect your companion if it is within 30 feet.", { action: "passive" }]
  ]},
  "gloom-stalker": { source: "XGE", features: [
    [3, "Gloom Stalker Magic", "Learn disguise self (3rd), rope trick (5th), fear (9th), greater invisibility (13th), and seeming (17th); they are ranger spells for you and don't count against spells known.", { action: "passive" }],
    [3, "Dread Ambusher", "Add your Wisdom modifier to initiative. On your first turn of each combat, +10 feet walking speed, and if you take the Attack action you make one extra weapon attack that deals an extra 1d8 of the weapon's type on a hit.", { action: "passive" }],
    [3, "Umbral Sight", "Gain darkvision 60 feet (or +30 feet if you have it). In darkness you are invisible to creatures relying on darkvision to see you.", { action: "passive" }],
    [7, "Iron Mind", "Gain proficiency in Wisdom saves (or Intelligence or Charisma saves if you already have it).", { action: "passive" }],
    [11, "Stalker's Flurry", "Once per turn when you miss with a weapon attack, make another weapon attack as part of the same action.", { action: "passive" }],
    [15, "Shadowy Dodge", "When a creature without advantage makes an attack roll against you, your reaction imposes disadvantage (before the outcome is known).", { action: "reaction" }]
  ]},
  "horizon-walker": { source: "XGE", features: [
    [3, "Horizon Walker Magic", "Learn protection from evil and good (3rd), misty step (5th), haste (9th), banishment (13th), and teleportation circle (17th); ranger spells for you, not counted against spells known.", { action: "passive" }],
    [3, "Detect Portal", "As an action, sense the distance and direction to the nearest planar portal within 1 mile. Once per short or long rest.", { action: "action", uses: 1, recharge: "short" }],
    [3, "Planar Warrior", "As a bonus action, choose a creature you can see within 30 feet; your next weapon hit on it this turn deals all force damage plus an extra 1d8 force (2d8 at 11th).", { action: "bonus" }],
    [7, "Ethereal Step", "As a bonus action, cast etherealness with no slot; it ends at the end of the turn. Once per short or long rest.", { action: "bonus", uses: 1, recharge: "short" }],
    [11, "Distant Strike", "With the Attack action, teleport up to 10 feet to an unoccupied space you can see before each attack; if you attack at least two different creatures, make one extra attack against a third. Planar Warrior becomes 2d8.", { action: "passive" }],
    [15, "Spectral Defense", "When an attack damages you, your reaction gives you resistance to all of that attack's damage this turn.", { action: "reaction" }]
  ]},
  "monster-slayer": { source: "XGE", features: [
    [3, "Monster Slayer Magic", "Learn protection from evil and good (3rd), zone of truth (5th), magic circle (9th), banishment (13th), and hold monster (17th); ranger spells for you, not counted against spells known.", { action: "passive" }],
    [3, "Hunter's Sense", "As an action, learn a creature's damage immunities, resistances, and vulnerabilities (it is within 60 feet and you can see it; divination-shielded creatures read as having none). Uses equal your Wisdom modifier (minimum 1) per long rest.", { action: "action", uses: "wis", recharge: "long" }],
    [3, "Slayer's Prey", "As a bonus action, mark a creature you can see within 60 feet; the first weapon hit on it each turn deals an extra 1d6. Lasts until a short or long rest or until you mark another.", { action: "bonus" }],
    [7, "Supernatural Defense", "Add 1d6 to saves your Slayer's Prey target forces and to checks to escape its grapple.", { action: "passive" }],
    [11, "Magic-User's Nemesis", "When you see a creature within 60 feet cast a spell or teleport, your reaction forces a Wisdom save (spell DC); on a failure the spell or teleport fails and is wasted. Once per short or long rest.", { action: "reaction", uses: 1, recharge: "short" }],
    [15, "Slayer's Counter", "When your Slayer's Prey target forces you to save, your reaction makes one weapon attack against it first; on a hit, you automatically succeed on the save.", { action: "reaction" }]
  ]},
  "fey-wanderer": { source: "TCE", features: [
    [3, "Dreadful Strikes", "Once per turn per target, a weapon hit can deal an extra 1d4 psychic (1d6 at 11th).", { action: "passive" }],
    [3, "Fey Wanderer Magic", "Learn charm person (3rd), misty step (5th), dispel magic (9th), dimension door (13th), and mislead (17th); ranger spells for you, not counted against spells known. You also bear a harmless fey blessing.", { action: "passive" }],
    [3, "Otherworldly Glamour", "Add your Wisdom modifier (minimum +1) to Charisma checks, and gain proficiency in Deception, Performance, or Persuasion.", { action: "passive" }],
    [7, "Beguiling Twist", "Advantage on saves against being charmed or frightened. When you or a creature you can see within 120 feet succeeds on such a save, your reaction makes another creature you can see within 120 feet make a Wisdom save (spell DC) or be charmed or frightened by you (your choice) for 1 minute, repeating the save at each turn end.", { action: "reaction" }],
    [11, "Fey Reinforcements", "You know summon fey (not counted against spells known) and cast it without a material component; once per long rest without a slot. When you cast it you can drop concentration, making the duration 1 minute. Dreadful Strikes becomes 1d6.", { action: "action", uses: 1, recharge: "long" }],
    [15, "Misty Wanderer", "Cast misty step without a slot a number of times equal to your Wisdom modifier (minimum 1) per long rest, and any misty step can bring a willing creature within 5 feet to a space within 5 feet of your destination.", { action: "bonus", uses: "wis", recharge: "long" }]
  ]},
  swarmkeeper: { source: "TCE", features: [
    [3, "Gathered Swarm", "Once on each of your turns, right after you hit a creature with an attack: the target takes 1d6 piercing; or it makes a Strength save (spell DC) or is moved up to 15 feet horizontally; or you are moved 5 feet horizontally.", { action: "passive" }],
    [3, "Swarmkeeper Magic", "Learn mage hand (3rd), faerie fire (3rd), web (5th), gaseous form (9th), arcane eye (13th), and insect plague (17th); ranger spells for you, not counted against spells known.", { action: "passive" }],
    [7, "Writhing Tide", "As a bonus action, gain a 10-foot flying speed with hover for 1 minute or until incapacitated. Uses equal your proficiency bonus per long rest.", { action: "bonus", uses: "prof", recharge: "long" }],
    [11, "Mighty Swarm", "Gathered Swarm damage becomes 1d8; a creature failing the move save can also be knocked prone; when the swarm moves you, you gain half cover until the start of your next turn.", { action: "passive" }],
    [15, "Swarming Dispersal", "When you take damage, your reaction gives you resistance to it and teleports you to an unoccupied space you can see within 30 feet. Uses equal your proficiency bonus per long rest.", { action: "reaction", uses: "prof", recharge: "long" }]
  ]},
  drakewarden: { source: "FTD", features: [
    [3, "Draconic Gift", "Learn thaumaturgy (a ranger spell for you) and Draconic or another language.", { action: "passive" }],
    [3, "Drake Companion", "As an action, summon your Small drake within 30 feet, choosing acid, cold, fire, lightning, or poison as its essence (its immunity and Infused Strikes type). Drake: AC 14 + PB, HP 5 + 5 × ranger level (d10 Hit Dice), speed 40 ft; Bite +3 + PB to hit, 1d6 + PB piercing; Infused Strikes (its reaction): when a creature it can see within 30 feet hits with a weapon, add 1d6 of its essence type. It acts right after you and Dodges unless you command it with a bonus action. Once per long rest, or expend a spell slot of 1st level or higher.", { action: "action", uses: 1, recharge: "long" }],
    [7, "Bond of Fang and Scale", "When summoned, the drake gets a flying speed equal to its walking speed. While it is summoned: it is Medium and can be your mount (no flying while ridden); its Bite deals an extra 1d6 of its essence type; you resist its essence type.", { action: "passive" }],
    [11, "Drake's Breath", "As an action, you or the drake exhale a 30-foot cone of acid, cold, fire, lightning, or poison: Dexterity save (spell DC), 8d6 on a failure (10d6 at 15th), half on a success. Once per long rest, or expend a spell slot of 3rd level or higher.", { action: "action", uses: 1, recharge: "long" }],
    [15, "Perfected Bond", "While summoned: the Bite's extra essence damage becomes 2d6; the drake is Large and can fly while ridden; when you or the drake takes damage while within 30 feet of each other, your reaction gives that one resistance to it (uses equal your proficiency bonus per long rest). Drake's Breath becomes 10d6.", { action: "reaction", uses: "prof", recharge: "long" }]
  ]}
});

// Always-prepared subclass spells by class level (index slugs from SCRATCH/spell-inventory.tsv).
// NOTE: ensureSubclassSpells' fallback assumes one key per spell level; cantrip keys (spores 2, stars 2,
// swarmkeeper 3, drakewarden 3) and fey-wanderer 11 rely on the real spell level from the spell list.
Object.assign(SUBCLASS_SPELLS, {
  // Druid circles
  spores: { 2: ["chill-touch"], 3: ["blindness-deafness", "gentle-repose"], 5: ["animate-dead", "gaseous-form"], 7: ["blight", "confusion"], 9: ["cloudkill", "contagion"] },
  stars: { 2: ["guidance", "guiding-bolt"] },
  wildfire: { 2: ["burning-hands", "cure-wounds"], 3: ["flaming-sphere", "scorching-ray"], 5: ["plant-growth", "revivify"], 7: ["aura-of-life", "fire-shield"], 9: ["flame-strike", "mass-cure-wounds"] },
  // Paladin oaths
  devotion: { 3: ["protection-from-evil-and-good", "sanctuary"], 5: ["lesser-restoration", "zone-of-truth"], 9: ["beacon-of-hope", "dispel-magic"], 13: ["freedom-of-movement", "guardian-of-faith"], 17: ["commune", "flame-strike"] },
  ancients: { 3: ["ensnaring-strike", "speak-with-animals"], 5: ["misty-step", "moonbeam"], 9: ["plant-growth", "protection-from-energy"], 13: ["ice-storm", "stoneskin"], 17: ["commune-with-nature", "tree-stride"] },
  vengeance: { 3: ["bane", "hunters-mark"], 5: ["hold-person", "misty-step"], 9: ["haste", "protection-from-energy"], 13: ["banishment", "dimension-door"], 17: ["hold-monster", "scrying"] },
  oathbreaker: { 3: ["hellish-rebuke", "inflict-wounds"], 5: ["crown-of-madness", "darkness"], 9: ["animate-dead", "bestow-curse"], 13: ["blight", "confusion"], 17: ["contagion", "dominate-person"] },
  conquest: { 3: ["armor-of-agathys", "command"], 5: ["hold-person", "spiritual-weapon"], 9: ["bestow-curse", "fear"], 13: ["dominate-beast", "stoneskin"], 17: ["cloudkill", "dominate-person"] },
  redemption: { 3: ["sanctuary", "sleep"], 5: ["calm-emotions", "hold-person"], 9: ["counterspell", "hypnotic-pattern"], 13: ["resilient-sphere", "stoneskin"], 17: ["hold-monster", "wall-of-force"] },
  glory: { 3: ["guiding-bolt", "heroism"], 5: ["enhance-ability", "magic-weapon"], 9: ["haste", "protection-from-energy"], 13: ["compulsion", "freedom-of-movement"], 17: ["commune", "flame-strike"] },
  watchers: { 3: ["alarm", "detect-magic"], 5: ["moonbeam", "see-invisibility"], 9: ["counterspell", "nondetection"], 13: ["aura-of-purity", "banishment"], 17: ["hold-monster", "scrying"] },
  crown: { 3: ["command", "compelled-duel"], 5: ["warding-bond", "zone-of-truth"], 9: ["aura-of-vitality", "spirit-guardians"], 13: ["banishment", "guardian-of-faith"], 17: ["circle-of-power", "geas"] },
  // freedom-of-the-waves / freedom-of-the-winds are NOT in the app yet — add them to LOCAL_SPELLS (see findings).
  "open-sea": { 3: ["create-or-destroy-water", "expeditious-retreat"], 5: ["augury", "misty-step"], 9: ["call-lightning", "freedom-of-the-waves"], 13: ["control-water", "freedom-of-movement"], 17: ["commune-with-nature", "freedom-of-the-winds"] },
  // Ranger archetypes (learned, not counted against spells known)
  "gloom-stalker": { 3: ["disguise-self"], 5: ["rope-trick"], 9: ["fear"], 13: ["greater-invisibility"], 17: ["seeming"] },
  "horizon-walker": { 3: ["protection-from-evil-and-good"], 5: ["misty-step"], 9: ["haste"], 13: ["banishment"], 17: ["teleportation-circle"] },
  "monster-slayer": { 3: ["protection-from-evil-and-good"], 5: ["zone-of-truth"], 9: ["magic-circle"], 13: ["banishment"], 17: ["hold-monster"] },
  "fey-wanderer": { 3: ["charm-person"], 5: ["misty-step"], 9: ["dispel-magic"], 11: ["summon-fey"], 13: ["dimension-door"], 17: ["mislead"] },
  swarmkeeper: { 3: ["faerie-fire", "mage-hand"], 5: ["web"], 9: ["gaseous-form"], 13: ["arcane-eye"], 17: ["insect-plague"] },
  drakewarden: { 3: ["thaumaturgy"] }
});

// Circle of the Land spells by terrain (druid levels 3/5/7/9). Always prepared once the druid reaches the level.
Object.assign(LAND_CIRCLE_SPELLS, {
  arctic:    { 3: ["hold-person", "spike-growth"], 5: ["sleet-storm", "slow"], 7: ["freedom-of-movement", "ice-storm"], 9: ["commune-with-nature", "cone-of-cold"] },
  coast:     { 3: ["mirror-image", "misty-step"], 5: ["water-breathing", "water-walk"], 7: ["control-water", "freedom-of-movement"], 9: ["conjure-elemental", "scrying"] },
  desert:    { 3: ["blur", "silence"], 5: ["create-food-and-water", "protection-from-energy"], 7: ["blight", "hallucinatory-terrain"], 9: ["insect-plague", "wall-of-stone"] },
  forest:    { 3: ["barkskin", "spider-climb"], 5: ["call-lightning", "plant-growth"], 7: ["divination", "freedom-of-movement"], 9: ["commune-with-nature", "tree-stride"] },
  grassland: { 3: ["invisibility", "pass-without-trace"], 5: ["daylight", "haste"], 7: ["divination", "freedom-of-movement"], 9: ["dream", "insect-plague"] },
  mountain:  { 3: ["spider-climb", "spike-growth"], 5: ["lightning-bolt", "meld-into-stone"], 7: ["stone-shape", "stoneskin"], 9: ["passwall", "wall-of-stone"] },
  swamp:     { 3: ["darkness", "acid-arrow"], 5: ["water-walk", "stinking-cloud"], 7: ["freedom-of-movement", "locate-creature"], 9: ["insect-plague", "scrying"] },
  underdark: { 3: ["spider-climb", "web"], 5: ["gaseous-form", "stinking-cloud"], 7: ["greater-invisibility", "stone-shape"], 9: ["cloudkill", "insect-plague"] }
});

// Same semantics as data.js: armor/weapons merged into training; trackers(level, prof) => [[name, max, reset]].
// New, not yet consumed (see findings): tools, skills, languages (arrays of strings, "or" = player choice);
// saves: [[classLevel, ability, fallback]] for "gain this save, or one of these if you already have it".
// classId guards trackers against a same-named subclass of another class (play.js already honours it).
// Keys that already exist in data.js (battle-master, eldritch-knight, champion, arcane-archer, samurai,
// psi-warrior, rune-knight, echo-knight, stars) reproduce their old fields.
Object.assign(SUBCLASS_EXTRAS, {
  // Druid (Natural Recovery for Land stays in play.js classFeatureTrackers)
  dreams: { classId: "druid", trackers: level => [
    ["Balm of the Summer Court (d6)", level, "long"],
    level >= 10 ? ["Hidden Paths", Math.max(1, mod("wis")), "long"] : null,
    level >= 14 ? ["Walker in Dreams", 1, "long"] : null
  ].filter(Boolean) },
  shepherd: { classId: "druid", languages: ["Sylvan"], trackers: level => [
    ["Spirit Totem", 1, "short"],
    level >= 14 ? ["Faithful Summons", 1, "long"] : null
  ].filter(Boolean) },
  spores: { classId: "druid", trackers: level => level >= 6 ? [["Fungal Infestation", Math.max(1, mod("wis")), "long"]] : [] },
  stars: { classId: "druid", trackers: (level, prof) => [
    ["Star Map Guiding Bolt", prof, "long"],
    level >= 6 ? ["Cosmic Omen", prof, "long"] : null
  ].filter(Boolean) },
  wildfire: { classId: "druid", trackers: (level, prof) => [
    level >= 10 ? ["Cauterizing Flames", prof, "long"] : null,
    level >= 14 ? ["Blazing Revival", 1, "long"] : null
  ].filter(Boolean) },
  blighted: { classId: "druid", skills: ["Intimidation"], trackers: (level, prof) => [
    ["Defile Ground", 1, "short"],
    level >= 6 ? ["Call of the Shadowseeds", prof, "long"] : null
  ].filter(Boolean) },

  // Fighter
  champion: { classId: "fighter" },
  "battle-master": { classId: "fighter", tools: ["One type of artisan's tools (choice)"], trackers: level => level >= 3 ? [["Superiority Dice", level >= 15 ? 6 : level >= 7 ? 5 : 4, "short"]] : [] },
  "eldritch-knight": { classId: "fighter" },
  "arcane-archer": { classId: "fighter", skills: ["Arcana or Nature"], trackers: level => level >= 3 ? [["Arcane Shot", 2, "short"]] : [] },
  cavalier: { classId: "fighter", skills: ["Animal Handling, History, Insight, Performance, or Persuasion (or one language)"], trackers: level => [
    level >= 3 ? ["Unwavering Mark Attack", Math.max(1, mod("str")), "long"] : null,
    level >= 7 ? ["Warding Maneuver", Math.max(1, mod("con")), "long"] : null
  ].filter(Boolean) },
  samurai: { classId: "fighter", skills: ["History, Insight, Performance, or Persuasion (or one language)"], saves: [[7, "wis", "int or cha"]], trackers: level => [
    level >= 3 ? ["Fighting Spirit", 3, "long"] : null,
    level >= 18 ? ["Strength Before Death", 1, "long"] : null
  ].filter(Boolean) },
  // Psionic Energy dice: all back on a long rest; a bonus action regains one, once per short or long rest.
  "psi-warrior": { classId: "fighter", trackers: (level, prof) => [
    level >= 3 ? ["Psionic Energy Dice", prof * 2, "long"] : null,
    level >= 3 ? ["Telekinetic Movement (free)", 1, "short"] : null,
    level >= 7 ? ["Psi-Powered Leap (free)", 1, "short"] : null,
    level >= 15 ? ["Bulwark of Force (free)", 1, "long"] : null,
    level >= 18 ? ["Telekinetic Master (free)", 1, "long"] : null
  ].filter(Boolean) },
  // ponytail: one pooled tracker for rune invocations; RAW is once (twice at 15th) per rune known.
  "rune-knight": { classId: "fighter", tools: ["Smith's tools"], languages: ["Giant"], trackers: (level, prof) => [
    level >= 3 ? ["Giant's Might", prof, "long"] : null,
    // One invocation per known rune (two at 15th, Master of Runes); a pooled count until the runes are picked.
    ...((character.classChoices?.runes || []).length ? character.classChoices.runes.map(rune => [rune.name || rune, level >= 15 ? 2 : 1, "short"])
      : [level >= 3 ? ["Rune Invocations", (level >= 15 ? 5 : level >= 10 ? 4 : level >= 7 ? 3 : 2) * (level >= 15 ? 2 : 1), "short"] : null]),
    level >= 7 ? ["Runic Shield", prof, "long"] : null
  ].filter(Boolean) },
  "purple-dragon-knight": { classId: "fighter", skills: ["Persuasion at 7th (or Animal Handling, Insight, Intimidation, or Performance if already proficient); double proficiency on Persuasion"] },
  "echo-knight": { classId: "fighter", trackers: level => [
    level >= 3 ? ["Unleash Incarnation", Math.max(1, mod("con")), "long"] : null,
    level >= 10 ? ["Shadow Martyr", 1, "short"] : null,
    level >= 15 ? ["Reclaim Potential", Math.max(1, mod("con")), "long"] : null
  ].filter(Boolean) },

  // Monk
  "open-hand": { classId: "monk", trackers: level => level >= 6 ? [["Wholeness of Body", 1, "long"]] : [] },
  "drunken-master": { classId: "monk", skills: ["Performance"], tools: ["Brewer's supplies"] },
  kensei: { classId: "monk", weapons: ["Kensei weapons (one melee + one ranged type; +1 type at 6th, 11th, 17th)"], tools: ["Calligrapher's or painter's supplies"] },
  mercy: { classId: "monk", skills: ["Insight", "Medicine"], tools: ["Herbalism kit"], trackers: level => level >= 17 ? [["Hand of Ultimate Mercy", 1, "long"]] : [] },
  "ascendant-dragon": { classId: "monk", languages: ["Draconic or one other"], trackers: (level, prof) => [
    level >= 3 ? ["Breath of the Dragon", prof, "long"] : null,
    level >= 3 ? ["Draconic Presence", 1, "long"] : null,
    level >= 6 ? ["Wings Unfurled", prof, "long"] : null,
    level >= 11 ? ["Aspect of the Wyrm", 1, "long"] : null
  ].filter(Boolean) },
  "cobalt-soul": { classId: "monk", skills: ["Arcana, History, Investigation, Nature, or Religion at 6th, 11th, 17th"], languages: ["One language at 6th, 11th, 17th"] },

  // Paladin (Channel Divinity is the base tracker)
  devotion: { classId: "paladin", trackers: level => level >= 20 ? [["Holy Nimbus", 1, "long"]] : [] },
  ancients: { classId: "paladin", trackers: level => [
    level >= 15 ? ["Undying Sentinel", 1, "long"] : null,
    level >= 20 ? ["Elder Champion", 1, "long"] : null
  ].filter(Boolean) },
  vengeance: { classId: "paladin", trackers: level => level >= 20 ? [["Avenging Angel", 1, "long"]] : [] },
  oathbreaker: { classId: "paladin", trackers: level => level >= 20 ? [["Dread Lord", 1, "long"]] : [] },
  conquest: { classId: "paladin", trackers: level => level >= 20 ? [["Invincible Conqueror", 1, "long"]] : [] },
  glory: { classId: "paladin", trackers: level => [
    level >= 15 ? ["Glorious Defense", Math.max(1, mod("cha")), "long"] : null,
    level >= 20 ? ["Living Legend", 1, "long"] : null
  ].filter(Boolean) },
  watchers: { classId: "paladin", trackers: level => level >= 20 ? [["Mortal Bulwark", 1, "long"]] : [] },
  crown: { classId: "paladin", trackers: level => level >= 20 ? [["Exalted Champion", 1, "long"]] : [] },
  "open-sea": { classId: "paladin", trackers: level => level >= 20 ? [["Mythic Swashbuckler", 1, "long"]] : [] },

  // Ranger
  "gloom-stalker": { classId: "ranger", saves: [[7, "wis", "int or cha"]] },
  "horizon-walker": { classId: "ranger", trackers: level => [
    level >= 3 ? ["Detect Portal", 1, "short"] : null,
    level >= 7 ? ["Ethereal Step", 1, "short"] : null
  ].filter(Boolean) },
  "monster-slayer": { classId: "ranger", trackers: level => [
    level >= 3 ? ["Hunter's Sense", Math.max(1, mod("wis")), "long"] : null,
    level >= 11 ? ["Magic-User's Nemesis", 1, "short"] : null
  ].filter(Boolean) },
  "fey-wanderer": { classId: "ranger", skills: ["Deception, Performance, or Persuasion"], trackers: level => [
    level >= 11 ? ["Fey Reinforcements (free Summon Fey)", 1, "long"] : null,
    level >= 15 ? ["Misty Wanderer", Math.max(1, mod("wis")), "long"] : null
  ].filter(Boolean) },
  swarmkeeper: { classId: "ranger", trackers: (level, prof) => [
    level >= 7 ? ["Writhing Tide", prof, "long"] : null,
    level >= 15 ? ["Swarming Dispersal", prof, "long"] : null
  ].filter(Boolean) },
  drakewarden: { classId: "ranger", languages: ["Draconic or one other"], trackers: (level, prof) => [
    level >= 3 ? ["Drake Companion (free summon)", 1, "long"] : null,
    level >= 11 ? ["Drake's Breath", 1, "long"] : null,
    level >= 15 ? ["Reflexive Resistance", prof, "long"] : null
  ].filter(Boolean) }
});

// Subclasses: rogue, sorcerer, warlock, wizard.
// Summaries are original wording; numbers follow the 2014-era books (PHB, SCAG, XGE, TCE, EGtW, VRGtR, DSotDQ, TDCSR).
// Row shape: [classLevel, featureName, summary, { action: "action" | "bonus" | "reaction" }?]
ADDED_SUBCLASSES.push(
  // [index, name, classIndex, className, flavor, source] — only subclasses missing from OFFICIAL_SUBCLASS_FALLBACK
  ["runechild", "Runechild", "sorcerer", "Sorcerer", "Sorcerous Origin", "TDCSR"]
);

Object.assign(SUBCLASS_FEATURES, {
  // ---------------------------------------------------------------- ROGUE (archetype at 3rd; features at 3/9/13/17)
  thief: { source: "PHB", features: [
    [3, "Fast Hands", "Cunning Action's bonus action can also be a Dexterity (Sleight of Hand) check, using thieves' tools to disarm a trap or open a lock, or the Use an Object action.", { action: "bonus" }],
    [3, "Second-Story Work", "Climbing no longer costs you extra movement, and any running jump carries you extra feet equal to your Dexterity modifier."],
    [9, "Supreme Sneak", "You have advantage on Dexterity (Stealth) checks on any turn in which you move no more than half your speed."],
    [13, "Use Magic Device", "You ignore every class, race, and level requirement for using magic items."],
    [17, "Thief's Reflexes", "In the first round of each combat you take two turns: one at your initiative and another at your initiative minus 10. Not usable while surprised."]
  ]},
  assassin: { source: "PHB", features: [
    [3, "Bonus Proficiencies", "You gain proficiency with the disguise kit and the poisoner's kit."],
    [3, "Assassinate", "You have advantage on attack rolls against any creature that hasn't yet taken a turn in the combat, and every hit you land on a surprised creature is a critical hit."],
    [9, "Infiltration Expertise", "By spending 7 days and 25 gp you build a reliable false identity (history, profession, affiliations, documents). You can't adopt the identity of a person who already exists."],
    [13, "Impostor", "After studying a person's speech, handwriting, and behavior for at least 3 hours, you can imitate them flawlessly enough to fool casual observers; you have advantage on Charisma (Deception) checks to avoid being found out by a suspicious creature."],
    [17, "Death Strike", "When you hit a surprised creature, it makes a Constitution save (DC 8 + your Dexterity modifier + your proficiency bonus); on a failure the attack's damage is doubled."]
  ]},
  "arcane-trickster": { source: "PHB", features: [
    [3, "Spellcasting", "Intelligence-based third-caster spellcasting from the wizard list. You know Mage Hand plus 2 other wizard cantrips (one more at 10th). Your leveled spells must be enchantment or illusion, except one of your three 1st-level picks at 3rd and the new spell gained at 8th, 14th, and 20th, which may be any school. On gaining a level you can swap one known spell for another wizard spell of a level you can cast, following the same school rule. Spells known: 3 at 3rd, rising to 13 at 20th; slots per the third-caster table."],
    [3, "Mage Hand Legerdemain", "Your Mage Hand is invisible and can stow or lift an object from a container another creature wears or carries, pick locks, and disarm traps with thieves' tools at range. A Dexterity (Sleight of Hand) check contested by the target's Wisdom (Perception) keeps it unnoticed. Your Cunning Action bonus action can control the hand."],
    [9, "Magical Ambush", "If you are hidden from a creature when you cast a spell on it, it has disadvantage on any saving throw against that spell this turn."],
    [13, "Versatile Trickster", "As a bonus action, pick a creature within 5 feet of your spectral Mage Hand; you have advantage on attack rolls against it until the end of the turn.", { action: "bonus" }],
    [17, "Spell Thief", "Reaction when a creature casts a spell that targets you or includes you in its area: the caster makes a saving throw with its spellcasting ability modifier against your spell save DC. On a failure the spell has no effect on you and, if it is 1st level or higher and of a level you can cast, you know it for 8 hours and can cast it with your slots while the caster can't cast it for those 8 hours. Once per long rest.", { action: "reaction" }]
  ]},
  inquisitive: { source: "XGE", features: [
    [3, "Ear for Deceit", "When you make a Wisdom (Insight) check to tell whether a creature is lying, a d20 roll of 7 or lower counts as an 8."],
    [3, "Eye for Detail", "As a bonus action you can make a Wisdom (Perception) check to spot a hidden creature or object, or an Intelligence (Investigation) check to find or decipher clues.", { action: "bonus" }],
    [3, "Insightful Fighting", "Bonus action: Wisdom (Insight) check against a creature's Charisma (Deception). On a success you can apply Sneak Attack to it without advantage (but not while you have disadvantage) for 1 minute or until you use this successfully on a different target.", { action: "bonus" }],
    [9, "Steady Eye", "You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks on a turn in which you move no more than half your speed."],
    [13, "Unerring Eye", "Action: for an instant you sense illusions, shapechangers not in their true form, and other magic meant to fool the senses within 30 feet, as long as you aren't blinded or deafened. You learn something is deceptive, not what it is. Uses equal to your Wisdom modifier (minimum 1) per long rest.", { action: "action" }],
    [17, "Eye for Weakness", "While Insightful Fighting applies to a creature, your Sneak Attack damage against it rises by 3d6."]
  ]},
  mastermind: { source: "XGE", features: [
    [3, "Master of Intrigue", "You gain proficiency with the disguise kit, the forgery kit, and one gaming set, and learn two languages. After hearing a creature speak for at least 1 minute you can copy its speech patterns and accent, passing as a native of a land whose language you know."],
    [3, "Master of Tactics", "You can take the Help action as a bonus action. When you help an ally attack a creature, that creature can be up to 30 feet away from you instead of 5, provided it can see or hear you.", { action: "bonus" }],
    [9, "Insightful Manipulator", "After at least 1 minute observing or talking with a creature outside combat, you learn how two of these compare to yours (equal, higher, or lower): Intelligence, Wisdom, Charisma, or class levels. The DM may also reveal a piece of its history or personality."],
    [13, "Misdirection", "When a creature attacks you while another creature within 5 feet of you is giving you cover, you can use your reaction to make that other creature the target instead.", { action: "reaction" }],
    [17, "Soul of Deceit", "Telepathy and similar magic can't read your thoughts unless you allow it; you can feed false thoughts with a Charisma (Deception) check contested by the reader's Wisdom (Insight). Magic that detects lies always reads you as truthful if you wish, and you can't be magically forced to tell the truth."]
  ]},
  scout: { source: "XGE", features: [
    [3, "Skirmisher", "When an enemy ends its turn within 5 feet of you, you can use your reaction to move up to half your speed without provoking opportunity attacks.", { action: "reaction" }],
    [3, "Survivalist", "You gain proficiency in Nature and Survival if you lack it, and your proficiency bonus is doubled for any ability check using either skill."],
    [9, "Superior Mobility", "Your walking speed increases by 10 feet, as do any climbing or swimming speeds you have."],
    [13, "Ambush Master", "You have advantage on initiative rolls. The first creature you hit in the first round of combat becomes easier to strike: attack rolls against it have advantage until the start of your next turn."],
    [17, "Sudden Strike", "When you take the Attack action, you can make one more attack as a bonus action. It can apply Sneak Attack even if you already used it this turn, but never twice against the same target in a turn.", { action: "bonus" }]
  ]},
  swashbuckler: { source: "XGE", features: [
    [3, "Fancy Footwork", "On your turn, any creature you make a melee attack against can't make opportunity attacks against you for the rest of that turn."],
    [3, "Rakish Audacity", "Add your Charisma modifier to initiative rolls. You can Sneak Attack without advantage when the target is within 5 feet of you, no other creature is within 5 feet of you, and you don't have disadvantage."],
    [9, "Panache", "Action: Charisma (Persuasion) contested by the Wisdom (Insight) of a creature that can hear you and shares a language. A hostile target has disadvantage on attacks against anyone but you and can make opportunity attacks only against you for 1 minute, ending if your companions attack it or affect it with a spell, or if you are more than 60 feet apart. A non-hostile target is charmed by you for 1 minute, ending if you or your companions harm it.", { action: "action" }],
    [13, "Elegant Maneuver", "As a bonus action, you gain advantage on the next Dexterity (Acrobatics) or Strength (Athletics) check you make this turn.", { action: "bonus" }],
    [17, "Master Duelist", "When you miss with an attack roll, you can roll it again with advantage. Once per short or long rest."]
  ]},
  phantom: { source: "TCE", features: [
    [3, "Whispers of the Dead", "When you finish a short or long rest, gain proficiency in one skill or tool of your choice; it lasts until you use this feature again to pick a different one."],
    [3, "Wails from the Grave", "Right after you deal Sneak Attack damage on your turn, choose a second creature you can see within 30 feet of the first. Roll half your Sneak Attack dice (rounded up); it takes that much necrotic damage. Uses equal to your proficiency bonus per long rest."],
    [9, "Tokens of the Departed", "Reaction when a creature you can see dies within 30 feet: a Tiny soul trinket forms in your free hand (maximum trinkets equal to your proficiency bonus). While carrying one you have advantage on death saves and Constitution saves. When you deal Sneak Attack damage on your turn you can destroy a trinket to use Wails from the Grave without spending a use, or use an action to destroy one and ask its spirit a single question.", { action: "reaction" }],
    [13, "Ghost Walk", "Bonus action: become spectral for 10 minutes or until you end it as a bonus action. You gain a 10-foot flying speed and can hover, attack rolls against you have disadvantage, and you can move through creatures and objects as difficult terrain, taking 1d10 force damage if you end a turn inside one. Once per long rest, or destroy a soul trinket to use it again.", { action: "bonus" }],
    [17, "Death's Friend", "Wails from the Grave deals its necrotic damage to both the first and the second creature. When you finish a long rest with no soul trinket, one appears in your hand."]
  ]},
  soulknife: { source: "TCE", features: [
    [3, "Psionic Power", "You have Psionic Energy dice equal to twice your proficiency bonus (d6; d8 at 5th, d10 at 11th, d12 at 17th); all return on a long rest, and once per short or long rest you can regain one as a bonus action. Psi-Bolstered Knack: when you fail a check with a skill or tool you're proficient in, add a die (spent only if you then succeed). Psychic Whispers: as an action, link up to your proficiency bonus in creatures you can see for hours equal to a die roll, telepathy up to 1 mile; the first use after each long rest is free, later uses spend the die."],
    [3, "Psychic Blades", "When you take the Attack action you can attack with a psychic blade from a free hand: a simple melee weapon with finesse and thrown (60 ft, no long range) that deals 1d6 psychic + ability modifier and vanishes after the attack. Afterward, as a bonus action, a second blade from your other free hand deals 1d4 psychic + modifier.", { action: "bonus" }],
    [9, "Soul Blades", "Homing Strikes: when a psychic blade attack misses, add a Psionic Energy die to the roll (spent only if it then hits). Psychic Teleportation: as a bonus action, spend and roll a die and throw a blade to an unoccupied space you can see up to 10 times the roll in feet away; you teleport there.", { action: "bonus" }],
    [13, "Psychic Veil", "Action: you and what you wear or carry turn invisible for 1 hour or until you dismiss it; it ends early right after you deal damage to a creature or force one to make a save. Once per long rest, or spend a Psionic Energy die to use it again.", { action: "action" }],
    [17, "Rend Mind", "When you deal Sneak Attack damage with a psychic blade, the target makes a Wisdom save (DC 8 + proficiency bonus + Dexterity modifier) or is stunned for 1 minute, repeating the save at the end of each of its turns. Once per long rest, or spend three Psionic Energy dice to use it again."]
  ]},

  // ---------------------------------------------------------------- SORCERER (origin at 1st; features at 1/6/14/18)
  draconic: { source: "PHB", features: [
    [1, "Dragon Ancestor", "Choose a dragon type, which sets your damage type: black or copper (acid), blue or bronze (lightning), brass, gold, or red (fire), green (poison), silver or white (cold). You speak, read, and write Draconic, and your proficiency bonus is doubled on Charisma checks to interact with dragons if it applies."],
    [1, "Draconic Resilience", "Your hit point maximum increases by 1 at 1st level and by 1 more each time you gain a sorcerer level. While you wear no armor, your AC is 13 + your Dexterity modifier."],
    [6, "Elemental Affinity", "When you cast a spell that deals your ancestry's damage type, add your Charisma modifier to one damage roll of it. At the same time you can spend 1 sorcery point to gain resistance to that type for 1 hour."],
    [14, "Dragon Wings", "As a bonus action you sprout wings and gain a flying speed equal to your current speed until you dismiss them as a bonus action. Not usable in armor unless the armor is made for wings.", { action: "bonus" }],
    [18, "Draconic Presence", "Action, 5 sorcery points: a 60-foot aura of awe or fear for 1 minute or until your concentration ends. A hostile creature starting its turn in it must succeed on a Wisdom save or be charmed (awe) or frightened (fear) until the aura ends; a creature that succeeds is immune for 24 hours.", { action: "action" }]
  ]},
  "wild-magic": { source: "PHB", features: [
    [1, "Wild Magic Surge", "Right after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20; on a 1 you roll on the Wild Magic Surge table. A surge spell can't be modified by Metamagic, and if it normally needs concentration it lasts its full duration without it."],
    [1, "Tides of Chaos", "Gain advantage on one attack roll, ability check, or saving throw. Once used, it returns on a long rest, or sooner if the DM has you roll on the Wild Magic Surge table after you cast a sorcerer spell of 1st level or higher."],
    [6, "Bend Luck", "Reaction when a creature you can see makes an attack roll, ability check, or saving throw: spend 2 sorcery points and roll 1d4, adding or subtracting it (your choice). Use it after the roll but before its effects.", { action: "reaction" }],
    [14, "Controlled Chaos", "Whenever you roll on the Wild Magic Surge table, roll twice and pick either result."],
    [18, "Spell Bombardment", "When a spell's damage roll shows the highest number on any die, pick one such die, roll it again, and add it. Once per turn."]
  ]},
  "divine-soul": { source: "XGE", features: [
    [1, "Divine Magic", "When you learn or replace a sorcerer cantrip or spell, you can take it from the cleric list instead (it counts as a sorcerer spell). You also learn one extra spell that doesn't count against spells known, set by your affinity: Good, cure wounds; Evil, inflict wounds; Law, bless; Chaos, bane; Neutrality, protection from evil and good."],
    [1, "Favored by the Gods", "When you fail a saving throw or miss with an attack roll, roll 2d4 and add it to the total, possibly changing the result. Once per short or long rest."],
    [6, "Empowered Healing", "When you or an ally within 5 feet rolls dice for healing from a spell, spend 1 sorcery point to reroll any number of those dice once, if you aren't incapacitated. Once per turn."],
    [14, "Otherworldly Wings", "As a bonus action, manifest spectral wings with a 30-foot flying speed until you are incapacitated, die, or dismiss them as a bonus action. Their look follows your affinity (eagle for good or law, bat for evil or chaos, dragonfly for neutrality).", { action: "bonus" }],
    [18, "Unearthly Recovery", "As a bonus action while you have fewer than half your hit points, regain hit points equal to half your hit point maximum. Once per long rest.", { action: "bonus" }]
  ]},
  "shadow-magic": { source: "XGE", features: [
    [1, "Eyes of the Dark", "You have darkvision out to 120 feet. At 3rd level you learn darkness (not counted against spells known); you can cast it with a spell slot or 2 sorcery points, and when cast with points you can see through its darkness."],
    [1, "Strength of the Grave", "When damage drops you to 0 hit points, make a Charisma save (DC 5 + the damage taken); on a success you drop to 1 hit point instead. Doesn't work against radiant damage or a critical hit. After a success, not again until a long rest."],
    [6, "Hound of Ill Omen", "Bonus action, 3 sorcery points: a Medium monstrous hound (dire wolf statistics) appears within 30 feet of a creature you can see within 120 feet, with temporary hit points equal to half your sorcerer level. It acts on its own initiative, can only move toward and attack that target, always knows where it is, and moves through creatures and objects as difficult terrain (5 force damage if it ends its turn inside an object). While the hound is within 5 feet of the target, the target has disadvantage on saves against your spells. It lasts 5 minutes or until it or the target drops to 0 HP.", { action: "bonus" }],
    [14, "Shadow Walk", "As a bonus action while in dim light or darkness, teleport up to 120 feet to an unoccupied space you can see that is also in dim light or darkness.", { action: "bonus" }],
    [18, "Umbral Form", "Bonus action, 6 sorcery points: for 1 minute (or until you end it as a bonus action) you resist all damage except force and radiant and can move through creatures and objects as difficult terrain, taking 5 force damage if you end a turn inside an object.", { action: "bonus" }]
  ]},
  "storm-sorcery": { source: "XGE", features: [
    [1, "Wind Speaker", "You can speak, read, and write Primordial, which lets you understand its dialects Aquan, Auran, Ignan, and Terran."],
    [1, "Tempestuous Magic", "Before or after casting a spell of 1st level or higher, you can use a bonus action to fly up to 10 feet without provoking opportunity attacks.", { action: "bonus" }],
    [6, "Heart of the Storm", "You resist lightning and thunder damage. When you start casting a spell of 1st level or higher that deals lightning or thunder damage, creatures of your choice you can see within 10 feet take lightning or thunder damage (your choice) equal to half your sorcerer level."],
    [6, "Storm Guide", "If it's raining, use an action to stop rain falling in a 20-foot-radius sphere centered on you (end it as a bonus action). If it's windy, use a bonus action each round to set the wind's direction in a 100-foot-radius sphere around you until the end of your next turn; its speed doesn't change.", { action: "action" }],
    [14, "Storm's Fury", "When a melee attack hits you, use your reaction to deal lightning damage equal to your sorcerer level to the attacker; it must also succeed on a Strength save against your spell save DC or be pushed up to 20 feet straight away from you.", { action: "reaction" }],
    [18, "Wind Soul", "You are immune to lightning and thunder damage and have a 60-foot magical flying speed. As an action, drop your flying speed to 30 feet for 1 hour to give up to 3 + your Charisma modifier creatures within 30 feet a 30-foot flying speed for 1 hour. Once per short or long rest.", { action: "action" }]
  ]},
  "aberrant-mind": { source: "TCE", features: [
    [1, "Psionic Spells", "You learn the Aberrant Mind spells at 1st, 3rd, 5th, 7th, and 9th level; they are sorcerer spells and don't count against spells known. Whenever you gain a sorcerer level you can replace one of them with a divination or enchantment spell of the same level from the sorcerer, warlock, or wizard list."],
    [1, "Telepathic Speech", "Bonus action: link with one creature you can see within 30 feet. For minutes equal to your sorcerer level you can talk mind to mind while within miles equal to your Charisma modifier (minimum 1), using a language the other knows. Linking a new creature ends the old link.", { action: "bonus" }],
    [6, "Psionic Sorcery", "You can cast a 1st-level-or-higher spell from Psionic Spells by spending sorcery points equal to its level instead of a slot; cast this way it needs no verbal or somatic components, and no material components unless they are consumed or have a cost."],
    [6, "Psychic Defenses", "You resist psychic damage and have advantage on saving throws against being charmed or frightened."],
    [14, "Revelation in Flesh", "Bonus action: spend 1 or more sorcery points to transform for 10 minutes, gaining one benefit per point: see invisible creatures within 60 feet not behind total cover; flying speed equal to walking speed and hover; swimming speed equal to twice walking speed and water breathing; squeeze through 1-inch gaps and spend 5 feet of movement to escape nonmagical restraints or a grapple.", { action: "bonus" }],
    [18, "Warping Implosion", "Action: teleport to an unoccupied space you can see within 120 feet. Each creature within 30 feet of the space you left makes a Strength save, taking 3d10 force damage and being pulled toward that space on a failure, or half damage and no pull on a success. Once per long rest, or spend 5 sorcery points to use it again.", { action: "action" }]
  ]},
  "clockwork-soul": { source: "TCE", features: [
    [1, "Clockwork Magic", "You learn the Clockwork Soul spells at 1st, 3rd, 5th, 7th, and 9th level; they are sorcerer spells and don't count against spells known. Whenever you gain a sorcerer level you can replace one with an abjuration or transmutation spell of the same level from the sorcerer, warlock, or wizard list."],
    [1, "Restore Balance", "Reaction when a creature you can see within 60 feet is about to roll a d20 with advantage or disadvantage: cancel both for that roll. Uses equal to your proficiency bonus per long rest.", { action: "reaction" }],
    [6, "Bastion of Law", "Action: spend 1 to 5 sorcery points to ward yourself or a creature you can see within 30 feet with that many d8s. When the warded creature takes damage it can spend and roll any number of the dice to reduce the damage by the total. The ward lasts until you finish a long rest or use this again.", { action: "action" }],
    [14, "Trance of Order", "Bonus action: for 1 minute, attack rolls against you can't gain advantage, and on your attack rolls, ability checks, and saving throws a d20 roll of 9 or lower counts as 10. Once per long rest, or spend 5 sorcery points to use it again.", { action: "bonus" }],
    [18, "Clockwork Cavalcade", "Action: spirits of order fill a 30-foot cube from you. Heal: restore up to 100 hit points split among creatures of your choice in the cube. Repair: damaged objects wholly inside are mended. Dispel: spells of 6th level or lower end on creatures and objects of your choice in the cube. Once per long rest, or spend 7 sorcery points to use it again.", { action: "action" }]
  ]},
  "lunar-sorcery": { source: "DSotDQ", features: [
    [1, "Moon Fire", "You learn sacred flame (not counted against cantrips known). When you cast it you can target one creature as normal or two creatures within 5 feet of each other."],
    [1, "Lunar Embodiment", "You learn the Lunar Spells for your level (all three phases; not counted against spells known). After each long rest choose a phase: Full Moon, New Moon, or Crescent Moon. You can cast that phase's 1st-level Lunar spell once without a slot, regaining the use on a long rest."],
    [6, "Lunar Boons", "When you apply Metamagic to a spell of your current phase's schools (Full Moon: abjuration, divination; New Moon: enchantment, necromancy; Crescent Moon: illusion, transmutation), you can lower the sorcery point cost by 1 (minimum 0). Uses equal to your proficiency bonus per long rest."],
    [6, "Waxing and Waning", "As a bonus action, spend 1 sorcery point to switch your phase. You can now cast the 1st-level Lunar spell of each phase once without a slot while in that phase, regaining these uses on a long rest.", { action: "bonus" }],
    [14, "Lunar Empowerment", "Full Moon: as a bonus action shed bright light 10 feet and dim light 10 more (or douse it); you and creatures of your choice have advantage on Intelligence (Investigation) and Wisdom (Perception) checks in that bright light. New Moon: advantage on Dexterity (Stealth) checks, and while entirely in darkness, attack rolls against you have disadvantage. Crescent Moon: resistance to necrotic and radiant damage."],
    [18, "Lunar Phenomenon", "Bonus action (or right after you switch phase with Waxing and Waning). Full Moon: creatures of your choice within 30 feet make a Constitution save or are blinded until the end of their next turn, and one creature of your choice there regains 3d8 hit points. New Moon: creatures of your choice within 30 feet make a Dexterity save or take 3d10 necrotic damage and have speed 0 until the end of their next turn; you can also turn invisible until the end of your next turn or until you attack or cast a spell. Crescent Moon: teleport up to 60 feet to an unoccupied space you can see, optionally bringing one willing creature within 5 feet; you both resist all damage until the start of your next turn. Once per long rest, or spend 5 sorcery points to use it again.", { action: "bonus" }]
  ]},
  // VERIFY: Runechild is the 2022 Tal'Dorei Campaign Setting Reborn revision, assembled from secondary sources
  // (no book text was available). Check the light radius, the Glyph of Aegis ally cost/duration, and Arcane Exemplar's duration and end penalty.
  runechild: { source: "TDCSR", features: [
    [1, "Essence Runes", "You can hold charged runes up to your sorcerer level. At the end of a turn in which you spend sorcery points, you gain that many charged runes; or, as a bonus action, spend 1 sorcery point to gain 2 charged runes. While you have 5 or more charged runes you glow. All charged runes fade when you finish a long rest.", { action: "bonus" }],
    [1, "Runic Magic", "You learn the Runechild spells at 1st, 3rd, 5th, 7th, and 9th level; they don't count against spells known. When you gain a sorcerer level you can swap one for an abjuration or transmutation spell of the same level from the sorcerer, warlock, or wizard list."],
    [1, "Glyph of Aegis", "Reaction when you take damage: expend any number of charged runes and roll a d6 per rune (d8 from 14th level), reducing the damage by the total.", { action: "reaction" }],
    [6, "Glyph of Aegis (Ally)", "As an action, expend 3 charged runes to place your Glyph of Aegis protection on a creature you touch for 1 hour or until it takes damage; it doesn't stack with itself.", { action: "action" }], // VERIFY rune cost
    [6, "Sigilic Augmentation", "Reaction: expend 1 charged rune to gain advantage on a Strength, Dexterity, or Constitution ability check. Once per long rest you can use it on a saving throw of those abilities instead.", { action: "reaction" }],
    [6, "Manifest Inscriptions", "Action: expend 1 charged rune to reveal hidden magical traps, marks, glyphs, wards, and sensors within 60 feet for 1 minute; you have advantage on Intelligence (Arcana) checks about them and can read them regardless of language.", { action: "action" }],
    [14, "Runic Torrent", "When you cast a damaging spell, expend 2 charged runes to change its damage to force; each target makes a Strength save against your spell save DC or is knocked prone or pushed 15 feet (your choice). Once per short or long rest."],
    [18, "Arcane Exemplar", "Bonus action: expend 1 charged rune to transform until the end of your next turn, extending it by spending 1 rune at the start of each later turn. You gain a 60-foot flying speed, resist damage from spells, regain hit points equal to the level of each spell of 1st level or higher you cast, and creatures have disadvantage on saves against your sorcerer spells. When it ends you are stunned until the end of your next turn. Once per long rest.", { action: "bonus" }] // VERIFY duration and end penalty
  ]},

  // ---------------------------------------------------------------- WARLOCK (patron at 1st; features at 1/6/10/14)
  archfey: { source: "PHB", features: [
    [1, "Fey Presence", "Action: each creature in a 10-foot cube from you makes a Wisdom save against your warlock spell save DC or is charmed or frightened by you (your choice) until the end of your next turn. Once per short or long rest.", { action: "action" }],
    [6, "Misty Escape", "Reaction when you take damage: become invisible and teleport to an unoccupied spot you can see within 60 feet. The invisibility lasts until the start of your next turn and ends early if you attack or cast a spell. Once per short or long rest.", { action: "reaction" }],
    [10, "Beguiling Defenses", "You can't be charmed. When a creature tries to charm you, use your reaction to turn it back: the creature makes a Wisdom save against your spell save DC or is charmed by you for 1 minute or until it takes damage.", { action: "reaction" }],
    [14, "Dark Delirium", "Action: a creature you can see within 60 feet makes a Wisdom save against your spell save DC or is charmed or frightened by you (your choice) for 1 minute or until your concentration breaks, ending early if it takes damage. While affected it perceives only you, itself, and an illusory misty realm. Once per short or long rest.", { action: "action" }]
  ]},
  fiend: { source: "PHB", features: [
    [1, "Dark One's Blessing", "When you reduce a hostile creature to 0 hit points, gain temporary hit points equal to your Charisma modifier + your warlock level (minimum 1)."],
    [6, "Dark One's Own Luck", "When you make an ability check or saving throw, add a d10 to it, deciding after you see the roll but before its effects. Once per short or long rest."],
    [10, "Fiendish Resilience", "After a short or long rest, pick a damage type to resist until you pick another. Magical and silvered weapons ignore this resistance."],
    [14, "Hurl Through Hell", "When you hit a creature with an attack, you can banish it through the lower planes until the end of your next turn, when it returns to its space or the nearest free one. A non-fiend takes 10d10 psychic damage. Once per long rest."]
  ]},
  "great-old-one": { source: "PHB", features: [
    [1, "Awakened Mind", "You can speak telepathically to any creature you can see within 30 feet. You don't need a shared language, but it must understand at least one language."],
    [6, "Entropic Ward", "Reaction when a creature makes an attack roll against you: impose disadvantage. If the attack misses, your next attack roll against that creature before the end of your next turn has advantage. Once per short or long rest.", { action: "reaction" }],
    [10, "Thought Shield", "Telepathy and other magic can't read your thoughts unless you allow it. You resist psychic damage, and a creature that deals psychic damage to you takes the same amount you take."],
    [14, "Create Thrall", "Action: touch an incapacitated humanoid to charm it until remove curse is cast on it, the charmed condition is removed, or you use this feature again. You can talk to it telepathically while you're on the same plane.", { action: "action" }]
  ]},
  celestial: { source: "XGE", features: [
    [1, "Bonus Cantrips", "You learn light and sacred flame; they are warlock cantrips for you and don't count against cantrips known."],
    [1, "Healing Light", "You have a pool of d6s equal to 1 + your warlock level. As a bonus action, heal one creature you can see within 60 feet by spending dice from the pool (at most your Charisma modifier, minimum 1, at once) and restoring the total rolled. The pool refills on a long rest.", { action: "bonus" }],
    [6, "Radiant Soul", "You resist radiant damage. When you cast a spell that deals radiant or fire damage, add your Charisma modifier to one radiant or fire damage roll of that spell against one target."],
    [10, "Celestial Resilience", "When you finish a short or long rest you gain temporary hit points equal to your warlock level + your Charisma modifier, and up to five creatures you can see each gain half your warlock level + your Charisma modifier."],
    [14, "Searing Vengeance", "When you would make a death saving throw at the start of your turn, you can instead regain half your hit point maximum and stand up if you wish. Creatures of your choice within 30 feet take 2d8 + your Charisma modifier radiant damage and are blinded until the end of the current turn. Once per long rest."]
  ]},
  hexblade: { source: "XGE", features: [
    [1, "Hexblade's Curse", "Bonus action: curse a creature you can see within 30 feet for 1 minute (ends early if it dies, you die, or you're incapacitated). You add your proficiency bonus to damage rolls against it, your attacks against it crit on a 19 or 20, and if it dies you regain hit points equal to your warlock level + your Charisma modifier (minimum 1). Once per short or long rest.", { action: "bonus" }],
    [1, "Hex Warrior", "You gain proficiency with medium armor, shields, and martial weapons. After each long rest, touch one weapon you're proficient with that lacks the two-handed property; until your next long rest you can use Charisma instead of Strength or Dexterity for its attack and damage rolls. With Pact of the Blade this applies to every pact weapon you conjure, of any type."],
    [6, "Accursed Specter", "When you slay a humanoid, you can raise its spirit as a specter with temporary hit points equal to half your warlock level. It rolls its own initiative, obeys your verbal commands, adds your Charisma modifier (minimum +0) to its attack rolls, and departs at the end of your next long rest. Once per long rest."],
    [10, "Armor of Hexes", "When the target of your Hexblade's Curse hits you with an attack roll, use your reaction to roll a d6; on a 4 or higher the attack misses you instead.", { action: "reaction" }],
    [14, "Master of Hexes", "When the target of your Hexblade's Curse dies, you can move the curse to another creature you can see within 30 feet if you aren't incapacitated; you don't regain hit points from the first creature's death when you do."]
  ]},
  fathomless: { source: "TCE", features: [
    [1, "Tentacle of the Deeps", "Bonus action: summon a 10-foot spectral tentacle at a point you can see within 60 feet for 1 minute or until you summon another. When it appears, and as a bonus action when you move it up to 30 feet, make a melee spell attack against a creature within 10 feet of it: 1d8 cold damage (2d8 at 10th level) and its speed drops by 10 feet until the start of your next turn. Uses equal to your proficiency bonus per long rest.", { action: "bonus" }],
    [1, "Gift of the Sea", "You gain a 40-foot swimming speed and can breathe underwater."],
    [6, "Oceanic Soul", "You resist cold damage. While fully submerged, you and any other fully submerged creature can understand each other's speech."],
    [6, "Guardian Coil", "Reaction when you or a creature you can see takes damage within 10 feet of your tentacle: reduce that damage by 1d8 (2d8 at 10th level).", { action: "reaction" }],
    [10, "Grasping Tentacles", "You learn black tentacles (a warlock spell that doesn't count against spells known) and can cast it once without a slot per long rest. Whenever you cast it you gain temporary hit points equal to your warlock level, and damage can't break your concentration on it."],
    [14, "Fathomless Plunge", "Action: you and up to five willing creatures you can see within 30 feet teleport up to 1 mile to a body of water you've seen (pond-sized or larger) or within 30 feet of it, each arriving within 30 feet of you. Once per short or long rest.", { action: "action" }]
  ]},
  genie: { source: "TCE", features: [
    [1, "Genie's Vessel", "Choose a genie kind (dao, djinni, efreeti, or marid). Your patron gives you a Tiny vessel usable as a spellcasting focus, with AC equal to your spell save DC, hit points equal to your warlock level + proficiency bonus, and immunity to poison and psychic damage; a lost vessel is replaced by a 1-hour ceremony during a rest. Bottled Respite: as an action, enter the vessel's extradimensional space (20-foot radius, 20 feet high) for up to twice your proficiency bonus in hours; leave early as a bonus action. Once per long rest. Genie's Wrath: once per turn when you hit with an attack roll, deal extra damage equal to your proficiency bonus (dao bludgeoning, djinni thunder, efreeti fire, marid cold).", { action: "action" }],
    [1, "Expanded Spell List", "Besides the shared Genie list, your kind adds: dao sanctuary, spike growth, meld into stone, stone shape, wall of stone; djinni thunderwave, gust of wind, wind wall, greater invisibility, seeming; efreeti burning hands, scorching ray, fireball, fire shield, flame strike; marid fog cloud, blur, sleet storm, control water, cone of cold."],
    [6, "Elemental Gift", "You resist your kind's damage type (dao bludgeoning, djinni thunder, efreeti fire, marid cold). As a bonus action you gain a 30-foot flying speed and can hover for 10 minutes; uses equal to your proficiency bonus per long rest.", { action: "bonus" }],
    [10, "Sanctuary Vessel", "Bottled Respite can bring up to five willing creatures you can see within 30 feet into the vessel; you can eject any of them as a bonus action, and all leave when you do. Anyone who stays inside at least 10 minutes gains the benefit of a short rest and adds your proficiency bonus to hit points regained from Hit Dice spent there."],
    [14, "Limited Wish", "Action: ask your vessel for the effect of any spell of 6th level or lower with a casting time of 1 action, from any class list, ignoring all requirements including costly components. Afterward, not again until you finish 1d4 long rests.", { action: "action" }]
  ]},
  undying: { source: "SCAG", features: [
    [1, "Among the Dead", "You learn spare the dying (a warlock cantrip) and have advantage on saves against disease. An undead that targets you directly with an attack or harmful spell must succeed on a Wisdom save against your spell save DC or choose another target or lose the attack or spell; a success, or your attacking or harming it, makes it immune for 24 hours. Area effects aren't affected."],
    [6, "Defy Death", "When you succeed on a death saving throw or stabilize a creature with spare the dying, regain 1d8 + your Constitution modifier hit points (minimum 1). Once per long rest."],
    [10, "Undying Nature", "You can hold your breath indefinitely and need no food, water, or sleep, though you still rest to recover and reduce exhaustion. You age 1 year for every 10 and can't be magically aged."],
    [14, "Indestructible Life", "Bonus action: regain 1d8 + your warlock level hit points; a severed body part held in place reattaches. Once per short or long rest.", { action: "bonus" }]
  ]},
  undead: { source: "VRGtR", features: [
    [1, "Form of Dread", "Bonus action: transform for 1 minute, gaining 1d10 + your warlock level temporary hit points and immunity to being frightened. Once per turn when you hit a creature with an attack roll, it makes a Wisdom save against your spell save DC or is frightened of you until the end of your next turn. Uses equal to your proficiency bonus per long rest.", { action: "bonus" }],
    [6, "Grave Touched", "You don't need to eat, drink, or breathe. Once per turn when you hit with an attack roll and roll damage, you can change the damage type to necrotic; in Form of Dread, that necrotic damage rolls one extra die."],
    [10, "Necrotic Husk", "You resist necrotic damage, or are immune to it while in Form of Dread. Reaction when you're reduced to 0 hit points: drop to 1 instead, and creatures of your choice within 30 feet take 2d10 + your warlock level necrotic damage; you then gain 1 level of exhaustion. Afterward, not again until you finish 1d4 long rests.", { action: "reaction" }],
    [14, "Spirit Projection", "Action: leave your body unconscious and project your spirit for up to 1 hour or until your concentration breaks; damage to either affects both, and at the end your spirit returns or your body teleports to it. While projected: resistance to bludgeoning, piercing, and slashing; conjuration and necromancy spells need no verbal, somatic, or costless material components; flying speed equal to walking speed with hover; move through creatures and objects as difficult terrain (1d10 force damage if you end a turn inside one); in Form of Dread, once per turn regain hit points equal to half the necrotic damage you deal. Once per long rest.", { action: "action" }]
  ]},

  // ---------------------------------------------------------------- WIZARD (tradition at 2nd; features at 2/6/10/14)
  abjuration: { source: "PHB", features: [
    [2, "Abjuration Savant", "Copying an abjuration spell into your spellbook costs half the gold and time."],
    [2, "Arcane Ward", "When you cast an abjuration spell of 1st level or higher, you can create a ward on yourself that lasts until a long rest, with a hit point maximum of twice your wizard level + your Intelligence modifier. Damage to you hits the ward first; overflow reaches you. Each abjuration spell of 1st level or higher you cast restores twice its level in ward hit points. You can create the ward once per long rest."],
    [6, "Projected Ward", "Reaction when a creature you can see within 30 feet takes damage: your Arcane Ward absorbs it instead, with any excess going to that creature.", { action: "reaction" }],
    [10, "Improved Abjuration", "When an abjuration spell has you make an ability check (such as counterspell or dispel magic), add your proficiency bonus to it."],
    [14, "Spell Resistance", "You have advantage on saving throws against spells and resistance to damage from spells."]
  ]},
  conjuration: { source: "PHB", features: [
    [2, "Conjuration Savant", "Copying a conjuration spell into your spellbook costs half the gold and time."],
    [2, "Minor Conjuration", "Action: create a nonmagical object you have seen, no more than 3 feet on a side and 10 pounds, in your hand or an open space within 10 feet. It sheds dim light 5 feet and vanishes after 1 hour, when you use this again, or if it takes or deals damage.", { action: "action" }],
    [6, "Benign Transposition", "Action: teleport up to 30 feet to an unoccupied space you can see, or swap places with a willing Small or Medium creature in range. Usable again after a long rest or after you cast a conjuration spell of 1st level or higher.", { action: "action" }],
    [10, "Focused Conjuration", "Taking damage can't break your concentration on a conjuration spell."],
    [14, "Durable Summons", "Creatures you summon or create with a conjuration spell have 30 temporary hit points."]
  ]},
  divination: { source: "PHB", features: [
    [2, "Divination Savant", "Copying a divination spell into your spellbook costs half the gold and time."],
    [2, "Portent", "After each long rest, roll two d20s and record them. You can replace any attack roll, saving throw, or ability check made by you or a creature you can see with one of these, declared before the roll; once per turn, each number used once. Unused numbers are lost on your next long rest."],
    [6, "Expert Divination", "When you cast a divination spell of 2nd level or higher with a slot, regain one spent slot of a lower level than that spell, no higher than 5th."],
    [10, "The Third Eye", "Action: gain one benefit until you're incapacitated or take a short or long rest: darkvision 60 feet; see into the Ethereal Plane within 60 feet; read any language; or see invisible creatures and objects within 10 feet in line of sight. Not again until you finish a rest.", { action: "action" }],
    [14, "Greater Portent", "Portent gives you three d20s instead of two."]
  ]},
  enchantment: { source: "PHB", features: [
    [2, "Enchantment Savant", "Copying an enchantment spell into your spellbook costs half the gold and time."],
    [2, "Hypnotic Gaze", "Action: a creature within 5 feet that can see or hear you makes a Wisdom save against your wizard spell save DC or is charmed until the end of your next turn, with speed 0 and incapacitated. Spend your action each turn to extend it; it ends if you move more than 5 feet away, it can't see or hear you, or it takes damage. After it ends (or the creature saves), not on that creature again until your long rest.", { action: "action" }],
    [6, "Instinctive Charm", "Reaction when a creature you can see within 30 feet attacks you and another creature is within the attack's range: it makes a Wisdom save against your spell save DC or must attack the creature closest to it (not you or itself). Decide before knowing the result. On a success you can't use this on it again until a long rest; creatures immune to charm are unaffected.", { action: "reaction" }],
    [10, "Split Enchantment", "An enchantment spell of 1st level or higher that targets only one creature can target a second creature."],
    [14, "Alter Memories", "When you charm creatures with an enchantment spell, one of them can remain unaware it was charmed. Once before the spell ends, use an action to make it forget time spent charmed: on a failed Intelligence save against your spell save DC it loses up to 1 + your Charisma modifier hours (minimum 1), no more than the spell's duration.", { action: "action" }]
  ]},
  evocation: { source: "PHB", features: [
    [2, "Evocation Savant", "Copying an evocation spell into your spellbook costs half the gold and time."],
    [2, "Sculpt Spells", "When you cast an evocation spell affecting creatures you can see, choose up to 1 + the spell's level of them; they automatically succeed on their saves and take no damage where a success would halve it."],
    [6, "Potent Cantrip", "A creature that succeeds on a save against your cantrip still takes half its damage, but none of its other effects."],
    [10, "Empowered Evocation", "Add your Intelligence modifier to one damage roll of any wizard evocation spell you cast."],
    [14, "Overchannel", "When you cast a damaging wizard spell of 1st through 5th level, you can deal its maximum damage. The first use after a long rest is safe; each later use before a long rest deals you 2d12 necrotic damage per spell level, increasing by 1d12 per level with each further use. This damage ignores resistance and immunity."]
  ]},
  illusion: { source: "PHB", features: [
    [2, "Illusion Savant", "Copying an illusion spell into your spellbook costs half the gold and time."],
    [2, "Improved Minor Illusion", "You learn minor illusion if you don't know it (it doesn't count against cantrips known), and one casting can create both a sound and an image."],
    [6, "Malleable Illusions", "While you can see an illusion spell of yours with a duration of 1 minute or longer, you can use an action to change its nature within the spell's normal limits.", { action: "action" }],
    [10, "Illusory Self", "Reaction when a creature makes an attack roll against you: an illusory double takes the hit and the attack automatically misses. Once per short or long rest.", { action: "reaction" }],
    [14, "Illusory Reality", "When you cast an illusion spell of 1st level or higher, choose one inanimate, nonmagical object in it and make it real for 1 minute; you can also do this as a bonus action on a later turn while the spell lasts. The object can't deal damage or directly harm anyone.", { action: "bonus" }]
  ]},
  necromancy: { source: "PHB", features: [
    [2, "Necromancy Savant", "Copying a necromancy spell into your spellbook costs half the gold and time."],
    [2, "Grim Harvest", "Once per turn when a spell of 1st level or higher kills one or more creatures, regain hit points equal to twice the spell's level, or three times for a necromancy spell. Constructs and undead don't count."],
    [6, "Undead Thralls", "Animate dead joins your spellbook if absent. Casting it animates one extra corpse or pile of bones. Undead you create with necromancy spells gain extra hit points equal to your wizard level and add your proficiency bonus to their weapon damage rolls."],
    [10, "Inured to Undeath", "You resist necrotic damage, and your hit point maximum can't be reduced."],
    [14, "Command Undead", "Action: an undead you can see within 60 feet makes a Charisma save against your wizard spell save DC. On a failure it is friendly and obeys you until you use this again; on a success you can't try again on it. An undead with Intelligence 8 or higher saves with advantage, and one with Intelligence 12 or higher repeats the save every hour until it breaks free.", { action: "action" }]
  ]},
  transmutation: { source: "PHB", features: [
    [2, "Transmutation Savant", "Copying a transmutation spell into your spellbook costs half the gold and time."],
    [2, "Minor Alchemy", "Turn an object made wholly of wood, stone (not gemstone), iron, copper, or silver into another of those materials, up to 1 cubic foot per 10 minutes of work. It reverts after 1 hour or if your concentration breaks."],
    [6, "Transmuter's Stone", "Spend 8 hours to make a stone granting its holder one benefit you pick: darkvision 60 feet; +10 feet speed while unencumbered; proficiency in Constitution saves; or resistance to acid, cold, fire, lightning, or thunder (pick one). Casting a transmutation spell of 1st level or higher while carrying it lets you change the benefit. Making a new stone ends the old one."],
    [10, "Shapechanger", "Polymorph joins your spellbook if absent. You can cast it on yourself only, without a slot, into a beast of challenge rating 1 or lower. Once per short or long rest; normal casting is unaffected."],
    [14, "Master Transmuter", "Action: consume your transmuter's stone for one effect: transmute a nonmagical object up to a 5-foot cube into another of similar size and mass and equal or lower value (10 minutes of handling); end all curses, diseases, and poisons on a creature you touch and restore all its hit points; cast raise dead with a touch, no slot or spellbook needed; or reduce a willing creature's apparent age by 3d10 years (minimum 13). The stone is destroyed until you make a new one.", { action: "action" }]
  ]},
  "war-magic": { source: "XGE", features: [
    [2, "Arcane Deflection", "Reaction when you are hit by an attack or fail a saving throw: +2 AC against that attack or +4 to that save. Until the end of your next turn you can cast only cantrips.", { action: "reaction" }],
    [2, "Tactical Wit", "Add your Intelligence modifier to initiative rolls."],
    [6, "Power Surge", "You can hold power surges up to your Intelligence modifier (minimum 1). You reset to one after a long rest, gain one when you end a spell with counterspell or dispel magic, and gain one if you finish a short rest with none. Once per turn when a wizard spell damages a creature or object, spend a surge to add force damage equal to half your wizard level."],
    [10, "Durable Magic", "While concentrating on a spell you gain +2 to AC and to all saving throws."],
    [14, "Deflecting Shroud", "When you use Arcane Deflection, up to three creatures of your choice you can see within 60 feet take force damage equal to half your wizard level."]
  ]},
  bladesinging: { source: "TCE", features: [
    [2, "Training in War and Song", "You gain proficiency with light armor, one type of one-handed melee weapon of your choice, and the Performance skill if you lack it."],
    [2, "Bladesong", "Bonus action: for 1 minute gain AC and a bonus to Constitution saves to keep concentration equal to your Intelligence modifier (minimum +1), +10 feet walking speed, and advantage on Dexterity (Acrobatics) checks. It ends early if you're incapacitated, don medium or heavy armor or a shield, or attack with a weapon using two hands; you can end it any time. Not usable in medium or heavy armor or with a shield. Uses equal to your proficiency bonus per long rest.", { action: "bonus" }],
    [6, "Extra Attack", "You attack twice when you take the Attack action, and can replace one of the attacks with casting a cantrip."],
    [10, "Song of Defense", "Reaction when you take damage during your Bladesong: spend a spell slot to reduce the damage by five times the slot's level.", { action: "reaction" }],
    [14, "Song of Victory", "During your Bladesong, add your Intelligence modifier (minimum +1) to the damage of your melee weapon attacks."]
  ]},
  "order-of-scribes": { source: "TCE", features: [
    [2, "Wizardly Quill", "Bonus action: create a Tiny quill that writes without ink in any color. With it, copying a spell into your spellbook takes 2 minutes per spell level, and you can erase its writing within 5 feet as a bonus action. It vanishes if you create another or die.", { action: "bonus" }],
    [2, "Awakened Spellbook", "Your spellbook is a spellcasting focus. When you cast a wizard spell with a slot, you can swap its damage type for one found in another spellbook spell of the slot's level. Once per long rest, you can cast a wizard ritual at its normal casting time instead of adding 10 minutes."],
    [6, "Manifest Mind", "Bonus action: manifest your spellbook's mind as a Tiny spectral object within 60 feet that sheds dim light 10 feet, has darkvision 60 feet, and lets you see and hear through it. You can move it up to 30 feet as a bonus action, and cast wizard spells as if from its space a number of times equal to your proficiency bonus per long rest. It ends beyond 300 feet, if dispelled, if the book is destroyed, if you die, or when you dismiss it. Once per long rest, or spend a spell slot to manifest it again.", { action: "bonus" }],
    [10, "Master Scrivener", "After a long rest, use your quill to copy a 1st- or 2nd-level spellbook spell with a 1-action casting time onto blank paper; it casts as one level higher, only you can read it, and it vanishes when cast or at your next long rest. Normal spell scrolls cost you half the gold and time when crafted with your quill."],
    [14, "One with the Word", "You have advantage on Intelligence (Arcana) checks. Reaction when you take damage while the mind is manifested: dismiss it to negate the damage, then roll 3d6; your spellbook loses spells whose levels total at least that roll (if it can't, you drop to 0 hit points) for 1d6 long rests. Once per long rest.", { action: "reaction" }]
  ]},
  chronurgy: { source: "EGtW", features: [
    [2, "Chronal Shift", "Reaction after a creature you can see within 30 feet makes an attack roll, ability check, or saving throw, once you know whether it succeeded: force a reroll and the new result stands. Twice per long rest.", { action: "reaction" }],
    [2, "Temporal Awareness", "Add your Intelligence modifier to initiative rolls."],
    [6, "Momentary Stasis", "Action: a Large or smaller creature you can see within 60 feet makes a Constitution save against your spell save DC or is incapacitated with speed 0 until the end of your next turn or until it takes damage. Uses equal to your Intelligence modifier (minimum 1) per long rest.", { action: "action" }],
    [10, "Arcane Abeyance", "When you cast a spell with a slot of 4th level or lower, you can store it in a Tiny bead (AC 15, 1 hit point, immune to poison and psychic damage) for 1 hour. A creature holding it can release the spell as an action, using your attack bonus and save DC. Once per short or long rest."],
    [14, "Convergent Future", "Reaction when you or a creature you can see within 60 feet makes an attack roll, ability check, or saving throw: ignore the die and declare the result the minimum needed to succeed or one less. You gain a level of exhaustion that only a long rest removes.", { action: "reaction" }]
  ]},
  graviturgy: { source: "EGtW", features: [
    [2, "Adjust Density", "Action: halve or double the weight of a Large or smaller creature or object you can see within 30 feet (Huge or smaller at 10th level) for up to 1 minute, as if concentrating. Halved: +10 feet speed, jumps twice as far, disadvantage on Strength checks and saves. Doubled: -10 feet speed, advantage on Strength checks and saves.", { action: "action" }],
    [6, "Gravity Well", "When you cast a spell on a creature, you can move it 5 feet to an unoccupied space of your choice if it is willing, your spell attack hits it, or it fails a save against the spell."],
    [10, "Violent Attraction", "Reaction when a creature you can see within 60 feet hits with a weapon attack: the target takes an extra 1d10 damage of the weapon's type. Or, when a creature within 60 feet takes falling damage, add 2d10 to it. Uses equal to your Intelligence modifier (minimum 1) per long rest.", { action: "reaction" }],
    [14, "Event Horizon", "Action: for up to 1 minute (as if concentrating), each hostile creature that starts its turn within 30 feet of you makes a Strength save against your spell save DC, taking 2d10 force damage and dropping to speed 0 until the start of its next turn on a failure, or half damage and 2 extra feet of cost per foot moved this turn on a success. Once per long rest, or spend a 3rd-level or higher slot to use it again.", { action: "action" }]
  ]}
});

// Always-known subclass spells (sorcerer Aberrant Mind / Clockwork Soul / Lunar etc.) by class level, index slugs from SCRATCH/spell-inventory.tsv.
// These are granted automatically and don't count against spells/cantrips known.
Object.assign(SUBCLASS_SPELLS, {
  "arcane-trickster": { 3: ["mage-hand"] },
  "shadow-magic": { 3: ["darkness"] },
  "aberrant-mind": { 1: ["arms-of-hadar", "dissonant-whispers", "mind-sliver"], 3: ["calm-emotions", "detect-thoughts"], 5: ["hunger-of-hadar", "sending"], 7: ["black-tentacles", "summon-aberration"], 9: ["telepathic-bond", "telekinesis"] },
  "clockwork-soul": { 1: ["alarm", "protection-from-evil-and-good"], 3: ["aid", "lesser-restoration"], 5: ["dispel-magic", "protection-from-energy"], 7: ["freedom-of-movement", "summon-construct"], 9: ["greater-restoration", "wall-of-force"] },
  // Lunar Embodiment teaches all three phases' spells; Moon Fire adds sacred flame.
  "lunar-sorcery": {
    1: ["sacred-flame", "shield", "ray-of-sickness", "color-spray"],
    3: ["lesser-restoration", "blindness-deafness", "alter-self"],
    5: ["dispel-magic", "vampiric-touch", "phantom-steed"],
    7: ["death-ward", "confusion", "hallucinatory-terrain"],
    9: ["telepathic-bond", "hold-monster", "mislead"]
  },
  // VERIFY: Runechild (TDCSR 2022) Runic Magic list from secondary sources.
  runechild: { 1: ["longstrider", "protection-from-evil-and-good"], 3: ["lesser-restoration", "protection-from-poison"], 5: ["glyph-of-warding", "magic-circle"], 7: ["death-ward", "freedom-of-movement"], 9: ["greater-restoration", "telekinesis"] },
  // Divine Soul's affinity spell is a choice (cure-wounds / inflict-wounds / bless / bane / protection-from-evil-and-good), so it can't be a fixed grant here.
  celestial: { 1: ["light", "sacred-flame"] },
  undying: { 1: ["spare-the-dying"] },
  fathomless: { 10: ["black-tentacles"] },
  illusion: { 2: ["minor-illusion"] }
});

// Warlock expanded spell lists (not auto-known): flat array of slugs.
Object.assign(EXPANDED_SUBCLASS_SPELLS, {
  archfey: ["faerie-fire", "sleep", "calm-emotions", "phantasmal-force", "blink", "plant-growth", "dominate-beast", "greater-invisibility", "dominate-person", "seeming"],
  fiend: ["burning-hands", "command", "blindness-deafness", "scorching-ray", "fireball", "stinking-cloud", "fire-shield", "wall-of-fire", "flame-strike", "hallow"],
  "great-old-one": ["dissonant-whispers", "hideous-laughter", "detect-thoughts", "phantasmal-force", "clairvoyance", "sending", "dominate-beast", "black-tentacles", "dominate-person", "telekinesis"],
  celestial: ["cure-wounds", "guiding-bolt", "flaming-sphere", "lesser-restoration", "daylight", "revivify", "guardian-of-faith", "wall-of-fire", "flame-strike", "greater-restoration"],
  hexblade: ["shield", "wrathful-smite", "blur", "branding-smite", "blink", "elemental-weapon", "phantasmal-killer", "staggering-smite", "banishing-smite", "cone-of-cold"],
  fathomless: ["create-or-destroy-water", "thunderwave", "gust-of-wind", "silence", "lightning-bolt", "sleet-storm", "control-water", "summon-elemental", "arcane-hand", "cone-of-cold"],
  // Genie: the shared list (1st-5th plus wish at 9th). The kind-specific spells are below; the app needs a genie-kind
  // choice to pick one of them (a subclass named "Genie (Dao)" normalizes to "genie-dao" and would match).
  genie: ["detect-evil-and-good", "phantasmal-force", "create-food-and-water", "phantasmal-killer", "creation", "wish"],
  "genie-dao": ["detect-evil-and-good", "sanctuary", "phantasmal-force", "spike-growth", "create-food-and-water", "meld-into-stone", "phantasmal-killer", "stone-shape", "creation", "wall-of-stone", "wish"],
  "genie-djinni": ["detect-evil-and-good", "thunderwave", "phantasmal-force", "gust-of-wind", "create-food-and-water", "wind-wall", "phantasmal-killer", "greater-invisibility", "creation", "seeming", "wish"],
  "genie-efreeti": ["detect-evil-and-good", "burning-hands", "phantasmal-force", "scorching-ray", "create-food-and-water", "fireball", "phantasmal-killer", "fire-shield", "creation", "flame-strike", "wish"],
  "genie-marid": ["detect-evil-and-good", "fog-cloud", "phantasmal-force", "blur", "create-food-and-water", "sleet-storm", "phantasmal-killer", "control-water", "creation", "cone-of-cold", "wish"],
  undying: ["false-life", "ray-of-sickness", "blindness-deafness", "silence", "feign-death", "speak-with-dead", "aura-of-life", "death-ward", "contagion", "legend-lore"],
  undead: ["bane", "false-life", "blindness-deafness", "phantasmal-force", "phantom-steed", "speak-with-dead", "death-ward", "greater-invisibility", "antilife-shell", "cloudkill"]
});

// trackers: (classLevel, prof) => [[name, max, "short" | "long" | "manual"]]. "manual" = no automatic refill.
// classId guards names shared across classes (barbarian "Wild Magic" normalizes to the same key).
// New field: spellSources (extra class lists the subclass may learn from) — needs a consumer in spellMatchesClass.
Object.assign(SUBCLASS_EXTRAS, {
  // Rogue
  "arcane-trickster": { trackers: level => level >= 17 ? [["Spell Thief", 1, "long"]] : [] },
  inquisitive: { trackers: level => level >= 13 ? [["Unerring Eye", Math.max(1, mod("wis")), "long"]] : [] },
  swashbuckler: { trackers: level => level >= 17 ? [["Master Duelist", 1, "short"]] : [] },
  phantom: { trackers: (level, prof) => [
    level >= 3 ? ["Wails from the Grave", prof, "long"] : null,
    level >= 9 ? ["Soul Trinkets", prof, "manual"] : null,
    level >= 13 ? ["Ghost Walk", 1, "long"] : null
  ].filter(Boolean) },
  // Psionic Energy dice: twice your proficiency bonus, all back on a long rest, one back on a short rest (Tasha's).
  soulknife: { trackers: (level, prof) => [
    level >= 3 ? ["Psionic Energy Dice", prof * 2, "long"] : null,
    level >= 3 ? ["Psionic Energy Recovery", 1, "short"] : null,
    level >= 3 ? ["Psychic Whispers (free use)", 1, "long"] : null,
    level >= 13 ? ["Psychic Veil", 1, "long"] : null,
    level >= 17 ? ["Rend Mind", 1, "long"] : null
  ].filter(Boolean) },
  // Sorcerer
  "wild-magic": { classId: "sorcerer", trackers: () => [["Tides of Chaos", 1, "long"]] },
  "divine-soul": { classId: "sorcerer", spellSources: ["cleric"], trackers: level => [
    ["Favored by the Gods", 1, "short"],
    level >= 18 ? ["Unearthly Recovery", 1, "long"] : null
  ].filter(Boolean) },
  "shadow-magic": { trackers: () => [["Strength of the Grave", 1, "long"]] },
  "storm-sorcery": { trackers: level => level >= 18 ? [["Wind Soul (share flight)", 1, "short"]] : [] },
  "aberrant-mind": { trackers: level => level >= 18 ? [["Warping Implosion", 1, "long"]] : [] },
  // Restore Balance: uses equal to your proficiency bonus, regained on a long rest (Tasha's).
  "clockwork-soul": { trackers: (level, prof) => [
    ["Restore Balance", prof, "long"],
    level >= 14 ? ["Trance of Order", 1, "long"] : null,
    level >= 18 ? ["Clockwork Cavalcade", 1, "long"] : null
  ].filter(Boolean) },
  "lunar-sorcery": { trackers: (level, prof) => [
    // One free 1st-level Lunar spell per long rest; from 6th, one per phase (three).
    ["Lunar Embodiment (free spell)", level >= 6 ? 3 : 1, "long"],
    level >= 6 ? ["Lunar Boons", prof, "long"] : null,
    level >= 18 ? ["Lunar Phenomenon", 1, "long"] : null
  ].filter(Boolean) },
  runechild: { trackers: level => [
    ["Charged Runes", level, "manual"],
    level >= 6 ? ["Sigilic Augmentation (save)", 1, "long"] : null,
    level >= 14 ? ["Runic Torrent", 1, "short"] : null,
    level >= 18 ? ["Arcane Exemplar", 1, "long"] : null
  ].filter(Boolean) },
  // Warlock
  archfey: { trackers: level => [
    ["Fey Presence", 1, "short"],
    level >= 6 ? ["Misty Escape", 1, "short"] : null,
    level >= 14 ? ["Dark Delirium", 1, "short"] : null
  ].filter(Boolean) },
  fiend: { trackers: level => [
    level >= 6 ? ["Dark One's Own Luck", 1, "short"] : null,
    level >= 14 ? ["Hurl Through Hell", 1, "long"] : null
  ].filter(Boolean) },
  "great-old-one": { trackers: level => level >= 6 ? [["Entropic Ward", 1, "short"]] : [] },
  celestial: { trackers: level => [
    ["Healing Light (d6 pool)", 1 + level, "long"],
    level >= 14 ? ["Searing Vengeance", 1, "long"] : null
  ].filter(Boolean) },
  hexblade: { armor: ["Medium armor, shields"], weapons: ["Martial weapons"], trackers: level => [
    ["Hexblade's Curse", 1, "short"],
    level >= 6 ? ["Accursed Specter", 1, "long"] : null
  ].filter(Boolean) },
  fathomless: { trackers: (level, prof) => [
    ["Tentacle of the Deeps", prof, "long"],
    level >= 10 ? ["Grasping Tentacles (free cast)", 1, "long"] : null,
    level >= 14 ? ["Fathomless Plunge", 1, "short"] : null
  ].filter(Boolean) },
  genie: { trackers: (level, prof) => [
    ["Bottled Respite", 1, "long"],
    level >= 6 ? ["Elemental Gift (flight)", prof, "long"] : null,
    // Limited Wish returns after 1d4 long rests, so it is refilled by hand.
    level >= 14 ? ["Limited Wish", 1, "manual"] : null
  ].filter(Boolean) },
  undying: { trackers: level => [
    level >= 6 ? ["Defy Death", 1, "long"] : null,
    level >= 14 ? ["Indestructible Life", 1, "short"] : null
  ].filter(Boolean) },
  undead: { trackers: (level, prof) => [
    ["Form of Dread", prof, "long"],
    // Returns after 1d4 long rests.
    level >= 10 ? ["Necrotic Husk", 1, "manual"] : null,
    level >= 14 ? ["Spirit Projection", 1, "long"] : null
  ].filter(Boolean) },
  // Wizard
  // Arcane Ward: created once per long rest; its HP live in character.arcaneWard (absorbed in dealDamage).
  abjuration: { trackers: () => [["Arcane Ward", 1, "long"]] },
  conjuration: { trackers: level => level >= 6 ? [["Benign Transposition", 1, "long"]] : [] },
  divination: { trackers: level => [
    ["Portent", level >= 14 ? 3 : 2, "long"],
    level >= 10 ? ["The Third Eye", 1, "short"] : null
  ].filter(Boolean) },
  evocation: { trackers: level => level >= 14 ? [["Overchannel (safe use)", 1, "long"]] : [] },
  illusion: { trackers: level => level >= 10 ? [["Illusory Self", 1, "short"]] : [] },
  transmutation: { trackers: level => level >= 10 ? [["Shapechanger", 1, "short"]] : [] },
  // Power Surge resets to one on a long rest (not to max), so it is tracked by hand.
  "war-magic": { trackers: level => level >= 6 ? [["Power Surge", Math.max(1, mod("int")), "manual"]] : [] },
  // Bladesong: proficiency bonus uses per long rest (Tasha's).
  bladesinging: { armor: ["Light armor"], weapons: ["One one-handed melee weapon"], skills: ["performance"], trackers: (level, prof) => [["Bladesong", prof, "long"]] },
  "order-of-scribes": { trackers: (level, prof) => [
    ["Awakened Spellbook (quick ritual)", 1, "long"],
    level >= 6 ? ["Manifest Mind", 1, "long"] : null,
    level >= 6 ? ["Manifest Mind casts", prof, "long"] : null,
    level >= 14 ? ["One with the Word", 1, "long"] : null
  ].filter(Boolean) },
  chronurgy: { trackers: level => [
    ["Chronal Shift", 2, "long"],
    level >= 6 ? ["Momentary Stasis", Math.max(1, mod("int")), "long"] : null,
    level >= 10 ? ["Arcane Abeyance", 1, "short"] : null
  ].filter(Boolean) },
  graviturgy: { trackers: level => [
    level >= 10 ? ["Violent Attraction", Math.max(1, mod("int")), "long"] : null,
    level >= 14 ? ["Event Horizon", 1, "long"] : null
  ].filter(Boolean) }
});


ADDED_SUBCLASSES.forEach(([index, name, classIndex, className, flavor, source]) => {
  if (!OFFICIAL_SUBCLASS_FALLBACK.some(item => item.index === index)) {
    OFFICIAL_SUBCLASS_FALLBACK.push({ ...officialSubclass(index, name, classIndex, className, flavor), source });
  }
});
OFFICIAL_SUBCLASS_FALLBACK.forEach(item => { item.source = item.source || SUBCLASS_FEATURES[item.index]?.source || ""; });
