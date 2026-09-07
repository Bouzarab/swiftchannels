const fs = require('fs');
const path = require('path');

const PAGE_SLUGS = [
  'faq.html',
  'about.html',
  'best-iptv-for-sports.html',
  'best-iptv-for-movies.html',
  'iptv-for-firestick.html',
  'iptv-for-smart-tv.html'
];

const COMMON = {
  en: {
    home:'Home', plans:'Plans', channels:'Channels', setup:'Setup', blog:'Blog', order:'Order now',
    brand:'SwiftChannels', footer:'Free 24-hour test, 8,000+ live channels, and a large film and series library.',
    try:'Start the free test', compare:'Compare plans', useful:'Useful pages',
    links:['Plans and prices','Full channel list','Setup guide','Blog'],
    note:'Use the linked setup guide, channel list and blog recommendations to check the parts that matter to your household before choosing a paid plan.',
    faqTestQ:'Should I test before paying?', faqTestA:'Yes. The free 24-hour test is the best way to check picture quality, app compatibility and the channels or library you care about.',
    faqPriceQ:'Where do I compare prices?', faqPriceA:'Use the plans section on the homepage. Every plan opens the same core service; the main difference is duration and number of simultaneous connections.',
    about:'About', faq:'FAQ', terms:'Terms'
  },
  fr: {
    home:'Accueil', plans:'Offres', channels:'Chaînes', setup:'Installation', blog:'Blog', order:'Commander',
    brand:'SwiftChannels', footer:'Test gratuit de 24 heures, 8 000+ chaînes en direct et une grande bibliothèque films et séries.',
    try:'Commencer le test gratuit', compare:'Comparer les offres', useful:'Pages utiles',
    links:['Offres et prix','Liste des chaînes','Guide d’installation','Blog'],
    note:'Utilisez le guide d’installation, la liste des chaînes et les recommandations du blog pour vérifier ce qui compte pour votre foyer avant de choisir une offre payante.',
    faqTestQ:'Faut-il tester avant de payer ?', faqTestA:'Oui. Le test gratuit de 24 heures est le meilleur moyen de vérifier la qualité d’image, la compatibilité de l’application et les chaînes ou la bibliothèque qui vous intéressent.',
    faqPriceQ:'Où comparer les prix ?', faqPriceA:'Utilisez la section des offres sur la page d’accueil. Chaque offre ouvre le même service de base ; la différence principale est la durée et le nombre d’écrans simultanés.',
    about:'À propos', faq:'FAQ', terms:'Conditions'
  },
  es: {
    home:'Inicio', plans:'Planes', channels:'Canales', setup:'Instalación', blog:'Blog', order:'Pedir ahora',
    brand:'SwiftChannels', footer:'Prueba gratis de 24 horas, más de 8.000 canales en vivo y una gran biblioteca de películas y series.',
    try:'Empezar la prueba gratis', compare:'Comparar planes', useful:'Páginas útiles',
    links:['Planes y precios','Lista de canales','Guía de instalación','Blog'],
    note:'Usa la guía de instalación, la lista de canales y las recomendaciones del blog para comprobar lo que importa en tu casa antes de elegir un plan de pago.',
    faqTestQ:'¿Conviene probar antes de pagar?', faqTestA:'Sí. La prueba gratis de 24 horas es la mejor forma de revisar calidad de imagen, compatibilidad de la app y los canales o la biblioteca que te interesan.',
    faqPriceQ:'¿Dónde comparo precios?', faqPriceA:'Usa la sección de planes en la página de inicio. Todos los planes abren el mismo servicio base; cambia sobre todo la duración y el número de pantallas simultáneas.',
    about:'Sobre nosotros', faq:'FAQ', terms:'Términos'
  },
  de: {
    home:'Start', plans:'Tarife', channels:'Sender', setup:'Einrichtung', blog:'Blog', order:'Jetzt bestellen',
    brand:'SwiftChannels', footer:'Kostenloser 24-Stunden-Test, 8.000+ Live-Sender und eine große Film- und Serienbibliothek.',
    try:'Gratistest starten', compare:'Tarife vergleichen', useful:'Nützliche Seiten',
    links:['Tarife und Preise','Senderliste','Einrichtungsanleitung','Blog'],
    note:'Nutze die verlinkte Einrichtungshilfe, Senderliste und Blog-Empfehlungen, um vor einem bezahlten Tarif die Punkte zu prüfen, die für deinen Haushalt zählen.',
    faqTestQ:'Sollte ich vor dem Bezahlen testen?', faqTestA:'Ja. Der kostenlose 24-Stunden-Test ist der beste Weg, Bildqualität, App-Kompatibilität und die gewünschten Sender oder Inhalte zu prüfen.',
    faqPriceQ:'Wo vergleiche ich die Preise?', faqPriceA:'Nutze den Tarifbereich auf der Startseite. Jeder Tarif öffnet denselben Kernservice; der Hauptunterschied liegt bei Laufzeit und gleichzeitigen Verbindungen.',
    about:'Über uns', faq:'FAQ', terms:'AGB'
  },
  it: {
    home:'Home', plans:'Piani', channels:'Canali', setup:'Configurazione', blog:'Blog', order:'Ordina ora',
    brand:'SwiftChannels', footer:'Prova gratuita di 24 ore, oltre 8.000 canali live e una grande libreria di film e serie.',
    try:'Avvia la prova gratuita', compare:'Confronta i piani', useful:'Pagine utili',
    links:['Piani e prezzi','Lista canali','Guida alla configurazione','Blog'],
    note:'Usa la guida alla configurazione, la lista canali e i consigli del blog per controllare ciò che conta per casa tua prima di scegliere un piano a pagamento.',
    faqTestQ:'Conviene provare prima di pagare?', faqTestA:'Sì. La prova gratuita di 24 ore è il modo migliore per verificare qualità dell’immagine, compatibilità dell’app e canali o libreria che ti interessano.',
    faqPriceQ:'Dove confronto i prezzi?', faqPriceA:'Usa la sezione dei piani nella homepage. Ogni piano apre lo stesso servizio base; cambiano soprattutto durata e numero di connessioni simultanee.',
    about:'Chi siamo', faq:'FAQ', terms:'Condizioni'
  },
  nl: {
    home:'Home', plans:'Pakketten', channels:'Kanalen', setup:'Installatie', blog:'Blog', order:'Bestel nu',
    brand:'SwiftChannels', footer:'Gratis 24 uur testen, 8.000+ livekanalen en een grote film- en seriebibliotheek.',
    try:'Start gratis test', compare:'Vergelijk pakketten', useful:'Handige pagina’s',
    links:['Pakketten en prijzen','Volledige zenderlijst','Installatiegids','Blog'],
    note:'Gebruik de installatiegids, zenderlijst en blogtips om te controleren wat voor jouw huishouden belangrijk is voordat je een betaald pakket kiest.',
    faqTestQ:'Moet ik testen voordat ik betaal?', faqTestA:'Ja. De gratis test van 24 uur is de beste manier om beeldkwaliteit, app-compatibiliteit en de zenders of bibliotheek die je belangrijk vindt te controleren.',
    faqPriceQ:'Waar vergelijk ik prijzen?', faqPriceA:'Gebruik de pakkettensectie op de homepage. Elk pakket opent dezelfde kerndienst; vooral de looptijd en het aantal gelijktijdige verbindingen verschillen.',
    about:'Over ons', faq:'FAQ', terms:'Voorwaarden'
  }
};

