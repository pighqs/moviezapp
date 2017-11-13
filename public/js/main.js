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
            this.children[0].classList.value = "fa fa-sign-in";
        });
        likeIfNotLog[i].addEventListener("mouseout", function(event) {
            // met en surbrillance la cible de mouseover
            this.children[0].classList.value = "fa fa-heart-o";
        });
    }

    //////////// STRIPE (PAIEMENT) /////////////
    var handler = StripeCheckout.configure({
        key: 'pk_test_jgs8oU31vZyptK58OorgY48E',
        image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
        locale: 'auto',
        billingAddress: true,
        token: function(token, arg) {
            console.log(token);
            console.log(arg);
            $.post('/pay', { stripeToken: token.id, stripeEmail: token.email, titleMovie }, function(data, textStatus) {
                console.log(data);
            });

        }
    });

    var titleMovie;

    var payBtns = document.querySelectorAll(".pay-btn");
    for (var i = 0; i < payBtns.length; i++) {
        payBtns[i].addEventListener('click', function(e) {
            titleMovie = this.getAttribute('data-title');
            // Ouvre formulaire de checkout avec ces options:
            handler.open({
                name: titleMovie,
                description: 'VOD Purchase',
                zipCode: true,
                currency: 'eur',
                amount: 500
            });
            e.preventDefault();
        });
    }

    // Close Checkout on page navigation:
    window.addEventListener('popstate', function() {
        handler.close();
    });

}