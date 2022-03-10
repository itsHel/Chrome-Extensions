'use strict';

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

var HellTweaks = {
    altDown: false,
    ctrlDown:false,
    lastFaded: "",
    saveScroll: true,
    saveUrl: true
};

chrome.storage.sync.get("saveScroll", function(data){
    HellTweaks.saveScroll = data.saveScroll;
});
chrome.storage.sync.get("notesUrlCheck", function(data){
    HellTweaks.saveUrl = data.notesUrlCheck;
});


// Scroll from url
window.addEventListener("load", function(){
    if(window.location.href.match("helsscroll=")){
        // Scroll with copy url
        let url = window.location.href;
        let html = $("html");

        html.style.scrollBehavior = "smooth";
        window.scrollTo(0, parseInt(url.substring(url.lastIndexOf("helsscroll=") + 11, url.lastIndexOf("helsscroll=") + 11 + 10)));
        html.style.scrollBehavior = "auto";
    } else if(HellTweaks.saveScroll && window.localStorage.helsScroll){
        // Scroll with localStorage history
        let scrolls = JSON.parse(window.localStorage.helsScroll);
        let html = $("html");

        for(let index in scrolls){
            if(scrolls[index].url == window.location.href){
                html.style.scrollBehavior = "smooth";
                window.scrollTo(0, scrolls[index].yPos);
                html.style.scrollBehavior = "auto";
            }
        }
    }

    // **************************************** Misc ****************************************
    // Change date formats on stackoverflow
    if(window.location.href.match("stackoverflow.com/")){
        $$(".user-action-time .relativetime").forEach(function(element){
            element.textContent = element.getAttribute("title").slice(0, 16);
        });
        $$(".comment-date .relativetime-clean").forEach(function(element){
            element.textContent = element.getAttribute("title").slice(0, 16);
        });
    }
    // Google notes
    if(window.location.href.match(/google\.[a-z]+?\/search\?/)){
        addGoogleNotes();
    }

    // Tab twice to go to first google link
    if(window.location.href.match(/google\.[a-z]{1,3}\/search/i)){
        let tabPressed = false;
        window.addEventListener("keydown", function(e){
            if(e.key == "Tab" && tabPressed){
                // Twice press
                tabPressed = false;
                $("#search a").click();
            } else {
                tabPressed = true;

                setTimeout(function(){
                    tabPressed = false;
                }, 750);
            }
        });
    }

    // **************************************** _black target cursor change ****************************************
    $$("a").forEach(function(element){
        if(element.getAttribute("target") == "_blank")
            element.style.cursor = "alias";
    });

    setNotes();
    setRemover();
    setScrollAutosave();
});

