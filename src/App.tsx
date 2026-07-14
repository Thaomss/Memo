import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import planImage from './assets/drago/plan-dragonniere.png';

type Tab = 'horaires' | 'plan' | 'tarifs';
type DayKind = 'week' | 'weekend' | 'all' | 'special';
type Category = 'Restauration' | 'Bars' | 'Commerces' | 'Services' | 'Aquatique' | 'Activites' | 'Sante';

type Schedule = {
  name: string;
  category: Category;
  period?: string;
  times: { label: string; value: string; day: DayKind }[];
  note?: string;
  details?: string[];
  tags?: string[];
  answer?: string;
};

type MapZone = {
  label: string;
  from: number;
  to: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  hint: string;
  columns?: number;
};

type PlaceResult = {
  number: number;
  zone: MapZone;
  x: number;
  y: number;
  exact: boolean;
};

type PlacementMap = Record<number, { x: number; y: number }>;

const schedules: Schedule[] = [
  {
    name: 'Reception',
    category: 'Services',
    times: [
      { label: 'Reception', value: '8h-20h', day: 'all' },
      { label: 'Reservations', value: '9h-19h', day: 'all' },
      { label: 'Urgence', value: '06 22 82 29 78', day: 'all' },
    ],
    details: ['Telephone reception : 04 67 01 03 10', 'Boutique souvenirs accessible a la reception.'],
    tags: ['reception', 'accueil', 'telephone', 'urgence', 'reservation'],
    answer: 'Reception ouverte tous les jours 8h-20h. Reservations au 04 67 01 03 10 de 9h a 19h. Urgence : 06 22 82 29 78.',
  },
  {
    name: 'Point Information',
    category: 'Services',
    times: [
      { label: 'Lundi a vendredi', value: '10h-13h et 14h-18h', day: 'week' },
      { label: 'Samedi et dimanche', value: '10h-12h et 16h-18h', day: 'weekend' },
    ],
    details: ['Pret de materiel contre carte d identite en garantie.', 'Padel : reservation et paiement en reception, 20 EUR. Materiel a recuperer a la reception.'],
    tags: ['point info', 'information', 'pret materiel', 'raquette', 'padel', 'paddle', 'sport'],
    answer: 'Point Info ouvert tous les jours : semaine 10h-13h et 14h-18h, week-end 10h-12h et 16h-18h.',
  },
  {
    name: 'Comptoir lingerie technique',
    category: 'Services',
    times: [
      { label: 'Lundi a vendredi', value: '8h-13h et 14h-19h', day: 'week' },
      { label: 'Week-end', value: '8h-19h non-stop', day: 'weekend' },
      { label: 'Urgence', value: '06 22 82 29 78', day: 'all' },
    ],
    details: ['Location et questions techniques logement.', 'Telephone accueil : 04 67 01 03 10.'],
    tags: ['comptoir', 'lingerie', 'technique', 'draps', 'serviettes', 'probleme', 'logement'],
    answer: 'Comptoir lingerie technique : lundi-vendredi 8h-13h et 14h-19h, week-end 8h-19h non-stop. Urgence : 06 22 82 29 78.',
  },
  {
    name: 'Laverie',
    category: 'Services',
    times: [{ label: 'Libre acces', value: '6h-00h', day: 'all' }],
    details: ['Lessive 1 EUR.', 'Lave-linge 6 EUR, duree 30 min.', 'Seche-linge 3 EUR, pieces de 1 EUR et 2 EUR acceptees, duree 45 min.', 'Monnayeur disponible a l entree de la laverie.'],
    tags: ['laverie', 'machine', 'linge', 'lessive', 'seche linge', 'monnayeur'],
    answer: 'Laverie en libre acces tous les jours de 6h a minuit. Lessive 1 EUR, lave-linge 6 EUR, seche-linge 3 EUR.',
  },
  {
    name: 'Halte-garderie',
    category: 'Services',
    period: '29/06 au 28/08/2026',
    times: [
      { label: 'Lun, mar, mer, ven', value: '10h-13h et 15h-18h', day: 'week' },
      { label: 'Jeudi', value: '10h-17h', day: 'special' },
      { label: 'Telephone', value: '06 52 86 33 78', day: 'all' },
      { label: 'Tarifs', value: '5 EUR/h ou 12 EUR la 1/2 journee', day: 'all' },
    ],
    details: ['Pour les enfants de la marche a 4 ans.', 'Inscription prealable uniquement aupres de la garderie.'],
    tags: ['garderie', 'halte garderie', 'enfant', 'bebe', 'kids', 'pitschouns'],
    answer: 'Halte-garderie ouverte du 29/06 au 28/08 : lun, mar, mer, ven 10h-13h et 15h-18h, jeudi 10h-17h. Tel : 06 52 86 33 78.',
  },
  {
    name: 'Wi-Fi',
    category: 'Services',
    times: [
      { label: 'Offert', value: '30 min continues par appareil', day: 'all' },
      { label: 'Premium', value: '2 codes de 3 appareils', day: 'all' },
    ],
    details: ['Tarifs : 1 jour 5 EUR, 3 jours 7,50 EUR, 5 jours 12 EUR, 7 jours 15 EUR, 10 jours 19 EUR, 14 jours 25 EUR, 21 jours 32 EUR, 1 mois 39 EUR, 6 mois 119 EUR.', 'Un code est valable pour 3 appareils.'],
    tags: ['wifi', 'wi-fi', 'internet', 'code', 'connexion'],
    answer: 'Wi-Fi payant avec 30 min continues offertes par appareil. Premium : 2 codes pour 3 appareils chacun, donc 6 appareils inclus.',
  },
  {
    name: 'Espace coworking',
    category: 'Services',
    times: [
      { label: 'Demi-journee', value: '9 EUR', day: 'all' },
      { label: 'Journee', value: '15 EUR', day: 'all' },
      { label: 'Reservation', value: '04 67 01 03 10', day: 'all' },
    ],
    details: ['Open space avec 4 bureaux, salle de reunion equipee, Wi-Fi.', 'Reservation par telephone ou directement a la reception.'],
    tags: ['coworking', 'bureau', 'travail', 'reunion', 'wifi', 'teletravail'],
    answer: 'Coworking : 9 EUR la demi-journee, 15 EUR la journee. Reservation au 04 67 01 03 10 ou a la reception.',
  },
  {
    name: 'Services en option',
    category: 'Services',
    times: [
      { label: 'Draps', value: '18 EUR par lit', day: 'all' },
      { label: 'Serviettes', value: '10 EUR par lot', day: 'all' },
      { label: 'Ventilateur', value: '20 EUR / semaine', day: 'all' },
      { label: 'Parasol', value: '15 EUR / semaine', day: 'all' },
    ],
    details: ['Climatiseur mobile 84 EUR / semaine.', 'Barbecue a gaz 45 EUR / semaine.', 'Plancha 60 EUR / semaine.', 'Coffres-forts en location a la reception.'],
    tags: ['services option', 'draps', 'serviettes', 'ventilateur', 'parasol', 'clim', 'barbecue', 'plancha', 'coffre fort'],
    answer: 'Options : draps 18 EUR/lit, serviettes 10 EUR/lot, ventilateur 20 EUR/semaine, parasol 15 EUR/semaine, clim mobile 84 EUR/semaine.',
  },
  {
    name: 'Barbecue et plancha',
    category: 'Services',
    times: [
      { label: 'Barbecue gaz', value: '45 EUR / semaine', day: 'all' },
      { label: 'Basse saison', value: '12 EUR / jour', day: 'special' },
      { label: 'Plancha', value: '60 EUR / semaine', day: 'all' },
      { label: 'Gaz perdu', value: '8 EUR', day: 'all' },
    ],
    details: ['Barbecues au charbon interdits. Seuls les barbecues a gaz sont autorises.', 'En haute saison, disponible uniquement a la semaine.'],
    tags: ['barbecue', 'bbq', 'plancha', 'gaz', 'charbon'],
    answer: 'Charbon interdit. Barbecue a gaz autorise : 45 EUR/semaine ou 12 EUR/jour en basse saison. Plancha 60 EUR/semaine.',
  },

  {
    name: 'Numéros d’urgence',
    category: 'Sante',
    times: [
      { label: 'SAMU / urgence médicale', value: '15', day: 'all' },
      { label: 'Urgence européenne', value: '112', day: 'all' },
      { label: 'Pompiers', value: '18', day: 'all' },
      { label: 'Police / Gendarmerie', value: '17', day: 'all' },
      { label: 'Urgence par SMS', value: '114', day: 'all' },
    ],
    details: ['En cas de doute médical, appeler le 15 avant de déplacer le client.', 'Le 114 est destiné notamment aux personnes sourdes, malentendantes, aphasiques ou ne pouvant pas parler.'],
    tags: ['urgence', 'samu', 'pompiers', 'police', 'gendarmerie', '112', '15', '17', '18', '114'],
    answer: 'Urgence médicale : 15 ou 112. Pompiers : 18. Police / Gendarmerie : 17. Urgence par SMS : 114.',
  },
  {
    name: 'Médecin le dimanche',
    category: 'Sante',
    times: [
      { label: 'Avant de se déplacer', value: 'Appeler le 15', day: 'all' },
      { label: 'Maison médicale d’Agde - dimanche', value: '8h-minuit', day: 'weekend' },
      { label: 'Maison médicale d’Agde - samedi', value: '12h-minuit', day: 'weekend' },
      { label: 'Maison médicale d’Agde - semaine', value: '20h-minuit', day: 'week' },
    ],
    details: ['Maison médicale de garde située à l’entrée de l’hôpital Saint-Loup, 22 boulevard des Hellènes, 34300 Agde.', 'Accès uniquement après orientation téléphonique par le 15.', 'Les horaires du dimanche s’appliquent également pour la permanence médicale indiquée par le service.'],
    tags: ['medecin', 'dimanche', 'jour ferie', 'garde', 'maison medicale', 'agde', 'saint loup', 'weekend'],
    answer: 'Dimanche : appeler d’abord le 15. La maison médicale de garde d’Agde est ouverte de 8h à minuit, uniquement après orientation du 15.',
  },
  {
    name: 'Urgences de Béziers',
    category: 'Sante',
    times: [
      { label: 'Urgences', value: '24h/24 - 7j/7', day: 'all' },
      { label: 'Standard', value: '04 67 35 70 35', day: 'all' },
      { label: 'Urgences pédiatriques', value: '04 67 35 73 86', day: 'all' },
      { label: 'Urgences gynécologiques', value: '04 67 35 71 96', day: 'all' },
    ],
    details: ['Centre Hospitalier de Béziers, site Montimaran, 2 rue Valentin Haüy, 34500 Béziers.', 'Pour une urgence vitale, appeler le 15 ou le 112 avant tout déplacement.'],
    tags: ['hopital', 'urgences', 'beziers', 'pediatrique', 'gynecologique', '24h'],
    answer: 'Urgences du Centre Hospitalier de Béziers ouvertes 24h/24 et 7j/7. Pour une urgence vitale, appeler le 15 ou le 112.',
  },
  {
    name: 'Hôpital Saint-Loup - Agde',
    category: 'Sante',
    times: [
      { label: 'Standard', value: '04 99 44 20 00', day: 'all' },
      { label: 'Consultations non programmées', value: '8h-20h', day: 'week' },
      { label: 'Dimanche et jours fériés', value: 'Fermé en journée', day: 'weekend' },
    ],
    details: ['Boulevard des Hellènes, 34300 Agde.', 'Le service médicalisé de jour est fermé le dimanche et les jours fériés.', 'Le soir et le week-end, appeler le 15 pour être orienté vers la maison médicale de garde.'],
    tags: ['hopital', 'saint loup', 'agde', 'consultation', 'medecin', 'dimanche'],
    answer: 'Saint-Loup à Agde : consultations non programmées de 8h à 20h, sauf dimanche et jours fériés. Le dimanche, appeler le 15.',
  },
  {
    name: 'Pharmacie de garde',
    category: 'Sante',
    times: [
      { label: 'Dimanche / nuit / jour férié', value: '3237', day: 'all' },
      { label: 'Site', value: '3237.fr', day: 'all' },
      { label: 'Disponibilité', value: '24h/24', day: 'all' },
    ],
    details: ['La pharmacie de garde change selon le jour et le secteur : Vias, Portiragnes, Agde ou Béziers.', 'Appeler le 3237 pour connaître la pharmacie ouverte la plus proche avant d’envoyer le client.', 'La nuit, une ordonnance et une pièce d’identité peuvent être demandées.'],
    tags: ['pharmacie', 'garde', 'dimanche', 'nuit', 'jour ferie', '3237', 'vias', 'portiragnes', 'agde', 'beziers'],
    answer: 'Pour une pharmacie ouverte le dimanche, la nuit ou un jour férié : appeler le 3237 ou consulter 3237.fr.',
  },
  {
    name: 'Maison de santé de Vias',
    category: 'Sante',
    times: [
      { label: 'Adresse', value: '23 boulevard de la Liberté, Vias', day: 'all' },
      { label: 'Dimanche / urgence', value: 'Appeler le 15', day: 'weekend' },
    ],
    details: ['Regroupe des médecins généralistes, infirmiers, dentistes, kinésithérapeutes et autres professionnels de santé.', 'Pour une consultation classique, contacter directement le professionnel concerné.', 'En dehors des horaires des cabinets ou le dimanche, appeler le 15 pour être orienté.'],
    tags: ['maison sante', 'vias', 'medecin', 'dentiste', 'infirmier', 'kine', 'dimanche'],
    answer: 'Maison de santé : 23 boulevard de la Liberté à Vias. Le dimanche ou hors horaires, appeler le 15 pour être orienté.',
  },
  {
    name: 'La Terrasse',
    category: 'Restauration',
    period: '22/06 au 30/08/2026',
    times: [
      { label: 'Petit-dejeuner', value: '8h-10h30', day: 'all' },
      { label: 'Dejeuner', value: '12h-13h30', day: 'all' },
      { label: 'Diner', value: '18h30-21h30', day: 'all' },
    ],
    details: ['Ouvert toute la saison.', 'Pas de demi-pension en juillet et aout 2026.'],
    tags: ['restaurant', 'terrasse', 'petit dejeuner', 'dejeuner', 'diner', 'demi pension'],
    answer: 'La Terrasse : du 22/06 au 30/08, petit-dejeuner 8h-10h30, dejeuner 12h-13h30, diner 18h30-21h30.',
  },
  {
    name: 'Garden Grill',
    category: 'Restauration',
    period: 'Ouverture des le 13/05/2026 - fermeture annuelle le 13/09/2026',
    times: [
      { label: 'A partir du 15/06', value: '12h-13h15 et 18h30-21h', day: 'all' },
      { label: '22/06 au 30/08', value: '12h-13h30 et 18h30-21h30', day: 'all' },
    ],
    details: ['Specialites grillades au feu de bois.', 'Pas de demi-pension en juillet et aout 2026.'],
    tags: ['garden grill', 'restaurant', 'grillades', 'dejeuner', 'diner', 'demi pension'],
    answer: 'Garden Grill : a partir du 15/06, 12h-13h15 et 18h30-21h. Du 22/06 au 30/08 : 12h-13h30 et 18h30-21h30.',
  },
  {
    name: 'La Paillote',
    category: 'Restauration',
    period: 'Ouverture annuelle le 01/05/2026 - fermeture le 13/09/2026',
    times: [
      { label: 'Snacking / bar', value: '9h-23h', day: 'all' },
      { label: 'Restaurant', value: '12h-13h30 et 18h30-21h', day: 'all' },
      { label: '22/06 au 30/08', value: '12h-14h et 18h30-21h30', day: 'all' },
    ],
    details: ['Pas de demi-pension en juillet et aout 2026.', 'Situe entre le terrain de petanque et la piscine Olympe.'],
    tags: ['paillote', 'restaurant', 'bar', 'snack', 'snacking', 'dejeuner', 'diner'],
    answer: 'La Paillote : bar/snacking 9h-23h. Restaurant 12h-13h30 et 18h30-21h, puis 12h-14h et 18h30-21h30 du 22/06 au 30/08.',
  },
  {
    name: "Jack's Burgers",
    category: 'Restauration',
    times: [
      { label: 'Midi', value: '12h-14h30', day: 'all' },
      { label: 'Soir', value: '18h-22h', day: 'all' },
    ],
    details: ['Ouvert tous les jours.', 'Situe sur la placette du Domaine.'],
    tags: ['jack', 'burger', 'burgers', 'snack', 'frites'],
    answer: "Jack's Burgers : ouvert tous les jours, midi 12h-14h30 et soir 18h-22h.",
  },
  {
    name: 'Bambou Traiteur Vietnamien',
    category: 'Restauration',
    times: [
      { label: 'Dejeuner', value: '11h-14h', day: 'all' },
      { label: 'Diner', value: '18h-22h', day: 'all' },
    ],
    details: ['A emporter.', 'Ouvert tous les jours.'],
    tags: ['bambou', 'traiteur', 'vietnamien', 'asiatique', 'a emporter', 'dejeuner', 'diner'],
    answer: 'Bambou traiteur vietnamien : ouvert tous les jours, dejeuner 11h-14h et diner 18h-22h.',
  },
  {
    name: 'La Rotisserie',
    category: 'Restauration',
    times: [{ label: 'Horaires', value: 'Voir sur place', day: 'special' }],
    details: ["Si la rotisserie est fermee, le Jack's prend le relais.", 'Paella, poulets rotis, lasagnes, pizzas a emporter.'],
    tags: ['rotisserie', 'traiteur', 'poulet', 'paella', 'pizza', 'lasagnes', 'jack'],
    answer: "La Rotisserie : horaires variables a voir sur place. Si elle est fermee, le Jack's prend le relais.",
  },
  {
    name: 'La barak a moules',
    category: 'Restauration',
    times: [{ label: 'Statut', value: 'Ferme', day: 'special' }],
    details: ["Merci de vous rendre au Jack's Burger.", 'Food truck specialiste moules/frites.'],
    tags: ['moules', 'barak', 'food truck', 'ferme', 'jack'],
    answer: "La barak a moules est fermee : orienter les clients vers le Jack's Burger.",
  },
  {
    name: 'Ostreiculteurs',
    category: 'Restauration',
    period: '07/07 au 27/08',
    times: [{ label: 'Passage', value: 'Mardi et jeudi', day: 'special' }],
    details: ['Vente huitres, bulots et crevettes.', 'CB non acceptee. Notification quand le producteur est present.'],
    tags: ['huitres', 'ostreiculteur', 'coquillages', 'bulots', 'crevettes', 'producteur'],
    answer: 'Ostreiculteurs : vente les mardis et jeudis du 07/07 au 27/08. CB non acceptee.',
  },
  {
    name: 'Bar Le Havana',
    category: 'Bars',
    times: [{ label: 'Tous les jours', value: '11h-19h', day: 'all' }],
    details: ['Carte du Havana.', 'Vue sur le Lagon et terrasse de la piscine La Cubaine.'],
    tags: ['bar', 'havana', 'cocktail', 'glace', 'lagon', 'cubaine'],
    answer: 'Bar Le Havana : ouvert tous les jours de 11h a 19h.',
  },
  {
    name: 'Bar La Bodega',
    category: 'Bars',
    period: '01/07 au 30/08/2026',
    times: [{ label: 'Tous les jours', value: '15h-23h', day: 'all' }],
    details: ['Salles arcade accessibles aux horaires d ouverture, sauf pendant les soirees clubbing.'],
    tags: ['bar', 'bodega', 'arcade', 'boisson', 'clubbing'],
    answer: 'Bar La Bodega : du 01/07 au 30/08, ouvert tous les jours de 15h a 23h.',
  },
  {
    name: 'Boulangerie',
    category: 'Commerces',
    times: [
      { label: '03/04 au 15/06', value: '7h-12h30 et 17h-19h30', day: 'all' },
      { label: '16/06 au 30/10', value: '7h-13h et 17h-20h', day: 'all' },
    ],
    details: ['Commandes gateaux ou demandes particulieres au comptoir au plus tard la veille avant 10h.', 'Ouvert tous les jours.'],
    tags: ['boulangerie', 'pain', 'viennoiserie', 'gateau', 'entremets', 'patisserie'],
    answer: 'Boulangerie : 7h-12h30 et 17h-19h30 jusqu au 15/06, puis 7h-13h et 17h-20h du 16/06 au 30/10.',
  },
  {
    name: 'Superette SPAR',
    category: 'Commerces',
    times: [
      { label: '02/04 au 17/06', value: '8h-12h30 et 16h30-19h30', day: 'all' },
      { label: '18/06 au 31/08', value: '7h30-20h non-stop', day: 'all' },
      { label: 'Septembre / octobre', value: '8h-12h30 et 16h30-19h30', day: 'all' },
    ],
    details: ['Fruits, legumes, journaux, alimentation, cartes postales, jouets de plage.'],
    tags: ['superette', 'spar', 'courses', 'market', 'journaux', 'alimentation'],
    answer: 'Superette SPAR : 7h30-20h non-stop du 18/06 au 31/08. Hors ete : 8h-12h30 et 16h30-19h30.',
  },
  {
    name: 'Coiffeur',
    category: 'Commerces',
    times: [
      { label: 'Avril, mai, juin, septembre', value: 'Mar et jeu 9h-13h / 13h30-18h', day: 'special' },
      { label: 'Juillet, aout', value: 'Mar, mer, jeu 9h-13h / 13h30-18h', day: 'special' },
      { label: 'Octobre', value: 'Mar et jeu 9h-13h', day: 'special' },
    ],
    details: ['Reservation au 06 76 33 53 50.', 'Email : caro.coiff34@gmail.com.', 'Presence possible autres jours sur demande et selon disponibilites.'],
    tags: ['coiffeur', 'coiffure', 'cheveux', 'rdv', 'reservation', 'caro'],
    answer: 'Coiffeur : juillet-aout mardi, mercredi, jeudi 9h-13h et 13h30-18h. Reservation : 06 76 33 53 50.',
  },
  {
    name: 'Spa',
    category: 'Commerces',
    period: 'Avril a octobre',
    times: [
      { label: 'Avr/mai/juin/sept', value: 'Lun, mar, jeu, ven 10h-18h', day: 'week' },
      { label: 'Avr/mai/juin/sept', value: 'Mer, sam 14h-18h / dim 14h-17h', day: 'weekend' },
      { label: 'Juillet / aout', value: 'Lun-ven 10h-19h, sam 10h-18h, dim ferme', day: 'all' },
      { label: 'Telephone', value: '07 72 13 14 46', day: 'all' },
    ],
    details: ['Octobre : du 29/09 au 16/10 rendez-vous uniquement par telephone ; du 17/10 au 31/10 lundi-vendredi 10h-12h et 14h-17h.', 'Massages adultes et enfants a partir de 3 ans, soins visage/corps, epilations.'],
    tags: ['spa', 'massage', 'bien etre', 'soin', 'epilation', 'onglerie'],
    answer: 'Spa : en ete lun-ven 10h-19h, samedi 10h-18h, dimanche ferme. Telephone : 07 72 13 14 46.',
  },
  {
    name: 'Drago Photo',
    category: 'Commerces',
    times: [{ label: 'Jeudi et vendredi', value: '9h30-13h et 14h-19h', day: 'special' }],
    details: ['Telephone : 09 80 80 92 93.', 'Mail : drago@lephotostoppeur.fr.', 'En cas de non reponse, clients rappeles sous 72h.'],
    tags: ['photo', 'drago photo', 'photographe', 'photos', 'portrait'],
    answer: 'Drago Photo : jeudi et vendredi 9h30-13h et 14h-19h. Tel : 09 80 80 92 93.',
  },
  {
    name: 'Location de velos',
    category: 'Commerces',
    times: [{ label: 'Tous les jours', value: '10h-12h', day: 'all' }],
    details: ['Yellow Bike : locations de rosalies et velos.', 'Draisiennes, velos electriques, tandem, pour 2h, une apres-midi ou plusieurs jours.', 'Exceptionnellement ferme le 22/05/2026.'],
    tags: ['velo', 'velos', 'yellow bike', 'location velo', 'rosalie', 'tandem', 'draisine'],
    answer: 'Location de velos : ouvert tous les jours 10h-12h. Renseignements et reservation directement sur place.',
  },
  {
    name: 'Boutique maillot de bain',
    category: 'Commerces',
    times: [
      { label: '13/06 au 20/09', value: '10h-12h30 et 15h-19h', day: 'all' },
      { label: '21/09 au 16/10', value: 'Ven, sam, dim 10h-12h30 et 15h-19h', day: 'weekend' },
      { label: '17/10 au 01/11', value: '10h-12h30 et 15h-19h', day: 'all' },
    ],
    details: ['Maillots de bain, tongs, pareos, bijoux fantaisie, jouets de plage.', 'Creme solaire en vente.'],
    tags: ['boutique', 'maillot', 'maillots', 'plage', 'creme solaire', 'tongs', 'pareo'],
    answer: 'Boutique maillot de bain : du 13/06 au 20/09 tous les jours 10h-12h30 et 15h-19h.',
  },
  {
    name: 'Candy shop',
    category: 'Commerces',
    period: '07/07 au 29/08/2026',
    times: [{ label: 'Tous les jours', value: '11h-00h', day: 'all' }],
    details: ['Crepes, gaufres, glaces a l italienne, granitas et boissons fraiches.'],
    tags: ['candy', 'bonbon', 'crepe', 'gaufre', 'granita', 'glace', 'sucre'],
    answer: 'Candy shop : ouvert tous les jours du 07/07 au 29/08, de 11h a minuit.',
  },
  {
    name: 'Glacier artisanal',
    category: 'Commerces',
    period: '07/07 au 29/08/2026',
    times: [{ label: 'Tous les jours', value: '12h-23h', day: 'all' }],
    details: ['Ferme les jours d intemperies.', 'Glaces artisanales, granites, milkshakes et crepes.'],
    tags: ['glacier', 'glace', 'ice cream', 'milkshake', 'crepe', 'granite'],
    answer: 'Glacier artisanal : du 07/07 au 29/08, ouvert tous les jours 12h-23h. Ferme les jours d intemperies.',
  },
  {
    name: 'Parc aquatique',
    category: 'Aquatique',
    times: [{ label: 'Regles', value: 'Bracelet obligatoire', day: 'all' }],
    details: ['Shorts de bain interdits. Tout maillot ample interdit.', 'Enfants de moins de 10 ans accompagnes par un adulte.', 'Douche, pediluves et maillots de bain obligatoires.', 'Reservation de bains de soleil interdite.'],
    tags: ['parc aquatique', 'piscine', 'consignes', 'short bain', 'maillot', 'bracelet', 'bains de soleil'],
    answer: 'Parc aquatique : bracelet obligatoire. Shorts de bain et maillots amples interdits. Moins de 10 ans accompagnes par un adulte.',
  },
  {
    name: 'La Tropicale',
    category: 'Aquatique',
    times: [
      { label: '01/06 au 16/10', value: 'Samedi et dimanche 14h-18h', day: 'weekend' },
      { label: '17/10 au 01/11', value: 'Tous les jours 10h-18h', day: 'all' },
    ],
    details: ['Piscine couverte et chauffee.'],
    tags: ['tropicale', 'piscine', 'aquatique', 'couverte', 'chauffee'],
    answer: 'La Tropicale : 01/06-16/10 le week-end 14h-18h, puis 17/10-01/11 tous les jours 10h-18h.',
  },
  {
    name: 'Le Lagon',
    category: 'Aquatique',
    times: [
      { label: '01/06 au 13/09', value: '11h-19h', day: 'all' },
      { label: '14/09 au 31/10', value: '11h-18h', day: 'all' },
    ],
    tags: ['lagon', 'piscine', 'aquatique'],
    answer: 'Le Lagon : du 01/06 au 13/09 ouvert 11h-19h ; du 14/09 au 31/10 ouvert 11h-18h.',
  },
  {
    name: 'La Cubaine',
    category: 'Aquatique',
    times: [{ label: '03/04 au 31/10', value: '10h-19h', day: 'all' }],
    details: ['Piscine chauffee.'],
    tags: ['cubaine', 'piscine', 'chauffee', 'aquatique'],
    answer: 'La Cubaine : piscine chauffee ouverte du 03/04 au 31/10, tous les jours 10h-19h.',
  },
  {
    name: "L'Olympe",
    category: 'Aquatique',
    times: [{ label: '14/05 au 13/09', value: '9h-20h', day: 'all' }],
    details: ['Piscine chauffee.'],
    tags: ['olympe', 'piscine', 'chauffee', 'aquatique'],
    answer: "L'Olympe : piscine chauffee ouverte du 14/05 au 13/09, tous les jours 9h-20h.",
  },
  {
    name: 'Cours de natation',
    category: 'Aquatique',
    times: [
      { label: 'Age', value: '4 ans et plus', day: 'all' },
      { label: 'Seance', value: '30 min', day: 'all' },
      { label: 'Reservation', value: '06 08 56 54 43', day: 'all' },
    ],
    details: ['Renseignements et reservation en direct avec Lea.', 'Aisance aquatique des 3 ans, apprentissage des 4 ans, perfectionnement des 6 ans.', 'Tarif affiche : 30 EUR / 30 minutes.'],
    tags: ['cours natation', 'natation', 'piscine', 'lea', 'maitre nageuse', 'enfant'],
    answer: 'Cours de natation : a partir de 4 ans, seance 30 min. Reservation avec Lea au 06 08 56 54 43.',
  },
  {
    name: 'Padel tennis',
    category: 'Activites',
    times: [{ label: 'Tous les jours', value: '9h-21h', day: 'all' }],
    details: ['Reservation du creneau et paiement en reception : 20 EUR.', 'Materiel a recuperer a la reception.'],
    tags: ['padel', 'paddle', 'tennis', 'raquette', 'sport'],
    answer: 'Padel tennis : tous les jours 9h-21h. Reservation et paiement en reception : 20 EUR. Materiel a recuperer a la reception.',
  },
  {
    name: 'Terrain multisports',
    category: 'Activites',
    times: [{ label: 'Acces libre', value: '9h-21h', day: 'all' }],
    details: ['Reservation et pret de materiel au Point Info.'],
    tags: ['terrain multisports', 'basket', 'foot', 'sport', 'materiel'],
    answer: 'Terrain multisports : acces libre de 9h a 21h. Materiel au Point Info.',
  },
  {
    name: 'Tennis de table',
    category: 'Activites',
    times: [{ label: 'Acces', value: 'Libre', day: 'all' }],
    details: ['Reservation et pret de materiel au Point Info.'],
    tags: ['tennis de table', 'ping pong', 'ping-pong', 'raquette'],
    answer: 'Tennis de table en acces libre. Reservation et pret de materiel au Point Info.',
  },
  {
    name: 'Petanque',
    category: 'Activites',
    times: [{ label: 'Acces', value: 'Libre', day: 'all' }],
    details: ['Pret de materiel au Point Info contre carte d identite en garantie.', 'Les lumieres s eteignent a 01h du matin.'],
    tags: ['petanque', 'boules', 'materiel', 'lumiere'],
    answer: 'Petanque en acces libre. Materiel au Point Info contre carte d identite. Lumieres eteintes a 1h.',
  },
  {
    name: 'Parcours running',
    category: 'Activites',
    times: [{ label: 'Acces', value: 'Libre', day: 'all' }],
    details: ['Boucles modulables dans le camping, distances de 2,5 km a 10 km.'],
    tags: ['running', 'course', 'parcours', 'sport', 'jogging'],
    answer: 'Parcours running en acces libre, avec boucles modulables de 2,5 km a 10 km.',
  },
  {
    name: 'Koolaya Land',
    category: 'Activites',
    times: [{ label: 'Tous les jours', value: '10h-20h', day: 'all' }],
    details: ['Pour les 3 a 14 ans.', 'Sous surveillance des parents, accessible au mini-club, a cote de la scene.'],
    tags: ['koolaya', 'gonflable', 'enfant', 'mini club', 'jeux'],
    answer: 'Koolaya Land : ouvert tous les jours 10h-20h. Pour les 3 a 14 ans sous surveillance des parents.',
  },
  {
    name: 'Club Kids 5-7 ans',
    category: 'Activites',
    times: [{ label: 'Horaires', value: '10h-12h et 15h-17h', day: 'all' }],
    details: ['Les periodes d ouverture varient selon la saison.'],
    tags: ['club kids', 'kids club', 'enfants', '5 ans', '7 ans', 'mini club'],
    answer: 'Club Kids 5-7 ans : horaires 10h-12h et 15h-17h.',
  },
  {
    name: 'Navette plage',
    category: 'Services',
    period: '06/07 au 28/08/2026',
    times: [
      { label: 'Depart camping', value: '10h, 11h, 12h, 14h30, 15h, 15h30, 16h, 17h30', day: 'week' },
      { label: 'Depart plage', value: '11h30, 12h30, 14h45, 15h15, 17h15, 18h15, 18h45, 19h15', day: 'week' },
    ],
    details: ['Navette gratuite du lundi au vendredi entre le camping et la plage de Portiragnes.'],
    tags: ['navette plage', 'plage', 'portiragnes', 'bus', 'transport'],
    answer: 'Navette plage gratuite du lundi au vendredi, du 06/07 au 28/08. Depart camping : 10h, 11h, 12h, 14h30, 15h, 15h30, 16h, 17h30.',
  },
  {
    name: 'Navette gare',
    category: 'Services',
    period: '04/07 au 29/08/2026',
    times: [
      { label: "Depart gare d'Agde", value: '8h45, 9h55, 11h20, 12h30, 14h10, 15h20, 16h55', day: 'weekend' },
      { label: 'Depart camping', value: '8h10, 9h20, 10h45, 11h55, 13h35, 14h45, 16h20', day: 'weekend' },
    ],
    details: ['Navette gratuite tous les samedis entre la gare d Agde et le camping.'],
    tags: ['navette gare', 'gare', 'agde', 'bus', 'transport', 'train'],
    answer: "Navette gare gratuite tous les samedis du 04/07 au 29/08. Depart camping : 8h10, 9h20, 10h45, 11h55, 13h35, 14h45, 16h20.",
  },
  {
    name: 'Minicars',
    category: 'Activites',
    times: [{ label: 'Horaires', value: 'Voir sur place', day: 'special' }],
    details: ['Location de mini 4x4 electriques pour enfants de 1 a 7 ans.', 'Avec trampoline et peche aux canards.', 'Email : minibolide34@gmail.com.'],
    tags: ['minicars', 'mini bolides', 'mini 4x4', 'trampoline', 'peche aux canards', 'enfant'],
    answer: 'Minicars : horaires a voir sur place. Mini 4x4 electriques pour enfants de 1 a 7 ans, avec trampoline et peche aux canards.',
  },
];

