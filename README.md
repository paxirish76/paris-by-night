# Paris by Night - Application VAMP

Application de gestion pour votre univers Vampire: la Mascarade se déroulant à Paris.

## 📁 Structure du projet

```
paris-by-night/
├── index.html                    # Page HTML principale
├── package.json                  # Configuration npm
├── vite.config.js               # Configuration Vite
├── src/
│   ├── main.jsx                 # Point d'entrée React
│   ├── App.jsx                  # Composant principal avec navigation
│   ├── App.css                  # Styles de l'app
│   ├── styles/
│   │   └── global.css           # Styles globaux vampiriques
│   ├── components/
│   │   ├── Navigation.jsx       # Menu latéral
│   │   ├── Navigation.css
│   │   ├── Home.jsx             # Page d'accueil
│   │   ├── Home.css
│   │   ├── PersonnagesListe.jsx # Liste des personnages
│   │   ├── PersonnagesListe.css
│   │   ├── PersonnageDetail.jsx # Fiche personnage détaillée
│   │   └── PersonnageDetail.css
│   └── data/
│       └── personnages.json     # Vos données
```

## 🚀 Comment lancer l'application (sur votre ordinateur)

### Étape 1 : Installer Node.js
1. Allez sur https://nodejs.org
2. Téléchargez la version LTS (recommandée)
3. Installez Node.js (suivez l'assistant d'installation)
4. Vérifiez l'installation en ouvrant un terminal et tapant :
   ```bash
   node --version
   npm --version
   ```

### Étape 2 : Préparer le projet
1. Copiez le dossier `paris-by-night` sur votre ordinateur
2. Ouvrez un terminal (CMD sur Windows, Terminal sur Mac/Linux)
3. Naviguez jusqu'au dossier :
   ```bash
   cd chemin/vers/paris-by-night
   ```

### Étape 3 : Installer les dépendances
Dans le terminal, tapez :
```bash
npm install
```
Cette commande va télécharger toutes les bibliothèques nécessaires (React, Vite, etc.)

### Étape 4 : Lancer l'application
```bash
npm run dev
```

L'application va s'ouvrir automatiquement dans votre navigateur à l'adresse :
**http://localhost:3000**

## 🎨 Fonctionnalités actuelles

✅ **Page d'accueil** - Vue d'ensemble du Domaine
✅ **Liste des personnages** - Tous vos vampires groupés par clan
✅ **Fiche personnage** - Détails complets avec design vampirique
✅ **Navigation** - Menu latéral élégant
✅ **Design responsive** - Fonctionne sur PC et tablette

## 🔮 Pages en construction

- **Clans** - Vue détaillée des 8 clans
- **Bourgs** - Carte des 21 territoires
- **Carte interactive** - Intégration de votre carte Leaflet

## 📝 Prochaines étapes

### Pour ajouter les portraits :
1. Placez vos images dans `src/assets/portraits/`
2. Nommez-les selon l'ID du personnage (ex: `alienor.jpg`)
3. Modifiez `PersonnageDetail.jsx` et `PersonnagesListe.jsx` pour charger les images

### Pour ajouter d'autres données :
1. Créez des fichiers JSON dans `src/data/` (ex: `clans.json`, `bourgs.json`)
2. Créez de nouveaux composants dans `src/components/`
3. Ajoutez les routes dans `App.jsx`

## 🌐 Déploiement sur le cloud (plus tard)

Une fois que vous êtes satisfait en local, on pourra :
1. Créer un compte GitHub et y pousser le code
2. Créer un compte Vercel (gratuit)
3. Connecter Vercel à GitHub
4. Déployer en 1 clic !

L'application sera alors accessible depuis n'importe où via une URL type :
`https://paris-by-night.vercel.app`

## 💡 Commandes utiles

```bash
npm run dev      # Lancer en mode développement
npm run build    # Créer une version de production
npm run preview  # Prévisualiser la version de production
```

## ❓ Besoin d'aide ?

Si vous avez des erreurs :
1. Vérifiez que Node.js est bien installé
2. Vérifiez que vous êtes dans le bon dossier
3. Essayez de supprimer `node_modules` et de refaire `npm install`
4. Vérifiez la console du navigateur (F12) pour voir les erreurs

---

**Version actuelle** : 1.0.0 - Prototype
**Dernière mise à jour** : Février 2026