function setNotes(){
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
        if(window.localStorage.helsNotes && window.localStorage.helsNotes != "[]"){
            notes = JSON.parse(window.localStorage.helsNotes);
        }

        chrome.runtime.onMessage.addListener(              
            function(request, sender, sendResponse){
                notesCount = 0;
                if(request.request == "notes"){
                    if(window.localStorage.helsNotes && window.localStorage.helsNotes != "[]"){
                        // Notes found
                        notes = JSON.parse(window.localStorage.helsNotes);
                        // Non-url matching notes
                        if(!HellTweaks.saveUrl){
                            let allNotes = [];
                            for(let index in notes){
                                allNotes.push(...notes[index].notes);
                            }
                            notesCount = allNotes.length;
                            sendResponse({notes: JSON.stringify(allNotes)})
                        } else {
                            // Url matching notes
                            for(let index in notes){
                                if(HellTweaks.saveUrl){
                                    if(notes[index].url == window.location.href){
                                        notesCount = notes[index].notes.length;
                                        sendResponse({notes: JSON.stringify(notes[index].notes)});
                                        break;
                                    }
                                }
                                if(parseInt(index) + 1 == notes.length){
                                    sendResponse({notes: "empty"});
                                }
                            }
                        }
                    } else {
                        sendResponse({notes: "empty"});
                    }
                    // Count badges on change
                    if(HellTweaks.saveUrl)                    // Non-url mathing already counted
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
            if(HellTweaks.saveUrl){                           // Url matching count
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
    
    let cursorStyle = document.createElement("style");
    cursorStyle.innerHTML = ".not-allowed-cursor *{ cursor: not-allowed; }";

    $("head").append(cursorStyle);
}

// **************************************** Remove on click ****************************************
function setRemover(){
    document.addEventListener("keyup", function(e){
        let remove = (HellTweaks.altDown || HellTweaks.ctrlDown);

        if(e.key == "Alt")
            HellTweaks.altDown = false;
        if(e.key == "Control")
            HellTweaks.ctrlDown = false;

        if(remove && (!HellTweaks.altDown || !HellTweaks.ctrlDown)){
            $("body").classList.remove("not-allowed-cursor", "not-allowed-border");
        }
    });

    document.addEventListener("click", function(e){
        if(!HellTweaks.altDown || !HellTweaks.ctrlDown)
            return;
        if(e.target.tagName.toLocaleLowerCase() == "html" || e.target.tagName.toLocaleLowerCase() == "body")
            return;

        e.preventDefault();

        HellTweaks.lastFaded = e.target;
        HellTweaks.lastFaded.style.display = "none";
    });

    chrome.storage.sync.get("borders", function(data){
        if(data.borders){
            let borderStyle = document.createElement('style');
            borderStyle.innerHTML = '.not-allowed-border *:hover{ border: 1px dotted rgba(255, 0, 0, 0.7); }';

            $('head').append(borderStyle);
        }
    });

    window.addEventListener("focus", function(){
        HellTweaks.altDown = false;
        HellTweaks.ctrlDown = false;

        $("body").classList.remove("not-allowed-cursor", "not-allowed-border");
    });
    
    document.addEventListener("keydown", function(e){
        if(e.key == "Alt")
            HellTweaks.altDown = true;
        if(e.key == "Control")
            HellTweaks.ctrlDown = true;
        
        if(HellTweaks.altDown && HellTweaks.ctrlDown){
            // **************************************** Copy url with scroll ****************************************
            if(e.key == "&"){                           // Alt + c
                const url = window.location.href;
                let newUrl = url + (url.match(/\?/) ? "&" : "?") + "helsscroll=" + parseInt(window.scrollY);
                window.navigator.clipboard.writeText(newUrl);
            }
            // **************************************** Remover step back ****************************************
            if(e.key == "z"){
                HellTweaks.lastFaded.style.display = "";
                return;
            }
            $("body").classList.add("not-allowed-cursor", "not-allowed-border");
        }
    });
}

// **************************************** Scroll autosave ****************************************
function setScrollAutosave(){
    window.addEventListener("blur", function(){
        if(HellTweaks.saveScroll){
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
}

function addGoogleNotes(){
    const linkSelector = ".yuRUbf";
    const linkParentOverflowSelector = ".jtfYYd";

    let data = JSON.parse(window.localStorage.helsGoogleNotes || "false");

    let links = document.querySelectorAll(linkSelector);
    
    if(!links)
        return;

    const style = 'cursor:pointer;background:#fff;z-index: 999999;position:absolute; left:100%; top:0; padding-left:4px; color:#4d5156; max-width:300px; max-height:110px; overflow:hidden; text-overflow:ellipsis; border-left:5px solid #42464a;';
    const svgStyle = 'style="width:9px; height:9px; margin-bottom:1px; cursor:pointer;"';
    const svgPac = '<svg class=mysvg viewBox="0 0 541.6 571.11" ' + svgStyle + '><path style="fill:#70757a" d="M535.441,412.339A280.868,280.868 0 1,1 536.186,161.733L284.493,286.29Z"/></svg>';
    const textarea = `<textarea placeholder='Shift + Enter&#10;to confirm' style="margin:1px;box-sizing:border-box;min-height:60px;max-height:84px;visibility:hidden;font-size:14px;min-width:220px;padding:6px 10px;position:absolute;top:12px;background:#fff;border:1px solid rgba(0,0,0,.20);z-index:4;transition:opacity 0.2s;box-shadow:0 2px 4px rgb(0 0 0 / 20%); outline: 0;border-color: #34bdfe;box-shadow: 0 0 2px 1px #2d99cc80;"></textarea>`;

    // .jtfYYd contain:initial; overflow:visible;
    document.querySelectorAll(".eFM0qc > span").forEach(linkNav => {
        let div = "<div class='link-add-note' style='position:relative; display: inline-block; visibility:visible; margin-right:6px;'>" + svgPac + textarea + "</div>";

        linkNav.insertAdjacentHTML('afterend', div);
        linkNav.parentNode.querySelector(".link-add-note").addEventListener("click", openNote);
        
        let area = linkNav.parentNode.querySelector("textarea");
        area.addEventListener("keydown", addNote);
        area.addEventListener("input", fixHeight);

        function openNote(e){
            if(e.target.closest("svg")?.classList.contains("mysvg")){
                if(area.style.visibility == "visible"){
                    area.style.visibility = "hidden";
                } else {
                    area.style.visibility = "visible";
                    area.focus();
                }
            }
        }

        function addNote(e){
            if(e.shiftKey && e.key == "Enter"){
                let link = e.target.closest(linkSelector);

                let href = link.querySelector("a").href;
                let match = href.match(/\/\/(.+?)(\/|$)/);
                let text = e.target.value;

                if(!match){
                    console.log(e.target);
                    console.log(link.querySelector("a"));
                    alert("Cannot find url, open console");
                    return;
                }

                let url = match[1];

                if(!data){
                    data = {};
                }

                data[url] = text;
                createNote(link, text);
                area.style.visibility = "hidden";

                window.localStorage.helsGoogleNotes = JSON.stringify(data);
            }
        }

        function fixHeight(){
            this.style.height = '1px';
            this.style.height = (this.scrollHeight) + 'px';
        }
    });

    // Add data
    if(!data)
        return;

    links.forEach(link => {
        let href = link.querySelector("a").href;
        let match = href.match(/\/\/(.+?)(\/|$)/);
        
        if(!match)
            return;
        
        let url = match[1];

        if(!data.hasOwnProperty(url))
            return;

        let linkParent = link.closest(linkParentOverflowSelector);
        if(linkParent){
            linkParent.style.overflow = "visible";
            linkParent.style.contain = "none";
        }

        link.style.position = "relative";

        let text = data[url];

        createNote(link, text);
    });

    function createNote(link, text){
        let previousNote = link.querySelector(".link-note");
        
        if(previousNote){
            previousNote.textContent = text;

            return;
        }

        let linkParent = link.closest(linkParentOverflowSelector);
        if(linkParent){
            linkParent.style.overflow = "visible";
            linkParent.style.contain = "none";
        }

        link.style.position = "relative";

        let div = "<div class='link-note' title='" + text + "' style='" + style + "'>" + text + "</div>";

        link.insertAdjacentHTML('beforeend', div);
        link.querySelector(".link-note").addEventListener("click", function(){
            this.style.display = "none";
        });
    }
}