const mapZones: MapZone[] = [
  { label: '1-99', from: 1, to: 99, x: 36.8, y: 15.8, width: 13.2, height: 18.5, color: '#d6cf28', hint: 'Sormiou / Lifou', columns: 9 },
  { label: '100-139', from: 100, to: 139, x: 34.6, y: 25.6, width: 12.2, height: 14.6, color: '#6d4c9b', hint: 'zone violette piscine', columns: 7 },
  { label: '140-199', from: 140, to: 199, x: 22.5, y: 16.5, width: 14.6, height: 17.4, color: '#d9396b', hint: 'allee Mont Blanc', columns: 8 },
  { label: '200-365', from: 200, to: 365, x: 18.8, y: 34.5, width: 20.5, height: 18.6, color: '#b23b4f', hint: 'Accra / Esterel', columns: 13 },
  { label: '420-541', from: 420, to: 541, x: 7.5, y: 24.8, width: 24.2, height: 25.5, color: '#e34a4a', hint: 'Reposoir depot', columns: 12 },
  { label: '548-590', from: 548, to: 590, x: 24.6, y: 43.2, width: 13.8, height: 14.8, color: '#1d9aa0', hint: 'allee Coton Indien', columns: 7 },
  { label: '591-599', from: 591, to: 599, x: 24.6, y: 43.2, width: 13.8, height: 14.8, color: '#1d9aa0', hint: 'allee Coton Indien', columns: 3 },
  { label: '600-671', from: 600, to: 671, x: 61.5, y: 20.2, width: 14.8, height: 25.5, color: '#f4d900', hint: 'secteur 600', columns: 8 },
  { label: '700-739', from: 700, to: 739, x: 76.8, y: 35.8, width: 17.0, height: 15.3, color: '#b05aa8', hint: 'Monte Vento', columns: 8 },
  { label: '800-836', from: 800, to: 836, x: 62.5, y: 16.7, width: 9.2, height: 29.0, color: '#2d8cc8', hint: 'grand bloc bleu', columns: 5 },
  { label: '900-908', from: 900, to: 908, x: 80.5, y: 18.6, width: 14.8, height: 8.1, color: '#e1a12b', hint: 'Mousson', columns: 5 },
  { label: '1000-1104', from: 1000, to: 1104, x: 76.0, y: 9.2, width: 21.6, height: 28.0, color: '#cf2234', hint: 'haut et cote droit', columns: 10 },
  { label: '1200-1213', from: 1200, to: 1213, x: 63.9, y: 10.5, width: 8.2, height: 13.8, color: '#4b9bd5', hint: 'haut centre droit', columns: 4 },
  { label: '1300-1304', from: 1300, to: 1304, x: 65.2, y: 7.5, width: 6.2, height: 6.5, color: '#253b7c', hint: 'haut centre droit', columns: 5 },
  { label: '1500-1537', from: 1500, to: 1537, x: 79.0, y: 23.8, width: 16.7, height: 13.8, color: '#8d8b58', hint: 'bloc vert / olive', columns: 8 },
];

