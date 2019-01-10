<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
set_error_handler("ErrorHandler", E_ALL);
register_shutdown_function("FatalErrorHandler");
const API_ERROR=256;
const API_WARNING=512;
function FatalErrorHandler() {
    BasicTools::Log("Time:", "time");
    $errfile = "unknown file";
    $errstr = "shutdown";
    $errno = E_CORE_ERROR;
    $errline = 0;

    $error = error_get_last();

    if (E_ERROR === $error["type"]) {
        $errno = $error["type"];
        $errfile = $error["file"];
        $errline = $error["line"];
        $errstr = $error["message"];

        ErrorHandler($errno, $errstr, $errfile, $errline);
    } else {
        if (null !== $error) {
            $errno = $error["type"];
            $errfile = $error["file"];
            $errline = $error["line"];
            $errstr = $error["message"];
            BasicTools::Log("[ErrorOnEndFound]\nType:" . GetErrorType($error["type"]) . "\nFile:" . $error["file"] . "\nLine:" . $error["line"] . "\nMsg:" . $error["message"], "end");
        }
    }
}

function ErrorHandler($grad, $msg, $file, $line) {
    if (isset($GLOBALS["link"])) {
        BasicTools::Log("[ErrorUnhandled]\nType:" . GetErrorType($grad) . "\nFile:" . $file . "\nLine:" . $line . "\nMsg:" . $msg, "pageLoad");
        return;
    }
    if (preg_match("/^\d\d\d/")!==false && E_USER_ERROR == $grad) {
        BasicTools::Log("[Errorhandled]\nType:" . GetErrorType($grad) . "\nFile:" . $file . "\nLine:" . $line . "\nMsg:" . $msg);

        http_response_code(700);
        die(GetErrorMsg($msg));
    }

    if (preg_match("/^\d\d\d/")!==false && E_USER_WARNING == $grad) {
        BasicTools::Log("[Errorhandled]\nType:" . GetErrorType($grad) . "\nFile:" . $file . "\nLine:" . $line . "\nMsg:" . $msg);

        http_response_code(710);
        echo (GetErrorMsg($msg));
        die();
    }

    $errortype = GetErrorType($grad);
    if (E_USER_ERROR == $grad || E_ERROR == $grad || E_PARSE == $grad || E_COMPILE_ERROR == $grad || E_CORE_ERROR == $grad || E_RECOVERABLE_ERROR == $grad) {
        ErrorHandler(E_USER_ERROR, "000|An apiforeign error with level $errortype was encountered.<br> Message: $msg", $file, $line);
    }
    ErrorHandler(E_USER_WARNING, "000|An apiforeign warning with level $errortype was encountered.<br> Message: $msg", $file, $line);
}

function GetErrorType($type) {
    switch ($type) {
    case E_ERROR: // 1 //
        return 'E_ERROR';
    case E_WARNING: // 2 //
        return 'E_WARNING';
    case E_PARSE: // 4 //
        return 'E_PARSE';
    case E_NOTICE: // 8 //
        return 'E_NOTICE';
    case E_CORE_ERROR: // 16 //
        return 'E_CORE_ERROR';
    case E_CORE_WARNING: // 32 //
        return 'E_CORE_WARNING';
    case E_COMPILE_ERROR: // 64 //
        return 'E_COMPILE_ERROR';
    case E_COMPILE_WARNING: // 128 //
        return 'E_COMPILE_WARNING';
    case E_USER_ERROR: // 256 //
        return 'E_USER_ERROR';
    case E_USER_WARNING: // 512 //
        return 'E_USER_WARNING';
    case E_USER_NOTICE: // 1024 //
        return 'E_USER_NOTICE';
    case E_STRICT: // 2048 //
        return 'E_STRICT';
    case E_RECOVERABLE_ERROR: // 4096 //
        return 'E_RECOVERABLE_ERROR';
    case E_DEPRECATED: // 8192 //
        return 'E_DEPRECATED';
    case E_USER_DEPRECATED: // 16384 //
        return 'E_USER_DEPRECATED';
    }
    return "UNKNOWN($type)";
}
function GetErrorMsg($msg) {
    $data = "";
    if (strpos($msg, "|") !== false) {
        $msgps = explode("|", $msg);
        $msg = $msgps[0];
        $data = $msgps[1];
    }
    $errorList = json_decode(file_get_contents($_SERVER['DOCUMENT_ROOT'] . "/DATA/errorList.json"), true);
    $errorList[$msg]["errorData"] = $data;
    return json_encode($errorList[$msg], true);
}
function Error($type, $id, $data) {

   
    while(strlen($id."")<3){
        $id="0".$id;
    }
    $bt=debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS,1);
    ErrorHandler($type,$id."|".$data,$bt["file"],$bt["line"]);
}