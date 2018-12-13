/*
 * Copyright ©2018
 * Written by:
 * Maximilian Mayrhofer
 * Wendelin Muth
 */

var isMobile;
var isTouch;
var toastQueue = new Array();
var loadQueue = new Array();
var serviceWorker;
var onPopState;
var onSWActivate;
var hash = window.location.hash || "#";
const CACHE_VERSION = "v1.1.1";

const monthNames = ["Jänner", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
];
/*Die Woche bei der Date.getDay() Methode startet mit Sonntag*/
const dayNames = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

Date.prototype.monthDays = function () {
    var d = new Date(this.getFullYear(), this.getMonth() + 1, 0);
    return d.getDate();
}

const DateDiff = {

    inMinutes: function (d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();

        return parseInt((t2 - t1) / (60 * 1000));
    },
    inHours: function (d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();

        return parseInt((t2 - t1) / (3600 * 1000));
    },
    inDays: function (d1, d2) {
        d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
        d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
        var t2 = d2.getTime();
        var t1 = d1.getTime();
        var diff = t2 - t1;
        return Math.abs(Math.floor(diff / 1000 / 60 / 60 / 24));
    },
    inDHMS: function (d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();
        var diff = new Date(0, 0, 0, 0, 0, 0, 0);
        diff.setMilliseconds(t2 - t1);
        return diff;
    }
}

const DateFormat = {
    inCountDown: function(ms) {
        if(typeof(ms) !== "number") return ms;
        var h = Math.floor(ms / 3600000);
        ms -= h * 3600000;
        var m = Math.floor(ms / 60000);
        ms -= m * 60000;
        var s = Math.floor(ms / 1000);
        val = "";
        if (h > 0) {
            val += h + " Stunden "
        }

        if (h + m > 0) {
            val += m + " Minuten "
        }

        val += s + " Sekunden"
        return val;
    },
    inHH: function (d) {
        return ("0" + d.getHours()).slice(-2);
    },
    inss: function (d) {
        return ("0" + d.getSeconds()).slice(-2);
    },
    inmm: function (d) {
        return ("0" + d.getMinutes()).slice(-2);
    },
    inMM: function (d) {
        return ("0" + (d.getMonth() + 1)).slice(-2);
    },
    inDD: function (d) {
        return ("0" + (d.getDate())).slice(-2);
    },
    inHHMM: function (d, seperator = ":") {
        var h = DateFormat.inHH(d);
        var m = DateFormat.inmm(d);
        return h + seperator + m;
    },
    inHHMMSS: function (d) {
        var h = DateFormat.inHH(d);
        var m = DateFormat.inmm(d);
        var s = DateFormat.inss(d);
        return h + ":" + m + ":" + s;
    },
    inUntisTime: function (d) {
        return parseInt(DateFormat.inHHMM(d, ""))
    },
    toDate: function (millis) {
        return new Date(0, 0, 0, Math.round(millis / 1000.0 / 60 / 60), Math.round(millis / 1000.0 / 60) % 60);
    },
    toMonday: function (d) {
        var day = d.getDay() || 7;
        var newDate = new Date(d);
        if (day !== 1)
            newDate.setHours(-24 * (day - 1));
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);
        return newDate;
    },
    toFullDay: function(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    },
    inYYYYMMDD: function (d, sperator = "") {
        return d.getFullYear() + sperator + this.inMM(d) + sperator + this.inDD(d);
    },
    inDDMMYYYY: function (d, sperator = "") {
        return this.inDD(d) + sperator + this.inMM(d) + sperator + d.getFullYear();
    },
    inYYYYMMDDHHMM: function (d, seperator = "") {
        return DateFormat.inYYYYMMDD(d, seperator) + " " + DateFormat.inHHMM(d);
    },
    inDDMMYYYYHHMM: function (d, seperator = "") {
        return DateFormat.inDDMMYYYY(d, seperator) + " " + DateFormat.inHHMM(d);
    },
    inDDDDMM: function (d) {
        return DateFormat.getDayName(d).slice(0, 2) + "., "
            + d.getDate() + ". " + (d.getMonth() + 1) + ".";
    },
    fromYYYYMMDD: function (dstr) {
        if (dstr == null || dstr == "") return;
        dstr = dstr.toString().replace(/\D/g, "");
        if (dstr == "") return;
        var d = new Date(0,0,0,0,0,0,0);
        d.setFullYear(parseInt(dstr.substr(0, 4)));
        d.setDate(parseInt(dstr.substr(6, 2)));
        var m = parseInt(dstr.substr(4, 2)) - 1;
        d.setMonth(m);
        return d;
    },
    fromYYYYMMDDHHMM: function (dstr) {
        if (dstr == null || dstr == "") return;
        dstr = dstr.toString().replace(/\D/g, "");
        if (dstr == "") return;
        var d = new Date(0,0,0,0,0,0,0);
        d.setFullYear(parseInt(dstr.substr(0, 4)));
        d.setDate(parseInt(dstr.substr(6, 2)));
        var m = parseInt(dstr.substr(4, 2)) - 1;
        d.setMonth(m);
        var h = parseInt(dstr.substr(8, 2));
        d.setHours(h)
        var min = parseInt(dstr.substr(10, 2));
        d.setMinutes(min)
        return d;
    },
    fromUntisTime: function (dstr) {
        dstr = dstr.toString();
        return new Date(0, 0, 0, dstr.slice(0, -2), dstr.slice(-2), 0, 0);
    },
    fromHHMM: function(dstr) {
        dstr = dstr.toString().replace(/\D/g, "");
        return new Date(0, 0, 0, dstr.slice(0, -2), dstr.slice(-2), 0, 0)
    },
    fromMS: function(ms) {
        var date = new Date(0,0,0,0,0,0,0);
        date.setMilliseconds(ms);
        return date;
    },
    getMonthName: function (d) {
        return monthNames[d.getMonth()];
    },
    getDayName: function (d) {
        return dayNames[d.getDay()];
    }
}