const exactPlaces: Record<number, { x: number; y: number }> = {
  571: { x: 25.5, y: 48.9 },
  836: { x: 70.9, y: 14.6 },
  1512: { x: 80.7, y: 31.2 },
};

const categories: Category[] = ['Sante', 'Services', 'Restauration', 'Bars', 'Commerces', 'Aquatique', 'Activites'];

const categoryTone: Record<Category, string> = {
  Restauration: 'food',
  Bars: 'bar',
  Commerces: 'shop',
  Services: 'service',
  Aquatique: 'water',
  Activites: 'activity',
  Sante: 'health',
};

const categoryLabels: Record<Category, string> = {
  Restauration: 'Restaurants',
  Bars: 'Bars',
  Commerces: 'Commerces',
  Services: 'Services',
  Aquatique: 'Piscines',
  Activites: 'Activités',
  Sante: 'Santé & Urgences',
};

const categoryEmoji: Record<Category, string> = {
  Restauration: '🍽️',
  Bars: '🍹',
  Commerces: '🛒',
  Services: '🛎️',
  Aquatique: '🏊',
  Activites: '🎉',
  Sante: '🚨',
};

const scheduleEmoji = (schedule: Schedule) => {
  const text = normalize(`${schedule.name} ${schedule.tags?.join(' ') || ''}`);
  if (text.includes('urgence') || text.includes('samu')) return '🚨';
  if (text.includes('pharmacie')) return '💊';
  if (text.includes('hopital') || text.includes('saint loup')) return '🏥';
  if (text.includes('medecin') || text.includes('maison de sante')) return '🩺';
  if (text.includes('reception')) return '🛎️';
  if (text.includes('piscine') || text.includes('aquatique') || text.includes('lagon')) return '🏊';
  if (text.includes('restaurant') || text.includes('terrasse') || text.includes('grill')) return '🍽️';
  if (text.includes('burger')) return '🍔';
  if (text.includes('boulangerie') || text.includes('pain')) return '🥐';
  if (text.includes('superette') || text.includes('commerce')) return '🛒';
  if (text.includes('bar ' ) || text.includes('havana') || text.includes('bodega')) return '🍹';
  if (text.includes('garderie') || text.includes('enfant')) return '👶';
  if (text.includes('laverie') || text.includes('linge')) return '🧺';
  if (text.includes('wifi') || text.includes('wi-fi')) return '📶';
  if (text.includes('spa') || text.includes('massage')) return '💆';
  if (text.includes('navette') || text.includes('bus')) return '🚌';
  if (text.includes('velo') || text.includes('bike')) return '🚲';
  if (text.includes('padel') || text.includes('tennis')) return '🎾';
  if (text.includes('barbecue') || text.includes('plancha')) return '🔥';
  if (text.includes('animation') || text.includes('club')) return '🎉';
  return categoryEmoji[schedule.category];
};

