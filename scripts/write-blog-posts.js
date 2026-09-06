#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const START = '2026-09-07';
const LANGS = ['en', 'fr', 'es', 'de', 'it', 'nl'];

const T = {
  en: {
    Films:'Films', Series:'Series', liked:'If you liked',
    intro:t=>`This SwiftChannels guide keeps the list practical: ${t.toLowerCase()}, all released in 2025 or earlier and all sitting at IMDb 7.0/10 or higher.`,
    aim:'The aim is not to list everything; it is to give you a reliable queue with famous, well-rated titles.',
    note:title=>`${title} keeps its reputation because the direction, pacing and performances still feel sharp instead of dated.`,
    list:'The shortlist',
    close:'You can use this as a simple evening queue. Many titles like these appear in the film and series libraries offered with SwiftChannels, so do not hesitate to watch them through your SwiftChannels line after your free test.',
    item:(x,topic)=>`${x.note} It is an easy fit for ${topic.toLowerCase()} and its IMDb score is ${x.rating}/10.`,
    summary:t=>`${t}, selected with IMDb ratings of 7.0/10 or higher.`
  },
  fr: {
    Films:'Films', Series:'Séries', liked:'Si vous avez aimé',
    intro:t=>`Ce guide SwiftChannels reste pratique : ${t.toLowerCase()}, tous sortis en 2025 ou avant, avec une note IMDb de 7,0/10 ou plus.`,
    aim:"Le but n'est pas de tout lister, mais de donner une file d'attente fiable avec des titres connus et bien notés.",
    note:title=>`${title} garde sa réputation grâce à une mise en scène, un rythme et des performances qui restent précis plutôt que datés.`,
    list:'La sélection',
    close:"Gardez cette liste comme file d'attente pour le soir. Beaucoup de titres de ce genre figurent dans les bibliothèques films et séries proposées avec SwiftChannels ; n'hésitez pas à les regarder via votre ligne SwiftChannels après le test gratuit.",
    item:(x,topic)=>`${x.noteFr || x.note} Il convient bien à « ${topic.toLowerCase()} » et sa note IMDb est de ${x.rating}/10.`,
    summary:t=>`${t}, sélectionnés avec des notes IMDb de 7,0/10 ou plus.`
  },
  es: {
    Films:'Películas', Series:'Series', liked:'Si te gustó',
    intro:t=>`Esta guía de SwiftChannels va al grano: ${t.toLowerCase()}, todo estrenado en 2025 o antes y con una puntuación IMDb de 7,0/10 o más.`,
    aim:'La idea no es enumerarlo todo, sino darte una cola fiable con títulos famosos y bien valorados.',
    note:title=>`${title} conserva su reputación porque la dirección, el ritmo y las actuaciones siguen sintiéndose frescos en vez de anticuados.`,
    list:'La selección',
    close:'Úsala como una cola sencilla para la noche. Muchos títulos de este estilo aparecen en las bibliotecas de películas y series ofrecidas con SwiftChannels, así que no dudes en verlos con tu línea SwiftChannels después de la prueba gratis.',
    item:(x,topic)=>`${x.noteEs || x.note} Encaja muy bien con « ${topic.toLowerCase()} » y su puntuación IMDb es ${x.rating}/10.`,
    summary:t=>`${t}, seleccionadas con puntuaciones IMDb de 7,0/10 o más.`
  },
  de: {
    Films:'Filme', Series:'Serien', liked:'Wenn dir das gefallen hat',
    intro:t=>`Dieser SwiftChannels-Guide bleibt praktisch: ${t.toLowerCase()}, alle 2025 oder früher erschienen und alle mit IMDb 7,0/10 oder höher.`,
    aim:'Ziel ist nicht, alles aufzuzählen, sondern eine verlässliche Warteschlange mit bekannten, stark bewerteten Titeln zu geben.',
    note:title=>`${title} behält seinen Ruf, weil Regie, Tempo und Leistungen immer noch präzise wirken statt veraltet.`,
    list:'Die Auswahl',
    close:'Nutze die Liste als einfache Abend-Warteschlange. Viele Titel dieser Art findest du in den Film- und Serienbibliotheken, die mit SwiftChannels angeboten werden. Schau sie gern über deine SwiftChannels-Leitung nach dem Gratistest.',
    item:(x,topic)=>`${x.noteDe || x.note} Er passt gut zu „${topic.toLowerCase()}“ und liegt bei IMDb bei ${x.rating}/10.`,
    summary:t=>`${t}, ausgewählt mit IMDb-Bewertungen ab 7,0/10.`
  },
  it: {
    Films:'Film', Series:'Serie', liked:'Se ti è piaciuto',
    intro:t=>`Questa guida SwiftChannels resta pratica: ${t.toLowerCase()}, tutti usciti nel 2025 o prima e tutti con voto IMDb pari o superiore a 7,0/10.`,
    aim:'Lo scopo non è elencare tutto, ma darti una coda affidabile con titoli famosi e ben valutati.',
    note:title=>`${title} mantiene la sua reputazione perché regia, ritmo e interpretazioni risultano ancora solidi invece che datati.`,
    list:'La selezione',
    close:'Usala come una coda semplice per la serata. Molti titoli di questo tipo compaiono nelle librerie di film e serie offerte con SwiftChannels, quindi non esitare a guardarli tramite la tua linea SwiftChannels dopo la prova gratuita.',
    item:(x,topic)=>`${x.noteIt || x.note} Funziona bene per « ${topic.toLowerCase()} » e il suo voto IMDb è ${x.rating}/10.`,
    summary:t=>`${t}, scelti con voti IMDb da 7,0/10 in su.`
  },
  nl: {
    Films:'Films', Series:'Series', liked:'Als je dit goed vond',
    intro:t=>`Deze SwiftChannels-gids blijft praktisch: ${t.toLowerCase()}, allemaal uitgebracht in 2025 of eerder en allemaal met IMDb 7,0/10 of hoger.`,
    aim:'Het doel is niet alles op te sommen, maar je een betrouwbare kijklijst te geven met bekende, sterk beoordeelde titels.',
    note:title=>`${title} behoudt zijn reputatie omdat regie, tempo en acteerwerk nog steeds scherp voelen in plaats van gedateerd.`,
    list:'De selectie',
    close:'Gebruik dit als eenvoudige kijklijst voor de avond. Veel van dit soort titels staan in de film- en seriebibliotheken die met SwiftChannels worden aangeboden, dus kijk ze gerust via je SwiftChannels-lijn na je gratis test.',
    item:(x,topic)=>`${x.noteNl || x.note} Hij past goed bij „${topic.toLowerCase()}“ en de IMDb-score is ${x.rating}/10.`,
    summary:t=>`${t}, gekozen met IMDb-scores van 7,0/10 of hoger.`
  }
};

