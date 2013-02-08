﻿//  Holds all the relevant data for a video.
define(['programState'], function(programState){
    'use strict';

    var Video = Backbone.Model.extend({
        defaults: {
            //  Provided by YouTube's API.
            id: '',
            playlistId: null,
            title: '',
            duration: -1
        },
        urlRoot: programState.getBaseUrl() + 'Video/'
    });

    return function (config) {
        var video = new Video(config);
        return video;
    };
});