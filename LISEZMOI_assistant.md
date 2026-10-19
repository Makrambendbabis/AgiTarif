# Assistant LLM de l'Explorateur AgiTarif Data : mise en place sur Netlify

Le fichier `index.html` contient l'assistant (bouton « Assistant » en bas à droite). Il fonctionne déjà seul en **mode local** (recherche dans les fiches, sans modèle). Pour obtenir des réponses rédigées par un modèle, trois options :

## Option recommandée : relais Netlify (la clé ne quitte jamais le serveur)
1. Dans le dépôt Git, ajouter à la racine :
   - `netlify.toml`
   - `netlify/functions/chat.js`
2. Sur Netlify : Site configuration > Environment variables > ajouter `ANTHROPIC_API_KEY` (clé créée sur console.anthropic.com).
   Optionnel : `CHAT_MODEL` (par défaut `claude-sonnet-5-5`), `CHAT_ORIGIN` = `https://agitarif.netlify.app` pour n'accepter que le site.
3. Pousser : Netlify redéploie le site et la fonction. Dans l'assistant, réglage ⚙ « Relais Netlify », adresse `/.netlify/functions/chat` (valeur par défaut).

Le mot de passe de la page limite qui peut utiliser le relais : la fonction n'est appelée que depuis la page déchiffrée. Pour une protection plus stricte, ajouter dans `chat.js` un contrôle d'un jeton envoyé par la page.

## Option 2 : clé saisie par le lecteur
Réglage ⚙ « API Anthropic » ou « API compatible OpenAI », puis saisir la clé. Elle reste dans la mémoire de session de l'onglet (effacée à la fermeture) ; rien n'est écrit dans le fichier ni envoyé ailleurs qu'à l'API choisie. Convient à un usage personnel, pas à un site partagé.

## Option 3 : mode local
Sans modèle : l'assistant renvoie les fiches les plus proches et les définitions du glossaire. Aucun appel réseau.

## Comment l'assistant répond
Pour chaque question : sélection des fiches les plus proches (identifiants cités, mots du libellé, glossaire, page affichée, fiche ouverte), envoi au modèle avec une consigne stricte (répondre uniquement à partir du contexte, citer les identifiants, rappeler ce qui est à confirmer, vocabulaire Covéa). Les identifiants des réponses ouvrent les fiches ; les sources sont listées sous chaque message. Le modèle ne voit que les fiches sélectionnées (14 000 caractères au plus), jamais le fichier entier.

## Coût et limites
Chaque question = un appel API (quelques milliers de jetons). Le relais limite l'historique à 8 messages et la réponse à 700 jetons. Les crédits Netlify du plan gratuit couvrent un usage d'atelier ; surveiller « Functions » dans le tableau de bord.
