window.onload = function() {
    console.log("main js OK");
    $(".fa-heart").each(function(index) {
        // desactive click une fois que le film est liké
        $(this).parent().click(function() {
            return false
        });
    });

    var loupe = document.querySelector(".fa-search");

    loupe.addEventListener('click', function(e) {
        console.log("je suis dans le click");
        var searchInputVal = document.getElementById("search").value;
        console.log(searchInputVal);
        if (searchInputVal == "" || searchInputVal == undefined) {
            e.preventDefault();
        }
    }, false);
}