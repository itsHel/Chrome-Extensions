$(function(){
  chrome.storage.sync.get('borders', function(data){
    $("#borders").attr("checked", data.borders);
  });
  chrome.storage.sync.get('saveScroll', function(data){
    $("#saveScroll").attr("checked", data.saveScroll);
  });
  chrome.storage.sync.get('notesUrlCheck', function(data){
    $("#notesUrlCheck").attr("checked", data.notesUrlCheck);
  });

  $("#borders").on("change", function(){
    chrome.storage.sync.set({borders: this.checked});
  });
  $("#saveScroll").on("change", function(){
    chrome.storage.sync.set({saveScroll: this.checked});
  });
  $("#notesUrlCheck").on("change", function(){
    chrome.storage.sync.set({notesUrlCheck: this.checked});
  });
});