# Hors Antenne ! Télé-Marmotte

Un shoot'em up vertical en pixel art, pensé pour le téléphone tenu à la verticale, pour le site de captations **Télé-Marmotte**.

**Jouer : https://telemarmotte.github.io/tele-marmotte-hors-antenne/**

La chaîne pirate Télé-Parasite brouille l'antenne de Télé-Marmotte. La marmotte saute dans son vaisseau pour remettre sa chaîne à l'antenne. Trois missions, présentées comme un programme télé.

## Les trois missions

1. **Le Col** : on décolle de l'antenne du sommet (celle du premier jeu), on survole l'alpage, la forêt, le lac, les rochers et le glacier. Boss : le **relais pirate** sur la crête.
2. **Au-dessus des nuages** : mer de nuages, puis un orage dont les éclairs sont annoncés par une ligne jaune qui clignote, puis le coucher de soleil. Oies en V et martinets, avions et bombardiers pirates. Boss : le **zeppelin pirate**.
3. **En orbite** : on quitte la Terre, on traverse une ceinture d'astéroïdes (cassés, leurs morceaux foncent sur le vaisseau), deux pluies de météores (trop durs pour les croches : on les esquive, ou on les pulvérise au grand sifflet ; un repère rouge annonce chacun), des méduses de l'espace électriques (quand elles brillent, une décharge part en cercle autour d'elles et une boule électrique file vers la marmotte) et la **reine des méduses** (barre de vie, grandes décharges, gerbes de boules, bébés méduses), jusqu'à la Lune. Un météore sur trois vise la marmotte. Boss : **la dameuse lunaire**, qui dame les cratères avec une antenne pirate sur le toit.

## Cinématiques

Petites scènes vues de côté, avec sous-titres ; un toucher les passe.

- **Le Blaireau**, patron de Télé-Parasite (bicorne, cache-œil), interrompt l'émission sur un petit téléviseur au début du jeu, puis juste avant chaque boss.
- Une **ouverture** par mission : le décollage du sommet, la fusée qui crève la mer de nuages face au zeppelin, la Lune vue au télescope la nuit.
- Une **fin** par mission : le relais qui s'écroule, le zeppelin qui se dégonfle (ses pilotes en parachute), puis la finale sur la Lune (la dameuse en panne, le Blaireau qui s'enfuit en capsule, le drapeau de Télé-Marmotte) et le **générique de fin**.
- « Mission suivante » enchaîne avec l'ouverture de la mission d'après ; « Rejouer » repart directement.

## Règles

- Le vaisseau tire tout seul des notes sifflées.
- Les **bêtes** (choucas, aigles, oies, martinets, méduses) ne meurent pas : touchées, elles **s'endorment** et font la sieste.
- Les **machines** de Télé-Parasite explosent en neige de télé. Les **astéroïdes** se cassent.
- Le **grand sifflet** (3 par prise) endort tout l'écran, abîme le reste et efface les tirs.
- Les **bobines** renforcent le tir (quatre niveaux), le **sifflet doré** donne un grand sifflet de plus.
- Chaque boss a des pièces gardes à détruire d'abord ; ensuite son antenne se découvre.
- Le score, c'est l'**audimat**.
- Touché : « Coupez ! », le clap annonce la prise suivante et on reprend au dernier **clap** (point de reprise), avec le même audimat qu'à ce moment-là.
- Une **cassette dorée** est cachée dans chaque mission : il faut endormir tout un groupe de bêtes (un vol de choucas, un grand vol d'oies, un banc de méduses).

Le seul point sensible du vaisseau est la tête de la marmotte, au centre.

## Commandes

| | Téléphone | Clavier |
|---|---|---|
| Piloter | glisser le doigt n'importe où (le vaisseau suit le mouvement) | flèches |
| Grand sifflet | bouton ♪ en bas à droite, ou un deuxième doigt | Espace |
| Passer une cinématique | toucher l'écran | n'importe quelle touche |
| Pause | bouton II | Échap |

## Fichiers

- `index.html` : la page, l'affichage façon caméscope, le menu en programme télé et le clap entre deux prises
- `js/sprites.js` : les personnages en pixel art (une lettre = une couleur)
- `js/terrain.js` : le sol des trois missions, fabriqué par bandes (alpage, nuages, espace et Lune)
- `js/level.js` : le déroulé des trois missions, seconde par seconde
- `js/game.js` : les règles (tirs, ennemis, grand sifflet, éclairs, bombes, objets, prises)
- `js/bosses.js` : les trois boss, leurs attaques et leur dessin
- `js/cine.js` : les cinématiques vues de côté (ouvertures, fins de mission, le Blaireau à la télé)
- `js/render.js` : le dessin (nuages, étoiles, ombres, explosions, éclairs, mire de fin)
- `js/audio.js` : bruitages et musiques, synthétisés (aucun fichier son)
- `js/main.js` : boucle de jeu, commandes au doigt, écrans et records
- `_dev/` : planche de sprites, essais automatiques (`await fetch('_dev/test.js').then(r => r.text()).then(eval)` dans la console de la page) et `human.js`, un pilote « humain » qui compte ses touches mission par mission pour comparer la difficulté

Aucune dépendance, aucun outil de construction : ce sont des fichiers statiques.