const PAGES = {
  'faq.html': {
    type:'FAQPage', priority:'0.7', changefreq:'monthly',
    en: {
      title:'SwiftChannels IPTV FAQ — setup, trial, channels and plans',
      desc:'Answers about the SwiftChannels IPTV free test, plans, channels, devices, setup, payments, renewals and support.',
      label:'IPTV FAQ', h1:'SwiftChannels IPTV FAQ',
      intro:'Clear answers before you start the free 24-hour test: how the subscription works, what you can watch, which devices are supported and what happens after payment.',
      sections:[],
      faqs:[
        ['What is included with SwiftChannels?','Every plan includes 8,000+ live channels, a large on-demand film and series library, electronic programme guide support, catch-up where available, and help setting up your device.'],
        ['Is the 24-hour test really free?','Yes. The free test is designed so you can check channel quality, device compatibility and the film/series library before choosing a paid plan.'],
        ['Which devices can I use?','SwiftChannels works with common IPTV apps on Fire Stick, Android TV, Smart TV, iPhone, iPad, Apple TV, Windows, Mac and TV boxes that support M3U or Xtream Codes login.'],
        ['How fast does my internet need to be?','Aim for about 25 Mbps for 4K, 15 Mbps for HD and 5 Mbps for SD. A wired connection or strong 5 GHz Wi-Fi is best for live sport.'],
        ['Do subscriptions renew automatically?','No. Plans do not auto-renew. Your access ends on the expiry date unless you ask to extend it.'],
        ['Can I watch sport, films and series on the same plan?','Yes. The same subscription gives access to live channels, sports feeds, films and series. The plan length changes; the library does not get restricted by choosing a shorter plan.']
      ]
    },
    fr: {
      title:'FAQ SwiftChannels IPTV — installation, test, chaînes et offres',
      desc:'Réponses sur le test gratuit SwiftChannels IPTV, les offres, les chaînes, les appareils, l’installation, le paiement et le support.',
      label:'FAQ IPTV', h1:'FAQ SwiftChannels IPTV',
      intro:'Des réponses simples avant de lancer le test gratuit de 24 heures : fonctionnement de l’abonnement, contenu disponible, appareils compatibles et support après paiement.',
      sections:[],
      faqs:[
        ['Que comprend SwiftChannels ?','Chaque offre inclut plus de 8 000 chaînes en direct, une grande bibliothèque de films et séries à la demande, le guide TV, le catch-up quand il est disponible et l’aide à l’installation.'],
        ['Le test de 24 heures est-il vraiment gratuit ?','Oui. Le test gratuit permet de vérifier la qualité, la compatibilité de l’appareil et la bibliothèque avant de choisir une offre payante.'],
        ['Quels appareils sont compatibles ?','SwiftChannels fonctionne avec les applications IPTV courantes sur Fire Stick, Android TV, Smart TV, iPhone, iPad, Apple TV, Windows, Mac et box TV compatibles M3U ou Xtream Codes.'],
        ['Quelle vitesse internet faut-il ?','Visez environ 25 Mbps pour la 4K, 15 Mbps pour la HD et 5 Mbps pour la SD. Une connexion câblée ou un bon Wi-Fi 5 GHz reste préférable pour le sport en direct.'],
        ['Le renouvellement est-il automatique ?','Non. Les offres ne se renouvellent pas automatiquement. L’accès se termine à la date d’expiration sauf si vous demandez une prolongation.'],
        ['Puis-je regarder sport, films et séries avec la même offre ?','Oui. Le même abonnement donne accès aux chaînes en direct, au sport, aux films et aux séries. La durée change, pas la bibliothèque.']
      ]
    },
    es: {
      title:'Preguntas frecuentes SwiftChannels IPTV — instalación, prueba, canales y planes',
      desc:'Respuestas sobre la prueba gratis de SwiftChannels IPTV, planes, canales, dispositivos, instalación, pagos y soporte.',
      label:'FAQ IPTV', h1:'Preguntas frecuentes de SwiftChannels IPTV',
      intro:'Respuestas claras antes de empezar la prueba gratis de 24 horas: cómo funciona la suscripción, qué puedes ver, dispositivos compatibles y soporte.',
      sections:[],
      faqs:[
        ['¿Qué incluye SwiftChannels?','Todos los planes incluyen más de 8.000 canales en vivo, una gran biblioteca de películas y series bajo demanda, guía electrónica, catch-up cuando está disponible y ayuda de instalación.'],
        ['¿La prueba de 24 horas es realmente gratis?','Sí. La prueba gratis sirve para comprobar calidad, compatibilidad del dispositivo y biblioteca antes de elegir un plan de pago.'],
        ['¿Qué dispositivos puedo usar?','SwiftChannels funciona con apps IPTV comunes en Fire Stick, Android TV, Smart TV, iPhone, iPad, Apple TV, Windows, Mac y cajas compatibles con M3U o Xtream Codes.'],
        ['¿Qué velocidad de internet necesito?','Como referencia: 25 Mbps para 4K, 15 Mbps para HD y 5 Mbps para SD. Cable o Wi-Fi 5 GHz ayudan mucho en deportes en vivo.'],
        ['¿La suscripción se renueva automáticamente?','No. Los planes no se renuevan solos. El acceso termina en la fecha de vencimiento salvo que pidas extenderlo.'],
        ['¿Puedo ver deporte, películas y series en el mismo plan?','Sí. La misma suscripción da acceso a canales en vivo, deporte, películas y series. Cambia la duración del plan, no la biblioteca.']
      ]
    },
    de: {
      title:'SwiftChannels IPTV FAQ — Einrichtung, Test, Sender und Tarife',
      desc:'Antworten zum kostenlosen SwiftChannels IPTV Test, zu Tarifen, Sendern, Geräten, Einrichtung, Zahlung und Support.',
      label:'IPTV FAQ', h1:'SwiftChannels IPTV FAQ',
      intro:'Klare Antworten vor dem kostenlosen 24-Stunden-Test: wie das Abo funktioniert, was du sehen kannst, welche Geräte passen und wie Support läuft.',
      sections:[],
      faqs:[
        ['Was ist bei SwiftChannels enthalten?','Jeder Tarif enthält 8.000+ Live-Sender, eine große Film- und Serienbibliothek, EPG-Unterstützung, Catch-up wo verfügbar und Hilfe bei der Einrichtung.'],
        ['Ist der 24-Stunden-Test wirklich kostenlos?','Ja. Der kostenlose Test ist dafür da, Qualität, Gerätekompatibilität und Bibliothek zu prüfen, bevor du einen bezahlten Tarif wählst.'],
        ['Welche Geräte funktionieren?','SwiftChannels funktioniert mit gängigen IPTV-Apps auf Fire Stick, Android TV, Smart TV, iPhone, iPad, Apple TV, Windows, Mac und Boxen mit M3U oder Xtream Codes.'],
        ['Wie schnell muss mein Internet sein?','Plane etwa 25 Mbps für 4K, 15 Mbps für HD und 5 Mbps für SD. Kabel oder stabiles 5-GHz-WLAN ist besonders für Livesport besser.'],
        ['Verlängert sich das Abo automatisch?','Nein. Tarife verlängern sich nicht automatisch. Der Zugang endet am Ablaufdatum, sofern du keine Verlängerung anfragst.'],
        ['Kann ich Sport, Filme und Serien mit demselben Tarif sehen?','Ja. Dasselbe Abo öffnet Live-Sender, Sport, Filme und Serien. Die Laufzeit ändert sich, nicht die Bibliothek.']
      ]
    },
    it: {
      title:'FAQ SwiftChannels IPTV — configurazione, prova, canali e piani',
      desc:'Risposte su prova gratuita SwiftChannels IPTV, piani, canali, dispositivi, configurazione, pagamenti e supporto.',
      label:'FAQ IPTV', h1:'FAQ SwiftChannels IPTV',
      intro:'Risposte chiare prima della prova gratuita di 24 ore: come funziona l’abbonamento, cosa puoi guardare, dispositivi compatibili e supporto.',
      sections:[],
      faqs:[
        ['Cosa include SwiftChannels?','Ogni piano include oltre 8.000 canali live, una grande libreria di film e serie on demand, guida TV, catch-up dove disponibile e aiuto per la configurazione.'],
        ['La prova di 24 ore è davvero gratis?','Sì. La prova gratuita serve a verificare qualità, compatibilità del dispositivo e libreria prima di scegliere un piano a pagamento.'],
        ['Quali dispositivi posso usare?','SwiftChannels funziona con app IPTV comuni su Fire Stick, Android TV, Smart TV, iPhone, iPad, Apple TV, Windows, Mac e box compatibili M3U o Xtream Codes.'],
        ['Che velocità internet serve?','Punta a circa 25 Mbps per 4K, 15 Mbps per HD e 5 Mbps per SD. Cavo o Wi-Fi 5 GHz stabile sono migliori per lo sport live.'],
        ['Il rinnovo è automatico?','No. I piani non si rinnovano automaticamente. L’accesso termina alla scadenza salvo richiesta di estensione.'],
        ['Posso vedere sport, film e serie con lo stesso piano?','Sì. Lo stesso abbonamento dà accesso a canali live, sport, film e serie. Cambia la durata, non la libreria.']
      ]
    },
    nl: {
      title:'SwiftChannels IPTV FAQ — installatie, test, zenders en pakketten',
      desc:'Antwoorden over de gratis SwiftChannels IPTV-test, pakketten, zenders, apparaten, installatie, betaling en support.',
      label:'IPTV FAQ', h1:'SwiftChannels IPTV FAQ',
      intro:'Duidelijke antwoorden voordat je de gratis test van 24 uur start: hoe het abonnement werkt, wat je kunt kijken, welke apparaten werken en hoe support loopt.',
      sections:[],
      faqs:[
        ['Wat zit er in SwiftChannels?','Elk pakket bevat 8.000+ livekanalen, een grote film- en seriebibliotheek, tv-gids ondersteuning, catch-up waar beschikbaar en hulp bij installatie.'],
        ['Is de test van 24 uur echt gratis?','Ja. De gratis test is bedoeld om kwaliteit, apparaatcompatibiliteit en de bibliotheek te controleren voordat je een betaald pakket kiest.'],
        ['Welke apparaten kan ik gebruiken?','SwiftChannels werkt met gangbare IPTV-apps op Fire Stick, Android TV, Smart TV, iPhone, iPad, Apple TV, Windows, Mac en boxen met M3U of Xtream Codes.'],
        ['Hoe snel moet mijn internet zijn?','Richt op ongeveer 25 Mbps voor 4K, 15 Mbps voor HD en 5 Mbps voor SD. Kabel of sterk 5 GHz Wi-Fi is het best voor live sport.'],
        ['Verlengt het abonnement automatisch?','Nee. Pakketten verlengen niet automatisch. Toegang eindigt op de vervaldatum tenzij je vraagt om te verlengen.'],
        ['Kan ik sport, films en series met hetzelfde pakket kijken?','Ja. Hetzelfde abonnement geeft toegang tot livekanalen, sport, films en series. De looptijd verandert, niet de bibliotheek.']
      ]
    }
  },
  'about.html': {
    type:'AboutPage', priority:'0.6', changefreq:'yearly',
    en: {
      title:'About SwiftChannels — IPTV setup, support and subscription access',
      desc:'Learn how SwiftChannels helps customers test, set up and manage IPTV subscription access across popular devices.',
      label:'About', h1:'About SwiftChannels',
      intro:'SwiftChannels helps customers choose, test and set up IPTV subscription access for live channels, sports, films and series across everyday devices.',
      sections:[
        ['What we do',['We make the practical part simple: you choose a plan, tell us your device, test the service and receive setup help for the app you use.','SwiftChannels is a reseller of subscription access to a third-party live TV and on-demand streaming platform. We focus on clear communication, fast delivery and device support.']],
        ['How we support customers',['Setup help is included for Fire Stick, Smart TV, Android TV, Apple devices, computers and TV boxes.','Subscriptions do not renew automatically, so customers stay in control of renewals.']]
      ],
      faqs:[]
    },
    fr: {
      title:'À propos de SwiftChannels — installation IPTV, support et abonnement',
      desc:'Découvrez comment SwiftChannels aide ses clients à tester, installer et gérer un accès IPTV sur les appareils populaires.',
      label:'À propos', h1:'À propos de SwiftChannels',
      intro:'SwiftChannels aide les clients à choisir, tester et installer un accès IPTV pour les chaînes en direct, le sport, les films et les séries.',
      sections:[
        ['Ce que nous faisons',['Nous simplifions la partie pratique : choix de l’offre, appareil utilisé, test du service et aide d’installation pour l’application choisie.','SwiftChannels revend un accès par abonnement à une plateforme tierce de TV en direct et de vidéo à la demande. Notre rôle est la clarté, la livraison rapide et le support appareil.']],
        ['Notre accompagnement',['L’aide à l’installation couvre Fire Stick, Smart TV, Android TV, appareils Apple, ordinateurs et box TV.','Les abonnements ne se renouvellent pas automatiquement, afin que vous gardiez le contrôle.']]
      ],
      faqs:[]
    },
    es: {
      title:'Sobre SwiftChannels — instalación IPTV, soporte y acceso de suscripción',
      desc:'Descubre cómo SwiftChannels ayuda a probar, instalar y gestionar acceso IPTV en dispositivos populares.',
      label:'Sobre nosotros', h1:'Sobre SwiftChannels',
      intro:'SwiftChannels ayuda a elegir, probar e instalar acceso IPTV para canales en vivo, deportes, películas y series en dispositivos habituales.',
      sections:[
        ['Qué hacemos',['Simplificamos la parte práctica: eliges un plan, nos dices tu dispositivo, pruebas el servicio y recibes ayuda con la app.','SwiftChannels revende acceso por suscripción a una plataforma externa de TV en vivo y contenido bajo demanda. Nos centramos en claridad, entrega rápida y soporte.']],
        ['Cómo ayudamos',['La ayuda de instalación cubre Fire Stick, Smart TV, Android TV, dispositivos Apple, ordenadores y cajas TV.','Las suscripciones no se renuevan automáticamente, para que mantengas el control.']]
      ],
      faqs:[]
    },
    de: {
      title:'Über SwiftChannels — IPTV Einrichtung, Support und Abo-Zugang',
      desc:'So hilft SwiftChannels beim Testen, Einrichten und Verwalten von IPTV-Zugang auf beliebten Geräten.',
      label:'Über uns', h1:'Über SwiftChannels',
      intro:'SwiftChannels hilft Kunden, IPTV-Zugang für Live-Sender, Sport, Filme und Serien auf Alltagsgeräten zu wählen, zu testen und einzurichten.',
      sections:[
        ['Was wir tun',['Wir machen den praktischen Teil einfach: Tarif wählen, Gerät nennen, Dienst testen und Einrichtungshilfe für die genutzte App erhalten.','SwiftChannels verkauft Abo-Zugang zu einer externen Live-TV- und On-Demand-Plattform weiter. Unser Fokus liegt auf klarer Kommunikation, schneller Lieferung und Gerätesupport.']],
        ['Unser Support',['Einrichtungshilfe gibt es für Fire Stick, Smart TV, Android TV, Apple-Geräte, Computer und TV-Boxen.','Abos verlängern sich nicht automatisch, damit Kunden die Kontrolle behalten.']]
      ],
      faqs:[]
    },
    it: {
      title:'Chi siamo — configurazione IPTV, supporto e accesso SwiftChannels',
      desc:'Scopri come SwiftChannels aiuta a provare, configurare e gestire accesso IPTV sui dispositivi più usati.',
      label:'Chi siamo', h1:'Chi siamo: SwiftChannels',
      intro:'SwiftChannels aiuta i clienti a scegliere, provare e configurare accesso IPTV per canali live, sport, film e serie sui dispositivi quotidiani.',
      sections:[
        ['Cosa facciamo',['Rendiamo semplice la parte pratica: scegli un piano, ci dici il dispositivo, provi il servizio e ricevi aiuto per l’app.','SwiftChannels rivende accesso in abbonamento a una piattaforma terza di TV live e contenuti on demand. Puntiamo su comunicazione chiara, consegna rapida e supporto dispositivi.']],
        ['Come supportiamo',['L’aiuto alla configurazione copre Fire Stick, Smart TV, Android TV, dispositivi Apple, computer e box TV.','Gli abbonamenti non si rinnovano automaticamente, così resti in controllo.']]
      ],
      faqs:[]
    },
    nl: {
      title:'Over SwiftChannels — IPTV installatie, support en abonnementstoegang',
      desc:'Lees hoe SwiftChannels helpt met testen, installeren en beheren van IPTV-toegang op populaire apparaten.',
      label:'Over ons', h1:'Over SwiftChannels',
      intro:'SwiftChannels helpt klanten IPTV-toegang voor livekanalen, sport, films en series te kiezen, testen en installeren op gewone apparaten.',
      sections:[
        ['Wat we doen',['We maken het praktische deel eenvoudig: kies een pakket, geef je apparaat door, test de dienst en ontvang hulp voor de app die je gebruikt.','SwiftChannels verkoopt abonnementstoegang door tot een extern live-tv- en on-demandplatform. We focussen op duidelijke communicatie, snelle levering en apparaathulp.']],
        ['Hoe we helpen',['Installatiehulp is inbegrepen voor Fire Stick, Smart TV, Android TV, Apple-apparaten, computers en tv-boxen.','Abonnementen verlengen niet automatisch, zodat klanten controle houden.']]
      ],
      faqs:[]
    }
  }
};