const WebUntis = {
    CB_SCHOOL_AND_UN: 0,
    CB_SCHOOL: 1,
    CB_NONE: 2,
    ajax: function (type, params = null, onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = 0) {
        var data = "";
        if (params != null) {
            for (let i = 0; i < params.length; i += 2) {
                var paramName = params[i];
                var paramValue = params[i + 1];
                if (paramName == "") continue;
                var comp = "&" + paramName + "=" + encodeURIComponent(paramValue);
                data += comp;

                if (WebUntis.ajax.store && type == "get") {
                    if (paramName == "getType") {
                        if (WebUntis.ajax.gets == null) {
                            WebUntis.ajax.gets = comp;
                        } else {
                            WebUntis.ajax.gets += "," + paramValue;
                        }
                    } else {
                        if (WebUntis.ajax.vals == null) {
                            WebUntis.ajax.vals = comp;
                        } else {
                            WebUntis.ajax.vals += comp;
                        }
                    }
                }
            }
        }

        if (WebUntis.ajax.store && !WebUntis.ajax.release)
            return;
        else if (WebUntis.ajax.release) {
            data = WebUntis.ajax.gets + (WebUntis.ajax.vals == null ? "" : WebUntis.ajax.vals);
            WebUntis.ajax.release = false;
            WebUntis.ajax.store = false;
            successMsg = WebUntis.ajax.success.msg;
            onSuccess = WebUntis.ajax.success.func;
            onError = WebUntis.ajax.error;
            cache = WebUntis.ajax.cache;
            cacheBuster = WebUntis.ajax.cb;
            WebUntis.ajax.gets = null;
            WebUntis.ajax.vals = null;
        }

        data = "type=" + type + data;

        if (!cache)
            cacheBuster = WebUntis.CB_NONE;

        var cacheBusterString = "";
        if (cacheBuster == WebUntis.CB_SCHOOL_AND_UN) {
            if (me == null || me.school == null || me.userName == null) {
                console.warn("me or me.school or me.userName is null");
            } else {
                for (var i = 0; i < Math.max(me.school.length, me.userName.length); i++) {
                    var charCodeSchool = me.school.charCodeAt(i);
                    if (isNaN(charCodeSchool)) charCodeSchool = 0;
                    var charCodeUN = me.userName.charCodeAt(i);
                    if (isNaN(charCodeUN)) charCodeUN = 0;
                    cacheBusterString += String.fromCharCode((charCodeSchool + charCodeUN) % 92 + 33);
                }
            }
        } else if (cacheBuster == WebUntis.CB_SCHOOL) {
            if (me == null || me.school == null) {
                console.warn("me or me.school is null");
            }
            cacheBusterString = me.school;
        } else if (typeof cacheBuster === "string") {
            cacheBusterString = cacheBuster;
        }

        if (cacheBusterString != "")
            data += "&_=" + encodeURIComponent(cacheBusterString);

        let raceStartTime = Date.now();
        let raceWinner = null;
        Promise.resolve().then(function() {
            if (cache) {
                console.log("Ajax (id: "+id+"): Cache started race after "+(Date.now()-raceStartTime)+"ms");
                cacheFromClient("ajaxRequest-" + data, function (data, name) {
                    console.log("Loaded cahed version of " + name);
                    if(raceWinner == "ajax") {
                        console.log("Ajax (id: "+id+"): Ajax won the race")
                        return;
                    }
                    console.log("Ajax (id: "+id+"): Cache finished race after "+(Date.now()-raceStartTime)+"ms");
                    raceWinner = "cache";
                    if (onSuccess != null)
                        onSuccess(data.indexOf("[᚜#~SPLITTER~#᚛]") !== -1 ? data.split("[᚜#~SPLITTER~#᚛]") : data);
                }, function () {
                    if(raceWinner == "ajax") {
                        console.log("Ajax (id: "+id+"): Ajax won the race")
                        return;
                    }
                    if (onError != null)
                        onError(null, false);
                });
            }
        });

        if (WebUntis.ajaxID == null)
            WebUntis.ajaxID = 0;
        let id = WebUntis.ajaxID;
        WebUntis.ajaxID += 1;
        console.log("Making ajax request (id: " + id + "), type: " + type + ", sending Data: " + data.replace(/(password=)[^&]*/gi, "$1****"));
        console.log("Ajax (id: "+id+"): Ajax started race after "+(Date.now()-raceStartTime)+"ms");
        return $.ajax({
            url: "/PHP/ajax.php",
            data: data,
            dataType: 'text',
            type: 'post',
            success: function (rawData, textStatus, xhr) {
                if(raceWinner == "cache") {
                    console.log("Ajax (id: "+id+"): Cache won the race")
                } else raceWinner = "ajax";
                console.log("Ajax (id: "+id+"): Ajax finished race after "+(Date.now()-raceStartTime)+"ms");
                console.log("Ajax (id: " + id + ") successfull. Response: " + xhr.responseText.toString().substring(0, 100) + "( ... )");
                if (cache) {
                    cacheToClient("ajaxRequest-" + data, rawData, 1);
                }
                if (onSuccess != null)
                    onSuccess(rawData.indexOf("[᚜#~SPLITTER~#᚛]") !== -1 ? rawData.split("[᚜#~SPLITTER~#᚛]") : rawData, textStatus, xhr, data);
                if (successMsg != null)
                    new Toast(successMsg, 2).show();
            },
            error: function (xhr, textStatus, errorThrown) {
                var responseTexts = xhr.responseText.indexOf("[᚜#~SPLITTER~#᚛]") !== -1 ? xhr.responseText.split("[᚜#~SPLITTER~#᚛]") : [xhr.responseText]
                if(raceWinner == "cache") {
                    console.log("Ajax (id: "+id+"): Cache won the race")
                }
                for(var i = 0; i < responseTexts.length; i++)
                    console.warn("Ajax (id: " + id + ") unsuccessfull! " + errorThrown + ": " + responseTexts[i]);
                if (errorThrown == "abort") {
                    console.log("Ajax (id: " + id + ") was aborted");
                    return;
                } else if(xhr.status == 444 /*offline*/) {
                    console.warn("Ajax (id: "+id+"): Offline / Server not reachable");
                    new Toast("Server nicht erreichbar", 2).show();
                    if(onError) onError({console: "Offline", user: ""}, true);
                    return;
                }
                for(var i = 0; i < responseTexts.length; i++) {
                    var error = getError(responseTexts[i]);
                    console.warn(error.console);
                    new Toast(error.user, 2).show();
                    if (onError != null)
                        onError(error, true);
                    if (error.code == "#error003") {
                        fakeLogout();
                    } else if (error.code == "#error016") {
                        logout();
                    }
                }
            },
            complete: function (xhr, textStatus) {
                console.log("Ajax (id: " + id + ") completed. Status: " + textStatus);
            }
        });
    },
    login: function (username, password, school, remember = false, onSuccess = null, successMsg = null, onError = null, cacheBuster = null) {
        return WebUntis.ajax("login", ["username", username, "password", password, "school",
            school, "saveLogin", remember], onSuccess, successMsg, onError, false, cacheBuster || WebUntis.CB_NONE);
    },
    logout: function (onSuccess = null, successMsg = null, onError = null, cacheBuster = null) {
        return WebUntis.ajax("logout", null, onSuccess, successMsg, onError, false, cacheBuster || WebUntis.CB_NONE);
    },
    getTeachers: function (date = new Date(Date.now()), onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "teachers", "date", DateFormat.inYYYYMMDD(DateFormat.toMonday(date), "-")],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getSubjects: function (date = new Date(Date.now()), onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "subjects", "date", DateFormat.inYYYYMMDD(DateFormat.toMonday(date), "-")],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getRooms: function (date = new Date(Date.now()), buildingID = "", onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "rooms", "date", DateFormat.inYYYYMMDD(DateFormat.toMonday(date), "-"),
            "bdid", buildingID], onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getStudents: function (date = new Date(Date.now()), classID = "", onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "students", "date", DateFormat.inYYYYMMDD(DateFormat.toMonday(date), "-"),
            "classId", classID], onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getGroups: function (date = new Date(Date.now()), onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "classes", "date", DateFormat.inYYYYMMDD(DateFormat.toMonday(date), "-")],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    /*Type can be "teacher","class","subject","room" and "student"*/
    getTimegrid: function (type, date = new Date(Date.now()), id, onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", WebUntis.repeatType(type + "Timegrid", date), "date",
            WebUntis.joinDates(date, "-", true), "id", id], onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    whoAmI: function (onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "personalInfo"], onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL_AND_UN);
    },
    /*getGroupsAlt: function (onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "classes2"],
            onSuccess, successMsg, onError, cache, cacheBuster||WebUntis.CB_SCHOOL);
    },*/
    getInfo: function (onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "info"],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getMyClassId: function (onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "classid"],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL_AND_UN);
    },
    getNews: function (date = new Date(Date.now()), onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "news", "date", DateFormat.inYYYYMMDD(date, "")],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getAbsence: function (studentId, startDate, endDate, excuseStatus = "", onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "absence", "stid", studentId, "astartdate", DateFormat.inYYYYMMDD(startDate, ""), "aenddate", DateFormat.inYYYYMMDD(endDate, ""), excuseStatus == "" ? "" : "excusestatus", excuseStatus],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getRoles: function (startDate, endDate, onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "roles", "rstartdate", DateFormat.inYYYYMMDD(startDate, ""), "renddate", DateFormat.inYYYYMMDD(endDate, "")],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL_AND_UN);
    },
    getTimegridInfo: function (date, type,id, onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "timegridPeriodInfo", "date", DateFormat.inYYYYMMDD(date, ""), "type", type,"id",id],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getHomeworks: function (startDate, endDate, onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "homeworks", "hstartdate", DateFormat.inYYYYMMDD(startDate, ""), "henddate", DateFormat.inYYYYMMDD(endDate, "")],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL_AND_UN);
    },
    getExams: function (startDate, endDate, onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "exams", "estartdate", DateFormat.inYYYYMMDD(startDate, ""), "eenddate", DateFormat.inYYYYMMDD(endDate, "")],
            onSuccess, successMsg, onError, cache);
    },
    getConsultationHours: function (date = new Date(Date.now()), classID = "", onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "consultationHours", "date", DateFormat.inYYYYMMDD(date, ""),
            "clid", classID],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getTableLayout: function (onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "timegridInfo"],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL);
    },
    getJupiterEvents: function (startTimeStamp = "", endTimeStamp = "", type = "", onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "getEvents", "startTime", startTimeStamp, "endTime", endTimeStamp, "eventType", type],
            onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL_AND_UN);
    },
    getTeachersClasses: function( onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = null) {
        return WebUntis.ajax("get", ["getType", "teachersClasses"], onSuccess, successMsg, onError, cache, cacheBuster || WebUntis.CB_SCHOOL_AND_UN);
    },
    getMultiple: function (funcs, onSuccess = null, successMsg = null, onError = null, cache = true, cacheBuster = WebUntis.CB_SCHOOL_AND_UN) {
        WebUntis.ajax.store = true;
        let out;
        funcs.forEach(function (elem, index) {
            if (index == funcs.length - 1) {
                WebUntis.ajax.release = true;
                WebUntis.ajax.success = {
                    func: onSuccess,
                    msg: successMsg
                }
                WebUntis.ajax.error = onError;
                WebUntis.ajax.cache = cache;
                WebUntis.ajax.cb = cacheBuster;
                out = elem();
                WebUntis.ajax.store = false;
            } else
                elem();
        });
        return out;
    },
    joinDates: function (dates, sep = "-", toMonday = false) {
        if (Array.isArray(dates)) {
            var out = "";
            dates.forEach(function (elem) {
                var date = null;
                if (typeof (elem) === "string") {
                    date = DateFormat.fromYYYYMMDD(dates);
                } else if (elem instanceof Date) {
                    date = elem;
                }
                if (toMonday)
                    date = DateFormat.toMonday(date);
                out += DateFormat.inYYYYMMDD(date, sep) + ",";
            })
            return out.slice(0, -1);
        } else if (typeof (dates) === "string") {
            return DateFormat.inYYYYMMDD(DateFormat.fromYYYYMMDD(dates), sep);
        } else if (dates instanceof Date) {
            return DateFormat.inYYYYMMDD(dates, sep);
        }
    },
    repeatType(type, count) {
        var realCount = 0;

        if (typeof (count) == "number") {
            realCount = count;
        } if (Array.isArray(count)) {
            realCount = count.length;
        } else {
            realCount = 1;
        }

        var out = "";
        for (var i = 0; i < realCount; i++) {
            out += type + ",";
        }
        return out.slice(0, -1);
    }
}

