/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

"use strict";

var onLogin;
var onLogout;
var loggedIn = false;
var autoLoginData = null;
var localSettings;
var onSettingsLoad;
var me;
var errorList;
var lineHight;

const settingsKey = "settings";

function logKeyPress(e, formID) {
    if (e.keyCode == 13) {
        if(schoolChange.isFullSchool === true)
            login(formID);
    } else {
        if(e.keyCode == 27)
            closeWindows();
        schoolChange.isFullSchool = false;
    }
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    $("#appInstall").css("display", "block");
});

function install() {
    if (deferredPrompt == null) {
        new Toast("Nicht unterstützt", 1.5).show();
        return;
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice
        .then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
                $("#appInstall").css("display", "none");
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
        });
}

function toggleSideNav(expand = null) {
    const speed = 75;
    var nav = $("#mainSideBar");
    var closer = $("#sideNavClose");
    nav.css("display", "block");
    if(toggleSideNav.expanded == null) toggleSideNav.expanded = false;
    if ((!toggleSideNav.expanded && expand == null) || (expand != null && expand && !toggleSideNav.expanded)) { //Ausfahren
        nav.css("right", (0 - nav.outerWidth()));
        nav.animate({
            right: 0
        }, speed, "swing");
        closer.removeClass("inv");
        $("#sideNavButton>input").prop("checked", true)
        toggleSideNav.expanded = true;
    }
    else if ((toggleSideNav.expanded > 0 && expand == null) || (expand != null && !expand && toggleSideNav.expanded)) {
        nav.css("right", 0); //Einfahren
        closer.addClass("inv");
        nav.animate({
            right: (0 - nav.outerWidth())
        }, speed, "swing", function () {
            nav.css("display", "none");
        });
        $("#sideNavButton>input").prop("checked", false)
        toggleSideNav.expanded = false;
    }
}

//Gets called from php
function autoLogin(meData) {
    /*$.ajax({
        url: "/sq/?x=l", 
        method: "POST", 
        success: function(data) {
            if(data == "1") {*/
                autoLoginData = meData;
            /*}
        }
    });*/
}

function loginInit(meData = null, isJSON = false, attempts = 0) {
    if(attempts == null || isNaN(attempts) || typeof(attempts) !== "number") {
        attempts = 0;
    }

    if(meData == "NoAcc") {
        cacheToClient("meData", null)
        location.href = location.protocol+"//"+location.hostname+"/secret/?secret=thatsAnError"
    }
    
    try {
        if(meData == "AlreadyLoggedIn") {
            cacheFromClient("meData", function (data) {
                loginInit(data, false);
            }, function() {
                loginInit();
            });
            return;
        }

        if(meData == null || meData == "undefined" || meData.length == 0) {
            WebUntis.whoAmI(function (meNewData) {
                loginInit(meNewData);
            }, undefined, function(error) {
                if(error.code == "#error007")
                    resetLogin();
                if(error.code == "#warning001")
                    loginInit("NoAcc")
                else if(attempts == 3) {
                    new Toast("Einloggen nach 3 Versuchen nicht möglich", 3);
                    resetLogin();
                }
                else {
                    attempts++;
                    loginInit(null, false, attempts);
                }
                resetLogin();
            }, false);
            return;
        }

        cacheToClient("meData", typeof(meData)==="string"?meData:JSON.stringify(meData), 365)

        if(meData.startsWith("school:")) {
            me = {};
            me.school = meData.replace("school: ", "");
            console.log("Logged in as: Anonym");
        } else { //School with student accounts
            
            if(isJSON === true) {
                me = meData.data;
                if(meData.adminName)me.adminName=meData.adminName;
                if(me == null) {
                    new Toast("Ein Fehler ist beim Login aufgetreten", 2).show();
                    console.warn("meData == null")
                    resetLogin();
                    return;
                }
            } else {
                try {
                    meData = safeJSONParse(meData);
                    if(meData == null || meData.data == null) {
                        new Toast("Ein Fehler ist beim Login aufgetreten", 2).show();
                        console.warn("meData == null")
                        resetLogin();
                        return;
                    }
                    me = meData.data;
                    if(meData.adminName)me.adminName=meData.adminName;
                    me.stid = me.loginServiceConfig.user.personId;
                } catch (e) {
                    new Toast("Ein Fehler ist beim Login aufgetreten", 2).show();
                    console.warn("Error could not parse me data. Data:");
                    console.log(meData);
                    resetLogin();
                    return;
                }
            }

            console.log("Logged in as: " + me.loginServiceConfig.user.name + " ID: " + me.stid);
        }

        var userName = me.loginServiceConfig?me.loginServiceConfig.user.name:null;
        if (userName == "" || userName == null || userName == undefined) {
            userName = "Anonym"; //No Account
            if(me.loginServiceConfig)
                me.loginServiceConfig.user.name = userName;
        }


        me.userName = userName;
        me.stid = me.stid || -1;
        me.school = me.mandantName || me.school;
        if(!me.school) {
            console.warn("Schule nicht gegeben")
            resetLogin();
            return;
        }
        
        console.log("Me:");
        console.log(me.loginServiceConfig?me.loginServiceConfig:me);
        
        loggedIn = true;
        try {
            if (onLogin != null)
                if (onLogin() != true) {
                    resetLogin();
                    return;
                }
        } catch (e) {
            console.warn("Fehler bei der onLogin methode!");
            console.warn(e);
            new Toast("Initialisierungs-Fehler", 1).show();
            resetLogin();
            return;
        }

        var userBtn = $("#userBtn");
        if (isMobile && userName.toLowerCase() != "mut18277" && userName.toLowerCase() != "may18260") {
            hijackConsole(true); //Enable html console
        }

        if(navigator.onLine) {
            if(userName != "Anonym"){
                    if(me.adminName)userBtn.text(me.adminName.toUpperCase());
                    else
                    userBtn.text(userName.toUpperCase());
                }
            else
                userBtn.text("ABMELDEN");
            /*Muss .attr sein*/
            userBtn.attr("onclick", "showAccount();");
        } else {
            userBtn.text("OFFLINE");
            userBtn.attr("onclick", "location.reload()");
        }
        $("#loginBtn").attr("disabled", false);
        login.disabled = false;

        if (forceLogin.set == true) {
            toggleLoginEnforcer(null);
        }

        if(loginInit.isNewLogin) {
            new Toast("Erfolgreich Eingeloggt", 2).show();
            loginInit.isNewLogin = false;
        }
        
        //closeWindows als letztes!
        closeWindows();
    } catch (e) {
        console.warn(e);
        resetLogin();
    }
}