const topics = [
  ['films','Fifteen action films worth an evening','Quinze films d’action qui valent une soirée','Quince películas de acción para una noche','Fünfzehn Actionfilme für einen guten Abend','Quindici film d’azione per una serata','Vijftien actiefilms voor een goede avond',['Mad Max: Fury Road','The Dark Knight','John Wick: Chapter 4','Mission: Impossible - Fallout','Top Gun: Maverick']],
  ['films','Thrillers that still hold up','Des thrillers qui tiennent encore debout','Thrillers que siguen funcionando','Thriller, die immer noch funktionieren','Thriller che reggono ancora','Thrillers die nog steeds overeind blijven',['Seven','Zodiac','Prisoners','Gone Girl','The Fugitive']],
  ['films','Crime films to watch in one sitting','Films criminels à regarder d’une traite','Películas criminales para ver de una sentada','Kriminalfilme für einen Abend am Stück','Film crime da vedere tutti d’un fiato','Misdaadfilms om in één keer te kijken',['GoodFellas','Heat','The Departed','City of God','L.A. Confidential']],
  ['films','Science fiction that aged well','Science-fiction qui a bien vieilli','Ciencia ficción que envejeció bien','Science-Fiction, die gut gealtert ist','Fantascienza invecchiata bene','Sciencefiction die goed is verouderd',['The Matrix','Blade Runner 2049','Arrival','Interstellar','Ex Machina']],
  ['films','Comedies that actually land','Comédies qui font vraiment mouche','Comedias que de verdad funcionan','Komödien, die wirklich landen','Commedie che funzionano davvero','Komedies die echt werken',['The Grand Budapest Hotel','Groundhog Day','The Big Lebowski','Superbad','Paddington 2']],
  ['films','Documentaries that change how you see something','Documentaires qui changent votre regard','Documentales que cambian tu forma de ver algo','Dokumentationen, die den Blick verändern','Documentari che cambiano il modo di vedere qualcosa','Documentaires die je anders laten kijken',['13th','Free Solo',"Won't You Be My Neighbor?",'Man on Wire','Searching for Sugar Man']],
  ['films','Films for a family night in','Films pour une soirée familiale à la maison','Películas para una noche familiar en casa','Filme für einen Familienabend zu Hause','Film per una serata in famiglia','Films voor een gezinsavond thuis',['Spirited Away','The Incredibles','Toy Story','The Iron Giant','Coco']],
  ['films','Horror built on tension rather than gore','Horreur fondée sur la tension plutôt que le gore','Terror basado en tensión más que en sangre','Horror, der auf Spannung statt Blut setzt','Horror costruito sulla tensione, non sul gore','Horror gebouwd op spanning in plaats van bloed',['The Others','The Sixth Sense','Let the Right One In','Get Out','The Innocents']],
  ['films','War films that avoid the clichés','Films de guerre qui évitent les clichés','Películas bélicas que evitan clichés','Kriegsfilme ohne Klischees','Film di guerra che evitano i cliché','Oorlogsfilms die clichés vermijden',['Come and See','Saving Private Ryan','The Thin Red Line','1917','The Hurt Locker']],
  ['films','Heist films, ranked by how clever the plan is','Films de braquage classés par intelligence du plan','Películas de atracos según lo inteligente del plan','Heist-Filme nach Cleverness des Plans','Film di rapina classificati per astuzia del piano','Heistfilms gerangschikt op slimheid van het plan',['The Sting','Rififi','Heat','Inside Man',"Ocean's Eleven"]],
  ['films',"Sports films that work even if you don't follow the sport",'Films de sport qui marchent même sans suivre le sport','Películas deportivas que funcionan aunque no sigas el deporte','Sportfilme, die auch ohne Sportwissen funktionieren','Film sportivi che funzionano anche se non segui lo sport','Sportfilms die werken ook als je de sport niet volgt',['Rocky','Raging Bull','The Wrestler','Rush','Ford v Ferrari']],
  ['films','Films under 100 minutes, for a short evening','Films de moins de 100 minutes pour une soirée courte','Películas de menos de 100 minutos para una noche corta','Filme unter 100 Minuten für einen kurzen Abend','Film sotto i 100 minuti per una serata breve','Films onder 100 minuten voor een korte avond',['Before Sunset','My Neighbor Totoro','Stand by Me','The Nightmare Before Christmas','Fruitvale Station']],
  ['series',"Series to start when you've finished everything",'Séries à lancer quand vous avez tout fini','Series para empezar cuando ya lo has visto todo','Serien, wenn du schon alles gesehen hast','Serie da iniziare quando hai finito tutto','Series om te starten als je alles al hebt gezien',['Breaking Bad','The Wire','The Sopranos','Succession','Better Call Saul']],
  ['series','Limited series you can finish in a weekend','Mini-séries à finir en un week-end','Miniseries para terminar en un fin de semana','Miniserien für ein Wochenende','Miniserie da finire in un weekend','Miniseries die je in een weekend uitkijkt',['Chernobyl','Band of Brothers',"The Queen's Gambit",'Mare of Easttown','When They See Us']],
  ['series','The best crime series, country by country','Les meilleures séries crime, pays par pays','Las mejores series criminales, país por país','Die besten Krimiserien nach Ländern','Le migliori serie crime, paese per paese','De beste misdaadseries per land',['The Wire','Broadchurch','Gomorrah','Unbelievable','The Bridge']],
  ['series','Series worth watching with subtitles','Séries qui valent les sous-titres','Series que merecen subtítulos','Serien, die Untertitel wert sind','Serie che meritano i sottotitoli','Series die ondertitels waard zijn',['Money Heist','Dark','Borgen','Call My Agent!','Gomorrah']],
  ['series','Long-running series that reward the commitment','Longues séries qui récompensent l’engagement','Series largas que recompensan el compromiso','Lange Serien, die den Einsatz belohnen','Serie lunghe che ripagano l’impegno','Langlopende series die de inzet belonen',['The Americans','Mad Men','The X-Files','ER','The West Wing']],
  ['series','Series with a genuinely good final season','Séries avec une vraie bonne dernière saison','Series con una última temporada realmente buena','Serien mit wirklich guter letzter Staffel','Serie con una stagione finale davvero riuscita','Series met een echt goed laatste seizoen',['Six Feet Under','The Americans','Better Call Saul','The Leftovers','Halt and Catch Fire']],
  ['series','Comedy series that hold up on a rewatch','Séries comiques qui tiennent au rewatch','Series de comedia que aguantan otra vuelta','Comedyserien, die beim Wiedersehen halten','Serie comedy che reggono alla seconda visione','Comedyseries die bij herkijken overeind blijven',['The Office','Parks and Recreation','Fleabag',"Schitt's Creek",'Brooklyn Nine-Nine']],
  ['series','Historical drama that gets the period right','Drames historiques qui sentent juste l’époque','Drama histórico que acierta con la época','Historische Dramen mit Gefühl für die Zeit','Drammi storici che rendono bene l’epoca','Historisch drama dat de periode goed raakt',['The Crown','Rome','Deadwood','John Adams','The Last Kingdom']],
  ['series','Series to watch with the whole family','Séries à regarder avec toute la famille','Series para ver con toda la familia','Serien für die ganze Familie','Serie da guardare con tutta la famiglia','Series om met het hele gezin te kijken',['Avatar: The Last Airbender','Bluey','Anne with an E','Merlin','The Muppet Show']],
  ['liked','If you liked heist films, watch these','Si vous aimez les films de braquage, regardez ceci','Si te gustan las películas de atracos, mira estas','Wenn du Heist-Filme magst, schau diese','Se ti piacciono i film di rapina, guarda questi','Als je heistfilms goed vindt, kijk dan deze',['The Sting','Rififi','Thief','Logan Lucky','The Town']],
  ['liked','If you liked courtroom drama, watch these','Si vous aimez les drames judiciaires, regardez ceci','Si te gustan los dramas judiciales, mira estas','Wenn du Gerichtsdramen magst, schau diese','Se ti piacciono i drammi giudiziari, guarda questi','Als je rechtbankdrama goed vindt, kijk dan deze',['12 Angry Men','Anatomy of a Murder','The Verdict','A Few Good Men','Witness for the Prosecution']],
  ['liked','If you liked survival stories, watch these','Si vous aimez les récits de survie, regardez ceci','Si te gustan las historias de supervivencia, mira estas','Wenn du Überlebensgeschichten magst, schau diese','Se ti piacciono le storie di sopravvivenza, guarda questi','Als je overlevingsverhalen goed vindt, kijk dan deze',['Cast Away','Life of Pi','Apollo 13','The Martian','Touching the Void']],
  ['liked','If you liked slow-burn mysteries, watch these','Si vous aimez les mystères à combustion lente, regardez ceci','Si te gustan los misterios de cocción lenta, mira estas','Wenn du langsame Mystery-Geschichten magst, schau diese','Se ti piacciono i misteri a fuoco lento, guarda questi','Als je trage mysteries goed vindt, kijk dan deze',['Burning','Memories of Murder','The Secret in Their Eyes','Wind River','The Conversation']],
  ['liked','If you liked sports documentaries, watch these','Si vous aimez les documentaires sportifs, regardez ceci','Si te gustan los documentales deportivos, mira estos','Wenn du Sportdokus magst, schau diese','Se ti piacciono i documentari sportivi, guarda questi','Als je sportdocumentaires goed vindt, kijk dan deze',['Senna','Hoop Dreams','The Last Dance','Free Solo','Diego Maradona']],
  ['liked','If you liked spy thrillers, watch these','Si vous aimez les thrillers d’espionnage, regardez ceci','Si te gustan los thrillers de espías, mira estos','Wenn du Spionagethriller magst, schau diese','Se ti piacciono gli spy thriller, guarda questi','Als je spionagethrillers goed vindt, kijk dan deze',['Tinker Tailor Soldier Spy','Munich','Bridge of Spies','The Lives of Others','The Bourne Ultimatum']],
  ['liked','If you liked true crime, watch these','Si vous aimez le true crime, regardez ceci','Si te gusta el true crime, mira estos','Wenn du True Crime magst, schau diese','Se ti piace il true crime, guarda questi','Als je true crime goed vindt, kijk dan deze',['The Jinx: The Life and Deaths of Robert Durst','Making a Murderer','The Staircase','Dear Zachary: A Letter to a Son About His Father','The Act of Killing']],
  ['liked','If you liked psychological horror, watch these','Si vous aimez l’horreur psychologique, regardez ceci','Si te gusta el terror psicológico, mira estas','Wenn du psychologischen Horror magst, schau diese','Se ti piace l’horror psicologico, guarda questi','Als je psychologische horror goed vindt, kijk dan deze',["Rosemary's Baby",'The Shining','Black Swan','The Witch','Hereditary']],
  ['liked','If you liked road movies, watch these','Si vous aimez les road movies, regardez ceci','Si te gustan las road movies, mira estas','Wenn du Roadmovies magst, schau diese','Se ti piacciono i road movie, guarda questi','Als je roadmovies goed vindt, kijk dan deze',["Thelma & Louise",'Little Miss Sunshine','Y tu mamá también','Paris, Texas','Nebraska']]
];

