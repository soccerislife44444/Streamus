﻿require([
    'jquery',
    'backbone',
    'underscore',
    'googleApiClient',
    'error',
    'iconManager'
], function () {
    'use strict';

    //  Only use main.js for loading external helper files before the background is ready. Then, load the background.
    require(['background'], function () { });
});