const LANDING = {
  'best-iptv-for-sports.html': {
    priority:'0.75',
    en:['Best IPTV for sports — live football, PPV and international channels','Compare SwiftChannels IPTV for live sports, football, UFC, boxing, US leagues and international sports channels.','IPTV for sports fans','Live sport is where IPTV quality is tested: stable streams, a clear guide and fast support matter most when the match is already on.','Sports coverage to check','SwiftChannels gives access to international sports feeds, football channels, combat sports, US leagues and event channels where available. Use the free test before a major match to check your device and connection.'],
    fr:['Meilleur IPTV pour le sport — football, PPV et chaînes internationales','Comparez SwiftChannels IPTV pour le sport en direct, le football, l’UFC, la boxe, les ligues américaines et les chaînes sport internationales.','IPTV pour fans de sport','Le sport en direct teste vraiment la qualité IPTV : stabilité, guide clair et support rapide comptent surtout quand le match a déjà commencé.','Couverture sportive à vérifier','SwiftChannels donne accès à des flux sportifs internationaux, chaînes football, sports de combat, ligues américaines et chaînes événementielles selon disponibilité. Utilisez le test gratuit avant un grand match.'],
    es:['Mejor IPTV para deportes — fútbol en vivo, PPV y canales internacionales','Compara SwiftChannels IPTV para deportes en vivo, fútbol, UFC, boxeo, ligas de EE. UU. y canales deportivos internacionales.','IPTV para fans del deporte','El deporte en vivo es donde se prueba la calidad IPTV: estabilidad, guía clara y soporte rápido importan cuando el partido ya empezó.','Cobertura deportiva a revisar','SwiftChannels da acceso a señales deportivas internacionales, canales de fútbol, deportes de combate, ligas estadounidenses y eventos cuando están disponibles. Usa la prueba gratis antes de un partido importante.'],
    de:['Bestes IPTV für Sport — Live-Fußball, PPV und internationale Sender','Vergleiche SwiftChannels IPTV für Livesport, Fußball, UFC, Boxen, US-Ligen und internationale Sportsender.','IPTV für Sportfans','Livesport testet IPTV wirklich: stabile Streams, klare Programmführung und schneller Support zählen, wenn das Spiel schon läuft.','Sportabdeckung prüfen','SwiftChannels bietet Zugang zu internationalen Sportfeeds, Fußballsendern, Kampfsport, US-Ligen und Eventkanälen, wo verfügbar. Nutze den Gratistest vor einem großen Spiel.'],
    it:['Miglior IPTV per sport — calcio live, PPV e canali internazionali','Confronta SwiftChannels IPTV per sport live, calcio, UFC, boxe, leghe USA e canali sportivi internazionali.','IPTV per appassionati di sport','Lo sport live mette davvero alla prova l’IPTV: stabilità, guida chiara e supporto rapido contano quando la partita è già iniziata.','Copertura sportiva da controllare','SwiftChannels offre accesso a feed sportivi internazionali, canali calcio, sport da combattimento, leghe USA e canali evento dove disponibili. Usa la prova gratuita prima di una partita importante.'],
    nl:['Beste IPTV voor sport — live voetbal, PPV en internationale zenders','Vergelijk SwiftChannels IPTV voor live sport, voetbal, UFC, boksen, Amerikaanse competities en internationale sportzenders.','IPTV voor sportfans','Live sport test IPTV echt: stabiele streams, duidelijke gids en snelle support tellen wanneer de wedstrijd al bezig is.','Sportaanbod controleren','SwiftChannels geeft toegang tot internationale sportfeeds, voetbalzenders, vechtsport, Amerikaanse competities en eventkanalen waar beschikbaar. Gebruik de gratis test voor een grote wedstrijd.']
  },
  'best-iptv-for-movies.html': {
    priority:'0.75',
    en:['Best IPTV for movies and series — VOD, live movie channels and family viewing','Use SwiftChannels IPTV for films, box sets, live movie channels and family nights, with a free 24-hour test.','IPTV for movies and series','A good movie setup is about choice and comfort: a large VOD library, reliable playback, clear categories and enough live movie channels for easy browsing.','What makes it useful','SwiftChannels combines live movie channels with a large on-demand library, so you can browse casually or choose from curated blog recommendations before opening your IPTV app.'],
    fr:['Meilleur IPTV pour films et séries — VOD, chaînes cinéma et famille','Utilisez SwiftChannels IPTV pour films, séries, chaînes cinéma et soirées en famille, avec test gratuit de 24 heures.','IPTV pour films et séries','Un bon usage cinéma repose sur le choix et le confort : grande VOD, lecture stable, catégories claires et assez de chaînes cinéma en direct.','Pourquoi c’est utile','SwiftChannels combine chaînes cinéma en direct et grande bibliothèque à la demande, pour naviguer librement ou partir des recommandations du blog.'],
    es:['Mejor IPTV para películas y series — VOD, canales de cine y familia','Usa SwiftChannels IPTV para películas, series, canales de cine y noches familiares, con prueba gratis de 24 horas.','IPTV para películas y series','Una buena experiencia de cine necesita elección y comodidad: gran VOD, reproducción estable, categorías claras y canales de cine en vivo.','Por qué es útil','SwiftChannels combina canales de cine en vivo con una gran biblioteca bajo demanda, para explorar o elegir desde las recomendaciones del blog.'],
    de:['Bestes IPTV für Filme und Serien — VOD, Filmsender und Familienabend','Nutze SwiftChannels IPTV für Filme, Serien, Filmsender und Familienabende mit kostenlosem 24-Stunden-Test.','IPTV für Filme und Serien','Ein gutes Film-Setup braucht Auswahl und Komfort: große VOD-Bibliothek, stabile Wiedergabe, klare Kategorien und Live-Filmsender.','Warum es nützlich ist','SwiftChannels verbindet Live-Filmsender mit großer On-Demand-Bibliothek, sodass du frei stöbern oder Blog-Empfehlungen nutzen kannst.'],
    it:['Miglior IPTV per film e serie — VOD, canali cinema e famiglia','Usa SwiftChannels IPTV per film, serie, canali cinema e serate in famiglia, con prova gratuita di 24 ore.','IPTV per film e serie','Una buona esperienza film richiede scelta e comodità: grande VOD, riproduzione stabile, categorie chiare e canali cinema live.','Perché è utile','SwiftChannels unisce canali cinema live e grande libreria on demand, così puoi navigare liberamente o partire dai consigli del blog.'],
    nl:['Beste IPTV voor films en series — VOD, filmzenders en gezin','Gebruik SwiftChannels IPTV voor films, series, filmzenders en gezinsavonden, met gratis test van 24 uur.','IPTV voor films en series','Een goede filmervaring draait om keuze en comfort: grote VOD-bibliotheek, stabiele weergave, duidelijke categorieën en live filmzenders.','Waarom dit handig is','SwiftChannels combineert live filmzenders met een grote on-demandbibliotheek, zodat je vrij kunt bladeren of blogtips kunt volgen.']
  },
  'iptv-for-firestick.html': {
    priority:'0.7',
    en:['IPTV for Fire Stick — SwiftChannels setup and free test','Set up SwiftChannels IPTV on Amazon Fire Stick with a compatible IPTV app and test the service free for 24 hours.','IPTV on Fire Stick','Fire Stick is one of the easiest ways to use IPTV on a normal television because it is affordable, portable and supports popular IPTV apps.','Setup path','Start with the free test, install a compatible player, then enter the login details we send. If the app asks for Xtream Codes or an M3U playlist, the setup guide explains which details to use.'],
    fr:['IPTV sur Fire Stick — installation SwiftChannels et test gratuit','Installez SwiftChannels IPTV sur Amazon Fire Stick avec une application compatible et testez le service gratuitement pendant 24 heures.','IPTV sur Fire Stick','Fire Stick est l’une des façons les plus simples d’utiliser l’IPTV sur une télévision classique : abordable, portable et compatible avec les apps populaires.','Chemin d’installation','Commencez par le test gratuit, installez un lecteur compatible, puis entrez les identifiants envoyés. Le guide précise quoi utiliser pour Xtream Codes ou M3U.'],
    es:['IPTV para Fire Stick — instalación SwiftChannels y prueba gratis','Configura SwiftChannels IPTV en Amazon Fire Stick con una app compatible y prueba el servicio gratis durante 24 horas.','IPTV en Fire Stick','Fire Stick es una de las formas más sencillas de usar IPTV en una televisión normal: económico, portátil y compatible con apps populares.','Ruta de instalación','Empieza con la prueba gratis, instala un reproductor compatible y escribe los datos que enviamos. La guía explica qué usar para Xtream Codes o M3U.'],
    de:['IPTV für Fire Stick — SwiftChannels Einrichtung und Gratistest','Richte SwiftChannels IPTV auf Amazon Fire Stick mit kompatibler App ein und teste den Dienst 24 Stunden kostenlos.','IPTV auf Fire Stick','Fire Stick ist eine der einfachsten IPTV-Lösungen am normalen Fernseher: günstig, tragbar und kompatibel mit beliebten IPTV-Apps.','Einrichtungsweg','Starte mit dem Gratistest, installiere einen kompatiblen Player und trage die Login-Daten ein. Die Anleitung erklärt Xtream Codes und M3U.'],
    it:['IPTV per Fire Stick — configurazione SwiftChannels e prova gratuita','Configura SwiftChannels IPTV su Amazon Fire Stick con un’app compatibile e prova il servizio gratis per 24 ore.','IPTV su Fire Stick','Fire Stick è uno dei modi più semplici per usare IPTV su una TV normale: economico, portatile e compatibile con app popolari.','Percorso di configurazione','Inizia con la prova gratuita, installa un player compatibile e inserisci i dati inviati. La guida spiega cosa usare per Xtream Codes o M3U.'],
    nl:['IPTV voor Fire Stick — SwiftChannels installatie en gratis test','Stel SwiftChannels IPTV in op Amazon Fire Stick met een geschikte IPTV-app en test gratis 24 uur.','IPTV op Fire Stick','Fire Stick is een van de makkelijkste manieren om IPTV op een gewone tv te gebruiken: betaalbaar, draagbaar en geschikt voor populaire apps.','Installatiestappen','Begin met de gratis test, installeer een compatibele player en voer de login in. De gids legt uit wat je gebruikt voor Xtream Codes of M3U.']
  },
  'iptv-for-smart-tv.html': {
    priority:'0.7',
    en:['IPTV for Smart TV — Samsung, LG and Android TV setup','Use SwiftChannels IPTV on Samsung, LG and Android TV with compatible apps and clear setup help.','IPTV on Smart TV','A Smart TV setup keeps everything on the main screen without extra boxes, as long as the TV supports a compatible IPTV player.','Before you start','Check the app store on your TV, run the free test and keep your login details ready. For older TVs, an Android TV box or Fire Stick may be smoother than the built-in app store.'],
    fr:['IPTV pour Smart TV — installation Samsung, LG et Android TV','Utilisez SwiftChannels IPTV sur Samsung, LG et Android TV avec des applications compatibles et une aide claire.','IPTV sur Smart TV','Une Smart TV garde tout sur l’écran principal sans boîtier supplémentaire, si le téléviseur accepte un lecteur IPTV compatible.','Avant de commencer','Vérifiez le magasin d’applications de la TV, lancez le test gratuit et gardez les identifiants prêts. Sur les anciens modèles, un boîtier Android TV ou Fire Stick peut être plus fluide.'],
    es:['IPTV para Smart TV — instalación Samsung, LG y Android TV','Usa SwiftChannels IPTV en Samsung, LG y Android TV con apps compatibles y ayuda clara de instalación.','IPTV en Smart TV','Una Smart TV mantiene todo en la pantalla principal sin cajas extra, siempre que admita un reproductor IPTV compatible.','Antes de empezar','Revisa la tienda de apps del televisor, inicia la prueba gratis y ten los datos listos. En televisores antiguos, una caja Android TV o Fire Stick puede ir mejor.'],
    de:['IPTV für Smart TV — Samsung, LG und Android TV Einrichtung','Nutze SwiftChannels IPTV auf Samsung, LG und Android TV mit kompatiblen Apps und klarer Hilfe.','IPTV auf Smart TV','Smart TV hält alles direkt auf dem Hauptbildschirm ohne Zusatzbox, solange ein kompatibler IPTV-Player verfügbar ist.','Vor dem Start','Prüfe den App Store des TVs, starte den Gratistest und halte die Login-Daten bereit. Bei älteren Geräten ist eine Android-TV-Box oder Fire Stick oft flüssiger.'],
    it:['IPTV per Smart TV — configurazione Samsung, LG e Android TV','Usa SwiftChannels IPTV su Samsung, LG e Android TV con app compatibili e aiuto chiaro.','IPTV su Smart TV','La Smart TV tiene tutto sullo schermo principale senza box extra, se supporta un player IPTV compatibile.','Prima di iniziare','Controlla lo store della TV, avvia la prova gratuita e tieni pronti i dati di accesso. Su TV vecchie, Android TV box o Fire Stick possono essere più fluidi.'],
    nl:['IPTV voor Smart TV — Samsung, LG en Android TV installatie','Gebruik SwiftChannels IPTV op Samsung, LG en Android TV met geschikte apps en duidelijke hulp.','IPTV op Smart TV','Een Smart TV houdt alles op het hoofdscherm zonder extra box, zolang de tv een compatibele IPTV-player ondersteunt.','Voordat je start','Controleer de app store van je tv, start de gratis test en houd je login klaar. Bij oudere tv’s werkt een Android TV-box of Fire Stick vaak soepeler.']
  }
};