class LessonType {
    constructor(isExam, isEvent, isStandard, isCancelled, isShift, isSubstitution, isAdditional, isFree, isRoomSubstitution, isOfficeHour, name) {
        this.isExam = isExam == null ? false : isExam;
        this.isEvent = isEvent == null ? false : isEvent;
        this.isStandard = isStandard == null ? false : isStandard;
        this.isCancelled = isCancelled == null ? false : isCancelled;
        this.isShift = isShift == null ? false : isShift;
        this.isSubstitution = isSubstitution == null ? false : isSubstitution;
        this.isAdditional = isAdditional == null ? false : isAdditional;
        this.isFree = isFree == null ? false : isFree;
        this.isRoomSubstitution = isRoomSubstitution == null ? false : isRoomSubstitution;
        this.isOfficeHour = isOfficeHour == null ? false : isOfficeHour;
        this.name = name;
    }

    equals(other) {
        if (other == null) return false;
        if (!(other instanceof LessonType)) return false;
        var result = true;
        for (var key in this) {
            result = result && this[key] == other[key];
        }
        return result;
    }
}

class Lesson {
    constructor(date, startTime, endTime, teachers, groups, subjects, rooms, type, text) {
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.teachers = teachers;
        this.subjects = subjects;
        this.groups = groups;
        this.rooms = rooms;
        //this.startIndex = null;
        //this.endIndex = null;
        this.type = type;
        this.text = text;
    }

