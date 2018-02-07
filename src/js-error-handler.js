/**
 * JS Error Handler
 * Catches javascript errors in your app. Stores them in sessionStorage,
 * immediately reports error to an ajax url
 */
var JSErrorHandler = function(config){

    var errorHandler = {
        errors: [],
        ajaxProvider: null,
        sessionStorageErrors: [],
        config: config,

        /**
         * Initialise the event listener
         */
        init: function() {
            var self = this;
            window.addEventListener('error', function(e){
                let err = JSON.parse(JSON.stringify(e, ['message', 'filename', 'lineno', 'colno', 'error']));
                err.timestamp = Date.now();
                self.errors.push(err);
                self.sessionStorageErrors.push(err);

                self.save();

            });



            if ( typeof sessionStorage != 'undefined' ) {
                let jsErrors = sessionStorage.getItem('jsErrors');
                if ( jsErrors ) {
                    this.sessionStorageErrors = JSON.parse(jsErrors);
                }
            }
        },
        save: function() {
            // Determine how to save
            if ( typeof jQuery != 'undefined' ) {
                this.ajaxProvider = jQuery.post;
            }
            else if ( typeof axios != "undefined" ) {
                this.ajaxProvider = axios.post;
            }
            else {
                console.warn("No ajax provider found, please ensure jQuery or axios are included");
            }

            if ( typeof config.ajaxURL != 'undefined' && this.ajaxProvider ) {

                let params = {};
                if ( this.config.extraParams ) {
                    params = this.config.extraParams;
                }
                params.errors = this.errors;

                this.ajaxProvider(this.config.ajaxURL, params).then(this.onSave.bind(this)).catch(this.onSaveError.bind(this));
            }

            if ( typeof sessionStorage != 'undefined' ) {
                sessionStorage.setItem('jsErrors', JSON.stringify(this.sessionStorageErrors));
            }
        },

        onSave: function(response){
            if (typeof this.config.onSave == 'function' ){
                this.config.onSave.call(this, response);
            }

            this.errors = [];
        },

        onSaveError: function(response){
            if (typeof this.config.onSaveError == 'function' ){
                this.config.onSaveError.call(this,response);
            }
        },

    };

    errorHandler.init();
    return errorHandler;

};

if ( typeof module != "undefined" ) {
    module.exports = JSErrorHandler;
}