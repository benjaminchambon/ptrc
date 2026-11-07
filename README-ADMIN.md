# PTRC Admin — POC portable

Cette V1 ajoute un backoffice dédié aux **Actualités** sans coupler l’interface à Netlify.

## URLs

- Site public : `/actualites.html`
- Backoffice : `/admin/`
- API : `/api/auth`, `/api/news`, `/api/media`

## Architecture portable

L’interface `/admin` appelle uniquement l’API HTTP. Le stockage est interchangeable :

- **Netlify** : `server/storage/netlify.mjs` utilise Netlify Blobs.
- **Gandi / local** : `server/storage/file.mjs` écrit dans `PTRC_DATA_DIR` (par défaut `./data`).

Le code métier et l’admin restent les mêmes lors d’une migration.

## Test local / futur Gandi

Node 18+ suffit, sans framework serveur.

```bash
export PTRC_ADMIN_EMAIL="admin@example.com"
export PTRC_ADMIN_PASSWORD="change-me"
export PTRC_SESSION_SECRET="une-longue-valeur-aleatoire"
export PTRC_STORAGE="file"
npm run dev
```

Puis ouvrir : `http://localhost:8888/admin/`.

Pour éviter un mot de passe en clair dans l’environnement, générer un hash :

```bash
npm run hash-password -- "mon-mot-de-passe"
```

Puis utiliser `PTRC_ADMIN_PASSWORD_HASH` à la place de `PTRC_ADMIN_PASSWORD`.

En production Gandi, définir aussi `PTRC_DATA_DIR` vers un dossier persistant et writable, puis lancer :

```bash
PORT=$PORT node server/local-server.mjs
```

## Déploiement Netlify

1. Connecter le repository GitHub au projet Netlify.
2. Netlify détectera `netlify.toml` et les Functions.
3. Ajouter les variables d’environnement :
   - `PTRC_ADMIN_EMAIL`
   - `PTRC_ADMIN_PASSWORD_HASH` (recommandé) ou `PTRC_ADMIN_PASSWORD`
   - `PTRC_SESSION_SECRET`
   - `PTRC_STORAGE=netlify`
   - `PTRC_BLOBS_REGION=eu-central-1` (optionnel, valeur par défaut du projet)
4. Déployer.
5. Ouvrir `/admin/` et publier la première actualité.

Les données Netlify sont stockées dans les stores `ptrc-content` et `ptrc-media`.

## Limites volontaires du POC

- un seul compte admin configuré par variables d’environnement ;
- pas encore de gestion d’utilisateurs dans l’UI ;
- suppression d’une actualité ne supprime pas encore son ancienne image du stockage ;
- taille d’image limitée à 4 Mo ;
- contenu texte simple, sans éditeur riche.

Ces limites permettent de valider le workflow avant d’ajouter comptes, rôles et PostgreSQL.


## IA OpenAI (FAQ + traduction des actualités)

Ajouter dans Netlify → Project configuration → Environment variables :

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-6-luna
```

`OPENAI_MODEL` est optionnel ; `gpt-6-luna` est utilisé par défaut. Après modification des variables, relancer un deploy Netlify.

- `/api/ai/faq` : route publique, question courte, réponse limitée aux informations PTRC intégrées côté serveur.
- `/api/ai/translate` : route protégée par la session admin ; génère les champs anglais à partir des champs français.
- La clé OpenAI reste exclusivement côté serveur et ne doit jamais être ajoutée dans GitHub.
- Pour éviter une consommation inattendue, définir également un budget / usage limit sur le projet API OpenAI.


## Assistant IA flottant

L'assistant FAQ est affiché sur toutes les pages publiques via `script.js`. Il utilise `POST /api/ai/faq` et conserve les derniers échanges uniquement dans la page courante pour comprendre les questions de suivi. La clé OpenAI reste côté serveur dans `OPENAI_API_KEY`.
