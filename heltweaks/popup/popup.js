chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
  let notes = [];
  var activeTab = tabs[0];
  let matchUrl;

  try{
    chrome.storage.sync.get('notesUrlCheck', function(data){
      matchUrl = data.notesUrlCheck;
    });
    
    chrome.tabs.sendMessage(activeTab.id, {request: "notes"}, function(response){
      try{
        if(typeof response == "undefined" || response.notes == "empty")
          return;
        notes = JSON.parse(response.notes);

        let htmlNotes = notes.map((note, index) => {
          return "<li data-id=" + index + ">" + note + "</li>";
        }).join("");
        document.querySelector("#notes").innerHTML = htmlNotes;
        document.querySelectorAll("#notes li").forEach(note => {
          // On note click
          note.addEventListener("click", function(){
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
              chrome.tabs.executeScript(tabs[0].id, {file: "jquery-min.js"}, function(){
                chrome.tabs.executeScript(
                  tabs[0].id,
                  {code: `
                    if(typeof helsNotes == "undefined"){
                      var helsNotes;
                      var tempCount;
                      var tempId;
                    }
                    tempCount = 0;
                    tempId = ${parseInt(note.getAttribute("data-id"))} + 1;
                    helsNotes = JSON.parse(window.localStorage.helsNotes);

                    for(let index in helsNotes){
                      if(${matchUrl}){
                        // ****************** Removal for matching url ******************
                        if(helsNotes[index].url == window.location.href){
                          helsNotes[index].notes.splice(${parseInt(note.getAttribute("data-id"))} + 1, 1);        // Idk why + 1
                          if(helsNotes[index].notes.length == 0)            // Remove empty object
                            helsNotes.splice(index, 1);
                          break;
                        }
                      } else {
                        // ****************** Removal for non-matching urls ******************
                        tempId -= helsNotes[index].notes.length;
                        if(tempId < 0 ){                                    // Id found
                          tempId += helsNotes[index].notes.length;
                          helsNotes[index].notes.splice(tempId, 1);      
                          if(helsNotes[index].notes.length == 0)            // Remove empty object
                            helsNotes.splice(index, 1);
                          break;
                        }
                      }
                    }

                    window.localStorage.helsNotes = JSON.stringify(helsNotes);
                  `});
              });
            });
            if(typeof removed == "undefined"){
              var removed = false;
              var notesCount = 0;
            }
            document.querySelectorAll("#notes li").forEach((htmlNote, index) => {
              notesCount++;
              if(index == parseInt(note.getAttribute("data-id"))){
                htmlNote.remove();
                removed = true;
              }
              if(removed){
                htmlNote.setAttribute("data-id", index -1);
              }
            });
            updateBadge(--notesCount);                    // Cant be called here prob
          });
        });
      } catch(err){console.log(err)}
    });
  } catch(err){console.log(err)}
 });

function updateBadge(notesCount){
  chrome.runtime.sendMessage({request: "setBadge", notesCount: notesCount});
}

try{
  document.querySelector("#newNote").addEventListener("click", function(){
    // On popup button click
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.executeScript(tabs[0].id, {file: "jquery-min.js"}, function(){
              chrome.tabs.executeScript(
                tabs[0].id,
                {code: `
                  if(!document.querySelector("#helsModal")){
                    if(typeof helsNotes == "undefined")
                      var helsNotes;

                    if(window.localStorage.helsNotes)
                      helsNotes = JSON.parse(window.localStorage.helsNotes);
                    else
                      helsNotes = [];

                    document.querySelector("body").insertAdjacentHTML("beforeend", \`${modal}\`);
                    document.querySelector("#helsAddNote").addEventListener("mouseenter", function(){
                      this.style.color = "#fff";
                      this.style.backgroundColor = "#343a40";
                    });
                    document.querySelector("#helsAddNote").addEventListener("mouseout", function(){
                      this.style.color = "#343a40";
                      this.style.backgroundColor = "#fff";
                    });
                    document.querySelector("#helsNote").addEventListener("keypress", function(e){
                      if(e.keyCode == 13)
                        document.querySelector("#helsAddNote").click();
                    });
                    document.querySelector("#helsModal").addEventListener("click", function(e){
                      if(e.target.id == "helsModal"){
                        this.style.display = "none";
                      }
                    });
                    document.querySelector("#helsAddNote").addEventListener("click", function(){
                      document.querySelector("#helsModal").style.display = "none";
                      
                      for(let i = -1; i < helsNotes.length; i++){
                        if(i > -1 && helsNotes[i].url == window.location.href){
                          helsNotes[i].notes.push(document.querySelector("#helsNote").value);
                          break;
                        }
                        if(i + 1 == helsNotes.length){
                          helsNotes.push({url: window.location.href, notes: [document.querySelector("#helsNote").value]});
                          break;
                        }
                      } 
                      document.querySelector("#helsNote").value = "";

                      window.localStorage.helsNotes = JSON.stringify(helsNotes);
                    });
                  }

                  document.querySelector("#helsModal").style.display = "flex";

                  setTimeout(() => {
                    window.focus();

                    setTimeout(() => {
                      document.querySelector("#helsNote").focus();
                    }, 0);
                  }, 500);
                `});
            });
                
          });
  });
} catch(err){console.log(err)}

const buttonStyles = `line-height: 1.5; cursor:pointer; border-radius: .2rem; display: inline-block; font-weight: 400; color: #212529; text-align: center; vertical-align: middle; border: 1px solid transparent; color: #343a40; background-color: #fff; border-color: #343a40; padding: 5px 18px 5px 17px; margin-top:15px; font-size: 15px; border-radius: .25rem; transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out; text-decoration: none; `;

const modal = `
  <div id=helsModal style="cursor:pointer; z-index: 9999999; width: 100%; height: 100%; top:0; left:0; display:flex; align-items: center; justify-content: center; position: fixed; background: rgba(0,0,0,0.3);">
    <div id=helsModalDiv style="cursor:default; width:40%; box-shadow: 0px 0px 3px 0px rgba(0,0,0,0.6); border-radius: 6px; background: white; padding:20px;">
      <h2 style="margin: 0.5rem 0;">New Note</h2>
      <textarea id=helsNote style="border-radius: 4px; width:100%; box-sizing:border-box; padding:10px; height:150px;"></textarea>
      <button style="${buttonStyles}" id=helsAddNote>OK</button>
    </div>
  </div>`;