    equals(other) {
        if (other == null) return false;
        if (this.date !== other.date) return false;
        if (!this.type.equals(other.type)) return false;
        if (this.teachers != null && other.teachers != null && this.teachers.length == other.teachers.length) {
            for (var i = 0; i < this.teachers.length; i++) {
                if (!(this.teachers[i] ? this.teachers[i].equals(other.teachers[i]) : (this.teachers[i] === other.teachers[i]))) return false;
            }
        } else return false;
        if (this.subjects != null && other.subjects != null && this.subjects.length == other.subjects.length) {
            for (var i = 0; i < this.subjects.length; i++) {
                if (!(this.subjects[i] ? this.subjects[i].equals(other.subjects[i]) : (this.subjects[i] === other.subjects[i]))) return false;
            }
        } else return false;
        if (this.groups != null && other.groups != null && this.groups.length == other.groups.length) {
            for (var i = 0; i < this.groups.length; i++) {
                if (!(this.groups[i] ? this.groups[i].equals(other.groups[i]) : (this.groups[i] === other.groups[i]))) return false;
            }
        } else return false;
        if (this.rooms != null && other.rooms != null && this.rooms.length == other.rooms.length) {
            for (var i = 0; i < this.rooms.length; i++) {
                if (!(this.rooms[i] ? this.rooms[i].equals(other.rooms[i]) : (this.rooms[i] === other.rooms[i]))) return false;
            }
        } else return false;
        return true;
    }
}

