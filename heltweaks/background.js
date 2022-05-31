chrome.action.setBadgeBackgroundColor({ color: [222, 0, 0, 255] });

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if(request.request == "setBadge"){
            if(typeof sender.tab != "undefined"){
                chrome.action.setBadgeText({tabId: sender.tab.id, text: (request.notesCount) ? request.notesCount.toString() : ""});
            } else {
                chrome.action.setBadgeText({text: (request.notesCount) ? request.notesCount.toString() : ""});
            }
        }
		
        sendResponse({});
    }
);
