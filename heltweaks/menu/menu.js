const $ = document.querySelector.bind(document);

window.addEventListener("load", function(){
  chrome.storage.sync.get('borders', function(data){
    $("#borders").setAttribute("checked", data.borders);
  });
  chrome.storage.sync.get('saveScroll', function(data){
    $("#saveScroll").setAttribute("checked", data.saveScroll);
  });
  chrome.storage.sync.get('notesUrlCheck', function(data){
    $("#notesUrlCheck").setAttribute("checked", data.notesUrlCheck);
  });

  $("#borders").addEventListener("change", function(){
    chrome.storage.sync.set({borders: this.checked});
  });
  $("#saveScroll").addEventListener("change", function(){
    chrome.storage.sync.set({saveScroll: this.checked});
  });
  $("#notesUrlCheck").addEventListener("change", function(){
    chrome.storage.sync.set({notesUrlCheck: this.checked});
  });
});