class TableDataMeta {
    constructor(object, missing, state) {
        for (var key in object) {
            this[key] = object[key];
        }
        this.missing = missing;
        this.state = state;
    }

    equals(other) {
        if (other == null) return false;
        if (!(other instanceof TableDataMeta)) return false;
        var result = true;
        for (var key in this) {
            result = result && this[key] == other[key];
        }
        return result;
    }
}

class Subject {
    constructor(shortName, longName, altName, foreColor, backColor, id, orgId, org) {
        this.shortName = shortName;
        this.longName = longName;
        this.altName = altName;
        this.foreColor = foreColor;
        this.backColor = backColor;
        this.id = id;
        this.orgId = orgId;
        this.org = org;
    }
}

class Unit {
    constructor(startTime, endTime) {
        this.startTime = startTime;
        this.endTime = endTime;
    }
}

class Room {
    constructor(shortName, longName, id, orgId, org) {
        this.shortName = shortName;
        this.longName = longName;
        this.id = id;
        this.orgId = orgId;
        this.org = org;
    }
}

class Group {
    constructor(shortName, longName, did, classTeacher, id, orgId, org) {
        this.shortName = shortName;
        this.longName = longName;
        this.did = did;
        this.classTeacher = classTeacher;
        this.id = id;
        this.orgId = orgId;
        this.org = org;
    }
}

class Teacher {
    constructor(shortName, longName, forename, surname, id, orgId, org) {
        this.shortName = shortName;
        this.longName = longName;
        this.forename = forename;
        this.surname = surname;
        this.id = id;
        this.orgId = orgId;
        this.org = org;
    }
}

class Toast {
    constructor(text, timeInSec) {
        this.text = text;
        this.time = timeInSec == null ? 0.5 : timeInSec;
    }
    show(callback = null) {
        if (this.text == null || (window.lastToastText && window.lastToastText == this.text) || this.text == "") return;
        window.lastToastText = this.text;
        if (window.lastToastTextTimeout) clearTimeout(window.lastToastTextTimeout);
        window.lastToastTextTimeout = setTimeout(function () {
            window.lastToastText = null;
        }, 2500);

        if (toastQueue.length != 0 && toastQueue[0] != this) {
            toastQueue.push(this);
            return;
        }

        var toast = $("<div class='toast'>");
        $("body").append(toast);
        toast.html(this.text);
        toast.css("left", "0");
        toast.css("bottom", -toast.outerHeight() + "px");
        var time = this.time;
        toast.animate({
            bottom: 0,
            opacity: 1
        }, 300, function () {
            setTimeout(function () {
                toast.animate({
                    bottom: -toast.outerHeight() + "px"
                }, 300, function () {
                    toastQueue.shift();
                    if (toastQueue.length != 0) {
                        toastQueue[0].show();
                    }
                    toast.remove();
                    if(callback) callback();
                });
            }, (time * 1000));
        });

        if (toastQueue[0] != this)
            toastQueue.push(this);
    }
}

class WaitGroup {
    constructor(size = null) {
        this.size = size || 0;
    }

    start(count = 1) {
        this.size+=count;
    }

    stop() {
        this.size--;
        if(this.size == 0 && this.then != null) this.then();
        if(this.size < 0) console.warn("Invalid use of waitgroup. More stoppped than started")
    }

    then(func) {
        this.then = func;
    }
}

class MutEx {
    constructor() {
        this._locking = Promise.resolve();
        this._locks = 0;
    }
    isLocked() {
        return this._locks > 0;
    }
    lock() {
        this._locks += 1;
        let unlockNext;
        let willLock = new Promise(resolve => unlockNext = () => {
            this._locks -= 1;
            resolve();
        });
        let willUnlock = this._locking.then(() => unlockNext);
        this._locking = this._locking.then(() => willLock);
        return willUnlock;
    }
}

loadServiceWorker();

