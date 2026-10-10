export const TRIP_DESCRIPTION = `Willkommen zur Amsterdam Grachtenfahrt! Begleite uns auf einer malerischen Reise durch die historischen Grachten Amsterdams. Entlang der Route entdeckst du 16 ikonische Wahrzeichen und fotografierst typisch holländische Dinge, testest dein Wissen mit Grachten-Quizfragen und fängst deine eigenen Erinnerungen dieser unvergesslichen Tour ein. Lade an jedem Stop Fotos hoch, beantworte die Umfragen und teile deine Gedanken, um Punkte zu sammeln und in der Rangliste aufzusteigen!`;

export const PHOTO_SPOTS = [
  { label: 'Anne-Frank Huis', detail: 'Im Hinterhaus des Prinsengracht 263 schrieb Anne Frank ihr berühmtes Tagebuch. Den Glockenschlag des nahe gelegenen Westertorens konnte sie aus dem Versteck hören.' },
  { label: 'Westerkerk & Westertoren', detail: 'Der Westertoren ist mit 85 Metern der höchste Kirchturm Amsterdams. Mit Turmspitze und Wetterhahn ist er 87 Meter hoch. Normalerweise kann man den Turm bis zum ersten Balkon besteigen.' },
  { label: 'Magere Brug', detail: 'Die „Magere Brug" ist eine der bekanntesten Brücken Amsterdams. Die heutige Brücke entstand in den 1930er-Jahren und kann hochgeklappt werden, damit Schiffe passieren können. Nachts wird sie beleuchtet.' },
  { label: 'Damrak', detail: 'Der Damrak war früher ein wichtiger Teil des Hafens von Amsterdam. Heute verbindet er den Hauptbahnhof mit dem Dam und ist von historischen Gebäuden gesäumt.' },
  { label: 'Amsterdam Centraal', detail: 'Amsterdam Centraal wurde 1889 eröffnet und auf drei künstlich aufgeschütteten Inseln im IJ errichtet. Das Gebäude steht auf insgesamt 8.687 Holzpfählen.' },
  { label: "A'DAM Tower", detail: 'Auf dem Dach des A\'DAM Towers befindet sich „Over the Edge", die höchste Schaukel Amsterdams. Sie schwingt in etwa 100 Metern Höhe über den Rand des Gebäudes. Die Schaukel befindet sich auf der 21. Etage und bietet dabei einen 180°-Blick.' },
  { label: 'NEMO Science Museum', detail: 'Das auffällige, kupfergrüne Gebäude wurde vom italienischen Architekten Renzo Piano entworfen. Seine geschwungene Form wurde durch den darunterliegenden Tunnel inspiriert. Auf dem Dach befindet sich ein öffentlich zugänglicher Stadtplatz.' },
  { label: 'Royal Theater Carré', detail: 'Das Carré wurde 1887 als festes Zirkusgebäude für den Zirkusdirektor Oscar Carré errichtet. Später wurde es auch für Theater, Operetten, Revuen und andere Shows genutzt.' },
  { label: 'Amstel Hotel', detail: 'Das Amstel Hotel wurde 1867 eröffnet und war eines der ersten großen Luxushotels Amsterdams. Seit seiner Eröffnung übernachteten hier zahlreiche prominente Gäste und Mitglieder von Königshäusern.' },
  { label: 'De Negen Straatjes', detail: 'Die „Negen Straatjes" (Neun Straßen) liegen zwischen den vier großen Grachten des Grachtengürtels. Die historischen Straßen sind heute vor allem für kleine Geschäfte, Boutiquen, Galerien und Cafés bekannt.' },
  { label: 'Gouden Bocht', detail: 'Die „Goldene Biegung" am Herengracht gilt als besonders prachtvoller Teil des Grachtengürtels. Hier stehen ungewöhnlich breite und tiefe Herrenhäuser, die vor allem von wohlhabenden Amsterdamer Familien errichtet wurden.' },
  { label: 'Het Scheepvaartmuseum & VOC-schip Amsterdam', detail: 'Das Gebäude des Scheepvaartmuseums war ursprünglich das Zeemagazijn, ein Lager- und Ausrüstungsgebäude der niederländischen Admiralität. Vor dem Museum liegt eine begehbare Nachbildung des VOC-Schiffs „Amsterdam".' },
  { label: 'Rijksmuseum', detail: 'Das Rijksmuseum zeigt mehr als 8.000 Kunstwerke und historische Objekte. Zu den berühmtesten Werken gehört Rembrandts „Nachtwache". Durch das Gebäude führt außerdem ein öffentlicher Durchgang, der von Radfahrern und Fußgängern genutzt wird.' },
  { label: 'Stadsarchief Amsterdam (De Bazel)', detail: 'Das Gebäude De Bazel wurde 1926 als Hauptsitz der Nederlandsche Handel-Maatschappij eröffnet. Entworfen wurde es vom Architekten K.P.C. de Bazel. Seit 2007 befindet sich hier das Stadtarchiv Amsterdam.' },
  { label: 'De Nationale Opera & Ballet', detail: 'Das Gebäude am Waterlooplein wurde 1986 als Amsterdamer Muziektheater eröffnet. Seitdem teilen sich die Nederlandse Opera und das Nationale Ballet das Gebäude.' },
  { label: 'Eye', detail: 'Das auffällige weiße Gebäude des Eye Filmmuseums steht direkt gegenüber dem Hauptbahnhof am IJ. Eye besitzt eine der größten Filmsammlungen der Niederlande mit mehr als 60.000 Filmtiteln. Viele Filme können online kostenlos angesehen werden.' },
];

