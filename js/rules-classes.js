// Base class features (CLASS_FEATURE_DETAILS) and the options players pick from (CLASS_OPTIONS: fighting styles,
// invocations, metamagic, maneuvers, infusions, rites, and the per-level "known" progressions), 2014 rules.
// Summaries are original mechanical paraphrases; the full text is in the books.
const CLASS_FEATURE_DETAILS = {};
const CLASS_OPTIONS = {};

// Base class features, 2014 rules. [level, name, original summary, optional meta]
// meta.source: "PHB" (Player's Handbook 2014), "TCE" (Tasha's artificer), "TCE-optional" (Tasha's optional class
// features; the summary says what they replace, if anything), "BH" (Blood Hunter, current D&D Beyond revision).
// Subclass features are only placeholders here; subclass data lives elsewhere.

Object.assign(CLASS_FEATURE_DETAILS, {
  artificer: [
    [1, "Magical Tinkering", "With thieves' tools or artisan's tools in hand, use an action to give a Tiny nonmagical object one property: bright light in a 5-ft radius plus dim light 5 ft beyond; a recorded message of up to 6 seconds that plays when tapped; a constant odor or nonverbal sound noticeable within 10 ft; or a fixed image or up to 25 words of text on one surface. You can keep a number of objects enchanted equal to your INT modifier (min 1); making one more ends the oldest, and an action ends one early.", { action: "action", uses: "INT modifier (min 1) objects at a time", source: "TCE" }],
    [1, "Spellcasting", "Intelligence-based prepared half caster that gains slots from 1st level and rounds up for multiclassing. Each long rest, prepare INT modifier + half artificer level (rounded down, min 1) spells; you must hold thieves' tools, any artisan's tool, or an infused item as your focus. Ritual casting for prepared ritual spells. Cantrips known: 2, rising to 3 at 10th and 4 at 14th.", { action: "special", source: "TCE" }],
    [2, "Infuse Item", "Learn 4 infusions (6 at 6th, 8 at 10th, 10 at 14th, 12 at 18th). After a long rest, touch nonmagical objects to make them magic items with infusions you know; an object holds one infusion and each infusion can be on only one object at a time. Maximum infused items at once: 2 (3 at 6th, 4 at 10th, 5 at 14th, 6 at 18th); exceeding it ends the oldest. You can swap one known infusion each time you gain an artificer level.", { action: "special", uses: "2 infused items (3/4/5/6 at 6th/10th/14th/18th)", recharge: "long", source: "TCE" }],
    [3, "Artificer Specialist", "Choose a specialization (Alchemist, Armorer, Artillerist, or Battle Smith); it grants features at 3rd, 5th, 9th, and 15th level.", { action: "passive", source: "TCE" }],
    [3, "The Right Tool for the Job", "With thieves' tools or artisan's tools in hand, spend 1 hour of uninterrupted work (can overlap a short or long rest) to make one set of nonmagical artisan's tools appear in an unoccupied space within 5 ft. They vanish if you use this feature again.", { action: "special", source: "TCE" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "TCE" }],
    [5, "Specialist Feature", "You gain a feature from your Artificer Specialist.", { action: "passive", source: "TCE" }],
    [6, "Tool Expertise", "Your proficiency bonus is doubled for any ability check that uses a tool you're proficient with.", { action: "passive", source: "TCE" }],
    [6, "Infuse Item Improvement", "Infusions known rise to 6 and maximum infused items to 3.", { action: "passive", source: "TCE" }],
    [7, "Flash of Genius", "Reaction when you or a creature you can see within 30 ft makes an ability check or saving throw: add your INT modifier to the roll.", { action: "reaction", uses: "INT modifier (min 1) per long rest", recharge: "long", source: "TCE" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "TCE" }],
    [9, "Specialist Feature", "You gain a feature from your Artificer Specialist.", { action: "passive", source: "TCE" }],
    [10, "Magic Item Adept", "You can attune to up to 4 magic items at once. Crafting a common or uncommon magic item takes you a quarter of the normal time and half the normal gold.", { action: "passive", source: "TCE" }],
    [10, "Infuse Item Improvement", "Infusions known rise to 8 and maximum infused items to 4. Cantrips known rise to 3.", { action: "passive", source: "TCE" }],
    [11, "Spell-Storing Item", "After a long rest, touch a simple or martial weapon or a spellcasting focus and store in it one 1st- or 2nd-level artificer spell with a casting time of 1 action (it need not be prepared). Whoever holds it can use an action to produce the spell's effect using your spellcasting modifier, up to twice your INT modifier times (min 2), or until you use this feature again.", { action: "action", uses: "2 x INT modifier (min 2) casts", recharge: "long", source: "TCE" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "TCE" }],
    [14, "Magic Item Savant", "You can attune to up to 5 magic items at once, and you ignore all class, race, spell, and level requirements on attuning to or using magic items.", { action: "passive", source: "TCE" }],
    [14, "Infuse Item Improvement", "Infusions known rise to 10 and maximum infused items to 5. Cantrips known rise to 4.", { action: "passive", source: "TCE" }],
    [15, "Specialist Feature", "You gain a feature from your Artificer Specialist.", { action: "passive", source: "TCE" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "TCE" }],
    [18, "Magic Item Master", "You can attune to up to 6 magic items at once.", { action: "passive", source: "TCE" }],
    [18, "Infuse Item Improvement", "Infusions known rise to 12 and maximum infused items to 6.", { action: "passive", source: "TCE" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "TCE" }],
    [20, "Soul of Artifice", "You gain +1 to all saving throws for each magic item you're attuned to. When reduced to 0 HP but not killed outright, you can use your reaction to end one of your infusions and drop to 1 HP instead.", { action: "reaction", source: "TCE" }]
  ],

  barbarian: [
    [1, "Rage", "Bonus action; lasts 1 minute. While you aren't wearing heavy armor you gain advantage on STR checks and STR saves, +2 damage on melee weapon attacks using STR (+3 at 9th, +4 at 16th), and resistance to bludgeoning, piercing, and slashing damage, but can't cast or concentrate on spells. It ends early if you're knocked unconscious, if your turn ends without you attacking a hostile creature or taking damage since your last turn, or as a bonus action.", { action: "bonus", uses: "2 per long rest (3 at 3rd, 4 at 6th, 5 at 12th, 6 at 17th, unlimited at 20th)", recharge: "long", source: "PHB" }],
    [1, "Unarmored Defense", "While wearing no armor, your AC is 10 + DEX modifier + CON modifier. A shield still adds its bonus.", { action: "passive", source: "PHB" }],
    [2, "Reckless Attack", "On your first attack of a turn you may go reckless: your STR-based melee weapon attacks have advantage this turn, and attacks against you have advantage until your next turn starts.", { action: "special", source: "PHB" }],
    [2, "Danger Sense", "Advantage on DEX saves against visible effects like traps and spells, unless you are blinded, deafened, or incapacitated.", { action: "passive", source: "PHB" }],
    [3, "Primal Path", "Choose a path; it grants features at 3rd, 6th, 10th, and 14th level.", { action: "passive", source: "PHB" }],
    [3, "Rage (3 uses)", "You can rage 3 times per long rest.", { action: "passive", source: "PHB" }],
    [3, "Primal Knowledge", "Optional (adds to the class, replaces nothing): gain proficiency in one skill from the barbarian skill list, and one more at 10th level.", { action: "passive", source: "TCE-optional" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [5, "Extra Attack", "Taking the Attack action on your turn gives you two attacks.", { action: "passive", source: "PHB" }],
    [5, "Fast Movement", "Your speed increases by 10 ft while you aren't wearing heavy armor.", { action: "passive", source: "PHB" }],
    [6, "Path Feature", "You gain a feature from your Primal Path.", { action: "passive", source: "PHB" }],
    [6, "Rage (4 uses)", "You can rage 4 times per long rest.", { action: "passive", source: "PHB" }],
    [7, "Feral Instinct", "Advantage on initiative rolls. If you're surprised at the start of combat and not incapacitated, you can act normally on your first turn, but only if you enter your rage before doing anything else that turn.", { action: "passive", source: "PHB" }],
    [7, "Instinctive Pounce", "Optional (adds to the class, replaces nothing): as part of the bonus action you use to enter a rage, you can move up to half your speed.", { action: "bonus", source: "TCE-optional" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [9, "Brutal Critical (1 die)", "When you score a critical hit with a melee attack, roll one additional weapon damage die for the extra critical damage (2 dice at 13th, 3 dice at 17th).", { action: "passive", source: "PHB" }],
    [9, "Rage Damage +3", "Your rage damage bonus becomes +3.", { action: "passive", source: "PHB" }],
    [10, "Path Feature", "You gain a feature from your Primal Path.", { action: "passive", source: "PHB" }],
    [10, "Primal Knowledge (2nd skill)", "Optional: gain proficiency in one more skill from the barbarian skill list.", { action: "passive", source: "TCE-optional" }],
    [11, "Relentless Rage", "If you drop to 0 HP while raging and aren't killed outright, make a DC 10 CON save to drop to 1 HP instead. Each later use raises the DC by 5; the DC resets to 10 after a short or long rest.", { action: "special", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [12, "Rage (5 uses)", "You can rage 5 times per long rest.", { action: "passive", source: "PHB" }],
    [13, "Brutal Critical (2 dice)", "Roll two additional weapon damage dice on a melee critical hit.", { action: "passive", source: "PHB" }],
    [14, "Path Feature", "You gain a feature from your Primal Path.", { action: "passive", source: "PHB" }],
    [15, "Persistent Rage", "Your rage ends early only if you fall unconscious or choose to end it.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [16, "Rage Damage +4", "Your rage damage bonus becomes +4.", { action: "passive", source: "PHB" }],
    [17, "Brutal Critical (3 dice)", "Roll three additional weapon damage dice on a melee critical hit.", { action: "passive", source: "PHB" }],
    [17, "Rage (6 uses)", "You can rage 6 times per long rest.", { action: "passive", source: "PHB" }],
    [18, "Indomitable Might", "A STR check you make never totals less than your STR score; use the score instead of a lower total.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Primal Champion", "Your STR and CON scores each increase by 4, and their maximum becomes 24. Your rages are unlimited.", { action: "passive", source: "PHB" }]
  ],

  bard: [
    [1, "Spellcasting", "Charisma-based full caster with a fixed list of known spells (4 at 1st, up to 22 at 18th); swap one known spell on each bard level gained. Cantrips known: 2, rising to 3 at 4th and 4 at 10th. Ritual casting for known ritual spells; a musical instrument can be your focus.", { action: "special", source: "PHB" }],
    [1, "Bardic Inspiration (d6)", "Bonus action: a creature other than you within 60 ft that can hear you gains an inspiration die. Within the next 10 minutes it can add the die to one ability check, attack roll, or saving throw, after rolling but before the outcome is known. A creature holds only one die at a time. The die becomes d8 at 5th, d10 at 10th, and d12 at 15th.", { action: "bonus", uses: "CHA modifier (min 1)", recharge: "long", source: "PHB" }],
    [2, "Jack of All Trades", "Ability checks that don't use your proficiency bonus get half of it instead (rounded down).", { action: "passive", source: "PHB" }],
    [2, "Song of Rest (d6)", "During a short rest, you and friendly creatures who hear your performance regain an extra 1d6 HP if they spend at least one Hit Die (d8 at 9th, d10 at 13th, d12 at 17th).", { action: "passive", source: "PHB" }],
    [2, "Magical Inspiration", "Optional (adds to the class, replaces nothing): a creature holding your inspiration die that casts a spell which restores HP or deals damage can roll the die and add it to the healing or damage for one target.", { action: "passive", source: "TCE-optional" }],
    [3, "Bard College", "Choose a college; it grants features at 3rd, 6th, and 14th level.", { action: "passive", source: "PHB" }],
    [3, "Expertise", "Choose two of your skill proficiencies; your proficiency bonus is doubled for checks with them. Choose two more at 10th level.", { action: "passive", source: "PHB" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [4, "Bardic Versatility", "Optional (adds to the class, replaces nothing): whenever you gain Ability Score Improvement, you can swap one Expertise skill for another skill you're proficient in, or swap one bard cantrip for another bard cantrip.", { action: "special", source: "TCE-optional" }],
    [5, "Bardic Inspiration (d8)", "Your inspiration die becomes a d8.", { action: "passive", source: "PHB" }],
    [5, "Font of Inspiration", "You regain all expended Bardic Inspiration uses when you finish a short or long rest.", { action: "passive", recharge: "short", source: "PHB" }],
    [6, "Countercharm", "Action: until the end of your next turn, you and friendly creatures within 30 ft that can hear you have advantage on saves against being frightened or charmed. It ends early if you're incapacitated or silenced, or if you end it (no action).", { action: "action", source: "PHB" }],
    [6, "College Feature", "You gain a feature from your Bard College.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [9, "Song of Rest (d8)", "Song of Rest healing becomes 1d8.", { action: "passive", source: "PHB" }],
    [10, "Bardic Inspiration (d10)", "Your inspiration die becomes a d10.", { action: "passive", source: "PHB" }],
    [10, "Expertise", "Choose two more skill proficiencies to gain Expertise.", { action: "passive", source: "PHB" }],
    [10, "Magical Secrets", "Learn two spells of your choice from any class's list (cantrips allowed); each must be of a level you can cast. They count as bard spells and toward your spells known. You gain two more at 14th and 18th.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [13, "Song of Rest (d10)", "Song of Rest healing becomes 1d10.", { action: "passive", source: "PHB" }],
    [14, "Magical Secrets", "Learn two more spells from any class's list.", { action: "passive", source: "PHB" }],
    [14, "College Feature", "You gain a feature from your Bard College.", { action: "passive", source: "PHB" }],
    [15, "Bardic Inspiration (d12)", "Your inspiration die becomes a d12.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [17, "Song of Rest (d12)", "Song of Rest healing becomes 1d12.", { action: "passive", source: "PHB" }],
    [18, "Magical Secrets", "Learn two more spells from any class's list.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Superior Inspiration", "When you roll initiative with no Bardic Inspiration uses left, you regain one use.", { action: "passive", source: "PHB" }]
  ],

  bloodhunter: [
    [1, "Hunter's Bane", "Advantage on WIS (Survival) checks to track fey, fiends, or undead and on INT checks to recall lore about them. Your Hemocraft save DC is 8 + proficiency bonus + Hemocraft modifier (INT, or WIS with DM approval). Your hemocraft die is d4 (d6 at 5th, d8 at 11th, d10 at 17th).", { action: "passive", source: "BH" }],
    [1, "Blood Maledict", "Invoke a blood curse you know (1 known; 2 at 6th, 3 at 10th, 4 at 14th, 5 at 18th; swap one whenever you learn a new one). You may amplify it by taking necrotic damage equal to one roll of your hemocraft die, which can't be reduced; creatures without blood are immune unless the curse is amplified. Curses: Anxious, Binding, Bloated Agony, Exposure, Eyeless, Fallen Puppet, Marked, Muddled Mind (order-only: Exorcist, Corrosion, Howl, Soul Eater).", { action: "special", uses: "1 per short rest (2 at 6th, 3 at 13th, 4 at 17th)", recharge: "short", source: "BH" }],
    [2, "Fighting Style", "Choose Archery (+2 ranged attack rolls), Dueling (+2 damage with a one-handed melee weapon and no other weapon), Great Weapon Fighting (reroll 1s and 2s on two-handed or versatile melee damage dice), or Two-Weapon Fighting (add your ability modifier to the off-hand attack's damage).", { action: "passive", source: "BH" }],
    [2, "Crimson Rite", "Bonus action: activate a rite you know on a weapon you hold, taking necrotic damage equal to one roll of your hemocraft die (can't be reduced). Until you finish a short or long rest, the weapon's attacks are magical and deal an extra hemocraft die of the rite's damage type; one rite per weapon, and only you benefit. Rites: Flame (fire), Frozen (cold), Storm (lightning); from 14th also Dead (necrotic), Oracle (psychic), Roar (thunder). You know 1 rite, 2 at 7th, 3 at 14th.", { action: "bonus", source: "BH" }],
    [3, "Blood Hunter Order", "Choose an order (Ghostslayer, Lycan, Mutant, or Profane Soul); it grants features at 3rd, 7th, 11th, 15th, and 18th level.", { action: "passive", source: "BH" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "BH" }],
    [5, "Extra Attack", "Taking the Attack action on your turn gives you two attacks.", { action: "passive", source: "BH" }],
    [5, "Hemocraft Die (d6)", "Your hemocraft die becomes a d6.", { action: "passive", source: "BH" }],
    [6, "Brand of Castigation", "When you damage a creature with a weapon bearing your active crimson rite, you can brand it (no action). You know its direction while it's on your plane, and each time it deals damage to you or a creature you can see within 5 ft of you, it takes psychic damage equal to your Hemocraft modifier (min 1). The brand lasts until you dismiss it or brand another creature; dispel magic can end it as a spell of level equal to half your blood hunter level (max 9th).", { action: "special", uses: "1 per short or long rest", recharge: "short", source: "BH" }],
    [6, "Blood Maledict (2 uses)", "You can use Blood Maledict twice per short or long rest and know 2 blood curses.", { action: "passive", source: "BH" }],
    [7, "Order Feature", "You gain a feature from your Blood Hunter Order.", { action: "passive", source: "BH" }],
    [7, "Crimson Rite Improvement", "You learn a second crimson rite.", { action: "passive", source: "BH" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "BH" }],
    [9, "Grim Psychometry", "Advantage on INT (History) checks to recall the dark or tragic past of an object you're touching or of the place you're standing in.", { action: "passive", source: "BH" }],
    [10, "Dark Augmentation", "Your speed increases by 5 ft, and you add your Hemocraft modifier (min +1) to STR, DEX, and CON saving throws. You know 3 blood curses.", { action: "passive", source: "BH" }],
    [11, "Order Feature", "You gain a feature from your Blood Hunter Order.", { action: "passive", source: "BH" }],
    [11, "Hemocraft Die (d8)", "Your hemocraft die becomes a d8.", { action: "passive", source: "BH" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "BH" }],
    [13, "Brand of Tethering", "Brand of Castigation's psychic damage becomes twice your Hemocraft modifier (min 2). A branded creature can't take the Dash action, and if it tries to teleport or leave its plane it takes 4d6 psychic damage and must make a WIS save; on a failure, the attempt fails.", { action: "passive", source: "BH" }],
    [13, "Blood Maledict (3 uses)", "You can use Blood Maledict three times per short or long rest.", { action: "passive", source: "BH" }],
    [14, "Hardened Soul", "Advantage on saving throws against being charmed or frightened.", { action: "passive", source: "BH" }],
    [14, "Crimson Rite Improvement", "You learn a third crimson rite, and the Dead, Oracle, and Roar rites become available. You know 4 blood curses.", { action: "passive", source: "BH" }],
    [15, "Order Feature", "You gain a feature from your Blood Hunter Order.", { action: "passive", source: "BH" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "BH" }],
    [17, "Blood Maledict (4 uses)", "You can use Blood Maledict four times per short or long rest.", { action: "passive", source: "BH" }],
    [17, "Hemocraft Die (d10)", "Your hemocraft die becomes a d10.", { action: "passive", source: "BH" }],
    [18, "Order Feature", "You gain a feature from your Blood Hunter Order. You know 5 blood curses.", { action: "passive", source: "BH" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "BH" }],
    [20, "Sanguine Mastery", "Once per turn, when a blood hunter feature has you roll a hemocraft die, you can reroll it and use either result. When you score a critical hit with a weapon bearing your active crimson rite, you regain one expended Blood Maledict use.", { action: "passive", source: "BH" }]
  ],

  cleric: [
    [1, "Spellcasting", "Wisdom-based prepared full caster with access to the whole cleric list. Each long rest, prepare WIS modifier + cleric level spells (min 1). Cantrips known: 3, rising to 4 at 4th and 5 at 10th. Ritual casting for prepared ritual spells; a holy symbol can be your focus.", { action: "special", source: "PHB" }],
    [1, "Divine Domain", "Choose a domain; its domain spells are always prepared and don't count against your limit. It grants features at 1st, 2nd, 6th, 8th, and 17th level.", { action: "passive", source: "PHB" }],
    [2, "Channel Divinity (1/rest)", "Channel divine power for Turn Undead or a domain option. Turn Undead (action): each undead within 30 ft that can see or hear you makes a WIS save against your spell save DC or is turned for 1 minute or until it takes damage; a turned creature must move away from you, can't willingly come within 30 ft, can't take reactions, and can only Dash or try to escape (Dodge if it can't move).", { action: "action", uses: "1 per short rest (2 at 6th, 3 at 18th)", recharge: "short", source: "PHB" }],
    [2, "Domain Feature", "You gain a feature (usually a Channel Divinity option) from your Divine Domain.", { action: "passive", source: "PHB" }],
    [2, "Harness Divine Power", "Optional (adds to the class, replaces nothing): as a bonus action, spend one Channel Divinity use to regain one expended spell slot of a level no higher than half your proficiency bonus, rounded up.", { action: "bonus", uses: "1 per long rest (2 at 6th, 3 at 18th)", recharge: "long", source: "TCE-optional" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [4, "Cantrip Versatility", "Optional (adds to the class, replaces nothing): whenever you gain Ability Score Improvement, you can swap one cleric cantrip for another cleric cantrip.", { action: "special", source: "TCE-optional" }],
    [5, "Destroy Undead (CR 1/2)", "When an undead fails its save against your Turn Undead, it is destroyed outright if its challenge rating is 1/2 or lower (CR 1 at 8th, 2 at 11th, 3 at 14th, 4 at 17th).", { action: "passive", source: "PHB" }],
    [6, "Channel Divinity (2/rest)", "You can use Channel Divinity twice per short or long rest.", { action: "passive", source: "PHB" }],
    [6, "Domain Feature", "You gain a feature from your Divine Domain.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [8, "Destroy Undead (CR 1)", "Turn Undead destroys undead of CR 1 or lower.", { action: "passive", source: "PHB" }],
    [8, "Domain Feature", "You gain a feature from your Divine Domain (often Divine Strike or Potent Spellcasting).", { action: "passive", source: "PHB" }],
    [8, "Blessed Strikes", "Optional (replaces your domain's 8th-level Divine Strike or Potent Spellcasting): when a creature takes damage from your cantrip or weapon attack, you can deal it an extra 1d8 radiant damage; then you can't do so again until the start of your next turn.", { action: "special", source: "TCE-optional", choice: "blessedStrikes", replaces: ["Divine Strike", "Potent Spellcasting", "Empowered Cantrips"] }],
    [10, "Divine Intervention", "Action: describe the help you seek and roll percentile dice; if you roll at or below your cleric level, your deity intervenes. After a success you can't use this again for 7 days; after a failure you can try again after a long rest.", { action: "action", uses: "1 per long rest on a failure; 7 days after a success", recharge: "long", source: "PHB" }],
    [11, "Destroy Undead (CR 2)", "Turn Undead destroys undead of CR 2 or lower.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [14, "Destroy Undead (CR 3)", "Turn Undead destroys undead of CR 3 or lower.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [17, "Destroy Undead (CR 4)", "Turn Undead destroys undead of CR 4 or lower.", { action: "passive", source: "PHB" }],
    [17, "Domain Feature", "You gain a feature from your Divine Domain.", { action: "passive", source: "PHB" }],
    [18, "Channel Divinity (3/rest)", "You can use Channel Divinity three times per short or long rest.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Divine Intervention Improvement", "Your call for divine intervention succeeds automatically; no roll is needed.", { action: "passive", source: "PHB" }]
  ],

  druid: [
    [1, "Druidic", "You know the secret Druidic language and can leave hidden messages in it. Others notice such a message with a DC 15 WIS (Perception) check but can't read it without magic.", { action: "passive", source: "PHB" }],
    [1, "Spellcasting", "Wisdom-based prepared full caster with access to the whole druid list. Each long rest, prepare WIS modifier + druid level spells (min 1). Cantrips known: 2, rising to 3 at 4th and 4 at 10th. Ritual casting for prepared ritual spells; a druidic focus can be your focus.", { action: "special", source: "PHB" }],
    [2, "Wild Shape", "Action: transform into a beast you have seen, for up to half your druid level in hours (rounded down). Limits: CR 1/4 with no flying or swimming speed (CR 1/2 and swimming at 4th; CR 1 and flying at 8th). You use the beast's HP and stats but keep your mind; you revert as a bonus action, at 0 HP (excess damage carries over), or if unconscious or killed. You can't cast spells in beast form.", { action: "action", uses: "2 per short rest", recharge: "short", source: "PHB" }],
    [2, "Druid Circle", "Choose a circle; it grants features at 2nd, 6th, 10th, and 14th level.", { action: "passive", source: "PHB" }],
    [2, "Wild Companion", "Optional (adds to the class, replaces nothing): as an action, spend one Wild Shape use to cast find familiar without material components. The familiar is a fey and vanishes after a number of hours equal to half your druid level.", { action: "action", uses: "Spends a Wild Shape use", recharge: "short", source: "TCE-optional" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [4, "Wild Shape Improvement", "Wild Shape can now become a beast of CR 1/2 or lower, including ones with a swimming speed (still no flying speed).", { action: "passive", source: "PHB" }],
    [4, "Cantrip Versatility", "Optional (adds to the class, replaces nothing): whenever you gain Ability Score Improvement, you can swap one druid cantrip for another druid cantrip.", { action: "special", source: "TCE-optional" }],
    [6, "Circle Feature", "You gain a feature from your Druid Circle.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [8, "Wild Shape Improvement", "Wild Shape can now become a beast of CR 1 or lower, including ones with a flying speed.", { action: "passive", source: "PHB" }],
    [10, "Circle Feature", "You gain a feature from your Druid Circle.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [14, "Circle Feature", "You gain a feature from your Druid Circle.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [18, "Timeless Body", "You age only 1 year for every 10 years that pass.", { action: "passive", source: "PHB" }],
    [18, "Beast Spells", "You can cast many druid spells while in Wild Shape, supplying verbal and somatic components, but not material components.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Archdruid", "Wild Shape becomes unlimited. You can also ignore the verbal and somatic components of druid spells, and material components that have no cost and aren't consumed, in either form.", { action: "passive", source: "PHB" }]
  ],

  fighter: [
    [1, "Fighting Style", "Choose one: Archery (+2 to ranged attack rolls), Defense (+1 AC while wearing armor), Dueling (+2 damage with a melee weapon in one hand and no other weapons), Great Weapon Fighting (reroll 1s and 2s on damage dice for two-handed or versatile melee weapons used two-handed), Protection (reaction with a shield: impose disadvantage on an attack you can see against a creature other than you within 5 ft of you), or Two-Weapon Fighting (add your ability modifier to the off-hand attack's damage). Tasha's adds Blind Fighting, Interception, Superior Technique, Thrown Weapon Fighting, and Unarmed Fighting as options.", { action: "passive", source: "PHB" }],
    [1, "Second Wind", "Bonus action: regain 1d10 + your fighter level HP.", { action: "bonus", uses: "1 per short rest", recharge: "short", source: "PHB" }],
    [2, "Action Surge (one use)", "On your turn, take one additional action.", { action: "special", uses: "1 per short rest (2 at 17th, still only once per turn)", recharge: "short", source: "PHB" }],
    [3, "Martial Archetype", "Choose an archetype; it grants features at 3rd, 7th, 10th, 15th, and 18th level.", { action: "passive", source: "PHB" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [4, "Martial Versatility", "Optional (adds to the class, replaces nothing): whenever you gain Ability Score Improvement, you can swap a fighting style for another available to fighters, or, if you know maneuvers, swap one maneuver for another.", { action: "special", source: "TCE-optional" }],
    [5, "Extra Attack", "Taking the Attack action on your turn gives you two attacks.", { action: "passive", source: "PHB" }],
    [6, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [7, "Archetype Feature", "You gain a feature from your Martial Archetype.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [9, "Indomitable (one use)", "Reroll a saving throw you fail; you must use the new roll.", { action: "special", uses: "1 per long rest (2 at 13th, 3 at 17th)", recharge: "long", source: "PHB" }],
    [10, "Archetype Feature", "You gain a feature from your Martial Archetype.", { action: "passive", source: "PHB" }],
    [11, "Extra Attack (2)", "You attack three times when you take the Attack action on your turn.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [13, "Indomitable (two uses)", "You can use Indomitable twice per long rest.", { action: "passive", source: "PHB" }],
    [14, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [15, "Archetype Feature", "You gain a feature from your Martial Archetype.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [17, "Action Surge (two uses)", "You can use Action Surge twice per short or long rest, but only once per turn.", { action: "passive", source: "PHB" }],
    [17, "Indomitable (three uses)", "You can use Indomitable three times per long rest.", { action: "passive", source: "PHB" }],
    [18, "Archetype Feature", "You gain a feature from your Martial Archetype.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Extra Attack (3)", "You attack four times when you take the Attack action on your turn.", { action: "passive", source: "PHB" }]
  ],

  monk: [
    [1, "Unarmored Defense", "While wearing no armor and no shield, your AC is 10 + DEX modifier + WIS modifier.", { action: "passive", source: "PHB" }],
    [1, "Martial Arts (d4)", "While unarmed or using only monk weapons (shortswords and simple melee weapons without the two-handed or heavy property) and wearing no armor or shield: use DEX instead of STR for their attack and damage rolls, you may roll a d4 in place of their normal damage (d6 at 5th, d8 at 11th, d10 at 17th), and after taking the Attack action with them you can make one unarmed strike as a bonus action.", { action: "bonus", source: "PHB" }],
    [2, "Ki", "You have ki points equal to your monk level, all regained after a short or long rest of which at least 30 minutes is spent meditating. Ki save DC = 8 + proficiency bonus + WIS modifier. Flurry of Blows: after the Attack action, 1 ki for two unarmed strikes as a bonus action. Patient Defense: 1 ki to Dodge as a bonus action. Step of the Wind: 1 ki to Disengage or Dash as a bonus action, and your jump distance doubles this turn.", { action: "bonus", uses: "Ki points = monk level", recharge: "short", source: "PHB" }],
    [2, "Unarmored Movement", "Your speed increases by 10 ft while you wear no armor and no shield (+15 ft at 6th, +20 ft at 10th, +25 ft at 14th, +30 ft at 18th).", { action: "passive", source: "PHB" }],
    [2, "Dedicated Weapon", "Optional (adds to the class, replaces nothing): when you finish a short or long rest, touch one simple or martial weapon you're proficient with that lacks the heavy and special properties; it counts as a monk weapon for you until you use this feature again.", { action: "special", source: "TCE-optional" }],
    [3, "Monastic Tradition", "Choose a tradition; it grants features at 3rd, 6th, 11th, and 17th level.", { action: "passive", source: "PHB" }],
    [3, "Deflect Missiles", "Reaction when hit by a ranged weapon attack: reduce the damage by 1d10 + DEX modifier + monk level. If it drops to 0 and you have a free hand, you can catch the missile if it's small enough to hold, then spend 1 ki to throw it back as part of the same reaction (proficient monk-weapon attack, range 20/60 ft).", { action: "reaction", source: "PHB" }],
    [3, "Ki-Fueled Attack", "Optional (adds to the class, replaces nothing): if you spend 1 or more ki points as part of your action on your turn, you can make one attack with an unarmed strike or monk weapon as a bonus action before the turn ends.", { action: "bonus", source: "TCE-optional" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [4, "Slow Fall", "Reaction when you fall: reduce the falling damage by five times your monk level.", { action: "reaction", source: "PHB" }],
    [4, "Quickened Healing", "Optional (adds to the class, replaces nothing): as an action, spend 2 ki points and roll your Martial Arts die; regain HP equal to the roll + your proficiency bonus.", { action: "action", uses: "2 ki per use", source: "TCE-optional" }],
    [5, "Extra Attack", "Taking the Attack action on your turn gives you two attacks.", { action: "passive", source: "PHB" }],
    [5, "Stunning Strike", "When you hit with a melee weapon attack, spend 1 ki; the target makes a CON save or is stunned until the end of your next turn.", { action: "special", uses: "1 ki per use", source: "PHB" }],
    [5, "Martial Arts (d6)", "Your Martial Arts die becomes a d6.", { action: "passive", source: "PHB" }],
    [5, "Focused Aim", "Optional (adds to the class, replaces nothing): when you miss with an attack roll, spend 1 to 3 ki points to add +2 to the roll per point spent, possibly turning the miss into a hit.", { action: "special", uses: "1-3 ki per use", source: "TCE-optional" }],
    [6, "Ki-Empowered Strikes", "Your unarmed strikes are treated as magical when a creature resists or is immune to damage from nonmagical attacks.", { action: "passive", source: "PHB" }],
    [6, "Unarmored Movement (+15 ft)", "Unarmored Movement bonus becomes +15 ft.", { action: "passive", source: "PHB" }],
    [6, "Tradition Feature", "You gain a feature from your Monastic Tradition.", { action: "passive", source: "PHB" }],
    [7, "Evasion", "When an effect lets you make a DEX save for half damage, you take no damage on a success and half on a failure.", { action: "passive", source: "PHB" }],
    [7, "Stillness of Mind", "Action: end one effect on yourself that is causing you to be charmed or frightened.", { action: "action", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [9, "Unarmored Movement Improvement", "On your turn you can move along vertical surfaces and across liquids without falling during that movement.", { action: "passive", source: "PHB" }],
    [10, "Purity of Body", "You are immune to disease and poison.", { action: "passive", source: "PHB" }],
    [10, "Unarmored Movement (+20 ft)", "Unarmored Movement bonus becomes +20 ft.", { action: "passive", source: "PHB" }],
    [11, "Tradition Feature", "You gain a feature from your Monastic Tradition.", { action: "passive", source: "PHB" }],
    [11, "Martial Arts (d8)", "Your Martial Arts die becomes a d8.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [13, "Tongue of the Sun and Moon", "You comprehend all spoken languages, and anyone who knows at least one language comprehends your speech.", { action: "passive", source: "PHB" }],
    [14, "Diamond Soul", "You gain proficiency in all saving throws. When you fail a save, you can spend 1 ki to reroll it and must use the second result.", { action: "special", uses: "1 ki per reroll", source: "PHB" }],
    [14, "Unarmored Movement (+25 ft)", "Unarmored Movement bonus becomes +25 ft.", { action: "passive", source: "PHB" }],
    [15, "Timeless Body", "Old age no longer weakens you and magic can't age you, but you can still die of old age. You don't need food or water.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [17, "Tradition Feature", "You gain a feature from your Monastic Tradition.", { action: "passive", source: "PHB" }],
    [17, "Martial Arts (d10)", "Your Martial Arts die becomes a d10.", { action: "passive", source: "PHB" }],
    [18, "Empty Body", "Action, 4 ki: become invisible for 1 minute and gain resistance to all damage except force. Action, 8 ki: cast astral projection without material components, affecting only yourself.", { action: "action", uses: "4 or 8 ki per use", source: "PHB" }],
    [18, "Unarmored Movement (+30 ft)", "Unarmored Movement bonus becomes +30 ft.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Perfect Self", "When you roll initiative with no ki points remaining, you regain 4 ki points.", { action: "passive", source: "PHB" }]
  ],

  paladin: [
    [1, "Divine Sense", "Action: until the end of your next turn, you know the location and type (celestial, fiend, or undead) of such creatures within 60 ft that aren't behind total cover, and you sense any consecrated or desecrated place or object within that range.", { action: "action", uses: "1 + CHA modifier", recharge: "long", source: "PHB" }],
    [1, "Lay on Hands", "Your healing pool holds 5 x paladin level HP. Action: touch a creature and restore any number of HP from the pool, or spend 5 HP from the pool to cure one disease or neutralize one poison affecting it. No effect on undead or constructs.", { action: "action", uses: "Pool of 5 x paladin level HP", recharge: "long", source: "PHB" }],
    [2, "Fighting Style", "Choose Defense (+1 AC while wearing armor), Dueling (+2 damage with a melee weapon in one hand and no other weapons), Great Weapon Fighting (reroll 1s and 2s on two-handed or versatile two-handed melee damage dice), or Protection (reaction with a shield: impose disadvantage on an attack you can see against a creature other than you within 5 ft of you). Tasha's adds Blessed Warrior, Blind Fighting, and Interception as options.", { action: "passive", source: "PHB" }],
    [2, "Spellcasting", "Charisma-based prepared half caster with slots from 2nd level. Each long rest, prepare CHA modifier + half paladin level, rounded down (min 1). A holy symbol can be your focus. No ritual casting.", { action: "special", source: "PHB" }],
    [2, "Divine Smite", "When you hit with a melee weapon attack, expend a spell slot to deal extra radiant damage: 2d8 for a 1st-level slot plus 1d8 per slot level above 1st (max 5d8), plus 1d8 more against an undead or fiend.", { action: "special", uses: "Spends a spell slot", source: "PHB" }],
    [3, "Divine Health", "You are immune to disease.", { action: "passive", source: "PHB" }],
    [3, "Sacred Oath", "Choose an oath; it grants oath spells (always prepared), Channel Divinity options usable once per short or long rest, and features at 3rd, 7th, 15th, and 20th level.", { action: "special", uses: "Channel Divinity 1 per short rest", recharge: "short", source: "PHB" }],
    [3, "Harness Divine Power", "Optional (adds to the class, replaces nothing): as a bonus action, spend one Channel Divinity use to regain one expended spell slot of a level no higher than half your proficiency bonus, rounded up.", { action: "bonus", uses: "1 per long rest (2 at 7th, 3 at 15th)", recharge: "long", source: "TCE-optional" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [4, "Martial Versatility", "Optional (adds to the class, replaces nothing): whenever you gain Ability Score Improvement, you can swap your fighting style for another available to paladins.", { action: "special", source: "TCE-optional" }],
    [5, "Extra Attack", "Taking the Attack action on your turn gives you two attacks.", { action: "passive", source: "PHB" }],
    [6, "Aura of Protection", "While you're conscious, you and friendly creatures within 10 ft of you add your CHA modifier (min +1) to saving throws. The radius becomes 30 ft at 18th level.", { action: "passive", source: "PHB" }],
    [7, "Oath Feature", "You gain a feature from your Sacred Oath.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [10, "Aura of Courage", "While you're conscious, you and friendly creatures within 10 ft of you can't be frightened. The radius becomes 30 ft at 18th level.", { action: "passive", source: "PHB" }],
    [11, "Improved Divine Smite", "Every hit with a melee weapon deals an extra 1d8 radiant damage; it stacks with Divine Smite.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [14, "Cleansing Touch", "Action: end one spell on yourself or on one willing creature you touch.", { action: "action", uses: "CHA modifier (min 1)", recharge: "long", source: "PHB" }],
    [15, "Oath Feature", "You gain a feature from your Sacred Oath.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [18, "Aura Improvements", "Aura of Protection, Aura of Courage, and your oath's aura extend to 30 ft.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Oath Feature", "You gain your Sacred Oath's capstone feature.", { action: "passive", source: "PHB" }]
  ],

  ranger: [
    [1, "Favored Enemy", "Choose a favored enemy type (aberrations, beasts, celestials, constructs, dragons, elementals, fey, fiends, giants, monstrosities, oozes, plants, or undead) or two humanoid races. You have advantage on WIS (Survival) checks to track them and INT checks to recall information about them, and you learn one language they speak. You choose another at 6th and 14th level.", { action: "passive", source: "PHB" }],
    [1, "Favored Foe", "Optional (replaces Favored Enemy and its improvements): when you hit a creature with an attack roll, you can mark it for 1 minute (ends early if you lose concentration, as with a spell). The first time each of your turns that you hit and damage the marked creature, including the marking attack, it takes an extra 1d4 damage (1d6 at 6th, 1d8 at 14th).", { action: "special", uses: "Proficiency bonus per long rest", recharge: "long", source: "TCE-optional", choice: "favoredFoe", replaces: ["Favored Enemy", "Favored Enemy and Natural Explorer Improvements", "Favored Enemy Improvement"] }],
    [1, "Natural Explorer", "Choose a favored terrain (arctic, coast, desert, forest, grassland, mountain, swamp, or the Underdark). Your proficiency bonus is doubled on INT or WIS checks about it that use a proficient skill. Traveling there for an hour or more: difficult terrain doesn't slow your group, you can't get lost except by magic, you stay alert while doing other things, you can move stealthily at normal pace when alone, you find twice as much food when foraging, and tracking reveals the exact number, sizes, and timing of creatures. More terrains at 6th and 10th.", { action: "passive", source: "PHB" }],
    [1, "Deft Explorer: Canny", "Optional (replaces Natural Explorer and its improvements): choose one skill you're proficient in to gain expertise (double proficiency bonus), and learn two languages. Roving follows at 6th and Tireless at 10th.", { action: "passive", source: "TCE-optional", choice: "deftExplorer", replaces: ["Natural Explorer"] }],
    [2, "Fighting Style", "Choose Archery (+2 to ranged attack rolls), Defense (+1 AC while wearing armor), Dueling (+2 damage with a melee weapon in one hand and no other weapons), or Two-Weapon Fighting (add your ability modifier to the off-hand attack's damage). Tasha's adds Blind Fighting, Druidic Warrior, and Thrown Weapon Fighting as options.", { action: "passive", source: "PHB" }],
    [2, "Spellcasting", "Wisdom-based known-spells half caster with slots from 2nd level: 2 spells known at 2nd, up to 11 at 19th; swap one known spell on each ranger level gained. No cantrips and no ritual casting.", { action: "special", source: "PHB" }],
    [2, "Spellcasting Focus", "Optional (adds to the class, replaces nothing): you can use a druidic focus as a spellcasting focus for ranger spells.", { action: "passive", source: "TCE-optional" }],
    [3, "Ranger Archetype", "Choose an archetype; it grants features at 3rd, 7th, 11th, and 15th level.", { action: "passive", source: "PHB" }],
    [3, "Primeval Awareness", "Action: expend a ranger spell slot. For 1 minute per slot level, you sense whether aberrations, celestials, dragons, elementals, fey, fiends, or undead are within 1 mile (6 miles in your favored terrain), but not where they are or how many.", { action: "action", uses: "Spends a spell slot", source: "PHB" }],
    [3, "Primal Awareness", "Optional (replaces Primeval Awareness): you learn speak with animals at 3rd, beast sense at 5th, speak with plants at 9th, locate creature at 13th, and commune with nature at 17th. They are ranger spells that don't count against spells known, and you can cast each once without a slot per long rest.", { action: "action", uses: "Each spell once per long rest without a slot", recharge: "long", source: "TCE-optional", choice: "primalAwareness", replaces: ["Primeval Awareness"] }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [4, "Martial Versatility", "Optional (adds to the class, replaces nothing): whenever you gain Ability Score Improvement, you can swap your fighting style for another available to rangers.", { action: "special", source: "TCE-optional" }],
    [5, "Extra Attack", "Taking the Attack action on your turn gives you two attacks.", { action: "passive", source: "PHB" }],
    [6, "Favored Enemy and Natural Explorer Improvements", "Choose one more favored enemy (with its language) and one more favored terrain. With Favored Foe instead, its extra damage becomes 1d6.", { action: "passive", source: "PHB" }],
    [6, "Deft Explorer: Roving", "Optional (replaces the 6th-level Natural Explorer improvement): your walking speed increases by 5 ft, and you gain a climbing speed and a swimming speed equal to your walking speed.", { action: "passive", source: "TCE-optional", choice: "deftExplorer", replaces: ["Favored Enemy and Natural Explorer Improvements"] }],
    [7, "Archetype Feature", "You gain a feature from your Ranger Archetype.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [8, "Land's Stride", "Moving through mundane difficult terrain doesn't cost you extra movement, and ordinary plants neither slow you nor hurt you with thorns, spines, or similar hazards. You have advantage on saves against plants that are magically created or manipulated to impede movement.", { action: "passive", source: "PHB" }],
    [10, "Natural Explorer Improvement", "Choose one more favored terrain.", { action: "passive", source: "PHB" }],
    [10, "Hide in Plain Sight", "Spend 1 minute making camouflage. While you stay still against a solid surface at least as tall and wide as you, you gain +10 to DEX (Stealth) checks; moving or taking an action or reaction ends it until you camouflage again.", { action: "special", source: "PHB" }],
    [10, "Deft Explorer: Tireless", "Optional (replaces the 10th-level Natural Explorer improvement): as an action, gain temporary HP equal to 1d8 + WIS modifier (min 1), usable a number of times equal to your proficiency bonus per long rest. Each short rest you finish also lowers your exhaustion level by 1.", { action: "action", uses: "Proficiency bonus per long rest", recharge: "long", source: "TCE-optional", choice: "deftExplorer", replaces: ["Natural Explorer Improvement"] }],
    [10, "Nature's Veil", "Optional (replaces Hide in Plain Sight): as a bonus action, become invisible until the start of your next turn.", { action: "bonus", uses: "Proficiency bonus per long rest", recharge: "long", source: "TCE-optional", choice: "naturesVeil", replaces: ["Hide in Plain Sight"] }],
    [11, "Archetype Feature", "You gain a feature from your Ranger Archetype.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [14, "Favored Enemy Improvement", "Choose one more favored enemy (with its language). With Favored Foe instead, its extra damage becomes 1d8.", { action: "passive", source: "PHB" }],
    [14, "Vanish", "You can take the Hide action as a bonus action, and nonmagical means can't track you unless you choose to leave a trail.", { action: "bonus", source: "PHB" }],
    [15, "Archetype Feature", "You gain a feature from your Ranger Archetype.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [18, "Feral Senses", "Not seeing a creature doesn't give you disadvantage on attacks against it. You know where any invisible creature within 30 ft is, provided it isn't hidden from you and you aren't blinded or deafened.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Foe Slayer", "Once on each of your turns, add your WIS modifier to the attack roll or the damage roll of an attack against a favored enemy, choosing before or after the roll but before its effects apply.", { action: "special", source: "PHB" }]
  ],

  rogue: [
    [1, "Expertise", "Choose two of your skill proficiencies, or one skill and thieves' tools; your proficiency bonus is doubled for checks with them. Choose two more at 6th level.", { action: "passive", source: "PHB" }],
    [1, "Sneak Attack (1d6)", "Once per turn, deal extra damage to one creature you hit with a finesse or ranged weapon attack if you have advantage on the roll, or if another enemy of the target is within 5 ft of it, isn't incapacitated, and you don't have disadvantage. Extra damage: 1d6, increasing by 1d6 at every odd level (2d6 at 3rd, 3d6 at 5th, 4d6 at 7th, 5d6 at 9th, 6d6 at 11th, 7d6 at 13th, 8d6 at 15th, 9d6 at 17th, 10d6 at 19th).", { action: "special", uses: "Once per turn", source: "PHB" }],
    [1, "Thieves' Cant", "You know the rogues' coded slang and hand signs for hiding a message inside ordinary conversation; passing a message this way takes four times longer than stating it outright.", { action: "passive", source: "PHB" }],
    [2, "Cunning Action", "You can take the Dash, Disengage, or Hide action as a bonus action.", { action: "bonus", source: "PHB" }],
    [3, "Roguish Archetype", "Choose an archetype; it grants features at 3rd, 9th, 13th, and 17th level.", { action: "passive", source: "PHB" }],
    [3, "Steady Aim", "Optional (adds to the class, replaces nothing): as a bonus action, give yourself advantage on your next attack roll this turn. You can use it only if you haven't moved this turn, and afterward your speed is 0 until the end of the turn.", { action: "bonus", source: "TCE-optional" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [5, "Uncanny Dodge", "Reaction when an attacker you can see hits you with an attack: halve that attack's damage against you.", { action: "reaction", source: "PHB" }],
    [6, "Expertise", "Choose two more skill proficiencies (or thieves' tools) to gain Expertise.", { action: "passive", source: "PHB" }],
    [7, "Evasion", "When an effect lets you make a DEX save for half damage, you take no damage on a success and half on a failure.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [9, "Archetype Feature", "You gain a feature from your Roguish Archetype.", { action: "passive", source: "PHB" }],
    [10, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [11, "Reliable Talent", "On ability checks that include your proficiency bonus, a d20 result of 9 or less counts as 10.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [13, "Archetype Feature", "You gain a feature from your Roguish Archetype.", { action: "passive", source: "PHB" }],
    [14, "Blindsense", "While you can hear, hidden or invisible creatures within 10 ft of you can't conceal their location from you.", { action: "passive", source: "PHB" }],
    [15, "Slippery Mind", "You gain proficiency in Wisdom saving throws.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [17, "Archetype Feature", "You gain a feature from your Roguish Archetype.", { action: "passive", source: "PHB" }],
    [18, "Elusive", "Attackers can't gain advantage on attack rolls against you unless you're incapacitated.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Stroke of Luck", "Turn a missed attack against a target in range into a hit, or treat a failed ability check's d20 roll as a 20.", { action: "special", uses: "1 per short rest", recharge: "short", source: "PHB" }]
  ],

  sorcerer: [
    [1, "Spellcasting", "Charisma-based full caster with a fixed list of known spells (2 at 1st, up to 15 at 17th); swap one known spell on each sorcerer level gained. Cantrips known: 4, rising to 5 at 4th and 6 at 10th. An arcane focus can be your focus. No ritual casting.", { action: "special", source: "PHB" }],
    [1, "Sorcerous Origin", "Choose an origin; it grants features at 1st, 6th, 14th, and 18th level.", { action: "passive", source: "PHB" }],
    [2, "Font of Magic", "You have sorcery points equal to your sorcerer level. Flexible Casting (bonus action): turn a spell slot into sorcery points equal to its level, or spend points to create a slot of 5th level or lower (1st costs 2, 2nd 3, 3rd 5, 4th 6, 5th 7); created slots vanish after a long rest.", { action: "bonus", uses: "Sorcery points = sorcerer level", recharge: "long", source: "PHB" }],
    [3, "Metamagic", "Learn two Metamagic options (one more at 10th and 17th); normally only one per spell. Careful 1, Distant 1, Empowered 1 (can combine with another), Extended 1, Heightened 3, Quickened 2, Subtle 1, Twinned = spell level (1 for a cantrip); Tasha's adds Seeking 2 and Transmuted 1.", { action: "special", uses: "Spends sorcery points", source: "PHB" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [4, "Sorcerous Versatility", "Optional (adds to the class, replaces nothing): whenever you gain Ability Score Improvement, you can swap one Metamagic option for another, or one sorcerer cantrip for another.", { action: "special", source: "TCE-optional" }],
    [5, "Magical Guidance", "Optional (adds to the class, replaces nothing): when you fail an ability check, spend 1 sorcery point to reroll the d20; you must use the new roll.", { action: "special", uses: "1 sorcery point per use", source: "TCE-optional" }],
    [6, "Origin Feature", "You gain a feature from your Sorcerous Origin.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [10, "Metamagic", "Learn one more Metamagic option.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [14, "Origin Feature", "You gain a feature from your Sorcerous Origin.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [17, "Metamagic", "Learn one more Metamagic option.", { action: "passive", source: "PHB" }],
    [18, "Origin Feature", "You gain a feature from your Sorcerous Origin.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Sorcerous Restoration", "When you finish a short rest, you regain 4 expended sorcery points.", { action: "passive", recharge: "short", source: "PHB" }]
  ],

  warlock: [
    [1, "Otherworldly Patron", "Choose a patron; it grants an expanded spell list and features at 1st, 6th, 10th, and 14th level.", { action: "passive", source: "PHB" }],
    [1, "Pact Magic", "Charisma-based known-spells caster (2 at 1st, up to 15 at 19th; swap one on each warlock level gained). All your slots share one level and return on a short or long rest: one 1st-level slot at 1st, two at 2nd, slot level rising every odd level to 5th at 9th, three slots at 11th, four at 17th. Cantrips known: 2, rising to 3 at 4th and 4 at 10th. An arcane focus can be your focus.", { action: "special", uses: "1 slot (2 at 2nd, 3 at 11th, 4 at 17th)", recharge: "short", source: "PHB" }],
    [2, "Eldritch Invocations", "Learn 2 invocations (3 at 5th, 4 at 7th, 5 at 9th, 6 at 12th, 7 at 15th, 8 at 18th); prerequisites must be met. Each time you gain a warlock level you can replace one you know.", { action: "passive", source: "PHB" }],
    [3, "Pact Boon", "Choose a pact. Chain: learn find familiar and may pick an imp, pseudodragon, quasit, or sprite form; forgo one of your attacks to let the familiar attack with its reaction. Blade: action to create a pact weapon you're proficient with that counts as magical, or bind a magic weapon in a 1-hour ritual. Tome: a book granting three cantrips from any class lists, always prepared. Tasha's adds Talisman: the wearer adds 1d4 to a failed ability check, proficiency bonus times per long rest.", { action: "special", source: "PHB" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [4, "Eldritch Versatility", "Optional (adds to the class, replaces nothing): whenever you gain Ability Score Improvement, you can swap one Pact Magic cantrip, swap your Pact Boon option, or, from 12th level, swap one Mystic Arcanum spell for another warlock spell of the same level.", { action: "special", source: "TCE-optional" }],
    [5, "Eldritch Invocations (3)", "You know 3 invocations.", { action: "passive", source: "PHB" }],
    [6, "Patron Feature", "You gain a feature from your Otherworldly Patron.", { action: "passive", source: "PHB" }],
    [7, "Eldritch Invocations (4)", "You know 4 invocations.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [9, "Eldritch Invocations (5)", "You know 5 invocations. Your Pact Magic slots become 5th level.", { action: "passive", source: "PHB" }],
    [10, "Patron Feature", "You gain a feature from your Otherworldly Patron.", { action: "passive", source: "PHB" }],
    [11, "Mystic Arcanum (6th level)", "Choose one 6th-level warlock spell; cast it once without a spell slot, regaining the use on a long rest. You also gain a third Pact Magic slot.", { action: "special", uses: "1 per long rest", recharge: "long", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [12, "Eldritch Invocations (6)", "You know 6 invocations.", { action: "passive", source: "PHB" }],
    [13, "Mystic Arcanum (7th level)", "Choose one 7th-level warlock spell to cast once per long rest without a slot.", { action: "special", uses: "1 per long rest", recharge: "long", source: "PHB" }],
    [14, "Patron Feature", "You gain a feature from your Otherworldly Patron.", { action: "passive", source: "PHB" }],
    [15, "Mystic Arcanum (8th level)", "Choose one 8th-level warlock spell to cast once per long rest without a slot. You know 7 invocations.", { action: "special", uses: "1 per long rest", recharge: "long", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [17, "Mystic Arcanum (9th level)", "Choose one 9th-level warlock spell to cast once per long rest without a slot. You gain a fourth Pact Magic slot.", { action: "special", uses: "1 per long rest", recharge: "long", source: "PHB" }],
    [18, "Eldritch Invocations (8)", "You know 8 invocations.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Eldritch Master", "Spend 1 minute entreating your patron to regain all expended Pact Magic spell slots.", { action: "special", uses: "1 per long rest", recharge: "long", source: "PHB" }]
  ],

  wizard: [
    [1, "Spellcasting", "Intelligence-based prepared full caster using a spellbook that starts with six 1st-level wizard spells and gains two each level. Each long rest, prepare INT modifier + wizard level spells (min 1) from the book. Cantrips known: 3, rising to 4 at 4th and 5 at 10th. You can ritual-cast any ritual in your book without preparing it; copying a found spell costs 2 hours and 50 gp per spell level. An arcane focus can be your focus.", { action: "special", source: "PHB" }],
    [1, "Arcane Recovery", "Once per day when you finish a short rest, recover expended spell slots with a combined level up to half your wizard level (rounded up); none can be 6th level or higher.", { action: "special", uses: "1 per day", recharge: "long", source: "PHB" }],
    [2, "Arcane Tradition", "Choose a tradition; it grants features at 2nd, 6th, 10th, and 14th level.", { action: "passive", source: "PHB" }],
    [3, "Cantrip Formulas", "Optional (adds to the class, replaces nothing): when you finish a long rest, you can swap one wizard cantrip you know for another from the wizard list.", { action: "special", recharge: "long", source: "TCE-optional" }],
    [4, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [6, "Tradition Feature", "You gain a feature from your Arcane Tradition.", { action: "passive", source: "PHB" }],
    [8, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [10, "Tradition Feature", "You gain a feature from your Arcane Tradition.", { action: "passive", source: "PHB" }],
    [12, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [14, "Tradition Feature", "You gain a feature from your Arcane Tradition.", { action: "passive", source: "PHB" }],
    [16, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [18, "Spell Mastery", "Pick one 1st-level and one 2nd-level wizard spell from your book. While prepared, you can cast each at its lowest level without a slot; casting at a higher level spends a slot as normal. You can change the picks with 8 hours of study.", { action: "passive", source: "PHB" }],
    [19, "Ability Score Improvement", "Raise one ability score by 2, or two ability scores by 1 each (no score above 20). With the optional feats rule you can take a feat instead.", { action: "passive", source: "PHB" }],
    [20, "Signature Spells", "Pick two 3rd-level wizard spells from your book. They are always prepared, don't count against your prepared limit, and you can cast each once at 3rd level without a slot, regaining the uses on a short or long rest.", { action: "special", uses: "Each spell 1 per short rest", recharge: "short", source: "PHB" }]
  ]
});

// Selectable class options, 2014 rules. Each: { name, source, prereq, summary, level? }
// Summaries are original wording; numbers follow the books. Sources: PHB (2014 + errata), XGE, TCE, SCAG,
// BH = Blood Hunter (D&D Beyond, 2020 revision). `optional: true` marks Tasha's optional class features.
// `level` is the class level needed to learn the option (0 = no level prerequisite).
// Requires a global `CLASS_OPTIONS = {}` declared before this file loads.

Object.assign(CLASS_OPTIONS, {
  // Fighting Style. PHB p.72 (fighter), p.84 (paladin), p.91 (ranger); TCE p.41/53/57; BH (2020).
  // classes: who can pick it from their own Fighting Style feature. "bard:swords" = College of Swords, 3rd level
  // (Dueling or Two-Weapon Fighting only, XGE p.15). Champion 10th (Additional Fighting Style) uses the fighter list.
  // Fighting Initiate feat (TCE p.79, prereq proficiency with a martial weapon) also picks from the fighter list.
  fightingStyles: [
    { name: "Archery", source: "PHB", classes: ["fighter", "ranger", "bloodhunter"], prereq: "", summary: "+2 to attack rolls you make with ranged weapons." },
    { name: "Defense", source: "PHB", classes: ["fighter", "paladin", "ranger"], prereq: "", summary: "+1 to AC while you are wearing armor." },
    { name: "Dueling", source: "PHB", classes: ["fighter", "paladin", "ranger", "bloodhunter", "bard:swords"], prereq: "", summary: "While you wield a melee weapon in one hand and no other weapon, you deal +2 damage with it." },
    { name: "Great Weapon Fighting", source: "PHB", classes: ["fighter", "paladin", "bloodhunter"], prereq: "", summary: "Melee weapon attacks with a two-handed or versatile weapon held in both hands: any damage die that shows 1 or 2 is rerolled once, and the reroll stands." },
    { name: "Protection", source: "PHB", classes: ["fighter", "paladin"], prereq: "", summary: "With a shield in hand, spend your reaction to impose disadvantage on an attack a visible creature makes against someone else within 5 feet of you." },
    { name: "Two-Weapon Fighting", source: "PHB", classes: ["fighter", "ranger", "bloodhunter", "bard:swords"], prereq: "", summary: "When you fight with two weapons, you add your ability modifier to the damage of the off-hand (bonus action) attack." },
    { name: "Blind Fighting", source: "TCE", optional: true, classes: ["fighter", "paladin", "ranger"], prereq: "", summary: "You have blindsight out to 10 feet: within that range you perceive anything not behind total cover, even while blinded or in darkness, and you see invisible creatures there unless they successfully hide from you." },
    { name: "Interception", source: "TCE", optional: true, classes: ["fighter", "paladin"], prereq: "", summary: "While holding a shield or a simple or martial weapon, when a creature you can see hits a target other than you within 5 feet of you, you can use your reaction to reduce that damage by 1d10 + your proficiency bonus (to a minimum of 0)." },
    { name: "Superior Technique", source: "TCE", optional: true, classes: ["fighter"], prereq: "", summary: "Learn one Battle Master maneuver and gain one d6 superiority die (added to any you already have), regained on a short or long rest. Its save DC is 8 + proficiency bonus + Strength or Dexterity modifier (your choice)." },
    { name: "Thrown Weapon Fighting", source: "TCE", optional: true, classes: ["fighter", "ranger"], prereq: "", summary: "You can draw a thrown weapon as part of the attack you make with it. When you hit with a ranged attack using a thrown weapon, you deal +2 damage." },
    { name: "Unarmed Fighting", source: "TCE", optional: true, classes: ["fighter"], prereq: "", summary: "Your unarmed strikes deal 1d6 + Strength bludgeoning damage, or 1d8 if you hold no weapon or shield when you attack. At the start of each of your turns you can deal 1d4 bludgeoning damage to one creature you are grappling." },
    { name: "Blessed Warrior", source: "TCE", optional: true, classes: ["paladin"], prereq: "", summary: "Learn two cleric cantrips. They count as paladin spells and use Charisma; whenever you gain a paladin level you can swap one for another cleric cantrip." },
    { name: "Druidic Warrior", source: "TCE", optional: true, classes: ["ranger"], prereq: "", summary: "Learn two druid cantrips. They count as ranger spells and use Wisdom; whenever you gain a ranger level you can swap one for another druid cantrip." }
  ],

  // Eldritch Invocations. PHB p.110-111, XGE p.56-57, TCE p.71-73 (TCE ones are optional class features).
  // level = warlock level required; pact = pact boon required; spell = cantrip/spell required.
  // "hex-or-curse" = the hex spell or a warlock feature that curses (Hexblade's Curse, Sign of Ill Omen).
  invocations: [
    { name: "Agonizing Blast", source: "PHB", level: 0, pact: "", spell: "eldritch-blast", prereq: "eldritch blast cantrip", summary: "Add your Charisma modifier to the damage of each eldritch blast beam that hits." },
    { name: "Armor of Shadows", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "Cast mage armor on yourself at will, with no spell slot or material components." },
    { name: "Ascendant Step", source: "PHB", level: 9, pact: "", spell: "", prereq: "9th level", summary: "Cast levitate on yourself at will, with no spell slot or material components." },
    { name: "Beast Speech", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "Cast speak with animals at will, with no spell slot." },
    { name: "Beguiling Influence", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "Gain proficiency in Deception and Persuasion." },
    { name: "Bewitching Whispers", source: "PHB", level: 7, pact: "", spell: "", prereq: "7th level", uses: "1/long rest", summary: "Cast compulsion once with a warlock spell slot; usable again after a long rest." },
    { name: "Book of Ancient Secrets", source: "PHB", level: 0, pact: "tome", spell: "", prereq: "Pact of the Tome", summary: "Add two 1st-level ritual spells from any class list to your Book of Shadows and cast them as rituals while holding it. You can copy in other ritual spells you find, of a level up to half your warlock level (rounded up), at 2 hours and 50 gp per spell level." },
    { name: "Chains of Carceri", source: "PHB", level: 15, pact: "chain", spell: "", prereq: "15th level, Pact of the Chain", summary: "Cast hold monster at will, with no slot or material components, but only on a celestial, fiend, or elemental. Once you use it on a creature, you can't target that creature again until you finish a long rest." },
    { name: "Devil's Sight", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "You see normally in darkness, magical or not, out to 120 feet." },
    { name: "Dreadful Word", source: "PHB", level: 7, pact: "", spell: "", prereq: "7th level", uses: "1/long rest", summary: "Cast confusion once with a warlock spell slot; usable again after a long rest." },
    { name: "Eldritch Sight", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "Cast detect magic at will, with no spell slot." },
    { name: "Eldritch Spear", source: "PHB", level: 0, pact: "", spell: "eldritch-blast", prereq: "eldritch blast cantrip", summary: "Your eldritch blast has a range of 300 feet." },
    { name: "Eyes of the Rune Keeper", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "You can read any writing." },
    { name: "Fiendish Vigor", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "Cast false life on yourself at will as a 1st-level spell, with no spell slot or material components." },
    { name: "Gaze of Two Minds", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "As an action, touch a willing humanoid and use its senses (including special senses) until the end of your next turn; spend your action each later turn to extend it while you share a plane. Meanwhile you are blinded and deafened to your own surroundings." },
    { name: "Lifedrinker", source: "PHB", level: 12, pact: "blade", spell: "", prereq: "12th level, Pact of the Blade", summary: "When you hit with your pact weapon, the target takes extra necrotic damage equal to your Charisma modifier (minimum 1)." },
    { name: "Mask of Many Faces", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "Cast disguise self at will, with no spell slot." },
    { name: "Master of Myriad Forms", source: "PHB", level: 15, pact: "", spell: "", prereq: "15th level", summary: "Cast alter self at will, with no spell slot." },
    { name: "Minions of Chaos", source: "PHB", level: 9, pact: "", spell: "", prereq: "9th level", uses: "1/long rest", summary: "Cast conjure elemental once with a warlock spell slot; usable again after a long rest." },
    { name: "Mire the Mind", source: "PHB", level: 5, pact: "", spell: "", prereq: "5th level", uses: "1/long rest", summary: "Cast slow once with a warlock spell slot; usable again after a long rest." },
    { name: "Misty Visions", source: "PHB", level: 0, pact: "", spell: "", prereq: "", summary: "Cast silent image at will, with no spell slot or material components." },
    { name: "One with Shadows", source: "PHB", level: 5, pact: "", spell: "", prereq: "5th level", summary: "While in dim light or darkness, use your action to turn invisible until you move or take an action or reaction." },
    { name: "Otherworldly Leap", source: "PHB", level: 9, pact: "", spell: "", prereq: "9th level", summary: "Cast jump on yourself at will, with no spell slot or material components." },
    { name: "Repelling Blast", source: "PHB", level: 0, pact: "", spell: "eldritch-blast", prereq: "eldritch blast cantrip", summary: "When an eldritch blast beam hits a creature, you can push it up to 10 feet straight away from you." },
    { name: "Sculptor of Flesh", source: "PHB", level: 7, pact: "", spell: "", prereq: "7th level", uses: "1/long rest", summary: "Cast polymorph once with a warlock spell slot; usable again after a long rest." },
    { name: "Sign of Ill Omen", source: "PHB", level: 5, pact: "", spell: "", prereq: "5th level", uses: "1/long rest", summary: "Cast bestow curse once with a warlock spell slot; usable again after a long rest." },
    { name: "Thief of Five Fates", source: "PHB", level: 0, pact: "", spell: "", prereq: "", uses: "1/long rest", summary: "Cast bane once with a warlock spell slot; usable again after a long rest." },
    { name: "Thirsting Blade", source: "PHB", level: 5, pact: "blade", spell: "", prereq: "5th level, Pact of the Blade", summary: "When you take the Attack action, you can attack twice with your pact weapon instead of once." },
    { name: "Visions of Distant Realms", source: "PHB", level: 15, pact: "", spell: "", prereq: "15th level", summary: "Cast arcane eye at will, with no spell slot." },
    { name: "Voice of the Chain Master", source: "PHB", level: 0, pact: "chain", spell: "", prereq: "Pact of the Chain", summary: "While on the same plane as your familiar, you can talk to it telepathically, use its senses, and speak aloud through it in your own voice even if it can't normally speak." },
    { name: "Whispers of the Grave", source: "PHB", level: 9, pact: "", spell: "", prereq: "9th level", summary: "Cast speak with dead at will, with no spell slot." },
    { name: "Witch Sight", source: "PHB", level: 15, pact: "", spell: "", prereq: "15th level", summary: "You see the true form of any shapechanger, or any creature hidden by illusion or transmutation magic, that is within 30 feet and in your line of sight." },

    { name: "Aspect of the Moon", source: "XGE", level: 0, pact: "tome", spell: "", prereq: "Pact of the Tome", summary: "You don't need sleep and can't be magically forced to sleep. You can finish a long rest by spending all 8 hours on light activity such as reading or keeping watch." },
    { name: "Cloak of Flies", source: "XGE", level: 5, pact: "", spell: "", prereq: "5th level", uses: "1/short rest", summary: "As a bonus action, wrap yourself in a 5-foot aura of buzzing flies until you are incapacitated or dismiss it (bonus action). You have advantage on Intimidation checks but disadvantage on other Charisma checks, and any other creature that starts its turn in the aura takes poison damage equal to your Charisma modifier (minimum 0). Recharges on a short or long rest." },
    { name: "Eldritch Smite", source: "XGE", level: 5, pact: "blade", spell: "", prereq: "5th level, Pact of the Blade", summary: "Once per turn when you hit with your pact weapon, you can spend a warlock spell slot to deal an extra 1d8 force damage, plus 1d8 per level of the slot, and knock the target prone if it is Huge or smaller." },
    { name: "Ghostly Gaze", source: "XGE", level: 7, pact: "", spell: "", prereq: "7th level", uses: "1/short rest", summary: "As an action, see through solid objects out to 30 feet (and gain darkvision in that range if you lack it) for up to 1 minute, as if concentrating on a spell. Recharges on a short or long rest." },
    { name: "Gift of the Depths", source: "XGE", level: 5, pact: "", spell: "", prereq: "5th level", uses: "1/long rest", summary: "You can breathe underwater and gain a swimming speed equal to your walking speed. You can also cast water breathing once without a spell slot, regaining the use on a long rest." },
    { name: "Gift of the Ever-Living Ones", source: "XGE", level: 0, pact: "chain", spell: "", prereq: "Pact of the Chain", summary: "While your familiar is within 100 feet of you, any dice you roll to regain hit points count as their maximum value." },
    { name: "Grasp of Hadar", source: "XGE", level: 0, pact: "", spell: "eldritch-blast", prereq: "eldritch blast cantrip", summary: "Once per turn when eldritch blast hits a creature, you can pull it up to 10 feet straight toward you." },
    { name: "Improved Pact Weapon", source: "XGE", level: 0, pact: "blade", spell: "", prereq: "Pact of the Blade", summary: "Your pact weapon can be a shortbow, longbow, light crossbow, or heavy crossbow, and works as a spellcasting focus. If it isn't already a magic weapon with a bonus, it gains +1 to attack and damage rolls." },
    { name: "Lance of Lethargy", source: "XGE", level: 0, pact: "", spell: "eldritch-blast", prereq: "eldritch blast cantrip", summary: "Once per turn when eldritch blast hits a creature, you can cut its speed by 10 feet until the end of your next turn." },
    { name: "Maddening Hex", source: "XGE", level: 5, pact: "", spell: "hex-or-curse", prereq: "5th level, hex spell or a warlock feature that curses", summary: "As a bonus action, deal psychic damage equal to your Charisma modifier (minimum 1) to a creature within 30 feet that you have cursed with hex or a warlock curse feature, and to each creature of your choice you can see within 5 feet of it." },
    { name: "Relentless Hex", source: "XGE", level: 7, pact: "", spell: "hex-or-curse", prereq: "7th level, hex spell or a warlock feature that curses", summary: "As a bonus action, teleport up to 30 feet to an unoccupied space you can see within 5 feet of a creature you have cursed with hex or a warlock curse feature. You must be able to see that creature." },
    { name: "Shroud of Shadow", source: "XGE", level: 15, pact: "", spell: "", prereq: "15th level", summary: "Cast invisibility at will, with no spell slot." },
    { name: "Tomb of Levistus", source: "XGE", level: 5, pact: "", spell: "", prereq: "5th level", uses: "1/short rest", summary: "When you take damage, use your reaction to encase yourself in ice until the end of your next turn: gain 10 temporary HP per warlock level, which absorb the triggering damage, but you are vulnerable to fire, have speed 0, and are incapacitated; all of it, including leftover temporary HP, ends when the ice melts. Recharges on a short or long rest." },
    { name: "Trickster's Escape", source: "XGE", level: 7, pact: "", spell: "", prereq: "7th level", uses: "1/long rest", summary: "Cast freedom of movement on yourself once without a spell slot; regain the use on a long rest." },

    { name: "Bond of the Talisman", source: "TCE", optional: true, level: 12, pact: "talisman", spell: "", prereq: "12th level, Pact of the Talisman", uses: "proficiency bonus/long rest", summary: "While someone else wears your talisman, either of you can use an action to teleport to the unoccupied space nearest the other, if you share a plane. Usable a number of times equal to your proficiency bonus per long rest." },
    { name: "Eldritch Mind", source: "TCE", optional: true, level: 0, pact: "", spell: "", prereq: "", summary: "You have advantage on Constitution saving throws to keep concentration on a spell." },
    { name: "Far Scribe", source: "TCE", optional: true, level: 5, pact: "tome", spell: "", prereq: "5th level, Pact of the Tome", summary: "A page of your Book of Shadows holds up to your proficiency bonus in names, each written by its creature as an action. You can cast sending to a named creature with no slot or material components by writing the message on the page; erase a name with an action." },
    { name: "Gift of the Protectors", source: "TCE", optional: true, level: 9, pact: "tome", spell: "", prereq: "9th level, Pact of the Tome", uses: "1/long rest", summary: "A page of your Book of Shadows holds up to your proficiency bonus in names, each written by its creature as an action. When a named creature drops to 0 HP but isn't killed outright, it drops to 1 HP instead; once this happens, it can't happen again until you finish a long rest." },
    { name: "Investment of the Chain Master", source: "TCE", optional: true, level: 0, pact: "chain", spell: "", prereq: "Pact of the Chain", summary: "Your familiar gains a 40-foot flying or swimming speed (chosen at casting), you can command it to Attack as a bonus action, its weapon attacks count as magical, and any save it imposes uses your spell save DC. When it takes damage, you can use your reaction to give it resistance to that damage." },
    { name: "Protection of the Talisman", source: "TCE", optional: true, level: 7, pact: "talisman", spell: "", prereq: "7th level, Pact of the Talisman", uses: "proficiency bonus/long rest", summary: "When the talisman's wearer fails a saving throw, they can add a d4 to the roll, possibly succeeding. Usable a number of times equal to your proficiency bonus per long rest." },
    { name: "Rebuke of the Talisman", source: "TCE", optional: true, level: 0, pact: "talisman", spell: "", prereq: "Pact of the Talisman", summary: "When an attacker you can see within 30 feet of you hits the talisman's wearer, use your reaction to deal psychic damage to the attacker equal to your proficiency bonus and push it up to 10 feet away from the wearer." },
    { name: "Undying Servitude", source: "TCE", optional: true, level: 5, pact: "", spell: "", prereq: "5th level", uses: "1/long rest", summary: "Cast animate dead once without a spell slot; regain the use on a long rest." }
  ],

  // Pact Boon, gained at warlock 3rd. PHB p.107-108; Talisman TCE p.70 (optional class feature).
  pactBoons: [
    { name: "Pact of the Chain", id: "chain", source: "PHB", prereq: "3rd-level warlock", summary: "Learn find familiar and cast it as a ritual; it doesn't count against spells known. Your familiar can also take the form of an imp, pseudodragon, quasit, or sprite, and when you take the Attack action you can forgo one attack to let it make one attack with its reaction." },
    { name: "Pact of the Blade", id: "blade", source: "PHB", prereq: "3rd-level warlock", summary: "As an action, create a melee weapon of any form in your empty hand; you are proficient with it and it counts as magical. It vanishes if it is more than 5 feet from you for 1 minute, if you summon it again, dismiss it, or die. A 1-hour ritual (can be done during a short rest) binds a magic weapon, other than an artifact or sentient weapon, as your pact weapon." },
    { name: "Pact of the Tome", id: "tome", source: "PHB", prereq: "3rd-level warlock", summary: "Gain a Book of Shadows with three cantrips from any class list; you can cast them at will while the book is on you, and they don't count against cantrips known. A lost book can be replaced with a 1-hour ceremony during a short or long rest." },
    { name: "Pact of the Talisman", id: "talisman", source: "TCE", optional: true, prereq: "3rd-level warlock", summary: "Gain an amulet. Its wearer can add a d4 to an ability check they fail, possibly succeeding, a number of times equal to your proficiency bonus per long rest. A lost talisman can be replaced with a 1-hour ceremony during a short or long rest." }
  ],

  // Metamagic. PHB p.101-102; Seeking and Transmuted are TCE p.66 (optional class features).
  // Only one Metamagic option per spell unless the option says otherwise (stacks: true).
  metamagic: [
    { name: "Careful Spell", source: "PHB", cost: "1 sorcery point", points: 1, summary: "When a spell forces creatures to save, choose up to your Charisma modifier of them (minimum one); they automatically succeed." },
    { name: "Distant Spell", source: "PHB", cost: "1 sorcery point", points: 1, summary: "Double the range of a spell with a range of 5 feet or more, or make a touch spell's range 30 feet." },
    { name: "Empowered Spell", source: "PHB", cost: "1 sorcery point", points: 1, stacks: true, summary: "When you roll a spell's damage, reroll up to your Charisma modifier of the damage dice (minimum one) and keep the new rolls. Can be combined with another Metamagic option on the same spell." },
    { name: "Extended Spell", source: "PHB", cost: "1 sorcery point", points: 1, summary: "Double the duration of a spell lasting 1 minute or longer, up to 24 hours." },
    { name: "Heightened Spell", source: "PHB", cost: "3 sorcery points", points: 3, summary: "One target of a spell that forces a save has disadvantage on its first save against that spell." },
    { name: "Quickened Spell", source: "PHB", cost: "2 sorcery points", points: 2, summary: "Cast a spell whose casting time is 1 action as a bonus action instead." },
    { name: "Subtle Spell", source: "PHB", cost: "1 sorcery point", points: 1, summary: "Cast a spell without its verbal or somatic components." },
    { name: "Twinned Spell", source: "PHB", cost: "sorcery points equal to the spell's level (1 for a cantrip)", points: "spellLevel", summary: "A spell that targets only one creature and doesn't have a range of self also targets a second creature within range." },
    { name: "Seeking Spell", source: "TCE", optional: true, cost: "2 sorcery points", points: 2, stacks: true, summary: "If you miss with a spell attack roll, reroll the d20 and use the new roll. Can be used even if you already applied a different Metamagic option to the spell." },
    { name: "Transmuted Spell", source: "TCE", optional: true, cost: "1 sorcery point", points: 1, summary: "Change a spell's acid, cold, fire, lightning, poison, or thunder damage to another type from that list." }
  ],

  // Battle Master maneuvers. PHB p.74; TCE p.42 (optional class features). "die" = one superiority die (expended).
  // Save DC = 8 + proficiency bonus + Strength or Dexterity modifier (your choice).
  maneuvers: [
    { name: "Commander's Strike", source: "PHB", prereq: "", summary: "When you take the Attack action, give up one attack and use a bonus action to direct an ally who can see or hear you; it can use its reaction to make one weapon attack, adding the die to the damage." },
    { name: "Disarming Attack", source: "PHB", prereq: "", save: "str", summary: "On a weapon hit, add the die to the damage; the target makes a Strength save or drops one item of your choice that it is holding, at its feet." },
    { name: "Distracting Strike", source: "PHB", prereq: "", summary: "On a weapon hit, add the die to the damage; the next attack against the target by someone other than you has advantage if made before the start of your next turn." },
    { name: "Evasive Footwork", source: "PHB", prereq: "", summary: "When you move, add the die to your AC until you stop moving." },
    { name: "Feinting Attack", source: "PHB", prereq: "", summary: "As a bonus action, feint at a creature within 5 feet: you have advantage on your next attack against it this turn, and if that attack hits, add the die to the damage." },
    { name: "Goading Attack", source: "PHB", prereq: "", save: "wis", summary: "On a weapon hit, add the die to the damage; the target makes a Wisdom save or has disadvantage on attacks against anyone but you until the end of your next turn." },
    { name: "Lunging Attack", source: "PHB", prereq: "", summary: "When you make a melee weapon attack on your turn, your reach for it grows by 5 feet; on a hit, add the die to the damage." },
    { name: "Maneuvering Attack", source: "PHB", prereq: "", summary: "On a weapon hit, add the die to the damage and pick an ally who can see or hear you: it may spend its reaction to move up to half its speed, and the target can't make opportunity attacks against that movement." },
    { name: "Menacing Attack", source: "PHB", prereq: "", save: "wis", summary: "On a weapon hit, add the die to the damage; the target makes a Wisdom save or is frightened of you until the end of your next turn." },
    { name: "Parry", source: "PHB", prereq: "", summary: "When a creature damages you with a melee attack, use your reaction to reduce the damage by the die roll + your Dexterity modifier." },
    { name: "Precision Attack", source: "PHB", prereq: "", summary: "Add the die to a weapon attack roll, before or after rolling but before you know the result." },
    { name: "Pushing Attack", source: "PHB", prereq: "", save: "str", summary: "On a weapon hit, add the die to the damage; a Large or smaller target makes a Strength save or is pushed up to 15 feet away from you." },
    { name: "Rally", source: "PHB", prereq: "", summary: "As a bonus action, an ally who can see or hear you gains temporary HP equal to the die roll + your Charisma modifier." },
    { name: "Riposte", source: "PHB", prereq: "", summary: "When a creature misses you with a melee attack, use your reaction to make one melee weapon attack against it; on a hit, add the die to the damage." },
    { name: "Sweeping Attack", source: "PHB", prereq: "", summary: "When you hit with a melee weapon attack, pick another creature within 5 feet of the target and within your reach; if your original roll would hit it, it takes damage equal to the die roll, of the same type." },
    { name: "Trip Attack", source: "PHB", prereq: "", save: "str", summary: "On a weapon hit, add the die to the damage; a Large or smaller target makes a Strength save or is knocked prone." },
    { name: "Ambush", source: "TCE", optional: true, prereq: "", summary: "Add the die to a Dexterity (Stealth) check or an initiative roll, as long as you aren't incapacitated." },
    { name: "Bait and Switch", source: "TCE", optional: true, prereq: "", summary: "On your turn, spend 5 feet of movement to swap places with a willing creature within 5 feet, without provoking opportunity attacks; you or it (your choice) adds the die to AC until the start of your next turn." },
    { name: "Brace", source: "TCE", optional: true, prereq: "", summary: "When a creature you can see moves into the reach of the melee weapon you are wielding, use your reaction to attack it with that weapon; on a hit, add the die to the damage." },
    { name: "Commanding Presence", source: "TCE", optional: true, prereq: "", summary: "Add the die to a Charisma (Intimidation, Performance, or Persuasion) check." },
    { name: "Grappling Strike", source: "TCE", optional: true, prereq: "", summary: "Right after you hit a creature with a melee attack on your turn, use a bonus action to try to grapple it, adding the die to your Strength (Athletics) check." },
    { name: "Quick Toss", source: "TCE", optional: true, prereq: "", summary: "As a bonus action, make a ranged attack with a thrown weapon, drawing it as part of the attack; on a hit, add the die to the damage." },
    { name: "Tactical Assessment", source: "TCE", optional: true, prereq: "", summary: "Add the die to an Intelligence (Investigation or History) or Wisdom (Insight) check." }
  ],

  // Artificer infusions. TCE p.12-14 (infusion rules p.12, list p.20-23). prereq = artificer level.
  // Each infusion goes on a nonmagical object at the end of a long rest; one infusion per object; if you exceed your
  // active limit the oldest ends; it also ends if you lose the infusion when replacing it on level-up, and after your death it lasts a number of days equal to your INT modifier (minimum 1).
  infusions: [
    { name: "Arcane Propulsion Armor", source: "TCE", level: 14, prereq: "14th-level artificer", item: "a suit of armor (requires attunement)", summary: "Wearer gets +5 feet walking speed; the gauntlets become magic melee weapons usable while that hand is empty (proficient, 1d8 force, thrown 20/60, return after a throw). The armor can't be removed against the wearer's will and replaces missing limbs." },
    { name: "Armor of Magical Strength", source: "TCE", level: 0, prereq: "", item: "a suit of armor (requires attunement)", summary: "Has 6 charges. The wearer can spend 1 to add their Intelligence modifier to a Strength check or save, or spend 1 as a reaction to avoid being knocked prone. Regains 1d6 charges daily at dawn." },
    { name: "Boots of the Winding Path", source: "TCE", level: 6, prereq: "6th-level artificer", item: "a pair of boots (requires attunement)", summary: "As a bonus action, the wearer teleports up to 15 feet to an unoccupied space they can see that they occupied earlier this turn." },
    { name: "Enhanced Arcane Focus", source: "TCE", level: 0, prereq: "", item: "a rod, staff, or wand (requires attunement)", summary: "The holder gets +1 to spell attack rolls and ignores half cover with spell attacks. The bonus becomes +2 at 10th artificer level." },
    { name: "Enhanced Defense", source: "TCE", level: 0, prereq: "", item: "a suit of armor or a shield", summary: "+1 to AC while worn or wielded, rising to +2 at 10th artificer level." },
    { name: "Enhanced Weapon", source: "TCE", level: 0, prereq: "", item: "a simple or martial weapon", summary: "+1 to attack and damage rolls, rising to +2 at 10th artificer level." },
    { name: "Helm of Awareness", source: "TCE", level: 10, prereq: "10th-level artificer", item: "a helmet (requires attunement)", summary: "The wearer has advantage on initiative rolls and can't be surprised unless incapacitated." },
    { name: "Homunculus Servant", source: "TCE", level: 0, prereq: "", item: "a gem or crystal worth at least 100 gp", summary: "Creates a homunculus companion (stat block TCE p.21) that acts on your initiative right after you and can deliver your touch spells. Its HP equal 1 + your Intelligence modifier + your artificer level, and its attacks and saves use your proficiency bonus." },
    { name: "Mind Sharpener", source: "TCE", level: 0, prereq: "", item: "a suit of armor or robes", summary: "Has 4 charges. When the wearer fails a Constitution save to keep concentration, they can use a reaction and 1 charge to succeed instead. Regains 1d4 charges daily at dawn." },
    { name: "Radiant Weapon", source: "TCE", level: 6, prereq: "6th-level artificer", item: "a simple or martial weapon (requires attunement)", summary: "+1 to attack and damage rolls. Bonus action: shed bright light 30 feet and dim light 30 more (or stop). Has 4 charges: when the wielder is hit, a reaction and 1 charge force the attacker to make a Constitution save against your spell save DC or be blinded until the end of its next turn. Regains 1d4 charges daily at dawn." },
    { name: "Repeating Shot", source: "TCE", level: 0, prereq: "", item: "a simple or martial weapon with the ammunition property (requires attunement)", summary: "+1 to attack and damage rolls on ranged attacks with it, and it ignores the loading property. If not loaded, it makes its own magic ammunition, which vanishes after it hits or misses." },
    { name: "Replicate Magic Item", source: "TCE", level: 0, prereq: "level per item (see replicableItems)", repeatable: true, item: "the item being replicated", summary: "Turn a nonmagical object into a copy of one magic item from the Replicable Items list for your level. Can be learned multiple times, choosing a different item each time; if the item needs attunement, so does the copy." },
    { name: "Repulsion Shield", source: "TCE", level: 6, prereq: "6th-level artificer", item: "a shield (requires attunement)", summary: "+1 to AC. Has 4 charges: when the wielder is hit by a melee attack, a reaction and 1 charge push the attacker up to 15 feet away. Regains 1d4 charges daily at dawn." },
    { name: "Resistant Armor", source: "TCE", level: 6, prereq: "6th-level artificer", item: "a suit of armor (requires attunement)", summary: "The wearer has resistance to one damage type chosen when you infuse it: acid, cold, fire, force, lightning, necrotic, poison, psychic, radiant, or thunder." },
    { name: "Returning Weapon", source: "TCE", level: 0, prereq: "", item: "a simple or martial weapon with the thrown property", summary: "+1 to attack and damage rolls, and it flies back to the wielder's hand right after it is used for a ranged attack." },
    { name: "Spell-Refueling Ring", source: "TCE", level: 6, prereq: "6th-level artificer", item: "a ring (requires attunement)", summary: "As an action, the wearer recovers one expended spell slot of 3rd level or lower. Usable again at the next dawn." }
  ],
  // Replicate Magic Item tables, TCE p.22-23. Names use SRD names where one exists.
  // VERIFY: confirm the TCE-only additions at 10th (Ventilating Lungs) and 14th (Arcane Propulsion Arm) against the book.
  replicableItems: {
    2: ["Alchemy Jug", "Bag of Holding", "Cap of Water Breathing", "Goggles of Night", "Rope of Climbing", "Sending Stones", "Wand of Magic Detection", "Wand of Secrets"],
    6: ["Boots of Elvenkind", "Cloak of Elvenkind", "Cloak of the Manta Ray", "Eyes of Charming", "Gloves of Thievery", "Lantern of Revealing", "Pipes of Haunting", "Ring of Water Walking"],
    10: ["Boots of Striding and Springing", "Boots of the Winterlands", "Bracers of Archery", "Brooch of Shielding", "Cloak of Protection", "Eyes of the Eagle", "Gauntlets of Ogre Power", "Gloves of Missile Snaring", "Gloves of Swimming and Climbing", "Hat of Disguise", "Headband of Intellect", "Helm of Telepathy", "Medallion of Thoughts", "Necklace of Adaptation", "Periapt of Wound Closure", "Pipes of the Sewers", "Efficient Quiver", "Ring of Jumping", "Ring of Mind Shielding", "Slippers of Spider Climbing", "Ventilating Lungs", "Winged Boots"],
    14: ["Amulet of Health", "Arcane Propulsion Arm", "Belt of Hill Giant Strength", "Boots of Levitation", "Boots of Speed", "Bracers of Defense", "Cloak of the Bat", "Dimensional Shackles", "Gem of Seeing", "Horn of Blasting", "Ring of Free Action", "Ring of Protection", "Ring of the Ram"]
  },

  // Blood Hunter crimson rites (BH 2020). Learn one at 2nd, another at 7th and 14th; esoteric rites only from 14th.
  // Activate: bonus action on one weapon, take necrotic damage equal to one hemocraft die roll (can't be reduced);
  // the weapon deals +1 hemocraft die of the rite's type until you finish a short or long rest or stop holding it.
  bloodHunterRites: [
    { name: "Rite of the Flame", source: "BH", kind: "primal", level: 2, damage: "fire", prereq: "", summary: "Rite damage is fire." },
    { name: "Rite of the Frozen", source: "BH", kind: "primal", level: 2, damage: "cold", prereq: "", summary: "Rite damage is cold." },
    { name: "Rite of the Storm", source: "BH", kind: "primal", level: 2, damage: "lightning", prereq: "", summary: "Rite damage is lightning." },
    { name: "Rite of the Dead", source: "BH", kind: "esoteric", level: 14, damage: "necrotic", prereq: "14th-level blood hunter", summary: "Rite damage is necrotic." },
    { name: "Rite of the Oracle", source: "BH", kind: "esoteric", level: 14, damage: "psychic", prereq: "14th-level blood hunter", summary: "Rite damage is psychic." },
    { name: "Rite of the Roar", source: "BH", kind: "esoteric", level: 14, damage: "thunder", prereq: "14th-level blood hunter", summary: "Rite damage is thunder." },
    { name: "Rite of the Dawn", source: "BH", kind: "order", level: 3, damage: "radiant", prereq: "Order of the Ghostslayer", summary: "Rite damage is radiant; while active you shed light and resist necrotic damage, and your rite deals an extra hemocraft die against undead. VERIFY light radius against the Ghostslayer text." }
  ],

  // Blood curses (BH 2020). Each use spends one Blood Maledict use; range 30 ft unless noted.
  // Amplify: also lose HP equal to one hemocraft die roll (can't be reduced) for the amplified effect.
  // Save DC = 8 + proficiency bonus + hemocraft modifier (Intelligence or Wisdom, your choice).
  bloodMaledicts: [
    { name: "Blood Curse of the Anxious", source: "BH", level: 0, prereq: "", action: "bonus action", summary: "Until the end of your next turn, Intimidation checks against the target have advantage.", amplify: "The target also has disadvantage on the next Wisdom save it makes before the curse ends." },
    { name: "Blood Curse of Binding", source: "BH", level: 0, prereq: "", action: "bonus action", save: "str", summary: "A Large or smaller target makes a Strength save or has speed 0 and can't take reactions until the end of your next turn.", amplify: "Works on any size, lasts 1 minute, and the target repeats the save at the end of each of its turns." },
    { name: "Blood Curse of Bloated Agony", source: "BH", level: 0, prereq: "", action: "bonus action", summary: "Until the end of your next turn the target has disadvantage on Strength and Dexterity checks, and takes 1d8 necrotic damage whenever it makes more than one attack in a turn.", amplify: "Lasts 1 minute; the target makes a Constitution save at the end of each of its turns, ending it on a success." },
    { name: "Blood Curse of Corrosion", source: "BH", level: 15, prereq: "15th level, Order of the Mutant", action: "bonus action", save: "con", summary: "The target makes a Constitution save or is poisoned, repeating the save at the end of each of its turns.", amplify: "The target also takes 4d6 necrotic damage when cursed and each time it fails the save." },
    { name: "Blood Curse of the Exorcist", source: "BH", level: 15, prereq: "15th level, Order of the Ghostslayer", action: "bonus action", summary: "End the charmed, frightened, or possessed condition on a creature within 30 feet.", amplify: "The creature that caused the condition takes 3d6 psychic damage and makes a Wisdom save or is stunned until the end of your next turn. VERIFY: earlier versions knocked it prone instead." },
    { name: "Blood Curse of Exposure", source: "BH", level: 0, prereq: "", action: "reaction, when a creature within 30 feet takes damage", summary: "Until the end of its next turn, the target loses resistance to the damage types of the triggering attack or spell.", amplify: "It instead loses immunity to those types, but has resistance to them until the end of its next turn." },
    { name: "Blood Curse of the Eyeless", source: "BH", level: 0, prereq: "", action: "reaction, when a creature within 30 feet makes an attack roll", summary: "Roll a hemocraft die and subtract it from the attack roll (after the roll, before the outcome). Creatures immune to being blinded are unaffected.", amplify: "Applies to every attack roll the creature makes this turn; roll the die separately for each." },
    { name: "Blood Curse of the Fallen Puppet", source: "BH", level: 0, prereq: "", action: "reaction, when a creature within 30 feet drops to 0 HP", summary: "The falling creature makes one weapon attack against a target of your choice within its range.", amplify: "It can first move up to half its speed, and adds your hemocraft modifier (minimum +1) to the attack roll. VERIFY: attack roll vs damage." },
    { name: "Blood Curse of the Howl", source: "BH", level: 18, prereq: "18th level, Order of the Lycan", action: "action", save: "wis", summary: "Each creature of your choice within 30 feet that can hear you makes a Wisdom save or is frightened of you until the end of your next turn; failing by 5 or more also stuns it for that time. A creature that succeeds is immune for 24 hours.", amplify: "Range becomes 60 feet." },
    { name: "Blood Curse of the Marked", source: "BH", level: 0, prereq: "", action: "bonus action", summary: "Until the end of your turn, your crimson rite damage against the target rolls one extra hemocraft die.", amplify: "Your next attack roll against the target before the end of this turn has advantage." },
    { name: "Blood Curse of the Muddled Mind", source: "BH", level: 0, prereq: "", action: "bonus action, target concentrating on a spell", summary: "The target's next Constitution save to keep concentration before the end of your next turn has disadvantage.", amplify: "Every concentration save it makes before the end of its next turn has disadvantage." },
    { name: "Blood Curse of the Soul Eater", source: "BH", level: 18, prereq: "18th level, Order of the Profane Soul", action: "reaction, when a creature (not a construct or undead) within 30 feet drops to 0 HP", summary: "Until the end of your next turn, your attacks have advantage and you resist all damage. VERIFY: weapon attacks only.", amplify: "You also regain one expended warlock spell slot; you can amplify this curse once per long rest." }
  ],

  // Arcane Shot options, Arcane Archer (XGE p.28-29). Learn 2 at 3rd; one more at 7th, 10th, 15th, 18th.
  // Arcane Shot: 2 uses per short or long rest, once per turn, on a magic arrow fired from a shortbow or longbow as part
  // of the Attack action; choose after the hit unless the option makes no attack roll. Save DC = 8 + prof + INT.
  // At 18th fighter level the damage of every option increases as noted.
  arcaneShots: [
    { name: "Banishing Arrow", source: "XGE", save: "cha", summary: "On a hit, the target makes a Charisma save or is sent to the Feywild until the end of its next turn, then returns to its space or the nearest free one. At 18th level it also takes 2d6 force damage." },
    { name: "Beguiling Arrow", source: "XGE", save: "wis", summary: "+2d6 psychic damage; pick an ally within 30 feet of the target, which makes a Wisdom save or is charmed by that ally until the start of your next turn (ends if the ally attacks, damages, or forces a save on it). 4d6 at 18th." },
    { name: "Bursting Arrow", source: "XGE", save: "", summary: "On a hit, the target and each creature within 10 feet of it take 2d6 force damage. 4d6 at 18th." },
    { name: "Enfeebling Arrow", source: "XGE", save: "con", summary: "+2d6 necrotic damage, and the target makes a Constitution save or its weapon attacks deal half damage until the start of your next turn. 4d6 at 18th." },
    { name: "Grasping Arrow", source: "XGE", save: "", summary: "+2d6 poison damage; for 1 minute the target's speed drops by 10 feet and it takes 2d6 slashing damage the first time on each turn it moves 1 foot or more without teleporting. It or a creature that can reach it can use an action and a Strength (Athletics) check against your Arcane Shot DC to remove the brambles. Poison and slashing both 4d6 at 18th." },
    { name: "Piercing Arrow", source: "XGE", save: "dex", summary: "No attack roll: the arrow passes harmlessly through objects in a 30-foot line, 1 foot wide, ignoring cover. Each creature in the line makes a Dexterity save, taking the arrow's damage + 1d6 piercing on a failure, half on a success. 2d6 at 18th." },
    { name: "Seeking Arrow", source: "XGE", save: "dex", summary: "No attack roll: target a creature you have seen in the past minute; the arrow curves around corners, ignoring half and three-quarters cover. It makes a Dexterity save, taking the arrow's damage + 1d6 force and revealing its location on a failure, half damage on a success. 2d6 at 18th." },
    { name: "Shadow Arrow", source: "XGE", save: "wis", summary: "+2d6 psychic damage, and the target makes a Wisdom save or can't see anything more than 5 feet away until the start of your next turn. 4d6 at 18th." }
  ],

  // Way of the Four Elements, PHB p.80-81. You know Elemental Attunement plus one discipline at 3rd, and learn one more
  // at 6th, 11th, and 17th; each time you learn one you can also swap one you know. Spells cast this way use your ki
  // save DC. Max ki per spell (base + extra to upcast): 2 at 3rd, 3 at 5th, 4 at 9th, 5 at 13th, 6 at 17th.
  elementalDisciplines: [
    { name: "Elemental Attunement", source: "PHB", level: 3, ki: 0, auto: true, summary: "Action: make a harmless sensory elemental effect, light or snuff a small flame, chill or warm up to 1 pound of nonliving material for up to 1 hour, or shape a 1-foot cube of earth, fire, water, or mist into a crude form for 1 minute." },
    { name: "Fangs of the Fire Snake", source: "PHB", level: 3, ki: 1, summary: "When you take the Attack action, spend 1 ki: your unarmed strikes reach 10 feet farther for the rest of the turn and deal fire damage; spend 1 more ki on a hit for an extra 1d10 fire." },
    { name: "Fist of Four Thunders", source: "PHB", level: 3, ki: 2, spell: "thunderwave", summary: "Spend 2 ki to cast thunderwave." },
    { name: "Fist of Unbroken Air", source: "PHB", level: 3, ki: 2, summary: "Action, 2 ki: a creature within 30 feet makes a Strength save, taking 3d10 bludgeoning (+1d10 per extra ki) and being pushed up to 20 feet and knocked prone on a failure, or half damage only on a success." },
    { name: "Rush of the Gale Spirits", source: "PHB", level: 3, ki: 2, spell: "gust-of-wind", summary: "Spend 2 ki to cast gust of wind." },
    { name: "Shape the Flowing River", source: "PHB", level: 3, ki: 1, summary: "Action, 1 ki: within 120 feet, reshape an area of water or ice up to 30 feet on a side (freeze or thaw it, raise or lower it, dig or fill trenches, make walls or pillars), changing it by no more than half the area's largest dimension. You can't use it to trap or hurt a creature." },
    { name: "Sweeping Cinder Strike", source: "PHB", level: 3, ki: 2, spell: "burning-hands", summary: "Spend 2 ki to cast burning hands." },
    { name: "Water Whip", source: "PHB", level: 3, ki: 2, summary: "Bonus action, 2 ki: a creature you can see within 30 feet makes a Dexterity save, taking 3d10 bludgeoning (+1d10 per extra ki) and being knocked prone or pulled up to 25 feet toward you on a failure, or half damage only on a success." },
    { name: "Clench of the North Wind", source: "PHB", level: 6, ki: 3, spell: "hold-person", summary: "Spend 3 ki to cast hold person." },
    { name: "Gong of the Summit", source: "PHB", level: 6, ki: 3, spell: "shatter", summary: "Spend 3 ki to cast shatter." },
    { name: "Eternal Mountain Defense", source: "PHB", level: 17, ki: 5, spell: "stoneskin", summary: "Spend 5 ki to cast stoneskin on yourself." },
    { name: "Flames of the Phoenix", source: "PHB", level: 11, ki: 4, spell: "fireball", summary: "Spend 4 ki to cast fireball." },
    { name: "Mist Stance", source: "PHB", level: 11, ki: 4, spell: "gaseous-form", summary: "Spend 4 ki to cast gaseous form on yourself." },
    { name: "Ride the Wind", source: "PHB", level: 11, ki: 4, spell: "fly", summary: "Spend 4 ki to cast fly on yourself." },
    { name: "Breath of Winter", source: "PHB", level: 17, ki: 6, spell: "cone-of-cold", summary: "Spend 6 ki to cast cone of cold." },
    { name: "River of Hungry Flame", source: "PHB", level: 17, ki: 5, spell: "wall-of-fire", summary: "Spend 5 ki to cast wall of fire." },
    { name: "Wave of Rolling Earth", source: "PHB", level: 17, ki: 6, spell: "wall-of-stone", summary: "Spend 6 ki to cast wall of stone." }
  ],

  // Rune Knight runes, TCE p.44-45. Know 2 at 3rd, 3 at 7th, 4 at 10th, 5 at 15th; swap one on a fighter level.
  // Each rune's active effect: once per short or long rest. Save DC = 8 + prof + CON.
  runes: [
    { name: "Cloud Rune", source: "TCE", level: 3, summary: "Passive: advantage on Sleight of Hand and Deception checks. Active (reaction): when you or a creature you can see within 30 feet is hit by an attack, redirect it to a different creature within 30 feet of you (not the attacker), using the same roll." },
    { name: "Fire Rune", source: "TCE", level: 3, save: "str", summary: "Passive: double proficiency bonus on ability checks that use a tool proficiency. Active: when you hit with a weapon attack, deal +2d6 fire; the target makes a Strength save or is restrained for 1 minute, taking 2d6 fire at the start of each of its turns and repeating the save at the end of each." },
    { name: "Frost Rune", source: "TCE", level: 3, summary: "Passive: advantage on Animal Handling and Intimidation checks. Active (bonus action): +2 to Strength- and Constitution-based ability checks and saves for 10 minutes." },
    { name: "Stone Rune", source: "TCE", level: 3, save: "wis", summary: "Passive: advantage on Insight checks and 120-foot darkvision. Active (reaction): when a creature you can see ends its turn within 30 feet, it makes a Wisdom save or is charmed by you for 1 minute, with speed 0 and incapacitated; it repeats the save at the end of each of its turns." },
    { name: "Hill Rune", source: "TCE", level: 7, summary: "Passive: advantage on saves against being poisoned and resistance to poison damage. Active (bonus action): resistance to bludgeoning, piercing, and slashing damage for 1 minute." },
    { name: "Storm Rune", source: "TCE", level: 7, summary: "Passive: advantage on Arcana checks and you can't be surprised unless incapacitated. Active (bonus action): for 1 minute, when you or a creature you can see within 60 feet makes an attack roll, save, or ability check, you can use your reaction to give the roll advantage or disadvantage." }
  ],

  // Path of the Totem Warrior, PHB p.50; Elk and Tiger SCAG p.121-122. One spirit per feature; they can differ.
  // level 3 = Totem Spirit, 6 = Aspect of the Beast, 14 = Totemic Attunement.
  totemSpirits: [
    { name: "Bear", source: "PHB", level: 3, summary: "While raging, you resist all damage except psychic." },
    { name: "Eagle", source: "PHB", level: 3, summary: "While raging and not in heavy armor, others have disadvantage on opportunity attacks against you, and you can Dash as a bonus action." },
    { name: "Elk", source: "SCAG", level: 3, summary: "While raging and not in heavy armor, your walking speed increases by 15 feet." },
    { name: "Tiger", source: "SCAG", level: 3, summary: "While raging, add 10 feet to your long jump distance and 3 feet to your high jump distance." },
    { name: "Wolf", source: "PHB", level: 3, summary: "While raging, your friends have advantage on melee attacks against any hostile creature within 5 feet of you." },
    { name: "Bear", source: "PHB", level: 6, summary: "Your carrying capacity (including maximum load and push, drag, lift) doubles, and you have advantage on Strength checks to push, pull, lift, or break objects." },
    { name: "Eagle", source: "PHB", level: 6, summary: "You see up to 1 mile away clearly, picking out details as if they were 100 feet away, and dim light doesn't give you disadvantage on Perception checks." },
    { name: "Elk", source: "SCAG", level: 6, summary: "Your travel pace doubles, mounted or on foot, as does that of up to ten companions within 60 feet of you while you aren't incapacitated." },
    { name: "Tiger", source: "SCAG", level: 6, summary: "Gain proficiency in two skills of your choice from Athletics, Acrobatics, Stealth, and Survival." },
    { name: "Wolf", source: "PHB", level: 6, summary: "You can track creatures at a fast pace and move stealthily at a normal pace." },
    { name: "Bear", source: "PHB", level: 14, summary: "While raging, hostile creatures within 5 feet of you have disadvantage on attacks against targets other than you or another character with this feature, unless they can't see or hear you or can't be frightened." },
    { name: "Eagle", source: "PHB", level: 14, summary: "While raging, you have a flying speed equal to your walking speed, but you fall if you end your turn in the air with nothing else holding you up." },
    { name: "Elk", source: "SCAG", level: 14, save: "str", summary: "While raging, use a bonus action during your move to pass through a Large or smaller creature's space; it makes a Strength save (DC 8 + your STR modifier + proficiency bonus) or is knocked prone and takes 1d12 + your STR modifier bludgeoning damage." },
    { name: "Tiger", source: "SCAG", level: 14, summary: "While raging, if you move at least 20 feet straight toward a Large or smaller target right before a melee weapon attack against it, you can make one more melee weapon attack against it as a bonus action." },
    { name: "Wolf", source: "PHB", level: 14, summary: "While raging, when you hit a Large or smaller creature with a melee weapon attack, you can knock it prone as a bonus action." }
  ],

  // Hunter ranger choices, PHB p.93. One option per feature.
  hunterOptions: [
    { name: "Colossus Slayer", source: "PHB", level: 3, feature: "Hunter's Prey", summary: "Once per turn, a weapon hit on a creature below its hit point maximum deals an extra 1d8 damage." },
    { name: "Giant Killer", source: "PHB", level: 3, feature: "Hunter's Prey", summary: "When a Large or larger creature within 5 feet of you hits or misses you with an attack, you can use your reaction to attack it right after, if you can see it." },
    { name: "Horde Breaker", source: "PHB", level: 3, feature: "Hunter's Prey", summary: "Once on each of your turns, after a weapon attack, attack again with the same weapon against another creature that is within 5 feet of the first target and within range." },
    { name: "Escape the Horde", source: "PHB", level: 7, feature: "Defensive Tactics", summary: "Opportunity attacks against you have disadvantage." },
    { name: "Multiattack Defense", source: "PHB", level: 7, feature: "Defensive Tactics", summary: "After a creature hits you with an attack, you get +4 AC against all its later attacks this turn." },
    { name: "Steel Will", source: "PHB", level: 7, feature: "Defensive Tactics", summary: "Advantage on saving throws against being frightened." },
    { name: "Volley", source: "PHB", level: 11, feature: "Multiattack", summary: "As an action, make a ranged attack against any number of creatures within 10 feet of a point you can see in range, with separate attack rolls and one piece of ammunition per target." },
    { name: "Whirlwind Attack", source: "PHB", level: 11, feature: "Multiattack", summary: "As an action, make a melee attack against any number of creatures within 5 feet of you, rolling separately for each." },
    { name: "Evasion", source: "PHB", level: 15, feature: "Superior Hunter's Defense", summary: "On a Dexterity save for half damage, you take none on a success and half on a failure." },
    { name: "Stand Against the Tide", source: "PHB", level: 15, feature: "Superior Hunter's Defense", summary: "When a hostile creature misses you with a melee attack, use your reaction to make it repeat the same attack against another creature of your choice (not itself)." },
    { name: "Uncanny Dodge", source: "PHB", level: 15, feature: "Superior Hunter's Defense", summary: "When an attacker you can see hits you, use your reaction to halve the damage." }
  ],

  // Favored Enemy, PHB p.91: one choice at 1st, another at 6th and 14th. Each choice is one creature type, or two
  // humanoid races (e.g. gnolls and orcs). Benefit: advantage on Wisdom (Survival) to track them and Intelligence checks
  // to recall information about them; learn one language they speak, if any.
  // TCE-optional replacement Favored Foe (TCE p.56): prof-bonus uses per long rest; on a hit, mark the target for
  // 1 minute (concentration as for a spell); first hit each turn deals +1d4, 1d6 at 6th, 1d8 at 14th.
  favoredEnemies: ["aberrations", "beasts", "celestials", "constructs", "dragons", "elementals", "fey", "fiends", "giants", "monstrosities", "oozes", "plants", "undead", "two humanoid races"],
  favoredEnemyRules: { picksAt: [1, 6, 14], humanoidRaces: 2, source: "PHB p.91", replacement: { name: "Favored Foe", source: "TCE", optional: true, uses: "proficiency bonus/long rest", damage: { 1: "1d4", 6: "1d6", 14: "1d8" } } },

  // Natural Explorer, PHB p.91: one terrain at 1st, another at 6th and 10th. INT/WIS checks about the terrain double
  // proficiency if proficient; while traveling 1+ hour there, difficult terrain doesn't slow the group, it can't get lost
  // except by magic, you stay alert while doing other travel activities, you move stealthily at normal pace alone, find
  // twice the food foraging, and learn the number, sizes, and timing of creatures you track.
  // TCE-optional replacement Deft Explorer (TCE p.56): Canny (1st: expertise in one skill, +2 languages), Roving (6th:
  // +5 ft walking speed, climb and swim speed equal to walking), Tireless (10th: action, 1d8 + WIS temp HP,
  // prof-bonus uses per long rest; a short rest reduces exhaustion by 1).
  favoredTerrains: ["arctic", "coast", "desert", "forest", "grassland", "mountain", "swamp", "Underdark"],
  favoredTerrainRules: { picksAt: [1, 6, 10], source: "PHB p.91" },

  // Dragonborn Draconic Ancestry, PHB p.34. Breath DC 8 + CON + prof; 2d6, 3d6 at 6th, 4d6 at 11th, 5d6 at 16th
  // character level; once per short or long rest. Draconic Bloodline sorcerers (PHB p.102) pick from the same list.
  draconicAncestry: [
    { dragon: "Black", damage: "acid", breath: "5 by 30 ft. line", save: "dex" },
    { dragon: "Blue", damage: "lightning", breath: "5 by 30 ft. line", save: "dex" },
    { dragon: "Brass", damage: "fire", breath: "5 by 30 ft. line", save: "dex" },
    { dragon: "Bronze", damage: "lightning", breath: "5 by 30 ft. line", save: "dex" },
    { dragon: "Copper", damage: "acid", breath: "5 by 30 ft. line", save: "dex" },
    { dragon: "Gold", damage: "fire", breath: "15 ft. cone", save: "dex" },
    { dragon: "Green", damage: "poison", breath: "15 ft. cone", save: "con" },
    { dragon: "Red", damage: "fire", breath: "15 ft. cone", save: "dex" },
    { dragon: "Silver", damage: "cold", breath: "15 ft. cone", save: "con" },
    { dragon: "White", damage: "cold", breath: "15 ft. cone", save: "con" }
  ],

  // Circle of the Land, PHB p.68-69: terrain chosen at 2nd sets the circle spells.
  landCircleTerrains: ["arctic", "coast", "desert", "forest", "grassland", "mountain", "swamp", "underdark"],

  // Wild Shape, PHB p.66-67 (druid level, not character level). 2 uses per short or long rest; unlimited at 20th.
  // Lasts up to half your druid level in hours (rounded down). Moon (PHB p.69): bonus action; Circle Forms CR 1 at
  // 2nd, then druid level / 3 rounded down from 6th (movement limits still apply); at 10th spend two uses to become an
  // air, earth, fire, or water elemental.
  wildShapeRules: [
    { level: 2, maxCR: "1/4", limits: "no flying or swimming speed", example: "wolf" },
    { level: 4, maxCR: "1/2", limits: "no flying speed", example: "crocodile" },
    { level: 8, maxCR: "1", limits: "none", example: "giant eagle" }
  ],
  moonWildShapeRules: [
    { level: 2, maxCR: "1" }, { level: 6, maxCR: "2" }, { level: 9, maxCR: "3" }, { level: 12, maxCR: "4" },
    { level: 15, maxCR: "5" }, { level: 18, maxCR: "6" }
  ],

  // Kensei weapons, Way of the Kensei (XGE p.34): choose 2 at 3rd (one melee, one ranged), one more at 6th, 11th, 17th.
  // Must be a simple or martial weapon without the heavy or special property; longbow allowed.
  kenseiWeapons: { picksAt: [3, 6, 11, 17], firstPick: "one melee and one ranged weapon", allowed: "simple or martial weapons without the heavy or special property; the longbow is allowed" },

  // Path of the Storm Herald (XGE p.10): environment chosen at 3rd, can change on a barbarian level.
  stormHeraldEnvironments: [
    { name: "Desert", source: "XGE", summary: "Aura: when it activates, each other creature of your choice in it takes 2 fire damage (3 at 5th, 4 at 10th, 5 at 15th, 6 at 20th)." },
    { name: "Sea", source: "XGE", summary: "Aura: when it activates, pick one other creature in it; it makes a Dexterity save, taking 1d6 lightning damage on a failure, half on a success (2d6 at 10th, 3d6 at 15th, 4d6 at 20th)." },
    { name: "Tundra", source: "XGE", summary: "Aura: when it activates, each creature of your choice in it gains 2 temporary HP (3 at 5th, 4 at 10th, 5 at 15th, 6 at 20th)." }
  ],

  // Divine Soul sorcerer affinity (XGE p.50): choose one; the listed spell is learned and doesn't count against spells known.
  divineSoulAffinity: [
    { name: "Good", spell: "cure-wounds" }, { name: "Evil", spell: "inflict-wounds" }, { name: "Law", spell: "bless" },
    { name: "Chaos", spell: "bane" }, { name: "Neutrality", spell: "protection-from-evil-and-good" }
  ],

  // How many options are known per class level (the counts the app needs to prompt for at level-up).
  progressions: {
    invocationsKnown: { 2: 2, 5: 3, 7: 4, 9: 5, 12: 6, 15: 7, 18: 8 },        // PHB p.106, warlock level
    metamagicKnown: { 3: 2, 10: 3, 17: 4 },                                     // PHB p.101, sorcerer level
    maneuversKnown: { 3: 3, 7: 5, 10: 7, 15: 9 },                               // PHB p.73, fighter level
    superiorityDice: { 3: 4, 7: 5, 15: 6 },                                     // PHB p.73
    superiorityDie: { 3: 8, 10: 10, 18: 12 },                                   // PHB p.73-74
    infusionsKnown: { 2: 4, 6: 6, 10: 8, 14: 10, 18: 12 },                      // TCE p.10, artificer level
    infusedItems: { 2: 2, 6: 3, 10: 4, 14: 5, 18: 6 },                          // TCE p.10
    elementalDisciplines: { 3: 1, 6: 2, 11: 3, 17: 4 },                         // PHB p.80, plus Elemental Attunement
    disciplineMaxKi: { 3: 2, 5: 3, 9: 4, 13: 5, 17: 6 },                        // PHB p.80
    arcaneShotOptions: { 3: 2, 7: 3, 10: 4, 15: 5, 18: 6 },                     // XGE p.28
    runesKnown: { 3: 2, 7: 3, 10: 4, 15: 5 },                                   // TCE p.44
    crimsonRites: { 2: 1, 7: 2, 14: 3 },                                        // BH 2020; esoteric from 14th
    bloodCursesKnown: { 1: 1, 6: 2, 10: 3, 14: 4, 18: 5 },                      // BH 2020
    bloodMaledictUses: { 1: 1, 6: 2, 13: 3, 17: 4 },                            // BH 2020, short or long rest
    hemocraftDie: { 1: 4, 5: 6, 11: 8, 17: 10 }                                 // BH 2020
  }
});