const quickQuestions = [
  { label: 'Réception', value: 'reception' },
  { label: 'Piscine', value: 'piscine' },
  { label: 'Boulangerie', value: 'boulangerie' },
  { label: 'Supérette', value: 'superette' },
  { label: 'Garderie', value: 'garderie' },
  { label: 'Laverie', value: 'laverie' },
  { label: 'Navette', value: 'navette' },
  { label: 'Wi-Fi', value: 'wifi' },
  { label: 'Spa', value: 'spa' },
  { label: 'Padel', value: 'padel' },
  { label: 'Barbecue', value: 'barbecue' },
  { label: 'Restaurant', value: 'restaurant' },
];

const addOns = [
  ['Animal', '5 EUR/nuit emplacement nu, 8 EUR/nuit locatif, 10 EUR/nuit premium'],
  ["Choix de l'emplacement", '50 EUR/sejour bloque'],
  ['Kit bebe', '4 EUR/nuit, offert sur demande en 4* et Premium'],
  ["Lit fait a l'arrivee", '10 EUR/lit/sejour'],
  ['Location de draps', '18 EUR/lit'],
  ['Serviettes de toilette', '10 EUR/kit/sejour'],
  ['Menage fin de sejour', '89 EUR/sejour, offert en Premium'],
  ['Menage fin de sejour Chalet 10', '150 EUR/sejour'],
  ['Option liberte emplacement', '50 EUR/sejour, moins de 30 nuits'],
  ['Option liberte locatif', '21 EUR/nuit'],
  ['Frigo Table Top 70L', '8 EUR/nuit'],
  ['Vehicule supplementaire', '5 EUR/nuit'],
  ['Visiteurs', '6,50 EUR/jour/visiteur'],
  ['Taxe de sejour + eco participation adulte', '1,75 EUR'],
  ['Eco participation 3-17 ans', '0,60 EUR'],
];

