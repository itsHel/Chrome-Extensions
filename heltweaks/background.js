chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.request == "setBadge"){
            if(typeof sender.tab != "undefined"){
                chrome.browserAction.setBadgeText({tabId: sender.tab.id, text: (request.notesCount) ? request.notesCount.toString() : ""});
            } else {
                chrome.browserAction.setBadgeText({text: (request.notesCount) ? request.notesCount.toString() : ""});
            }
            
            return true;
        }
    }
);

