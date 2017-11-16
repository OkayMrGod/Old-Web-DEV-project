/* Determine if the lbs field has a value arleady in it so it can pre-check that
value in the edit screen */
(function checkRadio() {
    var lbs = document.getElementById("hid").value;
    var radio = document.getElementsByName("lbs");
    if (lbs == 1) {
        radio[0].checked = true;
    }
    if (lbs === '0') {
        radio[1].checked = true;
    }
})();
