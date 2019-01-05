<?php
interface IDatabaseQuery {
    /**
     * has many parameters
     * first: the number of database
     * second: the statement
     * opt third: an array with all parameters of the query
     * or the first parameter of the query
     * opt fourth: the second parameter of the query
     * opt fifth: the third parameter of the query
     * and so on and so on
     */
    public function AskDB();//AskDB($db,$statement,$params|$param1,$param2,...)
}