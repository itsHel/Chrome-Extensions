$(function(){

//Remover                       Ctrl + Alt + z to show element again
    // Cursor
    let cursorStyle = document.createElement('style');
    cursorStyle.type = 'text/css';
    cursorStyle.innerHTML = '.not-allowed-cursor *{ cursor: not-allowed; }';
    $('head').append(cursorStyle);

    // Borders
    let borderStyle = document.createElement('style');
    borderStyle.type = 'text/css';
    borderStyle.innerHTML = '.not-allowed-border *:hover{ border: 1px dotted rgba(255, 0, 0, 0.5); }';
    $('head').append(borderStyle);

    let hAltDown = false;
    let hCtrlDown = false;
    let hFaded;
    $(document).on("keydown", function(e){
        if(e.key == "Alt")
            hAltDown = true;
        if(e.key == "Control")
            hCtrlDown = true;
        
        if(hAltDown && hCtrlDown){
            if(e.key == "z"){
                hFaded.fadeIn();
                return;
            }
            $("body").addClass("not-allowed-cursor");
            $("body").addClass("not-allowed-border");
        }
        
    });
    $(document).on("keyup", function(e){
        if(e.key == "Alt")
            hAltDown = false;
        if(e.key == "Control")
            hCtrlDown = false;
        if(($("body").hasClass("not-allowed-cursor") && (!hAltDown || !hCtrlDown))){
            $("body").removeClass("not-allowed-cursor");
            $("body").removeClass("not-allowed-border");
        }
    });

    $(document).on("click", function(e){
        if(!hAltDown || !hCtrlDown)
            return;
        if(e.target.tagName.toLocaleLowerCase() == "html" || e.target.tagName.toLocaleLowerCase() == "body")
            return;
        e.preventDefault();
        hFaded = $(e.target);
        hFaded.fadeOut();
    });

    console.log("Remover loaded 1.0.2");
});