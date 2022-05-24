chrome.storage.sync.get("borders", function(data){
    document.querySelector("#borders").checked = data.borders;
});
chrome.storage.sync.get("saveScroll", function(data){
    document.querySelector("#saveScroll").checked = data.saveScroll;
});
chrome.storage.sync.get("notesUrlCheck", function(data){
    document.querySelector("#notesUrlCheck").checked = data.notesUrlCheck;
});

document.querySelector("#borders").addEventListener("change", function(){
    chrome.storage.sync.set({borders: this.checked});
});
document.querySelector("#saveScroll").addEventListener("change", function(){
    chrome.storage.sync.set({saveScroll: this.checked});
});
document.querySelector("#notesUrlCheck").addEventListener("change", function(){
    chrome.storage.sync.set({notesUrlCheck: this.checked});
});