function showAccount() {
    logout();
}

function resetLogin() {
    var userBtn = $("#userBtn");
    userBtn.text("ANMELDEN");
    /*Muss .attr sein*/
    userBtn.attr("onclick", "openLoginPopup()");
    $("#loginBtn").attr("disabled", false);
    $("#loginLoader").css("visibility", "hidden");
    login.disabled = false;
    if (forceLogin.set == true)
        toggleLoginEnforcer("Wir können dir diese Seite nicht zeigen wenn du nicht angemeldet bist.");
}

function logout() {
    WebUntis.logout(function () {
        console.log("logout successfull!");
        loggedIn = false;
        resetLogin();
        if (onLogout != null)
            onLogout();
    }, "Erfolgreich ausgeloggt");
}

function fakeLogout() {
    loggedIn = false;
    resetLogin();
    if (onLogout != null)
        onLogout();
}

function login() {
    if(login.disabled == true)
        return;
    try {
        if ($('#loginForm')[0].checkValidity()) {
            login.disabled = true;
            $("#loginBtn").prop("disabled", true);
            $("#loginLoader").css("visibility", "visible");
            var school = $("#school").val();
            var username = $("#username").val();
            var password = $("#password").val();
            var rememberMe = $("#rememberMe").prop("checked");
            loginInit.isNewLogin = true;
            WebUntis.login(username, password, school, rememberMe, loginInit, undefined, resetLogin);
        } else {
            $('#' + formID)[0].reportValidity();
        }
    } catch (e) {
        console.warn(e);
        resetLogin();
    }
    return;
}

function forceLogin() {
    if (loggedIn || forceLogin.set || autoLoginData != null) return;
    forceLogin.set = true;
    $(document).ready(function () {
        if (loggedIn || autoLoginData != null) return;
        toggleLoginEnforcer("Wir können dir diese Seite nicht zeigen wenn du nicht angemeldet bist.");
    });
}

function toggleLoginEnforcer(value) {
    if (value !=null) {
        $("#fLMessage").text(value);
        $("#forceLogin").css("display", "block");
        $("#outerWrapper").css("filter", "blur(3px)");
    } else  {
        $("#forceLogin").css("display", "none");
        $("#outerWrapper").css("filter", "");
    }
}