export const THINGS_SPOTS = [
  { label: 'Das schiefste Haus' },
  { label: 'Das dünnste Haus' },
  { label: 'Das schönste Haus' },
  { label: 'Das schönste Boot' },
  { label: 'Ein Detail, was etwas über den Zustand der Grachten verrät' },
  { label: 'Ein Beispiel für fahrradgerechte Verkehrsführung' },
  { label: 'Ein Beispiel für eine autogerechte Stadt' },
  { label: 'Eine Sache die dir besonders ins Auge sticht' },
  { label: 'Die schönste Brücke' },
  { label: 'Die Brücke mit den meisten Fahrrädern' },
  { label: 'Etwas was du besonders Schön findest' },
  { label: 'Etwas was dir überhaupt nicht gefällt' },
];

export type PollQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export const POLL_QUESTIONS: PollQuestion[] = [
  {
    question: 'Wie viele Jahre sind im Amsterdamer Stadsarchiv dokumentiert?',
    options: ['650 Jahre', '480 Jahre', '530 Jahre', '750 Jahre'],
    correctIndex: 3,
  },
  {
    question: 'Wann wurde Amsterdam Centraal eröffnet?',
    options: ['1. September 1906', '15. Oktober 1889', '24. Dezember 1994', '9. Juli 1871'],
    correctIndex: 1,
  },
  {
    question: 'In welchem Baustil ist Amsterdam Centraal gebaut?',
    options: [
      'Jugendstil (mit Einflüssen der Neorenaissance)',
      'Neorenaissance (mit Einflüssen der Neogotik)',
      'Historismus (mit Einflüssen des Eklektizismus)',
      'Klassizismus (mit Einflüssen des Jugendstils)',
    ],
    correctIndex: 1,
  },
  {
    question: 'Was sind die Themen des NEMO Science Museums?',
    options: [
      'Geologie, Petroleumgeologie, Erdölgeologie',
      'Ozeanographie, Meeresbiologie, Maritime Meteorologie',
      'Physik, Chemie, Biologie und Technik',
      'Funghi, Napoletana, Quattro Fermenti, Marinara, Margherita',
    ],
    correctIndex: 2,
  },
  {
    question: 'Wie tief sind die Grachten im Durchschnitt?',
    options: ['1,20 Meter', '3,60 Meter', '2,4 Meter', '2,9 Meter'],
    correctIndex: 2,
  },
  {
    question: 'Wie viele Fahrräder werden durchschnittlich jährlich aus den Grachten gezogen?',
    options: ['5.000–10.000', '10.000–15.000', '1.000–5.000', '15.000–20.000'],
    correctIndex: 1,
  },
  {
    question: 'Auf wie vielen Pfählen steht der königliche Palast in Amsterdam?',
    options: ['13.659', '19.114', '31.120', '9.608'],
    correctIndex: 0,
  },
  {
    question: 'In welchem Jahr wurden die ersten touristischen Grachtenfahrten angeboten?',
    options: ['1901', '1912', '1878', '2003'],
    correctIndex: 1,
  },
  {
    question: 'Wie viele Touristen nehmen in Amsterdam jährlich an einer Grachtenfahrt teil?',
    options: ['1.000.000 – 2.000.000', '2.500.000', '3.000.000 – 5.000.000', '6.000.000'],
    correctIndex: 2,
  },
  {
    question: 'Warum konnten sich die touristischen Grachtenfahrten anfangs nicht durchsetzen?',
    options: [
      'Der Betrieb der Boote war zu teuer',
      'Der Geruch der Grachten war zu unangenehm, da sie zu dieser Zeit noch als Kanalisation genutzt wurden',
      'Nachdem zwei Grachtenboote bei einem Unfall kollidierten und mehrere Menschen ums Leben kamen, wurden touristische Grachtenfahrten vorübergehend verboten',
      'Anfangs bestand kaum Interesse an diesem Angebot',
    ],
    correctIndex: 1,
  },
];

import { MAX_BONUS_UPLOADS } from '@/lib/supabase';

export const MAX_POINTS = PHOTO_SPOTS.length + THINGS_SPOTS.length + POLL_QUESTIONS.length + MAX_BONUS_UPLOADS + 1;
