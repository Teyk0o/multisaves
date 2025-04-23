// MultiSaves mod for Cookie Clicker (Steam version)
// Uses CCSE: https://raw.githack.com/Teyk0o/better-autoclicker/master/CCSE/main.js

if (typeof CCSE == 'undefined') Game.LoadMod('https://raw.githack.com/Teyk0o/better-autoclicker/master/CCSE/main.js');

var MultiSaves = {};
MultiSaves.name = 'Multiple Saves Manager';
MultiSaves.version = '1.0.0'; // Version initiale avec format sémantique
MultiSaves.GameVersion = '2.048';

// URL du GitHub où est hébergé ton mod
MultiSaves.repoOwner = 'Teyk0o'; // Remplace par ton nom d'utilisateur GitHub
MultiSaves.repoName = 'multisaves'; // Remplace par le nom de ton dépôt

// URL pour vérifier les dernières versions
MultiSaves.apiUrl = "https://api.github.com/repos/" + MultiSaves.repoOwner + "/" + MultiSaves.repoName + "/tags";

// URL du fichier principal
MultiSaves.coreUrl = "https://raw.githack.com/" + MultiSaves.repoOwner + "/" + MultiSaves.repoName + "/master/core.js";

// Pour le suivi des mises à jour
MultiSaves.lastCheck = 0;
MultiSaves.checkInterval = 1000 * 60 * 60; // Vérification toutes les heures
MultiSaves.isFirstLaunch = true;

MultiSaves.launch = function() {
    // Vérification de la version actuelle depuis GitHub
    MultiSaves.getCurrentVersion(() => {
        console.log("MultiSaves: Chargement de la version " + MultiSaves.version);

        // Chargement du fichier core avec cache-busting
        Game.LoadMod(MultiSaves.coreUrl + "?v=" + MultiSaves.version + "&game=" + MultiSaves.GameVersion + "&t=" + Date.now());

        // Configuration des vérifications périodiques de mise à jour
        setInterval(function() {
            MultiSaves.checkForUpdate();
        }, MultiSaves.checkInterval);
    });
};

MultiSaves.getCurrentVersion = function(callback) {
    // Récupération de la dernière version depuis GitHub
    fetch(MultiSaves.apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Impossible d'obtenir la version actuelle: " + response.status);
            }
            return response.json();
        })
        .then(tags => {
            if (tags && tags.length > 0) {
                // Récupération du dernier tag (premier dans la liste) et définition comme version actuelle
                MultiSaves.version = tags[0].name.replace('v', '');
                console.log("MultiSaves: La version actuelle est " + MultiSaves.version);
            }
            if (callback) callback();
        })
        .catch(error => {
            console.error("MultiSaves: Erreur lors de la récupération de la version:", error);
            if (callback) callback();
        });
};

MultiSaves.checkForUpdate = function() {
    // Ignorer la première vérification après l'initialisation puisqu'on vient de récupérer la version
    if (MultiSaves.isFirstLaunch) {
        MultiSaves.isFirstLaunch = false;
        MultiSaves.lastCheck = Date.now();
        return;
    }

    const now = Date.now();

    // Vérifier uniquement si l'intervalle minimum est passé
    if (now - MultiSaves.lastCheck < MultiSaves.checkInterval) return;

    MultiSaves.lastCheck = now;

    // Vérification de l'API GitHub pour le dernier tag
    fetch(MultiSaves.apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Impossible de vérifier les mises à jour: " + response.status);
            }
            return response.json();
        })
        .then(tags => {
            if (tags && tags.length > 0) {
                // Récupération du dernier tag (premier dans la liste)
                const latestTag = tags[0].name.replace('v', '');

                // Comparaison avec la version actuelle
                if (latestTag !== MultiSaves.version) {
                    console.log(`MultiSaves: Nouvelle version disponible (${latestTag})`);
                    MultiSaves.notifyUpdate(latestTag);
                } else {
                    console.log("MultiSaves: Déjà sur la dernière version");
                }
            }
        })
        .catch(error => {
            console.error("MultiSaves: Erreur lors de la vérification des mises à jour:", error);
        });
};

MultiSaves.notifyUpdate = function(newVersion) {
    // Affichage d'une notification à l'utilisateur
    Game.Notify(
        "Mise à jour disponible",
        `La version ${newVersion} du gestionnaire de sauvegardes est disponible. Rafraîchissez le jeu pour mettre à jour (CTRL+R ou CMD+R).`,
        [16, 5],
        10, // Durée plus longue pour que l'utilisateur ait le temps de voir
        true // Notification fixe qui reste jusqu'à ce qu'on clique dessus
    );
};

// Lancement du mod quand CCSE est chargé
if (!MultiSaves.initialized) {
    if (CCSE && CCSE.isLoaded) {
        MultiSaves.launch();
        MultiSaves.initialized = true;
    } else {
        if (!CCSE) var CCSE = {};
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(function() {
            MultiSaves.launch();
            MultiSaves.initialized = true;
        });
    }
}