//  A singleton representing the sole logged on user for the program.
//  Tries to load itself by ID stored in localStorage and then by chrome.storage.sync.
//  If still unloaded, tells the server to create a new user and assumes that identiy.
var User = null;
define(['streams', 'programState', 'localStorageManager'], function (Streams, programState, localStorageManager) {
    'use strict';
    var userIdKey = 'UserId';

    //  User data will be loaded either from cache or server.
    var userModel = Backbone.Model.extend({
        defaults: {
            id: localStorageManager.getUserId(),
            name: '',
            loaded: false,
            streams: new Streams()
        },
        
        urlRoot: programState.getBaseUrl() + 'User/',

        initialize: function () {
            
            //  If user's ID wasn't found in local storage, check sync because its a pc-shareable location, but doesn't work synchronously.
            if (this.isNew()) {
                var self = this;
                //  chrome.Storage.sync is cross-computer syncing with restricted read/write amounts.
                
                chrome.storage.sync.get(userIdKey, function (data) {
                    //  Look for a user id in sync, it might be undefined though.
                    var foundUserId = data[userIdKey];

                    if (typeof foundUserId === 'undefined') {
                        createNewUser.call(self);
                    } else {
                        //  Update the model's id to proper value and call fetch to retrieve all data from server.
                        self.set('id', foundUserId);
                        fetchUser.call(self, false);
                    }
                });

            } else {
                //  User's ID was found in localStorage. Load immediately.
                fetchUser.call(this, true);
            }
        }
    });
    
    function createNewUser() {
        this.set('id', null);

        var self = this;
        //  No stored ID found at any client storage spot. Create a new user and use the returned user object.
        this.save({}, {

            //  TODO: I might need to pull properties out of returned server data and manually push into model.
            //  Currently only care about userId, name can't be updated.
            success: function (model) {
                onUserLoaded.call(self, model, true);
            },
            error: function (error) {
                window && console.error(error);
            }
        });
    }
    
    function onUserLoaded(model, shouldSetSyncStorage) {
        //  Have to manually convert the JSON array into a Backbone.Collection
        var streams = new Streams(model.get('streams'));

        this.set('streams', streams, {
            //  Silent operation because streams isn't technically changing - just being made correct.
            silent: true
        });

        //  TODO: Error handling for writing to sync too much.
        //  Write to sync as little as possible because it has restricted read/write limits per hour.
        if (shouldSetSyncStorage) {
            chrome.storage.sync.set({ userIdKey: model.get('id') });
        }

        localStorageManager.setUserId(model.get('id'));

        //  Announce that user has loaded so managers can use it to fetch data.
        this.set('loaded', true);
    }
    
    //  Loads user data by ID from the server, writes the ID
    //  to client-side storage locations for future loading and then announces
    //  that the user has been loaded fully.

    function fetchUser(shouldSetSyncStorage) {
        var self = this;
        this.fetch({
            success: function (model) {
                console.log("user fetch success:", model);
                onUserLoaded.call(self, model, shouldSetSyncStorage);
            },
            error: function (error) {

                //  Failed to fetch the user... recover by creating a new user for now. Should probably do some sort of notify.
                createNewUser.call(self);
                window && console.error(error);
            }
        });
    }

    //  Only ever instantiate one User.
    User = new userModel();
    
    return User;
});