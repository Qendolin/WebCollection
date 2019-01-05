<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
interface IAuth {
    public function TryLogin($id, $password, $save, $dontEcho = false,$additionalParameters=null);
    public function SaveLogin( $id = null, $password = null,$additionalParameters=null);
    public function Logout();
    public function TryRelogin();
}