onLoad(function () {
    
    $('#loginForm').bind('submit', $('form'), function(event) {
        var form = this;
        event.preventDefault();
        event.stopPropagation();

        form.submitted = true;
        login();
        form.submitted = false;
    });

    agbCheck();

    if (autoLoginData != null)
        loginInit(autoLoginData);
    else
        correctLoginState();

    calcLineHeight();
    initScroll();
    loadSettings();
    loadNext();
});

function correctLoginState() {
    $.ajax({
        url: "/sq/?x=l", 
        method: "POST", 
        success: function(data) {
            if(data == "1" && loggedIn == false) {
                loginInit();
            } else if(data == "0" && loggedIn == true) {
                new Toast("Session Abgelaufen").show();
                logout();
            }
        }
    });
}

function agbCheck() {
    if(localStorage.getItem("agb") != "true") {
        agbCheck.complete = function() {
            $("#agbCheck").css("display", "none");
            localStorage.setItem("agb", "true");
        }
        $("#agbCheck").css("display", "block");
    }
}

function loadSettings() {
    localSettings = localStorage.getItem(settingsKey);
    if (localSettings == "undefined" || localSettings == null)
        localSettings = {};
    else
        localSettings = JSON.parse(localSettings);

    $.each(globalSettings.settings, function (k, gs) {
        var ls = localSettings[k];
        if (ls != null) {
            gs.value = ls;
        }
    });

    /*
    var keys = Object.keys(globalSettings);
    $.each(keys, function (i, k) {
        var ls = localSettings[k];
        var gs = globalSettings[k];
        if (ls != null) {
            gs.value = ls;
        } else {
            gs.value = gs.default;
        }

        if (gs.apply != null && gs.apply != "onload") return true;
        if (gs.target != null) {
            var target = $(gs.target);
            if (target != null) {
                target.css(gs.targetValue, gs.value);
            }
        }
        if (gs.action != null) {
            var value = gs.value;
            var kay = gs.name;
            var def = gs.default;
            eval(gs.action);
        }
    });*/

    console.log("loaded settings: " + JSON.stringify(localSettings));

    if (onSettingsLoad != null)
        onSettingsLoad();
}

function calcLineHeight() {
    if (calcLineHeight.set == true) return;
    var line = $("<span>M</span>");
    line.attr("style", "line-height: normal !important;"+
        "display: inline !important;"+
        "font: initial !important;"+
        "padding: initial !important;"+
        "margin: initial !important;"+
        "border: initial !important;"
    );
    $("body").append(line);
    lineHeight = line[0].offsetHeight;
    line.remove();
    calcLineHeight.set = true;
}

