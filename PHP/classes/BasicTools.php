<?php
//api adapted
/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
class BasicTools {
    const DEBUG_MODE = true;
    static $multiStates = array();
    static $settings;
    public static function PostMultiTest($name) {
        $values = explode(",", self::PostTest($name));
        if (!self::IsSenseful(self::$multiStates[$name])) {
            self::$multiStates[$name] = 0;
        } else {
            self::$multiStates[$name]++;
        }
        if (!count($values) > self::$multiStates[$name]) {
            trigger_error("#error008|$name", E_USER_ERROR);
        }

        return $values[self::$multiStates[$name]];
    }

    public static function Utf8Strrev($str) {
        preg_match_all('/./us', $str, $ar);
        return implode(array_reverse($ar[0]));
    }

    public static function PostTest($name) {
        if (!self::IsSenseful($_POST[$name])) {
            trigger_error("#error010|$name", E_USER_ERROR);
        }
        return $_POST[$name];
    }

    public static function IsSenseful(&$var) {
        if (isset($var)) {
            if (false == $var) {
                if (0 === $var || "0" === $var || 0.0 === $var || false === $var || is_array($var)) {
                    return true;
                }
                return false;
            }
            return true;
        }
        return false;
    }

    public static function PostTestOpt($name, $sonst = "-1") {
        if (!self::IsSenseful($_POST[$name])) {
            return $sonst;
        }
        return $_POST[$name];
    }

    public static function Log($text, $debug = false) {
        if ($debug) {
            if (self::DEBUG_MODE) {
                if (!file_exists($_SERVER['DOCUMENT_ROOT'] . "/LOG/_" . $debug . "log.txt")) {
                    file_put_contents($_SERVER['DOCUMENT_ROOT'] . "/LOG/_" . $debug . "log.txt", "");
                }

                if (filesize($_SERVER['DOCUMENT_ROOT'] . "/LOG/_" . $debug . "log.txt") > 777000) {
                    file_put_contents($_SERVER['DOCUMENT_ROOT'] . "/LOG/_" . $debug . "log.txt", "");
                }
                file_put_contents($_SERVER['DOCUMENT_ROOT'] . "/LOG/_" . $debug . "log.txt", "[" . date("d.m.Y H:i:s", time()) . "]" . str_replace("\n", "\n                       ", $text) . "\n", FILE_APPEND);
            }
            return;
        }
        if (!file_exists($_SERVER['DOCUMENT_ROOT'] . "/LOG/_log.txt")) {
            file_put_contents($_SERVER['DOCUMENT_ROOT'] . "/LOG/_log.txt", "");
        }

        if (filesize($_SERVER['DOCUMENT_ROOT'] . "/LOG/_log.txt") > 777000) {
            rename($_SERVER['DOCUMENT_ROOT'] . "/LOG/_log.txt", $_SERVER['DOCUMENT_ROOT'] . "/LOG/log[" . date("Y.m.d H:i:s", time()) . "].txt");
        }
        file_put_contents($_SERVER['DOCUMENT_ROOT'] . "/LOG/_log.txt", "[" . date("d.m.Y H:i:s", time()) . "]" . str_replace("\n", "\n                       ", $text) . "\n", FILE_APPEND);
    }
    
   
    public static function TestSessVar($name, $throwError = true) {
        if (self::IsSenseful($_SESSION[$name])) {
            return $_SESSION[$name];
        }
        if ($throwError) {
            $b = debug_backtrace()[0];
            BasicTools::Log("in file: $b[file] in line: $b[line] with param: " . $b["args"][0], "sessionVar");
            trigger_error("#error006|$name", E_USER_ERROR);
        } else {
            return false;
        }

    }

    public static function WriteArray($array, $d = 0) {
        if (100 === $d) {
            die("<h1>To Much Inner Arrays</h1>");
        }
        $t = "";
        for ($i = 0; $d > $i; $i++) {
            $t .= "&nbsp;&nbsp;&nbsp;&nbsp;";
        }
        foreach ($array as $key => $text) {
            if (is_array($text)) {
                echo $t . "&nbsp;+&nbsp;" . $key . "<br>";
                self::WriteArray($text, $d + 1);
            } else {
                echo $t . "&nbsp;-&nbsp;";
                self::WriteText($key . " : " . $text);

                echo "<br>";
            }
        }
    }

    public static function WriteText($text, $return = false) {
        if ($return) {
            return htmlspecialchars($text);
        }
        echo htmlspecialchars($text);
    }
}