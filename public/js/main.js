window.onload = function() {
    console.log("main js OK");
    $(".fa-heart").each(function(index) {
        // desactive click une fois que le film est liké
        $(this).parent().click(function() {
            return false
        });
    });
}