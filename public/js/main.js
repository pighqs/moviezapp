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

    var likeIfNotLog = document.querySelectorAll(".pleaseLog");
    for (var i = 0; i < likeIfNotLog.length; i++) {
        likeIfNotLog[i].addEventListener("mouseover", function(event) {
            // met en surbrillance la cible de mouseover
            console.log(this.children[0].classList.value = "fa fa-sign-in");
        });

    }
}