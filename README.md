# ORDINALS Studio

Atelier génératif Bitcoin indépendant, dérivé de [PLOTR Studio](https://github.com/smldms/PLOTR-Studio), version source `1bda693ede2a5f13f8fa5ee015a4fcbb3fc76826`. Aucun fichier ni commit n’est écrit dans le dépôt PLOTR.

## Lancer

Ouvrir `dist/index.html` dans un navigateur, ou servir le dossier :

```sh
python -m http.server 8080 --directory dist
```

Puis ouvrir http://localhost:8080. Le studio fonctionne hors ligne pour composer, simuler et exporter à partir de Genesis. Les aperçus de blocs réels demandent une passerelle `ord` accessible en HTTP(S) avec CORS autorisé. La passerelle par défaut est `https://ordinals.com` ; sa disponibilité/CORS dépend de l’opérateur.

## Composer

Les six moteurs PLOTR sont conservés : Flow Fields, Cellular, Type Playground, Optical, Superformula, Isogrid. Le mode Affiche conserve les blocs typographiques, positions, réserve, répulsion et émission Flow. Les cinq choix typographiques restent disponibles : monoligne, Archivo Black, Bebas Neue, Roboto et Space Grotesk.

Dans **Bitcoin**, cocher les paramètres variables puis fixer leurs bornes min/max. Les valeurs fixes se règlent dans **Réglages**. Les bornes sont validées contre les limites et pas natifs du moteur. Chaque moteur conserve ses propres règles. Désactiver la seed variable pour figer le hasard tout en faisant évoluer certains paramètres. La phase Bitcoin, activée par défaut, fait évoluer Flow, Type, Optical et Superformula : elle remplace une animation fondée sur le temps par une valeur déterminée par le bloc. Cellular et Isogrid évoluent via la seed. Un export sans aucun mécanisme de variation activé est refusé. Les favoris sont propres à ORDINALS Studio.

Le bloc de démarrage est Genesis, avec ses données réelles embarquées. Charger une hauteur, naviguer avec les flèches ou demander le dernier bloc. Le suivi automatique interroge la passerelle toutes les 30 secondes. La simulation hors ligne ne présente aucune date, transaction ou frais inventés ; elle est signalée et doit être remplacée par un bloc réel/Genesis avant l’export.

Les champs Affiche et Type acceptent :

Des boutons **Bloc / Date / Frais / TX** et un sélecteur complet sont disponibles sous les textes Affiche et Type. L’insertion remplace la sélection ou se fait au curseur ; le texte libre reste modifiable.

| Variable | Valeur |
| --- | --- |
| `{height}`, `{date}`, `{time}` | Hauteur, date et heure UTC |
| `{fees}` ou `{total_fee}` | Frais totaux en satoshis |
| `{fees_btc}` | Frais totaux en BTC (8 décimales) |
| `{average_fee}`, `{median_fee}` | Frais moyens et médians en satoshis |
| `{min_fee}`, `{max_fee}` | Frais minimum et maximum en satoshis |
| `{fee_rate}` ou `{average_fee_rate}` | Taux moyen en sat/vB |
| `{min_fee_rate}`, `{max_fee_rate}` | Taux minimum et maximum en sat/vB |
| `{transactions}` ou `{transaction_count}` | Nombre de transactions |
| `{size}` ou `{total_size}` | Taille du bloc en octets |
| `{weight}` ou `{total_weight}` | Poids du bloc en unités de poids (WU) |
| `{max_tx_size}` | Taille de la plus grande transaction en octets |
| `{subsidy}`, `{subsidy_btc}` | Subvention du bloc, hors frais, en satoshis ou BTC |
| `{difficulty}`, `{nonce}`, `{version}`, `{bits}` | Données de minage et d’en-tête |
| `{timestamp}`, `{median_time}` | Timestamp et temps médian Unix |
| `{hash}`, `{hash_short}` | Hash complet ou ses 12 derniers caractères |
| `{previous_block}`, `{merkle_root}` | Hash précédent et racine de Merkle |

Les confirmations et le bloc suivant sont volontairement exclus : ces valeurs changent avec le temps pour un même bloc, ce qui casserait la reproductibilité.

Une donnée optionnelle absente est affichée `N/A`, jamais remplacée par zéro. Les longs textes (notamment le hash) peuvent être coupés aux marges : adapter le corps et la largeur comme dans PLOTR.

## Export HTML uniquement

**Exporter HTML** télécharge une seule œuvre `.html`. Le fichier contient la configuration, les moteurs, le compositeur, les contours vectoriels des familles utilisées et leurs licences OFL. Il n’utilise aucun CDN, police distante, API tierce, fichier du studio ni ressource à héberger séparément. La taille est indiquée après téléchargement ; plusieurs polices augmentent le poids.

Le fichier affiche immédiatement le bloc réel exporté puis consulte les endpoints récursifs :

- `/r/blockheight` : hauteur du bloc courant ;
- `/r/blockinfo/<hauteur>` : hash, date, transactions et frais du bloc.

Il actualise le dessin toutes les 30 secondes si le hash change, y compris après une réorganisation à hauteur identique. En cas de panne, il conserve le dernier rendu et affiche un état discret. Sur `ordinals.com` ou une URL de contenu d’inscription, il utilise d’abord la même origine. Ouvert comme fichier local ou sur un hébergement web classique, il appelle explicitement `https://ordinals.com/r/blockheight` et `https://ordinals.com/r/blockinfo/<hauteur>`, comme Aura, Fees Territory et Acid Bitcoin. Une passerelle de contenu qui échoue est suivie d’une tentative sur `https://ordinals.com`. Il se synchronise dès l’ouverture, toutes les 30 secondes, au retour de la connexion et au retour sur l’onglet. Le studio peut être fermé : le suivi est entièrement embarqué dans l’œuvre. Le fichier est destiné à une inscription de type `text/html;charset=utf-8` ; l’application ne réalise aucune transaction d’inscription.

Le hasard dépend de la seed d’artiste et du hash, avec un tirage distinct par paramètre. L’ordre des règles, l’heure locale, les confirmations et le nombre de rafraîchissements ne changent pas le dessin. Même configuration + même hash/données immuables = mêmes coordonnées vectorielles. La rastérisation peut varier légèrement selon le navigateur.

## Sources examinées et choix

- [Ordinal Public Goods](https://github.com/jokie88/ordinalpublicgoods) : catalogue de Three.js, p5.js, décompression, seedrandom et polices inscrites. Le catalogue précise que ces ressources ne sont pas auditées.
- [Documentation officielle de la récursion ord](https://github.com/ordinals/ord/blob/master/docs/src/inscriptions/recursion.md) : endpoints stables, hash, timestamp, transactions et frais.

Les moteurs de PLOTR sont du JavaScript/SVG natif ; importer p5/Three.js ou un chargeur compressé n’est donc pas nécessaire. L’intégration directe du code et des contours conserve précisément les moteurs et typographies existants tout en évitant une dépendance à des inscriptions tierces.

## Développement et vérifications

```sh
python scripts/build-export.py
node tests/geometry.cjs
# Tests navigateur (installer Playwright et son navigateur au préalable)
node tests/ordinals.cjs
```

Après toute modification de `core.js`, `bitcoin.js`, `typography.js`, `poster.js` ou `geometry-engines.js`, régénérer `export-sources.js`. Ce paquet est utilisé pour embarquer exactement le même moteur dans l’export. `font-data.js` provient de PLOTR et conserve les contours locaux ; `scripts/build-font-outlines.py` permet leur régénération depuis les TTF et licences conservés dans `dist/fonts`.

Les tests géométriques couvrent les six moteurs, marges, déterminisme, effets Affiche, cubes multi-échelles et formats. Les tests navigateur comparent les tracés de l’export et de l’aperçu, les substitutions de texte, les bornes, les changements de bloc, les réorganisations et les erreurs réseau. Les tests simulent les nouveaux blocs, les réorganisations, les erreurs et les contextes fichier local / site classique / serveur Ordinals. `ORDINALS_LIVE_TEST=1 node tests/runtime.cjs` ajoute une vérification avec les réponses réelles d’ordinals.com via curl. Une inscription réelle doit aussi être prévisualisée sur le serveur ord cible avant envoi.

Références créatives conservées de PLOTR : [SuperformulaSVG de Jason Webb](https://github.com/jasonwebb/SuperformulaSVG) et [isogrid de Frederik Vanhoutte / wblut](https://github.com/wblut/isogrid). Les moteurs sont des implémentations JavaScript originales de PLOTR, pas des copies de ces bibliothèques Processing. Les polices restent distribuées avec leurs notices SIL OFL.

Pour les tests d’intégration sans navigateur graphique : `npm install`, puis `npm test`. `tests/runtime.cjs` exécute l’interface et les HTML autonomes dans jsdom, y compris les réponses réseau simulées. Pour le contrôle Chromium : `npx playwright install chromium`, puis `npm run test:browser`.

### Couleur et composition globale

Dans **Tracé**, huit atmosphères associent un fond, une encre et un accent : Cobalt, Acid, Argile, Glacier, Prune, Pin, Ultraviolet et Carbone. Trois répartitions sont disponibles : monochrome, accents parcimonieux et zones diagonales. Les trois couleurs sont modifiables. Choisir une atmosphère harmonise aussi les textes de l’affiche ; leurs couleurs restent ajustables individuellement.

**Tout réinventer** renouvelle le moteur, ses paramètres, le format, les marges, le poids du trait, les couleurs, la typographie, la mise en page et les variations Bitcoin bornées. Le hasard est cadré pour éviter les réglages extrêmes. La seed verrouillée reste respectée. **Annuler** remonte les 12 dernières compositions de la session ; **Varier le moteur** conserve son comportement ciblé. Enregistrez les résultats à garder dans les favoris.

Couleurs et règles sont embarquées dans le HTML autonome. Le bloc fait évoluer la composition retenue ; il ne déclenche pas le bouton de composition globale. Une configuration et un bloc identiques conservent un rendu identique.