const getTodayKind = (): DayKind => {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? 'weekend' : 'week';
};

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

const getScheduleScore = (schedule: Schedule, needle: string) => {
  if (!needle) return 0;
  const name = normalize(schedule.name);
  const category = normalize(schedule.category);
  const tags = normalize(schedule.tags?.join(' ') || '');
  const answer = normalize(schedule.answer || '');
  const details = normalize(`${schedule.note || ''} ${schedule.details?.join(' ') || ''}`);
  let score = 0;
  if ((needle === 'piscine' || needle === 'piscines') && name.includes('parc aquatique')) score += 1050;
  if (name === needle) score += 1200;
  if (name.includes(needle)) score += 900;
  if (tags.split(/\s+/).includes(needle)) score += 720;
  if (tags.includes(needle)) score += 620;
  if (category.includes(needle)) score += 240;
  if (answer.includes(needle)) score += 120;
  if (details.includes(needle)) score += 60;
  return score;
};

const loadDraftPlacements = (): PlacementMap => {
  try {
    return JSON.parse(localStorage.getItem('drago-draft-placements') || '{}') as PlacementMap;
  } catch {
    return {};
  }
};

function findPlace(query: string, placements: PlacementMap): PlaceResult | null {
  const number = Number(query.replace(/\D/g, ''));
  if (!number) return null;
  const zone = mapZones.find((item) => number >= item.from && number <= item.to);
  if (!zone) return null;

  const exact = placements[number];
  if (exact) return { number, zone, x: exact.x, y: exact.y, exact: true };

  const index = number - zone.from;
  const count = zone.to - zone.from + 1;
  const columns = zone.columns || Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x = zone.x + zone.width * ((col + .5) / columns);
  const y = zone.y + zone.height * ((row + .5) / rows);

  return { number, zone, x, y, exact: false };
}

