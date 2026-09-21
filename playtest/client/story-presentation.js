const STONE_THROW_STORY_PRESENTATION=(()=>{
function cleanStoryHistoryHtml(html){const box=document.createElement('div');box.innerHTML=html||'';box.querySelectorAll('img,button').forEach(n=>n.remove());return box.innerHTML;}
function artUnit(type){return window.__stoneThrowUnitInfoData?.(type)?.art||'';}
function pbGrid(n,classes,art='inf'){
const g=document.createElement('div');g.className='st-pb-grid';g.style.setProperty('--n',n);g.style.setProperty('--art',`url("${artUnit(art)}")`);g.style.setProperty('--cav',`url("${artUnit('cav')}")`);for(let i=0;i<n*n;i++){const c=document.createElement('i');if(classes[i])c.className=classes[i];g.appendChild(c);}return g;}
function lorePunchHtml(data){if(!data?.punch)return '';const kind=data.info?.type==='Core unit'?'core':'special';return '<div class="st-unit-punch '+kind+'"><div class="st-unit-punch-tag">'+data.punch.tag+'</div><div class="st-unit-punch-facts">'+data.punch.facts.map(f=>'<div class="st-unit-punch-fact">'+f+'</div>').join('')+'</div></div>';}
function loreCardHtml(type){const data=window.__stoneThrowUnitInfoData?.(type);if(!data)return '';return '<button class="st-unit-lore-card" type="button" data-unit-lore="'+type+'"><div class="st-unit-info-card"><img class="st-unit-info-art" src="'+data.art+'" alt="'+data.name+' artwork"><div class="st-unit-info-copy"><div class="st-unit-info-name">'+data.name+'</div><div class="st-unit-info-details">'+lorePunchHtml(data)+'</div></div></div></button>';}
return Object.freeze({cleanStoryHistoryHtml,artUnit,pbGrid,lorePunchHtml,loreCardHtml});
})();

