// TODO
//  - add toggling for all functions to menu

// Changes format of stackoverflow/stackexchange dates
// Double Tab on (750ms waittime) Google - go to first search result
// Changes cursor of target=_blank links

// Disabled // Copy url with scroll                         Ctrl + Alt + c
// Disabled // Saves scrolled position                      Chrome autosaves scroll, Opera doesnt?

// Remover
//      - Hold Ctrl + Alt to remove any element on page by click                           
//      - Ctrl + Alt + z to show element again

// Notes 
//      - make notes on any site
//      - saved in localStorage

'use strict';

(function(){
    const $ = document.querySelector.bind(document);
    const $$ = document.querySelectorAll.bind(document);

    var HellTweaks = {
        altDown: false,
        ctrlDown: false,
        lastFaded: "",
        saveScroll: true,
        notesUrlCheck: true
    };

    window.addEventListener("load", async function(){
        HellTweaks.saveScroll = await getSetting("saveScroll");
        HellTweaks.notesUrlCheck = await getSetting("notesUrlCheck");

        setNotes();
        setRemover();
        changeBlankCursor();
        // scrollOnLoad();
        // setScrollAutosave();

        if(window.location.href.match(/google\.[a-z]+?\/search\?/i)){
            addGoogleNotes();
            setGoogleTab();
        }

        if(window.location.href.match(/stackoverflow\.com\/|stackexchange\.com\//)){
            changeStackDates();
        }
    });

    async function getSetting(name){
        return new Promise((resolve) => {
            chrome.storage.sync.get(name, function(data){
                resolve(data[name]);
            });
        });
    }

    function changeStackDates(){
        $$(".user-action-time .relativetime").forEach(function(element){
            element.textContent = element.getAttribute("title").slice(0, 16);
        });
        $$(".comment-date .relativetime-clean").forEach(function(element){
            element.textContent = element.getAttribute("title").slice(0, 16);
        });
    }

    function changeBlankCursor(){
        $$("a").forEach(function(element){
            if(element.getAttribute("target") == "_blank")
                element.style.cursor = "alias";
        });
    }

    // Tab twice to go to first google link
    function setGoogleTab(){
        let tabPressed = false;
            
        window.addEventListener("keydown", function(e){
            if(e.key == "Tab" && tabPressed){
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

    function setNotes(){
        try{
            // window.localStorage[storageName]:         [{url:"www.google.com", notes:["firstnote", "secondnote"]}]              // notesUrlCheck == true
            // window.localStorage[storageName]:         ["firstnote", "secondnote"]                                              // notesUrlCheck == false
            
            const storageName = "HellNotes";

            let notes = [];
            let notesRemainder = [];

            // if notesUrlCheck extract string notes as array and save rest of objects in notesRemainder
            if(window.localStorage[storageName] && window.localStorage[storageName] != "[]"){
                try{
                    notes = JSON.parse(window.localStorage[storageName]);

                    let realNotes = [];
                    if(HellTweaks.notesUrlCheck){
                        for(let i = 0; i < notes.length; i++){
                            if(location.href == notes[i]?.url){
                                realNotes = notes[i].notes;
                            } else {
                                notesRemainder.push(notes[i]);
                            }
                        }

                        notes = realNotes;
                    } else {
                        notes = notes.filter(note => typeof note == "string");
                    }
                } catch(err){
                    window.localStorage[storageName] = "[]";
                    console.log(err);
                    notes = [];
                }
            }

            chrome.runtime.onMessage.addListener(
                function(request, sender, sendResponse){
                    if(request.request == "getNotes"){
                        sendResponse({notes: notes});

                        chrome.runtime.sendMessage({request: "setBadge", notesCount: notes.length});
                    }

                    if(request.request == "editNotes"){
                            notes = request.data;
                            
                            if(!HellTweaks.notesUrlCheck){
                                window.localStorage[storageName] = JSON.stringify(notes);
                            } else {
                                let fullNotes = notesRemainder.concat({url: location.href, notes: notes});

                                window.localStorage[storageName] = JSON.stringify(fullNotes);
                            }

                        chrome.runtime.sendMessage({request: "setBadge", notesCount: notes.length});
                    }
                }
            );

            chrome.runtime.sendMessage({request: "setBadge", notesCount: notes.length});
        } catch(err){console.log(err)}
    }

    // Remove element on click
    // Cannot use e.ctrlKey/e.altKey because of body classes
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

            if(e.target.tagName == "HTML" || e.target.tagName == "BODY")
                return;

            e.preventDefault();

            HellTweaks.lastFaded = e.target;
            HellTweaks.lastFaded.style.display = "none";
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
                // Step back
                if(e.key == "z"){
                    HellTweaks.lastFaded.style.display = "";
                    return;
                }

                $("body").classList.add("not-allowed-cursor", "not-allowed-border");
            }
        });

        // Add classes to head
        let cursorStyle = document.createElement("style");
        cursorStyle.innerHTML = ".not-allowed-cursor *{ cursor: not-allowed; }";

        $("head").append(cursorStyle);

        chrome.storage.sync.get("borders", function(data){
            if(data.borders){
                let borderStyle = document.createElement("style");
                borderStyle.innerHTML = ".not-allowed-border *:hover{ border: 1px dotted rgba(255, 0, 0, 0.7); }";

                $("head").append(borderStyle);
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
                        console.log(link.querySelector("a"));
                        console.log(e.target);
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

    function setScrollAutosave(){
        window.addEventListener("blur", function(){
            if(HellTweaks.saveScroll){
                if(window.localStorage["helsScroll"]){
                    let scrolls = JSON.parse(window.localStorage["helsScroll"]);

                    for(let index in scrolls){
                        if(scrolls[index].url == window.location.href){
                            scrolls[index].yPos = window.scrollY;
                            break;
                        }

                        if(parseInt(index) + 1 == scrolls.length){
                            scrolls.push({url: window.location.href, yPos: window.scrollY})
                        }
                    }

                    window.localStorage["helsScroll"] = JSON.stringify(scrolls);
                } else {
                    window.localStorage["helsScroll"] = JSON.stringify([{url: window.location.href, yPos: window.scrollY}]);
                }
            }
        });
    }
    
    function scrollOnLoad(){
        if(window.location.href.match("helsscroll=")){
            // Scroll with copy url
            let url = window.location.href;
            let html = $("html");

            html.style.scrollBehavior = "smooth";
            window.scrollTo(0, parseInt(url.substring(url.lastIndexOf("helsscroll=") + 11, url.lastIndexOf("helsscroll=") + 11 + 10)));
            html.style.scrollBehavior = "auto";
        } else if(HellTweaks.saveScroll && window.localStorage["helsScroll"]){
            // Scroll with localStorage history
            let scrolls = JSON.parse(window.localStorage["helsScroll"]);
            let html = $("html");

            for(let index in scrolls){
                if(scrolls[index].url == window.location.href){
                    html.style.scrollBehavior = "smooth";
                    window.scrollTo(0, scrolls[index].yPos);
                    html.style.scrollBehavior = "auto";
                }
            }
        }

        window.addEventListener("keydown", function(e){
            if(e.key == "&"){                               // Alt + Ctrl + c || rightAlt + c
                const url = window.location.href;
                const newUrl = url + (url.match(/\?/) ? "&" : "?") + "helsscroll=" + parseInt(window.scrollY);
                
                window.navigator.clipboard.writeText(newUrl);
            }
        });
    }
})();