$(document).ready(function () {
    console.log("Misc ready");

    if (isMobileDevice()) { //Init
        hijackConsole(true);
        console.log("This is a mobile device");
    } else
        console.log("This is not a mobile device");

    if (isTouchDevice()) //Init
        console.log("This is a touch device");
    else
        console.log("This is not a touch device");

    if(_onSWActivate.isActive === true && onSWActivate) {
        onSWActivate();
    }

    //Init für console hijacking
    window.console.history = "";
    window.console.textHistory = "";
    window.console.hijacked = false;
    if (localStorage.getItem("hijackConsole") == "true")
        hijackConsole(true);
    loadNext();
});

function isFullScreen() {
    return document.fullscreen===true || document.webkitIsFullScreen===true || document.mozFullScreen===true;
}

function requestFullscreen(elem) {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
}

function closeFullscreen(elem) {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();
    }
  }

function getError(code) {
    var error = safeJSONParse(code);
    if(!error || !error.code) {
        error = {
            code: "Undefined",
            console: "Unbekannter Fehler",
            user: "Interner Fehler",
        }
    }

    error.console = "["+error.code+"] "+ (error.console || "Undefined");
    error.user = error.user || "";
    error.errorData = error.errorData || [];

    for (let i = 0; i < error.errorData.length; i++) {
        var data = error.errorData[i];
        var replaceIndex = "$" + i;
        error.console = error.console.replace(replaceIndex, data);
        error.user = error.user.replace(replaceIndex, data);
    }

    return error;
}

function toLetterCase(str) {
    if (str == null) return;
    const replacer = function (match, firstLetter, followingLetters) {
        return firstLetter.toUpperCase() + followingLetters.toLowerCase();
    }
    const regex = /([A-z\u00C0-\u00ff])([A-z\u00C0-\u00ff]+)/g
    return str.replace(regex, replacer);
}

function isMobileDevice() {
    if (isMobile == null) {
        var check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        isMobile = check;
    }
    return isMobile;
}

function isTouchDevice() {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    var mq = function (query) {
        isTouch = window.matchMedia(query).matches;
        return isTouch;
    }

    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
        isTouch = true;
        return isTouch;
    }

    // include the 'heartz' as a way to have a non matching MQ to help terminate the join
    // https://git.io/vznFH
    var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    isTouch = mq(query);
    return isTouch;
}

function showLog() {
    var logPopup = $("<div id='logPopup'>");
    logPopup.css({
        position: "fixed",
        left: "0",
        top: "0",
        zIndex: "999",
        padding: "5px",
        width: "100vw",
        bottom: "0",
        backgroundColor: "#fff",
        pointerEvents: "all"
    });
    $("body").append(logPopup);
    var logText = $("<div>");
    logText.css({
        "position": "absolute",
        "white-space": "pre-line",
        "font-size": "10pt",
        "overflow": "scroll",
        "top": "30px",
        "left": "0",
        "right": "0",
        "bottom": "1.5em",
        "pointer-events": "auto"
    });
    logText.html("<pre>" + console.history + "</pre>");
    hijackConsole.listener = function (data) {
        logText.append("<pre>" + data + "</pre>");
    };

    var closeBtn = document.createElement("button");
    closeBtn.onclick = function () {
        logPopup.remove();
        hijackConsole.listener = null;
    };
    closeBtn.innerHTML = "CLOSE";
    closeBtn.style.padding = "5px";
    closeBtn.style.marginRight = "5px";
    var hijackBtn = document.createElement("button");
    hijackBtn.onclick = function () {
        if (console.hijacked) {
            hijackConsole(false);
        } else {
            hijackConsole(true);
        }
    }
    hijackBtn.innerHTML = "TOOGLE HIJACKING";
    hijackBtn.style.padding = "5px";
    var commandLine = $("<input>");
    commandLine.prop("type", "text");
    commandLine.css({
        "width": "100%",
        "position": "absolute",
        "bottom": "0",
        "font-size": "10pt",
        "right": "0",
        "left": "0",
        "background-color": "#444",
        "padding": "2px",
        "color": "white"
    });
    commandLine.keyup(function (event) {
        if (event.keyCode === 13) {
            logText.append("&gt;&gt;&gt;" + commandLine.val() + "\r\n");
            var retVal = eval(commandLine.val());
            logText.append("&lt;&lt;&lt;" + (retVal == null ? "undefined" : retVal) + "\r\n");
            logText.scrollTop(logText[0].scrollHeight);
        }
    });;
    commandLine.attr("autocomplete", "off");
    commandLine.attr("autocorrect", "off");
    commandLine.attr("autocapitalize", "off");
    commandLine.attr("spellcheck", "off");
    logPopup.append(closeBtn);
    logPopup.append(hijackBtn);
    logPopup.append(logText);
    logPopup.append(commandLine);
}

function openLogDownloadDialog() {
    download(consoleLog, "browserDebug.log", "text/plain");
}

