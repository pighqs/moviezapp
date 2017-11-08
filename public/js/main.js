window.onload = function() {
    console.log("main js OK");


    var buttonSearch = document.querySelector(".search-btn");
    buttonSearch.addEventListener('click', function(e) {
        var searchInputVal = document.getElementById("search").value;
        console.log(searchInputVal);
        if (searchInputVal == "" || searchInputVal == undefined) {
            e.preventDefault();
        }
    }, false);
}