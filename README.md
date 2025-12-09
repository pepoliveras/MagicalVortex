🌀 Magical Vortex: The Card Game

Web app Game based on a 2002 early concept I created for a Fast paced Duel Card Game in a Magic Fantasy world.

📖 About The Project

Welcome to the Universe of the Vortex. In this world, magic is a fundamental force and the origin of all things. However, the balance has been shattered. An astronomical Magic Vortex has appeared, threatening to consume existence itself.

This web application brings to life a strategic card battling system where players must master the duality of White and Black magic. You must channel primordial energies, exploit elemental affinities, and manipulate the chaotic Vortex to survive.

Will you save the universe, or become the last survivor of its end?

🎮 Gameplay & Mechanics

The Objective

Defeat your opponent by reducing their Vitality (HP) to 0. You can attack directly or take a risk by utilizing the chaotic power of the Vortex, where power can turn against the user.

🃏 The Cards

The deck consists of White and Black cards, divided into two types:

Attack (Lightning symbol)

Defense (Shield symbol)

Values: Range from 1 to 10.

⚔️ Combat Logic

The core of the duel lies in color interaction:

Opposite Colors (Black vs. White): Simple subtraction.

Damage = Attack Value - Defense Value

Same Color (Clash): The defense is penetrated more easily.

Damage = Attack Value - (Defense Value / 2)

Reflect: If the resulting damage calculation is negative, the damage bounces back to the attacker!

🌀 The Vortex System

The center of the board features 4 dynamic cards that form The Vortex. Players can use these to augment their Attack or Defense.

Same Color: Adds power to your card.

Different Color: Subtracts power from your card.

Instability: If the calculation results in a negative number, it causes Instability Damage directly to the player using the Vortex.

🆙 Leveling Up

Players can discard cards from their hand that sum up to a value of 10 or more to Level Up (Max Level 3).

Benefits: Increases maximum hand size [MAX Cards + Lvl], increases Max HP [MAX HP + Lvl*10], allows more attacks per turn, and unlocks superior abilities.

🧙‍♂️ Characters & Classes

Choose from 12 unique avatars, each belonging to a specific habitat and possessing a unique starting affinity and ability.

⚪ White Affinity (The Light)

Character

Habitat

Starting Ability

Lore

Druid

Magical Forest

Element Control

Guardian of the Fairy Forest and High Priest of Nature. A judge of the eternal circle who protects Gaia's balance.

Angelus

Heaven City

Light Affinity

A Seraphim descended from the Crystal Spire to purge the Vortex. Wields a sword of starlight and judges with divine wrath.

Monk

Spirit Temple

Light Defense

Grand Master of the Silent Peak. He seeks to restore harmony rather than destroy, deflecting attacks with fluid will.

LightingCat

Savannah Planet

Paladin of Light

Knight Commander of the Solar Pride. A warrior whose roar invokes courage and whose blade shines with the fury of the sun.

⚫ Black Affinity (The Dark)

Character

Habitat

Starting Ability

Lore

Lizard

Reptilian Temple

Magic Control

High Priest of the Emerald Ziggurats. Uses blood rituals to keep the sun burning and believes strength is the only truth.

Diabolus

Inferno Abyss

Dark Lord

Archduke of the Obsidian Pit. A tyrant born of shadow who seeks to twist the Vortex into a portal for his infernal legions.

Insectoid

Alien Lair

Dark Defense

Alpha Supreme of the Hive. A biological war machine. To him, magic is just another resource to harvest.

Necro

Crypt

Dark Affinity

The Lich Lord. Once a scholar, now a master of death. He proves that death is not the end, but a weapon.

⚖️ Neutral Affinity (The Balance)

Character

Habitat

Starting Ability

Lore

Shaman

Volcanic Island

Magic Vision

Voice of the Ancestors. Channels primal totems to see the future and guide his tribe through the chaos.

Techno

Techno City

Magic Knowledge

Unit 734-M, The Singularity. Perceives magic as algorithms. Seeks to decode the Vortex to "update" the universe's OS.

Mystic

Mystical City

Magic Wall

Archmage of the Violet Tower. Weaves spells naturally. Views the Vortex as an unlimited source of mana.

Elemental

Vortex Plane

Vortex Control

Avatar of the Primal Storm. Born from the Vortex itself. Pure, amoral force seeking to return everything to elemental chaos.

⚡ Abilities

Players acquire abilities by discarding a card.

White/Black Characters: Max Abilities = Level + 1.

Neutral Characters: Max Abilities = Level.

Neutral Skills (Universal)

Magic Wall (Lvl I, Active): Discard a card to generate a permanent shield (Value = Card Discarded). The Wall takes damage before HP. It cannot be replaced until destroyed.

Magic Affinity (Lvl I, Active): Heals HP [Card Value / 2 + Level].

Magic Vision (Lvl I, Active): Reveal an opponent's entire hand.

Mind Control (Lvl II, Active): Forces opponent to discard cards equal to your Level.

Elemental Control (Lvl II, Active): Change the Color of one of your own cards [□ ◄ ► ■].

Magic Control (Lvl II, Active): Change the Type of one of your own cards [ATK ◄ ► DEF].

Vortex Control (Lvl II, Passive): Allows using the Vortex for Defense once per turn.

Master Control (Lvl III, Active): Change both Color AND Type of a card.

Master Affinity (Lvl III, Active): Recover HP equal to the full value of the discarded card.

Master Vortex (Lvl III, Passive): Removes the "once per turn" limit on Vortex usage during attacks.

White Affinity Skills

Light Defense (Lvl I, Passive): Increment White Defense cards by [+1 per Level].

Paladin of Light (Lvl I, Passive): Increment White Attack cards by [+1 per Level].

Light Affinity (Lvl II, Active): Discard White card to heal [Card Value / 2 + Level].

Acolyte of Light (Lvl III, Passive): Halves all incoming White damage (rounded down).

Black Affinity Skills

Dark Defense (Lvl I, Passive): Increment Black Defense cards by [+1 per Level].

Dark Lord (Lvl I, Passive): Increment Black Attack cards by [+1 per Level].

Dark Affinity (Lvl II, Active): Discard Black card to heal [Card Value / 2 + Level].

Dark Servant (Lvl III, Passive): Halves all incoming Black damage (rounded down).

🛠️ Technology Stack

Frontend: [e.g., React / Vue / Angular]

Styling: [e.g., CSS3 / Tailwind / SASS]

Logic: [e.g., TypeScript / JavaScript ES6+]

Build Tool: [e.g., Vite / Webpack]

🚀 Installation & Setup

Clone the repository:

git clone [https://github.com/yourusername/vortex-duel.git](https://github.com/yourusername/vortex-duel.git)


Navigate to the project directory:

cd vortex-duel


Install dependencies:

npm install


Run the local server:

npm start

📜 License

Distributed under the MIT License. See LICENSE for more information.

Original Concept & Game Design (2002) by Pep Oliveras.
