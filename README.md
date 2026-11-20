# 🍺 Alcoo'Quiz

> Es-tu (encore) frais ? Un petit quiz web qui teste tes réflexes, ta concentration et ta coordination pour deviner, de façon totalement non scientifique, si tu as un peu trop bu.

⚠️ **Ce projet est un jeu, pas un éthylotest.** Il ne mesure pas le taux d'alcool. Si tu as bu, tu ne conduis pas.

---

## Sommaire

- [Aperçu](#aperçu)
- [Lancer le projet](#lancer-le-projet)
- [Les épreuves](#les-épreuves)
- [Calcul du score](#calcul-du-score)
- [Structure du projet](#structure-du-projet)
- [Architecture du code](#architecture-du-code)
- [Ajouter une épreuve](#ajouter-une-épreuve)
- [Déployer sur GitHub Pages](#déployer-sur-github-pages)
- [Compatibilité](#compatibilité)

---

## Aperçu

Le joueur enchaîne **6 mini-épreuves**. Chacune donne une note sur 100. La moyenne de ces notes donne un verdict humoristique :

| Score    | Verdict                          |
|----------|----------------------------------|
| 85 – 100 | 🐪 Sobre comme un chameau        |
| 70 – 84  | 🍷 Légèrement pompette           |
| 50 – 69  | 🥴 Joyeusement éméché            |
| 30 – 49  | 🍻 Rond comme une queue de pelle |
| 0 – 29   | 🛸 En orbite                     |

Fonctionnalités :

- un taux en g/L **fantaisiste**, calculé à partir du score ;
- le détail de chaque épreuve (temps, précision, erreurs) ;
- **la référence à jeun** : on enregistre son score sobre, puis chaque partie suivante est comparée à cette référence ;
- une carte de résultat qui « titube » quand le score passe sous 50 ;
- une interface adaptée au mobile, à la souris et au tactile.

## Lancer le projet

Aucune installation, aucune dépendance : le projet est en HTML, CSS et JavaScript « vanilla ».

**Option 1 :** ouvrir directement `index.html` dans un navigateur.

**Option 2 :** lancer un petit serveur local, par exemple :

```bash
# avec Python
python3 -m http.server 8000

# ou avec Node.js
npx serve .
```

Puis ouvrir <http://localhost:8000>.

> La seule ressource externe est la police **Fredoka** (Google Fonts). Sans connexion, la page utilise la police du système.

## Les épreuves

| # | Épreuve | Ce qu'on fait | Ce qui est mesuré |
|---|---------|---------------|-------------------|
| 1 | ⚡ **Réflexes** | Cliquer dès que la zone passe du rouge au vert (3 essais) | Temps de réaction moyen. Un clic trop tôt compte comme 1000 ms |
| 2 | 🎨 **Couleurs piégées** | Cliquer sur la couleur de l'encre, pas sur le mot écrit (8 mots). Basé sur l'[effet Stroop](https://fr.wikipedia.org/wiki/Effet_Stroop) | Bonnes réponses + rapidité |
| 3 | 🧮 **Calcul mental** | Résoudre 4 calculs générés au hasard | Justesse + rapidité |
| 4 | 🧠 **Mémoire** | Retenir une suite de 5 puis de 7 chiffres et la retaper | Chiffres bien placés |
| 5 | 🎯 **Main stable** | Garder le curseur sur une cible mobile pendant 7 secondes | % du temps passé sur la cible |
| 6 | 👅 **Virelangue** | Recopier un virelangue (copier-coller désactivé) | Précision ([distance de Levenshtein](https://fr.wikipedia.org/wiki/Distance_de_Levenshtein)) + vitesse |

## Calcul du score

Chaque épreuve convertit sa mesure brute en note de 0 à 100 avec la fonction `scale(valeur, meilleur, pire)`. Elle fait une interpolation linéaire : une mesure égale à `meilleur` donne 100, une mesure égale à `pire` donne 0, et le résultat est borné entre ces deux valeurs.

| Épreuve | Formule |
|---------|---------|
| Réflexes | `scale(tempsMoyen, 250 ms, 650 ms)` |
| Couleurs piégées | `70 % × taux de réussite` + `30 % × scale(temps par mot, 0,9 s, 3 s)` |
| Calcul mental | Par calcul juste : `50 + 50 % × scale(temps, 4 s, 15 s)`. Calcul faux : 0 |
| Mémoire | Moyenne des chiffres bien placés sur les 2 séries |
| Main stable | `scale(% sur la cible, 90 %, 30 %)` |
| Virelangue | `85 % × similarité` + `15 % × scale(ms par caractère, 180, 700)` |

**Score final** = moyenne des 6 épreuves.
**Taux fantaisiste** = `(100 − score) / 100 × 2,5` g/L.

Pour rendre le quiz plus facile ou plus dur, il suffit de modifier les seuils passés à `scale()` dans [script.js](script.js).

## Structure du projet

```
.
├── index.html   # Structure de la page : écran d'accueil, épreuves, résultat
├── style.css    # Thème, mise en page, styles des épreuves, animations
├── script.js    # Logique : épreuves, déroulement, score, verdicts
└── README.md    # Cette documentation
```

## Architecture du code

### Les écrans

`index.html` contient trois `<section class="screen">` :

- `#screen-intro` : présentation et engagement à ne pas conduire (le bouton de départ reste désactivé tant que la case n'est pas cochée) ;
- `#screen-test` : titre, consignes et une zone `#stage` dans laquelle chaque épreuve affiche son contenu ;
- `#screen-result` : verdict, jauge, détail et référence à jeun.

La fonction `showScreen(id)` affiche un écran en lui ajoutant la classe `active`.

### Les épreuves

Chaque épreuve est un objet qui respecte le même contrat :

```js
const monEpreuve = {
  title: "🔥 Nom de l'épreuve",
  instructions: "Consignes affichées au joueur.",
  async run(stage) {
    // stage : l'élément <div id="stage"> dans lequel dessiner l'épreuve
    // ...
    return { score: 0-100, detail: "Texte affiché dans le résultat" };
  },
};
```

Toutes les épreuves sont rangées dans le tableau `TESTS`. La fonction `runQuiz()` les exécute l'une après l'autre avec `await`. Avant chaque épreuve, elle affiche ses consignes et attend que le joueur clique sur « C'est parti ! ».

### Les fonctions utilitaires

| Fonction | Rôle |
|----------|------|
| `scale(v, best, worst)` | Convertit une mesure en note de 0 à 100 |
| `levenshtein(a, b)` | Compte les modifications nécessaires pour passer d'un texte à l'autre |
| `askAnswer(container, options)` | Affiche un champ de saisie et renvoie `{ value, time }` |
| `waitForGo(stage)` | Affiche un bouton et attend le clic |
| `sleep(ms)`, `randInt`, `pick`, `clamp` | Petits outils (pause, hasard, bornage) |

### La référence à jeun

Le score de référence est enregistré dans le `localStorage` du navigateur, sous la clé `alcooquiz-baseline`. Les accès sont protégés par des `try/catch` : en navigation privée, ou si le stockage est bloqué, le quiz fonctionne quand même, sans la comparaison.

## Ajouter une épreuve

1. Créer un objet qui respecte le contrat décrit plus haut (`title`, `instructions`, `run`) dans [script.js](script.js).
2. L'ajouter au tableau `TESTS` :
   ```js
   const TESTS = [reflexTest, stroopTest, mathTest, memoryTest, steadyTest, typingTest, monEpreuve];
   ```
3. Si besoin, ajouter ses styles dans [style.css](style.css).
4. Ajouter l'épreuve à la liste de l'écran d'accueil dans [index.html](index.html).

La barre de progression, le score final et le détail des résultats s'adaptent tout seuls au nombre d'épreuves.

## Déployer sur GitHub Pages

1. Pousser le projet sur un dépôt GitHub.
2. Aller dans **Settings → Pages**.
3. Dans **Source**, choisir **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`.
4. Enregistrer. Le site est en ligne au bout d'une minute environ à l'adresse `https://<utilisateur>.github.io/<nom-du-depot>/`.

## Compatibilité

- Navigateurs récents : Chrome, Firefox, Safari, Edge.
- Souris et tactile grâce aux *Pointer Events*. La zone « Main stable » utilise `touch-action: none` pour que la page ne défile pas pendant l'épreuve.
- Les animations sont désactivées si l'utilisateur a activé `prefers-reduced-motion`.

---

🍻 *À consommer avec modération. L'abus d'alcool est dangereux pour la santé.*
