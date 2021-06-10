var helsVars = {
    altDown: false,
    ctrlDown:false,
    lastFaded: "",
    saveScroll: true,
    saveUrl: true
};
chrome.storage.sync.get("saveScroll", function(data){
    helsVars.saveScroll = data.saveScroll;
});
chrome.storage.sync.get("notesUrlCheck", function(data){
    helsVars.saveUrl = data.notesUrlCheck;
});

// Scroll
$(window).on("load", function(){
    if(window.location.href.match("helsscroll=")){
        // Scroll with copy url
        let url = window.location.href;
        $("html").css({scrollBehavior: "smooth"});
        window.scrollTo(0, parseInt(url.substr(url.lastIndexOf("helsscroll=") + 11, 10)));
        $("html").css({scrollBehavior: "auto"});
        console.log("scrolled with copy");
    } else if(helsVars.saveScroll && window.localStorage.helsScroll){
        // Scroll with localStorage history
        let scrolls = JSON.parse(window.localStorage.helsScroll);
        for(let index in scrolls){
            if(scrolls[index].url == window.location.href){
                $("html").css({scrollBehavior: "smooth"});
                window.scrollTo(0, scrolls[index].yPos);
                $("html").css({scrollBehavior: "auto"});
                console.log("scrolled with history");
            }
        }
    }

    if(window.location.href.match("stackoverflow.com/")){
        $(".user-action-time .relativetime").each(function(){
            $(this).text($(this).attr("title").slice(0, 16));
        });
        $(".comment-date .relativetime-clean").each(function(){
            $(this).text($(this).attr("title").slice(0, 16));
        });
    }

    if(window.location.href.match(/google\.[a-z]{1,3}\/search/i)){
        let tabPressed = false;
        $(window).on("keydown", function(e){
            if(e.key == "Tab" && tabPressed){
                // Twice press
                tabPressed = false;
                $("#search a")[0].click();
            } else {
                tabPressed = true;
                setTimeout(function(){
                    tabPressed = false;
                }, 500);
            }
        });
    }
});

