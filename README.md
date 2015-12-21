# lg-apiserver
Small API server using node.js

Un petit serveur http basé sur node.js permettant d'exécuter une API backend basée sur un petit routeur, compatible avec des appels CORS.

## router.js
- Permet d'ajouter des routes avec les verbes get, post, put et delete (ou del), une url avec des paramètres, et une méthode handler
- La méthode handler prend deux paramètres :
  - un dictionnaire de clés (paramètres d'url + clés de recherche + clés de corps)
  - le contexte d'exécution du handler http sous la forme d'un objet avec les propriétés :
    - req: l'objet requête passé au handler par le serveur http
    - headers: les headers de retour déjà préparés par le handler
    - res: l'objet réponse passé au handler par le serveur http
    - url: l'objet url parser par l'utilitaire node.url
- Le résultat de la méthode handler est soit :
  - un objet qui sera sérialisé en json et injecté dans le corps de la réponse
  - true, auquel cas la méthode aura préparée elle même la réponse (par exemple pour retourner un fichier)
- Les routes sont créées "à plat", mais sont évaluées en hiérarchie en fonction des urls déclarées 

## apirunner.js
- Exécute un serveur http node.js natif
- Valide systématiquement le verbe OPTION
- Traite les corps de requettes sous forme de json ou de multipart/form-data
- Construit un dictionnaire de clés issues de l'url et du corps
- Evalue l'url et le verbe HTTP en fonction des routes déclarées dans le routeur
- Retourne :
  - 500 en cas d'erreur de traitement,
  - 404 en cas d'absence de route,
  - 200 et le résultat de la méthode handler de la route
  - 200 et un flux json contenant le header, l'url et les clés reconnues si la route n'a pas de handler (mode de test de la route)

## Demo :
- npm start
- accès à http://127.0.0.1:1337/ et les routes du fichier index.js via un curl ou via la page de test de lg-staticserver
