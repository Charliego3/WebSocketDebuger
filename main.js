 chrome.browserAction.onClicked.addListener(function() {
    chrome.tabs.create({'url': "/pages/wstest.html"});
 });