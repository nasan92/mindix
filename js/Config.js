mindmaps.Config = function() {
    return {
        activateDirectUrlInput: true,
        activateUrlsFromServerWithoutSearch: false,
        activateUrlsFromServerWithSearch: false,
        allowMultipleUrls: true,
        urlServerAddress: "http://localhost/s3"
    }
}();
CKEDITOR.editorConfig = function(e) {}