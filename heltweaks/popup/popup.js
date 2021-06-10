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
                if(!$("#helsModal").length){
                    if(typeof helsNotes == "undefined")
                      var helsNotes;
                    if(window.localStorage.helsNotes)
                      helsNotes = JSON.parse(window.localStorage.helsNotes);
                    else
                      helsNotes = [];
                    $("body").append(\`${modal}\`);
                    $("#helsAddNote").on("mouseenter", function(){
                      $(this).css({color: "#fff", backgroundColor: "#343a40"});
                    });
                    $("#helsAddNote").on("mouseout", function(){
                      $(this).css({color: "#343a40", backgroundColor: "#fff"});
                    });
                    $("#helsNote").on("keypress", function(e){
                      if(e.keyCode == 13)
                        $("#helsAddNote").click();
                    });
                    $("#helsModal").on("click", function(e){
                      if(e.target.id == "helsModal"){
                        $(this).fadeOut(200);
                      }
                    });
                    $("#helsAddNote").on("click", function(){
                      $("#helsModal").fadeOut(200);
                      //helsNotes = $("#helsNote").val();
                      for(let i = -1; i < helsNotes.length; i++){
                        if(i > -1 && helsNotes[i].url == window.location.href){
                          helsNotes[i].notes.push($("#helsNote").val());
                          break;
                        }
                        if(i + 1 == helsNotes.length){
                          helsNotes.push({url: window.location.href, notes: [$("#helsNote").val()]});
                          break;
                        }
                      } 
                      $("#helsNote").val("");
                      //chrome.storage.sync.set({"notes": JSON.stringify(helsNotes)});
                      window.localStorage.helsNotes = JSON.stringify(helsNotes);
                    });
                  }
                  $("#helsModal").css('display', 'flex').fadeIn(200);
                  setTimeout(() => {
                    $("body").click();
                    $("#helsNote").focus();
                  }, 500);
                `});
            });
                
          });
  });
} catch(err){console.log(err)}

const buttonStyles = `line-height: 1.5; cursor:pointer; border-radius: .2rem; display: inline-block; font-weight: 400; color: #212529; text-align: center; vertical-align: middle; border: 1px solid transparent; color: #343a40; background-color: #fff; border-color: #343a40; padding: 6px 22px; margin-top:8px; font-size: 16px; border-radius: .25rem; transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out; text-decoration: none; `;

const modal = `
  <div id=helsModal style="z-index: 9999999; width: 100%; height: 100%; top:0; left:0; display:flex; align-items: center; justify-content: center; position: fixed; background: rgba(0,0,0,0.3);">
    <div id=helsModalDiv style="width:40%; box-shadow: 0px 0px 3px 0px rgba(0,0,0,0.6); border-radius: 6px; background: white; padding:20px;">
      <h2>New Note</h2>
      <textarea id=helsNote style="border-radius: 4px; width:100%; box-sizing:border-box; padding:10px; height:150px;"></textarea>
      <button style="${buttonStyles}" id=helsAddNote>OK</button>
    </div>
  </div>`;

