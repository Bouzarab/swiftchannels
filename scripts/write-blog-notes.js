#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets/blog/title-notes.json');
const LANGS = ['fr', 'es', 'de', 'it', 'nl'];
const SPLIT = '\n@@SC_NOTE_SPLIT@@\n';

const NOTES_EN = {
  "12 Angry Men": "A single jury room becomes a pressure cooker about doubt, prejudice and responsibility; choose it when you want pure dialogue with real moral stakes.",
  "13th": "Ava DuVernay connects slavery, law, incarceration and political language into a sharp documentary argument that is easier to follow than its subject is comfortable.",
  "1917": "Built as one continuous mission through the First World War, it works best when you want tension, scale and simple human urgency in the same frame.",
  "A Few Good Men": "Courtroom rhythm, military pressure and a famous final confrontation make it a strong pick when you want legal drama with mainstream energy.",
  "Anatomy of a Murder": "A patient courtroom classic where strategy, ambiguity and character detail matter more than twists; ideal for viewers who enjoy legal chess.",
  "Anne with an E": "A warm but not weightless adaptation that gives Anne's imagination, loneliness and resilience enough room to feel fresh for modern families.",
  "Apollo 13": "The drama comes from engineers, astronauts and families solving one problem after another under impossible pressure; it is survival cinema without exaggeration.",
  "Arrival": "A thoughtful alien-contact story where language, memory and grief matter as much as the spacecraft; choose it for science fiction with emotion.",
  "Avatar: The Last Airbender": "Adventure, mythology and character growth build steadily across the seasons, making it easy for children and adults to share.",
  "Band of Brothers": "The series follows Easy Company from training to Europe with a documentary seriousness that makes the combat personal rather than decorative.",
  "Before Sunset": "Two people walk, talk and test the life they almost had; choose it when you want romance built from timing, regret and chemistry.",
  "Better Call Saul": "A slow transformation story where legal schemes, family wounds and cartel pressure turn a comic supporting character into a tragic lead.",
  "Black Swan": "Ballet discipline becomes psychological horror as ambition, control and identity collapse into one another; intense, stylish and deliberately uncomfortable.",
  "Blade Runner 2049": "A vast, melancholy detective story about memory and identity, with images that reward a big screen and patient attention.",
  "Bluey": "Short family stories with unusual emotional precision; it is playful for children but often quietly useful for parents too.",
  "Borgen": "A political drama about coalition-building, compromise and personal cost, strongest when it shows how power changes ordinary decisions.",
  "Breaking Bad": "A chemistry teacher's criminal reinvention becomes a study of pride, fear and consequences; the hook is watching every choice narrow the next one.",
  "Bridge of Spies": "Cold War negotiation becomes a calm, principled thriller about patience, procedure and doing the right thing when nobody applauds it.",
  "Broadchurch": "A coastal murder investigation turns into a study of grief, suspicion and community damage, anchored by performances that keep the mystery human.",
  "Brooklyn Nine-Nine": "Fast jokes, warm ensemble chemistry and low-stress case stories make it an easy comfort watch that still rewards repeat viewing.",
  "Burning": "A quiet encounter turns into class tension and unresolved suspicion; choose it when you want a mystery that lingers instead of explaining itself.",
  "Call My Agent!": "A French talent-agency comedy where celebrity chaos, office politics and affection for cinema keep the episodes light but smart.",
  "Cast Away": "Tom Hanks carries a survival story built on isolation, routine and hope; it is most powerful when almost nothing is being said.",
  "Chernobyl": "A disaster miniseries about denial, expertise and political fear, staged with a procedural clarity that makes every small decision frightening.",
  "City of God": "A kinetic crime epic where childhood, poverty and violence collide in Rio; the energy is high, but the social detail gives it weight.",
  "Coco": "Family memory, music and grief are handled with rare warmth, making it a reliable choice for a mixed-age audience.",
  "Come and See": "One of the harshest anti-war films ever made, following a child through terror without turning violence into entertainment.",
  "Dark": "A dense German puzzle series about families, time loops and inherited damage; best for viewers who enjoy keeping track of details.",
  "Deadwood": "A frontier drama powered by language, lawlessness and community-building, where every alliance feels temporary and every insult has music.",
  "Dear Zachary: A Letter to a Son About His Father": "A personal true-crime documentary that begins as a tribute and becomes something much more devastating.",
  "Diego Maradona": "Archival footage turns the football icon into a story about genius, fame, pressure and the cost of being worshipped.",
  "ER": "Hospital pressure, rotating staff and urgent moral calls make it a durable medical drama, especially for viewers who like ensemble storytelling.",
  "Ex Machina": "A contained AI thriller where conversations become tests of power, desire and manipulation; small in scale, sharp in aftertaste.",
  "Fleabag": "A brutally funny character study about grief, sex, family and self-sabotage, built around a voice that feels intimate without being soft.",
  "Ford v Ferrari": "Racing becomes a story of craft, ego and corporate interference, with enough track energy for fans and enough character for everyone else.",
  "Free Solo": "A climbing documentary that turns preparation, fear and obsession into suspense even when you already know the historical outcome.",
  "Fruitvale Station": "A compact, humane drama that follows one young man through an ordinary day made unbearable by what the viewer knows is coming.",
  "Get Out": "Social satire and horror mechanics lock together cleanly, turning polite discomfort into a thriller about race, control and exploitation.",
  "Gomorrah": "A bleak Italian crime series that treats organized crime as a system of fear, money and loyalty rather than glamour.",
  "Gone Girl": "A twisty marriage thriller where media spectacle and private resentment feed each other; best when you want a glossy, nasty puzzle.",
  "GoodFellas": "A rush of narration, violence and status hunger that makes organized crime feel seductive, exhausting and finally empty.",
  "Groundhog Day": "A time-loop comedy that keeps getting deeper, using repetition to turn ego, boredom and kindness into something surprisingly graceful.",
  "Halt and Catch Fire": "A tech-industry drama about ambition, reinvention and collaboration, strongest when it lets failure become part of the character work.",
  "Heat": "A crime saga built around professionals on opposite sides of Los Angeles, where the planning, silence and shootouts all carry weight.",
  "Hereditary": "Family grief becomes occult horror in a film that is patient, nasty and emotionally oppressive long before it becomes explicit.",
  "Hoop Dreams": "A sports documentary that becomes a bigger story about family, school, class and the fragile economics of chasing talent.",
  "Inside Man": "A cleanly engineered bank-robbery puzzle with social bite, confident pacing and enough misdirection to make the plan fun to follow.",
  "Interstellar": "Space spectacle, family longing and big theoretical ideas combine into an emotional science-fiction epic built for a large screen.",
  "John Adams": "A careful historical miniseries about politics, independence and marriage, useful when you want period drama with civic detail.",
  "John Wick: Chapter 4": "A maximalist action film built from duels, neon spaces and clean physical choreography; choose it when style and momentum matter most.",
  "L.A. Confidential": "A polished noir about corruption, celebrity and ambition in 1950s Los Angeles, driven by characters who keep revealing new motives.",
  "Let the Right One In": "A lonely coming-of-age story wrapped in vampire horror, more interested in tenderness and danger than cheap shocks.",
  "Life of Pi": "A survival fable with spiritual questions, visual beauty and a story that keeps shifting meaning after the voyage ends.",
  "Little Miss Sunshine": "A road comedy about a broken family moving in the same direction for once, balancing awkward humor with real tenderness.",
  "Logan Lucky": "A blue-collar heist comedy where the pleasure is in the odd team, the homemade plan and the relaxed confidence of the reveal.",
  "Mad Max: Fury Road": "A stripped-down desert chase with Furiosa and Max fighting through war rigs, cult violence and survival politics; spectacle with unusually clean storytelling.",
  "Mad Men": "Advertising becomes a lens for identity, desire and American self-invention, with character changes that land slowly rather than loudly.",
  "Making a Murderer": "A true-crime series shaped around evidence, institutions and doubt, strongest when it makes the legal process feel unstable.",
  "Man on Wire": "A documentary heist about Philippe Petit's Twin Towers walk, full of planning, risk and the strange beauty of impossible obsession.",
  "Mare of Easttown": "A small-town crime story where the detective work matters, but family guilt and community history matter just as much.",
  "Memories of Murder": "A serial-killer investigation that becomes a portrait of frustration, bad methods and institutional limits, with dark humor under the dread.",
  "Merlin": "A lighter fantasy adventure built around friendship, destiny and court intrigue, easy to enter without needing heavy mythology.",
  "Mission: Impossible - Fallout": "Practical stunt work, clean geography and escalating betrayals make it one of the easiest modern action films to recommend.",
  "Money Heist": "A high-emotion Spanish heist series where masks, plans and personal loyalties matter as much as the robbery itself.",
  "Munich": "A political revenge thriller that keeps questioning the cost of retaliation, making suspense out of secrecy, grief and moral uncertainty.",
  "My Neighbor Totoro": "A gentle childhood film about wonder, waiting and rural imagination, perfect when you want calm rather than conflict.",
  "Nebraska": "A dry road movie about age, disappointment and family obligation, funny in small ways and moving without forcing sentiment.",
  "Ocean's Eleven": "A glossy ensemble heist where charm, timing and misdirection are the main pleasures; relaxed, clever and very rewatchable.",
  "Paddington 2": "A family comedy with rare sweetness and craft, turning kindness, prison jokes and visual invention into something genuinely joyful.",
  "Paris, Texas": "A lonely road movie about silence, memory and reconnection, carried by desert images and conversations that arrive slowly.",
  "Parks and Recreation": "A workplace comedy that grows warmer and sharper as the ensemble clicks, ideal when you want optimism without blandness.",
  "Prisoners": "A grim missing-child thriller where grief and suspicion push ordinary people toward frightening choices; heavy, tense and carefully controlled.",
  "Raging Bull": "Boxing becomes a portrait of jealousy, self-destruction and masculine rage, filmed with a force that still feels raw.",
  "Rififi": "A French heist classic famous for its silent robbery sequence, where patience and procedure create more suspense than noise.",
  "Rocky": "Less a boxing film than a working-class character story about dignity, discipline and getting one honest chance.",
  "Rome": "A political and military drama where empire-building is seen through both famous leaders and ordinary soldiers caught in history.",
  "Rosemary's Baby": "Domestic anxiety, paranoia and control build slowly into horror, making the apartment feel dangerous long before anything supernatural is clear.",
  "Rush": "Formula One rivalry becomes a study of risk, discipline and ego, with enough character contrast to work beyond racing fans.",
  "Saving Private Ryan": "A war film remembered for its combat realism, but its lasting pull is the question of duty placed on exhausted men.",
  "Schitt's Creek": "A comedy that starts with rich-people discomfort and grows into a warm study of reinvention, family and chosen community.",
  "Searching for Sugar Man": "A music mystery that follows rumor, fandom and rediscovery, with the emotional lift of a story that sounds invented but is not.",
  "Senna": "Archival footage makes the racing legend feel immediate, focusing on talent, rivalry, spirituality and danger without needing talking-head explanation.",
  "Seven": "A rain-soaked serial-killer thriller where atmosphere, moral disgust and procedural dread matter as much as the final reveal.",
  "Six Feet Under": "A family funeral-home drama about death, intimacy and avoidance, with an ending that remains a benchmark for emotional closure.",
  "Spirited Away": "A girl enters a spirit world full of strange rules, greed and courage; the images are magical, but the emotions stay clear.",
  "Stand by Me": "A coming-of-age journey where friendship, fear and memory matter more than the destination; short, direct and quietly painful.",
  "Succession": "A corporate family war built from insults, insecurity and power games, with comedy that makes the damage sharper.",
  "Superbad": "A teen comedy whose embarrassment works because the friendship underneath is sincere, messy and close to ending.",
  "The Act of Killing": "A disturbing documentary that asks perpetrators to restage violence, exposing fantasy, denial and political impunity in unforgettable ways.",
  "The Americans": "A spy drama where marriage, parenting and ideology are as dangerous as the missions, building tension through long-term consequences.",
  "The Big Lebowski": "A shaggy comic noir where the plot matters less than the oddball rhythm, quotable characters and relaxed absurdity.",
  "The Bourne Ultimatum": "A fast, paranoid spy chase that turns identity, surveillance and movement into clean blockbuster momentum.",
  "The Bridge": "A Nordic crime series where a cross-border case pairs contrasting detectives and lets atmosphere, procedure and character friction do the work.",
  "The Conversation": "A surveillance thriller about listening, guilt and professional paranoia, quiet enough to make every sound feel suspicious.",
  "The Crown": "Royal history becomes a drama of duty, image and private cost, strongest when protocol collides with personal need.",
  "The Dark Knight": "A crime epic disguised as a superhero film, with Batman, Dent and the Joker turning Gotham into a test of order under pressure.",
  "The Departed": "An undercover crime thriller where identity, loyalty and fear keep tightening until everyone seems one mistake from exposure.",
  "The Fugitive": "A clean chase thriller with a wrongly accused doctor, a relentless marshal and enough practical momentum to stay gripping decades later.",
  "The Grand Budapest Hotel": "A precise comic adventure about loyalty, memory and old-world elegance, with visual design that makes every scene feel composed.",
  "The Hurt Locker": "A war film focused on bomb disposal and adrenaline, less about speeches than the psychology of men addicted to danger.",
  "The Incredibles": "A superhero family film about identity, marriage and teamwork, with action that still feels clean and character-led.",
  "The Innocents": "A ghost story built from suggestion, repression and atmosphere, ideal when you prefer unease to obvious scares.",
  "The Iron Giant": "A sincere animated story about fear, friendship and choosing what kind of person to become, with a big emotional finish.",
  "The Jinx: The Life and Deaths of Robert Durst": "A true-crime series driven by interviews, contradictions and unearthed evidence, famous for how its investigation keeps escalating.",
  "The Last Dance": "A sports documentary about Michael Jordan and the Bulls that also studies obsession, leadership, resentment and the cost of winning.",
  "The Last Kingdom": "A historical adventure about identity, loyalty and shifting kingdoms, useful when you want battles plus long-form character loyalty.",
  "The Leftovers": "A grief mystery about people living after an impossible disappearance, more interested in belief and pain than neat answers.",
  "The Lives of Others": "A surveillance drama where politics becomes intimate, following how watching another life can quietly change the watcher.",
  "The Martian": "A stranded astronaut solves problems with humor and science, making survival feel practical, optimistic and surprisingly light.",
  "The Matrix": "Cyberpunk action and philosophical paranoia combine in a film whose world, rules and style are still instantly readable.",
  "The Muppet Show": "A variety-show comedy with songs, sketches and backstage chaos, still useful when a family wants something silly and low-pressure.",
  "The Nightmare Before Christmas": "A gothic musical fantasy where Halloween style meets Christmas longing, short enough for an easy seasonal watch.",
  "The Office": "A workplace mockumentary where cringe comedy slowly turns into affection for people trapped in ordinary routines.",
  "The Others": "A candlelit ghost story that uses silence, grief and isolation to build dread before its elegant final turn.",
  "The Queen's Gambit": "A stylish limited series about chess, addiction and self-possession, accessible even if you do not know the game.",
  "The Secret in Their Eyes": "A crime mystery that ties investigation to memory, love and political fear, with an ending built to be remembered.",
  "The Shining": "A haunted-hotel film where family tension, isolation and impossible spaces create dread long before the violence arrives.",
  "The Sixth Sense": "A supernatural drama remembered for its twist, but held together by grief, patience and a child who feels genuinely frightened.",
  "The Sopranos": "A crime-family drama where therapy, violence and domestic life sit uncomfortably together, changing what television drama could be.",
  "The Staircase": "A true-crime documentary shaped by access, legal strategy and uncertainty, compelling because each answer creates another question.",
  "The Sting": "A con-game classic where charm, timing and layered deception make the pleasure come from watching the trap close.",
  "The Thin Red Line": "A reflective war film that treats battle as fear, nature, memory and philosophy rather than simple heroics.",
  "The Town": "A Boston crime thriller where robberies, loyalty and the wish to escape pull against one another with muscular momentum.",
  "The Verdict": "A courtroom drama about a damaged lawyer trying to recover his conscience, patient enough to let silence and regret do work.",
  "The West Wing": "A political workplace drama built on idealism, argument and speed, best when you want competence as entertainment.",
  "The Wire": "A city-wide crime drama where police, dealers, schools, politics and media connect into one patient portrait of systems.",
  "The Witch": "A folk-horror story about faith, fear and family collapse, using period detail and restraint to make paranoia feel physical.",
  "The Wrestler": "A bruised character study about performance, regret and aging, with wrestling treated as both livelihood and self-punishment.",
  "The X-Files": "A paranormal procedural where conspiracy, skepticism and belief give each case a bigger shadow than the monster of the week.",
  "Thelma & Louise": "A road movie about friendship, escape and consequences, still powerful because its freedom feels thrilling and dangerous at once.",
  "Thief": "A neon-lit professional-criminal film about control, codes and one last clean future that may never have been possible.",
  "Tinker Tailor Soldier Spy": "A quiet spy puzzle of glances, files and betrayals, best for viewers who prefer suspicion over explosions.",
  "Top Gun: Maverick": "A legacy sequel built around practical flight action, mentorship and risk, delivering spectacle without losing the emotional line.",
  "Touching the Void": "A survival documentary that turns a mountain accident into a brutal test of pain, memory and impossible decision-making.",
  "Toy Story": "A bright adventure about jealousy, loyalty and growing up, still easy to watch because the emotional rules are simple and strong.",
  "Unbelievable": "A crime miniseries about belief, trauma and patient investigation, strongest when it contrasts institutional failure with careful police work.",
  "When They See Us": "A painful limited series about accusation, race and institutional failure, built to make the human cost impossible to abstract.",
  "Wind River": "A cold, grief-heavy mystery where landscape, jurisdiction and trauma shape the investigation as much as the clues.",
  "Witness for the Prosecution": "A courtroom mystery with theatrical wit and sharp reversals, ideal when you want classic legal suspense with a sting.",
  "Won't You Be My Neighbor?": "A gentle documentary about Fred Rogers that treats kindness as deliberate work rather than vague sentiment.",
  "Y tu mamá también": "A Mexican road film where desire, class and friendship shift under the surface of a loose summer journey.",
  "Zodiac": "A procedural obsession story where the unsolved case becomes less a puzzle than a long-term psychological infection."
};

async function translate(text, lang) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl='
    + encodeURIComponent(lang) + '&dt=t&q=' + encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} while translating ${lang}`);
  const data = await res.json();
  return data[0].map(part => part[0]).join('');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const titles = Object.keys(NOTES_EN);
  const out = Object.fromEntries(titles.map(title => [title, { en: NOTES_EN[title] }]));
  for (const lang of LANGS) {
    for (let start = 0; start < titles.length; start += 18) {
      const batch = titles.slice(start, start + 18);
      const translated = await translate(batch.map(title => NOTES_EN[title]).join(SPLIT), lang);
      const chunks = translated.split(/@@SC_NOTE_SPLIT@@/).map(s => s.trim());
      if (chunks.length !== batch.length) throw new Error(`Translation split failed for ${lang}: ${chunks.length}/${batch.length}`);
      batch.forEach((title, i) => { out[title][lang] = chunks[i]; });
      await sleep(250);
    }
    console.log(`translated ${lang}`);
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`wrote ${OUT}`);
})();