const imdb = {
"1917":[2019,8.2,"tt8579674"],"Mad Max: Fury Road":[2015,8.1,"tt1392190"],"The Dark Knight":[2008,9.1,"tt0468569"],"John Wick: Chapter 4":[2023,7.6,"tt10366206"],"Mission: Impossible - Fallout":[2018,7.7,"tt4912910"],"Top Gun: Maverick":[2022,8.2,"tt1745960"],"Seven":[1995,8.6,"tt0114369"],"Zodiac":[2007,7.7,"tt0443706"],"Prisoners":[2013,8.2,"tt1392214"],"Gone Girl":[2014,8.1,"tt2267998"],"The Fugitive":[1993,7.8,"tt0106977"],"GoodFellas":[1990,8.7,"tt0099685"],"Heat":[1995,8.3,"tt0113277"],"The Departed":[2006,8.5,"tt0407887"],"City of God":[2002,8.6,"tt0317248"],"L.A. Confidential":[1997,8.2,"tt0119488"],"The Matrix":[1999,8.7,"tt0133093"],"Blade Runner 2049":[2017,8,"tt1856101"],"Arrival":[2016,7.9,"tt2543164"],"Interstellar":[2014,8.7,"tt0816692"],"Ex Machina":[2014,7.7,"tt0470752"],"The Grand Budapest Hotel":[2014,8.1,"tt2278388"],"Groundhog Day":[1993,8,"tt0107048"],"The Big Lebowski":[1998,8.1,"tt0118715"],"Superbad":[2007,7.6,"tt0829482"],"Paddington 2":[2017,7.8,"tt4468740"],"13th":[2016,8.2,"tt5895028"],"Free Solo":[2018,8.1,"tt7775622"],"Won't You Be My Neighbor?":[2018,8.3,"tt7681902"],"Man on Wire":[2008,7.7,"tt1155592"],"Searching for Sugar Man":[2012,8.2,"tt2125608"],"Spirited Away":[2001,8.6,"tt0245429"],"The Incredibles":[2004,8,"tt0317705"],"Toy Story":[1995,8.3,"tt0114709"],"The Iron Giant":[1999,8.1,"tt0129167"],"Coco":[2017,8.4,"tt2380307"],"The Others":[2001,7.6,"tt0230600"],"The Sixth Sense":[1999,8.2,"tt0167404"],"Let the Right One In":[2008,7.8,"tt1139797"],"Get Out":[2017,7.8,"tt5052448"],"The Innocents":[1961,7.7,"tt0055018"],"Come and See":[1985,8.3,"tt0091251"],"Saving Private Ryan":[1998,8.6,"tt0120815"],"The Thin Red Line":[1998,7.6,"tt0120863"],"The Hurt Locker":[2008,7.5,"tt0887912"],"The Sting":[1973,8.2,"tt0070735"],"Rififi":[1955,8.1,"tt0048021"],"Inside Man":[2006,7.6,"tt0454848"],"Ocean's Eleven":[2001,7.7,"tt0240772"],"Rocky":[1976,8.1,"tt0075148"],"Raging Bull":[1980,8.1,"tt0081398"],"The Wrestler":[2008,7.9,"tt1125849"],"Rush":[2013,8.1,"tt1979320"],"Ford v Ferrari":[2019,8.1,"tt1950186"],"Before Sunset":[2004,8.1,"tt0381681"],"My Neighbor Totoro":[1988,8.1,"tt0096283"],"Stand by Me":[1986,8.1,"tt0092005"],"The Nightmare Before Christmas":[1993,7.9,"tt0107688"],"Fruitvale Station":[2013,7.5,"tt2334649"],"Breaking Bad":[2008,9.5,"tt0903747"],"The Wire":[2002,9.3,"tt0306414"],"The Sopranos":[1999,9.2,"tt0141842"],"Succession":[2018,8.8,"tt7660850"],"Better Call Saul":[2015,9,"tt3032476"],"Chernobyl":[2019,9.3,"tt7366338"],"Band of Brothers":[2001,9.4,"tt0185906"],"The Queen's Gambit":[2020,8.5,"tt10048342"],"Mare of Easttown":[2021,8.4,"tt10155688"],"When They See Us":[2019,8.8,"tt7137906"],"Broadchurch":[2013,8.3,"tt2249364"],"Gomorrah":[2014,8.6,"tt2049116"],"Unbelievable":[2019,8.3,"tt7909970"],"The Bridge":[2011,8.6,"tt1733785"],"Money Heist":[2017,8.2,"tt6468322"],"Dark":[2017,8.7,"tt5753856"],"Borgen":[2010,8.4,"tt1526318"],"Call My Agent!":[2015,8.3,"tt4277922"],"The Americans":[2013,8.4,"tt2149175"],"Mad Men":[2007,8.7,"tt0804503"],"The X-Files":[1993,8.6,"tt0106179"],"ER":[1994,7.9,"tt0108757"],"The West Wing":[1999,8.9,"tt0200276"],"Six Feet Under":[2001,8.7,"tt0248654"],"The Leftovers":[2014,8.3,"tt2699128"],"Halt and Catch Fire":[2014,8.4,"tt2543312"],"The Office":[2005,9,"tt0386676"],"Parks and Recreation":[2009,8.6,"tt1266020"],"Fleabag":[2016,8.7,"tt5687612"],"Schitt's Creek":[2015,8.5,"tt3526078"],"Brooklyn Nine-Nine":[2013,8.4,"tt2467372"],"The Crown":[2016,8.6,"tt4786824"],"Rome":[2005,8.7,"tt0384766"],"Deadwood":[2004,8.6,"tt0348914"],"John Adams":[2008,8.4,"tt0472027"],"The Last Kingdom":[2015,8.5,"tt4179452"],"Avatar: The Last Airbender":[2005,9.3,"tt0417299"],"Bluey":[2018,9.3,"tt7678620"],"Anne with an E":[2017,8.6,"tt5421602"],"Merlin":[2008,7.9,"tt1199099"],"The Muppet Show":[1976,8.4,"tt0074028"],"Thief":[1981,7.4,"tt0083190"],"Logan Lucky":[2017,7,"tt5439796"],"The Town":[2010,7.5,"tt0840361"],"12 Angry Men":[1957,9,"tt0050083"],"Anatomy of a Murder":[1959,8,"tt0052561"],"The Verdict":[1982,7.7,"tt0084855"],"A Few Good Men":[1992,7.8,"tt0104257"],"Witness for the Prosecution":[1957,8.4,"tt0051201"],"Cast Away":[2000,7.8,"tt0162222"],"Life of Pi":[2012,7.9,"tt0454876"],"Apollo 13":[1995,7.7,"tt0112384"],"The Martian":[2015,8,"tt3659388"],"Touching the Void":[2003,7.9,"tt0379557"],"Burning":[2018,7.4,"tt7282468"],"Memories of Murder":[2003,8.1,"tt0353969"],"The Secret in Their Eyes":[2009,8.2,"tt1305806"],"Wind River":[2017,7.7,"tt5362988"],"The Conversation":[1974,7.7,"tt0071360"],"Senna":[2010,8.4,"tt1424432"],"Hoop Dreams":[1994,8.3,"tt0110057"],"The Last Dance":[2020,9,"tt8420184"],"Diego Maradona":[2019,7.7,"tt5433114"],"Tinker Tailor Soldier Spy":[2011,7,"tt1340800"],"Munich":[2005,7.5,"tt0408306"],"Bridge of Spies":[2015,7.6,"tt3682448"],"The Lives of Others":[2006,8.4,"tt0405094"],"The Bourne Ultimatum":[2007,8,"tt0440963"],"The Jinx: The Life and Deaths of Robert Durst":[2015,8.6,"tt4299972"],"Making a Murderer":[2015,8.5,"tt5189670"],"The Staircase":[2004,7.8,"tt0388644"],"Dear Zachary: A Letter to a Son About His Father":[2008,8.5,"tt1152758"],"The Act of Killing":[2012,8.2,"tt2375605"],"Rosemary's Baby":[1968,8,"tt0063522"],"The Shining":[1980,8.4,"tt0081505"],"Black Swan":[2010,8,"tt0947798"],"The Witch":[2015,7,"tt4263482"],"Hereditary":[2018,7.3,"tt7784604"],"Thelma & Louise":[1991,7.6,"tt0103074"],"Little Miss Sunshine":[2006,7.8,"tt0449059"],"Y tu mamá también":[2001,7.7,"tt0245574"],"Paris, Texas":[1984,8.1,"tt0087884"],"Nebraska":[2013,7.7,"tt1821549"]
};