function infoIcon(label: string, value = '') {
  const text = normalize(`${label} ${value}`);
  if (text.includes('adresse') || text.includes('situe') || text.includes('boulevard') || text.includes('rue ')) return '📍';
  if (text.includes('telephone') || text.includes('tel ') || text.includes('urgence') || text.includes('standard') || /0[1-9](?:[ .-]?\d{2}){4}/.test(value)) return '📞';
  if (text.includes('tarif') || text.includes('eur') || text.includes('prix') || text.includes('journee') || text.includes('semaine')) return '💶';
  if (text.includes('reservation')) return '📅';
  if (text.includes('ferme')) return '⛔';
  if (text.includes('ouvert') || text.includes('horaire') || text.includes('lundi') || text.includes('mardi') || text.includes('mercredi') || text.includes('jeudi') || text.includes('vendredi') || text.includes('samedi') || text.includes('dimanche') || text.includes('tous les jours') || text.includes('week')) return '🕘';
  if (text.includes('adresse') || text.includes('situe') || text.includes('place') || text.includes('terrain') || text.includes('piscine')) return '📍';
  if (text.includes('enfant') || text.includes('age') || text.includes('ans')) return '👨‍👩‍👧';
  if (text.includes('acces') || text.includes('libre')) return '🎟️';
  return '•';
}

