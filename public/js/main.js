window.onload = function() {
    console.log("main js OK");
    var active = $(".current-menu-item");
    console.log(active);
    $(active).addClass("current-menu-item");
    $(".menu-item").each(function(index) {
        $(this).click(function() {
            $(active).removeClass("current-menu-item");
            $(this).addClass("current-menu-item");
            active = $(this);
        });
    });

    var buttonSearch = document.querySelector(".search-btn");
    buttonSearch.addEventListener('click', function(e) {
        var searchInputVal = document.getElementById("search").value;
        console.log(searchInputVal);
        if (searchInputVal == "" || searchInputVal == undefined) {
            e.preventDefault();
        }
    }, false);
}