$(function(){
    // After reseting extension pages must be fereshed for it to work properly

    // Changes format of stackoverflow dates
    // Double tab on (500ms waittime) google - go to first search result
    // Remover                              Ctrl + Alt + z to show element again
    // Target=_blank cursor change
    // Save scrolled position               Chrome autosaves scroll, Opera doesnt
    // Copy url with scroll                 Ctrl + Alt + c
    // Notes

    // PROBLEMS:   
    //  - sometimes alt/ctrl gets stucked
    
    // Notes will clear on localstorage clear
    // Badge updating only on popup reset

    // window.localStorage.helsNotes:         [{url:"www.google.com", notes:["first note", "second note"]}]
    try{
        // **************************************** Notes ****************************************
        // Receiving message from popup
        let notes = [], notesCount = 0;
        if(window.localStorage.helsNotes && window.localStorage.helsNotes != "[]")
            notes = JSON.parse(window.localStorage.helsNotes);
        chrome.runtime.onMessage.addListener(              
            function(request, sender, sendResponse){
                notesCount = 0;
                if(request.request == "notes"){
                    if(window.localStorage.helsNotes && window.localStorage.helsNotes != "[]"){
                        // Notes found
                        notes = JSON.parse(window.localStorage.helsNotes);
                        // Non-url matching notes
                        if(!helsVars.saveUrl){
                            let allNotes = [];
                            for(let index in notes){
                                allNotes.push(...notes[index].notes);
                            }
                            notesCount = allNotes.length;
                            sendResponse({notes: JSON.stringify(allNotes)})
                        } else {
                            // Url matching notes
                            for(let index in notes){
                                if(helsVars.saveUrl){
                                    if(notes[index].url == window.location.href){
                                        notesCount = notes[index].notes.length;
                                        sendResponse({notes: JSON.stringify(notes[index].notes)});
                                        break;
                                    }
                                }
                                if(parseInt(index) + 1 == notes.length){
                                    console.log("empty");
                                    sendResponse({notes: "empty"});
                                }
                            }
                        }
                    } else {
                        console.log("empty");
                        sendResponse({notes: "empty"});
                    }
                    // Count badges on change
                    if(helsVars.saveUrl)                    // Non-url mathing already counted
                        for(let i in notes){
                            if(notes[i].url == window.location.href){
                                notesCount = notes[i].notes.length;
                                break;
                            }
                        }
                    chrome.runtime.sendMessage({request: "setBadge", notesCount: notesCount});
                }
            }
        );
        // Count badges on load
        for(let i in notes){
            if(helsVars.saveUrl){                           // Url matching count
                if(notes[i].url == window.location.href){
                    notesCount = notes[i].notes.length;
                    break;
                }
            } else {                                        // Non-url matching count
                notesCount += notes[i].notes.length;
            }
        }
        chrome.runtime.sendMessage({request: "setBadge", notesCount: notesCount});
    } catch(err){console.log(err)}
    
    let cursorStyle = document.createElement('style');
    cursorStyle.type = 'text/css';
    cursorStyle.innerHTML = '.not-allowed-cursor *{ cursor: not-allowed; }';
    $('head').append(cursorStyle);

    // **************************************** Borders for remover ****************************************
    chrome.storage.sync.get("borders", function(data){
        if(data.borders){
            let borderStyle = document.createElement('style');
            borderStyle.type = 'text/css';
            borderStyle.innerHTML = '.not-allowed-border *:hover{ border: 1px dotted rgba(255, 0, 0, 0.5); }';
            $('head').append(borderStyle);
        }
    });

    $(window).on("focus", function(){
        helsVars.altDown = false;
        helsVars.ctrldown = false;
    });

    
    $(document).on("keydown", function(e){
        if(e.key == "Alt")
            helsVars.altDown = true;
        if(e.key == "Control")
            helsVars.ctrldown = true;
        
        if(helsVars.altDown && helsVars.ctrldown){
            // **************************************** Copy url with scroll ****************************************
            if(e.key == "&"){                           // Alt + c
                const url = window.location.href;
                let newUrl = url + (url.match(/\?/) ? "&" : "?") + "helsscroll=" + parseInt(window.scrollY);
                window.navigator.clipboard.writeText(newUrl);
            }
            // **************************************** Remover step back ****************************************
            if(e.key == "z"){
                helsVars.lastFaded.fadeIn();
                return;
            }
            $("body").addClass("not-allowed-cursor");
            $("body").addClass("not-allowed-border");
        }
    });

    // **************************************** Remover on click ****************************************
    $(document).on("keyup", function(e){
        if(e.key == "Alt")
            helsVars.altDown = false;
        if(e.key == "Control")
            helsVars.ctrldown = false;
        if(($("body").hasClass("not-allowed-cursor") && (!helsVars.altDown || !helsVars.ctrldown))){
            $("body").removeClass("not-allowed-cursor");
            $("body").removeClass("not-allowed-border");
        }
    });
    $(document).on("click", function(e){
        if(!helsVars.altDown || !helsVars.ctrldown)
            return;
        if(e.target.tagName.toLocaleLowerCase() == "html" || e.target.tagName.toLocaleLowerCase() == "body")
            return;
        e.preventDefault();
        helsVars.lastFaded = $(e.target);
        helsVars.lastFaded.fadeOut();
    });

    // **************************************** Scroll autosave ****************************************

    // window.onbeforeunload = function(){alert("unload");}      ??
    $(window).on("blur", function(){
        if(helsVars.saveScroll){
            if(window.localStorage.helsScroll){
                let scrolls = JSON.parse(window.localStorage.helsScroll);
                for(let index in scrolls){
                    if(scrolls[index].url == window.location.href){
                        scrolls[index].yPos = window.scrollY;
                        break;
                    }
                    if(parseInt(index) + 1 == scrolls.length){
                        console.log("pushed new scroll");
                        scrolls.push({url: window.location.href, yPos: window.scrollY})
                    }
                }
                window.localStorage.helsScroll = JSON.stringify(scrolls);
            } else {
                console.log("pushed new scroll from the bottom");
                window.localStorage.helsScroll = JSON.stringify([{url: window.location.href, yPos: window.scrollY}]);
            }
        }
    });
    

    // **************************************** _black target cursor change ****************************************
    $("a").each(function(){
        if($(this).attr("target") == "_blank")
            $(this).css({cursor: "alias"});
    });

    console.log("HelTweaks 1.0.5 loaded");
});