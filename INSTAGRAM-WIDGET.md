# Carrousel Instagram PTRC

Le site est prêt pour un feed **Simpleembed** sur la page d’accueil.

## Connexion

1. Créer un compte sur Simpleembed.
2. Connecter le compte Instagram Business/Creator `@paristagrugby`.
3. Autoriser l’accès Instagram demandé par Simpleembed.
4. Créer un feed et choisir le layout **Carousel**.
5. Régler le clic sur un post pour ouvrir le post Instagram.
6. Copier le **Feed ID** affiché dans le snippet d’intégration Simpleembed.
7. Dans `index.html`, trouver :

```html
<section class="section instagram-feed-section" data-instagram-feed-id="rPqEO2L1qTdML5M9EXxo">
```

Et coller l’ID :

```html
<section class="section instagram-feed-section" data-instagram-feed-id="rPqEO2L1qTdML5M9EXxo">
```

8. Commit/push sur GitHub. Netlify redéploiera le site.

Tant que `data-instagram-feed-id` est vide, le site affiche un fallback propre avec un bouton vers `https://www.instagram.com/paristagrugby/`.


Feed actuellement configuré : `rPqEO2L1qTdML5M9EXxo`.