function initScroll(elemToInit = null) {
    if (isTouch) {
        return;
    }

    if(!initScroll.onwheel)
        initScroll.onwheel = function (event) {
            var elem = event.currentTarget;
            //shift + scroll || extra scroll hardware
            if (event.shiftKey || event.deltaX) {
                let deltaX = event.deltaX || event.deltaY;
                if (event.deltaMode == 1) {
                    deltaX *= lineHeight;
                } else if (event.deltaMode == 2) {
                    deltaX = elem.clientWidth;
                }
                //console.log("x: "+deltaX);
                window.totalDeltaX += deltaX;
                //console.log("Side Scroll speed: "+(window.totalDeltaX/Math.log((Math.abs(window.totalDeltaX)+30)/30)*15)) + " px/ms";
                if (window.totalDeltaX != 0) {
                    $(elem).stop();
                    let startScroll = elem.scrollLeft;
                    let startTotalDelta = window.totalDeltaX;
                    $(elem).animate({
                        scrollLeft: elem.scrollLeft + window.totalDeltaX
                    }, {
                        duration: Math.log((Math.abs(window.totalDeltaX)+30)/30)*15,
                        easing: "linear",
                        always: function (animation, jumpedToEnd) {
                            if(startTotalDelta == 0) return;
                            window.totalDeltaX -= elem.scrollLeft - startScroll;
                            //console.log(window.totalDeltaX +"-="+ elem.scrollLeft+"-"+startScroll);
                            //console.log(elem.scrollLeft +" <= 0 && "+window.totalDeltaX + " < 0");
                            if (elem.scrollLeft <= 0 && window.totalDeltaX < 0)
                                window.totalDeltaX = 0;
                            //console.log(elem.scrollLeft +" >= "+ (elem.scrollWidth-elem.clientWidth) +" && "+ window.totalDeltaX +" > 0");
                            if (elem.scrollLeft >= elem.scrollWidth - elem.clientWidth && window.totalDeltaX > 0)
                                window.totalDeltaX = 0;
                            //console.log("tx2: "+window.totalDeltaX);
                        }
                    });
                }
                //console.log("tx1: "+window.totalDeltaX);
            }

            if(event.deltaY && !event.shiftKey) {
                let deltaY = event.deltaY;
                if (event.deltaMode == 1) {
                    deltaY *= lineHeight;
                } else if (event.deltaMode == 2) {
                    deltaY = elem.clientHeight;
                }
                //console.log("y: "+deltaY);
                window.totalDeltaY += deltaY;
                //console.log("Scroll speed: "+(window.totalDeltaY/Math.log((Math.abs(window.totalDeltaY)+30)/30)*15)) + " px/ms";
                if (window.totalDeltaY != 0) {
                    $(elem).stop();
                    let startScroll = elem.scrollTop;
                    let startTotalDelta = window.totalDeltaY;
                    $(elem).animate({
                        scrollTop: elem.scrollTop + window.totalDeltaY
                    }, {
                        duration: Math.log((Math.abs(window.totalDeltaY)+30)/30)*15,
                        easing: "linear",
                        always: function (animation, jumpedToEnd) {
                            //if(startTotalDelta == 0) return;
                            window.totalDeltaY -= elem.scrollTop - startScroll;
                            //console.log(window.totalDeltaY +"-="+ elem.scrollTop+"-"+startScroll);
                            //console.log(elem.scrollTop +" <= 0 && "+window.totalDeltaY + " < 0");
                            if (elem.scrollTop <= 0 && window.totalDeltaY < 0)
                                window.totalDeltaY = 0;
                            //console.log(elem.scrollTop +" >= "+ (elem.scrollHeight-elem.clientHeight) +" && "+ window.totalDeltaY +" > 0");
                            if (elem.scrollTop >= elem.scrollHeight - elem.clientHeight && window.totalDeltaY > 0)
                                window.totalDeltaY = 0;
                            //console.log("ty2: "+window.totalDeltaY);
                        }
                    });
                }
                //console.log("ty1: "+window.totalDeltaY);
            }
            //event.preventDefault();
        };

    if(elemToInit != null) {
        $(elemToInit).css("overflow", "hidden");
        elemToInit.addEventListener("wheel", initScroll.onwheel, {passive: true});
        return;
    }

    window.totalDeltaX = 0;
    window.totalDeltaY = 0;

    $(".scrollView").each(function (index, elem) {
        $(elem).css("overflow", "hidden");
        elem.addEventListener("wheel", initScroll.onwheel, {passive: true});
    });
}

function schoolInput(event) {
    if (event.currentTarget.value.length >= 3) {
        $.ajax({
            url: "/PHP/ajax.php",
            type: "post",
            data: "type=get&getType=findSchools&string=" + encodeURIComponent(event.currentTarget.value),
            success: schoolOutput,
            error: function (xhr) {
                var error = getError(xhr.responseText);
                console.warn(error.console);
            }
        });
    }
}

function schoolOutput(answer) {
    var box = document.getElementById("schoolSuggestionBox");
    box.innerHTML = "<option value=''></option>";
    var json = JSON.parse(answer);
    if (json.result == null || json.result.schools == null || json.result.schools.length == 0) return;

    if (document.getElementById("school").value == json.result.schools[0].displayName + " (" + json.result.schools[0].loginName + ")") return;
    for (let i = 0; i < json.result.schools.length; i++) {
        var listItem = document.createElement("OPTION");
        listItem.innerHTML = json.result.schools[i].displayName + " (" + json.result.schools[i].loginName + ")";
        box.appendChild(listItem);
    }
}

function schoolChangeCorrection(answer) {
    if (schoolOutput.dontReplace == true) {
        schoolOutput.dontReplace = false;
        return;
    }
    if (document.getElementById("school").value == "admin") return;
    schoolOutput.dontReplace = false;

    var json = JSON.parse(answer);
    if (json.result == null || json.result.schools == null || json.result.schools.length == 0) return;
    schoolChange.isFullSchool = true;
    document.getElementById("school").value = json.result.schools[0].displayName + " (" + json.result.schools[0].loginName + ")";
}

function schoolChange(event) {
    schoolChange.isFullSchool = false;
    if (event.currentTarget.value.length >= 3) {
        $.ajax({
            url: "/PHP/ajax.php",
            type: "post",
            data: "type=get&getType=findSchools&string=" + encodeURIComponent(event.currentTarget.value),
            success: schoolChangeCorrection,
            error: function (xhr) {
                var error = getError(xhr.responseText);
                console.warn(error.console);
            }
        });
    } else {
        event.currentTarget.value = "";
    }
}
