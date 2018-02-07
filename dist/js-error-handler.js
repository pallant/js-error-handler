'use strict';

/**
 * JS Error Handler
 * Catches javascript errors in your app. Stores them in sessionStorage,
 * immediately reports error to an ajax url
 */
var JSErrorHandler = function JSErrorHandler(config) {

    var errorHandler = {
        errors: [],
        ajaxProvider: null,
        sessionStorageErrors: [],
        config: config,

        /**
         * Initialise the event listener
         */
        init: function init() {
            var self = this;
            window.addEventListener('error', function (e) {
                var err = JSON.parse(JSON.stringify(e, ['message', 'filename', 'lineno', 'colno']));
                err.error = {
                    message: e.error.message,
                    stack: e.error.stack
                };
                err.timestamp = Date.now();

                console.log(err);
                self.errors.push(err);
                self.sessionStorageErrors.push(err);
                self.save();
            });

            if (typeof sessionStorage != 'undefined') {
                var jsErrors = sessionStorage.getItem('jsErrors');
                if (jsErrors) {
                    this.sessionStorageErrors = JSON.parse(jsErrors);
                }
            }
        },
        save: function save() {
            // Determine how to save
            if (this.config.ajaxProvider && typeof this.config.ajaxProvider == 'function') {
                this.ajaxProvider = this.config.ajaxProvider;
            } else if (typeof axios != "undefined") {
                this.ajaxProvider = axios.post;
            } else if (typeof jQuery != 'undefined' && jQuery.fn.jquery) {
                this.ajaxProvider = jQuery.post;
            } else {
                console.warn("JSErrorHandler: No ajax provider found, please ensure jQuery or axios are included");
            }

            if (typeof this.config.ajaxURL != 'undefined' && this.ajaxProvider) {

                var params = {};
                if (this.config.extraParams) {
                    params = this.config.extraParams;
                }
                params.errors = this.errors;

                try {
                    this.ajaxProvider(this.config.ajaxURL, params).then(this.onSave.bind(this)).catch(this.onSaveError.bind(this));
                } catch (err) {
                    console.warn('JSErrorHandler: ajaxProvider is not a real Promise, not able to save errors.', err);
                }
            }

            if (typeof sessionStorage != 'undefined') {
                sessionStorage.setItem('jsErrors', JSON.stringify(this.sessionStorageErrors));
            }
        },

        onSave: function onSave(response) {
            if (typeof this.config.onSave == 'function') {
                this.config.onSave.call(this, response);
            }

            this.errors = [];
        },

        onSaveError: function onSaveError(response) {
            if (typeof this.config.onSaveError == 'function') {
                this.config.onSaveError.call(this, response);
            }
        }

    };

    errorHandler.init();
    return errorHandler;
};

if (typeof module != "undefined") {
    module.exports = JSErrorHandler;
}