function slug(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function publishDate(n) {
  if (n <= 27) {
    const week = Math.floor((n - 1) / 3);
    const day = [0, 2, 4][(n - 1) % 3];
    return addDays(START, week * 7 + day);
  }
  return addDays(START, 9 * 7 + [0, 2, 4][n - 28]);
}
function front(meta) {
  return `---\n${Object.entries(meta).map(([k,v]) => `${k}: ${JSON.stringify(String(v))}`).join('\n')}\n---\n\n`;
}

for (let i = 0; i < topics.length; i++) {
  const n = i + 1;
  const [family, en, fr, es, de, it, nl, titles] = topics[i];
  const id = `${String(n).padStart(2, '0')}-${slug(en)}`;
  const dir = path.join(ROOT, 'posts', id);
  fs.mkdirSync(dir, { recursive: true });
  const langTitles = { en, fr, es, de, it, nl };
  for (const lang of LANGS) {
    const title = langTitles[lang];
    const tr = T[lang];
    const familyLabel = family === 'films' ? tr.Films : family === 'series' ? tr.Series : tr.liked;
    const items = titles.map((name, idx) => {
      const [year, rating, imdbId] = imdb[name];
      const x = { rating, note: tr.note(name) };
      return `${idx + 1}. **${name}** (${year}) - ${tr.item(x, title)} [IMDb](https://www.imdb.com/title/${imdbId}/)`;
    }).join('\n');
    const body = `${tr.intro(title)} ${tr.aim}\n\n## ${tr.list}\n\n${items}\n\n${tr.close}\n`;
    const meta = {
      title,
      slug: slug(title),
      lang,
      number: n,
      publishDate: publishDate(n),
      family,
      familyLabel,
      summary: tr.summary(title),
      picks: titles.join('|'),
      source: 'IMDb public datasets, ratings checked 2026-09-06'
    };
    fs.writeFileSync(path.join(dir, `${lang}.md`), front(meta) + body, 'utf8');
  }
}
console.log(`Wrote ${topics.length * LANGS.length} blog source files.`);
