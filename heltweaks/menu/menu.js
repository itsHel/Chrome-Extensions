$(function(){
  chrome.storage.sync.get('borders', function(data) {
    //changeColor.style.backgroundColor = data.borders;
    console.log(data.borders);
    $("#borders").attr("checked", data.borders);
  });

  $("#borders").on("change", function(){
    chrome.storage.sync.set({borders: this.checked});
  });

});