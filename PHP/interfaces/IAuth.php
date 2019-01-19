<?php

/**
 *  Copyright ©2018
 *  Written by:
 *  Maximilian Mayrhofer
 *  Wendelin Muth
 */
interface IAuth {
    public function TryLogin(string $ids,string $password,bool $save,bool $dontEcho = false,array $additionalParameters=null): bool;
    public function SaveLogin(string $id = null, string$password = null,array $additionalParameters=null): bool;
    public function Logout(): void;
    public function TryRelogin(): bool;
}