// Approved Story narration: presentation only; no authoritative state or RNG.
const STONE_THROW_STORY_NARRATION=(()=>{
const chapters={
  "border": {
    "chapter": 1,
    "title": "AN OLD RIVALRY",
    "paragraphs": [
      "For generations, two kingdoms had faced one another across the same stubborn strip of borderland, and neither had ever been satisfied with where the border was supposed to be. There were maps, of course, but rather too many of them, and each king naturally preferred the version that placed a little more land on his own side of the ink.",
      "Treaties were signed, broken and rewritten while ambassadors spent years arguing over hills, streams, ruined watchtowers and fields nobody had cared much about until the other kingdom claimed them. After enough years, nobody cared much about how the dispute had started. Each new generation simply inherited it from the one before.",
      "And so, as old grudges have a habit of doing, the argument finally acquired banners, armour and sharp objects. Neither kingdom was ready for a great war. Their small armies of Infantry, Cavalry and Archers were hardly the stuff of legend, but every legend has to begin somewhere. By dawn both forces were marching toward the border, and it would have been reassuring if anyone still remembered what the original dispute had been about."
    ],
    "wav": "assets/story/audio/01_an_old_rivalry.wav",
    "sha256": "dcb3eeaeb90667e4fb0e74613986aec4323d104b117aee10baa52153390a55ba",
    "bytes": 3598604
  },
  "castle": {
    "chapter": 2,
    "title": "STONE WALLS",
    "paragraphs": [
      "The first battle ended with one kingdom celebrating and the other searching urgently for better ideas. Fresh soldiers soon gathered beneath the winning banner, since volunteering became considerably more attractive once your side appeared to be winning.",
      "The defeated commanders needed no lengthy council to identify the problem: standing in the open while the enemy shot at them was a poor defensive policy. Before the wounded had even returned, quarrymen were being summoned, carts of stone were rolling toward the front and masons were working by torchlight to raise the first walls.",
      "By morning, the first walls of a Castle were rising above the camp. One kingdom had gained fresh soldiers, while the other had gained something considerably harder to shoot through. Naturally, both kings found a way to call that progress, and for the moment that was about the only thing they still agreed on."
    ],
    "wav": "assets/story/audio/02_stone_walls.wav",
    "sha256": "e68ea56c02ca655096ee157071224a08c614b371666da3bc474948ec7113e84b",
    "bytes": 2807180
  },
  "catapult": {
    "chapter": 3,
    "title": "AN ANSWER IN TIMBER AND STONE",
    "paragraphs": [
      "A Castle changed the battlefield at once. Arrows that had once found soldiers now struck walls, officers disappeared behind battlements, and the army still fighting in the open quickly learned that bravery offered little protection against several feet of stone.",
      "Its engineers were asked for an answer, and by nightfall the workshops were full of timber beams, rope, iron fittings and loud arguments about angles. The soldiers were told to find stones heavy enough to break a wall, but small enough to lift.",
      "The machine that emerged was enormous, awkward and wonderfully simple in principle: if the enemy intended to hide behind a wall, the army would throw something over it. Thus the Catapult entered the war, and the old border dispute gained the first of many inventions that were much easier to admire from a safe distance."
    ],
    "wav": "assets/story/audio/03_an_answer_in_timber_and_stone.wav",
    "sha256": "347e73455223bf600662fcda14a3296c6ad19c134850783ccdb5a8a972955304",
    "bytes": 2794476
  },
  "phase2_equal": {
    "chapter": 4,
    "title": "THE WAR GROWS",
    "paragraphs": [
      "What had begun as a border skirmish had now survived walls, siege engines and several perfectly good chances for both kings to declare that honour had been satisfied. Neither showed the slightest interest. Messengers rode through the towns with fresh orders, smithies worked through the night, and roads that had once carried wool, grain and barrels of ale began filling with soldiers instead.",
      "The small field where the first armies had met could no longer contain the war. Camps spread into the surrounding hills, supply lines stretched farther from home, and the two kingdoms found themselves evenly matched again, with the same walls, the same siege engines and, for the moment, no new trick to spring on one another.",
      "Their armies were simply larger now, and both kings remained certain that the sensible thing was for the other one to surrender."
    ],
    "wav": "assets/story/audio/04_the_war_grows.wav",
    "sha256": "0daa6190a57e0bbfe8b38796e0f8ba91f8d0b9e92219b9121714e7ad6011e79d",
    "bytes": 2712812
  },
  "phase2_dwarf": {
    "chapter": 5,
    "title": "THE MOUNTAINS ANSWER",
    "paragraphs": [
      "Defeat carried news farther than the plains. A few days later, a Dwarven delegation appeared at the gates of the weakened kingdom, dressed in heavy armour and carrying the hammers and shields of their people.",
      "The Dwarves had not come to demand payment or take advantage of a kingdom in trouble. They had heard that an old neighbour and ally was being pushed hard, and their spokesman told the king that friendship meant very little if it survived only the peaceful years. The mountains, he said, would not stand by while an ally fought alone.",
      "The offer was accepted gladly, and before long Dwarven warriors were marching beside the king's soldiers. They brought their strength, their stubborn courage and a simple promise: they had come to help an ally in need, but if the enemy chose to turn its weapons on the Dwarves themselves, the mountains would answer in full.",
      "News of the alliance crossed the valley quickly. The victorious king was less concerned with the Dwarves' reasons than with the fact that his enemy now had Dwarves and he did not. Old agreements with rival mountain clans were suddenly remembered, renewed and interpreted very generously, and the war would soon have Dwarves on both sides."
    ],
    "wav": "assets/story/audio/05_the_mountains_answer.wav",
    "sha256": "8f9d70a12a29ffb0a9a68d93c153c536e1608ffa78817f939603a1a499770638",
    "bytes": 3822252
  },
  "phase2_elf": {
    "chapter": 6,
    "title": "EYES IN THE WOODS",
    "paragraphs": [
      "The Dwarves changed the balance of the war, but not for long. Gold, old promises and a shared dislike of the neighbouring kingdom proved persuasive elsewhere, and soon rival mountain clans were marching beneath the other banner as well.",
      "The next visitors arrived much more quietly. An Elf appeared at the edge of the defeated kingdom's camp without anyone being quite sure how he had passed the sentries, which was embarrassing for men whose job was to notice exactly that sort of thing. His people had watched the war spreading toward the forests and had decided that somebody would soon need scouts who could find trouble before an army marched straight into it.",
      "The Elves offered something the army had struggled to obtain: reliable knowledge of what was happening beyond its own lines. Their scouts could slip deep into enemy territory, move unseen through woods and broken ground, and return with information about troop movements, supply routes and weak positions. The defeated kingdom accepted their help gladly."
    ],
    "wav": "assets/story/audio/06_eyes_in_the_woods.wav",
    "sha256": "df11f57143884183f7c278d74f34266fafa97aea82629c3035a0d709595ca4c6",
    "bytes": 3295564
  },
  "phase2_goblin": {
    "chapter": 7,
    "title": "A TERRIBLE IDEA",
    "paragraphs": [
      "By the time Dwarves and Elves served both kingdoms, stories of the war had travelled far beyond the border. Merchants carried tales of shattered walls and siege stones from market to market, soldiers improved those tales in taverns, and eventually the news reached the goblin clans.",
      "The goblins were astonished. Two wealthy kingdoms had spent months firing arrows, smashing fortifications and inventing increasingly dangerous ways of ruining the other side's day, yet nobody had invited them? After all, they considered explosions both a craft and a perfectly respectable form of entertainment.",
      "A delegation soon appeared outside the gates of the kingdom that had just lost. Their spokesman announced that the goblins had heard about the war and wished to correct the unfortunate lack of goblin participation. The king explained, with increasing firmness, that no correction was required.",
      "The spokesman listened with a broad smile that never once faded, nodded enthusiastically at all the wrong moments and, before the king had quite finished refusing, bowed deeply and headed out.",
      "As he hurried back toward the gates, he shouted something excitedly to the other goblins in their own language. None of the guards understood a word of it, which was probably for the best. Had they spoken Goblin, they would have heard something very close to: “Yesss! He wants us in! Get the bombs ready!”",
      "The delegation disappeared down the road in a burst of cheers, leaving the king with the uneasy feeling that the conversation had not ended quite the way he had intended."
    ],
    "wav": "assets/story/audio/07_a_terrible_idea.wav",
    "sha256": "b24846b7d0578e9664e5c403e7fd749e03da2d5749048821c05d645798397207",
    "bytes": 4975468
  },
  "phase2_sync": {
    "chapter": 8,
    "title": "THE WAR WIDENS",
    "paragraphs": [
      "At first, most people beyond the border had known the war only through rumours. That was no longer true. Soldiers and supply wagons crowded roads once used by farmers and merchants, families watched sons and daughters march away with the armies, and a conflict that had once seemed safely distant was beginning to reach into ordinary lives.",
      "The armies had grown too large for the old battlefield, so the campaign spread across a wider stretch of country. For a short time neither kingdom held a clear advantage, yet neither king showed any interest in ending the war. Too much had already been spent, lost and buried for either ruler to accept anything less than victory.",
      "The temples, meanwhile, were watching a different development. Travellers had begun reporting members of the Necromancer guilds near towns and battlefields touched by the fighting. Necromancers had always been drawn to places where death was common, so a sighting or two would have caused little alarm; the priests became concerned only when the same reports kept arriving from more and more places. Someone, it seemed, was taking an interest in what the war was leaving behind."
    ],
    "wav": "assets/story/audio/08_the_war_widens.wav",
    "sha256": "fcf60d0701938588a29a6ba324c352813f4f916bed205921aea6f4d47aa6e734",
    "bytes": 3739596
  },
  "phase3_necro": {
    "chapter": 9,
    "title": "A DARKER BARGAIN",
    "paragraphs": [
      "Another defeat left one king with very few attractive choices. His army had been pushed back again, every advantage eventually seemed to find its way into enemy hands, and sending more soldiers into the same battles was beginning to look like an expensive method of repeating himself.",
      "His next visitors arrived after sunset. Two figures passed through the gates without horses or escort, their dark robes barely brushing the ground while a thin purple mist trailed behind them. When they spoke, their voices were dry and low, with a second whisper beneath the words that made even the guards edge farther from the throne.",
      "They called themselves Necromancers and claimed that the war had already created the weapon the king needed. Death, fear and destruction left corruption behind, they explained, and with enough of it they could gather that corruption together and release a great Plague upon the enemy. Once unleashed, it would spread across the battlefield and bring ruin to anything caught in its path.",
      "The king understood the danger, but repeated defeat had left him with little faith in safer ideas. He accepted the Necromancers and gave them leave to prepare their work. Across the border, the victorious court publicly condemned the bargain as reckless madness, then privately ordered its advisers to discover exactly what the Necromancers could do. By then, outrage and curiosity had become close companions in both kingdoms."
    ],
    "wav": "assets/story/audio/09_a_darker_bargain.wav",
    "sha256": "5f8d07deaa49b0899c68c97ed850a52bd374b92902a03767b35fd6c2dc486ba4",
    "bytes": 4707788
  },
  "phase3_cleric": {
    "chapter": 10,
    "title": "LIGHT AGAINST THE PLAGUE",
    "paragraphs": [
      "When the Plague finally broke loose, the true cost of the Necromancers' bargain became clear. Even the king who had welcomed them into the war understood that a terrible mistake had been made, but the realisation came too late. Corruption was already spreading across the battlefield, leaving dark scars in the earth and striking whatever lay in its path, while every attempt to contain it failed.",
      "The afflicted king watched from above the battlefield as the ruined ground darkened below. For the first time since the war began, he was not thinking about a larger army, a stronger wall or a better weapon; he was wondering whether anything in his kingdom could stand against what had been unleashed.",
      "Then, as he watched, sunlight broke through the clouds above the city.",
      "Warm light spilled across the walls and courtyards, and the noise of the camp seemed to soften with it. For a brief moment the fear hanging over the kingdom gave way to an unfamiliar calm. Soon afterwards, a guard entered the throne room with news that a holy man from the East had arrived at the gates.",
      "The Cleric entered carrying a tall staff marked with the ancient sign of his order, with a faint golden mist following him as he walked. Even the king rose to receive him. The Clerics of the East were said to descend from holy men of an earlier age, and whether every tale about them was true hardly mattered; kings had learned to speak carefully in their presence.",
      "The Cleric told the king that the Necromancers had disturbed a balance never meant to be handled so carelessly. Their Plague fed on death and suffering, and if left unchecked it would spread far beyond the armies that had summoned it. His order had therefore come to oppose them, not as a favour to any king, but because protecting the living from such darkness was their sacred duty.",
      "He would tend the wounded as well, the Cleric said, and give what aid he could to those who had fallen in battle. Then, before the king had finished considering how to answer, he turned and left the chamber. There had been no request for permission, no discussion of payment and no attempt to negotiate terms. None, the king realised, had been expected.",
      "As the doors closed behind him, the sunlight faded behind the clouds and the familiar weight of the war returned to the palace. Yet the kingdom no longer faced the Plague without an answer, and for the first time since the corruption appeared, that was enough to feel like hope."
    ],
    "wav": "assets/story/audio/10_light_against_the_plague.wav",
    "sha256": "769490e61eee94cff5f965f16297198c14b7c74bf7c9e2feaf0de5b158f9ac0b",
    "bytes": 7624556
  },
  "phase4_monk": {
    "chapter": 11,
    "title": "THE SILENT ORDER",
    "paragraphs": [
      "The war had already attracted soldiers, engineers, priests and powers best discussed quietly, but the next visitor arrived alone. He wore little armour, brought no followers or supplies, and asked only to speak with the king.",
      "The Monk explained that rumours had reached his order of another Monk considering service with the rival kingdom. He had no intention of waiting to discover whether the rumours were true. If members of his order were going to enter this war, he preferred to be the first one standing on the field.",
      "His value, he said, would not come from strength or numbers. Years of training had taught him to sense danger and turn an enemy's attack away from its intended path. If the rival Monk eventually appeared, that training would serve another purpose as well: should the two become aware of one another on the battlefield, he intended to make certain that only one of them remained.",
      "The king had grown accustomed to unusual offers, but this one required remarkably little negotiation. The Monk wanted no army, no gold and no special treatment, only a place among the troops and the chance to reach his rival first.",
      "After Necromancers, Plagues and holy interventions, the king found the simplicity of the arrangement almost refreshing."
    ],
    "wav": "assets/story/audio/11_the_silent_order.wav",
    "sha256": "87a4a37feb5e7c8b3f8e951b696a3b28e1d5d0bc152d182cb5d399459bde23e3",
    "bytes": 4033484
  },
  "phase4_complete": {
    "chapter": 12,
    "title": "FORCES BEST LEFT UNDISTURBED",
    "paragraphs": [
      "For a while, the war settled into an uneasy balance, although very little about it was still ordinary. Mountain clans and Elven scouts marched beside human soldiers, the Necromancer guilds had brought the Plague into the conflict, Clerics of the East now opposed them wherever it spread, and even the secretive Monks had stepped onto the field.",
      "Until now, however, there were powers in the world that both kingdoms had wisely left alone. Old stories spoke of creatures and forces that could change far more than the outcome of a single battle. Kings had avoided seeking them out, not because they doubted such things existed, but because some weapons could cause damage that no victory would ever repair.",
      "As the armies prepared to meet again, those old warnings began to lose their authority. Desperation had become stronger than caution, and advice that had guided sensible rulers for generations was starting to sound, to the two kings at least, less like wisdom and more like an inconvenience."
    ],
    "wav": "assets/story/audio/12_forces_best_left_undisturbed.wav",
    "sha256": "a7d35a1d8c4564bb8a5bc81d6d135067b327673a7b74158ed3e32a8a0e1e816f",
    "bytes": 3269772
  },
  "phase5_dragon": {
    "chapter": 13,
    "title": "FIRE IN THE MOUNTAINS",
    "paragraphs": [
      "After the battle, the defeated king decided that ordinary reinforcements were no longer enough. Among the oldest royal records was a warning about the Dragons that had lived in the northern mountains longer than either kingdom had existed. The warning was quite clear: do not travel there. The king read that part twice, then ordered horses. If he was going to ignore several centuries of good advice, he at least intended to do it in person.",
      "He travelled deep into the mountains, following old paths that grew narrower as the forests gave way to black stone and bare slopes. The higher he climbed, the warmer the air became. Snow had melted from the ground around him, the rocks were scorched, and a faint smell of smoke hung over the valley even though there were no fires in sight.",
      "Near the summit he found a vast opening in the mountainside. The stone around it had been burned almost smooth, and deep marks in the ground showed where something enormous had passed in and out of the cave for many years. The horses refused to go any farther, so the king continued on foot with only a few guards.",
      "A Dragon emerged from the darkness, so large that its wings nearly filled the mouth of the cave when they opened. Its scales were deep red and bronze, glowing orange where the fire inside its body showed through the gaps between them. Smoke curled from its nostrils with every breath, and when it lowered its head toward the visitors, the heat alone forced the guards to step back.",
      "At first, the Dragon showed little interest in the troubles of two human kingdoms. Their borders meant nothing to it, and neither promises of honour nor offers of gold seemed worth leaving the mountains for. The discussion continued for a long time, and the king slowly realised that he had very little to offer a creature that already possessed more wealth and power than most rulers could imagine.",
      "Eventually the king tried a different proposal. If the Dragon joined his side, it would be free to feed on whatever the battle left behind: soldiers, horses and anything else that fell on the field. For the first time, the Dragon seemed genuinely interested and asked whether the offer applied to both armies. The king hesitated, but by then he had travelled too far and lost too much to begin negotiating over the menu, so he agreed.",
      "When the Dragon later appeared above the kingdom, people saw it long before they heard it. A huge shadow passed across the fields, followed by the slow beat of wings powerful enough to shake dust from rooftops. It swept over the city walls, released a stream of fire high into the sky and descended beyond the army camp, where thousands of soldiers watched in silence.",
      "The war had already brought strange allies onto the battlefield, but this was something different. One of the great creatures of the mountains had chosen a side, and from that moment on every army would have to fear what might come from above."
    ],
    "wav": "assets/story/audio/13_fire_in_the_mountains.wav",
    "sha256": "0aea67c6f8bcf5ac52a8fd0497f64c0160f5a4b8a1b22be1a4be5ffd914478a2",
    "bytes": 9159372
  },
  "phase5_demon": {
    "chapter": 14,
    "title": "A DOOR BEST LEFT CLOSED",
    "paragraphs": [
      "The Dragon had seemed like the sort of advantage no enemy could answer. That illusion lasted until the rival kingdom acquired one of its own. After the next defeat, the king finally accepted that this war would answer almost anything with more of the same, so he turned toward a path his ancestors had not merely discouraged but forbidden.",
      "Beyond the borders of both kingdoms, in places decent people preferred not to name aloud, there lived cultists said to practise the darkest forms of sorcery. They were not allies any king would willingly claim, and no ruler with sense or honour sought their counsel unless all other roads had failed. Yet the defeated king went to them, because he could no longer see another way to break the deadlock.",
      "The cultists received him in a vast chamber deep within their stronghold, where fire burned along the walls and a deep red glow filled the hall. Hooded figures waited beside a great stairway while strange symbols shone above them in the darkness. Even before a word was spoken, the king understood why generations of rulers had forbidden any dealings with this place.",
      "When the cultists finally spoke, their offer was easy to understand and hard to mistake for anything good. They would give the king power enough to break the deadlock, but only if he sealed the bargain with his own blood and surrendered his soul. In return they promised long life, victory and the service of something no ordinary army could command.",
      "The king understood the price, and he understood that once such a bargain was made, it could not be undone. But desperation can make ruin look like reason, and after a long silence he cut his hand and signed.",
      "As his blood touched the contract, the symbols around the chamber blazed. The fires along the walls rose high, and a horned beast stepped through them onto the great stairway, towering above the cultists in the red light. The king could not tell whether it had been summoned from somewhere beyond the chamber or had been waiting for the bargain to be completed. Either way, the pact had been accepted.",
      "When the flames settled, the cultists placed an ancient scroll in his hands. Twisted runes covered its surface, some seeming to shift whenever he looked away. These were the marks by which the demonic power could be called onto a battlefield; the king himself was to paint the symbols upon the earth in swine's blood. If an enemy attack struck close enough to the mark, the bound power would be released and tear through anything caught in its path.",
      "The king left the stronghold with the scroll beneath his cloak and the unpleasant certainty that he had not recruited another ally in any ordinary sense. Whatever followed, there would be no pretending he had not chosen it."
    ],
    "wav": "assets/story/audio/14_a_door_best_left_closed.wav",
    "sha256": "f530ce71560dcbb8ea9557aa8dc6fa4abe070f7ff57c6000e5594312249af4c5",
    "bytes": 8516300
  },
  "phase5_wizard": {
    "chapter": 15,
    "title": "THE SKY ANSWERS",
    "paragraphs": [
      "Word reached the court of a Wizard so old that he spoke of ancient kings as former acquaintances and occasionally corrected historians who had the details wrong. His long life, people said, came from a bargain made thousands of years earlier: blood, power and part of himself traded for a life that seemed unwilling to end.",
      "Until now, the Wizard had dismissed the war as another brief quarrel between rulers who would soon be dust. The king's bargain with the Cultists changed his interest. Here was a mortal who had willingly paid a price the Wizard understood very well, and that was unusual enough to earn a meeting.",
      "They spoke deep into the night. The Wizard offered neither praise nor comfort, but he understood better than most what it meant to trade away something that could never be recovered. By dawn, curiosity had done what appeals to honour could not, and he decided that this particular mortal war might finally be worth seeing up close.",
      "By morning, the Wizard had agreed to join the war. He asked for no soldiers and required no place among the formations. He wanted only a high position with a clear view of the battlefield and enough distance from everyone else to work without interruption.",
      "When the king asked what kind of weapon required such precautions, the Wizard looked toward the sky and replied that the armies had spent long enough throwing stones at one another.",
      "He intended to use larger ones, he said, and considerably warmer ones at that."
    ],
    "wav": "assets/story/audio/15_the_sky_answers.wav",
    "sha256": "0b8796268c4ee1ffe22adfae34eeb2e04f0809fb2b9ceffcd5d1de927e0eecd6",
    "bytes": 4682604
  },
  "phase5_complete": {
    "chapter": 16,
    "title": "NO MORE RESTRAINT",
    "paragraphs": [
      "Years had passed since the first skirmish over a disputed border, long enough for the war to become part of the landscape. Roads had been widened for armies, villages near the fighting had grown used to columns of soldiers passing through, and fields that once measured seasons by planting and harvest now measured them by camps, fortifications and supply trains.",
      "The armies were almost unrecognisable from the small forces that had first marched toward the border. Dragons circled above camps where soldiers had once worried only about arrows, Clerics worked within sight of Necromancers whose arts their order had opposed for generations, and nobody willingly stood too close to the dark symbols the king painted on the ground before battle, following the Cultists' instructions. Things once confined to old tales and whispered warnings had become part of military routine.",
      "Yet all that power had produced remarkably little certainty. Every weapon found by one kingdom eventually gained an answer on the other side, and each victory seemed to purchase only a more dangerous battle later. The armies were larger than ever, but so was the cost of keeping them in the field.",
      "This time there was no hidden ally waiting beyond the hills and no new invention being hammered together in a workshop. Both kingdoms simply gathered everything the war had already given them and prepared to send it all onto the same field.",
      "Across the valley, thousands of campfires burned through the night while soldiers checked armour, horses were fed, Clerics tended old wounds and great shapes moved against the clouds above. By morning, each king would commit nearly everything years of escalation had placed in his hands against an enemy who had done exactly the same."
    ],
    "wav": "assets/story/audio/16_no_more_restraint.wav",
    "sha256": "7be5370afea99cc004e37eed0a177a50da27dc99af1dbb2f70e407f7b8d07ea6",
    "bytes": 5540460
  },
  "hero_intro": {
    "chapter": 17,
    "title": "ONE LAST CONDITION",
    "paragraphs": [
      "After the battle, the defeated king sent for a man who had once been among his most trusted warriors. The Hero had served the crown for many years and fought in campaigns long before the present war began, but eventually he had laid down his weapons and withdrawn to his own lands. He had earned his peace, and until now the king had respected it.",
      "The Hero answered the summons and came alone. He had come because the king had called for him, not because he had decided to return to war.",
      "The king nevertheless asked him to return, explaining how far the fighting had spread and how badly the kingdom needed someone capable of changing its course. The Hero listened without interruption and, when the king had finished, he refused.",
      "He had already given enough years of his life to war, he explained, and had no wish to spend those that remained chasing another king's armies across the countryside. He intended to go home and stay out of the conflict. There was only one thing that would change that: if the fighting reached his own lands, or if the people under his protection were attacked, he would defend them without waiting for another summons."
    ],
    "wav": "assets/story/audio/17_one_last_condition.wav",
    "sha256": "698232fdbc713a1f66b0da11253cc79fe7c11d129f2fa654dcabed99d7e94db0",
    "bytes": 3642572
  },
  "phase6_final": {
    "chapter": 18,
    "title": "THE FINAL BATTLE",
    "paragraphs": [
      "The Hero's refusal left both kingdoms with an awkward possibility rather than a new soldier. Across the border, the rival kingdom had a champion of its own who had made much the same choice: neither intended to take part in the war, but both lived close enough to the front that an attack on their lands or their people could draw them into it without warning.",
      "There was little else left to discover. Dragons had come down from the mountains, Clerics had crossed from the East, ancient orders had abandoned their distance from worldly wars, and powers that generations of rulers had sworn never to disturb now stood behind both armies. The two kings had searched nearly every corner of the known world and, more often than not, returned with something dangerous.",
      "Before dawn, the final armies gathered across the valley with no new ally expected and no miracle left to seek.",
      "Their camps stretched farther than ever before, the glow of thousands of fires filling the low ground between the hills. Great shadows moved overhead while soldiers prepared beneath them, and beyond the brightest torches the darker allies of both kingdoms waited for the signal to begin. Veterans from the first border skirmishes now stood beside creatures and warriors they would once have dismissed as stories told to frighten children.",
      "Even the kings understood that there could be no next escalation. They had spent years answering every defeat by seeking something stronger, stranger or more dangerous, and now almost everything they had found was gathered in one place. Whatever happened here, neither kingdom could simply solve the result by reaching for something worse.",
      "When the first light appeared beyond the hills, horns sounded across the valley and the armies began to move.",
      "Whatever had started the conflict had long since stopped mattering. This was no longer a battle over a disputed field or an old line on a map; it was a battle over whether either kingdom could finally bring the war to an end."
    ],
    "wav": "assets/story/audio/18_the_final_battle.wav",
    "sha256": "dd1c409de905faae9f362eb228bfd8c4d95688ed1e2f8f71ac2796fd513ae626",
    "bytes": 6363500
  },
  "story_complete": {
    "chapter": 19,
    "title": "THE LAST STONE FALLS",
    "paragraphs": [
      "When the enemy army finally began to break, few people recognised the moment for what it was. One part of the line gave way, then another, and soon soldiers who had fought through years of war were retreating across ground covered in smoke, shattered weapons and the remains of everything both kingdoms had brought to the field.",
      "The victorious army did not immediately celebrate. Its soldiers had seen too many battles turn into another battle to trust the silence that followed. They waited for the enemy horns to sound again, for another charge to begin or for some final weapon to appear beyond the smoke.",
      "Nothing came.",
      "Before sunset, envoys crossed the battlefield beneath white banners. The defeated kingdom asked for an end to the fighting, and this time there was no demand for another fortress, another ally or another chance to reverse the result. Both kingdoms had paid too much to pretend that one more battle would somehow make the years before it worthwhile.",
      "The peace that followed was neither quick nor easy. The wounded still needed care, damaged towns had to be rebuilt and fields that had carried armies for years had to become farmland again. Roads slowly returned to merchants and travellers, while families waited to discover who was coming home and whose place at the table would remain empty.",
      "Years later, children heard stories about Dwarves from the mountains, Elven scouts, goblin bombs, the Plague, Dragons, Cultists, Wizards and Heroes whose names had become part of a war that seemed impossible to survive. With every retelling the kings became wiser, the victories became greater and the worst mistakes slowly turned into noble decisions made for the good of the realm.",
      "For a time, peace held, and the old border returned to being little more than a line on a map. The disagreement itself, however, never truly disappeared. New rulers inherited old claims, old victories became fresh insults, and every generation found reasons to believe that perhaps one more battle would finally settle what all the battles before it had failed to resolve.",
      "In the end, that may be the only thing both kingdoms could ever be certain of. The story of this war had reached its conclusion, for now, but the fighting would continue in one form or another for as long as there were borders to dispute, rulers willing to defend them and someone somewhere prepared to pick up the next stone."
    ],
    "wav": "assets/story/audio/19_the_last_stone_falls.wav",
    "sha256": "7de325ab559ea263aa845102c69f232da8c0e241ab414ae39549a5e6c819d3fb",
    "bytes": 7697612
  }
};
const preferenceKey='stoneThrow.storyNarration.enabled.v1';
let current=null,enabled=true;try{enabled=localStorage.getItem(preferenceKey)!=='0';}catch{}
const controls=[],storyControls=[];
function syncControls(){for(const button of controls){button.textContent=(storyControls.includes(button)?'Narration: ':'')+(enabled?'ON':'OFF');button.classList.toggle('on',enabled);button.setAttribute('aria-pressed',String(enabled));}}
function setEnabled(value){enabled=!!value;try{localStorage.setItem(preferenceKey,enabled?'1':'0');}catch{}if(!enabled)stop(false);syncControls();}
function makeControl(id,story){const button=document.createElement('button');button.id=id;button.type='button';button.className=story?'st-toggle st-narration-toggle':'st-toggle';button.setAttribute('aria-label','Narration');button.addEventListener('click',()=>setEnabled(!enabled));controls.push(button);if(story){button.hidden=true;storyControls.push(button);}return button;}
const settings=document.getElementById('stSettings');if(settings){const row=document.createElement('div');row.className='st-setting-row st-toggle-row';const label=document.createElement('span');label.textContent='Narration';row.append(label,makeControl('stNarrationSetting',false));settings.querySelector('.st-settings-title')?.after(row);}
document.getElementById('stMenuDialogTitle')?.before(makeControl('stDialogNarration',true));
document.getElementById('stStoryAftermathCard')?.prepend(makeControl('stTransitionNarration',true));
syncControls();
window.addEventListener('storage',event=>{if(event.key===preferenceKey||event.key===null){try{enabled=localStorage.getItem(preferenceKey)!=='0';}catch{}if(!enabled)stop(false);syncControls();}});
const html=scene=>chapters[scene].paragraphs.map(p=>'<p>'+p.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')+'</p>').join('');
function stop(hide=true){document.documentElement.dataset.musicNarrating='false';if(hide)delete document.documentElement.dataset.musicStoryScene;if(hide)for(const button of storyControls)button.hidden=true;const previous=current;current=null;if(previous){previous.onerror=null;previous.pause();previous.removeAttribute('src');previous.load();}}
function play(scene){
 stop();const chapter=chapters[scene];if(!chapter)return;document.documentElement.dataset.musicStoryScene=scene;for(const button of storyControls)button.hidden=false;if(!enabled)return;
 try{
  const audio=new Audio();current=audio;audio.preload='none';
  for(const event of ['playing','pause','ended','error'])audio.addEventListener(event,()=>{if(current===audio)document.documentElement.dataset.musicNarrating=String(event==='playing');});
  audio.muted=!!document.getElementById('soundBtn')?.textContent.includes('OFF');
  audio.onerror=()=>{if(current===audio)console.warn('Story narration unavailable:',chapter.chapter,chapter.wav,audio.error?.code);};
  audio.src=chapter.wav;
  const started=audio.play();started?.catch(error=>{if(current===audio)console.warn('Story narration could not play:',chapter.chapter,chapter.wav,error.name);});
 }catch(error){console.warn('Story narration unavailable:',chapter.chapter,chapter.wav,error.message);}
}
// Reuse the existing sound switch; no new setting or authoritative bridge.
const sound=document.getElementById('soundBtn');
if(sound)new MutationObserver(()=>{if(current)current.muted=sound.textContent.includes('OFF');}).observe(sound,{childList:true,subtree:true,characterData:true});
window.addEventListener('pagehide',stop);
return Object.freeze({chapters,html,play,stop});

})();