for (const [slug, data] of Object.entries(LANDING)) {
  PAGES[slug] = {
    type:'WebPage', priority:data.priority, changefreq:'monthly',
    ...Object.fromEntries(Object.entries(data).map(([lang, arr]) => [lang, {
      title:arr[0], desc:arr[1], label:arr[2], h1:arr[2], intro:arr[3],
      sections:[[arr[4], [arr[5], (COMMON[lang] || COMMON.en).note]]],
      faqs:[
        [(COMMON[lang] || COMMON.en).faqTestQ, (COMMON[lang] || COMMON.en).faqTestA],
        [(COMMON[lang] || COMMON.en).faqPriceQ, (COMMON[lang] || COMMON.en).faqPriceA]
      ]
    }]))
  };
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function attr(s) { return esc(s).replace(/`/g, '&#96;'); }

function pagePath(lang, slug) {
  return lang === 'en' ? slug : `${lang}/${slug}`;
}

function pageUrl(site, lang, slug) {
  return `${site}/${pagePath(lang, slug)}`;
}

function prefix(lang) {
  return lang === 'en' ? '' : '../';
}

function langSwitch(siteLangs, currentLang, slug, rootPrefix) {
  const names = { en:'English', fr:'Français', es:'Español', de:'Deutsch', it:'Italiano', nl:'Nederlands' };
  return siteLangs.map(L => {
    const href = `${rootPrefix}${pagePath(L.code, slug)}`;
    return `<a class="lang-b" href="${href}" data-lang="${L.code}" hreflang="${L.code}" aria-current="${L.code === currentLang}" title="${names[L.code]}"><img src="${rootPrefix}assets/flag-${L.code}.webp" alt="" width="32" height="32"><span>${names[L.code]}</span></a>`;
  }).join('');
}

function schemaFor(site, slug, lang, page) {
  const url = pageUrl(site, lang, slug);
  const graph = [
    {
      '@type': page.type || 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: page.title,
      description: page.desc,
      inLanguage: lang,
      isPartOf: { '@id': `${site}/#website` },
      publisher: { '@id': `${site}/#organization` }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'SwiftChannels', item: `${site}/` },
        { '@type': 'ListItem', position: 2, name: page.h1, item: url }
      ]
    }
  ];
  if (page.faqs && page.faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${url}#faq`,
      inLanguage: lang,
      mainEntity: page.faqs.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    });
  }
  return JSON.stringify({ '@context':'https://schema.org', '@graph': graph }, null, 2);
}

