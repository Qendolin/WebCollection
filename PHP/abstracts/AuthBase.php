<?php

/**
 *  
 */
/**
 * 
 */
abstract class AuthBase implements IAuth{
    /**
     * User-Login 
     * 
     * Logs in the user
     * 
     * @deprecated userlogin function
     * @param string $id id/username of the user
     * @param string $password password of the user
     * @param bool $save true if the user wants to get reloggedin automaticly
     * @return bool true if login was succesful
     */
    abstract protected  function Login($id, $password, $save);
    abstract protected  function Relogin() ;

    public  function TryLogin($id, $password, $save, $dontEcho = false){

    }
    public  function SaveLogin($school, $id = null, $password = null) {
        
    }
    public  function Logout() {
        
    }
    public  function TryRelogin(){
        
    }

}