// Function to download data to a file
function download(data, filename, type) {
    var file = new Blob([data], {
        type: type
    });
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
            url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function upload(type, onSelect) {
    var input = $("#globalFileInput");
    input.prop("accept", type);
    input.change(function (event) {
        onSelect(event, input.prop("files"));
    });
    input.trigger("click");
}

function hijackConsole(enable) {
    if (enable) {
        if (hijackConsole.set == true) return;
        hijackConsole.set = true;
        var orgLog = window.console.log;
        var orgWarn = window.console.warn;
        var orgError = window.console.error;
        var orgInfo = window.console.info;
        window.console.orgLog = orgLog;
        window.console.orgWarn = orgWarn;
        window.console.orgError = orgError;
        window.console.orgInfo = orgInfo;
        window.console.log = function (str) {
            if (typeof str !== "string")
                str = JSON.stringify(str, null, 2);
            orgLog(str);
            str = escapeHtml(str);
            window.console.textHistory += str + "\r\n"
            window.console.history += "<span style='color: #00f'>LOG: </span>" + str + "\r\n";
            if (hijackConsole.listener != null)
                hijackConsole.listener("<span style='color: #00f'>LOG: </span>" + str + "\r\n");
        }
        window.console.warn = function (str) {
            if (typeof str !== "string")
                str = JSON.stringify(str, null, 2);
            orgWarn(str);
            str = escapeHtml(str);
            window.console.textHistory += str + "\r\n"
            window.console.history += "<span style='color: #fc0'>WARN: </span>" + str + "\r\n";
            if (hijackConsole.listener != null)
                hijackConsole.listener("<span style='color: #fc0'>WARN: </span>" + str + "\r\n");
        }
        window.console.error = function (str) {
            if (typeof str !== "string")
                str = JSON.stringify(str, null, 2);
            orgError(str);
            str = escapeHtml(str);
            window.console.textHistory += str + "\r\n"
            window.console.history += "<span style='color: #f00'>ERROR: " + str + "</span>\r\n";
            if (hijackConsole.listener != null)
                hijackConsole.listener("<span style='color: #f00'>ERROR: " + str + "</span>\r\n");
        }
        window.console.info = function (str) {
            if (typeof str !== "string")
                str = JSON.stringify(str, null, 2);
            orgInfo(str);
            str = escapeHtml(str);
            window.console.textHistory += str + "\r\n"
            window.console.history += "INFO: " + str + "\r\n";
            if (hijackConsole.listener != null)
                hijackConsole.listener("INFO: " + str + "\r\n");
        }
        window.console.hijacked = true;
        localStorage.setItem("hijackConsole", true);
        window.console.log("Hijacked console");
    } else {
        if (hijackConsole.set == false) return;
        hijackConsole.set = false;
        window.console.log("Releasing console...");
        if (window.console.orgLog != null)
            window.console.log = window.console.orgLog;
        if (window.console.orgWarn != null)
            window.console.warn = window.console.orgWarn;
        if (window.console.orgError != null)
            window.console.error = window.console.orgError;
        if (window.console.orgInfo != null)
            window.console.info = window.console.orgInfo;
        window.console.hijacked = false;
        window.console.log("Released console");
        localStorage.setItem("hijackConsole", false);
    }
}

function onLoad(func) {
    loadQueue.push(func);
}

function loadNext() {
    if (loadQueue.length > 0) {
        loadQueue.shift()();
        if (loadQueue.length == 0 && loadNext.finished !== true) {
            loadNext.finished = true;
            $("#initLoader").remove();
            size();
        }
    }
}

function startLoadingAnimation() {
    if (startLoadingAnimation.c == null)
        startLoadingAnimation.c = 1;
    else
        startLoadingAnimation.c++;

    if (startLoadingAnimation.c == 1)
        $("#contentWrapper").append("<div class='center' id='loader'><div class='loader' style='left:-50%'></div></div>");
}

function stopLoadingAnimation() {
    if (startLoadingAnimation.c == null) return;
    startLoadingAnimation.c = Math.max(0, startLoadingAnimation.c - 1);
    if (startLoadingAnimation.c == 0)
        $("#loader").remove();
}

async function cacheToClient(name, jsonData, lifetimeInDays) {
    if (jsonData == null) {
        localStorage.removeItem(name);
        return;
    }
    if (name != null) {
        var expirationDate = new Date(Date.now() + lifetimeInDays * 24 * 60 * 60 * 1000);
        var expirationTime = expirationDate.getTime();
        if (lifetimeInDays == null)
            expirationTime == null; //Forever
        jsonData = {
            expires: expirationDate.getTime(),
            version: CACHE_VERSION,
            data: jsonData
        };
        var string = JSON.stringify(jsonData);
        let promise = Promise.resolve(LZString.compressToUTF16(string));
        string = await promise;
        localStorage.setItem(name, string);
        console.log("Saved cached as " + name);
        console.log("Cache expires on: " + expirationDate);
    } else {
        console.warn("Invalid params!");
    }
}

async function cacheFromClient(name, onLoad, onError = null) {
    if (typeof (Storage) !== "undefined") {
        var rawData = localStorage.getItem(name);
        if (rawData == null) {
            if (onError != null)
                onError(name);
            return;
        }
        if (!rawData.startsWith("{")) {//Isn't json
            let promise = Promise.resolve(LZString.decompressFromUTF16(rawData));
            rawData = await promise;
        }
        var json = safeJSONParse(rawData);
        if (json.expires != null && (json == null || new Date(json.expires).getTime() <= new Date(Date.now()).getTime() || json.version != CACHE_VERSION)) {
            localStorage.removeItem(name);
            if (onError != null)
                onError(name);
            return;
        }

        if (onLoad != null)
            onLoad(json.data, name);
        return;
    }
    if (onError != null)
        onError(name);
}

function escapeHtml(unsafe) {
    if (unsafe === null) return "null"
    if (unsafe === undefined) return "undefined"
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function loadServiceWorker() {

    if ('serviceWorker' in navigator) {
        console.info("[Client] Started SW Message listener");
        navigator.serviceWorker.addEventListener('message', onSWMsgReceive);
        navigator.serviceWorker.register('/OneSignalSDKWorker.js').then(function (reg) {
            // Registration was successful
            if (reg.installing) {
                serviceWorker = reg.installing;
                console.info('[Client] Service Worker installing');
                new Toast("Diese Seite funktioniert auch offline", 3).show();
            } else if (reg.waiting) {
                serviceWorker = reg.waiting;
                console.info('[Client] Service Worker installed');
            } else if (reg.active) {
                serviceWorker = reg.active;
                _onSWActivate();
            }
            if (!reg.active && serviceWorker) {
                serviceWorker.addEventListener('statechange', function (e) {
                    console.log("SW changed state to: " + e.target.state);
                    if (e.target.state == "activated")
                        _onSWActivate();
                });
            }
        }, function (err) {
            // registration failed :(
            console.warn('[Client] Service Worker registration failed: ', err);
        });
    }
}

function onSWMsgReceive(event) {
    console.log("[Client] Copy: " + JSON.stringify(event.data));
    if (event.ports[0] != null)
        event.ports[0].postMessage("Copy?");

    if (event.data.type == "refresh") {
        var data = event.data.data;

    }
}

function _onSWActivate() {
    console.info('[Client] Service Worker active');
    messageSW("Heyyy Neighbour").then(m => console.info("[Client] Copy: " + m));
    _onSWActivate.isActive = true;
    if(document.readyState === "interactive" && onSWActivate)
        onSWActivate();
}

function messageSW(msg) {
    if (serviceWorker == null) {
        console.warn("Can't message SW before it's active");
        return;
    }
    console.info("[Client] Messaging SW: " + JSON.stringify(msg));
    return new Promise(function (resolve, reject) {
        // Create a Message Channel
        var msg_chan = new MessageChannel();

        // Handler for recieving message reply from service worker
        msg_chan.port1.onmessage = function (event) {
            if (event.data.error) {
                reject(event.data.error);
            } else {
                console.log("[Client] Got Response: " + JSON.stringify(event.data));
                resolve(event.data);
            }
        };
        // Send message to service worker along with port for reply
        serviceWorker.postMessage(msg, [msg_chan.port2]);
    });
}

function safeJSONParse(string) {
    try {
        return JSON.parse(string);
    } catch (e) {
        console.warn(new Error("Invalid JSON"));
        return null;
    }
}

function hashGet(key) {
    if (!hashGet.hash) {
        var parts = /*window.location.hash*/hash.slice(1).split("&");
        hashGet.hash = {};
        parts.forEach(function (elem) {
            if (elem == "") return;
            var kvp = elem.split("=");
            hashGet.hash[kvp[0]] = kvp[1];
        });
    }
    if (!key) return;
    return hashGet.hash[key];
}

function hashSet(key, value) {
    if (!hashGet.hash)
        hashGet(null); //init

    hashGet.hash[key] = value;
    var kvpIndex = hash.indexOf(key + "=");
    if (kvpIndex != -1) {
        var startIndex;
        if (value == null)
            startIndex = kvpIndex + (kvpIndex == 1 ? 0 : -1);
        else
            startIndex = kvpIndex + (key + "=").length;;
        var endIndex = hash.indexOf("&", startIndex + (value == null ? 1 : 0));
        if (endIndex == -1)
            endIndex = hash.length;
        else if (kvpIndex == 1 && value == null) endIndex++;
        hash = hash.substring(0, startIndex)
            + (value == null ? "" : value)
            + hash.substring(endIndex);
        history.replaceState(null, null, hash);
    } else {
        if (value != null) {
            hash += (hash.length > 2 ? "&" : "") + key + "=" + value
            history.replaceState(null, null, hash)
        }
    }
    return value;
}

function notifyClient(title, text) {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have alredy been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var notification = new Notification(title, {
            body: text,
            icon: '/DATA/logo192.png',
            vibrate: [500]
        });
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                notifyClient(title, text);
            } else {
                console.log("Notification permission not granted");
            }
        });
    }

}

function NAFallback(checks, fallback, ok = null) {
    if (Array.isArray(checks)) {
        for (var i = 0; i < checks.length; i++) {
            var check = checks[i];
            if (check == null || check == "null" || check == "undefined" || check == "") {
                return fallback;
            }
        }
        if (ok == null) { let r = checks[checks.length - 1]; return r; }
    } else {
        if (checks == null || checks == "null" || checks == "undefined" || checks == "") {
            return fallback;
        }
        if (ok == null) { let r = checks; return r; }
    }
    return ok()
}

window.addEventListener('popstate', function (event) {
    if (onPopState) {
        if (onPopState(event) === false) {
            history.back();
        }
    }
    onPopState = null;
});