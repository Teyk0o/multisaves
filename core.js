/**
 * Multiple Saves Manager - A mod for Cookie Clicker
 * © 2025 Teyk0o
 *
 * This work is licensed under CC BY-NC-SA 4.0
 * https://creativecommons.org/licenses/by-nc-sa/4.0/
 */

if(MultiSaves === undefined) var MultiSaves = {};
if(typeof CCSE == 'undefined') Game.LoadMod('https://raw.githack.com/Teyk0o/multisaves/master/CCSE/main.js');

// Main initialization function
MultiSaves.init = function() {
    MultiSaves.isLoaded = 1;
    MultiSaves.Backup = {};
    MultiSaves.autoSaveInterval = null;

    console.log("MultiSaves: Loaded");

    // Utility functions
    MultiSaves.getSavedGames = function() {
        const saves = localStorage.getItem('ccMultiSaves');
        return saves ? JSON.parse(saves) : {};
    };

    MultiSaves.generateUniqueId = function() {
        return 'save_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    };

    MultiSaves.getCurrentSaveId = function() {
        return localStorage.getItem('ccMultiSaves_currentId');
    };

    MultiSaves.setCurrentSaveId = function(id) {
        localStorage.setItem('ccMultiSaves_currentId', id);
    };

    // Function to format numbers if Beautify isn't available
    MultiSaves.formatNumber = function(num) {
        if (num >= 1000000000000) {
            return (num / 1000000000000).toFixed(3) + ' trillion';
        } else if (num >= 1000000000) {
            return (num / 1000000000).toFixed(3) + ' billion';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(3) + ' million';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(3) + ' thousand';
        } else {
            return num.toFixed(0);
        }
    };

    // Auto-save function
    MultiSaves.setupAutoSave = function() {
        // Clear any existing interval
        if (MultiSaves.autoSaveInterval) {
            clearInterval(MultiSaves.autoSaveInterval);
        }

        // Set up auto-save every 60 seconds
        MultiSaves.autoSaveInterval = setInterval(function() {
            const currentSaveId = MultiSaves.getCurrentSaveId();
            if (currentSaveId) {
                // Get current save data
                const saveData = Game.WriteSave(1);

                // Update in local storage
                const saves = MultiSaves.getSavedGames();
                if (saves[currentSaveId]) {
                    // Update save data
                    saves[currentSaveId].data = saveData;
                    saves[currentSaveId].timestamp = Date.now();

                    // Important: update displayed information
                    saves[currentSaveId].cookies = Game.cookies;
                    saves[currentSaveId].cookiesPs = Game.cookiesPs;

                    localStorage.setItem('ccMultiSaves', JSON.stringify(saves));
                    console.log("MultiSaves: Auto-saved current game");

                    // If the options menu is open, force an update
                    if (Game.onMenu === 'prefs') {
                        Game.UpdateMenu();
                    }

                    Game.Notify('Auto-save', 'Game auto-saved successfully.', [16, 5], 1);
                }
            }
        }, 60000); // 60 seconds
    };

    // Function to create a custom prompt dialog (alternative to prompt)
    MultiSaves.createCustomPrompt = function(title, defaultValue, callback) {
        // Create dark overlay
        var overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.zIndex = '1000000';
        overlay.id = 'multiSavesPromptOverlay';

        // Create dialog box
        var promptBox = document.createElement('div');
        promptBox.style.position = 'fixed';
        promptBox.style.top = '50%';
        promptBox.style.left = '50%';
        promptBox.style.transform = 'translate(-50%, -50%)';
        promptBox.style.backgroundColor = '#1a1a1a';
        promptBox.style.border = '2px solid #c6a44c';
        promptBox.style.borderRadius = '8px';
        promptBox.style.padding = '20px';
        promptBox.style.width = '350px';
        promptBox.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        promptBox.style.zIndex = '1000001';

        // Title
        var titleElement = document.createElement('div');
        titleElement.style.fontSize = '1.3em';
        titleElement.style.fontFamily = 'Kavoon, Georgia, serif';
        titleElement.style.color = '#fff';
        titleElement.style.marginBottom = '15px';
        titleElement.style.textAlign = 'center';
        titleElement.textContent = title;
        promptBox.appendChild(titleElement);

        // Text field
        var input = document.createElement('input');
        input.type = 'text';
        input.value = defaultValue || '';
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.boxSizing = 'border-box';
        input.style.marginBottom = '15px';
        input.style.backgroundColor = '#000';
        input.style.color = '#fff';
        input.style.border = '1px solid #444';
        input.style.borderRadius = '4px';
        promptBox.appendChild(input);

        // Buttons
        var buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';

        var confirmButton = document.createElement('a');
        confirmButton.className = 'option smallFancyButton';
        confirmButton.textContent = 'OK';
        confirmButton.style.minWidth = '80px';
        confirmButton.style.textAlign = 'center';

        var cancelButton = document.createElement('a');
        cancelButton.className = 'option smallFancyButton';
        cancelButton.textContent = 'Cancel';
        cancelButton.style.minWidth = '80px';
        cancelButton.style.textAlign = 'center';

        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        promptBox.appendChild(buttonContainer);

        // Events
        confirmButton.onclick = function() {
            var value = input.value.trim();
            if (value) {
                document.body.removeChild(overlay);
                PlaySound('snd/tick.mp3');
                callback(value);
            }
        };

        cancelButton.onclick = function() {
            document.body.removeChild(overlay);
            PlaySound('snd/tick.mp3');
            callback(null);
        };

        // Support for Enter key
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                confirmButton.click();
            }
        });

        // Add to DOM
        overlay.appendChild(promptBox);
        document.body.appendChild(overlay);

        // Focus on input
        setTimeout(function() {
            input.focus();
        }, 10);
    };

    // Function to create a confirmation dialog (alternative to confirm)
    MultiSaves.createCustomConfirm = function(message, callback) {
        // Create dark overlay
        var overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.zIndex = '1000000';
        overlay.id = 'multiSavesConfirmOverlay';

        // Create dialog box
        var confirmBox = document.createElement('div');
        confirmBox.style.position = 'fixed';
        confirmBox.style.top = '50%';
        confirmBox.style.left = '50%';
        confirmBox.style.transform = 'translate(-50%, -50%)';
        confirmBox.style.backgroundColor = '#1a1a1a';
        confirmBox.style.border = '2px solid #c6a44c';
        confirmBox.style.borderRadius = '8px';
        confirmBox.style.padding = '20px';
        confirmBox.style.width = '350px';
        confirmBox.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        confirmBox.style.zIndex = '1000001';

        // Message
        var messageElement = document.createElement('div');
        messageElement.style.fontSize = '1.1em';
        messageElement.style.color = '#fff';
        messageElement.style.marginBottom = '20px';
        messageElement.style.textAlign = 'center';
        messageElement.innerHTML = message;
        confirmBox.appendChild(messageElement);

        // Buttons
        var buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';

        var confirmButton = document.createElement('a');
        confirmButton.className = 'option smallFancyButton';
        confirmButton.textContent = 'Yes';
        confirmButton.style.minWidth = '80px';
        confirmButton.style.textAlign = 'center';

        var cancelButton = document.createElement('a');
        cancelButton.className = 'option smallFancyButton';
        cancelButton.textContent = 'No';
        cancelButton.style.minWidth = '80px';
        cancelButton.style.textAlign = 'center';

        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        confirmBox.appendChild(buttonContainer);

        // Events
        confirmButton.onclick = function() {
            document.body.removeChild(overlay);
            PlaySound('snd/tick.mp3');
            callback(true);
        };

        cancelButton.onclick = function() {
            document.body.removeChild(overlay);
            PlaySound('snd/tick.mp3');
            callback(false);
        };

        // Add to DOM
        overlay.appendChild(confirmBox);
        document.body.appendChild(overlay);
    };

    // Main functions modified to use custom dialogs
    MultiSaves.createNewSave = function() {
        MultiSaves.createCustomPrompt('Enter a name for this save:', '', function(saveName) {
            if (!saveName) return;

            // Generate a unique ID
            const saveId = MultiSaves.generateUniqueId();

            // Get current save data
            const saveData = Game.WriteSave(1);

            // Save in local storage
            const saves = MultiSaves.getSavedGames();
            saves[saveId] = {
                name: saveName,
                data: saveData,
                timestamp: Date.now(),
                cookies: Game.cookies,
                cookiesPs: Game.cookiesPs
            };
            localStorage.setItem('ccMultiSaves', JSON.stringify(saves));

            // Set this save as the current one
            MultiSaves.setCurrentSaveId(saveId);

            // Notification and update
            Game.Notify('Save created', `The save "${saveName}" has been created successfully.`, [16, 5]);
            Game.UpdateMenu();

            // Start auto-save
            MultiSaves.setupAutoSave();
        });
    };

    MultiSaves.updateCurrentSave = function() {
        const currentSaveId = MultiSaves.getCurrentSaveId();

        if (!currentSaveId) {
            Game.Notify('Error', 'No active save.', [16, 5], 4);
            return;
        }

        // Get current save data
        const saveData = Game.WriteSave(1);

        // Update in local storage
        const saves = MultiSaves.getSavedGames();
        if (!saves[currentSaveId]) {
            Game.Notify('Error', 'Active save not found.', [16, 5], 4);
            return;
        }

        saves[currentSaveId].data = saveData;
        saves[currentSaveId].timestamp = Date.now();
        saves[currentSaveId].cookies = Game.cookies;
        saves[currentSaveId].cookiesPs = Game.cookiesPs;
        localStorage.setItem('ccMultiSaves', JSON.stringify(saves));

        Game.Notify('Save updated', `The save "${saves[currentSaveId].name}" has been updated.`, [16, 5]);
        Game.UpdateMenu();
    };

    MultiSaves.loadSave = function(saveId) {
        const saves = MultiSaves.getSavedGames();

        if (!saves[saveId]) {
            Game.Notify('Error', 'Save not found.', [16, 5], 4);
            return;
        }

        // Save current state before loading the new save
        const currentSaveId = MultiSaves.getCurrentSaveId();
        if (currentSaveId && currentSaveId !== saveId) {
            const currentSaveData = Game.WriteSave(1);
            saves[currentSaveId].data = currentSaveData;
            saves[currentSaveId].timestamp = Date.now();
            saves[currentSaveId].cookies = Game.cookies;
            saves[currentSaveId].cookiesPs = Game.cookiesPs;
            localStorage.setItem('ccMultiSaves', JSON.stringify(saves));
        }

        // Load the new save
        Game.LoadSave(saves[saveId].data);

        // Set this save as the current one
        MultiSaves.setCurrentSaveId(saveId);

        Game.Notify('Save loaded', `The save "${saves[saveId].name}" has been loaded.`, [16, 5]);
        Game.UpdateMenu();

        // Start auto-save
        MultiSaves.setupAutoSave();
    };

    MultiSaves.renameSave = function(saveId) {
        const saves = MultiSaves.getSavedGames();

        if (!saves[saveId]) {
            Game.Notify('Error', 'Save not found.', [16, 5], 4);
            return;
        }

        MultiSaves.createCustomPrompt('New name for this save:', saves[saveId].name, function(newName) {
            if (!newName) return;

            saves[saveId].name = newName;
            localStorage.setItem('ccMultiSaves', JSON.stringify(saves));

            Game.Notify('Save renamed', `The save has been renamed to "${newName}".`, [16, 5]);
            Game.UpdateMenu();
        });
    };

    MultiSaves.deleteSave = function(saveId) {
        const saves = MultiSaves.getSavedGames();

        if (!saves[saveId]) {
            Game.Notify('Error', 'Save not found.', [16, 5], 4);
            return;
        }

        const saveName = saves[saveId].name;

        MultiSaves.createCustomConfirm(`Are you sure you want to delete the save "${saveName}"?`, function(confirmed) {
            if (!confirmed) return;

            // Delete the save
            delete saves[saveId];
            localStorage.setItem('ccMultiSaves', JSON.stringify(saves));

            // If it was the current save, remove the reference
            if (MultiSaves.getCurrentSaveId() === saveId) {
                localStorage.removeItem('ccMultiSaves_currentId');

                // Stop auto-save
                if (MultiSaves.autoSaveInterval) {
                    clearInterval(MultiSaves.autoSaveInterval);
                    MultiSaves.autoSaveInterval = null;
                }
            }

            Game.Notify('Save deleted', `The save "${saveName}" has been deleted.`, [16, 5]);
            Game.UpdateMenu();
        });
    };

    // Inject our interface into the options menu
    MultiSaves.injectGameOptions = function() {
        console.log("MultiSaves: Injecting into game options");

        // Make sure Game.customOptionsMenu exists
        if (!Game.customOptionsMenu) Game.customOptionsMenu = [];

        Game.customOptionsMenu.push(function() {

            console.log("MultiSaves: Adding custom options menu");

            // Find the section containing the Wipe save button
            let wipeButtonSection = null;
            let sections = l('menu').querySelectorAll('.listing');

            for (let i = 0; i < sections.length; i++) {
                if (sections[i].innerHTML.includes('Wipe save')) {
                    wipeButtonSection = sections[i];
                    break;
                }
            }

            if (!wipeButtonSection) {
                console.error("MultiSaves: Could not find Wipe save button");
                return;
            }

            // Check if our section already exists
            if (document.getElementById('multiSavesManager')) {
                console.log("MultiSaves: Menu already exists");
                return;
            }

            // Create our section
            var saveManagerBox = document.createElement('div');
            saveManagerBox.id = 'multiSavesManager';
            saveManagerBox.className = 'subsection';
            saveManagerBox.style.marginTop = '15px';

            // Version info
            var versionInfo = document.createElement('div');
            versionInfo.style.fontSize = '12px';
            versionInfo.style.color = '#999';
            versionInfo.style.textAlign = 'right';
            versionInfo.style.marginBottom = '8px';
            versionInfo.textContent = 'v' + MultiSaves.version;
            saveManagerBox.appendChild(versionInfo);

            // Explanation text and buttons container
            var containerDiv = document.createElement('div');
            containerDiv.style.display = 'flex';
            containerDiv.style.alignItems = 'center';
            containerDiv.style.marginBottom = '12px';

            // Buttons container
            var buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'listing';
            buttonsDiv.style.textAlign = 'left';

            var newSaveButton = document.createElement('a');
            newSaveButton.className = 'option smallFancyButton';
            newSaveButton.textContent = 'New Save';
            newSaveButton.onclick = function() {
                MultiSaves.createNewSave();
                PlaySound('snd/tick.mp3');
            };
            buttonsDiv.appendChild(newSaveButton);

            var updateButton = document.createElement('a');
            updateButton.className = 'option smallFancyButton';
            updateButton.textContent = 'Update';
            updateButton.onclick = function() {
                MultiSaves.updateCurrentSave();
                PlaySound('snd/tick.mp3');
            };

            buttonsDiv.appendChild(updateButton);

            // Explanation text
            var explanationDiv = document.createElement('label');
            explanationDiv.style.fontSize = '11px';
            explanationDiv.style.color = 'rgba(255,255,255,0.5)';
            explanationDiv.style.borderBottom = '1px dashed rgba(255,255,255,0.25)';
            explanationDiv.style.padding = '2px 8px';
            explanationDiv.innerText = 'This mod allows you to create multiple game saves. You can have different saves for different playthroughs or strategies.';
            buttonsDiv.appendChild(explanationDiv);

            containerDiv.appendChild(buttonsDiv);

            saveManagerBox.appendChild(containerDiv);

            // Subtitle for available saves
            var savesTitle = document.createElement('div');
            savesTitle.className = 'title';
            savesTitle.textContent = 'Available Saves';
            savesTitle.innerHTML += '<span style="font-size: 10px; color: rgba(255,255,255,0.5);"> - The active save will be automatically updated every 60 seconds.</span>';
            saveManagerBox.appendChild(savesTitle);

            // List of saves
            var saves = MultiSaves.getSavedGames();
            var currentSaveId = MultiSaves.getCurrentSaveId();
            var saveIds = Object.keys(saves);

            if (saveIds.length === 0) {
                var noSavesDiv = document.createElement('div');
                noSavesDiv.className = 'listing';
                noSavesDiv.textContent = 'No saves found.';
                saveManagerBox.appendChild(noSavesDiv);
            } else {
                for (var i = 0; i < saveIds.length; i++) {
                    var id = saveIds[i];
                    var save = saves[id];

                    // Format date
                    var date = new Date(save.timestamp);
                    var formattedDate = date.toLocaleString();

                    // Extract save information - using stored values when available
                    var cookies = "Unknown";
                    var cps = "Unknown";

                    // Use cookies and CPS stored in our save data when available
                    if (save.cookies !== undefined) {
                        if (typeof Beautify === 'function') {
                            cookies = Beautify(save.cookies);
                        } else {
                            cookies = MultiSaves.formatNumber(save.cookies);
                        }
                    }

                    if (save.cookiesPs !== undefined) {
                        if (typeof Beautify === 'function') {
                            cps = Beautify(save.cookiesPs) + '/s';
                        } else {
                            cps = MultiSaves.formatNumber(save.cookiesPs) + '/s';
                        }
                    }

                    // Fallback to parsing the save data
                    if (cookies === "Unknown" || cps === "Unknown") {
                        try {
                            var decodedSave = save.data.split("!END!")[0];
                            var gameData = decodedSave.split("|");
                            if (gameData.length > 2) {
                                if (cookies === "Unknown") {
                                    if (typeof Beautify === 'function') {
                                        cookies = Beautify(Number(gameData[2]));
                                    } else {
                                        cookies = MultiSaves.formatNumber(Number(gameData[2]));
                                    }
                                }

                                if (cps === "Unknown" && gameData[5]) {
                                    if (typeof Beautify === 'function') {
                                        cps = Beautify(Number(gameData[5])) + '/s';
                                    } else {
                                        cps = MultiSaves.formatNumber(Number(gameData[5])) + '/s';
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("Error decoding save:", e);
                        }
                    }

                    var saveItemDiv = document.createElement('div');
                    saveItemDiv.className = 'listing';
                    saveItemDiv.style.margin = '8px 0';
                    saveItemDiv.style.padding = '8px';
                    saveItemDiv.style.background = '#111';
                    saveItemDiv.style.borderRadius = '4px';
                    saveItemDiv.style.position = 'relative';

                    if (id === currentSaveId) {
                        saveItemDiv.style.borderLeft = '3px solid #5c5';
                        saveItemDiv.style.paddingLeft = '12px';
                    }

                    // Element content
                    var nameDiv = document.createElement('div');
                    nameDiv.style.fontWeight = 'bold';
                    nameDiv.style.color = '#fff';
                    nameDiv.style.fontSize = '1.1em';
                    nameDiv.style.marginBottom = '4px';
                    nameDiv.textContent = save.name;
                    saveItemDiv.appendChild(nameDiv);

                    var infoDiv = document.createElement('div');
                    infoDiv.style.fontSize = '0.8em';
                    infoDiv.style.color = '#999';
                    infoDiv.style.marginBottom = '8px';
                    infoDiv.innerHTML = `ID: ${id.substring(0, 8)}...<br>` +
                        `Created: ${formattedDate}<br>` +
                        `Cookies: ${cookies}<br>` +
                        `Production: ${cps}`;
                    saveItemDiv.appendChild(infoDiv);

                    // Action buttons
                    var actionsDiv = document.createElement('div');
                    actionsDiv.style.display = 'flex';
                    actionsDiv.style.justifyContent = 'space-between';

                    var loadButton = document.createElement('a');
                    loadButton.className = 'option smallFancyButton';
                    loadButton.textContent = 'Load';
                    loadButton.onclick = (function(saveId) {
                        return function() {
                            MultiSaves.loadSave(saveId);
                            PlaySound('snd/tick.mp3');
                        };
                    })(id);
                    actionsDiv.appendChild(loadButton);

                    var renameButton = document.createElement('a');
                    renameButton.className = 'option smallFancyButton';
                    renameButton.textContent = 'Rename';
                    renameButton.onclick = (function(saveId) {
                        return function() {
                            MultiSaves.renameSave(saveId);
                            PlaySound('snd/tick.mp3');
                        };
                    })(id);
                    actionsDiv.appendChild(renameButton);

                    var deleteButton = document.createElement('a');
                    deleteButton.className = 'option smallFancyButton';
                    deleteButton.textContent = 'Delete';
                    deleteButton.onclick = (function(saveId) {
                        return function() {
                            MultiSaves.deleteSave(saveId);
                            PlaySound('snd/tick.mp3');
                        };
                    })(id);
                    actionsDiv.appendChild(deleteButton);

                    saveItemDiv.appendChild(actionsDiv);
                    saveManagerBox.appendChild(saveItemDiv);
                }
            }

            // Add our section after the section containing the Wipe save button
            wipeButtonSection.parentNode.insertBefore(saveManagerBox, wipeButtonSection.nextSibling);
        });
    };

    // Initialize the mod
    setTimeout(function() {
        MultiSaves.injectGameOptions();

        // Setup auto-save for the current save if one exists
        if (MultiSaves.getCurrentSaveId()) {
            MultiSaves.setupAutoSave();
        }

        // Initialization notification
        Game.Notify(
            'MultiSaves loaded',
            'Easily manage multiple saves in the game options.',
            [16, 5]
        );
    }, 1000);
};

// CCSE configuration function
if (CCSE.ConfirmGameVersion(MultiSaves.name, MultiSaves.version, MultiSaves.GameVersion)) {
    Game.registerMod(MultiSaves.name, MultiSaves);
}