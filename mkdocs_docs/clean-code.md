# Clean Code

Ce projet profite d'une base de code compacte pour garantir des performances et une maintenance aisées. Ce document résume les derniers ajustements réalisés pour supprimer le code mort et rappelle les bonnes pratiques à suivre pour conserver un code "propre".

## Résumé du nettoyage récent

- Suppression du fichier de sauvegarde `DrawingManager.ts.bak` qui dupliquait l'implémentation active du gestionnaire de dessins.
- Retrait des imports et constantes inutilisés (`sqToFR`, `Move`, `highlightCycle`, export récursif) pour éviter les dépendances superflues.
- Harmonisation des exports afin de limiter les boucles circulaires et clarifier l'API publique.

## Principes à respecter

### Supprimer le code mort dès qu'il apparaît

- Retirer les fichiers de sauvegarde, les fonctions et les constantes non référencées dès qu'elles deviennent inutiles.
- Préférer des fonctions utilitaires réellement partagées plutôt que de dupliquer des fragments dans plusieurs modules.

### Garder des imports explicites

- Importer uniquement les symboles nécessaires.
- Utiliser des imports de types (`import type { ... }`) pour éviter un code embarqué inutile lors du bundling.

### Stabiliser l'API publique

- Éviter les ré-exportations circulaires qui compliquent la résolution des modules.
- Centraliser les exports dans `src/index.ts` et vérifier qu'ils reflètent l'API réellement supportée.

### Documenter les intentions

- Ajouter des commentaires courts et ciblés seulement lorsqu'une implémentation est complexe ou liée à un contexte métier.
- Mettre à jour la documentation (comme ce guide) lorsqu'un changement de structure impacte les contributions futures.

## Outils de vérification

- `npm run lint` : détecte les imports inutilisés, incohérences stylistiques et erreurs TypeScript courantes.
- `npm run test` : garantit que la suppression de code ne casse pas le comportement existant.
- `npm run build` : compile la librairie et révèle d'éventuels problèmes de typage non détectés par les tests.

## Check-list avant de committer

1. Vérifier que les fichiers supprimés ne sont pas référencés ailleurs (`rg <nom>` ou `npm run lint`).
2. S'assurer que les exports exposés correspondent aux besoins des consommateurs de la librairie.
3. Mettre à jour les documents pertinents lorsque l'organisation du code évolue.
4. Lancer au minimum `npm run lint` et `npm run test` et corriger toute anomalie détectée.

En suivant ces pratiques, la base de code reste lisible, testable et prête à évoluer sans accumulation de dettes techniques.
