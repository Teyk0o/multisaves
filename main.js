// MultiSaves mod for Cookie Clicker (Steam version)
// Uses CCSE: https://raw.githack.com/Teyk0o/better-autoclicker/master/CCSE/main.js

if (typeof CCSE == 'undefined') Game.LoadMod('https://raw.githack.com/Teyk0o/better-autoclicker/master/CCSE/main.js');

var MultiSaves = {};
MultiSaves.name = 'Multiple Saves Manager';
MultiSaves.version = '0.0.0';
MultiSaves.GameVersion = '2.048';

// GitHub URL where the mod is hosted
MultiSaves.repoOwner = 'Teyk0o';
MultiSaves.repoName = 'multisaves';

// URL to check for latest versions
MultiSaves.apiUrl = "https://api.github.com/repos/" + MultiSaves.repoOwner + "/" + MultiSaves.repoName + "/tags";

// URL for the main file
MultiSaves.coreUrl = "https://raw.githack.com/" + MultiSaves.repoOwner + "/" + MultiSaves.repoName + "/master/core.js";

// For update tracking
MultiSaves.lastCheck = 0;
MultiSaves.checkInterval = 1000 * 60 * 60; // Check every hour
MultiSaves.isFirstLaunch = true;

MultiSaves.launch = function() {
    // Check current version from GitHub
    MultiSaves.getCurrentVersion(() => {
        console.log("MultiSaves: Loading version " + MultiSaves.version);

        // Load the core file with cache-busting
        Game.LoadMod(MultiSaves.coreUrl + "?v=" + MultiSaves.version + "&game=" + MultiSaves.GameVersion + "&t=" + Date.now());

        // Wait for the script to load (using setTimeout)
        setTimeout(function() {
            if (typeof MultiSaves.init === 'function') {
                MultiSaves.init();
            }
        }, 1000);

        // Set up periodic update checks
        setInterval(function() {
            MultiSaves.checkForUpdate();
        }, MultiSaves.checkInterval);
    });
};

MultiSaves.getCurrentVersion = function(callback) {
    // Get the latest version from GitHub
    fetch(MultiSaves.apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Unable to get current version: " + response.status);
            }
            return response.json();
        })
        .then(tags => {
            if (tags && tags.length > 0) {
                // Get the latest tag (first in the list) and set it as current version
                MultiSaves.version = tags[0].name.replace('v', '');
                console.log("MultiSaves: The current version is " + MultiSaves.version);
            }
            if (callback) callback();
        })
        .catch(error => {
            console.error("MultiSaves: Error retrieving version:", error);
            if (callback) callback();
        });
};

MultiSaves.checkForUpdate = function() {
    // Skip first check after initialization since we just got the version
    if (MultiSaves.isFirstLaunch) {
        MultiSaves.isFirstLaunch = false;
        MultiSaves.lastCheck = Date.now();
        return;
    }

    const now = Date.now();

    // Only check if minimum interval has passed
    if (now - MultiSaves.lastCheck < MultiSaves.checkInterval) return;

    MultiSaves.lastCheck = now;

    // Check GitHub API for latest tag
    fetch(MultiSaves.apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error("Unable to check for updates: " + response.status);
            }
            return response.json();
        })
        .then(tags => {
            if (tags && tags.length > 0) {
                // Get latest tag (first in the list)
                const latestTag = tags[0].name.replace('v', '');

                // Compare with current version
                if (latestTag !== MultiSaves.version) {
                    console.log(`MultiSaves: New version available (${latestTag})`);
                    MultiSaves.notifyUpdate(latestTag);
                } else {
                    console.log("MultiSaves: Already on latest version");
                }
            }
        })
        .catch(error => {
            console.error("MultiSaves: Error checking for updates:", error);
        });
};

MultiSaves.notifyUpdate = function(newVersion) {
    // Show notification to the user
    Game.Notify(
        "Update Available",
        `Version ${newVersion} of the Multiple Saves Manager is available. Refresh the game to update (CTRL+R or CMD+R).`,
        [16, 5],
        10, // Longer duration so user has time to see it
        true // Sticky notification that stays until clicked
    );
};

// Launch the mod when CCSE is loaded
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