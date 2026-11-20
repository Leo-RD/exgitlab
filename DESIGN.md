# 🎨 Refonte visuelle : thème sombre « glassmorphism »

Ce document décrit uniquement les changements de design apportés sur la branche `feat/Leo`.
Pour la présentation générale du projet, voir le [README](README.md).

## En bref

- Seul `style.css` a été modifié. `index.html` et `script.js` sont inchangés.
- Tous les noms de classes sont conservés. Le JavaScript qui crée des éléments ou change des classes fonctionne donc sans modification.
- L'interface passe d'un fond violet uni à un fond **quasi noir**, avec des **panneaux en verre dépoli** posés sur des halos colorés flous.

## Palette

| Variable | Avant | Après | Rôle |
|---|---|---|---|
| `--bg-1` | `#1a1033` | `#05040b` | Fond principal |
| `--bg-2` | `#2d1b4e` | `#0d0a1c` | Centre du dégradé de fond |
| `--text` | `#f3eefe` | `#ece8f6` | Texte |
| `--muted` | `#b5a8d6` | `#9a93b0` | Texte secondaire |
| `--accent` | `#fbbf24` | `#f5b83d` | Ambre « bière » (un peu adouci) |
| `--accent-dark` | `#d97706` | `#c2700a` | Ambre foncé |
| `--radius` | `18px` | `20px` | Arrondi des cartes |

Nouvelles variables :

| Variable | Rôle |
|---|---|
| `--glass`, `--glass-strong`, `--glass-hover` | Fonds blancs translucides (4,5 %, 8 %, 14 %) |
| `--glass-border` | Bordure fine translucide des panneaux |
| `--glass-highlight` | Reflet lumineux en haut des panneaux |
| `--blur` | `blur(20px) saturate(160%)`, utilisé par `backdrop-filter` |
| `--glow-1/2/3` | Couleurs des halos d'arrière-plan (violet, ambre, bleu canard) |
| `--track` | Couleur opaque du masque de la jauge de résultat |

`--card` et `--card-border` existent toujours et pointent vers `--glass` et `--glass-border`.

## Ce qui change visuellement

### Fond
- Deux halos flous (`body::before` et `body::after`) dérivent lentement en arrière-plan. Le verre a besoin de ces couleurs pour que l'effet de flou soit visible.
- `.app` passe au-dessus des halos (`z-index: 1`).

### Panneaux en verre
- **`.card`** : dégradé blanc translucide, `backdrop-filter`, bordure fine et reflet interne en haut.
- **`.topbar`** : l'en-tête devient une pilule en verre.
- **`.test-list li`**, **`.baseline`**, **`.tongue-twister`** : tuiles en verre avec bordure. Les tuiles de la liste s'éclaircissent au survol.

### Boutons et champs
- **`.btn-primary`** : dégradé ambre, halo coloré et reflet interne.
- **`.btn-secondary`** et boutons du Stroop : verre translucide.
- Contour visible au focus clavier (`:focus-visible`).
- **Champs de saisie** : fond plus sombre et anneau ambre au focus.

### Épreuves
- **Réflexes** : les couleurs d'état (attente, go, trop tôt) deviennent semi-transparentes. L'état « go » gagne un halo vert.
- **Main stable** : l'arène est plus sombre et la cible lumineuse prend la couleur de son état (dedans, dehors).
- **Mémoire** et **score** : les chiffres ambrés ont une légère lueur.

### Résultat
- Les barres du détail par épreuve utilisent un dégradé ambre.
- La jauge garde son dégradé vert → ambre → rouge. Son masque utilise `--track`, une couleur **opaque** : avec une couleur translucide, la partie non remplie de la jauge resterait visible.

## Accessibilité et compatibilité

- `prefers-reduced-motion` coupe aussi l'animation des halos d'arrière-plan.
- Le préfixe `-webkit-backdrop-filter` est ajouté pour Safari.
- Sur un navigateur sans `backdrop-filter`, les cartes et l'en-tête passent sur un fond sombre presque opaque pour rester lisibles (`@supports not`).
- Sur mobile (≤ 520 px), les halos sont plus petits et l'en-tête plus compact.