function detailIcon(text: string) {
  return infoIcon(text, text) === '•' ? 'ℹ️' : infoIcon(text, text);
}

export default function App() {
  const [tab, setTab] = useState<Tab>('horaires');
  const [query, setQuery] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [category, setCategory] = useState<Category | 'Tous'>('Tous');
  const [onlyToday, setOnlyToday] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [mapZoom, setMapZoom] = useState(1.15);
  const [placementMode, setPlacementMode] = useState(false);
  const [draggingNumber, setDraggingNumber] = useState<number | null>(null);
  const [draftPlacements, setDraftPlacements] = useState<PlacementMap>(loadDraftPlacements);
  const mapStageRef = useRef<HTMLDivElement | null>(null);
  const mapCanvasRef = useRef<HTMLDivElement | null>(null);
  const planImageRef = useRef<HTMLImageElement | null>(null);

  const todayKind = getTodayKind();
  const filteredSchedules = useMemo(() => {
    const needle = normalize(query);
    return schedules
      .map((schedule, index) => ({ schedule, index, score: getScheduleScore(schedule, needle) }))
      .filter(({ schedule, score }) => {
        const matchesCategory = category === 'Tous' || schedule.category === category;
        const haystack = normalize(`${schedule.name} ${schedule.category} ${schedule.note || ''} ${schedule.details?.join(' ') || ''} ${schedule.tags?.join(' ') || ''} ${schedule.answer || ''}`);
        const matchesText = !needle || haystack.includes(needle);
        const matchesDay = !onlyToday || schedule.times.some((time) => time.day === 'all' || time.day === todayKind || time.day === 'special');
        return matchesCategory && matchesText && matchesDay && (!needle || score > 0);
      })
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map(({ schedule }) => schedule);
  }, [category, onlyToday, query, todayKind]);

  const activeSchedule = useMemo(() => {
    const selected = filteredSchedules.find((schedule) => schedule.name === selectedSchedule);
    if (selected) return selected;
    if (query.trim()) return filteredSchedules[0] || null;
    return null;
  }, [filteredSchedules, selectedSchedule, query]);

  const placements = useMemo(() => ({ ...exactPlaces, ...draftPlacements }), [draftPlacements]);
  const activePlace = findPlace(mapSearch, placements);
  const selectedNumber = mapSearch.replace(/\D/g, '');

  useEffect(() => {
    localStorage.setItem('drago-draft-placements', JSON.stringify(draftPlacements));
  }, [draftPlacements]);

  useEffect(() => {
    if (!activePlace || placementMode || !mapStageRef.current || !mapCanvasRef.current || tab !== 'plan') return;
    const stage = mapStageRef.current;
    const canvas = mapCanvasRef.current;
    const handle = window.setTimeout(() => {
      stage.scrollTo({
        left: canvas.offsetWidth * (activePlace.x / 100) - stage.clientWidth / 2,
        behavior: 'smooth',
      });
      const canvasTop = canvas.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: canvasTop + canvas.offsetHeight * (activePlace.y / 100) - window.innerHeight / 2,
        behavior: 'smooth',
      });
    }, 80);
    return () => window.clearTimeout(handle);
  }, [activePlace, mapZoom, placementMode, tab]);

  const updatePlacementFromPoint = (clientX: number, clientY: number, number: number) => {
    if (!planImageRef.current) return;
    const rect = planImageRef.current.getBoundingClientRect();
    const x = Number(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)).toFixed(3));
    const y = Number(Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)).toFixed(3));
    setDraftPlacements((current) => ({ ...current, [number]: { x, y } }));
  };

  const placeCurrentNumber = (event: PointerEvent<HTMLDivElement>) => {
    if (!placementMode || draggingNumber || !selectedNumber) return;
    const number = Number(selectedNumber);
    if (!number) return;
    updatePlacementFromPoint(event.clientX, event.clientY, number);
  };

  const startDraggingPlacement = (event: PointerEvent<HTMLElement>, number: number) => {
    if (!placementMode) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingNumber(number);
    setMapSearch(String(number));
  };

  useEffect(() => {
    if (!placementMode || draggingNumber === null) return;
    const move = (event: globalThis.PointerEvent) => {
      updatePlacementFromPoint(event.clientX, event.clientY, draggingNumber);
    };
    const stop = () => setDraggingNumber(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [draggingNumber, placementMode]);

  useEffect(() => {
    if (activeSchedule && selectedSchedule !== activeSchedule.name) {
      setSelectedSchedule(activeSchedule.name);
    }
  }, [activeSchedule, selectedSchedule]);

  const nudgePlacement = (dx: number, dy: number) => {
    const number = Number(selectedNumber);
    if (!number) return;
    const current = draftPlacements[number] || activePlace;
    if (!current) return;
    setDraftPlacements((items) => ({
      ...items,
      [number]: {
        x: Number(Math.min(100, Math.max(0, current.x + dx)).toFixed(3)),
        y: Number(Math.min(100, Math.max(0, current.y + dy)).toFixed(3)),
      },
    }));
  };

  const exportPlacements = () => {
    const data = JSON.stringify(placements, null, 2);
    void navigator.clipboard?.writeText(data);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'placements-dragonniere.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">M</div>
          <div>
            <h1>Mémo</h1>
          </div>
        </div>
        <nav aria-label="Navigation principale">
          <button className={tab === 'horaires' ? 'active' : ''} onClick={() => setTab('horaires')}>🕘 Infos</button>
          <button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>🗺️ Plan</button>
          <button className={tab === 'tarifs' ? 'active' : ''} onClick={() => setTab('tarifs')}>💶 Tarifs</button>
        </nav>
      </header>

      <main>
        {tab === 'horaires' && (
          <section className="panel schedule-panel categories-only">
            <div className="category-dashboard">
              {categories.map((item) => (
                <button
                  key={item}
                  className={`category-tile ${category === item ? 'active' : ''} ${categoryTone[item]}`}
                  onClick={() => {
                    setCategory(category === item ? 'Tous' : item);
                    setQuery('');
                    setSelectedSchedule('');
                  }}
                >
                  <span className="category-emoji">{categoryEmoji[item]}</span>
                  <strong>{categoryLabels[item]}</strong>
                  <small>{schedules.filter((schedule) => schedule.category === item).length} infos</small>
                </button>
              ))}
            </div>

            {(category !== 'Tous' || query) && !activeSchedule && (
              <div className="visual-results-head">
                <button className="back-visual" onClick={() => { setCategory('Tous'); setQuery(''); setSelectedSchedule(''); }}>← Accueil</button>
                <strong>{query ? `Résultats pour « ${query} »` : `${categoryEmoji[category as Category]} ${categoryLabels[category as Category]}`}</strong>
              </div>
            )}

            {activeSchedule && (
              <>
                <div className="visual-results-head">
                  <button className="back-visual" onClick={() => { setSelectedSchedule(''); setQuery(''); }}>← Retour</button>
                  <strong>{scheduleEmoji(activeSchedule)} {activeSchedule.name}</strong>
                </div>
                <section className={`detail-sheet ${categoryTone[activeSchedule.category]}`}>
                  <header className="detail-hero">
                    <span className="detail-main-emoji">{scheduleEmoji(activeSchedule)}</span>
                    <div>
                      <small>{categoryLabels[activeSchedule.category]}</small>
                      <h3>{activeSchedule.name}</h3>
                      {activeSchedule.period && <span className="period-chip">📅 {activeSchedule.period}</span>}
                    </div>
                  </header>

                  <div className="detail-facts">
                    {activeSchedule.times.map((time) => (
                      <article className="fact-row" key={`${activeSchedule.name}-fact-${time.label}`}>
                        <span className="fact-icon">{infoIcon(time.label, time.value)}</span>
                        <div>
                          <small>{time.label}</small>
                          <strong>{time.value}</strong>
                        </div>
                      </article>
                    ))}
                  </div>

                  {(activeSchedule.answer || activeSchedule.note) && (
                    <div className="detail-summary">
                      <span>💬</span>
                      <p>{activeSchedule.answer || activeSchedule.note}</p>
                    </div>
                  )}

                  {activeSchedule.details && activeSchedule.details.length > 0 && (
                    <section className="detail-extra">
                      <h4>À savoir</h4>
                      <div className="detail-note-list">
                        {activeSchedule.details.map((item) => (
                          <div className="detail-note" key={`${activeSchedule.name}-${item}`}>
                            <span>{detailIcon(item)}</span>
                            <p>{item}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </section>
              </>
            )}

            {(category !== 'Tous' || query) && !activeSchedule && filteredSchedules.length > 0 && (
              <div className="visual-item-grid">
                {filteredSchedules.map((schedule) => (
                  <button
                    className={`visual-item ${categoryTone[schedule.category]}`}
                    key={schedule.name}
                    onClick={() => setSelectedSchedule(schedule.name)}
                  >
                    <span>{scheduleEmoji(schedule)}</span>
                    <strong>{schedule.name}</strong>
                    <small>{schedule.times[0]?.value || 'Voir les infos'}</small>
                  </button>
                ))}
              </div>
            )}

            {(category !== 'Tous' || query) && !activeSchedule && filteredSchedules.length === 0 && (
              <section className="empty-answer">
                <strong>Aucune information trouvée</strong>
                <span>Essaie un mot simple : piscine, pain, bar, garderie, laverie…</span>
              </section>
            )}
          </section>
        )}

        {tab === 'plan' && (
          <section className="map-panel">
            <div className="map-toolbar">
              <label className="map-search">
                <span>Emplacement</span>
                <input
                  value={mapSearch}
                  onChange={(event) => setMapSearch(event.target.value)}
                  inputMode="numeric"
                  placeholder="571, 836, 1512..."
                />
              </label>
              <div className="zoom-controls" aria-label="Zoom du plan">
                <button onClick={() => setMapZoom((value) => Math.max(.85, Number((value - .15).toFixed(2))))}>-</button>
                <strong>{Math.round(mapZoom * 100)}%</strong>
                <button onClick={() => setMapZoom((value) => Math.min(2.2, Number((value + .15).toFixed(2))))}>+</button>
                <button onClick={() => setMapZoom(1.15)}>Reset</button>
              </div>
              <button className={`placement-toggle ${placementMode ? 'active' : ''}`} onClick={() => setPlacementMode((value) => !value)}>
                Placement
              </button>
            </div>

            {placementMode && (
              <div className="placement-bar">
                <strong>Mode placement</strong>
                <span>
                  {activePlace
                    ? `x ${activePlace.x.toFixed(3)} / y ${activePlace.y.toFixed(3)}`
                    : 'Tape un numero, puis clique au centre du logement.'}
                </span>
                <div className="nudge-pad" aria-label="Ajustement fin">
                  <button disabled={!activePlace} onClick={() => nudgePlacement(0, -.06)}>Haut</button>
                  <button disabled={!activePlace} onClick={() => nudgePlacement(-.06, 0)}>Gauche</button>
                  <button disabled={!activePlace} onClick={() => nudgePlacement(.06, 0)}>Droite</button>
                  <button disabled={!activePlace} onClick={() => nudgePlacement(0, .06)}>Bas</button>
                </div>
                <button disabled={!Object.keys(placements).length} onClick={exportPlacements}>Exporter JSON</button>
                <button disabled={!selectedNumber || !draftPlacements[Number(selectedNumber)]} onClick={() => setDraftPlacements((current) => {
                  const next = { ...current };
                  delete next[Number(selectedNumber)];
                  return next;
                })}>Retirer ce point</button>
              </div>
            )}

            <div className={`map-stage ${placementMode ? 'placing' : ''} ${draggingNumber !== null ? 'dragging' : ''}`} ref={mapStageRef}>
              <div className="map-frame">
                <div
                  className="map-canvas"
                  ref={mapCanvasRef}
                  style={{ width: `${1280 * mapZoom}px` }}
                >
                  <img ref={planImageRef} src={planImage} alt="Plan du Domaine de la Dragonniere" />
                  <div className="map-overlay" onPointerDown={placeCurrentNumber}>
                    {placementMode && Object.entries(draftPlacements).map(([number, point]) => (
                      <button
                        className="placement-dot"
                        key={number}
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        onPointerDown={(event) => startDraggingPlacement(event, Number(number))}
                        onClick={(event) => {
                          event.stopPropagation();
                          setMapSearch(number);
                        }}
                      >
                        {number}
                      </button>
                    ))}
                    {activePlace && (
                      <>
                        <div
                          className="zone-ghost"
                          style={{
                            left: `${activePlace.zone.x}%`,
                            top: `${activePlace.zone.y}%`,
                            width: `${activePlace.zone.width}%`,
                            height: `${activePlace.zone.height}%`,
                            borderColor: activePlace.zone.color,
                          }}
                        />
                        {placementMode ? (
                          <div
                            className="precision-target"
                            style={{
                              left: `${activePlace.x}%`,
                              top: `${activePlace.y}%`,
                              color: activePlace.zone.color,
                            }}
                            onPointerDown={(event) => startDraggingPlacement(event, activePlace.number)}
                          >
                            <span>{activePlace.number}</span>
                          </div>
                        ) : (
                          <div
                            className="map-pin"
                            style={{
                              left: `${activePlace.x}%`,
                              top: `${activePlace.y}%`,
                              color: activePlace.zone.color,
                            }}
                          >
                            <span>{activePlace.number}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className={`floating-place ${activePlace || selectedNumber ? 'show' : ''}`}>
                {selectedNumber && activePlace ? (
                  <>
                    <small>{activePlace.exact ? 'Position precise' : 'Position estimee'}</small>
                    <strong>{activePlace.number}</strong>
                    <span>{activePlace.zone.label} - {activePlace.zone.hint}</span>
                  </>
                ) : selectedNumber ? (
                  <>
                    <small>Introuvable</small>
                    <strong>{selectedNumber}</strong>
                    <span>Pas encore dans la base.</span>
                  </>
                ) : (
                  <>
                    <small>Recherche</small>
                    <strong>Plan</strong>
                    <span>Tape un numero pour recentrer.</span>
                  </>
                )}
              </div>
            </div>

          </section>
        )}

        {tab === 'tarifs' && (
          <section className="panel">
            <div className="tariff-head">
              <h2>Tarifs</h2>
            </div>
            <div className="tariff-table">
              {addOns.map(([name, price]) => (
                <div key={name}>
                  <strong>{name}</strong>
                  <span>{price}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