function render({ site, langs, slug, lang }) {
  const page = PAGES[slug][lang] || PAGES[slug].en;
  const common = COMMON[lang] || COMMON.en;
  const root = prefix(lang);
  const home = 'index.html';
  const url = pageUrl(site, lang, slug);
  const alternates = langs.map(L => `<link rel="alternate" hreflang="${L.code}" href="${pageUrl(site, L.code, slug)}">`).join('\n')
    + `\n<link rel="alternate" hreflang="x-default" href="${pageUrl(site, 'en', slug)}">`;
  const useful = [
    [`${home}#plans`, common.links[0]],
    ['channels.html', common.links[1]],
    ['install.html', common.links[2]],
    ['blog/', common.links[3]]
  ];
  const sectionHtml = (page.sections || []).map(([heading, paras]) => `<section class="prose"><h2>${esc(heading)}</h2>${paras.map(p => `<p>${esc(p)}</p>`).join('')}</section>`).join('');
  const faqHtml = (page.faqs || []).length ? `<section><h2>${esc(page.label)}</h2><div class="faq">${page.faqs.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>` : '';
  return `<!DOCTYPE html>
<html lang="${lang}" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)} | SwiftChannels</title>
<meta name="description" content="${attr(page.desc)}">
<meta name="theme-color" content="#050A18">
<link rel="canonical" href="${url}">
${alternates}
<meta property="og:type" content="website">
<meta property="og:site_name" content="SwiftChannels">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${attr(page.title)}">
<meta property="og:description" content="${attr(page.desc)}">
<meta property="og:image" content="${site}/assets/og-card.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(page.title)}">
<meta name="twitter:description" content="${attr(page.desc)}">
<meta name="twitter:image" content="${site}/assets/og-card.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${root}assets/seo.css">
</head>
<body>
<div class="bg"></div>
<nav class="top"><a class="brand" href="${home}"><span class="brand-mark"></span><b>Swift<span>Channels</span></b></a><div class="links"><a href="${home}#plans">${esc(common.plans)}</a><a href="channels.html">${esc(common.channels)}</a><a href="install.html">${esc(common.setup)}</a><a href="blog/">${esc(common.blog)}</a><a href="faq.html">FAQ</a></div><div class="lang"><button class="lang-cur" type="button" id="langCur" aria-expanded="false"><img src="${root}assets/flag-${lang}.webp" alt="" width="32" height="32"></button><div class="lang-opts" id="langOpts">${langSwitch(langs, lang, slug, root)}</div></div><a class="btn" href="${home}#order">${esc(common.order)}</a></nav>
<main class="wrap">
  <header class="hero"><span class="eyebrow">${esc(page.label)}</span><h1>${esc(page.h1)}</h1><p>${esc(page.intro)}</p><div class="hero-actions"><a class="btn" href="${home}#order">${esc(common.try)}</a><a class="btn ghost" href="${home}#plans">${esc(common.compare)}</a></div></header>
  <div class="content">
    <div>${sectionHtml}${faqHtml}</div>
    <aside class="aside"><h2>${esc(common.useful)}</h2>${useful.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('')}</aside>
  </div>
  <section class="band"><h2>${esc(common.compare)}</h2><p>${esc(page.desc)}</p><div class="link-grid">${useful.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('')}</div></section>
</main>
<footer><b>SwiftChannels</b><span>${esc(common.footer)}</span><a href="about.html">${esc(common.about)}</a><a href="faq.html">${esc(common.faq)}</a><a href="legal.html">${esc(common.terms)}</a></footer>
<script type="application/ld+json">${schemaFor(site, slug, lang, page)}</script>
<script>
const cur=document.getElementById('langCur'), box=document.querySelector('.lang');
if(cur&&box){cur.addEventListener('click',()=>{const open=box.classList.toggle('open');cur.setAttribute('aria-expanded',String(open));});document.addEventListener('click',e=>{if(!box.contains(e.target)){box.classList.remove('open');cur.setAttribute('aria-expanded','false');}});}
</script>
</body>
</html>
`;
}

function buildSeoPages({ ROOT, SITE, LANGS, today }) {
  const sitemap = [];
  for (const slug of PAGE_SLUGS) {
    for (const L of LANGS) {
      const out = path.join(ROOT, pagePath(L.code, slug));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, render({ site:SITE, langs:LANGS, slug, lang:L.code }), 'utf8');
    }
    for (const L of LANGS) {
      sitemap.push({
        lang: L.code,
        slug,
        lastmod: today,
        changefreq: PAGES[slug].changefreq,
        priority: L.code === 'en' ? PAGES[slug].priority : String(Math.max(0.5, Number(PAGES[slug].priority) - 0.05)),
        alternates: LANGS.map(x => [x.code, pageUrl(SITE, x.code, slug)])
      });
    }
  }
  return { sitemap: sitemap.map(entry => `  <url>
    <loc>${pageUrl(SITE, entry.lang, entry.slug)}</loc>
${entry.alternates.map(([code, href]) => `      <xhtml:link rel="alternate" hreflang="${code}" href="${href}"/>`).join('\n')}
      <xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(SITE, 'en', entry.slug)}"/>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n') };
}

module.exports = { buildSeoPages };
