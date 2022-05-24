chrome.tabs.query({currentWindow: true, active: true}, async function (tabs){
    try{
        const noteInterface = document.querySelector("#noteInterface");
        const newNoteDiv = document.querySelector("#newNoteDiv");
        const newNoteButton = document.querySelector("#newNoteButton");
        const addNoteConfirmButton = document.querySelector("#addNoteConfirmButton");
        const noteContent = document.querySelector("#noteContent");

        let activeTab = tabs[0];
        let storageNotes = [];

        // send message to main.js
        chrome.tabs.sendMessage(activeTab.id, {request: "getNotes"}, function(response){
            try{
                if(typeof response == "undefined")
                    return;

                storageNotes = response.notes.filter(note => typeof note == "string");

                let htmlNotes = storageNotes.map((note, index) => {
                    return "<li data-id=" + index + ">" + note + "</li>";
                }).join("");

                document.querySelector("#notes").innerHTML = htmlNotes;
            } catch(err){console.log(err)}
        });

        newNoteButton.addEventListener("click", async function(){
            noteInterface.style.display = "none";
            newNoteDiv.style.display = "flex";

            document.querySelector("#noteContent").focus();
        });

        noteContent.addEventListener("keypress", function(e){
            // Allow newline with shift + enter otherwise submit
            if(e.keyCode == 13 && !e.shiftKey)
                addNoteConfirmButton.click();
        });
        
        addNoteConfirmButton.addEventListener("click", async function(){
            storageNotes.push(noteContent.value);

            noteContent.value = "";

            let htmlNotes = storageNotes.map((note, index) => {
                return "<li data-id=" + index + ">" + note + "</li>";
            }).join("");

            document.querySelector("#notes").innerHTML = htmlNotes;

            chrome.tabs.sendMessage(activeTab.id, {request: "editNotes", data: storageNotes});

            noteInterface.style.display = "block";
            newNoteDiv.style.display = "none";
        });

        document.querySelector("#notes").addEventListener("click", function(e){
            if(e.target.nodeName == "LI"){
                storageNotes = storageNotes.filter(note => 
                    note != e.target.textContent
                );

                chrome.tabs.sendMessage(activeTab.id, {request: "editNotes", data: storageNotes});

                e.target.remove();

                updateBadge(storageNotes.length);
            }
        });

        document.querySelector("#newNoteClose").addEventListener("click", function(){
            noteInterface.style.display = "block";
            newNoteDiv.style.display = "none";
        });
    } catch(err){console.log(err)}
});

function updateBadge(notesCount){
    chrome.runtime.sendMessage({request: "setBadge", notesCount: notesCount});
}
